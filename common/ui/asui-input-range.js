(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    if(isBrowser) // Hack for browsers
        window.require = thisRequire;
    const {ASUIComponent} = require('./asui-component.js');



    class ASUIInputRange extends ASUIComponent {
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
            const Slider = require('@react-native-community/slider').default;
            return React.createElement(Slider, this.props, null);
        }

        render() {
            return !isBrowser ? this.renderReactNative() : this.renderBrowser();
        }

        static createInputRange(props, onChange = null, min = 1, max = 100, initialValue = null, title = null) {
            return this.createElement(props, null, {
                min,
                max,
                initialValue,
                onChange,
                title,
            });
        }
    }
    if(isBrowser)
        customElements.define('asui-range', ASUIInputRange);




    /** Export this script **/
    thisModule.exports = {
        ASUIInputRange,
    };


}).apply(null, (function() {
    const thisScriptPath = 'common/ui/asui-input-range.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [thisRequire, thisModule, thisScriptPath, isBrowser]
})());