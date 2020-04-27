import React from "react";
import "./assets/ASUIForm.css"
import PropTypes from "prop-types";

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

        let children = this.props.children;
        if(typeof children === "function")
            children = children(this);

        return (
            <div className={className}>
                {this.props.header ? <div className="header">{this.props.header}</div> : null}
                <div className="container">
                    {children}
                </div>
            </div>
        )
    }
}

/** Export this script **/
export default ASUIForm;
