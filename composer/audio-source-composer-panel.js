
class AudioSourceComposerPanel extends HTMLElement {
    constructor(key=null, caption=null) {
        super();
        if(key) this.setAttribute('key', key);
        if(caption) this.setAttribute('caption', caption);
        this.sections = {};
    }

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




class AudioSourceComposerPanelForm extends HTMLElement {
    constructor(key=null, caption=null) {
        super();
        if(key) this.setAttribute('key', key);
        if(caption) this.setAttribute('caption', caption);
        this.inputs = {};
    }

    connectedCallback() {
        this.render();
    }

    // addForm(commandString, innerHTML=null) {
    //     const formElm = document.createElement('form');
    //     formElm.setAttribute('action', '#');
    //     formElm.setAttribute('data-action', commandString);
    //     formElm.classList.add('form-instruction-instrument');
    //     formElm.classList.add('submit-on-change');
    //     this.forms[commandString] = formElm;
    //     this.render();
    //     if(innerHTML !== null)
    //         formElm.innerHTML = innerHTML;
    //     return formElm;
    // }

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

    connectedCallback() {
        // this.render();
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

    connectedCallback() {
        // this.render();
    }
}

customElements.define('ascpf-text', AudioSourceComposerPanelFormText);