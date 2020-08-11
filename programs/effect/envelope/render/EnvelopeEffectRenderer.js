import React from 'react';

import {
    ASUIButtonDropDown,
    ASUIInputRange, ASUIMenuAction, ASUIMenuBreak, ASUIMenuDropDown, ASUIMenuItem
} from "../../../../components";
import {ASUILogContext, ProgramLoader, PromptManager} from "../../../../common/";

import EnvelopeEffectRendererContainer from "./container/EnvelopeEffectRendererContainer";

export default class EnvelopeEffectRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onClick: e => this.toggleOpen(),
            renderMenuRoot: () => this.renderMenuRoot(),
            renderMenuAddVoice: () => this.renderMenuAddVoice(),
            // renderMenuChange: (paramName) => this.renderMenuChange(paramName),
            parameterMenu: {
                mixer: () => this.renderMenuChange('mixer'),
                attack: () => this.renderMenuChange('attack'),
                hold: () => this.renderMenuChange('hold'),
                delay: () => this.renderMenuChange('delay'),
                sustain: () => this.renderMenuChange('sustain'),
                release: () => this.renderMenuChange('release'),
            },
            changeParam: {
                mixer:      (newValue) => this.changeParam('mixer', newValue),
                attack:     (newValue) => this.changeParam('attack', newValue),
                hold:       (newValue) => this.changeParam('hold', newValue),
                delay:      (newValue) => this.changeParam('delay', newValue),
                sustain:    (newValue) => this.changeParam('sustain', newValue),
                release:    (newValue) => this.changeParam('release', newValue),
            },
        };
    }


    render() {
        return <EnvelopeEffectRendererContainer
            onClick={this.cb.onClick}
            renderMenuRoot={this.cb.renderMenuRoot}
            config={this.props.config}
            parameters={[
                {
                    label:      'Mixer',
                    title:      'Edit Volume Mixer',
                    children:   this.renderInput('mixer'),
                },
                {
                    label:      'Attack',
                    title:      'Edit Envelope Attack',
                    children:   this.renderInput('attack'),
                },
                {
                    label:      'Hold',
                    title:      'Edit Envelope Hold',
                    children:   this.renderInput('hold'),
                },
                {
                    label:      'Delay',
                    title:      'Edit Envelope Delay',
                    children:   this.renderInput('delay'),
                },
                {
                    label:      'Sustain',
                    title:      'Edit Envelope Sustain',
                    children:   this.renderInput('sustain'),
                },
                {
                    label:      'Release',
                    title:      'Edit Envelope Release',
                    children:   this.renderInput('release'),
                },
            ]}
            voice={this.renderVoice()}
            />;
    }

    renderVoice() {
        const voice = this.props.config.voice;
        if(!voice) {
            return <ASUIButtonDropDown
                title="Add voice"
                className="add-voice"
                arrow={false}
                options={this.cb.renderMenuAddVoice}>
                Set Voice
            </ASUIButtonDropDown>;
        }

        const [className, config] = voice;
        const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);

        return <Renderer
            onRemove={this.cb.onRemove}
            instrumentID={0}
            config={config}
            program={voice}
        />;
    }


    /** Inputs **/

    renderInput(paramName) {
        const config = this.props.config;
        switch(paramName) {
            default:
                const value = typeof config[paramName] !== "undefined" ? config[paramName] : 100;
                return <ASUIInputRange
                    // className="small"
                    min={0}
                    max={100}
                    value={value}
                    children={`${value}%`}
                    onChange={this.cb.changeParam[paramName]}
                />;

        }
    }




    /** Actions **/

    toggleOpen() {
        const config = this.props.config;
        if(config.open)
            delete config.open;
        else
            config.open = true;
    }

    changeParam(paramName, newValue) {
        this.props.config[paramName] = newValue;
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

        const config = this.props.config;
        config.voice = [instrumentClassName, instrumentConfig || {}];
        this.setStatus(`Instrument '${instrumentClassName}' set as voice`);
    }


    removeVoice() {
        const config = this.props.config;
        config.voice = null;
    }

    /** Menu **/

    renderMenuRoot() {
        const config = this.props.config;
        return (<>
            <ASUIMenuAction onAction={()=>{}} disabled>{`Envelope Effect`}</ASUIMenuAction>
            <ASUIMenuBreak />
            {!config.voice
                ? <ASUIMenuDropDown options={() => this.renderMenuAddVoice()}>Add Voice</ASUIMenuDropDown>
                : <ASUIMenuAction onAction={() => this.removeVoice()}>Remove Voice</ASUIMenuAction>}
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuChange('mixer')}>Edit Mixer</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChange('attack')}>Edit Attack</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChange('hold')}>Edit Hold</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChange('delay')}>Edit Delay</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChange('sustain')}>Edit Sustain</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChange('release')}>Edit Release</ASUIMenuDropDown>
            {/*<ASUIMenuDropDown options={() => this.renderMenuChangeLoop()}>Toggle Loop</ASUIMenuDropDown>*/}
            <ASUIMenuAction disabled={!this.props.onRemove} onAction={(e) => this.props.onRemove(this.props.instrumentID)}>Remove Envelope</ASUIMenuAction>
        </>);
    }

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


    renderMenuChange(paramName) {
        const config = this.props.config;
        const value = config[paramName];
        return <ASUIInputRange
            min={0}
            max={100}
            value={typeof value !== "undefined" ? value : 100}
            onChange={(mixerValue) => this.changeParam(mixerValue)}
        />;
    }

    /** Menu Context **/
    static contextType = ASUILogContext;

    setStatus(message) { this.context && this.context.addLogEntry(message); }
    setError(message) { this.context && this.context.addLogEntry(message, 'error'); }
}
