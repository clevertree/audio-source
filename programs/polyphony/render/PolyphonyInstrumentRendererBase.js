import React from 'react';

import {
    ASUIMenuAction, ASUIMenuBreak, ASUIMenuItem,
} from "../../../components";

import ProgramLoader from "../../../common/program/ProgramLoader";
import PromptManager from "../../../common/prompt/PromptManager";

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
    setError(message) { console.warn(this.constructor.name, 'setStatus', message); }

    wrapVoiceWithNewInstrument(voiceID) {

    }

    async addVoicePrompt(instrumentClassName, instrumentConfig) {
        const {title} = ProgramLoader.getProgramClassInfo(instrumentClassName);
        if (await PromptManager.openConfirmDialog(`Add voice class '${title}' to this Instrument?`)) {
            this.addVoice(instrumentClassName, instrumentConfig);

        } else {
            this.setError(`New voice canceled: ${instrumentClassName}`);
        }

    }


    addVoice(instrumentClassName, instrumentConfig={}) {
        if (!instrumentClassName)
            throw new Error(`Invalid voice instrument class`);

        const newVoiceID = this.constructor.addChildProgramToConfig(this.props.config, instrumentClassName, instrumentConfig || {})
        this.setStatus(`Instrument '${instrumentClassName}' added as voice ${newVoiceID}`);
    }

    renameVoice(voiceID, newTitle) {

    }

    removeVoice(voiceID) {
        const voices = this.props.config.voices || []
        if(typeof voices[voiceID] === "undefined")
            throw new Error("Voice ID not found: " + voiceID);
        voices.splice(voiceID, 1);
    }

    /** Menu **/

    renderMenuAddVoice() {
        return (<>
            <ASUIMenuItem>Add voice instrument</ASUIMenuItem>
            <ASUIMenuBreak/>
            {ProgramLoader.getRegisteredPrograms().map(({className, title}, i) =>
                 <ASUIMenuAction key={i} onAction={() => this.addVoicePrompt(className)}>{title}</ASUIMenuAction>
            )}
        </>)
        // return Values.renderMenuSelectAvailableInstrument((instrumentClass) => {
        //     this.addVoice(instrumentClass);
        // }, "Add new program as voice")
    }

    /** Static **/

    static addChildProgramToConfig(config, childProgramClassName, childProgramConfig={}) {
        if(!config.voices)
            config.voices = [];
        const newVoiceID = config.voices.length;
        config.voices[newVoiceID] = [childProgramClassName, childProgramConfig||{}];
        return newVoiceID;
    }
}

export default PolyphonyInstrumentRendererBase;
