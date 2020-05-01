import React from 'react';

import {
    ASUIButtonDropDown,
    ASUIDiv, ASUIMenuAction, ASUIMenuBreak,
} from "../../../../components";

import {ProgramLoader, Library, Values} from "../../../../song";


import PolyphonyInstrumentRendererStyle from "./PolyphonyInstrumentRendererStyle";

/** PolyphonyInstrumentRenderer **/
class PolyphonyInstrumentRenderer extends PolyphonyInstrumentRendererStyle {
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
            <ASUIDiv className="polyphony-instrument-renderer">
                <ASUIDiv className="voices">
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
                </ASUIDiv>
                <ASUIButtonDropDown
                    title="Add new voice"
                    className="add-voice"
                    arrow={false}
                    options={() => this.renderMenuAddVoice()}>
                    +
                </ASUIButtonDropDown>
            </ASUIDiv>
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
        const {title} = ProgramLoader.getProgramClassInfo(instrumentClassName);
        const instrumentConfig = {};
        // instrumentConfig = InstrumentLoader.createInstrumentConfig(instrumentClassName, instrumentConfig);
        // instrumentConfig.libraryURL = this.defaultLibraryURL;
        // instrumentConfig.name = instrumentConfig.name || instrumentURL.split('/').pop();

//         e.target.form.elements['instrumentURL'].value = '';
        if (promptUser === false || await Values.openConfirmDialog(`Add voice class '${title}' to Instrument?`)) {
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
            <ASUIMenuAction disabled action={()=>{}}>Add new voice instrument</ASUIMenuAction>
            <ASUIMenuBreak/>
            {library.songLengthAllPresets(([className, presetConfig]) => {
                this.addVoice(className, presetConfig);
            })}
        </>)
        // return Values.renderMenuSelectAvailableInstrument((instrumentClass) => {
        //     this.addVoice(instrumentClass);
        // }, "Add new program as voice")
    }
}

export default PolyphonyInstrumentRenderer;
