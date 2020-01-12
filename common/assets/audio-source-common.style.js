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
        zIndex: 10,
    },

    'asui-menu-dropdown': {
        padding: 8,
        backgroundColor: '#bdc3c7',
        zIndex: 11,
        // zIndex: 10,
        // position: 'absolute',
        // left: 0,
        // top: 36,
        // width: '80%'
    }
});

