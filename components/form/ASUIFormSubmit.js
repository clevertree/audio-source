import React from "react";

import "./assets/ASUIFormMessage.css"

export default class ASUIFormSubmit extends React.Component {

    render() {
        let className = 'asui-form-submit asui-clickable';
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.loading)
            className += ' loading';
        if(this.props.size)
            className += ' ' + this.props.size;
        if(this.props.center)
            className += ' center';
        if(this.props.wide)
            className += ' wide';

        return (
            <input type="submit" className={className} value={this.props.children} />
        )
    }
}

