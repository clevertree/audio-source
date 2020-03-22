import React from 'react';
import {
    // Button,
    // InputSelect,
    Div,
    MenuItem,
    MenuBreak,
    Button,
    Icon, InputRange, SubMenuItem,
} from "../../../components";

import "./assets/SynthesizerSampleRenderer.css";

/** AudioSourceSynthesizerRenderer **/
class SynthesizerSampleRenderer extends React.Component {

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
        // console.log('sample', sample);
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
                                <MenuItem onAction={e => this.openMenuChangeMixer(e)} vertical openOnHover={false}>
                                    {sample.mixer+'%'}
                                </MenuItem>
                            </Div>
                        )}
                        {typeof sample.detune === 'undefined' ? null : (
                            <Div title={`Detune by ${sample.detune} cents`} className="detune">
                                <MenuItem onAction={e => this.openMenuChangeDetune(e)} vertical openOnHover={false}>
                                    {sample.detune+'c'}
                                </MenuItem>
                            </Div>
                        )}
                        {typeof sample.root === 'undefined' ? null : (
                            <Div title={`Key Root is ${sample.root}`} className="root">
                                <MenuItem onAction={e => this.openMenuChangeKeyRoot(e)} vertical openOnHover={false}>
                                    {sample.root}
                                </MenuItem>
                            </Div>
                        )}
                        {typeof sample.alias === 'undefined' ? null : (
                            <Div title={`Key Alias is ${sample.alias}`} className="alias">
                                <MenuItem onAction={e => this.openMenuChangeKeyAlias(e)} vertical openOnHover={false}>
                                    {sample.alias}
                                </MenuItem>
                            </Div>
                        )}
                        {typeof sample.range === 'undefined' ? null : (
                            <Div title={`Key Range is ${sample.range}`} className="range">
                                <MenuItem onAction={e => this.openMenuChangeKeyRange(e)} vertical openOnHover={false}>
                                    {sample.range}
                                </MenuItem>
                            </Div>
                        )}
                        {typeof sample.loop === 'undefined' ? null : (
                            <Div title="Toggle Loop" className="loop">
                                <MenuItem title="" onAction={e => this.changeLoop(!sample.loop)} arrow={false} vertical openOnHover={false}>
                                    {sample.loop?'∞':'⇥'}
                                </MenuItem>
                            </Div>
                        )}
                    </>)
                }
                <Div title={`Edit Sample '${sampleName}'`} className="config">
                    <MenuItem onAction={e => this.openMenuRoot(e)} vertical openOnHover={false}>
                        <Icon className="config"/>
                    </MenuItem>
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
            <MenuItem onAction={()=>{}} disabled>Sample {this.props.sampleID}</MenuItem>
            <MenuBreak />
            <SubMenuItem key="mixer" onAction={e => this.openMenuChangeMixer(e)}>Edit Mixer</SubMenuItem>
            <SubMenuItem key="detune" onAction={e => this.openMenuChangeDetune(e)}>Edit Detune</SubMenuItem>
            <SubMenuItem key="root" onAction={e => this.openMenuChangeKeyRoot(e)}>Edit Key Root</SubMenuItem>
            <SubMenuItem key="alias" onAction={e => this.openMenuChangeKeyAlias(e)}>Edit Key Alias</SubMenuItem>
            <SubMenuItem key="range" onAction={e => this.openMenuChangeKeyRange(e)}>Edit Key Range</SubMenuItem>
            <SubMenuItem key="loop" onAction={e => this.openMenuChangeLoop(e)}>Toggle Loop</SubMenuItem>
            <MenuBreak />
            <SubMenuItem key="change" onAction={e => this.openMenuChangeSample(e)}>Change Sample</SubMenuItem>
            <MenuItem key="remove" onAction={e => this.renderMenu('sample-remove')}>Remove Sample</MenuItem>
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
            <MenuItem onAction={null} disabled>Edit Key Root</MenuItem>
            <MenuBreak />
            {values.getNoteOctaves((octave) =>
                <SubMenuItem onAction={e => this.openMenu(e,
                    values.getNoteFrequencies((noteName) =>
                        <MenuItem onAction={e => this.changeRoot(noteName+octave)}    >{noteName+octave}</MenuItem>
                    )
                )}>{octave}</SubMenuItem>)}
        </>);
    }

    openMenuChangeKeyAlias(e) {
        const values = this.getSong().values;
        this.openMenu(e, <>
            <MenuItem onAction={null} disabled>Edit Key Root</MenuItem>
            <MenuBreak />
            {values.getNoteOctaves((octave) =>
                <SubMenuItem onAction={e => this.openMenu(e,
                    values.getNoteFrequencies((noteName) =>
                        <MenuItem onAction={e => this.changeAlias(noteName+octave)}    >{noteName+octave}</MenuItem>
                    )
                )}>{octave}</SubMenuItem>)}
        </>);
    }

    openMenuChangeKeyRange(e) {
        this.openMenu(e, );
    }

    openMenuChangeLoop(e) {
        this.openMenu(e, );
    }



    renderMenu(menuKey=null) {
        // const sample = this.getSampleData();
        const values = this.getSong().values;
        switch(menuKey) {
            case 'sample-loop':
            case 'sample-remove':
            case null:
                return ;

            case 'sample-change':
                return <>

                </>;

            case 'sample-mixer':
                return <>

                    <MenuBreak />
                    <MenuItem onAction={null} disabled>Edit Mixer</MenuItem>
                </>;

            case 'sample-detune':
                return <>

                    <MenuBreak />
                    <MenuItem onAction={null} disabled>Edit Detune</MenuItem>
                </>;

            case 'sample-root':
                return <>
                    <MenuItem onAction={null} disabled>Edit Key Root</MenuItem>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                    <MenuItem onAction={
                        () => values.getNoteFrequencies((noteName) =>
                            <MenuItem onAction={e => this.changeRoot(noteName+octave)}    >{noteName+octave}</MenuItem>
                        )
                    }>{octave}</MenuItem>)}
                </>;

            case 'sample-alias':
                return <>
                    <MenuItem onAction={null} disabled>Edit Key Alias</MenuItem>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                    <MenuItem onAction={
                        () => values.getNoteFrequencies((noteName) =>
                            <MenuItem onAction={e => this.changeAlias(noteName+octave)}    >{noteName+octave}</MenuItem>
                        )
                    }>{octave}</MenuItem>)}
                </>;

            case 'sample-range':
                return <>
                    <MenuItem onAction={null} disabled>Edit Key Range</MenuItem>
                    <MenuBreak />
                    <MenuItem onAction={e => this.renderMenu('sample-range-start')} >Set Range Start</MenuItem>
                    <MenuItem onAction={e => this.renderMenu('sample-range-end')} >Set Range End</MenuItem>
                </>;

            case 'sample-range-start':
                return (<>
                    <MenuItem onAction={null} disabled>Range Start</MenuItem>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                        <MenuItem onAction={
                            () => values.getNoteFrequencies((noteName) =>
                                <MenuItem onAction={e => this.changeRange(noteName+octave)}    >{noteName+octave}</MenuItem>
                            )
                        }>{octave}</MenuItem>)}
                </>);

            case 'sample-range-end':
                return (<>
                    <MenuItem onAction={null} disabled>Range End</MenuItem>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                        <MenuItem onAction={
                            () => values.getNoteFrequencies((noteName) =>
                                <MenuItem onAction={e => this.changeRange(null, noteName+octave)}    >{noteName+octave}</MenuItem>
                            )
                        }>{octave}</MenuItem>)}
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

export default SynthesizerSampleRenderer;
