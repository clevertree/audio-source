import React from 'react';
import {
    ASUIMenuAction,
    ASUIMenuBreak,
    ASUIInputRange,
    ASUIMenuDropDown, ASUIButtonDropDown, ASUIMenuItem,
} from "../../../../components";
import {LibraryProcessor, ProgramLoader} from "../../../../song";

import OscillatorInstrumentRendererContainer from "./container/OscillatorInstrumentRendererContainer";
import PropTypes from "prop-types";
import PeriodicWaveLoader from "../loader/PeriodicWaveLoader";
import {ASUILogContext} from "../../../../common";


export default class OscillatorInstrumentRenderer extends React.Component {
    /** Property validation **/
    static propTypes = {
        parentMenu: PropTypes.func,
    };

    /** Menu Context **/
    static contextType = ASUILogContext;
    setStatus(message) { this.context.addLogEntry(message); }
    setError(message) { this.context.addLogEntry(message, 'error'); }

    /** Automation Parameters **/
    static sourceParameters = {
        frequency: "Osc Frequency",
        detune: "Osc Detune",
    };

    /** Formatting Callbacks **/
    static formats = {
        cents: value => `${value}c`
    }

    static fileRegex = /\.json$/i;

    constructor(props) {
        super(props);
        this.cb = {
            onClick: e => this.toggleOpen(),
            renderLFOMenu: lfoID => this.renderLFOMenu(lfoID),
            renderMenu: {
                root: () => this.renderMenuRoot(),
            },
            renderParamMenu: {
                // root: () => this.renderMenuChangeKeyRoot(),
                // alias: () => this.renderMenuChangeKeyAlias(),
                // range: () => this.renderMenuChangeKeyRange(),
                source: () => this.renderMenuChangeOscillator(),
            },
            changeParam: {
                mixer:    (newValue) => this.changeParam('mixer', newValue),
                detune:   (newValue) => this.changeParam('detune', newValue),
            },
        };
        this.state = {
            status: null
        }
        this.library = LibraryProcessor.loadDefault();
    }


    componentDidUpdate(prevProps, prevState, snapshot) {
        const config = this.props.config;
        if(!config.envelope) {
            config.envelope = ['envelope', {}];
            console.warn("Oscillator has no envelope. Defaulting to ", config.envelope);
        }
    }

    getTitle() {
        return this.props.config.title
            || this.props.config.type
            || getNameFromURL(this.props.config.url)
            || "Unknown Osc";
    }



