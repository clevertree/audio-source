import React from 'react';
import {
    // InputButton,
    // InputSelect,
    Div,
    Menu,
    Icon, InputRange,
} from "../../../components";

import "./assets/SynthesizerSampleRenderer.css";

/** AudioSourceSynthesizerRenderer **/
class SynthesizerSampleRenderer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            open: true
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
                                <Menu options={e => this.renderMenu('sample-mixer')} arrow={false} openOnHover={false}>
                                    {sample.mixer+'%'}
                                </Menu>
                            </Div>
                        )}
                        {typeof sample.detune === 'undefined' ? null : (
                            <Div title={`Detune by ${sample.detune} cents`} className="detune">
                                <Menu options={e => this.renderMenu('sample-detune')} arrow={false} vertical openOnHover={false}>
                                    {sample.detune+'c'}
                                </Menu>
                            </Div>
                        )}
                        {typeof sample.root === 'undefined' ? null : (
                            <Div title={`Key Root is ${sample.root}`} className="root">
                                <Menu options={e => this.renderMenu('sample-root')} arrow={false} openOnHover={false}>
                                    {sample.root}
                                </Menu>
                            </Div>
                        )}
                        {typeof sample.alias === 'undefined' ? null : (
                            <Div title={`Key Alias is ${sample.alias}`} className="alias">
                                <Menu options={e => this.renderMenu('sample-alias')} arrow={false} openOnHover={false}>
                                    {sample.alias}
                                </Menu>
                            </Div>
                        )}
                        {typeof sample.range === 'undefined' ? null : (
                            <Div title={`Key Range is ${sample.range}`} className="range">
                                <Menu options={e => this.renderMenu('sample-range')} arrow={false} openOnHover={false}>
                                    {sample.range}
                                </Menu>
                            </Div>
                        )}
                        {typeof sample.loop === 'undefined' ? null : (
                            <Div title="Toggle Loop" className="loop">
                                <Menu options={e => this.renderMenu('sample-loop')} arrow={false} openOnHover={false}>
                                    {sample.loop?'∞':'⇥'}
                                </Menu>
                            </Div>
                        )}
                    </>)
                }
                <Div title={`Edit Sample '${sampleName}'`} className="config">
                    <Menu options={e => this.renderMenu()} arrow={false} openOnHover={false}>
                        <Icon className="config"/>
                    </Menu>
                </Div>
            </Div>
        );
    }

    renderMenu(menuKey=null) {
        const sample = this.getSampleData();
        switch(menuKey) {
            case 'sample-change':
                return <>
                    <InputRange min={0} max={100} value={sample.mixer} />
                </>;

            case 'sample-mixer':
                return (
                    <InputRange
                        min={0}
                        max={100}
                        value={typeof sample.mixer !== "undefined" ? sample.mixer : 100}
                        onChange={(e, mixerValue) => this.changeMixer(mixerValue)}
                        />
                    );
            case 'sample-detune':
                return (
                    <InputRange
                        min={-1000}
                        max={1000}
                        value={typeof sample.detune !== "undefined" ? sample.detune : 100}
                        onChange={(e, detuneValue) => this.changeDetune(detuneValue)}
                    />
                );
            case 'sample-root':
            case 'sample-alias':
            case 'sample-loop':
            case null:
                return <>
                    <Menu key="mixer" options={e => this.renderMenu('sample-mixer')}>Edit Mixer</Menu>
                    <Menu key="detune" options={e => this.renderMenu('sample-detune')}>Edit Detune</Menu>
                    <Menu key="root" options={e => this.renderMenu('sample-root')}>Edit Key Root</Menu>
                    <Menu key="alias" options={e => this.renderMenu('sample-alias')}>Edit Alias</Menu>
                    <Menu key="loop" options={e => this.renderMenu('sample-loop')}>Toggle Loop</Menu>
                    <Menu.Break />
                    <Menu key="change" options={e => this.renderMenu('sample-change')}>Change Sample</Menu>
                    <Menu key="remove" options={e => this.renderMenu('sample-remove')}>Remove Sample</Menu>
                </>;


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

    changeLoop(newLoopValue) {
        this.getSong().instrumentReplaceParam(
            this.getInstrumentID(),
            ['samples', this.getSampleID(), 'loop'],
            newLoopValue?1:0
        );
    }
}

export default SynthesizerSampleRenderer;
