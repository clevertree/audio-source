import React from "react";

class InputButton extends React.Component {
    render() {
        return <button onClick={this.props.action}>
            {this.props.children}
        </button>
    }

}

/** Export this script **/
export default InputButton;
