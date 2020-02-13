(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    if(isBrowser) // Hack for browsers
        window.require = thisRequire;
    const {AudioSourceLibrary} = require('../common/audio-source-library.js');
    // const {AudioSourceUtilities} = require('../common/audio-source-utilities.js');
    const {AudioSourceValues} = require('../common/audio-source-values.js');
    const {AudioSourceSong} = require('../common/audio-source-song.js');
    const {AudioSourceStorage} = require('../common/audio-source-storage.js');
    const {
        ASUIComponent,
        ASUIDiv,
        ASUIGrid,
        ASUIGridRow,
        ASUIIcon,
    } = require('../common/ui/asui-component.js');

    const {ASUIMenu} = require('../common/ui/asui-menu.js');
    const {ASUIInputCheckBox} = require('../common/ui/asui-input-checkbox.js');
    const {ASUIInputButton} = require('../common/ui/asui-input-button.js');
    const {ASUIInputSelect} = require('../common/ui/asui-input-select.js');
    const {ASUIInputFile} = require('../common/ui/asui-input-file.js');
    const {ASUIInputRange} = require('../common/ui/asui-input-range.js');
    const {ASUIInputText} = require('../common/ui/asui-input-text.js');

    const {ASCUIHeader} = require('./ui/ascui-header.js');
    const {ASCUITracker} = require('./ui/ascui-tracker.js');

    const audioSourceStorage = new AudioSourceStorage();

    class AudioSourceComposerRenderer extends ASUIComponent {
        constructor(state = {}, props = {}) {
            super(state, props);
            // this.state.trackerSegmentLength = null;
            // this.state.trackerRowLength = null;

            this.state.volume = AudioSourceSong.DEFAULT_VOLUME;
            this.state.version = -1;
            this.state.songLength = 0;
            this.state.playing = false;
            this.state.paused = false;
            this.state.tracker = {
                currentGroup: 'root',
                currentRowSegmentID: 0,
                cursorListOffset: 0,
                rowSegmentCount: 10,
                quantizationInTicks: null,
                segmentLengthInTicks: null,
                filterByInstrumentID: null
            };

            this.shadowDOM = null;
        }

        get targetElm() {
            return this.shadowDOM;
        }

        createStyleSheetLink(stylePath, scriptElm=null) {
            const linkHRef = new URL(stylePath, (scriptElm || thisModule).src);
            const link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.href = linkHRef;
            return link;
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

        get trackerSegmentLengthInTicks() {
            return this.state.trackerSegmentLength || this.song.timeDivision * 16;
        }

        get trackerRowLengthInTicks() {
            return this.state.trackerRowLength || this.song.timeDivision;
        }
//
//         renderMenu(menuKey = null) {
// //             console.log('renderMenu', menuKey);
//             switch(menuKey) {
//
//                 case 'file':
//                     return [
//                         ASUIMenu.cSME('memory', 'Load from Memory',     (e) => this.renderMenu('file-memory')),
//
//                         ASUIMenu.cME('file', 'Load from File', (e) => this.fieldSongFileLoad.click()),
//                         ASUIMenu.cME('url', 'Load from URL', null, null, {disabled: true}),
//                         ASUIMenu.cME('library', 'Load from Library', null, null, {disabled: true}),
//                     ];
//
//                 case 'edit':
//                     return [
//                         ASUIMenu.cME('next', 'Play Next Song', null, (e) => this.playlistNext()),
//                         ASUIMenu.cME('clear', 'Clear Playlist', null, (e) => this.clearPlaylist(), {hasBreak: true}),
//                     ];
//
//                 case 'view':
//                     return [
//                         ASUIMenu.cME('fullscreen', `${this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen`, null, (e) => this.toggleFullscreen(e)),
//                         ASUIMenu.cME('hide-panel-song', `${this.state.showPanelSong ? 'Show' : 'Hide'} Song Forms`, null, (e) => this.togglePanelSong(e)),
//                         ASUIMenu.cME('hide-panel-playlist', `${this.state.showPanelPlaylist ? 'Show' : 'Hide'} Playlist`, null, (e) => this.togglePanelPlaylist(e)),
//                     ];
//
//                     // ASUIDiv.createElement('asc-menu-container', [
//                     //     this.menuFile = ASUIMenu.cME({vertical: true}, 'File', () => this.populateMenu('file')),
//                     //     this.menuEdit = ASUIMenu.cME({vertical: true}, 'Edit', () => this.populateMenu('edit')),
//                     //     this.menuGroup = ASUIMenu.cME({vertical: true}, 'Group', () => this.populateMenu('group')),
//                     //     this.menuInstrument = ASUIMenu.cME({vertical: true}, 'Instrument', () => this.populateMenu('instrument')),
//                     //     this.menuView = ASUIMenu.cME({vertical: true}, 'View', () => this.populateMenu('view')),
//                     //     this.menuContext = ASUIMenu.cME({
//                     //         vertical: true,
//                     //         context: true
//                     //     }, null, () => this.populateMenu('context')),
//                     // ]),
//             }
//         }

        renderMenu(menuKey=null) {
            // const library = await this.getLibrary();
            /** File Menu **/
            let content = [];
            switch (menuKey) {
                default:
                    const vertical = !this.state.portrait;
                    return [
                        // ASUIMenu.cME('refresh',     'Refresh',  (e) => this.restart()),
                        ASUIMenu.cSME({vertical, key:'file'},    'File',    () => this.renderMenu('file')),
                        ASUIMenu.cSME({vertical, key:'edit'},    'Edit',    () => this.renderMenu('edit')),
                        ASUIMenu.cSME({vertical, key:'view'},    'View',    () => this.renderMenu('view')),
                    ];

                case 'file':

                    content = [

                        ASUIMenu.cME({}, 'New song', (e) => this.loadNewSongData(e)),

                        ASUIMenu.cSME({}, 'Open song', [
                            ASUIMenu.cME({}, 'from Memory', async () => {
                                const songRecentUUIDs = await audioSourceStorage.getRecentSongList();
                                return songRecentUUIDs.map(entry => ASUIMenu.cME({}, entry.name || entry.uuid, null,
                                    () => this.loadSongFromMemory(entry.uuid)));
                            }),

                            ASUIMenu.cME({}, `from File`, null, (e) => this.fieldSongFileLoad.click()), // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
                            // menuFileOpenSongFromFile.disabled = true;
                            ASUIMenu.cME({}, 'from URL', null, (e) => this.loadSongFromURL()),
                        ]),

                        ASUIMenu.cSME({}, 'Save song', [
                            ASUIMenu.cME({}, 'to Memory', null, (e) => this.saveSongToMemory(e)),
                            ASUIMenu.cME({}, 'to File', null, (e) => this.saveSongToFile(e)),
                        ]),

                        ASUIMenu.cSME({}, 'Import song', [
                            ASUIMenu.cME({}, 'from MIDI File', null, (e) => this.fieldSongFileLoad.inputElm.click()),
                            // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
                            // menuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
                            // menuFileImportSongFromMIDI.disabled = true;
                        ]),

                        ASUIMenu.cSME({disabled: false}, 'Export song', [
                            ASUIMenu.cME({}, 'to MIDI File', null, null, {disabled: true}),
                        ]),
                    ];
                    break;

                case 'file-open':
                    break;
                case 'file-save':
                    break;
                case 'file-import':
                    break;

                case 'file-memory':
                    const Storage = new AudioSourceStorage();
                    const songRecentUUIDs = Storage.getRecentSongList() ;
                    return songRecentUUIDs.length > 0
                        ? songRecentUUIDs.map(entry => ASUIMenu.cME({},
                            entry.name || entry.uuid,
                            () => this.loadSongFromMemory(entry.uuid)))
                        : ASUIMenu.cME({disabled: true, hasBreak:true}, "No Songs Available");

                case 'edit':
                case 'context':
                    const selectedIndicies = this.getSelectedIndicies();

                    // const populateGroupCommands = (subMenuGroup, action) => {
                    //     subMenuGroup.populate = (e) => {
                    //         const MENU = e.menuElement;
                    //         this.values.getValues('song-groups', (groupName, groupTitle) => {
                    //             const menuEditSetCommandGroup = MENU.getOrCreateSubMenu(groupName, `${groupTitle}`);
                    //             menuEditSetCommandGroup.action = action;
                    //         });
                    //         const menuCustom = MENU.getOrCreateSubMenu('new', `Create New Group`);
                    //         menuCustom.action = e => this.groupAdd(e);
                    //         menuCustom.hasBreak = true;
                    //     };
                    // };
                    content = [
                        ASUIMenu.cME({}, `Insert Command`, [
                            ASUIMenu.cME({}, `Frequency`, () =>
                                this.values.getNoteFrequencies((noteName, label) =>
                                    ASUIMenu.cME({}, `${noteName}`, () =>
                                        this.values.getNoteOctaves((octave) =>
                                            ASUIMenu.cME({}, `${noteName}${octave}`, null, (e) => {
                                                this.fieldInstructionCommand.value = `${noteName}${octave}`;
                                                this.instructionInsert(`${noteName}${octave}`, false);
                                            })
                                        )
                                    )
                                )
                            ),

                            ASUIMenu.cME({}, `Named`, () =>
                                this.values.getAllNamedFrequencies((noteName, frequency, instrumentID) =>
                                    ASUIMenu.cME({}, noteName, null, (e) => {
                                        this.fieldInstructionCommand.value = noteName;
                                        this.instructionInsert(noteName, false, instrumentID);
                                    }))
                            ),

                            ASUIMenu.cME({}, `Group`, [
                                this.values.getAllSongGroups((groupName) =>
                                    ASUIMenu.cME({disabled: groupName === this.state.tracker.currentGroup}, `${groupName}`, (e) => {
                                        const fullNote = '@' + groupName;
                                        this.fieldInstructionCommand.value = fullNote;
                                        this.instructionInsert(fullNote, false);
                                    })),
                                ASUIMenu.cME({}, `Create New Group`, null, (e) => this.groupAdd(e), {hasBreak: true}),
                            ]),

                            ASUIMenu.cME({}, `Custom Command`, null, (e) => this.instructionInsert(null, true)),
                            // menuCustom.hasBreak = true;
                        ], null, {hasBreak: true}),
                        // menuEditInsertCommand.disabled = selectedIndicies.length > 0; // !this.cursorCell;
                        // menuEditInsertCommand.action = handleAction('song:new');

                        (selectedIndicies.length === 0 ? null : [
                            ASUIMenu.cME({}, `Set Command`, [
                                ASUIMenu.cME({}, `Frequency`, () =>
                                    this.values.getNoteFrequencies((noteName, label) =>
                                        ASUIMenu.cME({}, `${noteName}`, () =>
                                            this.values.getNoteOctaves((octave) =>
                                                ASUIMenu.cME({}, `${noteName}${octave}`, null, (e) => {
                                                    this.fieldInstructionCommand.value = `${noteName}${octave}`;
                                                    this.instructionChangeCommand(`${noteName}${octave}`, false);
                                                    // handleAction('instruction:command')(e);
                                                })
                                            )
                                        )
                                    )
                                ),

                                ASUIMenu.cME({}, `Named`, () =>
                                    this.values.getAllNamedFrequencies((noteName, frequency, instrumentID) =>
                                        ASUIMenu.cME({}, noteName, null, (e) => {
                                            this.fieldInstructionCommand.value = noteName;
                                            this.instructionChangeCommand(noteName, false, instrumentID);
                                        }))
                                ),

                                ASUIMenu.cME({}, `Group`, [
                                    this.values.getAllSongGroups((groupName) =>
                                        groupName === this.groupName ? null :
                                            ASUIMenu.cME({}, `${groupName}`, null, (e) => {
                                                const fullNote = '@' + groupName;
                                                this.fieldInstructionCommand.value = fullNote;
                                                this.instructionChangeCommand(fullNote, false);
                                            })),
                                    ASUIMenu.cME({}, `Create New Group`, null, (e) => this.groupAdd(e), {hasBreak: true})
                                ]),

                                ASUIMenu.cME({}, `Custom Command`, null, (e) => this.instructionChangeCommand(null, true), {hasBreak: true}),
                            ]),

                            ASUIMenu.cME({disabled: selectedIndicies.length === 0}, `Set Instrument`, () =>
                                this.values.getSongInstruments((instrumentID, label) =>
                                    ASUIMenu.cME({}, `${label}`, null, (e) => {
                                        this.fieldInstructionInstrument.value = instrumentID;
                                        this.instructionChangeInstrument(instrumentID);
                                        // handleAction('instruction:instrument')(e);
                                    }))
                            ),

                            ASUIMenu.cME({disabled: selectedIndicies.length === 0}, `Set Duration`, [
                                this.values.getNoteDurations((durationInTicks, durationName) =>
                                    ASUIMenu.cME({}, `${durationName}`, null, (e) => {
                                        this.fieldInstructionDuration.value = durationInTicks;
                                        this.instructionChangeDuration(durationInTicks);
                                        // handleAction('instruction:duration')(e);
                                    })),
                                ASUIMenu.cME({}, `Custom Duration`, (e) => this.instructionChangeDuration(null, true), {hasBreak: true}),
                            ]),

                            ASUIMenu.cME({disabled: selectedIndicies.length === 0}, `Set Velocity`, [
                                this.values.getNoteVelocities((velocity) =>
                                    ASUIMenu.cME({}, `${velocity}`, null, (e) => {
                                        this.fieldInstructionVelocity.value = velocity;
                                        this.instructionChangeVelocity(velocity);
                                        // handleAction('instruction:velocity')(e);
                                    })
                                ),
                                ASUIMenu.cME({}, `Custom Velocity`, null, (e) => this.instructionChangeVelocity(null, true), {hasBreak: true}),
                            ]),

                            ASUIMenu.cME({disabled: selectedIndicies.length === 0}, `Delete Instruction(s)`,
                                null,
                                (e) => this.instructionDelete(e)
                            ),
                        ]),

                        /** Select Instructions **/

                        ASUIMenu.cME({}, 'Select', [
                            ASUIMenu.cME({}, 'Select Segment Instructions', null, (e) => this.trackerChangeSelection('segment')),

                            ASUIMenu.cME({}, 'Select All Song Instructions', null, (e) => this.trackerChangeSelection('all')),

                            // const menuSelectRow = MENU.getOrCreateSubMenu('row', 'Select Row Instructions');
                            // menuSelectRow.action = (e) => this.trackerChangeSelection(e, 'row');
                            // menuSelectRow.disabled = true;
                            ASUIMenu.cME({}, 'Select No Instructions', null, (e) => this.trackerChangeSelection('none')),

                            ASUIMenu.cME({}, 'Batch Select', [
                                ASUIMenu.cME({}, 'New Selection Command', null, (e) => this.batchSelect(e)),

                                    audioSourceStorage.getBatchRecentSearches().map(recentBatchSearch =>
                                        // let title = recentBatchCommand.match(/\/\*\*([^*/]+)/)[1].trim() || recentBatchCommand;
                                        ASUIMenu.cME({}, recentBatchSearch, null, (e) => {
                                            this.batchSelect(e, recentBatchSearch, true);
                                        })
                                    )
                                ]),

                        ], null, {hasBreak: true}),

                        /** Batch Instructions **/

                        ASUIMenu.cME({}, 'Batch', [
                            ASUIMenu.cME({}, 'New Batch Command', null, (e) => this.batchRunCommand(e)),
                            audioSourceStorage.getBatchRecentCommands().map((recentBatchCommand, i) =>
                                ASUIMenu.cME({}, recentBatchCommand, [
                                    ASUIMenu.cME({}, "Execute on Group", null, (e) => {
                                        this.batchRunCommand(e, recentBatchCommand, true);
                                    }),

                                    ASUIMenu.cME({}, "Execute using Search", (e) => [
                                        ASUIMenu.cME({}, 'New Search', null, (e) => this.batchRunCommand(e, recentBatchCommand, null, true)),
                                        audioSourceStorage.getBatchRecentSearches().map((recentBatchSearch, i) => {

                                            // let title = recentBatchCommand.match(/\/\*\*([^*/]+)/)[1].trim() || recentBatchCommand;
                                            ASUIMenu.cME({}, recentBatchSearch, null, (e) => {
                                                this.batchRunCommand(e, recentBatchCommand, recentBatchSearch);
                                            });
                                        })
                                    ])
                                ])
                            ),

                        ], null, {hasBreak: false}),
                    ];
                    // const menuEditGroup = MENU.getOrCreateSubMenu('group', 'Group ►');
                    // menuEditGroup.hasBreak = true;
                    // menuEditGroup.disabled = true;

                    break;

                case 'view':
                    content = [
                        ASUIMenu.cME({}, `${this.classList.contains('fullscreen') ? 'Disable' : 'Enable'} Fullscreen`, null, (e) => this.toggleFullscreen(e)),
                        ASUIMenu.cME({}, `${this.classList.contains('hide-panel-song') ? 'Show' : 'Hide'} Song Forms`, null, (e) => this.togglePanelSong(e)),
                        ASUIMenu.cME({}, `${this.classList.contains('hide-panel-tracker') ? 'Show' : 'Hide'} Track Forms`, null, (e) => this.togglePanelTracker(e)),
                        ASUIMenu.cME({}, `${this.classList.contains('hide-panel-instruments') ? 'Show' : 'Hide'} Instrument Forms`, null, (e) => this.togglePanelInstruments(e)),
                    ];
                    break;

                case 'instrument':
                    content = [
                        ASUIMenu.cME({}, `Add instrument to song`,
                            async () =>
                                library.eachInstrument((instrumentConfig) =>
                                    ASUIMenu.cME({}, `${instrumentConfig.name}`, null, (e) => {
                                        this.instrumentAdd(instrumentConfig);
                                    })
                                ),
                            null, {hasBreak: true}),

                        this.values.getSongInstruments((instrumentID, label) =>
                            ASUIMenu.cME({}, `${label}`, [
                                ASUIMenu.cME({}, `Replace`, async (e) =>
                                    library.eachInstrument((instrumentConfig) =>
                                        ASUIMenu.cME({}, `${instrumentConfig.name}`, null, (e) =>
                                            this.instrumentReplace(instrumentID, instrumentConfig)
                                        )
                                    )
                                ),

                                ASUIMenu.cME({}, `Remove from song`, null, (e) => {
                                    this.instrumentRemove(instrumentID);
                                }, {disabled: !this.song.isInstrumentLoaded(instrumentID)})
                            ])),

                    ];
                    break;

                /** Group Menu **/
                case 'group':
                    let groupCount = 0;
                    content = [
                        ASUIMenu.cME({}, `Add new group to song`, null, (e) => {
                            this.groupAdd(e);
                        }, {hasBreak: true}),

                        this.values.getAllSongGroups((groupName) =>
                            ASUIMenu.cME({}, `${groupName}`, [
                                ASUIMenu.cME({}, `Rename group '${groupName}'`, null, (e) => {
                                    this.groupRename(groupName);
                                }),

                                ASUIMenu.cME({}, `Delete group '${groupName}' from song`, null, (e) => {
                                    this.groupRemove(groupName);
                                }),
                            ], {hasBreak: groupCount++ === 0}))
                    ];
                    break;

            }

            return content;
        }



        render() {
            return [
                this.createStyleSheetLink('../composer/assets/audio-source-composer.css'),
                this.createStyleSheetLink('../common/assets/audio-source-common.css'),
                this.containerElm = ASUIDiv.createElement('asc-container', [
                    ASCUIHeader.cE({
                        // portrait: !!this.state.portrait,
                        key: 'asc-title-container',
                        menuContent: () => this.renderMenu(this.state.menuKey),
                        // onMenuPress: (e) => this.toggleMenu()
                    }),

                    ASUIDiv.createElement('asc-panel-container', [
                        ASCPanel.createElement('song', [
                            ASUIDiv.cE('title', 'Song'),

                            ASCForm.createElement('playback',  [
                                ASUIDiv.cE('title', 'Playback'),
                                ASUIInputButton.createInputButton('play',
                                    ASUIIcon.createIcon('play'),
                                    e => this.songPlay(e),
                                    "Play Song"),
                                ASUIInputButton.createInputButton('pause',
                                    ASUIIcon.createIcon('pause'),
                                    e => this.songPause(e),
                                    "Pause Song"),
                                // this.fieldSongPlaybackPause.disabled = true;
                                ASUIInputButton.createInputButton('stop',
                                    ASUIIcon.createIcon('stop'),
                                    e => this.songStop(e),
                                    "Stop Song")
                            ]),

                            ASCForm.createElement('timing', [
                                ASUIDiv.cE('title', 'Timing'),
                                ASUIInputText.createInputText('timing',
                                    (e, pos) => this.setSongPosition(pos),
                                    '00:00:000',
                                    'Song Timing',
                                    ref => this.fieldSongTiming = ref
                                )
                            ]),

                            ASCForm.createElement('position', [
                                ASUIDiv.cE('title', 'Position'),
                                ASUIInputRange.createInputRange('position',
                                    (e, pos) => this.setSongPosition(pos),
                                    0,
                                    Math.ceil(this.song.getSongLengthInSeconds()),
                                    0,
                                    'Song Position',
                                    ref => this.fieldSongPosition = ref
                                )
                            ]),

                            ASCForm.createElement('volume', [
                                ASUIDiv.cE('title', 'Volume'),
                                ASUIInputRange.createInputRange('volume',
                                    (e, newVolume) => this.setVolume(newVolume/100),
                                    1,
                                    100,
                                    this.state.volume*100,
                                    'Song Volume',
                                    ref => this.fieldSongVolume = ref
                                )
                            ]),

                            ASCForm.createElement('file', [
                                ASUIDiv.cE('title', 'File'),
                                this.fieldSongFileLoad = new ASUIInputFile('file-load',
                                    e => this.loadSongFromFileInput(),
                                    ASUIIcon.createIcon('file-load'),
                                    `.json,.mid,.midi`,
                                    "Load Song from File"
                                ),
                                this.fieldSongFileSave = ASUIInputButton.createInputButton('file-save',
                                    ASUIIcon.createIcon('file-save'),
                                    e => this.saveSongToFile(),
                                    "Save Song to File"
                                ),
                            ]),


                            ASCForm.createElement('name', [
                                ASUIDiv.cE('title', 'Name'),
                                ASUIInputText.createInputText('name',
                                    (e, newSongName) => this.setSongName(e, newSongName),
                                    this.song.name,
                                    "Song Name",
                                    ref => this.fieldSongName = ref
                                )
                            ]),

                            ASCForm.createElement('version', [
                                ASUIDiv.cE('title', 'Version'),
                                ASUIInputText.createInputText('version',
                                    (e, newSongVersion) => this.setSongVersion(e, newSongVersion),
                                    this.song.version,
                                    "Song Version",
                                    ref => this.fieldSongVersion = ref)
                            ]),

                            ASCForm.createElement('bpm', [
                                ASUIDiv.cE('title', 'BPM'),
                                ASUIInputText.createInputText('bpm',
                                    (e, newBPM) => this.songChangeStartingBPM(e, parseInt(newBPM)),
                                    this.song.startingBeatsPerMinute,
                                    "Song BPM",
                                    ref => this.fieldSongBPM = ref
                                )
                                // this.fieldSongBPM.inputElm.setAttribute('type', 'number')
                            ]),
                        ]),

                        this.panelInstruments = ASCPanel.createElement('instruments', [
                            ASUIDiv.cE('title', 'Instruments'),
                            () => {
                                // const instrumentPanel = this.panelInstruments;
                                this.instruments = [];
                                const instrumentList = this.song.getInstrumentList();
                                const content = instrumentList.map((instrumentConfig, instrumentID) =>
                                    this.instruments[instrumentID] = new ASCInstrumentRenderer({}, this.song, instrumentID));

                                content.push(ASCForm.createElement('new', null, [
                                    new ASUIInputSelect('add-url',
                                        (s) => [
                                            // const instrumentLibrary = await AudioSourceLibrary.loadFromURL(this.defaultLibraryURL);
                                            // s.getOption('', 'Add instrument'),
                                            instrumentLibrary.eachInstrument((instrumentConfig) =>
                                                s.getOption(instrumentConfig.url, instrumentConfig.name)),
                                        ],
                                        (e, changeInstrumentURL) => this.instrumentAdd(changeInstrumentURL),
                                        '',
                                        'Add instrument')
                                ]));
                                return content;
                            }
                        ]),

                        ASUIDiv.createElement('break'),

                        this.panelInstructions = ASCPanel.createElement('instructions', [
                            ASUIDiv.cE('title', 'Selected Instruction(s)'),
                            ASCForm.createElement('instruction-command', [
                                ASUIDiv.cE('title', 'Command'),
                                this.fieldInstructionCommand = new ASUIInputSelect(
                                    'command',
                                    (selectElm) => [
                                        // const selectedInstrumentID = this.fieldInstructionInstrument ? parseInt(this.fieldInstructionInstrument.value) : 0;
                                        selectElm.getOption(null, 'Select'),
                                        selectElm.value ?
                                            selectElm.getOptGroup('Current Octave', () => {
                                                const currentOctave = this.fieldInstructionCommand.value.substr(-1, 1);
                                                return this.values.getNoteFrequencies(freq => selectElm.getOption(freq + currentOctave, freq + currentOctave));
                                            }) : null,
                                        selectElm.getOptGroup('Frequencies', () =>
                                            this.values.getOctaveNoteFrequencies(freq => selectElm.getOption(freq, freq)),
                                        ),

                                        selectElm.getOptGroup('Custom Frequencies', () =>
                                            this.values.getAllNamedFrequencies(namedFreq => selectElm.getOption(namedFreq, namedFreq)),
                                        ),
                                        // TODO: filter by selected instrument

                                        selectElm.getOptGroup('Groups', () =>
                                            this.values.getAllSongGroups(group => selectElm.getOption('@' + group, '@' + group)),
                                        ),
                                    ],
                                    (e, commandString) => this.instructionChangeCommand(commandString),
                                ),

                                this.fieldInstructionInsert = ASUIInputButton.createInputButton(
                                    'insert',
                                    ASUIIcon.createIcon('insert'),
                                    e => this.instructionInsert(),
                                    "Insert Instruction"),

                                this.fieldInstructionDelete = ASUIInputButton.createInputButton('delete',
                                    ASUIIcon.createIcon('delete'),
                                    e => this.instructionDelete(e),
                                    "Delete Instruction"),

                            ]),

                            ASCForm.createElement('instruction-instrument', [
                                ASUIDiv.cE('title', 'Instrument'),
                                this.fieldInstructionInstrument = new ASUIInputSelect('instrument',
                                    (selectElm) => [
                                        selectElm.getOption(null, 'Select'),
                                        selectElm.getOptGroup('Song Instruments',
                                            () => this.values.getSongInstruments((id, name) => selectElm.getOption(id, name))
                                        ),
                                    ],
                                    e => this.instructionChangeInstrument(),
                                )
                            ]),

                            ASCForm.createElement('instruction-velocity', [
                                ASUIDiv.cE('title', 'Velocity'),
                                this.fieldInstructionVelocity = ASUIInputRange.createInputRange('velocity',
                                    (e, newVelocity) => this.instructionChangeVelocity(newVelocity),
                                    1,
                                    127,
                                    this.state.volume,
                                    "Velocity",
                                    ref => this.fieldSongVolume = ref
                                )
                            ]),

                            ASCForm.createElement('instruction-duration', [
                                ASUIDiv.cE('title', 'Duration'),
                                this.fieldInstructionDuration = new ASUIInputSelect('duration',
                                    (selectElm) => [
                                        selectElm.getOption(null, 'No Duration'),
                                        this.values.getNoteDurations((duration, title) => selectElm.getOption(duration, title))
                                    ],
                                    e => this.instructionChangeDuration(),
                                ),
                            ]),

                        ]),

                        this.panelTracker = ASCPanel.createElement('tracker', [
                            ASUIDiv.cE('title', 'Tracker'),
                            ASCForm.createElement('tracker-row-length', [
                                ASUIDiv.cE('title', 'Row &#120491;'),
                                this.fieldTrackerRowLength = new ASUIInputSelect('row-length',
                                    (selectElm) => [
                                        selectElm.getOption(null, 'Default'),
                                        this.values.getNoteDurations((duration, title) => selectElm.getOption(duration, title)),
                                    ],
                                    e => this.trackerChangeRowLength(),
                                    this.state.trackerRowLength),
                            ]),
                            ASCForm.createElement('tracker-segment-length', [
                                ASUIDiv.cE('title', 'Seg &#120491;'),
                                this.fieldTrackerSegmentLength = new ASUIInputSelect('segment-length',
                                    (selectElm) => [
                                        selectElm.getOption(null, 'Default'),
                                        this.values.getSegmentLengths((length, title) => selectElm.getOption(length, title)),
                                    ],
                                    (e, segmentLengthInTicks) => this.trackerChangeSegmentLength(segmentLengthInTicks),
                                    this.state.trackerSegmentLength),
                            ]),
                            ASCForm.createElement('tracker-instrument', [
                                ASUIDiv.cE('title', 'Instrument'),
                                this.fieldTrackerFilterInstrument = new ASUIInputSelect('filter-instrument',
                                    (selectElm) => [
                                        selectElm.getOption(null, 'No Filter'),
                                        this.values.getSongInstruments((id, name) => selectElm.getOption(id, name))
                                    ],
                                    (e, instrumentID) => this.trackerChangeInstrumentFilter(instrumentID),
                                    null),
                            ]),
                            ASCForm.createElement('tracker-selection', [
                                ASUIDiv.cE('title', 'Selection'),
                                ASUIInputText.createInputText('selection',
                                    e => this.trackerChangeSelection(),
                                    '',
                                    'Selection',
                                    ref => this.fieldTrackerSelection = ref,
                                    // 'No selection'
                                ),
                            ]),
                            ASCForm.createElement('tracker-octave', [
                                ASUIDiv.cE('title', 'Octave'),
                                this.fieldTrackerOctave = new ASUIInputSelect('octave',
                                    (selectElm) => [
                                        selectElm.getOption(null, 'Default'),
                                        this.values.getNoteOctaves(opt => selectElm.getOption(opt, opt)),
                                    ],
                                    e => this.trackerChangeOctave(),
                                    // addOption('', 'No Octave Selected');
                                    3),
                            ]),


                            // this.querySelectorAll('.multiple-count-text').forEach((elm) => elm.innerHTML = (selectedIndicies.length > 1 ? '(s)' : ''));

                            // Status Fields

                            // const trackerOctave = this.fieldTrackerOctave.value;
                            // this.fieldTrackerOctave.value = trackerOctave !== null ? trackerOctave : 3;
                            // if(this.fieldTrackerOctave.value === null)
                            //     this.fieldTrackerOctave.value = 3; // this.status.currentOctave;
                        ]),

                        this.panelTrackerGroups = ASCPanel.createElement('tracker-groups', [
                            ASUIDiv.cE('title', 'Groups'),
                            () => {
                                const currentGroupName = this.state.tracker.currentGroup;
                                const content = Object.keys(this.song.data.instructions).map((groupName, i) => [
                                    // const buttonForm = panelTrackerGroups.addForm(groupName);
                                    ASUIInputButton.createInputButton(
                                        {selected: currentGroupName === groupName},
                                        groupName,
                                        e => this.trackerChangeGroup(groupName),
                                        "Group " + groupName,
                                    )
                                    // panelTrackerGroups.classList.toggle('selected', groupName === this.groupName);
                                    // TODO button.classList.toggle('selected', groupName === currentGroupName);
                                ]);

                                content.push(ASUIInputButton.createInputButton(
                                    'add-group',
                                    '+',
                                    e => this.groupAdd(e)
                                ));
                                return content;
                            }
                        ]),

                        this.panelTrackerRowSegments = ASCPanel.createElement('tracker-row-segments', [
                            ASUIDiv.cE('title', 'Tracker Segments'),
                            () => {
                                const segmentLengthInTicks = this.state.tracker.segmentLengthInTicks || (this.song.timeDivision * 16);
                                let songLengthInTicks = this.song.getSongLengthInTicks();
                                let rowSegmentCount = Math.ceil(songLengthInTicks / segmentLengthInTicks) || 1;
                                if (rowSegmentCount > 256)
                                    rowSegmentCount = 256;

                                this.panelTrackerRowSegmentButtons = [];

                                // let rowSegmentCount = Math.ceil(lastSegmentRowPositionInTicks / segmentLengthInTicks) + 1;
                                const currentRowSegmentID = this.state.tracker.currentRowSegmentID;
                                if (rowSegmentCount < currentRowSegmentID + 1)
                                    rowSegmentCount = currentRowSegmentID + 1;
                                for (let segmentID = 0; segmentID <= rowSegmentCount; segmentID++) {
                                    this.panelTrackerRowSegmentButtons[segmentID] = ASUIInputButton.createInputButton(
                                        {selected: segmentID === currentRowSegmentID},
                                        segmentID,
                                        e => this.trackerChangeSegment(segmentID),
                                        "Segment " + segmentID);
                                    // panelElm.classList.toggle('selected', segmentID === currentRowSegmentID);
                                    // button.classList.toggle('selected', segmentID === currentRowSegmentID);
                                }
                                return this.panelTrackerRowSegmentButtons;
                            }
                        ]),
                    ]),

                    ASUIDiv.createElement('asc-tracker-container', [
                        ASCUITracker.createElement({
                            key: 'asc-tracker',
                            tabindex: 0,
                            composer: this
                        }, )
                    ]),

                    ASUIDiv.cE('asc-status-container', [
                        ASUIDiv.cE({key: 'asc-status-text', ref:ref=>this.textStatus=ref}, () => this.state.status),
                        ASUIDiv.cE({key: 'asc-version-text', ref:ref=>this.textVersion=ref}, () => this.state.version),
                    ]),
                ])
            ];
        }


        setStatus(newStatus) {
            console.info.apply(null, arguments); // (newStatus);
            this.state.status = newStatus;
            if(this.textStatus)
                this.textStatus.forceUpdate();
        }

        setVersion(versionString) {
            this.state.version = versionString;
            if(this.textVersion)
                this.textVersion.forceUpdate();
        }


        // get fieldinstrumentAdd()
        // TODO: AudioSourceComposerSongFormRenderer()
        updateForms() {
            this.fieldSongName.value = this.song.name;
            this.fieldSongVersion.value = this.song.version;
            this.fieldSongBPM.value = this.song.startingBeatsPerMinute;

            this.fieldSongVolume.value = this.song.getVolumeValue();

            let selectedIndicies = this.getSelectedIndicies();
            // let timeDivision = this.rowLengthInTicks || this.song.getSongTimeDivision();
            const cursorInstruction = this.song.instructionFind(this.state.tracker.currentGroup, selectedIndicies[0]);


            if (cursorInstruction) {
                this.fieldInstructionCommand.value = cursorInstruction.command; // , "Unknown Instrument");
                this.fieldInstructionInstrument.addOrSetValue(cursorInstruction.instrument, cursorInstruction.instrument + ": Unknown Instrument");
                this.fieldInstructionVelocity.value = cursorInstruction.velocity;
                this.fieldInstructionDuration.value = cursorInstruction.duration;
            }

            this.fieldInstructionDelete.disabled = selectedIndicies.length === 0;
            if (!this.fieldTrackerRowLength.value)
                this.fieldTrackerRowLength.setValue(this.song.timeDivision);
            // this.fieldTrackerRowLength.value = this.fieldTrackerRowLength.value; // this.song.getSongTimeDivision();
            if (!this.fieldInstructionDuration.value && this.fieldTrackerRowLength.value)
                this.fieldInstructionDuration.setValue(parseInt(this.fieldTrackerRowLength.value));


        }

        /** @deprecated shouldn't be used **/
        renderInstrument(instrumentID) {
            if (this.instruments[instrumentID])
                this.instruments[instrumentID].forceUpdate();
        }

        async renderInstruments() {
            // console.log("rendering instruments");
            clearTimeout(this.timeouts.renderInstruments);
            this.timeouts.renderInstruments = setTimeout(async () => {
                await this.panelInstruments.forceUpdate();
                await this.panelInstructions.forceUpdate();
            }, 200);
        }

    }

    class ASCPanel extends ASUIDiv {
        constructor(props = {}, title, contentCallback) {
            super(props, contentCallback);
            this.state.title = title;
        }

        render() {
            return [
                this.state.title ? ASUIDiv.createElement('title', this.state.title) : null,
                super.render()
            ]
        }
    }

    if(isBrowser)
        customElements.define('asc-panel', ASCPanel);

    class ASCForm extends ASCPanel {
    }

    if(isBrowser)
        customElements.define('asc-form', ASCForm);


    class ASCInstrumentRenderer extends ASUIComponent {
        constructor(props = {}, song, instrumentID) {
            super(props, {});
            this.props.id = instrumentID;
            this.song = song;
        }

        render() {
            const instrumentID = this.props.id;
            const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);

            let content = [];

            if (this.song.hasInstrument(instrumentID)) {

                try {
                    const instrument = this.song.getLoadedInstrument(instrumentID);
                    const instrumentConfig = this.song.getInstrumentConfig(instrumentID);

                    if (instrument === null) {
                        content.push(ASUIDiv.createElement('loading', "Instrument Loading..."));
                    } else if (instrument instanceof HTMLElement) {
                        content.push(instrument);
                    } else if (typeof instrument.render === "function") {
                        content.push(instrument.render());
                    } else {
                        content.push(ASUIDiv.createElement('error', "No Instrument Renderer"));
                    }

                } catch (e) {
                    content.push(ASUIDiv.createElement('error', e.message));
                }
            } else {
                let titleHTML = `${instrumentIDHTML}: No Instrument`;
                content = [
                    ASUIDiv.createElement('header', [
                        this.menu = ASUIMenu.cME(
                            {vertical: true},
                            titleHTML,
                            [
                                ASUIMenu.cME({}, 'Change Instrument to',
                                    async () => {
                                        const instrumentLibrary = await AudioSourceLibrary.loadDefaultLibrary(); // TODO: get default library url from composer?
                                        return instrumentLibrary.eachInstrument((instrumentConfig) =>
                                            ASUIMenu.cME({}, instrumentConfig.name, null, () => {
                                                this.song.instrumentReplace(instrumentID, instrumentConfig);
                                            })
                                        );
                                    }
                                ),
                                ASUIMenu.cME({}, 'Rename Instrument', null, () => this.song.instrumentRename(instrumentID)),
                                ASUIMenu.cME({}, 'Remove Instrument', null, () => this.song.instrumentRemove(instrumentID)),
                            ]
                        ),
                    ]),
                ]
            }

            return content;
        }
    }

    if(isBrowser)
        customElements.define('asc-instrument', ASCInstrumentRenderer);


    /** Export this script **/
    thisModule.exports = {
        AudioSourceComposerRenderer,
    };

}).apply(null, (function() {
    const thisScriptPath = 'composer/audio-source-composer-renderer.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [thisRequire, thisModule, thisScriptPath, isBrowser]
})());
