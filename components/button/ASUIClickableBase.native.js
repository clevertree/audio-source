import React from "react";
import {Text, TouchableHighlight, View, ImageBackground, StyleSheet} from "react-native";
import PropTypes from 'prop-types';

import ASUIMenuContext from "../menu/ASUIMenuContext";

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
        const style = [styles.default];
        if(this.props.style)
            style.push(this.props.style);
        if(this.props.disabled)
            style.push(styles.disabled);
        // if(this.props.selected)
        //     style.push(styles.selected)

        return (
            <TouchableHighlight
                onPress={this.cb.onMouseInput}
                onLongPress={this.cb.onMouseInput}
            >
                <View
                    style={style}
                    children={this.renderChildren()}
                    />
            </TouchableHighlight>
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


const styles = StyleSheet.create({

    default: {
    },

    background: {
    },

    text: {
        // fontSize: 17.5,
    }

});
