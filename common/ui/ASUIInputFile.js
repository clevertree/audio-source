import React from "react";
import ASUIDiv from "./ASUIDiv";
// import ASUIIcon from "../../common/ui/asui-icon";
// import ASUIMenu from "../../common/ui/asui-menu";

class ASUIInputFile extends React.Component {
    constructor(props={}, callback = null, content, accepts = null, title = null) {
        // constructor(name = null, callback = null, checked = false, title = null, props={}) {
        super(props, );
//             props.name = name;
        // this.addEventHandler('change', e => this.onChange(e));
    }

    get value() { return this.state.value; }
    set value(newValue) {
        if(this.inputElm)  this.state.value = this.inputElm.value = newValue;
        else this.setState({value: newValue});
    }

    async onChange(e) {
        this.state.value = this.inputElm.value;
        this.state.callback(e, this.state.value);
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

    static createInputFile(props={}, callback = null, children, accepts = null, title = null) {
        return this.createElement(props, children, {
            callback,
            accepts,
            title,
        });
    }
}



/** Export this script **/
export default ASUIInputFile;
