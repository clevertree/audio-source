import React from 'react';

import {
    ASUIInputRange, ASUIMenuAction, ASUIMenuBreak, ASUIMenuDropDown, ASUIMenuItem
} from "../../../../components";
import {ASUILogContext, ProgramLoader, PromptManager} from "../../../../common/";

import EnvelopeEffectRendererContainer from "./container/EnvelopeEffectRendererContainer";
import PropTypes from "prop-types";

export default class EnvelopeEffectRenderer extends React.Component {
    /** Property validation **/
    static propTypes = {
        parentMenu: PropTypes.func,
    };

    /** Formatting Callbacks **/
    static formats = {
        ms: value => `${value}ms`
    }


    constructor(props) {
        super(props);
        this.cb = {
            onClick: e => this.toggleOpen(),
            renderMenuRoot: () => this.renderMenuRoot(),
            renderMenuAddVoice: () => this.renderMenuAddVoice(),
            // renderMenuChange: (paramName) => this.renderMenuChange(paramName),
            parameterMenu: {
                // mixer: () => this.renderMenuChange('mixer'),
                attack: () => this.renderMenuChange('attack'),
                hold: () => this.renderMenuChange('hold'),
                decay: () => this.renderMenuChange('decay'),
                sustain: () => this.renderMenuChange('sustain'),
                release: () => this.renderMenuChange('release'),
            },
            changeParam: {
                // mixer:      (newValue) => this.changeParam('mixer', newValue),
                attack:     (newValue) => this.changeParam('attack', newValue),
                // hold:       (newValue) => this.changeParam('hold', newValue),
                decay:      (newValue) => this.changeParam('decay', newValue),
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
                // {
                //     label:      'Mixer',
                //     title:      'Edit Volume Mixer',
                //     children:   this.renderInput('mixer'),
                // },
                {
                    label:      'Attack',
                    title:      'How quickly the sound reaches full volume after the initial note',
                    children:   this.renderInput('attack'),
                },
                // {
                //     label:      'Hold',
                //     title:      'Edit Envelope Hold',
                //     children:   this.renderInput('hold'),
                // },
                {
                    label:      'Decay',
                    title:      'How quickly the sound drops to the sustain level after the initial peak',
                    children:   this.renderInput('decay'),
                },
                {
                    label:      'Sustain',
                    title:      'The “constant” volume that the sound takes after decay until the note is released',
                    children:   this.renderInput('sustain'),
                },
                {
                    label:      'Release',
                    title:      'How quickly the sound fades when a note ends',
                    children:   this.renderInput('release'),
                },
            ]}
            // voice={this.renderVoice()}
            />;
    }

    // renderVoice() {
    //     const voice = this.props.config.voice;
    //     if(!voice) {
    //         return <ASUIButtonDropDown
    //             title="Add voice"
    //             className="add-voice"
    //             arrow={false}
    //             options={this.cb.renderMenuAddVoice}>
    //             Set Voice
    //         </ASUIButtonDropDown>;
    //     }
    //
    //     const [className, config] = voice;
    //     const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);
    //
    //     return <Renderer
    //         onRemove={this.cb.onRemove}
    //         instrumentID={0}
    //         config={config}
    //         program={voice}
    //     />;
    // }


    /** Inputs **/

    renderInput(paramName) {
        const config = this.props.config;
        const value = typeof config[paramName] !== "undefined" ? config[paramName] : null;
        switch(paramName) {
            case 'attack': // How quickly the sound reaches full volume after the sound
            case 'hold':
            case 'decay':   // How quickly the sound drops to the sustain level after the initial peak.
            case 'release': // How quickly the sound fades when a note ends (the key is released). Often, this time is very short. An example where the release is longer might be a percussion instrument like a glockenspiel, or a piano with the sustain pedal pressed.
                const timeValue = value || 0;
                return <ASUIInputRange
                    // className="small"
                    min={0}
                    max={4000}
                    value={timeValue}
                    format={EnvelopeEffectRenderer.formats.ms}
                    onChange={this.cb.changeParam[paramName]}
                />;

            case 'sustain': // The “constant” volume that the sound takes after decay until the note is released. Note that this parameter specifies a volume level rather than a time period.
            default:
                const mixerValue = value || 100;
                return <ASUIInputRange
                    // className="small"
                    min={0}
                    max={100}
                    value={mixerValue}
                    format={ASUIInputRange.formats.percent}
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
            {/*<ASUIMenuDropDown options={() => this.renderMenuChange('mixer')}>Edit Mixer</ASUIMenuDropDown>*/}
            <ASUIMenuDropDown options={() => this.renderMenuChange('attack')}>Edit Attack</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChange('hold')}>Edit Hold</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChange('decay')}>Edit Decay</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChange('sustain')}>Edit Sustain</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChange('release')}>Edit Release</ASUIMenuDropDown>
            {this.props.parentMenu ? <>
                <ASUIMenuBreak />
                {this.props.parentMenu(this.props.programID)}
            </> : null}
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
