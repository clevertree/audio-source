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
import PropTypes from "prop-types";


class AudioBufferInstrumentRenderer extends React.Component {
    /** Property validation **/
    static propTypes = {
        parentMenu: PropTypes.func,
    };

    /** Automation Parameters **/
    static sourceParameters = {
        playbackRate: "Playback Rate",
        detune: "Detune",
    };

    /** Formatting Callbacks **/
    static formats = {
        cents: value => `${value}c`
    }

    static fileRegex = /\.wav$/i;

    constructor(props) {
        super(props);
        this.cb = {
            onClick: e => this.toggleOpen(),
            renderLFOMenu: lfoID => this.renderLFOMenu(lfoID),
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
                    parentMenu={this.cb.renderLFOMenu}
                    config={config}
                    programID={i}
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
                    // className="small"
                    min={-1000}
                    max={1000}
                    value={value}
                    format={AudioBufferInstrumentRenderer.formats.cents}
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
                let range = '[all]';
                if(config.rangeStart || config.rangeEnd)
                    range = `${config.rangeStart||'[low]'} to ${config.rangeEnd||'[high]'}`;
                return <ASUIButtonDropDown
                    className="small"
                    options={this.cb.renderParamMenu.range}
                >{range}</ASUIButtonDropDown>

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
        const oldValue = this.props.config[paramName];
        console.log(`Changing parameter ${paramName}: ${newValue} [Old: ${oldValue}]`);
        this.props.config[paramName] = newValue;
    }

    removeParam(paramName) {
        const oldValue = this.props.config[paramName];
        console.log(`Removing parameter ${paramName}: ${oldValue}`);
        delete this.props.config[paramName];
    }


    changeSampleURL(url) {
        this.props.config.url = url;
    }

    /** LFO Actions **/

    addLFO(parameterName) {
        const lfos = this.props.config.lfos || [];
        lfos.push(['LFO', {
            parameter: parameterName
        }])
        this.props.config.lfos = lfos;
    }

    removeLFO(lfoID) {
        const lfos = this.props.config.lfos;
        if(!lfos[lfoID])
            throw new Error("LFO not found: " + lfoID);
        lfos.splice(lfoID, 1);
        this.props.config.lfos = lfos;
    }

    // changeLoop(newLoopValue=null) {
    //     if(newLoopValue === null)
    //         newLoopValue = !this.props.config.loop;
    //     this.props.config.loop = newLoopValue?1:0;
    // }


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

            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuAddLFO()}>Add LFO</ASUIMenuDropDown>

            {/*<ASUIMenuDropDown options={() => this.renderMenuChangeLoop()}>Toggle Loop</ASUIMenuDropDown>*/}
            {this.props.parentMenu ? <>
                <ASUIMenuBreak />
                {this.props.parentMenu(this.props.programID)}
            </> : null}
        </>);
    }

    renderMenuChangeAudioBuffer() {
        const recentSamples = LibraryProcessor.renderMenuRecentSamples(
            sampleURL => this.changeSampleURL(sampleURL),
            AudioBufferInstrumentRenderer.fileRegex
        )
        return (
            <>
                <ASUIMenuItem>Select New Sample</ASUIMenuItem>
                <ASUIMenuBreak />
                {this.renderMenuChangeAudioBufferWithLibrary(this.library)}
                {recentSamples ? <>
                    <ASUIMenuBreak />
                    <ASUIMenuItem>Recent Samples</ASUIMenuItem>
                    {recentSamples}
                </> : null}
            </>
        );
    }


    renderMenuChangeAudioBufferWithLibrary(library) {
        const libraries = library.renderMenuLibraryOptions((library) =>
            this.renderMenuChangeAudioBufferWithLibrary(library)
        );
        const samples = library.renderMenuSamples(
            (sampleURL) => this.changeSampleURL(sampleURL),
            AudioBufferInstrumentRenderer.fileRegex);
        let content = [];
        if(libraries) {
            content = content.concat(libraries);
        }
        if(samples) {
            if(content.length > 0)
                content.push(<ASUIMenuBreak key="break-section"/>);
            content.push(<ASUIMenuItem>{library.getTitle()}</ASUIMenuItem>);
            content.push(<ASUIMenuBreak key="break-samples"/>);
            content = content.concat(samples);
        }
        return content.length === 0 ? <ASUIMenuItem>No Samples</ASUIMenuItem> : content;
    }

    renderMenuChangeDetune() {
        return (<>
            {this.renderInput('detune')}
            <ASUIMenuAction onAction={() => true}>- Close -</ASUIMenuAction>
            <ASUIMenuBreak/>I
            <ASUIMenuAction onAction={() => this.removeParam('detune')}>Clear Detune</ASUIMenuAction>
        </>);
    }

    renderMenuChangeKeyRoot() {
        return (<>
            {new Values().renderMenuSelectFrequency(noteNameOctave => {
                this.changeParam('root', noteNameOctave)
            }, this.props.config.root, "Change Root Key")}
            <ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => this.removeParam('root')}>Clear Root</ASUIMenuAction>
        </>);
    }
    renderMenuChangeKeyAlias() {
        return (<>
            {new Values().renderMenuSelectFrequency(noteNameOctave => {
                this.changeParam('alias', noteNameOctave)
            }, this.props.config.alias, "Change Alias")}
            <ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => this.removeParam('alias')}>Clear Alias</ASUIMenuAction>
        </>);
    }


    renderMenuChangeKeyRange() {
        let i=0;
        return [
            <ASUIMenuDropDown key={i++} options={() => this.renderMenuChangeKeyRangeStart()}>Range Start</ASUIMenuDropDown>,
            <ASUIMenuDropDown key={i++} options={() => this.renderMenuChangeKeyRangeEnd()}>Range End</ASUIMenuDropDown>,
            <ASUIMenuBreak key={i++} />,
            <ASUIMenuAction  key={i++} onAction={() => {
                this.removeParam('rangeStart');
                this.removeParam('rangeEnd');
            }}>Clear Range</ASUIMenuAction>,
        ];
    }
    renderMenuChangeKeyRangeStart() {
        return (<>
            {new Values().renderMenuSelectFrequency(noteNameOctave => {
                this.changeParam('rangeStart', noteNameOctave)
            }, this.props.config.rangeStart, "Change Range Start")}
            <ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => this.removeParam('rangeStart')}>Clear Range Start</ASUIMenuAction>
        </>);
    }
    renderMenuChangeKeyRangeEnd() {
        return (<>
            {new Values().renderMenuSelectFrequency(noteNameOctave => {
                this.changeParam('rangeEnd', noteNameOctave)
            }, this.props.config.rangeEnd, "Change Range End")}
            <ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => this.removeParam('rangeEnd')}>Clear Range End</ASUIMenuAction>
        </>);
    }

    /** LFO **/

    renderMenuAddLFO() {
        const sourceParameters = AudioBufferInstrumentRenderer.sourceParameters;
        return Object.keys(sourceParameters).map((sourceParameter, i) => <ASUIMenuAction
            key={i++}
            onAction={() => this.addLFO(sourceParameter)}
        >{`on ${sourceParameters[sourceParameter]}`}</ASUIMenuAction>)
    }

    renderLFOMenu(lfoID) {
        let i=0;
        return [
            <ASUIMenuAction key={i++} onAction={e => this.removeLFO(lfoID)}>Remove LFO</ASUIMenuAction>
        ];
    }

    // renderMenuChangeLoop() {
    //     return (<>TODO</>);
    // }


}

export default AudioBufferInstrumentRenderer;

function getNameFromURL(url) { return url.split('/').pop().replace('.wav', ''); }
