
/**
 * Editor requires a modern browser
 * One groups displays at a time. Columns imply simultaneous instructions.
 */

class AudioSourceComposerElement extends HTMLElement {
    constructor() {
        super();

        this.saveSongToMemoryTimer = null;
        this.instrumentLibrary = null;

        this.longPressTimeout = null;

        this.values = new AudioSourceComposerValues(this);
        this.webSocket = new AudioSourceComposerWebsocket(this);
        this.keyboard = new AudioSourceComposerKeyboard(this);
        // this.menu = new AudioSourceComposerMenu(this);
        // this.forms = new AudioSourceComposerForms(this);
        // this.tracker = new AudioSourceComposerGrid(this);
        // this.modifier = new SongModifier(this);

        // this.instruments = new AudioSourceComposerInstruments(this);
        // this.instruments.loadInstrumentLibrary(this.getScriptDirectory('instrument/instrument.library.json'));

        this.renderer = new AudioSourceRenderer(this);
        // this.player = null;
        this.status = {
            // grid: {
            //     // renderDuration: this.renderer.getSongTimeDivision(),
            //     // groupName: 'root',
            //     // selectedIndicies: [0],
            //     // selectedRange: [0,0],
            // },
            groupHistory: [],
            // cursorPosition: 0,

            currentOctave: 3,
            currentInstrumentID: 0,
            currentRenderDuration: null,
            previewInstructionsOnSelect: false,
            longPressTimeout: 500,
            autoSaveTimeout: 4000,
        };
    }
    get tracker() { return this.shadowDOM.querySelector('asc-tracker'); }
    get menu() { return this.shadowDOM.querySelector('asc-menu-dropdown'); }
    get forms() { return this.shadowDOM.querySelector('asc-forms'); }
    get instruments() { return this.shadowDOM.querySelector('asc-instruments'); }
    get container() { return this.shadowDOM.querySelector('.asc-container'); }


    connectedCallback() {
        // this.loadCSS();
        this.shadowDOM = this.attachShadow({mode: 'open'});

        const onInput = e => this.onInput(e);
        this.shadowDOM.addEventListener('submit', onInput);
        this.shadowDOM.addEventListener('change', onInput);
        this.shadowDOM.addEventListener('blur', onInput);
        this.shadowDOM.addEventListener('keydown', onInput);
        // this.addEventListener('keyup', onInput.bind(this));
        // this.addEventListener('click', onInput.bind(this));
        this.shadowDOM.addEventListener('contextmenu', onInput);
        this.shadowDOM.addEventListener('mousedown', onInput);
        this.shadowDOM.addEventListener('mouseup', onInput);
        this.shadowDOM.addEventListener('click', onInput);
        this.shadowDOM.addEventListener('longpress', onInput);

        const onSongEvent = e => this.onSongEvent(e);
        this.addEventListener('song:loaded', onSongEvent);
        this.addEventListener('song:start', onSongEvent);
        this.addEventListener('song:end', onSongEvent);
        this.addEventListener('song:pause', onSongEvent);
        this.addEventListener('song:modified', onSongEvent);
        // this.addEventListener('note:start', onSongEvent);
        // this.addEventListener('note:end', onSongEvent);
        this.addEventListener('note:play', onSongEvent);
        this.addEventListener('instrument:loaded', onSongEvent);
        this.addEventListener('instrument:instance', onSongEvent);
        this.addEventListener('instrument:library', onSongEvent);

        this.render();
        this.focus();

        // const uuid = this.getAttribute('uuid');
        // if(uuid)
        //     this.renderer.loadSongFromServer(uuid);

        const src = this.getAttribute('src');
        if(src)
            this.loadSongFromSrc(src);
        else
            this.loadRecentSongData();

        // this.setAttribute('tabindex', 0);
        // this.initWebSocket(uuid);

        // TODO: wait for user input
        if(navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(
                (MIDI) => {
                    console.log("MIDI initialized", MIDI);
                    const inputDevices = [];
                    MIDI.inputs.forEach(
                        (inputDevice) => {
                            inputDevices.push(inputDevice);
                            inputDevice.addEventListener('midimessage', e => this.onInput(e));
                        }
                    );
                    console.log("MIDI input devices detected: " + inputDevices.map(d => d.name).join(', '));
                },
                (err) => {
                    this.onError("error initializing MIDI: " + err);
                }
            );
        }

    }

