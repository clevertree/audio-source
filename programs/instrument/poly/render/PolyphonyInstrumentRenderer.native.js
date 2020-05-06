import React from 'react';
import {Text, View} from 'react-native';

import PolyphonyInstrumentRendererBase from "./PolyphonyInstrumentRendererBase";
import {ASUIButtonDropDown} from "../../../../components";
import {ProgramLoader} from "../../../../common/program";

import styles from "./PolyphonyInstrumentRenderer.style";

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
                    <View style={styles.buttonAddVoice}>
                        <ASUIButtonDropDown
                            title="Add new voice"
                            arrow={false}
                            options={() => this.renderMenuAddVoice()}>
                            <Text style={styles.buttonAddText}>+</Text>
                        </ASUIButtonDropDown>
                    </View>
                </View>
            </View>
        );

    }

}
