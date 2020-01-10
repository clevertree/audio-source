import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    /** Divisor Elements **/
    'ASUIDiv': {
        // flex: 1,
        // flexDirection: 'column',
        // justifyContent: 'flex-start',
        borderColor: '#333',
        borderWidth: 1,
        borderRadius: 1,
        color: 'red',
        // opacity: 0.5,
        // position: 'relative',
    },



    'title-text': {
        textAlign: 'center', // <-- the magic
        fontWeight: 'bold',
        fontSize: 18,
        padding: 4,
        // paddingTop: 3,
        // width: '100%',
        color: "#333",
        backgroundColor: '#bdc3c7',
    },

    'menu-button': {
        padding: 2,
        position: 'absolute'
    }
});

