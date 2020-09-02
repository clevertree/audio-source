import React from 'react';

import {
    ASUIGlobalContext,
    ASUIMenuAction, ASUIMenuBreak, ASUIMenuItem,
} from "../../../components";

import {ProgramLoader, PromptManager} from "../../../common";
import PropTypes from "prop-types";

/** PolyphonyInstrumentRenderer **/
class PolyphonyInstrumentRendererBase extends React.Component {
    /** Property validation **/
    static propTypes = {
        parentMenu: PropTypes.func,
        setProps: PropTypes.func.isRequired,
    };

    /** Global Context **/
    static contextType = ASUIGlobalContext;
    getGlobalContext() { return this.context; }
    setStatus(message) { this.context.addLogEntry(message); }
    setError(message) { this.context.addLogEntry(message, 'error'); }
    // getViewMode(viewKey)        { this.context.getViewMode(viewKey); }
    // setViewMode(viewKey, mode)  { this.context.setViewMode(viewKey, mode); }

    constructor(props) {
        super(props);
        this.cb = {
            setProps: (programID, props) => this.setVoiceProps(programID, props),
            onRemove: (voiceID) => this.removeVoice(voiceID),
            onAction: (e) => this.addVoice()
        }
    }

    /** Actions **/

    setVoiceProps(programID, props) {
        const voiceProps = this.props.voiceProps || [];
        if(voiceProps[programID])   Object.assign(voiceProps[programID], props);
        else                        voiceProps[programID] = props;
        this.props.setProps(this.props.programID, {voiceProps});
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

    /** Render **/

    renderVoice(voiceID, voiceData) {
        const [className, config] = voiceData;
        const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);
        const voiceProps = this.props.voiceProps || [];
        const voiceProp = voiceProps[voiceID] || {};
        // console.log('voiceProps', voiceProps);
        return (//<div className="voice">
            <Renderer
                onRemove={this.cb.onRemove}
                key={voiceID}
                programID={voiceID}
                config={config}
                program={voiceData}
                setProps={this.cb.setProps}
                {...voiceProp}
            />);
        // </div>
    }

    /** Menu **/

    renderMenuAddVoice() {
        return (<>
            <ASUIMenuItem>Add another Voice</ASUIMenuItem>
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
