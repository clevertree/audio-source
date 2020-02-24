import * as React from "react";
import {
    TrackerInstructionParameter
} from "./";
import Div from "../../components/div/Div";
// import TrackerDelta from "./TrackerDelta";

import "./assets/TrackerInstruction.css";

class TrackerInstruction extends React.Component {
    // play() {
    //     const composer = this.props.composer;
    //     composer.song.playInstructionAtIndex(destination, this.state.tracker.currentGroup, this.index, composer.song.getAudioContext().currentTime);
    //     return this;
    getComposer() { return this.props.composer; }
    getSong() { return this.getComposer().getSong(); }

    render() {
        // console.log('instruction', this.props);
        const instruction = this.props.instruction;
        const open = this.props.cursor || this.props.selected;
        if(!open)
            return <Div className="asct-instruction">
                <TrackerInstructionParameter
                    className="command"
                    onAction={e => this.renderMenuSelectCommand(e)}
                >{instruction.command}</TrackerInstructionParameter>
            </Div>;
        return <Div className="asct-instruction">
            <TrackerInstructionParameter
                className="command"
                onAction={e => this.renderMenuSelectCommand(e)}
            >{instruction.command}</TrackerInstructionParameter>
            <TrackerInstructionParameter
                className="instrument"
                onAction={e => this.renderMenuSelectInstrument(e)}
            >{instruction.instrument}</TrackerInstructionParameter>
            <TrackerInstructionParameter
                className="velocity"
                onAction={e => this.renderMenuSelectVelocity(e)}
            >{instruction.velocity}</TrackerInstructionParameter>
            <TrackerInstructionParameter
                className="duration"
                onAction={e => this.renderMenuSelectDuration(e)}
            >{instruction.duration}</TrackerInstructionParameter>
        </Div>
    }

    // }
    renderMenuSelectCommand(e) {
        this.getComposer().openMenuSelectCommand(e, (command) => {
            this.instructionReplaceCommand(command);
        });
    }

    renderMenuSelectInstrument(e) {
        this.getComposer().openMenuSelectSongInstrument(e, instrumentID => {
            this.instructionReplaceInstrument(instrumentID);
        });
    }

    renderMenuSelectVelocity(e) {
        this.getComposer().openMenuSelectVelocity(e, velocity => {
            this.instructionReplaceVelocity(velocity);
        });
    }

    renderMenuSelectDuration(e) {
        this.getComposer().openMenuSelectDuration(e, duration => {
            this.instructionReplaceDuration(duration);
        });
    }


    instructionReplaceCommand(command) {
        this.getSong().instructionReplaceCommand(
            this.getComposer().state.selectedGroup,
            this.props.index,
            command);
        this.forceUpdate();
    }

    instructionReplaceInstrument(instrumentID) {
        this.getSong().instructionReplaceInstrument(
            this.getComposer().state.selectedGroup,
            this.props.index,
            instrumentID);
        this.forceUpdate();

    }

    instructionReplaceVelocity(velocity) {
        this.getSong().instructionReplaceVelocity(
            this.getComposer().state.selectedGroup,
            this.props.index,
            velocity);
        this.forceUpdate();
    }

    instructionReplaceDuration(duration) {
        this.getSong().instructionReplaceDuration(
            this.getComposer().state.selectedGroup,
            this.props.index,
            duration);
        this.forceUpdate();
    }
}
export default TrackerInstruction;