    render() {
        let title = this.getTitle();
        const config = this.props.config;

        const parameters = [
            {
                label:      'WaveForm',
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
            // {
            //     label:      'Root',
            //     title:      `Key Root is ${config.root}`,
            //     children:   this.renderInput('root'),
            // },
            // {
            //     label:      'Alias',
            //     title:      `Key Alias is ${config.alias}`,
            //     children:   this.renderInput('alias'),
            // },
            // {
            //     label:      'Range',
            //     title:      `Key Range is ${config.range}`,
            //     children:   this.renderInput('range'),
            // },
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

        return <OscillatorInstrumentRendererContainer
            onClick={this.cb.onClick}
            renderMenuRoot={this.cb.renderMenu.root}
            config={config}
            parameters={parameters}
            envelope={envelope}
            lfos={lfos}
            title={title}
            status={this.state.status}
            error={this.state.error}
        >
        </OscillatorInstrumentRendererContainer>;
    }


    /** Inputs **/

    renderInput(paramName) {
        let value;
        const config = this.props.config;
        switch(paramName) {
            case 'source':
                let source = "N/A";
                if(config.type)
                    source = config.type;
                if(config.url)
                    source = getNameFromURL(config.url);
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
                    format={ASUIInputRange.formats.percent}
                    onChange={this.cb.changeParam.mixer}
                />;

            case 'detune':
                value = typeof config.detune !== "undefined" ? config.detune : 0;
                return <ASUIInputRange
                    // className="small"
                    min={-1000}
                    max={1000}
                    value={value}
                    format={OscillatorInstrumentRenderer.formats.cents}
                    onChange={this.cb.changeParam.detune}
                />

            // case 'root':
            //     return <ASUIButtonDropDown
            //         className="small"
            //         options={this.cb.renderParamMenu.root}
            //     >{config.root ? config.root : "-"}</ASUIButtonDropDown>

            // case 'alias':
            //     return <ASUIButtonDropDown
            //         className="small"
            //         options={this.cb.renderParamMenu.alias}
            //     >{config.alias ? config.alias : "-"}</ASUIButtonDropDown>

            // case 'range':
            //     return <ASUIButtonDropDown
            //         className="small"
            //         options={this.cb.renderParamMenu.range}
            //     >{config.range ? config.range : "[any]"}</ASUIButtonDropDown>

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

    removeParam(paramName) {
        const oldValue = this.props.config[paramName];
        console.log(`Removing parameter ${paramName}: ${oldValue}`);
        delete this.props.config[paramName];
    }

    changeOscillatorStandard(newType) {
        delete this.props.config.url;
        this.props.config.type = newType;
    }

    async changeSampleURL(url) {
        const service = new PeriodicWaveLoader();
        try {
            this.setState({status: 'loading', error: null});
            this.setStatus("Loading Sample: " + url);
            await service.loadPeriodicWaveFromURL(url);
            this.props.config.url = url;
            this.props.config.type = 'custom';
            this.setState({status: 'loaded'});
            this.setStatus("Loaded Sample: " + url);
        } catch (e) {
            this.setState({status: 'error', error: e.message});
            this.setError(e);
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

    /** Menus **/

    renderMenuRoot() {
        return (<>
            <ASUIMenuAction onAction={()=>{}} disabled>{`Oscillator: ${this.getTitle()}`}</ASUIMenuAction>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuChangeOscillator()}>Change Oscillator</ASUIMenuDropDown>
            <ASUIMenuBreak />
            {/*<ASUIMenuDropDown options={() => this.renderMenuChangeMixer()}>Edit Mixer</ASUIMenuDropDown>*/}
            <ASUIMenuDropDown options={() => this.renderMenuChangeDetune()}>Edit Detune</ASUIMenuDropDown>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuAddLFO()}>Add LFO</ASUIMenuDropDown>

            {this.props.parentMenu ? <>
                <ASUIMenuBreak />
                {this.props.parentMenu(this.props.programID)}
            </> : null}
        </>);
    }

    renderMenuChangeOscillator() {
        return (<>
            <ASUIMenuDropDown options={() => this.renderMenuChangeOscillatorStandard()}>Standard</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeOscillatorSample()}>Sample</ASUIMenuDropDown>
            {this.renderMenuChangeOscillatorSampleRecent()}
            {/*{await this.library.renderMenuPresets((className, presetConfig) => {*/}
            {/*    this.loadPreset(className, presetConfig);*/}
            {/*}, this.props.program[0])}*/}
        </>);
    }

    renderMenuChangeOscillatorStandard() {
        return (<>
            <ASUIMenuAction onAction={e => this.changeOscillatorStandard('sine')}>Sine</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.changeOscillatorStandard('square')}>Square</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.changeOscillatorStandard('sawtooth')}>Sawtooth</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.changeOscillatorStandard('triangle')}>Triangle</ASUIMenuAction>
        </>);
    }

    renderMenuChangeOscillatorSample() {
        return (
            <>
                <ASUIMenuItem>Select New Sample</ASUIMenuItem>
                <ASUIMenuBreak />
                {this.renderMenuChangeOscillatorSampleWithLibrary(this.library)}
                {this.renderMenuChangeOscillatorSampleRecent()}
            </>
        );
    }

    renderMenuChangeOscillatorSampleRecent() {
        const recentSamples = LibraryProcessor.renderMenuRecentSamples(
            sampleURL => this.changeSampleURL(sampleURL),
            OscillatorInstrumentRenderer.fileRegex
        )
        return recentSamples ? <>
            <ASUIMenuBreak />
            <ASUIMenuItem>Recent Samples</ASUIMenuItem>
            {recentSamples}
        </> : null;
    }

    renderMenuChangeOscillatorSampleWithLibrary(library) {
        const libraries = library.renderMenuLibraryOptions((library) =>
            this.renderMenuChangeOscillatorSampleWithLibrary(library)
        );
        const samples = library.renderMenuSamples(
            (sampleURL) => this.changeSampleURL(sampleURL),
            OscillatorInstrumentRenderer.fileRegex);
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
            <ASUIMenuBreak/>I
            <ASUIMenuAction onAction={() => this.removeParam('detune')}>Clear Detune</ASUIMenuAction>
            <ASUIMenuBreak/>I
            <ASUIMenuAction onAction={() => true}>Done</ASUIMenuAction>
        </>);
    }



    /** LFO **/

    renderMenuAddLFO() {
        const sourceParameters = OscillatorInstrumentRenderer.sourceParameters;
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
}


function getNameFromURL(url) { return url.split('/').pop().replace('.json', ''); }
