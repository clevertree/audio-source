import React from "react";
import {StyleSheet} from "react-native";


export default StyleSheet.create({

    container: {
        flexDirection:'row',
        justifyContent: 'center',

        paddingLeft: 4,
        paddingRight: 4,

        borderRadius: 2,
        borderWidth: 1,
        borderLeftColor: '#CCC',
        borderTopColor: '#CCC',
        borderRightColor: '#AAA',
        borderBottomColor: '#AAA',
    },

    arrow: {
        paddingTop: 2,
        marginLeft: 'auto'
    },

    text: {
        fontSize: 18,
    }

});
