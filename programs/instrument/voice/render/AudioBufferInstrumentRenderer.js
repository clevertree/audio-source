import React from 'react';
import {
    // Button,
    // InputSelect,
    ASUIDiv,
    ASUIButton,
    ASUIMenuAction,
    ASUIMenuBreak,
    ASUIIcon, ASUIInputRange, ASUIMenuDropDown,
} from "../../../../components";

import AudioBufferInstrumentRendererStyle from "./AudioBufferInstrumentRendererStyle";

/** PolyphonyInstrumentRenderer **/
class AudioBufferInstrumentRenderer extends AudioBufferInstrumentRendererStyle {

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

        let className = 'audiobuffer-instrument-renderer';
        if(this.state.open)
            className += ' open';

        return (
            <ASUIDiv
                className={className}
                >
                <ASUIButton
                    title="Change Sample"
                    className="name"
                    onAction={e => this.toggleOpen(e)}>
                    {sampleName || "Unnamed"}
                </ASUIButton>
                {!this.state.open ? null : (
                    <>
                        {typeof sample.mixer === 'undefined' ? null : (
                            <ASUIDiv title="Edit Mixer" className="mixer">
                                <ASUIButton onAction={e => this.openMenuChangeMixer(e)} vertical openOnHover={false}>
                                    {sample.mixer+'%'}
                                </ASUIButton>
                            </ASUIDiv>
                        )}
                        {typeof sample.detune === 'undefined' ? null : (
                            <ASUIDiv title={`Detune by ${sample.detune} cents`} className="detune">
                                <ASUIButton onAction={e => this.openMenuChangeDetune(e)} vertical openOnHover={false}>
                                    {sample.detune+'c'}
                                </ASUIButton>
                            </ASUIDiv>
                        )}
                        {typeof sample.root === 'undefined' ? null : (
                            <ASUIDiv title={`Key Root is ${sample.root}`} className="root">
                                <ASUIButton onAction={e => this.openMenuChangeKeyRoot(e)} vertical openOnHover={false}>
                                    {sample.root}
                                </ASUIButton>
                            </ASUIDiv>
                        )}
                        {typeof sample.alias === 'undefined' ? null : (
                            <ASUIDiv title={`Key Alias is ${sample.alias}`} className="alias">
                                <ASUIButton onAction={e => this.openMenuChangeKeyAlias(e)} vertical openOnHover={false}>
                                    {sample.alias}
                                </ASUIButton>
                            </ASUIDiv>
                        )}
                        {typeof sample.range === 'undefined' ? null : (
                            <ASUIDiv title={`Key Range is ${sample.range}`} className="range">
                                <ASUIButton onAction={e => this.openMenuChangeKeyRange(e)} vertical openOnHover={false}>
                                    {sample.range}
                                </ASUIButton>
                            </ASUIDiv>
                        )}
                        {typeof sample.loop === 'undefined' ? null : (
                            <ASUIDiv title="Toggle Loop" className="loop">
                                <ASUIButton title="" onAction={e => this.changeLoop(!sample.loop)} arrow={false} vertical openOnHover={false}>
                                    {sample.loop?'∞':'⇥'}
                                </ASUIButton>
                            </ASUIDiv>
                        )}
                    </>)
                }
                <ASUIDiv title={`Edit Sample '${sampleName}'`} className="config">
                    <ASUIButton onAction={e => this.openMenuRoot(e)} vertical openOnHover={false}>
                        <ASUIIcon source="config"/>
                    </ASUIButton>
                </ASUIDiv>
            </ASUIDiv>
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
            <ASUIMenuAction onAction={()=>{}} disabled>Sample {this.props.sampleID}</ASUIMenuAction>
            <ASUIMenuBreak />
            <ASUIMenuDropDown key="mixer" onAction={e => this.openMenuChangeMixer(e)}>Edit Mixer</ASUIMenuDropDown>
            <ASUIMenuDropDown key="detune" onAction={e => this.openMenuChangeDetune(e)}>Edit Detune</ASUIMenuDropDown>
            <ASUIMenuDropDown key="root" onAction={e => this.openMenuChangeKeyRoot(e)}>Edit Key Root</ASUIMenuDropDown>
            <ASUIMenuDropDown key="alias" onAction={e => this.openMenuChangeKeyAlias(e)}>Edit Key Alias</ASUIMenuDropDown>
            <ASUIMenuDropDown key="range" onAction={e => this.openMenuChangeKeyRange(e)}>Edit Key Range</ASUIMenuDropDown>
            <ASUIMenuDropDown key="loop" onAction={e => this.openMenuChangeLoop(e)}>Toggle Loop</ASUIMenuDropDown>
            <ASUIMenuBreak />
            <ASUIMenuDropDown key="change" onAction={e => this.openMenuChangeSample(e)}>Change Sample</ASUIMenuDropDown>
            <ASUIMenuAction key="remove" onAction={e => this.renderMenu('voice-remove')}>Remove Sample</ASUIMenuAction>
        </>);
    }

    openMenuChangeSample(e) {
        const sample = this.getSampleData();
        this.openMenu(e, <ASUIInputRange min={0} max={100} value={sample.mixer} />);
    }

    openMenuChangeMixer(e) {
        const sample = this.getSampleData();
        this.openMenu(e, <ASUIInputRange
            min={0}
            max={100}
            value={typeof sample.mixer !== "undefined" ? sample.mixer : 100}
            onChange={(e, mixerValue) => this.changeMixer(mixerValue)}
        />);
    }

    openMenuChangeDetune(e) {
        const sample = this.getSampleData();
        this.openMenu(e, <ASUIInputRange
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
            <ASUIMenuAction onAction={null} disabled>Edit Key Root</ASUIMenuAction>
            <ASUIMenuBreak />
            {values.getNoteOctaves((octave) =>
                <ASUIMenuDropDown onAction={e => this.openMenu(e,
                    values.getNoteFrequencies((noteName) =>
                        <ASUIMenuAction onAction={e => this.changeRoot(noteName+octave)}    >{noteName+octave}</ASUIMenuAction>
                    )
                )}>{octave}</ASUIMenuDropDown>)}
        </>);
    }

    openMenuChangeKeyAlias(e) {
        const values = this.getSong().values;
        this.openMenu(e, <>
            <ASUIMenuAction onAction={null} disabled>Edit Key Root</ASUIMenuAction>
            <ASUIMenuBreak />
            {values.getNoteOctaves((octave) =>
                <ASUIMenuDropDown onAction={e => this.openMenu(e,
                    values.getNoteFrequencies((noteName) =>
                        <ASUIMenuAction onAction={e => this.changeAlias(noteName+octave)}    >{noteName+octave}</ASUIMenuAction>
                    )
                )}>{octave}</ASUIMenuDropDown>)}
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

                    <ASUIMenuBreak />
                    <ASUIMenuAction onAction={null} disabled>Edit Mixer</ASUIMenuAction>
                </>;

            case 'voice-detune':
                return <>

                    <ASUIMenuBreak />
                    <ASUIMenuAction onAction={null} disabled>Edit Detune</ASUIMenuAction>
                </>;

            case 'voice-root':
                return <>
                    <ASUIMenuAction onAction={null} disabled>Edit Key Root</ASUIMenuAction>
                    <ASUIMenuBreak />
                    {values.getNoteOctaves((octave) =>
                    <ASUIMenuAction onAction={
                        () => values.getNoteFrequencies((noteName) =>
                            <ASUIMenuAction onAction={e => this.changeRoot(noteName+octave)}    >{noteName+octave}</ASUIMenuAction>
                        )
                    }>{octave}</ASUIMenuAction>)}
                </>;

            case 'voice-alias':
                return <>
                    <ASUIMenuAction onAction={null} disabled>Edit Key Alias</ASUIMenuAction>
                    <ASUIMenuBreak />
                    {values.getNoteOctaves((octave) =>
                    <ASUIMenuAction onAction={
                        () => values.getNoteFrequencies((noteName) =>
                            <ASUIMenuAction onAction={e => this.changeAlias(noteName+octave)}    >{noteName+octave}</ASUIMenuAction>
                        )
                    }>{octave}</ASUIMenuAction>)}
                </>;

            case 'voice-range':
                return <>
                    <ASUIMenuAction onAction={null} disabled>Edit Key Range</ASUIMenuAction>
                    <ASUIMenuBreak />
                    <ASUIMenuAction onAction={e => this.renderMenu('voice-range-start')} >Set Range Start</ASUIMenuAction>
                    <ASUIMenuAction onAction={e => this.renderMenu('voice-range-end')} >Set Range End</ASUIMenuAction>
                </>;

            case 'voice-range-start':
                return (<>
                    <ASUIMenuAction onAction={null} disabled>Range Start</ASUIMenuAction>
                    <ASUIMenuBreak />
                    {values.getNoteOctaves((octave) =>
                        <ASUIMenuAction onAction={
                            () => values.getNoteFrequencies((noteName) =>
                                <ASUIMenuAction onAction={e => this.changeRange(noteName+octave)}    >{noteName+octave}</ASUIMenuAction>
                            )
                        }>{octave}</ASUIMenuAction>)}
                </>);

            case 'voice-range-end':
                return (<>
                    <ASUIMenuAction onAction={null} disabled>Range End</ASUIMenuAction>
                    <ASUIMenuBreak />
                    {values.getNoteOctaves((octave) =>
                        <ASUIMenuAction onAction={
                            () => values.getNoteFrequencies((noteName) =>
                                <ASUIMenuAction onAction={e => this.changeRange(null, noteName+octave)}    >{noteName+octave}</ASUIMenuAction>
                            )
                        }>{octave}</ASUIMenuAction>)}
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

export default AudioBufferInstrumentRenderer;
