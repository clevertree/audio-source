import React from "react";
import PropTypes from "prop-types";

import "./assets/ASUIForm.css"

class ASUIForm extends React.Component {
    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        className: PropTypes.string,
        header: PropTypes.any,
    };


    render() {
        let className = 'asui-form';
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.horizontal)
            className += ' horizontal';

        // TODO: refactor into form entry
        return (
            <div className={className}>
                {this.props.header ? <div className="header">{this.props.header}</div> : null}
                <div className="container">
                    {this.props.children}
                </div>
            </div>
        )
    }
}

/** Export this script **/
export default ASUIForm;
