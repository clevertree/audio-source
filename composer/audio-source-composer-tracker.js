{
    class AudioSourceComposerTracker extends HTMLElement {
        constructor(groupName = 'root') {
            super();
            this.editorElm = null;
            this.eventHandlers = [];
            // this.segmentLength = 16;
            this.currentRowSegmentID = 0;
            // this.selectedIndicies = []

            this.mousePosition = {};
            if (groupName)
                this.setAttribute('group', groupName);
            if (!this.hasAttribute('tabindex'))
                this.setAttribute('tabindex', '0');
        }


        get groupName() {
            return this.getAttribute('group');
        }

        set groupName(groupName) {
            if (!this.editorElm.song.hasGroup(groupName))
                throw new Error("Group not found in song: " + groupName);
            this.setAttribute('group', groupName);
            this.currentRowSegmentID = 0;
            this.render();
        }


        get isConnected() {
            return this.editorElm.containerElm.contains(this);
        }

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

            this.editorElm = this.getRootNode().host;
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

        attachEventHandler(eventNames, method, context, options = null) {
            if (!Array.isArray(eventNames))
                eventNames = [eventNames];
            for (let i = 0; i < eventNames.length; i++) {
                const eventName = eventNames[i];
                context = context || this;
                context.addEventListener(eventName, method, options);
                this.eventHandlers.push([eventName, method, context]);
            }
        }


        // clearSelection(excludeElms=[]) {
        //     this.editorElm.fieldTrackerSelection.value = '';
        //     // this.selectedIndicies = [];
        //
        //     if(!Array.isArray(excludeElms))
        //         excludeElms = [excludeElms];
        //
        //     // Update rows
        //     // this.querySelectorAll('asct-row.selected')
        //     //     .forEach((rowElm) => excludeElms.indexOf(rowElm) !== -1 ? null : rowElm.select(false));
        //
        //     // Remove 'add' instructions
        //
        //     // Update cells
        //     this.querySelectorAll('asct-instruction.selected')
        //         .forEach((instructionElm) => excludeElms.indexOf(instructionElm) !== -1 ? null : instructionElm.select(false));
        // }


        // get cursorCellIndex() {
        playSelectedInstructions() {
            if (this.editorElm.song.isPlaying)
                this.editorElm.song.stopPlayback();
            const selectedIndicies = this.editorElm.getSelectedIndicies();
            for (let i = 0; i < selectedIndicies.length; i++) {
                this.editorElm.song.playInstructionAtIndex(this.groupName, selectedIndicies[i]);
            }
        }

        // getInstructions(indicies=null) {
        //     return this.editor.song.getInstructions(this.groupName, indicies);
        // }

        // getInstructionRange(start, end=null) {
        //     return this.editor.song.getInstructionRange(this.groupName, start, end);
        // }

        getInstruction(index) {
            return this.editorElm.song.getInstruction(this.groupName, index);
        }

        getInstructionFormValues(command = null) {
            if (!command)
                command = this.editorElm.fieldInstructionCommand.value;
            let newInstruction = new SongInstruction();

            if (this.editorElm.fieldInstructionInstrument.value || this.editorElm.fieldInstructionInstrument.value === 0)
                newInstruction.instrument = parseInt(this.editorElm.fieldInstructionInstrument.value);
            if (this.editorElm.fieldInstructionDuration.value) // TODO: refactor DURATIONS
                newInstruction.duration = parseFloat(this.editorElm.fieldInstructionDuration.value);
            const velocityValue = parseInt(this.editorElm.fieldInstructionVelocity.value);
            if (velocityValue || velocityValue === 0)
                newInstruction.velocity = velocityValue;

            command = this.replaceFrequencyAlias(command, newInstruction.instrument);
            newInstruction.command = command;

            return newInstruction;
        }


        render() {
            //this.renderForms();
            this.renderRows(); // Rows depend on forms, and get rendered last
        }


        // navigate(groupPositionInTicks, groupName=null) {
        //     if(groupName && groupName !== this.groupName)
        //         this.groupName = groupName;
        //     this.navigateGroup(groupName);
        // }


        navigateGroup(groupPositionInTicks) {
            let rowElm = this.findRowElement(groupPositionInTicks);
            if (rowElm)
                return rowElm;
            const newRowSegmentID = this.getSegmentIDFromPositionInTicks(groupPositionInTicks);
            if (newRowSegmentID !== this.currentRowSegmentID) {
                this.navigateSegment(newRowSegmentID);
                let rowElm = this.findRowElement(groupPositionInTicks);
                if (rowElm)
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
            // const timeDivision = this.editorElm.song.timeDivision;
            const segmentLengthInTicks = this.editorElm.fieldTrackerSegmentLength.value;
            const segmentID = Math.floor(positionInTicks / segmentLengthInTicks);
            return segmentID;
        }

        navigateSegment(newRowSegmentID) {
            if (!Number.isInteger(newRowSegmentID))
                throw new Error("Invalid segment ID");
            this.currentRowSegmentID = newRowSegmentID;
            this.renderRows();
        }

        // renderRowSegments() {
        // }

        renderRows(selectedIndicies = null) {
            if (selectedIndicies === null)
                selectedIndicies = this.editorElm.getSelectedIndicies();

            console.time('tracker.renderRows()');

            const timeDivision = this.editorElm.song.timeDivision;

            this.innerHTML = '';

            // Instruction Iterator
            let instructionIterator = this.editorElm.song.getIterator(this.groupName);

            const quantizationInTicks = parseInt(this.editorElm.fieldTrackerRowLength.value) || timeDivision;
            const segmentLengthInTicks = parseInt(this.editorElm.fieldTrackerSegmentLength.value) || (timeDivision * 16);
//         console.log('segmentLengthInTicks', segmentLengthInTicks, this.editorElm.fieldTrackerSegmentLength.value);
            const filterByInstrumentID = Number.isInteger(this.editorElm.fieldTrackerFilterInstrument.value) ? this.editorElm.fieldTrackerFilterInstrument.value : null;
            const conditionalCallback = filterByInstrumentID === null ? null : (conditionalInstruction) => {
                return conditionalInstruction.instrument === filterByInstrumentID
            };

            let lastRowSegmentID = 0;
            let rowInstructionList = null, lastRowPositionInTicks = 0;
            while (rowInstructionList = instructionIterator.nextInstructionQuantizedRow(quantizationInTicks, conditionalCallback)) {
                if (rowInstructionList.length === 0 && instructionIterator.groupPositionInTicks % quantizationInTicks !== 0) {
                    continue;
                }
                lastRowSegmentID = Math.floor(instructionIterator.groupPositionInTicks / segmentLengthInTicks);

                if (this.currentRowSegmentID === lastRowSegmentID) {
                    const newRowElm = new AudioSourceComposerTrackerRow(instructionIterator.groupPositionInTicks); // document.createElement('asct-row');
                    this.appendChild(newRowElm);
                    newRowElm.renderInstructions(rowInstructionList);
                    // TODO: current beat/meausure
                }
                lastRowPositionInTicks = instructionIterator.groupPositionInTicks;
            }

            if (lastRowPositionInTicks < segmentLengthInTicks) {
                lastRowPositionInTicks = Math.ceil(lastRowPositionInTicks / quantizationInTicks) * quantizationInTicks;
                while (lastRowPositionInTicks < segmentLengthInTicks) {
                    const newRowElm = new AudioSourceComposerTrackerRow(lastRowPositionInTicks); // document.createElement('asct-row');
                    this.appendChild(newRowElm);
                    lastRowPositionInTicks += quantizationInTicks;
                }
            }


            // Render Group
            // const panelTrackerGroups = this.editorElm.panelTrackerGroups;
            // if(panelTrackerGroups)
            //     panelTrackerGroups.render();

            // Render Segments
            const panelTrackerRowSegments = this.editorElm.panelTrackerRowSegments;
            if (panelTrackerRowSegments)
                panelTrackerRowSegments.render();


            this.selectSegmentIndicies(selectedIndicies);
            console.timeEnd('tracker.renderRows()');
        }


        onInput(e) {
            if (e.defaultPrevented)
                return;

            switch (e.type) {
                case 'mouseup':
                    if (this.isSelectionRectActive()) {
                        this.commitSelectionRect();
                    }
                    break;
            }

            if (e.target instanceof Node && !this.contains(e.target))
                return;

            // console.log(e.type);

            let selectedIndicies = this.editorElm.getSelectedIndicies();
            // const instructionList = this.getInstructions();

            switch (e.type) {
                case 'midimessage':
                    // console.log("MIDI", e.data, e);
                    switch (e.data[0]) {
                        case 144:   // Note On
                            // TODO: refactor
                            e.preventDefault();
                            const midiImport = new MIDIImport();
                            let newMIDICommand = midiImport.getCommandFromMIDINote(e.data[1]);
                            let newMIDIVelocity = Math.round((e.data[2] / 128) * 100);
                            console.log("MIDI ", newMIDICommand, newMIDIVelocity);

                            this.insertOrUpdateCommand(e, newMIDICommand);
                            this.playSelectedInstructions(e);
                            // this.focus();
                            break;
                        case 128:   // Note Off
                            // TODO: turn off playing note, optionally set duration of note
                            break;
                    }
                    break;
                case 'keydown':
                    // All key actions close all menus
                    this.editorElm.closeAllMenus();

                    let keyEvent = e.key;
                    if (!e.ctrlKey && this.editorElm.keyboard.getKeyboardCommand(
                        e.key,
                        this.editorElm.fieldTrackerOctave.value
                    ))
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
                                this.editorElm.song.deleteInstructionAtIndex(this.groupName, selectedIndicies[i]);
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
                            if (this.contains(e.target)) {

                                e.preventDefault();
                                this.insertOrUpdateCommand(e);

                                let cursorInstruction = this.cursorInstruction;
                                if (cursorInstruction.isGroupCommand()) {
                                    const groupName = cursorInstruction.command.substr(1);
                                    this.editorElm.selectGroup(groupName);
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
                            if (this.editorElm.song.isPlaybackActive()) {
                                this.editorElm.song.stopPlayback();
                            } else {
                                this.editorElm.song.play();
                            }
                            break;

                        case 'PlayFrequency':
                            let newCommand = this.editorElm.keyboard.getKeyboardCommand(e.key, this.editorElm.fieldTrackerOctave.value);
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
                    this.editorElm.closeAllMenus();

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
                    if (e.which === 1) {
                        if (this.mousePosition.isDown) {
                            this.mousePosition.isDragging = true;
                            this.mousePosition.lastDrag = e;
                        }
                    }
                    if (this.mousePosition.isDown && this.mousePosition.lastDrag) {
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
                    if (lastMouseUp && lastMouseUp.t.getTime() + this.editorElm.doubleClickTimeout > new Date().getTime()) {
                        e.preventDefault();
                        const currentTarget = e.path[0];
                        const originalTarget = lastMouseUp.path[0];
                        if (originalTarget === currentTarget
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
                    if (e.target.matches('asc-tracker')) {
//                     console.log(e.target, e.path);
                        if (this.isSelectionRectActive()) {
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
                    if (this.contains(e.target)) {
                        this.editorElm.menuContext.openContextMenu(e);
                    }
                    // }
                    break;

                case 'contextmenu':
                    // if (e.target.classList.contains('tracker-parameter')) {
                    //     console.info("TODO: add parameter song at top of context menu: ", e.target); // huh?
                    // }
                    if (!e.altKey) {
                        e.preventDefault();
                        this.editorElm.menuContext.openContextMenu(e, this.cursorCell);
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
            if (!eMove) eMove = this.mousePosition.lastDrag || this.mousePosition.lastDrag;
            var a = eDown.clientX - eMove.clientX;
            var b = eDown.clientY - eMove.clientY;
            var c = Math.sqrt(a * a + b * b);
            if (c < 30)
                return console.warn("Skipping selection rect");
            // console.log("Dragging", c);// eDown.path[0], eMove.path[0]);

            let rectElm = this.querySelector('div.selection-rect');
            if (!rectElm) {
                rectElm = document.createElement('div');
                rectElm.classList.add('selection-rect');
                this.appendChild(rectElm);
            }

            let x, y, w, h;
            if (eDown.clientX < eMove.clientX) {
                x = eDown.clientX;
                w = eMove.clientX - eDown.clientX;
            } else {
                x = eMove.clientX;
                w = eDown.clientX - eMove.clientX;
            }
            if (eDown.clientY < eMove.clientY) {
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

            return {x, y, w, h};
        }

        isSelectionRectActive() {
            let rectElm = this.querySelector('div.selection-rect');
            return !!rectElm;
        }

        commitSelectionRect(eDown = null, eUp = null) {
            if (!eDown) eDown = this.mousePosition.lastDown;

            let rectElm = this.querySelector('div.selection-rect');
            if (!rectElm)
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
                if (selected) {
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
            switch (e.type) {

                case 'song:seek':
                    this.setPlaybackPositionInTicks(e.detail.positionInTicks);
                    break;

                case 'group:seek':
//                 console.log(e.type, e.detail);
                    if (e.detail.groupName === this.groupName)
                        this.setPlaybackPositionInTicks(e.detail.positionInTicks);

                    break;

                case 'group:play':
                    break;

                case 'note:start':
                    if (e.detail.groupName === this.groupName) {
                        let instructionElm = this.findInstructionElement(e.detail.instruction.index);
                        if (instructionElm) {
                            instructionElm.classList.add('playing');
                        }
                    }
                    break;
                case 'note:end':
                    if (e.detail.groupName === this.groupName) {
                        let instructionElm = this.findInstructionElement(e.detail.instruction.index);
                        if (instructionElm) {
                            instructionElm.classList.remove('playing');
                        }
                    }
                    break;
            }
        }

        // TODO: refactor?
        get selectedCells() {
            return this.querySelectorAll('asct-instruction.selected');
        }

        get cursorCell() {
            return this.querySelector('asct-instruction.cursor,asct-instruction-add.cursor');
        }

        // get cursorRow() { return this.cursorCell.parentNode; }
        get cursorPosition() {
            return ((cell) => (cell ? cell.parentNode.position : null))(this.cursorCell);
        }

        get cursorInstruction() {
            return this.getInstruction(this.cursorCell.index);
        }

        getCursorCell() {
            return this.querySelector('.cursor');
        }

        getCursorIndex() {
            const cursorCell = this.querySelector('.cursor');
            return cursorCell ? cursorCell.index : null;
        }

        clearSelection() {
            this.editorElm.clearSelectedIndicies();
            this.updateSelection();
        }

        updateSelection() {
            const selectedIndicies = this.editorElm.getSelectedIndicies();

            this.querySelectorAll('asct-instruction-add')
                .forEach((instructionAddElm) => instructionAddElm.parentNode.removeChild(instructionAddElm));

            // Update cells
            this.querySelectorAll('asct-instruction')
                .forEach((instructionElm) => {
                    if (selectedIndicies.indexOf(instructionElm.index) !== -1) {
                        instructionElm.select(true);
                    } else {
                        instructionElm.select(false)
                    }
                });
        }

        selectIndex(e, selectedIndex, clearSelection = false) {
            const cell = this.findInstructionElement(selectedIndex);
            if (cell) {
                this.selectCell(e, cell, clearSelection);
                return true;
            } else {
                return false;
            }
        }

        selectNextCell(e) {
            let cursorCell = this.querySelector('.cursor') || this.querySelector('asct-instruction');

            if (cursorCell) {
                if (cursorCell instanceof AudioSourceComposerTrackerInstructionAdd) {
                    // If next element is an add instruction, select the next row
                    return this.selectNextRowCell(e, 0);
                } else if (cursorCell.nextInstructionSibling) {
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

            if (cursorCell) {
                if (cursorCell.previousInstructionSibling) {
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


        selectNextRowCell(e, cellPosition = null) {
            let cursorCell = this.querySelector('.cursor') || this.querySelector('asct-instruction');
            const cursorRow = cursorCell.parentNode;
            if (cellPosition === null)
                cellPosition = [].indexOf.call(cursorCell.parentNode.children, cursorCell);

            if (!cursorRow.nextElementSibling) {
                this.currentRowSegmentID++;
                this.renderRows();
                this.focus();
                return this.selectNextCell(e);
            }

            const nextRowElm = cursorRow.nextElementSibling;

            let selectedCell = nextRowElm.querySelector('asct-instruction');
            if (nextRowElm.children[cellPosition] && nextRowElm.children[cellPosition].matches('asct-instruction')) {
                selectedCell = nextRowElm.children[cellPosition];
            }


            if (selectedCell) this.selectCell(e, selectedCell);
            else this.selectRow(e, cursorRow.nextElementSibling);

            return selectedCell;
        }


        selectPreviousRowCell(e, cellPosition = null) {
            let cursorCell = this.querySelector('.cursor') || this.querySelector('asct-instruction:last-child');
            const cursorRow = cursorCell.parentNode;
            if (cellPosition === null)
                cellPosition = [].indexOf.call(cursorCell.parentNode.children, cursorCell);
            if (!cursorRow.previousElementSibling) {
                if (this.currentRowSegmentID === 0)
                    throw new Error("TODO: reached beginning of song");
                this.currentRowSegmentID--;
                this.renderRows();
                this.focus();
                return this.selectPreviousCell(e);
            }

            let previousRowElm = cursorRow.previousElementSibling;

            let selectedCell; // = previousRowElm.querySelector('asct-instruction:last-child');
            if (previousRowElm.children[cellPosition] && previousRowElm.children[cellPosition].matches('asct-instruction,asct-instruction-add')) {
                selectedCell = previousRowElm.children[cellPosition];
            }

            if (!selectedCell) this.selectRow(e, previousRowElm);
            else this.selectCell(e, selectedCell);
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


        selectSegmentIndicies(indicies, clearSelection = false) {
            // const currentSelectedIndicies = this.editorElm.getSelectedIndicies();
            // if(indicies.length === currentSelectedIndicies.length && indicies.sort().every(function(value, index) { return value === currentSelectedIndicies.sort()[index]}))
            //     return;
            if (!Array.isArray(indicies))
                indicies = [indicies];
            if (clearSelection)
                this.clearSelection();
            for (let i = 0; i < indicies.length; i++) {
                const index = indicies[i];
                const cell = this.findInstructionElement(index);
                if (cell) {
                    cell.select(true, false);
                    if (i === 0)
                        cell.setCursor();
                } else {
//                 console.warn("Instruction not found: " + index);
                }
            }
            //    this.focus(); // Prevents tab from working
        }

        selectRow(e, selectedRow) {

            if (!e.ctrlKey) {
                this.clearSelection();
            }

            // selectedRow.select();
            // selectedRow.clearAllCursors();
            selectedRow.createAddInstructionElement()
                .setCursor();
            this.editorElm.panelTracker.render();
            this.focus();
            selectedRow.parentNode.scrollTo();
            this.editorElm.song.setPlaybackPositionInTicks(selectedRow.position);
            selectedRow.scrollTo();

            return selectedRow;
        }

        selectCell(e, selectedCell, clearSelection = null) {
//         console.time("selectCell");
            let toggleValue = true;
            if (clearSelection === null) {
                clearSelection = !(e && e.ctrlKey);
            }
            if (e && e.shiftKey) {
                toggleValue = !selectedCell.selected;
            }
            if (clearSelection) {
                this.clearSelection();
            }

            this.editorElm.closeAllMenus();
            selectedCell.select(toggleValue);
            selectedCell.setCursor();
            this.editorElm.panelTracker.render();
            this.focus();
            this.editorElm.song.setPlaybackPositionInTicks(selectedCell.parentNode.position);
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
            this.selectCell(e, selectedCell);
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


        // increaseTrackerSize(e, selectNewRow=true) {
        //     // TODO: sloppy
        //     // this.editor.song.eachInstruction(this.groupName, (index, instruction, stats) => {
        //     //     if (this.minimumTrackerLengthTicks < stats.groupPositionInTicks)
        //     //         this.minimumTrackerLengthTicks = stats.groupPositionInTicks;
        //     // });
        //
        //     // const defaultDuration = parseFloat(this.editorForms.fieldTrackerRowLength.value);
        //     // this.minimumTrackerLengthTicks += this.rowLengthInTicks;
        //     this.renderMinimumRows+=1;
        //     this.render();
        //     if(selectNewRow) {
        //         const lastRowElm = this.querySelector('asc-tracker > asct-row:last-child');
        //         lastRowElm.setCursor();
        //         // this.createNewInstructionCell(lastRowElm).select();
        //     }
        // }
        // insertInstructionAtIndex(instruction, insertIndex) {
        //     return this.editorElm.song.insertInstructionAtIndex(this.groupName, insertIndex, instruction);
        // }

        // insertInstructionAtPosition(insertTimePosition, instruction) {
        //     return this.editorElm.song.insertInstructionAtPosition(this.groupName, insertTimePosition, instruction);
        // }
        // deleteInstructionAtIndex(deleteIndex) {
        //     return this.editorElm.song.deleteInstructionAtIndex(this.groupName, deleteIndex, 1);
        // }
        // replaceInstructionCommand(replaceIndex, newCommand) {
        //     return this.editorElm.song.replaceInstructionCommand(this.groupName, replaceIndex, newCommand);
        // }

        // replaceInstructionVelocity(replaceIndex, newVelocity) {
        //     return this.editorElm.song.replaceInstructionVelocity(this.groupName, replaceIndex, newVelocity);
        // }


        insertOrUpdateCommand(e, commandString = null) {
            let selectedIndicies = this.editorElm.getSelectedIndicies();
            if (this.cursorCell.matches('asct-instruction-add')) {
                let newInstruction = this.getInstructionFormValues(commandString);
                if (!newInstruction) {
                    this.editorElm.fieldInstructionCommand.focus();
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
                // this.selectIndicies(this.editorElm.getSelectedIndicies()[0]); // TODO: select all
            }
        }

        // replaceInstructionParams(replaceIndex, replaceParams) {
        //     return this.editor.song.replaceInstructionParams(this.groupName, replaceIndex, replaceParams);
        // }

        replaceFrequencyAlias(noteFrequency, instrumentID) {
            const instrument = this.editorElm.song.getInstrument(instrumentID, false);
            if (!instrument || !instrument.getFrequencyAliases)
                return noteFrequency;
            const aliases = instrument.getFrequencyAliases(noteFrequency);
            if (typeof aliases[noteFrequency] === "undefined")
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
        constructor(positionInTicks) {
            super();
            this.setAttribute('p', positionInTicks)
        }

        get trackerElm() {
            return this.closest('asc-tracker');
        }

        // get editor() { return this.tracker.editor; }
        get selected() {
            return this.classList.contains('selected');
        }

        // set position(songPositionInTicks)   { this.setAttribute('p', songPositionInTicks); }
        get position() {
            return parseInt(this.getAttribute('p'))
        }

        // set duration(durationInTicks)       { this.setAttribute('d', durationInTicks); }
        // get duration()                      { return parseInt(this.getAttribute('d'))}
        get duration() {
            return this.nextElementSibling ? this.nextElementSibling.position - this.position : 'N/A';
        }

        set index(rowIndex) {
            this.setAttribute('i', rowIndex);
        }

        get index() {
            return parseInt(this.getAttribute('i'))
        }

        get visible() {
            const parentBottom = this.parentNode.scrollTop + this.parentNode.offsetHeight;
            const offsetBottom = this.offsetTop + this.offsetHeight;
            if (this.offsetTop - parentBottom > VISIBLE_BUFFER)
                return false;
            if (offsetBottom < this.parentNode.scrollTop - VISIBLE_BUFFER)
                return false;
            return true;
        }

        connectedCallback() {
            // setTimeout(e => this.render(), 1);
            // this.setAttribute('draggable', true);
            if (this.previousElementSibling && this.previousElementSibling instanceof AudioSourceComposerTrackerRow) {
                const rowDurationInTicks = this.position - this.previousElementSibling.position;
                this.previousElementSibling.renderDelta(rowDurationInTicks);
            }
        }

        createAddInstructionElement() {
            let existingInstructionAddElement = this.querySelector('asct-instruction-add');
            if (!existingInstructionAddElement) {
                // Remove existing new instruction button
                this.parentNode.querySelectorAll('asct-instruction-add')
                    .forEach((elm) => elm.parentNode.removeChild(elm));

                const newInstructionElm = document.createElement('asct-instruction-add');
                existingInstructionAddElement = newInstructionElm;
                // newInstructionElm.index = this.index; // setAttribute('p', rowElement.position);
                newInstructionElm.innerHTML = `+`;
            }
            let deltaElm = this.querySelector('asct-delta');
            deltaElm ? this.insertBefore(existingInstructionAddElement, deltaElm) : this.appendChild(existingInstructionAddElement);

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


        select(selectedValue = true) {
            if (selectedValue) {
                if (this.selected) {
                    console.warn("Already selected ", this);
                    return;
                }
                this.classList.add('selected');
            } else {
                if (!this.selected) {
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


        scrollTo() {
            const container = this.parentNode;
            // const container = this.tracker; // cursorCell.closest('.composer-tracker-container');
            if (container.scrollTop < this.offsetTop - container.offsetHeight)
                container.scrollTop = this.offsetTop;
            //
            if (container.scrollTop > this.offsetTop)
                container.scrollTop = this.offsetTop - container.offsetHeight;
        }

        renderDelta(rowDurationInTicks) {
            let deltaElm = this.querySelector('asct-delta');
            if (!deltaElm) {
                deltaElm = document.createElement('asct-delta');
                this.appendChild(deltaElm);
            }
            deltaElm.render(rowDurationInTicks);
            return this;
        }

        renderInstructions(rowInstructionList = []) {
            const instructionElms = this.querySelectorAll('asct-instruction');
            let i = 0;
            for (; i < instructionElms.length; i++) {
                const instruction = rowInstructionList[i];
                const instructionElm = instructionElms[i];
                if (i >= rowInstructionList.length) {
                    instructionElm.parentNode.removeChild(instructionElm);
                } else {
                    instructionElm.index = instruction.index;
                    instructionElm.render(rowInstructionList[i]);

                }
            }

            let deltaElm = this.querySelector('asct-delta');
            for (; i < rowInstructionList.length; i++) {
                const instruction = rowInstructionList[i];
                const instructionElm = document.createElement('asct-instruction');
                instructionElm.index = instruction.index;
                deltaElm ? this.insertBefore(instructionElm, deltaElm) : this.appendChild(instructionElm);
                instructionElm.render(rowInstructionList[i]);
            }
            return this;
        }

    }

    customElements.define('asct-row', AudioSourceComposerTrackerRow);

    class AudioSourceComposerTrackerInstruction extends HTMLElement {
        constructor() {
            super();
        }

        get row() {
            return this.parentNode;
        }

        get trackerElm() {
            if (!this.parentNode)
                throw new Error("Invalid tracker");
            return this.parentNode.trackerElm;
        }

        get editorElm() {
            return this.trackerElm.editorElm;
        }

        set index(instructionIndex) {
            this.setAttribute('i', instructionIndex);
            // this.render();
        }

        get index() {
            return parseInt(this.getAttribute('i'))
        }

        get selected() {
            return this.classList.contains('selected');
        }

        get nextInstructionSibling() {
            if (this.nextElementSibling && this.nextElementSibling.matches('asct-instruction'))
                return this.nextElementSibling;
            return null;
        }

        get previousInstructionSibling() {
            if (this.previousElementSibling && this.previousElementSibling.matches('asct-instruction'))
                return this.previousElementSibling;
            return null;
        }


        getInstruction() {
            return this.row.trackerElm.getInstruction(this.index);
        }

        play() {
            this.editorElm.song.playInstructionAtIndex(
                this.trackerElm.groupName,
                this.index,
                this.editorElm.song.getAudioContext().currentTime,
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

        scrollTo() {
            return this.row.scrollTo();
        }

        clearAllCursors() {
            return this.row.clearAllCursors();
        }

        setCursor() {
            this.clearAllCursors();
            this.classList.add('cursor');
            return this;
        }

        select(selectedValue = true) {

            if (selectedValue) {
                this.classList.add('selected');
                this.editorElm.addSelectedIndex(this.index);
            } else {
                this.classList.remove('selected', 'cursor');
                this.editorElm.removeSelectedIndex(this.index);
            }


            this.render();
            return this;
        }


        render(instruction = null) {
            // this.innerHTML = '';
            instruction = instruction || this.getInstruction();

            let commandElm = this.querySelector('ascti-command');
            if (!commandElm) this.appendChild(commandElm = document.createElement('ascti-command'));
            commandElm.render(instruction);

            if (this.classList.contains('selected')) {
                let instrumentElm = this.querySelector('ascti-instrument');
                if (!instrumentElm) this.appendChild(instrumentElm = document.createElement('ascti-instrument'));
                instrumentElm.render(instruction);

                let velocityElm = this.querySelector('ascti-velocity');
                if (!velocityElm) this.appendChild(velocityElm = document.createElement('ascti-velocity'));
                velocityElm.render(instruction);

                let durationElm = this.querySelector('ascti-duration');
                if (!durationElm) this.appendChild(durationElm = document.createElement('ascti-duration'));
                durationElm.render(instruction);

            } else {
                let instrumentElm = this.querySelector('ascti-instrument');
                if (instrumentElm) instrumentElm.parentNode.removeChild(instrumentElm);

                let velocityElm = this.querySelector('ascti-velocity');
                if (velocityElm) velocityElm.parentNode.removeChild(velocityElm);

                let durationElm = this.querySelector('ascti-duration');
                if (durationElm) durationElm.parentNode.removeChild(durationElm);
            }

            return this;
        }

    }

    customElements.define('asct-instruction', AudioSourceComposerTrackerInstruction);


    class AudioSourceComposerTrackerInstructionAdd extends AudioSourceComposerTrackerInstruction {


        render(instruction = null) {
            if (instruction)
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

        get instruction() {
            return this.parentNode;
        }

        get trackerElm() {
            return this.parentNode.parentNode.trackerElm;
        }

        get editorElm() {
            return this.trackerElm.editorElm;
        }

        connectedCallback() {
            //this.render();
            // this.setAttribute('draggable', true);
        }

        render() {
            this.innerHTML = this.editorElm.values.format(this.row.duration, 'duration');
        }
    }

    class AudioSourceComposerParamCommand extends AudioSourceComposerTrackerParameter {
        render(instruction = null) {
            instruction = instruction || this.instruction.getInstruction();
            this.innerHTML = this.editorElm.values.format(instruction.command, 'command');
        }
    }

    customElements.define('ascti-command', AudioSourceComposerParamCommand);

    class AudioSourceComposerParamInstrument extends AudioSourceComposerTrackerParameter {
        render(instruction = null) {
            instruction = instruction || this.instruction.getInstruction();
            this.innerHTML = this.editorElm.values.format(instruction.instrument, 'instrument');
        }
    }

    customElements.define('ascti-instrument', AudioSourceComposerParamInstrument);

    class AudioSourceComposerParamVelocity extends AudioSourceComposerTrackerParameter {
        render(instruction = null) {
            instruction = instruction || this.instruction.getInstruction();
            this.innerHTML = this.editorElm.values.format(instruction.velocity, 'velocity');
        }
    }

    customElements.define('ascti-velocity', AudioSourceComposerParamVelocity);

    class AudioSourceComposerTrackerDuration extends AudioSourceComposerTrackerParameter {
        render(instruction = null) {
            instruction = instruction || this.instruction.getInstruction();
            this.innerHTML = this.editorElm.values.format(instruction.duration, 'duration');
        }
    }

    customElements.define('ascti-duration', AudioSourceComposerTrackerDuration);


    class AudioSourceComposerTrackerDelta extends HTMLElement {
        constructor() {
            super();
        }

        get editorElm() {
            return this.trackerElm.editorElm;
        }

        get trackerElm() {
            return this.parentNode.trackerElm;
        }

        get row() {
            return this.parentNode;
        }

        // set duration(durationInTicks) { this.setAttribute('d', durationInTicks)}
        // get duration() { return parseInt(this.parentNode.getAttribute('d'))}

        connectedCallback() {
            // setTimeout(e => this.render(), 1); // TODO: inefficient
        }

        render(duration) {
            duration = duration || (this.row ? this.row.duration : -1);
            this.innerHTML = this.editorElm.values.format(duration, 'duration');
        }
    }

    customElements.define('asct-delta', AudioSourceComposerTrackerDelta);

    /** Register This Module **/
    const _module = typeof module !== "undefined" ? module : findThisScript();
    _module.exports = {
        AudioSourceComposerTracker,
    };


    /** Module Loader Methods **/
    function findThisScript() {
        const SCRIPT_PATH = 'composer/audio-source-composer-tracker.js';
        return findScript(SCRIPT_PATH) || (() => { throw new Error("This script not found: " + SCRIPT_PATH); });
    }

    function findScript(scriptURL) {
        let scriptElm = null;
        document.head.querySelectorAll(`script[src$="${scriptURL}"]`).forEach(s => scriptElm = s);
        if(scriptElm) {
            scriptElm.relativePath = scriptURL;
            scriptElm.basePath = scriptElm.src.replace(document.location.origin, '').replace(scriptURL, '');
        }
        return scriptElm;
    }

}

