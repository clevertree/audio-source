import React from 'react';

import {
    ASUIIcon,
    ASUIButton,
    ASUIButtonDropDown
} from "../../../../components";

import AudioBufferInstrumentRendererBase from "./AudioBufferInstrumentRendererBase";
import "./AudioBufferInstrumentRenderer.css";

export default class AudioBufferInstrumentRenderer extends AudioBufferInstrumentRendererBase {
    render() {
        let className = "audiobuffer-instrument-container";
        const config = this.props.config;
        const open = this.props.open;
        if(open)
            className += ' open';
        if(this.props.status)
            className += ' ' + this.props.status;

        const title = this.getTitle();

        /** Parameter Content **/
        const parameterContent = open ? (
                <div className="parameters">
                    {this.getParameters().map((props, i) => (
                        <div key={i}>
                            {props.label ? <div className="label">{props.label}:</div> : null}
                            <div>{props.children}</div>
                        </div>
                    ))}
                </div>)
            : null;


        /** LFO Content **/
        const lfos = config.lfos || [];
        const lfoContent = open && lfos.length > 0 ? (
            <div className="lfos">
                {lfos.map((lfoProgram, i) => this.renderLFO(i, lfoProgram))}
            </div>
        ) : null;


        /** Envelope Content **/
        const envelopeContent = open && config.envelope ? (
            <div className="envelope">
                {this.renderEnvelope(config.envelope)}
            </div>
        ) : null;



        return <div className={className}>
            <div className="header"
                 title={title}>
                <ASUIButton
                    className="toggle-container"
                    selected={open}
                    onAction={this.cb.onClick}
                >
                    <ASUIIcon source="instrument-audiobuffer"/>
                    {title}
                </ASUIButton>
                <ASUIButtonDropDown
                    arrow={false}
                    className="program-config"
                    options={this.cb.renderMenu.root}
                >
                    <ASUIIcon source="config"/>
                </ASUIButtonDropDown>
            </div>
            {parameterContent}
            {envelopeContent}
            {lfoContent}
        </div>;
    }

}
