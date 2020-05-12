import React from "react";
import {View} from "react-native";
import ASUIClickableBase from "../../button/ASUIClickableBase";

import styles from "../style/ASUIMenu.style"

export default class ASUIMenuItem extends ASUIClickableBase {

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
        console.info(this.constructor.name + " has no action.");
    }

}
