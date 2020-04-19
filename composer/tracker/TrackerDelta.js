import * as React from "react";

import "./assets/TrackerDelta.css";

class TrackerDelta extends React.Component {
    render() {
        return <div className="asct-delta">{this.props.duration}</div>;
    }
}

export default TrackerDelta;
