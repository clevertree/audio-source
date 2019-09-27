
class AudioSourceComposerPanel extends HTMLElement {
    constructor(key=null, caption=null) {
        super();
        if(key) this.setAttribute('key', key);
        if(caption) this.setAttribute('caption', caption);
        this.sections = {};
    }

    get editor() { return this.getRootNode().host; }

    connectedCallback() {
        this.render();
    }

    addForm(key, caption) {
        const sectionElm = new AudioSourceComposerPanelForm(key, caption);
        this.sections[key] = sectionElm;
        this.render();
        return sectionElm;
    }


    render() {
        let captionText = this.getAttribute('caption');
        if(!captionText)
            captionText = this.getAttribute('key').replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase());
        this.innerHTML = `
            <div class="header"><span>${captionText}</span></div>
            <div class="container"></div>
        `;
        const containerElm = this.querySelector('.container');
        for(const key in this.sections) {
            if(this.sections.hasOwnProperty(key)) {
                containerElm.appendChild(this.sections[key]);
            }
        }
    }
}

customElements.define('asc-panel', AudioSourceComposerPanel);


/** Form / Input Panels **/

class AudioSourceComposerPanelForm extends HTMLElement {
    constructor(key=null, caption=null) {
        super();
        if(key) this.setAttribute('key', key);
        if(caption) this.setAttribute('caption', caption);
        this.inputs = {};
    }

    get panel() { this.closest('asc-panel'); }

    connectedCallback() {
        this.render();
    }


    addButton(key, callback, buttonInnerHTML, title=null) {
        const buttonElm = new AudioSourceComposerPanelFormButton(key, callback, buttonInnerHTML, title);
        this.inputs[key] = buttonElm;
        this.render();
        return buttonElm;
    }

    addSelect(key, callback, optionsCallback, title=null) {
        const selectElm = new AudioSourceComposerPanelFormSelect(key, callback, optionsCallback, title);
        this.inputs[key] = selectElm;
        this.render();
        return selectElm;
    }

    addRangeInput(key, callback, min=1, max=100, title=null) {
        const rangeElm = new AudioSourceComposerPanelFormRangeInput(key, callback, min, max, title);
        this.inputs[key] = rangeElm;
        this.render();
        return rangeElm;
    }

    addTextInput(key, callback, title=null, placeholder=null) {
        const rangeElm = new AudioSourceComposerPanelFormText(key, callback, title, placeholder);
        this.inputs[key] = rangeElm;
        this.render();
        return rangeElm;
    }

    addFileInput(key, callback, buttonInnerHTML, accepts=null, title=null) {
        const rangeElm = new AudioSourceComposerPanelFormFileInput(key, callback, buttonInnerHTML, accepts, title);
        this.inputs[key] = rangeElm;
        this.render();
        return rangeElm;

    }

    addInstrumentContainer(instrumentID) {
        const rangeElm = new AudioSourceComposerPanelInstrumentContainer(instrumentID);
        this.inputs[instrumentID] = rangeElm;
        this.render();
        return rangeElm;
    }

    render() {
        let captionText = this.getAttribute('caption');
        if(!captionText)
            captionText = this.getAttribute('key').replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase());
        this.innerHTML = `
            <div class="header"><span>${captionText}</span></div>
            <div class="container"></div>
        `;
        const containerElm = this.querySelector('.container');
        for(const name in this.inputs) {
            if(this.inputs.hasOwnProperty(name)) {
                containerElm.appendChild(this.inputs[name]);
            }
        }
    }
}

customElements.define('ascp-form', AudioSourceComposerPanelForm);



/** Abstract Panel Input **/
class AudioSourceComposerPanelInputAbstract extends HTMLElement {
    constructor(key, callback=null) {
        super();
        this.callback = callback || function() { throw new Error("No callback set") };

        this.setAttribute('key', key);
    }

    get inputElm() { throw new Error("Not implemented"); }
    get disabled() { return this.inputElm.disabled; }
    set disabled(value) { this.inputElm.disabled = value; }
}



class AudioSourceComposerPanelFormButton extends AudioSourceComposerPanelInputAbstract {
    constructor(key, callback=null, innerHTML=null, title=null) {
        super(key, callback);

        this.setAttribute('key', key);

        const buttonElm = document.createElement('button');
        buttonElm.classList.add('themed');
        if(title)
            buttonElm.setAttribute('title', title);
        if(innerHTML)
            buttonElm.innerHTML = innerHTML;
        this.appendChild(buttonElm);
    }

    get inputElm() { return this.querySelector('button'); }

    connectedCallback() {
        // this.render();
    }


    // render() {
    // }
}

customElements.define('ascpf-button', AudioSourceComposerPanelFormButton);





class AudioSourceComposerPanelFormSelect extends AudioSourceComposerPanelInputAbstract {
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
    }

    get inputElm() { return this.querySelector('select'); }

    connectedCallback() {
        // this.render();
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
    }

    get inputElm() { return this.querySelector('input'); }
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
    }

    get inputElm() { return this.querySelector('input'); }

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
}

customElements.define('ascpf-file', AudioSourceComposerPanelFormFileInput);


/** Instrument Panel **/


class AudioSourceComposerPanelInstrumentContainer extends HTMLElement {
    constructor(instrumentID) {
        super();
        if(instrumentID)       instrumentID.setAttribute('id', instrumentID+'');
        this.setAttribute('tabindex', '0');

    }

    connectedCallback() {
        this.render();
    }

    get panel() { this.closest('asc-panel'); }

    render() {
        const editor = this.panel.editor;
        const renderer = editor.renderer;
        const instrumentID = parseInt(this.getAttribute('id'));

        // const defaultSampleLibraryURL = new URL('/sample/', NAMESPACE) + '';

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