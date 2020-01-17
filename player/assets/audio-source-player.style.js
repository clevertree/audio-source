import { StyleSheet } from 'react-native';
import { Dimensions } from 'react-native'

var D = Dimensions.get('window');
// console.log('Dimensions:', D);

let marginTop = 35;

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
    body: {
        flex: 1,
        // alignItems: 'center',
        // justifyContent: 'center',
        // backgroundColor: '#F04812'
    }

});

