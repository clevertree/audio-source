import * as React from "react";
import PropTypes from 'prop-types';

import "./assets/TrackerParam.css";
import {SubMenuButton} from "../../components";

class TrackerInstructionParameter extends React.Component {
    render() {
        let className = "asct-parameter";
        if(this.props.className)
            className += ' ' + this.props.className;

        return <SubMenuButton
            arrow={false}
            className={className}
            options={this.props.options}
            tabIndex={0}
            >{this.props.children}</SubMenuButton>

        // return <div
        //     className={className}
        //     tabIndex={0}
        //     onClick={this.props.onAction}
        // >{this.props.children}</div>;
    }
}

export default TrackerInstructionParameter;


/** Default props **/
TrackerInstructionParameter.defaultProps = {
};

/** Validate props **/
TrackerInstructionParameter.propTypes = {
    children: PropTypes.any.isRequired,
    options: PropTypes.any.isRequired,
    // onAction: PropTypes.func.isRequired,
};
