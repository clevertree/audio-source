import React from 'react';

import "./LFOParameterRendererContainer.css";
import {ASUIButton, ASUIButtonDropDown} from "../../../../../components/";
import {ASUIIcon} from "../../../../../components";


export default class LFOParameterRendererContainer extends React.Component {
    render() {
        let className = "lfo-parameter-container";
        const open = this.props.config.open;
        if(open)
            className += ' open';

        const title = this.props.title;

        return <div className={className}>
            <div className="header"
                 title={title}>
                <ASUIButton
                    className="toggle-container small"
                    selected={open}
                    onAction={this.props.onClick}
                >
                    <ASUIIcon source="lfo-parameter"/>
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
