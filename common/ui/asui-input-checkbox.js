{
    const thisScriptPath = 'common/ui/asui-input-checkbox.js';
    const isRN = typeof document === 'undefined';
    const thisModule = isRN ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const require =  isRN ? window.require : customElements.get('audio-source-loader').getRequire(thisModule);

    /** Required Modules **/
    const {ASUIComponent} = require('asui-component.js');

    class ASUIInputCheckBox extends ASUIComponent {
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

    customElements.define('asui-input-checkbox', ASUIInputCheckBox);


    /** Export this script **/
    thisModule.exports = {
        ASUIInputCheckBox,
    };
}