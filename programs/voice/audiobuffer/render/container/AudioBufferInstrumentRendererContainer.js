import React from 'react';

import "./AudioBufferInstrumentRendererContainer.css";

export default class AudioBufferInstrumentRendererContainer extends React.Component {

    render() {
        let className = "audiobuffer-instrument-container";
        if(this.props.open)
            className += ' open';

        const title = this.props.title;

        return <div className={className}>
            <div
                className="title"
                title={`AudioBuffer: ${title}`}
                onClick={this.props.onClick}
            >
                {title}
            </div>
            {this.props.children}
        </div>;
    }
}
