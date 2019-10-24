


class AudioSourceComposerElement extends HTMLElement {
    constructor() {
        super();
        this.versionString = '-1';
        this.eventHandlers = [];
        this.saveSongToMemoryTimer = null;
        // this.instrumentLibrary = null;

        this.longPressTimeout = null;
        this.doubleClickTimeout = 500;
        this.autoSaveTimeout = 4000;

        this.keyboard = new AudioSourceComposerKeyboard();

        this.song = new AudioSourceSong({}, this);
        // this.player = null;
        // this.status = {
        //     groupHistory: [],
        //     // previewInstructionsOnSelect: false,
        //     longPressTimeout: 500,
        //     doubleClickTimeout: 500,
        //     autoSaveTimeout: 4000,
        // };
        this.shadowDOM = null;

        this.actions = new AudioSourceComposerActions(this);
        this.values = new AudioSourceValues(this.song);
        const Util = new AudioSourceUtilities;
        // Util.loadLibrary(defaultLibraryURL);
        Util.loadPackageInfo()
            .then(packageInfo => this.setVersion(packageInfo.version));

        window.addEventListener('unload', e => this.saveState(e));
    }

    get trackerElm() { return this.shadowDOM.querySelector('asc-tracker'); }
    get containerElm() { return this.shadowDOM.querySelector('.asc-container'); }

    getScriptDirectory(appendPath=null) {
        const Util = new AudioSourceUtilities;
        return Util.getScriptDirectory(appendPath);
    }

    get defaultLibraryURL()      { return this.getAttribute('defaultLibraryURL') || this.getScriptDirectory('default.library.json'); }
    set defaultLibraryURL(url)   { this.setAttribute('defaultLibraryURL', url); }

