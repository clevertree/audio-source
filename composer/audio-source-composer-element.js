


class AudioSourceComposerElement extends HTMLElement {
    constructor() {
        super();
        this.versionString = '-1';
        this.eventHandlers = [];
        this.saveSongToMemoryTimer = null;
        this.instrumentLibrary = null;

        this.longPressTimeout = null;


        // this.webSocket = new AudioSourceComposerWebsocket(this);
        this.keyboard = new AudioSourceComposerKeyboard(this);
        // this.menu = new AudioSourceComposerMenu(this);
        // this.forms = new AudioSourceComposerForms(this);
        // this.tracker = new AudioSourceComposerGrid(this);
        // this.modifier = new SongModifier(this);

        // this.instruments = new AudioSourceComposerInstruments(this);
        // this.instruments.loadInstrumentLibrary(this.getScriptDirectory('instrument/instrument.library.json'));

        this.renderer = new AudioSourceRenderer({}, this);
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

            // currentOctave: 3,
            currentInstrumentID: 0,
            currentRenderDuration: null,
            previewInstructionsOnSelect: false,
            longPressTimeout: 500,
            doubleClickTimeout: 500,
            autoSaveTimeout: 4000,
        };
        this.shadowDOM = null;

        this.actions = new AudioSourceComposerActions(this);
        this.values = new AudioSourceValues(this.renderer);
        this.loadDefaultInstrumentLibrary();
        this.loadPackageInfo();
    }

    get tracker() { return this.shadowDOM.querySelector('asc-tracker'); }
    // get menu() { return this.shadowDOM.querySelector('asc-menu-dropdown'); }
    // get forms() { return this.shadowDOM.querySelector('asc-forms'); }
    // get instruments() { return this.shadowDOM.querySelector('asc-instruments'); }
    get containerElm() { return this.shadowDOM.querySelector('.asc-container'); }

    get scriptDirectory () {
        const Libraries = new AudioSourceLibraries;
        return Libraries.getScriptDirectory('');
    }

    get sampleLibraryURL()      { return this.getAttribute('sampleLibraryURL') || this.scriptDirectory('sample/sample.library.json'); }
    set sampleLibraryURL(url)   { this.setAttribute('sampleLibraryURL', url); }

    connectedCallback() {
        // this.loadCSS();
        this.shadowDOM = this.attachShadow({mode: 'open'});

        // const onInput = e => this.onInput(e);
        // this.shadowDOM.addEventListener('submit', onInput);
        // this.shadowDOM.addEventListener('change', onInput);
        // this.attachEventHandler(['change', 'submit'], e => this.onInput(e));
        this.attachEventHandler(['change', 'submit', 'focus'], e => this.onInput(e), this.shadowDOM, true);
        // this.shadowDOM.addEventListener('blur', onInput);
        // this.shadowDOM.addEventListener('focus', e => this.onInput(e), true);

        this.attachEventHandler([
            'song:loaded','song:play','song:end','song:stop','song:modified', 'song:seek',
            'note:start', 'note:end',
        ], this.onSongEvent);
        this.attachEventHandler([
            'instrument:instance',
            'instrument:library',
            'instrument:modified',
            'instrument:loaded'],
            e => this.onSongEvent(e), document);

        this.render();
        this.focus();

        // const uuid = this.getAttribute('uuid');
        // if(uuid)
        //     this.renderer.loadSongFromServer(uuid);

        this.loadDefaultSong();
        // this.setAttribute('tabindex', 0);
        // this.initWebSocket(uuid);

        // TODO: wait for user input
        if(navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(
                (MIDI) => {
                    console.info("MIDI initialized", MIDI);
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

    disconnectedCallback() {
        this.eventHandlers.forEach(eventHandler =>
            eventHandler[2].removeEventListener(eventHandler[0], eventHandler[1]));
    }

    attachEventHandler(eventNames, method, context, options=null) {
        if(!Array.isArray(eventNames))
            eventNames = [eventNames];
        for(let i=0; i<eventNames.length; i++) {
            const eventName = eventNames[i];
            context = context || this;
            context.addEventListener(eventName, method, options);
            this.eventHandlers.push([eventName, method, context]);
        }
    }

    async loadDefaultInstrumentLibrary() {
        const Libraries = new AudioSourceLibraries;
        const defaultLibraryURL = Libraries.getScriptDirectory('instrument/instrument.library.json');
        await this.loadInstrumentLibrary(defaultLibraryURL);

        this.renderer.dispatchEvent(new CustomEvent('instrument:library', {
            // detail: this.instrumentLibrary,
            // bubbles: true
        }));

    }

    async loadDefaultSong() {
        const src = this.getAttribute('src');
        if(src) {
            try {
                await this.loadSongFromSrc(src);
                return true;
            } catch (e) {
                console.error("Failed to load from src: ", src, e);
            }
        }

        if(await this.actions.loadRecentSongData())
            return true;

        this.actions.loadNewSongData();
        return false;
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


    getDefaultInstrumentURL() {
        return new URL(this.scriptDirectory + "instrument/audio-source-synthesizer.js", document.location);
    }


    /** Playback **/

    // async play() {
    //     await this.renderer.play();
    //     // let playbackInterval = setInterval(e => {
    //     //     if(this.renderer.isPlaying) {
    //     //         this.updateSongPositionValue();
    //     //     } else {
    //     //         clearInterval(playbackInterval);
    //     //     }
    //     // }, 10);
    //     // if(this.renderer.isPlaybackActive())
    //     //     this.renderer.stop();
    //     // else
    //     //     this.renderer.play();
    //
    // }

    updateSongPositionValue(fSeconds) {
        let m = Math.floor(fSeconds / 60);
        fSeconds = fSeconds % 60;
        let ms = Math.round((fSeconds - Math.floor(fSeconds)) * 1000);
        fSeconds = Math.floor(fSeconds);

        m = (m+'').padStart(2, '0');
        fSeconds = (fSeconds+'').padStart(2, '0');
        ms = (ms+'').padStart(4, '0'); // TODO: ticks?

        this.fieldSongPosition.value = `${m}:${fSeconds}:${ms}`;
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

//         console.log(e.target, e.type);

        // try {
        this.renderer.getAudioContext();
        // if(this !== document.activeElement && !this.contains(document.activeElement)) {
        //     console.log("Focus", document.activeElement);
        //     this.focus();
        // }
        switch(e.type) {
            case 'submit':
                e.preventDefault();
                this.onSubmit(e);
                break;
            case 'change':
            case 'blur':
                if(e.target.form && e.target.form.classList.contains('submit-on-' + e.type))
                    this.onSubmit(e);
                break;

            case 'focus':
                for(let i=0; i<e.path.length; i++) {
                    const target = e.path[i];
                    if(target.classList && target.classList.contains('instrument-container')) {
                        if(!target.classList.contains('selected')) {
                            target.parentNode.querySelectorAll('.instrument-container.selected')
                                .forEach((instrumentContainerElm) => instrumentContainerElm.classList.remove('selected'));
                            target.classList.add('selected');
                            setTimeout(e => target.parentNode.scrollLeft = target.offsetLeft - 20, 1);
                        }
                        break;
                    }
                }
                break;

            default:
                if(this.tracker)
                    this.tracker.onInput(e);
                break;
        }


        // if(this.tracker.contains(e.target))
        //     this.tracker.onInput(e);


    }

    onSongEvent(e) {
//         console.log("Song Event: ", e.type);
        if(this.tracker)
            this.tracker.onSongEvent(e);
        switch(e.type) {
            case 'song:seek':
                this.updateSongPositionValue(this.renderer.songPlaybackPosition);
                break;

            case 'song:loaded':
                this.tracker.renderDuration = this.renderer.getSongTimeDivision();
                break;
            case 'song:play':
                this.classList.add('playing');
                this.containerElm.classList.add('playing');
                clearInterval(this.updateSongPositionInterval);
                let lastGroupPositionInTicks = 0;
                let songIterator = e.detail.iterator; // TODO: this event needs an iterator
                this.updateSongPositionInterval = setInterval(e => {
                    this.updateSongPositionValue(this.renderer.songPlaybackPosition);
                    if(songIterator && songIterator.groupPositionInTicks > lastGroupPositionInTicks) {
                        lastGroupPositionInTicks = songIterator.groupPositionInTicks;
                        console.log('lastGroupPositionInTicks', lastGroupPositionInTicks);
                        this.tracker.setPlaybackPositionInTicks(lastGroupPositionInTicks);
                    }
                }, 10);
                break;

            case 'song:pause':
                clearInterval(this.updateSongPositionInterval);
                this.classList.add('paused');
                this.containerElm.classList.add('paused');
                break;
            case 'song:end':
                clearInterval(this.updateSongPositionInterval);
                this.classList.remove('playing', 'paused');
                this.containerElm.classList.remove('playing', 'paused');
                break;
            case 'instrument:modified':
            case 'song:modified':
                switch(e.type) {
                    case 'instrument:modified':
                        this.renderInstruments();
                        if(this.tracker) // Update aliases
                            this.tracker.renderForms();
                        break;
                }
                // this.tracker.render();
                // this.forms.render();

                // TODO: auto save toggle
                clearTimeout(this.saveSongToMemoryTimer);
                this.saveSongToMemoryTimer = setTimeout(e => this.actions.saveSongToMemory(e), this.status.autoSaveTimeout);
                break;
            case 'instrument:loaded':
            case 'instrument:instance':
                this.renderInstruments();
                if(this.tracker) // Update aliases
                    this.tracker.renderForms();
                break;
            case 'instrument:library':
//                 console.log(e.type);
                // TODO: this.instruments.render();
                // this.renderInstruments();
                this.renderSongForms();
                if(this.tracker)
                    this.tracker.renderForms();
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

    async onAction(e, actionName, actionOptions=null) {

        this.setStatus("Action: " + actionName);
        // e.preventDefault();

        if(this.tracker.onAction(e, actionName))
            return true;

        switch(actionName) {
            default:
                console.warn("Unhandled " + e.type + ": ", actionName);
                break;
        }


    }

    onError(err) {
        console.error(err);
        this.setStatus(`<span style="red">${err}</span>`);
        if(this.webSocket)
            this.webSocket
                .onError(err);
                // .send(JSON.stringify({
                //     type: 'error',
                //     message: err.message || err,
                //     stack: err.stack
                // }));
    }

// <div class="form-section-divide"><span>Song</span></div>
// <div class="form-section-container form-section-container-song"></div>
//
//         <div class="form-section-divide"><span>Track</span></div>
// <div class="form-section-container form-section-container-tracker"></div>
//
//         <div class="form-section-divide"><span>Instruments</span></div>
// <div class="form-section-container form-section-container-instruments"></div>

    setStatus(newStatus) {
        console.info.apply(null, arguments); // (newStatus);
        this.statusElm.innerHTML = newStatus;
    }

    setVersion(versionString) {
        this.versionString = versionString;
        this.versionElm.innerHTML = versionString;
    }


    closeAllMenus() {
        this.shadowDOM.querySelector(`asc-menu`)
            .closeAllMenus();
    }

    // Rendering
    get statusElm() { return this.shadowDOM.querySelector(`.asc-status-container .status-text`); }
    get versionElm() { return this.shadowDOM.querySelector(`.asc-status-container .version-text`); }

    get menuFile() { return this.shadowDOM.querySelector(`asc-menu[key="file"]`)}
    get menuEdit() { return this.shadowDOM.querySelector(`asc-menu[key="edit"]`)}
    get menuView() { return this.shadowDOM.querySelector(`asc-menu[key="view"]`)}
    get menuInstrument() { return this.shadowDOM.querySelector(`asc-menu[key="instrument"]`)}
    get menuContext() { return this.shadowDOM.querySelector(`asc-menu[key="context"]`)}

    get panelSong() { return this.shadowDOM.querySelector(`asc-panel[key='song']`)}
    get panelTracker() { return this.shadowDOM.querySelector(`asc-panel[key='tracker']`)}
    get panelInstruction() { return this.shadowDOM.querySelector(`asc-panel[key='instruction']`)}
    get panelInstruments() { return this.shadowDOM.querySelector(`asc-panel[key='instruments']`)}

    render() {
        const Libraries = new AudioSourceLibraries;
        const linkHRef = Libraries.getScriptDirectory('composer/audio-source-composer.css');

        this.shadowDOM.innerHTML = `
        <link rel="stylesheet" href="${linkHRef}" />
        <div class="asc-container">
            <div class="asc-menu-container">
                <asc-menu key="file" caption="File"></asc-menu>
                <asc-menu key="edit" caption="Edit"></asc-menu>
                <asc-menu key="view" caption="View"></asc-menu>
                <asc-menu key="instrument" caption="Instrument"></asc-menu>
                <asc-menu key="context" caption=""></asc-menu>
            </div>
            <asc-panel key="song"></asc-panel>
            <br/>
            <asc-panel key="instruction"></asc-panel>
            <asc-panel key="tracker"></asc-panel>
            <br/>
            <asc-panel key="instruments"></asc-panel>
            <hr/>
            <asc-tracker tabindex="0" group="root"></asc-tracker>
        </div>
        <div class="asc-status-container">
            <span class="status-text"></span>
            <a href="https://github.com/clevertree/audio-source-composer" target="_blank" class="version-text">${this.versionString}</a>
        </div>
        `;

        this.containerElm.classList.toggle('fullscreen', this.classList.contains('fullscreen'));

        this.renderMenu();
        this.renderSongForms();
        this.renderInstruments();
    }


    /** Song Forms **/

    get formSongPlayback()          { return this.panelSong.getOrCreateForm('playback'); }
    get formSongPosition()          { return this.panelSong.getOrCreateForm('position'); }
    get formSongVolume()            { return this.panelSong.getOrCreateForm('volume'); }
    get formSongFile()              { return this.panelSong.getOrCreateForm('file'); }
    get formSongName()              { return this.panelSong.getOrCreateForm('name'); }
    get formSongVersion()           { return this.panelSong.getOrCreateForm('version'); }

    /** Tracker Fields **/

    get fieldSongPlaybackPlay() {
        return this.formSongPlayback.getInput('play', false)
            || this.formSongPlayback.addButton('play', e => this.actions.songPlay(e),
                `<i class="ui-icon ui-play"></i>`,
                "Play Song");
    }
    get fieldSongPlaybackPause() {
        return this.formSongPlayback.getInput('pause', false)
            || this.formSongPlayback.addButton('pause', e => this.actions.songPause(e),
                `<i class="ui-icon ui-pause"></i>`,
                "Play Song");
    }
    get fieldSongPlaybackStop() {
        return this.formSongPlayback.getInput('stop', false)
            || this.formSongPlayback.addButton('pause', e => this.actions.songStop(e),
                `<i class="ui-icon ui-stop"></i>`,
                "Play Song");
    }

    get fieldSongVolume() {
        return this.formSongVolume.getInput('volume', false)
            || this.formSongVolume.addRangeInput('volume', e => this.editor.actions.setSongVolume(e), 1, 100)
    }
    get fieldSongPosition() {
        return this.formSongPosition.getInput('position', false)
            || this.formSongPosition.addTextInput('position',
                e => this.editor.actions.setTrackerSelection(e),
                'Song Position',
                '00:00:0000'
            );
    }
    get fieldSongName() {
        return this.formSongName.getInput('name', false)
            || this.formSongName.addTextInput('name', e => this.actions.setSongName(e), "Song Name", 'Unnamed');
    }
    get fieldSongVersion() {
        return this.formSongVersion.getInput('version', false)
            || this.formSongVersion.addTextInput('version', e => this.actions.setSongVersion(e), "Song Version", '0.0.0');
    }




    get fieldSongFileLoad() {
        return this.formSongFile.getInput('file-load', false)
            || this.formSongFile.addFileInput('file-load',
                e => this.actions.songFileLoad(e),
                `<i class="ui-icon ui-file-load"></i>`,
                `.json,.mid,.midi`,
                "Save Song to File"
            );
    }

    get fieldSongFileSave() {
        return this.formSongFile.getInput('file-save', false)
            || this.formSongFile.addButton('file-save',
                e => this.actions.songFileSave(e),
                `<i class="ui-icon ui-file-save"></i>`,
                "Save Song to File"
            );
    }



    renderSongForms() {
        this.fieldSongPlaybackPlay;
        this.fieldSongPlaybackPause;
        this.fieldSongPlaybackStop;
        
        this.fieldSongFileLoad;
        this.fieldSongFileSave;

        this.fieldSongVolume;
        this.fieldSongPosition;
        this.fieldSongName;
        this.fieldSongVersion;

    }

/**
 *
 <form action="#" class="form-song-resume show-on-song-paused" data-action="song:resume">
 <button type="submit" name="resume" class="themed">
 <i class="ui-icon ui-resume"></i>
 </button>
 </form>



 <div class="form-section control-song">
 <div class="form-section-header">Add Instrument</div>
 <form class="form-song-add-instrument submit-on-change" data-action="song:add-instrument">
 <select name="instrumentURL" class="themed">
 <option value="">Select Instrument</option>
 ${this.values.renderEditorFormOptions('instruments-available')}
 </select>
 </form>
 </div>

 */

    renderInstruments() {
        const formSection = this.panelInstruments;
        const renderer = this.renderer;


        const instrumentList = renderer.getInstrumentList();
        for(let instrumentID=0; instrumentID<instrumentList.length; instrumentID++) {

            formSection.addInstrumentContainer(instrumentID);

        }

        // TODO Update selected
        // if(instrumentID === 0)
        //     instrumentContainer.classList.add('selected');

        formSection.appendChild(new EmptyInstrumentElement(instrumentList.length, '[Empty]'))
    }

    renderMenu() {
        this.menuFile.populate = (e) => {
            const menu = e.menuElement;
            const menuFileNewSong = menu.getOrCreateSubMenu('new', 'New song');
            menuFileNewSong.action = (e) => this.onAction(e, 'song:new');




            const menuFileOpenSong = menu.getOrCreateSubMenu('open', 'Open song ►');
            menuFileOpenSong.populate = (e) => {
                const menuFileOpenSongFromMemory = menuFileOpenSong.getOrCreateSubMenu('from Memory ►');
                menuFileOpenSongFromMemory.populate = async (e) => {
                    const menu = e.menuElement;

                    const Storage = new AudioSourceStorage();
                    const songRecentUUIDs = await Storage.getRecentSongList() ;
                    for(let i=0; i<songRecentUUIDs.length; i++) {
                        const entry = songRecentUUIDs[i];
                        const menuOpenSongUUID = menu.getOrCreateSubMenu(entry.guid, entry.title);
                        menuOpenSongUUID.action = (e) => {
                            this.loadSongFromMemory(entry.guid);
                        }
                    }

                };

                const menuFileOpenSongFromFile = menuFileOpenSong.getOrCreateSubMenu('from File',
                    `<form name="form-menu-load-file" action="#" class="form-menu-load-file submit-on-change" data-action="song:load-from-file">
                                <label>from File<input type="file" name="file" accept=".json" style="display: none"></label>
                            </form>`);
                // menuFileOpenSongFromFile.action = (e) => this.onAction(e, 'song:load-from-file');
                // menuFileOpenSongFromFile.disabled = true;
                const menuFileOpenSongFromURL = menuFileOpenSong.getOrCreateSubMenu('from URL');
                menuFileOpenSongFromURL.disabled = true;
            };

            const menuFileSaveSong = menu.getOrCreateSubMenu('save', 'Save song ►');
            menuFileSaveSong.populate = (e) => {
                const menuFileSaveSongToMemory = menuFileSaveSong.getOrCreateSubMenu('to Memory');
                menuFileSaveSongToMemory.action = (e) => this.onAction(e, 'song:save-to-memory');
                const menuFileSaveSongToFile = menuFileSaveSong.getOrCreateSubMenu('to File');
                menuFileSaveSongToFile.action = (e) => this.onAction(e, 'song:save-to-file');
            };

            const menuFileImportSong = menu.getOrCreateSubMenu('import', 'Import song ►');
            menuFileImportSong.populate = (e) => {
                const menuFileImportSongFromMIDI = menuFileImportSong.getOrCreateSubMenu('from MIDI File',
                    `<form name="form-menu-load-file" action="#" class="form-menu-load-file submit-on-change" data-action="song:load-from-file">
                                <label>from MIDI File<input type="file" name="file" accept=".mid,.midi" style="display: none"></label>
                            </form>`);
                // menuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
                // menuFileImportSongFromMIDI.disabled = true;
            };

            const menuFileExportSong = menu.getOrCreateSubMenu('export', 'Export song ►');
            menuFileExportSong.disabled = true;
            menuFileExportSong.populate = (e) => {
                const menuFileExportSongToMIDI = menuFileExportSong.getOrCreateSubMenu('to MIDI File');
                menuFileExportSongToMIDI.disabled = true;
            };
        };

        this.menuView.populate = (e) => {
            const menu = e.menuElement;

            const menuViewToggleFullscreen = menu.getOrCreateSubMenu('fullscreen',
                `${this.classList.contains('fullscreen') ? 'Disable' : 'Enable'} Fullscreen`);
            menuViewToggleFullscreen.action = (e) => this.onAction(e, 'view:fullscreen');

            const menuViewToggleFormSong = menu.getOrCreateSubMenu('forms-song',
                `${this.containerElm.classList.contains('hide-forms-song') ? 'Show' : 'Hide'} Song Forms `);
            menuViewToggleFormSong.action = (e) => this.onAction(e, 'view:forms-song');

            const menuViewToggleFormTrack = menu.getOrCreateSubMenu('forms-tracker',
                `${this.containerElm.classList.contains('hide-forms-tracker') ? 'Show' : 'Hide'} Track Forms`);
            menuViewToggleFormTrack.action = (e) => this.onAction(e, 'view:forms-tracker');

            const menuViewToggleFormInstrument = menu.getOrCreateSubMenu('forms-instruments',
                `${this.containerElm.classList.contains('hide-forms-instruments') ? 'Show' : 'Hide'} Instrument Forms`);
            menuViewToggleFormInstrument.action = (e) => this.onAction(e, 'view:forms-instruments');
        };

        this.menuInstrument.populate = (e) => {
            const menu = e.menuElement;

            const menuInstrumentAdd = menu.getOrCreateSubMenu('instrument', `Add To Song ►`);
            menuInstrumentAdd.populate = (e) => {
                const menu = e.menuElement;
                this.values.getValues('instruments-available', (instrumentURL, label) => {
                    const menuInstrument = menu.getOrCreateSubMenu(instrumentURL, `${label}`);
                    // menuInstrument.setAttribute('data-instrument', instrumentURL);
                    menuInstrument.action = (e) => {
                        this.fieldSongAddInstrument.value = instrumentURL;
                        this.onAction(e, 'song:add-instrument', instrumentURL);
                    }
                });
            };


            let instrumentCount = 0;
            this.values.getValues('song-instruments', (instrumentID, label) => {
                const isActive = this.renderer.isInstrumentLoaded(instrumentID);

                const menuInstrument = menu.getOrCreateSubMenu(instrumentID, `${label} ►`);
                menuInstrument.populate = (e) => {
                    const menu = e.menuElement;

                    const menuInstrumentChange = menu.getOrCreateSubMenu('change', `Replace ►`);
                    menuInstrumentChange.populate = (e) => {
                        const menu = e.menuElement;
                        this.values.getValues('instruments-available', (instrumentURL, label) => {
                            const menuInstrument = menu.getOrCreateSubMenu(instrumentURL, `${label}`);
                            // menuInstrument.setAttribute('data-instrument', instrumentURL);
                            menuInstrument.action = (e) => {
                                this.fieldSongAddInstrument.value = instrumentURL;
                                this.onAction(e, 'song:replace-instrument', {id: instrumentID, url: instrumentURL});
                            }
                        });
                    };


                    const menuInstrumentRemove = menu.getOrCreateSubMenu('remove', `Remove From Song`);
                    menuInstrumentRemove.action = (e) => {
                        this.onAction(e, 'song:remove-instrument', instrumentID);
                    };
                    menuInstrumentRemove.disabled = !isActive;


                };
                if(instrumentCount === 0)
                    menuInstrument.hasBreak = true;
                instrumentCount++;
            });

            // TODO CRUD
        };


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
        this.tracker.groupName = groupName;
        // this.tracker = new AudioSourceComposerTracker(this, groupName);
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
        this.renderer.stopPlayback();
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

//     getScriptDirectory(appendPath='') {
//         const scriptElm = document.head.querySelector('script[src$="audio-source-composer-element.js"],script[src$="audio-source-composer.min.js"]');
//         const basePath = scriptElm.src.split('/').slice(0, -2).join('/') + '/';
// //         console.log("Base Path: ", basePath);
//         return basePath + appendPath;
//     }

    /** Ajax Loading **/

    async loadInstrumentLibrary(url, force = false) {
        if (!url)
            throw new Error("Invalid url");
        url = new URL(url, document.location) + '';
        if (!force && this.instrumentLibrary && this.instrumentLibrary.url === url)
            return this.instrumentLibrary;

        this.instrumentLibrary = await this.loadJSON(url);
        this.instrumentLibrary.url = url + '';
        console.info("Instrument Library Loaded: ", this.instrumentLibrary);
        return this.instrumentLibrary;
    }

    async loadPackageInfo() {
        const Libraries = new AudioSourceLibraries;
        const url = Libraries.getScriptDirectory('package.json');
        const packageJSON = await this.loadJSON(url);
        if(!packageJSON.version)
            throw new Error("Invalid package version: " + xhr.response);

        console.log("Package Version: ", packageJSON.version, packageJSON);
        this.setVersion(packageJSON.version);
    }


    async loadJSON(url) {
        url = new URL(url, document.location) + '';
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'json';
            xhr.onload = () => {
                if (xhr.status !== 200)
                    return reject("JSON file not found: " + url);

                resolve(xhr.response);
            };
            xhr.send();
        });
    }


    loadCSS() {
        const targetDOM = this.shadowDOM || document.head;
        if(targetDOM.querySelector('link[href$="audio-source-composer.css"]'))
            return;

        const Libraries = new AudioSourceLibraries;
        const linkHRef = Libraries.getScriptDirectory('composer/audio-source-composer.css');
        let cssLink=document.createElement("link");
        cssLink.setAttribute("rel", "stylesheet");
        cssLink.setAttribute("type", "text/css");
        cssLink.setAttribute("href", linkHRef);
        targetDOM.appendChild(cssLink);
    }
}
customElements.define('audio-source-composer', AudioSourceComposerElement);


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
