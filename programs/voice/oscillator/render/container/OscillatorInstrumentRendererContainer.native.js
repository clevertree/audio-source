import React from 'react';
import {View, Text, StyleSheet, TouchableHighlight} from 'react-native';
import {ASUIIcon, ASUIMenuDropDown} from "../../../../../components";


export default class OscillatorInstrumentRendererContainer extends React.Component {

    render() {
        const style = [styles.container];
        if(this.state.open)
            style.push(styles.open)
        let title = this.getTitle();


        return <View style={style}>
            <TouchableHighlight
                onPress={this.cb.onClick}
                >
                <View
                    style={styles.title}
                    title={`Oscillator: ${title}`}
                    >
                    <Text>{title}</Text>
                </View>
            </TouchableHighlight>

            {this.renderParameters()}
            <ASUIMenuDropDown
                arrow={false}
                style={styles.buttonConfig}
                options={this.cb.renderMenuRoot}
            >
                <ASUIIcon source="config" size="small"/>
            </ASUIMenuDropDown>
        </View>;
    }
}


const styles = StyleSheet.create({
    container: {
        alignSelf: 'flex-start',
        flexDirection:'row',
        // flexWrap:'wrap',
        // borderWidth: 1

        backgroundColor: '#CCC',
        borderRadius: 4,
        borderWidth: 1,
        borderLeftColor: '#AAA',
        borderTopColor: '#AAA',
        borderRightColor: '#666',
        borderBottomColor: '#666',
        paddingLeft: 2,
        paddingRight: 2
    },

    title: {
        paddingRight: 4,
        borderRightWidth: 1,

    },

    buttonConfig: {
        paddingTop: 1,
        paddingLeft: 2,
    },

    voices: {
    }
});
