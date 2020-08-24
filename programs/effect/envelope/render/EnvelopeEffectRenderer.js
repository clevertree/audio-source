import React from 'react';
import {ASUIButton, ASUIButtonDropDown, ASUIIcon} from "../../../../components/";

import EnvelopeEffectRendererBase from "./EnvelopeEffectRendererBase";
import "./EnvelopeEffectRenderer.css";

export default class EnvelopeEffectRenderer extends EnvelopeEffectRendererBase {
    render() {
        const open = this.props.open;
        // console.log('EnvelopeEffectRendererContainer.render', this.props);
        let className = "envelope-effect-container";
        if(open)
            className += ' open';


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


        return <div
            className={className}
            >
            <div className="header"
                 title={`Envelope Effect`}
            >
                <ASUIButton
                    title={`Envelope Effect`}
                    className="toggle-container small"
                    selected={open}
                    onAction={this.cb.onClick}
                >
                    <ASUIIcon source="effect-envelope"/>
                    Envelope
                </ASUIButton>
                <ASUIButtonDropDown
                    arrow={false}
                    className="program-config"
                    options={this.cb.renderMenuRoot}
                >
                    <ASUIIcon source="config"/>
                </ASUIButtonDropDown>
            </div>
            {parameterContent}
            {/*{this.renderVoice()}*/}
        </div>;
    }

}
