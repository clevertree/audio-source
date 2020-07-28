import React from 'react';

import "./EnvelopeEffectRenderer.css";
import EnvelopeEffectRendererBase from "./EnvelopeEffectRendererBase";
import {ASUIButtonDropDown} from "../../../../components";
import {ProgramLoader} from "../../../../common/";

/** PolyphonyInstrumentRenderer **/
export default class EnvelopeEffectRenderer extends EnvelopeEffectRendererBase {

    render() {
        const voice = this.props.config.voice;
//         console.log('voices', voices);
        // Presets are handled by composer
        return (
            <div className="envelope-effect-renderer">
                {voice ? this.renderVoice()
                    : <ASUIButtonDropDown
                    title="Add new voice"
                    className="add-voice"
                    arrow={false}
                    options={() => this.renderMenuAddVoice()}>
                    SetVoice
                </ASUIButtonDropDown>}
            </div>
        );

    }

    renderVoice() {
        const voice = this.props.config.voice;
        const [className, config] = voice;
        const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);

        return <div className="voice">
                 <Renderer
                    onRemove={this.cb.onRemove}
                    instrumentID={0}
                    config={config}
                    program={voice}
                />
        </div>;
    }
}
