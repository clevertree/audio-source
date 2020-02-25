import React from 'react';
import {
    // Button,
    // InputSelect,
    Div,
    Menu,
    MenuBreak,
    Button,
    Icon, InputRange, SubMenu,
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
                                <Menu onAction={e => this.openMenuChangeMixer(e)} vertical openOnHover={false}>
                                    {sample.mixer+'%'}
                                </Menu>
                            </Div>
                        )}
                        {typeof sample.detune === 'undefined' ? null : (
                            <Div title={`Detune by ${sample.detune} cents`} className="detune">
                                <Menu onAction={e => this.openMenuChangeDetune(e)} vertical openOnHover={false}>
                                    {sample.detune+'c'}
                                </Menu>
                            </Div>
                        )}
                        {typeof sample.root === 'undefined' ? null : (
                            <Div title={`Key Root is ${sample.root}`} className="root">
                                <Menu onAction={e => this.openMenuChangeKeyRoot(e)} vertical openOnHover={false}>
                                    {sample.root}
                                </Menu>
                            </Div>
                        )}
                        {typeof sample.alias === 'undefined' ? null : (
                            <Div title={`Key Alias is ${sample.alias}`} className="alias">
                                <Menu onAction={e => this.openMenuChangeKeyAlias(e)} vertical openOnHover={false}>
                                    {sample.alias}
                                </Menu>
                            </Div>
                        )}
                        {typeof sample.range === 'undefined' ? null : (
                            <Div title={`Key Range is ${sample.range}`} className="range">
                                <Menu onAction={e => this.openMenuChangeKeyRange(e)} vertical openOnHover={false}>
                                    {sample.range}
                                </Menu>
                            </Div>
                        )}
                        {typeof sample.loop === 'undefined' ? null : (
                            <Div title="Toggle Loop" className="loop">
                                <Menu title="" onAction={e => this.changeLoop(!sample.loop)} arrow={false} vertical openOnHover={false}>
                                    {sample.loop?'∞':'⇥'}
                                </Menu>
                            </Div>
                        )}
                    </>)
                }
                <Div title={`Edit Sample '${sampleName}'`} className="config">
                    <Menu onAction={e => this.openMenuRoot(e)} vertical openOnHover={false}>
                        <Icon className="config"/>
                    </Menu>
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
            <Menu onAction={()=>{}} disabled>Sample {this.props.sampleID}</Menu>
            <MenuBreak />
            <SubMenu key="mixer" onAction={e => this.openMenuChangeMixer(e)}>Edit Mixer</SubMenu>
            <SubMenu key="detune" onAction={e => this.openMenuChangeDetune(e)}>Edit Detune</SubMenu>
            <SubMenu key="root" onAction={e => this.openMenuChangeKeyRoot(e)}>Edit Key Root</SubMenu>
            <SubMenu key="alias" onAction={e => this.openMenuChangeKeyAlias(e)}>Edit Key Alias</SubMenu>
            <SubMenu key="range" onAction={e => this.openMenuChangeKeyRange(e)}>Edit Key Range</SubMenu>
            <SubMenu key="loop" onAction={e => this.openMenuChangeLoop(e)}>Toggle Loop</SubMenu>
            <MenuBreak />
            <SubMenu key="change" onAction={e => this.openMenuChangeSample(e)}>Change Sample</SubMenu>
            <Menu key="remove" onAction={e => this.renderMenu('sample-remove')}>Remove Sample</Menu>
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
            <Menu onAction={null} disabled>Edit Key Root</Menu>
            <MenuBreak />
            {values.getNoteOctaves((octave) =>
                <SubMenu onAction={e => this.openMenu(e,
                    values.getNoteFrequencies((noteName) =>
                        <Menu onAction={e => this.changeRoot(noteName+octave)}    >{noteName+octave}</Menu>
                    )
                )}>{octave}</SubMenu>)}
        </>);
    }

    openMenuChangeKeyAlias(e) {
        const values = this.getSong().values;
        this.openMenu(e, <>
            <Menu onAction={null} disabled>Edit Key Root</Menu>
            <MenuBreak />
            {values.getNoteOctaves((octave) =>
                <SubMenu onAction={e => this.openMenu(e,
                    values.getNoteFrequencies((noteName) =>
                        <Menu onAction={e => this.changeAlias(noteName+octave)}    >{noteName+octave}</Menu>
                    )
                )}>{octave}</SubMenu>)}
        </>);
    }

    openMenuChangeKeyRange(e) {
        this.openMenu(e, );
    }

    openMenuChangeLoop(e) {
        this.openMenu(e, );
    }



    renderMenu(menuKey=null) {
        const sample = this.getSampleData();
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
                    <Menu onAction={null} disabled>Edit Mixer</Menu>
                </>;

            case 'sample-detune':
                return <>

                    <MenuBreak />
                    <Menu onAction={null} disabled>Edit Detune</Menu>
                </>;

            case 'sample-root':
                return <>
                    <Menu onAction={null} disabled>Edit Key Root</Menu>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                    <Menu onAction={
                        () => values.getNoteFrequencies((noteName) =>
                            <Menu onAction={e => this.changeRoot(noteName+octave)}    >{noteName+octave}</Menu>
                        )
                    }>{octave}</Menu>)}
                </>;

            case 'sample-alias':
                return <>
                    <Menu onAction={null} disabled>Edit Key Alias</Menu>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                    <Menu onAction={
                        () => values.getNoteFrequencies((noteName) =>
                            <Menu onAction={e => this.changeAlias(noteName+octave)}    >{noteName+octave}</Menu>
                        )
                    }>{octave}</Menu>)}
                </>;

            case 'sample-range':
                return <>
                    <Menu onAction={null} disabled>Edit Key Range</Menu>
                    <MenuBreak />
                    <Menu onAction={e => this.renderMenu('sample-range-start')} >Set Range Start</Menu>
                    <Menu onAction={e => this.renderMenu('sample-range-end')} >Set Range End</Menu>
                </>;

            case 'sample-range-start':
                return (<>
                    <Menu onAction={null} disabled>Range Start</Menu>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                        <Menu onAction={
                            () => values.getNoteFrequencies((noteName) =>
                                <Menu onAction={e => this.changeRange(noteName+octave)}    >{noteName+octave}</Menu>
                            )
                        }>{octave}</Menu>)}
                </>);

            case 'sample-range-end':
                return (<>
                    <Menu onAction={null} disabled>Range End</Menu>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                        <Menu onAction={
                            () => values.getNoteFrequencies((noteName) =>
                                <Menu onAction={e => this.changeRange(null, noteName+octave)}    >{noteName+octave}</Menu>
                            )
                        }>{octave}</Menu>)}
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
        this.getSong().instrumentReplaceParam(
            this.getInstrumentID(),
            ['samples', this.getSampleID(), 'mixer'],
            newMixerValue
        );
    }

    changeDetune(newDetuneValue) {
        if(!Number.isInteger(newDetuneValue))
            throw new Error("Invalid detune value type: " + typeof newDetuneValue);
        this.getSong().instrumentReplaceParam(
            this.getInstrumentID(),
            ['samples', this.getSampleID(), 'detune'],
            newDetuneValue
        );
    }

    changeRoot(newRootValue) {
        this.getSong().instrumentReplaceParam(
            this.getInstrumentID(),
            ['samples', this.getSampleID(), 'root'],
            newRootValue
        );
    }

    changeAlias(newAliasValue) {
        this.getSong().instrumentReplaceParam(
            this.getInstrumentID(),
            ['samples', this.getSampleID(), 'alias'],
            newAliasValue
        );
    }

    changeLoop(newLoopValue=null) {
        if(newLoopValue === null)
            newLoopValue = !this.getSampleData().loop;
        this.getSong().instrumentReplaceParam(
            this.getInstrumentID(),
            ['samples', this.getSampleID(), 'loop'],
            newLoopValue?1:0
        );
    }

}

export default SynthesizerSampleRenderer;
