import React from 'react';

import {ASUIClickableDropDown, ASUIIcon} from "../../../../../components/";
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
            {this.renderToggle()}
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

    renderToggle() {
        const open = this.props.config.open;
        return (
            <div
                className="toggle"
                onClick={this.props.onClick}
            >
                <ASUIIcon source="menu-effect-envelope" size="small"/>
                {open ? <div className="effect-title">Envelope</div> : null }
            </div>
        );
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
                            <div key={1}>{`${Math.round((config.attack||0) / 10) / 100}s`}</div>
                        ]}
                    />
                ))}
            </div>
        )

    }

}
