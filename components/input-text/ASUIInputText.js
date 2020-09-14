import React from "react";
import "./assets/ASUIInputText.css";

export default class ASUIInputText extends React.Component {

    constructor(props = {}) {
        super(props);
        this.ref = {
            input: React.createRef()
        }
        this.cb = {
            onChange: e => this.onChange(e),
        };
    }

    getValue() {
        return this.ref.input.current.value;
    }
    setValue(value) {
        this.ref.input.current.value = value;
    }

    onChange(e) {
        // e.preventDefault();
        if(this.props.onChange)
            this.props.onChange(e.target.value);
        // console.log(e.type, e.target.value);
    }

    getInputProps() {
        let className = "asui-input-text";
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.size)
            className += ' ' + this.props.size;
        return Object.assign({}, this.props, {
            ref: this.ref.input,
            className,
            key: 'input-text',
            onChange: this.cb.onChange,
        });
    }

    render() {
        const props = this.getInputProps();
        return <input
            {...this.props}
            {...props}
            />;
    }


}


