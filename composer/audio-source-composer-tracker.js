class AudioSourceComposerTracker extends HTMLElement {
    constructor() {
        super();
        this.editor = null;
        this.eventHandlers = [];

        // this.cursorCellIndex = 0;
        // this.renderTimeout = null;
        // this.renderScrollLimit = 1200;
        // this.renderMinimumRows = 16;
        this.segmentLength = 16;
        this.currentRowSegmentID = 0;

        // this.selectedIndicies = [0];
        this.mousePosition = {};
        // this.instructionElms = null;
        this.rowContainer = null;
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
            e => this.onInput(e));

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
        if(this.editor.renderer.isPlaying)
            this.editor.renderer.stopPlayback();
        const selectedIndicies = this.selectedIndicies;
        for(let i=0; i<selectedIndicies.length; i++) {
            this.editor.renderer.playInstructionAtIndex(this.groupName, selectedIndicies[i]);
        }
    }
    getInstructions(indicies=null) {
        return this.editor.renderer.getInstructions(this.groupName, indicies);
    }

    // getInstructionRange(start, end=null) {
    //     return this.editor.renderer.getInstructionRange(this.groupName, start, end);
    // }

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

        // if(!this.isConnected) {
        //     // TODO: inefficient? console.warn("Tracker not connected. Skipping render", this);
        //     return;
        // }

        // this.innerHTML = `
        //     <div class="form-section-container">
        //     ${this.renderSongForms()}
        //     </div>
        //     <div class="tracker-scroll-container">
        //     </div>
        // `;

        this.innerHTML = `
        <div class="row-segment-container"></div>
        <div class="row-container" tabindex="0"></div>
`;
        this.rowContainer = this.querySelector('.row-container');

        this.renderMenu();
        this.renderForms();
        this.renderRows();


    }


    focusOnContainer() {
        if(this.rowContainer && this.rowContainer !== document.activeElement) {
            this.rowContainer.focus();
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

        this.rowContainer.innerHTML = '';

        // Instruction Iterator
        let instructionIterator = this.editor.renderer.getIterator(this.groupName);

        const quantizationInTicks = this.rowLengthInTicks;

        const segmentLengthInTicks = this.segmentLength * timeDivision;

        let lastRowIndex=0, lastRowPositionInTicks=0;

        const renderRow = (songPositionInTicks, rowInstructionList=[]) => {
            const currentRowSegmentID = Math.floor(songPositionInTicks / segmentLengthInTicks);
            if(this.currentRowSegmentID === currentRowSegmentID) {
                const rowElm = new AudioSourceComposerTrackerRow(); // document.createElement('asct-row');
                this.rowContainer.appendChild(rowElm);
                rowElm.render(lastRowIndex, songPositionInTicks, rowInstructionList);
                return rowElm;
            }
            return null;
        };

        const renderQuantizationRows = (startRowPositionInTicks, endRowPositionInTicks) => {

            let nextBreakPositionInTicks = Math.ceil(startRowPositionInTicks / quantizationInTicks) * quantizationInTicks + quantizationInTicks;
            while (nextBreakPositionInTicks < endRowPositionInTicks) {
                renderRow(nextBreakPositionInTicks);
                // const currentRowSegmentID = Math.floor(nextBreakPositionInTicks / segmentLengthInTicks);
                // if(this.currentRowSegmentID === currentRowSegmentID) {
                //     const rowElm = new AudioSourceComposerTrackerRow(); // document.createElement('asct-row');
                //     this.rowContainer.appendChild(rowElm);
                //     rowElm.render(lastRowIndex, nextBreakPositionInTicks);
                // }
                nextBreakPositionInTicks += quantizationInTicks;
            }
        };


        const filterByInstrumentID = this.fieldTrackerFilterInstrument.value ? parseInt(this.fieldTrackerFilterInstrument.value) : null;

        let rowInstructionList = null;
        while(rowInstructionList = instructionIterator.nextInstructionRow(filterByInstrumentID)) {
            const currentRowSegmentID = Math.floor(instructionIterator.groupPositionInTicks / segmentLengthInTicks);

            let rowElm = renderRow(instructionIterator.lastRowGroupStartPositionInTicks, rowInstructionList);
            renderQuantizationRows(lastRowPositionInTicks, instructionIterator.groupPositionInTicks);
            // console.log("Row", rowInstructionList);
            // if(this.currentRowSegmentID === currentRowSegmentID) {
            //
            //     let rowElm = new AudioSourceComposerTrackerRow(); // document.createElement('asct-row');
            //     this.rowContainer.appendChild(rowElm);
            //     if(filterByInstrumentID !== null)
            //         rowInstructionList = rowInstructionList.filter(inst => inst.instrument === filterByInstrumentID);
            //
            //     rowElm.render(lastRowIndex, instructionIterator.lastRowGroupStartPositionInTicks, rowInstructionList);
            // }
            lastRowPositionInTicks = instructionIterator.groupPositionInTicks;
            lastRowIndex = instructionIterator.groupIndex;

        }

        const currentRowSegmentEndPositionInTicks = (this.currentRowSegmentID + 1) * segmentLengthInTicks;
        renderQuantizationRows(lastRowPositionInTicks, currentRowSegmentEndPositionInTicks);


        // Segments

        let segmentContainer = this.querySelector('.row-segment-container');
        segmentContainer.innerHTML = '';

        let lastRowSegmentID = Math.floor(lastRowPositionInTicks / segmentLengthInTicks);
        if(lastRowSegmentID < this.currentRowSegmentID)
            lastRowSegmentID = this.currentRowSegmentID;
        for(let segmentID = 0; segmentID <= lastRowSegmentID+1; segmentID++) {

            let segmentElm = new AudioSourceComposerTrackerRowSegment(segmentID, segmentID * segmentLengthInTicks);
            segmentContainer.appendChild(segmentElm);
            if(segmentID === this.currentRowSegmentID) {
                segmentElm.selected = segmentID === this.currentRowSegmentID;
//                 segmentElm.focus();
            }
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
                    menuCustom.action = handleAction('song:new-group');
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

        let selectedIndicies = this.selectedIndicies;
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
                        this.focusOnContainer();
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
                        const selectedIndiciesDesc = selectedIndicies.sort((a, b) => b - a);
                        for (let i = 0; i < selectedIndiciesDesc.length; i++)
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
                        if(this.rowContainer.contains(e.target)) {

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
                        //     this.editor.renderer.playInstruction(instructionList[i]);
                        // }
                        break;

                    // ctrlKey && metaKey skips a measure. shiftKey selects a range
                    case 'ArrowRight':
                        e.preventDefault();
                        this.selectNextCell(e)
                            .scrollTo();
                        this.playSelectedInstructions(e);
                        this.focusOnContainer();
                        break;

                    case 'ArrowLeft':
                        e.preventDefault();
                        this.selectPreviousCell(e)
                            .scrollTo();
                        this.playSelectedInstructions(e);
                        this.focusOnContainer();
                        break;

                    case 'ArrowDown':
                        e.preventDefault();
                        this.selectNextRowCell(e)
                            .scrollTo();
                        this.playSelectedInstructions(e);
                        this.focusOnContainer();
                        break;

                    case 'ArrowUp':
                        e.preventDefault();
                        this.selectPreviousRowCell(e)
                            .scrollTo();
                        this.playSelectedInstructions(e);
                        this.focusOnContainer();
                        break;

                    case ' ':
                        if(this.rowContainer.contains(e.target)) {

                            e.preventDefault();
                            // this.selectCell(e, this.cursorCell);
                            // if(e.ctrlKey) e.preventDefault();
                            if (this.editor.renderer.isPlaybackActive()) {
                                this.editor.renderer.stopPlayback();
                            } else {
                                this.editor.renderer.play();
                            }
                        }
                        break;

                    case 'PlayFrequency':
                        let newCommand = this.editor.keyboard.getKeyboardCommand(e.key);
                        if (newCommand === null)
                            break;

                        e.preventDefault();

                        this.insertOrUpdateCommand(e, newCommand);

                        // this.render();
                        // this.renderCursorRow();
                        this.playSelectedInstructions(e);
                        this.focusOnContainer();

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
                if(this.rowContainer.contains(e.target)) {
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


    /** Tracker Panel **/

    get panelTracker() { return this.editor.panelTracker; }

    /** Tracker Forms **/

    get formTrackerOctave() { return this.editor.panelTracker.getOrCreateForm('octave'); }

    get formTrackerRowLength() { return this.editor.panelTracker.getOrCreateForm('row-length'); }
    get formTrackerInstrument() { return this.editor.panelTracker.getOrCreateForm('instrument'); }
    get formTrackerSelection() { return this.editor.panelTracker.getOrCreateForm('selection'); }

    /** Tracker Fields **/

    get fieldTrackerRowLength() {
        return this.formTrackerRowLength.getInput('row-length', false)
            || this.formTrackerRowLength.addSelect('row-length', e => this.editor.actions.setTrackerRowLength(e),
                (e, addOption) => {
                    addOption('', 'Default');
                    this.editor.values.getValues('durations', addOption)
                }, 'Select Octave');
    }

    get fieldTrackerFilterInstrument() {
        return this.formTrackerInstrument.getInput('filter-instrument', false)
            || this.formTrackerInstrument.addSelect('filter-instrument', e => this.editor.actions.setTrackerFilterInstrument(e),
                (e, addOption) => {
                    addOption('', 'Default');
                    this.editor.values.getValues('song-instruments', addOption)
                }, 'Select Octave');
    }
    get fieldTrackerOctave() {
        return this.formTrackerOctave.getInput('octave', false)
            || this.formTrackerOctave.addSelect('octave', e => this.editor.actions.setTrackerOctave(e),
                (e, addOption) => {
                    this.editor.values.getValues('note-frequency-octaves', addOption)
                }, 'Select Octave');
    }
    get fieldTrackerSelection() {
        return this.formTrackerSelection.getInput('selection', false)
            || this.formTrackerSelection.addTextInput('selection',
                    e => this.editor.actions.setTrackerSelection(e),
                    'Selection',
                    'No selection'
                );
    }
    // get fieldInstructionCommand() { return this.panelInstruction.querySelector('ascp-form[key=command] ascpf-select[key=command]'); }

    /** Instruction Panel **/

    get panelInstruction() { return this.editor.panelInstruction; }

    /** Instruction Forms **/

    get formInstructionCommand() { return this.editor.panelInstruction.getOrCreateForm('command'); }
    get formInstructionInstrument() { return this.editor.panelInstruction.getOrCreateForm('instrument'); }
    get formInstructionVelocity() { return this.editor.panelInstruction.getOrCreateForm('velocity'); }
    get formInstructionDuration() { return this.editor.panelInstruction.getOrCreateForm('duration'); }

    /** Instruction Fields **/

    get fieldInstructionCommand() {
        return this.formInstructionCommand.getInput('command', false)
            || this.formInstructionCommand.addSelect('command', e => this.editor.actions.setInstructionCommand(e),
                (e, addOption, setOptgroup) => {
                    // const selectedInstrumentID = this.fieldInstructionInstrument ? parseInt(this.fieldInstructionInstrument.value) : 0;
                    addOption('', 'No Command Selected');
                    setOptgroup('Frequencies');
                    this.editor.values.getValues('note-frequencies-all', addOption);
                    setOptgroup('Custom Frequencies');
                    // TODO: filter by selected instrument
                    this.editor.values.getValues('command-instrument-frequencies', addOption);
                    setOptgroup('Groups');
                    this.editor.values.getValues('command-group-execute', addOption);
                }, 'Instruction Instrument');
    }


    get fieldInstructionInsert() {
        return this.formInstructionCommand.getInput('insert', false)
            || this.formInstructionCommand.addButton('insert', e => this.editor.actions.insertInstructionCommand(e),
                `<i class="ui-icon ui-insert"></i>`,
                "Insert Instruction");
    }

    get fieldInstructionDelete() {
        return this.formInstructionCommand.getInput('delete', false)
            || this.formInstructionCommand.addButton('delete', e => this.editor.actions.deleteInstructionCommand(e),
                `<i class="ui-icon subtract"></i>`,
                "Delete Instruction");
    }
    get fieldInstructionInstrument() {
        return this.formInstructionInstrument.getInput('instrument', false)
            || this.formInstructionInstrument.addSelect('instrument', e => this.editor.actions.setInstructionInstrument(e),
                (e, addOption, setOptgroup) => {
                    addOption('', 'No Instrument Selected');
                    setOptgroup('Song Instruments');
                    this.editor.values.getValues('song-instruments', addOption);
                }, 'Instruction Instrument');
    }

    get fieldInstructionVelocity() {
        return this.formInstructionVelocity.getInput('velocity', false)
            || this.formInstructionVelocity.addRangeInput('velocity', e => this.editor.actions.setInstructionVelocity(e), 1, 127)
    }

    get fieldInstructionDuration() {
        return this.formInstructionDuration.getInput('duration', false)
            || this.formInstructionDuration.addSelect('duration', e => this.editor.actions.setInstructionDuration(e),
                    (e, addOption, setOptgroup) => {
                        addOption('', 'No Duration');
                        this.editor.values.getValues('durations', addOption);
                    }, 'Instruction Duration');
    }


    renderForms() {
        /** Instruction Panel **/



        let selectedIndicies = this.selectedIndicies;
        // let timeDivision = this.rowLengthInTicks || this.editor.renderer.getSongTimeDivision();
        const selectedInstructionList = this.editor.renderer.getInstructions(this.groupName, selectedIndicies);
        let cursorInstruction = selectedInstructionList[0];

        this.fieldInstructionCommand.value = cursorInstruction ? cursorInstruction.command : null;
        this.fieldInstructionInsert;
        this.fieldInstructionDelete.disabled = selectedIndicies.length === 0;

        this.fieldInstructionInstrument.value = cursorInstruction ? cursorInstruction.instrument : null;
        this.fieldInstructionVelocity.value = cursorInstruction ? cursorInstruction.velocity : null;
        this.fieldInstructionDuration.value = cursorInstruction ? cursorInstruction.duration : null;

        this.fieldTrackerOctave;
        this.fieldTrackerFilterInstrument;
        this.fieldTrackerRowLength;
        this.fieldTrackerSelection;


        // this.querySelectorAll('.multiple-count-text').forEach((elm) => elm.innerHTML = (selectedIndicies.length > 1 ? '(s)' : ''));

        // Status Fields

        if(this.fieldTrackerOctave.value === null)
            this.fieldTrackerOctave.value = 3; // this.editor.status.currentOctave;

        this.fieldTrackerRowLength.value = this.rowLengthInTicks; // this.editor.renderer.getSongTimeDivision();
        if(!this.fieldInstructionDuration.value && this.fieldTrackerRowLength.value)
            this.fieldInstructionDuration.value = this.fieldTrackerRowLength.value;


        this.fieldTrackerSelection.value = selectedIndicies.join(',');
    }


    onRowInput(e) {
        e.preventDefault();
        let selectedRow = e.target;
        if(!e.shiftKey)
            this.clearSelection([selectedRow]);

        // selectedRow.select();
        selectedRow.createAddInstructionElement();
        selectedRow.setCursor();
        this.renderForms();
        this.playSelectedInstructions(e);
        this.focusOnContainer();
        selectedRow.parentNode.scrollTo();
        this.editor.renderer.setPlaybackPositionInTicks(selectedRow.position);
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
        this.renderForms();
        selectedCell.play();
        selectedCell.parentNode.scrollTo();
        this.focusOnContainer();
        this.editor.renderer.setPlaybackPositionInTicks(selectedCell.parentNode.position);
    }


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
                            this.renderRows();
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

    get selectedIndicies() {
        return [].map.call(this.selectedCells, (elm => elm.index));
    }

    getCursorElement() {
        return this.querySelector('.cursor');
    }

    selectNextCell(e, clearSelection=true) {
        const cursorCell = this.getCursorElement();
        let selectedCell;

        if(cursorCell) {
            if(cursorCell instanceof AudioSourceComposerTrackerInstructionAdd) {
                // If next element is an add instruction, select the next row
                return this.selectNextRowCell(e, clearSelection, 0);
            } else if(cursorCell.nextInstructionSibling) {
                // If next element is an instruction, select it
                selectedCell = cursorCell.nextInstructionSibling;

            } else {
                selectedCell = cursorCell.row.createAddInstructionElement();
            }
        } else {
            // If no cursor is selected, use the first available instruction
            selectedCell = this.querySelector('asct-instruction');
        }

        if(!selectedCell) // If no instructions were found, create an 'add' instruction
            selectedCell = this.rowContainer.querySelector('asct-row').createAddInstructionElement();

        selectedCell
            .select(true)
            .setCursor();

        if(clearSelection)
            this.clearSelection(selectedCell);


        return selectedCell;
    }

    selectPreviousCell(e, clearSelection=true) {
        const cursorCell = this.getCursorElement();
        let selectedCell;

        if(cursorCell) {
            if(cursorCell.previousInstructionSibling) {
                // If previous element is an instruction, select it
                selectedCell = cursorCell.previousInstructionSibling;

            } else {
                // If next element is an add instruction, select the next row
                return this.selectPreviousRowCell(e, clearSelection, -1);
            }
        } else {
            // If no cursor is selected, use the first available instruction
            // selectedCell = this.querySelector('asct-instruction');
        }

        if(!selectedCell)
            selectedCell = this.rowContainer.querySelector('asct-row:last-child').createAddInstructionElement();

        selectedCell
            .select(true)
            .setCursor();

        if(clearSelection)
            this.clearSelection(selectedCell);

        return selectedCell;
    }


    selectNextRowCell(e, clearSelection=true, cellPosition=null) {
        const cursorCell = this.getCursorElement();
        const cursorRow = cursorCell.parentNode;
        if(cellPosition === null)
            cellPosition = [].indexOf.call(cursorCell.parentNode.children, cursorCell);

        if(!cursorRow.nextElementSibling) {
            this.currentRowSegmentID++;
            this.renderRows();
            this.focusOnContainer();
            return this.selectNextCell(e, true);
        }

        const nextRowElm = cursorRow.nextElementSibling;

        let selectedCell = nextRowElm.querySelector('asct-instruction');
        if(nextRowElm.children[cellPosition] && nextRowElm.children[cellPosition].matches('asct-instruction,asct-instruction-add')) {
            selectedCell = nextRowElm.children[cellPosition];
        }

        if(!selectedCell)
            selectedCell = nextRowElm.createAddInstructionElement();

        selectedCell
            .select(true)
            .setCursor();

        if(clearSelection)
            this.clearSelection(selectedCell);

        return selectedCell;
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
            this.renderRows();
            this.focusOnContainer();
            return this.selectPreviousCell(e, true);
        }

        let previousRowElm = cursorRow.previousElementSibling;
        // for(let i=cellPosition; i>=0; i--)
        //     if(nextRowElm.children[i] && nextRowElm.children[i].matches('asct-instruction,asct-instruction-add'))
        //         return this.selectCell(e, nextRowElm.children[i]);
        let selectedCell; // = previousRowElm.querySelector('asct-instruction:last-child');
        if(previousRowElm.children[cellPosition] && previousRowElm.children[cellPosition].matches('asct-instruction,asct-instruction-add')) {
            selectedCell = previousRowElm.children[cellPosition];
        }

        if(!selectedCell)
            selectedCell = previousRowElm.createAddInstructionElement();

        selectedCell
            .select(true)
            .setCursor();

        if(clearSelection)
            this.clearSelection(selectedCell);

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
    //    this.focusOnContainer(); // Prevents tab from working
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


    insertOrUpdateCommand(e, commandString=null) {
        let selectedIndicies = this.selectedIndicies;
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
            this.selectIndicies(e, insertIndex);
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
            this.selectIndicies(e, selectedIndicies);
            // this.selectIndicies(this.selectedIndicies[0]); // TODO: select all
        }
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
        const container = this.parentNode;
        // const container = this.tracker; // cursorCell.closest('.composer-tracker-container');
        if (container.scrollTop < this.offsetTop - container.offsetHeight)
            container.scrollTop = this.offsetTop;
        //
        if (container.scrollTop > this.offsetTop)
            container.scrollTop = this.offsetTop - container.offsetHeight;
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

    focus() {
        const buttonElm = this.querySelector('button');
        buttonElm.focus();
    }

    connectedCallback() {
        // setTimeout(e => this.render(), 1);
        // this.setAttribute('draggable', true);
        this.render();
    }


    render() {
        this.innerHTML =
            `<form action="#" class="form-row-segment" data-action="tracker:row-segment">
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





