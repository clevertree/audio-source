import React from 'react';

import "./OscillatorInstrumentRendererContainer.css";

export default class OscillatorInstrumentRendererContainer extends React.Component {

    render() {
        let className = "oscillator-instrument-container";
        if(this.props.open)
            className += ' open';

        const title = this.props.title;

        return <div className={className}>
            <div
                className="title"
                title={`Oscillator: ${title}`}
                onClick={this.props.onClick}
            >
                {title}
            </div>
            {this.props.children}
        </div>;
    }
}
