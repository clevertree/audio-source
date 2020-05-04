import * as React from "react";

import style from "./ASCTrackPosition.style";

class ASCTrackPosition extends React.Component {
    render() {
        return <div className="asct-position">{this.props.positionTicks}</div>;
    }
}

export default ASCTrackPosition;
