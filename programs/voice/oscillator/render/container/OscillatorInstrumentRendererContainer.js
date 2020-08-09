import React from 'react';

import "./OscillatorInstrumentRendererContainer.css";
import {ASUIButton, ASUIButtonDropDown} from "../../../../../components/button";
import {ASUIIcon} from "../../../../../components";


export default class OscillatorInstrumentRendererContainer extends React.Component {
    render() {
        let className = "oscillator-instrument-container";
        const open = this.props.config.open;
        if(open)
            className += ' open';

        const title = this.props.title;

        return <div className={className}>
            <div className="header"
                 title={`Oscillator: ${title}`}>
                <ASUIButton
                    title={`Oscillator: ${title}`}
                    className="toggle-container"
                    selected={open}
                    onAction={this.props.onClick}
                >
                    <ASUIIcon source="instrument-oscillator"/>
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
