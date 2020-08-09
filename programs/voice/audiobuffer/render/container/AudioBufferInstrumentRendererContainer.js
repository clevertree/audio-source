import React from 'react';

import {
    ASUIIcon,
    ASUIButton,
    ASUIButtonDropDown
} from "../../../../../components";

import "./AudioBufferInstrumentRendererContainer.css";

export default class AudioBufferInstrumentRendererContainer extends React.Component {
    render() {
        let className = "audiobuffer-instrument-container";
        const open = this.props.config.open;
        if(open)
            className += ' open';

        const title = this.props.title;

        return <div className={className}>
            <div className="header"
                 title={`Audio Buffer Sample: ${title}`}>
                <ASUIButton
                    title={`Audio Buffer Sample: ${title}`}
                    className="toggle-container"
                    selected={open}
                    onAction={this.props.onClick}
                >
                    <ASUIIcon source="instrument-audiobuffer"/>
                    {title}
                </ASUIButton>
                <ASUIButtonDropDown
                    arrow={false}
                    className="program-config"
                    options={this.props.renderMenuRoot}
                >
                    <ASUIIcon source="config"/>
                </ASUIButtonDropDown>
            </div>
            {open ? this.renderParameters() : null}
        </div>;
    }

    renderParameters() {
        return (
            <div className="parameters">
                {this.props.parameters.map((props, i) => (
                    <div key={i}>
                        {props.label ? <div className="label">{props.label}:</div> : null}
                        <div>{props.children}</div>
                    </div>
                ))}
            </div>
        )
    }

}
