import React from "react";
import PropTypes from 'prop-types';

import './assets/Menu.css';
import AbstractMenu from "./AbstractMenu";

class ActionMenu extends AbstractMenu {
    render() {
        let className = 'asui-menu asui-menu-container action';
        if(this.props.disabled)
            className += ' disabled';
        if(this.props.className)
            className += ' ' + this.props.className;


        return (
            <div
                key={this.props.key}
                className={className}
                    onClick={e => this.onInputEvent(e)}
                    onKeyDown={e => this.onInputEvent(e)}
                    tabIndex={0}
                    >
                    <div
                        className="title"
                        children={this.props.children}
                        />
                    {this.props.arrow ? <div className="arrow">{this.props.arrow}</div> : null}
            </div>
        )
    }

    doMenuAction(e) {
        if(this.props.disabled) {
            console.warn("Menu is disabled.", this);
            return;
        }
        const result = this.props.onAction(e, this);
        if(result !== false)
            this.closeAllSubMenus(e.target);
    }


    onInputEvent(e) {
        // console.log(e.type, e);

        switch (e.type) {

            case 'click':
                this.doMenuAction(e);
                break;

            case 'keydown':

                let keyEvent = e.key;
                switch (keyEvent) {
                    case 'Escape':
                    case 'Backspace':
                        this.closeMenu(e);
                        break;

                    case 'Enter':
                        this.doMenuAction(e);
                        break;

                    // ctrlKey && metaKey skips a measure. shiftKey selects a range
                    case 'ArrowRight':
                        this.selectNextTabItem(e);
                        break;

                    case 'ArrowLeft':
                        this.selectPreviousTabItem(e);
                        break;

                    case 'ArrowDown':
                        this.selectNextTabItem(e);
                        break;

                    case 'ArrowUp':
                        this.selectPreviousTabItem(e);
                        break;

                    default:
                        console.log("Unknown key input: ", keyEvent);
                        break;

                }
                break;

            default:
                console.log("Unknown input event: ", e.type);
                break;
        }
    }
}

// creating default props
ActionMenu.defaultProps = {
    arrow:          null, // '►',
    vertical:       false,
    openOnHover:    false,
    disabled:       false,
};

// validating prop types
ActionMenu.propTypes = {
    onAction: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    vertical: PropTypes.bool,
    openOnHover: PropTypes.bool,
};



export {
    ActionMenu as default,
    ActionMenu
};
