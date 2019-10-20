
/** Menu **/

class AudioSourceUIMenu extends HTMLElement {
    constructor() {
        super();

        // Default action sticks the menu, and opens the submenu if there is one
        this.action = null;
        this.populate = null; // function() { this.dispatchEvent(new CustomEvent('open')); };
        this.mouseTimeout = null;
        this.caption = null
    }


    // get caption()             { return this.getAttribute('caption'); }
    // set caption(captionElm)    {
    //     this.captionElm = captionElm;
    //     // captionElm ? this.setAttribute('caption', captionElm) : this.removeAttribute('caption');
    //     this.render();
    // }

    get key()             { return this.getAttribute('key'); }
    set key(keyName)    {
        this.setAttribute('key', keyName);
        this.render();
    }

    get disabled()             { return this.getAttribute('disabled') == 'true'; }
    set disabled(disabled)    {
        disabled ? this.setAttribute('disabled', 'true') : this.removeAttribute('disabled');
        // this.render();
    }


    get hasBreak()             { return this.getAttribute('hasBreak'); }
    set hasBreak(hasBreak)    {
        this.setAttribute('hasBreak', hasBreak);
        this.render();
    }


    get editor() {
        const editor = this.closest('div.asc-container').parentNode.host;
        if(!editor)
            throw new Error("Editor not found");
        return editor;
    }



    // get isSubMenu() { return this.closest('dropdown-container'); }
    //
    // set onopen(callback) {
    //     this.addEventListener('open', callback);
    // }

