import * as React from "react";
import {StyleSheet, View, Text} from "react-native";
// import Div from "../../components/div/Div";
// import ASCTrackDelta from "./ASCTrackDelta";

export default class ASCTrackInstructionAdd extends React.Component {
    // setCursor(isCursor = true) {
    //     this.setProps({cursor: isCursor});
    // }

    render() {
        return <View style={styles.cell}>
            <Text style={styles.text}>+</Text>
        </View>;
    }

}


const styles = StyleSheet.create({

    cell: {
        display: 'flex',

        color: '#666',

        backgroundColor: '#FFF',
        borderRadius: 4,
        borderWidth: 1,
        borderLeftColor: '#AAA',
        borderTopColor: '#AAA',
        borderRightColor: '#666',
        borderBottomColor: '#666',

        paddingLeft: 4,
        paddingRight: 4,
    },

    text: {

    },
});
