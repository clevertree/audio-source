import React from 'react';

import "./OscillatorInstrumentRendererContainer.css";
import {ASUIButton, ASUIButtonDropDown} from "../../../../../components/";
import {ASUIIcon} from "../../../../../components";
import {ProgramLoader} from "../../../../../common";


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
            {this.renderLFOs()}
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

    renderLFOs() {
        const lfos = this.props.config.lfos;
        if(!lfos || lfos.length === 0)
            return null;

        return (
            <div className="lfos">
                {lfos.map((lfo, i) => {
                    const [className, config] = lfo;
                    const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);

                    return <Renderer
                        onRemove={this.cb.onRemove}
                        instrumentID={0}
                        config={config}
                        program={lfo}
                    />;
                })}
            </div>
        )
    }

}
