import React from "react";
import {View} from "react-native";
import ASUIContextMenuDropDown from "./ASUIContextMenuDropDown";
import ASUIContextMenuContainerBase from "./ASUIContextMenuContainerBase";

import "./style/ASUIContextMenuContainer.css"

export default class ASUIContextMenuContainer extends ASUIContextMenuContainerBase {

    renderContent() {
        return <View style={styles.container}>
            <ASUIContextMenuDropDown
                ref={this.ref.dropdown}

                />
            {this.props.children}
        </View>
    }


}

const styles = StyleSheet.create({

    container: {
        flex: 1,
    },

});
