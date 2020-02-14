import React from "react";


class ASUIInputRange extends React.Component {
    constructor(props = {}) {
        super(props, {
            value: props.initialValue
        });
        this.inputElm = null;
    }

    get value() { return this.state.value; }
    set value(newValue) {
        if(this.inputElm)  this.inputElm.value = newValue;
        this.state.value = newValue;
    }

    async onChange(e) {
        this.state.value = parseFloat(this.inputElm.value);
        this.props.onChange(e, this.state.value);
    }

    renderBrowser() {
        const rangeElm = document.createElement('input');
        rangeElm.addEventListener('change', e => this.onChange(e));
        rangeElm.classList.add('themed');
        rangeElm.setAttribute('type', 'range');
        if(this.props.min !== null) rangeElm.setAttribute('min', this.props.min);
        if(this.props.max !== null) rangeElm.setAttribute('max', this.props.max);
        this.inputElm = rangeElm;
        if(this.props.name) rangeElm.setAttribute('name', this.props.name);
        if(this.props.title) rangeElm.setAttribute('title', this.props.title);

        // this.appendContentTo(this.getChildren(), rangeElm);
        if(this.state.value !== null)
            rangeElm.value = this.state.value;
        return rangeElm;
    }

    renderReactNative() {
        const React = require('react');
        // const Slider = require('@react-native-community/slider').default; // TODO: shouldn't be included in web
        // return React.createElement(Slider, this.props, null);
    }

    // render() {
    //     return !isBrowser ? this.renderReactNative() : this.renderBrowser();
    // }

    static createInputRange(props, onChange = null, min = 1, max = 100, initialValue = null, title = null, ref = null) {
        return this.createElement(props, null, {
            min,
            max,
            initialValue,
            onChange,
            title,
            ref
        });
    }
}
// if(isBrowser)
    // customElements.define('asui-input-range', ASUIInputRange);




/** Export this script **/
export default ASUIInputRange;
