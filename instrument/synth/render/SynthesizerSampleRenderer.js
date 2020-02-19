import React from 'react';

import "./assets/SynthesizerSampleRenderer.css";

/** AudioSourceSynthesizerRenderer **/
class SynthesizerSampleRenderer extends React.Component {

    render() {
        const {
            Div,
            Menu,
            Icon,
            // InputButton,
            // InputFile,
            // InputRange,
            // InputText,
            // InputSelect
        } = this.props.components;



        const props = this.props;
        const sample = props.sampleData;
        console.log(sample);
        return (
            <Div
                className="sample"
                >
                {renderName()}
                {renderMixer()}
                {renderDetune()}
                {renderKeyRoot()}
                {renderAlias()}
                {renderLoop()}
                {renderConfig()}
            </Div>
        );

        function renderName() {
            return (
                <Div title="Change Sample" className="name">
                    <Menu arrow={false} options={e => renderMenu('sample-change')} >
                        {sample.name || "Unnamed"}
                    </Menu>
                </Div>
            );
        }

        function renderMixer() {
            return typeof sample.mixer === 'undefined' ? null : (
                <Div title="Edit Mixer" className="mixer">
                    <Menu arrow={false} options={e => renderMenu('sample-mixer')} >
                        {sample.mixer}
                    </Menu>
                </Div>
            );
        }
        function renderDetune() {
            return typeof sample.detune === 'undefined' ? null : (
                <Div title="Edit Detune" className="detune">
                    <Menu arrow={false} options={e => renderMenu('sample-detune')} >
                        {sample.detune}
                    </Menu>
                </Div>
            );
        }
        function renderKeyRoot() {
            return typeof sample.root === 'undefined' ? null : (
                <Div title="Edit Root" className="root">
                    <Menu arrow={false} options={e => renderMenu('sample-root')} >
                        {sample.root}
                    </Menu>
                </Div>
            );
        }
        function renderAlias() {
            return typeof sample.alias === 'undefined' ? null : (
                <Div title="Edit Alias" className="alias">
                    <Menu arrow={false} options={e => renderMenu('sample-alias')} >
                        {sample.alias}
                    </Menu>
                </Div>
            );
        }
        function renderLoop() {
            return typeof sample.loop === 'undefined' ? null : (
                <Div title="Toggle Loop" className="loop">
                    <Menu arrow={false} options={e => renderMenu('sample-loop')} >
                        {sample.loop?'∞':'⇥'}
                    </Menu>
                </Div>
            );
        }
        function renderConfig() {
            return (
                <Div title={`Edit Sample '${sample.name}'`} className="config">
                    <Menu arrow={false} options={e => renderMenu()} >
                        <Icon className="config"/>
                    </Menu>
                </Div>
            );
        }

        function renderMenu(menuKey=null) {
            const sampleIDHTML = (props.sampleID < 10 ? "0" : "") + (props.sampleID);
            switch(menuKey) {
                case 'sample-change':
                case 'sample-mixer':
                case 'sample-detune':
                case 'sample-root':
                case 'sample-alias':
                case 'sample-loop':
                case null:
                    return <>
                        <Div>[{sampleIDHTML}] Sample: {sample.name}</Div>
                        <Menu key="change" options={e => renderMenu('sample-change')}>Change Sample</Menu>
                        <Menu key="mixer" options={e => renderMenu('sample-mixer')}>Edit Mixer</Menu>
                        <Menu key="detune" options={e => renderMenu('sample-detune')}>Edit Detune</Menu>
                        <Menu key="root" options={e => renderMenu('sample-root')}>Edit Key Root</Menu>
                        <Menu key="alias" options={e => renderMenu('sample-alias')}>Edit Alias</Menu>
                        <Menu key="loop" options={e => renderMenu('sample-loop')}>Toggle Loop</Menu>
                    </>;


                default:
                    throw new Error("Unknown menu key: " + menuKey);
            }

        }
    }


}

export default SynthesizerSampleRenderer;
