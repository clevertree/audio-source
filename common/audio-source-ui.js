

/** Forms **/

class AudioSourceComposerForm extends HTMLElement {
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

    get parentForm() { return this.parentNode.closest('asc-form'); }
    get key() { return this.getAttribute('key'); }
    get editor() { return this.closest('audio-source-composer') || this.getRootNode().host; }

    clearInputs() {
        const caption = this.caption;
        this.innerHTML = '';
        this.caption = caption;
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
     * @returns AudioSourceComposerForm
     */
    getOrCreateForm(formKey, caption=null) {
        let formElm = this.getInput(formKey, false);
        if(!formElm) {
            formElm = this.addForm(formKey, caption);
        } else if(caption !== null) {
            formElm.caption = caption;
        }
        if(!formElm instanceof  AudioSourceComposerForm)
            throw new Error("Input is not a form: " + formKey);
        return formElm;
    }
    getForm(formKey) {
        const formElm = this.getInput(formKey);
        if(!formElm instanceof  AudioSourceComposerForm)
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
        return this.addInput(new AudioSourceComposerForm(formKey, caption)); }

    addGrid(gridKey) {
        return this.addInput(new AudioSourceComposerGrid(gridKey)); }


    addBreak(key='break') {
        return this.addText(key, '<br/>'); }

    addText(key, innerHTML=null) {
        return this.addInput(new AudioSourceComposerFormText(key, innerHTML)); }

    addButton(key, callback, buttonInnerHTML, title=null) {
        return this.addInput(new AudioSourceComposerFormButton(key, callback, buttonInnerHTML, title)); }

    addSelectInput(key, callback, optionsCallback, title = null, defaultValue=null) {
        return this.addInput(new AudioSourceComposerFormSelect(key, callback, optionsCallback, title, defaultValue)); }


    addRangeInput(key, callback, min=1, max=100, title=null, defaultValue=null) {
        return this.addInput(new AudioSourceComposerFormRangeInput(key, callback, min, max, title, defaultValue)); }


    addTextInput(key, callback, title=null, defaultValue = '', placeholder=null) {
        return this.addInput(new AudioSourceComposerFormInputText(key, callback, title, defaultValue, placeholder)); }

    addCheckBoxInput(key, callback, title=null, defaultValue=false) {
        return this.addInput(new AudioSourceComposerFormInputCheckbox(key, callback, title, defaultValue)); }

    addFileInput(key, callback, buttonInnerHTML, accepts=null, title=null) {
        return this.addInput(new AudioSourceComposerFormFileInput(key, callback, buttonInnerHTML, accepts, title)); }
}

customElements.define('asc-form', AudioSourceComposerForm);

/** Grid **/

class AudioSourceComposerGrid extends HTMLElement {
    constructor(key=null) {
        super();
        if(key !== null)
            this.setAttribute('key', key);
    }

    get parentForm() { return this.parentNode.closest('asc-form'); }
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
        let rowElm = this.querySelector(`ascg-row[key="${rowKey}"]`);
        if(!rowElm) {
            rowElm = new AudioSourceComposerGridRow(rowKey);
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

}

customElements.define('asc-grid', AudioSourceComposerGrid);

/** Grid Row **/



class AudioSourceComposerGridRow extends HTMLElement {
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

    addText(key, innerHTML=null) {
        return this.addInput(new AudioSourceComposerFormText(key, innerHTML)); }

    addButton(key, callback, buttonInnerHTML, title=null) {
        return this.addInput(new AudioSourceComposerFormButton(key, callback, buttonInnerHTML, title)); }

    addSelectInput(key, callback, optionsCallback, title = null, defaultValue=null) {
        return this.addInput(new AudioSourceComposerFormSelect(key, callback, optionsCallback, title, defaultValue)); }


    addRangeInput(key, callback, min=1, max=100, title=null, defaultValue=null) {
        return this.addInput(new AudioSourceComposerFormRangeInput(key, callback, min, max, title, defaultValue)); }


    addTextInput(key, callback, title=null, defaultValue = '', placeholder=null) {
        return this.addInput(new AudioSourceComposerFormInputText(key, callback, title, defaultValue, placeholder)); }

    addCheckBoxInput(key, callback, title=null, defaultValue=false) {
        return this.addInput(new AudioSourceComposerFormInputCheckBox(key, callback, title=null, defaultValue)); }

    addFileInput(key, callback, buttonInnerHTML, accepts=null, title=null) {
        return this.addInput(new AudioSourceComposerFormFileInput(key, callback, buttonInnerHTML, accepts, title)); }
}

customElements.define('ascg-row', AudioSourceComposerGridRow);


/** Abstract Panel Input **/
class AudioSourceComposerPanelInputAbstract extends HTMLElement {
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



class AudioSourceComposerFormButton extends AudioSourceComposerPanelInputAbstract {
    constructor(key, callback=null, innerHTML=null, title=null) {
        super(key, callback);

        this.setAttribute('key', key);

        const buttonElm = document.createElement('button');
        buttonElm.classList.add('themed');
        if(title)
            buttonElm.setAttribute('title', title);
        if(innerHTML !== null)
            buttonElm.innerHTML = innerHTML;
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

customElements.define('ascf-input-button', AudioSourceComposerFormButton);





class AudioSourceComposerFormSelect extends AudioSourceComposerPanelInputAbstract {
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

        try {
            if (defaultValue !== null)
                this.value = defaultValue;
        } catch (e) {
            console.warn(e, this);
            // this.addOrSetValue(defaultValue, defaultValue);
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

    eachOption(callback) {
        this.optionsCallback((value, title=null) => {
            title = title !== null ? title : value;
            return callback(value, title);
        }, (groupName) => {});
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
        inputElm.value = newValue;
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

customElements.define('ascf-input-select', AudioSourceComposerFormSelect);




class AudioSourceComposerFormRangeInput extends AudioSourceComposerPanelInputAbstract {
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

    onChange(e) {
        // console.log(e.type);
        this.callback(e, this.value);
    }
}

customElements.define('ascf-input-range', AudioSourceComposerFormRangeInput);



class AudioSourceComposerFormInputText extends AudioSourceComposerPanelInputAbstract {
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

customElements.define('ascf-input-text', AudioSourceComposerFormInputText);



class AudioSourceComposerFormInputCheckBox extends AudioSourceComposerPanelInputAbstract {
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

customElements.define('ascf-input-checkbox', AudioSourceComposerFormInputCheckBox);




class AudioSourceComposerFormFileInput extends AudioSourceComposerPanelInputAbstract {
    constructor(key, callback, innerHTML, accepts=null, title=null) {
        super(key, callback);

        this.setAttribute('key', key);

        const labelElm = document.createElement('label');
        this.appendChild(labelElm);

        labelElm.innerHTML = innerHTML;

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

customElements.define('ascf-file', AudioSourceComposerFormFileInput);


/** Abstract Panel Input **/
class AudioSourceComposerFormText extends HTMLElement {
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
customElements.define('ascf-text', AudioSourceComposerFormText);