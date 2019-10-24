class AudioSourceComposerTracker extends HTMLElement {
    constructor() {
        super();
        this.editor = null;
        this.eventHandlers = [];
        this.segmentLength = 16;
        this.currentRowSegmentID = 0;
        // this.selectedIndicies = []

        this.mousePosition = {};
        if(!this.hasAttribute('tabindex'))
            this.setAttribute('tabindex', '0');
    }


    get groupName()             { return this.getAttribute('group'); }
    set groupName(groupName)    {
        if(!this.editor.song.hasGroup(groupName))
            throw new Error("Group not found in song: " + groupName);
        this.setAttribute('group', groupName);
        this.currentRowSegmentID = 0;
        this.render();
    }


    get isConnected() { return this.editor.containerElm.contains(this); }

    connectedCallback() {
        this.attachEventHandler([
                'scroll',
                'keydown',
                'mousedown', 'mouseup', 'mousemove', 'mouseout',
                'touchstart', 'touchend', 'touchmove',
                'dragstart', 'drag', 'dragend',
                'contextmenu'
            ],
            e => this.onInput(e));

        this.editor = this.getRootNode().host;
        // if(!this.getAttribute('rowLength'))
        //     this.setAttribute('rowLength', this.editor.song.timeDivision);
        this.render();
        // setTimeout(e => this.render(), 20);
        // setTimeout(e => this.render(), 1000);
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

    clearSelection(excludeElms=[]) {
        this.fieldTrackerSelection.value = '';
        // this.selectedIndicies = [];

        if(!Array.isArray(excludeElms))
            excludeElms = [excludeElms];

        // Update rows
        // this.querySelectorAll('asct-row.selected')
        //     .forEach((rowElm) => excludeElms.indexOf(rowElm) !== -1 ? null : rowElm.select(false));

        // Remove 'add' instructions
        this.parentNode.querySelectorAll('asct-instruction-add')
            .forEach((instructionElm) => excludeElms.indexOf(instructionElm) !== -1 ? null : instructionElm.parentNode.removeChild(instructionElm));

        // Update cells
        this.querySelectorAll('asct-instruction.selected')
            .forEach((instructionElm) => excludeElms.indexOf(instructionElm) !== -1 ? null : instructionElm.select(false));
    }


    // get cursorCellIndex() {
    playSelectedInstructions() {
        if(this.editor.song.isPlaying)
            this.editor.song.stopPlayback();
        const selectedIndicies = this.getSelectedIndicies();
        for(let i=0; i<selectedIndicies.length; i++) {
            this.editor.song.playInstructionAtIndex(this.groupName, selectedIndicies[i]);
        }
    }
    // getInstructions(indicies=null) {
    //     return this.editor.song.getInstructions(this.groupName, indicies);
    // }

    // getInstructionRange(start, end=null) {
    //     return this.editor.song.getInstructionRange(this.groupName, start, end);
    // }

    getInstruction(index) {
        return this.editor.song.getInstruction(this.groupName, index);
    }

    getInstructionFormValues(command=null) {
        if(!command)
            command = this.fieldInstructionCommand.value;
        let newInstruction = new SongInstruction();

        if(this.fieldInstructionInstrument.value || this.fieldInstructionInstrument.value === 0)
            newInstruction.instrument = parseInt(this.fieldInstructionInstrument.value);
        if(this.fieldInstructionDuration.value) // TODO: refactor DURATIONS
            newInstruction.duration = parseFloat(this.fieldInstructionDuration.value);
        const velocityValue = parseInt(this.fieldInstructionVelocity.value);
        if(velocityValue || velocityValue === 0)
            newInstruction.velocity = velocityValue;

        command = this.replaceFrequencyAlias(command, newInstruction.instrument);
        newInstruction.command = command;

        return newInstruction;
    }


    render() {
        this.renderForms();
        this.renderMenu();
        this.renderRows(); // Rows depend on forms, and get rendered last
    }



    // navigate(groupPositionInTicks, groupName=null) {
    //     if(groupName && groupName !== this.groupName)
    //         this.groupName = groupName;
    //     this.navigateGroup(groupName);
    // }


    navigateGroup(groupPositionInTicks) {
        let rowElm = this.findRowElement(groupPositionInTicks);
        if(rowElm)
            return rowElm;
        const newRowSegmentID = this.getSegmentIDFromPositionInTicks(groupPositionInTicks);
        if (newRowSegmentID !== this.currentRowSegmentID) {
            this.navigateSegment(newRowSegmentID);
            let rowElm = this.findRowElement(groupPositionInTicks);
            if(rowElm)
                return rowElm;
        }
        throw new Error("Shouldn't happen: Row not found for position: " + groupPositionInTicks);
    }


    // navigatePop() {
    //     this.editor.setStatus("Navigate Back: ", this.status.trackers[0].groupName);
    //     if(this.status.trackers.length > 0)
    //         this.status.trackers.shift();
    //     this.render();
    // }

    getSegmentIDFromPositionInTicks(positionInTicks) {
        const timeDivision = this.editor.song.timeDivision;
        const segmentLengthInTicks = this.segmentLength * timeDivision;
        const segmentID = Math.floor(positionInTicks/segmentLengthInTicks);
        return segmentID;
    }

    navigateSegment(newRowSegmentID) {
        this.currentRowSegmentID = newRowSegmentID;
        this.renderRows();
    }

    /** Tracker Panel **/

    // get panelTracker() { return this.editor.panelTracker; }


    renderForms() {
        /** Instruction Panel **/

        /** Instruction Forms **/
        const panelInstruction = this.editor.panelInstruction;
        if(!panelInstruction.hasInput('command')) {
            this.formInstructionCommand = panelInstruction.getOrCreateForm('command', 'Command');
            this.formInstructionInstrument = panelInstruction.getOrCreateForm('instrument', 'Instrument');
            this.formInstructionVelocity = panelInstruction.getOrCreateForm('velocity', 'Velocity');
            this.formInstructionDuration = panelInstruction.getOrCreateForm('duration', 'Duration');


            /** Tracker Forms **/

            const panelTracker = this.editor.panelTracker;
            this.formTrackerRowLength = panelTracker.getOrCreateForm('row-length', 'Row &#120491;');
            this.formTrackerSegmentLength = panelTracker.getOrCreateForm('segment-length', 'Seg &#120491;');
            this.formTrackerInstrument = panelTracker.getOrCreateForm('instrument', 'Instrument');
            this.formTrackerSelection = panelTracker.getOrCreateForm('selection', 'Selection');
            this.formTrackerOctave = panelTracker.getOrCreateForm('octave', 'Octave');

        }

        /** Instruction Fields **/

        if(!this.formInstructionCommand.hasInput('command')) {
            this.fieldInstructionCommand = this.formInstructionCommand.addSelectInput(
                'command',
                (e, commandString) => this.editor.actions.setInstructionCommand(e, commandString), (addOption, setOptgroup) => {
                    // const selectedInstrumentID = this.fieldInstructionInstrument ? parseInt(this.fieldInstructionInstrument.value) : 0;
                    addOption('', 'Select');
                    setOptgroup('Frequencies');
                    this.editor.values.getValues('note-frequency-all', addOption);
                    setOptgroup('Custom Frequencies');
                    // TODO: filter by selected instrument
                    this.editor.values.getValues('note-frequency-named', addOption);
                    setOptgroup('Groups');
                    this.editor.values.getValues('command-group-execute', addOption);
                },
                'Instruction Instrument');

            this.fieldInstructionInsert = this.formInstructionCommand.addButton(
                'insert',
                e => this.editor.actions.insertInstructionCommand(e),
                this.formInstructionCommand.createIcon('insert'),
                "Insert Instruction");

            this.fieldInstructionDelete = this.formInstructionCommand.addButton('delete',
                e => this.editor.actions.deleteInstructionCommand(e),
                this.formInstructionCommand.createIcon('delete'),
                "Delete Instruction");


            this.fieldInstructionInstrument = this.formInstructionInstrument.addSelectInput('instrument',
                    e => this.editor.actions.setInstructionInstrument(e), (addOption, setOptgroup) => {
                    addOption('', 'Select');
                    setOptgroup('Song Instruments');
                    this.editor.values.getValues('song-instruments', addOption);
                },
                'Instruction Instrument');

            this.fieldInstructionVelocity = this.formInstructionVelocity.addRangeInput('velocity',
                (e, newVelocity) => this.editor.actions.setInstructionVelocity(e, newVelocity), 1, 127);

            this.fieldInstructionDuration = this.formInstructionDuration.addSelectInput('duration',
                e => this.editor.actions.setInstructionDuration(e),
                (addOption, setOptgroup) => {
                    addOption('', 'No Duration');
                    this.editor.values.getValues('durations', addOption);
                },
                'Instruction Duration');


            /** Tracker Fields **/

            this.fieldTrackerInstrument = this.formTrackerInstrument.addSelectInput('filter-instrument',
                e => this.editor.actions.setTrackerFilterInstrument(e),
                (addOption, addGroup) => {
                    addOption('', 'No Filter');
                    addGroup("Filter By Instrument");
                    this.editor.values.getValues('song-instruments', addOption)
                },
                'Filter By Instrument');

            this.fieldTrackerRowLength = this.formTrackerRowLength.addSelectInput('row-length',
                e => this.editor.actions.setTrackerRowLength(e),
                (addOption) => {
                    // addOption('', '-');
                    this.editor.values.getValues('durations', addOption)
                },
                'Select Row Length',
                this.editor.song.timeDivision);

            this.fieldTrackerSegmentLength = this.formTrackerSegmentLength.addSelectInput('segment-length',
                e => this.editor.actions.setTrackerSegmentLength(e),
                (addOption) => {
                    for(let i=1; i<=512; i*=2)
                        addOption(i);
                },
                'Select Segment Length',
                16);

            this.fieldTrackerSelection = this.formTrackerSelection.addTextInput('selection',
                e => this.editor.actions.setTrackerSelection(e),
                'Selection',
                '',
                'No selection'
            );


            // this.querySelectorAll('.multiple-count-text').forEach((elm) => elm.innerHTML = (selectedIndicies.length > 1 ? '(s)' : ''));

            // Status Fields

            this.fieldTrackerOctave = this.formTrackerOctave.addSelectInput('octave',
                e => this.editor.actions.setTrackerOctave(e),
                (addOption) => {
                    // addOption('', 'No Octave Selected');
                    this.editor.values.getValues('note-frequency-octaves', addOption)
                },
                'Select Octave',
                3);
            // const trackerOctave = this.fieldTrackerOctave.value;
            // this.fieldTrackerOctave.value = trackerOctave !== null ? trackerOctave : 3;
            // if(this.fieldTrackerOctave.value === null)
            //     this.fieldTrackerOctave.value = 3; // this.editor.status.currentOctave;
        }

        /** Update Form **/

        let selectedIndicies = this.getSelectedIndicies();
        // let timeDivision = this.rowLengthInTicks || this.editor.song.getSongTimeDivision();
        const selectedInstructionList = this.editor.song.getInstructions(this.groupName, selectedIndicies);
        let cursorInstruction = selectedInstructionList[0];


        if (cursorInstruction) {
            this.fieldInstructionCommand.value = cursorInstruction.command; // , "Unknown Instrument");
            this.fieldInstructionInstrument.addOrSetValue(cursorInstruction.instrument, cursorInstruction.instrument + ": Unknown Instrument");
            this.fieldInstructionVelocity.value = cursorInstruction.velocity;
            this.fieldInstructionDuration.value = cursorInstruction.duration;
        }

        this.fieldInstructionDelete.disabled = selectedIndicies.length === 0;
        if(!this.fieldTrackerRowLength.value)
            this.fieldTrackerRowLength.setValue(this.editor.song.timeDivision);
        // this.fieldTrackerRowLength.value = this.fieldTrackerRowLength.value; // this.editor.song.getSongTimeDivision();
        if(!this.fieldInstructionDuration.value && this.fieldTrackerRowLength.value)
            this.fieldInstructionDuration.setValue(parseInt(this.fieldTrackerRowLength.value));


        // this.fieldTrackerSelection.value = selectedIndicies.join(',');
    }

    // renderRowSegments() {
    // }

    renderRows(selectedIndicies=null, cursorIndex=null) {
        if(selectedIndicies === null)
            selectedIndicies = this.getSelectedIndicies();
        if(cursorIndex === null)
            cursorIndex = this.getCursorIndex();
        if(cursorIndex === null && selectedIndicies && selectedIndicies.length > 0)
            cursorIndex = selectedIndicies[0];

        console.time('tracker.renderRows()');

        const timeDivision = this.editor.song.timeDivision;

        this.innerHTML = '';

        // Instruction Iterator
        let instructionIterator = this.editor.song.getIterator(this.groupName);

        const quantizationInTicks = this.fieldTrackerRowLength.value || timeDivision;

        const segmentLengthInTicks = (this.fieldTrackerSegmentLength.value || 16) * timeDivision;


        const filterByInstrumentID = this.fieldTrackerInstrument.value ? parseInt(this.fieldTrackerInstrument.value) : null;

        let rowInstructionList = null, lastSegmentRowPositionInTicks=0, lastRowStartIndex=0;
        // while(rowInstructionList = instructionIterator.nextInstructionRow(filterByInstrumentID)) {
        let lastRowSegmentID = 0;
        while(rowInstructionList = instructionIterator.nextInstructionQuantizedRow(quantizationInTicks, filterByInstrumentID)) {

            lastRowSegmentID = Math.floor(instructionIterator.groupPositionInTicks / segmentLengthInTicks);
            if(this.currentRowSegmentID === lastRowSegmentID) {
                lastRowStartIndex = rowInstructionList.length > 0 ? rowInstructionList[0].index : instructionIterator.groupIndex;
                const rowElm = new AudioSourceComposerTrackerRow(); // document.createElement('asct-row');
                this.appendChild(rowElm);
                rowElm.render(lastRowStartIndex, instructionIterator.groupPositionInTicks, rowInstructionList);
                lastSegmentRowPositionInTicks = instructionIterator.groupPositionInTicks;
            }
        }

        // Quantize last row:
        lastSegmentRowPositionInTicks = lastSegmentRowPositionInTicks === 0 ? 0 : (Math.ceil((lastSegmentRowPositionInTicks+1) / quantizationInTicks) * quantizationInTicks);

        const currentSegmentEndPositionInTicks = this.currentRowSegmentID * segmentLengthInTicks + segmentLengthInTicks;
        if(lastSegmentRowPositionInTicks < currentSegmentEndPositionInTicks - segmentLengthInTicks)
            lastSegmentRowPositionInTicks = currentSegmentEndPositionInTicks - segmentLengthInTicks;
        // const currentRowSegmentID = Math.floor(lastSegmentRowPositionInTicks / segmentLengthInTicks);
        while(lastSegmentRowPositionInTicks <= currentSegmentEndPositionInTicks) {
            const rowElm = new AudioSourceComposerTrackerRow(); // document.createElement('asct-row');
            this.appendChild(rowElm);
            rowElm.render(lastRowStartIndex, lastSegmentRowPositionInTicks);
            lastSegmentRowPositionInTicks += quantizationInTicks;
        }

        // const currentRowSegmentEndPositionInTicks = (this.currentRowSegmentID + 1) * segmentLengthInTicks;
        // renderQuantizationRows(groupPositionInTicks, currentRowSegmentEndPositionInTicks);


        // Render Group
        const panelTrackerGroups = this.editor.panelTrackerGroups;

        if(panelTrackerGroups) {
            panelTrackerGroups.clearInputs();
            // let lastRowSegmentID = Math.ceil(lastSegmentRowPositionInTicks / segmentLengthInTicks) + 1;
            Object.keys(this.editor.song.data.instructions).forEach((groupName, i) => {
                // const buttonForm = panelTrackerGroups.addForm(groupName);
                const button = panelTrackerGroups.addButton(
                    groupName,
                    e => this.groupName = groupName,
                    groupName);
                // panelTrackerGroups.classList.toggle('selected', groupName === this.groupName);
                button.classList.toggle('selected', groupName === this.groupName);
            });

            panelTrackerGroups.addButton(
                '+',
                e => this.editor.actions.songGroupAddNew(e),
                '+');
        }

        // Render Segments

        const panelTrackerRowSegments = this.editor.panelTrackerRowSegments;

        if(panelTrackerRowSegments) {
            panelTrackerRowSegments.clearInputs();
            // let lastRowSegmentID = Math.ceil(lastSegmentRowPositionInTicks / segmentLengthInTicks) + 1;
            if(lastRowSegmentID < this.currentRowSegmentID+1)
                lastRowSegmentID = this.currentRowSegmentID+1;
            for(let segmentID = 0; segmentID <= lastRowSegmentID; segmentID++) {
                const button = panelTrackerRowSegments.addButton(
                    segmentID,
                    e => this.navigateSegment(segmentID),
                    segmentID);
                panelTrackerRowSegments.classList.toggle('selected', segmentID === this.currentRowSegmentID);
                button.classList.toggle('selected', segmentID === this.currentRowSegmentID);
            }
        }

        this.selectSegmentIndicies(selectedIndicies); // TODO: reselect cells after navigation?
        console.timeEnd('tracker.renderRows()');
    }



    renderMenu() {
        const editor = this.editor;
        const handleAction = (actionName) => (e) => {
            this.focus();
            // this.onAction(e, actionName);
            // e.currentTarget.closeAllMenus();
        };

        const menuEdit = this.editor.menuEdit;
        const menuContext = this.editor.menuContext;

        menuEdit.populate =
        menuContext.populate = (e) => {
            const MENU = e.menuElement;
            const selectedIndicies = this.getSelectedIndicies();

            const populateGroupCommands = (subMenuGroup, action) => {
                subMenuGroup.populate = (e) => {
                    const MENU = e.menuElement;
                    editor.values.getValues('song-groups', (groupName, groupTitle) => {
                        const menuEditSetCommandGroup = MENU.getOrCreateSubMenu(groupName, `${groupTitle}`);
                        menuEditSetCommandGroup.action = action;
                    });
                    const menuCustom = MENU.getOrCreateSubMenu('new', `Create New Group`);
                    menuCustom.action = e => this.editor.actions.songGroupAddNew(e);
                    menuCustom.hasBreak = true;
                };
            };


            const menuEditInsertCommand = MENU.getOrCreateSubMenu('insert', `Insert Command ►`);
            menuEditInsertCommand.populate = (e) => {
                const MENU = e.menuElement;
                const subMenuFrequency = MENU.getOrCreateSubMenu('frequency', `Frequency ►`);
                subMenuFrequency.populate = (e) => {
                    const MENU = e.menuElement;
                    editor.values.getValues('note-frequency-octaves', (octave, label) => {
                        const menuOctave = MENU.getOrCreateSubMenu(octave, `Octave ${label} ►`);
                        menuOctave.populate = (e) => {
                            const MENU = e.menuElement;
                            editor.values.getValues('note-frequency', (noteName, label) => {
                                const fullNote = noteName + octave;
                                const menuOctaveFrequency = MENU.getOrCreateSubMenu(fullNote, `${label}${octave}`);
                                menuOctaveFrequency.action = (e) => {
                                    editor.trackerElm.fieldInstructionCommand.value = fullNote;
                                    this.editor.actions.insertInstructionCommand(e, fullNote);
                                }
                            });
                        };
                    });
                };

                const subMenuNamed = MENU.getOrCreateSubMenu('named', `Named ►`);
                subMenuNamed.populate = (e) => {
                    const MENU = e.menuElement;
                    editor.values.getValues('note-frequency-named', (noteName, frequency, instrumentID) => {
                        const menuOctaveFrequency = MENU.getOrCreateSubMenu(noteName, noteName);
                        menuOctaveFrequency.action = (e) => {
                            editor.trackerElm.fieldInstructionCommand.value = noteName;
                            this.editor.actions.insertInstructionCommand(e, noteName, false, instrumentID);
                        }
                    });
                };

                const subMenuGroup = MENU.getOrCreateSubMenu('group', `Group ►`);
                subMenuGroup.populate = (e) => {
                    const MENU = e.menuElement;
                    editor.values.getValues('song-groups', (groupName, groupTitle) => {
                        if(groupName === this.groupName)
                            return;
                        const menuEditSetCommandGroup = MENU.getOrCreateSubMenu(groupName, `${groupTitle}`);
                        menuEditSetCommandGroup.action = (e) => {
                            const fullNote = '@' + groupName;
                            editor.trackerElm.fieldInstructionCommand.value = fullNote;
                            this.editor.actions.insertInstructionCommand(e, fullNote);
                        };
                    });
                    const menuCustom = MENU.getOrCreateSubMenu('new', `Create New Group`);
                    menuCustom.action = e => this.editor.actions.songGroupAddNew(e);
                    menuCustom.hasBreak = true;
                };

                const menuCustom = MENU.getOrCreateSubMenu('custom', `Custom Command`);
                menuCustom.action = e => this.editor.actions.insertInstructionCommand(e, null, true);
                menuCustom.hasBreak = true;
            };
            // menuEditInsertCommand.disabled = selectedIndicies.length > 0; // !this.cursorCell;
            // menuEditInsertCommand.action = handleAction('song:new');

            if(selectedIndicies.length > 0) {
                const menuEditSetCommand = MENU.getOrCreateSubMenu('set-command', `Set Command ►`);
                menuEditSetCommand.populate = (e) => {
                    const MENU = e.menuElement;
                    const subMenuFrequency = MENU.getOrCreateSubMenu('frequency', `Frequency ►`);
                    subMenuFrequency.populate = (e) => {
                        const MENU = e.menuElement;
                        editor.values.getValues('note-frequency-octaves', (octave, label) => {
                            const menuOctave = MENU.getOrCreateSubMenu(octave, `Octave ${label} ►`);
                            menuOctave.populate = (e) => {
                                const MENU = e.menuElement;
                                editor.values.getValues('note-frequency', (noteName, label) => {
                                    const fullNote = noteName + octave;
                                    const menuOctaveFrequency = MENU.getOrCreateSubMenu(fullNote, `${label}${octave}`);
                                    menuOctaveFrequency.action = (e) => {
                                        editor.trackerElm.fieldInstructionCommand.value = fullNote;
                                        this.editor.actions.setInstructionCommand(e, fullNote);
                                        // handleAction('instruction:command')(e);
                                    }
                                });
                            };
                        });
                    };

                    const subMenuNamed = MENU.getOrCreateSubMenu('named', `Named ►`);
                    subMenuNamed.populate = (e) => {
                        const MENU = e.menuElement;
                        editor.values.getValues('note-frequency-named', (noteName, frequency, instrumentID) => {
                            const menuOctaveFrequency = MENU.getOrCreateSubMenu(noteName, noteName);
                            menuOctaveFrequency.action = (e) => {
                                editor.trackerElm.fieldInstructionCommand.value = noteName;
                                this.editor.actions.setInstructionCommand(e, noteName, false, instrumentID);
                            }
                        });
                    };

                    const subMenuGroup = MENU.getOrCreateSubMenu('group', `Group ►`);
                    subMenuGroup.populate = (e) => {
                        const MENU = e.menuElement;
                        editor.values.getValues('song-groups', (groupName, groupTitle) => {
                            if(groupName === this.groupName)
                                return;
                            const menuEditSetCommandGroup = MENU.getOrCreateSubMenu(groupName, `${groupTitle}`);
                            menuEditSetCommandGroup.action = (e) => {
                                const fullNote = '@' + groupName;
                                editor.trackerElm.fieldInstructionCommand.value = fullNote;
                                this.editor.actions.setInstructionCommand(e, fullNote);
                            };
                        });
                        const menuCustom = MENU.getOrCreateSubMenu('new', `Create New Group`);
                        menuCustom.action = e => this.editor.actions.songGroupAddNew(e);
                        menuCustom.hasBreak = true;
                    };

                    const menuCustom = MENU.getOrCreateSubMenu('custom', `Custom Command`);
                    menuCustom.action = e => this.editor.actions.setInstructionCommand(e, null, true);
                    // menuCustom.action = handleAction('instruction:custom-command');
                    menuCustom.hasBreak = true;
                };
                menuEditSetCommand.disabled = selectedIndicies.length === 0;

                const menuEditSetInstrument = MENU.getOrCreateSubMenu('set-instrument', `Set Instrument ►`);
                menuEditSetInstrument.populate = (e) => {
                    const MENU = e.menuElement;
                    editor.values.getValues('song-instruments', (instrumentID, label) => {
                        const menuEditSetInstrumentID = MENU.getOrCreateSubMenu(instrumentID, `${label}`);
                        menuEditSetInstrumentID.action = (e) => {
                            editor.trackerElm.fieldInstructionInstrument.value = instrumentID;
                            this.editor.actions.setInstructionInstrument(e, instrumentID);
                            // handleAction('instruction:instrument')(e);
                        }
                    });
                };
                menuEditSetInstrument.disabled = selectedIndicies.length === 0;


                const menuEditSetDuration = MENU.getOrCreateSubMenu('set-duration', `Set Duration ►`);
                menuEditSetDuration.populate = (e) => {
                    const MENU = e.menuElement;
                    editor.values.getValues('durations', (durationInTicks, durationName) => {
                        const menuEditSetDurationValue = MENU.getOrCreateSubMenu(durationInTicks, `${durationName}`);
                        menuEditSetDurationValue.action = (e) => {
                            editor.trackerElm.fieldInstructionDuration.value = durationInTicks;
                            this.editor.actions.setInstructionDuration(e, durationInTicks);
                            // handleAction('instruction:duration')(e);
                        }
                    });
                    const menuCustom = MENU.getOrCreateSubMenu('custom', `Custom Duration`);
                    menuCustom.action = e => this.editor.actions.setInstructionDuration(e, null, true); // handleAction('instruction:custom-duration');
                    menuCustom.hasBreak = true;
                };
                menuEditSetDuration.disabled = selectedIndicies.length === 0;


                const menuEditSetVelocity = MENU.getOrCreateSubMenu('set-velocity', `Set Velocity ►`);
                menuEditSetVelocity.populate = (e) => {
                    const MENU = e.menuElement;
                    editor.values.getValues('velocities', (velocity, velocityName) => {
                        const menuEditSetVelocityValue = MENU.getOrCreateSubMenu(velocity, `${velocityName}`);
                        menuEditSetVelocityValue.action = (e) => {
                            editor.trackerElm.fieldInstructionVelocity.value = velocity;
                            this.editor.actions.setInstructionVelocity(e, velocity);
                            // handleAction('instruction:velocity')(e);
                        }
                    });
                    const menuCustom = MENU.getOrCreateSubMenu('custom', `Custom Velocity`);
                    // menuCustom.action = handleAction('instruction:custom-velocity');
                    menuCustom.action = e => this.editor.actions.setInstructionVelocity(e, null, true);
                    menuCustom.hasBreak = true;
                };
                menuEditSetVelocity.disabled = selectedIndicies.length === 0;

                const menuEditDeleteInstruction = MENU.getOrCreateSubMenu('delete', `Delete Instruction(s)`);
                menuEditDeleteInstruction.action = e => this.editor.actions.deleteInstructionCommand(e); // handleAction('instruction:delete');
                menuEditDeleteInstruction.disabled = selectedIndicies.length === 0;
            }

            /** Select Instructions **/

            const menuEditSelect = MENU.getOrCreateSubMenu('select', 'Select ►');
            menuEditSelect.hasBreak = true;
            menuEditSelect.populate = (e) => {
                const MENU = e.menuElement;

                const menuSelectSegment = MENU.getOrCreateSubMenu('segment', 'Select Segment Instructions');
                menuSelectSegment.action = (e) => this.editor.actions.setTrackerSelection(e, 'segment');

                const menuSelectAll = MENU.getOrCreateSubMenu('all', 'Select All Song Instructions');
                menuSelectAll.action = (e) => this.editor.actions.setTrackerSelection(e, 'all');

                // const menuSelectRow = MENU.getOrCreateSubMenu('row', 'Select Row Instructions');
                // menuSelectRow.action = (e) => this.editor.actions.setTrackerSelection(e, 'row');
                // menuSelectRow.disabled = true;
                const menuSelectNone = MENU.getOrCreateSubMenu('none', 'Select No Instructions');
                menuSelectNone.action = (e) => this.editor.actions.setTrackerSelection(e, 'none');

                const menuSelectBatch = MENU.getOrCreateSubMenu('batch', 'Batch Select ►');
                menuSelectBatch.populate = (e) => {
                    const MENU = e.menuElement;
                    const menuSelectBatchNew = MENU.getOrCreateSubMenu('new', 'New Selection Command');
                    menuSelectBatchNew.action = (e) => this.editor.actions.batchSelect(e);

                    const storage = new AudioSourceStorage();
                    const recentBatchSearches = storage.getBatchRecentSearches();
                    for(let i=0; i<recentBatchSearches.length; i++) {
                        const recentBatchSearch = recentBatchSearches[i];
                        // let title = recentBatchCommand.match(/\/\*\*([^*/]+)/)[1].trim() || recentBatchCommand;
                        const menuSelectRecentBatch = MENU.getOrCreateSubMenu(i, recentBatchSearch);
                        menuSelectRecentBatch.action = (e) => {
                            this.editor.actions.batchSelect(e, recentBatchSearch, true);
                        };
                    }
                }

            };

            /** Batch Instructions **/

            const menuEditBatch = MENU.getOrCreateSubMenu('batch', 'Batch ►');
            menuEditBatch.hasBreak = true;
            menuEditBatch.populate = (e) => {
                const MENU = e.menuElement;

                const menuEditBatchNewCommand = MENU.getOrCreateSubMenu('new', 'New Batch Command');
                menuEditBatchNewCommand.action = (e) => this.editor.actions.batchRunCommand(e);

                const storage = new AudioSourceStorage();
                const recentBatchCommands = storage.getBatchRecentCommands();
                for(let i=0; i<recentBatchCommands.length; i++) {
                    const recentBatchCommand = recentBatchCommands[i];
                    // let title = recentBatchCommand.match(/\/\*\*([^*/]+)/)[1].trim() || recentBatchCommand;
                    const menuEditBatchRunCommand = MENU.getOrCreateSubMenu(i, recentBatchCommand);
                    menuEditBatchRunCommand.populate = (e) => {
                        const MENU = e.menuElement;

                        const menuSelectRecentBatchRunSearch = MENU.getOrCreateSubMenu('run', "Execute on Group");
                        menuSelectRecentBatchRunSearch.action = (e) => {
                            this.editor.actions.batchRunCommand(e, recentBatchCommand, true);
                        };

                        const menuSelectRecentBatchRunCommand = MENU.getOrCreateSubMenu('search', "Execute using Search");
                        menuSelectRecentBatchRunCommand.populate = (e) => {
                            const MENU = e.menuElement;
                            const menuSelectRecentBatchRunCommandNew = MENU.getOrCreateSubMenu('new', 'New Search');
                            menuSelectRecentBatchRunCommandNew.action = (e) => this.editor.actions.batchRunCommand(e, recentBatchCommand, null, true);

                            const storage = new AudioSourceStorage();
                            const recentBatchSearches = storage.getBatchRecentSearches();
                            for(let i=0; i<recentBatchSearches.length; i++) {
                                const recentBatchSearch = recentBatchSearches[i];
                                // let title = recentBatchCommand.match(/\/\*\*([^*/]+)/)[1].trim() || recentBatchCommand;
                                const menuSelectRecentBatchCommand = MENU.getOrCreateSubMenu(i, recentBatchSearch);
                                menuSelectRecentBatchCommand.action = (e) => {
                                    this.editor.actions.batchRunCommand(e, recentBatchCommand, recentBatchSearch);
                                };
                            }
                        };
                    };

                }

            };

            // const menuEditGroup = MENU.getOrCreateSubMenu('group', 'Group ►');
            // menuEditGroup.hasBreak = true;
            // menuEditGroup.disabled = true;

        };
    }

    onInput(e) {
        if (e.defaultPrevented)
            return;

        switch (e.type) {
            case 'mouseup':
                if(this.isSelectionRectActive()) {
                    this.commitSelectionRect();
                }
                break;
        }

        if(e.target instanceof Node && !this.contains(e.target))
            return;

        // console.log(e.type);

        let selectedIndicies = this.getSelectedIndicies();
        // const instructionList = this.getInstructions();

        switch (e.type) {
            case 'midimessage':
                // console.log("MIDI", e.data, e);
                switch(e.data[0]) {
                    case 144:   // Note On
                        // TODO: refactor
                        e.preventDefault();
                        const midiSupport = new MIDISupport();
                        let newMIDICommand = midiSupport.getCommandFromMIDINote(e.data[1]);
                        let newMIDIVelocity = Math.round((e.data[2] / 128) * 100);
                        console.log("MIDI ", newMIDICommand, newMIDIVelocity);

                        this.insertOrUpdateCommand(e, newMIDICommand);
                        this.playSelectedInstructions(e);
                        this.focus();
                        break;
                    case 128:   // Note Off
                        // TODO: turn off playing note, optionally set duration of note
                        break;
                }
                break;
            case 'keydown':
                // All key actions close all menus
                this.editor.closeAllMenus();

                let keyEvent = e.key;
                if (!e.ctrlKey && this.editor.keyboard.getKeyboardCommand(e.key, this.fieldTrackerOctave.value))
                    keyEvent = 'PlayFrequency';
                if (keyEvent === 'Enter' && e.altKey)
                    keyEvent = 'ContextMenu';

                // let keydownCellElm = this.cursorCell;

                switch (keyEvent) {
                    case 'Delete':
                        e.preventDefault();
                        // this.clearSelection();
                        const selectedIndiciesDesc = selectedIndicies.sort((a, b) => b - a);
                        for (let i = 0; i < selectedIndiciesDesc.length; i++)
                            this.editor.song.deleteInstructionAtIndex(this.groupName, selectedIndicies[i]);
                        this.renderRows();
                        // this.selectIndicies(selectedIndicies[0]);
                        // song.render(true);
                        break;

                    case 'Escape':
                    case 'Backspace':
                        throw new Error("TODO: navigate pop")
                        e.preventDefault();
                        this.navigatePop();
                        // this.selectIndicies(0);
                        // this.focus();
                        break;

                    case 'Enter':
                        if(this.contains(e.target)) {

                            e.preventDefault();
                            this.insertOrUpdateCommand(e);

                            let cursorInstruction = this.cursorInstruction;
                            if (cursorInstruction.isGroupCommand()) {
                                const groupName = cursorInstruction.command.substr(1);
                                this.editor.selectGroup(groupName);
                            } else {
                                this.playSelectedInstructions(e);
                            }
                        }
                        break;

                    case 'Play':
                        e.preventDefault();
                        this.playSelectedInstructions(e);
                        // for(let i=0; i<selectedIndicies.length; i++) {
                        //     this.editor.song.playInstruction(instructionList[i]);
                        // }
                        break;

                    // ctrlKey && metaKey skips a measure. shiftKey selects a range
                    case 'ArrowRight':
                        e.preventDefault();
                        this.selectNextCell(e);
                        this.playSelectedInstructions(e);
                        this.focus();
                        break;

                    case 'ArrowLeft':
                        e.preventDefault();
                        this.selectPreviousCell(e);
                        this.playSelectedInstructions(e);
                        this.focus();
                        break;

                    case 'ArrowDown':
                        e.preventDefault();
                        this.selectNextRowCell(e);
                        this.playSelectedInstructions(e);
                        this.focus();
                        break;

                    case 'ArrowUp':
                        e.preventDefault();
                        this.selectPreviousRowCell(e);
                        this.playSelectedInstructions(e);
                        this.focus();
                        break;

                    case ' ':
                        e.preventDefault();
                        // this.selectCell(e, this.cursorCell);
                        // if(e.ctrlKey) e.preventDefault();
                        if (this.editor.song.isPlaybackActive()) {
                            this.editor.song.stopPlayback();
                        } else {
                            this.editor.song.play();
                        }
                        break;

                    case 'PlayFrequency':
                        let newCommand = this.editor.keyboard.getKeyboardCommand(e.key, this.fieldTrackerOctave.value);
                        if (newCommand === null)
                            break;

                        e.preventDefault();

                        this.insertOrUpdateCommand(e, newCommand);

                        // this.render();
                        // this.renderCursorRow();
                        this.playSelectedInstructions(e);
                        this.focus();

                        // song.gridSelectInstructions([selectedInstruction]);
                        // e.preventDefault();
                        break;

                }
                break;

            case 'touchstart':
            case 'mousedown':
                // All mouse actions close all menus
                this.editor.closeAllMenus();

                this.mousePosition.isDown = true;
                this.mousePosition.isDragging = false;
                this.mousePosition.lastDown = e;
                // delete this.mousePosition.lastUp;
                delete this.mousePosition.lastDrag;
                // delete this.mousePosition.lastUp;
                // delete this.mousePosition.lastDrag;

                if (e.target.matches('asct-instruction'))
                    return this.onCellInput(e);

                if (e.target.matches('asct-instruction > *'))
                    return this.onCellInput(e, e.target.instruction);

                if (e.target.matches('asct-instruction-add'))
                    return this.onRowInput(e, e.target.row);


                if (e.target.matches('asct-row'))  // classList.contains('tracker-row')) {
                    return this.onRowInput(e);
                // e.preventDefault();


                break;


            case 'touchmove':
            case 'mousemove':
                if(e.which === 1) {
                    if (this.mousePosition.isDown) {
                        this.mousePosition.isDragging = true;
                        this.mousePosition.lastDrag = e;
                    }
                }
                if(this.mousePosition.isDown && this.mousePosition.lastDrag) {
                    if (this.mousePosition.lastDown.path[0].matches('asct-row')) {
                        // if(this.isSelectionRectActive()) {
                        //     this.updateSelectionRect(this.mousePosition.lastDown, this.mousePosition.lastDrag)
                        // }
                    }
                }
                break;

            case 'touchend':
            case 'mouseup':
                this.mousePosition.isDown = false;
                if (this.mousePosition.isDragging
                    && this.mousePosition.lastDown.path[0].matches('asct-row')
                ) {
                    // if(this.isSelectionRectActive()) {
                    //     this.commitSelectionRect(this.mousePosition.lastDown, this.mousePosition.lastUp);
                    //     break;
                    // }
                }
                this.mousePosition.isDragging = false;

                const lastMouseUp = this.mousePosition.lastUp;
                e.t = new Date();
                this.mousePosition.lastUp = e;
                if(lastMouseUp && lastMouseUp.t.getTime() + this.editor.doubleClickTimeout > new Date().getTime()) {
                    e.preventDefault();
                    const currentTarget = e.path[0];
                    const originalTarget = lastMouseUp.path[0];
                    if(originalTarget === currentTarget
                        || originalTarget.contains(currentTarget)
                        || currentTarget.contains(originalTarget)) {
                        const doubleClickEvent = new CustomEvent('doubleclick', {
                            detail: {
                                firstMouseEvent: lastMouseUp.e,
                                secondMouseEvent: e,
                                clientX: e.clientX,
                                clientY: e.clientY,
                            },
                            cancelable: true,
                            bubbles: true
                        });
                        currentTarget.dispatchEvent(doubleClickEvent);
                    }
                    // console.log(doubleClickEvent);
                }
                break;

            case 'mouseout':
                if(e.target.matches('asc-tracker')) {
//                     console.log(e.target, e.path);
                    if(this.isSelectionRectActive()) {
                        this.commitSelectionRect();
                    }
                }
                break;

            case 'click':
                // this.editor.closeMenu();
                break;

            case 'doubleclick':
            case 'longpress':
                // if (e.target.classList.contains('tracker-parameter')
                //     || e.target.classList.contains('tracker-cell')
                //     || e.target.classList.contains('tracker-data')
                //     || e.target.classList.contains('tracker-row')) {
                e.preventDefault();
                // console.log("Longpress", e);
                if(this.contains(e.target)) {
                    this.editor.menuContext.openContextMenu(e);
                }
                // }
                break;

            case 'contextmenu':
                // if (e.target.classList.contains('tracker-parameter')) {
                //     console.info("TODO: add parameter song at top of context menu: ", e.target); // huh?
                // }
                if (!e.altKey) {
                    e.preventDefault();
                    this.editor.menuContext.openContextMenu(e, this.cursorCell);
                }
                break;

            case 'scroll':

                // if(this.renderScrollLimit < this.scrollTop + this.offsetHeight*4) {
                //     this.renderScrollLimit *= 2; // = this.scrollTop + this.offsetHeight*4;
                //     console.info("New scroll limit: ", this.renderScrollLimit);
                // }

                // this.renderAllRows(40);
                break;

            case 'dragstart':
            case 'drag':
            case 'dragend':
                console.info(e.type);
                break;

            default:
                throw new Error("Unhandled type: " + e.type);

        }
    }

    updateSelectionRect(eDown, eMove) {
        if(!eMove) eMove = this.mousePosition.lastDrag || this.mousePosition.lastDrag;
        var a = eDown.clientX - eMove.clientX;
        var b = eDown.clientY - eMove.clientY;
        var c = Math.sqrt(a * a + b * b);
        if(c < 30)
            return console.warn("Skipping selection rect");
        // console.log("Dragging", c);// eDown.path[0], eMove.path[0]);

        let rectElm = this.querySelector('div.selection-rect');
        if(!rectElm) {
            rectElm = document.createElement('div');
            rectElm.classList.add('selection-rect');
            this.appendChild(rectElm);
        }

        let x,y,w,h;
        if(eDown.clientX < eMove.clientX) {
            x = eDown.clientX;
            w = eMove.clientX - eDown.clientX;
        } else {
            x = eMove.clientX;
            w = eDown.clientX - eMove.clientX;
        }
        if(eDown.clientY < eMove.clientY) {
            y = eDown.clientY;
            h = eMove.clientY - eDown.clientY;
        } else {
            y = eMove.clientY;
            h = eDown.clientY - eMove.clientY;
        }

        rectElm.style.left = x + 'px';
        rectElm.style.width = w + 'px';
        rectElm.style.top = y + 'px';
        rectElm.style.height = h + 'px';



        const cellList = this.querySelectorAll('asct-instruction');
        cellList.forEach(cellElm => {
            const rect = cellElm.getBoundingClientRect();
            const selected =
                rect.x + rect.width > x
                && rect.x < x + w
                && rect.y + rect.height > y
                && rect.y < y + h;
            cellElm.classList.toggle('selecting', selected);
        });

        return {x,y,w,h};
    }

    isSelectionRectActive() {
        let rectElm = this.querySelector('div.selection-rect');
        return !!rectElm;
    }

    commitSelectionRect(eDown=null, eUp=null) {
        if(!eDown) eDown = this.mousePosition.lastDown;

        let rectElm = this.querySelector('div.selection-rect');
        if(!rectElm)
            return console.warn("No selection rect");

        const sRect = rectElm.getBoundingClientRect();
        // const {x,y,w,h} = this.updateSelectionRect(eDown, eUp);

        rectElm.parentNode.removeChild(rectElm);


        this.clearSelection();

        const searchElements = this.querySelectorAll('asct-instruction,asct-row');
        const selectionList = [];
        searchElements.forEach(searchElm => {
            const rect = searchElm.getBoundingClientRect();
            const selected =
                rect.x + rect.width > sRect.x
                && rect.x < sRect.x + sRect.width
                && rect.y + rect.height > sRect.y
                && rect.y < sRect.y + sRect.height;

            // cellElm.classList.toggle('selected', selected);
            if(selected) {
                selectionList.push(searchElm);
                searchElm.select(true, false);
            }
        });
        console.log("Selection ", selectionList, sRect);

    }




    setPlaybackPositionInTicks(groupPositionInTicks) {

        // TODO: get current 'playing' and check position
        let rowElm = this.navigateGroup(groupPositionInTicks);
        this.querySelectorAll('asct-row.position')
            .forEach(rowElm => rowElm.classList.remove('position'));
        rowElm.classList.add('position');

    }


    async onSongEvent(e) {
//         console.log("onSongEvent", e.type);
        switch(e.type) {

            case 'song:seek':
                this.setPlaybackPositionInTicks(e.detail.positionInTicks);
                break;

            case 'group:seek':
//                 console.log(e.type, e.detail);
                if(e.detail.groupName === this.groupName)
                    this.setPlaybackPositionInTicks(e.detail.positionInTicks);

                break;

            case 'group:play':
                break;

            case 'note:start':
                if(e.detail.groupName === this.groupName) {
                    let instructionElm = this.findInstructionElement(e.detail.instruction.index);
                    if (instructionElm) {
                        instructionElm.classList.add('playing');
                    }
                }
                break;
            case 'note:end':
                if(e.detail.groupName === this.groupName) {
                    let instructionElm = this.findInstructionElement(e.detail.instruction.index);
                    if (instructionElm) {
                        instructionElm.classList.remove('playing');
                    }
                }
                break;
        }
    }

    // TODO: refactor?
    get selectedCells() { return this.querySelectorAll('asct-instruction.selected'); }
    get cursorCell() { return this.querySelector('asct-instruction.cursor,asct-instruction-add.cursor'); }
    // get cursorRow() { return this.cursorCell.parentNode; }
    get cursorPosition() { return ((cell) => (cell ? cell.parentNode.position : null))(this.cursorCell); }
    get cursorInstruction() { return this.getInstruction(this.cursorCell.index); }

    getCursorCell() {
        return this.querySelector('.cursor');
    }
    getCursorIndex() {
        const cursorCell = this.querySelector('.cursor');
        return cursorCell ? cursorCell.index : null;
    }

    getSelectedIndicies() {
        const value = this.fieldTrackerSelection.value;
        if(value === '')
            return [];
        return value
            .split(/\D+/)
            .map(index => parseInt(index));
        // return this.selectedIndicies;
        // const selectedIndicies = [].map.call(this.selectedCells, (elm => elm.index));
    }


    selectIndicies(e, selectedIndicies) {
        if(typeof selectedIndicies === "string") {

            switch(selectedIndicies) {
                case 'all':
                    selectedIndicies = [];
                    const maxLength = this.editor.song.getInstructionGroupLength(this.groupName);
                    for(let i=0; i<maxLength; i++)
                        selectedIndicies.push(i);
                    break;
                case 'segment':
                    selectedIndicies = [].map.call(this.querySelectorAll('asct-instruction'), (elm => elm.index));
                    break;
                case 'row': throw new Error('TODO');
                case 'none':
                    selectedIndicies = [];
                    break;
                default:
                    throw new Error("Invalid selection: " + selectedIndicies);
            }
        }
        if(typeof selectedIndicies === 'number')
            selectedIndicies = [selectedIndicies];

        this.clearSelection();
        for(let i=0; i<selectedIndicies.length; i++)
            this.selectIndex(e, selectedIndicies[i]);

        this.fieldTrackerSelection.value = selectedIndicies.join(',');
    }

    selectIndex(e, selectedIndex, clearSelection=false) {
        const cell = this.findInstructionElement(selectedIndex);
        if(cell) {
            this.selectCell(e, cell, clearSelection);
            return true;
        } else {
            return false;
        }
    }

    selectNextCell(e) {
        let cursorCell = this.querySelector('.cursor') || this.querySelector('asct-instruction');

        if(cursorCell) {
            if(cursorCell instanceof AudioSourceComposerTrackerInstructionAdd) {
                // If next element is an add instruction, select the next row
                return this.selectNextRowCell(e, 0);
            } else if(cursorCell.nextInstructionSibling) {
                // If next element is an instruction, select it
                return this.selectCell(e, cursorCell.nextInstructionSibling);

            } else {
                return this.selectNextRowCell(e);
            }
        } else {
            // If no cursor is selected, use the first available instruction
            return this.selectRow(e, this.querySelector('asct-row'));
        }
    }

    selectPreviousCell(e) {
        let cursorCell = this.querySelector('.cursor') || this.querySelector('asct-instruction:last-child');

        if(cursorCell) {
            if(cursorCell.previousInstructionSibling) {
                // If previous element is an instruction, select it
                return this.selectCell(e, cursorCell.previousInstructionSibling);

            } else {
                return this.selectPreviousRowCell(e);
            }
        } else {
            // If no cursor is selected, use the first available instruction
            return this.selectRow(e, this.querySelector('asct-row:last-child'));
        }
    }


    selectNextRowCell(e, cellPosition=null) {
        let cursorCell = this.querySelector('.cursor') || this.querySelector('asct-instruction');
        const cursorRow = cursorCell.parentNode;
        if(cellPosition === null)
            cellPosition = [].indexOf.call(cursorCell.parentNode.children, cursorCell);

        if(!cursorRow.nextElementSibling) {
            this.currentRowSegmentID++;
            this.renderRows();
            this.focus();
            return this.selectNextCell(e);
        }

        const nextRowElm = cursorRow.nextElementSibling;

        let selectedCell = nextRowElm.querySelector('asct-instruction');
        if(nextRowElm.children[cellPosition] && nextRowElm.children[cellPosition].matches('asct-instruction')) {
            selectedCell = nextRowElm.children[cellPosition];
        }


        if(selectedCell)    this.selectCell(e, selectedCell);
        else                this.selectRow(e, cursorRow.nextElementSibling);

        return selectedCell;
    }


    selectPreviousRowCell(e, cellPosition=null) {
        let cursorCell = this.querySelector('.cursor') || this.querySelector('asct-instruction:last-child');
        const cursorRow = cursorCell.parentNode;
        if(cellPosition === null)
            cellPosition = [].indexOf.call(cursorCell.parentNode.children, cursorCell);
        if(!cursorRow.previousElementSibling) {
            if(this.currentRowSegmentID === 0)
                throw new Error("TODO: reached beginning of song");
            this.currentRowSegmentID--;
            this.renderRows();
            this.focus();
            return this.selectPreviousCell(e);
        }

        let previousRowElm = cursorRow.previousElementSibling;

        let selectedCell; // = previousRowElm.querySelector('asct-instruction:last-child');
        if(previousRowElm.children[cellPosition] && previousRowElm.children[cellPosition].matches('asct-instruction,asct-instruction-add')) {
            selectedCell = previousRowElm.children[cellPosition];
        }

        if(!selectedCell)   this.selectRow(e, previousRowElm);
        else                this.selectCell(e, selectedCell);
        return selectedCell;
    }



    //
    // selectCell(e, cursorCell, toggle=null) {
    //     this.editor.closeAllMenus();
    //     if(!e.shiftKey)
    //         this.clearSelection();
    //     cursorCell.select(toggle ? cursorCell.selected : true);
    //     this.update();
    //     this.focus();
    //     cursorCell.parentNode.scrollTo();
    // }

    updateSelectedIndicies() {
        const selectedIndicies = this.getSelectedIndicies();
        const selectedSegmentIndicies = [].map.call(this.selectedCells, (elm => elm.index));
        for(let i=0; i<selectedSegmentIndicies.length; i++) {
            const index = selectedSegmentIndicies[i];
            if(selectedIndicies.indexOf(index) === -1) {
                selectedIndicies.push(index);
            }
        }
        selectedIndicies.sort();
        this.fieldTrackerSelection.value = selectedIndicies.join(',');
//         console.info('updateSelectedIndicies', selectedIndicies);
    }

    selectSegmentIndicies(indicies, clearSelection = false) {
        // const currentSelectedIndicies = this.getSelectedIndicies();
        // if(indicies.length === currentSelectedIndicies.length && indicies.sort().every(function(value, index) { return value === currentSelectedIndicies.sort()[index]}))
        //     return;
        if(!Array.isArray(indicies))
            indicies = [indicies];
        if(clearSelection)
            this.clearSelection();
        for(let i=0; i<indicies.length; i++) {
            const index = indicies[i];
            const cell = this.findInstructionElement(index);
            if(cell) {
                cell.select(true, false);
                if(i===0)
                    cell.setCursor();
            } else {
//                 console.warn("Instruction not found: " + index);
            }
        }
        this.updateSelectedIndicies();
        //    this.focus(); // Prevents tab from working
    }

    selectRow(e, selectedRow) {

        if(!e.ctrlKey) {
            this.clearSelection();
        }

        // selectedRow.select();
        // selectedRow.clearAllCursors();
        selectedRow.createAddInstructionElement()
            .setCursor();
        this.renderForms();
        this.focus();
        selectedRow.parentNode.scrollTo();
        this.editor.song.setPlaybackPositionInTicks(selectedRow.position);
        selectedRow.scrollTo();

        return selectedRow;
    }

    selectCell(e, selectedCell, clearSelection=null) {
//         console.time("selectCell");
        let toggleValue = true;
        if(clearSelection === null) {
            clearSelection = !(e && e.ctrlKey);
        }
        if(e && e.shiftKey) {
            toggleValue = !selectedCell.selected;
        }
        if(clearSelection) {
            this.clearSelection();
        }

        this.editor.closeAllMenus();
        selectedCell.select(toggleValue);
        this.updateSelectedIndicies();
        selectedCell.setCursor();
        this.renderForms();
        this.focus();
        this.editor.song.setPlaybackPositionInTicks(selectedCell.parentNode.position);
        selectedCell.parentNode.scrollTo();

        // selectedCell.play();
        return selectedCell;

//         console.timeEnd("selectCell");
        // selectedCell.scrollTo();
    }

    onRowInput(e, selectedRow = null) {
        e.preventDefault();

        selectedRow = selectedRow || e.target;
        this.selectRow(e, selectedRow);
    }

    onCellInput(e, selectedCell) {
        e.preventDefault();
        selectedCell = selectedCell || e.target;
        this.selectCell(e, selectedCell, !e.shiftKey);
        this.playSelectedInstructions(e);
    }



    // navigate(groupName, parentInstruction) {
    //     console.log("Navigate: ", groupName);
    //     const existingTracker = this.status.trackers.find(obj => obj.groupName === groupName);
    //     if(existingTracker)
    //         this.status.trackers.unshift(existingTracker);
    //     else
    //         this.status.trackers.unshift(
    //             Object.assign({}, AudioSourceComposerElement.DEFAULT_TRACKER_STATUS, {
    //                 groupName: groupName,
    //                 parentInstruction: parentInstruction,
    //             })
    //         );
    //     this.render();
    // }



    increaseTrackerSize(e, selectNewRow=true) {
        // TODO: sloppy
        // this.editor.song.eachInstruction(this.groupName, (index, instruction, stats) => {
        //     if (this.minimumTrackerLengthTicks < stats.groupPositionInTicks)
        //         this.minimumTrackerLengthTicks = stats.groupPositionInTicks;
        // });

        // const defaultDuration = parseFloat(this.editorForms.fieldTrackerRowLength.value);
        // this.minimumTrackerLengthTicks += this.rowLengthInTicks;
        this.renderMinimumRows+=1;
        this.render();
        if(selectNewRow) {
            const lastRowElm = this.querySelector('asc-tracker > asct-row:last-child');
            lastRowElm.setCursor();
            // this.createNewInstructionCell(lastRowElm).select();
        }
    }
    insertInstructionAtIndex(instruction, insertIndex) {
        return this.editor.song.insertInstructionAtIndex(this.groupName, insertIndex, instruction);
    }

    insertInstructionAtPosition(insertTimePosition, instruction) {
        return this.editor.song.insertInstructionAtPosition(this.groupName, insertTimePosition, instruction);
    }
    deleteInstructionAtIndex(deleteIndex) {
        return this.editor.song.deleteInstructionAtIndex(this.groupName, deleteIndex, 1);
    }
    replaceInstructionCommand(replaceIndex, newCommand) {
        return this.editor.song.replaceInstructionCommand(this.groupName, replaceIndex, newCommand);
    }

    replaceInstructionVelocity(replaceIndex, newVelocity) {
        return this.editor.song.replaceInstructionVelocity(this.groupName, replaceIndex, newVelocity);
    }


    insertOrUpdateCommand(e, commandString=null) {
        let selectedIndicies = this.getSelectedIndicies();
        if (this.cursorCell.matches('asct-instruction-add')) {
            let newInstruction = this.getInstructionFormValues(commandString);
            if (!newInstruction) {
                this.fieldInstructionCommand.focus();
                return console.info("Insert canceled");
            }

            const insertPosition = this.cursorPosition;
            const insertIndex = this.insertInstructionAtPosition(insertPosition, newInstruction);
            // this.cursorRow.render(true);
            this.renderRows();
            this.selectSegmentIndicies(insertIndex, true);
            // selectedIndicies = [insertIndex];
//                             console.timeEnd("new");
            // cursorInstruction = instructionList[insertIndex];
        } else {
            for (let i = 0; i < selectedIndicies.length; i++) {
                const selectedInstruction = this.getInstruction(selectedIndicies[i]);
                const replaceCommand = this.replaceFrequencyAlias(commandString, selectedInstruction.instrument);
                this.replaceInstructionCommand(selectedIndicies[i], replaceCommand);
            }
            this.renderRows();
            this.selectSegmentIndicies(selectedIndicies);
            // this.selectIndicies(this.getSelectedIndicies()[0]); // TODO: select all
        }
    }

    // replaceInstructionParams(replaceIndex, replaceParams) {
    //     return this.editor.song.replaceInstructionParams(this.groupName, replaceIndex, replaceParams);
    // }

    replaceFrequencyAlias(noteFrequency, instrumentID) {
        const instrument = this.editor.song.getInstrument(instrumentID, false);
        if(!instrument || !instrument.getFrequencyAliases)
            return noteFrequency;
        const aliases = instrument.getFrequencyAliases(noteFrequency);
        if(typeof aliases[noteFrequency] === "undefined")
            return noteFrequency;
        return aliases[noteFrequency];
    }


    // selectInstructions(selectedIndicies) {
    //     return this.selectIndicies(selectedIndicies);
    // }

    findRowElement(positionInTicks) {
        return this.querySelector(`asct-row[p='${positionInTicks}']`);
    }
        // if(rowElm)
        //     return rowElm;

//         let rowElms = this.querySelectorAll(`asct-row`);
//         for(let i=rowElms.length-1; i>=0; i--) {
//             const rowElm = rowElms[i];
//             if(rowElm.position < positionInTicks) {
//                 // TODO: inefficient?
// //                 console.log('findRowElement', rowElm, rowElm.position, '<', positionInTicks);
//                 return rowElm;
//             }
//         }

        // return null;

    findInstructionElement(instructionIndex) {
        return this.querySelector(`asct-instruction[i='${instructionIndex}']`);
    }

}
customElements.define('asc-tracker', AudioSourceComposerTracker);







const VISIBLE_BUFFER = 100;

class AudioSourceComposerTrackerRow extends HTMLElement {
    constructor() {
        super();
    }
    get trackerElm() { return this.closest('asc-tracker'); }
    // get editor() { return this.tracker.editor; }
    get selected() { return this.classList.contains('selected'); }

    set position(songPositionInTicks)   { this.setAttribute('p', songPositionInTicks); }
    get position()                      { return parseInt(this.getAttribute('p'))}

    // set duration(durationInTicks)       { this.setAttribute('d', durationInTicks); }
    // get duration()                      { return parseInt(this.getAttribute('d'))}
    get duration()                      {
        return this.nextElementSibling ? this.nextElementSibling.position - this.position : 'N/A';
    }

    set index(rowIndex)                 { this.setAttribute('i', rowIndex); }
    get index()                         { return parseInt(this.getAttribute('i'))}

    get visible() {
        const parentBottom = this.parentNode.scrollTop + this.parentNode.offsetHeight;
        const offsetBottom = this.offsetTop + this.offsetHeight;
        if(this.offsetTop - parentBottom  > VISIBLE_BUFFER)
            return false;
        if(offsetBottom < this.parentNode.scrollTop - VISIBLE_BUFFER)
            return false;
        return true;
    }

    connectedCallback() {
        // setTimeout(e => this.render(), 1);
        // this.setAttribute('draggable', true);
    }

    getDeltaElement() {
        let deltaElm = this.querySelector('asct-delta');
        if(deltaElm)
            return deltaElm;
        deltaElm = document.createElement('asct-delta');
        this.appendChild(deltaElm);
        return deltaElm;
    }

    createAddInstructionElement() {
        let existingInstructionAddElement = this.querySelector('asct-instruction-add');
        if(!existingInstructionAddElement) {
            // Remove existing new instruction button
            this.parentNode.querySelectorAll('asct-instruction-add')
                .forEach((elm) => elm.parentNode.removeChild(elm));

            const newInstructionElm = document.createElement('asct-instruction-add');
            existingInstructionAddElement = newInstructionElm;
            // newInstructionElm.index = this.index; // setAttribute('p', rowElement.position);
            newInstructionElm.innerHTML = `+`;
        }
        const deltaElm = this.getDeltaElement();
        this.insertBefore(existingInstructionAddElement, deltaElm);

        return existingInstructionAddElement;
    }

    clearAddInstructionElement() {
        this.parentNode.querySelectorAll('asct-instruction-add')
            .forEach((elm) => elm.parentNode.removeChild(elm));
        // let existingInstructionAddElement = this.querySelector('asct-instruction-add');
        // if(existingInstructionAddElement) {
        //     existingInstructionAddElement.parentNode.removeChild(existingInstructionAddElement);
        // }
    }


    select(selectedValue=true) {
        if(selectedValue) {
            if(this.selected) {
                console.warn("Already selected ", this);
                return;
            }
            this.classList.add('selected');
        } else {
            if(!this.selected) {
                console.warn("Already unselected ", this);
                return;
            }
            this.classList.remove('selected');
        }
    }

    clearAllCursors() {
        // Remove other cursor elements
        this.trackerElm.querySelectorAll('.cursor')
            .forEach((elm) => elm.classList.remove('cursor'));
    }

    updateDelta() {
        let deltaElm = this.getDeltaElement();
        this.appendChild(deltaElm);
        deltaElm.render(this.duration);
    }

    scrollTo() {
        const container = this.parentNode;
        // const container = this.tracker; // cursorCell.closest('.composer-tracker-container');
        if (container.scrollTop < this.offsetTop - container.offsetHeight)
            container.scrollTop = this.offsetTop;
        //
        if (container.scrollTop > this.offsetTop)
            container.scrollTop = this.offsetTop - container.offsetHeight;
    }


    render(startIndex, songPositionInTicks, rowInstructionList=[]) {
        // this.index = startIndex; // Insert at position, not index
        this.position = songPositionInTicks;
        // this.duration = deltaDuration;

        // if(this.visible) {
        const instructionElms = this.querySelectorAll('asct-instruction');
        let i = 0;
        for (; i<instructionElms.length; i++) {
            const instructionElm = instructionElms[i];
            if(i >= rowInstructionList.length) {
                instructionElm.parentNode.removeChild(instructionElm);
            } else {
                instructionElm.index = startIndex + i;
                instructionElm.render(rowInstructionList[i]);

            }
        }

        for (; i<rowInstructionList.length; i++) {
            const instructionElm = document.createElement('asct-instruction');
            instructionElm.index = startIndex + i;
            this.appendChild(instructionElm);
            instructionElm.render(rowInstructionList[i]);
        }

        if(this.nextElementSibling)
            this.updateDelta();
        else if(this.previousElementSibling) // TODO: ugly hack
            this.previousElementSibling.updateDelta();

        if(this.selected) {
            this.createAddInstructionElement();
        }
        // } else {
        //     setTimeout(e => this.updateDelta(), 1); // Hack: So that the next row element and position are available
        // }
//         } else {
//             if(this.childNodes.length > 0) {
//                 const selected = this.querySelectorAll('asct-instruction.selected').length > 0; // TODO inefficient - selectedIndicies ? selectedIndicies.indexOf(startIndex) !== -1 : false;
//                 if (!selected) {
//                     this.innerHTML = '';
//                     // console.info("Clear ", this);
//                     // console.info("Clear ", this);
//                 } else {
// //                     console.info("Selected ", this);
//                 }
//             }
//         }

        return this;
    }

}

customElements.define('asct-row', AudioSourceComposerTrackerRow);

class AudioSourceComposerTrackerInstruction extends HTMLElement {
    constructor() {
        super();
    }
    get row() { return this.parentNode; }
    get trackerElm() {
        if(!this.parentNode)
            throw new Error("Invalid tracker");
        return this.parentNode.trackerElm; }
    get editor() { return this.trackerElm.editor; }

    set index(instructionIndex) {
        this.setAttribute('i', instructionIndex);
        // this.render();
    }
    get index() { return parseInt(this.getAttribute('i'))}
    get selected() { return this.classList.contains('selected'); }

    get nextInstructionSibling() {
        if(this.nextElementSibling && this.nextElementSibling.matches('asct-instruction'))
            return this.nextElementSibling;
        return null;
    }

    get previousInstructionSibling() {
        if(this.previousElementSibling && this.previousElementSibling.matches('asct-instruction'))
            return this.previousElementSibling;
        return null;
    }


    getInstruction() { return this.row.trackerElm.getInstruction(this.index); }

    play() {
        this.editor.song.playInstructionAtIndex(
            this.trackerElm.groupName,
            this.index,
            this.editor.song.getAudioContext().currentTime,
            {
                groupPositionInTicks: this.row.position,
                currentIndex: this.index
            });
        return this;
    }

    connectedCallback() {
        // this.render();
        // this.setAttribute('draggable', true);
    }

    scrollTo() { return this.row.scrollTo(); }

    clearAllCursors() { return this.row.clearAllCursors(); }

    setCursor() {
        this.clearAllCursors();
        this.classList.add('cursor');
        return this;
    }

    select(selectedValue=true) {
        // const selected = this.selected;

        // if(clearSelection) {
        //     this.tracker.querySelectorAll('asct-instruction.selected')
        //         .forEach((elm) => elm.classList.remove('selected'));
        // }

        if(selectedValue) {
            // if(clearSelection)
            //     this.tracker.clearSelection([this, this.row]);
            // if(this.selected) {
            //     console.warn("Already selected ", this);
            //     return;
            // }
            this.classList.add('selected');
            // this.row.select(selectedValue);
        } else {
            // if(!this.selected) {
            //     console.warn("Already unselected ", this);
            //     return;
            // }
            this.classList.remove('selected', 'cursor');
        }


        // this.tracker.update();
        // this.parentNode.scrollTo(); //TODO: performance issue

        // this.row.setCursor(false);

        this.render();
        return this;
    }


    render(instruction=null) {
        // this.innerHTML = '';
        instruction = instruction || this.getInstruction();

        let commandElm = this.querySelector('ascti-command');
        if(!commandElm) this.appendChild(commandElm = document.createElement('ascti-command'));
        commandElm.render(instruction);

        if(this.classList.contains('selected')) {
            let instrumentElm = this.querySelector('ascti-instrument');
            if(!instrumentElm) this.appendChild(instrumentElm = document.createElement('ascti-instrument'));
            instrumentElm.render(instruction);

            let velocityElm = this.querySelector('ascti-velocity');
            if(!velocityElm) this.appendChild(velocityElm = document.createElement('ascti-velocity'));
            velocityElm.render(instruction);

            let durationElm = this.querySelector('ascti-duration');
            if(!durationElm) this.appendChild(durationElm = document.createElement('ascti-duration'));
            durationElm.render(instruction);

        } else {
            let instrumentElm = this.querySelector('ascti-instrument');
            if(instrumentElm) instrumentElm.parentNode.removeChild(instrumentElm);

            let velocityElm = this.querySelector('ascti-velocity');
            if(velocityElm) velocityElm.parentNode.removeChild(velocityElm);

            let durationElm = this.querySelector('ascti-duration');
            if(durationElm) durationElm.parentNode.removeChild(durationElm);
        }

        return this;
    }

}

customElements.define('asct-instruction', AudioSourceComposerTrackerInstruction);


class AudioSourceComposerTrackerInstructionAdd extends AudioSourceComposerTrackerInstruction {


    render(instruction=null) {
        if(instruction)
            throw new Error("Invalid");
        this.innerHTML = '+';
        return this;
    }

}
customElements.define('asct-instruction-add', AudioSourceComposerTrackerInstructionAdd);




class AudioSourceComposerTrackerParameter extends HTMLElement {
    constructor() {
        super();
    }
    get instruction() { return this.parentNode; }
    get trackerElm() { return this.parentNode.parentNode.trackerElm; }
    get editor() { return this.trackerElm.editor; }

    connectedCallback() {
        //this.render();
        // this.setAttribute('draggable', true);
    }

    render() {
        this.innerHTML = this.editor.values.format(this.row.duration, 'duration');
    }
}

class AudioSourceComposerParamCommand extends AudioSourceComposerTrackerParameter {
    render(instruction=null) {
        instruction = instruction || this.instruction.getInstruction();
        this.innerHTML = this.editor.values.format(instruction.command, 'command');
    }
}
customElements.define('ascti-command', AudioSourceComposerParamCommand);

class AudioSourceComposerParamInstrument extends AudioSourceComposerTrackerParameter {
    render(instruction=null) {
        instruction = instruction || this.instruction.getInstruction();
        this.innerHTML = this.editor.values.format(instruction.instrument, 'instrument');
    }
}
customElements.define('ascti-instrument', AudioSourceComposerParamInstrument);

class AudioSourceComposerParamVelocity extends AudioSourceComposerTrackerParameter {
    render(instruction=null) {
        instruction = instruction || this.instruction.getInstruction();
        this.innerHTML = this.editor.values.format(instruction.velocity, 'velocity');
    }
}
customElements.define('ascti-velocity', AudioSourceComposerParamVelocity);

class AudioSourceComposerTrackerDuration extends AudioSourceComposerTrackerParameter {
    render(instruction=null) {
        instruction = instruction || this.instruction.getInstruction();
        this.innerHTML = this.editor.values.format(instruction.duration, 'duration');
    }
}
customElements.define('ascti-duration', AudioSourceComposerTrackerDuration);





class AudioSourceComposerTrackerDelta extends HTMLElement {
    constructor() {
        super();
    }
    get editor() { return this.trackerElm.editor; }
    get trackerElm() { return this.parentNode.trackerElm; }
    get row() { return this.parentNode; }

    // set duration(durationInTicks) { this.setAttribute('d', durationInTicks)}
    // get duration() { return parseInt(this.parentNode.getAttribute('d'))}

    connectedCallback() {
        // setTimeout(e => this.render(), 1); // TODO: inefficient
    }

    render(duration) {
        duration = duration || this.row ? this.row.duration : -1;
        this.innerHTML = this.editor.values.format(duration, 'duration');
    }
}

customElements.define('asct-delta', AudioSourceComposerTrackerDelta);





