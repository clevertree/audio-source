import { StyleSheet } from 'react-native';

import { Dimensions } from 'react-native'
var D = Dimensions.get('window');
console.log('Dimensions:', D);

export default StyleSheet.create({
    /** Divisor Elements **/
    'ASUIDiv': {
        // flex: 1,
        // flexDirection: 'column',
        // justifyContent: 'flex-start',
        // borderColor: '#333',
        // borderWidth: 1,
        // borderRadius: 1,
        // color: 'red',
        // opacity: 0.5,
        // position: 'relative',
    },

    'ASUIMenu': {
        // minWidth: 160,

    },


    'ASUIMenu.default-text': {
        // color: 'blue'
    },

    'ASUIMenu.arrow': {
        alignSelf: 'flex-end'  // display: 'flex'
    },

    'ASUIMenu.dropdown': {
        // padding: 8,
        // backgroundColor: '#bdc3c7',
        // zIndex: 11,
        // zIndex: 10,
        // position: 'absolute',
        // height: D.height - 60,
        // paddingTop: 35,
        // top: 35,
        // width: 300
        // left: 0,
        // top: 36,
        // width: '80%'
    },

    'asp-title-container': {
        borderColor: '#333',
        borderWidth: 1,
        borderRadius: 1,
        backgroundColor: '#bdc3c7',
    },

    'asp-title-text': {
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 18,
        padding: 4,
        color: "#333",
    },

    'asp-menu-button': {
        padding: 2,
        position: 'absolute',
        // height: 400,
        // zIndex: 10,
    },

});

