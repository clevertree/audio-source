import React from "react";
// import Div from "../div/Div";

// import "./assets/InputFile.css";
import "../input-button/assets/InputButton.css";

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

    async openFileDialog(e, accept=null) {
        if(typeof this.props.onFile !== "function")
            throw new Error("Invalid callback for property onFile");
        const file = await InputFile.openFileDialog(this.props.accept);
        if(file)
            this.props.onFile(e, file);
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


    static async openFileDialog(accept) {
        return await new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', accept);
            input.addEventListener('change', () => {
                const file = input.files[0];
                if(file)
                    resolve(file);
                else
                    reject();
            });
            input.click();
        })
    }


    // Set default props
    static defaultProps = {
        onFile: null,
    }
}



/** Export this script **/
export default InputFile;
