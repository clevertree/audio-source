class AudioSourceComposerTracker extends HTMLElement {
    constructor() {
        super();
        this.editor = null;
        this.eventHandlers = [];

        // this.cursorCellIndex = 0;
        this.renderTimeout = null;
        this.renderScrollLimit = 1200;
        this.renderMinimumRows = 16;
        this.segmentLength = 16;
        this.currentRowSegmentID = 0;
        // TODO: minimum render rows for new groups

        // this.selectedIndicies = [0];
        this.mousePosition = {};
        // this.instructionElms = null;
    }



    // get scrollContainer() {
    //     return this.querySelector('.tracker-scroll-container');
    // }

    get groupName()             { return this.getAttribute('group'); }
    set groupName(groupName)    {
        this.setAttribute('group', groupName);
        this.render(1);
    }
    get rowLengthInTicks()             { return parseInt(this.getAttribute('rowLength')); }
    set rowLengthInTicks(rowLengthInTicks)    {
        this.setAttribute('rowLength', rowLengthInTicks);
        this.render(1);
    }
    // get renderQuantization()             { return parseInt(this.fieldRenderRowLength.value); }
    // set renderQuantization(quantizationInTicks)    {
    //     this.fieldRenderRowLength.value = quantizationInTicks;
    //     this.render(1);
    // }

    // get rowLengthInTicks() { return this.status.rowLengthInTicks; }
    get status() { return this.editor.status.grid; }


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
            this.onInput);

        this.editor = this.getRootNode().host;
        if(!this.getAttribute('rowLength'))
            this.setAttribute('rowLength', this.editor.renderer.getSongTimeDivision());
        setTimeout(e => this.render(), 20);
        setTimeout(e => this.render(), 1000);
    }

    disconnectedCallback() {
        this.eventHandlers.forEach(eventHandler =>
            eventHandler[2].removeEventListener(eventHandler[0], eventHandler[1]));
    }

    attachEventHandler(eventNames, method, context) {
        if(!Array.isArray(eventNames))
            eventNames = [eventNames];
        for(let i=0; i<eventNames.length; i++) {
            const eventName = eventNames[i];
            context = context || this;
            context.addEventListener(eventName, method);
            this.eventHandlers.push([eventName, method, context]);
        }
    }
    
    clearSelection(excludeElms=[]) {
        if(!Array.isArray(excludeElms))
            excludeElms = [excludeElms];

        // Update rows
        // this.querySelectorAll('asct-row.selected')
        //     .forEach((rowElm) => excludeElms.indexOf(rowElm) !== -1 ? null : rowElm.select(false));

        // Remove 'add' instructions
        this.parentNode.querySelectorAll('asct-instruction-add')
            .forEach((instructionElm) => excludeElms.indexOf(instructionElm) !== -1 ? null : instructionElm.parentNode.removeChild(instructionElm));

        // Update cells
        this.querySelectorAll('asct-instruction.selected,asct-instruction.selecting,asct-instruction.cursor')
            .forEach((instructionElm) => excludeElms.indexOf(instructionElm) !== -1 ? null : instructionElm.select(false));
    }


    // get cursorCellIndex() {
    playSelectedInstructions() {
        this.editor.renderer.stopPlayback();
        const selectedIndicies = this.selectedIndicies;
        for(let i=0; i<selectedIndicies.length; i++) {
            this.editor.renderer.playInstructionAtIndex(this.groupName, selectedIndicies[i]);
        }
    }
    getInstructions(indicies=null) {
        return this.editor.renderer.getInstructions(this.groupName, indicies);
    }

    getInstructionRange(start, end=null) {
        return this.editor.renderer.getInstructionRange(this.groupName, start, end);
    }

    getInstruction(index) {
        return this.editor.renderer.getInstruction(this.groupName, index);
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


    render(timeout=0) {
        // New strat: render all rows, detatch rows out of visibility

        if(!this.isConnected) {
            // TODO: inefficient? console.warn("Tracker not connected. Skipping render", this);
            return;
        }

        // this.innerHTML = `
        //     <div class="form-section-container">
        //     ${this.renderSongForms()}
        //     </div>
        //     <div class="tracker-scroll-container">
        //     </div>
        // `;

        this.innerHTML = `
        <div class="row-segment-container"></div>
        <div class="row-container"></div>
`;

        this.renderMenu();
        this.renderForms();
        this.renderRows();

        this.update();

    }


    focusOnContainer() {
        let rowContainer = this.querySelector('.row-container');
        if(rowContainer) {
            rowContainer.setAttribute('tabindex', '0');
            rowContainer.focus();
        }
    }

    getSegmentIDFromPositionInTicks(positionInTicks) {
        const timeDivision = this.editor.renderer.getGroupTimeDivision(this.groupName);
        const segmentLengthInTicks = this.segmentLength * timeDivision;
        const segmentID = Math.floor(positionInTicks/segmentLengthInTicks);
        return segmentID;
        // let currentRowSegmentID = 0;
        // let currentRowSegmentPositionInTicks = 0;
        //
        // const timeDivision = this.editor.renderer.getGroupTimeDivision(this.groupName);
        // let foundRowSegmentID = -1;
        // this.editor.renderer.eachInstructionRow(this.groupName, (startIndex, startPositionInTicks, endPositionInTicks, instructionList, stats) => {
        //     while(currentRowSegmentPositionInTicks + segmentLengthInTicks < stats.groupPositionInTicks) {
        //         if(currentRowSegmentPositionInTicks >= positionInTicks) {
        //             foundRowSegmentID = currentRowSegmentID;
        //             return false;
        //         }
        //         currentRowSegmentID++;
        //         currentRowSegmentPositionInTicks += segmentLengthInTicks;
        //     }
        // });
        //
        // return foundRowSegmentID;
    }

    // renderRowSegments() {
    // }

    renderRows() {
        console.time('tracker.renderRows()');

        const timeDivision = this.editor.renderer.getGroupTimeDivision(this.groupName);

        let segmentContainer = this.querySelector('.row-segment-container');
        segmentContainer.innerHTML = '';
        let rowContainer = this.querySelector('.row-container');
        rowContainer.innerHTML = '';

        // Instruction Iterator
        let instructionIterator = this.editor.renderer.getIterator(this.groupName);

        const quantizationInTicks = this.rowLengthInTicks;

        const segmentLengthInTicks = this.segmentLength * timeDivision;

        let lastRowIndex=0, lastRowPositionInTicks=0;
        const renderQuantizationRows = (startRowPositionInTicks, endRowPositionInTicks) => {

            let nextBreakPositionInTicks = Math.ceil(startRowPositionInTicks / quantizationInTicks) * quantizationInTicks + quantizationInTicks;
            while (nextBreakPositionInTicks < endRowPositionInTicks) {
                const rowElm = new AudioSourceComposerTrackerRow(); // document.createElement('asct-row');
                rowContainer.appendChild(rowElm);
                rowElm.render(lastRowIndex, nextBreakPositionInTicks);
                nextBreakPositionInTicks += quantizationInTicks;
            }
        };



        let renderFirstRow = (lastRowIndex, lastRowPositionInTicks) => {
            const firstRowElm = new AudioSourceComposerTrackerRow(); // document.createElement('asct-row');
            rowContainer.appendChild(firstRowElm);
            firstRowElm.render(lastRowIndex, lastRowPositionInTicks);
        };


        let rowInstructionList = null;
        while(rowInstructionList = instructionIterator.nextInstructionRow()) {
            // if(lastRowIndex === 0 && rowInstructionList.length > 0 && rowInstructionList[0].deltaDuration) {
            //     const rowElm = new AudioSourceComposerTrackerRow(); // document.createElement('asct-row');
            //     rowContainer.appendChild(rowElm);
            //     rowElm.render(lastRowIndex, nextBreakPositionInTicks);
            // }
            // console.log("ROW", rowInstructionList);
            const currentRowSegmentID = Math.floor(instructionIterator.groupPositionInTicks / segmentLengthInTicks);


            // console.log("Row", rowInstructionList);
            if(this.currentRowSegmentID === currentRowSegmentID) {
                if(renderFirstRow) {
                    if(!rowInstructionList || rowInstructionList[0].positionInTicks !== lastRowPositionInTicks)
                        renderFirstRow(lastRowIndex, lastRowPositionInTicks);
                    renderFirstRow = null;
                }

                let rowElm = new AudioSourceComposerTrackerRow(); // document.createElement('asct-row');
                rowContainer.appendChild(rowElm);

                rowElm.render(lastRowIndex, instructionIterator.lastRowGroupStartPositionInTicks, rowInstructionList);
                // lastRowIndex = instructionIterator.groupIndex;
                // lastRowPositionInTicks = instructionIterator.groupPositionInTicks;
                renderQuantizationRows(lastRowPositionInTicks, instructionIterator.groupPositionInTicks);
                // let nextBreakPositionInTicks = Math.ceil(lastRowPositionInTicks / quantizationInTicks) * quantizationInTicks + quantizationInTicks;
                // while (nextBreakPositionInTicks < instructionIterator.groupPositionInTicks) {
                //     rowElm = new AudioSourceComposerTrackerRow(); // document.createElement('asct-row');
                //     rowContainer.appendChild(rowElm);
                //     rowElm.render(lastRowIndex, nextBreakPositionInTicks);
                //     nextBreakPositionInTicks += quantizationInTicks;
                // }
                // currentRowSegmentLastPositionInTicks = instructionIterator.groupPositionInTicks;
            }
            lastRowPositionInTicks = instructionIterator.groupPositionInTicks;
            lastRowIndex = instructionIterator.groupIndex;



        }

        const currentRowSegmentEndPositionInTicks = (this.currentRowSegmentID + 1) * segmentLengthInTicks;
        renderQuantizationRows(lastRowPositionInTicks, currentRowSegmentEndPositionInTicks);

        // Segments


        const lastRowSegmentID = Math.floor(lastRowPositionInTicks / segmentLengthInTicks);
        for(let segmentID = 0; segmentID <= lastRowSegmentID+1; segmentID++) {

            let segmentElm = new AudioSourceComposerTrackerRowSegment(segmentID, segmentID * segmentLengthInTicks);
            segmentContainer.appendChild(segmentElm);
            segmentElm.selected = segmentID === this.currentRowSegmentID;
        }

        console.timeEnd('tracker.renderRows()');
    }



    renderMenu() {
        const editor = this.editor;
        const handleAction = (actionName) => (e) => {
            this.focusOnContainer();
            this.onAction(e, actionName);
            // e.currentTarget.closeAllMenus();
        };

        const menuEdit = this.editor.menuEdit;
        const menuContext = this.editor.menuContext;

        menuEdit.populate =
        menuContext.populate = (e) => {
            const MENU = e.menuElement;
            const selectedIndicies = this.selectedIndicies;

            const populateGroupCommands = (subMenuGroup, action) => {
                subMenuGroup.populate = (e) => {
                    const MENU = e.menuElement;
                    editor.values.getValues('song-groups', (groupName, groupTitle) => {
                        const menuEditSetCommandGroup = MENU.getOrCreateSubMenu(groupName, `${groupTitle}`);
                        menuEditSetCommandGroup.action = action;
                    });
                    const menuCustom = MENU.getOrCreateSubMenu('new', `Create New Group`);
                    menuCustom.action = handleAction('group:new');
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
                            editor.values.getValues('note-frequencies', (noteName, label) => {
                                const fullNote = noteName + octave;
                                const menuOctaveFrequency = MENU.getOrCreateSubMenu(fullNote, `${label}${octave}`);
                                menuOctaveFrequency.action = (e) => {
                                    editor.tracker.fieldInstructionCommand.value = fullNote;
                                    handleAction('instruction:command')(e);
                                }
                            });
                        };
                    });
                };
                const subMenuNamed = MENU.getOrCreateSubMenu('named', `Named ►`);
                subMenuNamed.disabled = true;
                const subMenuGroup = MENU.getOrCreateSubMenu('group', `Group ►`);
                populateGroupCommands(subMenuGroup, (e) => {
                    editor.tracker.fieldInstructionCommand.value = '@' + groupName;
                    handleAction('instruction:command')(e);
                });

                const menuCustom = MENU.getOrCreateSubMenu('custom', `Custom Command`);
                menuCustom.action = handleAction('instruction:custom-command');
                menuCustom.hasBreak = true;
            };
            menuEditInsertCommand.disabled = selectedIndicies.length > 0; // !this.cursorCell;
            // menuEditInsertCommand.action = handleAction('song:new');

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
                            editor.values.getValues('note-frequencies', (noteName, label) => {
                                const fullNote = noteName + octave;
                                const menuOctaveFrequency = MENU.getOrCreateSubMenu(fullNote, `${label}${octave}`);
                                menuOctaveFrequency.action = (e) => {
                                    editor.tracker.fieldInstructionCommand.value = fullNote;
                                    handleAction('instruction:command')(e);
                                }
                            });
                        };
                    });
                };
                const subMenuNamed = MENU.getOrCreateSubMenu('named', `Named ►`);
                subMenuNamed.disabled = true;

                const subMenuGroup = MENU.getOrCreateSubMenu('group', `Group ►`);
                populateGroupCommands(subMenuGroup, (e) => {
                    editor.tracker.fieldInstructionCommand.value = '@' + groupName;
                    handleAction('instruction:command')(e);
                });

                const menuCustom = MENU.getOrCreateSubMenu('custom', `Custom Command`);
                menuCustom.action = handleAction('instruction:custom-command');
                menuCustom.hasBreak = true;
            };
            menuEditSetCommand.disabled = selectedIndicies.length === 0;

            const menuEditSetInstrument = MENU.getOrCreateSubMenu('set-instrument', `Set Instrument ►`);
            menuEditSetInstrument.populate = (e) => {
                const MENU = e.menuElement;
                editor.values.getValues('song-instruments', (instrumentID, label) => {
                    const menuEditSetInstrumentID = MENU.getOrCreateSubMenu(instrumentID, `${label}`);
                    menuEditSetInstrumentID.action = (e) => {
                        editor.tracker.fieldInstructionInstrument.value = instrumentID;
                        handleAction('instruction:instrument')(e);
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
                        editor.tracker.fieldInstructionDuration.value = durationInTicks;
                        handleAction('instruction:duration')(e);
                    }
                });
                const menuCustom = MENU.getOrCreateSubMenu('custom', `Custom Duration`);
                menuCustom.action = handleAction('instruction:custom-duration');
                menuCustom.hasBreak = true;
            };
            menuEditSetDuration.disabled = selectedIndicies.length === 0;


            const menuEditSetVelocity = MENU.getOrCreateSubMenu('set-velocity', `Set Velocity ►`);
            menuEditSetVelocity.populate = (e) => {
                const MENU = e.menuElement;
                editor.values.getValues('velocities', (velocity, velocityName) => {
                    const menuEditSetVelocityValue = MENU.getOrCreateSubMenu(velocity, `${velocityName}`);
                    menuEditSetVelocityValue.action = (e) => {
                        editor.tracker.fieldInstructionVelocity.value = velocity;
                        handleAction('instruction:velocity')(e);
                    }
                });
                const menuCustom = MENU.getOrCreateSubMenu('custom', `Custom Velocity`);
                menuCustom.action = handleAction('instruction:custom-velocity');
                menuCustom.hasBreak = true;
            };
            menuEditSetVelocity.disabled = selectedIndicies.length === 0;

            const menuEditDeleteInstruction = MENU.getOrCreateSubMenu('delete', `Delete Instruction(s)`);
            menuEditDeleteInstruction.action = handleAction('instruction:delete');
            menuEditDeleteInstruction.disabled = selectedIndicies.length === 0;


            const menuEditRow = MENU.getOrCreateSubMenu('select', 'Select ►');
            menuEditRow.hasBreak = true;
            menuEditRow.disabled = true;

            const menuEditGroup = MENU.getOrCreateSubMenu('group', 'Group ►');
            menuEditGroup.hasBreak = true;
            menuEditGroup.disabled = true;

        };
    }

    update() {

        let selectedIndicies = this.selectedIndicies;
        // let timeDivision = this.rowLengthInTicks || this.editor.renderer.getSongTimeDivision();
        const selectedInstructionList = this.editor.renderer.getInstructions(this.groupName, selectedIndicies);
        let cursorInstruction = selectedInstructionList[0];

        // Row Instructions

        // Group Buttons
        // this.querySelectorAll('button[name=groupName]')
        //     .forEach(button => button.classList.toggle('selected', button.getAttribute('value') === groupName));

        // TODO: combine instructions? nah


        // this.fieldInstructionDuration.value = parseFloat(this.fieldRenderRowLength.value) + '';

        // const containerElm = this.editor.container;
        // containerElm.classList.remove('show-control-tracker-insert');
        // containerElm.classList.remove('show-control-tracker-modify');

        if(selectedIndicies.length > 0) {
            this.fieldInstructionDelete.removeAttribute('disabled');
        } else {
            this.fieldInstructionDelete.setAttribute('disabled', 'disabled');
            // this.fieldInstructionCommand.value = cursorInstruction.command;
        }

        this.buttonCommandDelete.disabled = true;
        this.buttonCommandInsert.disabled = true;
        if(cursorInstruction) {
            // Note Instruction
            this.fieldInstructionCommand.value = cursorInstruction.command;
            this.fieldInstructionInstrument.value = cursorInstruction.instrument !== null ? cursorInstruction.instrument : '';
            this.fieldInstructionVelocity.value = cursorInstruction.velocity !== null ? cursorInstruction.velocity : '';
            this.fieldInstructionDuration.value = cursorInstruction.duration !== null ? cursorInstruction.duration : '';
            this.buttonCommandDelete.disabled = false;
            // containerElm.classList.add('show-control-tracker-modify');

        } else if(selectedIndicies.length === 0) {
            this.buttonCommandInsert.disabled = false;
            // this.fieldInstructionInstrument.value = this.editor.status.currentInstrumentID;
            // console.log(this.editor.status.currentInstrumentID);

            // containerElm.classList.add('show-control-tracker-insert');
        }

        // this.fieldInstructionCommand.querySelectorAll('.instrument-frequencies option').forEach((option) =>
        //     option.classList.toggle('hidden', this.fieldInstructionInstrument.value !== option.getAttribute('data-instrument')));
        // this.fieldInstructionCommand.querySelectorAll('.instrument-frequencies option').forEach((option) =>
        //     option.classList.toggle('hidden', this.fieldInstructionInstrument.value !== option.getAttribute('data-instrument')));

        // const oldInsertCommand = this.fieldInstructionCommand.value;
        // this.fieldInstructionCommand.querySelector('.instrument-frequencies').innerHTML = instructionCommandOptGroup.innerHTML;
        // this.fieldInstructionCommand.value = oldInsertCommand;
        // if(!this.fieldInstructionCommand.value)
        //     this.fieldInstructionCommand.value-this.fieldInstructionCommand.options[0].value

        this.querySelectorAll('.multiple-count-text').forEach((elm) => elm.innerHTML = (selectedIndicies.length > 1 ? '(s)' : ''));

        // Status Fields

        this.fieldRenderOctave.value = this.editor.status.currentOctave;

        this.fieldRenderRowLength.value = this.rowLengthInTicks; // this.editor.renderer.getSongTimeDivision();
        if(!this.fieldInstructionDuration.value && this.fieldRenderRowLength.value)
            this.fieldInstructionDuration.value = this.fieldRenderRowLength.value;


        this.fieldSelectedIndicies.value = selectedIndicies.join(',');
        // this.fieldSelectedRangeStart.value = this.editor.selectedRange[0];
        // this.fieldSelectedRangeEnd.value = this.editor.selectedRange[1];

        // this.editor.menu.getOrCreateSubMenu('File');
        // const menuElm = this.editor.menuEdit;
        // this.editor.menu.getOrCreateSubMenu('View');


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

        this.focusOnContainer(); // Prevents tab from working
        // console.log(e.type);

        let selectedIndicies = this.selectedIndicies;
        // const instructionList = this.getInstructions();

        switch (e.type) {
            case 'midimessage':
                    // console.log("MIDI", e.data, e);
                switch(e.data[0]) {
                    case 144:   // Note On
                        e.preventDefault();
                        const midiSupport = new MIDISupport();
                        let newMIDICommand = midiSupport.getCommandFromMIDINote(e.data[1]);
                        let newMIDIVelocity = Math.round((e.data[2] / 128) * 100);
                        console.log("MIDI ", newMIDICommand, newMIDIVelocity);

                        if (this.cursorCell.matches('asct-instruction-add')) {
                            let newInstruction = this.getInstructionFormValues();
                            newMIDICommand = this.replaceFrequencyAlias(newMIDICommand, newInstruction.instrument);
                            newInstruction.command = newMIDICommand;
                            newInstruction.velocity = newMIDIVelocity;

                            const insertPosition = this.cursorPosition;
                            const insertIndex = this.insertInstructionAtPosition(insertPosition, newInstruction);
                            // this.cursorRow.render();
                            this.renderRows();
                            this.selectIndicies(e, insertIndex);
                            selectedIndicies = [insertIndex];



                            // cursorInstruction = instructionList[insertIndex];
                        } else {
                            for(let i=0; i<selectedIndicies.length; i++) {
                                const selectedInstruction = this.getInstruction(selectedIndicies[i]);
                                const replaceCommand = this.replaceFrequencyAlias(newMIDICommand, selectedInstruction.instrument);
                                this.replaceInstructionCommand(selectedIndicies[i], replaceCommand);
                                this.replaceInstructionVelocity(selectedIndicies[i], newMIDIVelocity);
                            }
                            this.renderRows();
                            this.selectIndicies(e, selectedIndicies);
                            // this.selectIndicies(this.selectedIndicies[0]); // TODO: select all
                        }
                        // this.renderCursorRow();
                        this.playSelectedInstructions(e);

                        // song.gridSelectInstructions([selectedInstruction]);
                        // e.preventDefault();
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
                if (!e.ctrlKey && this.editor.keyboard.getKeyboardCommand(e.key))
                    keyEvent = 'PlayFrequency';
                if (keyEvent === 'Enter' && e.altKey)
                    keyEvent = 'ContextMenu';

                // let keydownCellElm = this.cursorCell;

                switch (keyEvent) {
                    case 'Delete':
                        e.preventDefault();
                        // this.clearSelection();
                        const selectedIndiciesDesc = selectedIndicies.sort((a,b) => b-a);
                        for(let i=0; i<selectedIndiciesDesc.length; i++)
                            this.editor.renderer.deleteInstructionAtIndex(this.groupName, selectedIndicies[i]);
                        this.renderRows();
                        this.selectIndicies(e, selectedIndicies[0]);
                        // song.render(true);
                        break;

                    case 'Escape':
                    case 'Backspace':
                        e.preventDefault();
                        this.navigatePop();
                        this.selectIndicies(e, 0);
                        // this.focus();
                        break;

                    case 'Enter':
                        e.preventDefault();
                        if (this.cursorCell.matches('.new')) {
                            let newInstruction = this.getInstructionFormValues();
                            if(!newInstruction)
                                return console.info("Insert canceled");
                            let insertIndex = this.insertInstructionAtPosition(this.cursorPosition, newInstruction);
                            // this.cursorRow.render();
                            this.renderRows();
                            this.selectIndicies(e, insertIndex);
                        }

                        let cursorInstruction = this.cursorInstruction;
                        if(cursorInstruction.isGroupCommand()) {
                            const groupName = cursorInstruction.command.substr(1);
                            this.editor.selectGroup(groupName);
                        } else {
                            this.playSelectedInstructions(e);
                        }
                        break;

                    case 'Play':
                        e.preventDefault();
                        this.playSelectedInstructions(e);
                        // for(let i=0; i<selectedIndicies.length; i++) {
                        //     this.editor.renderer.playInstruction(instructionList[i]);
                        // }
                        break;

                    // ctrlKey && metaKey skips a measure. shiftKey selects a range
                    case 'ArrowRight':
                        e.preventDefault();
                        this.selectNextCell(e);
                        this.playSelectedInstructions(e);
                        break;

                    case 'ArrowLeft':
                        e.preventDefault();
                        this.selectPreviousCell(e);
                        this.playSelectedInstructions(e);
                        break;

                    case 'ArrowDown':
                        e.preventDefault();
                        this.selectNextRowCell(e);
                        this.playSelectedInstructions(e);
                        break;

                    case 'ArrowUp':
                        e.preventDefault();
                        this.selectPreviousRowCell(e);
                        this.playSelectedInstructions(e);
                        break;

                    case ' ':
                        e. preventDefault();
                        // this.selectCell(e, this.cursorCell);
                        // if(e.ctrlKey) e.preventDefault();
                        if (this.editor.renderer.isPlaybackActive()) {
                            this.editor.renderer.stopPlayback();
                        } else {
                            this.editor.renderer.play();
                        }
                        break;

                    case 'PlayFrequency':
                        let newCommand = this.editor.keyboard.getKeyboardCommand(e.key);
                        if(newCommand === null)
                            break;

                        e.preventDefault();

                        if (this.cursorCell.matches('asct-instruction-add')) {
//                             console.time("new");
                            let newInstruction = this.getInstructionFormValues(newCommand);
                            if(!newInstruction) {
                                this.fieldInstructionCommand.focus();
                                return console.info("Insert canceled");
                            }
                            // newInstruction.command = newCommand;

                            const insertPosition = this.cursorPosition;
                            const insertIndex = this.insertInstructionAtPosition(insertPosition, newInstruction);
                            // this.cursorRow.render(true);
                            this.renderRows();
                            this.selectIndicies(e, insertIndex);
                            selectedIndicies = [insertIndex];
//                             console.timeEnd("new");
                            // cursorInstruction = instructionList[insertIndex];
                        } else {
                            for(let i=0; i<selectedIndicies.length; i++) {
                                const selectedInstruction = this.getInstruction(selectedIndicies[i]);
                                const replaceCommand = this.replaceFrequencyAlias(newCommand, selectedInstruction.instrument);
                                this.replaceInstructionCommand(selectedIndicies[i], replaceCommand);
                            }
                            this.renderRows();
                            this.selectIndicies(e, selectedIndicies);
                            // this.selectIndicies(this.selectedIndicies[0]); // TODO: select all
                        }

                        // this.render();
                        // this.renderCursorRow();
                        this.playSelectedInstructions(e);

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

                if (e.target.matches('asct-instruction,asct-instruction-add'))
                    return this.onCellInput(e);

                if (e.target.matches('asct-instruction > *'))
                    return this.onCellInput(e, e.target.instruction);

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
                        this.updateSelectionRect(this.mousePosition.lastDown, this.mousePosition.lastDrag)
                    }
                }
                break;

            case 'touchend':
            case 'mouseup':
                this.mousePosition.isDown = false;
                if (this.mousePosition.isDragging 
                    && this.mousePosition.lastDown.path[0].matches('asct-row')
                ) {
                    if(this.isSelectionRectActive()) {
                        this.commitSelectionRect(this.mousePosition.lastDown, this.mousePosition.lastUp);
                        break;
                    }
                }
                this.mousePosition.isDragging = false;

                const lastMouseUp = this.mousePosition.lastUp;
                e.t = new Date();
                this.mousePosition.lastUp = e;
                if(lastMouseUp && lastMouseUp.t.getTime() + this.editor.status.doubleClickTimeout > new Date().getTime()) {
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
                    console.log(e.target, e.path);
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
                if(this.contains(e.target)) {
                    if (!e.altKey) {
                        e.preventDefault();
                        this.editor.menuContext.openContextMenu(e, this.cursorCell);
                    }
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

    /** Forms **/

    get formsTracker() { return this.editor.formsTracker; }

    get fieldRenderRowLength() { return this.formsTracker.querySelector('form.form-render-row-length select[name=rowLengthInTicks]'); }
    get fieldRenderInstrument() { return this.formsTracker.querySelector('form.form-render-instrument select[name=instrument]'); }
    get fieldRenderOctave() { return this.formsTracker.querySelector('form.form-render-octave select[name=octave]'); }
    get fieldSelectedIndicies() { return this.formsTracker.querySelector('form.form-selected-indicies select[name=indicies]'); }

    // get fieldInstructionCommand() { return this.querySelector('form.form-instruction-insert select[name=command]'); }

    get fieldInstructionInstrument() { return this.formsTracker.querySelector('form.form-instruction-instrument select[name=instrument]'); }
    get fieldInstructionDuration() { return this.formsTracker.querySelector('form.form-instruction-duration select[name=duration]'); }
    get fieldInstructionCommand() { return this.formsTracker.querySelector('form.form-instruction-command select[name=command]'); }
    get fieldInstructionVelocity() { return this.formsTracker.querySelector('form.form-instruction-velocity input[name=velocity]'); }
    get fieldInstructionInsert() { return this.formsTracker.querySelector('form.form-instruction-insert button[name=insert]'); }
    get fieldInstructionDelete() { return this.formsTracker.querySelector('form.form-instruction-delete button[name=delete]'); }

    // get fieldRowDuration() { return this.querySelector('form.form-row-duration select[name=duration]'); }

    // get fieldAddInstrumentInstrument() { return this.querySelector('form.form-song-add-instrument select[name=instrument]'); }
    get fieldSelectedIndicies() { return this.formsTracker.querySelector('form.form-selected-indicies input[name=indicies]'); }
    // get fieldSelectedRangeStart() { return this.querySelector('form.form-selected-range input[name=rangeStart]'); }
    // get fieldSelectedRangeEnd() { return this.querySelector('form.form-selected-range input[name=rangeEnd]'); }

    get buttonCommandInsert()   { return this.formsTracker.querySelector(`form.form-instruction-insert button[name=insert]`); }
    get buttonCommandDelete()   { return this.formsTracker.querySelector(`form.form-instruction-delete button[name=delete]`); }

    renderForms() {



        const formSection = this.editor.formsTracker;

        const selectedInstrumentID = this.fieldInstructionInstrument ? parseInt(this.fieldInstructionInstrument.value) : 0;

        formSection.innerHTML = `
            <div class="form-section-divide">
                <span>Track</span>
            </div>
 
            <div class="form-section control-tracker">
                <div class="form-section-header">Instruction</div>
                <form action="#" class="form-instruction-command submit-on-change" data-action="instruction:command">
                    <select name="command" title="Instruction Command" class="themed" required="required">
                        <option value="">Select...</option>
                        <optgroup label="Custom Frequencies" class="instrument-frequencies">
                            ${this.editor.values.renderEditorFormOptions('command-instrument-frequencies')}
                        </optgroup>
                        <optgroup label="Frequencies">
                            ${this.editor.values.renderEditorFormOptions('note-frequencies-all')}
                        </optgroup>
                        <optgroup label="Group Execute">
                            ${this.editor.values.renderEditorFormOptions('command-group-execute')}
                        </optgroup>
                    </select>
                </form>
                <form action="#" class="form-instruction-insert" data-action="instruction:command">
                    <button name="insert" class="themed" title="Insert Instruction">
                        <i class="ui-icon ui-insert"></i>
                    </button>
                </form>
                <form action="#" class="form-instruction-delete submit-on-change" data-action="instruction:delete">
                    <button name="delete" class="themed" title="Delete Instruction">
                        <i class="ui-icon ui-subtract"></i>
                    </button>
                </form>
            </div>
            
            <form action="#" class="form-instruction-instrument submit-on-change" data-action="instruction:instrument">
            <div class="form-section-header">Instrument</div>
                <select name="instrument" title="Instruction Instrument" class="themed">
                    <option value="">No Instrument Selected</option>
                    <optgroup label="Song Instruments">
                        ${this.editor.values.renderEditorFormOptions('song-instruments', 
                            value => value === selectedInstrumentID)}
                    </optgroup>
                </select>
            </form>
            
            <form action="#" class="form-instruction-velocity submit-on-change" data-action="instruction:velocity">
            <div class="form-section-header">Velocity</div>
                <input type="range" name="velocity" min="1" max="100" class="themed" />
            </form>
            
            
            <form action="#" class="form-instruction-duration submit-on-change" data-action="instruction:duration">
                <div class="form-section-header">Duration</div>
                <select name="duration" title="Instruction Duration" class="themed">
                    <option value="">No Duration</option>
                    <optgroup label="Note Duration">
                        ${this.editor.values.renderEditorFormOptions('durations')}
                    </optgroup>
                </select>
            </form>
             
            
                
            <form action="#" class="form-render-octave submit-on-change" data-action="status:octave">
                <div class="form-section-header">Octave</div>
                <select name="octave" class="themed">
                    <optgroup label="Select Octave">
                        ${this.editor.values.renderEditorFormOptions('note-frequency-octaves')}
                    </optgroup>
                </select>
            </form>
            
            <div class="form-section control-tracker">
                <div class="form-section-header">Render Group</div>
                ${this.editor.values.getValues('groups', (value, label) =>
            `<form action="#" class="form-group" data-action="group:change" data-group="${value}">`
            + `<button name="groupName" class="themed" ><span>${label}</span></button>`
            + `</form>`)}
                
                <form action="#" class="form-group" data-action="group:new">
                    <button name="groupName" class="new themed" title="Create new group">
                        <i class="ui-icon ui-insert"></i>
                    </button>
                </form>
                
            </div>
            
            <form action="#" class="form-render-row-length submit-on-change" data-action="tracker:quantization">
                <div class="form-section-header">Row Length</div>
                <select name="rowLengthInTicks" title="Row Length" class="themed">
                    <option value="">Default</option>
                    <optgroup label="Render Duration">
                        ${this.editor.values.renderEditorFormOptions('durations')}
                    </optgroup>
                </select>
            </form>
            
            <form action="#" class="form-render-instrument submit-on-change" data-action="tracker:instrument">
                <div class="form-section-header">Filter By Instrument</div>                    
                <select name="instrument" class="themed"->
                    <option value="">Show All (Default)</option>
                    <optgroup label="Filter By">
                        ${this.editor.values.renderEditorFormOptions('song-instruments')}
                    </optgroup>
                </select>
            </form>
            
            <form class="form-selected-indicies submit-on-change" data-action="tracker:select">
                <div class="form-section-header">Selection</div>                    
                <input type="text" name="indicies" class="themed" placeholder="No selection" />
            </form>
        `;
    }


    onAction(e, actionName, actionParam=null) {
        // const cursorCellIndex = this.editor.cursorCellIndex;
        // const selectedIndicies = this.editor.status.selectedIndicies;
        let selectedIndicies = this.selectedIndicies;
        // const selectedPauseIndices = this.editor.selectedPauseIndicies;
        // const selectedRange = this.editor.selectedRange;

        const form = e.target.form || e.target;
        switch (actionName) {

            // case 'instruction:custom-insert':
            // case 'instruction:insert':
            //     let insertCommand = this.fieldInstructionCommand.value || null;
            //     if(insertCommand === null || actionName === 'instruction:custom-insert')
            //         insertCommand = prompt("Set custom command:", this.fieldInstructionCommand.value);
            //     if(!insertCommand)
            //         throw new Error("Insert new instruction canceled");
            //     // let newInstruction = this.getInstructionFormValues(insertCommand);
            //     // if(!newInstruction) {
            //     //     this.fieldInstructionCommand.focus();
            //     //     return this.editor.setStatus("Insert canceled");
            //     // }
            //     const insertPosition = this.cursorPosition;
            //     if(insertPosition === null)
            //         throw new Error("No cursor position");
            //     const insertIndex = this.editor.renderer.insertInstructionAtPosition(this.groupName, insertPosition, newInstruction);
            //     // this.cursorRow.render(true);
            //     this.render();
            //     this.selectIndicies(e, insertIndex);
            //     // this.fieldInstructionCommand.focus();
            //     this.editor.renderer.playInstruction(newInstruction);
            //     break;

            case 'instruction:custom-command': // TODO: combine
            case 'instruction:command':

                // if(selectedIndicies.length === 0)
                //     throw new Error("No selection");
                let newCommand = this.fieldInstructionCommand.value || null;
                if(newCommand === null || actionName === 'instruction:custom-command')
                    newCommand = prompt("Set custom command:", newCommand || '');
                if(!newCommand)
                    throw new Error("Set command canceled");

                let newInstruction = this.getInstructionFormValues(newCommand);
                let newInstrument = null;
                if(this.fieldInstructionCommand.selectedOptions[0] && this.fieldInstructionCommand.selectedOptions[0].hasAttribute('data-instrument'))
                    newInstrument = parseInt(this.fieldInstructionCommand.selectedOptions[0].getAttribute('data-instrument'));

                if(selectedIndicies.length > 0) {
                    for (let i = 0; i < selectedIndicies.length; i++) {
                        this.editor.renderer.replaceInstructionCommand(this.groupName, selectedIndicies[i], newCommand);
                        if (newInstrument !== null)
                            this.editor.renderer.replaceInstructionInstrument(this.groupName, selectedIndicies[i], newInstrument);
                        // this.editor.renderer.playInstructionAtIndex(this.groupName, selectedIndicies[i]);
                        this.findInstructionElement(selectedIndicies[i]).render();
                    }
                    this.render();
                    this.selectIndicies(e, selectedIndicies);

                } else if(this.cursorCell) {
                    const insertPosition = this.cursorPosition;
                    if(insertPosition === null)
                        throw new Error("No cursor position");
                    const insertIndex = this.editor.renderer.insertInstructionAtPosition(this.groupName, insertPosition, newInstruction);
                    this.render();
                    this.selectIndicies(e, insertIndex);

                } else {
                    throw new Error("No selection or cursor cell");
                }
                this.playSelectedInstructions();
                // this.fieldInstructionCommand.focus();
                // setTimeout(() => this.fieldInstructionCommand.focus(), 1);
                break;

            case 'instruction:instrument':
                let instrumentID = this.fieldInstructionInstrument.value === '' ? null : parseInt(this.fieldInstructionInstrument.value);
                for(let i=0; i<selectedIndicies.length; i++) {
                    this.editor.renderer.replaceInstructionInstrument(this.groupName, selectedIndicies[i], instrumentID);
                    this.findInstructionElement(selectedIndicies[i]).render();
                }
                this.editor.status.currentInstrumentID = instrumentID;
                this.playSelectedInstructions();
                this.renderRows();
                this.selectIndicies(e, selectedIndicies);
                // this.fieldInstructionInstrument.focus();
                break;

            case 'instruction:duration':
            case 'instruction:custom-duration':
                let duration = parseFloat(this.fieldInstructionDuration.value);
                if(duration === null || actionName === 'instruction:custom-duration')
                    duration = parseInt(prompt("Set custom duration in ticks:", this.fieldInstructionDuration.value));
                if(isNaN(duration))
                    throw new Error("Set duration canceled");
                for(let i=0; i<selectedIndicies.length; i++) {
                    this.editor.renderer.replaceInstructionDuration(this.groupName, selectedIndicies[i], duration);
                    this.findInstructionElement(selectedIndicies[i]).render();
                }
                this.playSelectedInstructions();
                this.renderRows();
                this.selectIndicies(e, selectedIndicies);
                // this.fieldInstructionDuration.focus();
                break;

            case 'instruction:velocity':
            case 'instruction:custom-velocity':
                let velocity = this.fieldInstructionVelocity.value === "0" ? 0 : parseInt(this.fieldInstructionVelocity.value) || null;
                if(velocity === null || actionName === 'instruction:custom-velocity')
                     velocity = parseInt(prompt("Set custom velocity (0-127):", this.fieldInstructionVelocity.value));
                if(isNaN(velocity))
                    throw new Error("Set velocity canceled");
                for(let i=0; i<selectedIndicies.length; i++) {
                    this.editor.renderer.replaceInstructionVelocity(this.groupName, selectedIndicies[i], velocity);
                    this.findInstructionElement(selectedIndicies[i]).render();
                }
                this.playSelectedInstructions();
                this.renderRows();
                this.selectIndicies(e, selectedIndicies);
                // this.selectIndicies(e, selectedIndicies[0]);
                // this.fieldInstructionVelocity.focus();
                break;

            case 'instruction:delete':
                for(let i=0; i<selectedIndicies.length; i++)
                    this.editor.renderer.deleteInstructionAtIndex(this.groupName, selectedIndicies[i]);
                this.renderRows();
                this.selectIndicies(e, selectedIndicies[0]);
                break;

            // case 'row:edit':
            //     this.editor.renderer.replaceInstructionParams(this.groupName, selectedPauseIndices, {
            //         command: '!pause',
            //         duration: parseFloat(form.duration.value)
            //     });
            //     // this.trackerSelect([instruction]);
            //     break;

            // case 'row:duplicate':
            //     if (!selectedRange)
            //         throw new Error("No selected range");
            //     this.editor.renderer.duplicateInstructionRange(this.groupName, selectedRange[0], selectedRange[1]);
            //     break;


            case 'group:change':
                const selectedGroupName = actionParam || form.getAttribute('data-group');
                this.groupName = selectedGroupName;
                // this.editor.selectGroup(selectedGroupName);
                break;


            case 'group:new':
                let newGroupName = this.editor.renderer.generateInstructionGroupName(this.groupName);
                newGroupName = prompt("Create new instruction group?", newGroupName);
                if (newGroupName) this.editor.renderer.addInstructionGroup(newGroupName, []);
                else this.editor.setStatus("<span style='color: red'>Create instruction group canceled</span>");
                this.editor.render();
                break;

            case 'row-segment:change':
                this.currentRowSegmentID = parseInt(form.elements.id.value);
                this.render();
                break;

            case 'tracker:octave':
                this.editor.status.currentOctave = parseInt(this.fieldRenderOctave.value);
                break;

            case 'tracker:quantization':
                this.rowLengthInTicks = this.fieldRenderRowLength.value;
                this.render(1);
                break;

            case 'tracker:instrument':
                this.render();
                break;

            case 'tracker:select':
                selectedIndicies = this.fieldSelectedIndicies.value
                    .split(/\D+/)
                    .map(index => parseInt(index));
                this.selectIndicies(e, selectedIndicies);
                this.fieldSelectedIndicies.focus();
                break;

            default:
                return false;
                // console.warn("Unhandled " + e.type + ": ", actionName);
                break;
        }
        return true;
        // } catch (e) {
        //     this.onError(e);
        // }
    }

    // createNewInstructionCell(rowElement) {
    //     if(!rowElement)
    //         throw new Error("Invalid Row Element: " + typeof rowElement);
    //     this.querySelectorAll('asct-instruction-add')
    //         .forEach((elm) => elm.parentNode.removeChild(elm));
    //     const newInstructionElm = document.createElement('asct-instruction-add');
    //     newInstructionElm.index = rowElement.index; // setAttribute('p', rowElement.position);
    //     newInstructionElm.innerHTML = `+`;
    //     const deltaElm = rowElement.querySelector('asct-delta');
    //     rowElement.insertBefore(newInstructionElm, deltaElm);
    //     return newInstructionElm;
    // }

    onRowInput(e) {
        e.preventDefault();
        let selectedRow = e.target;
        if(!e.shiftKey)
            this.clearSelection([selectedRow]);

        // selectedRow.select();
        selectedRow.createAddInstructionElement();
        selectedRow.setCursor();
        this.update();
        this.playSelectedInstructions(e);
        this.focusOnContainer();
        this.editor.renderer.setStartPositionInTicks(selectedRow.position);
    }

    onCellInput(e, selectedCell) {
        e.preventDefault();
        selectedCell = selectedCell || e.target;
        if(!e.ctrlKey)
            this.clearSelection([selectedCell, selectedCell.row]);

        this.editor.closeAllMenus();
        console.time("onCelInput");
        selectedCell.select(!selectedCell.selected);
        console.timeEnd("onCelInput");
        selectedCell.setCursor();
        selectedCell.play();
        this.focusOnContainer();
        this.editor.renderer.setStartPositionInTicks(selectedCell.parentNode.position);
    }

    // onParamInput(e) {
    //     let selectedCell = e.target.instruction;
    //     this.onCellInput(e, selectedCell);
    // }

    onSongEvent(e) {
//         console.log("onSongEvent", e.type);
        const detail = e.detail || {stats:{}};
        let rowElm, instructionElm;
        switch(e.type) {

            // case 'note:play':
            //     rowElm = this.findRowElement(detail.stats.groupPositionInTicks);
            //     instructionElm = this.findInstructionElement(detail.stats.currentIndex);
            //
            //
            //     const currentTime = detail.currentTime;
            //     // if(detail.startTime > currentTime)
            //         setTimeout(() => {
            //             if(instructionElm) {
            //                 instructionElm.classList.add('playing');
            //             }
            //             if(rowElm) {
            //                 rowElm.classList.add('playing');
            //                 rowElm.scrollTo(); // Scroll To position, not index
            //             }
            //
            //         }, (detail.startTime - currentTime) * 1000);
            //     // else {
            //     //     // Start immediately
            //     // }
            //
            //     if(detail.duration) {
            //         setTimeout(() => {
            //             if(instructionElm) {
            //                 instructionElm.classList.remove('playing');
            //             }
            //             if(rowElm) {
            //                 rowElm.classList.remove('playing');
            //             }
            //         }, (detail.startTime - currentTime + detail.duration) * 1000);
            //     }
            //
            //     break;
            // //
            case 'note:start':
                if(detail.groupPositionInTicks) {
                    rowElm = this.findRowElement(detail.groupPositionInTicks);
                    if (!rowElm) {
                        const newRowSegmentID = this.getSegmentIDFromPositionInTicks(detail.groupPositionInTicks);
                        if(newRowSegmentID !== this.currentRowSegmentID) {
                            this.currentRowSegmentID = newRowSegmentID;
                            this.render();
                        }
                        rowElm = this.findRowElement(detail.groupPositionInTicks);
                    }
                    if(rowElm) {
                        rowElm.classList.add('playing');
                        // rowElm.scrollTo(); // Scroll To position, not index
                    }
                }
                if(detail.groupIndex) {
                    instructionElm = this.findInstructionElement(detail.groupIndex);
                    if (instructionElm) {
                        instructionElm.classList.add('playing');
                    }
                }
                break;
            case 'note:end':
                if(detail.groupPositionInTicks) {
                    rowElm = this.findRowElement(detail.groupPositionInTicks);
                    if (rowElm) {
                        rowElm.classList.remove('playing');
                    }
                }
                if(detail.groupIndex) {
                    instructionElm = this.findInstructionElement(detail.groupIndex);
                    if (instructionElm) {
                        instructionElm.classList.remove('playing');
                    }
                }
                break;

            // case 'song:play':
            //     this.classList.add('playing');
            //     break;
            // case 'song:end':
            // case 'song:pause':
            //     this.classList.remove('playing');
            //     break;
        }
    }

    // TODO: refactor?
    get selectedCells() { return this.querySelectorAll('asct-instruction.selected'); }
    get cursorCell() { return this.querySelector('asct-instruction.cursor,asct-instruction-add.cursor'); }
    get cursorRow() { return this.cursorCell.parentNode; }
    get cursorPosition() { return ((cell) => (cell ? cell.parentNode.position : null))(this.cursorCell); }
    get cursorInstruction() { return this.getInstruction(this.cursorCell.index); }
    // // }

    get selectedIndicies() {
        return [].map.call(this.selectedCells, (elm => elm.index));
    }

    getCursorElement() {
        return this.querySelector('.cursor');
    }

    selectNextCell(e, clearSelection=true) {
        const cursorCell = this.getCursorElement();
        let selectedCell;

        if(!cursorCell) {
            // If no cursor is found, select the first
            selectedCell = this.querySelector('asct-instruction');
        } else if(cursorCell.nextElementSibling && cursorCell.nextElementSibling.matches('asct-instruction')) {
            // If next element is an instruction, select it
            selectedCell = cursorCell.nextElementSibling;

        } else if(cursorCell.nodeName.toLowerCase() === 'asct-instruction-add') {
            // If next element is an add instruction, select the next row
            const cursorRow = cursorCell.parentNode;
            const nextRowElm = cursorRow.nextElementSibling;
            if(!nextRowElm)
                return this.selectNextRowCell(e, clearSelection);
            selectedCell = nextRowElm.querySelector('asct-instruction');
            if(!selectedCell)
                selectedCell = nextRowElm.createAddInstructionElement();
        }

        if(!selectedCell)
            selectedCell = cursorCell.row.createAddInstructionElement();

        selectedCell
            .select(true)
            .setCursor();

        if(clearSelection)
            this.clearSelection(selectedCell);
    }

    selectNextRowCell(e, clearSelection=true, cellPosition=null, increaseTrackerSize=true) {
        const cursorCell = this.getCursorElement();
        const cursorRow = cursorCell.parentNode;
        if(cellPosition === null)
            cellPosition = [].indexOf.call(cursorCell.parentNode.children, cursorCell);

        if(!cursorRow.nextElementSibling) {
            // if(!increaseTrackerSize)
            //     throw new Error("New row was not created");
            // return this.increaseTrackerSize(e);
            // if(this.currentRowSegmentID === 0)
            //     throw new Error("TODO: reached end of song");
            this.currentRowSegmentID++;
            this.render();
            this.selectNextCell(e, true);
            return;
        }

        const nextRowElm = cursorRow.nextElementSibling;
        // for(let i=cellPosition; i>=0; i--)
        //     if(nextRowElm.children[i] && nextRowElm.children[i].matches('asct-instruction,asct-instruction-add'))
        //         return this.selectCell(e, nextRowElm.children[i]);
        let selectedCell = nextRowElm.firstElementChild;
        if(nextRowElm.children[cellPosition] && nextRowElm.children[cellPosition].matches('asct-instruction,asct-instruction-add')) {
            selectedCell = nextRowElm.children[cellPosition];
        } else {
            selectedCell = nextRowElm.createAddInstructionElement();
        }

        if(!selectedCell)
            selectedCell = nextRowElm.createAddInstructionElement();

        selectedCell
            .select(true)
            .setCursor();

        if(clearSelection)
            this.clearSelection(selectedCell);
    }


    selectPreviousCell(e, clearSelection=true) {
        const cursorCell = this.getCursorElement();
        let selectedCell;

        if(!cursorCell) {
            // If no cursor is found, select the first
            selectedCell = this.querySelector('asct-instruction:last-child');
        } else if(cursorCell.previousElementSibling && cursorCell.previousElementSibling.matches('asct-instruction')) {
            // If previous element is an instruction, select it
            selectedCell = cursorCell.previousElementSibling;

        } else {
            // If next element is an add instruction, select the next row
            const cursorRow = cursorCell.parentNode;
            const previousRowElm = cursorRow.previousElementSibling;
            if(!previousRowElm)
                return this.selectPreviousRowCell(e, clearSelection);
            selectedCell = previousRowElm.querySelector('asct-instruction:last-child');
            if(!selectedCell)
                selectedCell = previousRowElm.createAddInstructionElement();
        }

        if(!selectedCell)
            selectedCell = cursorCell.row.createAddInstructionElement();

        selectedCell
            .select(true)
            .setCursor();

        if(clearSelection)
            this.clearSelection(selectedCell);
    }


    selectPreviousRowCell(e, clearSelection=true, cellPosition=null) {
        const cursorCell = this.getCursorElement();
        const cursorRow = cursorCell.parentNode;
        if(cellPosition === null)
            cellPosition = [].indexOf.call(cursorCell.parentNode.children, cursorCell);
        if(!cursorRow.previousElementSibling) {
            if(this.currentRowSegmentID === 0)
                throw new Error("TODO: reached beginning of song");
            this.currentRowSegmentID--;
            this.render();
            this.selectPreviousCell(e, true);
            return;
        }

        let previousRowElm = cursorRow.previousElementSibling;
        // for(let i=cellPosition; i>=0; i--)
        //     if(nextRowElm.children[i] && nextRowElm.children[i].matches('asct-instruction,asct-instruction-add'))
        //         return this.selectCell(e, nextRowElm.children[i]);
        let selectedCell = previousRowElm.querySelector('asct-instruction:last-child');
        if(previousRowElm.children[cellPosition] && previousRowElm.children[cellPosition].matches('asct-instruction,asct-instruction-add')) {
            selectedCell = previousRowElm.children[cellPosition];
        } else {
            selectedCell = previousRowElm.createAddInstructionElement();
        }

        if(!selectedCell)
            selectedCell = previousRowElm.createAddInstructionElement();

        selectedCell
            .select(true)
            .setCursor();

        if(clearSelection)
            this.clearSelection(selectedCell);



        //
        // const cursorCell = this.cursorCell || this.querySelector('asct-instruction');
        // if(clearSelection)
        //     this.clearSelection();
        // const cursorRow = cursorCell.parentNode;
        // cellPosition = cellPosition === null ? [].indexOf.call(cursorRow.children, cursorCell) : cellPosition;
        //
        // let previousRowElm = cursorRow.previousElementSibling;
        // if(!previousRowElm)
        //     previousRowElm = cursorRow.parentNode.lastElementChild; // throw new Error("Previous row not available");
        //
        // let selectedCell;
        // if(previousRowElm.children[cellPosition] && previousRowElm.children[cellPosition].matches('asct-instruction')) {
        //     // If parallel column cell is available, select it
        //     selectedCell = previousRowElm.children[cellPosition];
        // } else {
        //     selectedCell = previousRowElm.createAddInstructionElement();
        //     // previousRowElm.setCursor();
        //     // selectedCell = this.createNewInstructionCell(previousRowElm);
        // }
        //
        // selectedCell
        //     .select(true)
        //     .setCursor();
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





    selectIndicies(e, indicies, clearSelection=true) {
        if(!Array.isArray(indicies))
            indicies = [indicies];
        if(clearSelection)
            this.clearSelection();
        for(let i=0; i<indicies.length; i++) {
            const cell = this.findInstructionElement(indicies[i]);
            if(!cell)
                throw new Error("Instruction not found: " + indicies[i]);
            cell.select(true, false);
            if(i===0)
                cell.setCursor();
        }
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


    navigatePop() {
        this.editor.setStatus("Navigate Back: ", this.status.trackers[0].groupName);
        if(this.status.trackers.length > 0)
            this.status.trackers.shift();
        this.render();
    }

    increaseTrackerSize(e, selectNewRow=true) {
        // TODO: sloppy
        // this.editor.renderer.eachInstruction(this.groupName, (index, instruction, stats) => {
        //     if (this.minimumTrackerLengthTicks < stats.groupPositionInTicks)
        //         this.minimumTrackerLengthTicks = stats.groupPositionInTicks;
        // });

        // const defaultDuration = parseFloat(this.editorForms.fieldRenderRowLength.value);
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
        return this.editor.renderer.insertInstructionAtIndex(this.groupName, insertIndex, instruction);
    }

    insertInstructionAtPosition(insertTimePosition, instruction) {
        return this.editor.renderer.insertInstructionAtPosition(this.groupName, insertTimePosition, instruction);
    }
    deleteInstructionAtIndex(deleteIndex) {
        return this.editor.renderer.deleteInstructionAtIndex(this.groupName, deleteIndex, 1);
    }
    replaceInstructionCommand(replaceIndex, newCommand) {
        return this.editor.renderer.replaceInstructionCommand(this.groupName, replaceIndex, newCommand);
    }

    replaceInstructionVelocity(replaceIndex, newVelocity) {
        return this.editor.renderer.replaceInstructionVelocity(this.groupName, replaceIndex, newVelocity);
    }


    // replaceInstructionParams(replaceIndex, replaceParams) {
    //     return this.editor.renderer.replaceInstructionParams(this.groupName, replaceIndex, replaceParams);
    // }

    replaceFrequencyAlias(noteFrequency, instrumentID) {
        const instrument = this.editor.renderer.getInstrument(instrumentID, false);
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

    findRowElement(rowPosition) {
        return this.querySelector(`asct-row[p='${rowPosition}']`);
    }

    findInstructionElement(instructionIndex) {
        return this.querySelector(`asct-instruction[i='${instructionIndex}']`);
    }

    getInstructionHTML(index, instruction) {
        return `<div class="instruction" data-index="${index}">
                    <div class="command">${instruction.command}</div>
                    ${instruction.instrument !== null ? `<div class="instrument">${this.editor.values.format(instruction.instrument, 'instrument')}</div>` : ''}
                    ${instruction.velocity !== null ? `<div class="velocity">${this.editor.values.format(instruction.velocity, 'velocity')}</div>` : ''}
                    ${instruction.duration !== null ? `<div class="duration">${this.editor.values.format(instruction.duration, 'duration')}</div>` : ''}
                </div>`;
    }

    // getRowHTML(songPositionInTicks, subDurationInTicks, instructionList, startingIndex) {
    //     const rowHTML = [];
    //     let currentIndex = startingIndex;
    //     for(let i=0; i<instructionList.length; i++)
    //         rowHTML.push(this.getInstructionHTML(currentIndex++, instructionList[i]));
    //
    //     return `<div data-position="${songPositionInTicks}">
    //                ${rowHTML.join('')}
    //                <div class="delta">${this.editor.values.format(subDurationInTicks, 'duration')}</div>
    //             </div>`;
    // }

    // renderCursorRow() {
    //     const songPositionInTicks = parseInt(this.cursorRow.getAttribute('data-position'));
    //     const instructionList = [];
    //     let startingIndex = null;
    //     let lastSongPositionInTicks = 0, lastSubDurationInTicks=0;
    //
    //     this.editor.renderer.eachInstruction(this.groupName, (index, instruction, stats) => {
    //         if(lastSongPositionInTicks !== stats.groupPositionInTicks) {
    //             lastSubDurationInTicks = stats.groupPositionInTicks - lastSongPositionInTicks;
    //             lastSongPositionInTicks = stats.groupPositionInTicks;
    //         }
    //         if (stats.groupPositionInTicks === songPositionInTicks) {
    //             if(startingIndex === null)
    //                 startingIndex = index;
    //             instructionList.push(instruction);
    //         } else if (stats.groupPositionInTicks > songPositionInTicks) {
    //             return false;
    //         }
    //     });
    //
    //     this.cursorRow.outerHTML = this.getRowHTML(songPositionInTicks, lastSubDurationInTicks, instructionList, startingIndex);
    //     this.update();
    // }
}
customElements.define('asc-tracker', AudioSourceComposerTracker);



const VISIBLE_BUFFER = 100;

class AudioSourceComposerTrackerRow extends HTMLElement {
    constructor() {
        super();
    }
    get tracker() { return this.closest('asc-tracker'); }
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
            newInstructionElm.index = this.index; // setAttribute('p', rowElement.position);
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

    setCursor() {
        let existingInstructionAddElement = this.querySelector('asct-instruction-add');
        existingInstructionAddElement.classList.add('cursor');
        // this.createAddInstructionElement();
        // const deltaElm = this.getDeltaElement();
        // this.insertBefore(existingInstructionAddElement, deltaElm);
        // return existingInstructionAddElement;

        // TODO: this.selectIndicies([]);
        // const newInstructionElm = this.createNewInstructionCell(selectedRow);
        // this.selectCell(e, newInstructionElm);
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

    updateDelta() {
        let deltaElm = this.getDeltaElement();
        this.appendChild(deltaElm);
        deltaElm.render(this.duration);
    }

    scrollTo() {
        // const container = this.tracker; // cursorCell.closest('.composer-tracker-container');
        // if (container.scrollTop < this.offsetTop - container.offsetHeight)
        //     container.scrollTop = this.offsetTop;
        //
        // if (container.scrollTop > this.offsetTop)
        //     container.scrollTop = this.offsetTop - container.offsetHeight;
    }


    render(startIndex, songPositionInTicks, rowInstructionList=[]) {
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

class AudioSourceComposerTrackerRowSegment extends HTMLElement {
    constructor(id, positionInTicks) {
        super();
        this.id = id;
        this.positionInTicks = positionInTicks;
    }
    get tracker()   { return this.closest('asc-tracker'); }

    get id()        { return parseInt(this.getAttribute('id'))}
    set id(id)      { this.setAttribute('id', id); }

    get positionInTicks()          { return parseInt(this.getAttribute('position'))}
    set positionInTicks(position)  { this.setAttribute('position', position); }

    get selected()      { return this.classList.contains('selected'); }
    set selected(value) { this.classList.toggle('selected', value); }

    connectedCallback() {
        // setTimeout(e => this.render(), 1);
        // this.setAttribute('draggable', true);
        this.render();
    }


    render() {
        this.innerHTML =
            `<form action="#" class="form-row-segment" data-action="row-segment:change">
                <input type="hidden" name="id" value="${this.id}" />
                <button name="select" title="Render row segment #${this.id}">
                    <span>${this.id}</span>
                </button>
            </form>`;
        return this;
    }

}

customElements.define('asctr-segment', AudioSourceComposerTrackerRowSegment);


class AudioSourceComposerTrackerInstruction extends HTMLElement {
    constructor() {
        super();
    }
    get row() { return this.parentNode; }
    get tracker() {
        if(!this.parentNode)
            throw new Error("Invalid tracker");
        return this.parentNode.tracker; }
    get editor() { return this.tracker.editor; }

    set index(instructionIndex) {
        this.setAttribute('i', instructionIndex);
        // this.render();
    }
    get index() { return parseInt(this.getAttribute('i'))}
    get selected() { return this.classList.contains('selected'); }

    getInstruction() { return this.row.tracker.getInstruction(this.index); }

    play() {
        this.editor.renderer.playInstructionAtIndex(
            this.tracker.groupName,
            this.index,
            this.editor.renderer.getAudioContext().currentTime,
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

    setCursor() {
        // Remove other cursor elements
        this.tracker.querySelectorAll('.cursor')
            .forEach((elm) => elm.classList.remove('cursor'));
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

        let commandElm = this.querySelector('ascti-command') || document.createElement('ascti-command');
        this.appendChild(commandElm);
        commandElm.render(instruction);

        if(this.classList.contains('selected')) {
            let instrumentElm = this.querySelector('ascti-instrument') || document.createElement('ascti-instrument');
            this.appendChild(instrumentElm);
            instrumentElm.render(instruction);

            let velocityElm = this.querySelector('ascti-velocity') || document.createElement('ascti-velocity');
            this.appendChild(velocityElm);
            velocityElm.render(instruction);

            let durationElm = this.querySelector('ascti-duration') || document.createElement('ascti-duration');
            this.appendChild(durationElm);
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
    get tracker() { return this.parentNode.parentNode.tracker; }
    get editor() { return this.tracker.editor; }

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
    get editor() { return this.tracker.editor; }
    get tracker() { return this.parentNode.tracker; }
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





