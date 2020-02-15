import React from "react";

class ASUIInputButton extends React.Component {
    render() {
        return <button onClick={this.props.action}>
            {this.props.children}
        </button>
    }

}

/** Export this script **/
export default ASUIInputButton;
