import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        // borderWidth: 1
    },

    buttonAddVoice: {
        backgroundColor: '#CCC',
        borderRadius: 4,
        borderWidth: 1,
        borderLeftColor: '#AAA',
        borderTopColor: '#AAA',
        borderRightColor: '#666',
        borderBottomColor: '#666',
        width: 24,
        paddingLeft: 6,
        paddingRight: 6
    },

    buttonAddText: {
        textAlign: 'center'
    },

    voices: {
        flexDirection:'row',
        flexWrap:'wrap',
    }
});
