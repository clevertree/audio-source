import React from "react";
import PropTypes from 'prop-types';

import './assets/ASUIButton.css'; // TODO: module.css https://malcoded.com/posts/react-component-style/
import ASUIMenuContext from "../menu/ASUIMenuContext";

// TODO: subclass Button and MenuDropDown with hover close handler
class ASUIButton extends React.Component {
    /** Context **/
    static contextType = ASUIMenuContext;

    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        onAction: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
    };


    constructor(props) {
        super(props);
        this.cb = {
            onMouseInput: e => this.onMouseInput(e),
            onKeyDown: e => this.onKeyDown(e),
        };
    }

    getOverlay() { return this.context.overlay; }

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
                title={this.props.title}
                className={className}
                onClick={this.cb.onMouseInput}
                onKeyDown={this.cb.onKeyDown}
                tabIndex={0}
                >
                {this.props.children}
            </div>
        );
    }



    /** User Input **/

    onMouseInput(e) {
        if(e.defaultPrevented)
            return;
        e.preventDefault();
        this.doAction(e);
    }


    onKeyDown(e) {
        if(e.isDefaultPrevented())
            return;
        switch(e.key) {
            case ' ':
            case 'Enter':
                this.doAction(e);
                break;

            default:
                console.info("Unhandled key: ", e.key);
                break;
        }
    }

    /** Actions **/

    doAction(e) {
        if(this.props.disabled) {
            console.warn(this.constructor.name + " is disabled.", this);
            return;
        }

        if(!this.props.onAction)
            throw new Error("Button does not contain props 'onAction'");
        const result = this.props.onAction(e, this);
        if (result !== false)
            this.closeAllDropDownMenus();
    }


    closeAllDropDownMenus() {
        if(this.getOverlay())
            this.getOverlay().closeAllMenus();
    }
}




export default ASUIButton;

