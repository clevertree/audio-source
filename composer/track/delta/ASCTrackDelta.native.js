import * as React from "react";

import styles from "./ASCTrackDelta.style";

class ASCTrackDelta extends React.Component {
    render() {
        return <div className="asct-delta">{this.props.duration}</div>;
    }
}

export default ASCTrackDelta;
