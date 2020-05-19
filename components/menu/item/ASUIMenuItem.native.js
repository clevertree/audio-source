import React from "react";
import {View} from "react-native";
import ASUIClickableBase from "../../button/ASUIClickableBase";

import styles from "../style/ASUIMenu.style"

export default class ASUIMenuItem extends ASUIClickableBase {

    renderContainer() {
        const style = this.getContainerStyle();
        style.push(styles.container);
        return <View
            style={style}
            children={this.renderChildren()}
        />
    }


    /** Actions **/

    async doAction(e) {
        console.info(this.constructor.name + " has no action.");
    }

}
