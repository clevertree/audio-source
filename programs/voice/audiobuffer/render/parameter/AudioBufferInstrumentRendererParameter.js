import React from 'react';
import {ASUIClickableDropDown} from "../../../../../components";

import "./AudioBufferInstrumentRendererParameter.css";

export default class AudioBufferInstrumentRendererParameter extends React.Component {

    render() {
        let className = this.props.className;
        className += ' parameter';
        // let fullClassName = "oir-parameter" + (className ? " " + className: "");

        return ( // <div className={fullClassName}>
            <ASUIClickableDropDown
                {...this.props}
                className={className}
            />
            );
        // </div>;
    }
}
