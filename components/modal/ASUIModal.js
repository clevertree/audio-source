import React from 'react';

import "./assets/ASUIModal.css"
import PropTypes from "prop-types";

/** Div **/
export default class ASUIModal extends React.Component {
    /** Property validation **/
    static propTypes = {
        onClose: PropTypes.any.isRequired,
    };

    render() {
        let className = "asui-modal";
        return <div
            className={className}
            onClick={this.props.onClose}
            {...this.props}>
            {this.props.children}
        </div>;
    }
}

