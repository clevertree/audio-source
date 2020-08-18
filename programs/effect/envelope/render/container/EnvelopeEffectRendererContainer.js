import React from 'react';

import {ASUIButton, ASUIButtonDropDown, ASUIIcon} from "../../../../../components/";
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
            {/*{this.renderVoice()}*/}
        </div>;
    }

    // renderVoice() {
    //     return (
    //         <div className="voice">
    //             {this.props.voice}
    //         </div>
    //     );
    // }

    renderHeader() {
        const open = this.props.config.open;
        return <div className="header"
                    title={`Envelope Effect`}
        >
            <ASUIButton
                title={`Envelope Effect`}
                className="toggle-container small"
                selected={open}
                onAction={this.props.onClick}
            >
                <ASUIIcon source="effect-envelope"/>
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
