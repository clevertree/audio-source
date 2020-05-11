import * as React from "react";
import PropTypes from "prop-types";
import ASCTrackInstructionParameter from "../instruction/param/ASCTrackInstructionParameter";
import TrackInstruction from "../../../song/instruction/TrackInstruction";
import {clear} from "react-native/Libraries/LogBox/Data/LogBoxData";

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
        const open = this.props.cursor || this.props.selected;

        const parameters = [];

        parameters.push(<ASCTrackInstructionParameter
            key="command"
            title={`Command: ${instruction.command}`}
            trackerInstruction={this}
            type="command"
            options={() => this.renderMenuSelectCommand()}
            ref={this.commandParam}
        >{instruction.command}</ASCTrackInstructionParameter>);

        // console.log('instruction', this.props, className);
        if(open) {
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
        }
        return parameters;
    }

    /** Actions **/

    playInstruction(destination=null) {
        this.getTracker().getTrackInfo().updateCurrentInstruction(); // Hack
        return this.getTracker().playInstructions(this.getInstructionIndex(), destination);
    }

    async selectInstruction(clearSelection=true, toggleValue = null) {
        // const trackName = this.getTracker().getTrackName();
        const selectedIndices = clearSelection ? [] : this.getTracker().getTrackState().selectedIndices;
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
        await this.getTracker().setCursorOffset(this.props.cursorPosition, selectedIndices);
        return selectedIndices;
    }

    async selectInstructionWithAction(clearSelection=true, toggleValue = null) {
        console.log('selectInstructionWithAction', clearSelection, toggleValue);
        const selectedIndices = await this.selectInstruction(clearSelection, toggleValue);
        const instruction = this.getInstruction();
        if(instruction instanceof TrackInstruction) {
            this.getComposer().trackerToggleTrack(
                instruction.getTrackName(),
                null,
                {
                    destinationList: this.getTracker().getTrackState().destinationList.concat(this.getTracker().getTrackName())
                }
            );
        } else {
            this.getTracker().playInstructions(selectedIndices);
        }

    }


    /** User Input **/

    onMouseInput(e) {
        if(e.defaultPrevented)
            return;
        e.preventDefault();

        switch(e.type) {
            case 'mousedown':
            case 'click':
                if(e.button === 0)
                    this.selectInstructionWithAction(!e.ctrlKey);
                // TODO: e.shiftKey for selecting a range of notes
                else if(e.button === 1)
                    throw new Error("Unimplemented middle button");
                else if(e.button === 2)
                    this.toggleDropDownMenu();
                    // throw new Error("Unimplemented right button");
                else
                    throw new Error("Unknown mouse button");

                break;
            default:
                throw new Error("Unknown Mouse event: " + e.type);
        }
    }

    /** Menus **/

    toggleDropDownMenu() {
        this.commandParam.current.toggleMenu();
    }

    // }
    renderMenuSelectCommand(e) {
        return this.getComposer().renderMenuSelectCommand((command) => {
            this.instructionReplaceCommand(command);
        });
    }


    renderMenuSelectVelocity(currentVelocity=null) {
        return this.getComposer().renderMenuSelectVelocity(velocity => {
            this.instructionReplaceVelocity(velocity);
        }, currentVelocity);
    }

    renderMenuSelectDuration(currentDuration=null) {
        return this.getComposer().renderMenuSelectDuration(duration => {
            this.instructionReplaceDuration(duration);
        }, currentDuration);
    }


    instructionReplaceCommand(command) {
        this.getComposer().instructionReplaceCommandSelected(
            command,
            this.getComposer().state.selectedTrack,
            this.props.index,
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
        this.getSong().instructionReplaceVelocity(
            this.getComposer().state.selectedTrack,
            this.props.index,
            velocity);
        this.playInstruction();
    }

    instructionReplaceDuration(duration) {
        this.getSong().instructionReplaceDuration(
            this.getComposer().state.selectedTrack,
            this.props.index,
            duration);
        this.playInstruction();
    }
}
