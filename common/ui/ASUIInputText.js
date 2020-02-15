import React from "react";

class ASUIInputText extends React.Component {
    constructor(props = {}) {
        super(props);
        this.state = {
            value: props.initialValue
        };
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

    render() {
        return <div
            className={this.props.className}
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
export default ASUIInputText;
