import React from 'react';
import {
    ASUIMenuAction,
    ASUIMenuBreak,
    ASUIInputRange,
    ASUIMenuDropDown, ASUIClickableDropDown, ASUIMenuItem, ASUIGlobalContext
} from "../../../../components";
import {PresetLibrary, ProgramLoader, Values} from "../../../../song";

import PropTypes from "prop-types";
import AudioBufferLoader from "../loader/AudioBufferLoader";
import AudioBufferInstrument from "../AudioBufferInstrument";


class AudioBufferInstrumentRendererBase extends React.Component {
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
                keyRange: () => this.renderMenuChangeKeyRange(),
                source: () => this.renderMenuChangeAudioBuffer(),
            },
            changeParam: {
                mixer:      (newValue) => this.changeParam('mixer', newValue),
                detune:     (newValue) => this.changeParam('detune', newValue),
                transpose:  (newValue) => this.changeParam('transpose', newValue),
            },
            setLFOProps: (lfoID, props) => this.setLFOProps(lfoID, props),
            setEnvelopeProps: (programID, props) => this.setEnvelopeProps(props),
        };
        this.state = {
            status: null
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(!this.props.config.envelope) {
            this.props.config.envelope = AudioBufferInstrument.defaultEnvelope;
        }
        if(!this.props.config.url) {
            // console.log("No default AudioBuffer was set");
            // this.props.config.type = 'sawtooth';
        }
        if(typeof this.props.open === "undefined") {
            console.info("Auto opening", this)
            this.setProps({open: true})
        }
    }

    getTitle() {
        return this.props.config.title
            || (this.props.config.url
                ? getNameFromURL(this.props.config.url)
                : "empty buffer")
    }

    // getRange() {
    //     return AudioBufferInstrument.getRange(this.props.config.keyRange);
    // }

    /** Parameters **/

    getParameters() {
        // const config = this.props.config;
        const list = [
            'source',
            'mixer',
            'detune',
            'transpose',
            'keyRange',
        ]
        const inputParameters = AudioBufferInstrument.inputParameters;
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
            parameters={AudioBufferInstrument.sourceParameters}
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
                parameters={AudioBufferInstrument.sourceParameters}
                setProps={this.cb.setEnvelopeProps}
                {...envelopeProps}
            />;
        }
    }


    setEnvelopeProps(props) {
        const envelopeProps = this.props.envelopeProps || {};
        Object.assign(envelopeProps, props);
        this.setProps({envelopeProps});
    }

    /** Inputs **/

    renderInput(paramName) {
        const config = this.props.config;
        const inputParameters = AudioBufferInstrument.inputParameters[paramName] || {};
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

            case 'keyRoot': // TODO:
                return <ASUIClickableDropDown
                    {...inputParameters}
                    size="small"
                    vertical
                    options={this.cb.renderParamMenu.keyRoot}
                >{config.keyRoot ? config.keyRoot : "[No Root Set]"}</ASUIClickableDropDown>

            case 'keyRange':
                let rangeText = '[all]';
                if(config.keyRangeLow || config.keyRangeHigh) {
                    rangeText = `${config.keyRangeLow||'[low]'} to ${config.keyRangeHigh||'[high]'}`;
                    if(config.keyRangeLow === config.keyRangeHigh)
                        rangeText = config.keyRangeLow;
                }
                return <ASUIClickableDropDown
                    {...inputParameters}
                    size="small"
                    vertical
                    options={this.cb.renderParamMenu.keyRange}
                >{rangeText}</ASUIClickableDropDown>

            case 'transpose':
            case 'mixer':
            case 'detune':
            case 'pulseWidth':
                return <ASUIInputRange
                    size="small"
                    {...inputParameters}
                    value={value}
                    onChange={onChange}
                    buttonIncrement
                    buttonReset
                />

            default:
                return 'Unknown';
        }
    }

    /** Actions **/

    toggleOpen() {
        const open = !this.props.open;
        this.setProps({open})
    }

    changeParam(paramName, newValue) {
        console.log(`Changing parameter ${paramName}: ${newValue} [Old: ${this.props.config[paramName]}]`);
        this.props.config[paramName] = newValue;
    }

    removeParam(paramName) {
        console.log(`Removing parameter ${paramName}: ${this.props.config[paramName]}`);
        delete this.props.config[paramName];
    }

    changeRange(low=null, high=null) {
        // TODO: compare high and low
        let range = this.getRange() || [];
        if(low !== null)
            range[0] = low;
        if(high !== null)
            range[1] = high;
        if(range[0] === range[1]) {
            range = range[0];
        } else {
            range = range.join(':');
        }
        this.changeParam('keyRange', range);
    }



    async changeSampleURL(url) {
        const service = new AudioBufferLoader();
        try {
            this.setState({status: 'loading', error: null});
            this.setStatus("Loading Sample: " + url);
            await service.loadAudioBufferFromURL(url);
            this.props.config.url = url;
            this.setState({status: 'loaded'});
            this.setStatus("Loaded Sample: " + url);
        } catch (e) {
            this.setState({status: 'error', error: e.message});
            this.setError(e);
        }
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
            <ASUIMenuDropDown options={() => this.renderMenuChangeMixer()}>Edit Mixer</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeDetune()}>Edit Detune</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeKeyRoot()}>Edit Key Root</ASUIMenuDropDown>
            {/*<ASUIMenuDropDown options={() => this.renderMenuChangeKeyAlias()}>Edit Key Alias</ASUIMenuDropDown>*/}
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
        const libraries = PresetLibrary.renderMenuLibraryOptions(async (library) => {
            await library.waitForAssetLoad();
            return this.renderMenuChangeAudioBufferWithLibrary(library);
        });
        const recentSamples = PresetLibrary.renderMenuRecentSamples(
            sampleURL => this.changeSampleURL(sampleURL),
            AudioBufferInstrument.sampleFileRegex
        )
        return (
            <>
                <ASUIMenuItem>Select New Sample</ASUIMenuItem>
                <ASUIMenuBreak />
                {libraries}
                {recentSamples ? <>
                    <ASUIMenuBreak />
                    <ASUIMenuItem>Recent Samples</ASUIMenuItem>
                    {recentSamples}
                </> : null}
            </>
        );
    }


    renderMenuChangeAudioBufferWithLibrary(library) {
        return library.renderMenuSamples(
            (sampleURL) => this.changeSampleURL(sampleURL),
            AudioBufferInstrument.sampleFileRegex);
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

    renderMenuChangeMixer() {
        return (<>
            {this.renderInput('mixer')}
            <ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => this.removeParam('mixer')}>Clear Mixer</ASUIMenuAction>
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
                this.changeParam('keyRoot', noteNameOctave);
                return false;
            }, this.props.config.keyRoot, title)}
            <ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => this.removeParam('keyRoot')}>Clear Root</ASUIMenuAction>
        </>);
    }
    // renderMenuChangeKeyAlias() {
    //     return (<>
    //         {Values.instance.renderMenuSelectFrequencyWithRecent(noteNameOctave => {
    //             this.changeParam('alias', noteNameOctave)
    //         }, this.props.config.alias, "Change Alias")}
    //         <ASUIMenuBreak/>
    //         <ASUIMenuAction onAction={() => this.removeParam('alias')}>Clear Alias</ASUIMenuAction>
    //     </>);
    // }


    renderMenuChangeKeyRange() {
        let i=0;
        return [
            <ASUIMenuDropDown key={i++} options={() => this.renderMenuChangeKeyRangeMode('alias')}>Set Alias</ASUIMenuDropDown>,
            <ASUIMenuBreak key={i++} />,
            <ASUIMenuDropDown key={i++} options={() => this.renderMenuChangeKeyRangeMode('start')}>Range Start</ASUIMenuDropDown>,
            <ASUIMenuDropDown key={i++} options={() => this.renderMenuChangeKeyRangeMode('end')}>Range End</ASUIMenuDropDown>,
            <ASUIMenuBreak key={i++} />,
            <ASUIMenuAction  key={i++} onAction={() => {
                this.removeParam('keyRange');
            }}>Clear Range</ASUIMenuAction>,
        ];
    }
    renderMenuChangeKeyRangeMode(mode) {
        let rangeValue = null;
        if(this.props.config.keyRange) switch(mode) {
            case 'alias':
            case 'start': rangeValue = this.getRange()[0]; break;
            case 'end': rangeValue = this.getRange()[1]; break;
            default: break;
        }
        return (<>
            {Values.instance.renderMenuSelectFrequencyWithRecent(noteNameOctave => {
                switch(mode) {
                    case 'alias': this.changeRange(noteNameOctave, noteNameOctave); break;
                    case 'start': this.changeRange(noteNameOctave, null); break;
                    case 'end': this.changeRange(null, noteNameOctave); break;
                    default: break;
                }

            }, rangeValue, "Change range " + mode)}
            <ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => this.removeParam('rangeValue')}>Clear Range Start</ASUIMenuAction>
        </>);
    }
    renderMenuChangekeyRangeHigh() {
        let rangeEnd = null;
        if(this.props.config.keyRange)
            rangeEnd = this.getRange()[1];
        return (<>
            {Values.instance.renderMenuSelectFrequencyWithRecent(noteNameOctave => {
                this.changeRange(null, noteNameOctave)
            }, rangeEnd, "Change Range End")}
            <ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => this.removeParam('rangeEnd')}>Clear Range End</ASUIMenuAction>
        </>);
    }

    /** LFO **/

    renderMenuAddLFO() {
        const sourceParameters = AudioBufferInstrument.sourceParameters;
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

export default AudioBufferInstrumentRendererBase;

function getNameFromURL(url) { return url.split('/').pop().replace('.wav', '').replace('%20', ' '); }
