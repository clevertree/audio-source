(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    if(isBrowser) // Hack for browsers
        window.require = thisRequire;
    const {ASUIDiv} = require('./asui-component.js');

    class ASUIInputSelect extends ASUIDiv {
        constructor(props) {
            super(props);
            // this.setValue(defaultValue, valueTitle);
            // this.actionCallback = actionCallback;
        }

        get value() { return this.state.value; }
        set value(newValue) { this.setValue(newValue); }

        async setValue(value, title=null) {
            this.state.title = title;
            this.state.value = value;
            if(title === null) {
                await this.resolveOptions(this.getChildren());
                if(this.state.title === null)
                    console.warn('Title not found for value: ', value);
            }
            if(this.parentNode)
                await this.forceUpdate();
        }

        async onChange(e) {
            await this.actionCallback(e, this.state.value, this.state.title);
        }

        async resolveOptions(content) {
            await this.eachContent(content, async (menu) => {
                if(menu instanceof ASUIMenu && menu.props.children)
                    await this.resolveOptions(menu.props.children);
            });
        }

        async open() {
            await this.menu.open();
        }

        getOption(value, title=null, props={}) {
            if(value === this.state.value && title !== null && this.state.title === null)
                this.state.title = title;
            title = title || value;
            return ASUIMenu.createElement(props, title, null, async e => {
                this.setValue(value, title);
                await this.onChange(e);
            });
        }

        getOptGroup(title, content, props={}) {
            return ASUIMenu.createElement(props, title, content);
        }


        /** @override **/
        render() {
            return this.menu = ASUIMenu.createElement({vertical: true}, this.state.title, this.getChildren());
        }

        static createInputSelect(props, optionContent, actionCallback, defaultValue = null, valueTitle=null) {
            return this.createElement(props, null, {
                optionContent: () => optionContent(this),            // TODO: , () => optionContent(this)
                actionCallback,
                defaultValue,
                valueTitle,
            });
        }
    }
    if(isBrowser)
        customElements.define('asui-select', ASUIInputSelect);


    /** Export this script **/
    thisModule.exports = {
        ASUIInputSelect,
    };


}).apply(null, (function() {
    const thisScriptPath = 'common/ui/asui-input-select.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [
        thisRequire,
        thisModule,
        thisScriptPath,
        isBrowser
    ]
})());