import React from 'react';

import {
    ASUIMenuAction, ASUIMenuBreak, ASUIMenuItem,
} from "../../../../components";

import {ProgramLoader, PromptManager} from "../../../../common";

/** PolyphonyInstrumentRenderer **/
class EnvelopeEffectRendererBase extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onRemove: (voiceID) => this.removeVoice(voiceID),
            onAction: (e) => this.setVoice()
        }
        // console.log(this.constructor.name, this.props);
    }

    /** Actions **/

    // TODO: Use Context Consumer/Provider for status/error callbacks
    setStatus(message) { console.info(this.constructor.name, 'setStatus', message); }
    setError(message) { console.warn(this.constructor.name, 'setStatus', message); }


    async setVoicePrompt(instrumentClassName, instrumentConfig) {
        const {title} = ProgramLoader.getProgramClassInfo(instrumentClassName);
        if (await PromptManager.openConfirmDialog(`Add voice class '${title}' to this Instrument?`)) {
            this.setVoice(instrumentClassName, instrumentConfig);

        } else {
            this.setError(`New voice canceled: ${instrumentClassName}`);
        }

    }


    setVoice(instrumentClassName, instrumentConfig={}) {
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

    renderMenuSetVoice() {
        return (<>
            <ASUIMenuItem>Add voice instrument</ASUIMenuItem>
            <ASUIMenuBreak/>
            {ProgramLoader.getRegisteredPrograms().map(({className, title}, i) =>
                 <ASUIMenuAction key={i} onAction={() => this.setVoicePrompt(className)}>{title}</ASUIMenuAction>
            )}
        </>)
        // return Values.renderMenuSelectAvailableInstrument((instrumentClass) => {
        //     this.setVoice(instrumentClass);
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

export default EnvelopeEffectRendererBase;
