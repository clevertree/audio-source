import React from 'react';
import {ASUIClickableDropDown} from "../../../../../components";

import "./OscillatorInstrumentRendererParameter.css";

export default class OscillatorInstrumentRendererParameter extends React.Component {

    render() {
        // let className = this.props.className;
        // let fullClassName = "oir-parameter" + (className ? " " + className: "");

        return ( // <div className={fullClassName}>
            <ASUIClickableDropDown
                {...this.props}
            />
            );
        // </div>;
    }
}
