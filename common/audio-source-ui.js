{
    const isRN = typeof document === 'undefined';

    /** Required Modules **/
    let ASUIComponentBase;
    let React, TouchableHighlight;
    if(isRN) {
        TouchableHighlight = require('react-native').TouchableHighlight;
        React = require('react');

        window.customElements = require('../../app/support/customElements.js').default;
        ASUIComponentBase = require('../../app/support/ASUIComponentBase.js').default;
        // console.log(ASUIComponentBase);
    } else {
        window.require = customElements.get('audio-source-loader').require;
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
                    Object.freeze(props);
                }
                this.props = props;
            }

            /** @deprecated **/
            get targetElm() { return this; }

            componentDidMount() {

            }

            connectedCallback(renderOnConnect=true) {
                this.addAllEventListeners();
                if(this._renderOnConnect && renderOnConnect)
                    this.forceUpdate();
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
            setProps(newProps) {
//             console.info('setProps', this.props, newProps, this);
                Object.assign(this.props, newProps);
                // this.renderProps();
            }


            forceUpdate() {
                this.renderHTML();
            }

            renderHTML() {
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
                let children = this.getChildren();
                if(typeof children === "function")
                    children = children(this);
                console.log("ASUIComponentBase.render", children);
                // if(typeof children === "undefined")
                //     throw new Error("Invalid ASUIDiv content: " + typeof children);
                return children;
            }

            getAttributeMap() {
                return {
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
                        if (content instanceof ASUIComponent)
                            content.appendTo(targetElm);
                        else if (content instanceof HTMLElement)
                            targetElm.appendChild(content);
                        else
                            targetElm.innerHTML += content;
                    }
                });
            }


            appendTo(parentNode) {
                this._renderOnConnect = false;
                parentNode.appendChild(this);
                // console.info("appendTo", parentNode, this);
                this.forceUpdate();
            }

            getChildren() {
                return this.props.children;
            }

            createStyleSheetLink(stylePath) {
                const AudioSourceLoader = customElements.get('audio-source-loader');
                const linkHRef = AudioSourceLoader.resolveURL(stylePath);
                const link = document.createElement('link');
                link.setAttribute('rel', 'stylesheet');
                link.href = linkHRef;
                return link;
            }

            getRNEventMap() {
                return {
                    onPress: 'click',
                    onPressIn: 'mousedown',
                    onPressOut: 'mouseup',
                }
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

            static processProps(props, additionalProps=[]) {
                if(typeof props === "string")
                    props = {class: props};
                if(typeof props !== "object")
                    throw new Error("Invalid props: " + typeof props);
                for(let i=0; i<additionalProps.length; i++)
                    Object.assign(props, additionalProps[i]);
                // if(props.attrClass) {
                //    if(!props.attrs) props.attrs = {};
                //    props.attrs.class = props.attrClass;
                // }
                return props;
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


        static cE(props, children=null) {
            return this.createElement(props, children);
        }

    }
    customElements.define('asui-component', ASUIComponent);

    /** Div **/
    class ASUIDiv extends ASUIComponent {
        // constructor(props = {}) {
        //     super(props);
        // }

        get name() { return this.props.name; }
        set content(newContent) {
            this.setContent(newContent);
        }
        setContent(newContent) {
            this.setState({content: newContent});
        }

    }

    customElements.define('asui-div', ASUIDiv);


    /** Menu **/
    class ASUIMenu extends ASUIComponent {

        constructor(props = {}, menuContent = null, dropDownContent = null, actionCallback = null) {
            super(props, {
                menuContent,
                dropDownContent,
                offset: 0,
                maxLength: 20,
                optionCount: 0,
                open: false,
                stick: false,
            });
            // this.props.stick = false;
            // this.props.open = false;
            this.action = actionCallback;
            // this.addEventHandler('mouseover', this.onInputEvent);
            // this.addEventHandler('mouseout', this.onInputEvent);
            // this.addEventHandler('mouseout', e => this.onInputEvent(e), document);
            // this.addEventHandler('click', this.onInputEvent);
            // this.addEventHandler('change', this.onInputEvent);
            // this.addEventHandler('keydown', this.onInputEvent);
        }

        // static getDefaultProps() {
        //     const callback = e => this.onInputEvent(e);
        //     return {
        //         onKeyDown: callback,
        //         onChange: callback,
        //         onMouseOut: callback,
        //         onMouseOver: callback,
        //         onPress: callback,
        //         onPressIn: callback,
        //         onPressOut: callback,
        //     };
        // }
        // async setTitle(newTitle) {
        //     this.state.menuContent = newTitle;
        //     if(this.menuContent)
        //         await this.menuContent.setState({content: newTitle});
        //     else
        //         await this.setState({title});
        // }

        render() {
            let arrow = false;
            if(this.state.dropDownContent && typeof this.props.vertical === "undefined" && typeof this.props.arrow === "undefined")
                arrow = true;
            let children = this.getChildren();
            if(typeof children === "function")
                children = children(this);
            const content = [
                this.menuContent = (children ? (children instanceof ASUIComponent ? children : ASUIDiv.createElement('title', children)) : null),
                this.props.arrow ? ASUIDiv.createElement('arrow', this.props.vertical ? '▼' : '►') : null,
                this.dropdown = ASUIDiv.createElement({
                    class: 'dropdown',
                    onWheel: e => this.onInputEvent(e)
                }, (this.state.open && this.state.dropDownContent ? this.renderOptions(this.state.offset, this.state.maxLength) : null)),
                // this.props.hasBreak ? ASUIDiv.createElement('break') : null,
            ];

            // this.dropdown.addEventHandler('wheel', e => this.onInputEvent(e));
            return content;
        }

        renderOptions(offset=0, length=20) {
            let i=0;
            const contentList = [];
            this.eachContent(this.state.dropDownContent, (content) => {
                if(i < offset);
                else if(contentList.length < length)
                    contentList.push(content);
                i++;
            });
            if(offset > length) {
                this.eachContent(this.state.dropDownContent, (content) => {
                    if (contentList.length < length)
                        contentList.push(content);
                });
            }
            if(offset + length < i) {
                const left = i - (offset + length);
                contentList.push(ASUIMenu.createElement({}, `${left} items left`))
            }
            // while(contentList.length < length && offset > contentList.length)
            //     contentList.push(ASUIMenu.createElement({}, '-'));
            this.state.optionCount = i;
            return contentList;
        }

        async toggleSubMenu(e) {
            const open = !this.state.stick;
            let parentMenu = this;
            while(parentMenu) {
                await parentMenu.setProps({stick:open});
                parentMenu = parentMenu.parentNode.closest('asui-menu');
            }
            await this.open();
        }

        async close() {
            if(this.state.open !== false) {
                this.setState({open: false, stick:false});
                await this.dropdown.setContent(null);
            }
        }
        async open() {
            if(this.state.open !== true) {
                this.setState({open: true});
                await this.dropdown.setContent(this.renderOptions(this.state.offset, this.state.maxLength));
            }
            this.closeAllMenusButThis();
        }

        async openContextMenu(e) {
            this.setProps({
                style: {
                    left: e.clientX,
                    top: e.clientY
                }
            });
            await this.open();
        }

        closeAllMenus(includeStickMenus=false) {
            const root = this.getRootNode() || document;
            root.querySelectorAll(includeStickMenus ? 'asui-menu[open]:not([stick])' : 'asui-menu[open]')
                .forEach(menu => menu.close())
        }

        closeAllMenusButThis() {
            const root = this.getRootNode() || document;
            root.querySelectorAll('asui-menu[open]:not([stick])')
                .forEach(menu => {
                    if(menu !== this
                        && !menu.contains(this)
                        && !this.contains(menu))
                        menu.close()
                })
        }

        onInputEvent(e) {
            // const menuElm = e.target.closest('asui-menu');
            // if (this !== menuElm)
            //     return; // console.info("Ignoring submenu action", this, menuElm);

            // console.log(e.type, this);
            switch (e.type) {
                case 'mouseover':
                    clearTimeout(this.mouseTimeout);
                    this.mouseTimeout = setTimeout(e => {
                        this.open();
                    }, 100);
                    break;

                case 'mouseout':
                    if(!this.state.stick) {
                        clearTimeout(this.mouseTimeout);
                        this.mouseTimeout = setTimeout(e => {
                            this.close();
                        }, 400);
                    }
                    break;

                case 'click':
                    if (e.defaultPrevented)
                        return;
                    e.preventDefault();

                    if (this.action) {
                        this.action(e, this);
                        this.closeAllMenus();
                    } else {
                        this.toggleSubMenu(e);
                    }
                    break;

                case 'keydown':
                    if (e.defaultPrevented)
                        return;
                    e.preventDefault();

                    const containerElm = this.containerElm;
                    const selectedMenuElm = containerElm
                        .querySelector('asui-menu.selected') || containerElm.firstElementChild;
                    if (!selectedMenuElm)
                        throw new Error("No selected menu item found");

                    let keyEvent = e.key;
                    switch (keyEvent) {
                        case 'Escape':
                        case 'Backspace':
                            this.closeMenu(e);
                            break;

                        case 'Enter':
                            if (selectedMenuElm.hasAction) {
                                selectedMenuElm.doAction(e);
                            } else if (selectedMenuElm.hasSubMenu) {
                                selectedMenuElm.toggleSubMenu(e);
                            } else {
                                return console.warn("Menu has no submenu or action: ", selectedMenuElm);
                            }

                            break;

                        // ctrlKey && metaKey skips a measure. shiftKey selects a range
                        case 'ArrowRight':
                            if (selectedMenuElm.hasSubMenu) {
                                selectedMenuElm.toggleSubMenu(e);
                            } else {
                                return console.warn("Menu has no submenu: ", selectedMenuElm);
                            }
                            break;

                        case 'ArrowLeft':
                            this.closeMenu(e);
                            break;

                        case 'ArrowDown':
                            this.selectNextSubMenuItem();
                            break;

                        case 'ArrowUp':
                            this.selectPreviousSubMenuItem();
                            break;

                    }
                    break;

                case 'wheel':
                    if(e.defaultPrevented)
                        break;
                    e.preventDefault();
                    let offset = this.state.offset;
                    if(e.deltaY < 0) offset--; else offset++;
                    if(this.state.optionCount) {
                        if (offset > this.state.optionCount)
                            offset = 0;
                        else if (offset < 0)
                            offset = this.state.optionCount;
                    }
                    this.setState({offset});
//                     console.log(e);
                    break;
            }

            // if(target.classList.contains('open')) {
            //     target.dispatchEvent(new CustomEvent('open'));
            // } else {
            //     this.clearSubMenu();
            // }
        }
        static createMenuElement(props, children=null, dropDownContent=null) {
            return this.createElement(props, children, {
                dropDownContent
            });
        }
        static cME(props, children=null, dropDownContent=null) {
            return this.createMenuElement(props, children, dropDownContent);
        }
    }
    customElements.define('asui-menu', ASUIMenu);


// customElements.define('music-song-menu', MusicEditorMenuElement);


    /** Grid **/

    class ASUIGrid extends ASUIDiv {
    }

    customElements.define('asui-grid', ASUIGrid);

    /** Grid Row **/


    class ASUIGridRow extends ASUIDiv {
    }

    customElements.define('asuig-row', ASUIGridRow);



    /** Icon **/
    class ASUIcon extends ASUIComponent {
        constructor(props = {}) {
            super(props, {});
        }

        render() { return null; }

        static createIcon(propsOrClassName={}) {
            return this.createElement(propsOrClassName);
        }
    }

    customElements.define('asui-icon', ASUIcon);

    /** Inputs **/

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
            if(isRN) {
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

    customElements.define('asui-button', ASUIInputButton);



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
    customElements.define('asui-select', ASUIInputSelect);




    class ASUIInputRange extends ASUIComponent {
        constructor(props = {}) {
            super(props);
        }

        get value() { return this.state.value; }
        set value(newValue) {
            if(this.inputElm)  this.inputElm.value = newValue;
            this.state.value = newValue;
        }

        async onChange(e) {
            this.state.value = parseFloat(this.inputElm.value);
            this.state.callback(e, this.state.value);
        }

        render2() {
            const rangeElm = document.createElement('input');
            rangeElm.addEventListener('change', e => this.onChange(e));
            rangeElm.classList.add('themed');
            rangeElm.setAttribute('type', 'range');
            if(this.state.min !== null) rangeElm.setAttribute('min', this.state.min);
            if(this.state.max !== null) rangeElm.setAttribute('max', this.state.max);
            this.inputElm = rangeElm;
            if(this.state.name) rangeElm.setAttribute('name', this.state.name);
            if(this.state.title) rangeElm.setAttribute('title', this.state.title);

            this.appendContentTo(this.getChildren(), rangeElm);
            if(this.state.value !== null)
                rangeElm.value = this.state.value;
            return rangeElm;
        }

        static createInputRange(props, callback = null, min = 1, max = 100, value = null, title = null) {
            return this.createElement(props, null, {
                min,
                max,
                value,
                callback,
                title,
            });
        }
    }
    customElements.define('asui-range', ASUIInputRange);



    class ASUIInputText extends ASUIComponent {
        constructor(props = {}) {
            super(props, {
                value: props.value
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

        render2() {
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

        static createInputText(props={}, callback = null, value = null, title = null, placeholder = null) {
            return this.createElement(props, null, {
                callback,
                value,
                placeholder,
                title
            });
        }

    }
    customElements.define('asui-text', ASUIInputText);



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

        render2() {
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


    class ASUIInputFile extends ASUIComponent {
        constructor(props={}, callback = null, content, accepts = null, title = null) {
            // constructor(name = null, callback = null, checked = false, title = null, props={}) {
            super(props, );
//             props.name = name;
            // this.addEventHandler('change', e => this.onChange(e));
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

        render2() {
            const inputElm = document.createElement('input');
            inputElm.addEventListener('change', e => this.onChange(e));
            inputElm.classList.add('themed');
            inputElm.setAttribute('type', 'file');
            inputElm.setAttribute('style', 'display: none;');
            this.inputElm = inputElm;
            // if(this.state.name) inputElm.setAttribute('name', this.state.name);
            if (this.state.title) inputElm.setAttribute('title', this.state.title);

            const labelElm = ASUIDiv.createElement('button-style');
            labelElm.classList.add('button-style');

            this.appendContentTo(this.getChildren(), labelElm);
            this.appendContentTo(inputElm, labelElm);

            return [
                labelElm
            ]

        }

        static createInputFile(props={}, callback = null, children, accepts = null, title = null) {
            return this.createElement(props, children, {
                callback,
                accepts,
                title,
            });
        }
    }
    customElements.define('asui-input-file', ASUIInputFile);





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
    const thisScriptPath = 'common/audio-source-ui.js';
    let thisModule = isRN ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    thisModule.exports = {
        ASUIComponent,
        ASUIDiv,
        ASUIInputButton,
        ASUIInputFile,
        ASUIInputText,
        ASUIInputRange,
        ASUIInputSelect,
        ASUIInputCheckBox,
        ASUIGrid,
        ASUIGridRow,
        ASUIcon,
        ASUIMenu,
    };
}