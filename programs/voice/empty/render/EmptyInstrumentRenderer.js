import React from 'react';
import ASCPresetBrowser from "../../../../composer/program/browser/ASCPresetBrowser";


export default class EmptyInstrumentRenderer extends React.Component {
    render() {
        // let className = "empty-instrument-container";
        // const config = this.props.config || {};

        // const program = this.getSong().getProxiedData().programs[this.props.programID] || ['Empty', {}];
        return <ASCPresetBrowser
            {...this.props}
        />;
    }

}
