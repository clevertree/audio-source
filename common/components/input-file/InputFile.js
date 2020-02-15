import React from "react";
import Div from "../div/Div";

// import Icon from "../../common/components/asui-icon";
// import Menu from "../../common/components/asui-menu";

class InputFile extends React.Component {
    constructor(props={}) {
        super(props);
        this.state = {
            value: props.value
        }
    }


    async onChange(e) {
        this.props.onChange(e, this.state.value);
    }

    render() {
        return (
            <input
                type="file"
                value={this.state.value}
                onChange={this.props.onChange}
                name={this.props.name}
                title={this.props.title}
            />
        )
    }
    
    render2() {
        const inputElm = document.createElement('input');
        inputElm.addEventListener('change', e => this.onChange(e));
        inputElm.classList.add('themed');
        inputElm.setAttribute('type', 'file');
        inputElm.setAttribute('style', 'display: none;');
        this.inputElm = inputElm;
        // if(this.state.name) inputElm.setAttribute('name', this.state.name);
        if (this.state.title) inputElm.setAttribute('title', this.state.title);

        const labelElm = ASUIDiv.createElement('button-style');
        labelElm.classList.add('button-style');

        this.appendContentTo(this.getChildren(), labelElm);
        this.appendContentTo(inputElm, labelElm);

        return [
            labelElm
        ]

    }
}



/** Export this script **/
export default InputFile;
