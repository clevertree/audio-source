import React from "react";
import PropTypes from 'prop-types';

import {ImageBackground} from "react-native";
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


    renderContainer() {
        const style = this.getContainerStyle();
        style.push(styles.container);
        return <ImageBackground
            source={this.props.selected ? require('./assets/img/bg-selected.png') : require('./assets/img/bg.png')} // TODO: selected background
            style={style}
            children={this.renderChildren()}
        />
    }

    /** Actions **/

    async doAction(e) {
        if(this.props.disabled) {
            console.warn(this.constructor.name + " is disabled.");
            return;
        }

        if(!this.props.onAction)
            throw new Error("Button does not contain props 'onAction'");
        const result = await this.props.onAction(e, this);
        // if (result !== false)
        //     this.closeAllDropDownMenus();
    }

}
