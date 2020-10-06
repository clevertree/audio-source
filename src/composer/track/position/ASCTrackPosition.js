import * as React from "react";

import "./ASCTrackPosition.css";

class ASCTrackPosition extends React.Component {

    render() {
        let className = 'asct-position';
        let position = this.props.position;
        if(position.length > 3) {
            if(position.length > 5) {
                className += ' tiny';
            } else {
                className += ' small';
            }

        }
        return <div className={className}>{position}</div>;
    }
}

export default ASCTrackPosition;
