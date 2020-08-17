import React from 'react';
import {
    ASUIMenuAction,
    ASUIMenuBreak,
    ASUIInputRange,
    ASUIMenuDropDown, ASUIButtonDropDown, ASUIMenuItem
} from "../../../../components";
import {LibraryProcessor, ProgramLoader} from "../../../../song";
import {Values} from "../../../../common";

import AudioBufferInstrumentRendererContainer from "./container/AudioBufferInstrumentRendererContainer";


class AudioBufferInstrumentRenderer extends React.Component {
    static fileRegex = /\.wav$/i;

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
                // mixer:    (newValue) => this.changeParam('mixer', newValue),
                detune:   (newValue) => this.changeParam('detune', newValue),
            },
        };
        this.library = LibraryProcessor.loadDefault();
    }


    componentDidUpdate(prevProps, prevState, snapshot) {
        if(!this.props.config.url) {
            // console.log("No default AudioBuffer was set");
            // this.props.config.type = 'sawtooth';
        }
    }

    getTitle() {
        return this.props.config.title
            || (this.props.config.url
                ? getNameFromURL(this.props.config.url)
                : "empty buffer")
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
            // {
            //     label:      'Mixer',
            //     title:      'Edit Mixer Amplitude',
            //     children:   this.renderInput('mixer'),
            // },
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

        let lfos = [];
        if(config.lfos) {
            lfos = config.lfos.map((lfo, i) => {
                const [className, config] = lfo;
                const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);

                return <Renderer
                    key={i}
                    onRemove={this.cb.onRemove}
                    instrumentID={i}
                    config={config}
                    program={lfo}
                    parameters={this.constructor.sourceParameters}
                />;

            })
        }

        const envelopeProgram = config.envelope;
        let envelope;
        if(envelopeProgram) {
            const [className, config] = envelopeProgram;
            const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);
            envelope = <Renderer
                config={config}
                program={envelopeProgram}
                parameters={this.constructor.sourceParameters}
            />;
        }

        return <AudioBufferInstrumentRendererContainer
            onClick={this.cb.onClick}
            renderMenuRoot={this.cb.renderMenu.root}
            config={this.props.config}
            parameters={parameters}
            envelope={envelope}
            lfos={lfos}
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
                    source = getNameFromURL(config.url); // .split('/').pop();
                if(source && source.length > 16)
                    source = source.substr(0, 16) + '...';
                return <ASUIButtonDropDown
                    className="small"
                    options={this.cb.renderParamMenu.source}
                >{source}</ASUIButtonDropDown>


            // case 'mixer':
            //     value = typeof config.mixer !== "undefined" ? config.mixer : 100;
            //     return [
            //             <ASUIInputRange
            //                 className="small"
            //                 min={0}
            //                 max={100}
            //                 value={value}
            //                 children={`${value}%`}
            //                 onChange={this.cb.changeParam.mixer}
            //             />,
            //             <ASUIMenuAction onAction={() => true} >OK</ASUIMenuAction>
            //         ];

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
                >{config.root ? config.root : "-"}</ASUIButtonDropDown>

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


    changeAudioBuffer(newType, url) {
        if(newType === 'custom') {
            this.props.config.url = url;
        } else {
            delete this.props.config.url;
            delete this.props.config.real;
            delete this.props.config.imag;
            delete this.props.config.title;
        }
        this.props.config.type = newType;
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
            {/*<ASUIMenuDropDown options={() => this.renderInput('mixer')}>Edit Mixer</ASUIMenuDropDown>*/}
            <ASUIMenuDropDown options={() => this.renderMenuChangeDetune()}>Edit Detune</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeKeyRoot()}>Edit Key Root</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeKeyAlias()}>Edit Key Alias</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeKeyRange()}>Edit Key Range</ASUIMenuDropDown>
            {/*<ASUIMenuDropDown options={() => this.renderMenuChangeLoop()}>Toggle Loop</ASUIMenuDropDown>*/}
            <ASUIMenuAction disabled={!this.props.onRemove} onAction={(e) => this.props.onRemove(this.props.instrumentID)}>Remove AudioBuffer</ASUIMenuAction>
        </>);
    }

    renderMenuChangeAudioBuffer() {

        return (<>
            <ASUIMenuDropDown options={() => this.renderMenuChangeAudioBufferStandard()}>Standard</ASUIMenuDropDown>
            {/*<ASUIMenuDropDown options={() => this.renderMenuChangeAudioBufferCustom()}>Custom</ASUIMenuDropDown>*/}
            {/*<MenuDropDown options={() => this.renderMenuChangeAudioBuffer('custom')}>Custom</MenuDropDown>*/}
            {this.renderMenuChangeAudioBufferCustom(this.library)}
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

    renderMenuChangeAudioBufferCustom(library=this.library) {
        const libraries = library.renderMenuLibraryOptions((library) =>
            this.renderMenuChangeAudioBufferCustom(library)
        );
        const samples = library.renderMenuSamples((sampleURL) =>
            this.changeAudioBuffer('custom', sampleURL),
        AudioBufferInstrumentRenderer.fileRegex);
        const content = [];
        if(samples) {
            content.push(<>
                <ASUIMenuBreak/>
                <ASUIMenuItem>{library.getTitle()}</ASUIMenuItem>
                <ASUIMenuBreak/>
                {samples}
            </>)
        }
        if(libraries) {
            content.push(<>
                <ASUIMenuBreak/>
                {libraries}
            </>)
        }
        return content.length === 0 ? <ASUIMenuItem>No Samples</ASUIMenuItem> : content;
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

function getNameFromURL(url) { return url.split('/').pop().replace('.wav', ''); }
