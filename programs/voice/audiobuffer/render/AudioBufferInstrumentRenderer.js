import React from 'react';
import {
    ASUIMenuAction,
    ASUIMenuBreak,
    ASUIInputRange,
    ASUIMenuDropDown, ASUIButtonDropDown
} from "../../../../components";
import {LibraryIterator} from "../../../../song";
import {Values} from "../../../../common";

import AudioBufferInstrumentRendererContainer from "./container/AudioBufferInstrumentRendererContainer";


class AudioBufferInstrumentRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onClick: e => this.toggleOpen(),
            renderMenu: {
                root: () => this.renderMenuRoot(),
            },
            renderParamMenu: {
                root: () => this.renderMenuChangeKeyRoot(),
                alias: () => this.renderMenuChangeKeyAlias(),
                range: () => this.renderMenuChangeKeyRange(),
                source: () => this.renderMenuChangeAudioBuffer(),
            },
            changeParam: {
                mixer:    (newValue) => this.changeParam('mixer', newValue),
                detune:   (newValue) => this.changeParam('detune', newValue),
            },
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

        const parameters = [
            {
                label:      'URL',
                title:      'Edit Sample',
                children:   this.renderInput('source'),
            },
            {
                label:      'Mixer',
                title:      'Edit Mixer Amplitude',
                children:   this.renderInput('mixer'),
            },
            {
                label:      'Detune',
                title:      `Detune by ${config.detune} cents`,
                children:   this.renderInput('detune'),
            },
            {
                label:      'Root',
                title:      `Key Root is ${config.root}`,
                children:   this.renderInput('root'),
            },
            {
                label:      'Alias',
                title:      `Key Alias is ${config.alias}`,
                children:   this.renderInput('alias'),
            },
            {
                label:      'Range',
                title:      `Key Range is ${config.range}`,
                children:   this.renderInput('range'),
            },
        ];

        return <AudioBufferInstrumentRendererContainer
            onClick={this.cb.onClick}
            renderMenuRoot={this.cb.renderMenu.root}
            config={this.props.config}
            parameters={parameters}
            title={title}
            >
        </AudioBufferInstrumentRendererContainer>;
    }


    /** Inputs **/

    renderInput(paramName) {
        let value;
        const config = this.props.config;
        switch(paramName) {
            case 'source':
                let source = "N/A";
                // if(config.type)
                //     source = config.type;
                if(config.url)
                    source = config.url.split('/').pop();
                if(source && source.length > 16)
                    source = '...' + source.substr(-16);
                return <ASUIButtonDropDown
                    className="small"
                    options={this.cb.renderParamMenu.source}
                >{source}</ASUIButtonDropDown>


            case 'mixer':
                value = typeof config.mixer !== "undefined" ? config.mixer : 100;
                return <ASUIInputRange
                    className="small"
                    min={0}
                    max={100}
                    value={value}
                    children={`${value}%`}
                    onChange={this.cb.changeParam.mixer}
                />;

            case 'detune':
                value = typeof config.detune !== "undefined" ? config.detune : 0;
                return <ASUIInputRange
                    className="small"
                    min={-1000}
                    max={1000}
                    value={value}
                    children={`${value}c`}
                    onChange={this.cb.changeParam.detune}
                />

            case 'root':
                return <ASUIButtonDropDown
                    className="small"
                    options={this.cb.renderParamMenu.root}
                >{config.root ? config.root : "No Key Root"}</ASUIButtonDropDown>

            case 'alias':
                return <ASUIButtonDropDown
                    className="small"
                    options={this.cb.renderParamMenu.alias}
                >{config.alias ? config.alias : "-"}</ASUIButtonDropDown>

            case 'range':
                return <ASUIButtonDropDown
                    className="small"
                    options={this.cb.renderParamMenu.range}
                >{config.range ? config.range : "-"}</ASUIButtonDropDown>

            default:
                return 'Unknown';
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
            <ASUIMenuDropDown options={() => this.renderInput('mixer')}>Edit Mixer</ASUIMenuDropDown>
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
