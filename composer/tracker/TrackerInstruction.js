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
    // }


    render() {
        const instruction = this.props.instruction;
        const open = this.props.cursor || this.props.selected;
        if(!open)
            return <Div className="asct-instruction">
                <TrackerInstructionParameter

                    className="command"
                    >{instruction.command}</TrackerInstructionParameter>
            </Div>;
        return <Div className="asct-instruction">
            <TrackerInstructionParameter
                className="command"
                >{instruction.command}</TrackerInstructionParameter>
            <TrackerInstructionParameter
                className="instruction"
                >{instruction.instruction}</TrackerInstructionParameter>
            <TrackerInstructionParameter
                className="velocity"
                >{instruction.velocity}</TrackerInstructionParameter>
            <TrackerInstructionParameter
                className="duration"
                >{instruction.duration}</TrackerInstructionParameter>
        </Div>
    }

}
export default TrackerInstruction;
