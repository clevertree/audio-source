import React from "react";
import {Text, TouchableHighlight, View, ImageBackground} from "react-native";
import PropTypes from 'prop-types';

import ASUIMenuContext from "../menu/ASUIMenuContext";
import styles from './ASUIButtonBase.style';

export default class ASUIClickableBase extends React.Component {
    /** Context **/
    static contextType = ASUIMenuContext;

    constructor(props) {
        super(props);
        this.cb = {
            onMouseInput: e => this.onMouseInput(e),
            onKeyDown: e => this.onKeyDown(e),
        };
    }


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
                {this.renderChildren()}
            </div>
        );
    }

    renderChildren(props={}) {
        let children = this.props.children;
        if(typeof children !== 'object')
            children = <Text children={children} style={styles.text} {...props}></Text>;
        return children;
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
        throw new Error("Not implemented");
    }

    /** Overlay Context **/

    getOverlay() { return this.context.overlay; }

    closeAllDropDownMenus() {
        if(this.getOverlay())
            this.getOverlay().closeAllMenus();
    }

}
