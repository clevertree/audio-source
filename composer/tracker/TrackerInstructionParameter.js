import * as React from "react";
import PropTypes from 'prop-types';

import DropDownContainer from "../../components/menu/DropDownContainer";

import "./assets/TrackerParam.css";


class TrackerInstructionParameter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false // TODO: DropDownContainer
        };

    }
    render() {
        let className = "asct-parameter";
        if(this.props.className)
            className += ' ' + this.props.className;

        return <div
            className={className}
            tabIndex={0}
            onClick={this.props.onAction}
        >
            {this.props.children}
            {/*<DropDownContainer />*/}
        </div>;
    }

}

export default TrackerInstructionParameter;


/** Default props **/
TrackerInstructionParameter.defaultProps = {
};

/** Validate props **/
TrackerInstructionParameter.propTypes = {
    children: PropTypes.any.isRequired,
    // options: PropTypes.any.isRequired,
    onAction: PropTypes.func.isRequired,
};
