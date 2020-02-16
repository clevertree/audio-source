import * as React from "react";

export class TrackerParamDuration extends React.Component {
    render() {
        return this.props.duration;
    }

    static createParameter(instruction) {
        return this.createElement({
            duration: instruction.duration
        })
    }
}
