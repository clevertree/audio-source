import * as React from "react";
import Div from "../../components/div/Div";

class TrackerDelta extends React.Component {
    render() {
        return <Div className="asc-tracker-delta">{this.props.duration}</Div>;
    }
}

export default TrackerDelta;
