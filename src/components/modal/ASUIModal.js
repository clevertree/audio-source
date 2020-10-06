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
            {...this.props}>
            <div className="overlay"
                 onClick={this.props.onClose}
                />
                <div className="content">
                    {this.props.children}
                </div>
        </div>;
    }
}

