import React from "react";

import "./assets/InputButton.css";
class InputButton extends React.Component {
    render() {
        let className = 'asui-input-button';
        if(this.props.className)
            className += ' ' + this.props.className;

        return <button className={className} onClick={this.props.onAction}>
            {this.props.children}
        </button>
    }

}

/** Export this script **/
export default InputButton;
