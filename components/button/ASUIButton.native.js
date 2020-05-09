import React from "react";
import PropTypes from 'prop-types';

import {ImageBackground, StyleSheet, TouchableHighlight} from "react-native";
import ASUIClickableBase from "./ASUIClickableBase";

import styles from "./ASUIButton.style";

export default class ASUIButton extends ASUIClickableBase {
    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        onAction: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
    };


    renderChildren(props={}) {
        return (
            <ImageBackground
                source={require('./assets/img/bg.png')}
                style={styles.container}
                children={super.renderChildren(props)}
                />
        );
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


}