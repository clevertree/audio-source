import React from "react";

class InputText extends React.Component {
    constructor(props = {}) {
        super(props);
        this.state = {
            value: props.value
        }
    }

    render() {
        const {TextInput} = require('react-native');
        return React.createElement(TextInput, this.props, this.state.value);
    }

    static createInputText(props={}, callback = null, initialValue = null, title = null, ref = null) {
        return this.createElement(props, null, {
            callback,
            initialValue,
            // placeholder,
            title,
            ref
        });
    }

}

/** Export this script **/
export default InputText;
