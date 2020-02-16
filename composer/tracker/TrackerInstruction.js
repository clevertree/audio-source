import * as React from "react";
import {TrackerParamCommand} from "./TrackerParamCommand";
import {TrackerParamInstrument} from "./TrackerParamInstrument";
import {TrackerParamVelocity} from "./TrackerParamVelocity";
import {TrackerParamDuration} from "./TrackerParamDuration";
import Div from "../../components/div/Div";

export class TrackerInstruction extends React.Component {
    // play() {
    //     const composer = this.props.composer;
    //     composer.song.playInstructionAtIndex(destination, this.state.tracker.currentGroup, this.index, composer.song.getAudioContext().currentTime);
    //     return this;
    // }


    render() {
        const instruction = this.props.instruction;
        const open = this.props.cursor || this.props.selected;
        if(!open)
            return <Div className="asc-tracker-instruction">
                <TrackerParamCommand command={instruction.command}/>
            </Div>;
        return <Div className="asc-tracker-instruction">
            <TrackerParamCommand command={instruction.command}/>
            <TrackerParamInstrument instruction={instruction.instruction}/>
            <TrackerParamVelocity instruction={instruction.velocity}/>
            <TrackerParamDuration instruction={instruction.duration}/>
        </Div>
    }

    render2() {
        const instruction = this.props.instruction;
        return [
            TrackerParamCommand.createParameter(instruction),
            (this.props.cursor || this.props.selected) ? [
                TrackerParamInstrument.createParameter(instruction),
                TrackerParamVelocity.createParameter(instruction),
                TrackerParamDuration.createParameter(instruction),
            ] : null
        ]
    }

    getAttributeMap() {
        return Object.assign(super.getAttributeMap(), {
            selected: 'selected',
            cursor: 'cursor',
        });
    }

    static createInstruction(props, instruction) {
        return this.createElement(props, null, {
            instruction
        });
    }

}
