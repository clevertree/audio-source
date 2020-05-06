import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import OscillatorInstrumentRendererBase from "./OscillatorInstrumentRendererBase";
import {ASUIIcon, ASUIMenuDropDown} from "../../../../components";


class OscillatorInstrumentRenderer extends OscillatorInstrumentRendererBase {

    render() {
        const style = [styles.container];
        if(this.state.open)
            style.push(styles.open)
        let title = this.getTitle();


        return <View style={style}>
            <View
                style={styles.title}
                title={`Oscillator: ${title}`}
                onClick={this.cb.onClick}
            >
                <Text>{title}</Text>
            </View>
            {this.renderParameters()}
            <ASUIMenuDropDown
                arrow={false}
                className="config"
                options={() => this.renderMenuRoot()}
            >
                <ASUIIcon source="config"/>
            </ASUIMenuDropDown>
        </View>;
    }
}
export default OscillatorInstrumentRenderer;


const styles = StyleSheet.create({
    container: {
        flexDirection:'row',
        flexWrap:'wrap',
        // borderWidth: 1

        backgroundColor: '#CCC',
        borderRadius: 4,
        borderWidth: 1,
        borderLeftColor: '#AAA',
        borderTopColor: '#AAA',
        borderRightColor: '#666',
        borderBottomColor: '#666',
        paddingLeft: 6,
        paddingRight: 6
    },

    buttonAddText: {
        textAlign: 'center'
    },

    voices: {
    }
});
