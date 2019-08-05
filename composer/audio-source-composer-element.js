
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
            doubleClickTimeout: 500,
            autoSaveTimeout: 4000,
        };
        this.shadowDOM = null;

        this.sources.loadDefaultInstrumentLibrary();
        this.sources.loadPackageInfo();
    }
    get sources() { return this.renderer.sources; }
    get values() { return this.renderer.values; }
    get tracker() { return this.shadowDOM.querySelector('asc-tracker'); }
    // get menu() { return this.shadowDOM.querySelector('asc-menu-dropdown'); }
    // get forms() { return this.shadowDOM.querySelector('asc-forms'); }
    // get instruments() { return this.shadowDOM.querySelector('asc-instruments'); }
    get container() { return this.shadowDOM.querySelector('.asc-container'); }

    get scriptDirectory () { return this.sources.getScriptDirectory(''); }

    get songEvents() { return [
        'song:loaded','song:start','song:end','song:pause','song:modified',
        'note:play',
        'instrument:loaded','instrument:instance','instrument:library','instrument:modified',
    ]}

    connectedCallback() {
        // this.loadCSS();
        this.shadowDOM = this.attachShadow({mode: 'open'});

        const onInput = e => this.onInput(e);
        this.shadowDOM.addEventListener('submit', onInput);
        this.shadowDOM.addEventListener('change', onInput);
        // this.shadowDOM.addEventListener('blur', onInput);

        this.songEvents.forEach(eventName =>
            this.addEventListener(eventName, this.onSongEvent));

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

    disconnectedCallback() {
        this.songEvents.forEach(eventName =>
            this.removeEventListener(eventName, this.onSongEvent));
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

        if(await this.loadRecentSongData())
            return true;

        this.loadNewSongData();
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




    loadNewSongData() {
        const storage = new AudioSourceStorage();
        let songData = storage.generateDefaultSong(this.scriptDirectory);
        this.renderer.loadSongData(songData);
        this.render();
    }


    async loadRecentSongData() {
        const storage = new AudioSourceStorage();
        let songRecentGUIDs = await storage.getRecentSongList();
        if(songRecentGUIDs[0] && songRecentGUIDs[0].guid) {
            await this.loadSongFromMemory(songRecentGUIDs[0].guid);
            return true;
        }
        return false;
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


    async loadSongFromMemory(songGUID) {
        const storage = new AudioSourceStorage();
        const songData = await storage.loadSongFromMemory(songGUID);
        const songHistory = await storage.loadSongHistoryFromMemory(songGUID);
        this.renderer.loadSongData(songData, songHistory);
        this.render();
        console.info("Song loaded from memory: " + songGUID, songData);
    }

    async loadSongFromFileInput(inputFile) {
        await this.loadSongFromMIDIFileInput(inputFile);
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
            case 'submit':
                e.preventDefault();
                this.onSubmit(e);
                break;
            case 'change':
            case 'blur':
                if(e.target.form && e.target.form.classList.contains('submit-on-' + e.type))
                    this.onSubmit(e);
                break;

            default:
                break;
        }


        // if(this.tracker.contains(e.target))
        //     this.tracker.onInput(e);


    }

    onSongEvent(e) {
//         console.log("Song Event: ", e.type);
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

                // TODO: auto save toggle
                clearTimeout(this.saveSongToMemoryTimer);
                this.saveSongToMemoryTimer = setTimeout(e => this.saveSongToMemory(e), this.status.autoSaveTimeout);
                break;
            case 'instrument:loaded':
                console.info("TODO: load instrument instances", e.detail);
                break;
            case 'instrument:library':
            case 'instrument:instance':
            case 'instrument:modified':
//                 console.log(e.type);
                // TODO: this.instruments.render();
                this.renderInstruments();
                this.renderSongForms();
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

    onAction(e, actionName, actionOptions=null) {
        console.info("Action: " + actionName, e.target);
        // e.preventDefault();

        if(this.tracker.onAction(e, actionName))
            return true;

        switch(actionName) {
            case 'song:new':
                e.preventDefault();
                this.loadNewSongData();
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
                // this.render();
                break;

            case 'song:save-to-memory':
                e.preventDefault();
                this.saveSongToMemory();
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
                this.renderer.setVolume(this.fieldSongVolume.value);
                break;

            case 'song:add-instrument':
                const addInstrumentURL = actionOptions || e.target.form.elements['instrumentURL'].value;
                e.target.form.elements['instrumentURL'].value = '';
                if(confirm(`Add Instrument to Song?\nURL: ${addInstrumentURL}`)) {
                    this.renderer.addInstrument(addInstrumentURL);

                } else {
                    console.info("Add instrument canceled");
                }
                break;

            case 'song:replace-instrument':
                const changeInstrument = actionOptions || {
                    url: e.target.form.elements['instrumentURL'].value,
                    id: parseInt(e.target.form.elements['instrumentID'].value)
                };
                changeInstrument.title = changeInstrument.url.split('/').pop();
                if(confirm(`Change Instrument (${changeInstrument.id}) to ${changeInstrument.title}`)) {
                    this.status.currentInstrumentID = this.renderer.replaceInstrument(changeInstrument.id, changeInstrument.url);
                } else {
                    console.info("Change instrument canceled");
                }

                break;

            case 'song:remove-instrument':
                const removeInstrumentID = actionOptions || parseInt(e.target.form.elements['instrumentID'].value);
                if(confirm(`Remove Instrument ID: ${removeInstrumentID}`)) {
                    this.renderer.removeInstrument(removeInstrumentID);

                } else {
                    console.info("Remove instrument canceled");
                }
                break;

            case 'song:set-title':
                this.renderer.setSongTitle(e.target.form.elements['title'].value);
                break;

            case 'song:set-version':
                this.renderer.setSongVersion(e.target.form.elements['version'].value);
                break;

            case 'toggle:control-song':
                this.classList.toggle('hide-control-song');
                break;

            case 'toggle:control-tracker':
                this.classList.toggle('hide-control-tracker');
                break;


            case 'view:fullscreen':
                this.classList.toggle('fullscreen');
                console.log(this);
                break;

            case 'view:forms-song':
                this.container.classList.toggle('hide-forms-song');
                break;

            case 'view:forms-tracker':
                this.container.classList.toggle('hide-forms-tracker');
                break;

            case 'view:forms-instruments':
                this.container.classList.toggle('hide-forms-instruments');
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

    get menuFile() { return this.shadowDOM.querySelector(`asc-menu[key="file"]`)}
    get menuEdit() { return this.shadowDOM.querySelector(`asc-menu[key="edit"]`)}
    get menuView() { return this.shadowDOM.querySelector(`asc-menu[key="view"]`)}
    get menuInstrument() { return this.shadowDOM.querySelector(`asc-menu[key="instrument"]`)}
    get menuContext() { return this.shadowDOM.querySelector(`asc-menu[key="context"]`)}

    get formsSong() { return this.shadowDOM.querySelector(`.form-section-container-song`)}
    get formsTracker() { return this.shadowDOM.querySelector(`.form-section-container-tracker`)}
    get formsInstruments() { return this.shadowDOM.querySelector(`.form-section-container-instruments`)}

    render() {

        const linkHRef = this.sources.getScriptDirectory('composer/audio-source-composer.css');

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
            <div class="form-section-container form-section-container-song"></div>
            <div class="form-section-container form-section-container-tracker"></div>
            <div class="form-section-container form-section-container-instruments"></div>
            <asc-tracker tabindex="0" group="root"></asc-tracker>
        </div>
        `;

        this.renderMenu();
        this.renderSongForms();
        this.renderInstruments();
    }

    // getMenu(key) {
    //     return this.shadowDOM.querySelector(`asc-menu[key="${key}"]`)
    // }

    closeAllMenus() {
        this.shadowDOM.querySelector(`asc-menu`)
            .closeAllMenus();
    }



    get fieldSongVolume()           { return this.formsSong.querySelector('form.form-song-volume input[name=volume]'); }
    get fieldSongAddInstrument()    { return this.formsSong.querySelector('form.form-song-add-instrument select[name=instrumentURL]'); }

    renderSongForms() {

        const formSection = this.formsSong;
        const renderer = this.renderer;
        const songData = this.getSongData();
        // let tabIndex = 2;
        formSection.innerHTML =
            `

            <div class="form-section-divide">
                <span>Song</span>
            </div>
            
            <div class="form-section control-song">
                <div class="form-section-header">Playback Controls</div>
                <form action="#" class="form-song-play" data-action="song:play">
                    <button type="submit" name="play" class="themed">
                        <i class="ui-icon ui-play"></i>
                    </button>
                </form>
                <form action="#" class="form-song-pause show-on-song-playing" data-action="song:pause">
                    <button type="submit" name="pause" class="themed">
                        <i class="ui-icon ui-pause"></i>
                    </button>
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
                <div class="form-section-header">File</div>
                <form name="form-load-file" action="#" class="form-load-file submit-on-change" data-action="song:load-from-file">
                    <label>
                        <div class="input-style">
                            <i class="ui-icon ui-file-load"></i>
                        </div>
                        <input type="file" name="file" accept=".json,.mid,.midi" style="display: none" />
                    </label>
                </form>
                <form name="form-save-file" action="#" class="form-save-file submit-on-change" data-action="song:save-to-file">
                    <button type="submit" name="save" class="themed">
                        <i class="ui-icon ui-file-save"></i>
                    </button>
                </form>
            </div>
                          
                                         
            
            <div class="form-section control-song">
                <div class="form-section-header">Song Name</div>
                <form action="#" class="form-song-title submit-on-change" data-action="song:set-title">
                    <input name="name" type="text" class="themed" value="${songData.name}" />
                </form>
            </div>     
            
            <div class="form-section control-song">
                <div class="form-section-header">Version</div>
                <form action="#" class="form-song-version submit-on-change" data-action="song:set-version">
                    <input name="version" type="text" class="themed" value="${songData.version}" />
                </form>
            </div>                
             
            
            <div style="clear: both;" class="control-song"></div>
        `;
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
        const formSection = this.formsInstruments;
        const renderer = this.renderer;

        formSection.innerHTML = `
            <div class="form-section-divide">
                <span>Instruments</span>
            </div>
`;

        const formInstrumentsContainer = formSection; // formSection.querySelector('.form-instruments-container');
        const instrumentList = renderer.getInstrumentList();
        for(let instrumentID=0; instrumentID<instrumentList.length; instrumentID++) {

            let instrumentDiv = document.createElement('div');
            instrumentDiv.setAttribute('data-id', instrumentID+'');
            instrumentDiv.classList.add('instrument-container');
            instrumentDiv.classList.add('control-instrument');
            formInstrumentsContainer.appendChild(instrumentDiv);

            // const defaultSampleLibraryURL = new URL('/sample/', NAMESPACE) + '';

            let instrument = renderer.getInstrument(instrumentID, false);
            const instrumentPreset = renderer.getInstrumentConfig(instrumentID, false);

            instrumentDiv.innerHTML = ``;

            if(!instrumentPreset) {
                instrument = new EmptyInstrumentElement(instrumentID);
                instrumentDiv.appendChild(instrument);

            } else if(!instrumentPreset.url) {
                instrumentDiv.innerHTML = `Invalid URL`;

            } else if(!renderer.isInstrumentLoaded(instrumentID)) {
                instrumentDiv.innerHTML = `Loading...`;

            } else {
                try {
                    if (instrument instanceof HTMLElement) {
                        instrument.setAttribute('data-id', instrumentID+'');
                        instrumentDiv.appendChild(instrument);
                    } else if (instrument.render) {
                        const renderedHTML = instrument.render(this, instrumentID);
                        if(renderedHTML)
                            instrumentDiv.innerHTML = renderedHTML;
                    } else {
                        throw new Error("No Renderer");
                    }

                } catch (e) {
                    instrumentDiv.innerHTML = e;
                }
            }
        }

        formSection.appendChild(new EmptyInstrumentElement())
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

                const menuFileOpenSongFromFile = menuFileOpenSong.getOrCreateSubMenu('from File');
                menuFileOpenSongFromFile.disabled = true;
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
                const menuFileImportSongFromMIDI = menuFileImportSong.getOrCreateSubMenu('from MIDI File');
                menuFileImportSongFromMIDI.disabled = true;
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
                `${this.container.classList.contains('hide-forms-song') ? 'Show' : 'Hide'} Song Forms `);
            menuViewToggleFormSong.action = (e) => this.onAction(e, 'view:forms-song');

            const menuViewToggleFormTrack = menu.getOrCreateSubMenu('forms-tracker',
                `${this.container.classList.contains('hide-forms-tracker') ? 'Show' : 'Hide'} Track Forms`);
            menuViewToggleFormTrack.action = (e) => this.onAction(e, 'view:forms-tracker');

            const menuViewToggleFormInstrument = menu.getOrCreateSubMenu('forms-instruments',
                `${this.container.classList.contains('hide-forms-instruments') ? 'Show' : 'Hide'} Instrument Forms`);
            menuViewToggleFormInstrument.action = (e) => this.onAction(e, 'view:forms-instruments');
        };

        this.menuInstrument.populate = (e) => {
            const menu = e.menuElement;

            const menuInstrumentAdd = menu.getOrCreateSubMenu('instrument', `Add To Song ►`);
            menuInstrumentAdd.populate = (e) => {
                const menu = e.menuElement;
                this.values.getValues('instruments-available', (instrumentURL, label) => {
                    const menuInstrument = menu.getOrCreateSubMenu(instrumentURL, `${label}`);
                    menuInstrument.setAttribute('data-instrument', instrumentURL);
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
                            menuInstrument.setAttribute('data-instrument', instrumentURL);
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

//     getScriptDirectory(appendPath='') {
//         const scriptElm = document.head.querySelector('script[src$="audio-source-composer-element.js"],script[src$="audio-source-composer.min.js"]');
//         const basePath = scriptElm.src.split('/').slice(0, -2).join('/') + '/';
// //         console.log("Base Path: ", basePath);
//         return basePath + appendPath;
//     }

    loadCSS() {
        const targetDOM = this.shadowDOM || document.head;
        if(targetDOM.querySelector('link[href$="audio-source-composer.css"]'))
            return;
        const linkHRef = this.sources.getScriptDirectory('composer/audio-source-composer.css');
        let cssLink=document.createElement("link");
        cssLink.setAttribute("rel", "stylesheet");
        cssLink.setAttribute("type", "text/css");
        cssLink.setAttribute("href", linkHRef);
        targetDOM.appendChild(cssLink);
    }
}
customElements.define('audio-source-composer', AudioSourceComposerElement);

class EmptyInstrumentElement extends HTMLElement {

    constructor(instrumentID=null) {
        super();
        if(instrumentID !== null)
            this.setAttribute('data-id', instrumentID+'');
    }



    connectedCallback() {
        // this.song = this.closest('music-song'); // Don't rely on this !!!
        // const onInput = e => this.onInput(e);
        // this.addEventListener('submit', onInput);
        this.render();
    }

    get editor() {
        const editor = this.closest('div.asc-container').parentNode.host;
        if(!editor)
            throw new Error("Editor not found");
        return editor;
    }

    render() {
        let actionText = 'Add';
        let action = 'song:add-instrument';
        let instrumentID = '';
        let instrumentIDHTML = '';
        if(this.hasAttribute('data-id')) {
            actionText = 'Change';
            instrumentID = this.getAttribute('data-id') || '0';
            action = 'song:replace-instrument';
            instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID + ":");
        }
        this.innerHTML = `
            <div class="form-section control-song">
                <form class="form-song-add-instrument submit-on-change" data-action="${action}">
                    <input type="hidden" name="instrumentID" value="${instrumentID}"/>
                    ${instrumentIDHTML}<!--
                    --><select name="instrumentURL" class="themed">
                        <option value="">${actionText} Instrument</option>
                        ${this.editor.values.renderEditorFormOptions('instruments-available')}
                    </select>
                </form>
            </div>

        `;
    }
}
customElements.define('asc-instrument-empty', EmptyInstrumentElement);
