import React from 'react';

import {ASUIButton, ASUIButtonDropDown, ASUIClickableDropDown, ASUIIcon} from "../../../../../components/";
import "./EnvelopeEffectRendererContainer.css";

export default class EnvelopeEffectRendererContainer extends React.Component {
    render() {
        const open = this.props.config.open;
        // console.log('EnvelopeEffectRendererContainer.render', this);
        let className = "envelope-effect-container";
        if(open)
            className += ' open';
        return <div
            className={className}
            >
            {this.renderHeader()}
            {open ? this.renderParameters() : null}
            {this.renderVoice()}
        </div>;
    }

    renderVoice() {
        return (
            <div className="voice">
                {this.props.children}
            </div>
        );
    }

    renderHeader() {
        const open = this.props.config.open;
        return <div className="header">
            <ASUIButton
                className="toggle-container"
                selected={open}
                onAction={this.props.onClick}
            >
                Envelope
            </ASUIButton>
            <ASUIButtonDropDown
                arrow={false}
                className="program-config"
                options={this.props.renderMenuRoot}
            >
                <ASUIIcon source="config"/>
            </ASUIButtonDropDown>
        </div>;
    }

    renderParameters() {
        const config = this.props.config;

        return (
            <div className="parameters">
                {this.props.parameters.map((props, i) => (
                    <ASUIClickableDropDown
                        key={i}
                        {...props}
                        className={props.paramName}
                        arrow={false}
                        vertical
                        children={[
                            <div key={0}>{props.paramName[0].toUpperCase()}</div>,
                            <div key={1}>{props.children}</div>
                        ]}
                    />
                ))}
            </div>
        )

    }

}
