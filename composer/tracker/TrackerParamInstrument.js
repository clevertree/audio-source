import * as React from "react";

import "./assets/TrackerParam.css";
class TrackerParamInstrument extends React.Component {
    render() {
        return <div className="asctp-instrument">{this.props.instrument}</div>;
    }
}

export default TrackerParamInstrument;
