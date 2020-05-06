import React from 'react';

import {
    ASUIMenuAction, ASUIMenuBreak,
} from "../../../../components";

import ProgramLoader from "../../../../common/program/ProgramLoader";
import Library from "../../../../song/library/Library";
import PromptManager from "../../../../common/prompt/PromptManager";

/** PolyphonyInstrumentRenderer **/
class PolyphonyInstrumentRendererBase extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onRemove: (voiceID) => this.removeVoice(voiceID),
            onAction: (e) => this.addVoice()
        }
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
        if (promptUser === false || await PromptManager.openConfirmDialog(`Add voice class '${title}' to Instrument?`)) {
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

export default PolyphonyInstrumentRendererBase;
