import React from 'react';

import {ASUIIcon, ASUIClickable} from "../../../../../components";

import "./AudioBufferInstrumentRendererContainer.css";

export default class AudioBufferInstrumentRendererContainer extends React.Component {

    render() {
        let className = "audiobuffer-instrument-container";
        if(this.props.open)
            className += ' open';

        const title = this.props.title;

        return <div className={className}>
            <ASUIClickable
                arrow={false}
                className="menu-sample"
                onClick={this.props.onClick}
            >
                <ASUIIcon source="menu-sample" size="small"/>
            </ASUIClickable>
            <div
                className="title"
                title={`AudioBuffer: ${title}`}
            >
                {title}
            </div>
            {this.props.children}
        </div>;
    }
}
