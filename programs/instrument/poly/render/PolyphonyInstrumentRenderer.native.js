import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import PolyphonyInstrumentRendererBase from "./PolyphonyInstrumentRendererBase";
import {ASUIButtonDropDown} from "../../../../components";
import {ProgramLoader} from "../../../../common/program";

/** PolyphonyInstrumentRenderer **/
export default class PolyphonyInstrumentRenderer extends PolyphonyInstrumentRendererBase {

    render() {
        const voices = this.props.config.voices;
//         console.log('voices', voices);
        // Presets are handled by composer
        return (
            <View style={styles.container}>
                <View style={styles.voices}>
                    {voices.map((voiceData, voiceID) => {
                        const [className, config] = voiceData;
                        const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);
                        return <Renderer
                            onRemove={this.cb.onRemove}
                            key={voiceID}
                            instrumentID={voiceID}
                            config={config}
                        />
                    })}
                    <ASUIButtonDropDown
                        style={styles.buttonAddVoice}
                        title="Add new voice"
                        arrow={false}
                        options={() => this.renderMenuAddVoice()}>
                        <Text style={styles.buttonAddText}>+</Text>
                    </ASUIButtonDropDown>
                </View>
            </View>
        );

    }

}

const styles = StyleSheet.create({
    container: {
        // borderTopWidth: 1,
        // borderTopColor: '#AAA',
        // backgroundColor: '#EEE',
        // padding: 4
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
        paddingLeft: 6,
        paddingRight: 6
    },

    buttonAddText: {
        textAlign: 'center',
    },

    voices: {
        flexDirection:'row',
        flexWrap:'wrap',
    }
});
