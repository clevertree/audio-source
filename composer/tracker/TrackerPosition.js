import * as React from "react";
import Div from "../../components/div/Div";

import "./assets/TrackerPosition.css";

class TrackerPosition extends React.Component {
    render() {
        return <Div className="asct-position">{this.props.positionTicks}</Div>;
    }
}

export default TrackerPosition;
