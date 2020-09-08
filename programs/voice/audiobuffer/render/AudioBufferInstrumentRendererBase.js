import React from 'react';
import {
    ASUIMenuAction,
    ASUIMenuBreak,
    ASUIInputRange,
    ASUIMenuDropDown, ASUIButtonDropDown, ASUIMenuItem, ASUIGlobalContext
} from "../../../../components";
import {LibraryProcessor, ProgramLoader, Values} from "../../../../song";

import PropTypes from "prop-types";
import AudioBufferLoader from "../loader/AudioBufferLoader";


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
                // alias: () => this.renderMenuChangeKeyAlias(),
                range: () => this.renderMenuChangeKeyRange(),
                source: () => this.renderMenuChangeAudioBuffer(),
            },
            changeParam: {
                mixer:    (newValue) => this.changeParam('mixer', newValue),
                detune:   (newValue) => this.changeParam('detune', newValue),
            },
            setLFOProps: (lfoID, props) => this.setLFOProps(lfoID, props),
            setEnvelopeProps: (programID, props) => this.setEnvelopeProps(props),
        };
        this.state = {
            status: null
        }
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

    /** Parameters **/

    getParameters() {
        const config = this.props.config;
        return [
            {
                label:      'Sample',
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
            // {
            //     label:      'Alias',
            //     title:      `Key Alias is ${config.alias}`,
            //     children:   this.renderInput('alias'),
            // },
            {
                label:      'Range',
                title:      `Key Range is ${config.range}`,
                children:   this.renderInput('range'),
            },
        ];
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
            parameters={this.constructor.sourceParameters}
            setProps={this.cb.setLFOProps}
            {...lfoProps}
        />;
    }

    setLFOProps(lfoID, props) {
        const lfosProps = this.props.lfosProps || [];
        if(lfosProps[lfoID])   Object.assign(lfosProps[lfoID], props);
        else                   lfosProps[lfoID] = props;
        this.props.setProps(this.props.programID, {lfosProps: lfosProps});
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
                parameters={this.constructor.sourceParameters}
                setProps={this.cb.setEnvelopeProps}
                {...envelopeProps}
            />;
        }
    }

    setEnvelopeProps(props) {
        const envelopeProps = this.props.envelopeProps || {};
        Object.assign(envelopeProps, props);
        this.props.setProps(this.props.programID, {envelopeProps});
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


            case 'mixer':
                value = typeof config.mixer !== "undefined" ? config.mixer : 100;
                return <ASUIInputRange
                        className="small"
                        min={0}
                        max={500}
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
                    format={AudioBufferInstrumentRendererBase.formats.cents}
                    onChange={this.cb.changeParam.detune}
                />

            case 'root':
                return <ASUIButtonDropDown
                    className="small"
                    options={this.cb.renderParamMenu.root}
                >{config.root ? config.root : "-"}</ASUIButtonDropDown>

            // case 'alias':
            //     return <ASUIButtonDropDown
            //         className="small"
            //         options={this.cb.renderParamMenu.alias}
            //     >{config.alias ? config.alias : "-"}</ASUIButtonDropDown>

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
        const open = !this.props.open;
        this.props.setProps(this.props.programID, {open})
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

    changeRange(rangeStart=null, rangeEnd=null) {
        const oldRange = this.props.config.range.split(':');
        if(rangeStart !== null)
            oldRange[0] = rangeStart;
        if(rangeEnd !== null)
            oldRange[1] = rangeEnd;
        this.props.config.range = oldRange.join(':');
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
            {/*<ASUIMenuDropDown options={() => this.renderInput('mixer')}>Edit Mixer</ASUIMenuDropDown>*/}
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
        const recentSamples = LibraryProcessor.renderMenuRecentSamples(
            sampleURL => this.changeSampleURL(sampleURL),
            AudioBufferInstrumentRendererBase.fileRegex
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
            AudioBufferInstrumentRendererBase.fileRegex);
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

    renderMenuChangeKeyRoot() {
        return (<>
            {Values.instance.renderMenuSelectFrequencyWithRecent(noteNameOctave => {
                this.changeParam('root', noteNameOctave)
            }, this.props.config.root, "Change Root Key")}
            <ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => this.removeParam('root')}>Clear Root</ASUIMenuAction>
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
            <ASUIMenuDropDown key={i++} options={() => this.renderMenuChangeKeyRangeStart()}>Range Start</ASUIMenuDropDown>,
            <ASUIMenuDropDown key={i++} options={() => this.renderMenuChangeKeyRangeEnd()}>Range End</ASUIMenuDropDown>,
            <ASUIMenuBreak key={i++} />,
            <ASUIMenuAction  key={i++} onAction={() => {
                this.removeParam('range');
            }}>Clear Range</ASUIMenuAction>,
        ];
    }
    renderMenuChangeKeyRangeStart() {
        return (<>
            {Values.instance.renderMenuSelectFrequencyWithRecent(noteNameOctave => {

                this.changeParam('range', noteNameOctave)
            }, this.props.config.rangeStart, "Change Range Start")}
            <ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => this.removeParam('rangeStart')}>Clear Range Start</ASUIMenuAction>
        </>);
    }
    renderMenuChangeKeyRangeEnd() {
        return (<>
            {Values.instance.renderMenuSelectFrequencyWithRecent(noteNameOctave => {
                this.changeParam('rangeEnd', noteNameOctave)
            }, this.props.config.rangeEnd, "Change Range End")}
            <ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => this.removeParam('rangeEnd')}>Clear Range End</ASUIMenuAction>
        </>);
    }

    /** LFO **/

    renderMenuAddLFO() {
        const sourceParameters = AudioBufferInstrumentRendererBase.sourceParameters;
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

function getNameFromURL(url) { return url.split('/').pop().replace('.wav', ''); }
