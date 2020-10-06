import React from 'react';
import {
    ASUIMenuAction,
    ASUIMenuBreak,
    ASUIInputRange,
    ASUIMenuDropDown, ASUIClickableDropDown, ASUIMenuItem, ASUIGlobalContext,
} from "../../../../components";
import {PresetLibrary, ProgramLoader, Values} from "../../../../song";

import PropTypes from "prop-types";
import PeriodicWaveLoader from "../loader/PeriodicWaveLoader";
import OscillatorInstrument from "../OscillatorInstrument";


export default class OscillatorInstrumentRendererBase extends React.Component {
    /** Property validation **/
    static propTypes = {
        parentMenu: PropTypes.func,
        setProps: PropTypes.func.isRequired,
    };


    /** Program Context **/
    static contextType = ASUIGlobalContext;
    getGlobalContext() { return this.context; }
    setStatus(message) { this.context.addLogEntry(message); }
    setError(message) { this.context.addLogEntry(message, 'error'); }



    constructor(props) {
        super(props);
        this.cb = {
            onClick: e => this.toggleOpen(),
            renderLFOMenu: lfoID => this.renderLFOMenu(lfoID),
            renderMenu: {
                root: () => this.renderMenuRoot(),
            },
            renderParamMenu: {
                keyRoot: () => this.renderMenuChangeKeyRoot(),
                // alias: () => this.renderMenuChangeKeyAlias(),
                // range: () => this.renderMenuChangeKeyRange(),
                source: () => this.renderMenuChangeOscillator(),
            },
            changeParam: {
                mixer:    (newValue) => this.changeParam('mixer', newValue),
                detune:   (newValue) => this.changeParam('detune', newValue),
                pulseWidth:   (newValue) => this.changeParam('pulseWidth', newValue),
            },
            setLFOProps: (lfoID, props) => this.setLFOProps(lfoID, props),
            setEnvelopeProps: (programID, props) => this.setEnvelopeProps(props),
        };
        this.state = {
            status: null
        }
        this.library = PresetLibrary.loadDefault();
    }

    componentDidMount() {
        const config = this.props.config;
        if(!config.type) {
            config.type = 'sawtooth';
            console.warn(`No default Oscillator was set. Using ${config.type}`);
        }
        if(typeof this.props.open === "undefined") {
            console.info("Auto opening", this)
            this.setProps({open: true})
        }
    }


    getTitle() {
        return this.props.config.title
            || this.props.config.type
            || getNameFromURL(this.props.config.url)
            || "Unknown Osc";
    }

    /** Parameters **/

    getParameters() {
        const config = this.props.config;
        const list = [
            'source',
            'mixer',
            'detune',
        ]
        if(config.type === 'pulse')
            list.splice(1, 0, 'pulseWidth');
        if(config.keyRoot)
            list.push('keyRoot');
        const inputParameters = OscillatorInstrument.inputParameters;
        return list.map(parameterName => {
            const parameterInfo = inputParameters[parameterName] || {};
            return {
                label: parameterInfo.label || parameterName,
                title: parameterInfo.title || parameterName,
                children:   this.renderInput(parameterName),
            }
        })
    }

    /** Properties **/

    setProps(props) {
        this.props.setProps(this.props.programID, props);
    }

    /** LFO **/

