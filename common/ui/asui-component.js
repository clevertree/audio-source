(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    // if(isBrowser) // Hack for browsers
    //     window.require = thisRequire;

    let ASUIComponentBase;
    let React;
    if(!isBrowser) {
        const globalStyles = [
            require('../assets/audio-source-common.style.js').default
        ];
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
                        throw new Error("Strings are not allowed in react native");
                        // console.log("Converting to string", child);
                        // const Text = require('react-native').Text;
                        // child = React.createElement(Text, {style: this.constructor.getStyleListFromKey('default-text')}, child);
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

            static addGlobalStyle(styleObject) {
                globalStyles.push(styleObject)
            }

            static getStyleKeys() { return ['DEFAULT']; }
            static getStyles() {
                // console.log('getStyles', globalStyles);
                return globalStyles;
            }


            static getStyleListFromKey(key) {
                let styleList = [];
                const styleObjectList = this.getStyles();
                for(let i=0; i<styleObjectList.length; i++) {
                    const styleObject = styleObjectList[i][key];
                    if(typeof styleObject === 'object') {
                        // console.log("Adding style ", key, styleObject, styleObjectList);
                        styleList.push(styleObject);
                    }
                }
                return styleList;
            }

            static addStyleList(props, key) {
                let styleList = props.style;
                if(!Array.isArray(styleList))
                    styleList = styleList ? [styleList] : [];
                styleList = styleList.concat(this.getStyleListFromKey(key));
                if(styleList.length > 0)
                    props.style = styleList;
            }

            static processProps(props, additionalProps) {
                if(typeof props === "string")
                    props = {key: props};
                if(typeof props !== "object")
                    throw new Error("Invalid props: " + typeof props);
                if(!Array.isArray(additionalProps))
                    additionalProps = [additionalProps];
                for(let i=0; i<additionalProps.length; i++)
                    Object.assign(props, additionalProps[i]);
                this.getStyleKeys().forEach(key => this.addStyleList(props, key));
                if(props.key)
                    this.addStyleList(props, props.key);
                return props;
            }


            static convertStringChildrenToComponent(children) {
                if(typeof children === "string" || typeof children === "number") {
                    const key = this.name + '.default-text';
                    // console.info(`Converting ${this.name} children to string [key=${key}]`, children);
                    const Text = require('react-native').Text;
                    children = React.createElement(Text, {style: this.getStyleListFromKey(key)}, children);
                }
                return children;
            }

            static createElement(props, children=null, additionalProps={}) {
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

            // componentDidMount() {
            //
            // }

            connectedCallback() {
                this.addAllEventListeners();
                if(this.props._renderOnConnect) // TODO: hack
                    this.updateHTMLContent();
                // this.componentDidMount();
            }

            disconnectedCallback() {
                this.removeAllEventListeners();
                this.clearHTMLContent();
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
//                 console.info('forceUpdate', this);
                this.updateHTMLContent();
            }

            clearHTMLContent() {
                while (this.firstChild) {
                    this.removeChild(this.firstChild);
                }
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
                    class: 'class',
                    tabindex: 'tabindex'
                }
            }


            renderAttributes() {
                // Render attributes
                // while(this.attributes.length > 0)
                //     this.removeAttribute(this.attributes[0].name);
                const map = this.getAttributeMap();
                for(const propName in map) {
                    if(map.hasOwnProperty(propName)) {
                        const attrName = map[propName];
                        if(this.props.hasOwnProperty(propName)) {
                            const value = this.props[propName];
                            if (typeof value === 'function') {
                                throw new Error('attribute functions disabled');
                                // this[attrName] = value;
                            } else if (typeof value === "object" && value !== null) {
                                Object.assign(this[attrName], value);
                            } else if (value === true) {
                                this.setAttribute(attrName, '');
                            } else if (value !== null && value !== false) {
                                this.setAttribute(attrName, value);
                            }
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

            static processProps(props, additionalProps={}) {
                if(typeof props === "string")
                    props = {key: props};
                if(typeof props !== "object")
                    throw new Error("Invalid props: " + typeof props);
                if(!Array.isArray(additionalProps))
                    additionalProps = [additionalProps];
                for(let i=0; i<additionalProps.length; i++)
                    Object.assign(props, additionalProps[i]);
                return props;
            }

            static addStyleList(props, key) { return null; }

            static getStyles() {
                return [];
            }

            static createElement(props, children=null, additionalProps=null) {
                props = ASUIComponent.processProps(props, additionalProps);
                if(children !== null)
                    props.children = children;
                props = Object.freeze(Object.assign(this.getDefaultProps(), props));
                const ref = new this(props);
                if(typeof props.ref === "function")
                    props.ref(ref);
                return ref;
            }

            static convertStringChildrenToComponent(children) {
                return children;
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

    // class ASUIText extends ASUIComponent {
    //     // constructor(props = {}) {
    //     //     super(props);
    //     // }
    //
    //     renderReactNative() {
    //         // console.log('ASUIText', this.props);
    //         // const React = require('react');
    //         let content = this.props.children; // super.renderReactNative();
    //
    //         const Text = require('react-native').Text;
    //         content = React.createElement(Text, this.props, content);
    //         return content;
    //     }
    //
    // }
    //
    // if(isBrowser)
    //     customElements.define('asui-text', ASUIText);


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
            const {View, Animated} = require('react-native');
//this.props.transform ? Animated.View :
            return React.createElement(View, this.props, super.renderReactNative());
        }

        static createElement(props, children=null, additionalProps=null) {
            children = this.convertStringChildrenToComponent(children);
            return super.createElement(props, children, additionalProps);
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
        // ASUIText,
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
