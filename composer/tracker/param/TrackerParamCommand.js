import * as React from "react";
import {Div} from "../../../components";

import "../assets/TrackerParam.css";
class TrackerParamCommand extends React.Component {
    render() {
        return <Div className="asctp-command">{this.props.command}</Div>;
    }
}

export default TrackerParamCommand;