    connectedCallback() {
        this.loadCSS();

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


        this.loadState();

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


    async loadState(e=null) {

        const storage = new AudioSourceStorage();
        const state = storage.loadState();
        console.log('loadState', state);

        await this.loadDefaultSong(state ? state.songGUID : null);


        if(state) {
            this.trackerElm.groupName = state.groupName;
            this.trackerElm.navigateSegment(state.currentRowSegmentID);
            this.trackerElm.selectIndicies(e, state.selectedIndicies);
        }
    }


    async saveState(e) {
        // await this.actions.saveSongToMemory(e);
        const state = {
            songGUID: this.song.guid,
            groupName: this.trackerElm.groupName,
            currentRowSegmentID: this.trackerElm.currentRowSegmentID,
            selectedIndicies: this.trackerElm.getSelectedIndicies()
        };
        const storage = new AudioSourceStorage();
        storage.saveState(state);
        // console.log('saveState', state);
    }



    async loadDefaultSong(recentSongGUID=null) {

        const src = this.getAttribute('src');
        if(src) {
            await this.actions.loadSongFromSrc(src);
            return true;
        }

        if(recentSongGUID) {
            await this.actions.loadSongFromMemory(recentSongGUID);
            return;
        }

        // if(await this.actions.loadRecentSongData())
        //     return true;

        await this.actions.loadNewSongData();
        return false;
    }

    getAudioContext()   { return this.song.getAudioContext(); }



    /** Playback **/


    updateSongPositionValue(playbackPositionInSeconds) {
        const values = new AudioSourceValues();
        this.fieldSongPosition.value = values.formatPlaybackPosition(playbackPositionInSeconds);
    }


    // Input

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
                this.saveSongToMemoryTimer = setTimeout(e => this.actions.saveSongToMemory(e), this.autoSaveTimeout);
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

    setStatus(newStatus) {
        // console.info.apply(null, arguments); // (newStatus);
        this.statusElm.innerHTML = newStatus;
    }

    handleError(err) {
        this.setStatus(`<span style="red">${err}</span>`);
        console.error(err);
        // if(this.webSocket)
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
    get menuTools() { return this.shadowDOM.querySelector(`asui-menu[key="tools"]`)}
    get menuGroup() { return this.shadowDOM.querySelector(`asui-menu[key="group"]`)}
    // get menuSelect() { return this.shadowDOM.querySelector(`asui-menu[key="select"]`)}
    get menuInstrument() { return this.shadowDOM.querySelector(`asui-menu[key="instrument"]`)}
    get menuContext() { return this.shadowDOM.querySelector(`asui-menu[key="context"]`)}

    get panelSong() { return this.shadowDOM.querySelector(`asui-form[key='song']`)}
    get panelTracker() { return this.shadowDOM.querySelector(`asui-form[key='tracker']`)}
    get panelTrackerGroups() { return this.shadowDOM.querySelector(`asui-form[key='tracker-groups']`)}
    get panelTrackerRowSegments() { return this.shadowDOM.querySelector(`asui-form[key='tracker-row-segments']`)}
    get panelInstruction() { return this.shadowDOM.querySelector(`asui-form[key='instruction']`)}
    get panelInstruments() { return this.shadowDOM.querySelector(`asui-form[key='instruments']`)}

    render(force=false) {
        const Util = new AudioSourceUtilities;
        const linkHRefComposer = Util.getScriptDirectory('composer/audio-source-composer.css');
        const linkHRefCommon = Util.getScriptDirectory('common/audio-source-common.css');

        let renderTracker = true;
        if(force || !this.shadowDOM) {
            renderTracker = false;
            this.shadowDOM = this.shadowDOM || this.attachShadow({mode: 'open'});
            this.shadowDOM.innerHTML = `
            <link rel="stylesheet" href="${linkHRefComposer}" />
            <link rel="stylesheet" href="${linkHRefCommon}" />
            <div class="asc-container">
                <div class="asui-menu-container">
                    <asui-menu key="file" caption="File"></asui-menu>
                    <asui-menu key="edit" caption="Edit"></asui-menu>
                    <asui-menu key="group" caption="Group"></asui-menu>
                    <asui-menu key="instrument" caption="Instrument"></asui-menu>
                    <asui-menu key="view" caption="View"></asui-menu>
                    <asui-menu key="tools" caption="Tools"></asui-menu>
                    <asui-menu key="context" caption=""></asui-menu>
                </div>
                <asui-form key="song" caption="Song" class="panel"></asui-form><!--
                --><asui-form key="instruments" caption="Song Instruments" class="panel"></asui-form>
                <asui-form key="instruction" caption="Selected Instruction(s)" class="panel"></asui-form><!--
                --><asui-form key="tracker" caption="Tracker" class="panel"></asui-form><!--
                --><asui-form key="tracker-groups" caption="Tracker Groups" class="panel"></asui-form><!--
                --><asui-form key="tracker-row-segments" caption="Tracker Segments" class="panel"></asui-form>
                <asc-tracker group="root"></asc-tracker>
            </div>
            <div class="asc-status-container">
                <span class="status-text"></span>
                <a href="https://github.com/clevertree/audio-source-composer" target="_blank" class="version-text">${this.versionString}</a>
            </div>
            `;
        }

        this.containerElm.classList.toggle('fullscreen', this.classList.contains('fullscreen'));

        this.renderMenu();
        this.renderSongForms();
        this.renderInstruments();
        if(renderTracker)
            this.trackerElm.render();
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

            this.fieldSongFileLoad = this.formSongFile.addFileInput('file-load',
                e => this.actions.loadSongFromFileInput(e),
                this.formSongPlayback.createIcon('file-load'),
                `.json,.mid,.midi`,
                "Load Song from File"
            );
            this.fieldSongFileSave = this.formSongFile.addButton('file-save',
                e => this.actions.saveSongToFile(e),
                this.formSongPlayback.createIcon('file-save'),
                "Save Song to File"
            );

            this.fieldSongVolume = this.formSongVolume.addRangeInput('volume',
                (e, newVolume) => this.actions.setSongVolume(e, newVolume), 1, 100);
            this.fieldSongPosition = this.formSongPosition.addTextInput('position',
                e => this.actions.setSongPosition(e),
                'Song Position',
                '00:00:000'
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


        if(!instrument) {
            // Render 'empty' instrument
            instrumentForm.addSelectInput('instrument-add-url',
                (e, changeInstrumentURL) => this.actions.songAddInstrument(e, changeInstrumentURL),
                async (addOption) => {
                    addOption('', 'Add Instrument');
                    const instrumentLibrary = await AudioSourceLibrary.loadURL(this.defaultLibraryURL);
                    instrumentLibrary.eachInstrument((instrumentConfig) => {
                        addOption(instrumentConfig.url, instrumentConfig.name);
                    });
                },
                'Add Instrument');

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
                    instrumentForm.innerHTML = "No Renderer";
                }

            } catch (e) {
                instrumentForm.innerHTML = e;
            }
        }
    }

    renderInstruments() {

        const instrumentList = this.song.getInstrumentList();
        for(let instrumentID=0; instrumentID<instrumentList.length; instrumentID++) {
            let instrument = this.song.getInstrument(instrumentID, false);

            this.renderInstrument(instrumentID, instrument);
            // TODO Update selected
        }


        this.renderInstrument(instrumentList.length, null);
    }

    renderMenu() {
        /** File Menu **/
        this.menuFile.populate = (e) => {
            const menu = e.menuElement;
            const menuFileNewSong = menu.getOrCreateSubMenu('new', 'New song');
            menuFileNewSong.action = (e) => this.actions.loadNewSongData(e);




            const menuFileOpenSong = menu.getOrCreateSubMenu('open', 'Open song ►');
            menuFileOpenSong.populate = (e) => {
                const menuFileOpenSongFromMemory = menuFileOpenSong.getOrCreateSubMenu('memory', 'from Memory ►');
                menuFileOpenSongFromMemory.populate = async (e) => {
                    const menu = e.menuElement;

                    const Storage = new AudioSourceStorage();
                    const songRecentUUIDs = await Storage.getRecentSongList() ;
                    for(let i=0; i<songRecentUUIDs.length; i++) {
                        const entry = songRecentUUIDs[i];
                        const menuOpenSongUUID = menu.getOrCreateSubMenu(entry.guid, entry.title);
                        menuOpenSongUUID.action = (e) => {
                            this.actions.loadSongFromMemory(entry.guid);
                        }
                    }

                };

                const menuFileOpenSongFromFile = menuFileOpenSong.getOrCreateSubMenu('file', `from File`);
                menuFileOpenSongFromFile.action = (e) => this.fieldSongFileLoad.inputElm.click(); // this.actions.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
                // menuFileOpenSongFromFile.disabled = true;
                const menuFileOpenSongFromURL = menuFileOpenSong.getOrCreateSubMenu('url', 'from URL');
                menuFileOpenSongFromURL.disabled = true;
            };

            const menuFileSaveSong = menu.getOrCreateSubMenu('save', 'Save song ►');
            menuFileSaveSong.populate = (e) => {
                const menuFileSaveSongToMemory = menuFileSaveSong.getOrCreateSubMenu('memory', 'to Memory');
                menuFileSaveSongToMemory.action = (e) => this.actions.saveSongToMemory(e);
                const menuFileSaveSongToFile = menuFileSaveSong.getOrCreateSubMenu('file', 'to File');
                menuFileSaveSongToFile.action = (e) => this.actions.saveSongToFile(e);
            };

            const menuFileImportSong = menu.getOrCreateSubMenu('import', 'Import song ►');
            menuFileImportSong.populate = (e) => {
                const menuFileImportSongFromMIDI = menuFileImportSong.getOrCreateSubMenu('midi', 'from MIDI File');
                menuFileImportSongFromMIDI.action = (e) => this.fieldSongFileLoad.inputElm.click(); // this.actions.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
                // menuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
                // menuFileImportSongFromMIDI.disabled = true;
            };

            const menuFileExportSong = menu.getOrCreateSubMenu('export', 'Export song ►');
            menuFileExportSong.disabled = true;
            menuFileExportSong.populate = (e) => {
                const menuFileExportSongToMIDI = menuFileExportSong.getOrCreateSubMenu('midi', 'to MIDI File');
                menuFileExportSongToMIDI.disabled = true;
            };
        };

        /** View Menu **/
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


        /** Instrument Menu **/
        this.menuInstrument.populate = (e) => {
            const menu = e.menuElement;

            const menuInstrumentAdd = menu.getOrCreateSubMenu('instrument', `Add Instrument To Song ►`);
            menuInstrumentAdd.populate = async (e) => {
                const menu = e.menuElement;

                const instrumentLibrary = await AudioSourceLibrary.loadURL(this.defaultLibraryURL);
                instrumentLibrary.eachInstrument((instrumentConfig) => {
                    const menuInstrument = menu.getOrCreateSubMenu(instrumentConfig.url, `${instrumentConfig.name}`);
                    // menuInstrument.setAttribute('data-instrument', instrumentURL);
                    menuInstrument.action = (e) => {
//                         this.fieldSongAddInstrument.value = instrumentURL;
                        this.actions.songAddInstrument(e, instrumentConfig);
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
                    menuInstrumentChange.populate = async (e) => {
                        const menu = e.menuElement;

                        const instrumentLibrary = await AudioSourceLibrary.loadURL(this.defaultLibraryURL);
                        instrumentLibrary.eachInstrument((instrumentConfig) => {
                            const menuInstrument = menu.getOrCreateSubMenu(instrumentConfig.url, `${instrumentConfig.name}`);
                            menuInstrument.action = (e) => {
                                this.actions.songReplaceInstrument(e, instrumentID, instrumentConfig);
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


        /** Group Menu **/
        this.menuGroup.populate = (e) => {
            const menu = e.menuElement;

            const menuGroupAdd = menu.getOrCreateSubMenu('new', `Add Group To Song`);
            menuGroupAdd.action = (e) => {
                this.actions.songGroupAddNew(e);
            };


            let groupCount = 0;
            this.values.getValues('song-groups', (groupName) => {
                const menuGroup = menu.getOrCreateSubMenu(groupName, `${groupName} ►`);
                menuGroup.populate = (e) => {
                    const menu = e.menuElement;

                    const menuInstrumentChange = menu.getOrCreateSubMenu('change', `Rename`);
                    menuInstrumentChange.action = (e) => {
                        this.actions.songGroupRename(e, groupName);
                    };


                    const menuInstrumentRemove = menu.getOrCreateSubMenu('remove', `Remove From Song`);
                    menuInstrumentRemove.action = (e) => {
                        this.actions.songGroupRemove(e, groupName);
                    };
                };
                if(groupCount === 0)
                    menuGroup.hasBreak = true;
                groupCount++;
            });
        };

        /** Tool Menu **/
        this.menuTools.populate = (e) => {
            const menu = e.menuElement;

            const menuToolBatch = menu.getOrCreateSubMenu('batch', `Batch Command ►`);
            menuToolBatch.populate = (e) => {
                const menu = e.menuElement;
                const menuToolBatchCommandNew = menu.getOrCreateSubMenu('new', `Run Batch Command`);
                menuToolBatchCommandNew.action = (e) => {
                    this.actions.batchRunCommand(e);
                };

                const storage = new AudioSourceStorage();
                const recentBatchCommands = storage.getBatchRecentCommands();
                for(let i=0; i<recentBatchCommands.length; i++) {
                    const recentBatchCommand = recentBatchCommands[i];
                    // let title = recentBatchCommand.match(/\/\*\*([^*/]+)/)[1].trim() || recentBatchCommand;
                    const menuToolBatchCommand = menu.getOrCreateSubMenu(i, recentBatchCommand);
                    menuToolBatchCommand.action = (e) => {
                        this.actions.batchRunCommand(e, recentBatchCommand, true);
                    };

                }
            };
        };

    }

    /** Utilities **/


    /** Javascript Libraries **/

    get sources() {
        return {
            'MidiParser': [
                this.getScriptDirectory('assets/3rdparty/MidiParser/main.js'),
                'https://cdn.jsdelivr.net/gh/colxi/midi-parser-js/src/main.js'
            ],
            'LZString': [
                this.getScriptDirectory('assets/3rdparty/LZString/lz-string.min.js'),
                'https://cdn.jsdelivr.net/gh/pieroxy/lz-string/libs/lz-string.min.js'
            ]
        }
    }


    async loadJSLibrary(libraryName, test=null) {
        if(!test)
            test = () => typeof window[libraryName] !== 'undefined';
        if(test())
            return true;
        const sources = this.sources[libraryName];
        for(let i=0; i<sources.length; i++) {
            await this.loadScript(sources[i]);
            if(test())
                return true;
        }
        throw new Error(`Failed to load ${libraryName} Library`);

    }

    async getMidiParser() {
        if(typeof window.MidiParser === 'undefined')
            await this.loadJSLibrary('MidiParser');
        return window.MidiParser;
    }


    async getLZString() {
        if(typeof window.LZString === 'undefined')
            await this.loadJSLibrary('LZString');
        return window.LZString;
    }




    /** Package Info **/

    async loadPackageInfo(force=false) {
        const Util = new AudioSourceUtilities;
        const url = Util.getScriptDirectory('package.json');

        let packageInfo = AudioSourceLibraries.packageInfo;
        if (!force && packageInfo)
            return packageInfo;

        packageInfo = await this.loadJSON(url);
        if(!packageInfo.version)
            throw new Error("Invalid package version: " + url);

        console.log("Package Version: ", packageInfo.version, packageInfo);
        AudioSourceLibraries.packageInfo = packageInfo;
        return packageInfo;
    }


    /** Utilities **/

    getScriptElement() {
        return document.head.querySelector('script[src$="audio-source-composer-element.js"],script[src$="audio-source-composer.min.js"]');
    }


    getScriptDirectory(appendPath='') {
        const scriptElm = this.getScriptElement(); // document.head.querySelector('script[src$="audio-source-composer-element.js"],script[src$="audio-source-composer.min.js"]');
        const basePath = scriptElm.src.split('/').slice(0, -2).join('/') + '/';
//         console.log("Base Path: ", basePath);
        return basePath + appendPath;
    }

    async loadScript(src) {
        await new Promise((resolve, reject) => {
            const newScriptElm = document.createElement('script');
            newScriptElm.src = src;
            newScriptElm.onload = e => resolve();
            document.head.appendChild(newScriptElm);
        });
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

    /** Ajax Loading **/

    loadCSS() {
        const targetDOM = this.shadowDOM || document.head;
        if(targetDOM.querySelector('link[href$="audio-source-composer.css"]'))
            return;

        const Util = new AudioSourceUtilities();
        const linkHRef = Util.getScriptDirectory('composer/audio-source-composer.css');
        let cssLink=document.createElement("link");
        cssLink.setAttribute("rel", "stylesheet");
        cssLink.setAttribute("type", "text/css");
        cssLink.setAttribute("href", linkHRef);
        targetDOM.appendChild(cssLink);
        console.info("Appending " + linkHRef);
    }
}
customElements.define('audio-source-composer', AudioSourceComposerElement);

