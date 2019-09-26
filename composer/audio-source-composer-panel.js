
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


    addButton(name, callback, buttonInnerHTML, title=null) {
        const buttonElm = new AudioSourceComposerPanelFormSelect(callback, buttonInnerHTML, name, title);
        this.inputs[name] = buttonElm;
        this.render();
        return buttonElm;
    }

    addSelect(name, callback, optionsCallback, title=null) {
        const selectElm = new AudioSourceComposerPanelFormSelect(callback, optionsCallback, name, title);
        this.inputs[name] = selectElm;
        this.render();
        return selectElm;
    }

    addRangeInput(name, callback, min=1, max=100, title=null) {
        const rangeElm = new AudioSourceComposerPanelFormRangeInput(callback, min, max, name, title);
        this.inputs[name] = rangeElm;
        this.render();
        return rangeElm;
    }

    addTextInput(name, callback, title=null, placeholder=null) {
        const rangeElm = new AudioSourceComposerPanelFormText(callback, name, title, placeholder);
        this.inputs[name] = rangeElm;
        this.render();
        return rangeElm;
    }

    addFileInput(name, callback, buttonInnerHTML, accepts=null, title=null) {
        const rangeElm = new AudioSourceComposerPanelFormFileInput(name, callback, buttonInnerHTML, accepts, title);
        this.inputs[name] = rangeElm;
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




class AudioSourceComposerPanelFormButton extends HTMLElement {
    constructor(callback=null, innerHTML=null, name=null, title=null) {
        super();
        this.callback = callback || function() { throw new Error("No callback set") };

        const buttonElm = document.createElement('button');
        if(name)
            buttonElm.setAttribute('name', name);
        if(title)
            buttonElm.setAttribute('title', title);
        if(innerHTML)
            buttonElm.innerHTML = innerHTML;
        this.appendChild(buttonElm);
    }

    connectedCallback() {
        // this.render();
    }


    // render() {
    // }
}

customElements.define('ascpf-button', AudioSourceComposerPanelFormButton);





class AudioSourceComposerPanelFormSelect extends HTMLElement {
    constructor(callback=null, optionsCallback=null, name=null, title=null) {
        super();
        this.callback = callback || function() { throw new Error("No callback set") };
        this.optionsCallback = optionsCallback || function() { throw new Error("No options callback set") };

        const selectElm = document.createElement('select');
        if(name)
            selectElm.setAttribute('name', name);
        if(title)
            selectElm.setAttribute('title', title);
        // if(optionsCallback)
        //     selectElm.innerHTML = optionsCallback;
        this.appendChild(selectElm);
    }

    connectedCallback() {
        // this.render();
    }
}

customElements.define('ascpf-select', AudioSourceComposerPanelFormSelect);




class AudioSourceComposerPanelFormRangeInput extends HTMLElement {
    constructor(callback=null, min=1, max=100, name=null, title=null) {
        super();
        this.callback = callback || function() { throw new Error("No callback set") };
        this.optionsCallback = optionsCallback || function() { throw new Error("No options callback set") };

        const rangeElm = document.createElement('input');
        rangeElm.setAttribute('type', 'range');
        rangeElm.setAttribute('min', min+'');
        rangeElm.setAttribute('max', max+'');
        if(name)        rangeElm.setAttribute('name', name);
        if(title)       rangeElm.setAttribute('title', title);
        this.appendChild(rangeElm);
    }
}

customElements.define('ascpf-range', AudioSourceComposerPanelFormRangeInput);



class AudioSourceComposerPanelFormText extends HTMLElement {
    constructor(callback=null, name=null, title=null, placeholder=null) {
        super();
        this.callback = callback || function() { throw new Error("No callback set") };

        const inputElm = document.createElement('input');
        inputElm.setAttribute('type', 'text');
        if(name)        inputElm.setAttribute('name', name);
        if(title)       inputElm.setAttribute('title', title);
        if(placeholder) inputElm.setAttribute('placeholder', placeholder);
        this.appendChild(inputElm);
    }

}

customElements.define('ascpf-text', AudioSourceComposerPanelFormText);




class AudioSourceComposerPanelFormFileInput extends HTMLElement {
    constructor(name, callback, innerHTML, accepts=null, title=null) {
        super();
        this.callback = callback || function() { throw new Error("No callback set") };

        const labelElm = document.createElement('label');
        this.appendChild(labelElm);

        const divElm = document.createElement('label');
        divElm.innerHTML = innerHTML;

        const inputElm = document.createElement('input');
        inputElm.setAttribute('type', 'file');
        if(name)        inputElm.setAttribute('name', name);
        if(accepts)     inputElm.setAttribute('accepts', accepts);
        if(title)       inputElm.setAttribute('title', title);
        labelElm.appendChild(inputElm);
    }

}

customElements.define('ascpf-text', AudioSourceComposerPanelFormFileInput);


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