    connectedCallback() {
        // this.editor = this.getRootNode().host;
        const captionAttr = this.getAttribute('caption');
        if(captionAttr)
            this.caption = captionAttr;

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
        if(!this.contains(e.target))
            return;
        const menuElm = e.target.closest('asui-menu');
        if(this !== menuElm)
            return; // console.info("Ignoring submenu action", this, menuElm);

//                 console.log(e.type, this);
        switch(e.type) {
            case 'mouseenter':
                clearTimeout(this.mouseTimeout);

                if(this.hasSubMenu) {
                    this.renderSubMenu(e);
                }
                break;

            case 'mouseleave':
                if(!this.classList.contains('stick')) {
                    clearTimeout(this.mouseTimeout);
                    this.mouseTimeout = setTimeout(e => {
                        this.clearSubMenu();
                    }, 200);
                }
                break;
            case 'click':
                if(e.defaultPrevented)
                    return;

                if(this.hasAction) {
                    e.preventDefault();
                    this.doAction(e);
                } else if(this.hasSubMenu) {
                    e.preventDefault();
                    this.toggleSubMenu(e);
                } else {
                    return console.warn("Menu has no submenu or action: ", this);
                }
                break;

            case 'keydown':
                if(e.defaultPrevented)
                    return;
                e.preventDefault();

                const containerElm = this.getSubMenuContainer();
                const selectedMenuElm = containerElm
                    .querySelector('asui-menu.selected') || containerElm.firstElementChild;
                if(!selectedMenuElm)
                    throw new Error("No selected menu item found");

                let keyEvent = e.key;
                switch (keyEvent) {
                    case 'Escape':
                    case 'Backspace':
                        this.closeMenu(e);
                        break;

                    case 'Enter':
                        if(selectedMenuElm.hasAction) {
                            selectedMenuElm.doAction(e);
                        } else if(selectedMenuElm.hasSubMenu) {
                            selectedMenuElm.toggleSubMenu(e);
                        } else {
                            return console.warn("Menu has no submenu or action: ", selectedMenuElm);
                        }

                        break;

                    // ctrlKey && metaKey skips a measure. shiftKey selects a range
                    case 'ArrowRight':
                        if(selectedMenuElm.hasSubMenu) {
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
        if(!this.hasAction)
            throw new Error("No .action callback set");

        e.menuElement = this;
        this.action(e);
        this.closeAllMenus();
    }

    get hasSubMenu() {
        return !!this.populate;
    }

    toggleSubMenu(e) {
        if(this.classList.contains('open'))
            this.clearSubMenu(e);
        else
            this.renderSubMenu(e);

    }

    clearSubMenu(e) {
        // this.querySelectorAll('asui-menu')
        //     .forEach(menuItem => menuItem.parentNode.removeChild(menuItem));
        this.classList.remove('open', 'open-context-menu');
        let containerElm = this.getSubMenuContainer();
        containerElm.innerHTML = '';
    }

    renderSubMenu(e) {
        if(!this.populate)
            throw new Error("Menu has no .populate callback");

        let containerElm = this.getSubMenuContainer();
        this.classList.add('open');

        e.menuElement = this;
        this.populate(e);

        containerElm.focus();
        const subMenuElms = containerElm.querySelectorAll('asui-menu:not([disabled])');
        if(subMenuElms[0])
            subMenuElms[0].classList.add('selected');

        // this.selectNextSubMenuItem();
    }

    getSubMenuContainer() {
        let containerElm = this.querySelector('.dropdown-container');
        if (!containerElm) {
            containerElm = document.createElement('div');
            containerElm.classList.add('dropdown-container');
            containerElm.setAttribute('tabindex', '0');
            this.appendChild(containerElm);
        }
        return containerElm;
    }

    getOrCreateSubMenu(key, caption=null) {
        key = key.toString();

        let containerElm = this.getSubMenuContainer();

        for(let i=0; i<containerElm.childNodes.length; i++) {
            const childNode = containerElm.childNodes[i];
            if(childNode.matches('asui-menu')) {
                if(childNode.key === key) {
                    return childNode;
                }
            }
        }

        const childNode = document.createElement('asui-menu');
        childNode.key = key;
        if(caption)
            childNode.caption = caption;
        containerElm.appendChild(childNode);
        return childNode;
    }
    // }

    selectNextSubMenuItem() {
        const containerElm = this.getSubMenuContainer();
        const currentMenuElm = containerElm.querySelector('asui-menu.selected');
        containerElm.querySelectorAll('asui-menu.selected')
            .forEach(menuElm => menuElm.classList.remove('selected'));
        // let selectedItem = currentItem && currentItem.nextElementSibling ? currentItem.nextElementSibling : containerElm.firstElementChild;

        const subMenuElms = containerElm.querySelectorAll('asui-menu:not([disabled])');
        let currentIndex = [].indexOf.call(subMenuElms, currentMenuElm);
        let selectedItem = currentIndex > -1 && currentIndex < subMenuElms.length - 1 ? subMenuElms[currentIndex + 1] : subMenuElms[0];
        selectedItem.classList.add('selected');
//         console.log("selectNextSubMenuItem", currentItem, selectedItem);
    }

    selectPreviousSubMenuItem() {
        const containerElm = this.getSubMenuContainer();
        const currentMenuElm = containerElm.querySelector('asui-menu.selected');
        containerElm.querySelectorAll('asui-menu.selected')
            .forEach(menuElm => menuElm.classList.remove('selected'));

        const subMenuElms = containerElm.querySelectorAll('asui-menu:not([disabled])');
        let currentIndex = [].indexOf.call(subMenuElms, currentMenuElm);
        let selectedItem = currentIndex > 0 ? subMenuElms[currentIndex - 1] : subMenuElms[subMenuElms.length - 1];
        // let selectedItem = currentItem && currentItem.previousElementSibling ? currentItem.previousElementSibling : containerElm.lastElementChild;
        selectedItem.classList.add('selected');
//         console.log("selectNextSubMenuItem", currentItem, selectedItem);
    }

    openContextMenu(e, targetElement=null) {
        targetElement = targetElement || e.target;
        const rect = targetElement.getBoundingClientRect();
        let containerElm = this.getSubMenuContainer();
        const containerRect = this.editor.getBoundingClientRect();
        let x = rect.x + rect.width - containerRect.x;
        let y = rect.y + rect.height - containerRect.y;
        this.clearSubMenu();
        this.renderSubMenu(e);
        // this.classList.add('stick');


        console.info("Context menu ", targetElement, containerElm, x, y);

        this.classList.add('open', 'stick', 'open-context-menu');

        this.style.left = x + 'px';
        this.style.top = y + 'px';

        // containerElm.focus();

        // this.selectNextSubMenuItem();
    }

    closeAllMenus() {
        let parentMenu = this;
        while(parentMenu.parentElement && parentMenu.parentElement.closest('asui-menu')) {
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
        if(parentMenu && parentMenu !== this)
            parentMenu.renderSubMenu(e);
    }

    render() {
        const titleElm = this.caption; // this.caption === null ? this.key : this.caption;
        if(titleElm) {
            let textDiv = this.querySelector('div');
            if (!textDiv) {
                textDiv = document.createElement('div');
                textDiv.classList.add('caption');
                this.firstElementChild ? this.insertBefore(textDiv, this.firstElementChild) : this.appendChild(textDiv);
            }
            textDiv.innerHTML = '';
            if(typeof titleElm === "string")
                textDiv.innerHTML = titleElm;
            else
                textDiv.appendChild(titleElm); // .replace('►', '<span class="arrow"></span>');

        }
        if(this.hasBreak) {
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





/** Forms **/

class AudioSourceUIForm extends HTMLElement {
    constructor(key=null, captionText=null) {
        super();
        if(key !== null)
            this.setAttribute('key', key);

        if(captionText === null && this.hasAttribute('caption')) {
            captionText = this.getAttribute('caption');
            this.removeAttribute('caption');
        }
        this.caption = captionText;
    }

    connectedCallback() {
        // this.addEventListener('focus', this.onInput, true);
    }

    disconnectedCallback() {
        // this.removeEventListener('focus', this.onInput);
    }

    get caption() {
        const headerElm = this.querySelector('.header');
        if(headerElm)
            return headerElm.innerText;
        return null;
    }
    set caption(value) {
        let headerElm = this.querySelector('.header');
        if(!value && value !== '0') {
            if(headerElm)
                headerElm.parentNode.removeChild(headerElm);
        } else {
            if(!headerElm) {
                headerElm = document.createElement('div');
                headerElm.classList.add('header');
                this.prepend(headerElm);
            }
            headerElm.innerHTML = value;
        }
    }

    get parentForm() { return this.parentNode.closest('asui-form'); }
    get key() { return this.getAttribute('key'); }
    get editor() { return this.closest('audio-source-composer') || this.getRootNode().host; }

    // onInput(e) {
    //     console.log(this, e.type);
    //     switch(e.type) {
    //         case 'focus':
    //             this.getRootNode().querySelectorAll('asui-form.focus')
    //                 .forEach(formElm => formElm.classList.remove('focus'));
    //             this.classList.add('focus');
    //             break;
    //     }
    // }

    clearInputs() {
        const caption = this.caption;
        this.innerHTML = '';
        this.caption = caption;
    }

    hasInput(inputKey) {
        return !!this.querySelector(`[key="${inputKey}"]`);
    }

    getInput(inputKey, throwException=true) {
        const inputElm = this.querySelector(`[key="${inputKey}"]`);
        if(inputElm)
            return inputElm;
        if(throwException)
            throw new Error("Input key not found: " + inputKey);
        return null;
    }
    /**
     *
     * @param formKey
     * @param caption
     * @returns AudioSourceUIForm
     */
    getOrCreateForm(formKey, caption=null) {
        let formElm = this.getInput(formKey, false);
        if(!formElm) {
            formElm = this.addForm(formKey, caption);
        } else if(caption !== null) {
            formElm.caption = caption;
        }
        if(!formElm instanceof  AudioSourceUIForm)
            throw new Error("Input is not a form: " + formKey);
        return formElm;
    }
    getForm(formKey, throwException=true) {
        const formElm = this.getInput(formKey, throwException);
        if(formElm === null && throwException === false)
            return formElm;
        if(!formElm instanceof  AudioSourceUIForm)
            throw new Error("Input is not a form: " + formKey);
        return formKey
    }
    // hasForm(formKey) {
    //     return this.getInput(formKey, false) instanceof AudioSourceComposerForm;
    // }


    addInput(inputElm) {
        if(!inputElm.hasAttribute("key"))
            throw new Error("Form Inputs require a key attribute");
        this.appendChild(inputElm);
        return inputElm;
    }


    addForm(formKey, caption=null) {
        return this.addInput(new AudioSourceUIForm(formKey, caption)); }

    addGrid(gridKey) {
        return this.addInput(new AudioSourceUIGrid(gridKey)); }


    addBreak(key='break') {
        return this.addText(key, '<br/>'); }

    /** @deprecated **/
    addText(key, innerHTML=null) {
        return this.addInput(new AudioSourceUIText(key, innerHTML)); }

    addButton(key, callback, buttonInnerHTML, title=null) {
        return this.addInput(new AudioSourceUIButton(key, callback, buttonInnerHTML, title)); }

    addSelectInput(key, callback, optionsCallback, title = null, defaultValue=null) {
        return this.addInput(new AudioSourceUISelectInput(key, callback, optionsCallback, title, defaultValue)); }


    addRangeInput(key, callback, min=1, max=100, title=null, defaultValue=null) {
        return this.addInput(new AudioSourceUIRangeInput(key, callback, min, max, title, defaultValue)); }


    addTextInput(key, callback, title=null, defaultValue = '', placeholder=null) {
        return this.addInput(new AudioSourceUIInputText(key, callback, title, defaultValue, placeholder)); }

    addCheckBoxInput(key, callback, title=null, defaultValue=false) {
        return this.addInput(new AudioSourceUIInputCheckBox(key, callback, title, defaultValue)); }

    addFileInput(key, callback, buttonInnerHTML, accepts=null, title=null) {
        return this.addInput(new AudioSourceUIFileInput(key, callback, buttonInnerHTML, accepts, title)); }

    /** Content **/

    createIcon(iconClass, key='icon') {
        return new AudioSourceUIIcon(key, iconClass);
    }

}

customElements.define('asui-form', AudioSourceUIForm);

/** Grid **/

class AudioSourceUIGrid extends HTMLElement {
    constructor(key=null) {
        super();
        if(key !== null)
            this.setAttribute('key', key);
    }

    get parentForm() { return this.parentNode.closest('asui-form'); }
    get key() { return this.getAttribute('key'); }
    get editor() { return this.closest('audio-source-composer') || this.getRootNode().host; }

    clearInputs() {
        this.innerHTML = '';
    }

    getInput(rowKey, inputKey, throwException=true) {
        let rowElm = this.getOrCreateRow(rowKey);
        const inputElm = rowElm.querySelector(`[key="${inputKey}"]`);
        if(inputElm)
            return inputElm;
        if(throwException)
            throw new Error("Input key not found: " + inputKey);
        return null;
    }

    getOrCreateRow(rowKey) {
        let rowElm = this.querySelector(`asuig-row[key="${rowKey}"]`);
        if(!rowElm) {
            rowElm = new AudioSourceUIGridRow(rowKey);
            this.appendChild(rowElm);
        }
        return rowElm;
    }

    addInput(rowKey, inputElm) {
        if(!inputElm.hasAttribute("key"))
            throw new Error("Form Inputs require a key attribute");
        let rowElm = this.getOrCreateRow(rowKey);
        rowElm.addInput(inputElm);
        return inputElm;
    }


    // addForm(x, y, caption=null) {
    //     return this.addInput(x, y, new AudioSourceComposerForm(`${x}-${y}`, caption)); }


    // addBreak(x, y) {
    //     return this.addText(`${x}-${y}`, '<br/>'); }

    /** @deprecated **/
    addText(rowKey, key, innerHTML=null) {
        return this.getOrCreateRow(rowKey)
            .addText(key, innerHTML); }

    addButton(rowKey, key, callback, buttonInnerHTML, title=null) {
        return this.getOrCreateRow(rowKey)
            .addButton(key, callback, buttonInnerHTML, title); }

    addSelectInput(rowKey, key, callback, optionsCallback, title = null, defaultValue=null) {
        return this.getOrCreateRow(rowKey)
            .addSelectInput(key, callback, optionsCallback, title, defaultValue); }

    addRangeInput(rowKey, key, callback, min=1, max=100, title=null, defaultValue=null) {
        return this.getOrCreateRow(rowKey)
            .addRangeInput(rowKey, key, callback, min, max, title, defaultValue); }

    addTextInput(rowKey, key, callback, title=null, defaultValue = '', placeholder=null) {
        return this.getOrCreateRow(rowKey)
            .addTextInput(rowKey, key, callback, title, defaultValue , placeholder); }

    addCheckBoxInput(rowKey, key, callback, title=null, defaultValue=false) {
        return this.getOrCreateRow(rowKey)
            .addCheckBoxInput(rowKey, key, callback, title, defaultValue); }

    addFileInput(rowKey, key, callback, buttonInnerHTML, accepts=null, title=null) {
        return this.getOrCreateRow(rowKey)
            .addFileInput(rowKey, key, callback, buttonInnerHTML, accepts, title); }

    /** Content **/

    createIcon(iconClass, key='icon') {
        return new AudioSourceUIIcon(key, iconClass);
    }

}

customElements.define('asui-grid', AudioSourceUIGrid);

/** Grid Row **/



class AudioSourceUIGridRow extends HTMLElement {
    constructor(key=null) {
        super();
        if(key !== null)
            this.setAttribute('key', key);
    }

    get grid() { return this.parentNode; }
    get key() { return this.getAttribute('key'); }

    clearInputs() {
        this.innerHTML = '';
    }

    getInput(inputKey, throwException=true) {
        const inputElm = this.querySelector(`[key="${inputKey}"]`);
        if(inputElm)
            return inputElm;
        if(throwException)
            throw new Error("Input key not found: " + inputKey);
        return null;
    }


    addInput(inputElm) {
        if(!inputElm.hasAttribute("key"))
            throw new Error("Form Inputs require a key attribute");
        this.appendChild(inputElm);
        return inputElm;
    }


    // addForm(x, y, caption=null) {
    //     return this.addInput(x, y, new AudioSourceComposerForm(`${x}-${y}`, caption)); }


    // addBreak(x, y) {
    //     return this.addText(`${x}-${y}`, '<br/>'); }

    /** @deprecated **/
    addText(key, innerHTML=null) {
        return this.addInput(new AudioSourceUIText(key, innerHTML)); }

    addButton(key, callback, buttonInnerHTML, title=null) {
        return this.addInput(new AudioSourceUIButton(key, callback, buttonInnerHTML, title)); }

    addSelectInput(key, callback, optionsCallback, title = null, defaultValue=null) {
        return this.addInput(new AudioSourceUISelectInput(key, callback, optionsCallback, title, defaultValue)); }


    addRangeInput(key, callback, min=1, max=100, title=null, defaultValue=null) {
        return this.addInput(new AudioSourceUIRangeInput(key, callback, min, max, title, defaultValue)); }


    addTextInput(key, callback, title=null, defaultValue = '', placeholder=null) {
        return this.addInput(new AudioSourceUIInputText(key, callback, title, defaultValue, placeholder)); }

    addCheckBoxInput(key, callback, title=null, defaultValue=false) {
        return this.addInput(new AudioSourceUIInputCheckBox(key, callback, title=null, defaultValue)); }

    addFileInput(key, callback, buttonInnerHTML, accepts=null, title=null) {
        return this.addInput(new AudioSourceUIFileInput(key, callback, buttonInnerHTML, accepts, title)); }

    /** Content **/

    createIcon(iconClass, key='icon') {
        return new AudioSourceUIIcon(key, iconClass);
    }
}

customElements.define('asuig-row', AudioSourceUIGridRow);


/** Abstract Panel Input **/
class AudioSourceUIInputAbstract extends HTMLElement {
    constructor(key, callback) {
        super();
        this.listeners = [];
        this.callback = callback || function() { console.warn("No callback set") };

        this.setAttribute('key', key);
    }

    get key() { return this.getAttribute('key'); }

    get inputElm() { throw new Error("Not implemented"); }
    get disabled() { return this.inputElm.disabled; }
    set disabled(value) { this.inputElm.disabled = value; }

    get value() { return this.inputElm.value; }
    set value(newValue) { this.inputElm.value = newValue; }

    setContent(innerHTML, inputElm=null) {
        inputElm = inputElm || this.inputElm;
        inputElm.innerHTML = '';
        if(innerHTML instanceof HTMLElement)
            inputElm.appendChild(innerHTML);
        else // if(typeof innerHTML === "string")
            inputElm.innerHTML = innerHTML;
    }

    addEventListener(type, listener, options) {
        this.listeners.push([type, listener, options]);
    }

    connectedCallback() {
        this.listeners.forEach(listener => this.inputElm.addEventListener(listener[0], listener[1], listener[2]));
    }

    disconnectedCallback() {
        this.listeners.forEach(listener => this.inputElm.removeEventListener(listener[0], listener[1]));
    }
}



class AudioSourceUIButton extends AudioSourceUIInputAbstract {
    constructor(key, callback=null, innerHTML=null, title=null) {
        super(key, callback);

        this.setAttribute('key', key);

        const buttonElm = document.createElement('button');
        buttonElm.classList.add('themed');
        if(title)
            buttonElm.setAttribute('title', title);
        this.setContent(innerHTML, buttonElm);
        this.appendChild(buttonElm);

        this.addEventListener('click', e => this.onClick(e));
    }

    get inputElm() { return this.querySelector('button'); }

    onClick(e) {
        this.callback(e, this.value);
    }


    // render() {
    // }
}

customElements.define('asui-input-button', AudioSourceUIButton);





class AudioSourceUISelectInput extends AudioSourceUIInputAbstract {
    constructor(key, callback=null, optionsCallback=null, title=null, defaultValue=null) {
        super(key, callback);
        this.optionsCallback = optionsCallback || function() { throw new Error("No options callback set") };

        this.setAttribute('key', key);

        const selectElm = document.createElement('select');
        selectElm.classList.add('themed');
        if(title)
            selectElm.setAttribute('title', title);
        // if(optionsCallback)
        //     selectElm.innerHTML = optionsCallback;
        this.appendChild(selectElm);

        if (defaultValue !== null) {
            try {
                this.value = defaultValue;
            } catch (e) {
//                 console.warn(e.message, this);
                this.addOrSetValue(defaultValue, defaultValue);
            }
        }
        // this.addOrSetValue('', "No Default value");

        this.addEventListener('focus', e => this.renderOptions(e));
        this.addEventListener('change', e => this.onChange(e));
    }

    get inputElm() { return this.querySelector('select'); }

    get value() {
        const currentValue = this.inputElm.value;
        let valueFound = false;
        this.eachOption((value, title) => {
            if((value+'') === currentValue)
                valueFound = {value, title};
        });
        if(!valueFound)
            return null;
        return valueFound.value;
    }
    set value(newValue) {
        let valueFound = false;
        this.eachOption((value, title) => {
            if(value === newValue)
                valueFound = {value, title};
        });
        if(!valueFound)
            throw new Error(`Value not found: (${typeof newValue}) ${newValue}`);

        this.addOrSetValue(valueFound.value, valueFound.title);
    }

    eachOption(callback, groupCallback=null) {
        groupCallback = groupCallback || function() {};
        this.optionsCallback((value, title=null) => {
            title = title !== null ? title : value;
            return callback(value, title);
        }, groupCallback);
    }


    addOrSetValue(newValue, newValueTitlePrefix=null) {
        const inputElm = this.inputElm;
        let optionElm = inputElm.querySelector(`option[value="${newValue}"]`);
        if(!optionElm) {
            if(!newValueTitlePrefix) {
                this.eachOption((value, title) => {
                    if(value === newValue)
                        newValueTitlePrefix = title;
                });
            }

            optionElm = document.createElement('option');
            optionElm.setAttribute('value', newValue);
            optionElm.innerText = (newValueTitlePrefix || "Unknown value");
            inputElm.prepend(optionElm);
        }
        optionElm.selected = true;
        // optionElm.setAttribute('selected', 'selected');
        // optionElm.setAttribute('selected1', 'selected');
        // console.log('optionElm', optionElm);
        // inputElm.value = newValue+'';
    }

    onChange(e) {
        // console.log(e.type, this.value);
        this.callback(e, this.value);
    }

    renderOptions() {
        const inputElm = this.inputElm;
        // const currentValue = this.value;
        let currentOption = inputElm.options[inputElm.selectedIndex];

        inputElm.innerHTML = '';
        let currentOptGroup = inputElm;
        this.eachOption((value, title) => {
            let newOption = document.createElement('option');
            if(currentOption && (value + '') === currentOption.value) {
                newOption = currentOption;
                currentOption = null;
            } else {
                newOption.setAttribute('value', value);
                newOption.innerText = title;
            }
            currentOptGroup.appendChild(newOption);

        }, (groupName) => {
            if(groupName !== null) {
                currentOptGroup = document.createElement('optgroup');
                currentOptGroup.setAttribute('label', groupName);
                inputElm.appendChild(currentOptGroup);
            } else {
                currentOptGroup = inputElm;
            }
        });

        if(currentOption)
            inputElm.prepend(currentOption);
        // this.addOrSetValue(currentValue);
    }

}

customElements.define('asui-input-select', AudioSourceUISelectInput);




class AudioSourceUIRangeInput extends AudioSourceUIInputAbstract {
    constructor(key, callback=null, min=1, max=100, title=null, value=null) {
        super(key, callback);

        this.setAttribute('key', key);

        const rangeElm = document.createElement('input');
        rangeElm.classList.add('themed');

        rangeElm.setAttribute('type', 'range');
        rangeElm.setAttribute('min', min+'');
        rangeElm.setAttribute('max', max+'');
        if(value !== null)  rangeElm.setAttribute('value', value);
        if(title !== null)  rangeElm.setAttribute('title', title);
        this.appendChild(rangeElm);

        this.addEventListener('change', e => this.onChange(e));
    }

    get inputElm() { return this.querySelector('input'); }
    get value() { return parseInt(this.inputElm.value); }
    set value(newRangeValue) { this.inputElm.value = newRangeValue; }

    onChange(e) {
        // console.log(e.type);
        this.callback(e, this.value);
    }
}

customElements.define('asui-input-range', AudioSourceUIRangeInput);



class AudioSourceUIInputText extends AudioSourceUIInputAbstract {
    constructor(key, callback=null, title=null, value=null, placeholder=null) {
        super(key, callback);

        this.setAttribute('key', key);

        const inputElm = document.createElement('input');
        inputElm.classList.add('themed');
        inputElm.setAttribute('type', 'text');
        if(title)       inputElm.setAttribute('title', title);
        if(value)       inputElm.setAttribute('value', value);
        if(placeholder) inputElm.setAttribute('placeholder', placeholder);
        this.appendChild(inputElm);

        this.addEventListener('change', e => this.onChange(e));
    }

    get inputElm() { return this.querySelector('input'); }

    onChange(e) {
        // console.log(e.type);
        this.callback(e, this.value);
    }
}

customElements.define('asui-input-text', AudioSourceUIInputText);



class AudioSourceUIInputCheckBox extends AudioSourceUIInputAbstract {
    constructor(key, callback=null, title=null, checked=false) {
        super(key, callback);

        this.setAttribute('key', key);

        const inputElm = document.createElement('input');
        inputElm.classList.add('themed');
        inputElm.setAttribute('type', 'checkbox');
        if(title)       inputElm.setAttribute('title', title);
        if(checked)     inputElm.checked = checked;
        this.appendChild(inputElm);

        this.addEventListener('change', e => this.onChange(e));
    }

    get inputElm() { return this.querySelector('input'); }
    get checked() { return this.inputElm.checked; }

    onChange(e) {
        // console.log(e.type);
        this.callback(e, this.checked);
    }
}

customElements.define('asui-input-checkbox', AudioSourceUIInputCheckBox);




class AudioSourceUIFileInput extends AudioSourceUIInputAbstract {
    constructor(key, callback, innerHTML, accepts=null, title=null) {
        super(key, callback);

        this.setAttribute('key', key);

        const labelElm = document.createElement('label');
        this.appendChild(labelElm);

        this.setContent(innerHTML, labelElm);

        const inputElm = document.createElement('input');
        inputElm.classList.add('themed');
        inputElm.setAttribute('type', 'file');
        inputElm.setAttribute('style', 'display: none;');
        if(accepts)     inputElm.setAttribute('accepts', accepts);
        if(title)       inputElm.setAttribute('title', title);
        labelElm.appendChild(inputElm);
    }

    get inputElm() { return this.querySelector('input'); }

    connectedCallback() {
        this.addEventListener('change', e => this.onChange(e));
    }

    onChange(e) {
        // console.log(e.type);
        this.callback(e, this.value);
    }
}

customElements.define('asui-input-file', AudioSourceUIFileInput);


/** Text **/
class AudioSourceUIText extends HTMLElement {
    constructor(key, innerHTML) {
        super();
        if(key !== null)
            this.setAttribute('key', key);
        this.innerHTML = innerHTML;
    }

    get key() {
        return this.getAttribute('key');
    }
}
customElements.define('asui-text', AudioSourceUIText);


/** Icon **/
class AudioSourceUIIcon extends HTMLElement {
    constructor(key, iconClass) {
        super();
        if(key !== null)
            this.setAttribute('key', key);
        this.classList.add(iconClass);
    }

    get key() {
        return this.getAttribute('key');
    }
}
customElements.define('asui-icon', AudioSourceUIIcon);

