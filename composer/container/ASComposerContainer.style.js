import { StyleSheet } from 'react-native';

export default StyleSheet.create({

    container: {
        display: 'flex',
        // justifyContent: 'space-between',
        // flexDirection:'row',
        // flexWrap:'wrap',
    },

    menuButton: {
        position: 'absolute'
    },

    title: {
        fontWeight: 'bold',
        textAlign: 'center',
        paddingTop: 6,
        paddingBottom: 6,
    },

    default: {
        display: 'flex',
    },

    footer: {
        paddingLeft: 2,
        paddingRight: 2,
        borderTopWidth: 1,
        // display: 'flex',
        flexDirection:'row',
        justifyContent: 'space-between',
    }

});
