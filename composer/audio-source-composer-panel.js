
class AudioSourceComposerPanel extends HTMLElement {
    constructor(key=null, captionText=null) {
        super();
        if(key) this.setAttribute('key', key);

        this.innerHTML = `
            <div class="header"></div>
            <div class="container"></div>
        `;
        if(!captionText)
            captionText = this.getAttribute('key').replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase());
        this.caption = captionText
    }

    get editor() { return this.getRootNode().host; }
    get headerElm() { return this.querySelector('.header'); }
    get containerElm() { return this.querySelector('.container'); }

    get caption() { return this.headerElm.innerText; }
    set caption(value) { this.headerElm.innerText = value; }

    connectedCallback() {
    }

    getOrCreateForm(formKey, caption=null) {
        let formElm = this.getForm(formKey, false);
        if(!formElm) {
            formElm = new AudioSourceComposerPanelForm(formKey, caption);
            this.containerElm.appendChild(formElm);
        }
        if(caption !== null)
            formElm.caption = caption;
        return formElm;
    }

    getForm(formKey, throwException=true) {
        const formElm = this.containerElm.querySelector('[key="' + formKey + '"]');
        if(formElm)
            return formElm;
        if(throwException)
            throw new Error("Form key not found: " + formKey);
        return null;
    }

    hasForm(formKey) {
        return !!this.getForm(formKey, false);
    }


}

customElements.define('asc-panel', AudioSourceComposerPanel);


/** Form / Input Panels **/

class AudioSourceComposerPanelForm extends HTMLElement {
    constructor(key=null, captionText=null) {
        super();
        if(key) this.setAttribute('key', key);

        this.innerHTML = `
            <div class="header"></div>
            <div class="container"></div>
        `;
        if(!captionText && this.key)
            captionText = this.key.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase());
        this.caption = captionText
    }

    get editor() { return this.getRootNode().host; }
    get headerElm() { return this.querySelector('.header'); }
    get containerElm() { return this.querySelector('.container'); }

    get caption() { return this.headerElm.innerText; }
    set caption(value) { this.headerElm.innerText = value; }

    get panel() { return this.closest('asc-panel'); }
    get key() { return this.getAttribute('key'); }


    getInput(inputKey, throwException=true) {
        const inputElm = this.containerElm.querySelector('[key="' + inputKey + '"]');
        if(inputElm)
            return inputElm;
        if(throwException)
            throw new Error("Input key not found: " + inputKey);
        return null;
    }

    addButton(key, callback, buttonInnerHTML, title=null) {
        const buttonElm = new AudioSourceComposerPanelFormButton(key, callback, buttonInnerHTML, title);
        this.containerElm.appendChild(buttonElm);
        return buttonElm;
    }

    addSelect(key, callback, optionsCallback, title = null, defaultValue = '') {
        const selectElm = new AudioSourceComposerPanelFormSelect(key, callback, optionsCallback, title, defaultValue);
        this.containerElm.appendChild(selectElm);
        return selectElm;
    }

    addRangeInput(key, callback, min=1, max=100, title=null) {
        const rangeElm = new AudioSourceComposerPanelFormRangeInput(key, callback, min, max, title);
        this.containerElm.appendChild(rangeElm);
        return rangeElm;
    }

    addTextInput(key, callback, title=null, placeholder=null) {
        const textElm = new AudioSourceComposerPanelFormText(key, callback, title, placeholder);
        this.containerElm.appendChild(textElm);
        return textElm;
    }

    addFileInput(key, callback, buttonInnerHTML, accepts=null, title=null) {
        const fileInputElm = new AudioSourceComposerPanelFormFileInput(key, callback, buttonInnerHTML, accepts, title);
        this.containerElm.appendChild(fileInputElm);
        return fileInputElm;

    }

    addInstrumentContainer(instrumentID) {
        const instrumentContainerElm = new AudioSourceComposerPanelInstrumentContainer(instrumentID);
        this.containerElm.appendChild(instrumentContainerElm);
        return instrumentContainerElm;
    }
}

customElements.define('ascp-form', AudioSourceComposerPanelForm);



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



