class AudioSourceComposerMenu extends HTMLElement {
    constructor() {
        super();
        this.action = (e) => {
            const isStuck = !this.classList.contains('stick');
            this.classList.toggle('stick', isStuck);
            if(isStuck) {
                this.classList.add('open');
                // this.renderSubMenu(e);
                // this.querySelectorAll('asc-menu')
                //     .forEach(menuItem => menuItem.classList.remove('open', 'stick'));
                let parentMenu = this;
                while (parentMenu = parentMenu.parentNode.closest('asc-menu'))
                    parentMenu.classList.add('open', 'stick');
            }
        };
        this.populate = function() { this.dispatchEvent(new CustomEvent('open')); };

        this.mouseTimeout = null;
    }


    get caption()             { return this.getAttribute('caption'); }
    set caption(caption)    {
        caption ? this.setAttribute('caption', caption) : this.removeAttribute('caption');
        this.render();
    }

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

    // get isSubMenu() { return this.closest('dropdown-container'); }
    //
    // set onopen(callback) {
    //     this.addEventListener('open', callback);
    // }

    connectedCallback() {
        // this.editor = this.getRootNode().host;

        this.addEventListener('mouseenter', this.onMouseEvent);
        this.addEventListener('mouseleave', this.onMouseEvent);
        this.addEventListener('click', this.onMouseEvent);
        this.render();
    }

    disconnectedCallback() {
        this.removeEventListener('mouseenter', this.onMouseEvent);
        this.removeEventListener('mouseleave', this.onMouseEvent);
        this.removeEventListener('click', this.onMouseEvent);
    }

    onMouseEvent(e) {
        switch(e.type) {
            case 'mouseenter':
                clearTimeout(this.mouseTimeout);
                this.classList.add('open');
                this.renderSubMenu(e);
                break;
            case 'mouseleave':
                if(!this.classList.contains('stick')) {
                    clearTimeout(this.mouseTimeout);
                    this.mouseTimeout = setTimeout(e => {
                        this.classList.remove('open');
                        this.clearSubMenu();
                    }, 200);
                }
                break;
            case 'click':
                if(!e.defaultPrevented) {
                    e.preventDefault();
                    this.closeAllMenus();
                    e.menuElement = this;
                    this.action(e);
                }
                break;
        }

        // if(target.classList.contains('open')) {
        //     target.dispatchEvent(new CustomEvent('open'));
        // } else {
        //     this.clearSubMenu();
        // }
    }

    clearSubMenu() {
        // this.querySelectorAll('asc-menu')
        //     .forEach(menuItem => menuItem.parentNode.removeChild(menuItem));
        let containerElm = this.getSubMenuContainer();
        containerElm.innerHTML = '';
    }

    renderSubMenu(e) { // TODO: messy
        // this.classList.add('open');
        // if(!this.classList.contains('open')) {
        // this.clearSubMenu();
        e.menuElement = this;
        this.populate(e);

    }

    getSubMenuContainer() {
        let containerElm = this.querySelector('.dropdown-container');
        if (!containerElm) {
            containerElm = document.createElement('div');
            containerElm.classList.add('dropdown-container');
            this.appendChild(containerElm);
        }
        return containerElm;
    }

    getOrCreateSubMenu(key, caption=null) {
        key = key.toString();

        let containerElm = this.getSubMenuContainer();

        for(let i=0; i<containerElm.childNodes.length; i++) {
            const childNode = containerElm.childNodes[i];
            if(childNode.matches('asc-menu')) {
                if(childNode.key === key) {
                    return childNode;
                }
            }
        }

        const childNode = document.createElement('asc-menu');
        childNode.key = key;
        if(caption)
            childNode.caption = caption;
        containerElm.appendChild(childNode);
        return childNode;
    }
    // }

    openContextMenu(e) {
        const oe = e.detail.originalEvent || e;
        this.clearSubMenu();
        this.renderSubMenu(e);
        // this.classList.add('stick');

        let containerElm = this.getSubMenuContainer();

        let x = oe.clientX, y = oe.clientY;
        console.info("Context menu ", containerElm, x, y);

        containerElm.classList.add('open-context-menu');
        this.classList.add('open', 'stick');

        containerElm.style.left = x + 'px';
        containerElm.style.top = y + 'px';

    }

