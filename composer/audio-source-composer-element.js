


class AudioSourceComposerElement extends HTMLElement {
    constructor() {
        super();
        this.versionString = '-1';
        this.eventHandlers = [];
        this.saveSongToMemoryTimer = null;
        // this.instrumentLibrary = null;

        this.longPressTimeout = null;

        this.keyboard = new AudioSourceComposerKeyboard();

        this.song = new AudioSourceSong({}, this);
        // this.player = null;
        this.status = {
            groupHistory: [],
            // previewInstructionsOnSelect: false,
            longPressTimeout: 500,
            doubleClickTimeout: 500,
            autoSaveTimeout: 4000,
        };
        this.shadowDOM = null;

        this.actions = new AudioSourceComposerActions(this);
        this.values = new AudioSourceValues(this.song);
        const Libraries = new AudioSourceLibraries;
        const defaultLibraryURL = Libraries.getScriptDirectory('instrument/instrument.library.json');
        Libraries.loadInstrumentLibrary(defaultLibraryURL);
        Libraries.loadPackageInfo()
            .then(packageInfo => this.setVersion(packageInfo.version));

    }

    get trackerElm() { return this.shadowDOM.querySelector('asc-tracker'); }
    get containerElm() { return this.shadowDOM.querySelector('.asc-container'); }

    get scriptDirectory () {
        const Libraries = new AudioSourceLibraries;
        return Libraries.getScriptDirectory('');
    }

    get sampleLibraryURL()      { return this.getAttribute('sampleLibraryURL') || this.scriptDirectory('sample/sample.library.json'); }
    set sampleLibraryURL(url)   { this.setAttribute('sampleLibraryURL', url); }

