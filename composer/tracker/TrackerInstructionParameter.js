import * as React from "react";
import PropTypes from 'prop-types';

import "./assets/TrackerParam.css";
import {SubMenuDropDown} from "../../components";

class TrackerInstructionParameter extends React.Component {
    constructor() {
        super();
        this.state = {
            open: false
        };
    }
    render() {
        let className = "asct-parameter";
        if(this.props.className)
            className += ' ' + this.props.className;


        return <div
            className={className}
            tabIndex={0}
            onClick={e => this.openDropDownMenu(e)}
        >
            {this.props.children}
            {this.state.open ? this.renderDropDownMenu() : null}
        </div>;
    }

    toggleDropDownMenu(e) {
        this.setState({open: !this.state.open})
    }
    openDropDownMenu(e) {
        this.setState({open: true})
    }

    renderDropDownMenu() {
        return <SubMenuDropDown // use native
            open={true}
            vertical={true}
            options={this.props.options}
        >{this.props.children}</SubMenuDropDown>
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
