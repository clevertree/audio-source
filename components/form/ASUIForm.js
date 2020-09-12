import React from "react";
import PropTypes from "prop-types";

import "./assets/ASUIFormEntry.css"

export default class ASUIForm extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onSubmit: e => this.onSubmit(e),
        }
    }

    render() {
        let className = 'asui-form';
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.horizontal)
            className += ' horizontal';

        return <form
            action="#"
                className={className}
                onSubmit={this.cb.onSubmit}
                {...this.props}
            />;
    }

    /** Actions **/

    onSubmit(e) {
        console.log(e.type, e);
        e.preventDefault();
    }
}

