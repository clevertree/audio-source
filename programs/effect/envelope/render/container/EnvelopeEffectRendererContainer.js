import React from 'react';

import "./EnvelopeEffectRendererContainer.css";
import {ASUIClickableDropDown, ASUIIcon} from "../../../../../components/";

export default class EnvelopeEffectRendererContainer extends React.Component {

    render() {
        // console.log('EnvelopeEffectRendererContainer.render', this);
        let className = "envelope-effect-container";
        if(this.props.config.open)
            className += ' open';

        return <div
                className={className}
            >
            <div
                className="title"
                onClick={this.props.onClick}
                >
                <ASUIIcon source="effect-envelope" size="small"/>
            </div>
            <div className="parameters">
                {this.renderParameters()}
            </div>
            <div className="voice">
                {this.props.children}
            </div>
        </div>;
    }

    renderParameters() {
        if(!this.props.config.open)
            return [];
        const config = this.props.config;

        return this.props.parameters.map((props, i) => (
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
            )
        );
    }

}
