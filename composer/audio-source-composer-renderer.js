(async function() {


    /** Register Script Exports **/
    function getThisScriptPath() { return 'composer/audio-source-composer-renderer.js'; }
    const exportThisScript = function(module) {
        module.exports = {AudioSourceComposerRenderer};
    };

    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();

    const {AudioSourceLibrary} = await requireAsync('common/audio-source-library.js');
    // const {AudioSourceUtilities} = await requireAsync('common/audio-source-utilities.js');
    const {AudioSourceValues} = await requireAsync('common/audio-source-values.js');
    const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
    const {
        ASUIComponent,
        ASUIDiv,
        ASUIMenu,
        ASUIGrid,
        ASUIGridRow,
        ASUIInputButton,
        ASUIFileInput,
        ASUIInputRange,
        ASUIInputSelect,
        ASUIInputText,
        ASUIcon,
    } = await requireAsync('common/audio-source-ui.js');

    const audioSourceStorage = new AudioSourceStorage();

    class AudioSourceComposerRenderer extends ASUIComponent {
        constructor(state={}, props={}) {
            super(state, props);
            this.state.trackerSegmentLength = null;
            this.state.trackerRowLength = null;

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

        get trackerSegmentLengthInTicks() { return this.state.trackerSegmentLength || this.song.timeDivision * 16; }
        get trackerRowLengthInTicks() { return this.state.trackerRowLength || this.song.timeDivision; }

        async render() {
            const instrumentLibrary = await AudioSourceLibrary.loadFromURL(this.defaultLibraryURL);
            return [
                this.createStyleSheetLink('composer/assets/audio-source-composer.css'),
                this.createStyleSheetLink('common/assets/audio-source-common.css'),
                this.refs.containerElm = new ASUIDiv('asc-container', () => [
                    new ASUIDiv('asc-menu-container', () => [
                        this.refs.menuFile          = new ASUIMenu('File',      () => this.populateMenu('file'), null, {vertical: true}),
                        this.refs.menuEdit          = new ASUIMenu('Edit',      () => this.populateMenu('edit'), null, {vertical: true}),
                        this.refs.menuGroup         = new ASUIMenu('Group',     () => this.populateMenu('group'), null, {vertical: true}),
                        this.refs.menuInstrument    = new ASUIMenu('Instrument', () => this.populateMenu('instrument'), null, {vertical: true}),
                        this.refs.menuView          = new ASUIMenu('View',      () => this.populateMenu('view'), null, {vertical: true}),
                        this.refs.menuContext       = new ASUIMenu('Context',   () => this.populateMenu('context'), null, {vertical: true}),
                    ]),

                    this.refs.panelContainerElm = new ASUIDiv('asc-panel-container', () => [
                        new ASCPanel('song', 'Song', () => [

                            new ASCForm('playback',  'Playback',() => [
                                this.refs.fieldSongPlaybackPlay = new ASUIInputButton('play',
                                    e => this.songPlay(e),
                                    new ASUIcon('play'),
                                    "Play Song"),
                                this.refs.fieldSongPlaybackPause = new ASUIInputButton('pause',
                                    e => this.songPause(e),
                                    new ASUIcon('pause'),
                                    "Pause Song"),
                                // this.refs.fieldSongPlaybackPause.disabled = true;
                                this.refs.fieldSongPlaybackStop = new ASUIInputButton('stop',
                                    e => this.songStop(e),
                                    new ASUIcon('stop'),
                                    "Stop Song")
                            ]),

                            new ASCForm('timing', 'Timing', () => [
                                this.refs.fieldSongTiming = new ASUIInputText('timing',
                                    (e, pos) => this.setSongPosition(e, pos),
                                    'Song Timing',
                                    '00:00:000'
                                )
                            ]),

                            new ASCForm('position', 'Position', () => [
                                this.refs.fieldSongPosition = new ASUIInputRange('position',
                                    (e, pos) => this.setSongPosition(e, pos),
                                    0,
                                    Math.ceil(this.song.getSongLengthInSeconds()),
                                    'Song Position',
                                    0
                                )
                            ]),

                            new ASCForm('volume', 'Volume',() => [
                                this.refs.fieldSongVolume = new ASUIInputRange('volume',
                                    (e, newVolume) => this.setSongVolume(e, newVolume), 1, 100, 'Song Volume', this.song.getVolumeValue())
                            ]),

                            new ASCForm('file', 'File', () => [
                                this.refs.fieldSongFileLoad = new ASUIFileInput('file-load',
                                    e => this.loadSongFromFileInput(),
                                    new ASUIcon('file-load'),
                                    `.json,.mid,.midi`,
                                    "Load Song from File"
                                ),
                                this.refs.fieldSongFileSave = new ASUIInputButton('file-save',
                                    e => this.saveSongToFile(),
                                    new ASUIcon('file-save'),
                                    "Save Song to File"
                                ),
                            ]),


                            new ASCForm('name', 'Name', () => [
                                this.refs.fieldSongName = new ASUIInputText('name',
                                    (e, newSongName) => this.setSongName(e, newSongName), "Song Name", this.song.name)
                            ]),

                            new ASCForm('version', 'Version', () => [
                                this.refs.fieldSongVersion = new ASUIInputText('version',
                                    (e, newSongVersion) => this.setSongVersion(e, newSongVersion), "Song Version", this.song.version)
                            ]),

                            new ASCForm('bpm', 'BPM', () => [
                                this.refs.fieldSongBPM = new ASUIInputText('bpm',
                                    (e, newBPM) => this.songChangeStartingBPM(e, parseInt(newBPM)),
                                    "Song BPM",
                                    this.song.startingBeatsPerMinute)
                                // this.refs.fieldSongBPM.inputElm.setAttribute('type', 'number')
                            ]),
                        ]),

                        this.refs.panelInstruments = new ASCPanel('instruments', 'Instruments', () => {

                            // const instrumentPanel = this.refs.panelInstruments;
                            this.refs.instruments = [];
                            const instrumentList = this.song.getInstrumentList();
                            const content = instrumentList.map((instrumentConfig, instrumentID) =>
                                this.refs.instruments[instrumentID] = new ASCInstrumentRenderer(this, instrumentID));
                            
                            content.push(new ASCForm('new', null, () => [
                                new ASUIInputSelect('add-url',
                                (s) => [
                                    // s.getOption('', 'Add instrument'),
                                    instrumentLibrary.eachInstrument((instrumentConfig) =>
                                        s.getOption(instrumentConfig.url)),
                                ],
                                (e, changeInstrumentURL) => this.instrumentAdd(changeInstrumentURL),
                                '',
                                'Add instrument')
                            ]));
                            return content;
                        }),

                        this.refs.panelInstructions = new ASCPanel('instructions', 'Selected Instruction(s)', () => [
                            new ASCForm('instruction-command', 'Command', () => [
                                this.refs.fieldInstructionCommand = new ASUIInputSelect(
                                    'command',
                                    (selectElm) => [
                                        // const selectedInstrumentID = this.refs.fieldInstructionInstrument ? parseInt(this.refs.fieldInstructionInstrument.value) : 0;
                                        selectElm.getOption(null, 'Select'),
                                        selectElm.value ?
                                            selectElm.getOptGroup('Current Octave', () => {
                                                const currentOctave = this.refs.fieldInstructionCommand.value.substr(-1, 1);
                                                return this.values.getNoteFrequencies(freq => selectElm.getOption(freq + currentOctave));
                                            }) : null,
                                        selectElm.getOptGroup('Frequencies', () =>
                                            this.values.getOctaveNoteFrequencies(freq => selectElm.getOption(freq)),
                                        ),

                                        selectElm.getOptGroup('Custom Frequencies', () =>
                                            this.values.getAllNamedFrequencies(namedFreq => selectElm.getOption(namedFreq)),
                                        ),
                                        // TODO: filter by selected instrument

                                        selectElm.getOptGroup('Groups', () =>
                                            this.values.getAllSongGroups(group => selectElm.getOption('@' + group)),
                                        ),
                                    ],
                                    (e, commandString) => this.instructionChangeCommand(commandString),
                                ),

                                this.refs.fieldInstructionInsert = new ASUIInputButton(
                                    'insert',
                                    e => this.instructionInsert(),
                                    new ASUIcon('insert'),
                                    "Insert Instruction"),

                                this.refs.fieldInstructionDelete = new ASUIInputButton('delete',
                                    e => this.instructionDelete(e),
                                    new ASUIcon('delete'),
                                    "Delete Instruction"),

                            ]),

                            new ASCForm('instruction-instrument', 'Instrument', () => [
                                this.refs.fieldInstructionInstrument = new ASUIInputSelect('instrument',
                                    (selectElm) => [
                                        selectElm.getOption(null, 'Select'),
                                        selectElm.getOptGroup('Song Instruments'),
                                        this.values.getSongInstruments((id, name) => selectElm.getOption(id, name))
                                    ],
                                    e => this.instructionChangeInstrument(),
                                )
                            ]),

                            new ASCForm('instruction-velocity', 'Velocity', () => [
                                this.refs.fieldInstructionVelocity = new ASUIInputRange('velocity',
                                    (e, newVelocity) => this.instructionChangeVelocity(newVelocity), 1, 127)
                            ]),

                            new ASCForm('instruction-duration', 'Duration', () => [
                                this.refs.fieldInstructionDuration = new ASUIInputSelect('duration',
                                    (selectElm) => [
                                        selectElm.getOption('', 'No Duration'),
                                        this.values.getNoteDurations((duration, title) => selectElm.getOption(duration, title))
                                    ],
                                    e => this.instructionChangeDuration(),
                                    ),
                            ]),

                        ]),

                        this.refs.panelTracker = new ASCPanel('tracker', 'Tracker', () => [
                            new ASCForm('tracker-row-length', 'Row &#120491;', () => [
                                this.refs.fieldTrackerRowLength = new ASUIInputSelect('row-length',
                                    (selectElm) => this.values.getNoteDurations((duration, title) => selectElm.getOption(duration, title)),
                                    e => this.trackerChangeRowLength(),
                                    value => this.values.formatDuration(value),
                                    this.state.trackerRowLength),
                            ]),
                            new ASCForm('tracker-segment-length', 'Seg &#120491;', () => [
                                this.refs.fieldTrackerSegmentLength = new ASUIInputSelect('segment-length',
                                    (selectElm) => this.values.getSegmentLengths((length, title) => selectElm.getOption(length, title)),
                                    e => this.trackerChangeSegmentLength(),
                                    this.state.trackerSegmentLength),
                            ]),
                            new ASCForm('tracker-instrument', 'Instrument', () => [
                                this.refs.fieldTrackerFilterInstrument = new ASUIInputSelect('filter-instrument',
                                    (selectElm) => [
                                        selectElm.getOption('', 'No Filter'),
                                        this.values.getSongInstruments((id, name) => selectElm.getOption(id, name))
                                    ],
                                    e => this.trackerChangeInstrumentFilter(),
                                    ''),
                            ]),
                            new ASCForm('tracker-selection', 'Selection', () => [
                                this.refs.fieldTrackerSelection = new ASUIInputText('selection',
                                    e => this.trackerChangeSelection(),
                                    'Selection',
                                    '',
                                    'No selection'
                                ),
                            ]),
                            new ASCForm('tracker-octave', 'Octave', () => [
                                this.refs.fieldTrackerOctave = new ASUIInputSelect('octave',
                                    (selectElm) => this.values.getOctaveNoteFrequencies(opt => selectElm.getOption(opt)),
                                    e => this.trackerChangeOctave(),
                                    // addOption('', 'No Octave Selected');
                                    3),
                            ]),


                            // this.querySelectorAll('.multiple-count-text').forEach((elm) => elm.innerHTML = (selectedIndicies.length > 1 ? '(s)' : ''));

                            // Status Fields

                            // const trackerOctave = this.refs.fieldTrackerOctave.value;
                            // this.refs.fieldTrackerOctave.value = trackerOctave !== null ? trackerOctave : 3;
                            // if(this.refs.fieldTrackerOctave.value === null)
                            //     this.refs.fieldTrackerOctave.value = 3; // this.status.currentOctave;
                        ]),

                        this.refs.panelTrackerGroups = new ASCPanel('tracker-groups',  'Groups', () => {

                            const currentGroupName = this.trackerElm.groupName;
                            const content = Object.keys(this.song.data.instructions).map((groupName, i) => [
                                // const buttonForm = panelTrackerGroups.addForm(groupName);
                                new ASUIInputButton(
                                    groupName,
                                    e => this.trackerElm.groupName = groupName,
                                    groupName),
                                // panelTrackerGroups.classList.toggle('selected', groupName === this.groupName);
                                // TODO button.classList.toggle('selected', groupName === currentGroupName);
                            ]);

                            content.push(new ASUIInputButton(
                                'add-group',
                                e => this.groupAdd(e),
                                '+'));
                            return content;
                        }),

                        this.refs.panelTrackerRowSegments = new ASCPanel('tracker-row-segments', 'Tracker Segments', () => {
                            const segmentLengthInTicks = this.trackerSegmentLengthInTicks;
                            let songLengthInTicks = this.song.getSongLengthInTicks();
                            let rowSegmentCount = Math.ceil(songLengthInTicks / segmentLengthInTicks) || 1;

                            this.refs.panelTrackerRowSegmentButtons = [];

                            // let rowSegmentCount = Math.ceil(lastSegmentRowPositionInTicks / segmentLengthInTicks) + 1;
                            const currentRowSegmentID = this.trackerElm.state.currentRowSegmentID;
                            if (rowSegmentCount < currentRowSegmentID + 1)
                                rowSegmentCount = currentRowSegmentID + 1;
                            for (let segmentID = 0; segmentID <= rowSegmentCount; segmentID++) {
                                this.refs.panelTrackerRowSegmentButtons[segmentID] = new ASUIInputButton(
                                    segmentID,
                                    e => this.trackerChangeSegment(segmentID),
                                    segmentID,
                                    "Segment " + segmentID,
                                    {selected: segmentID === currentRowSegmentID});
                                // panelElm.classList.toggle('selected', segmentID === currentRowSegmentID);
                                // button.classList.toggle('selected', segmentID === currentRowSegmentID);
                            }
                            return this.refs.panelTrackerRowSegmentButtons;
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


        // get fieldinstrumentAdd()
        // TODO: AudioSourceComposerSongFormRenderer()
        updateForms() {
            this.refs.fieldSongName.value = this.song.name;
            this.refs.fieldSongVersion.value = this.song.version;
            this.refs.fieldSongBPM.value = this.song.startingBeatsPerMinute;

            this.refs.fieldSongVolume.value = this.song.getVolumeValue();

            let selectedIndicies = this.getSelectedIndicies();
            // let timeDivision = this.rowLengthInTicks || this.song.getSongTimeDivision();
            const cursorInstruction = this.song.instructionFind(this.trackerElm.groupName, selectedIndicies[0]);


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

        /** @deprecated shouldn't be used **/
        renderInstrument(instrumentID) {
            if(this.refs.instruments[instrumentID])
                this.refs.instruments[instrumentID].renderOS();
        }

        renderInstruments() {
            this.refs.panelInstruments.render();
        }

        async populateMenu(menuKey) {
            const library = await this.getLibrary();
            /** File Menu **/
            let content = [];
            switch (menuKey) {
                case 'file':
        
                    content = [

                        new ASUIMenu('New song', null,
                            (e) => this.loadNewSongData(e)),

                        new ASUIMenu('Open song', () => [
                            new ASUIMenu('from Memory', async () => {
                                const songRecentUUIDs = await audioSourceStorage.getRecentSongList() ;
                                return songRecentUUIDs.map(entry => new ASUIMenu(entry.name || entry.uuid,
                                    null, () => this.loadSongFromMemory(entry.uuid)));
                            }),

                            new ASUIMenu(`from File`, null, (e) => this.refs.fieldSongFileLoad.click()), // this.loadSongFromFileInput(this.refs.fieldSongFileLoad.inputElm);
                            // menuFileOpenSongFromFile.disabled = true;
                            new ASUIMenu('from URL', null, null, {disabled: true}),
                        ]),

                        new ASUIMenu('Save song', () => [
                            new ASUIMenu('to Memory', null, (e) => this.saveSongToMemory(e)),
                            new ASUIMenu('to File', null, (e) => this.saveSongToFile(e)),
                        ]),

                        new ASUIMenu('Import song', () => [
                            new ASUIMenu('from MIDI File', null, (e) => this.refs.fieldSongFileLoad.inputElm.click()),
                            // this.loadSongFromFileInput(this.refs.fieldSongFileLoad.inputElm);
                            // menuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
                            // menuFileImportSongFromMIDI.disabled = true;
                        ]),

                        new ASUIMenu('Export song', () => [
                            new ASUIMenu('to MIDI File', null, null, {disabled: true}),
                        ], null, {disabled: false}),
                    ];
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
                    //         menuCustom.action = e => this.groupAdd(e);
                    //         menuCustom.hasBreak = true;
                    //     };
                    // };
                    content = [
                        new ASUIMenu(`Insert Command`, () => [
                            new ASUIMenu(`Frequency`, () =>
                                this.values.getNoteFrequencies((noteName, label) =>
                                    new ASUIMenu(`${noteName}`, () =>
                                        this.values.getNoteOctaves((octave) =>
                                            new ASUIMenu(`${noteName}${octave}`, null, (e) => {
                                                this.refs.fieldInstructionCommand.value = `${noteName}${octave}`;
                                                this.instructionInsert(`${noteName}${octave}`, false);
                                            })
                                        )
                                    )
                                )
                            ),

                            new ASUIMenu(`Named`, () =>
                                this.values.getAllNamedFrequencies((noteName, frequency, instrumentID) =>
                                    new ASUIMenu(noteName, null, (e) => {
                                        this.refs.fieldInstructionCommand.value = noteName;
                                        this.instructionInsert(noteName, false, instrumentID);
                                    }))
                            ),

                            new ASUIMenu(`Group`, () => [
                                this.values.getAllSongGroups((groupName) =>
                                    new ASUIMenu(`${groupName}`, null, (e) => {
                                        const fullNote = '@' + groupName;
                                        this.refs.fieldInstructionCommand.value = fullNote;
                                        this.instructionInsert(fullNote, false);
                                    }, {disabled: groupName === this.trackerElm.groupName})),
                                new ASUIMenu(`Create New Group`, null, (e) => this.groupAdd(e), {hasBreak: true}),
                            ]),

                            new ASUIMenu(`Custom Command`, null, (e) => this.instructionInsert(null, true)),
                            // menuCustom.hasBreak = true;
                        ], null, {hasBreak: true}),
                        // menuEditInsertCommand.disabled = selectedIndicies.length > 0; // !this.cursorCell;
                        // menuEditInsertCommand.action = handleAction('song:new');

                        (selectedIndicies.length === 0 ? null : [
                            new ASUIMenu(`Set Command`, () => [
                                new ASUIMenu(`Frequency`, () =>
                                    this.values.getNoteFrequencies((noteName, label) =>
                                        new ASUIMenu(`${noteName}`, () =>
                                            this.values.getNoteOctaves((octave) =>
                                                new ASUIMenu(`${noteName}${octave}`, null, (e) => {
                                                    this.refs.fieldInstructionCommand.value = `${noteName}${octave}`;
                                                    this.instructionChangeCommand(`${noteName}${octave}`, false);
                                                    // handleAction('instruction:command')(e);
                                                })
                                            )
                                        )
                                    )
                                ),

                                new ASUIMenu(`Named`, () =>
                                    this.values.getAllNamedFrequencies((noteName, frequency, instrumentID) =>
                                        new ASUIMenu(noteName, null, (e) => {
                                            this.refs.fieldInstructionCommand.value = noteName;
                                            this.instructionChangeCommand(noteName, false, instrumentID);
                                        }))
                                ),

                                new ASUIMenu(`Group`, () => [
                                    this.values.getAllSongGroups((groupName) =>
                                        groupName === this.groupName ? null :
                                            new ASUIMenu(`${groupName}`, null, (e) => {
                                                const fullNote = '@' + groupName;
                                                this.refs.fieldInstructionCommand.value = fullNote;
                                                this.instructionChangeCommand(fullNote, false);
                                            })),
                                    new ASUIMenu(`Create New Group`, null, (e) => this.groupAdd(e), {hasBreak: true})
                                ]),

                                new ASUIMenu(`Custom Command`, null, (e) => this.instructionChangeCommand(null, true), {hasBreak: true}),
                            ]),

                            new ASUIMenu(`Set Instrument`, () =>
                                this.values.getSongInstruments((instrumentID, label) =>
                                    new ASUIMenu(`${label}`, null, (e) => {
                                        this.refs.fieldInstructionInstrument.value = instrumentID;
                                        this.instructionChangeInstrument(instrumentID);
                                        // handleAction('instruction:instrument')(e);
                                    }))
                            , null, {disabled: selectedIndicies.length === 0}),

                            new ASUIMenu(`Set Duration`, () => [
                                this.values.getNoteDurations((durationInTicks, durationName) =>
                                    new ASUIMenu(`${durationName}`, null, (e) => {
                                        this.refs.fieldInstructionDuration.value = durationInTicks;
                                        this.instructionChangeDuration(durationInTicks);
                                        // handleAction('instruction:duration')(e);
                                    })),
                                new ASUIMenu(`Custom Duration`, (e) => this.instructionChangeDuration(null, true), {hasBreak: true}),
                            ], null, {disabled: selectedIndicies.length === 0}),

                            new ASUIMenu(`Set Velocity`, () => [
                                this.values.getNoteVelocities((velocity) =>
                                    new ASUIMenu(`${velocity}`, null, (e) => {
                                        this.refs.fieldInstructionVelocity.value = velocity;
                                        this.instructionChangeVelocity(velocity);
                                        // handleAction('instruction:velocity')(e);
                                    })
                                ),
                                new ASUIMenu(`Custom Velocity`, null, (e) => this.instructionChangeVelocity(null, true), {hasBreak: true}),
                            ], null, {disabled: selectedIndicies.length === 0}),

                            new ASUIMenu(`Delete Instruction(s)`,
                                null,
                                (e) => this.instructionDelete(e),
                                {disabled: selectedIndicies.length === 0}),
                        ]),

                        /** Select Instructions **/

                        new ASUIMenu('Select', () => [
                            new ASUIMenu('Select Segment Instructions', null, (e) => this.trackerChangeSelection('segment')),

                            new ASUIMenu('Select All Song Instructions', null, (e) => this.trackerChangeSelection('all')),

                            // const menuSelectRow = MENU.getOrCreateSubMenu('row', 'Select Row Instructions');
                            // menuSelectRow.action = (e) => this.trackerChangeSelection(e, 'row');
                            // menuSelectRow.disabled = true;
                            new ASUIMenu('Select No Instructions', null, (e) => this.trackerChangeSelection('none')),

                            new ASUIMenu('Batch Select', async () => [
                                new ASUIMenu('New Selection Command', null, (e) => this.batchSelect(e)),

                                audioSourceStorage.getBatchRecentSearches().map(recentBatchSearch =>
                                    // let title = recentBatchCommand.match(/\/\*\*([^*/]+)/)[1].trim() || recentBatchCommand;
                                    new ASUIMenu(recentBatchSearch, null, (e) => {
                                        this.batchSelect(e, recentBatchSearch, true);
                                    })
                                )
                            ]),

                        ], null, {hasBreak: true}),

                        /** Batch Instructions **/

                        new ASUIMenu('Batch', async () => [
                            new ASUIMenu('New Batch Command', null, (e) => this.batchRunCommand(e)),
                            audioSourceStorage.getBatchRecentCommands().map((recentBatchCommand, i) =>
                                new ASUIMenu(recentBatchCommand, () => [
                                    new ASUIMenu("Execute on Group", null, (e) => {
                                        this.batchRunCommand(e, recentBatchCommand, true);
                                    }),

                                    new ASUIMenu("Execute using Search", (e) => [
                                        new ASUIMenu('New Search', null, (e) => this.batchRunCommand(e, recentBatchCommand, null, true)),
                                        audioSourceStorage.getBatchRecentSearches().map((recentBatchSearch, i) => {

                                            // let title = recentBatchCommand.match(/\/\*\*([^*/]+)/)[1].trim() || recentBatchCommand;
                                            new ASUIMenu(recentBatchSearch, null, (e) => {
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
                        new ASUIMenu(`${this.classList.contains('fullscreen') ? 'Disable' : 'Enable'} Fullscreen`,              null, (e) => this.toggleFullscreen(e)),
                        new ASUIMenu(`${this.classList.contains('hide-panel-song') ? 'Show' : 'Hide'} Song Forms`,              null, (e) => this.togglePanelSong(e)),
                        new ASUIMenu(`${this.classList.contains('hide-panel-tracker') ? 'Show' : 'Hide'} Track Forms`,          null, (e) => this.togglePanelTracker(e)),
                        new ASUIMenu(`${this.classList.contains('hide-panel-instruments') ? 'Show' : 'Hide'} Instrument Forms`, null, (e) => this.togglePanelInstruments(e)),
                    ];
                    break;

                case 'instrument':
                    content = [
                        new ASUIMenu(`Add instrument to song`,
                            async () =>
                            library.eachInstrument((instrumentConfig) =>
                                new ASUIMenu(`${instrumentConfig.name}`, null, (e) => {
                                    this.instrumentAdd(instrumentConfig);
                                })
                            ),
                            null, {hasBreak: true}),

                        this.values.getSongInstruments((instrumentID, label) =>
                            new ASUIMenu(`${label}`, () => [
                                new ASUIMenu(`Replace`, async (e) =>
                                    library.eachInstrument((instrumentConfig) =>
                                        new ASUIMenu(`${instrumentConfig.name}`, null, (e) =>
                                            this.instrumentReplace(instrumentID, instrumentConfig)
                                        )
                                    )
                                ),

                                new ASUIMenu(`Remove from song`, null, (e) => {
                                    this.instrumentRemove(instrumentID);
                                }, {disabled: !this.song.isInstrumentLoaded(instrumentID)})
                            ])),

                    ];
                    break;

                /** Group Menu **/
                case 'group':
                    let groupCount = 0;
                    content = [
                        new ASUIMenu(`Add new group to song`, null, (e) => {
                            this.groupAdd(e);
                        }, {hasBreak: true}),

                        this.values.getAllSongGroups((groupName) =>
                            new ASUIMenu(`${groupName}`, () => [
                                new ASUIMenu(`Rename group '${groupName}'`, null, (e) => {
                                    this.groupRename(groupName);
                                }),

                                new ASUIMenu(`Delete group '${groupName}' from song`, null, (e) => {
                                    this.groupRemove(groupName);
                                }),
                            ], {hasBreak: groupCount++ === 0}))
                    ];
                    break;

            }

            return content;
        }

    }

    class ASCPanel extends ASUIDiv {
        constructor(key, title, contentCallback, props={}) {
            super(key, contentCallback, props);
            this.state.title = title;
        }

        async render() {
            return [
                new ASUIDiv('title', this.state.title),
                super.render()
            ]
        }
    }
    customElements.define('asc-panel', ASCPanel);

    class ASCForm extends ASCPanel {}
    customElements.define('asc-form', ASCForm);
    

    class ASCInstrumentRenderer extends ASUIComponent {
        constructor(composerElm, instrumentID, props = {}) {
            super({}, props);
            props.id = instrumentID;
            this.composerElm = composerElm;
        }

        async render() {
            const instrumentID = this.props.id;
            const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);
            const instrument = await this.composerElm.song.loadInstrument(instrumentID);
            const instrumentConfig = await this.composerElm.song.getInstrumentConfig(instrumentID);
            let titleHTML = `${instrumentIDHTML}: ${instrumentConfig.name || "Unnamed"}`;

            const content = [
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