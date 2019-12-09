{


    /** Register Script Exports **/
    function getThisScriptPath() { return 'common/audio-source-ui.js'; }
    const exportThisScript = function(module) {
        module.exports = {
            ASUIComponent,
            ASUIDiv,
            ASUIButtonInput,
            ASUIFileInput,
            ASUITextInput,
            ASUIRangeInput,
            ASUISelectInput,
            ASUIGrid,
            ASUIGridRow,
            ASUIcon,
            ASUICheckBoxInput,
            ASUIMenu,
        };
    };

    /** Abstract Component **/
    class ASUIComponent extends HTMLElement {
        constructor(state={}, props={}) {
            super();
            this.state = state;
            this.props = props;
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
            console.info('setProps', this.props, newProps, this);
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
                console.log("skipping render, not attached");
                return;
            }

            // this.targetElm.innerHTML = '';
            // try {
                let content = await this.render();
                let t, targetElm= this.targetElm;
                while (t = targetElm.firstChild)
                    targetElm.removeChild(t);
                // Render content
                await this.renderContent(content, this.targetElm);
            // } catch (e) {
            //     this.targetElm.innerHTML = `<span class="error">${e.message}</span>`;
            // }

        }

        renderProps() {
            // Render properties
            while(this.attributes.length > 0)
                this.removeAttribute(this.attributes[0].name);
            for(const attrName in this.props) {
                if(this.props.hasOwnProperty(attrName)) {
                    const value = this.props[attrName];
                    if (typeof value === "object" && value !== null)
                        Object.assign(this[attrName], value);
                    else if (value === true)
                        this.setAttribute(attrName, '');
                    else if (value !== null && value !== false)
                        this.setAttribute(attrName, value);
                }
            }
        }

        async renderContent(content, targetElm) {
            while(true) {
                if (content instanceof Promise) content = await content;
                else if (typeof content === "function") content = content(this);
                else break;
            }
            if(Array.isArray(content)) {
                for(let i=0; i<content.length; i++)
                    await this.renderContent(content[i], targetElm);
                return;
            }

            if(content !== null && typeof content !== "undefined") {
                if (content instanceof ASUIComponent)
                    await content.appendTo(targetElm);
                else if (content instanceof HTMLElement)
                    targetElm.appendChild(content);
                else
                    targetElm.innerHTML += content;
            }
        }

        async render() {
            throw new Error("Not implemented");
        }

        addAllEventListeners() {
            this._eventHandlers.forEach(eventHandler =>
                eventHandler[2].addEventListener(eventHandler[0], eventHandler[1], eventHandler[2]));
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
                this._eventHandlers.push([eventName, method, context]);
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
        constructor(key = null, content = null, props = {}) {
            super({content}, props);
            props.key = key;
        }

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

        constructor(caption = null, dropDownContent = null, actionCallback = null, props = {}) {
            super({
                caption,
                content: dropDownContent,
                open: false,
            }, props);
            props.stick = false;
            this.action = actionCallback;
            this.addEventHandler('mouseover', this.onInputEvent);
            this.addEventHandler('mouseout', this.onInputEvent);
            this.addEventHandler('click', this.onInputEvent);
            this.addEventHandler('change', this.onInputEvent);
            this.addEventHandler('keydown', this.onInputEvent);
        }


        async render() {
            return [
                this.state.hasBreak ? new ASUIDiv('break') : null,
                this.state.caption ? (this.state.caption instanceof HTMLElement ? this.state.caption : new ASUIDiv('caption', this.state.caption)) : null,
                this.state.open && this.state.content ? new ASUIDiv('dropdown', this.state.content) : null,
            ];
        }

        async toggleSubMenu(e) {
            const open = !this.props.stick;
            let parentMenu = this;
            while(parentMenu) {
                await parentMenu.setProps({stick:open});
                parentMenu = parentMenu.parentNode.closest('asui-menu');
            }
            await this.setState({open:open});
        }

        async close(e) { await this.setState({open: false})}

        async closeAllMenus(global=true) {
            let menu = this;
            while(menu) {
                await menu.close();
                menu = menu.parentNode.closest('asui-menu');
            }
        }

        onInputEvent(e) {
            // const menuElm = e.target.closest('asui-menu');
            // if (this !== menuElm)
            //     return; // console.info("Ignoring submenu action", this, menuElm);

            // console.log(e.type, this);
            switch (e.type) {
                case 'mouseover':
                    clearTimeout(this.mouseTimeout);
                    if(!this.state.open) {
                        this.setState({open: true});
                    }
                    break;

                case 'mouseout':
                    if(!this.props.stick) {
                        clearTimeout(this.mouseTimeout);
                        this.mouseTimeout = setTimeout(e => {
                            this.close();
                        }, 200);
                    }
                    break;
                case 'click':
                    if (e.defaultPrevented)
                        return;
                    e.preventDefault();

                    if (this.action) {
                        this.action();
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


    /** Abstract Panel Input **/
    class ASUIAbstractInput extends ASUIComponent {
        constructor(key, callback, content=null, title=null, value=null, props={}) {
            super({
                value,
                content,
                title,
            }, props);
            props.key = key;
            this.listeners = [];
            this.callback = callback || function () {
                console.warn("No callback set")
            };
            this.addEventHandler('change', e => this.onChange(e));
        }

        click() { this.refs.inputElm.click(); }

        parseInputValue(inputValue) { return inputValue; }

        async onChange(e) {
            this.state.value = this.parseInputValue(this.refs.inputElm.value);
            this.callback(e, this.state.value);
        }

        get value() {
            return this.state.value;
        }

        set value(newValue) {
            this.state.value = newValue;
            this.refs.inputElm.value = newValue;
            // this.setState({value: newValue});
        }

        createInputElement() {
            const inputElm = document.createElement('input');
            inputElm.classList.add('themed');
            return inputElm;
        }

        async render() {
            const inputElm = this.createInputElement();
            this.refs.inputElm = inputElm;
            if(this.state.name) inputElm.setAttribute('name', this.state.name);
            if(this.state.title) inputElm.setAttribute('title', this.state.title);


            await this.renderContent(this.state.content, inputElm);
            if(this.state.value !== null)
                inputElm.value = this.state.value;
            return inputElm;
        }

    }


    class ASUIButtonInput extends ASUIAbstractInput {
        constructor(key = null, callback = null, content = null, title = null, props={}) {
            super(key, callback, content, title, null, props);
            this.addEventHandler('click', e => this.onClick(e));
        }

        onClick(e) {
            this.callback(e, this.value);
        }

        createInputElement() {
            const inputElm = document.createElement('button');
            inputElm.classList.add('themed');
            return inputElm;
        }
    }

    customElements.define('asui-input-button', ASUIButtonInput);


    class ASUISelectInput extends ASUIAbstractInput {
        constructor(key = null, callback = null, optionContent = null, title = null, value = null, props = {}) {
            super(key, callback, optionContent, title, value, props);

            // this.appendChild(selectElm);
            // if (value !== null)
            //     this.setValue(value);
            // else
            //     this.setDefaultValue();

            // this.addEventHandler('focus', e => this.renderOptions(e));
            // this.addEventListener('change', e => this.onChange(e));
        }

        createInputElement() {
            const selectElm = document.createElement('select');
            selectElm.classList.add('themed');
            return selectElm;
        }

        getOption(value, title=null) {
            const optionElm= document.createElement('option');
            optionElm.value = value;
            if(title!==null)
                optionElm.text = title;
            return optionElm;
        }

        getOptGroup(label=null) {
            const optGroupElm = document.createElement('optgroup');
            optGroupElm.label = label;
            return optGroupElm;
        }

        // get value() {
        //     return this.selectedValue ? this.selectedValue.value : null;
        // }
        //
        // set value(newValue) {
        //     this.setValue(newValue);
        // }

        // async setDefaultValue() {
        //     let valueFound = false;
        //     await this.eachOption((value, title) => {
        //         if (!valueFound)
        //             valueFound = {value, title};
        //     });
        //
        //     this.addOrSetValue(valueFound.value, valueFound.title);
        // }

        // async setValue(newValue) {
        //     let valueFound = false;
        //     this.selectedValue = {value: newValue, title: "*"}; // TODO: async hack
        //     await this.eachOption((value, title) => {
        //         if (value === newValue)
        //             valueFound = {value, title};
        //     });
        //     if (!valueFound) {
        //         let valueList = [];
        //         this.eachOption(function (value) {
        //             valueList.push(value)
        //         });
        //         console.warn(`Value not found: (${typeof newValue}) ${newValue}`, valueList);
        //         // throw new Error(`Value not found: (${typeof newValue}) ${newValue}`); // It may not be something the designer can control
        //     }
        //
        //     this.selectedValue = valueFound;
        //     this.addOrSetValue(valueFound.value, valueFound.title);
        // }


        // getOrCreateOption(value, title) {
        //     const inputElm = this.inputElm;
        //     let optionElm = inputElm.querySelector(`option[value="${value}"]`);
        //     if (!optionElm) {
        //         optionElm = document.createElement('option');
        //         optionElm.setAttribute('value', value);
        //         optionElm.innerText = (title || "Unknown value");
        //         inputElm.insertBefore(optionElm, inputElm.firstChild);
        //     }
        //     return optionElm;
        // }

        // async eachOption(callback, groupCallback = null) {
        //     groupCallback = groupCallback || function () {
        //     };
        //     const promise = this.content((value, title = null) => { // TODO: support string content
        //         title = title !== null ? title : value;
        //         return callback(value, title);
        //     }, groupCallback);
        //     if (promise instanceof Promise)
        //         await promise;
        // }


        // async addOrSetValue(newValue, newValueTitlePrefix = null) {
        //     this.selectedValue = {value: newValue, title: newValueTitlePrefix || "Unknown value"};
        //     let optionElm = this.getOrCreateOption(newValue, this.selectedValue.title);
        //     optionElm.selected = true;
        // }

        // async onChange(e) {
        //     const currentValue = this.inputElm.value;
        //     let valueFound = false;
        //     await this.eachOption((value, title) => {
        //         if ((value + '') === currentValue)
        //             valueFound = {value, title};
        //     });
        //     if (!valueFound)
        //         throw new Error("Value not found: ", currentValue, this);
        //     this.selectedValue = valueFound;
        //     // console.log(e.type, this.value);
        //     this.callback(e, this.selectedValue.value);
        // }


        /** @override **/
        // render() {
        //     this.inputElm.innerHTML = '';
        //     const content = this.content;
        //     if (typeof content === "function")
        //         this.renderOptions();
        //     else if (content instanceof HTMLElement)
        //         this.inputElm.appendChild(content);
        //     else
        //         this.inputElm.innerHTML += content;
        // }


        // async renderOptions() {
        //     const inputElm = this.inputElm;
        //
        //     inputElm.innerHTML = '';
        //     let currentOptGroup = inputElm;
        //     await this.eachOption((value, title) => {
        //         let newOption = document.createElement('option');
        //         newOption.setAttribute('value', value);
        //         newOption.innerText = title;
        //         if (this.selectedValue && this.selectedValue.value === value) { // (value + '') === currentOption.value) {
        //             newOption.selected = true;
        //         }
        //         currentOptGroup.appendChild(newOption);
        //
        //     }, (groupName) => {
        //         if (groupName !== null) {
        //             currentOptGroup = document.createElement('optgroup');
        //             currentOptGroup.setAttribute('label', groupName);
        //             inputElm.appendChild(currentOptGroup);
        //         } else {
        //             currentOptGroup = inputElm;
        //         }
        //     });
        // }

    }

    customElements.define('asui-input-select', ASUISelectInput);



    class ASUITextInput extends ASUIAbstractInput {
        constructor(key, callback, title=null, value=null, placeholder = null, props={}) {
            super(key, callback, null, title, value, props);
            props.placeholder = placeholder;
            // this.addEventHandler('change', e => this.onChange(e));
        }


        // onChange(e) {
        //     this.callback(e, this.value);
        // }

        createInputElement() {
            const inputElm = document.createElement('input');
            inputElm.classList.add('themed');
            inputElm.setAttribute('type', 'text');
            // if (this.state.placeholder)
            //     inputElm.setAttribute('placeholder', this.state.placeholder);
            return inputElm;
        }
    }
    customElements.define('asui-input-text', ASUITextInput);

    class ASUIRangeInput extends ASUIAbstractInput {
        constructor(key = null, callback = null, min = 1, max = 100, title = null, value = null, props={}) {
            super(key, callback, null, title, value, props);
            this.state.min = min;
            this.state.max = max;
            // this.addEventHandler('change', e => this.onChange(e));
        }

        createInputElement() {
            const rangeElm = document.createElement('input');
            rangeElm.classList.add('themed');
            rangeElm.setAttribute('type', 'range');
            if(this.state.min !== null) rangeElm.setAttribute('min', this.state.min);
            if(this.state.max !== null) rangeElm.setAttribute('max', this.state.max);
            return rangeElm;
        }

        parseInputValue(inputValue) { return Number.parseFloat(inputValue); }

        // onChange(e) {
        //     // console.log(e.type);
        //     this.callback(e, this.value);
        // }
    }

    customElements.define('asui-input-range', ASUIRangeInput);


    class ASUICheckBoxInput extends ASUIAbstractInput {
        constructor(key, callback = null, title=null, checked = false, props={}) {
            super(key, callback, null, title, checked, props);
            // this.addEventHandler('change', e => this.onChange(e));
        }

        // onChange(e) {
        //     this.callback(e, this.value);
        // }

        createInputElement() {
            const inputElm = document.createElement('input');
            inputElm.classList.add('themed');
            inputElm.setAttribute('type', 'checkbox');
            return inputElm;
        }


        get checked() {
            return this.status.checked;
        }

    }

    customElements.define('asui-input-checkbox', ASUICheckBoxInput);


    class ASUIFileInput extends ASUIAbstractInput {
        constructor(key, callback = null, content, accepts = null, title=null, props={}) {
            super(key, callback, content, title, null, props);
            props.accepts = accepts;
            // this.addEventHandler('change', e => this.onChange(e));
        }

        // onChange(e) {
        //     this.callback(e, this.value);
        // }

        createInputElement() {
            const inputElm = document.createElement('input');
            inputElm.classList.add('themed');
            inputElm.setAttribute('type', 'file');
            inputElm.setAttribute('style', 'display: none;');
            return inputElm;
        }


        /** @Override **/
        async render() {
            const labelElm = document.createElement('label');
            labelElm.classList.add('button-style');

            const labelContentElm = document.createElement('div');
            labelElm.appendChild(labelContentElm);

            const content = await super.render();
            this.renderContent(content, labelElm);

            return [
                labelElm
            ]
        }
    }

    customElements.define('asui-input-file', ASUIFileInput);


    /** Icon **/
    class ASUIcon extends ASUIComponent {
        constructor(iconClass, props = {}) {
            props.class = iconClass;
            super({}, props);
        }

        render() { return null; }
    }

    customElements.define('asui-icon', ASUIcon);





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