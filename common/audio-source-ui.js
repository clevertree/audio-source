{
    /** Div **/

    class AudioSourceUIDiv extends HTMLElement {
        constructor(key = null, content = null) {
            super();
            if (key !== null)
                this.setAttribute('key', key);
            this.content = content;
        }

        get key() {
            return this.getAttribute('key');
        }

        get hasContent() {
            return !!this.content;
        }

        get targetElm() {
            return this;
        }

        render() {
            this.targetElm.innerHTML = '';
            const content = this.content;
            if (typeof content === "function")
                content(this.targetElm);
            else if (content instanceof HTMLElement)
                this.targetElm.appendChild(content);
            else
                this.targetElm.innerHTML += content;
        }

        connectedCallback() {
            if (this.content !== null)
                this.render();
        }

        disconnectedCallback() {

        }

        addDiv(key = null, content = null) {
            if (key === null)
                throw new Error("Invalid class name");
            let childNode = this.findChild(key);
            if (childNode) {
                if (!childNode instanceof AudioSourceUIDiv)
                    throw new Error("Invalid AudioSourceUIDiv");
                // TODO: overwriting content renderer
                childNode.content = content;
                // if(childNode.content !== content)
                //     throw new Error("Content mismatch");
            } else {
                childNode = this.appendChild(new AudioSourceUIDiv(key, content));
            }
            return childNode;
        }

        addMenu(key, actionCallback = null, populateCallback = null, hasBreak = false) {
            let menuNode = this.findChild(key);
            if (menuNode)
                return menuNode;
            menuNode = new AudioSourceUIMenu(key, actionCallback, populateCallback, hasBreak);
            this.targetElm.appendChild(menuNode);
            return menuNode;
        }


        addActionMenu(key, actionCallback = null, hasBreak = false) {
            return this.addMenu(key, actionCallback, null, hasBreak);
        }

        addSubMenu(key, populateCallback = null, hasBreak = false) {
            return this.addMenu(key, null, populateCallback, hasBreak);
        }


        addGrid(key, content = null) {
            return this.findChild(key)
                || this.appendChild(new AudioSourceUIGrid(key, content));
        }


        addButtonInput(key, callback, content = null, title = null) {
            return this.findChild(key)
                || this.appendChild(new AudioSourceUIButton(key, callback, content, title));
        }

        addTextInput(key, callback, title = null, defaultValue = '', placeholder = null) {
            return this.findChild(key)
                || this.appendChild(new AudioSourceUITextInput(key, callback, title, defaultValue, placeholder));
        }

        addRangeInput(key, callback, min = 1, max = 100, title = null, defaultValue = null) {
            return this.findChild(key)
                || this.appendChild(new AudioSourceUIRangeInput(key, callback, min, max, title, defaultValue));
        }

        addCheckBoxInput(key, callback, title = null, defaultValue = false) {
            return this.findChild(key)
                || this.appendChild(new AudioSourceUIInputCheckBox(key, callback, title, defaultValue));
        }

        addFileInput(key, callback, content, accepts = null, title = null) {
            return this.findChild(key)
                || this.appendChild(new AudioSourceUIFileInput(key, callback, content, accepts, title));
        }

        addSelectInput(key, callback, optionContent, title = null, defaultValue = null) {
            return this.findChild(key)
                || this.appendChild(new AudioSourceUISelectInput(key, callback, optionContent, title, defaultValue));
        }


        addBreak(className = 'break') {
            return this.addDiv(className, '');
        }


        findChild(key = null) {
            if (key === null)
                throw new Error("Invalid Search key");
            let childNode;
            for (let i = 0; i < this.children.length; i++) {
                childNode = this.children[i];
                if (childNode.getAttribute('key') === key) {
                    return childNode;
                }
            }
            return null;
        }


        /** Content **/

        createIcon(iconClass, key = 'icon') {
            return new AudioSourceUIIcon(key, iconClass);
        }

    }

    customElements.define('asui-div', AudioSourceUIDiv);


    /** Menu **/

    class AudioSourceUIMenu extends HTMLElement {
        constructor(key, actionCallback = null, populateCallback = null, hasBreak = false) {
            super();
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
            menuNode = new AudioSourceUIMenu(key, actionCallback, populateCallback, hasBreak);
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
            const titleElm = this.caption; // this.caption === null ? this.key : this.caption;
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
    customElements.define('asui-menu', AudioSourceUIMenu);


    /** Grid **/

    class AudioSourceUIGrid extends HTMLElement {
        constructor(key = null, content = null) {
            super();
            if (key !== null)
                this.setAttribute('key', key);
            this.content = content;
        }

        get key() {
            return this.getAttribute('key');
        }

        get targetElm() {
            return this;
        }

        render(content) {
            this.targetElm.innerHTML = '';
            if (typeof content === "function")
                content(this.targetElm);
            else if (content instanceof HTMLElement)
                this.targetElm.appendChild(content);
            else
                this.targetElm.innerHTML += content;
        }

        connectedCallback() {
            if (this.content !== null)
                this.render(this.content);
        }

        disconnectedCallback() {

        }


        findChild(key = null) {
            if (key === null)
                throw new Error("Invalid Search key");
            let childNode;
            for (let i = 0; i < this.children.length; i++) {
                childNode = this.children[i];
                if (childNode.getAttribute('key') === key) {
                    return childNode;
                }
            }
            return null;
        }


        addGridRow(key, content = null) {
            return this.findChild(key)
                || this.appendChild(new AudioSourceUIGridRow(key, content));
        }
    }

    customElements.define('asui-grid', AudioSourceUIGrid);

    /** Grid Row **/


    class AudioSourceUIGridRow extends AudioSourceUIDiv {
        constructor(key, content) {
            super(key, content);
        }
    }

    customElements.define('asuig-row', AudioSourceUIGridRow);


    /** Abstract Panel Input **/
    class AudioSourceUIInputAbstract extends AudioSourceUIDiv {
        constructor(key = null, callback, content) {
            super(key, content);
            this.listeners = [];
            this.callback = callback || function () {
                console.warn("No callback set")
            };
        }

        get targetElm() {
            return this.inputElm;
        }

        get inputElm() {
            throw new Error("Not implemented");
        }

        get disabled() {
            return this.inputElm.disabled;
        }

        set disabled(value) {
            this.inputElm.disabled = value;
        }

        get value() {
            return this.inputElm.value;
        }

        set value(newValue) {
            this.inputElm.value = newValue;
        }

        focus() {
            return this.inputElm.focus();
        }

        addEventListener(type, listener, options) {
            this.listeners.push([type, listener, options]);
        }

        connectedCallback() {
            super.connectedCallback();
            const inputElm = this.inputElm;
            this.listeners.forEach(listener => inputElm.addEventListener(listener[0], listener[1], listener[2]));
        }

        disconnectedCallback() {
            super.disconnectedCallback();
            const inputElm = this.inputElm;
            this.listeners.forEach(listener => inputElm.removeEventListener(listener[0], listener[1]));
        }
    }


    class AudioSourceUIButton extends AudioSourceUIInputAbstract {
        constructor(key = null, callback = null, content = null, title = null) {
            super(key, callback, content);

            // this.setAttribute('key', key);

            const buttonElm = document.createElement('button');
            buttonElm.classList.add('themed');
            if (title)
                buttonElm.setAttribute('title', title);
            // this.setContent(innerHTML, buttonElm);
            this.appendChild(buttonElm);

            this.addEventListener('click', e => this.onClick(e));
        }

        get inputElm() {
            return this.querySelector('button');
        }

        onClick(e) {
            this.callback(e, this.value);
        }


        // render() {
        // }
    }

    customElements.define('asui-input-button', AudioSourceUIButton);


    class AudioSourceUISelectInput extends AudioSourceUIInputAbstract {
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
                console.log(`Value not found: (${typeof newValue}) ${newValue}`, valueList);
                throw new Error(`Value not found: (${typeof newValue}) ${newValue}`);
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

    customElements.define('asui-input-select', AudioSourceUISelectInput);


    class AudioSourceUIRangeInput extends AudioSourceUIInputAbstract {
        constructor(key = null, callback = null, min = 1, max = 100, title = null, value = null) {
            super(key, callback);

            // this.setAttribute('key', key);

            const rangeElm = document.createElement('input');
            rangeElm.classList.add('themed');

            rangeElm.setAttribute('type', 'range');
            rangeElm.setAttribute('min', min + '');
            rangeElm.setAttribute('max', max + '');
            if (value !== null) rangeElm.setAttribute('value', value);
            if (title !== null) rangeElm.setAttribute('title', title);
            this.appendChild(rangeElm);

            this.addEventListener('change', e => this.onChange(e));
        }

        get inputElm() {
            return this.querySelector('input');
        }

        get value() {
            return parseInt(this.inputElm.value);
        }

        set value(newRangeValue) {
            this.inputElm.value = newRangeValue;
        }

        onChange(e) {
            // console.log(e.type);
            this.callback(e, this.value);
        }
    }

    customElements.define('asui-input-range', AudioSourceUIRangeInput);


    class AudioSourceUITextInput extends AudioSourceUIInputAbstract {
        constructor(key = null, callback = null, title = null, value = null, placeholder = null) {
            super(key, callback);

            // this.setAttribute('key', key);

            const inputElm = document.createElement('input');
            inputElm.classList.add('themed');
            inputElm.setAttribute('type', 'text');
            if (title) inputElm.setAttribute('title', title);
            if (value) inputElm.setAttribute('value', value);
            if (placeholder) inputElm.setAttribute('placeholder', placeholder);
            this.appendChild(inputElm);

            this.addEventListener('change', e => this.onChange(e));
        }

        get inputElm() {
            return this.querySelector('input');
        }

        onChange(e) {
            // console.log(e.type);
            this.callback(e, this.value);
        }
    }

    customElements.define('asui-input-text', AudioSourceUITextInput);


    class AudioSourceUIInputCheckBox extends AudioSourceUIInputAbstract {
        constructor(key = null, callback = null, title = null, checked = false) {
            super(key, callback);

            // this.setAttribute('key', key);

            const inputElm = document.createElement('input');
            inputElm.classList.add('themed');
            inputElm.setAttribute('type', 'checkbox');
            if (title) inputElm.setAttribute('title', title);
            if (checked) inputElm.checked = checked;
            this.appendChild(inputElm);

            this.addEventListener('change', e => this.onChange(e));
        }

        get inputElm() {
            return this.querySelector('input');
        }

        get checked() {
            return this.inputElm.checked;
        }

        onChange(e) {
            // console.log(e.type);
            this.callback(e, this.checked);
        }
    }

    customElements.define('asui-input-checkbox', AudioSourceUIInputCheckBox);


    class AudioSourceUIFileInput extends AudioSourceUIInputAbstract {
        constructor(key = null, callback, content, accepts = null, title = null) {
            super(key, callback, content);

            // this.setAttribute('key', key);

            const labelElm = document.createElement('label');
            this.appendChild(labelElm);
            labelElm.classList.add('button-style');

            const labelContentElm = document.createElement('div');
            labelElm.appendChild(labelContentElm);

            // this.setContent(innerHTML, labelElm);

            const inputElm = document.createElement('input');
            inputElm.classList.add('themed');
            inputElm.setAttribute('type', 'file');
            inputElm.setAttribute('style', 'display: none;');
            if (accepts) inputElm.setAttribute('accepts', accepts);
            if (title) inputElm.setAttribute('title', title);

            labelElm.appendChild(inputElm);
            // inputElm.addEventListener('change', e => this.onChange(e));
            this.addEventListener('change', e => this.onChange(e));
        }

        get targetElm() {
            return this.querySelector('label > div');
        }

        get inputElm() {
            return this.querySelector('input');
        }

        onChange(e) {
            try {
                this.callback(e, this.value);
            } catch (err) {
                console.error(err);
            }
            this.value = '';
        }
    }

    customElements.define('asui-input-file', AudioSourceUIFileInput);


    /** Icon **/
    class AudioSourceUIIcon extends HTMLElement {
        constructor(key = null, iconClass) {
            super();
            if (key !== null)
                this.setAttribute('key', key);
            this.classList.add(iconClass);
        }

        get key() {
            return this.getAttribute('key');
        }
    }

    customElements.define('asui-icon', AudioSourceUIIcon);


    // Register module
    let exports = typeof module !== "undefined" ? module.exports :
        document.head.querySelector('script[src$="common/audio-source-ui.js"]');
    exports.AudioSourceUIDiv            = AudioSourceUIDiv;
    exports.AudioSourceUIButton         = AudioSourceUIButton;
    exports.AudioSourceUIFileInput      = AudioSourceUIFileInput;
    exports.AudioSourceUIGrid           = AudioSourceUIGrid;
    exports.AudioSourceUIGridRow        = AudioSourceUIGridRow;
    exports.AudioSourceUIIcon           = AudioSourceUIIcon;
    exports.AudioSourceUIInputCheckBox  = AudioSourceUIInputCheckBox;
}