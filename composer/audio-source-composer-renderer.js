(async function() {


    /** Register Script Exports **/
    function getThisScriptPath() { return 'composer/audio-source-composer-renderer.js'; }
    const exportThisScript = function(module) {
        module.exports = {AudioSourceComposerRenderer};
    };

    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();

    const {AudioSourceLibrary} = await requireAsync('common/audio-source-library.js');
    const {AudioSourceUtilities} = await requireAsync('common/audio-source-utilities.js');
    const {AudioSourceValues} = await requireAsync('common/audio-source-values.js');
    const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
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

    const audioSourceValues = new AudioSourceValues;
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

        async connectedCallback() {
            this.shadowDOM = this.attachShadow({mode: 'closed'});

            // this.loadCSS();
            super.connectedCallback(false);

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

            await this.renderOS();
            this.loadState();

            this.loadMIDIInterface(e => this.onInput(e));        // TODO: wait for user input


            const Util = new AudioSourceUtilities;
            Util.loadPackageInfo()
                .then(packageInfo => this.setVersion(packageInfo.version));
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
            return [
                this.createStyleSheetLink('composer/assets/audio-source-composer.css'),
                this.createStyleSheetLink('common/assets/audio-source-common.css'),
                this.refs.containerElm = new ASUIDiv('asc-container', () => [
                    new ASUIDiv('asc-menu-container', () => [
                        this.refs.menuFile          = new ASUIMenu('File',      () => this.populateMenu('file')),
                        this.refs.menuEdit          = new ASUIMenu('Edit',      () => this.populateMenu('edit')),
                        this.refs.menuGroup         = new ASUIMenu('Group',     () => this.populateMenu('group')),
                        this.refs.menuInstrument    = new ASUIMenu('Instrument', () => this.populateMenu('instrument')),
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

                            new ASCForm('timing', 'Timing', () => [
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
                                    Math.ceil(this.song.getSongLengthInSeconds()),
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
                                    (e, newSongName) => this.setSongName(e, newSongName), "Song Name", this.song.name)
                            ]),

                            new ASCForm('version', 'Version', () => [
                                this.refs.fieldSongVersion = new ASUITextInput('version',
                                    (e, newSongVersion) => this.setSongVersion(e, newSongVersion), "Song Version", this.song.version)
                            ]),

                            new ASCForm('bpm', 'BPM', () => [
                                this.refs.fieldSongBPM = new ASUITextInput('bpm',
                                    (e, newBPM) => this.songChangeStartingBPM(e, parseInt(newBPM)),
                                    "Song BPM",
                                    this.song.startingBeatsPerMinute)
                                // this.refs.fieldSongBPM.inputElm.setAttribute('type', 'number')
                            ]),
                        ]),

                        this.refs.panelInstruments = new ASCPanel('instruments', 'Instruments', () => {

                            // const instrumentPanel = this.refs.panelInstruments;
                            const instrumentList = this.song.getInstrumentList();
                            const content = instrumentList.map((instrumentConfig, instrumentID) =>
                                new ASCInstrumentRenderer(this, instrumentID));
                            
                            content.push(new ASCForm('new', 'Add Instrument', () => [
                                new ASUISelectInput('add-url',
                                (e, changeInstrumentURL) => this.instrumentAdd(changeInstrumentURL),
                                async (s) => [
                                    s.getOption('', 'Add Instrument'),
                                    await (async () => {
                                        const content = [];
                                        const instrumentLibrary = await AudioSourceLibrary.loadFromURL(this.defaultLibraryURL);
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
                                    (e, commandString) => this.instructionChangeCommand(commandString),
                                    (selectElm) => [
                                        // const selectedInstrumentID = this.refs.fieldInstructionInstrument ? parseInt(this.refs.fieldInstructionInstrument.value) : 0;
                                        selectElm.getOption('', 'Select'),
                                        selectElm.getOptGroup('Frequencies'),
                                        audioSourceValues.getOctaveNoteFrequencies(selectElm.getOption),

                                        selectElm.getOptGroup('Custom Frequencies'),
                                        audioSourceValues.getAllNamedFrequencies(this.song, selectElm.getOption),
                                        // TODO: filter by selected instrument

                                        selectElm.getOptGroup('Groups'),
                                        audioSourceValues.getAllSongGroups(this.song, selectElm.getOption, '@'),
                                    ],
                                    'Instruction Instrument'),

                                this.refs.fieldInstructionInsert = new ASUIButtonInput(
                                    'insert',
                                    e => this.instructionInsert(),
                                    new ASUIcon('insert'),
                                    "Insert Instruction"),

                                this.refs.fieldInstructionDelete = new ASUIButtonInput('delete',
                                    e => this.instructionDelete(e),
                                    new ASUIcon('delete'),
                                    "Delete Instruction"),

                            ]),

                            new ASCForm('instruction-instrument', 'Instrument', () => [
                                this.refs.fieldInstructionInstrument = new ASUISelectInput('instrument',
                                    e => this.instructionChangeInstrument(),
                                    (selectElm) => [
                                        selectElm.getOption('', 'Select'),
                                        selectElm.getOptGroup('Song Instruments'),
                                        audioSourceValues.getSongInstruments(this.song, selectElm.getOption)
                                    ],
                                    'Instruction Instrument')
                            ]),

                            new ASCForm('instruction-velocity', 'Velocity', () => [
                                this.refs.fieldInstructionVelocity = new ASUIRangeInput('velocity',
                                    (e, newVelocity) => this.instructionChangeVelocity(newVelocity), 1, 127)
                            ]),

                            new ASCForm('instruction-duration', 'Duration', () => [
                                this.refs.fieldInstructionDuration = new ASUISelectInput('duration',
                                    e => this.instructionChangeDuration(),
                                    (selectElm) => [
                                        selectElm.getOption('', 'No Duration'),
                                        audioSourceValues.getNoteDurations(this.song, selectElm.getOption)
                                    ],
                                    'Instruction Duration'),
                            ]),

                        ]),

                        this.refs.panelTracker = new ASCPanel('tracker', 'Tracker', () => [
                            new ASCForm('tracker-row-length', 'Row &#120491;', () => [
                                this.refs.fieldTrackerRowLength = new ASUISelectInput('row-length',
                                    e => this.trackerChangeRowLength(),
                                    (selectElm) => audioSourceValues.getNoteDurations(this.song, selectElm.getOption),
                                    'Select Row Length',
                                    this.state.trackerRowLength),
                            ]),
                            new ASCForm('tracker-segment-length', 'Seg &#120491;', () => [
                                this.refs.fieldTrackerSegmentLength = new ASUISelectInput('segment-length',
                                    e => this.trackerChangeSegmentLength(),
                                    (selectElm) => audioSourceValues.getSegmentLengths(this.song,  selectElm.getOption),
                                    'Select Segment Length',
                                    this.state.trackerSegmentLength),
                            ]),
                            new ASCForm('tracker-instrument', 'Instrument', () => [
                                this.refs.fieldTrackerFilterInstrument = new ASUISelectInput('filter-instrument',
                                    e => this.trackerChangeInstrumentFilter(),
                                    (selectElm) => [
                                        selectElm.getOption('', 'No Filter'),
                                        selectElm.getOptGroup("Filter By Instrument"),
                                        audioSourceValues.getSongInstruments(this.song, selectElm.getOption)
                                    ],
                                    'Filter By Instrument',
                                    ''),
                            ]),
                            new ASCForm('tracker-selection', 'Selection', () => [
                                this.refs.fieldTrackerSelection = new ASUITextInput('selection',
                                    e => this.trackerChangeSelection(),
                                    'Selection',
                                    '',
                                    'No selection'
                                ),
                            ]),
                            new ASCForm('tracker-octave', 'Octave', () => [
                                this.refs.fieldTrackerOctave = new ASUISelectInput('octave',
                                    e => this.trackerChangeOctave(),
                                    (selectElm) => audioSourceValues.getOctaveNoteFrequencies(selectElm.getOption),
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

                        this.refs.panelTrackerGroups = new ASCPanel('tracker-groups',  'Groups', () => {

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
                                this.refs.panelTrackerRowSegmentButtons[segmentID] = new ASUIButtonInput(
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

        populateMenu(menuKey) {
            /** File Menu **/
            let content = [];
            switch (menuKey) {
                case 'file':
        
                    content = [

                        new ASUIMenu('New song', null,
                            (e) => this.loadNewSongData(e)),

                        new ASUIMenu('Open song ►', () => [
                            new ASUIMenu('from Memory ►', async () => {
                                const songRecentUUIDs = await audioSourceStorage.getRecentSongList() ;
                                return songRecentUUIDs.map(entry => new ASUIMenu(entry.name || entry.uuid,
                                    null, () => this.loadSongFromMemory(entry.uuid)));
                            }),

                            new ASUIMenu(`from File`, null, (e) => this.refs.fieldSongFileLoad.click()), // this.loadSongFromFileInput(this.refs.fieldSongFileLoad.inputElm);
                            // menuFileOpenSongFromFile.disabled = true;
                            new ASUIMenu('from URL', null, null, {disabled: true}),
                        ]),

                        new ASUIMenu('Save song ►', () => [
                            new ASUIMenu('to Memory', null, (e) => this.saveSongToMemory(e)),
                            new ASUIMenu('to File', null, (e) => this.saveSongToFile(e)),
                        ]),

                        new ASUIMenu('Import song ►', () => [
                            new ASUIMenu('from MIDI File', null, (e) => this.refs.fieldSongFileLoad.inputElm.click()),
                            // this.loadSongFromFileInput(this.refs.fieldSongFileLoad.inputElm);
                            // menuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
                            // menuFileImportSongFromMIDI.disabled = true;
                        ]),

                        new ASUIMenu('Export song ►', () => [
                            new ASUIMenu('to MIDI File', null, null, {disabled: true}),
                        ], null, {disabled: false}),
                    ];
                    break;

                case 'edit':
                    const selectedIndicies = this.getSelectedIndicies();

                    // const populateGroupCommands = (subMenuGroup, action) => {
                    //     subMenuGroup.populate = (e) => {
                    //         const MENU = e.menuElement;
                    //         audioSourceValues.getValues('song-groups', (groupName, groupTitle) => {
                    //             const menuEditSetCommandGroup = MENU.getOrCreateSubMenu(groupName, `${groupTitle}`);
                    //             menuEditSetCommandGroup.action = action;
                    //         });
                    //         const menuCustom = MENU.getOrCreateSubMenu('new', `Create New Group`);
                    //         menuCustom.action = e => this.groupAdd(e);
                    //         menuCustom.hasBreak = true;
                    //     };
                    // };
                    content = [
                        new ASUIMenu(`Insert Command ►`, () => [
                            new ASUIMenu(`Frequency ►`, () =>
                                audioSourceValues.getNoteOctaves((octave) =>
                                    new ASUIMenu(`Octave ${octave} ►`, () =>
                                        audioSourceValues.getNoteFrequencies((noteName) => {
                                            const fullNote = noteName + octave;
                                            return new ASUIMenu(fullNote, null, (e) => {
                                                this.refs.fieldInstructionCommand.value = fullNote;
                                                this.instructionInsert(fullNote);
                                            });
                                        })
                                    )
                                )
                            ),

                            new ASUIMenu(`Named ►`, () =>
                                audioSourceValues.getAllNamedFrequencies(this.song, (noteName, frequency, instrumentID) =>
                                    new ASUIMenu(noteName, null, (e) => {
                                        this.refs.fieldInstructionCommand.value = noteName;
                                        this.instructionInsert(noteName, false, instrumentID);
                                    })
                                )
                            ),

                            new ASUIMenu(`Group ►`, () => [
                                audioSourceValues.getAllSongGroups(this.song, (groupName) =>
                                    new ASUIMenu(`${groupName}`, null, (e) => {
                                        const fullNote = '@' + groupName;
                                        this.refs.fieldInstructionCommand.value = fullNote;
                                        this.instructionInsert(fullNote);
                                    }, {disabled: groupName === this.trackerElm.groupName})
                                ),
                                new ASUIMenu(`Create New Group`, null, (e) => this.groupAdd(e), {hasBreak: true}),
                            ]),

                            new ASUIMenu(`Custom Command`, null, (e) => this.instructionInsert(true)),
                            // menuCustom.hasBreak = true;
                        ]),
                        // menuEditInsertCommand.disabled = selectedIndicies.length > 0; // !this.cursorCell;
                        // menuEditInsertCommand.action = handleAction('song:new');

                        (selectedIndicies.length === 0 ? null : [
                            new ASUIMenu(`Set Command ►`, () => [
                                new ASUIMenu(`Frequency ►`, () =>
                                    audioSourceValues.getNoteOctaves((octave) =>
                                        new ASUIMenu(`Octave ${octave} ►`, () =>
                                            audioSourceValues.getNoteFrequencies((noteName, label) =>
                                                new ASUIMenu(`${noteName}${octave}`, (e) => {
                                                    this.refs.fieldInstructionCommand.value = `${noteName}${octave}`;
                                                    this.instructionChangeCommand(`${noteName}${octave}`);
                                                    // handleAction('instruction:command')(e);
                                                })
                                            )
                                        )
                                    )
                                ),

                                new ASUIMenu(`Named ►`, () => {
                                    audioSourceValues.getAllNamedFrequencies((noteName, frequency, instrumentID) => {
                                        new ASUIMenu(noteName, (e) => {
                                            this.refs.fieldInstructionCommand.value = noteName;
                                            this.instructionChangeCommand(noteName, false, instrumentID);
                                        })
                                    });
                                }),

                                new ASUIMenu(`Group ►`, () => {
                                    audioSourceValues.getAllSongGroups((groupName, groupTitle) => {
                                        if (groupName === this.groupName)
                                            return;
                                        new ASUIMenu(`${groupTitle}`, null, (e) => {
                                            const fullNote = '@' + groupName;
                                            this.refs.fieldInstructionCommand.value = fullNote;
                                            this.instructionChangeCommand(fullNote);
                                        });
                                    });
                                    const menuCustom = new ASUIMenu(`Create New Group`, null, (e) => this.groupAdd(e));
                                    menuCustom.hasBreak = true;
                                }),

                                new ASUIMenu(`Custom Command`, null, (e) => this.instructionChangeCommand(true), null, {hasBreak: true}),
                            ], null, {disabled: true}),

                            new ASUIMenu(`Set Instrument ►`, () => {
                                audioSourceValues.getSongInstruments(this.song, (instrumentID, label) => {
                                    new ASUIMenu(`${label}`, null, (e) => {
                                        this.refs.fieldInstructionInstrument.value = instrumentID;
                                        this.instructionChangeInstrument(instrumentID);
                                        // handleAction('instruction:instrument')(e);
                                    });
                                });
                            }, null, {disabled: selectedIndicies.length === 0}),

                            new ASUIMenu(`Set Duration ►`, () => [
                                audioSourceValues.getNoteDurations((durationInTicks, durationName) => {
                                    new ASUIMenu(`${durationName}`, null, (e) => {
                                        this.refs.fieldInstructionDuration.value = durationInTicks;
                                        this.instructionChangeDuration(durationInTicks);
                                        // handleAction('instruction:duration')(e);
                                    });
                                }),
                                new ASUIMenu(`Custom Duration`, (e) => this.instructionChangeDuration(null, true), null, {hasBreak: true}),
                            ], null, {disabled: selectedIndicies.length === 0}),

                            new ASUIMenu(`Set Velocity ►`, () => {
                                audioSourceValues.getNoteVelocities((velocity, velocityName) => {
                                    new ASUIMenu(`${velocityName}`, null, (e) => {
                                        this.refs.fieldInstructionVelocity.value = velocity;
                                        this.instructionChangeVelocity(velocity);
                                        // handleAction('instruction:velocity')(e);
                                    });
                                });
                                const menuCustom = new ASUIMenu(`Custom Velocity`, null, (e) => this.instructionChangeVelocity(null, true));
                                menuCustom.hasBreak = true;
                            }, null, {disabled: selectedIndicies.length === 0}),

                            new ASUIMenu(`Delete Instruction(s)`, (e) => this.instructionDelete(e), null, {disabled: selectedIndicies.length === 0}),
                        ]),

                        /** Select Instructions **/

                        new ASUIMenu('Select ►', () => {
                            new ASUIMenu('Select Segment Instructions', null, (e) => this.trackerChangeSelection('segment'));

                            new ASUIMenu('Select All Song Instructions', null, (e) => this.trackerChangeSelection('all'));

                            // const menuSelectRow = MENU.getOrCreateSubMenu('row', 'Select Row Instructions');
                            // menuSelectRow.action = (e) => this.trackerChangeSelection(e, 'row');
                            // menuSelectRow.disabled = true;
                            new ASUIMenu('Select No Instructions', null, (e) => this.trackerChangeSelection('none'));

                            new ASUIMenu('Batch Select ►', async () => {
                                new ASUIMenu('New Selection Command', null, (e) => this.batchSelect(e));

                                const recentBatchSearches = audioSourceStorage.getBatchRecentSearches();
                                for (let i = 0; i < recentBatchSearches.length; i++) {
                                    const recentBatchSearch = recentBatchSearches[i];
                                    // let title = recentBatchCommand.match(/\/\*\*([^*/]+)/)[1].trim() || recentBatchCommand;
                                    new ASUIMenu(recentBatchSearch, null, (e) => {
                                        this.batchSelect(e, recentBatchSearch, true);
                                    });
                                }
                            });

                        }, null, {hasBreak: true}),

                        /** Batch Instructions **/

                        new ASUIMenu('Batch ►', async () => [
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

                        ], null, {hasBreak: true}),
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
                    new ASUIMenu(`Add Instrument To Song ►`, async () => {
                        const instrumentLibrary = await AudioSourceLibrary.loadFromURL(this.defaultLibraryURL);
                        return instrumentLibrary.eachInstrument((instrumentConfig) => {
                            return new ASUIMenu(`${instrumentConfig.name}`, null, (e) => {
//                         this.refs.fieldinstrumentAdd.value = instrumentURL;
                                this.instrumentAdd(instrumentConfig);
                            });
                        });
                    });


                    let instrumentCount = 0;
                    audioSourceValues.getSongInstruments(this.song,(instrumentID, label) => {
                        const isActive = this.song.isInstrumentLoaded(instrumentID);

                        const menuInstrument = new ASUIMenu(`${label} ►`, () => {
                            new ASUIMenu(`Replace ►`, async (e) => {
                                const instrumentLibrary = await AudioSourceLibrary.loadFromURL(this.defaultLibraryURL);
                                instrumentLibrary.eachInstrument((instrumentConfig) => {
                                    new ASUIMenu(`${instrumentConfig.name}`, null, (e) => {
                                        this.instrumentReplace(instrumentID, instrumentConfig);
                                    });
                                });
                            });


                            let menu = new ASUIMenu(`Remove From Song`, null, (e) => {
                                this.instrumentRemove(instrumentID);
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
                    let groupCount = 0;
                    content = [
                        new ASUIMenu(`Add Group To Song`, null, (e) => {
                            this.groupAdd(e);
                        }),

                        audioSourceValues.getAllSongGroups(this.song, (groupName) =>
                            new ASUIMenu(`${groupName} ►`, () => [
                                new ASUIMenu(`Rename '${groupName}'`, null, (e) => {
                                    this.groupRename(groupName);
                                }),

                                new ASUIMenu(`Remove '${groupName}' From Song`, null, (e) => {
                                    this.groupRemove(groupName);
                                }),
                            ], {hasBreak: groupCount++ === 0})
                        )
                    ];
                    break;

            }

            return content;
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
            super({}, props);
            props.id = instrumentID;
            this.composerElm = composerElm;
        }

        async render() {
            const instrumentID = this.props.id;
            const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);
            const instrument = await this.composerElm.song.loadInstrument(instrumentID);
            const instrumentConfig = await this.composerElm.song.getInstrumentConfig(instrumentID);
            let captionHTML = `${instrumentIDHTML}: ${instrumentConfig.name || "Unnamed"}`;

            const content = [
                new ASUIDiv('caption', () => [
                    captionHTML,
                    new ASUIMenu(
                        new ASUIcon('config'),
                        () => [
                            new ASUIMenu('Change to ►',
                                async () => {
                                    const instrumentLibrary = await AudioSourceLibrary.loadDefaultLibrary(); // TODO: get default library url from composer?
                                    return instrumentLibrary.eachInstrument((instrumentConfig) =>
                                        new ASUIMenu(instrumentConfig.name, null, () => {
                                            this.instrumentReplace(instrumentID, instrumentConfig.url);
                                        })
                                    );
                                }
                            ),
                            new ASUIMenu('Rename', null, () => this.composerElm.instrumentRename(instrumentID)),
                            new ASUIMenu('Remove', null, () => this.composerElm.instrumentRemove(instrumentID)),
                        ], null, {style: {float: 'right'}}
                    )
                    // new ASUISelectInput('url',
                    //     (e, changeInstrumentURL) => this.instrumentReplace(e, instrumentID, changeInstrumentURL),
                    //     async (selectElm) =>
                    //         instrumentLibrary.eachInstrument((instrumentConfig) =>
                    //             selectElm.getOption(instrumentConfig.url, instrumentConfig.name)),
                    //     'Set Instrument'
                    // )
                ]),
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