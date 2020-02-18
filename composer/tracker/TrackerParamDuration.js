import * as React from "react";

class TrackerParamDuration extends React.Component {
    render() {
        return this.props.duration;
    }

    static createParameter(instruction) {
        return this.createElement({
            duration: instruction.duration
        })
    }
}

export default TrackerParamDuration;
