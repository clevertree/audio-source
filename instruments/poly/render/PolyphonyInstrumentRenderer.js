import React from 'react';

import {
    Div,
} from "../../../components";

import {InstrumentLoader} from "../../../song";


import "./assets/PolyphonyInstrumentRenderer.css";

/** PolyphonyInstrumentRenderer **/
class PolyphonyInstrumentRenderer extends React.Component {
    constructor() {
        super();
        this.cb = {
            onRemove: (voiceID) => this.removeVoice(voiceID)
        }
    }
    render() {
        const voices = this.props.config.voices;

        // Presets are handled by composer
        return (
            <Div className="polyphony-instrument-renderer">

                <Div className="samples">
                    {voices.map((voiceData, voiceID) => {
                        const [className, config] = voiceData;
                        const {classRenderer: Renderer} = InstrumentLoader.getInstrumentClass(className);
                        return <Renderer
                            onRemove={this.cb.onRemove}
                            key={voiceID}
                            instrumentID={voiceID}
                            config={config}
                        />
                    })}
                </Div>
            </Div>
        );

    }

    /** Actions **/

    removeVoice(voiceID) {
        const voices = this.props.config.voices;
        if(typeof voices[voiceID] === "undefined")
            throw new Error("Voice ID not found: " + voiceID);
        voices.splice(voiceID, 1);
    }

    /** Menu **/

}

export default PolyphonyInstrumentRenderer;
