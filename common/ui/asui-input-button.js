(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    if(isBrowser) // Hack for browsers
        window.require = thisRequire;

    const {ASUIComponent} = require('./asui-component.js');

    class ASUIInputButton extends ASUIComponent {
        constructor(props = {}) {
            super(props, {
                // pressed: false
            });

            // this.addEventHandler('click', e => this.onClick(e));
        }

        // static getDefaultProps() {
        //     return {
        //         onPress: e => this.onInput(e),
        //         // onPressIn: e => this.onInput(e),
        //         // onPressOut: e => this.onInput(e)
        //     };
        // }

        onInput(e) {
            if(!this.props.disabled)
                this.state.callback(e, this.value);
        }

        render() {
            // if(!(this.props.children instanceof ASUIComponent)) {
            //     const divElm = ASUIDiv.createElement('div');
            //     divElm.innerHTML = this.props.children;
            //     return divElm;
            // }
            if(!isBrowser) {
                return React.createElement(TouchableHighlight, {
                    onPress: this.props.onPress
                }, this.getChildren())
            }
            return this.getChildren();
        }


        static createInputButton(props, children = null, onPress = null, title = null) {
            return this.createElement(props, children, {
                onPress,
                title,
            });
        }
    }

    if(isBrowser)
        customElements.define('asui-button', ASUIInputButton);

    /** Export this script **/
    thisModule.exports = {
        ASUIInputButton,
    };


}).apply(null, (function() {
    const thisScriptPath = 'common/ui/asui-input-button.js';
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