    get currentGroup()      { return this.status.currentGroup; }
    get selectedIndicies()  { return this.status.selectedIndicies; }
    get selectedRange()     { return this.status.selectedRange; }

    // get selectedPauseIndicies()  {
    //     const instructionList = this.renderer.getInstructions(this.currentGroup);
    //     return this.selectedIndicies.filter(index => instructionList[index] && instructionList[index].command === '!pause')
    // }
    // get selectedIndicies()  {
    //     const instructionList = this.renderer.getInstructions(this.currentGroup);
    //     return this.selectedIndicies.filter(index => instructionList[index] && instructionList[index].command !== '!pause')
    // }

    getAudioContext()   { return this.renderer.getAudioContext(); }
    getSongData()       { return this.renderer.getSongData(); }




    loadNewSongData() {
        const storage = new AudioSourceStorage();
        let songData = storage.generateDefaultSong();
        this.renderer.loadSongData(songData);
    }


    async loadRecentSongData() {
        const storage = new AudioSourceStorage();
        let songRecentGUIDs = storage.getRecentSongList();
        if(songRecentGUIDs[0] && songRecentGUIDs[0].guid) {
            await this.loadSongFromMemory(songRecentGUIDs[0].guid);
        }
    }

    async saveSongToMemory() {
        const songData = this.renderer.getSongData();
        const songHistory = this.renderer.getSongHistory();
        const storage = new AudioSourceStorage();
        await storage.saveSongToMemory(songData, songHistory);
    }

    saveSongToFile() {
        const songData = this.renderer.getSongData();
        // const songHistory = this.renderer.getSongHistory();
        const storage = new AudioSourceStorage();
        storage.saveSongToFile(songData);
    }


    loadSongFromMemory(songGUID) {
        const storage = new AudioSourceStorage();
        const songData = storage.loadSongFromMemory(songGUID);
        const songHistory = storage.loadSongHistoryFromMemory(songGUID);
        this.renderer.loadSongData(songData, songHistory);
        this.render();
        console.info("Song loaded from memory: " + songGUID, songData);
    }

    async loadSongFromFileInput(inputFile) {
        this.loadSongFromMIDIFileInput(inputFile);
    }

    async loadSongFromMIDIFileInput(inputFile) {
        const storage = new AudioSourceStorage();
        const midiData = await storage.loadMIDIFile(inputFile);
        this.renderer.loadSongFromMIDIData(midiData);
        this.render();
        console.info("Song loaded from midi: " + inputFile, midiData, this.renderer.songData);
    }

