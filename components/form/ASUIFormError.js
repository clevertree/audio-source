import React from "react";
import PropTypes from "prop-types";

import "./assets/ASUIFormError.css"

export default class ASUIFormError extends React.Component {

    render() {
        let className = 'asui-form-error';
        if(this.props.className)
            className += ' ' + this.props.className;

        return (
            <div className={className}>
                {this.props.children}
            </div>
        )
    }
}

