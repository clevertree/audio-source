import React from "react";
import "./assets/InputText.scss";

class InputText extends React.Component {
    constructor(props = {}) {
        super(props);
        this.state = {
            value: props.value
        }
    }

    get value()         { return this.state.value; }
    set value(newValue) {
        // if(isBrowser)
        //     this.innerText = newValue
        // else
            this.setState({value: newValue});
    }

    // async onChange(e) {
    //     this.state.value = this.inputElm.value;
    //     this.props.onChange(e, this.state.value);
    // }

    prompt(e) {
        const promptMessage = this.props.promptMessage || "Enter a value:";
        const value = prompt(promptMessage, this.state.value);
        if(value !== null) {
            this.setState({value});
            this.props.onChange && this.props.onChange(e, value);
        }
    }

    render() {
        let className = "asui-input-text"
            + (this.props.className ? ' ' + this.props.className : '');
        if(this.props.onChange)
            return <button
                onClick={this.props.onChange ? e => this.prompt(e) : null}
                className={className}
                title={this.props.title}
                >{this.state.value}</button>;
        return <div
            className={className}
            title={this.props.title}
        >{this.state.value}</div>;
    }


    // render() {
    //     return !isBrowser ? this.renderReactNative() : this.renderBrowser();
    // }

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
