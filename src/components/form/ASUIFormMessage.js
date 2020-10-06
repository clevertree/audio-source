import React from "react";

import "./assets/ASUIFormMessage.css"

export default class ASUIFormMessage extends React.Component {

    render() {
        let className = 'asui-form-message';
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.error)
            className += ' error';

        return (
            <div className={className}>
                {this.props.children}
            </div>
        )
    }
}

