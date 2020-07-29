import React from 'react';

import "./EnvelopeEffectRendererContainer.css";

export default class EnvelopeEffectRendererContainer extends React.Component {

    render() {
        let className = "envelope-effect-container";
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
