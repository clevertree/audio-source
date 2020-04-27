import * as React from "react";

import "./assets/ASCTrackDelta.css";

class ASCTrackDelta extends React.Component {
    render() {
        return <div className="asct-delta">{this.props.duration}</div>;
    }
}

export default ASCTrackDelta;
