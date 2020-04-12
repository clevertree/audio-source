import React from 'react';

import {
    ButtonDropDown,
    Div, MenuAction, MenuBreak,
} from "../../../components";

import {InstrumentLoader, Library, MenuValues} from "../../../song";


import "./assets/PolyphonyInstrumentRenderer.css";

/** PolyphonyInstrumentRenderer **/
class PolyphonyInstrumentRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onRemove: (voiceID) => this.removeVoice(voiceID),
            onAction: (e) => this.addVoice()
        }
    }
    render() {
        const voices = this.props.config.voices;
//         console.log('voices', voices);
        // Presets are handled by composer
        return (
            <Div className="polyphony-instrument-renderer">
                <Div className="voices">
                    {voices.map((voiceData, voiceID) => {
                        const [className, config] = voiceData;
                        const {classRenderer: Renderer} = InstrumentLoader.getInstrumentClassInfo(className);
                        return <Renderer
                            onRemove={this.cb.onRemove}
                            key={voiceID}
                            instrumentID={voiceID}
                            config={config}
                        />
                    })}
                </Div>
                <ButtonDropDown
                    title="Add new voice"
                    className="add-voice"
                    arrow={false}
                    options={() => this.renderMenuAddVoice()}>
                    +
                </ButtonDropDown>
            </Div>
        );

    }

    /** Actions **/

    // TODO: Use Context Consumer/Provider for status/error callbacks
    setStatus(message) { console.info(this.constructor.name, 'setStatus', message); }
    setError(message) { console.error(this.constructor.name, 'setStatus', message); }

    wrapVoiceWithNewInstrument(voiceID) {

    }

    async addVoice(instrumentClassName, promptUser=true) {
        if (!instrumentClassName)
            throw new Error(`Invalid voice instrument class`);
        const {title} = InstrumentLoader.getInstrumentClassInfo(instrumentClassName);
        const instrumentConfig = {};
        // instrumentConfig = InstrumentLoader.createInstrumentConfig(instrumentClassName, instrumentConfig);
        // instrumentConfig.libraryURL = this.defaultLibraryURL;
        // instrumentConfig.name = instrumentConfig.name || instrumentURL.split('/').pop();

//         e.target.form.elements['instrumentURL'].value = '';
        if (promptUser === false || await new MenuValues().openConfirmDialog(`Add voice class '${title}' to Instrument?`)) {
            const newVoiceID = this.props.config.voices.length;
            this.props.config.voices[newVoiceID] = [instrumentClassName, instrumentConfig];
            this.setStatus(`Instrument '${instrumentClassName}' added as voice ${newVoiceID}`);

        } else {
            this.setError(`New voice canceled: ${instrumentClassName}`);
        }

    }

    renameVoice(voiceID, newTitle) {

    }

    removeVoice(voiceID) {
        const voices = this.props.config.voices;
        if(typeof voices[voiceID] === "undefined")
            throw new Error("Voice ID not found: " + voiceID);
        voices.splice(voiceID, 1);
    }

    /** Menu **/

    renderMenuAddVoice() {
        const library = Library.loadDefault();
        return (<>
            <MenuAction disabled action={()=>{}}>Add new voice instrument</MenuAction>
            <MenuBreak/>
            {library.renderMenuInstrumentAllPresets(([className, presetConfig]) => {
                this.addVoice(className, presetConfig);
            })}
        </>)
        // return new MenuValues().renderMenuSelectAvailableInstrument((instrumentClass) => {
        //     this.addVoice(instrumentClass);
        // }, "Add new instrument as voice")
    }
}

export default PolyphonyInstrumentRenderer;