    renderLFO(lfoID, lfoProgram) {
        const [className, config] = lfoProgram;
        const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);
        const lfosProps = this.props.lfosProps || [];
        const lfoProps = lfosProps[lfoID] || {};
        return <Renderer
            key={lfoID}
            parentMenu={this.cb.renderLFOMenu}
            config={config}
            programID={lfoID}
            program={lfoProgram}
            parameters={OscillatorInstrument.sourceParameters}
            setProps={this.cb.setLFOProps}
            {...lfoProps}
        />;
    }

    setLFOProps(lfoID, props) {
        const lfosProps = this.props.lfosProps || [];
        if(lfosProps[lfoID])   Object.assign(lfosProps[lfoID], props);
        else                   lfosProps[lfoID] = props;
        this.setProps({lfosProps: lfosProps});
    }

    /** Envelope **/

    renderEnvelope(envelopeProgram) {
        if(envelopeProgram) {
            const [className, config] = envelopeProgram;
            const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);
            const envelopeProps = this.props.envelopeProps || [];
            return <Renderer
                config={config}
                program={envelopeProgram}
                parameters={OscillatorInstrument.sourceParameters}
                setProps={this.cb.setEnvelopeProps}
                {...envelopeProps}
            />;
        }
    }

    setEnvelopeProps(props) {
        // console.log('setEnvelopeProps', props);
        const envelopeProps = this.props.envelopeProps || {};
        Object.assign(envelopeProps, props);
        this.setProps({envelopeProps});
    }


    /** Inputs **/

    renderInput(paramName) {
        const config = this.props.config;
        const inputParameters = OscillatorInstrument.inputParameters[paramName] || {};
        const onChange = this.cb.changeParam[paramName];
        let value = config[paramName];
        if(typeof value === "undefined")
            value = inputParameters.default;

        switch(paramName) {
            case 'source':
                let source = "N/A";
                if(config.type)
                    source = config.type;
                if(config.url)
                    source = getNameFromURL(config.url);
                if(source && source.length > 16)
                    source = '...' + source.substr(-16);
                return <ASUIClickableDropDown
                    {...inputParameters}
                    // className="small"
                    vertical
                    options={this.cb.renderParamMenu.source}
                >{source}</ASUIClickableDropDown>;

            case 'keyRoot':
                return <ASUIClickableDropDown
                    className="small"
                    vertical
                    options={this.cb.renderParamMenu.keyRoot}
                >{config.keyRoot ? config.keyRoot : "[No Root Set]"}</ASUIClickableDropDown>

            case 'mixer':
            case 'detune':
            case 'pulseWidth':
                return <ASUIInputRange
                    {...inputParameters}
                    value={value}
                    onChange={onChange}
                />
            // case 'root':
            //     return <ASUIClickableDropDown
            //         className="small"
            //         options={this.cb.renderParamMenu.root}
            //     >{config.keyRoot ? config.keyRoot : "-"}</ASUIClickableDropDown>

            // case 'alias':
            //     return <ASUIClickableDropDown
            //         className="small"
            //         options={this.cb.renderParamMenu.alias}
            //     >{config.alias ? config.alias : "-"}</ASUIClickableDropDown>

            // case 'range':
            //     return <ASUIClickableDropDown
            //         className="small"
            //         options={this.cb.renderParamMenu.range}
            //     >{config.range ? config.range : "[any]"}</ASUIClickableDropDown>

            default:
                return 'Unknown';
        }
    }


    /** Actions **/

    toggleOpen() {
        const open = !this.props.open;
        this.props.setProps(this.props.programID, {open});
    }

    changeParam(paramName, newValue) {
        // console.log(`Changing parameter ${paramName}: ${newValue} [Old: ${this.props.config[paramName]}]`);
        this.props.config[paramName] = newValue;
    }

    removeParam(paramName) {
        // console.log(`Removing parameter ${paramName}: ${this.props.config[paramName]}`);
        delete this.props.config[paramName];
    }

    changeOscillatorStandard(newType) {
        const oldConfig = Object.assign({}, this.props.config);
        delete oldConfig.url;
        oldConfig.type = newType;
        switch(newType) {
            case 'pulse':
                oldConfig.pulseWidth = OscillatorInstrument.inputParameters.pulseWidth.default;
                break;
            default:
                delete oldConfig.pulseWidth;
                break;
        }
        this.props.program[1] = oldConfig;
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

    // loadPreset(className, presetConfig) {
    //     if(className !== this.props.program[0])
    //         throw new Error(`This preset is for class ${className}, not ${this.props.program[0]}`);
    //     if(!presetConfig.type)
    //         presetConfig.type = 'custom';
    //     this.props.program[1] = presetConfig;
    //     console.log("Loaded preset: ", presetConfig);
    // }

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
            <ASUIMenuDropDown options={() => this.renderMenuChangeParameter('mixer')}>Edit Mixer</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeParameter('detune')}>Edit Detune</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeKeyRoot()}>Edit Key Root</ASUIMenuDropDown>
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
            <ASUIMenuAction onAction={e => this.changeOscillatorStandard('pulse')}>Pulse</ASUIMenuAction>
        </>);
    }

    renderMenuChangeOscillatorSample() {
        const libraries = PresetLibrary.renderMenuLibraryOptions(async (library) => {
            await library.waitForAssetLoad();
            return this.renderMenuChangeOscillatorSampleWithLibrary(library);
        });
        return (
            <>
                <ASUIMenuItem>Select New Sample</ASUIMenuItem>
                <ASUIMenuBreak />
                {libraries}
                {this.renderMenuChangeOscillatorSampleRecent()}
            </>
        );
    }

    renderMenuChangeOscillatorSampleWithLibrary(library) {
        return library.renderMenuSamples(
            (sampleURL) => this.changeSampleURL(sampleURL),
            OscillatorInstrument.sampleFileRegex);
    }

    renderMenuChangeOscillatorSampleRecent() {
        const recentSamples = PresetLibrary.renderMenuRecentSamples(
            sampleURL => this.changeSampleURL(sampleURL),
            OscillatorInstrument.sampleFileRegex
        )
        return recentSamples ? <>
            <ASUIMenuBreak />
            <ASUIMenuItem>Recent Samples</ASUIMenuItem>
            {recentSamples}
        </> : null;
    }

    renderMenuChangeParameter(parameterName, parameterTitle=null) {
        return (<>
            {this.renderInput(parameterName)}
            <ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => this.removeParam(parameterName)}>Clear {parameterTitle || parameterName}</ASUIMenuAction>
            <ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => true}>Done</ASUIMenuAction>
        </>);
    }

    renderMenuChangeKeyRoot() {
        let title = "Set Root Key";
        if(this.props.config.keyRoot)
            title = "Change Root Key: " + this.props.config.keyRoot;
        return (<>
            {Values.instance.renderMenuSelectFrequencyWithRecent(noteNameOctave => {
                this.changeParam('keyRoot', noteNameOctave)
            }, this.props.config.keyRoot, title)}
            <ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => this.removeParam('keyRoot')}>Clear Root</ASUIMenuAction>
        </>);
    }

    /** LFO **/

    renderMenuAddLFO() {
        const sourceParameters = OscillatorInstrument.sourceParameters;
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


function getNameFromURL(url) { return url ? url.split('/').pop().replace('.json', '') : null; }
