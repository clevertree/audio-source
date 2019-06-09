class AudioSourceComposerMenu {
    constructor(editor) {
        this.editor = editor;
    }

    get renderElement() {
        const selector = 'ul.composer-menu';
        let renderElement = this.editor.querySelector(selector);
        if(!renderElement)
            throw new Error(`Element not found: ${selector}`);
        return renderElement;
    }

    onInput(e) {
        // console.info(e.type, e);
        if(e.defaultPrevented)
            return;
        if(e.target instanceof Node && !this.renderElement.contains(e.target))
            return;

        // let targetClassList = e.target.classList;
        switch(e.type) {

            case 'change':
            case 'blur':
                if(e.target.form && e.target.form.classList.contains('submit-on-' + e.type)) {
                    this.editor.forms.onSubmit(e, e.target.form);
                }
                //     this.onMenu(e);
                break;
            case 'mousedown':
                this.onMenu(e);
                this.closeMenu();
                break;
        }
    }

    onMenu(e) {
        let newCommand, newInstruction, newInstrumentID, newInstrumentURL, insertIndex;

        // let form = e.target.form || e.target;
        // const cursorCellIndex = this.editor.cursorCellIndex;
        const currentGroup = this.editor.currentGroup;
        const selectedRange = this.editor.selectedRange;
        const selectedIndicies = this.editor.selectedIndicies;

        let menuTarget = e.target;
        // if(menuTarget.nodeName.toLowerCase() !== 'a')
        //     menuTarget = menuTarget.querySelector('a');
        if(!menuTarget)
            return;
        const dataCommand = menuTarget.getAttribute('data-action') || menuTarget.parentNode.getAttribute('data-action');
        if(!dataCommand)
            return console.info("Element missing data-action: ", menuTarget);
        console.info("Menu Click: " + dataCommand, e);
        // e.preventDefault();


        switch(dataCommand) {
            case 'song:new':
                e.preventDefault();
                this.editor.loadNewSongData();
                this.editor.render();
                // document.location = 'song/new';
                break;

            case 'song:save':
                throw new Error("Todo");

            // case 'song:load-server-uuid':
            //     e.preventDefault();
            //     // let uuid = menuTarget.getAttribute('data-uuid') || null;
            //     if(!uuid) uuid = prompt("Enter UUID: ");
            //     this.editor.loadSongFromServer(uuid);
            //     this.editor.render();
            //     break;

            case 'song:load-memory-uuid':
                e.preventDefault();
                let uuid = menuTarget.getAttribute('data-uuid') || null;
                this.editor.loadSongFromMemory(uuid);
                break;

            case 'save:memory':
                e.preventDefault();
                this.editor.saveSongToMemory();
                this.editor.render();
                break;

            case 'save:file':
                e.preventDefault();
                this.editor.saveSongToFile();
                break;

            case 'load:file':
                const fileInput = e.target.querySelector('input[type=file]');
                this.editor.loadSongFromFileInput(fileInput);
                console.log(e);
                break;

            case 'group:add':
                e.preventDefault();
                let newGroupName = this.editor.renderer.generateInstructionGroupName(currentGroup);
                newGroupName = prompt("Create new instruction group?", newGroupName);
                if(newGroupName)    this.editor.renderer.addInstructionGroup(newGroupName, []);
                else                console.error("Create instruction group canceled");
                break;

            case 'group:remove':
                e.preventDefault();
                this.editor.renderer.removeInstructionGroup(currentGroup);
                break;

            case 'group:rename':
                e.preventDefault();
                let renameGroupName = prompt("Rename instruction group?", currentGroup);
                if(renameGroupName)     this.editor.renderer.renameInstructionGroup(currentGroup, renameGroupName);
                else                    console.error("Rename instruction group canceled");
                break;

            case 'instruction:new-instrument':
                e.preventDefault();
                // use menu data or prompt for value
                newInstrumentURL = menuTarget.getAttribute('data-instrumentURL');
                if(newInstrumentURL === null)
                    throw new Error("Missing instrument ID");
                newInstrumentID = this.editor.renderer.addInstrument(newInstrumentURL);
                for(let i=0; i<selectedIndicies.length; i++) {
                    this.editor.renderer.replaceInstructionInstrument(newInstrumentID);
                    this.editor.renderer.playInstructionAtIndex(currentGroup, selectedIndicies[i]);
                }
                this.editor.render();
                this.editor.selectInstructions(selectedIndicies, selectedRange);
                break;

            case 'instrument:add':
                e.preventDefault();
                newInstrumentURL = menuTarget.getAttribute('data-instrumentURL');
                if(newInstrumentURL === null)
                    throw new Error("Missing instrument ID");
                newInstrumentID = this.editor.renderer.addInstrument(newInstrumentURL);
                // newInstruction = this.editor.forms.getInstructionFormValues(true);
                // if(!newInstruction)
                //     return console.info("Insert canceled");
                // newInstruction.instrument = newInstrumentID;
                // insertIndex = this.editor.renderer.insertInstructionAtPosition(currentGroup, selectedRange[0], newInstruction);
                this.editor.render();
                // this.editor.renderer.playInstruction(newInstruction);
                // this.editor.selectInstructions(insertIndex, selectedRange);
                break;

            case 'instruction:insert':
                e.preventDefault();
                newInstruction = this.editor.forms.getInstructionFormValues(true);
                if(!newInstruction)
                    return console.info("Insert canceled");
                newCommand = menuTarget.getAttribute('data-command');
                if(!newCommand)
                    newCommand = prompt("Set Command:", newInstruction[1]);
                if(!newCommand)
                    return console.info("Insert canceled");
                newInstruction[1] = newCommand;
                insertIndex = this.editor.renderer.insertInstructionAtPosition(currentGroup, selectedRange[0], newInstruction);
                this.editor.render();
                this.editor.renderer.playInstruction(newInstruction);
                this.editor.selectInstructions(insertIndex, selectedRange);
                break;


            case 'instruction:command':
                e.preventDefault();
                // use menu data or prompt for value
                newCommand = menuTarget.getAttribute('data-command');
                if(!newCommand)
                    newCommand = prompt("Set Command:", this.editor.forms.fieldInstructionCommand.value);
                if(!newCommand)
                    return console.info("Insert canceled");
                for(let i=0; i<selectedIndicies.length; i++) {
                    this.editor.renderer.replaceInstructionCommand(currentGroup, selectedIndicies[i], newCommand);
                    this.editor.renderer.playInstructionAtIndex(currentGroup, selectedIndicies[i]);
                }
                this.editor.render();
                this.editor.selectInstructions(selectedIndicies, selectedRange);
                this.editor.forms.fieldInstructionCommand.focus();
                break;

            case 'instruction:instrument':
                e.preventDefault();
                // use menu data or prompt for value
                newInstrumentID = menuTarget.getAttribute('data-instrument');
                if(newInstrumentID === null)
                    throw new Error("Missing instrument ID");
                newInstrumentID = parseFloat(newInstrumentID);
                for(let i=0; i<selectedIndicies.length; i++) {
                    this.editor.renderer.replaceInstructionInstrument(currentGroup, selectedIndicies[i], newInstrumentID);
                    this.editor.renderer.playInstructionAtIndex(currentGroup, selectedIndicies[i]);
                }
                this.editor.render();
                this.editor.selectInstructions(selectedIndicies, selectedRange);
                this.editor.forms.fieldInstructionInstrument.focus();
                break;

            case 'instruction:duration':
                e.preventDefault();
                // use menu data or prompt for value
                let newDuration = menuTarget.getAttribute('data-duration');
                if(!newDuration)
                    newDuration = prompt("Set Duration:", this.editor.forms.fieldInstructionDuration.value);
                newDuration = parseFloat(newDuration);
                if(isNaN(newDuration) || newDuration < 0)
                    throw new Error("Invalid duration value");
                for(let i=0; i<selectedIndicies.length; i++) {
                    this.editor.renderer.replaceInstructionDuration(currentGroup, selectedIndicies[i], newDuration);
                    this.editor.renderer.playInstructionAtIndex(currentGroup, selectedIndicies[i]);
                }
                this.editor.render();
                this.editor.selectInstructions(selectedIndicies, selectedRange);
                this.editor.forms.fieldInstructionDuration.focus();
                break;

            case 'instruction:velocity':
                e.preventDefault();
                // use menu data or prompt for value
                let newVelocity = menuTarget.getAttribute('data-velocity');
                if(!newVelocity)
                    newVelocity = prompt("Set Velocity:", this.editor.forms.fieldInstructionVelocity.value);
                newVelocity = parseFloat(newVelocity);
                if(isNaN(newVelocity) || newVelocity < 0)
                    throw new Error("Invalid velocity value");
                for(let i=0; i<selectedIndicies.length; i++) {
                    this.editor.renderer.replaceInstructionVelocity(currentGroup, selectedIndicies[i], newVelocity);
                    this.editor.renderer.playInstructionAtIndex(currentGroup, selectedIndicies[i]);
                }
                this.editor.render();
                this.editor.selectInstructions(selectedIndicies, selectedRange);
                this.editor.forms.fieldInstructionVelocity.focus();
                break;


            case 'instruction:delete':
                e.preventDefault();
                for(let i=0; i<selectedIndicies.length; i++) {
                    this.editor.renderer.deleteInstructionAtIndex(currentGroup, selectedIndicies[i]);
                }
                this.editor.render();
                this.editor.selectInstructions(selectedIndicies[0], selectedRange);
                break;

            case 'menu:toggle':
                e.preventDefault();
                // this.renderElement.querySelectorAll('a.open').forEach((a) => a !== menuTarget ? a.classList.remove('open') : null);
                // menuTarget.classList.toggle('open');
                break;

            default:
                console.warn("Unknown menu command: " + dataCommand);
        }
    }



    update() {
        const selectedIndicies = this.editor.selectedIndicies;

        this.renderElement.classList.remove('show-control-note-modify');
        if(selectedIndicies.length > 0) {
            // Note is selected
            this.renderElement.classList.add('show-control-note-modify');
        }
    }

    //                                    <li><a data-action="song:load-memory-uuid" data-uuid="">Enter UUID</a></li>

    // ${this.renderEditorMenuLoadFromMemory()}
    render() {
        // const player = this.editor.player;
        // const songData = player.getSongData();
        // let tabIndex = 2;

        this.renderElement.innerHTML =
            `<li>
                <span class="key">F</span>ile
                <ul class="submenu">
                    <li>
                        <span data-action="song:new">
                            <span class="key">N</span>ew song
                        </span>
                    </li>
                    <li>
                        <span class="key">O</span>pen song &#9658;
                        <ul class="submenu">
                            <li>
                                <span>from <span class="key">M</span>emory &#9658;</span>
                                <ul class="submenu">
                                ${this.editor.values.length > 0 ? `
                                    ${this.editor.values.getValues('song-recent-list', (value, label) =>
                                    `<li data-action="song:load-memory-uuid" data-uuid="${value}"><span>${label}</span></li>`)}
                                ` : `<li class="disabled"><span>No Recent Songs</span></li>`}
                                </ul>
                            </li>
                            <li>
                                <form action="#" class="form-menu-load-file submit-on-change" data-action="load:file">
                                    <label>
                                        from <span class="key">F</span>ile
                                        <input type="file" name="file" accept=".json,.mid,.midi" style="display: none" />
                                    </label>
                                </form>
                            </li>
                            <li class="disabled" data-action="load:url"><span>from <span class="key">U</span>rl</span></li>
                        </ul>
                    </li>
                    <li>
                        <span class="key">S</span>ave song &#9658;
                        <ul class="submenu">
                            <li class="disabled" data-action="song:server-sync"><span>to <span class="key">S</span>erver</span><input type="checkbox" ${this.editor.webSocket ? `checked="checked"` : ''}></li>
                            <li data-action="save:memory"><span>to <span class="key">M</span>emory</span></li>
                            <li data-action="save:file"><span>to <span class="key">F</span>ile</span></li>    
                        </ul>
                    </li> 
                    <li>
                        <span class="key">I</span>mport song &#9658;
                        <ul class="submenu">
                            <li>
                                <form action="#" class="form-menu-load-file submit-on-change" data-action="load:file">
                                    <label>
                                        from <span class="key">M</span>idi file
                                        <input type="file" name="file" accept=".mid,.midi" style="display: none" />
                                    </label>
                                </form>
                            </li>
                        </ul>
                    </li> 
                    <li>
                        <span class="disabled"><span class="key">E</span>xport song &#9658;</span>
                        <ul class="submenu">
                            <li class="disabled" data-action="export:file"><span>to audio file</span></li>
                        </ul>
                    </li>     
                </ul>
            </li>
            <li>
                <span class="key">E</span>dit
                <ul class="submenu composer-context-menu">
                    <li class="control-note-insert">
                        <span>Insert <span class="key">N</span>ew Command &#9658;</span>
                        <ul class="submenu">
                            <li>
                                <span class="key">F</span>requency &#9658;
                                <ul class="submenu">
                                    ${this.editor.values.getValues('note-frequency-octaves', (octave, label) =>
                                        `<li>
                                            <span>Octave ${label}</span>
                                            <ul class="submenu">
                                            ${this.editor.values.getValues('note-frequencies', (noteName, label) =>
                                                `<li data-action="instruction:insert" data-command="${noteName+octave}"><span>${label}${octave}</span>`)}
                                            </ul>
                                        </li>`)}
                                        <li data-action="instruction:insert"><span>Custom Command</span></li>
                                </ul>
                            </li>
                            <li>
                                <span class="key">N</span>amed &#9658;
                                <ul class="submenu">
                                    ${this.editor.values.getValues('command-instrument-frequencies', (value, label) =>
                                        `<li data-action="instruction:insert" data-command="${value}"><span>${label}</span></li>`)}
                                        <li data-action="instruction:insert"><span>Custom Command</span></li>
                                </ul>
                            </li>
                            <li>
                                <span class="key">G</span>roup &#9658;
                                <ul class="submenu">
                                    ${this.editor.values.getValues('command-group-execute', (value, label) =>
                                        `<li data-action="instruction:insert" data-command="${value}"><span>${label}</span></li>`)}
                                        <li data-action="instruction:insert"><span>Custom Command</span></li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                    <li class="control-note-modify">
                        Set <span class="key">C</span>ommand &#9658;
                        <ul class="submenu">
                            <li>
                                <span class="key">F</span>requency &#9658;
                                <ul class="submenu">
                                    ${this.editor.values.getValues('note-frequency-octaves', (octave, label) =>
                                        `<li>
                                            <span>Octave ${label}</span>
                                            <ul class="submenu">
                                            ${this.editor.values.getValues('note-frequencies', (noteName, label) =>
                                                `<li data-action="instruction:command" data-command="${noteName+octave}"><span>${label}${octave}</span>`)}
                                            </ul>
                                        </li>`)}
                                </ul>
                            </li>
                            <li>
                                <span class="key">N</span>amed &#9658;
                                <ul class="submenu">
                                    ${this.editor.values.getValues('command-instrument-frequencies', (value, label) =>
                                        `<li data-action="instruction:command" data-command="${value}"><span>${label}</span></li>`)}
                                </ul>
                            </li>
                            <li>
                                <span><span class="key">G</span>roup &#9658;</span>
                                <ul class="submenu">
                                    ${this.editor.values.getValues('command-group-execute', (value, label) =>
                                        `<li data-action="instruction:command" data-command="${value}"><span>${label}</span></li>`)}
                                </ul>
                            </li>
                            <li data-action="instruction:command"><span>Custom Command</span></li>
                        </ul>
                    </li>
                    <li class="control-note-modify">
                        <span>Set <span class="key">I</span>nstrument &#9658;</span>
                        <ul class="submenu">
                            ${this.editor.values.getValues('song-instruments', (value, label) =>
                                `<li data-action="instruction:instrument" data-instrument="${value}"><span>${label}</span></li>`)}
                                <li>
                                    <span>Add new Instrument &#9658;</span>
                                    <ul class="submenu">
                                        ${this.editor.values.getValues('instruments-available', (value, label) =>
                                            `<li data-action="instruction:new-instrument" data-instrumentURL="${value}"><span>${label}</span></li>`)}
                                    </ul>
                                </li>
                        </ul>
                    </li>
                    <li class="control-note-modify">
                        <span>Set <span class="key">D</span>uration &#9658</span>
                        <ul class="submenu">
                            <li data-action="instruction:duration"><span>Custom Duration</span></li>
                            ${this.editor.values.getValues('durations', (value, label) =>
                                `<li data-action="instruction:duration" data-duration="${value}"><span>${label}</span></li>`)}
                        </ul>
                    </li>
                    <li class="control-note-modify">
                        <span>Set <span class="key">V</span>elocity &#9658</span>
                        <ul class="submenu">
                            <li data-action="instruction:velocity"><span>Custom Velocity</span></li>
                            ${this.editor.values.getValues('velocities', (value, label) =>
                                `<li data-action="instruction:velocity" data-velocity="${value}"><span>${label}</span></li>`)}
                        </ul>
                    </li>
                    <li data-action="instruction:panning" class="disabled control-note-modify"><span>Set <span class="key">P</span>anning</span></li>
                    <li data-action="instruction:delete" class="control-note-modify"><span><span class="key">D</span>elete Note</span></li>
                    <hr/>
                    <li>
                        <span>Edit <span class="key">R</span>ow &#9658;</span>
                        <ul class="submenu">
                            <li data-action="row:delete"><span><span class="key">D</span>elete Row</span></li>
                        </ul>
                    </li>
                    <hr/>
                    <li>
                        <span>Edit <span class="key">G</span>roup &#9658;</span>
                        <ul class="submenu">
                            <li data-action="group:add"><span><span class="key">I</span>nsert new Group</span></li>
                            <li data-action="group:delete"><span><span class="key">D</span>elete current Group</span></li>
                            <li data-action="group:rename"><span><span class="key">R</span>ename current Group</span></li>
                        </ul>
                    </li>
                </ul>
            </li>
            <li>
                <span class="key">V</span>iew
                <ul class="submenu">
                    <li data-action="view:instruments"><span>&#10003; View <span class="key">I</span>nstruments</span></li>
                </ul>
            </li>
            <li>
                <span class="key">I</span>nstruments
                <ul class="submenu">
                    <li>
                        <span>Add new Instrument &#9658;</span>
                        <ul class="submenu">
                            ${this.editor.values.getValues('instruments-available', (value, label) =>
                                `<li data-action="instrument:add" data-instrumentURL="${value}"><span>${label}</span></li>`)}
                        </ul>
                    </li>
                </ul>
            </li>`;


        this.update();
    }

    // Context Menu

    openContextMenu(e) {
        let x = e.clientX, y = e.clientY;

        this.renderElement.querySelectorAll('a.open').forEach(elm => elm.classList.remove('open'));
        // this.renderElement.querySelectorAll('.selected-context-menu').forEach(elm => elm.classList.remove('selected-context-menu'));
        const contextMenu = this.renderElement.querySelector('.composer-context-menu');

        contextMenu.classList.add('open-context-menu');
        contextMenu.classList.add('open');

        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        // console.info("Context menu", contextMenu);
    }

    closeMenu() {
        const contextMenu = this.renderElement.querySelector('.composer-context-menu');
        contextMenu.classList.remove('open-context-menu');
        contextMenu.classList.remove('open');
        contextMenu.removeAttribute('style');
        this.renderElement.querySelectorAll('.menu-item.open,.submenu.open')
            .forEach(elm => elm.classList.remove('open'));
    }

}
// customElements.define('music-song-menu', MusicEditorMenuElement);
