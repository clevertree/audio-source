import { StyleSheet } from 'react-native';
import { Dimensions } from 'react-native'

var D = Dimensions.get('window');
// console.log('Dimensions:', D);

let marginTop = 32;

export default StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#fff",
        // alignItems: "center",
        // justifyContent: "center",
        // marginTop: 30,
        zIndex: 0
    },

    menuContainer: {
        marginTop: marginTop,
        height: D.height - marginTop,
        backgroundColor: "#322",
    },

    'ASUIMenu.class': {
        // minWidth: 160,
        // margin: 1,
        padding: 6,
        borderWidth: 1,
        borderColor: '#666',
        backgroundColor: '#bdc3c7',

    },

    'asp-menu-button': {
        padding: 0,
        top: 0,
        // right: 0,
        position: 'absolute',
        // height: 400,
        zIndex: 10,
    },


    body: {
        flex: 1,
        // alignItems: 'center',
        // justifyContent: 'center',
        // backgroundColor: '#F04812'
    }

});

