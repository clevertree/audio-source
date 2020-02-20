import * as React from "react";
import TrackerDelta from "./TrackerDelta";
import TrackerInstructionAdd from "./TrackerInstructionAdd";
import Div from "../../components/div/Div";

import "./assets/TrackerRow.css";

class TrackerRow extends React.Component {

    render() {
        return (
            <Div className="asct-row">
                <TrackerDelta duration={this.props.deltaDuration} />
                {this.props.children}
                {this.props.cursor ? <TrackerInstructionAdd/> : null}
            </Div>
        )
    }
}

export default TrackerRow;