    async loadSongFromSrc(src) {
        const songData = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', src + '', true);
            xhr.responseType = 'json';
            xhr.onload = () => {
                if(xhr.status !== 200)
                    return reject("Song file not found: " + url);
                resolve(xhr.response);
            };
            xhr.send();
        });
        this.renderer.loadSongData(songData);
        console.info("Song loaded from src: " + src, this.renderer.songData);
        this.render();
    }
    // Input

    // profileInput(e) {
    //     e = e || {};
    //     return {
    //         gridClearSelected: !e.ctrlKey && !e.shiftKey,
    //         gridToggleAction: e.key === ' ' || (!e.shiftKey && !e.ctrlKey) ? 'toggle' : (e.ctrlKey && e.type !== 'mousedown' ? null : 'add'),
    //         gridCompleteSelection: e.shiftKey
    //     };
    // }

    onInput(e) {
        if(e.defaultPrevented)
            return;

        // try {
            this.renderer.getAudioContext();
            // if(this !== document.activeElement && !this.contains(document.activeElement)) {
            //     console.log("Focus", document.activeElement);
            //     this.focus();
            // }
            switch(e.type) {
                case 'mousedown':
                    // Longpress
                    if(!e.altKey) { // TODO: fix scroll
                        clearTimeout(this.longPressTimeout);
                        this.longPressTimeout = setTimeout(function () {
                            e.target.dispatchEvent(new CustomEvent('longpress', {
                                detail: {originalEvent: e},
                                cancelable: true,
                                bubbles: true
                            }));
                        }, this.status.longPressTimeout);
                    }
                    break;

                case 'mouseup':
                    // e.preventDefault();
                    clearTimeout(this.longPressTimeout);
                    break;

                case 'submit':
                    e.preventDefault();
                    this.onSubmit(e);
                    break;
                case 'change':
                case 'blur':
                    if(e.target.form && e.target.form.classList.contains('submit-on-' + e.type))
                        this.onSubmit(e);
                    break;
            }

            // console.info(e.type, e);

            // if(this.menu.contains(e.target))
            //     this.menu.onInput(e);
            if(this.tracker.contains(e.target))
                this.tracker.onInput(e);
            // if(this.forms.contains(e.target))
            //     this.forms.onInput(e);
    //         this.instruments.onInput(e);

            // if(!e.defaultPrevented) {
            //     switch (e.type) {
            //         case 'submit':
            //             // case 'change':
            //             // case 'blur':
            //             console.info("Unhandled " + e.type, e);
            //     }
            // }

        switch(e.type) {
            case 'mousedown':
                if(!e.defaultPrevented)
                    this.closeMenu();
                break;
        }

        // } catch (err) {
        //     this.onError(err);
        // }

    }

    onSongEvent(e) {
        // console.log("Note Event: ", e.type);
        this.tracker.onSongEvent(e);
        switch(e.type) {
            case 'song:loaded':
                this.tracker.renderDuration = this.renderer.getSongTimeDivision();
                break;
            case 'song:start':
                this.classList.add('playing');
                break;
            case 'song:end':
            case 'song:pause':
                this.classList.remove('playing');
                break;
            case 'song:modified':
                // this.tracker.render();
                // this.forms.render();

                clearTimeout(this.saveSongToMemoryTimer);
                this.saveSongToMemoryTimer = setTimeout(e => this.saveSongToMemory(e), this.status.autoSaveTimeout);
                break;
            case 'instrument:loaded':
                console.info("TODO: load instrument instances", e.detail);
                break;
            case 'instrument:library':
            case 'instrument:instance':
                // TODO: this.instruments.render();
                this.renderForms();
                break;
        }
    }

    onSubmit(e, form) {
        if (!form)
            form = e.target.form || e.target;
        if (!form.matches('form'))
            throw new Error("Invalid Form: " + form);
        const actionName = form.getAttribute('data-action');

        this.onAction(e, actionName);
    }

    onAction(e, actionName) {
        console.info("Action: " + actionName, e.target);
        // e.preventDefault();

        this.tracker.onAction(e, actionName);

        switch(actionName) {
            case 'song:new':
                e.preventDefault();
                this.loadNewSongData();
                this.render();
                // document.location = 'song/new';
                break;

            // case 'song:load-server-uuid':
            //     e.preventDefault();
            //     // let uuid = menuTarget.getAttribute('data-uuid') || null;
            //     if(!uuid) uuid = prompt("Enter UUID: ");
            //     this.loadSongFromServer(uuid);
            //     this.render();
            //     break;

            case 'song:load-memory-uuid':
                e.preventDefault();
                let uuid = menuTarget.getAttribute('data-uuid') || null;
                this.loadSongFromMemory(uuid);
                break;

            case 'song:save-to-memory':
                e.preventDefault();
                this.saveSongToMemory();
                this.render();
                break;

            case 'song:save-to-file':
                e.preventDefault();
                this.saveSongToFile();
                break;

            case 'song:load-from-file':
                const fileInput = e.target.querySelector('input[type=file]');
                this.loadSongFromFileInput(fileInput);
                console.log(e);
                break;

            case 'instrument:add':
                this.status.currentInstrumentID = this.renderer.addInstrument(form.elements['instrumentURL'].value);
                // this.update();
                break;


            case 'song:load-from-file':
                this.loadSongFromFileInput(form['file']);
                break;

            case 'song:edit':
                this.renderer.replaceDataPath('beatsPerMinute', form['beats-per-minute'].value);
                this.renderer.replaceDataPath('beatsPerMeasure', form['beats-per-measure'].value);
                break;

            case 'song:play':
                if(this.renderer.isPlaybackActive())
                    this.renderer.stopAllPlayback();
                else
                    this.renderer.play();
                break;
            case 'song:pause':
                this.renderer.stopAllPlayback();
                // this.renderer.pause();
                break;

            case 'song:resume':
                this.renderer.play(this.renderer.seekPosition);
                break;

            case 'song:playback':
                console.log(e.target);
                break;

            case 'song:volume':
                this.renderer.setVolume(parseInt(form['volume'].value));
                break;

            case 'song:add-instrument':
                const instrumentURL = form['instrumentURL'].value;
                form['instrumentURL'].value = '';
                if(confirm(`Add Instrument to Song?\nURL: ${instrumentURL}`)) {
                    this.renderer.addInstrument(instrumentURL);
                    this.render();
                } else {
                    console.info("Add instrument canceled");
                }
//                     this.fieldAddInstrumentInstrument.value = '';
                break;

            case 'song:set-title':
                this.renderer.setSongTitle(form['title'].value);
                break;

            case 'song:set-version':
                this.renderer.setSongVersion(form['version'].value);
                break;

            case 'toggle:control-song':
                this.classList.toggle('hide-control-song');
                break;

            case 'toggle:control-tracker':
                this.classList.toggle('hide-control-tracker');
                break;


            default:
                console.warn("Unhandled " + e.type + ": ", actionName);
                break;
        }


    }

    onError(err) {
        console.error(err);
        if(this.webSocket)
            this.webSocket
                .onError(err);
                // .send(JSON.stringify({
                //     type: 'error',
                //     message: err.message || err,
                //     stack: err.stack
                // }));
    }


    // Rendering

    render() {

        const linkHRef = this.getScriptDirectory('composer/audio-source-composer.css');

        this.shadowDOM.innerHTML = `
        <link rel="stylesheet" href="${linkHRef}" />
        <div class="asc-container">
            <div class="asc-menu-container">
                <asc-menu key="file" caption="File"></asc-menu>
                <asc-menu key="edit" caption="Edit"></asc-menu>
                <asc-menu key="view" caption="View"></asc-menu>
                <asc-menu key="context" caption=""></asc-menu>
            </div>
            <div class="form-section-container form-section-container-song"></div>
            <div class="form-section-container form-section-container-tracker"></div>
            <asc-tracker tabindex="0" group="root"></asc-tracker>
        </div>
        `;

        this.renderMenu();
        this.renderForms();
    }

    getMenu(key) {
        return this.shadowDOM.querySelector(`asc-menu[key="${key}"]`)
    }

    getFormSection(key) {
        return this.shadowDOM.querySelector(`.form-section-container-${key}`);
    }

    closeMenu() {
        this.shadowDOM.querySelectorAll(`asc-menu.open`)
            .forEach(menuElm => menuElm.classList.remove('open', 'stick'))
    }

    renderForms() {

        const formSection = this.getFormSection('song');
        const renderer = this.renderer;
        const songData = this.getSongData();
        // let tabIndex = 2;
        formSection.innerHTML =
            `
            <div class="form-section-divide">
                <form action="#" class="form-song-toggle" data-action="toggle:control-song">
                    <button name="toggle" class="themed" title="Show/Hide Song Controls">
                        <div>Song</div>
                    </button>
                </form>
            </div>               
            
            <div class="form-section control-song">
                <div class="form-section-header">Playback Controls</div>
                <form action="#" class="form-song-play" data-action="song:play">
                    <button type="submit" name="play" class="themed">Play</button>
                </form>
                <form action="#" class="form-song-pause show-on-song-playing" data-action="song:pause">
                    <button type="submit" name="pause" class="themed">Pause</button>
                </form>
                <form action="#" class="form-song-resume show-on-song-paused" data-action="song:resume">
                    <button type="submit" name="resume" class="themed">Resume</button>
                </form>
            </div>
                                         
            
            <div class="form-section control-song">
                <div class="form-section-header">Volume</div>
                <form action="#" class="form-song-volume submit-on-change" data-action="song:volume">
                    <div class="volume-container">
                        <input name="volume" type="range" min="1" max="100" value="${renderer ? renderer.getVolume() : 0}" class="themed">
                    </div>
                </form>
            </div>
            
            <div class="form-section control-song">
                <div class="form-section-header">Load</div>
                <form name="form-load-file" action="#" class="form-load-file submit-on-change" data-action="song:load-from-file">
                    <label>
                        <div class="input-style">File</div>
                        <input type="file" name="file" accept=".json,.mid,.midi" style="display: none" />
                    </label>
                </form>
            </div>
                          
                                         
            
            <div class="form-section control-song">
                <div class="form-section-header">Song Title</div>
                <form action="#" class="form-song-title submit-on-change" data-action="song:set-title">
                    <input name="title" type="text" class="themed" value="${songData.title}" />
                </form>
            </div>     
            
            <div class="form-section control-song">
                <div class="form-section-header">Version</div>
                <form action="#" class="form-song-version submit-on-change" data-action="song:set-version">
                    <input name="version" type="text" class="themed" value="${songData.version}" />
                </form>
            </div>                
             
            
            <div class="form-section control-song">
                <div class="form-section-header">Add Instrument</div>                    
                <form class="form-add-instrument submit-on-change" data-action="instrument:add">
                    <select name="instrumentURL" class="themed">
                        <option value="">Select Instrument</option>
                        ${this.values.renderEditorFormOptions('instruments-available')}
                    </select>
                </form>
            </div>
             
            <div style="clear: both;" class="control-song"></div>
        `;
    }


    renderMenu() {
        const menuFile = this.getMenu('file');
        const menuView = this.getMenu('view');
        menuFile.onopen = (e) => {
            const handleAction = (actionName) => (e) => {
                this.closeMenu();
                this.onAction(e, actionName);
            };

            const menuFileNewSong = menuFile.getOrCreateSubMenu('new', 'New song');
            menuFileNewSong.onclick = handleAction('song:new');




            const menuFileOpenSong = menuFile.getOrCreateSubMenu('open', 'Open song ►');
            menuFileOpenSong.onopen = (e) => {
                const menuFileOpenSongFromMemory = menuFileOpenSong.getOrCreateSubMenu('from Memory');
                const menuFileOpenSongFromFile = menuFileOpenSong.getOrCreateSubMenu('from File');
                const menuFileOpenSongFromURL = menuFileOpenSong.getOrCreateSubMenu('from URL');
                menuFileOpenSongFromURL.disabled = true;
            };

            const menuFileSaveSong = menuFile.getOrCreateSubMenu('save', 'Save song ►');
            menuFileSaveSong.onopen = (e) => {
                const menuFileSaveSongToMemory = menuFileSaveSong.getOrCreateSubMenu('to Memory');
                menuFileSaveSongToMemory.onclick = handleAction('song:save-to-memory');
                const menuFileSaveSongToFile = menuFileSaveSong.getOrCreateSubMenu('to File');
                menuFileSaveSongToFile.onclick = handleAction('song:save-to-file');
            };

            const menuFileImportSong = menuFile.getOrCreateSubMenu('import', 'Import song ►');
            menuFileImportSong.onopen = (e) => {
                const menuFileImportSongFromMIDI = menuFileImportSong.getOrCreateSubMenu('from MIDI File');
            };

            const menuFileExportSong = menuFile.getOrCreateSubMenu('export', 'Export song ►');
            menuFileExportSong.disabled = true;
            menuFileExportSong.onopen = (e) => {
                const menuFileExportSongToMIDI = menuFileExportSong.getOrCreateSubMenu('to MIDI File');
            };
        }
    }

    // Update DOM

    update() {
        this.menu.update();
        // this.forms.update();
        this.tracker.update();
        // this.instruments.update();
    }

    selectGroup(groupName) {
        this.status.groupHistory = this.status.groupHistory.filter(historyGroup => historyGroup === this.status.currentGroup);
        this.status.groupHistory.unshift(this.status.currentGroup);
        this.status.currentGroup = groupName;
        console.log("Group Change: ", groupName, this.status.groupHistory);
        this.tracker = new AudioSourceComposerTracker(this, groupName);
        this.render();
    }

    selectInstructions(indicies=null) {
        this.status.selectedIndicies = [];
        if(typeof indicies === "number") {
            this.status.selectedIndicies = [indicies];
        } else             if(Array.isArray(indicies)) {
            this.status.selectedIndicies = indicies;
        } else if (typeof indicies === "function") {
            let selectedIndicies = [];
            this.renderer.eachInstruction(this.status.currentGroup, (index, instruction, stats) => {
                if (indicies(index, instruction, stats))
                    selectedIndicies.push(index);
            });

            this.selectedIndicies(selectedIndicies);
            return;
        } else {
            throw console.error("Invalid indicies", indicies);
        }
        this.update();
        // this.tracker.focus();
        // console.log("selectInstructions", this.status.selectedIndicies);
    }

    playSelectedInstructions() {
        this.renderer.stopAllPlayback();
        const selectedIndicies = this.status.selectedIndicies;
        for(let i=0; i<selectedIndicies.length; i++) {
            this.renderer.playInstructionAtIndex(this.status.currentGroup, selectedIndicies[i]);
        }
    }
    // selectInstructions2(groupName, selectedRange=null, selectedIndicies=null) {
    //     if(selectedIndicies === null)
    //         selectedIndicies = [0]
    //     if (!Array.isArray(selectedIndicies))
    //         selectedIndicies = [selectedIndicies];
    //     this.status.selectedIndicies = selectedIndicies;
    //     if(this.status.currentGroup !== groupName) {
    //         this.status.groupHistory = this.status.groupHistory.filter(historyGroup => historyGroup === this.status.currentGroup);
    //         this.status.groupHistory.unshift(this.status.currentGroup);
    //         this.status.currentGroup = groupName;
    //         console.log("Group Change: ", groupName, this.status.groupHistory);
    //         this.tracker = new SongEditorGrid(this, groupName);
    //         this.render();
    //     }
    //     if(selectedRange !== null) {
    //         if(selectedRange && !Array.isArray(selectedRange))
    //             selectedRange = [selectedRange,selectedRange];
    //         this.status.selectedRange = selectedRange;
    //     } else {
    //         this.status.selectedRange = this.renderer.getInstructionRange(groupName, selectedIndicies);
    //     }
    //
    //     this.update();
    //     this.tracker.focus();
    // }

    getScriptDirectory(appendPath='') {
        const scriptElm = document.head.querySelector('script[src$="audio-source-composer-element.js"],script[src$="audio-source-composer.min.js"]');
        const basePath = scriptElm.src.split('/').slice(0, -2).join('/') + '/';
//         console.log("Base Path: ", basePath);
        return basePath + appendPath;
    }

    loadCSS() {
        const targetDOM = this.shadowDOM || document.head;
        if(targetDOM.querySelector('link[href$="audio-source-composer.css"]'))
            return;
        const linkHRef = this.getScriptDirectory('composer/audio-source-composer.css');
        let cssLink=document.createElement("link");
        cssLink.setAttribute("rel", "stylesheet");
        cssLink.setAttribute("type", "text/css");
        cssLink.setAttribute("href", linkHRef);
        targetDOM.appendChild(cssLink);
    }
}
customElements.define('audio-source-composer', AudioSourceComposerElement);