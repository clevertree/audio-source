import React from 'react';
import {
    // InputButton,
    // InputSelect,
    Div,
    Menu,
    Icon,
} from "../../../components";

import "./assets/SynthesizerSampleRenderer.css";

/** AudioSourceSynthesizerRenderer **/
class SynthesizerSampleRenderer extends React.Component {

    render() {
        const sample = this.props.sampleData;
        console.log('sample', sample);
        const sampleName = sample.url.replace(/\.(wav|mp3)$/, '');
        return (
            <Div
                className="sample"
            >
                <Div title="Change Sample" className="name">
                    <Menu arrow={false} options={e => this.renderMenu('sample-change')} >
                        {sampleName || "Unnamed"}
                    </Menu>
                </Div>
                {typeof sample.mixer === 'undefined' ? null :
                    (<Div title="Edit Mixer" className="mixer">
                        <Menu arrow={false} options={e => this.renderMenu('sample-mixer')} >
                            {sample.mixer}
                        </Menu>
                    </Div>)}
                {typeof sample.detune === 'undefined' ? null : (
                    <Div title="Edit Detune" className="detune">
                        <Menu arrow={false} options={e => this.renderMenu('sample-detune')} >
                            {sample.detune}
                        </Menu>
                    </Div>
                )}
                {typeof sample.root === 'undefined' ? null : (
                    <Div title="Edit Key Root" className="root">
                        <Menu arrow={false} options={e => this.renderMenu('sample-root')} >
                            {sample.root}
                        </Menu>
                    </Div>
                )}
                {typeof sample.alias === 'undefined' ? null : (
                    <Div title="Edit Key Alias" className="alias">
                        <Menu arrow={false} options={e => this.renderMenu('sample-alias')} >
                            {sample.alias}
                        </Menu>
                    </Div>
                )}
                {/*{typeof sample.range === 'undefined' ? null : (*/}
                {/*    <Div title="Edit Key Range" className="range">*/}
                {/*        <Menu arrow={false} options={e => this.renderMenu('sample-range')} >*/}
                {/*            {sample.range}*/}
                {/*        </Menu>*/}
                {/*    </Div>*/}
                {/*)}*/}
                {typeof sample.loop === 'undefined' ? null : (
                    <Div title="Toggle Loop" className="loop">
                        <Menu arrow={false} options={e => this.renderMenu('sample-loop')} >
                            {sample.loop?'∞':'⇥'}
                        </Menu>
                    </Div>
                )}
                <Div title={`Edit Sample '${sampleName}'`} className="config">
                    <Menu arrow={false} options={e => this.renderMenu()} >
                        <Icon className="config"/>
                    </Menu>
                </Div>
            </Div>
        );
    }

    renderMenu(menuKey=null) {
        const sample = this.props.sampleData;
        const sampleIDHTML = (this.props.sampleID < 10 ? "0" : "") + (this.props.sampleID);
        switch(menuKey) {
            case 'sample-change':
            case 'sample-mixer':
            case 'sample-detune':
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

}

export default SynthesizerSampleRenderer;
