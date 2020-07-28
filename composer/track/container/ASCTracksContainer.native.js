import * as React from "react";
import {View, StyleSheet} from "react-native";
import ASCTracksContainerBase from "./ASCTracksContainerBase";

export default class ASCTracksContainer extends ASCTracksContainerBase {
    render() {
        return <View style={styles.container}>
            {super.render()}
        </View>
    }
}

const styles = StyleSheet.create({

    container: {
    },
});

