import React from "react";
import {View} from "react-native";
import ASUIClickableBase from "../button/ASUIClickableBase";
import PropTypes from "prop-types";

import styles from "./ASUIMenu.style"

class ASUIMenuAction extends ASUIClickableBase {
    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        onAction: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
    };


    renderChildren(props={}) {
        let style = [styles.container];
        if(this.props.style)
            style.push(this.props.style);

        return <View
            style={style}
            >
            {super.renderChildren()}
        </View>;
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

export default ASUIMenuAction;

