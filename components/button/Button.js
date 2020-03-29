import React from "react";
import PropTypes from 'prop-types';

import './assets/Button.css';
import MenuOverlayContext from "../menu/MenuOverlayContext";

class Button extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onClick: e => this.onClick(e),
            onKeyDown: e => this.onKeyDown(e),
        };
    }

    getClassName() { return 'asui-button'; }

    render() {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.disabled)
            className += ' disabled';
        if(this.props.selected)
            className += ' selected';

        return (
            <div
                className={className}
                onClick={this.cb.onClick}
                onKeyDown={this.cb.onKeyDown}
                tabIndex={0}
                >
                {this.props.children}
            </div>

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
            throw new Error("Button does not contain props 'onAction'");
        }
    }


    closeAllDropDownMenus() {
        if(this.context.closeAllMenus)
            this.context.closeAllMenus();
    }
}

Button.contextType = MenuOverlayContext;


// creating default props
Button.defaultProps = {
    // disabled:       false,
};

// validating prop types
Button.propTypes = {
    onAction: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};



export default Button;

