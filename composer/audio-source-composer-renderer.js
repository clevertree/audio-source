(async function() {


    /** Register Script Exports **/
    function getThisScriptPath() { return 'composer/audio-source-composer-renderer.js'; }
    const exportThisScript = function(module) {
        module.exports = {AudioSourceComposerRenderer};
    };

    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();

    const {AudioSourceLibrary} = await requireAsync('common/audio-source-library.js');
    const {
        ASUIComponent,
        ASUIDiv,
        ASUIMenu,
        ASUIGrid,
        ASUIGridRow,
        ASUIButtonInput,
        ASUIFileInput,
        ASUIRangeInput,
        ASUISelectInput,
        ASUITextInput,
        ASUIcon,
    } = await requireAsync('common/audio-source-ui.js');

    class AudioSourceComposerRenderer extends ASUIComponent {
        constructor() {
            super();
            this.shadowDOM = null;
        }
        get targetElm() { return this.shadowDOM; }

        createStyleSheetLink(stylePath) {
            const linkHRef = this.getScriptDirectory(stylePath);
            const link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.href = linkHRef;
            return link;
        }

        connectedCallback() {
            this.shadowDOM = this.attachShadow({mode: 'closed'});

            // this.loadCSS();
            super.connectedCallback();

            this.addEventHandler(['focus', 'dragover', 'drop'], e => this.onInput(e), this.shadowDOM, true);
            // 'change', 'submit',

            this.addEventHandler([
                'song:loaded', 'song:play', 'song:end', 'song:stop', 'song:modified', 'song:seek',
                'group:play', 'group:seek',
                'note:start', 'note:end'
            ], this.onSongEvent);
            this.addEventHandler([
                    'instrument:instance',
                    'instrument:library',
                    'instrument:modified',
                    'instrument:added',
                    'instrument:removed'],
                e => this.onSongEvent(e), document);

            this.focus();


            this.loadState();

            this.loadMIDIInterface(e => this.onInput(e));        // TODO: wait for user input
        }



        loadMIDIInterface(callback) {
            // TODO: wait for user input
            if (navigator.requestMIDIAccess) {
                navigator.requestMIDIAccess().then(
                    (MIDI) => {
                        console.info("MIDI initialized", MIDI);
                        const inputDevices = [];
                        MIDI.inputs.forEach(
                            (inputDevice) => {
                                inputDevices.push(inputDevice);
                                inputDevice.addEventListener('midimessage', callback);
                            }
                        );
                        console.log("MIDI input devices detected: " + inputDevices.map(d => d.name).join(', '));
                    },
                    (err) => {
                        throw new Error("error initializing MIDI: " + err);
                    }
                );
            }
        }

        async render() {
            return [
                this.createStyleSheetLink('composer/assets/audio-source-composer.css'),
                this.createStyleSheetLink('common/assets/audio-source-common.css'),
                this.refs.containerElm = new ASUIDiv('asc-container', () => [
                    new ASUIDiv('asc-menu-container', () => [
                        this.refs.menuFile          = new ASUIMenu('File',      () => this.populateMenu('file')),
                        this.refs.menuEdit          = new ASUIMenu('Edit',      () => this.populateMenu('edit')),
                        this.refs.menuGroup         = new ASUIMenu('Group',     () => this.populateMenu('group')),
                        this.refs.menuInstrument    = new ASUIMenu('Insrument', () => this.populateMenu('instrument')),
                        this.refs.menuView          = new ASUIMenu('View',      () => this.populateMenu('view')),
                        this.refs.menuContext       = new ASUIMenu('Context',   () => this.populateMenu('context')),
                    ]),

                    this.refs.panelContainerElm = new ASUIDiv('asc-panel-container', () => [
                        new ASCPanel('song', 'Song', () => [

                            new ASCForm('playback',  'Playback',() => [
                                this.refs.fieldSongPlaybackPlay = new ASUIButtonInput('play',
                                    e => this.songPlay(e),
                                    new ASUIcon('play'),
                                    "Play Song"),
                                this.refs.fieldSongPlaybackPause = new ASUIButtonInput('pause',
                                    e => this.songPause(e),
                                    new ASUIcon('pause'),
                                    "Pause Song"),
                                // this.refs.fieldSongPlaybackPause.disabled = true;
                                this.refs.fieldSongPlaybackStop = new ASUIButtonInput('stop',
                                    e => this.songStop(e),
                                    new ASUIcon('stop'),
                                    "Stop Song")
                            ]),

                            new ASCForm('timing', () => [
                                this.refs.fieldSongTiming = new ASUITextInput('timing',
                                    (e, pos) => this.setSongPosition(e, pos),
                                    'Song Timing',
                                    '00:00:000'
                                )
                            ]),

                            new ASCForm('position', 'Position', () => [
                                this.refs.fieldSongPosition = new ASUIRangeInput('position',
                                    (e, pos) => this.setSongPosition(e, pos),
                                    0,
                                    Math.ceil(this.song.getSongLength()),
                                    'Song Position',
                                    0
                                )
                            ]),

                            new ASCForm('volume', 'Volume',() => [
                                this.refs.fieldSongVolume = new ASUIRangeInput('volume',
                                    (e, newVolume) => this.setSongVolume(e, newVolume), 1, 100, 'Song Volume', this.song.getVolumeValue())
                            ]),

                            new ASCForm('file', 'File', () => [
                                this.refs.fieldSongFileLoad = new ASUIFileInput('file-load',
                                    e => this.loadSongFromFileInput(),
                                    new ASUIcon('file-load'),
                                    `.json,.mid,.midi`,
                                    "Load Song from File"
                                ),
                                this.refs.fieldSongFileSave = new ASUIButtonInput('file-save',
                                    e => this.saveSongToFile(),
                                    new ASUIcon('file-save'),
                                    "Save Song to File"
                                ),
                            ]),


                            new ASCForm('name', 'Name', () => [
                                this.refs.fieldSongName = new ASUITextInput('name',
                                    (e, newSongName) => this.setSongName(e, newSongName), "Song Name")
                            ]),

                            new ASCForm('version', 'Version', () => [
                                this.refs.fieldSongVersion = new ASUITextInput('version',
                                    (e, newSongVersion) => this.setSongVersion(e, newSongVersion))
                            ]),

                            new ASCForm('bpm', 'BPM', () => [
                                this.refs.fieldSongBPM = new ASUITextInput('bpm',
                                    (e, newBPM) => this.setStartingBPM(e, parseInt(newBPM)))
                                // this.refs.fieldSongBPM.inputElm.setAttribute('type', 'number')
                            ]),
                        ]),

                        this.refs.panelInstruments = new ASCPanel('instruments', 'Instruments', () => {

                            // const instrumentPanel = this.refs.panelInstruments;
                            const instrumentList = this.song.getInstrumentList();
                            const content = instrumentList.map((instrumentConfig, instrumentID) =>
                                new ASCInstrumentRenderer(instrumentID));
                            
                            content.push(new ASCForm('new', 'Add Instrument', () => [
                                new ASUISelectInput('add-url',
                                (e, changeInstrumentURL) => this.songAddInstrument(e, changeInstrumentURL),
                                async (s) => [
                                    s.getOption('', 'Add Instrument'),
                                    await (async () => {
                                        const content = [];
                                        const instrumentLibrary = await AudioSourceLibrary.loadURL(this.defaultLibraryURL);
                                        instrumentLibrary.eachInstrument((instrumentConfig) => {
                                            content.push(s.getOption(instrumentConfig.url, instrumentConfig.name));
                                        });
                                        return content;
                                    })()
                                ],
                                'Add Instrument')
                            ]));
                            return content;
                        }),

                        this.refs.panelInstructions = new ASCPanel('instructions', 'Selected Instruction(s)', () => [
                            new ASCForm('instruction-command', 'Command', () => [
                                this.refs.fieldInstructionCommand = new ASUISelectInput(
                                    'command',
                                    (e, commandString) => this.setInstructionCommand(e, commandString),
                                    (selectElm) => [
                                        // const selectedInstrumentID = this.refs.fieldInstructionInstrument ? parseInt(this.refs.fieldInstructionInstrument.value) : 0;
                                        selectElm.getOption('', 'Select'),
                                        selectElm.getOptGroup('Frequencies'),
                                        this.values.getOctaveNoteFrequencies(selectElm.getOption),

                                        selectElm.getOptGroup('Custom Frequencies'),
                                        this.values.getAllNamedFrequencies(this.song, selectElm.getOption),
                                        // TODO: filter by selected instrument

                                        selectElm.getOptGroup('Groups'),
                                        this.values.getAllSongGroups(this.song, selectElm.getOption),
                                    ],
                                    'Instruction Instrument'),

                                this.refs.fieldInstructionInsert = new ASUIButtonInput(
                                    'insert',
                                    e => this.insertInstructionCommand(e),
                                    new ASUIcon('insert'),
                                    "Insert Instruction"),

                                this.refs.fieldInstructionDelete = new ASUIButtonInput('delete',
                                    e => this.deleteInstructionCommand(e),
                                    new ASUIcon('delete'),
                                    "Delete Instruction"),

                            ]),

                            new ASCForm('instruction-instrument', 'Instrument', () => [
                                this.refs.fieldInstructionInstrument = new ASUISelectInput('instrument',
                                    e => this.setInstructionInstrument(e),
                                    (selectElm) => [
                                        selectElm.getOption('', 'Select'),
                                        selectElm.getOptGroup('Song Instruments'),
                                        this.values.getSongInstruments(this.song, selectElm.getOption)
                                    ],
                                    'Instruction Instrument')
                            ]),

                            new ASCForm('instruction-velocity', 'Velocity', () => [
                                this.refs.fieldInstructionVelocity = new ASUIRangeInput('velocity',
                                    (e, newVelocity) => this.setInstructionVelocity(e, newVelocity), 1, 127)
                            ]),

                            new ASCForm('instruction-duration', 'Duration', () => [
                                this.refs.fieldInstructionDuration = new ASUISelectInput('duration',
                                    e => this.setInstructionDuration(e),
                                    (selectElm) => [
                                        selectElm.getOption('', 'No Duration'),
                                        this.values.getNoteDurations(this.song, selectElm.getOption)
                                    ],
                                    'Instruction Duration'),
                            ]),

                        ]),

                        this.refs.panelTracker = new ASCPanel('tracker', 'Tracker', () => [
                            new ASCForm('tracker-row-length', 'Row &#120491;', () => [
                                this.refs.fieldTrackerRowLength = new ASUISelectInput('row-length',
                                    e => this.setTrackerRowLength(e),
                                    (selectElm) => this.values.getNoteDurations(this.song, selectElm.getOption),
                                    'Select Row Length',
                                    this.song.timeDivision),
                            ]),
                            new ASCForm('tracker-segment-length', 'Seg &#120491;', () => [
                                this.refs.fieldTrackerSegmentLength = new ASUISelectInput('segment-length',
                                    e => this.setTrackerSegmentLength(e),
                                    (selectElm) => this.values.getSegmentLengths(this.song,  selectElm.getOption),
                                    'Select Segment Length',
                                    this.song.timeDivision * 16),
                            ]),
                            new ASCForm('tracker-instrument', 'Instrument', () => [
                                this.refs.fieldTrackerFilterInstrument = new ASUISelectInput('filter-instrument',
                                    e => this.setTrackerFilterInstrument(e),
                                    (selectElm) => [
                                        selectElm.getOption('', 'No Filter'),
                                        selectElm.getOptGroup("Filter By Instrument"),
                                        this.values.getSongInstruments(this.song, selectElm.getOption)
                                    ],
                                    'Filter By Instrument',
                                    ''),
                            ]),
                            new ASCForm('tracker-selection', 'Selection', () => [
                                this.refs.fieldTrackerSelection = new ASUITextInput('selection',
                                    e => this.setTrackerSelection(e),
                                    'Selection',
                                    '',
                                    'No selection'
                                ),
                            ]),
                            new ASCForm('tracker-octave', 'Octave', () => [
                                this.refs.fieldTrackerOctave = new ASUISelectInput('octave',
                                    e => this.setTrackerOctave(e),
                                    (selectElm) => this.values.getOctaveNoteFrequencies(selectElm.getOption),
                                    // addOption('', 'No Octave Selected');
                                    'Select Octave',
                                    3),
                            ]),


                            // this.querySelectorAll('.multiple-count-text').forEach((elm) => elm.innerHTML = (selectedIndicies.length > 1 ? '(s)' : ''));

                            // Status Fields

                            // const trackerOctave = this.refs.fieldTrackerOctave.value;
                            // this.refs.fieldTrackerOctave.value = trackerOctave !== null ? trackerOctave : 3;
                            // if(this.refs.fieldTrackerOctave.value === null)
                            //     this.refs.fieldTrackerOctave.value = 3; // this.status.currentOctave;
                        ]),

                        this.refs.panelTrackerGroups = new ASCPanel('tracker-groups',  'Groups', (panelElm) => {

                            const currentGroupName = this.trackerElm.groupName;
                            const content = Object.keys(this.song.data.instructions).map((groupName, i) => [
                                // const buttonForm = panelTrackerGroups.addForm(groupName);
                                new ASUIButtonInput(
                                    groupName,
                                    e => this.trackerElm.groupName = groupName,
                                    groupName),
                                // panelTrackerGroups.classList.toggle('selected', groupName === this.groupName);
                                // TODO button.classList.toggle('selected', groupName === currentGroupName);
                            ]);

                            content.push(new ASUIButtonInput(
                                'add-group',
                                e => this.songGroupAddNew(e),
                                '+'));
                            return content;
                        }),

                        this.refs.panelTrackerRowSegments = new ASCPanel('tracker-row-segments', 'Tracker Segments', (panelElm) => {
                            let rowSegmentCount = this.rowSegmentCount; // TODO: calculate from song group
                            const content = [];


                            // let rowSegmentCount = Math.ceil(lastSegmentRowPositionInTicks / segmentLengthInTicks) + 1;
                            const currentRowSegmentID = this.trackerElm.currentRowSegmentID;
                            if (rowSegmentCount < currentRowSegmentID + 1)
                                rowSegmentCount = currentRowSegmentID + 1;
                            for (let segmentID = 0; segmentID <= rowSegmentCount; segmentID++) {
                                const button = new ASUIButtonInput(
                                    segmentID,
                                    e => this.trackerElm.navigateSegment(segmentID),
                                    segmentID);
                                content.push(button);
                                // panelElm.classList.toggle('selected', segmentID === currentRowSegmentID);
                                // button.classList.toggle('selected', segmentID === currentRowSegmentID);
                            }
                            return content;
                        }),
                    ]),

                    new ASUIDiv('asc-tracker-container', this.trackerElm),

                    new ASUIDiv('asc-status-container', () => [
                        this.refs.textStatus = new ASUIDiv('status-text'),
                        this.refs.textVersion = new ASUIDiv('version-text'),
                    ])
                ])
            ];
        }



        setStatus(newStatus) {
            this.refs.textStatus.content = newStatus;
            console.info.apply(null, arguments); // (newStatus);
        }

        setVersion(versionString) {
            this.versionString = versionString;
            this.refs.textVersion.content = versionString;
        }


        // get fieldSongAddInstrument()
        // TODO: AudioSourceComposerSongFormRenderer()
        updateForms() {
            this.refs.fieldSongName.value = this.song.getName();
            this.refs.fieldSongVersion.value = this.song.getVersion();
            this.refs.fieldSongBPM.value = this.song.getStartingBPM();

            this.refs.fieldSongVolume.value = this.song.getVolumeValue();

            let selectedIndicies = this.getSelectedIndicies();
            // let timeDivision = this.rowLengthInTicks || this.song.getSongTimeDivision();
            const selectedInstructionList = this.song.getInstructions(this.trackerElm.groupName, selectedIndicies);
            let cursorInstruction = selectedInstructionList[0];


            if (cursorInstruction) {
                this.refs.fieldInstructionCommand.value = cursorInstruction.command; // , "Unknown Instrument");
                this.refs.fieldInstructionInstrument.addOrSetValue(cursorInstruction.instrument, cursorInstruction.instrument + ": Unknown Instrument");
                this.refs.fieldInstructionVelocity.value = cursorInstruction.velocity;
                this.refs.fieldInstructionDuration.value = cursorInstruction.duration;
            }

            this.refs.fieldInstructionDelete.disabled = selectedIndicies.length === 0;
            if (!this.refs.fieldTrackerRowLength.value)
                this.refs.fieldTrackerRowLength.setValue(this.song.timeDivision);
            // this.refs.fieldTrackerRowLength.value = this.refs.fieldTrackerRowLength.value; // this.song.getSongTimeDivision();
            if (!this.refs.fieldInstructionDuration.value && this.refs.fieldTrackerRowLength.value)
                this.refs.fieldInstructionDuration.setValue(parseInt(this.refs.fieldTrackerRowLength.value));


        }

        renderInstrument(instrumentID) {
            const instrumentPanel = this.refs.panelInstruments;
            // this.headerElm.innerHTML = `${instrumentIDHTML}: Loading...`;
            let instrumentForm = instrumentPanel.findChild(instrumentID);
            if (instrumentForm) {
                instrumentForm.render();
            } else {
                this.refs.panelInstruments.render();
                console.warn("Instrument form not found: " + instrumentID + ". Rendering all instruments");
            }

        }

        renderInstruments() {
            this.refs.panelInstruments.render();
        }

        populateMenu(divElm, menuKey) {
            /** File Menu **/
            switch (menuKey) {
                case 'file':
        
                    return [
                        new ASUIMenu('from Memory ►', async () => {
                            const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
                            const Storage = new AudioSourceStorage();
                            const songRecentUUIDs = await Storage.getRecentSongList() ;
                            return songRecentUUIDs.map(entry => new ASUIMenu(entry.name || entry.uuid,
                                null, () => this.loadSongFromMemory(entry.uuid)));
                        }),
                    ];
        
        
        
                    divElm.addActionMenu('New song',
                        (e) => this.loadNewSongData(e));

                    divElm.addSubMenu('Open song ►', () => {
                        divElm.addSubMenu('from Memory ►', async () => {
                            const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
                            const Storage = new AudioSourceStorage();
                            const songRecentUUIDs = await Storage.getRecentSongList();
                            for (let i = 0; i < songRecentUUIDs.length; i++) {
                                const entry = songRecentUUIDs[i];
                                divElm.addActionMenu(entry.name || entry.title || entry.uuid || "noname." + i,
                                    (e) => {
                                    this.loadSongFromMemory(entry.uuid);
                                });
                            }
                        });

                        divElm.addActionMenu(`from File`, (e) => this.refs.fieldSongFileLoad.inputElm.click()); // this.loadSongFromFileInput(this.refs.fieldSongFileLoad.inputElm);
                        // menuFileOpenSongFromFile.disabled = true;
                        let menu = divElm.addActionMenu('from URL');
                        menu.disabled = true;
                    });

                    divElm.addSubMenu('Save song ►', () => {
                        divElm.addActionMenu('to Memory', (e) => this.saveSongToMemory(e));
                        divElm.addActionMenu('to File', (e) => this.saveSongToFile(e));
                    });

                    divElm.addSubMenu('Import song ►', () => {
                        divElm.addActionMenu('from MIDI File', (e) => this.refs.fieldSongFileLoad.inputElm.click());
                        // this.loadSongFromFileInput(this.refs.fieldSongFileLoad.inputElm);
                        // menuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
                        // menuFileImportSongFromMIDI.disabled = true;
                    });

                    let menu = divElm.addSubMenu('Export song ►', () => {
                        let menu = divElm.addActionMenu('to MIDI File');
                        menu.disabled = true;
                    });
                    menu.disabled = true;
                    break;

                case 'view':
                    divElm.addActionMenu(`${this.classList.contains('fullscreen') ? 'Disable' : 'Enable'} Fullscreen`, (e) => this.toggleFullscreen(e));
                    divElm.addActionMenu(`${this.classList.contains('hide-panel-song') ? 'Show' : 'Hide'} Song Forms`, (e) => this.togglePanelSong(e));
                    divElm.addActionMenu(`${this.classList.contains('hide-panel-tracker') ? 'Show' : 'Hide'} Track Forms`, (e) => this.togglePanelTracker(e));
                    divElm.addActionMenu(`${this.classList.contains('hide-panel-instruments') ? 'Show' : 'Hide'} Instrument Forms`, (e) => this.togglePanelInstruments(e));
                    break;

                case 'instrument':
                    divElm.addSubMenu(`Add Instrument To Song ►`, async () => {
                        const instrumentLibrary = await AudioSourceLibrary.loadURL(this.defaultLibraryURL);
                        instrumentLibrary.eachInstrument((instrumentConfig) => {
                            divElm.addActionMenu(`${instrumentConfig.name}`, (e) => {
//                         this.refs.fieldSongAddInstrument.value = instrumentURL;
                                this.songAddInstrument(e, instrumentConfig);
                            });
                        });
                    });


                    let instrumentCount = 0;
                    this.values.getValues('song-instruments', (instrumentID, label) => {
                        const isActive = this.song.isInstrumentLoaded(instrumentID);

                        const menuInstrument = divElm.addSubMenu(`${label} ►`, () => {
                            divElm.addSubMenu(`Replace ►`, async (e) => {
                                const instrumentLibrary = await AudioSourceLibrary.loadURL(this.defaultLibraryURL);
                                instrumentLibrary.eachInstrument((instrumentConfig) => {
                                    divElm.addActionMenu(`${instrumentConfig.name}`, (e) => {
                                        this.songReplaceInstrument(e, instrumentID, instrumentConfig);
                                    });
                                });
                            });


                            let menu = divElm.addActionMenu(`Remove From Song`, (e) => {
                                this.songRemoveInstrument(e, instrumentID);
                            });
                            menu.disabled = !isActive;


                        });
                        if (instrumentCount === 0)
                            menuInstrument.hasBreak = true;
                        instrumentCount++;
                    });

                    // TODO CRUD
                    break;

                /** Group Menu **/
                case 'group':
                    divElm.addActionMenu(`Add Group To Song`, (e) => {
                        this.songGroupAddNew(e);
                    });


                    let groupCount = 0;
                    this.values.getValues('song-groups', (groupName) => {
                        let menu = divElm.addSubMenu(`${groupName} ►`, () => {
                            divElm.addActionMenu(`Rename`, (e) => {
                                this.songGroupRename(e, groupName);
                            });


                            divElm.addActionMenu(`Remove From Song`, (e) => {
                                this.songGroupRemove(e, groupName);
                            });
                        });
                        if (groupCount === 0)
                            menu.hasBreak = true;
                        groupCount++;
                    });
                    break;

                case 'edit':
                    const selectedIndicies = this.getSelectedIndicies();

                    // const populateGroupCommands = (subMenuGroup, action) => {
                    //     subMenuGroup.populate = (e) => {
                    //         const MENU = e.menuElement;
                    //         this.values.getValues('song-groups', (groupName, groupTitle) => {
                    //             const menuEditSetCommandGroup = MENU.getOrCreateSubMenu(groupName, `${groupTitle}`);
                    //             menuEditSetCommandGroup.action = action;
                    //         });
                    //         const menuCustom = MENU.getOrCreateSubMenu('new', `Create New Group`);
                    //         menuCustom.action = e => this.songGroupAddNew(e);
                    //         menuCustom.hasBreak = true;
                    //     };
                    // };

                    divElm.addSubMenu(`Insert Command ►`, () => {
                        divElm.addSubMenu(`Frequency ►`, () => {
                            this.values.getValues('note-frequency-octaves', (octave, label) => {
                                divElm.addSubMenu(`Octave ${label} ►`, () => {
                                    this.values.getValues('note-frequency', (noteName, label) => {
                                        const fullNote = noteName + octave;
                                        divElm.addActionMenu(`${label}${octave}`, (e) => {
                                            this.refs.fieldInstructionCommand.value = fullNote;
                                            this.insertInstructionCommand(e, fullNote);
                                        });
                                    });
                                });
                            });
                        });

                        divElm.addSubMenu(`Named ►`, () => {
                            this.values.getValues('note-frequency-named', (noteName, frequency, instrumentID) => {
                                divElm.addActionMenu(noteName, (e) => {
                                    this.refs.fieldInstructionCommand.value = noteName;
                                    this.insertInstructionCommand(e, noteName, false, instrumentID);
                                })
                            });
                        });

                        divElm.addSubMenu(`Group ►`, () => {
                            this.values.getValues('song-groups', (groupName, groupTitle) => {
                                if (groupName === this.groupName)
                                    return;
                                divElm.addActionMenu(`${groupTitle}`, (e) => {
                                    const fullNote = '@' + groupName;
                                    this.refs.fieldInstructionCommand.value = fullNote;
                                    this.insertInstructionCommand(e, fullNote);
                                });
                            });
                            let menuGroup = divElm.addActionMenu(`Create New Group`, (e) => this.songGroupAddNew(e));
                            menuGroup.hasBreak = true;
                        });

                        let menuCustom = divElm.addActionMenu(`Custom Command`, (e) => this.insertInstructionCommand(e, true));
                        menuCustom.hasBreak = true;
                    });
                    // menuEditInsertCommand.disabled = selectedIndicies.length > 0; // !this.cursorCell;
                    // menuEditInsertCommand.action = handleAction('song:new');

                    if (selectedIndicies.length > 0) {
                        const menuEditSetCommand = divElm.addSubMenu(`Set Command ►`, () => {
                            divElm.addSubMenu(`Frequency ►`, () => {
                                this.values.getValues('note-frequency-octaves', (octave, label) => {
                                    divElm.addSubMenu(`Octave ${label} ►`, () => {
                                        this.values.getValues('note-frequency', (noteName, label) => {
                                            const fullNote = noteName + octave;
                                            divElm.addActionMenu(`${label}${octave}`, (e) => {
                                                this.refs.fieldInstructionCommand.value = fullNote;
                                                this.setInstructionCommand(e, fullNote);
                                                // handleAction('instruction:command')(e);
                                            })
                                        });
                                    });
                                });
                            });

                            divElm.addSubMenu(`Named ►`, () => {
                                this.values.getValues('note-frequency-named', (noteName, frequency, instrumentID) => {
                                    divElm.addActionMenu(noteName, (e) => {
                                        this.refs.fieldInstructionCommand.value = noteName;
                                        this.setInstructionCommand(e, noteName, false, instrumentID);
                                    })
                                });
                            });

                            divElm.addSubMenu(`Group ►`, () => {
                                this.values.getValues('song-groups', (groupName, groupTitle) => {
                                    if (groupName === this.groupName)
                                        return;
                                    divElm.addActionMenu(`${groupTitle}`, (e) => {
                                        const fullNote = '@' + groupName;
                                        this.refs.fieldInstructionCommand.value = fullNote;
                                        this.setInstructionCommand(e, fullNote);
                                    });
                                });
                                const menuCustom = divElm.addActionMenu(`Create New Group`, (e) => this.songGroupAddNew(e));
                                menuCustom.hasBreak = true;
                            });

                            const menuCustom = divElm.addActionMenu(`Custom Command`, (e) => this.setInstructionCommand(e, true));
                            menuCustom.hasBreak = true;
                        });
                        menuEditSetCommand.disabled = selectedIndicies.length === 0;

                        const menuEditSetInstrument = divElm.addSubMenu(`Set Instrument ►`, () => {
                            this.values.getValues('song-instruments', (instrumentID, label) => {
                                divElm.addActionMenu(`${label}`, (e) => {
                                    this.refs.fieldInstructionInstrument.value = instrumentID;
                                    this.setInstructionInstrument(e, instrumentID);
                                    // handleAction('instruction:instrument')(e);
                                });
                            });
                        });
                        menuEditSetInstrument.disabled = selectedIndicies.length === 0;


                        const menuEditSetDuration = divElm.addSubMenu(`Set Duration ►`, () => {
                            this.values.getValues('durations', (durationInTicks, durationName) => {
                                divElm.addActionMenu(`${durationName}`, (e) => {
                                    this.refs.fieldInstructionDuration.value = durationInTicks;
                                    this.setInstructionDuration(e, durationInTicks);
                                    // handleAction('instruction:duration')(e);
                                });
                            });
                            const menuCustom = divElm.addActionMenu(`Custom Duration`, (e) => this.setInstructionDuration(e, null, true));
                            menuCustom.hasBreak = true;
                        });
                        menuEditSetDuration.disabled = selectedIndicies.length === 0;


                        const menuEditSetVelocity = divElm.addSubMenu(`Set Velocity ►`, () => {
                            this.values.getValues('velocities', (velocity, velocityName) => {
                                divElm.addActionMenu(`${velocityName}`, (e) => {
                                    this.refs.fieldInstructionVelocity.value = velocity;
                                    this.setInstructionVelocity(e, velocity);
                                    // handleAction('instruction:velocity')(e);
                                });
                            });
                            const menuCustom = divElm.addActionMenu(`Custom Velocity`, (e) => this.setInstructionVelocity(e, null, true));
                            menuCustom.hasBreak = true;
                        });
                        menuEditSetVelocity.disabled = selectedIndicies.length === 0;

                        const menuEditDeleteInstruction = divElm.addActionMenu(`Delete Instruction(s)`, (e) => this.deleteInstructionCommand(e));
                        menuEditDeleteInstruction.disabled = selectedIndicies.length === 0;
                    }

                    /** Select Instructions **/

                    const menuEditSelect = divElm.addSubMenu('Select ►', () => {
                        divElm.addActionMenu('Select Segment Instructions', (e) => this.setTrackerSelection(e, 'segment'));

                        divElm.addActionMenu('Select All Song Instructions', (e) => this.setTrackerSelection(e, 'all'));

                        // const menuSelectRow = MENU.getOrCreateSubMenu('row', 'Select Row Instructions');
                        // menuSelectRow.action = (e) => this.setTrackerSelection(e, 'row');
                        // menuSelectRow.disabled = true;
                        divElm.addActionMenu('Select No Instructions', (e) => this.setTrackerSelection(e, 'none'));

                        divElm.addSubMenu('Batch Select ►', async () => {
                            divElm.addActionMenu('New Selection Command', (e) => this.batchSelect(e));

                            const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
                            const storage = new AudioSourceStorage();
                            const recentBatchSearches = storage.getBatchRecentSearches();
                            for (let i = 0; i < recentBatchSearches.length; i++) {
                                const recentBatchSearch = recentBatchSearches[i];
                                // let title = recentBatchCommand.match(/\/\*\*([^*/]+)/)[1].trim() || recentBatchCommand;
                                divElm.addActionMenu(recentBatchSearch, (e) => {
                                    this.batchSelect(e, recentBatchSearch, true);
                                });
                            }
                        });

                    });
                    menuEditSelect.hasBreak = true;

                    /** Batch Instructions **/

                    const menuEditBatch = divElm.addSubMenu('Batch ►', async () => {
                        divElm.addActionMenu('New Batch Command', (e) => this.batchRunCommand(e));

                        const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
                        const storage = new AudioSourceStorage();
                        const recentBatchCommands = storage.getBatchRecentCommands();
                        for (let i = 0; i < recentBatchCommands.length; i++) {
                            const recentBatchCommand = recentBatchCommands[i];
                            // let title = recentBatchCommand.match(/\/\*\*([^*/]+)/)[1].trim() || recentBatchCommand;
                            divElm.addSubMenu(recentBatchCommand, () => {
                                divElm.addActionMenu("Execute on Group", (e) => {
                                    this.batchRunCommand(e, recentBatchCommand, true);
                                });

                                divElm.addSubMenu("Execute using Search", (e) => {
                                    divElm.addActionMenu('New Search', (e) => this.batchRunCommand(e, recentBatchCommand, null, true));

                                    const storage = new AudioSourceStorage();
                                    const recentBatchSearches = storage.getBatchRecentSearches();
                                    for (let i = 0; i < recentBatchSearches.length; i++) {
                                        const recentBatchSearch = recentBatchSearches[i];
                                        // let title = recentBatchCommand.match(/\/\*\*([^*/]+)/)[1].trim() || recentBatchCommand;
                                        divElm.addActionMenu(recentBatchSearch, (e) => {
                                            this.batchRunCommand(e, recentBatchCommand, recentBatchSearch);
                                        });
                                    }
                                });
                            });

                        }

                    });
                    menuEditBatch.hasBreak = true;

                    // const menuEditGroup = MENU.getOrCreateSubMenu('group', 'Group ►');
                    // menuEditGroup.hasBreak = true;
                    // menuEditGroup.disabled = true;

                    break;
            }
        }
    }

    class ASCPanel extends ASUIDiv {
        constructor(key, caption, contentCallback, props={}) {
            super(key, contentCallback, props);
            this.state.caption = caption;
        }

        async render() {
            return [
                new ASUIDiv('caption', this.state.caption),
                super.render()
            ]
        }
    }
    customElements.define('asc-panel', ASCPanel);

    class ASCForm extends ASCPanel {}
    customElements.define('asc-form', ASCForm);
    

    class ASCInstrumentRenderer extends ASUIComponent {
        constructor(composerElm, instrumentID, props = {}) {
            super({composerElm, instrumentID}, props);
        }

        async render() {
            const instrumentID = this.instrumentID;
            const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);
            const instrument = this.song.getInstrument(instrumentID, false);

            const content = [
                new ASUIButtonInput('id', null, instrumentIDHTML),
                new ASUISelectInput('url',
                    (e, changeInstrumentURL) => this.songReplaceInstrument(e, instrumentID, changeInstrumentURL),
                    async () => {
                        addOption('', 'Set Instrument');
                        const instrumentLibrary = await AudioSourceLibrary.loadURL(this.defaultLibraryURL);
                        instrumentLibrary.eachInstrument((instrumentConfig) => {
                            addOption(instrumentConfig.url, instrumentConfig.name);
                        });
                    },
                    'Set Instrument'
                )
            ];

            if (instrument) {
                try {


                    if (instrument instanceof HTMLElement) {
                        content.push(instrument);
                    } else if (typeof instrument.render === "function") {
                        content.push(await instrument.render());
                    } else {
                        content.push(new ASUIDiv('error', "No Instrument Renderer"));
                    }

                } catch (e) {
                    content.push(new ASUIDiv('error', e.message));
                }
            }

            return content;
        }
    }
    
    customElements.define('asc-instrument', ASCInstrumentRenderer);



    /** Export this script **/
    registerModule(exportThisScript);

    /** Finish Registering Async Module **/
    resolveExports();



    /** Module Loader Methods **/
    function registerAsyncModule() {
        let resolve;
        const promise = new Promise((r) => resolve = r);
        registerModule(module => {
            module.promises = (module.promises || []).concat(promise);
        });
        return resolve;
    }
    function registerModule(callback) {
        if(typeof window === 'undefined')
            callback(module);
        else findThisScript()
            .forEach(scriptElm => callback(scriptElm))
    }

    function findThisScript() {
        return findScript(getThisScriptPath());
    }

    function findScript(scriptURL) {
        let scriptElms = document.head.querySelectorAll(`script[src$="${scriptURL}"]`);
        scriptElms.forEach(scriptElm => {
            scriptElm.relativePath = scriptURL;
            scriptElm.basePath = scriptElm.src.replace(document.location.origin, '').replace(scriptURL, '');
        });
        return scriptElms;
    }

    async function requireAsync(relativeScriptPath) {
        if(typeof require !== "undefined")
            return require('../' + relativeScriptPath);

        let scriptElm = findScript(relativeScriptPath)[0];
        if(!scriptElm) {
            const scriptURL = findThisScript()[0].basePath + relativeScriptPath;
            scriptElm = document.createElement('script');
            scriptElm.src = scriptURL;
            scriptElm.promises = (scriptElm.promises || []).concat(new Promise(async (resolve, reject) => {
                scriptElm.onload = resolve;
                document.head.appendChild(scriptElm);
            }));
        }
        for (let i=0; i<scriptElm.promises.length; i++)
            await scriptElm.promises[i];
        return scriptElm.exports
            || (() => { throw new Error("Script module has no exports: " + relativeScriptPath); })()
    }


})();