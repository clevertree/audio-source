(async function() {


    /** Register Script Exports **/
    function getThisScriptPath() { return 'composer/audio-source-composer-renderer.js'; }
    const exportThisScript = function(module) {
        module.exports = {AudioSourceComposerRenderer};
    }

    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();

    const {AudioSourceLibrary} = await requireAsync('common/audio-source-library.js');

    class AudioSourceComposerRenderer extends HTMLElement {
        constructor() {
            super();
            this.shadowDOM = null;
        }


        render(force = false) {
            const linkHRefComposer = this.getScriptDirectory('composer/assets/audio-source-composer-internal.css');
            const linkHRefCommon = this.getScriptDirectory('common/assets/audio-source-common.css');

            if (force || !this.shadowDOM) {
                this.shadowDOM = this.shadowDOM || this.attachShadow({mode: 'open'});
                this.shadowDOM.innerHTML = `
            <link rel="stylesheet" href="${linkHRefComposer}" />
            <link rel="stylesheet" href="${linkHRefCommon}" />
            <asui-div key="asc-container"></asui-div>
            `;
                this.containerElm = this.shadowDOM.querySelector('asui-div[key=asc-container]');
            }

            let divElm = this.containerElm;
            divElm.addDiv('asc-menu-container', (divElm) => {
                this.menuFile = divElm.addSubMenu('File', divElm => this.populateMenu(divElm, 'file'));
                this.menuEdit = divElm.addSubMenu('Edit', divElm => this.populateMenu(divElm, 'edit'));
                this.menuGroup = divElm.addSubMenu('Group', divElm => this.populateMenu(divElm, 'group'));
                this.menuInstrument = divElm.addSubMenu('Instrument', divElm => this.populateMenu(divElm, 'instrument'));
                this.menuView = divElm.addSubMenu('View', divElm => this.populateMenu(divElm, 'view'));
                this.menuContext = divElm.addSubMenu('', divElm => this.populateMenu(divElm, 'context'));
            });

            this.panelContainerElm = divElm.addDiv('asc-panel-container', (divElm) => {
                divElm.addDiv('asc-panel-song', (divElm) => {
                    divElm.classList.add('asc-panel');
                    divElm.addDiv('caption', 'Song');

                    divElm.addDiv('asc-form-playback', divElm => {
                        divElm.classList.add('asc-form');
                        divElm.addDiv('caption', 'Playback');
                        this.fieldSongPlaybackPlay = new AudioSourceUIButton('play',
                            e => this.songPlay(e),
                            new AudioSourceUIIcon('play'),
                            "Play Song");
                        this.fieldSongPlaybackPause = new AudioSourceUIButton('pause',
                            e => this.songPause(e),
                            new AudioSourceUIIcon('pause'),
                            "Pause Song");
                        // this.fieldSongPlaybackPause.disabled = true;
                        this.fieldSongPlaybackStop = new AudioSourceUIButton('stop',
                            e => this.songStop(e),
                            new AudioSourceUIIcon('stop'),
                            "Stop Song");
                    });

                    divElm.addDiv('asc-form-timing', divElm => {
                        divElm.classList.add('asc-form');
                        divElm.addDiv('caption', 'Timing');
                        this.fieldSongTiming = divElm.addTextInput('timing',
                            (e, pos) => this.setSongPosition(e, pos),
                            'Song Timing',
                            '00:00:000'
                        );
                    });

                    divElm.addDiv('asc-form-position', divElm => {
                        divElm.classList.add('asc-form');
                        divElm.addDiv('caption', 'Position');
                        this.fieldSongPosition = divElm.addRangeInput('position',
                            (e, pos) => this.setSongPosition(e, pos),
                            0,
                            Math.ceil(this.song.getSongLength()),
                            'Song Position',
                            0
                        );
                    });

                    divElm.addDiv('asc-form-volume', divElm => {
                        divElm.classList.add('asc-form');
                        divElm.addDiv('caption', 'Volume');
                        this.fieldSongVolume = divElm.addRangeInput('volume',
                            (e, newVolume) => this.setSongVolume(e, newVolume), 1, 100, 'Song Volume', this.song.getVolumeValue());
                    });

                    divElm.addDiv('asc-form-file', divElm => {
                        divElm.classList.add('asc-form');
                        divElm.addDiv('caption', 'File');
                        this.fieldSongFileLoad = divElm.addFileInput('file-load',
                            e => this.loadSongFromFileInput(),
                            new AudioSourceUIIcon('file-load'),
                            `.json,.mid,.midi`,
                            "Load Song from File"
                        );
                        this.fieldSongFileSave = new AudioSourceUIButton('file-save',
                            e => this.saveSongToFile(),
                            new AudioSourceUIIcon('file-save'),
                            "Save Song to File"
                        );
                    });


                    divElm.addDiv('asc-form-name', divElm => {
                        divElm.classList.add('asc-form');
                        divElm.addDiv('caption', 'Name');
                        this.fieldSongName = divElm.addTextInput('name',
                            (e, newSongName) => this.setSongName(e, newSongName), "Song Name");
                    });

                    divElm.addDiv('asc-form-version', divElm => {
                        divElm.classList.add('asc-form');
                        divElm.addDiv('caption', 'Version');
                        this.fieldSongVersion = divElm.addTextInput('version',
                            (e, newSongVersion) => this.setSongVersion(e, newSongVersion));
                    });

                    divElm.addDiv('asc-form-bpm', divElm => {
                        divElm.classList.add('asc-form');
                        divElm.addDiv('caption', 'BPM');
                        this.fieldSongBPM = divElm.addTextInput('bpm',
                            (e, newBPM) => this.setStartingBPM(e, parseInt(newBPM)));
                        this.fieldSongBPM.inputElm.setAttribute('type', 'number');
                    });
                });

                this.panelInstruments = divElm.addDiv('asc-panel-instruments', (panelElm) => {
                    panelElm.classList.add('asc-panel');
                    panelElm.addDiv('caption', 'Instruments');

                    // const instrumentPanel = this.panelInstruments;
                    const instrumentList = this.song.getInstrumentList();
                    for (let instrumentID = 0; instrumentID < instrumentList.length; instrumentID++) {

                        // instrumentFormElm.classList.add('asc-form');

                        panelElm.addDiv(instrumentID, instrumentFormElm => {
                            const instrument = this.song.getInstrument(instrumentID, false);


                            if (instrument) {
                                try {


                                    if (instrument instanceof HTMLElement) {
                                        instrument.setAttribute('data-id', instrumentID + '');
                                        instrumentFormElm.appendChild(instrument);

                                    } else if (typeof instrument.render === "function") {
                                        const renderedHTML = instrument.render(instrumentFormElm);
                                        if (renderedHTML)
                                            instrumentFormElm.innerHTML = renderedHTML;
                                    } else {
                                        instrumentFormElm.innerHTML = "No Renderer";
                                    }

                                } catch (e) {
                                    instrumentFormElm.innerHTML = e;
                                }

                            } else {
                                const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);
                                const instrumentToggleButton = instrumentFormElm.addButtonInput('instrument-id',
                                    null,
                                    instrumentIDHTML + ':'
                                );
                                instrumentToggleButton.classList.add('show-on-focus');
                                instrumentFormElm.classList.add('asc-form');
                                // Render 'empty' instrument
                                instrumentFormElm.addSelectInput('instrument-add-url',
                                    (e, changeInstrumentURL) => this.songReplaceInstrument(e, instrumentID, changeInstrumentURL),
                                    async (addOption) => {
                                        addOption('', 'Set Instrument');
                                        const instrumentLibrary = await AudioSourceLibrary.loadURL(this.defaultLibraryURL);
                                        instrumentLibrary.eachInstrument((instrumentConfig) => {
                                            addOption(instrumentConfig.url, instrumentConfig.name);
                                        });
                                    },
                                    'Set Instrument');
                            }
                        });
                        // TODO Update selected
                    }

                    panelElm.addDiv('add-new', instrumentFormElm => {
                        instrumentFormElm.classList.add('asc-form');
                        // Render 'empty' instrument
                        instrumentFormElm.addSelectInput('instrument-add-url',
                            (e, changeInstrumentURL) => this.songAddInstrument(e, changeInstrumentURL),
                            async (addOption) => {
                                addOption('', 'Add Instrument');
                                const instrumentLibrary = await AudioSourceLibrary.loadURL(this.defaultLibraryURL);
                                instrumentLibrary.eachInstrument((instrumentConfig) => {
                                    addOption(instrumentConfig.url, instrumentConfig.name);
                                });
                            },
                            'Add Instrument');
                    });
                });

                this.panelInstructions = divElm.addDiv('asc-panel-instructions', (divElm) => {
                    divElm.classList.add('asc-panel');
                    divElm.addDiv('caption', 'Selected Instruction(s)');
                    divElm.addDiv('asc-form-instruction-command', formElm => {
                        formElm.classList.add('asc-form');
                        formElm.addDiv('caption', 'Command');

                        this.fieldInstructionCommand = formElm.addSelectInput(
                            'command',
                            (e, commandString) => this.setInstructionCommand(e, commandString), (addOption, setOptgroup) => {
                                // const selectedInstrumentID = this.fieldInstructionInstrument ? parseInt(this.fieldInstructionInstrument.value) : 0;
                                addOption('', 'Select');
                                setOptgroup('Frequencies');
                                this.values.getValues('note-frequency-all', addOption);
                                setOptgroup('Custom Frequencies');
                                // TODO: filter by selected instrument
                                this.values.getValues('note-frequency-named', addOption);
                                setOptgroup('Groups');
                                this.values.getValues('command-group-execute', addOption);
                            },
                            'Instruction Instrument');

                        this.fieldInstructionInsert = formElm.addButtonInput(
                            'insert',
                            e => this.insertInstructionCommand(e),
                            formElm.createIcon('insert'),
                            "Insert Instruction");

                        this.fieldInstructionDelete = formElm.addButtonInput('delete',
                            e => this.deleteInstructionCommand(e),
                            formElm.createIcon('delete'),
                            "Delete Instruction");

                    });

                    divElm.addDiv('asc-form-instruction-instrument', formElm => {
                        formElm.classList.add('asc-form');
                        formElm.addDiv('caption', 'Instrument');

                        this.fieldInstructionInstrument = formElm.addSelectInput('instrument',
                            e => this.setInstructionInstrument(e), (addOption, setOptgroup) => {
                                addOption('', 'Select');
                                setOptgroup('Song Instruments');
                                this.values.getValues('song-instruments', addOption);
                            },
                            'Instruction Instrument');
                    });

                    divElm.addDiv('asc-form-instruction-velocity', formElm => {
                        formElm.classList.add('asc-form');
                        formElm.addDiv('caption', 'Velocity');

                        this.fieldInstructionVelocity = formElm.addRangeInput('velocity',
                            (e, newVelocity) => this.setInstructionVelocity(e, newVelocity), 1, 127);
                    });

                    divElm.addDiv('asc-form-instruction-duration', formElm => {
                        formElm.classList.add('asc-form');
                        formElm.addDiv('caption', 'Duration');

                        this.fieldInstructionDuration = formElm.addSelectInput('duration',
                            e => this.setInstructionDuration(e),
                            (addOption, setOptgroup) => {
                                addOption('', 'No Duration');
                                this.values.getValues('durations', addOption);
                            },
                            'Instruction Duration');
                    });

                });

                this.panelTracker = divElm.addDiv('asc-panel-tracker', (divElm) => {
                    divElm.classList.add('asc-panel');
                    divElm.addDiv('caption', 'Tracker');

                    divElm.addDiv('asc-form-tracker-row-length', formElm => {
                        formElm.classList.add('asc-form');
                        formElm.addDiv('caption', 'Row &#120491;');

                        this.fieldTrackerRowLength = formElm.addSelectInput('row-length',
                            e => this.setTrackerRowLength(e),
                            (addOption) => {
                                // addOption('', '-');
                                this.values.getValues('durations', addOption)
                            },
                            'Select Row Length',
                            this.song.timeDivision);
                    });
                    divElm.addDiv('asc-form-tracker-segment-length', formElm => {
                        formElm.classList.add('asc-form');
                        formElm.addDiv('caption', 'Seg &#120491;');

                        this.fieldTrackerSegmentLength = formElm.addSelectInput('segment-length',
                            e => this.setTrackerSegmentLength(e),
                            (addOption) => {
                                this.values.getValues('segment-lengths', addOption)
                            },
                            'Select Segment Length',
                            this.song.timeDivision * 16);
                    });
                    divElm.addDiv('asc-form-tracker-instrument', formElm => {
                        formElm.classList.add('asc-form');
                        formElm.addDiv('caption', 'Instrument');

                        this.fieldTrackerFilterInstrument = formElm.addSelectInput('filter-instrument',
                            e => this.setTrackerFilterInstrument(e),
                            (addOption, addGroup) => {
                                addOption('', 'No Filter');
                                addGroup("Filter By Instrument");
                                this.values.getValues('song-instruments', addOption)
                            },
                            'Filter By Instrument',
                            '');
                    });
                    divElm.addDiv('asc-form-tracker-selection', formElm => {
                        formElm.classList.add('asc-form');
                        formElm.addDiv('caption', 'Selection');

                        this.fieldTrackerSelection = formElm.addTextInput('selection',
                            e => this.setTrackerSelection(e),
                            'Selection',
                            '',
                            'No selection'
                        );
                    });
                    divElm.addDiv('asc-form-tracker-octave', formElm => {
                        formElm.classList.add('asc-form');
                        formElm.addDiv('caption', 'Octave');

                        this.fieldTrackerOctave = formElm.addSelectInput('octave',
                            e => this.setTrackerOctave(e),
                            (addOption) => {
                                // addOption('', 'No Octave Selected');
                                this.values.getValues('note-frequency-octaves', addOption)
                            },
                            'Select Octave',
                            3);
                    });


                    // this.querySelectorAll('.multiple-count-text').forEach((elm) => elm.innerHTML = (selectedIndicies.length > 1 ? '(s)' : ''));

                    // Status Fields

                    // const trackerOctave = this.fieldTrackerOctave.value;
                    // this.fieldTrackerOctave.value = trackerOctave !== null ? trackerOctave : 3;
                    // if(this.fieldTrackerOctave.value === null)
                    //     this.fieldTrackerOctave.value = 3; // this.status.currentOctave;
                });

                this.panelTrackerGroups = divElm.addDiv('asc-panel-tracker-groups', (panelElm) => {
                    panelElm.classList.add('asc-panel');
                    panelElm.addDiv('caption', 'Groups');

                    const currentGroupName = this.trackerElm.groupName;
                    Object.keys(this.song.data.instructions).forEach((groupName, i) => {
                        // const buttonForm = panelTrackerGroups.addForm(groupName);
                        const button = panelElm.addButtonInput(
                            groupName,
                            e => this.trackerElm.groupName = groupName,
                            groupName);
                        // panelTrackerGroups.classList.toggle('selected', groupName === this.groupName);
                        button.classList.toggle('selected', groupName === currentGroupName);
                    });

                    panelElm.addButtonInput(
                        'add-group',
                        e => this.songGroupAddNew(e),
                        '+');
                });

                this.panelTrackerRowSegments = divElm.addDiv('asc-panel-tracker-row-segments', (panelElm) => {
                    panelElm.classList.add('asc-panel');
                    panelElm.addDiv('caption', 'Tracker Segments');
                    let rowSegmentCount = this.rowSegmentCount; // TODO: calculate from song group


                    // let rowSegmentCount = Math.ceil(lastSegmentRowPositionInTicks / segmentLengthInTicks) + 1;
                    const currentRowSegmentID = this.trackerElm.currentRowSegmentID;
                    if (rowSegmentCount < currentRowSegmentID + 1)
                        rowSegmentCount = currentRowSegmentID + 1;
                    for (let segmentID = 0; segmentID <= rowSegmentCount; segmentID++) {
                        const button = panelElm.addButtonInput(
                            segmentID,
                            e => this.trackerElm.navigateSegment(segmentID),
                            segmentID);
                        panelElm.classList.toggle('selected', segmentID === currentRowSegmentID);
                        button.classList.toggle('selected', segmentID === currentRowSegmentID);
                    }

                });
            });


            divElm.addDiv('asc-tracker-container', this.trackerElm);


            divElm.addDiv('asc-status-container', (divElm) => {
                divElm.addDiv('status-text');
                divElm.addDiv('version-text'); // TODO:        <a href="https://github.com/clevertree/audio-source-composer" target="_blank" class="version-text">${this.versionString}</a>
            });


            this.containerElm.classList.toggle('fullscreen', this.classList.contains('fullscreen'));

            this.updateForms();
            // this.renderInstruments();
            // this.trackerElm.render();
        }


        // get fieldSongAddInstrument()
        // TODO: AudioSourceComposerSongFormRenderer()
        updateForms() {
            this.fieldSongName.value = this.song.getName();
            this.fieldSongVersion.value = this.song.getVersion();
            this.fieldSongBPM.value = this.song.getStartingBPM();

            this.fieldSongVolume.value = this.song.getVolumeValue();

            let selectedIndicies = this.getSelectedIndicies();
            // let timeDivision = this.rowLengthInTicks || this.song.getSongTimeDivision();
            const selectedInstructionList = this.song.getInstructions(this.trackerElm.groupName, selectedIndicies);
            let cursorInstruction = selectedInstructionList[0];


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

        renderInstrument(instrumentID) {
            const instrumentPanel = this.panelInstruments;
            // this.headerElm.innerHTML = `${instrumentIDHTML}: Loading...`;
            let instrumentForm = instrumentPanel.findChild(instrumentID);
            if (instrumentForm) {
                instrumentForm.render();
            } else {
                this.panelInstruments.render();
                console.warn("Instrument form not found: " + instrumentID + ". Rendering all instruments");
            }

        }

        renderInstruments() {
            this.panelInstruments.render();
        }

        populateMenu(divElm, menuKey) {
            /** File Menu **/
            switch (menuKey) {
                case 'file':
                    divElm.addActionMenu('New song',
                        (e) => this.loadNewSongData(e));

                    divElm.addSubMenu('Open song ►', divElm => {
                        divElm.addSubMenu('from Memory ►', async divElm => {
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

                        divElm.addActionMenu(`from File`, (e) => this.fieldSongFileLoad.inputElm.click()); // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
                        // menuFileOpenSongFromFile.disabled = true;
                        let menu = divElm.addActionMenu('from URL');
                        menu.disabled = true;
                    });

                    divElm.addSubMenu('Save song ►', divElm => {
                        divElm.addActionMenu('to Memory', (e) => this.saveSongToMemory(e));
                        divElm.addActionMenu('to File', (e) => this.saveSongToFile(e));
                    });

                    divElm.addSubMenu('Import song ►', divElm => {
                        divElm.addActionMenu('from MIDI File', (e) => this.fieldSongFileLoad.inputElm.click());
                        // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
                        // menuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
                        // menuFileImportSongFromMIDI.disabled = true;
                    });

                    let menu = divElm.addSubMenu('Export song ►', divElm => {
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
                    divElm.addSubMenu(`Add Instrument To Song ►`, async divElm => {
                        const instrumentLibrary = await AudioSourceLibrary.loadURL(this.defaultLibraryURL);
                        instrumentLibrary.eachInstrument((instrumentConfig) => {
                            divElm.addActionMenu(`${instrumentConfig.name}`, (e) => {
//                         this.fieldSongAddInstrument.value = instrumentURL;
                                this.songAddInstrument(e, instrumentConfig);
                            });
                        });
                    });


                    let instrumentCount = 0;
                    this.values.getValues('song-instruments', (instrumentID, label) => {
                        const isActive = this.song.isInstrumentLoaded(instrumentID);

                        const menuInstrument = divElm.addSubMenu(`${label} ►`, divElm => {
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
                        let menu = divElm.addSubMenu(`${groupName} ►`, divElm => {
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

                    divElm.addSubMenu(`Insert Command ►`, divElm => {
                        divElm.addSubMenu(`Frequency ►`, divElm => {
                            this.values.getValues('note-frequency-octaves', (octave, label) => {
                                divElm.addSubMenu(`Octave ${label} ►`, divElm => {
                                    this.values.getValues('note-frequency', (noteName, label) => {
                                        const fullNote = noteName + octave;
                                        divElm.addActionMenu(`${label}${octave}`, (e) => {
                                            this.fieldInstructionCommand.value = fullNote;
                                            this.insertInstructionCommand(e, fullNote);
                                        });
                                    });
                                });
                            });
                        });

                        divElm.addSubMenu(`Named ►`, divElm => {
                            this.values.getValues('note-frequency-named', (noteName, frequency, instrumentID) => {
                                divElm.addActionMenu(noteName, (e) => {
                                    this.fieldInstructionCommand.value = noteName;
                                    this.insertInstructionCommand(e, noteName, false, instrumentID);
                                })
                            });
                        });

                        divElm.addSubMenu(`Group ►`, divElm => {
                            this.values.getValues('song-groups', (groupName, groupTitle) => {
                                if (groupName === this.groupName)
                                    return;
                                divElm.addActionMenu(`${groupTitle}`, (e) => {
                                    const fullNote = '@' + groupName;
                                    this.fieldInstructionCommand.value = fullNote;
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
                        const menuEditSetCommand = divElm.addSubMenu(`Set Command ►`, divElm => {
                            divElm.addSubMenu(`Frequency ►`, divElm => {
                                this.values.getValues('note-frequency-octaves', (octave, label) => {
                                    divElm.addSubMenu(`Octave ${label} ►`, divElm => {
                                        this.values.getValues('note-frequency', (noteName, label) => {
                                            const fullNote = noteName + octave;
                                            divElm.addActionMenu(`${label}${octave}`, (e) => {
                                                this.fieldInstructionCommand.value = fullNote;
                                                this.setInstructionCommand(e, fullNote);
                                                // handleAction('instruction:command')(e);
                                            })
                                        });
                                    });
                                });
                            });

                            divElm.addSubMenu(`Named ►`, divElm => {
                                this.values.getValues('note-frequency-named', (noteName, frequency, instrumentID) => {
                                    divElm.addActionMenu(noteName, (e) => {
                                        this.fieldInstructionCommand.value = noteName;
                                        this.setInstructionCommand(e, noteName, false, instrumentID);
                                    })
                                });
                            });

                            divElm.addSubMenu(`Group ►`, divElm => {
                                this.values.getValues('song-groups', (groupName, groupTitle) => {
                                    if (groupName === this.groupName)
                                        return;
                                    divElm.addActionMenu(`${groupTitle}`, (e) => {
                                        const fullNote = '@' + groupName;
                                        this.fieldInstructionCommand.value = fullNote;
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

                        const menuEditSetInstrument = divElm.addSubMenu(`Set Instrument ►`, divElm => {
                            this.values.getValues('song-instruments', (instrumentID, label) => {
                                divElm.addActionMenu(`${label}`, (e) => {
                                    this.fieldInstructionInstrument.value = instrumentID;
                                    this.setInstructionInstrument(e, instrumentID);
                                    // handleAction('instruction:instrument')(e);
                                });
                            });
                        });
                        menuEditSetInstrument.disabled = selectedIndicies.length === 0;


                        const menuEditSetDuration = divElm.addSubMenu(`Set Duration ►`, divElm => {
                            this.values.getValues('durations', (durationInTicks, durationName) => {
                                divElm.addActionMenu(`${durationName}`, (e) => {
                                    this.fieldInstructionDuration.value = durationInTicks;
                                    this.setInstructionDuration(e, durationInTicks);
                                    // handleAction('instruction:duration')(e);
                                });
                            });
                            const menuCustom = divElm.addActionMenu(`Custom Duration`, (e) => this.setInstructionDuration(e, null, true));
                            menuCustom.hasBreak = true;
                        });
                        menuEditSetDuration.disabled = selectedIndicies.length === 0;


                        const menuEditSetVelocity = divElm.addSubMenu(`Set Velocity ►`, divElm => {
                            this.values.getValues('velocities', (velocity, velocityName) => {
                                divElm.addActionMenu(`${velocityName}`, (e) => {
                                    this.fieldInstructionVelocity.value = velocity;
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

                    const menuEditSelect = divElm.addSubMenu('Select ►', divElm => {
                        divElm.addActionMenu('Select Segment Instructions', (e) => this.setTrackerSelection(e, 'segment'));

                        divElm.addActionMenu('Select All Song Instructions', (e) => this.setTrackerSelection(e, 'all'));

                        // const menuSelectRow = MENU.getOrCreateSubMenu('row', 'Select Row Instructions');
                        // menuSelectRow.action = (e) => this.setTrackerSelection(e, 'row');
                        // menuSelectRow.disabled = true;
                        divElm.addActionMenu('Select No Instructions', (e) => this.setTrackerSelection(e, 'none'));

                        divElm.addSubMenu('Batch Select ►', async divElm => {
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

                    const menuEditBatch = divElm.addSubMenu('Batch ►', async divElm => {
                        divElm.addActionMenu('New Batch Command', (e) => this.batchRunCommand(e));

                        const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
                        const storage = new AudioSourceStorage();
                        const recentBatchCommands = storage.getBatchRecentCommands();
                        for (let i = 0; i < recentBatchCommands.length; i++) {
                            const recentBatchCommand = recentBatchCommands[i];
                            // let title = recentBatchCommand.match(/\/\*\*([^*/]+)/)[1].trim() || recentBatchCommand;
                            divElm.addSubMenu(recentBatchCommand, divElm => {
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