import * as React from "react";
import Div from "../../components/div/Div";

import "./assets/TrackerDelta.css";

class TrackerDelta extends React.Component {
    render() {
        return <Div className="asct-delta">{this.props.duration}</Div>;
    }
}

export default TrackerDelta;