    connectedCallback() {
        this.loadCSS();
        this.shadowDOM = this.attachShadow({mode: 'open'});

        this.attachEventHandler(['focus'], e => this.onInput(e), this.shadowDOM, true);
        // 'change', 'submit',

        this.attachEventHandler([
            'song:loaded','song:play','song:end','song:stop','song:modified', 'song:seek',
            'group:play', 'group:seek',
            'note:start', 'note:end'
        ], this.onSongEvent);
        this.attachEventHandler([
            'instrument:instance',
            'instrument:library',
            'instrument:modified',
            'instrument:loaded'],
            e => this.onSongEvent(e), document);

        this.render();
        this.focus();


        this.loadDefaultSong();

        const midiSupport = new MIDISupport();
        midiSupport.loadMIDIInterface(e => this.onInput(e));        // TODO: wait for user input
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

    // async loadDefaultInstrumentLibrary() {
    //     const Libraries = new AudioSourceLibraries;
    //     const defaultLibraryURL = Libraries.getScriptDirectory('instrument/instrument.library.json');
    //     await Libraries.loadInstrumentLibrary(defaultLibraryURL);
    //
    //     this.song.dispatchEvent(new CustomEvent('instrument:library', {
    //         // detail: this.instrumentLibrary,
    //         // bubbles: true
    //     }));
    //
    // }

    async loadDefaultSong() {
        const src = this.getAttribute('src');
        if(src) {
            try {
                await this.actions.loadSongFromSrc(src);
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
    get selectedIndicies()  { return this.status.getSelectedIndicies(); }
    get selectedRange()     { return this.status.selectedRange; }

    // get selectedPauseIndicies()  {
    //     const instructionList = this.renderer.getInstructions(this.currentGroup);
    //     return this.getSelectedIndicies().filter(index => instructionList[index] && instructionList[index].command === '!pause')
    // }
    // get selectedIndicies()  {
    //     const instructionList = this.renderer.getInstructions(this.currentGroup);
    //     return this.getSelectedIndicies().filter(index => instructionList[index] && instructionList[index].command !== '!pause')
    // }

    getAudioContext()   { return this.song.getAudioContext(); }
    getSongData()       { return this.song.data; }


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

        switch(e.type) {
            case 'focus':
                break;
            default:
                this.song.getAudioContext();
        }

        switch(e.type) {
            case 'focus':
                const UIFormElm = e.path[0].closest('asui-form');
                if(UIFormElm) {
                    UIFormElm.getRootNode().querySelectorAll('asui-form.focus')
                        .forEach(formElm => formElm.classList.remove('focus'));
                    UIFormElm.classList.add('focus');
                }
                break;

            default:
                // if(this.trackerElm)
                //     this.trackerElm.onInput(e);
                break;
        }

    }

    async onSongEvent(e) {
//         console.log("Song Event: ", e.type);
        if(this.trackerElm)
            this.trackerElm.onSongEvent(e);
        switch(e.type) {
            case 'song:seek':
                this.updateSongPositionValue(e.detail.position);

                break;

            case 'song:loaded':
                this.trackerElm.renderDuration = this.song.timeDivision;
                break;
            case 'song:play':
                this.classList.add('playing');
                this.containerElm.classList.add('playing');
                this.fieldSongPlaybackPause.disabled = false;
                const updateSongPositionInterval = setInterval(e => {
                    if(!this.song.isPlaying) {
                        clearInterval(updateSongPositionInterval);
                        this.fieldSongPlaybackPause.disabled = true;
                        this.containerElm.classList.remove('playing');
                        this.classList.remove('playing');
                    }
                    this.updateSongPositionValue(this.song.songPlaybackPosition);
                }, 10);
                break;

            case 'song:pause':
                this.classList.add('paused');
                this.containerElm.classList.add('paused');
                break;
            case 'song:end':
                this.classList.remove('playing', 'paused');
                this.containerElm.classList.remove('playing', 'paused');
                break;

            case 'instrument:instance':
                this.renderInstrument(e.detail.instrumentID, e.detail.instance);
                break;

            case 'instrument:modified':
            case 'song:modified':
                switch(e.type) {
                    case 'instrument:modified':
                        this.renderInstruments();
                        if(this.trackerElm) // Update aliases
                            this.trackerElm.renderForms();
                        break;
                }
                // this.trackerElm.render();
                // this.forms.render();

                // TODO: auto save toggle
                clearTimeout(this.saveSongToMemoryTimer);
                this.saveSongToMemoryTimer = setTimeout(e => this.actions.saveSongToMemory(e), this.status.autoSaveTimeout);
                break;
            case 'instrument:loaded':
            case 'instrument:remove':
                this.renderInstruments();
                if(this.trackerElm) // Update aliases
                    this.trackerElm.renderForms();
                break;
            case 'instrument:library':
//                 console.log(e.type);
                // TODO: this.instruments.render();
                // this.renderInstruments();
                this.renderSongForms();
                if(this.trackerElm)
                    this.trackerElm.renderForms();
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

    setStatus(newStatus) {
        console.info.apply(null, arguments); // (newStatus);
        this.statusElm.innerHTML = newStatus;
    }

    setVersion(versionString) {
        this.versionString = versionString;
        this.versionElm.innerHTML = versionString;
    }


    closeAllMenus() {
        this.shadowDOM.querySelector(`asui-menu`)
            .closeAllMenus();
    }

    // Rendering
    get statusElm() { return this.shadowDOM.querySelector(`.asc-status-container .status-text`); }
    get versionElm() { return this.shadowDOM.querySelector(`.asc-status-container .version-text`); }

    get menuFile() { return this.shadowDOM.querySelector(`asui-menu[key="file"]`)}
    get menuEdit() { return this.shadowDOM.querySelector(`asui-menu[key="edit"]`)}
    get menuView() { return this.shadowDOM.querySelector(`asui-menu[key="view"]`)}
    get menuInstrument() { return this.shadowDOM.querySelector(`asui-menu[key="instrument"]`)}
    get menuContext() { return this.shadowDOM.querySelector(`asui-menu[key="context"]`)}

    get panelSong() { return this.shadowDOM.querySelector(`asui-form[key='song']`)}
    get panelTracker() { return this.shadowDOM.querySelector(`asui-form[key='tracker']`)}
    get panelTrackerRowSegments() { return this.shadowDOM.querySelector(`asui-form[key='tracker-row-segments']`)}
    get panelInstruction() { return this.shadowDOM.querySelector(`asui-form[key='instruction']`)}
    get panelInstruments() { return this.shadowDOM.querySelector(`asui-form[key='instruments']`)}

    render() {
        const Libraries = new AudioSourceLibraries;
        const linkHRefComposer = Libraries.getScriptDirectory('composer/audio-source-composer.css');
        const linkHRefCommon = Libraries.getScriptDirectory('common/audio-source-common.css');

        this.shadowDOM.innerHTML = `
            <link rel="stylesheet" href="${linkHRefComposer}" />
            <link rel="stylesheet" href="${linkHRefCommon}" />
            <div class="asc-container">
                <div class="asui-menu-container">
                    <asui-menu key="file" caption="File"></asui-menu>
                    <asui-menu key="edit" caption="Edit"></asui-menu>
                    <asui-menu key="view" caption="View"></asui-menu>
                    <asui-menu key="instrument" caption="Instrument"></asui-menu>
                    <asui-menu key="context" caption=""></asui-menu>
                </div>
                <asui-form key="song" caption="Song" class="panel"></asui-form><!--
                --><asui-form key="instruments" caption="Song Instruments" class="panel"></asui-form>
                <asui-form key="instruction" caption="Selected Instruction(s)" class="panel"></asui-form><!--
                --><asui-form key="tracker" caption="Tracker" class="panel"></asui-form><!--
                --><asui-form key="tracker-row-segments" caption="Tracker Segments" class="panel"></asui-form>
                <asc-tracker group="root"></asc-tracker>
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






    // get fieldSongAddInstrument()
    // TODO: AudioSourceComposerSongFormRenderer()
    renderSongForms() {

        /** Song Forms **/

        const panelSong = this.panelSong;
        if(!panelSong.hasInput('playback')) {
            this.formSongPlayback = panelSong.getOrCreateForm('playback', 'Playback');
            this.formSongPosition = panelSong.getOrCreateForm('position', 'Position');
            this.formSongVolume = panelSong.getOrCreateForm('volume', 'Volume');
            this.formSongFile = panelSong.getOrCreateForm('file', 'File');
            this.formSongName = panelSong.getOrCreateForm('name', 'Name');
            this.formSongVersion = panelSong.getOrCreateForm('version', 'Version');
        }

        /** Tracker Fields **/

        if(!this.formSongPlayback.hasInput('play')) {
            this.fieldSongPlaybackPlay = this.formSongPlayback.addButton('play',
                e => this.actions.songPlay(e),
                this.formSongPlayback.createIcon('play'),
                "Play Song");
            this.fieldSongPlaybackPause = this.formSongPlayback.addButton('pause',
                e => this.actions.songPause(e),
                this.formSongPlayback.createIcon('pause'),
                "Pause Song");
            this.fieldSongPlaybackStop = this.formSongPlayback.addButton('pause',
                e => this.actions.songStop(e),
                this.formSongPlayback.createIcon('stop'),
                "Stop Song");

            this.fieldSongFileLoad = this.formSongFile.addFileInput('file-load', //TODO: icon file?
                e => this.actions.songFileLoad(e),
                this.formSongPlayback.createIcon('file-load'),
                `.json,.mid,.midi`,
                "Save Song to File"
            );
            this.fieldSongFileSave = this.formSongFile.addButton('file-save',
                e => this.actions.songFileSave(e),
                this.formSongPlayback.createIcon('file-save'),
                "Save Song to File"
            );

            this.fieldSongVolume = this.formSongVolume.addRangeInput('volume',
                (e, newVolume) => this.actions.setSongVolume(e, newVolume), 1, 100);
            this.fieldSongPosition = this.formSongPosition.addTextInput('position',
                e => this.editor.actions.setTrackerSelection(e),
                'Song Position',
                '00:00:0000'
            );
            this.fieldSongName = this.formSongName.addTextInput('name',
                (e, newSongName) => this.actions.setSongName(e, newSongName), "Song Name");
            this.fieldSongVersion = this.formSongVersion.addTextInput('version',
                (e, newSongVersion) => this.actions.setSongVersion(e, newSongVersion));
        }

        this.fieldSongPlaybackPause.disabled = true;

        this.fieldSongName.value = this.song.getName();
        this.fieldSongVersion.value = this.song.getVersion();

    }

    renderInstrument(instrumentID, instrument=null) {
        const instrumentPanel = this.panelInstruments;
        // this.headerElm.innerHTML = `${instrumentIDHTML}: Loading...`;

        let instrumentForm = instrumentPanel.getOrCreateForm(instrumentID);

        const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);
        instrumentForm.clearInputs();
        instrumentForm.classList.add('instrument-container');

        const instrumentToggleButton = instrumentForm.addButton('instrument-id',
            null, //TODO: toggle view
            instrumentIDHTML + ':'
        );
        instrumentToggleButton.classList.add('show-on-focus');

        // instrumentForm.addTextInput('instrument-name',
        //     (e, newInstrumentName) => this.actions.setInstrumentName(e, instrumentID, newInstrumentName),
        //     'Instrument Name',
        //     '',
        //     'Unnamed'
        // );

        if(!instrument) {
            // Render 'empty' instrument
            instrumentForm.addSelectInput('instrument-add-url',
                (e, changeInstrumentURL) => this.actions.songReplaceInstrument(e, instrumentID, changeInstrumentURL),
                (addOption) => {
                    addOption('', 'Add Instrument');
                    this.values.getValues('instruments-available', addOption)
                },
                'Add Instrument',
                '');

            instrumentForm.addBreak();
        }


        if(instrument) {
            try {
                if (instrument instanceof HTMLElement) {
                    instrument.setAttribute('data-id', instrumentID+'');
                    instrumentForm.appendChild(instrument);

                } else if (typeof instrument.render === "function") {
                    const renderedHTML = instrument.render(instrumentForm);
                    if(renderedHTML)
                        instrumentForm.innerHTML = renderedHTML;
                } else {
                    throw new Error("No Renderer");
                }

            } catch (e) {
                instrumentForm.innerHTML = e;
            }
        }
    }

    renderInstruments() {
        const instrumentPanel = this.panelInstruments;

        const renderInstrumentContainer = (instrumentID, instrument=null) => {
        };

        const instrumentList = this.song.getInstrumentList();
        for(let instrumentID=0; instrumentID<instrumentList.length; instrumentID++) {
            let instrument = this.song.getInstrument(instrumentID, false);

            this.renderInstrument(instrumentID, instrument);
            // TODO Update selected
        }


        this.renderInstrument(instrumentList.length, null);
        // renderInstrumentContainer(instrumentList.length+1);
    }

    renderMenu() {
        this.menuFile.populate = (e) => {
            const menu = e.menuElement;
            const menuFileNewSong = menu.getOrCreateSubMenu('new', 'New song');
            menuFileNewSong.action = (e) => this.actions.loadNewSongData(e);




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
                menuFileSaveSongToMemory.action = (e) => this.actions.saveSongToMemory(e);
                const menuFileSaveSongToFile = menuFileSaveSong.getOrCreateSubMenu('to File');
                menuFileSaveSongToFile.action = (e) => this.actions.saveSongToFile(e);
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
            menuViewToggleFullscreen.action = (e) => this.actions.toggleFullscreen(e);

            const menuViewToggleFormSong = menu.getOrCreateSubMenu('forms-song',
                `${this.containerElm.classList.contains('hide-panel-song') ? 'Show' : 'Hide'} Song Forms `);
            menuViewToggleFormSong.action = (e) => this.actions.togglePanelSong(e);

            const menuViewToggleFormTrack = menu.getOrCreateSubMenu('forms-tracker',
                `${this.containerElm.classList.contains('hide-panel-tracker') ? 'Show' : 'Hide'} Track Forms`);
            menuViewToggleFormTrack.action = (e) => this.actions.togglePanelTracker(e);

            const menuViewToggleFormInstrument = menu.getOrCreateSubMenu('forms-instruments',
                `${this.containerElm.classList.contains('hide-panel-instruments') ? 'Show' : 'Hide'} Instrument Forms`);
            menuViewToggleFormInstrument.action = (e) => this.actions.togglePanelInstruments(e);
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
//                         this.fieldSongAddInstrument.value = instrumentURL;
                        this.actions.songAddInstrument(e, instrumentURL);
                    }
                });
            };


            let instrumentCount = 0;
            this.values.getValues('song-instruments', (instrumentID, label) => {
                const isActive = this.song.isInstrumentLoaded(instrumentID);

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
                                this.actions.songReplaceInstrument(e, instrumentID, instrumentURL);
                                // this.onAction(e, 'song:replace-instrument', {id: instrumentID, url: instrumentURL});
                            }
                        });
                    };


                    const menuInstrumentRemove = menu.getOrCreateSubMenu('remove', `Remove From Song`);
                    menuInstrumentRemove.action = (e) => {
                        this.actions.songRemoveInstrument(e, instrumentID);
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
        this.trackerElm.update();
        // this.instruments.update();
    }

    selectGroup(groupName) {
        this.status.groupHistory = this.status.groupHistory.filter(historyGroup => historyGroup === this.status.currentGroup);
        this.status.groupHistory.unshift(this.status.currentGroup);
        this.status.currentGroup = groupName;
        console.log("Group Change: ", groupName, this.status.groupHistory);
        this.trackerElm.groupName = groupName;
        // this.trackerElm = new AudioSourceComposerTracker(this, groupName);
        this.render();
    }

    // selectInstructions(indicies=null) {
    //     this.status.getSelectedIndicies() = [];
    //     if(typeof indicies === "number") {
    //         this.status.getSelectedIndicies() = [indicies];
    //     } else             if(Array.isArray(indicies)) {
    //         this.status.getSelectedIndicies() = indicies;
    //     } else if (typeof indicies === "function") {
    //         let selectedIndicies = [];
    //         this.song.eachInstruction(this.status.currentGroup, (index, instruction, stats) => {
    //             if (indicies(index, instruction, stats))
    //                 selectedIndicies.push(index);
    //         });
    //
    //         this.getSelectedIndicies()(selectedIndicies);
    //         return;
    //     } else {
    //         throw console.error("Invalid indicies", indicies);
    //     }
    //     this.update();
    //     // this.trackerElm.focus();
    //     // console.log("selectInstructions", this.status.getSelectedIndicies());
    // }

    playSelectedInstructions() {
        this.song.stopPlayback();
        const selectedIndicies = this.status.getSelectedIndicies();
        for(let i=0; i<selectedIndicies.length; i++) {
            this.song.playInstructionAtIndex(this.status.currentGroup, selectedIndicies[i]);
        }
    }
    // selectInstructions2(groupName, selectedRange=null, selectedIndicies=null) {
    //     if(selectedIndicies === null)
    //         selectedIndicies = [0]
    //     if (!Array.isArray(selectedIndicies))
    //         selectedIndicies = [selectedIndicies];
    //     this.status.getSelectedIndicies() = selectedIndicies;
    //     if(this.status.currentGroup !== groupName) {
    //         this.status.groupHistory = this.status.groupHistory.filter(historyGroup => historyGroup === this.status.currentGroup);
    //         this.status.groupHistory.unshift(this.status.currentGroup);
    //         this.status.currentGroup = groupName;
    //         console.log("Group Change: ", groupName, this.status.groupHistory);
    //         this.trackerElm = new SongEditorGrid(this, groupName);
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
    //     this.trackerElm.focus();
    // }

//     getScriptDirectory(appendPath='') {
//         const scriptElm = document.head.querySelector('script[src$="audio-source-composer-element.js"],script[src$="audio-source-composer.min.js"]');
//         const basePath = scriptElm.src.split('/').slice(0, -2).join('/') + '/';
// //         console.log("Base Path: ", basePath);
//         return basePath + appendPath;
//     }

    /** Ajax Loading **/



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
        console.info("Appending " + linkHRef);
    }
}
customElements.define('audio-source-composer', AudioSourceComposerElement);

