(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    // if(isBrowser) // Hack for browsers
    //     window.require = thisRequire;

    let ASUIComponentBase;
    let React;
    if(!isBrowser) {
        React = require('react');

        ASUIComponentBase = class extends React.Component {

            constructor(props={}) {
                super(props);
                this.attributes = [];
                this.state = {
                };
            }

            getChildren() {
                const each = (child) =>  {
                    if(typeof child === "function")
                        child = child(this);
                    if(child === null || typeof child === "undefined") {
                        child = null;
                    } else if(Array.isArray(child)) {
                        for(let i=0; i<child.length; i++) {
                            child[i] = each(child[i]);
                        }
                    } else if(typeof child === "string" || typeof child === "number") {
                        // throw new Error("Strings are not allowed in react native");
                        // console.log("Converting to string", child);
                        const Text = require('react-native').Text;
                        child = React.createElement(Text, this.props, child);
                    }
                    return child;
                };

                const children = this.props.children || null;
                return each(children);
            }

            render() {
                return this.renderReactNative();
            }

            renderReactNative() {
                return this.renderAll();
            }

            renderAll() {
                throw new Error("Not Implemented")
            }

            static getStyles() {
                return [
                    require('../assets/audio-source-common.style.js').default
                ]
            }


            static addStyleList(props, key) {
                let styleList = props.style;
                if(!Array.isArray(styleList))
                    styleList = styleList ? [styleList] : [];

                const styleObjectList = this.getStyles();
                for(let i=0; i<styleObjectList.length; i++) {
                    const styleObject = styleObjectList[i][key];
                    if(typeof styleObject === 'object') {
                        // console.log("Adding style ", key, styleObject, styleObjectList);
                        styleList.push(styleObject);
                    }
                }
                if(styleList.length > 0)
                    props.style = styleList;
            }

            static processProps(props, additionalProps=[]) {
                if(typeof props === "string")
                    props = {key: props};
                if(typeof props !== "object")
                    throw new Error("Invalid props: " + typeof props);
                for(let i=0; i<additionalProps.length; i++)
                    Object.assign(props, additionalProps[i]);
                this.addStyleList(props, this.name);
                if(props.key)
                    this.addStyleList(props, props.key);
                return props;
            }

            static createElement(props, children=null, ...additionalProps) {
                props = this.processProps(props, additionalProps);
                // if(typeof props.class !== "undefined" && typeof props.key === "undefined")
                //     props.key = props.class; // TODO: Hack to suppress warning

                // const React = require('react');
                const thisClass = this;
                // console.log('React.createElement', React.createElement, thisClass, children);
                const ret = React.createElement(thisClass, props, children);
                return ret;
            }

        }
        // ASUITouchableHighlight = require('./rn/asui-touchable.js').default;
    } else {
        window.require = customElements.get('audio-source-loader').getRequire(thisModule);
        ASUIComponentBase = class extends HTMLElement {
            constructor(props = {}) {
                super();
                // this.state = state || {};
                if(!props) {
                    props = this.constructor.getDefaultProps();
                    for (let i=0; i<this.attributes.length; i++) {
                        const key = this.attributes[i].nodeName;
                        const value = this.attributes[i].nodeValue;
                        const map = this.getAttributeMap();
                        if(typeof map[key] !== "undefined")
                            props[map[key]] = value;
                    }
                    props._renderOnConnect = true;
                    Object.freeze(props);
                }
                this.props = props;
            }

            /** @deprecated **/
            get targetElm() { return this; }

            componentDidMount() {

            }

            connectedCallback() {
                this.addAllEventListeners();
                if(this.props._renderOnConnect)
                    this.updateHTMLContent();
                this.componentDidMount();
            }

            disconnectedCallback() {
                this.removeAllEventListeners();
            }


            addAllEventListeners() {
                const map = this.getRNEventMap();
                for(const key in map) {
                    if(map.hasOwnProperty(key)) {
                        if(this.props.hasOwnProperty(key)) {
                            this.addEventListener(map[key], this.props[key]);
                        }
                    }
                }
            }

            removeAllEventListeners() {
                const map = this.getRNEventMap();
                for(const key in map) {
                    if(map.hasOwnProperty(key)) {
                        if(this.props.hasOwnProperty(key)) {
                            this.removeEventListener(map[key], this.props[key]);
                        }
                    }
                }
            }




            /** @deprecated **/
            addEventHandler(eventNames, method, context, options=null) {
                throw new Error("Obsolete");
                // if(!Array.isArray(eventNames))
                //     eventNames = [eventNames];
                // for(let i=0; i<eventNames.length; i++) {
                //     const eventName = eventNames[i];
                //     context = context || this;
                //     this._eventHandlers.push([eventName, method, context, options]);
                // }
                // if(this.parentNode) // i.e. connected
                //     this.addAllEventListeners();
            }


            setState(newState) {
                console.info('setState', this.state, newState, this);
                Object.assign(this.state, newState);
                this.forceUpdate();
            }

            /** @deprecated **/
            setProps(newProps) {
//             console.info('setProps', this.props, newProps, this);
                this.props = Object.assign(this.props, newProps);
                // this.renderProps();
            }


            forceUpdate() {
                this.updateHTMLContent();
            }

            updateHTMLContent() {
                if(!this.parentNode) {
                    console.warn("skipping render, not attached");
                    return;
                }

                let content = this.render();
                this.clearContent(this.targetElm);
                this.appendContentTo(content, this.targetElm);
                this.renderAttributes();
            }

            // render() {
            //     throw new Error("Not implemented");
            // }

            render() {
                return this.renderBrowser();
            }

            renderBrowser() {
                return this.renderAll();
            }

            getAttributeMap() {
                return {
                    key: 'key',
                    class: 'class'
                }
            }


            renderAttributes() {
                // Render attributes
                // while(this.attributes.length > 0)
                //     this.removeAttribute(this.attributes[0].name);
                const map = this.getAttributeMap();
                for(const attrName in map) {
                    if(map.hasOwnProperty(attrName)) {
                        if(this.props.hasOwnProperty(attrName)) {
                            const value = this.props[attrName];
                            if (typeof value === 'function')
                                this[attrName] = value;
                            else if (typeof value === "object" && value !== null)
                                Object.assign(this[attrName], value);
                            else if (value === true)
                                this.setAttribute(attrName, '');
                            else if (value !== null && value !== false)
                                this.setAttribute(attrName, value);
                        }
                    }
                }
            }


            clearContent(targetElm) {
                let t;
                while (t = targetElm.firstChild)
                    targetElm.removeChild(t);
            }

            eachContent(content, callback) {
                if(typeof content === "function") {
                    return this.eachContent(content(), callback);
                }
                if(Array.isArray(content)) {
                    for(let i=0; i<content.length; i++) {
                        const ret = this.eachContent(content[i], callback);
                        if(ret === false)
                            break;
                    }
                    return;
                }

                return callback(content);
            }

            appendContentTo(content, targetElm) {
                this.eachContent(content, (content) => {
                    if(content !== null && typeof content !== "undefined") {
                        if (content instanceof ASUIComponentBase)
                            content.appendTo(targetElm);
                        else if (content instanceof HTMLElement)
                            targetElm.appendChild(content);
                        else
                            targetElm.innerHTML += content;
                    }
                });
            }


            appendTo(parentNode) {
                // this._renderOnConnect = false;
                parentNode.appendChild(this);
                // console.info("appendTo", parentNode, this);
                this.forceUpdate();
            }

            getChildren() {
                return this.props.children;
            }


            getRNEventMap() {
                return {
                    onPress: 'click',
                    onPressIn: 'mousedown',
                    onPressOut: 'mouseup',
                }
            }

            static processProps(props, additionalProps=[]) {
                if(typeof props === "string")
                    props = {key: props};
                if(typeof props !== "object")
                    throw new Error("Invalid props: " + typeof props);
                for(let i=0; i<additionalProps.length; i++)
                    Object.assign(props, additionalProps[i]);
                return props;
            }

            static getStyles() {
                return [];
            }

            static createElement(props, children=null, ...additionalProps) {
                props = ASUIComponent.processProps(props, additionalProps);
                if(children !== null)
                    props.children = children;
                props = Object.freeze(Object.assign(this.getDefaultProps(), props));
                const ref = new this(props);
                if(typeof props.ref === "function")
                    props.ref(ref);
                return ref;
            }


            static getDefaultProps() {
                return {};
            }


        };
    }

    /** Abstract Component **/
    class ASUIComponent extends ASUIComponentBase {
        constructor(props = {}, state = {}) {
            super(props);
            this.state = state || {};
            // this.props = props || {};
            // this._eventHandlers = [];
            // this._renderOnConnect = true;
            // for(let i=0; i<this.attributes.length; i++)
            //     this.props[this.attributes[i].name] = this.attributes[i].value;

        }
        get key() { return this.props.key; }

        renderAll() {
            return this.getChildren();
        }

        static cE(props, children=null) {
            return this.createElement(props, children);
        }

    }
    if(isBrowser)
        customElements.define('asui-component', ASUIComponent);


    /** Text **/

    class ASUIText extends ASUIComponent {
        // constructor(props = {}) {
        //     super(props);
        // }

        renderReactNative() {
            // const React = require('react');
            const Text = require('react-native').Text;
            return React.createElement(Text, null, this.renderAll());
        }

    }

    if(isBrowser)
        customElements.define('asui-text', ASUIText);


    /** Div **/
    class ASUIDiv extends ASUIComponent {
        // constructor(props = {}) {
        //     super(props);
        // }

        // getChildren() {
        //     let children = super.getChildren();
        //     if(typeof children === 'string')
        //         children = React.createElement(ASUIText, this.props, children);
        //     return children;
        // }

        renderReactNative() {
            // const React = require('react');
            const View = require('react-native').View;
            return React.createElement(View, null, this.renderAll());
        }

    }

    if(isBrowser)
        customElements.define('asui-div', ASUIDiv);



    /** Touchable **/
    /** @deprecated **/
    class ASUITouchableHighlight extends ASUIComponent {

        renderReactNative() {
            // const React = require('react');
            const TouchableHighlight = require('react-native').TouchableHighlight;
            return React.createElement(TouchableHighlight, this.props, this.props.children);
        }
    }

    if(isBrowser)
        customElements.define('asui-touchable', ASUITouchableHighlight);



    /** Icon **/
    class ASUIIcon extends ASUIComponent {
        constructor(props = {}) {
            super(props, {});
        }

        renderBrowser() { return null; }
        renderReactNative() {
            // console.log('ASUIIcon', this.props);
            const Image = require('react-native').Image;
            // const React = require('react');
            return React.createElement(Image, this.props);
        }

        static createIcon(iconName) {
            let props = {};
            if(!isBrowser) {
                switch(iconName) {
                    case 'menu':        props.source = require('../assets/img/icon/ui-icon-menu.png'); break;
                    case 'play':        props.source = require('../assets/img/icon/ui-icon-play.png'); break;
                    case 'pause':       props.source = require('../assets/img/icon/ui-icon-pause.png'); break;
                    case 'stop':        props.source = require('../assets/img/icon/ui-icon-stop.png'); break;
                    case 'next':        props.source = require('../assets/img/icon/ui-icon-next.png'); break;
                    case 'file-save':   props.source = require('../assets/img/icon/ui-icon-file-save.png'); break;
                    case 'file-load':   props.source = require('../assets/img/icon/ui-icon-file-load.png'); break;
                    default: console.error("Unknown icon: " + iconName); break;
                }
            }
            return this.createElement(iconName, null, props);
        }
    }

    if(isBrowser)
        customElements.define('asui-icon', ASUIIcon);


    // const ASUITouchableHighlight = class extends ASUITouchableHighlightBase {
    //     renderAll() {
    //         return this.getChildren();
    //     }
    //
    // } // TODO: Hack, get rid of
    // ASUITouchableHighlight.processProps = ASUIComponent.processProps;
    // ASUITouchableHighlight.createElement = ASUIComponent.createElement;
    // ASUITouchableHighlight.addStyleList = ASUIComponent.addStyleList;
    // ASUITouchableHighlight.getStyles = ASUIComponent.getStyles;
    // ASUITouchableHighlight.cE = ASUIComponent.cE;
    // if(isBrowser)
    //     customElements.define('asui-touchable', ASUITouchableHighlight);


    /** Utility functions **/

    // async function resolveContent(content) {
    //     while(true) {
    //         if (content instanceof Promise) content = await content;
    //         else if (typeof content === "function") content = content(this);
    //         else break;
    //     }
    //     return content;
    // }


    /** Export this script **/
    thisModule.exports = {
        ASUIComponent,
        ASUIDiv,
        ASUIIcon,
        ASUITouchableHighlight
    };


}).apply(null, (function() {
    const thisScriptPath = 'common/ui/asui-component.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [thisRequire, thisModule, thisScriptPath, isBrowser]
})());