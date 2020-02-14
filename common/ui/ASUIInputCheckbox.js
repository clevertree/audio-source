import React from "react";

class ASUIInputCheckbox extends React.Component {
    constructor(props = {}) {
        super(props, {
            checked: false
        });
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
export default ASUIInputCheckbox;
