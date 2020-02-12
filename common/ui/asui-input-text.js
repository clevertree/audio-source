(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    if(isBrowser) // Hack for browsers
        window.require = thisRequire;
    const {ASUIComponent} = require('./asui-component.js');

    class ASUIInputText extends ASUIComponent {
        constructor(props = {}) {
            super(props);
            this.state.value = props.initialValue;
        }

        get value()         { return this.state.value; }
        set value(newValue) {
            if(isBrowser)
                this.innerText = newValue
            else
                this.setState({value: newValue});
        }

        // async onChange(e) {
        //     this.state.value = this.inputElm.value;
        //     this.props.onChange(e, this.state.value);
        // }

        renderBrowser() {
            // const inputElm = document.createElement('input');
            // inputElm.addEventListener('change', e => this.onChange(e));
            // inputElm.classList.add('themed');
            // inputElm.setAttribute('type', 'text');
            // this.inputElm = inputElm;
            // // if(this.state.name) inputElm.setAttribute('name', this.state.name);
            // if(this.state.title) inputElm.setAttribute('title', this.state.title);
            // if (this.state.placeholder)
            //     inputElm.setAttribute('placeholder', this.state.placeholder);
            // if(this.state.value !== null)
            //     inputElm.value = this.state.value;
            return this.state.value;
        }

        renderBrowser2() {
            const inputElm = document.createElement('input');
            inputElm.addEventListener('change', e => this.onChange(e));
            inputElm.classList.add('themed');
            inputElm.setAttribute('type', 'text');
            this.inputElm = inputElm;
            // if(this.state.name) inputElm.setAttribute('name', this.state.name);
            if(this.state.title) inputElm.setAttribute('title', this.state.title);
            if (this.state.placeholder)
                inputElm.setAttribute('placeholder', this.state.placeholder);
            if(this.state.value !== null)
                inputElm.value = this.state.value;
            return inputElm;
        }

        renderReactNative() {
            const React = require('react');
            const {TextInput} = require('react-native');
            return React.createElement(TextInput, this.props, this.state.value);
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
    if(isBrowser)
        customElements.define('asui-input-text', ASUIInputText);



    /** Export this script **/
    thisModule.exports = {
        ASUIInputText,
    };


}).apply(null, (function() {
    const thisScriptPath = 'common/ui/asui-input-text.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [thisRequire, thisModule, thisScriptPath, isBrowser]
})());
