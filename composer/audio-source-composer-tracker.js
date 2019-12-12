(async function() {

    /** Register Script Exports **/
    function getThisScriptPath() { return 'composer/audio-source-composer-tracker.js'; }
    const exportThisScript = function(module) {
        module.exports = {AudioSourceComposerTracker};
    };

    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();

    const {SongInstruction}     = await requireAsync('common/audio-source-song.js');
    const {AudioSourceLibrary}  = await requireAsync('common/audio-source-library.js');
    const {AudioSourceValues}   = await requireAsync('common/audio-source-values.js');
    const {
        ASUIComponent,
        ASUIDiv,
        ASUIMenu,
        ASUIGrid,
        ASUIGridRow,
        ASUIInputButton,
        ASUIFileInput,
        ASUIInputRange,
        ASUIInputText,
        ASUIcon,
    } = await requireAsync('common/audio-source-ui.js');

    // const audioSourceValues = new AudioSourceValues;

    class AudioSourceComposerTracker extends ASUIComponent {
        constructor(editorElm, group = 'root') {
            super({
                group,
                currentRowSegmentID: 0,
                rowSegmentCount: 10,
                quantizationInTicks: null,
                segmentLengthInTicks: null,
                filterByInstrumentID: null
            }, {});

            this.props.tabindex = 0;
            this.editorElm = editorElm;
            /** @deprecated **/
            this.mousePosition = {};
        }

        get song()      { return this.editorElm.song; }
        get groupName() { return this.state.group; }

        async setGroupName(groupName) {
            if(this.state.group === groupName)
                return null;
            if (!this.editorElm.song.hasGroup(groupName))
                throw new Error("Group not found in song: " + groupName);
            // this.setAttribute('group', groupName);
            await this.setState({group: groupName, currentRowSegmentID: 0});
        }



        connectedCallback() {
            this.addEventHandler([
                    'scroll',
                    'keydown',
                    'mousedown', 'mouseup', 'mousemove', 'mouseout',
                    'touchstart', 'touchend', 'touchmove',
                    'dragstart', 'drag', 'dragend',
                    'contextmenu'
                ],
                e => this.onInput(e));

            super.connectedCallback();
        }

        playSelectedInstructions() {
            if (this.editorElm.song.isPlaying)
                this.editorElm.song.stopPlayback();
            const selectedIndicies = this.editorElm.getSelectedIndicies();
            for (let i = 0; i < selectedIndicies.length; i++) {
                this.editorElm.song.playInstructionAtIndex(this.groupName, selectedIndicies[i]);
            }
        }


        instructionFind(index) {
            return this.editorElm.song.instructionFind(this.groupName, index);
        }

        instructionFindFormValues(command = null) {
            if (!command)
                command = this.editorElm.refs.fieldInstructionCommand.value;
            let newInstruction = new SongInstruction();

            if (this.editorElm.refs.fieldInstructionInstrument.value || this.editorElm.refs.fieldInstructionInstrument.value === 0)
                newInstruction.instrument = parseInt(this.editorElm.refs.fieldInstructionInstrument.value);
            if (this.editorElm.refs.fieldInstructionDuration.value) // TODO: refactor DURATIONS
                newInstruction.duration = parseFloat(this.editorElm.refs.fieldInstructionDuration.value);
            const velocityValue = parseInt(this.editorElm.refs.fieldInstructionVelocity.value);
            if (velocityValue || velocityValue === 0)
                newInstruction.velocity = velocityValue;

            command = this.replaceFrequencyAlias(command, newInstruction.instrument);
            newInstruction.command = command;

            return newInstruction;
        }


        navigateGroup(groupPositionInTicks) {
            let rowElm = this.findRowElement(groupPositionInTicks);
            if (rowElm)
                return rowElm;
            const newRowSegmentID = this.getSegmentIDFromPositionInTicks(groupPositionInTicks);
            if (newRowSegmentID !== this.state.currentRowSegmentID) {
                this.editorElm.trackerChangeSegment(newRowSegmentID);
                let rowElm = this.findRowElement(groupPositionInTicks);
                if (rowElm)
                    return rowElm;
            }
            throw new Error("Shouldn't happen: Row not found for position: " + groupPositionInTicks);
        }



        getSegmentIDFromPositionInTicks(positionInTicks) {
            const timeDivision = this.editorElm.song.timeDivision;
            const segmentLengthInTicks = this.state.segmentLengthInTicks || (timeDivision * 16);
            const segmentID = Math.floor(positionInTicks / segmentLengthInTicks);
            return segmentID;
        }


        render() {
            console.time('tracker.renderRows()');
            // TODO: const selectedIndicies = this.editorElm.getSelectedIndicies();
            const rowContent = [];
            this.refs.rows = rowContent;
            const timeDivision = this.editorElm.song.timeDivision;
            const quantizationInTicks = this.state.quantizationInTicks || timeDivision; // parseInt(this.editorElm.refs.fieldTrackerRowLength.value) || timeDivision; // TODO: use status instead of refs
            const segmentLengthInTicks = this.state.segmentLengthInTicks || (timeDivision * 16);
            const maxLengthInTicks = (this.state.currentRowSegmentID + 1) * segmentLengthInTicks;


            // Instruction Iterator
            let instructionIterator = this.editorElm.song.instructionGetIterator(this.groupName);


            //         console.log('segmentLengthInTicks', segmentLengthInTicks, this.editorElm.refs.fieldTrackerSegmentLength.value);
            const filterByInstrumentID = Number.isInteger(this.state.filterByInstrumentID) ? this.state.filterByInstrumentID : null;
            const conditionalCallback = filterByInstrumentID === null ? null : (conditionalInstruction) => {
                return conditionalInstruction.instrument === filterByInstrumentID
            };

            const selectedIndicies = this.editorElm.getSelectedIndicies();
            const cursorIndex = (this.refs.cursorInstruction ? this.refs.cursorInstruction.index : (selectedIndicies.length > 0 ? selectedIndicies[0] : null));
            const cursorPosition = (this.refs.cursorRow ? this.refs.cursorRow.positionInTicks : null);
            // TODO: solve

            let lastRowSegmentID = 0;
            let rowInstructionList = null, lastRowPositionInTicks = 0;
            this.refs.selectedInstructions = [];
            this.refs.cursorRow = null;
            this.refs.cursorInstruction = null;
            while (rowInstructionList = instructionIterator.nextInstructionQuantizedRow(quantizationInTicks, maxLengthInTicks, conditionalCallback)) {
                // if (rowInstructionList.length === 0 && instructionIterator.groupPositionInTicks % quantizationInTicks !== 0) {
                //     continue;
                // }
                const rowInstructionElms = rowInstructionList.map(instruction => {
                    const selected = selectedIndicies.indexOf(instruction.index) !== -1;
                    const elm = new AudioSourceComposerTrackerInstruction(this.song, instruction, {selected});
                    if(selected) this.refs.selectedInstructions.push(elm);
                    return elm;
                });

                lastRowSegmentID = Math.floor(instructionIterator.groupPositionInTicks / segmentLengthInTicks);

                const deltaDuration = instructionIterator.groupPositionInTicks - lastRowPositionInTicks;
                if (this.state.currentRowSegmentID === lastRowSegmentID) {
                    const newRowElm = new AudioSourceComposerTrackerRow(
                        this.song,
                        rowInstructionElms,
                        instructionIterator.groupPositionInTicks,
                        instructionIterator.groupPlaybackTime,
                        deltaDuration); // document.createElement('asct-row');
                    // newRowElm.renderInstructions(rowInstructionList);
                    rowContent.push(newRowElm);
                }
                lastRowPositionInTicks = instructionIterator.groupPositionInTicks;
            }
            // console.log(lastRowSegmentID, lastRowPositionInTicks);
            // this.editorElm.rowSegmentCount = lastRowSegmentID;

            // // Render Segments
            // const panelTrackerRowSegments = this.editorElm.panelTrackerRowSegments;
            // if (panelTrackerRowSegments)
            //     panelTrackerRowSegments.render();


            // this.selectSegmentIndicies(selectedIndicies);
            console.timeEnd('tracker.renderRows()');

            return [
                this.refs.rowContainer = new ASUIDiv('tracker-header', () => [
                    new ASUIDiv('delta', "Delta"),
                    new ASUIDiv('instructions', "Instructions"),
                ], {class: 'asc-panel-title'}),
                this.refs.rowContainer = new ASUIDiv('tracker-row-container', () => [
                    rowContent
                ])
            ];

            // return rowContent;
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

            // if (e.target instanceof Node && !this.contains(e.target))
            //     return;

            // console.log(e.type);

            let selectedIndicies = this.editorElm.getSelectedIndicies();
            // const instructionList = this.instructionEach();

            switch (e.type) {
                case 'keydown':
                    // All key actions close all menus
                    this.editorElm.closeAllMenus();

                    let keyEvent = e.key;
                    if (!e.ctrlKey && this.editorElm.keyboard.getKeyboardCommand(
                        e.key,
                        this.editorElm.refs.fieldTrackerOctave.value
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
                                this.editorElm.song.instructionDeleteAtIndex(this.groupName, selectedIndicies[i]);
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
                            // this.focus();
                            break;

                        case 'ArrowLeft':
                            e.preventDefault();
                            this.selectPreviousCell(e);
                            this.playSelectedInstructions(e);
                            // this.focus();
                            break;

                        case 'ArrowDown':
                            e.preventDefault();
                            this.selectNextRowCell(e);
                            this.playSelectedInstructions(e);
                            // this.focus();
                            break;

                        case 'ArrowUp':
                            e.preventDefault();
                            this.selectPreviousRowCell(e);
                            this.playSelectedInstructions(e);
                            // this.focus();
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
                            let newCommand = this.editorElm.keyboard.getKeyboardCommand(e.key, this.editorElm.refs.fieldTrackerOctave.value);
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

                    if (e.target instanceof AudioSourceComposerTrackerInstruction)
                        return this.onCellInput(e);

                    if (e.target.parentNode instanceof AudioSourceComposerTrackerInstruction)
                        return this.onCellInput(e, e.target.parentNode);

                    if (e.target instanceof AudioSourceComposerTrackerInstructionAdd)
                        return this.onRowInput(e, e.target.parentNode);

                    if (e.target instanceof AudioSourceComposerTrackerDelta) // TODO: special command for clicking delta
                        return this.onRowInput(e, e.target.parentNode);


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
            this.clearRowPositions();
            const rowElm = this.findRowElement(groupPositionInTicks);
            if(rowElm)
                rowElm.setProps({position: true});
            else
                console.warn('row not found: ' + groupPositionInTicks);
            // console.warn('REFACTOR');
            // TODO: get current 'playing' and check position
            // let rowElm = this.navigateGroup(groupPositionInTicks);
            // this.querySelectorAll('asct-row.position')
            //     .forEach(rowElm => rowElm.classList.remove('position'));
            // rowElm.classList.add('position');

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
            return ((cell) => (cell ? cell.parentNode.positionInTicks : null))(this.cursorCell);
        }

        get cursorInstruction() {
            return this.instructionFind(this.cursorCell.index);
        }

        setCursorCell(instructionElm) {
            this.clearAllCursors();
            instructionElm.setCursor();
            const instruction = this.instructionFind(instructionElm.index);
            this.editorElm.refs.fieldInstructionCommand.setValue(instruction.command, instruction.command);
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

        updateInstructionFields() {

        }

        updateSelection() {
            const selectedIndicies = this.editorElm.getSelectedIndicies();
            let cursorInstructionElm=null;
            // Update cells
            this.querySelectorAll('asct-instruction')
                .forEach((instructionElm) => {
                    if (selectedIndicies.indexOf(instructionElm.index) !== -1) {
                        instructionElm.select(true);
                        if(!cursorInstructionElm) cursorInstructionElm = instructionElm;
                    } else {
                        instructionElm.select(false)
                    }
                });
            if(cursorInstructionElm) {
                this.setCursorCell(cursorInstructionElm);
            }
        }

        updateSongPositionValue(playbackPositionInSeconds) {
            this.querySelectorAll('asct-row').forEach(row => row.classList.remove('position'));
            let childElm;
            for(let i=0; i<this.children.length; i++) {
                if(this.children[i].positionInSeconds > playbackPositionInSeconds)
                    break;
                childElm = this.children[i];
            }

            if(childElm && Math.floor(childElm.positionInSeconds) === Math.floor(playbackPositionInSeconds)) {
                childElm.classList.add('position');
            }
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

        async selectNextCell(e) {
            for(let i=0; i<this.refs.rows.length; i++) {
                const row = this.refs.rows[i];
            }
            let cursorElm = this.querySelector('[cursor]') || this.querySelector('asct-row');
            if(cursorElm instanceof AudioSourceComposerTrackerRow) {

            } else {

            }

            if (cursorElm) {
                if (cursorElm instanceof AudioSourceComposerTrackerInstructionAdd) {
                    // If next element is an add instruction, select the next row
                    return await this.selectNextRowCell(e, 0);
                } else if (cursorElm.nextInstructionSibling) {
                    // If next element is an instruction, select it
                    return this.selectCell(e, cursorElm.nextInstructionSibling);

                } else {
                    return await this.selectNextRowCell(e);
                }
            } else {
                // If no cursor is selected, use the first available instruction
                return this.selectRow(e, this.querySelector('asct-row'));
            }
        }

        async selectPreviousCell(e) {
            let cursorCell = this.querySelector('.cursor') || this.querySelector('asct-instruction:last-child');

            if (cursorCell) {
                if (cursorCell.previousInstructionSibling) {
                    // If previous element is an instruction, select it
                    return this.selectCell(e, cursorCell.previousInstructionSibling);

                } else {
                    return await this.selectPreviousRowCell(e);
                }
            } else {
                // If no cursor is selected, use the first available instruction
                return this.selectRow(e, this.querySelector('asct-row:last-child'));
            }
        }


        async selectNextRowCell(e, cellPosition = null) {
            let cursorCell = this.querySelector('.cursor') || this.querySelector('asct-instruction');
            const cursorRow = cursorCell.parentNode;
            if (cellPosition === null)
                cellPosition = [].indexOf.call(cursorCell.parentNode.children, cursorCell);

            if (!cursorRow.nextElementSibling) {
                await this.setState({currentRowSegmentID: this.state.currentRowSegmentID+1});
                this.focus();
                return await this.selectNextCell(e);
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


        async selectPreviousRowCell(e, cellPosition = null) {
            let cursorCell = this.querySelector('.cursor') || this.querySelector('asct-instruction:last-child');
            const cursorRow = cursorCell.parentNode;
            if (cellPosition === null)
                cellPosition = [].indexOf.call(cursorCell.parentNode.children, cursorCell);
            if (!cursorRow.previousElementSibling) {
                if (this.currentRowSegmentID === 0)
                    throw new Error("TODO: reached beginning of song");
                await this.setState({currentRowSegmentID: this.state.currentRowSegmentID + 1})
                this.focus();
                return await this.selectPreviousCell(e);
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
                        this.setCursorCell(cell);
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
            this.clearAllCursors();

            selectedRow.setCursor();

            // this.editorElm.panelTracker.render(); // TODO: bad idea
            this.focus();
            // selectedRow.scrollIntoView();
            this.editorElm.song.setPlaybackPositionInTicks(selectedRow.positionInTicks);
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
            this.clearAllCursors();
            this.setCursorCell(selectedCell);
            toggleValue ? this.editorElm.addSelectedIndex(selectedCell.index) : this.editorElm.removeSelectedIndex(selectedCell.index);

            // this.editorElm.panelTracker.render(); // TODO: bad idea
            this.focus();
            this.editorElm.song.setPlaybackPositionInTicks(selectedCell.parentNode.positionInTicks);
            selectedCell.parentNode.scrollTo();

            // selectedCell.play();
            return selectedCell;

//         console.timeEnd("selectCell");
            // selectedCell.scrollTo();
        }


        clearAllCursors() {
            // Remove 'add instruction' elements
            this.querySelectorAll('asct-instruction-add')
                .forEach((instructionAddElm) => instructionAddElm.parentNode.removeChild(instructionAddElm));

            // Remove other cursor elements
            this.querySelectorAll('[cursor]')
                .forEach((elm) => elm.setProps({cursor: false}));
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
        // instructionInsertAtIndex(instruction, insertIndex) {
        //     return this.editorElm.song.instructionInsertAtIndex(this.groupName, insertIndex, instruction);
        // }

        // instructionInsertAtPosition(insertTimePosition, instruction) {
        //     return this.editorElm.song.instructionInsertAtPosition(this.groupName, insertTimePosition, instruction);
        // }
        // instructionDeleteAtIndex(deleteIndex) {
        //     return this.editorElm.song.instructionDeleteAtIndex(this.groupName, deleteIndex, 1);
        // }
        // instructionReplaceCommand(replaceIndex, newCommand) {
        //     return this.editorElm.song.instructionReplaceCommand(this.groupName, replaceIndex, newCommand);
        // }

        // instructionReplaceVelocity(replaceIndex, newVelocity) {
        //     return this.editorElm.song.instructionReplaceVelocity(this.groupName, replaceIndex, newVelocity);
        // }


        insertOrUpdateCommand(e, commandString = null) {
            let selectedIndicies = this.editorElm.getSelectedIndicies();
            if (this.cursorCell.matches('asct-instruction-add')) {
                let newInstruction = this.instructionFindFormValues(commandString);
                if (!newInstruction) {
                    this.editorElm.refs.fieldInstructionCommand.focus();
                    return console.info("Insert canceled");
                }

                const insertPosition = this.cursorPosition;
                const insertIndex = this.instructionInsertAtPosition(insertPosition, newInstruction);
                // this.cursorRow.render(true);
                this.renderRows();
                this.selectSegmentIndicies(insertIndex, true);
                // selectedIndicies = [insertIndex];
//                             console.timeEnd("new");
                // cursorInstruction = instructionList[insertIndex];
            } else {
                for (let i = 0; i < selectedIndicies.length; i++) {
                    const selectedInstruction = this.instructionFind(selectedIndicies[i]);
                    const replaceCommand = this.replaceFrequencyAlias(commandString, selectedInstruction.instrument);
                    this.instructionReplaceCommand(selectedIndicies[i], replaceCommand);
                }
                this.renderRows();
                this.selectSegmentIndicies(selectedIndicies);
                // this.selectIndicies(this.editorElm.getSelectedIndicies()[0]); // TODO: select all
            }
        }

        // instructionReplaceParams(replaceIndex, replaceParams) {
        //     return this.editor.song.instructionReplaceParams(this.groupName, replaceIndex, replaceParams);
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

        clearRowPositions() {
            this.querySelectorAll(`asct-row[position]`)
                .forEach(row => row.setProps({position: false}));
        }

        findRowElement(positionInTicks) {
            return this.querySelector(`asct-row[t='${positionInTicks}']`);
        }


        findInstructionElement(instructionIndex) {
            return this.querySelector(`asct-instruction[i='${instructionIndex}']`);
        }

    }

    customElements.define('asc-tracker', AudioSourceComposerTracker);


    // const VISIBLE_BUFFER = 100;

    class AudioSourceComposerTrackerRow extends ASUIComponent {
        constructor(song, instructionList, positionInTicks=null, positionInSeconds=null, duration=null) {
            super({
                instructionList,
                delta: new AudioSourceComposerTrackerDelta(song, duration),
                positionInSeconds,
                duration,
                // selected: false
            }, {t: positionInTicks, cursor: false});
        }


        get positionInTicks() { return this.props.t; }
        get positionInSeconds() { return this.state.positionInSeconds; }
        get duration() { return this.state.duration; }

        async setCursor() {
            await this.setState({cursor: true});
            return this;
        }


        render() {
            return [
                this.state.delta,
                this.state.instructionList,
                this.state.cursor ? new AudioSourceComposerTrackerInstructionAdd() : null
            ];
        }

    }

    customElements.define('asct-row', AudioSourceComposerTrackerRow);

    class AudioSourceComposerTrackerInstruction extends ASUIComponent {
        constructor(song, instruction, props={}) {
            super({}, Object.assign({
                i: instruction.index,
                selected: false,
                cursor: false
            }, props));
            this.state = this.getInstructionContent(song, instruction);
        }

        get index() { return this.props.i; }
        get selected() { return this.props.selected; }

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

        async update(song, instruction) {
        // TODO: partial update?
            await this.setState(this.getInstructionContent(song, instruction));
        }

        getInstructionContent(song, instruction) {
            return {
                command: new AudioSourceComposerParamCommand(instruction.command),
                params: [
                    new AudioSourceComposerParamInstrument(instruction.instrument),
                    new AudioSourceComposerParamVelocity(instruction.velocity),
                    new AudioSourceComposerParamDuration(song, instruction.duration),
                ]
            };
        }

        async select(selected = true) {
            if(selected !== this.props.selected) {
                this.setProps({selected});
                await this.renderOS();
            }
        }
        setCursor() {
            this.setProps({cursor: true});
            return this;
        }



        play() {
            this.editorElm.song.playInstructionAtIndex(
                this.trackerElm.groupName,
                this.index,
                this.editorElm.song.getAudioContext().currentTime,
                {
                    groupPositionInTicks: this.row.positionInTicks,
                    currentIndex: this.index
                });
            return this;
        }

        //
        // scrollTo() {
        //     return this.row.scrollTo();
        // }

        // clearAllCursors() {
        //     return this.row.clearAllCursors();
        // }

        render() {
            return [
                this.state.command,
                this.props.selected ? this.state.params : null
            ]
        }

    }

    customElements.define('asct-instruction', AudioSourceComposerTrackerInstruction);


    class AudioSourceComposerTrackerInstructionAdd extends ASUIComponent {

        setCursor(isCursor=true) {
            this.setProps({cursor: isCursor});
        }

        render() {
            return ['+']
        }

    }

    customElements.define('asct-instruction-add', AudioSourceComposerTrackerInstructionAdd);


    class AudioSourceComposerParamCommand extends ASUIComponent {
        constructor(command, props= {}) {
            super({
                command: new AudioSourceValues().formatCommand(command)
            }, props);
        }

        render() {
            return this.state.command;
        }

    }
    customElements.define('ascti-command', AudioSourceComposerParamCommand);


    class AudioSourceComposerParamInstrument extends ASUIComponent {
        constructor(instrumentID, props= {}) {
            super({
                instrumentID: new AudioSourceValues().formatInstrumentID(instrumentID)
            }, props);
        }

        render() {
            return this.state.instrumentID;
        }
    }
    customElements.define('ascti-instrument', AudioSourceComposerParamInstrument);

    class AudioSourceComposerParamVelocity extends ASUIComponent {
        constructor(velocity, props= {}) {
            super({
                velocity: new AudioSourceValues().formatVelocity(velocity)
            }, props);
        }

        render() {
            return this.state.velocity;
        }
    }

    customElements.define('ascti-velocity', AudioSourceComposerParamVelocity);

    class AudioSourceComposerParamDuration extends ASUIComponent {
        constructor(song, duration, props= {}) {
            super({
                duration:new AudioSourceValues(song).formatDuration(duration)
            }, props);
        }

        render() {
            return this.state.duration;
        }
    }

    customElements.define('ascti-duration', AudioSourceComposerParamDuration);


    class AudioSourceComposerTrackerDelta extends ASUIComponent {
        constructor(song, duration, props= {}) {
            super({
                duration: new AudioSourceValues(song).formatDuration(duration)
            }, props);
        }

        render() {
            return this.state.duration;
        }
    }

    customElements.define('asct-delta', AudioSourceComposerTrackerDelta);





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
        console.log('scriptElm', scriptElm, scriptElm.exports)
        return scriptElm.exports
            || (() => { throw new Error("Script module has no exports: " + relativeScriptPath); })()
    }


})();

