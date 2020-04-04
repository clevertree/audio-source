import React from 'react';

import {
    Div,
} from "../../../components";

import {InstrumentLoader} from "../../../song";


import "./assets/PolyphonyInstrumentRenderer.css";

/** PolyphonyInstrumentRenderer **/
class PolyphonyInstrumentRenderer extends React.Component {
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
                            key={voiceID}
                            instrumentID={voiceID}
                            config={config}
                        />
                    })}
                </Div>
            </Div>
        );

    }


}

export default PolyphonyInstrumentRenderer;
