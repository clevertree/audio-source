import * as React from "react";

export class TrackerParamInstrument extends React.Component {
    render() {
        return this.props.command;
    }

    static createParameter(instruction) {
        return this.createElement({
            instrumentID: instruction.instrument
        })
    }
}
