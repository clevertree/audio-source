import React from "react";

class InputCheckbox extends React.Component {
    constructor(props = {}) {
        super(props, {
            checked: false
        });
    }

    get value() { return this.state.value; }
    set value(newValue) {
        this.setState({value: newValue});
    }

    async onChange(e) {
        this.setState({value: this.inputElm.value});
        this.state.callback(e, this.state.value);
    }

    render() {
        const inputElm = document.createElement('input');
        inputElm.addEventListener('change', e => this.onChange(e));
        inputElm.classList.add('themed');
        inputElm.setAttribute('type', 'checkbox');
        this.inputElm = inputElm;
        // if(this.state.name) inputElm.setAttribute('name', this.state.name);
        if(this.state.title) inputElm.setAttribute('title', this.state.title);

        inputElm.checked = this.state.checked;
        return inputElm;
    }

    static createInputCheckBox(props={}, callback = null, checked = false, title = null) {
        return this.createElement(props, null, {
            callback,
            checked,
            title,
        });
    }

}


/** Export this script **/
export default InputCheckbox;
