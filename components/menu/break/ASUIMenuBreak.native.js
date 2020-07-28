import React from "react";
import {StyleSheet, View} from "react-native";


class ASUIMenuBreak extends React.Component {
    render() {
        return (
            <View style={styles.break}/>
        );
    }
}

export default ASUIMenuBreak;


const styles = StyleSheet.create({

    break: {
        borderBottomColor: 'black',
        borderBottomWidth: 1,
    }

});
