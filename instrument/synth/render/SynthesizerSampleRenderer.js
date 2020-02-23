import React from 'react';
import {
    // Button,
    // InputSelect,
    Div,
    Menu,
    MenuBreak,
    Icon, InputRange,
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
                <Div title="Change Sample" className="name">
                    <Menu arrow={false} onAction={e => this.toggleOpen(e)} >
                        {sampleName || "Unnamed"}
                    </Menu>
                </Div>
                {!this.state.open ? null : (
                    <>
                        {typeof sample.mixer === 'undefined' ? null : (
                            <Div title="Edit Mixer" className="mixer">
                                <Menu options={() => this.renderMenu('sample-mixer')} arrow={false} vertical openOnHover={false}>
                                    {sample.mixer+'%'}
                                </Menu>
                            </Div>
                        )}
                        {typeof sample.detune === 'undefined' ? null : (
                            <Div title={`Detune by ${sample.detune} cents`} className="detune">
                                <Menu options={() => this.renderMenu('sample-detune')} arrow={false} vertical openOnHover={false}>
                                    {sample.detune+'c'}
                                </Menu>
                            </Div>
                        )}
                        {typeof sample.root === 'undefined' ? null : (
                            <Div title={`Key Root is ${sample.root}`} className="root">
                                <Menu options={() => this.renderMenu('sample-root')} arrow={false} vertical openOnHover={false}>
                                    {sample.root}
                                </Menu>
                            </Div>
                        )}
                        {typeof sample.alias === 'undefined' ? null : (
                            <Div title={`Key Alias is ${sample.alias}`} className="alias">
                                <Menu options={() => this.renderMenu('sample-alias')} arrow={false} vertical openOnHover={false}>
                                    {sample.alias}
                                </Menu>
                            </Div>
                        )}
                        {typeof sample.range === 'undefined' ? null : (
                            <Div title={`Key Range is ${sample.range}`} className="range">
                                <Menu options={() => this.renderMenu('sample-range')} arrow={false} vertical openOnHover={false}>
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
                    <Menu options={() => this.renderMenu()} arrow={false} vertical openOnHover={false}>
                        <Icon className="config"/>
                    </Menu>
                </Div>
            </Div>
        );
    }

    renderMenu(menuKey=null) {
        const sample = this.getSampleData();
        const values = this.getSong().values;
        switch(menuKey) {
            case 'sample-loop':
            case 'sample-remove':
            case null:
                return <>
                    <Menu onAction={()=>{}} disabled>Sample {this.props.sampleID}</Menu>
                    <MenuBreak />
                    <Menu key="mixer" options={() => this.renderMenu('sample-mixer')}>Edit Mixer</Menu>
                    <Menu key="detune" options={() => this.renderMenu('sample-detune')}>Edit Detune</Menu>
                    <Menu key="root" options={() => this.renderMenu('sample-root')}>Edit Key Root</Menu>
                    <Menu key="alias" options={() => this.renderMenu('sample-alias')}>Edit Key Alias</Menu>
                    <Menu key="range" options={() => this.renderMenu('sample-range')}>Edit Key Range</Menu>
                    <Menu key="loop" onAction={e => this.changeLoop()}>Toggle Loop</Menu>
                    <MenuBreak />
                    <Menu key="change" options={() => this.renderMenu('sample-change')}>Change Sample</Menu>
                    <Menu key="remove" options={() => this.renderMenu('sample-remove')}>Remove Sample</Menu>
                </>;

            case 'sample-change':
                return <>
                    <InputRange min={0} max={100} value={sample.mixer} />
                </>;

            case 'sample-mixer':
                return <>
                    <InputRange
                        min={0}
                        max={100}
                        value={typeof sample.mixer !== "undefined" ? sample.mixer : 100}
                        onChange={(e, mixerValue) => this.changeMixer(mixerValue)}
                        />
                    <MenuBreak />
                    <Menu onAction={null} disabled>Edit Mixer</Menu>
                </>;

            case 'sample-detune':
                return <>
                    <InputRange
                        min={-1000}
                        max={1000}
                        value={typeof sample.detune !== "undefined" ? sample.detune : 100}
                        onChange={(e, detuneValue) => this.changeDetune(detuneValue)}
                        />
                    <MenuBreak />
                    <Menu onAction={null} disabled>Edit Detune</Menu>
                </>;

            case 'sample-root':
                return <>
                    <Menu onAction={null} disabled>Edit Key Root</Menu>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                    <Menu options={
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
                    <Menu options={
                        () => values.getNoteFrequencies((noteName) =>
                            <Menu onAction={e => this.changeAlias(noteName+octave)}    >{noteName+octave}</Menu>
                        )
                    }>{octave}</Menu>)}
                </>;

            case 'sample-range':
                return <>
                    <Menu onAction={null} disabled>Edit Key Range</Menu>
                    <MenuBreak />
                    <Menu options={() => this.renderMenu('sample-range-start')} >Set Range Start</Menu>
                    <Menu options={() => this.renderMenu('sample-range-end')} >Set Range End</Menu>
                </>;

            case 'sample-range-start':
                return (<>
                    <Menu onAction={null} disabled>Range Start</Menu>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                        <Menu options={
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
                        <Menu options={
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
