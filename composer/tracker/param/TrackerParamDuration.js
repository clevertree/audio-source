import * as React from "react";

import "../assets/TrackerParam.css";
class TrackerParamDuration extends React.Component {
    render() {
        return <div className="asctp-duration">{this.props.duration}</div>;
    }
}

export default TrackerParamDuration;
