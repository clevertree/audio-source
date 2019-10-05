

/** Forms **/

class AudioSourceComposerForm extends HTMLElement {
    constructor(key=null, captionText=null) {
        super();
        if(key) this.setAttribute('key', key);

        this.innerHTML = `
            <div class="header"></div>
            <div class="container"></div>
        `;
        // if(!captionText && this.key)
        //     captionText = this.key.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase());
        if(captionText === null && this.hasAttribute('caption'))
            captionText = this.getAttribute('caption');
        this.caption = captionText;
    }

    get headerElm() { return this.querySelector('.header'); }
    get containerElm() { return this.querySelector('.container'); }

    get caption() { return this.headerElm.innerText; }
    set caption(value) {
        this.headerElm.innerText = value;
        this.headerElm.classList.toggle('hidden', !value);
    }

    get parentForm() { return this.parentNode.parentNode.closest('asc-form'); }
    get key() { return this.getAttribute('key'); }
    get editor() { return this.closest('audio-source-composer') || this.getRootNode().host; }

    clearInputs() {
        this.containerElm.innerHTML = '';
    }

    addBreak() {
        this.containerElm.appendChild(document.createElement('br'));
    }

    getInput(inputKey, throwException=true) {
        const inputElm = this.containerElm.querySelector('[key="' + inputKey + '"]');
        if(inputElm)
            return inputElm;
        if(throwException)
            throw new Error("Input key not found: " + inputKey);
        return null;
    }

    getOrCreateForm(formKey, caption=null) {
        let formElm = this.getInput(formKey, false);
        if(!formElm)
            formElm = this.addForm(formKey, caption);
        else if(caption !== null)
            formElm.caption = caption;
        return formElm;
    }

    addForm(formKey, caption=null) {
        let formElm = new AudioSourceComposerForm(formKey, caption);
        this.containerElm.appendChild(formElm);
        return formElm;
    }

    // hasForm(formKey) {
    //     return this.getInput(formKey, false) instanceof AudioSourceComposerForm;
    // }


    addButton(key, callback, buttonInnerHTML, title=null) {
        const buttonElm = new AudioSourceComposerFormButton(key, callback, buttonInnerHTML, title);
        this.containerElm.appendChild(buttonElm);
        return buttonElm;
    }

    addSelect(key, callback, optionsCallback, title = null, defaultValue = null) {
        const selectElm = new AudioSourceComposerFormSelect(key, callback, optionsCallback, title);
        this.containerElm.appendChild(selectElm);
        if(defaultValue !== null)
            selectElm.addOrSetValue(defaultValue);
        return selectElm;
    }

    addRangeInput(key, callback, min=1, max=100, title=null, defaultValue = '') {
        const rangeElm = new AudioSourceComposerFormRangeInput(key, callback, min, max, title, defaultValue);
        this.containerElm.appendChild(rangeElm);
        return rangeElm;
    }

    addTextInput(key, callback, title=null, defaultValue = '', placeholder=null) {
        const textElm = new AudioSourceComposerFormText(key, callback, title, defaultValue, placeholder);
        this.containerElm.appendChild(textElm);
        return textElm;
    }

    addFileInput(key, callback, buttonInnerHTML, accepts=null, title=null, defaultValue = '') {
        const fileInputElm = new AudioSourceComposerFormFileInput(key, callback, buttonInnerHTML, accepts, title);
        this.containerElm.appendChild(fileInputElm);
        return fileInputElm;

    }

    addInstrumentContainer(instrumentID) {
        const instrumentContainerElm = new AudioSourceComposerFormInstrumentContainer(instrumentID);
        this.containerElm.appendChild(instrumentContainerElm);
        return instrumentContainerElm;
    }
}

customElements.define('asc-form', AudioSourceComposerForm);



/** Abstract Panel Input **/
class AudioSourceComposerPanelInputAbstract extends HTMLElement {
    constructor(key, callback) {
        super();
        this.listeners = [];
        this.callback = callback || function() { console.warn("No callback set") };

        this.setAttribute('key', key);
    }

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

customElements.define('ascf-button', AudioSourceComposerFormButton);





class AudioSourceComposerFormSelect extends AudioSourceComposerPanelInputAbstract {
    constructor(key, callback=null, optionsCallback=null, title=null) {
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

        // this.value = defaultValue;
        // this.addOrSetValue('', "No Default value");

        this.addEventListener('focus', e => this.renderOptions(e));
        this.addEventListener('change', e => this.onChange(e));
    }

    get inputElm() { return this.querySelector('select'); }

    get value() {
        const currentValue = this.inputElm.value;
        let valueFound = false;
        this.optionsCallback((value, title) => {
            if((value+'') === currentValue)
                valueFound = {value, title};
        }, (groupName) => {});
        if(!valueFound)
            return null;
        return valueFound.value;
    }
    set value(newValue) {
        let valueFound = false;
        this.optionsCallback((value, title) => {
            if(value === newValue)
                valueFound = {value, title};
        }, (groupName) => {});
        if(!valueFound)
            throw new Error(`Value not found: (${typeof newValue}) ${newValue}`);

        this.addOrSetValue(valueFound.value, valueFound.title);
    }


