import React from "react";
import PropTypes from 'prop-types';

import './assets/Menu.css';
import Div from "../div/Div";

class MenuAction extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onClick: e => this.onClick(e),
            onKeyDown: e => this.onKeyDown(e),
        };
    }

    render() {
        let className = 'asui-menu-item';
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.disabled)
            className += ' disabled';
        if(this.props.selected)
            className += ' selected';

        return (
            <Div
                className={className}
                onClick={this.cb.onClick}
                onKeyDown={this.cb.onKeyDown}
                tabIndex={0}
                >
                {this.props.children}
            </Div>

        );
    }

    onClick(e) {
        this.doAction(e);
    }


    doAction(e) {
        if(this.props.disabled) {
            console.warn(this.constructor.name + " is disabled.", this);
            return;
        }

        if(this.props.onAction) {
            if(e.type !== 'click')
                throw new Error("Skipping onAction for type " + e.type);
            const result = this.props.onAction(e, this);
            if (result !== false)
                this.closeAllDropDownMenus();

        } else {
            throw new Error("MenuAction does not contain props 'onAction'");
        }
    }


}


// creating default props
MenuAction.defaultProps = {
    // disabled:       false,
};

// validating prop types
MenuAction.propTypes = {
    onAction: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    vertical: PropTypes.bool,
};



export default MenuAction;

