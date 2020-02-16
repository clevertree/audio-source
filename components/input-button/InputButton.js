import React from "react";

import "./assets/InputButton.css";

class InputButton extends React.Component {
    render() {
        return <button className="asui-input-button" onClick={this.props.onAction}>
            {this.props.children}
        </button>
    }

}

/** Export this script **/
export default InputButton;
