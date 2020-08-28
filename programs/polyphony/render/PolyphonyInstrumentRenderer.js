import React from 'react';

import {ASUIButtonDropDown, ASUIIcon} from "../../../components";

import PolyphonyInstrumentRendererBase from "./PolyphonyInstrumentRendererBase";
import "./PolyphonyInstrumentRenderer.css";

export default class PolyphonyInstrumentRenderer extends PolyphonyInstrumentRendererBase {


    render() {
        const voices = this.props.config.voices || [];
//         console.log('voices', voices);
        // Presets are handled by composer
        return (
            <div className="polyphony-instrument-renderer">
                <div className="voices">
                    {voices.map((voiceData, voiceID) => this.renderVoice(voiceID, voiceData))}
                </div>
                <ASUIButtonDropDown
                    title="Add new Voice"
                    className="add-voice"
                    arrow={false}
                    options={() => this.renderMenuAddVoice()}>
                    {voices.length === 0 ? 'Add Voice' : <ASUIIcon source="insert" />}
                </ASUIButtonDropDown>
            </div>
        );

    }

}
