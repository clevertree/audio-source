import React from 'react';
import {
    ASUIMenuAction,
    ASUIMenuBreak,
    ASUIInputRange,
    ASUIMenuDropDown, ASUIIcon,
    ASUIClickableDropDown
} from "../../../../components";
import {LibraryIterator} from "../../../../song";
import {Values} from "../../../../common";

import AudioBufferInstrumentRendererContainer from "./container/AudioBufferInstrumentRendererContainer";
import EnvelopeEffectRendererContainer from "../../../effect/envelope/render/container/EnvelopeEffectRendererContainer";


class AudioBufferInstrumentRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onClick: e => this.toggleOpen(),
            renderMenuRoot: () => this.renderMenuRoot(),
            parameterMenu: {
                mixer:      () => this.renderMenuChange('mixer'),
                detune:     () => this.renderMenuChange('detune'),
                root:      () => this.renderMenuChange('root'),
                alias:    () => this.renderMenuChange('alias'),
                range:    () => this.renderMenuChange('range'),
            }
        };
    }


    componentDidUpdate(prevProps, prevState, snapshot) {
        if(!this.props.config.url) {
            console.warn("No default AudioBuffer was set");
            // this.props.config.type = 'sawtooth';
        }
    }

    getTitle() {
        return this.props.config.title
            || (this.props.config.url
                ? this.props.config.url.split('/').pop()
                : "Empty Buffer")
    }


    render() {
        let title = this.getTitle();
        const config = this.props.config;

        return <AudioBufferInstrumentRendererContainer
            onClick={this.cb.onClick}
            renderMenuRoot={this.cb.renderMenuRoot}
            config={this.props.config}
            parameters={[
                {
                    paramName:  'mixer',
                    title:      'Edit Mixer Amplitude',
                    children:   typeof config.mixer !== "undefined" ? config.mixer+'%' : '100%',
                    options:    this.cb.parameterMenu.mixer
                },
                {
                    paramName:  'detune',
                    title:      `Detune by ${config.detune} cents`,
                    children:   typeof config.detune !== "undefined" ? config.detune+'c' : '0c',
                    options:    this.cb.parameterMenu.detune
                },
                {
                    paramName:  'root',
                    title:      `Key Root is ${config.root}`,
                    children:   config.root ? config.root : "-",
                    options:    this.cb.parameterMenu.root
                },
                {
                    paramName:  'alias',
                    title:      `Key Alias is ${config.alias}`,
                    children:   config.alias ? config.alias : "-",
                    options:    this.cb.parameterMenu.alias
                },
                {
                    paramName:  'range',
                    title:      `Key Range is ${config.range}`,
                    children:   config.range ? config.range : "-",
                    options:    this.cb.parameterMenu.range
                },
            ]}
            title={title}
            >
        </AudioBufferInstrumentRendererContainer>;
    }



    /** Actions **/

    toggleOpen() {
        const config = this.props.config;
        if(config.open)
            delete config.open;
        else
            config.open = true;
    }

    changeMixer(newMixerValue) {
        if(!Number.isInteger(newMixerValue))
            throw new Error("Invalid mixer value type: " + typeof newMixerValue);
        this.props.config.mixer = newMixerValue;
    }

    changeDetune(newDetuneValue) {
        if(!Number.isInteger(newDetuneValue))
            throw new Error("Invalid detune value type: " + typeof newDetuneValue);
        this.props.config.detune = newDetuneValue;
    }

    changeRoot(newRootValue) {
        this.props.config.root = newRootValue;
    }

    changeAlias(newAliasValue) {
        this.props.config.alias = newAliasValue;
    }


    changeAudioBuffer(newType) {
        if(newType === 'custom') {
        } else {
            delete this.props.config.url;
            delete this.props.config.real;
            delete this.props.config.imag;
            delete this.props.config.title;
            this.props.config.type = newType;
        }
    }

    // changeLoop(newLoopValue=null) {
    //     if(newLoopValue === null)
    //         newLoopValue = !this.props.config.loop;
    //     this.props.config.loop = newLoopValue?1:0;
    // }

    loadPreset(className, presetConfig) {
        if(className !== this.props.program[0])
            throw new Error(`This preset is for class ${className}, not ${this.props.program[0]}`);
        if(!presetConfig.type)
            presetConfig.type = 'custom';
        this.props.program[1] = presetConfig;
        console.log("Loaded preset: ", presetConfig);
    }

    /** Menus **/

    renderMenuRoot() {
        return (<>
            <ASUIMenuAction onAction={()=>{}} disabled>{`AudioBuffer: ${this.getTitle()}`}</ASUIMenuAction>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuChangeAudioBuffer()}>Change AudioBuffer</ASUIMenuDropDown>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuChangeMixer()}>Edit Mixer</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeDetune()}>Edit Detune</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeKeyRoot()}>Edit Key Root</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeKeyAlias()}>Edit Key Alias</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeKeyRange()}>Edit Key Range</ASUIMenuDropDown>
            {/*<ASUIMenuDropDown options={() => this.renderMenuChangeLoop()}>Toggle Loop</ASUIMenuDropDown>*/}
            <ASUIMenuAction disabled={!this.props.onRemove} onAction={(e) => this.props.onRemove(this.props.instrumentID)}>Remove AudioBuffer</ASUIMenuAction>
        </>);
    }

    async renderMenuChangeAudioBuffer() {

        const library = LibraryIterator.loadDefault();
        return (<>
            <ASUIMenuDropDown options={() => this.renderMenuChangeAudioBufferStandard()}>Standard</ASUIMenuDropDown>
            {/*<MenuDropDown options={() => this.renderMenuChangeAudioBuffer('custom')}>Custom</MenuDropDown>*/}
            <ASUIMenuBreak/>
            {await library.renderMenuProgramAllPresets((className, presetConfig) => {
                this.loadPreset(className, presetConfig);
            }, this.props.program[0])}
        </>);
    }

    renderMenuChangeAudioBufferStandard() {
        return (<>
            <ASUIMenuAction onAction={e => this.changeAudioBuffer('sine')}>Sine</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.changeAudioBuffer('square')}>Square</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.changeAudioBuffer('sawtooth')}>Sawtooth</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.changeAudioBuffer('triangle')}>Triangle</ASUIMenuAction>
        </>);
    }



    renderMenuChangeMixer() {
        const config = this.props.config;
        return <ASUIInputRange
            min={0}
            max={100}
            value={typeof config.mixer !== "undefined" ? config.mixer : 100}
            onChange={(mixerValue) => this.changeMixer(mixerValue)}
        />;
    }

    renderMenuChangeDetune() {
        const config = this.props.config;
        return ( <ASUIInputRange
            min={-1000}
            max={1000}
            value={typeof config.detune !== "undefined" ? config.detune : 100}
            onChange={(detuneValue) => this.changeDetune(detuneValue)}
        />);
    }

    renderMenuChangeKeyRoot() {
        return new Values().renderMenuSelectCommand(noteNameOctave => {
            this.changeRoot(noteNameOctave)
        });
    }

    renderMenuChangeKeyAlias() {
        return new Values().renderMenuSelectCommand(noteNameOctave => {
            this.changeAlias(noteNameOctave)
        });
    }


    renderMenuChangeKeyRange() {
        return (<>TODO</>);
    }

    // renderMenuChangeLoop() {
    //     return (<>TODO</>);
    // }
}

export default AudioBufferInstrumentRenderer;
