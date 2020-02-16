import React from "react";
// import Div from "../div/Div";

import "./assets/InputFile.css";

// import Icon from "../../components/asui-icon";
// import Menu from "../../components/asui-menu";

class InputFile extends React.Component {
    constructor(props={}) {
        super(props);
        this.state = {
            value: props.value
        }
        // setTimeout(() => this.openFileDialog(), 2000)
    }

    openFileDialog(e) {
        if(typeof this.props.onFile !== "function")
            throw new Error("Invalid callback for property onFile")
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', this.props.accepts);
        input.addEventListener('change', () => {
            const file = input.files[0];
            if(file)
                this.props.onFile(e, file);
        });
        input.click();
    }


    render() {
        return (
            <button
                className="asui-input-file"
                title={this.props.title}
                onClick={e => this.openFileDialog(e)}
                >
                {this.props.children}
            </button>
        )
    }

    // Set default props
    static defaultProps = {
        onFile: null,
    }
}



/** Export this script **/
export default InputFile;
