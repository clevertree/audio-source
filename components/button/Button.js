import React from "react";
import PropTypes from 'prop-types';

import "./assets/Button.css";

class Button extends React.Component {
    render() {
        let className = 'asui-button';
        if(this.props.className)
            className += ' ' + this.props.className;

        return (
            <button className={className} onClick={this.props.onAction}>
                {this.props.children}
            </button>
        );
    }

}

/** Default props **/
Button.defaultProps = {
};

/** Validate props **/
Button.propTypes = {
    children: PropTypes.any.isRequired,
    onAction: PropTypes.func.isRequired,
};






/** Export this script **/
export default Button;
