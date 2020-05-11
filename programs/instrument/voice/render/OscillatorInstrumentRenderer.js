import React from 'react';

import "./assets/OscillatorInstrumentRenderer.css";
import OscillatorInstrumentRendererBase from "./OscillatorInstrumentRendererBase";
import {ASUIIcon, ASUIMenuDropDown} from "../../../../components";

class OscillatorInstrumentRenderer extends OscillatorInstrumentRendererBase {

    render() {
        let className = "instrument-renderer-oscillator-node";
        if(this.state.open)
            className += ' open';
        let title = this.getTitle();


        return <div className={className}>
            <div
                className="title"
                title={`Oscillator: ${title}`}
                onClick={this.cb.onClick}
            >
                {title}
            </div>
            {this.renderParameters()}
            <ASUIMenuDropDown
                arrow={false}
                className="config"
                options={this.cb.renderMenuRoot}
            >
                <ASUIIcon source="config"/>
            </ASUIMenuDropDown>
        </div>;
    }
}
export default OscillatorInstrumentRenderer;
