import React from 'react';
import {
    // Button,
    // InputSelect,
    Div,
    Button,
    MenuAction,
    MenuBreak,
    Icon, InputRange, MenuDropDown,
} from "../../../components";

import "./assets/SynthesizerSampleRenderer.css";

/** PolyphonyInstrumentRenderer **/
class OscillatorNodeInstrumentRenderer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            open: false
        }
    }

    getSong() { return this.props.song; }
    getSampleID() { return this.props.sampleID; }
    getInstrumentID() { return this.props.instrumentID; }
    getSampleData() { return this.props.sampleData; }

    render() {
        const sample = this.getSampleData();
        // console.log('voice', voice);
        const sampleName = sample.url.replace(/\.(wav|mp3)$/, '');

        let className = 'sample';
        if(this.state.open)
            className += ' open';

        return (
            <Div
                className={className}
                >
                <Button
                    title="Change Sample"
                    className="name"
                    onAction={e => this.toggleOpen(e)}>
                    {sampleName || "Unnamed"}
                </Button>
                {!this.state.open ? null : (
                    <>
                        {typeof sample.mixer === 'undefined' ? null : (
                            <Div title="Edit Mixer" className="mixer">
                                <Button onAction={e => this.openMenuChangeMixer(e)} vertical openOnHover={false}>
                                    {sample.mixer+'%'}
                                </Button>
                            </Div>
                        )}
                        {typeof sample.detune === 'undefined' ? null : (
                            <Div title={`Detune by ${sample.detune} cents`} className="detune">
                                <Button onAction={e => this.openMenuChangeDetune(e)} vertical openOnHover={false}>
                                    {sample.detune+'c'}
                                </Button>
                            </Div>
                        )}
                        {typeof sample.root === 'undefined' ? null : (
                            <Div title={`Key Root is ${sample.root}`} className="root">
                                <Button onAction={e => this.openMenuChangeKeyRoot(e)} vertical openOnHover={false}>
                                    {sample.root}
                                </Button>
                            </Div>
                        )}
                        {typeof sample.alias === 'undefined' ? null : (
                            <Div title={`Key Alias is ${sample.alias}`} className="alias">
                                <Button onAction={e => this.openMenuChangeKeyAlias(e)} vertical openOnHover={false}>
                                    {sample.alias}
                                </Button>
                            </Div>
                        )}
                        {typeof sample.range === 'undefined' ? null : (
                            <Div title={`Key Range is ${sample.range}`} className="range">
                                <Button onAction={e => this.openMenuChangeKeyRange(e)} vertical openOnHover={false}>
                                    {sample.range}
                                </Button>
                            </Div>
                        )}
                        {typeof sample.loop === 'undefined' ? null : (
                            <Div title="Toggle Loop" className="loop">
                                <Button title="" onAction={e => this.changeLoop(!sample.loop)} arrow={false} vertical openOnHover={false}>
                                    {sample.loop?'∞':'⇥'}
                                </Button>
                            </Div>
                        )}
                    </>)
                }
                <Div title={`Edit Sample '${sampleName}'`} className="config">
                    <Button onAction={e => this.openMenuRoot(e)} vertical openOnHover={false}>
                        <Icon className="config"/>
                    </Button>
                </Div>
            </Div>
        );
    }


    openMenu(e, options) {
        if(typeof this.props.openMenu === "function")
            this.props.openMenu(e, options);
        else
            throw new Error("Invalid 'openMenu' props");
    }

    openMenuRoot(e) {
        this.openMenu(e, <>
            <MenuAction onAction={()=>{}} disabled>Sample {this.props.sampleID}</MenuAction>
            <MenuBreak />
            <MenuDropDown key="mixer" onAction={e => this.openMenuChangeMixer(e)}>Edit Mixer</MenuDropDown>
            <MenuDropDown key="detune" onAction={e => this.openMenuChangeDetune(e)}>Edit Detune</MenuDropDown>
            <MenuDropDown key="root" onAction={e => this.openMenuChangeKeyRoot(e)}>Edit Key Root</MenuDropDown>
            <MenuDropDown key="alias" onAction={e => this.openMenuChangeKeyAlias(e)}>Edit Key Alias</MenuDropDown>
            <MenuDropDown key="range" onAction={e => this.openMenuChangeKeyRange(e)}>Edit Key Range</MenuDropDown>
            <MenuDropDown key="loop" onAction={e => this.openMenuChangeLoop(e)}>Toggle Loop</MenuDropDown>
            <MenuBreak />
            <MenuDropDown key="change" onAction={e => this.openMenuChangeSample(e)}>Change Sample</MenuDropDown>
            <MenuAction key="remove" onAction={e => this.renderMenu('voice-remove')}>Remove Sample</MenuAction>
        </>);
    }

    openMenuChangeSample(e) {
        const sample = this.getSampleData();
        this.openMenu(e, <InputRange min={0} max={100} value={sample.mixer} />);
    }

    openMenuChangeMixer(e) {
        const sample = this.getSampleData();
        this.openMenu(e, <InputRange
            min={0}
            max={100}
            value={typeof sample.mixer !== "undefined" ? sample.mixer : 100}
            onChange={(e, mixerValue) => this.changeMixer(mixerValue)}
        />);
    }

    openMenuChangeDetune(e) {
        const sample = this.getSampleData();
        this.openMenu(e, <InputRange
            min={-1000}
            max={1000}
            value={typeof sample.detune !== "undefined" ? sample.detune : 100}
            onChange={(e, detuneValue) => this.changeDetune(detuneValue)}
        />);
    }

    // TODO: use generic menu/value library
    openMenuChangeKeyRoot(e) {
        const values = this.getSong().values;
        this.openMenu(e, <>
            <MenuAction onAction={null} disabled>Edit Key Root</MenuAction>
            <MenuBreak />
            {values.getNoteOctaves((octave) =>
                <MenuDropDown onAction={e => this.openMenu(e,
                    values.getNoteFrequencies((noteName) =>
                        <MenuAction onAction={e => this.changeRoot(noteName+octave)}    >{noteName+octave}</MenuAction>
                    )
                )}>{octave}</MenuDropDown>)}
        </>);
    }

    openMenuChangeKeyAlias(e) {
        const values = this.getSong().values;
        this.openMenu(e, <>
            <MenuAction onAction={null} disabled>Edit Key Root</MenuAction>
            <MenuBreak />
            {values.getNoteOctaves((octave) =>
                <MenuDropDown onAction={e => this.openMenu(e,
                    values.getNoteFrequencies((noteName) =>
                        <MenuAction onAction={e => this.changeAlias(noteName+octave)}    >{noteName+octave}</MenuAction>
                    )
                )}>{octave}</MenuDropDown>)}
        </>);
    }

    openMenuChangeKeyRange(e) {
        this.openMenu(e, );
    }

    openMenuChangeLoop(e) {
        this.openMenu(e, );
    }



    renderMenu(menuKey=null) {
        // const voice = this.getSampleData();
        const values = this.getSong().values;
        switch(menuKey) {
            case 'voice-loop':
            case 'voice-remove':
            case null:
                return ;

            case 'voice-change':
                return <>

                </>;

            case 'voice-mixer':
                return <>

                    <MenuBreak />
                    <MenuAction onAction={null} disabled>Edit Mixer</MenuAction>
                </>;

            case 'voice-detune':
                return <>

                    <MenuBreak />
                    <MenuAction onAction={null} disabled>Edit Detune</MenuAction>
                </>;

            case 'voice-root':
                return <>
                    <MenuAction onAction={null} disabled>Edit Key Root</MenuAction>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                    <MenuAction onAction={
                        () => values.getNoteFrequencies((noteName) =>
                            <MenuAction onAction={e => this.changeRoot(noteName+octave)}    >{noteName+octave}</MenuAction>
                        )
                    }>{octave}</MenuAction>)}
                </>;

            case 'voice-alias':
                return <>
                    <MenuAction onAction={null} disabled>Edit Key Alias</MenuAction>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                    <MenuAction onAction={
                        () => values.getNoteFrequencies((noteName) =>
                            <MenuAction onAction={e => this.changeAlias(noteName+octave)}    >{noteName+octave}</MenuAction>
                        )
                    }>{octave}</MenuAction>)}
                </>;

            case 'voice-range':
                return <>
                    <MenuAction onAction={null} disabled>Edit Key Range</MenuAction>
                    <MenuBreak />
                    <MenuAction onAction={e => this.renderMenu('voice-range-start')} >Set Range Start</MenuAction>
                    <MenuAction onAction={e => this.renderMenu('voice-range-end')} >Set Range End</MenuAction>
                </>;

            case 'voice-range-start':
                return (<>
                    <MenuAction onAction={null} disabled>Range Start</MenuAction>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                        <MenuAction onAction={
                            () => values.getNoteFrequencies((noteName) =>
                                <MenuAction onAction={e => this.changeRange(noteName+octave)}    >{noteName+octave}</MenuAction>
                            )
                        }>{octave}</MenuAction>)}
                </>);

            case 'voice-range-end':
                return (<>
                    <MenuAction onAction={null} disabled>Range End</MenuAction>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                        <MenuAction onAction={
                            () => values.getNoteFrequencies((noteName) =>
                                <MenuAction onAction={e => this.changeRange(null, noteName+octave)}    >{noteName+octave}</MenuAction>
                            )
                        }>{octave}</MenuAction>)}
                </>);



            default:
                throw new Error("Unknown menu key: " + menuKey);
        }

    }


    toggleOpen(e) {
        this.setState({open: !this.state.open})
    }

    changeMixer(newMixerValue) {
        if(!Number.isInteger(newMixerValue))
            throw new Error("Invalid mixer value type: " + typeof newMixerValue);
        this.config.samples[this.getSampleID()].mixer = newMixerValue;
    }

    changeDetune(newDetuneValue) {
        if(!Number.isInteger(newDetuneValue))
            throw new Error("Invalid detune value type: " + typeof newDetuneValue);
        this.config.samples[this.getSampleID()].detune = newDetuneValue;
    }

    changeRoot(newRootValue) {
        this.config.samples[this.getSampleID()].root = newRootValue;
    }

    changeAlias(newAliasValue) {
        this.config.samples[this.getSampleID()].alias = newAliasValue;
    }

    changeLoop(newLoopValue=null) {
        if(newLoopValue === null)
            newLoopValue = !this.getSampleData().loop;
        this.config.samples[this.getSampleID()].loop = newLoopValue?1:0;
    }

}

export default OscillatorNodeInstrumentRenderer;
