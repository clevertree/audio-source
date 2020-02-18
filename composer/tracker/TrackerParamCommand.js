import * as React from "react";

class TrackerParamCommand extends React.Component {
    render() {
        return this.props.command;
    }

    static createParameter(instruction) {
        return this.createElement({
            command: instruction.command
        })
    }
}

export default TrackerParamCommand;
