import React from "react";
import {View} from "react-native";
import PropTypes from "prop-types";

import styles from "../style/ASUIMenu.style"
import ASUIMenuItem from "./ASUIMenuItem";

class ASUIMenuAction extends ASUIMenuItem {
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
        if(this.props.disabled)
            style.push(styles.disabled);

        return <View
            style={style}
            >
            {super.renderChildren()}
        </View>;
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
        if (result !== false)
            this.closeAllDropDownMenus();
    }

}

export default ASUIMenuAction;

