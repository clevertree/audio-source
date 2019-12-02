{


    /** Register Script Exports **/
    function getThisScriptPath() { return 'common/audio-source-ui.js'; }
    const exportThisScript = function(module) {
        module.exports = {
            ASUIComponent,
            ASUIDiv,
            ASUIButton,
            ASUIFileInput,
            ASUITextInput,
            ASUIRangeInput,
            ASUIGrid,
            ASUIGridRow,
            ASUIcon,
            ASUIInputCheckBox: ASUICheckBoxInput,
            ASUIMenu,
        };
    };

    /** Abstract Component **/
    class ASUIComponent extends HTMLElement {
        constructor(state={}, props={}) {
            super();
            this.state = state;
            this.props = props;
            this.eventHandlers = [];
        }

        get targetElm() { return this; }

        async setState(newState) {
            Object.assign(this.state, newState);
            await this.renderOS();
        }
        async setProps(newProps) {
            Object.assign(this.props, newProps);
            await this.renderOS();
        }

        async renderRN() { };
        async renderOS() { return await this.renderHTML(); }

        async renderHTML() {
            let content = await this.render();
            this.targetElm.innerHTML = '';


            // Render properties
            while(this.attributes.length > 0)
                this.removeAttribute(this.attributes[0].name);
            for(const attrName in this.props) {
                if(this.props.hasOwnProperty(attrName)) {
                    const value = this.props[attrName];
                    if(value !== null && value !== false)
                        this.setAttribute(attrName, value);
                }
            }

            // Render content
            await this.renderContent(content, this.targetElm);


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
            if(content) {
                if (content instanceof HTMLElement)
                    targetElm.appendChild(content);
                else
                    targetElm.innerHTML += content;
            }
        }

        async render() {
            throw new Error("Not implemented");
        }

        connectedCallback() {
            this.eventHandlers.forEach(eventHandler =>
                eventHandler[2].addEventListener(eventHandler[0], eventHandler[1], eventHandler[2]));
            this.renderOS();
        }

        disconnectedCallback() {
            this.eventHandlers.forEach(eventHandler =>
                eventHandler[2].removeEventListener(eventHandler[0], eventHandler[1]));
        }

        addEventHandler(eventNames, method, context, options=null) {
            if(!Array.isArray(eventNames))
                eventNames = [eventNames];
            for(let i=0; i<eventNames.length; i++) {
                const eventName = eventNames[i];
                context = context || this;
                this.eventHandlers.push([eventName, method, context]);
            }
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
                stick: false,
            }, props);
            this.action = actionCallback;
            this.addEventHandler('mouseenter', this.onInputEvent);
            this.addEventHandler('mouseleave', this.onInputEvent);
            this.addEventHandler('click', this.onInputEvent);
            this.addEventHandler('change', this.onInputEvent);
            this.addEventHandler('keydown', this.onInputEvent);
        }


        async render() {
            return [
                new ASUIDiv('caption', this.state.caption),
                this.state.open ? new ASUIDiv('dropdown', this.state.content) : null,
                this.state.hasBreak ? new ASUIDiv('break') : null
            ];
        }

        async toggleSubMenu(e) {
            const open = !this.state.open;
            this.setState({open:open, stick:open});
        }

        onInputEvent(e) {
            const menuElm = e.target.closest('asui-menu');
            if (this !== menuElm)
                return; // console.info("Ignoring submenu action", this, menuElm);

//         console.log(e.type, this);
            switch (e.type) {
                case 'mouseenter':
                    clearTimeout(this.mouseTimeout);
                    this.setState({open: true});
                    break;

                case 'mouseleave':
                    if(!this.state.stick) {
                        clearTimeout(this.mouseTimeout);
                        this.mouseTimeout = setTimeout(e => {
                            this.setState({open: false});
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

    class ASUIMenu2 extends ASUIComponent {
        constructor(key, actionCallback = null, populateCallback = null, hasBreak = false, props={}) {
            if(hasBreak) props.hasBreak = hasBreak;
            super(key, props);
            if (key !== null)
                this.setAttribute('key', key);

            // Default action sticks the menu, and opens the submenu if there is one
            this.action = actionCallback;
            this.populate = populateCallback;
            this.mouseTimeout = null;
            this.setAttribute('key', key);
            if (hasBreak === true)
                this.hasBreak = hasBreak;


            this.containerElm = document.createElement('div');
            this.containerElm.classList.add('dropdown-container');
            this.containerElm.setAttribute('tabindex', '0');
            this.appendChild(this.containerElm);
        }

        get caption() {
            return this.getAttribute('caption') || this.key;
        }

        get key() {
            return this.getAttribute('key');
        }

        get disabled() {
            return this.getAttribute('disabled') === 'true';
        }

        set disabled(disabled) {
            disabled ? this.setAttribute('disabled', 'true') : this.removeAttribute('disabled');
            // this.render();
        }


        get hasBreak() {
            return this.getAttribute('hasBreak');
        }

        set hasBreak(hasBreak) {
            this.setAttribute('hasBreak', hasBreak);
            this.render();
        }


        addActionMenu(key, actionCallback = null, hasBreak = false) {
            return this.addMenu(key, actionCallback, null, hasBreak);
        }

        addSubMenu(key, populateCallback = null, hasBreak = false) {
            return this.addMenu(key, null, populateCallback, hasBreak);
        }

        addMenu(key, actionCallback = null, populateCallback = null, hasBreak = false) {
            let menuNode = this.findMenuItem(key);
            if (menuNode)
                return menuNode;
            menuNode = new ASUIMenu(key, actionCallback, populateCallback, hasBreak);
            this.containerElm.appendChild(menuNode);
            return menuNode;
        }

        findMenuItem(key = null) {
            if (key === null)
                throw new Error("Invalid Search key");
            for (let i = 0; i < this.children.length; i++) {
                let childNode = this.children[i];
                if (childNode.getAttribute('key') === key) {
                    return childNode;
                }
            }
            return null;
        }


        connectedCallback() {
            // this.editor = this.getRootNode().host;
            // const captionAttr = this.getAttribute('caption');
            // if(captionAttr)
            //     this.caption = captionAttr;

            this.addEventListener('mouseenter', this.onInputEvent);
            this.addEventListener('mouseleave', this.onInputEvent);
            this.addEventListener('click', this.onInputEvent);
            this.addEventListener('change', this.onInputEvent);
            this.addEventListener('keydown', this.onInputEvent);
            this.render();
        }

        disconnectedCallback() {
            this.removeEventListener('mouseenter', this.onInputEvent);
            this.removeEventListener('mouseleave', this.onInputEvent);
            this.removeEventListener('click', this.onInputEvent);
            this.removeEventListener('change', this.onInputEvent);
            this.removeEventListener('keydown', this.onInputEvent);
        }


        onInputEvent(e) {
            if (!this.contains(e.target))
                return;
            const menuElm = e.target.closest('asui-menu');
            if (this !== menuElm)
                return; // console.info("Ignoring submenu action", this, menuElm);

//         console.log(e.type, this);
            switch (e.type) {
                case 'mouseenter':
                    clearTimeout(this.mouseTimeout);

                    if (this.hasSubMenu && !this.disabled) {
                        this.renderSubMenu(e);
                    }
                    break;

                case 'mouseleave':
                    if (!this.classList.contains('stick')) {
                        clearTimeout(this.mouseTimeout);
                        this.mouseTimeout = setTimeout(e => {
                            this.clearSubMenu();
                        }, 200);
                    }
                    break;
                case 'click':
                    if (e.defaultPrevented)
                        return;

                    if (this.hasAction) {
                        e.preventDefault();
                        this.doAction(e);
                    } else if (this.hasSubMenu) {
                        e.preventDefault();
                        this.toggleSubMenu(e);
                    } else {
                        return console.warn("Menu has no submenu or action: ", this);
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

        get hasAction() {
            return !!this.action;
        }

        doAction(e) {
            if (!this.hasAction)
                throw new Error("No .action callback set");

            e.menuElement = this;
            this.action(this);
            this.closeAllMenus();
        }

        get hasSubMenu() {
            return !!this.populate;
        }

        toggleSubMenu(e) {
            if (this.classList.contains('stick')) {
                this.clearSubMenu(e);
            } else {
                this.renderSubMenu(e);
                this.classList.add('stick');
                let parentMenu = this;
                while (parentMenu = parentMenu.parentNode.closest('asui-menu'))
                    parentMenu.classList.add('stick');
            }
        }

        clearSubMenu(e) {
            // this.querySelectorAll('asui-menu')
            //     .forEach(menuItem => menuItem.parentNode.removeChild(menuItem));
            this.classList.remove('stick', 'open', 'open-context-menu');
            // let containerElm = this.containerElm;
            this.containerElm.innerHTML = '';
        }

        async renderSubMenu(e) {
            if (!this.populate)
                throw new Error("Menu has no content");

            this.classList.add('open');

            // e.menuElement = this;
            this.containerElm.innerHTML = '';
            const promise = this.populate(this);
            if (promise instanceof Promise)
                await promise;

            this.containerElm.focus();
            const subMenuElms = this.containerElm.querySelectorAll('asui-menu:not([disabled])');
            if (subMenuElms[0])
                subMenuElms[0].classList.add('selected');

            // this.selectNextSubMenuItem();
        }

        selectNextSubMenuItem() {
            const currentMenuElm = this.containerElm.querySelector('asui-menu.selected');
            this.containerElm.querySelectorAll('asui-menu.selected')
                .forEach(menuElm => menuElm.classList.remove('selected'));
            // let selectedItem = currentItem && currentItem.nextElementSibling ? currentItem.nextElementSibling : containerElm.firstElementChild;

            const subMenuElms = this.containerElm.querySelectorAll('asui-menu:not([disabled])');
            let currentIndex = [].indexOf.call(subMenuElms, currentMenuElm);
            let selectedItem = currentIndex > -1 && currentIndex < subMenuElms.length - 1 ? subMenuElms[currentIndex + 1] : subMenuElms[0];
            selectedItem.classList.add('selected');
//         console.log("selectNextSubMenuItem", currentItem, selectedItem);
        }

        selectPreviousSubMenuItem() {
            const currentMenuElm = this.containerElm.querySelector('asui-menu.selected');
            this.containerElm.querySelectorAll('asui-menu.selected')
                .forEach(menuElm => menuElm.classList.remove('selected'));

            const subMenuElms = this.containerElm.querySelectorAll('asui-menu:not([disabled])');
            let currentIndex = [].indexOf.call(subMenuElms, currentMenuElm);
            let selectedItem = currentIndex > 0 ? subMenuElms[currentIndex - 1] : subMenuElms[subMenuElms.length - 1];
            // let selectedItem = currentItem && currentItem.previousElementSibling ? currentItem.previousElementSibling : containerElm.lastElementChild;
            selectedItem.classList.add('selected');
//         console.log("selectNextSubMenuItem", currentItem, selectedItem);
        }

        openContextMenu(e, targetElement = null) {
            targetElement = targetElement || e.target;
            const rect = targetElement.getBoundingClientRect();
            let x, y;
            if (e.clientX && e.clientY) {
                x = e.clientX;
                y = e.clientY;
            } else {
                const containerRect = this.editor.getBoundingClientRect();
                x = rect.x + rect.width - containerRect.x;
                y = rect.y + rect.height - containerRect.y;
            }
            this.clearSubMenu();
            this.renderSubMenu(e);
            // this.classList.add('stick');


            console.info("Context menu ", targetElement, this.containerElm, x, y);

            this.classList.add('open', 'stick', 'open-context-menu');

            this.style.left = x + 'px';
            this.style.top = y + 'px';

            // containerElm.focus();

            // this.selectNextSubMenuItem();
        }

        closeAllMenus() {
            let parentMenu = this;
            while (parentMenu.parentElement && parentMenu.parentElement.closest('asui-menu')) {
                parentMenu = parentMenu.parentElement.closest('asui-menu');
            }
            parentMenu.parentElement.querySelectorAll(`asui-menu.open,asui-menu.stick`)
                .forEach(menuElm => menuElm.classList.remove('open', 'stick'))
//         console.trace("Clear all menus ");
        }

        closeMenu(e) {
            // this.classList.remove('open');
            // this.classList.remove('open-context-menu');
            this.clearSubMenu(e);
            let parentMenu = this.parentElement.closest('asui-menu');
            this.querySelectorAll(`asui-menu.open,asui-menu.stick`)
                .forEach(menuElm => menuElm.classList.remove('open', 'stick'));
            if (parentMenu && parentMenu !== this)
                parentMenu.renderSubMenu(e);
        }

        render() {
            const titleElm = this.state.caption; // this.caption === null ? this.key : this.caption;
            if (titleElm) {
                let textDiv = this.querySelector('div.caption');
                if (!textDiv) {
                    textDiv = document.createElement('div');
                    textDiv.classList.add('caption');
                    this.firstElementChild ? this.insertBefore(textDiv, this.firstElementChild) : this.appendChild(textDiv);
                }
                textDiv.innerHTML = '';
                if (typeof titleElm === "string")
                    textDiv.innerHTML = titleElm;
                else
                    textDiv.appendChild(titleElm); // .replace('►', '<span class="arrow"></span>');

            }
            if (this.hasBreak) {
                let hrSpan = this.querySelector('hr');
                if (!hrSpan) {
                    hrSpan = document.createElement('hr');
                    this.firstElementChild ? this.insertBefore(hrSpan, this.firstElementChild) : this.appendChild(hrSpan);
                }
            }
        }
    }


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
        constructor(name, callback, content=null, title=null, value=null, props={}) {
            super({
                value,
                content,
                name
            }, props);
            props.title = title;
            this.listeners = [];
            this.callback = callback || function () {
                console.warn("No callback set")
            };
        }

        // get targetElm() {
        //     return this.inputElm;
        // }

        // get inputElm() {
        //     throw new Error("Not implemented");
        // }

        // get disabled() {
        //     return this.inputElm.disabled;
        // }
        //
        // set disabled(value) {
        //     this.inputElm.disabled = value;
        // }

        get value() {
            return this.state.value;
        }

        set value(newValue) {
            this.setState({value: newValue});
        }

        createInputElement() {
            const inputElm = document.createElement('input');
            inputElm.classList.add('themed');
            return inputElm;
        }

        async render() {
            const inputElm = this.createInputElement();

            for(const attrName in this.props) {
                if(this.props.hasOwnProperty(attrName)) {
                    if(this.props[attrName] !== null)
                        inputElm.setAttribute(attrName, this.props[attrName]);
                }
            }

            if(this.state.content)
                await this.renderContent(this.state.content, inputElm);
            if(this.state.value !== null)
                inputElm.value = this.state.value;
            return inputElm;
        }

        // focus() {
        //     return this.inputElm.focus();
        // }

        // addEventListener(type, listener, options) {
        //     this.listeners.push([type, listener, options]);
        // }
        //
        // connectedCallback() {
        //     super.connectedCallback();
        //     const inputElm = this.inputElm;
        //     this.listeners.forEach(listener => inputElm.addEventListener(listener[0], listener[1], listener[2]));
        // }
        //
        // disconnectedCallback() {
        //     super.disconnectedCallback();
        //     const inputElm = this.inputElm;
        //     this.listeners.forEach(listener => inputElm.removeEventListener(listener[0], listener[1]));
        // }
    }


    class ASUIButton extends ASUIAbstractInput {
        constructor(name = null, callback = null, content = null, title = null, props={}) {
            super(name, callback, content, props);
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

    customElements.define('asui-input-button', ASUIButton);


    class ASUSelectInput extends ASUIAbstractInput {
        constructor(key = null, callback = null, optionContent = null, title = null, defaultValue = null) {
            super(key, callback, optionContent);
            this.selectedValue = null;

            const selectElm = document.createElement('select');
            selectElm.classList.add('themed');
            if (title)
                selectElm.setAttribute('title', title);
            this.appendChild(selectElm);
            if (defaultValue !== null)
                this.setValue(defaultValue);
            else
                this.setDefaultValue();

            this.addEventListener('focus', e => this.renderOptions(e));
            this.addEventListener('change', e => this.onChange(e));
        }

        get inputElm() {
            return this.querySelector('select');
        }

        get value() {
            return this.selectedValue ? this.selectedValue.value : null;
        }

        set value(newValue) {
            this.setValue(newValue);
        }

        async setDefaultValue() {
            let valueFound = false;
            await this.eachOption((value, title) => {
                if (!valueFound)
                    valueFound = {value, title};
            });

            this.addOrSetValue(valueFound.value, valueFound.title);
        }

        async setValue(newValue) {
            let valueFound = false;
            this.selectedValue = {value: newValue, title: "*"}; // TODO: async hack
            await this.eachOption((value, title) => {
                if (value === newValue)
                    valueFound = {value, title};
            });
            if (!valueFound) {
                let valueList = [];
                this.eachOption(function (value) {
                    valueList.push(value)
                });
                console.warn(`Value not found: (${typeof newValue}) ${newValue}`, valueList);
                // throw new Error(`Value not found: (${typeof newValue}) ${newValue}`); // It may not be something the designer can control
            }

            this.selectedValue = valueFound;
            this.addOrSetValue(valueFound.value, valueFound.title);
        }


        getOrCreateOption(value, title) {
            const inputElm = this.inputElm;
            let optionElm = inputElm.querySelector(`option[value="${value}"]`);
            if (!optionElm) {
                optionElm = document.createElement('option');
                optionElm.setAttribute('value', value);
                optionElm.innerText = (title || "Unknown value");
                inputElm.insertBefore(optionElm, inputElm.firstChild);
            }
            return optionElm;
        }

        async eachOption(callback, groupCallback = null) {
            groupCallback = groupCallback || function () {
            };
            const promise = this.content((value, title = null) => { // TODO: support string content
                title = title !== null ? title : value;
                return callback(value, title);
            }, groupCallback);
            if (promise instanceof Promise)
                await promise;
        }


        async addOrSetValue(newValue, newValueTitlePrefix = null) {
            this.selectedValue = {value: newValue, title: newValueTitlePrefix || "Unknown value"};
            let optionElm = this.getOrCreateOption(newValue, this.selectedValue.title);
            optionElm.selected = true;
        }

        async onChange(e) {
            const currentValue = this.inputElm.value;
            let valueFound = false;
            await this.eachOption((value, title) => {
                if ((value + '') === currentValue)
                    valueFound = {value, title};
            });
            if (!valueFound)
                throw new Error("Value not found: ", currentValue, this);
            this.selectedValue = valueFound;
            // console.log(e.type, this.value);
            this.callback(e, this.selectedValue.value);
        }


        /** @override **/
        render() {
            this.inputElm.innerHTML = '';
            const content = this.content;
            if (typeof content === "function")
                this.renderOptions();
            else if (content instanceof HTMLElement)
                this.inputElm.appendChild(content);
            else
                this.inputElm.innerHTML += content;
        }


        async renderOptions() {
            const inputElm = this.inputElm;

            inputElm.innerHTML = '';
            let currentOptGroup = inputElm;
            await this.eachOption((value, title) => {
                let newOption = document.createElement('option');
                newOption.setAttribute('value', value);
                newOption.innerText = title;
                if (this.selectedValue && this.selectedValue.value === value) { // (value + '') === currentOption.value) {
                    newOption.selected = true;
                }
                currentOptGroup.appendChild(newOption);

            }, (groupName) => {
                if (groupName !== null) {
                    currentOptGroup = document.createElement('optgroup');
                    currentOptGroup.setAttribute('label', groupName);
                    inputElm.appendChild(currentOptGroup);
                } else {
                    currentOptGroup = inputElm;
                }
            });
        }

    }

    customElements.define('asui-input-select', ASUSelectInput);



    class ASUITextInput extends ASUIAbstractInput {
        constructor(name, callback, title=null, value=null, placeholder = null, props={}) {
            super(name, callback, null, title, value, props);
            props.placeholder = placeholder;
            this.addEventHandler('change', e => this.onChange(e));
        }


        onChange(e) {
            this.callback(e, this.value);
        }

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
            props.min = min;
            props.max = max;
            this.addEventHandler('change', e => this.onChange(e));
        }

        createInputElement() {
            const rangeElm = document.createElement('input');
            rangeElm.classList.add('themed');
            rangeElm.setAttribute('type', 'range');
            return rangeElm;
        }

        onChange(e) {
            // console.log(e.type);
            this.callback(e, this.value);
        }
    }

    customElements.define('asui-input-range', ASUIRangeInput);


    class ASUICheckBoxInput extends ASUIAbstractInput {
        constructor(name, callback = null, title=null, checked = false, props={}) {
            super(name, callback, null, title, checked, props);
            this.addEventHandler('change', e => this.onChange(e));
        }

        onChange(e) {
            this.callback(e, this.value);
        }

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
        constructor(name, callback = null, content, accepts = null, title=null, props={}) {
            super(name, callback, content, title, null, props);
            props.accepts = accepts;
            this.addEventHandler('change', e => this.onChange(e));
        }

        onChange(e) {
            this.callback(e, this.value);
        }

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