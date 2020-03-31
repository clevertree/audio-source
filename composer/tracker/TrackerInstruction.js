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
        let className = "asct-instruction";
        // if(this.props.className)
        //     className += ' ' + this.props.className;
        if(this.props.cursor)
            className += ' cursor';
        if(this.props.selected)
            className += ' selected';

        // console.log('instruction', this.props, className);
        const instruction = this.props.instruction;
        const open = this.props.cursor || this.props.selected;
        if(!open)
            return <Div className={className}>
                <TrackerInstructionParameter
                    className="command"
                    options={() => this.renderMenuSelectCommand()}
                >{instruction.command}</TrackerInstructionParameter>
            </Div>;
        return <Div className={className}>
            <TrackerInstructionParameter
                className="command"
                options={() => this.renderMenuSelectCommand()}
            >{instruction.command}</TrackerInstructionParameter>
            {/*{typeof instruction.instrument !== "undefined" ? <TrackerInstructionParameter*/}
            {/*    className="instrument"*/}
            {/*    options={() => this.renderMenuSelectInstrument(e)}*/}
            {/*>{instruction.instrument}</TrackerInstructionParameter> : null}*/}
            {typeof instruction.velocity !== "undefined" ? <TrackerInstructionParameter
                className="velocity"
                options={() => this.renderMenuSelectVelocity()}
            >{instruction.duration}</TrackerInstructionParameter> : null}
                {typeof instruction.duration !== "undefined" ? <TrackerInstructionParameter
                className="duration"
                options={() => this.renderMenuSelectDuration()}
            >{instruction.duration}</TrackerInstructionParameter> : null}
        </Div>
    }

    // }
    renderMenuSelectCommand(e) {
        return this.getComposer().renderMenuSelectCommand((command) => {
            this.instructionReplaceCommand(command);
        });
    }

    renderMenuSelectInstrument(e) {
        return this.getComposer().renderMenuSelectSongInstrument(instrumentID => {
            this.instructionReplaceInstrument(instrumentID);
        });
    }

    renderMenuSelectVelocity(e) {
        return this.getComposer().renderMenuSelectVelocity(velocity => {
            this.instructionReplaceVelocity(velocity);
        });
    }

    renderMenuSelectDuration(e) {
        return this.getComposer().renderMenuSelectDuration(duration => {
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