    closeAllMenus() {
        let parentMenu = this;
        while(parentMenu.parentElement && parentMenu.parentElement.closest('asc-menu')) {
            parentMenu = parentMenu.parentElement.closest('asc-menu');
        }
        parentMenu.parentElement.querySelectorAll(`asc-menu.open,asc-menu.stick`)
            .forEach(menuElm => menuElm.classList.remove('open', 'stick'))
    }

    render() {
        const title = this.caption === null ? this.key : this.caption;
        if(title) {
            let textDiv = this.querySelector('div');
            if (!textDiv) {
                textDiv = document.createElement('div');
                textDiv.classList.add('caption');
                this.firstElementChild ? this.insertBefore(textDiv, this.firstElementChild) : this.appendChild(textDiv);
            }
            textDiv.innerHTML = title; // .replace('►', '<span class="arrow"></span>');

            // if(this.isSubMenu) {
            //     let containerElm = this.getSubMenuContainer();
            //     if(containerElm.childNodes.length > 0) {
            //         let arrowSpan = textDiv.querySelector('span');
            //         if (!arrowSpan) {
            //             arrowSpan = document.createElement('span');
            //             textDiv.appendChild(arrowSpan);
            //             arrowSpan.innerHTML = '&#9658;';
            //         }
            //     }
            // }
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
customElements.define('asc-menu', AudioSourceComposerMenu);



// class AudioSourceComposerMenuContainer extends HTMLElement {
//     constructor() {
//         super();
//     }
//
//     get disabled()             { return this.getAttribute('disabled'); }
//     set disabled(disabled)    {
//         this.setAttribute('disabled', disabled);
//         // this.render();
//     }
//
//     connectedCallback() {
//         // this.editor = this.getRootNode().host;
//         // this.render();
//     }
//
//     getOrCreateSubMenu(key, caption=null) {
//         for(let i=0; i<this.childNodes.length; i++) {
//             const childNode = this.childNodes[i];
//             if(childNode.matches('asc-menu')) {
//                 if(childNode.key === key) {
//                     return childNode;
//                 }
//             }
//         }
//
//         const childNode = document.createElement('asc-menu');
//         childNode.key = key;
//         if(caption)
//             childNode.caption = caption;
//         this.appendChild(childNode);
//         return childNode;
//     }
//
// }
// customElements.define('dropdown-container', AudioSourceComposerMenuContainer);



//
//
// class AudioSourceComposerMenu2 extends HTMLElement {
//     constructor() {
//         super();
//     }
//
//     // get gridStatus() { return this.editor.status.grid; }
//     get editorForms() { return this.editor.forms; }
//
//     connectedCallback() {
//         this.editor = this.getRootNode().host;
//         this.render();
//     }
//
//     // get renderElement() {
//     //     return this.editor.elements.menu;
//     //     // const selector = 'ul.composer-menu';
//     //     // let renderElement = this.editor.shadowDOM.querySelector(selector);
//     //     // if(!renderElement)
//     //     //     throw new Error(`Element not found: ${selector}`);
//     //     // return renderElement;
//     // }
//
//     onInput(e) {
//         // console.info(e.type, e);
//         if(e.defaultPrevented)
//             return;
//         if(e.target instanceof Node && !this.contains(e.target))
//             return;
//
//         // let targetClassList = e.target.classList;
//         switch(e.type) {
//
//             case 'change':
//             case 'blur':
//                 if(e.target.form && e.target.form.classList.contains('submit-on-' + e.type)) {
//                     this.editorForms.onSubmit(e, e.target.form);
//                 }
//                 //     this.onMenu(e);
//                 break;
//             case 'mousedown':
//                 this.onMenu(e);
//                 this.closeMenu();
//                 break;
//         }
//     }
//
//     onMenu(e) {
//         let newCommand, newInstruction, newInstrumentID, newInstrumentURL, insertIndex;
//
//         // let form = e.target.form || e.target;
//         // const cursorCellIndex = this.editor.cursorCellIndex;
//
//         const currentGroup = this.editor.tracker.groupName;
//         const selectedRange = this.editor.tracker.selectedRange;
//         const selectedIndicies = this.editor.tracker.selectedIndicies;
//
//         let menuTarget = e.target;
//         // if(menuTarget.nodeName.toLowerCase() !== 'a')
//         //     menuTarget = menuTarget.querySelector('a');
//         if(!menuTarget)
//             return;
//         const dataCommand = menuTarget.getAttribute('data-action') || menuTarget.parentNode.getAttribute('data-action');
//         if(!dataCommand)
//             return console.info("Element missing data-action: ", menuTarget);
//         console.info("Menu Click: " + dataCommand, e);
//         // e.preventDefault();
//
//
//         switch(dataCommand) {
//             case 'song:new':
//                 e.preventDefault();
//                 this.editor.loadNewSongData();
//                 this.editor.render();
//                 // document.location = 'song/new';
//                 break;
//
//             case 'song:save':
//                 throw new Error("Todo");
//
//             // case 'song:load-server-uuid':
//             //     e.preventDefault();
//             //     // let uuid = menuTarget.getAttribute('data-uuid') || null;
//             //     if(!uuid) uuid = prompt("Enter UUID: ");
//             //     this.editor.loadSongFromServer(uuid);
//             //     this.editor.render();
//             //     break;
//
//             case 'song:load-memory-uuid':
//                 e.preventDefault();
//                 let uuid = menuTarget.getAttribute('data-uuid') || null;
//                 this.editor.loadSongFromMemory(uuid);
//                 break;
//
//             case 'song:save-to-memory':
//                 e.preventDefault();
//                 this.editor.saveSongToMemory();
//                 this.editor.render();
//                 break;
//
//             case 'song:save-to-file':
//                 e.preventDefault();
//                 this.editor.saveSongToFile();
//                 break;
//
//             case 'song:load-from-file':
//                 const fileInput = e.target.querySelector('input[type=file]');
//                 this.editor.loadSongFromFileInput(fileInput);
//                 console.log(e);
//                 break;
//
//             case 'group:add':
//                 e.preventDefault();
//                 let newGroupName = this.editor.renderer.generateInstructionGroupName(currentGroup);
//                 newGroupName = prompt("Create new instruction group?", newGroupName);
//                 if(newGroupName)    this.editor.renderer.addInstructionGroup(newGroupName, []);
//                 else                console.error("Create instruction group canceled");
//                 break;
//
//             case 'group:remove':
//                 e.preventDefault();
//                 this.editor.renderer.removeInstructionGroup(currentGroup);
//                 break;
//
//             case 'group:rename':
//                 e.preventDefault();
//                 let renameGroupName = prompt("Rename instruction group?", currentGroup);
//                 if(renameGroupName)     this.editor.renderer.renameInstructionGroup(currentGroup, renameGroupName);
//                 else                    console.error("Rename instruction group canceled");
//                 break;
//
//             case 'instruction:new-instrument':
//                 e.preventDefault();
//                 // use menu data or prompt for value
//                 newInstrumentURL = menuTarget.getAttribute('data-instrumentURL');
//                 if(newInstrumentURL === null)
//                     throw new Error("Missing instrument ID");
//                 newInstrumentID = this.editor.renderer.addInstrument(newInstrumentURL);
//                 for(let i=0; i<selectedIndicies.length; i++) {
//                     this.editor.renderer.replaceInstructionInstrument(newInstrumentID);
//                     this.editor.renderer.playInstructionAtIndex(currentGroup, selectedIndicies[i]);
//                 }
//                 this.editor.render();
//                 this.editor.tracker.selectIndicies(e, selectedIndicies, selectedRange);
//                 break;
//
//             case 'instrument:add':
//                 e.preventDefault();
//                 newInstrumentURL = menuTarget.getAttribute('data-instrumentURL');
//                 if(newInstrumentURL === null)
//                     throw new Error("Missing instrument ID");
//                 newInstrumentID = this.editor.renderer.addInstrument(newInstrumentURL);
//                 // newInstruction = this.editorForms.getInstructionFormValues(true);
//                 // if(!newInstruction)
//                 //     return console.info("Insert canceled");
//                 // newInstruction.instrument = newInstrumentID;
//                 // insertIndex = this.editor.renderer.insertInstructionAtPosition(currentGroup, selectedRange[0], newInstruction);
//                 this.editor.render();
//                 // this.editor.renderer.playInstruction(newInstruction);
//                 // this.editor.tracker.selectIndicies(e, insertIndex, selectedRange);
//                 break;
//
//             case 'instruction:insert':
//                 e.preventDefault();
//                 newInstruction = this.editorForms.getInstructionFormValues(true);
//                 if(!newInstruction)
//                     return console.info("Insert canceled");
//                 newCommand = menuTarget.getAttribute('data-command');
//                 if(!newCommand)
//                     newCommand = prompt("Set Command:", newInstruction[1]);
//                 if(!newCommand)
//                     return console.info("Insert canceled");
//                 newInstruction[1] = newCommand;
//                 insertIndex = this.editor.renderer.insertInstructionAtPosition(currentGroup, selectedRange[0], newInstruction);
//                 this.editor.render();
//                 this.editor.renderer.playInstruction(newInstruction);
//                 this.editor.tracker.selectIndicies(e, insertIndex, selectedRange);
//                 break;
//
//
//             case 'instruction:command':
//                 e.preventDefault();
//                 // use menu data or prompt for value
//                 newCommand = menuTarget.getAttribute('data-command');
//                 if(!newCommand)
//                     newCommand = prompt("Set Command:", this.editorForms.fieldInstructionCommand.value);
//                 if(!newCommand)
//                     return console.info("Insert canceled");
//                 for(let i=0; i<selectedIndicies.length; i++) {
//                     this.editor.renderer.replaceInstructionCommand(currentGroup, selectedIndicies[i], newCommand);
//                     this.editor.renderer.playInstructionAtIndex(currentGroup, selectedIndicies[i]);
//                 }
//                 this.editor.render();
//                 this.editor.tracker.selectIndicies(e, selectedIndicies, selectedRange);
//                 this.editorForms.fieldInstructionCommand.focus();
//                 break;
//
//             case 'instruction:instrument':
//                 e.preventDefault();
//                 // use menu data or prompt for value
//                 newInstrumentID = menuTarget.getAttribute('data-instrument');
//                 if(newInstrumentID === null)
//                     throw new Error("Missing instrument ID");
//                 newInstrumentID = parseFloat(newInstrumentID);
//                 for(let i=0; i<selectedIndicies.length; i++) {
//                     this.editor.renderer.replaceInstructionInstrument(currentGroup, selectedIndicies[i], newInstrumentID);
//                     this.editor.renderer.playInstructionAtIndex(currentGroup, selectedIndicies[i]);
//                 }
//                 this.editor.render();
//                 this.editor.tracker.selectIndicies(e, selectedIndicies, selectedRange);
//                 this.editorForms.fieldInstructionInstrument.focus();
//                 break;
//
//             case 'instruction:duration':
//                 e.preventDefault();
//                 // use menu data or prompt for value
//                 let newDuration = menuTarget.getAttribute('data-duration');
//                 if(!newDuration)
//                     newDuration = prompt("Set Duration:", this.editorForms.fieldInstructionDuration.value);
//                 newDuration = parseFloat(newDuration);
//                 if(isNaN(newDuration) || newDuration < 0)
//                     throw new Error("Invalid duration value");
//                 for(let i=0; i<selectedIndicies.length; i++) {
//                     this.editor.renderer.replaceInstructionDuration(currentGroup, selectedIndicies[i], newDuration);
//                     this.editor.renderer.playInstructionAtIndex(currentGroup, selectedIndicies[i]);
//                 }
//                 this.editor.render();
//                 this.editor.tracker.selectIndicies(e, selectedIndicies, selectedRange);
//                 this.editorForms.fieldInstructionDuration.focus();
//                 break;
//
//             case 'instruction:velocity':
//                 e.preventDefault();
//                 // use menu data or prompt for value
//                 let newVelocity = menuTarget.getAttribute('data-velocity');
//                 if(!newVelocity)
//                     newVelocity = prompt("Set Velocity:", this.editorForms.fieldInstructionVelocity.value);
//                 newVelocity = parseFloat(newVelocity);
//                 if(isNaN(newVelocity) || newVelocity < 0)
//                     throw new Error("Invalid velocity value");
//                 for(let i=0; i<selectedIndicies.length; i++) {
//                     this.editor.renderer.replaceInstructionVelocity(currentGroup, selectedIndicies[i], newVelocity);
//                     this.editor.renderer.playInstructionAtIndex(currentGroup, selectedIndicies[i]);
//                 }
//                 this.editor.render();
//                 this.editor.tracker.selectIndicies(e, selectedIndicies, selectedRange);
//                 this.editorForms.fieldInstructionVelocity.focus();
//                 break;
//
//
//             case 'instruction:delete':
//                 e.preventDefault();
//                 for(let i=0; i<selectedIndicies.length; i++) {
//                     this.editor.renderer.deleteInstructionAtIndex(currentGroup, selectedIndicies[i]);
//                 }
//                 this.editor.render();
//                 this.editor.tracker.selectIndicies(e, selectedIndicies[0], selectedRange);
//                 break;
//
//             case 'menu:toggle':
//                 e.preventDefault();
//                 // this.querySelectorAll('a.open').forEach((a) => a !== menuTarget ? a.classList.remove('open') : null);
//                 // menuTarget.classList.toggle('open');
//                 break;
//
//             default:
//                 console.warn("Unknown menu command: " + dataCommand);
//         }
//     }
//
//
//
//     update() {
//         const grid = this.editor.tracker;
//         if(grid && grid.groupName) {
//             const selectedIndicies = grid.selectedIndicies;
//             this.classList.remove('show-control-tracker-modify');
//             if(selectedIndicies.length > 0) {
//                 // Note is selected
//                 this.classList.add('show-control-tracker-modify');
//             }
//         }
//     }
//
//     //                                    <li><a data-action="song:load-memory-uuid" data-uuid="">Enter UUID</a></li>
//
//     // ${this.renderEditorMenuLoadFromMemory()}
//     render() {
//         // const player = this.editor.player;
//         // const songData = player.getSongData();
//         // let tabIndex = 2;
//
//         this.innerHTML =
//             `<ul class="menu">
//                 <li>
//                     <span class="key">F</span>ile
//                     <ul class="submenu">
//                         <li>
//                             <span data-action="song:new">
//                                 <span class="key">N</span>ew song
//                             </span>
//                         </li>
//                         <li>
//                             <span class="key">O</span>pen song &#9658;
//                             <ul class="submenu">
//                                 <li>
//                                     <span>from <span class="key">M</span>emory &#9658;</span>
//                                     <ul class="submenu">
//                                     ${this.editor.values.length > 0 ? `
//                                         ${this.editor.values.getValues('song-recent-list', (value, label) =>
//                 `<li data-action="song:load-memory-uuid" data-uuid="${value}"><span>${label}</span></li>`)}
//                                     ` : `<li class="disabled"><span>No Recent Songs</span></li>`}
//                                     </ul>
//                                 </li>
//                                 <li>
//                                     <form action="#" class="form-menu-load-file submit-on-change" data-action="song:load-from-file">
//                                         <label>
//                                             from <span class="key">F</span>ile
//                                             <input type="file" name="file" accept=".json,.mid,.midi" style="display: none" />
//                                         </label>
//                                     </form>
//                                 </li>
//                                 <li class="disabled" data-action="load:url"><span>from <span class="key">U</span>rl</span></li>
//                             </ul>
//                         </li>
//                         <li>
//                             <span class="key">S</span>ave song &#9658;
//                             <ul class="submenu">
//                                 <li class="disabled" data-action="song:server-sync"><span>to <span class="key">S</span>erver</span><input type="checkbox" ${this.editor.webSocket ? `checked="checked"` : ''}></li>
//                                 <li data-action="song:save-to-memory"><span>to <span class="key">M</span>emory</span></li>
//                                 <li data-action="song:save-to-file"><span>to <span class="key">F</span>ile</span></li>
//                             </ul>
//                         </li>
//                         <li>
//                             <span class="key">I</span>mport song &#9658;
//                             <ul class="submenu">
//                                 <li>
//                                     <form action="#" class="form-menu-load-file submit-on-change" data-action="song:load-from-file">
//                                         <label>
//                                             from <span class="key">M</span>idi file
//                                             <input type="file" name="file" accept=".mid,.midi" style="display: none" />
//                                         </label>
//                                     </form>
//                                 </li>
//                             </ul>
//                         </li>
//                         <li>
//                             <span class="disabled"><span class="key">E</span>xport song &#9658;</span>
//                             <ul class="submenu">
//                                 <li class="disabled" data-action="export:file"><span>to audio file</span></li>
//                             </ul>
//                         </li>
//                     </ul>
//                 </li>
//                 <li>
//                     <span class="key">E</span>dit
//                     <ul class="submenu composer-context-menu">
//                         <li class="control-tracker-insert">
//                             <span>Insert <span class="key">N</span>ew Command &#9658;</span>
//                             <ul class="submenu">
//                                 <li>
//                                     <span class="key">F</span>requency &#9658;
//                                     <ul class="submenu">
//                                         ${this.editor.values.getValues('note-frequency-octaves', (octave, label) =>
//                 `<li>
//                                                 <span>Octave ${label}</span>
//                                                 <ul class="submenu">
//                                                 ${this.editor.values.getValues('note-frequencies', (noteName, label) =>
//                     `<li data-action="instruction:insert" data-command="${noteName+octave}"><span>${label}${octave}</span>`)}
//                                                 </ul>
//                                             </li>`)}
//                                             <li data-action="instruction:insert"><span>Custom Command</span></li>
//                                     </ul>
//                                 </li>
//                                 <li>
//                                     <span class="key">N</span>amed &#9658;
//                                     <ul class="submenu">
//                                         ${this.editor.values.getValues('command-instrument-frequencies', (value, label) =>
//                 `<li data-action="instruction:insert" data-command="${value}"><span>${label}</span></li>`)}
//                                             <li data-action="instruction:insert"><span>Custom Command</span></li>
//                                     </ul>
//                                 </li>
//                                 <li>
//                                     <span class="key">G</span>roup &#9658;
//                                     <ul class="submenu">
//                                         ${this.editor.values.getValues('command-group-execute', (value, label) =>
//                 `<li data-action="instruction:insert" data-command="${value}"><span>${label}</span></li>`)}
//                                             <li data-action="instruction:insert"><span>Custom Command</span></li>
//                                     </ul>
//                                 </li>
//                             </ul>
//                         </li>
//                         <li class="control-tracker-modify">
//                             Set <span class="key">C</span>ommand &#9658;
//                             <ul class="submenu">
//                                 <li>
//                                     <span class="key">F</span>requency &#9658;
//                                     <ul class="submenu">
//                                         ${this.editor.values.getValues('note-frequency-octaves', (octave, label) =>
//                 `<li>
//                                                 <span>Octave ${label}</span>
//                                                 <ul class="submenu">
//                                                 ${this.editor.values.getValues('note-frequencies', (noteName, label) =>
//                     `<li data-action="instruction:command" data-command="${noteName+octave}"><span>${label}${octave}</span>`)}
//                                                 </ul>
//                                             </li>`)}
//                                     </ul>
//                                 </li>
//                                 <li>
//                                     <span class="key">N</span>amed &#9658;
//                                     <ul class="submenu">
//                                         ${this.editor.values.getValues('command-instrument-frequencies', (value, label) =>
//                 `<li data-action="instruction:command" data-command="${value}"><span>${label}</span></li>`)}
//                                     </ul>
//                                 </li>
//                                 <li>
//                                     <span><span class="key">G</span>roup &#9658;</span>
//                                     <ul class="submenu">
//                                         ${this.editor.values.getValues('command-group-execute', (value, label) =>
//                 `<li data-action="instruction:command" data-command="${value}"><span>${label}</span></li>`)}
//                                     </ul>
//                                 </li>
//                                 <li data-action="instruction:command"><span>Custom Command</span></li>
//                             </ul>
//                         </li>
//                         <li class="control-tracker-modify">
//                             <span>Set <span class="key">I</span>nstrument &#9658;</span>
//                             <ul class="submenu">
//                                 ${this.editor.values.getValues('song-instruments', (value, label) =>
//                 `<li data-action="instruction:instrument" data-instrument="${value}"><span>${label}</span></li>`)}
//                                     <li>
//                                         <span>Add new Instrument &#9658;</span>
//                                         <ul class="submenu">
//                                             ${this.editor.values.getValues('instruments-available', (value, label) =>
//                 `<li data-action="instruction:new-instrument" data-instrumentURL="${value}"><span>${label}</span></li>`)}
//                                         </ul>
//                                     </li>
//                             </ul>
//                         </li>
//                         <li class="control-tracker-modify">
//                             <span>Set <span class="key">D</span>uration &#9658</span>
//                             <ul class="submenu">
//                                 <li data-action="instruction:duration"><span>Custom Duration</span></li>
//                                 ${this.editor.values.getValues('durations', (value, label) =>
//                 `<li data-action="instruction:duration" data-duration="${value}"><span>${label}</span></li>`)}
//                             </ul>
//                         </li>
//                         <li class="control-tracker-modify">
//                             <span>Set <span class="key">V</span>elocity &#9658</span>
//                             <ul class="submenu">
//                                 <li data-action="instruction:velocity"><span>Custom Velocity</span></li>
//                                 ${this.editor.values.getValues('velocities', (value, label) =>
//                 `<li data-action="instruction:velocity" data-velocity="${value}"><span>${label}</span></li>`)}
//                             </ul>
//                         </li>
//                         <li data-action="instruction:panning" class="disabled control-tracker-modify"><span>Set <span class="key">P</span>anning</span></li>
//                         <li data-action="instruction:delete" class="control-tracker-modify"><span><span class="key">D</span>elete Note</span></li>
//                         <hr/>
//                         <li>
//                             <span>Edit <span class="key">R</span>ow &#9658;</span>
//                             <ul class="submenu">
//                                 <li data-action="row:delete"><span><span class="key">D</span>elete Row</span></li>
//                             </ul>
//                         </li>
//                         <hr/>
//                         <li>
//                             <span>Edit <span class="key">G</span>roup &#9658;</span>
//                             <ul class="submenu">
//                                 <li data-action="group:add"><span><span class="key">I</span>nsert new Group</span></li>
//                                 <li data-action="group:delete"><span><span class="key">D</span>elete current Group</span></li>
//                                 <li data-action="group:rename"><span><span class="key">R</span>ename current Group</span></li>
//                             </ul>
//                         </li>
//                     </ul>
//                 </li>
//                 <li>
//                     <span class="key">V</span>iew
//                     <ul class="submenu">
//                         <li data-action="view:instruments"><span>&#10003; View <span class="key">I</span>nstruments</span></li>
//                     </ul>
//                 </li>
//                 <li>
//                     <span class="key">I</span>nstruments
//                     <ul class="submenu">
//                         <li>
//                             <span>Add new Instrument &#9658;</span>
//                             <ul class="submenu">
//                                 ${this.editor.values.getValues('instruments-available', (value, label) =>
//                 `<li data-action="instrument:add" data-instrumentURL="${value}"><span>${label}</span></li>`)}
//                             </ul>
//                         </li>
//                     </ul>
//                 </li>
//             </ul>
// `;
//
//
//         this.update();
//     }
//
//     // Context Menu
//
//     openContextMenu(e) {
//         let x = e.clientX, y = e.clientY;
//
//         this.querySelectorAll('a.open').forEach(elm => elm.classList.remove('open'));
//         // this.querySelectorAll('.selected-context-menu').forEach(elm => elm.classList.remove('selected-context-menu'));
//         const contextMenu = this.querySelector('.composer-context-menu');
//
//         contextMenu.classList.add('open-context-menu');
//         contextMenu.classList.add('open');
//
//         contextMenu.style.left = x + 'px';
//         contextMenu.style.top = y + 'px';
//         // console.info("Context menu", contextMenu);
//     }
//
//     closeMenu() {
//         const contextMenu = this.querySelector('.composer-context-menu');
//         contextMenu.classList.remove('open-context-menu');
//         contextMenu.classList.remove('open');
//         contextMenu.removeAttribute('style');
//         this.querySelectorAll('.menu-item.open,.submenu.open')
//             .forEach(elm => elm.classList.remove('open'));
//     }
//
// }
// // customElements.define('music-song-menu', MusicEditorMenuElement);
// customElements.define('asc-menu2', AudioSourceComposerMenu2);
