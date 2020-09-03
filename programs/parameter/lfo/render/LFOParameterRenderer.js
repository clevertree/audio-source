import React from 'react';

import "./LFOParameterRenderer.css";
import {ASUIIcon, ASUIButton, ASUIButtonDropDown} from "../../../../components/";
import LFOParameterRendererBase from "./LFOParameterRendererBase";


export default class LFOParameterRenderer extends LFOParameterRendererBase {
    render() {
        let className = "lfo-parameter-container";
        const open = this.props.open;
        if(open)
            className += ' open';

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


        return <div className={className}>
            <div className="header"
                 title={title}>
                <ASUIButton
                    className="toggle-container small"
                    selected={open}
                    onAction={this.cb.onClick}
                >
                    <ASUIIcon source="lfo-parameter"/>
                    {title}
                </ASUIButton>
                <ASUIButtonDropDown
                    arrow={false}
                    vertical={false}
                    className="program-config"
                    options={this.cb.renderMenu.root}
                >
                    <ASUIIcon source="config"/>
                </ASUIButtonDropDown>
            </div>
            {parameterContent}
        </div>;
    }

}
