import React from "react";
import {View} from "react-native";
import ASUIClickable from "../../button/ASUIClickable";

import styles from "../style/ASUIMenu.style"

export default class ASUIMenuItem extends ASUIClickable {

    renderContainer() {
        const style = this.getContainerStyle();
        style.push(styles.container);
        return <View
            style={style}
            children={this.renderChildren()}
        />
    }

    getContainerStyle() {
        const style = super.getContainerStyle();
        style.push(styles.container);
        return style;
    }


    /** Actions **/

    async doAction(e) {
        console.info(this.constructor.name + " has no action.");
    }

}
