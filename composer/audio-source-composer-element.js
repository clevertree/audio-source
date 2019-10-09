


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

    get tracker() { return this.shadowDOM.querySelector('asc-tracker'); }
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
            'note:play',
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

//         console.log(e.target, e.type);

        // try {
            switch(e.type) {
                case 'focus':
                    break;
                default:
                    this.song.getAudioContext();
            }
        // if(this !== document.activeElement && !this.contains(document.activeElement)) {
        //     console.log("Focus", document.activeElement);
        //     this.focus();
        // }
        switch(e.type) {
            // case 'submit':
            //     e.preventDefault();
            //     this.onSubmit(e);
            //     break;
            // case 'change':
            // case 'blur':
            //     if(e.target.form && e.target.form.classList.contains('submit-on-' + e.type))
            //         this.onSubmit(e);
            //     break;

            case 'focus':
                // TODO: refactor
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

    async onSongEvent(e) {
//         console.log("Song Event: ", e.type);
        if(this.tracker)
            this.tracker.onSongEvent(e);
        switch(e.type) {
            case 'song:seek':
                this.updateSongPositionValue(e.detail.position);

                break;

            case 'song:loaded':
                this.tracker.renderDuration = this.song.timeDivision;
                break;
            case 'song:play':
                this.classList.add('playing');
                this.containerElm.classList.add('playing');

                let lastGroupPositionInTicks = 0;
                let songPromise = e.detail.promise;
                let songPlayback = e.detail.playback;
                // let intervalCount = 0;
                const updateSongPositionInterval = setInterval(e => {
                    // this.updateSongPositionValue(this.song.songPlaybackPosition);
                    // if(intervalCount % 10 === 0) {
                    //     // if (songPlayback.groupPositionInTicks > lastGroupPositionInTicks) {
                    //     const estimateSongPositionInTicks = this.song.estimateSongPositionInTicks();
                    //     this.tracker.setPlaybackPositionInTicks(estimateSongPositionInTicks);
                    //     // }
                    // }
                    // intervalCount++;
                }, 10);
                await songPromise;
                clearInterval(updateSongPositionInterval);
                this.classList.remove('playing');
                this.containerElm.classList.remove('playing');
                break;

            case 'song:pause':
                this.classList.add('paused');
                this.containerElm.classList.add('paused');
                break;
            case 'song:end':
                clearInterval(this.updateSongPositionInterval);
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
            case 'instrument:remove':
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

    get panelSong() { return this.shadowDOM.querySelector(`asc-form[key='song']`)}
    get panelTracker() { return this.shadowDOM.querySelector(`asc-form[key='tracker']`)}
    get panelTrackerRowSegments() { return this.shadowDOM.querySelector(`asc-form[key='tracker-row-segments']`)}
    get panelInstruction() { return this.shadowDOM.querySelector(`asc-form[key='instruction']`)}
    get panelInstruments() { return this.shadowDOM.querySelector(`asc-form[key='instruments']`)}

    render() {
        const Libraries = new AudioSourceLibraries;
        const linkHRefComposer = Libraries.getScriptDirectory('composer/audio-source-composer.css');
        const linkHRefCommon = Libraries.getScriptDirectory('common/audio-source-common.css');

        this.shadowDOM.innerHTML = `
        <link rel="stylesheet" href="${linkHRefComposer}" />
        <link rel="stylesheet" href="${linkHRefCommon}" />
        <div class="asc-container">
            <div class="asc-menu-container">
                <asc-menu key="file" caption="File"></asc-menu>
                <asc-menu key="edit" caption="Edit"></asc-menu>
                <asc-menu key="view" caption="View"></asc-menu>
                <asc-menu key="instrument" caption="Instrument"></asc-menu>
                <asc-menu key="context" caption=""></asc-menu>
            </div>
            <asc-form key="song" caption="Song" class="panel"></asc-form><!--
            --><asc-form key="instruments" caption="Song Instruments" class="panel"></asc-form>
            <br/>
            <asc-form key="tracker" caption="Tracker" class="panel"></asc-form><!--
            --><asc-form key="instruction" caption="Selected Instruction(s)" class="panel"></asc-form><!--
            --><asc-form key="tracker-row-segments" caption="Tracker Segments" class="panel"></asc-form>
            <br/>

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


    /** Song Forms **/

    get formSongPlayback()          { return this.panelSong.getOrCreateForm('playback', 'Playback'); }
    get formSongPosition()          { return this.panelSong.getOrCreateForm('position', 'Position'); }
    get formSongVolume()            { return this.panelSong.getOrCreateForm('volume', 'Volume'); }
    get formSongFile()              { return this.panelSong.getOrCreateForm('file', 'File'); }
    get formSongName()              { return this.panelSong.getOrCreateForm('name', 'Name'); }
    get formSongVersion()           { return this.panelSong.getOrCreateForm('version', 'Version'); }

    /** Tracker Fields **/

    get fieldSongPlaybackPlay() {
        return this.formSongPlayback.getInput('play', false)
            || this.formSongPlayback.addIconButton('play', e => this.actions.songPlay(e),
                `play`,
                "Play Song");
    }
    get fieldSongPlaybackPause() {
        return this.formSongPlayback.getInput('pause', false)
            || this.formSongPlayback.addIconButton('pause', e => this.actions.songPause(e),
                `pause`,
                "Pause Song");
    }
    get fieldSongPlaybackStop() {
        return this.formSongPlayback.getInput('stop', false)
            || this.formSongPlayback.addIconButton('pause', e => this.actions.songStop(e),
                `stop`,
                "Stop Song");
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
            || this.formSongName.addTextInput('name', (e, newSongName) => this.actions.setSongName(e, newSongName), "Song Name", 'Unnamed');
    }
    get fieldSongVersion() {
        return this.formSongVersion.getInput('version', false)
            || this.formSongVersion.addTextInput('version', (e, newSongVersion) => this.actions.setSongVersion(e, newSongVersion), "Song Version", '0.0.0');
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
            || this.formSongFile.addIconButton('file-save',
                e => this.actions.songFileSave(e),
                `file-save`,
                "Save Song to File"
            );
    }

    // get fieldSongAddInstrument()

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

    renderInstrument(instrumentID, instrument=null) {
        const instrumentPanel = this.panelInstruments;
        // this.headerElm.innerHTML = `${instrumentIDHTML}: Loading...`;

        let instrumentForm = instrumentPanel.getOrCreateForm(instrumentID);

        const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);
        instrumentForm.clearInputs();

        instrumentForm.addButton('instrument-id',
            null, //TODO: toggle view
            instrumentIDHTML + ':'
        );

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
                `${this.containerElm.classList.contains('hide-forms-song') ? 'Show' : 'Hide'} Song Forms `);
            menuViewToggleFormSong.action = (e) => this.actions.togglePanelSong(e);

            const menuViewToggleFormTrack = menu.getOrCreateSubMenu('forms-tracker',
                `${this.containerElm.classList.contains('hide-forms-tracker') ? 'Show' : 'Hide'} Track Forms`);
            menuViewToggleFormTrack.action = (e) => this.actions.togglePanelTracker(e);

            const menuViewToggleFormInstrument = menu.getOrCreateSubMenu('forms-instruments',
                `${this.containerElm.classList.contains('hide-forms-instruments') ? 'Show' : 'Hide'} Instrument Forms`);
            menuViewToggleFormInstrument.action = (e) => this.actions.togglePanelInstrument(e);
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
            this.song.eachInstruction(this.status.currentGroup, (index, instruction, stats) => {
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
        this.song.stopPlayback();
        const selectedIndicies = this.status.selectedIndicies;
        for(let i=0; i<selectedIndicies.length; i++) {
            this.song.playInstructionAtIndex(this.status.currentGroup, selectedIndicies[i]);
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

