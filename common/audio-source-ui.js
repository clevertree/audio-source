{


    /** Register Script Exports **/
    function getThisScriptPath() { return 'common/audio-source-ui.js'; }
    const exportThisScript = function(module) {
        module.exports = {
            ASUIComponent,
            ASUIDiv,
            ASUIInputButton,
            ASUIFileInput,
            ASUIInputText,
            ASUIInputRange,
            ASUIInputSelect,
            ASUIInputCheckBox,
            ASUIGrid,
            ASUIGridRow,
            ASUIcon,
            ASUIMenu,
            // ASUISelectMenu,
        };
    };

    /** Abstract Component **/
    class ASUIComponent extends HTMLElement {
        constructor(props = {}, state = {}) {
            super();
            if(typeof props !== "object")
                props = {class: props};
            this.state = state || {};
            this.props = props || {};
            this.refs = {};
            this._eventHandlers = [];
            this._renderOnConnect = true;
            for(let i=0; i<this.attributes.length; i++)
                this.props[this.attributes[i].name] = this.attributes[i].value;
        }

        get targetElm() { return this; }

        async setState(newState) {
            console.info('setState', this.state, newState, this);
            Object.assign(this.state, newState);
            await this.renderOS();
        }
        setProps(newProps) {
//             console.info('setProps', this.props, newProps, this);
            Object.assign(this.props, newProps);
            this.renderProps();
        }

        async renderRN() { };
        async renderOS() {
            this.renderProps();
            await this.renderHTML();
        }

        async renderHTML() {
            if(!this.parentNode) {
                console.warn("skipping render, not attached");
                return;
            }

            await this.renderContent();
        }

        renderProps() {
            // Render properties
            while(this.attributes.length > 0)
                this.removeAttribute(this.attributes[0].name);
            for(const attrName in this.props) {
                if(this.props.hasOwnProperty(attrName)) {
                    const value = this.props[attrName];
                    if(typeof value === 'function')
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
        clearContent(targetElm) {
            let t;
            while (t = targetElm.firstChild)
                targetElm.removeChild(t);
        }
        async renderContent() {
            this.clearContent(this.targetElm);
            let content = await this.render();
            await this.appendContentTo(content, this.targetElm);
        }

        async eachContent(content, callback) {
            content = await resolveContent(content);
            if(Array.isArray(content)) {
                for(let i=0; i<content.length; i++) {
                    const ret = await this.eachContent(content[i], callback);
                    if(ret === false)
                        break;
                }
                return;
            }

            return await callback(content);
        }

        async appendContentTo(content, targetElm) {
            await this.eachContent(content, async (content) => {
                if(content !== null && typeof content !== "undefined") {
                    if (content instanceof ASUIComponent)
                        await content.appendTo(targetElm);
                    else if (content instanceof HTMLElement)
                        targetElm.appendChild(content);
                    else
                        targetElm.innerHTML += content;
                }
            });
        }

        async render() {
            throw new Error("Not implemented");
        }

        addAllEventListeners() {
            this._eventHandlers.forEach(eventHandler =>
                eventHandler[2].addEventListener(eventHandler[0], eventHandler[1], eventHandler[3]));
        }

        removeAllEventListeners() {
            this._eventHandlers.forEach(eventHandler =>
                eventHandler[2].removeEventListener(eventHandler[0], eventHandler[1]));
        }

        connectedCallback(renderOnConnect=true) {
            this.addAllEventListeners();
            if(this._renderOnConnect && renderOnConnect)
                this.renderOS();
        }

        disconnectedCallback() {
            this.removeAllEventListeners();
        }

        addEventHandler(eventNames, method, context, options=null) {
            if(!Array.isArray(eventNames))
                eventNames = [eventNames];
            for(let i=0; i<eventNames.length; i++) {
                const eventName = eventNames[i];
                context = context || this;
                this._eventHandlers.push([eventName, method, context, options]);
            }
            if(this.parentNode) // i.e. connected
                this.addAllEventListeners();
        }

        async appendTo(parentNode) {
            this._renderOnConnect = false;
            parentNode.appendChild(this);
            // console.info("appendTo", parentNode, this);
            await this.renderOS();
        }
    }
    customElements.define('asui-component', ASUIComponent);

    /** Div **/
    class ASUIDiv extends ASUIComponent {
        /**
         * @param props
         * @param content
         */
        constructor(props = {}, content = null) {
            super(props, {content});
        }

        get name() { return this.props.name; }
        set content(newContent) { this.setContent(newContent); }
        async setContent(newContent) {
            await this.setState({content: newContent});
        }

        async render() {
            return this.state.content;
        }
    }

    customElements.define('asui-div', ASUIDiv);


    /** Menu **/
    class ASUIMenu extends ASUIComponent {

        constructor(props = {}, menuContent = null, dropDownContent = null, actionCallback = null) {
            super(props, {
                menuContent: menuContent || '▼',
                content: dropDownContent,
                offset: 0,
                maxLength: 20,
                optionCount: 0
            });
            this.props.stick = false;
            this.props.open = false;
            if(dropDownContent && typeof this.props.vertical === "undefined" && typeof this.props.arrow === "undefined")
                this.props.arrow = true;
            this.action = actionCallback;
            this.addEventHandler('mouseover', this.onInputEvent);
            this.addEventHandler('mouseout', this.onInputEvent);
            // this.addEventHandler('mouseout', e => this.onInputEvent(e), document);
            this.addEventHandler('click', this.onInputEvent);
            this.addEventHandler('change', this.onInputEvent);
            this.addEventHandler('keydown', this.onInputEvent);
        }

        async setTitle(newTitle) {
            this.state.menuContent = newTitle;
            if(this.refs.menuContent)
                await this.refs.menuContent.setState({content: newTitle});
            else
                await this.setState({title});
        }

        async render() {
            const content = [
                this.refs.menuContent = (this.state.menuContent ? (this.state.menuContent instanceof HTMLElement ? this.state.menuContent : new ASUIDiv('title', this.state.menuContent)) : null),
                this.props.arrow ? new ASUIDiv('arrow', this.props.vertical ? '▼' : '►') : null,
                this.refs.dropdown = new ASUIDiv('dropdown', (this.props.open && this.state.content ? this.renderOptions(this.state.offset, this.state.maxLength) : null)),
                // this.props.hasBreak ? new ASUIDiv('break') : null,
            ];

            this.refs.dropdown.addEventHandler('wheel', e => this.onInputEvent(e));
            return content;
        }

        async renderOptions(offset=0, length=20) {
            let i=0;
            const contentList = [];
            await this.eachContent(this.state.content, (content) => {
                if(i < offset);
                else if(contentList.length < length)
                    contentList.push(content);
                i++;
            });
            if(offset > length) {
                await this.eachContent(this.state.content, (content) => {
                    if (contentList.length < length)
                        contentList.push(content);
                });
            }
            if(offset + length < i) {
                const left = i - (offset + length);
                contentList.push(new ASUIMenu({}, `${left} items left`))
            }
            // while(contentList.length < length && offset > contentList.length)
            //     contentList.push(new ASUIMenu({}, '-'));
            this.state.optionCount = i;
            return contentList;
        }

        async toggleSubMenu(e) {
            const open = !this.props.stick;
            let parentMenu = this;
            while(parentMenu) {
                await parentMenu.setProps({stick:open});
                parentMenu = parentMenu.parentNode.closest('asui-menu');
            }
            await this.open();
        }

        async close() {
            if(this.props.open !== false) {
                this.setProps({open: false, stick:false});
                await this.refs.dropdown.setContent(null);
            }
        }
        async open() {
            if(this.props.open !== true) {
                this.setProps({open: true});
                await this.refs.dropdown.setContent(this.renderOptions(this.state.offset, this.state.maxLength));
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
                    this.open();
                    break;

                case 'mouseout':
                    if(!this.props.stick) {
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


    class ASUIInputSelect extends ASUIDiv {
        constructor(props, optionContent, actionCallback, defaultValue = null, valueTitle=null) {
            super(props, () => optionContent(this));
            this.setValue(defaultValue, valueTitle);
            this.actionCallback = actionCallback;
        }

        get value() { return this.state.value; }
        set value(newValue) { this.setValue(newValue); }

        async setValue(value, title=null) {
            this.state.title = title;
            this.state.value = value;
            if(title === null) {
                await this.resolveOptions(this.state.content);
                if(this.state.title === null)
                    console.warn('Title not found for value: ', value);
            }
            if(this.parentNode)
                await this.renderOS();
        }

        async onChange(e) {
            await this.actionCallback(e, this.state.value, this.state.title);
        }

        async resolveOptions(content) {
            await this.eachContent(content, async (menu) => {
                if(menu instanceof ASUIMenu && menu.state.content)
                    await this.resolveOptions(menu.state.content);
            });
        }

        getOption(value, title=null, props={}) {
            if(value === this.state.value && title !== null && this.state.title === null)
                this.state.title = title;
            title = title || value;
            return new ASUIMenu(props, title, null, async e => {
                this.setValue(value, title);
                await this.onChange(e);
            });
        }

        getOptGroup(title, content, props={}) {
            return new ASUIMenu(props, title, content);
        }


        /** @override **/
        async render() {
            return this.refs.menu = new ASUIMenu({vertical: true}, this.state.title, this.state.content);
        }
    }
    customElements.define('asui-select', ASUIInputSelect);

    class ASUIInputRange extends ASUIComponent {
        constructor(props = {}, callback = null, min = 1, max = 100, value = null, title = null,) {
            super(props, {
                min,
                max,
                value,
                callback,
                title,
            });
            // this.addEventHandler('change', e => this.onChange(e));
        }

        get value() { return this.state.value; }
        set value(newValue) {
            if(this.refs.inputElm)  this.refs.inputElm.value = newValue;
            this.state.value = newValue;
        }

        async onChange(e) {
            this.state.value = parseFloat(this.refs.inputElm.value);
            this.state.callback(e, this.state.value);
        }

        async render() {
            const rangeElm = document.createElement('input');
            rangeElm.addEventListener('change', e => this.onChange(e));
            rangeElm.classList.add('themed');
            rangeElm.setAttribute('type', 'range');
            if(this.state.min !== null) rangeElm.setAttribute('min', this.state.min);
            if(this.state.max !== null) rangeElm.setAttribute('max', this.state.max);
            this.refs.inputElm = rangeElm;
            if(this.state.name) rangeElm.setAttribute('name', this.state.name);
            if(this.state.title) rangeElm.setAttribute('title', this.state.title);

            await this.appendContentTo(this.state.content, rangeElm);
            if(this.state.value !== null)
                rangeElm.value = this.state.value;
            return rangeElm;
        }
    }
    customElements.define('asui-range', ASUIInputRange);



    /** Abstract Panel Input **/
    // class ASUIAbstractInput extends ASUIComponent {
    //     constructor(key, callback, content=null, title=null, value=null, props={}) {
    //         super({
    //             value,
    //             content,
    //             title,
    //         }, props);
    //         props.key = key;
    //         this.callback = callback || function () {
    //             console.warn("No callback set")
    //         };
    //         this.addEventHandler('change', e => this.onChange(e));
    //     }
    //
    //     click() { this.refs.inputElm.click(); }
    //
    //     parseInputValue(inputValue) { return inputValue; }
    //
    //     async onChange(e) {
    //         this.state.value = this.parseInputValue(this.refs.inputElm.value);
    //         this.callback(e, this.state.value);
    //     }
    //
    //     get value() {
    //         return this.state.value;
    //     }
    //
    //     set value(newValue) {
    //         this.state.value = newValue;
    //         this.refs.inputElm.value = newValue;
    //         // this.setState({value: newValue});
    //     }
    //
    //     createInputElement() {
    //         const inputElm = document.createElement('input');
    //         inputElm.classList.add('themed');
    //         return inputElm;
    //     }
    //
    //     async render() {
    //         const inputElm = this.createInputElement();
    //         this.refs.inputElm = inputElm;
    //         if(this.state.name) inputElm.setAttribute('name', this.state.name);
    //         if(this.state.title) inputElm.setAttribute('title', this.state.title);
    //
    //         await this.appendContentTo(this.state.content, inputElm);
    //         if(this.state.value !== null)
    //             inputElm.value = this.state.value;
    //         return inputElm;
    //     }
    // }


    class ASUIInputText extends ASUIComponent {
        constructor(props={}, callback = null, value = null, title = null, placeholder = null) {
            super(props, {
                callback,
                value,
                placeholder,
                title
            });
            // props.title = title;
            // this.addEventHandler('change', e => this.onChange(e));
        }

        get value() { return this.state.value; }
        set value(newValue) {
            if(this.refs.inputElm)  this.state.value = this.refs.inputElm.value = newValue;
            else this.setState({value: newValue});
        }

        async onChange(e) {
            this.state.value = this.refs.inputElm.value;
            this.state.callback(e, this.state.value);
        }

        async render() {
            const inputElm = document.createElement('input');
            inputElm.addEventListener('change', e => this.onChange(e));
            inputElm.classList.add('themed');
            inputElm.setAttribute('type', 'text');
            this.refs.inputElm = inputElm;
            // if(this.state.name) inputElm.setAttribute('name', this.state.name);
            if(this.state.title) inputElm.setAttribute('title', this.state.title);
            if (this.state.placeholder)
                inputElm.setAttribute('placeholder', this.state.placeholder);
            if(this.state.value !== null)
                inputElm.value = this.state.value;
            return inputElm;
        }
    }
    customElements.define('asui-text', ASUIInputText);



    class ASUIInputCheckBox extends ASUIComponent {
        constructor(props={}, name = null, callback = null, checked = false, title = null) {
            super(props, {
                callback,
                checked,
            });
            // props.name = name;
            this.props.title = title;
            // this.addEventHandler('change', e => this.onChange(e));
        }

        get value() { return this.state.value; }
        set value(newValue) {
            if(this.refs.inputElm)  this.state.value = this.refs.inputElm.value = newValue;
            else this.setState({value: newValue});
        }

        async onChange(e) {
            this.state.value = this.refs.inputElm.value;
            this.state.callback(e, this.state.value);
        }

        async render() {
            const inputElm = document.createElement('input');
            inputElm.addEventListener('change', e => this.onChange(e));
            inputElm.classList.add('themed');
            inputElm.setAttribute('type', 'checkbox');
            this.refs.inputElm = inputElm;
            // if(this.state.name) inputElm.setAttribute('name', this.state.name);
            if(this.state.title) inputElm.setAttribute('title', this.state.title);

            inputElm.checked = this.state.checked;
            return inputElm;
        }

    }

    customElements.define('asui-input-checkbox', ASUIInputCheckBox);


    class ASUIFileInput extends ASUIComponent {
        constructor(props={}, callback = null, content, accepts = null, title = null) {
            // constructor(name = null, callback = null, checked = false, title = null, props={}) {
            super(props, {
                callback,
                content,
                title,
            });
//             props.name = name;
            // this.addEventHandler('change', e => this.onChange(e));
        }

        get value() { return this.state.value; }
        set value(newValue) {
            if(this.refs.inputElm)  this.state.value = this.refs.inputElm.value = newValue;
            else this.setState({value: newValue});
        }

        async onChange(e) {
            this.state.value = this.refs.inputElm.value;
            this.state.callback(e, this.state.value);
        }

        async render() {
            const inputElm = document.createElement('input');
            inputElm.addEventListener('change', e => this.onChange(e));
            inputElm.classList.add('themed');
            inputElm.setAttribute('type', 'file');
            inputElm.setAttribute('style', 'display: none;');
            this.refs.inputElm = inputElm;
            // if(this.state.name) inputElm.setAttribute('name', this.state.name);
            if (this.state.title) inputElm.setAttribute('title', this.state.title);

            const labelElm = document.createElement('label');
            labelElm.classList.add('button-style');

            this.appendContentTo(this.state.content, labelElm);
            this.appendContentTo(inputElm, labelElm);

            return [
                labelElm
            ]

        }

    }
        customElements.define('asui-file', ASUIFileInput);


    class ASUIInputButton extends ASUIComponent {
        constructor(props = {}, content = null, callback = null, title = null) {
            super(props, {
                content,
                callback,
                title,
            });

            this.addEventHandler('click', e => this.onClick(e));
        }

        onClick(e) {
            if(!this.props.disabled)
                this.state.callback(e, this.value);
        }

        async render() {
            if(!(this.state.content instanceof HTMLElement)) {
                const divElm = document.createElement('div');
                divElm.innerHTML = this.state.content;
                return divElm;
            }
            return this.state.content;
        }

    }

    customElements.define('asui-button', ASUIInputButton);


    /** Icon **/
    class ASUIcon extends ASUIComponent {
        constructor(props = {}) {
            super(props, {});
        }

        render() { return null; }
    }

    customElements.define('asui-icon', ASUIcon);




    /** Utility functions **/

    async function resolveContent(content) {
        while(true) {
            if (content instanceof Promise) content = await content;
            else if (typeof content === "function") content = content(this);
            else break;
        }
        return content;
    }



    /** Export this script **/
    registerModule(exportThisScript);

    /** Module Loader Methods **/
    function registerModule(callback) {
        if(typeof window === 'undefined')
            callback(module);
        else findThisScript()
            .forEach(scriptElm => callback(scriptElm))
    }

    function findThisScript() {
        return findScript(getThisScriptPath());
    }

    function findScript(scriptURL) {
        let scriptElms = document.head.querySelectorAll(`script[src$="${scriptURL}"]`);
        scriptElms.forEach(scriptElm => {
            scriptElm.relativePath = scriptURL;
            scriptElm.basePath = scriptElm.src.replace(document.location.origin, '').replace(scriptURL, '');
        });
        return scriptElms;
    }

    async function requireAsync(relativeScriptPath) {
        if(typeof require !== "undefined")
            return require('../' + relativeScriptPath);

        let scriptElm = findScript(relativeScriptPath)[0];
        if(!scriptElm) {
            const scriptURL = findThisScript()[0].basePath + relativeScriptPath;
            scriptElm = document.createElement('script');
            scriptElm.src = scriptURL;
            scriptElm.promises = (scriptElm.promises || []).concat(new Promise(async (resolve, reject) => {
                scriptElm.onload = resolve;
                document.head.appendChild(scriptElm);
            }));
        }
        for (let i=0; i<scriptElm.promises.length; i++)
            await scriptElm.promises[i];
        return scriptElm.exports
            || (() => { throw new Error("Script module has no exports: " + relativeScriptPath); })()
    }


}