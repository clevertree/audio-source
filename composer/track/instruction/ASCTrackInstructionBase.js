import * as React from "react";
import PropTypes from "prop-types";
import ASCTrackInstructionParameter from "../instruction/param/ASCTrackInstructionParameter";
import TrackInstruction from "../../../song/instruction/TrackInstruction";
import {ASUIMenuBreak, ASUIMenuDropDown, ASUIMenuItem} from "../../../components/menu";
import {NoteInstruction} from "../../../song";

export default class ASCTrackInstructionBase extends React.Component {
    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        index: PropTypes.number.isRequired,
        instruction: PropTypes.any.isRequired,
        tracker: PropTypes.any.isRequired,
        cursorPosition: PropTypes.number.isRequired,
        selected: PropTypes.bool.isRequired,
        cursor: PropTypes.bool.isRequired
    };

    // play() {
    //     const composer = this.props.composer;
    //     composer.song.playInstructionAtIndex(destination, this.state.track.currentGroup, this.index, composer.song.getAudioContext().currentTime);
    //     return this;
    getTracker() { return this.props.tracker; }
    getTrackName() { return this.getTracker().getTrackName(); }
    getComposer() { return this.getTracker().props.composer; }
    getSong() { return this.getComposer().getSong(); }
    /** @returns Instruction **/
    getInstruction() { return this.props.instruction; }
    getInstructionIndex() { return this.props.index; }

    render() {
        // throw new Error("Unimplemented");
        return null;
    }

    renderParameters() {
        const instruction = this.props.instruction;
        const parameters = [];

        if(instruction instanceof NoteInstruction) {
            const durationString = instruction.durationTicks === null ? 'N/A'
                : this.getComposer().values.formatSongDuration(instruction.durationTicks);

            if(typeof instruction.velocity !== "undefined")
                parameters.push(<ASCTrackInstructionParameter
                    key="velocity"
                    title={`Velocity: ${instruction.velocity}`}
                    trackerInstruction={this}
                    type="velocity"
                    options={() => this.renderMenuSelectVelocity(instruction.velocity)}
                >{instruction.velocity}</ASCTrackInstructionParameter>);
            if(typeof instruction.durationTicks !== "undefined")
                parameters.push(<ASCTrackInstructionParameter
                    key="duration"
                    title={`Duration: ${durationString}`}
                    trackerInstruction={this}
                    type="duration"
                    options={() => this.renderMenuSelectDuration(instruction.durationTicks)}
                >{durationString||'-'}</ASCTrackInstructionParameter>);

        } else {
            const args = this.props.instruction.commandArgs;
            for(let i=0; i<args.length; i++) {
                parameters.push(<ASCTrackInstructionParameter
                    key={i}
                    title={`Parameter: ${i}`}
                    trackerInstruction={this}
                    type="custom"
                    options={() => this.renderMenuSelectDuration(instruction.durationTicks)}
                >{args[i]}</ASCTrackInstructionParameter>);
            }
        }

        return parameters;
    }

    /** Actions **/

    playInstruction(destination=null) {
        // this.getTracker().getTrackInfo().updateCurrentInstruction(); // Hack
        return this.getTracker().playInstructions(this.getInstructionIndex(), destination);
    }

    selectInstruction(clearSelection=true, toggleValue = null) {
        // const trackName = this.getTracker().getTrackName();
        const selectedIndices = clearSelection ? [] : this.getTracker().getSelectedIndices();
        console.log('selectInstruction', clearSelection, selectedIndices);
        // const instruction = this.getInstruction();
        const i = selectedIndices.indexOf(this.props.index);
        if(toggleValue === true || i === -1) {
            if(i === -1)
                selectedIndices.push(this.props.index);
        } else {
            if(i !== -1)
                selectedIndices.splice(i, 1);
        }
        // this.getComposer().trackerSelectIndices(trackName, selectedIndices, this.props.cursorPosition)
        // this.getTracker().selectIndices(selectedIndices); // , this.props.cursorPosition);
        this.getTracker().selectIndices(selectedIndices);
        this.getTracker().setCursorPosition(this.props.cursorPosition);
        return selectedIndices;
    }

    selectInstructionWithAction(clearSelection=true, toggleValue = null) {
//         console.log('selectInstructionWithAction', clearSelection, toggleValue);
        const selectedIndices = this.selectInstruction(clearSelection, toggleValue);
        const instruction = this.getInstruction();
        if(instruction instanceof TrackInstruction) {
            this.getComposer().trackerToggleTrack(
                instruction.getTrackName(),
                null,
                {
                    destinationList: this.getTracker().getDestinationList().concat(this.getTracker().getTrackName())
                }
            );
        } else {
            this.getTracker().playInstructions(selectedIndices);
        }

    }


    /** Menus **/



    renderMenuEditSet() {
        return (<>
            <ASUIMenuItem>Edit Instruction</ASUIMenuItem>
            <ASUIMenuBreak/>
            <ASUIMenuDropDown
                options={() => this.renderMenuSelectCommand()}
                children="Set Command"
            />
            <ASUIMenuDropDown
                options={() => this.renderMenuSelectDuration()}
                children="Set Duration"
            />
            <ASUIMenuDropDown
                options={() => this.renderMenuSelectVelocity()}
                children="Set Velocity"
            />
        </>);
    }

    // }
    renderMenuSelectCommand() {
        return this.getComposer().values.renderMenuSelectCommand((command) => {
                this.instructionReplaceCommand(command);
            },
            this.props.instruction.command,
        );
    }


    renderMenuSelectVelocity() {
        return this.getComposer().values.renderMenuSelectVelocity(velocity => {
            this.instructionReplaceVelocity(velocity);
        }, this.props.instruction.velocity);
    }

    renderMenuSelectDuration() {
        return this.getComposer().values.renderMenuSelectDuration(duration => {
                this.instructionReplaceDuration(duration);
            },
            this.getSong().data.timeDivision,
            this.props.instruction.duration,
        );
    }

    /** Actions **/


    instructionReplaceCommand(command) {
        this.getComposer().instructionReplaceCommand(
            this.getTrackName(),
            this.props.index,
            command,
        )
    }

    // instructionReplaceProgram(programID) {
    //     this.getSong().instructionReplaceProgram(
    //         this.getComposer().state.selectedTrack,
    //         this.props.index,
    //         programID);
    //     this.forceUpdate();
    //
    // }

    instructionReplaceVelocity(velocity) {
        this.getComposer().instructionReplaceVelocity(
            this.getTrackName(),
            this.props.index,
            velocity);
        this.playInstruction();
    }

    instructionReplaceDuration(duration) {
        this.getComposer().instructionReplaceDuration(
            this.getTrackName(),
            this.props.index,
            duration);
        this.playInstruction();
    }
}
