import * as React from "react";

import "./ASCTrackPosition.css";

class ASCTrackPosition extends React.Component {
    render() {
        return <div className="asct-position">{this.props.position}</div>;
    }
}

export default ASCTrackPosition;
