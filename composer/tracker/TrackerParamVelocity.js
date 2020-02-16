import * as React from "react";

export class TrackerParamVelocity extends React.Component {
    render() {
        return this.props.velocity;
    }

    static createParameter(instruction) {
        return this.createElement({
            velocity: instruction.velocity
        })
    }
}
