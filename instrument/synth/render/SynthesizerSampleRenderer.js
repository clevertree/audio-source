import React from 'react';
import {
    // Button,
    // InputSelect,
    Div,
    SubMenu,
    ActionMenu,
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
                    <ActionMenu arrow={false} onAction={e => this.toggleOpen(e)} >
                        {sampleName || "Unnamed"}
                    </ActionMenu>
                </Div>
                {!this.state.open ? null : (
                    <>
                        {typeof sample.mixer === 'undefined' ? null : (
                            <Div title="Edit Mixer" className="mixer">
                                <SubMenu options={() => this.renderMenu('sample-mixer')} arrow={false} vertical openOnHover={false}>
                                    {sample.mixer+'%'}
                                </SubMenu>
                            </Div>
                        )}
                        {typeof sample.detune === 'undefined' ? null : (
                            <Div title={`Detune by ${sample.detune} cents`} className="detune">
                                <SubMenu options={() => this.renderMenu('sample-detune')} arrow={false} vertical openOnHover={false}>
                                    {sample.detune+'c'}
                                </SubMenu>
                            </Div>
                        )}
                        {typeof sample.root === 'undefined' ? null : (
                            <Div title={`Key Root is ${sample.root}`} className="root">
                                <SubMenu options={() => this.renderMenu('sample-root')} arrow={false} vertical openOnHover={false}>
                                    {sample.root}
                                </SubMenu>
                            </Div>
                        )}
                        {typeof sample.alias === 'undefined' ? null : (
                            <Div title={`Key Alias is ${sample.alias}`} className="alias">
                                <SubMenu options={() => this.renderMenu('sample-alias')} arrow={false} vertical openOnHover={false}>
                                    {sample.alias}
                                </SubMenu>
                            </Div>
                        )}
                        {typeof sample.range === 'undefined' ? null : (
                            <Div title={`Key Range is ${sample.range}`} className="range">
                                <SubMenu options={() => this.renderMenu('sample-range')} arrow={false} vertical openOnHover={false}>
                                    {sample.range}
                                </SubMenu>
                            </Div>
                        )}
                        {typeof sample.loop === 'undefined' ? null : (
                            <Div title="Toggle Loop" className="loop">
                                <ActionMenu title="" onAction={e => this.changeLoop(!sample.loop)} arrow={false} vertical openOnHover={false}>
                                    {sample.loop?'∞':'⇥'}
                                </ActionMenu>
                            </Div>
                        )}
                    </>)
                }
                <Div title={`Edit Sample '${sampleName}'`} className="config">
                    <SubMenu options={() => this.renderMenu()} arrow={false} vertical openOnHover={false}>
                        <Icon className="config"/>
                    </SubMenu>
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
                    <ActionMenu onAction={()=>{}} disabled>Sample {this.props.sampleID}</ActionMenu>
                    <MenuBreak />
                    <SubMenu key="mixer" options={() => this.renderMenu('sample-mixer')}>Edit Mixer</SubMenu>
                    <SubMenu key="detune" options={() => this.renderMenu('sample-detune')}>Edit Detune</SubMenu>
                    <SubMenu key="root" options={() => this.renderMenu('sample-root')}>Edit Key Root</SubMenu>
                    <SubMenu key="alias" options={() => this.renderMenu('sample-alias')}>Edit Key Alias</SubMenu>
                    <SubMenu key="range" options={() => this.renderMenu('sample-range')}>Edit Key Range</SubMenu>
                    <ActionMenu key="loop" onAction={e => this.changeLoop()}>Toggle Loop</ActionMenu>
                    <MenuBreak />
                    <SubMenu key="change" options={() => this.renderMenu('sample-change')}>Change Sample</SubMenu>
                    <SubMenu key="remove" options={() => this.renderMenu('sample-remove')}>Remove Sample</SubMenu>
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
                    <ActionMenu onAction={null} disabled>Edit Mixer</ActionMenu>
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
                    <ActionMenu onAction={null} disabled>Edit Detune</ActionMenu>
                </>;

            case 'sample-root':
                return <>
                    <ActionMenu onAction={null} disabled>Edit Key Root</ActionMenu>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                    <SubMenu options={
                        () => values.getNoteFrequencies((noteName) =>
                            <ActionMenu onAction={e => this.changeRoot(noteName+octave)}    >{noteName+octave}</ActionMenu>
                        )
                    }>{octave}</SubMenu>)}
                </>;

            case 'sample-alias':
                return <>
                    <ActionMenu onAction={null} disabled>Edit Key Alias</ActionMenu>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                    <SubMenu options={
                        () => values.getNoteFrequencies((noteName) =>
                            <ActionMenu onAction={e => this.changeAlias(noteName+octave)}    >{noteName+octave}</ActionMenu>
                        )
                    }>{octave}</SubMenu>)}
                </>;

            case 'sample-range':
                return <>
                    <ActionMenu onAction={null} disabled>Edit Key Range</ActionMenu>
                    <MenuBreak />
                    <SubMenu options={() => this.renderMenu('sample-range-start')} >Set Range Start</SubMenu>
                    <SubMenu options={() => this.renderMenu('sample-range-end')} >Set Range End</SubMenu>
                </>;

            case 'sample-range-start':
                return (<>
                    <ActionMenu onAction={null} disabled>Range Start</ActionMenu>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                        <SubMenu options={
                            () => values.getNoteFrequencies((noteName) =>
                                <ActionMenu onAction={e => this.changeRange(noteName+octave)}    >{noteName+octave}</ActionMenu>
                            )
                        }>{octave}</SubMenu>)}
                </>);

            case 'sample-range-end':
                return (<>
                    <ActionMenu onAction={null} disabled>Range End</ActionMenu>
                    <MenuBreak />
                    {values.getNoteOctaves((octave) =>
                        <SubMenu options={
                            () => values.getNoteFrequencies((noteName) =>
                                <ActionMenu onAction={e => this.changeRange(null, noteName+octave)}    >{noteName+octave}</ActionMenu>
                            )
                        }>{octave}</SubMenu>)}
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
