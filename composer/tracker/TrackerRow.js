import * as React from "react";
import PropTypes from "prop-types";
import TrackerDelta from "./TrackerDelta";
import TrackerInstructionAdd from "./TrackerInstructionAdd";

import Div from "../../components/div/Div";
import TrackerPosition from "./TrackerPosition";

import "./assets/TrackerRow.css";

class TrackerRow extends React.Component {
    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        positionTicks: PropTypes.number.isRequired,
        deltaDuration: PropTypes.number.isRequired,
    };

    render() {
        return (
            <Div className="asct-row">
                <TrackerPosition positionTicks={this.props.positionTicks} />
                {this.props.children}
                {this.props.cursor ? <TrackerInstructionAdd/> : null}
                <TrackerDelta duration={this.props.deltaDuration} />
            </Div>
        )
    }
}

export default TrackerRow;