class AudioSourceComposerPanelFormButton extends AudioSourceComposerPanelInputAbstract {
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

customElements.define('ascpf-button', AudioSourceComposerPanelFormButton);





class AudioSourceComposerPanelFormSelect extends AudioSourceComposerPanelInputAbstract {
    constructor(key, callback=null, optionsCallback=null, title=null, defaultValue='') {
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

        this.value = defaultValue;
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

customElements.define('ascpf-select', AudioSourceComposerPanelFormSelect);




class AudioSourceComposerPanelFormRangeInput extends AudioSourceComposerPanelInputAbstract {
    constructor(key, callback=null, min=1, max=100, title=null) {
        super(key, callback);

        this.setAttribute('key', key);

        const rangeElm = document.createElement('input');
        rangeElm.classList.add('themed');

        rangeElm.setAttribute('type', 'range');
        rangeElm.setAttribute('min', min+'');
        rangeElm.setAttribute('max', max+'');
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

customElements.define('ascpf-range', AudioSourceComposerPanelFormRangeInput);



class AudioSourceComposerPanelFormText extends AudioSourceComposerPanelInputAbstract {
    constructor(key, callback=null, title=null, placeholder=null) {
        super(key, callback);

        this.setAttribute('key', key);

        const inputElm = document.createElement('input');
        inputElm.classList.add('themed');
        inputElm.setAttribute('type', 'text');
        if(title)       inputElm.setAttribute('title', title);
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

customElements.define('ascpf-text', AudioSourceComposerPanelFormText);




class AudioSourceComposerPanelFormFileInput extends AudioSourceComposerPanelInputAbstract {
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

customElements.define('ascpf-file', AudioSourceComposerPanelFormFileInput);


/** Instrument Panel **/


class AudioSourceComposerPanelInstrumentContainer extends HTMLElement {
    constructor(instrumentID) {
        super();
        if(!Number.isInteger(instrumentID))
            throw new Error("Invalid instrumentID");
        this.setAttribute('id', instrumentID+'');
        // this.setAttribute('tabindex', '0');

    }

    connectedCallback() {
        this.render();
    }

    get panel() { return this.closest('asc-panel'); }

    render() {
        const editor = this.panel.editor;
        const renderer = editor.song;
        const instrumentID = parseInt(this.getAttribute('id'));

        // const defaultSampleLibraryURL = new URL('/sample/', NAMESPACE) + '';

        // TODO: get instrument renderer
        let instrument = renderer.getInstrument(instrumentID, false);
        const instrumentPreset = renderer.getInstrumentConfig(instrumentID, false);

        this.innerHTML = ``;

        if(!instrumentPreset) {
            instrument = new EmptyInstrumentElement(instrumentID, '[Empty]');
            this.appendChild(instrument);

        } else if(!instrumentPreset.url) {
            const loadingElm = new EmptyInstrumentElement(instrumentID, `Invalid URL`);
            this.appendChild(loadingElm);

        } else if(!renderer.isInstrumentLoaded(instrumentID)) {
            const loadingElm = new EmptyInstrumentElement(instrumentID, 'Loading...');
            this.appendChild(loadingElm);

        } else {
            try {
                if (instrument instanceof HTMLElement) {
                    instrument.setAttribute('data-id', instrumentID+'');
                    this.appendChild(instrument);
                } else if (instrument.render) {
                    const renderedHTML = instrument.render(this, instrumentID);
                    if(renderedHTML)
                        this.innerHTML = renderedHTML;
                } else {
                    throw new Error("No Renderer");
                }

            } catch (e) {
                this.innerHTML = e;
            }
        }
    }
}

// instrumentDiv.setAttribute('data-id', instrumentID+'');
// instrumentContainer.classList.add('instrument-container');
// instrumentContainer.classList.add('control-instrument');
// instrumentContainer.setAttribute('tabindex', '0');

customElements.define('ascp-instrument', AudioSourceComposerPanelInstrumentContainer);


class EmptyInstrumentElement extends HTMLElement {

    constructor(instrumentID, statusText) {
        super();
        this.statusText = statusText;
        this.instrumentID = instrumentID;
    }

    get instrumentID()      { return this.getAttribute('data-id'); }
    set instrumentID(value) { return this.setAttribute('data-id', value); }


    connectedCallback() {
        // this.song = this.closest('music-song'); // Don't rely on this !!!
        // const onInput = e => this.onInput(e);
        this.addEventListener('submit', e => this.editor.onInput(e));
        this.render();
    }

    get editor() {
        const editor = this.closest('div.asc-container').parentNode.host;
        if(!editor)
            throw new Error("Editor not found");
        return editor;
    }

    render() {
        const instrumentID = this.instrumentID || 'N/A';
        const statusText = (instrumentID < 10 ? "0" : "") + (instrumentID + ":") + this.statusText;
        this.innerHTML = `
            <div class="form-section control-song">
                <form class="form-song-add-instrument submit-on-change" data-action="song:replace-instrument">
                    <input type="hidden" name="instrumentID" value="${instrumentID}"/>
                    ${statusText}
                    <br/>
                    <select name="instrumentURL" class="themed">
                        <option value="">Select Instrument</option>
                        ${this.editor.values.renderEditorFormOptions('instruments-available')}
                    </select>
                </form>
            </div>

        `;
    }
}

// <span style="float: right;">
//     <form class="instrument-setting instrument-setting-remove" data-action="instrument:remove">
//     <input type="hidden" name="instrumentID" value="${instrumentID}"/>
//     <button class="remove-instrument">
//     <i class="ui-icon ui-remove"></i>
//     </button>
//     </form>
//     </span>

customElements.define('asc-instrument-empty', EmptyInstrumentElement);
