import React from 'react';

import "./PolyphonyInstrumentRenderer.css";
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
            <div className="polyphony-instrument-renderer">
                <div className="voices">
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
                </div>
                <ASUIButtonDropDown
                    title="Add new voice"
                    className="add-voice"
                    arrow={false}
                    options={() => this.renderMenuAddVoice()}>
                    +
                </ASUIButtonDropDown>
            </div>
        );

    }

}
