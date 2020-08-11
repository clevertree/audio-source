import React from 'react';

import {ASUIButtonDropDown, ASUIIcon} from "../../../components";
import {ProgramLoader} from "../../../common/";

import PolyphonyInstrumentRendererBase from "./PolyphonyInstrumentRendererBase";
import "./PolyphonyInstrumentRenderer.css";

/** PolyphonyInstrumentRenderer **/
export default class PolyphonyInstrumentRenderer extends PolyphonyInstrumentRendererBase {


    render() {
        const voices = this.props.config.voices || [];
//         console.log('voices', voices);
        // Presets are handled by composer
        return (
            <div className="polyphony-instrument-renderer">
                <div className="voices">
                    {voices.map((voiceData, voiceID) => {
                        const [className, config] = voiceData;
                        const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);
                        return (//<div className="voice">
                            <Renderer
                                onRemove={this.cb.onRemove}
                                key={voiceID}
                                instrumentID={voiceID}
                                config={config}
                                program={voiceData}
                            />);
                            // </div>
                    })}
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
