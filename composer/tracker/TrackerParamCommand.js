import * as React from "react";

import "./assets/TrackerParam.css";
class TrackerParamCommand extends React.Component {
    render() {
        return <div className="asctp-command">{this.props.command}</div>;
    }
}

export default TrackerParamCommand;
