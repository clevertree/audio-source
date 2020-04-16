import * as React from "react";
import {
    TrackerInstructionParameter
} from "./";
import Div from "../../components/div/Div";
// import TrackerDelta from "./TrackerDelta";

import "./assets/TrackerInstruction.css";
import PropTypes from "prop-types";
import {TrackInstruction} from "../../song/instruction";

class TrackerInstruction extends React.Component {
    constructor(props) {
        super(props);

        this.cb = {
            // onContextMenu: (e) => this.onContextMenu(e),
            // onKeyDown: (e) => this.onKeyDown(e),
            onMouseInput: e => this.onMouseInput(e),
        };
        this.commandParam = React.createRef();
    }
    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        index: PropTypes.number.isRequired,
        instruction: PropTypes.any.isRequired,
        tracker: PropTypes.any.isRequired,
        cursorPosition: PropTypes.number.isRequired
    };

    // play() {
    //     const composer = this.props.composer;
    //     composer.song.playInstructionAtIndex(destination, this.state.tracker.currentGroup, this.index, composer.song.getAudioContext().currentTime);
    //     return this;
    getTracker() { return this.props.tracker; }
    getComposer() { return this.getTracker().props.composer; }
    getSong() { return this.getComposer().getSong(); }
    /** @returns Instruction **/
    getInstruction() { return this.props.instruction; }
    getInstructionIndex() { return this.props.index; }

    render() {
        const instruction = this.props.instruction;
        const open = this.props.cursor || this.props.selected;

        let className = "asct-instruction";
        // if(this.props.className)
        //     className += ' ' + this.props.className;
        if(this.props.cursor)
            className += ' cursor';
        if(this.props.selected)
            className += ' selected';

        const parameters = [];

        parameters.push(<TrackerInstructionParameter
            key="command"
            title={`Command: ${instruction.command}`}
            trackerInstruction={this}
            className="command"
            options={() => this.renderMenuSelectCommand()}
            ref={this.commandParam}
        >{instruction.command}</TrackerInstructionParameter>);

        // console.log('instruction', this.props, className);
        if(open) {
            const durationString = instruction.durationTicks === null ? 'N/A'
                : this.getComposer().values.formatSongDuration(instruction.durationTicks);

            if(typeof instruction.velocity !== "undefined")
                parameters.push(<TrackerInstructionParameter
                    key="velocity"
                    title={`Velocity: ${instruction.velocity}`}
                    trackerInstruction={this}
                    className="velocity"
                    options={() => this.renderMenuSelectVelocity(instruction.velocity)}
                >{instruction.velocity}</TrackerInstructionParameter>);
            if(typeof instruction.durationTicks !== "undefined")
                parameters.push(<TrackerInstructionParameter
                    key="duration"
                    title={`Duration: ${durationString}`}
                    trackerInstruction={this}
                    className="duration"
                    options={() => this.renderMenuSelectDuration(instruction.durationTicks)}
                >{durationString||'-'}</TrackerInstructionParameter>);
        }
        return <Div
            className={className}
            onKeyDown={this.cb.onKeyDown}
            onClick={this.cb.onMouseInput}
            >
            {parameters}
        </Div>;
    }

    /** Actions **/

    playInstruction(destination=null) {
        this.getTracker().getTrackInfo().updateCurrentInstruction(); // Hack
        return this.getTracker().playInstructions(this.getInstructionIndex(), destination);
    }

    selectInstruction(clearSelection=true) {
        // const trackName = this.getTracker().getTrackName();
        const selectedIndices = clearSelection ? [] : this.getTracker().getSelectedIndices();
        // const instruction = this.getInstruction();
        selectedIndices.push(this.props.index);
        // this.getComposer().trackerSelectIndices(trackName, selectedIndices, this.props.cursorPosition)
        this.getTracker().selectIndices(selectedIndices, this.props.cursorPosition);
        return selectedIndices;
    }

    selectInstructionWithAction(clearSelection=true) {
        const selectedIndices = this.selectInstruction(clearSelection);
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

    /** TODO: Inefficient **/
    toggleMenu() {
        this.commandParam.current.toggleMenu();
    }

    /** User Input **/

    onMouseInput(e) {
        if(e.defaultPrevented)
            return;
        e.preventDefault();

        switch(e.type) {
            case 'click':
                if(e.button === 0)
                    this.selectInstructionWithAction(!e.ctrlKey);
                else if(e.button === 1)
                    throw new Error("Unimplemented middle button");
                else if(e.button === 2)
                    throw new Error("Unimplemented right button");
                else
                    throw new Error("Unknown mouse button");

                break;
            default:
                throw new Error("Unknown Mouse event: " + e.type);
        }
    }

    /** Menus **/

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
        this.getSong().instructionReplaceCommand(
            this.getComposer().state.selectedTrack,
            this.props.index,
            command);
        this.playInstruction();
    }

    // instructionReplaceInstrument(instrumentID) {
    //     this.getSong().instructionReplaceInstrument(
    //         this.getComposer().state.selectedTrack,
    //         this.props.index,
    //         instrumentID);
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
export default TrackerInstruction;