    addOrSetValue(newValue, newValueTitlePrefix=null) {
        const inputElm = this.inputElm;
        let optionElm = inputElm.querySelector(`option[value="${newValue}"]`);
        if(!optionElm) {
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
        this.optionsCallback((value, title) => {
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

customElements.define('ascf-select', AudioSourceComposerFormSelect);




class AudioSourceComposerFormRangeInput extends AudioSourceComposerPanelInputAbstract {
    constructor(key, callback=null, min=1, max=100, title=null, value=null) {
        super(key, callback);

        this.setAttribute('key', key);

        const rangeElm = document.createElement('input');
        rangeElm.classList.add('themed');

        rangeElm.setAttribute('type', 'range');
        rangeElm.setAttribute('min', min+'');
        rangeElm.setAttribute('max', max+'');
        if(value)       rangeElm.setAttribute('value', value);
        if(title)       rangeElm.setAttribute('title', title);
        this.appendChild(rangeElm);

        this.addEventListener('change', e => this.onChange(e));
    }

    get inputElm() { return this.querySelector('input'); }

    onChange(e) {
        // console.log(e.type);
        this.callback(e, this.value);
    }
}

customElements.define('ascf-range', AudioSourceComposerFormRangeInput);



class AudioSourceComposerFormText extends AudioSourceComposerPanelInputAbstract {
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

customElements.define('ascf-text', AudioSourceComposerFormText);




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


/** Instrument Panel **/


class AudioSourceComposerFormInstrumentContainer extends AudioSourceComposerForm {
    constructor(instrumentID) {
        if(!Number.isInteger(instrumentID))
            throw new Error("Invalid instrumentID");
        // const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);
        super(instrumentID); // , instrumentIDHTML);
        this.setAttribute('id', instrumentID+'');
        // this.setAttribute('tabindex', '0');


        const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);
        this.fieldInstrumentID = this.addButton('instrument-id',
                null,
                instrumentIDHTML + ':'
            );

        this.fieldInstrumentName = this.addTextInput('instrument-name',
            (e, newInstrumentName) => this.editor.actions.setInstrumentName(e, newInstrumentName),
            'Instrument Name',
            '',
            'Unnamed'
        );

        this.fieldInstrumentChangeURL = this.addSelect('instrument-replace-url',
            (e, changeInstrumentURL) => this.editor.actions.songReplaceInstrument(e, this.instrumentID, changeInstrumentURL),
            (addOption) => {
                addOption('', 'Change Instrument');
                this.editor.values.getValues('instruments-available', addOption)
            },
            'Change Instrument',
            '');

        this.addBreak();

        this.formInstrument = this.addForm('instrument');
    }

    get instrumentID() { return parseInt(this.getAttribute('id')); }

    connectedCallback() {
        this.render();
    }

    render() {
        const editor = this.editor;
        const song = editor.song;
        const instrumentID = this.instrumentID; // parseInt(this.getAttribute('id'));
        // const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);

        // const defaultSampleLibraryURL = new URL('/sample/', NAMESPACE) + '';

        // TODO: get instrument renderer
        let instrument = song.getInstrument(instrumentID, false);
        const instrumentPreset = song.getInstrumentConfig(instrumentID, false);

        // this.headerElm.innerHTML = `${instrumentIDHTML}: Loading...`;
        this.formInstrument.clearInputs();
        // this.containerElm.innerHTML = ``;

        if(!instrumentPreset) {
            // this.renderEmptyInstrument();

        } else if(!song.isInstrumentLoaded(instrumentID)) {
            // this.headerElm.innerHTML = `${instrumentIDHTML}: Loading...`;
            // this.renderEmptyInstrument('Loading...');

        } else {
            this.containerElm.innerHTML = ``;
            try {
                if (instrument instanceof HTMLElement) {
                    instrument.setAttribute('data-id', instrumentID+'');
                    this.appendChild(instrument);

                } else if (typeof instrument.renderForm === "function") {
                    instrument.renderForm(this.formInstrument, instrumentID);

                } else if (typeof instrument.renderHTML === "function") {
                    const renderedHTML = instrument.renderHTML(this, instrumentID);
                    if(renderedHTML)
                        this.containerElm.innerHTML = renderedHTML;
                } else {
                    throw new Error("No Renderer");
                }

            } catch (e) {
                this.containerElm.innerHTML = e;
            }
        }
    }

}

// instrumentDiv.setAttribute('data-id', instrumentID+'');
// instrumentContainer.classList.add('instrument-container');
// instrumentContainer.classList.add('control-instrument');
// instrumentContainer.setAttribute('tabindex', '0');

customElements.define('ascf-instrument', AudioSourceComposerFormInstrumentContainer);


// <span style="float: right;">
//     <form class="instrument-setting instrument-setting-remove" data-action="instrument:remove">
//     <input type="hidden" name="instrumentID" value="${instrumentID}"/>
//     <button class="remove-instrument">
//     <i class="ui-icon ui-remove"></i>
//     </button>
//     </form>
//     </span>

// customElements.define('asc-instrument-empty', EmptyInstrumentElement);
