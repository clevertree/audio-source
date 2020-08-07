import React from 'react';

import {
    ASUIIcon,
    ASUIClickable,
    ASUIButton,
    ASUIButtonDropDown,
    ASUIClickableDropDown
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
            <div className="header">
                <ASUIButton
                    className="toggle-container"
                    selected={open}
                    onAction={this.props.onClick}
                >
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
                    <div>
                        <div>{props.label}</div>
                        <div>{props.children}</div>
                    </div>
                ))}
            </div>
        )

    }

}
