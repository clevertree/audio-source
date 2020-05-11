import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import OscillatorInstrumentRendererBase from "./OscillatorInstrumentRendererBase";
import {ASUIIcon, ASUIMenuDropDown} from "../../../../components";
import {TouchableHighlight} from "react-native-web";


class OscillatorInstrumentRenderer extends OscillatorInstrumentRendererBase {
    constructor(props) {
        super(props);

    }


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
                className="config"
                options={this.cb.renderMenuRoot}
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
