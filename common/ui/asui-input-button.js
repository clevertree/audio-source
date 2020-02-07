(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    if(isBrowser) // Hack for browsers
        window.require = thisRequire;

    const {ASUIComponent, ASUITouchableHighlight} = require('./asui-component.js');

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

        getAttributeMap() {
            return Object.assign({}, super.getAttributeMap(), {
                onPress: 'onclick',
            });
        }

        onInput(e) {
            if(!this.props.disabled)
                this.state.callback(e, this.value);
        }


        renderReactNative() {
            const React = require('react');
            const {View, TouchableHighlight} = require('react-native');
            return React.createElement(View, this.props,
                React.createElement(TouchableHighlight, {
                    onPress: this.props.onPress
                }, this.getChildren())
            );
        }

        renderBrowser() {
            return this.getChildren();
        }


        static cIB(props, children = null, onPress = null, title = null) {
            return ASUIInputButton.createInputButton(props, children, onPress, title);
        }

        static createInputButton(props, children = null, onPress = null, title = null) {
            // props = this.processProps(props);
            children = this.convertStringChildrenToComponent(children);
            // console.log('ASUIInputButton', arguments);
            return this.createElement(props, children, {
                onPress,
                title,
            });
        }
    }

    if(isBrowser)
        customElements.define('asui-input-button', ASUIInputButton);

    /** Export this script **/
    thisModule.exports = {
        ASUIInputButton,
    };


}).apply(null, (function() {
    const thisScriptPath = 'common/ui/asui-input-button.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [thisRequire, thisModule, thisScriptPath, isBrowser]
})());
