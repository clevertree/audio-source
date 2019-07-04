class AudioSourceComposerGrid extends HTMLElement {
    constructor() {
        super();


        // this.cursorCellIndex = 0;
        this.scrollTimeout = null;
        this.minimumGridLengthTicks = null;
        // this.instructionElms = null;
    }
    get groupName()             { return this.getAttribute('group'); }
    set groupName(groupName)    {
        this.setAttribute('group', groupName);
        this.render();
    }
    get renderDuration()             { return parseInt(this.getAttribute('renderDuration')); }
    set renderDuration(renderDuration)    {
        this.setAttribute('renderDuration', renderDuration);
        this.render();
    }

    // get renderDuration() { return this.status.renderDuration; }
    get status() { return this.editor.status.grid; }
    get editorForms() { return this.editor.forms; }
    
    connectedCallback() {
        this.addEventListener('scroll', this.onInput);
        this.editor = this.getRootNode().host;
        if(!this.getAttribute('renderDuration'))
            this.renderDuration = this.editor.renderer.getSongTimeDivision();
        this.render();
    }

    // TODO: render delta rows only
    render() {
        console.time('grid: calculate render');
        const currentScrollPosition = this.scrollTop || 0; // Save scroll position
        this.innerHTML = '';
        const renderDuration = this.renderDuration;

        // const selectedIndicies = this.editor.status.selectedIndicies;
        let rowInstructions = [], lastRowIndex=0, songPositionInTicks=0, tickTotal=0; // , lastPause = 0;

        const renderRow = (deltaDuration, rowIndex) => {
            for(let subPause=0; subPause<deltaDuration; subPause+=renderDuration) {
                let subDurationInTicks = renderDuration;
                if(subPause + renderDuration > deltaDuration)
                    subDurationInTicks = deltaDuration - subPause;

                const rowElm = document.createElement('ascg-row');
                this.appendChild(rowElm);
                rowElm.position = songPositionInTicks;

                // editorHTML += this.getRowHTML(songPositionInTicks, subDurationInTicks, rowInstructions, lastRowIndex);

                rowInstructions = [];
                const nextBreakPositionInTicks = Math.ceil((songPositionInTicks / renderDuration) + 0.5) * renderDuration;
                songPositionInTicks += subDurationInTicks;
                if(songPositionInTicks > nextBreakPositionInTicks) {
                    // Quantize the row durations
                    subDurationInTicks = songPositionInTicks - nextBreakPositionInTicks;
                    songPositionInTicks = nextBreakPositionInTicks;
                }
                rowElm.duration = subDurationInTicks;
                rowElm.index = rowIndex;
                rowElm.render();
            }

        };


        this.editor.renderer.eachInstruction(this.groupName, (index, instruction, stats) => {
            if (instruction.deltaDuration !== 0) {
                renderRow(instruction.deltaDuration, index);
                lastRowIndex = index;
            }

            rowInstructions.push(instruction);
            tickTotal = stats.groupPositionInTicks;
        });

        if(!this.minimumGridLengthTicks) {
            const songData = this.editor.getSongData();
            const timeDivision = songData.timeDivision || 96 * 4;
            this.minimumGridLengthTicks = 16 * timeDivision;
        }

        let remainingDuration = this.minimumGridLengthTicks - tickTotal;
        if(remainingDuration <= 0)
            remainingDuration = renderDuration;
        renderRow(remainingDuration, lastRowIndex);

        console.timeEnd('grid: calculate render');
        // const currentScrollPosition = this.scrollTop || 0; // Save scroll position
        // if(this.innerHTML !== editorHTML) {
        // console.time('grid: render');
        // this.innerHTML = editorHTML;
        // console.timeEnd('grid: render');
        // }
        this.scrollTop = currentScrollPosition;             // Restore scroll position


        // const cellList = this.querySelectorAll('.instruction');
        // if(cursorCellIndex >= cellList.length)
        //     cursorCellIndex = cellList.length - 1;
        // cellList[cursorCellIndex].classList.add('cursor');
        this.update();
        this.renderVisibleRows();

        // this.instructionElms = this.querySelectorAll(`.instruction`);
    }


    // // Can't select pauses!
    // get instructionList() {
    //     const song = this.editor.getSongData();
    //     const groupName = this.groupName;
    //     if(!song.instructions[groupName])
    //         throw new Error("Group instructions not found: " + groupName);
    //     return song.instructions[groupName];
    // }
    get selectedCells() { return this.querySelectorAll('ascg-instruction.selected'); }
    get cursorCell() { return this.querySelector('ascg-instruction.cursor,ascg-instruction-add.cursor'); }
    get cursorRow() { return this.cursorCell.parentNode; }
    get cursorPosition() {
        return parseFloat(this.cursorRow.position);
    }
    get cursorInstruction() { return this.getInstruction(this.cursorCell.index); }
    // get cursorCellIndex() {
    //     const cellList = this.querySelectorAll('ascg-instruction');
    //     return this.cursorCell ? [].indexOf.call(cellList, this.cursorCell) : -1;
    // }
    get selectedIndicies() { return [].map.call(this.selectedCells, (elm => elm.index)); }

    // get selectedRows() { return this.querySelectorAll('.grid-row.selected'); }
    // get selectedPauseIndices() { return [].map.call(this.selectedRows, (elm => parseInt(elm.getAttribute('data-index')))); }

    // get nextCell() {
    //     const cursorElm = this.cursorCell;
    //     if(cursorElm.nextElementSibling && cursorElm.nextElementSibling.matches('ascg-instruction'))
    //         return cursorElm.nextElementSibling;
    //     return null;
    // }
    // get previousCell() {
    //     const cursorElm = this.cursorCell;
    //     if(cursorElm.previousElementSibling && cursorElm.previousElementSibling.matches('ascg-instruction'))
    //         return cursorElm.previousElementSibling;
    //     return null;
    // }

    // get nextCell() {
    //     const cellList = this.querySelectorAll('.instruction');
    //     return cellList[this.cursorCellIndex + 1];
    // }
    //
    // get previousCell() {
    //     const cellList = this.querySelectorAll('.instruction');
    //     let cursorCellIndex = this.cursorCellIndex; // this.cursorCell ? [].indexOf.call(cellList, this.cursorCell) : 0;
    //     if(cursorCellIndex === 0)
    //         cursorCellIndex = cellList.length - 1;
    //     console.log("previousCell", cellList[cursorCellIndex - 1]);
    //     return cellList[cursorCellIndex - 1];
    // }

    // get nextRowCell() {
    //     const cellList = this.querySelectorAll('.instruction');
    //     const cursorCellIndex = this.cursorCellIndex; // this.cursorCell ? [].indexOf.call(cellList, this.cursorCell) : 0;
    //     for(let i=cursorCellIndex;i<cellList.length;i++)
    //         if(cellList[i].parentNode !== cellList[cursorCellIndex].parentNode)
    //             return cellList[i];
    //     return null;
    // }
    //
    // get previousRowCell() {
    //     const cellList = this.querySelectorAll('.instruction');
    //     const cursorCellIndex = this.cursorCellIndex; // this.cursorCell ? [].indexOf.call(cellList, this.cursorCell) : 0;
    //     for(let i=cursorCellIndex;i>=0;i--)
    //         if(cellList[i].parentNode !== cellList[cursorCellIndex].parentNode)
    //             return cellList[i];
    //     return null;
    // }

//     focus() {
//         // if(this.renderElement !== document.activeElement) {
// //             console.log("Focus", document.activeElement);
// //             this.focus();
// //         }
//
//     }

    playSelectedInstructions() {
        this.editor.renderer.stopAllPlayback();
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

    onInput(e) {
        if (e.defaultPrevented)
            return;
        if(e.target instanceof Node && !this.contains(e.target))
            return;

        this.focus(); // TODO: bad idea?

        try {
            let selectedIndicies = this.selectedIndicies;
            // const instructionList = this.getInstructions();

            switch (e.type) {
                case 'midimessage':
//                     console.log("MIDI", e.data, e);
                    switch(e.data[0]) {
                        case 144:   // Note On
                            e.preventDefault();
                            let newMIDICommand = this.editor.renderer.getCommandFromMIDINote(e.data[1]);
                            let newMIDIVelocity = Math.round((e.data[2] / 128) * 100);
                            console.log("MIDI ", newMIDICommand, newMIDIVelocity);

                            if (this.cursorCell.matches('.new')) {
                                let newInstruction = this.editorForms.getInstructionFormValues(true);
                                newMIDICommand = this.replaceFrequencyAlias(newMIDICommand, newInstruction.instrument);
                                newInstruction.command = newMIDICommand;
                                newInstruction.velocity = newMIDIVelocity;

                                const insertPosition = this.cursorPosition;
                                const insertIndex = this.insertInstructionAtPosition(insertPosition, newInstruction);
                                // this.render();
                                this.editor.selectInstructions(insertIndex);
                                selectedIndicies = [insertIndex];
                                // cursorInstruction = instructionList[insertIndex];
                            } else {
                                for(let i=0; i<selectedIndicies.length; i++) {
                                    const selectedInstruction = this.getInstruction(selectedIndicies[i]);
                                    const replaceCommand = this.replaceFrequencyAlias(newMIDICommand, selectedInstruction.instrument);
                                    this.replaceInstructionCommand(selectedIndicies[i], replaceCommand);
                                    this.replaceInstructionVelocity(selectedIndicies[i], newMIDIVelocity);
                                }
                                // this.editor.selectInstructions(this.selectedIndicies[0]); // TODO: select all
                            }
                            this.renderCursorRow();
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

                    let keyEvent = e.key;
                    if (!e.ctrlKey && this.editor.keyboard.getKeyboardCommand(e.key))
                        keyEvent = 'PlayFrequency';
                    if (keyEvent === 'Enter' && e.altKey)
                        keyEvent = 'ContextMenu';

                    // let keydownCellElm = this.cursorCell;

                    switch (keyEvent) {
                        case 'Delete':
                            e.preventDefault();
                            for(let i=0; i<selectedIndicies.length; i++) {
                                this.editor.renderer.deleteInstructionAtIndex(this.groupName, selectedIndicies[i]);
                            }
                            this.render();
                            // song.render(true);
                            break;

                        case 'Escape':
                        case 'Backspace':
                            e.preventDefault();
                            this.navigatePop();
                            this.editor.selectInstructions(0);
                            // this.focus();
                            break;

                        case 'Enter':
                            e.preventDefault();
                            if (this.cursorCell.matches('.new')) {
                                let newInstruction = this.editorForms.getInstructionFormValues(true);
                                if(!newInstruction)
                                    return console.info("Insert canceled");
                                let insertIndex = this.insertInstructionAtPosition(this.cursorPosition, newInstruction);
                                // this.render();
                                this.editor.selectInstructions(insertIndex);
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
                            e.preventDefault();
                            // this.selectCell(e, this.cursorCell);
                            // if(e.ctrlKey) e.preventDefault();
                            if(this.editor.renderer.isPlaybackActive()) {
                                this.editor.renderer.stopAllPlayback();
                            } else {
                                this.editor.renderer.playInstructions(this.groupName);
                            }
                            break;

                        case 'PlayFrequency':
                            let newCommand = this.editor.keyboard.getKeyboardCommand(e.key);
                            if(newCommand === null)
                                break;

                            e.preventDefault();

                            if (this.cursorCell.matches('.new')) {
                                console.time("new");
                                let newInstruction = this.editorForms.getInstructionFormValues(true);
                                newCommand = this.replaceFrequencyAlias(newCommand, newInstruction.instrument);
                                newInstruction.command = newCommand;

                                const insertPosition = this.cursorPosition;
                                const insertIndex = this.insertInstructionAtPosition(insertPosition, newInstruction);
                                // this.render();
                                this.editor.selectInstructions(insertIndex);
                                selectedIndicies = [insertIndex];
                                console.timeEnd("new");
                                // cursorInstruction = instructionList[insertIndex];
                            } else {
                                for(let i=0; i<selectedIndicies.length; i++) {
                                    const selectedInstruction = this.getInstruction(selectedIndicies[i]);
                                    const replaceCommand = this.replaceFrequencyAlias(newCommand, selectedInstruction.instrument);
                                    this.replaceInstructionCommand(selectedIndicies[i], replaceCommand);
                                }
                                // this.editor.selectInstructions(this.selectedIndicies[0]); // TODO: select all
                            }

                            // this.render();
                            this.renderCursorRow();
                            this.playSelectedInstructions(e);

                            // song.gridSelectInstructions([selectedInstruction]);
                            // e.preventDefault();
                            break;

                    }
                    break;

                case 'mousedown':
                    this.editor.menu.closeMenu();

                    if (e.target.matches('ascg-instruction'))
                        return this.onCellInput(e);

                    if (e.target.matches('ascg-instruction > *'))
                        return this.onParamInput(e);

                    if (e.target.matches('ascg-row'))  // classList.contains('grid-row')) {
                        return this.onRowInput(e);
                    // e.preventDefault();


                    // e.target = this.querySelector('.grid-cell.selected') || this.querySelector('.instruction'); // Choose selected or default cell
                    break;

                case 'mouseup':
                    break;

                case 'longpress':
                    // if (e.target.classList.contains('grid-parameter')
                    //     || e.target.classList.contains('grid-cell')
                    //     || e.target.classList.contains('grid-data')
                    //     || e.target.classList.contains('grid-row')) {
                        e.preventDefault();
                        // console.log("Longpress", e);
                        this.editor.menu.openContextMenu(e);
                    // }
                    break;

                case 'contextmenu':
                    // if (e.target.classList.contains('grid-parameter')) {
                    //     console.info("TODO: add parameter song at top of context menu: ", e.target); // huh?
                    // }
                    if(!e.altKey) {
                        e.preventDefault();
                        this.editor.menu.openContextMenu(e);
                    }

                    break;

                case 'scroll':
                    this.renderVisibleRows();
                    break;

                default:
                    throw new Error("Unhandled type: " + e.type);

            }
        } catch (err) {
            this.editor.onError(err);
        }

    }

    renderVisibleRows() {
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(e => {
        this.querySelectorAll('ascg-row')
            .forEach(row => row.render());
        }, 50);
    }

    createNewInstructionCell(rowElement) {
        this.querySelectorAll('ascg-instruction-add')
            .forEach((elm) => elm.parentNode.removeChild(elm));
        const newInstructionElm = document.createElement('ascg-instruction-add');
        newInstructionElm.position = rowElement.position; // setAttribute('p', rowElement.position);
        newInstructionElm.innerHTML = `+`;
        const deltaElm = rowElement.querySelector('ascg-delta');
        rowElement.insertBefore(newInstructionElm, deltaElm);
        return newInstructionElm;
    }

    onRowInput(e) {
        e.preventDefault();
        let selectedRow = e.target;
        selectedRow.select();
    }

    onCellInput(e) {
        e.preventDefault();
        let selectedCell = e.target;
        selectedCell.select();
    }

    onParamInput(e) {
        e.preventDefault();
        let selectedCell = e.target;
        selectedCell.instruction.select();
    }

    onSongEvent(e) {
        // console.log("onSongEvent", e);
        const detail = e.detail || {stats:{}};
        const instructionElm = detail.instruction ? this.findInstruction(detail.instruction) : null;
        const groupElm = detail.groupInstruction ? this.findInstruction(detail.groupInstruction) : null;
        // var groupPlayActive = groupElm ? parseInt(groupElm.getAttribute('data-play-active')||0) : 0;
        switch(e.type) {
            case 'note:start':
                if(instructionElm) {
                    instructionElm.classList.add('playing');
                    instructionElm.parentNode.classList.add('playing');
                    this.scrollToCursor(instructionElm);
//                     console.log("SCROLL", instructionElm.parentNode.offsetTop, this.scrollTop);
//                     if(this.scrollTop - 50 < instructionElm.parentNode.offsetTop - this.offsetHeight)
//                         this.scrollTop = 50 + instructionElm.parentNode.offsetTop - this.offsetHeight;
                    // console.log("show", instructionElm);
                }
                if(groupElm) {
                    groupElm.classList.add('playing');
                    groupElm.parentNode.classList.add('playing');
                    // groupElm.setAttribute('data-play-active', groupPlayActive+1);
                }
                break;
            case 'note:end':
                if(instructionElm) {
                    instructionElm.classList.remove('playing');
                    instructionElm.parentNode.classList.remove('playing');
                    // console.log("hide", instructionElm);
                }
                if(groupElm) {
                    // if(groupPlayActive <= 1) {
                    groupElm.classList.remove('playing');
                    groupElm.parentNode.classList.remove('playing');
                    // }
                    // groupElm.setAttribute('data-play-active', groupPlayActive-1);
                }
                break;

            // case 'song:start':
            //     this.classList.add('playing');
            //     break;
            // case 'song:end':
            // case 'song:pause':
            //     this.classList.remove('playing');
            //     break;
        }
    }
    selectNextCell(e) {
        const cursorCell = this.cursorCell;
        if(cursorCell.nextElementSibling && cursorCell.nextElementSibling.matches('ascg-instruction'))
            return this.selectCell(e, cursorCell.nextElementSibling);

        // If no previous row cell, create new instruction cell
        if(cursorCell.nodeName.toLowerCase() !== 'ascg-instruction-new') {
            const currentRowElm = this.cursorCell.parentNode;
            return this.selectCell(e, this.createNewInstructionCell(currentRowElm));
        }

        const cursorRow = cursorCell.parentNode;
        const nextRowElm = cursorRow.nextElementSibling;
        this.selectCell(e, this.createNewInstructionCell(nextRowElm));
    }

    selectNextRowCell(e, cellPosition=null, increaseGridSize=true) {
        const cursorCell = this.cursorCell;
        const cursorRow = cursorCell.parentNode;
        if(cellPosition === null)
            cellPosition = [].indexOf.call(cursorCell.parentNode.children, cursorCell);
        if(!cursorRow.nextElementSibling) {
            if(!increaseGridSize)
                throw new Error("New row was not created");
            return this.increaseGridSize(e);
            // return this.selectNextRowCell(e, false);
        }

        const nextRowElm = cursorRow.nextElementSibling;
        for(let i=cellPosition; i>=0; i--)
            if(nextRowElm.children[i] && nextRowElm.children[i].matches('ascg-instruction'))
                return this.selectCell(e, nextRowElm.children[i]);

        let nextCell = nextRowElm.querySelector('.instruction');
        if(nextCell) {
            return this.selectCell(e, nextCell);
        }


        this.selectCell(e, this.createNewInstructionCell(nextRowElm));
    }
    selectPreviousCell(e) {
        const cursorCell = this.cursorCell;
        if(cursorCell.previousElementSibling && cursorCell.previousElementSibling.matches('ascg-instruction'))
            return this.selectCell(e, cursorCell.previousElementSibling);

        this.selectPreviousRowCell(e);
    }


    selectPreviousRowCell(e) {
        const cursorCell = this.cursorCell;
        const cursorRow = cursorCell.parentNode;
        const cellPosition = [].indexOf.call(cursorRow.children, cursorCell);

        let previousRowElm = cursorRow.previousElementSibling;
        if(!previousRowElm)
            previousRowElm = cursorRow.parentNode.lastElementChild; // throw new Error("Previous row not available");

        if(previousRowElm.children[cellPosition] && previousRowElm.children[cellPosition].matches('ascg-instruction')) {
            return this.selectCell(e, previousRowElm.children[cellPosition]);
        }

        // If parallel column cell is available, select it

        this.selectCell(e, this.createNewInstructionCell(previousRowElm));
    }


    selectCell(e, cursorCell, clearSelection=true, toggle=false) {
        console.log("Select ", cursorCell);
        console.time('selectCell');
        this.querySelectorAll('ascg-instruction.cursor,ascg-instruction.selected')
            .forEach((elm) => elm.classList.remove('cursor', 'selected'));
        cursorCell.classList.add('cursor');
        if(cursorCell.nodeName.toLowerCase() === 'ascg-instruction')
            cursorCell.classList.add('selected');

        this.editor.update(); // selectInstructions(this.selectedIndicies);
        // this.focus();

        this.scrollToCursor(cursorCell);
        console.timeEnd('selectCell');
        // console.log(cursorCell);
    }

    findInstruction(instruction) {
        let instructionGroup = this.editor.renderer.findInstructionGroup(instruction);
        if(instructionGroup !== this.groupName)
            return null;
        let index = this.editor.renderer.getInstructionIndex(instruction, instructionGroup);
        return this.findInstructionElement(index);
    }

    navigate(groupName, parentInstruction) {
        console.log("Navigate: ", groupName);
        const existingGrid = this.status.grids.find(obj => obj.groupName === groupName);
        if(existingGrid)
            this.status.grids.unshift(existingGrid);
        else
            this.status.grids.unshift(
                Object.assign({}, AudioSourceComposerElement.DEFAULT_GRID_STATUS, {
                    groupName: groupName,
                    parentInstruction: parentInstruction,
                })
            );
        this.render();
    }


    navigatePop() {
        console.log("Navigate Back: ", this.status.grids[0].groupName);
        if(this.status.grids.length > 0)
            this.status.grids.shift();
        this.render();
    }


    increaseGridSize(e, selectNewRow=true) {
        // TODO: sloppy
        this.editor.renderer.eachInstruction(this.groupName, (index, instruction, stats) => {
            if (this.minimumGridLengthTicks < stats.groupPositionInTicks)
                this.minimumGridLengthTicks = stats.groupPositionInTicks;
        });

        // const defaultDuration = parseFloat(this.editorForms.fieldRenderDuration.value);
        this.minimumGridLengthTicks += this.renderDuration;
        this.render();
        if(selectNewRow) {
            const lastRowElm = this.querySelector('.composer-grid > div:last-child');
            this.selectCell(e, this.createNewInstructionCell(lastRowElm));
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
    //     return this.editor.selectInstructions(selectedIndicies);
    // }


    scrollToCursor(cursorCell) {
        const container = this; // cursorCell.closest('.composer-grid-container');
        if(container.scrollTop < cursorCell.parentNode.offsetTop - container.offsetHeight)
            container.scrollTop = cursorCell.parentNode.offsetTop;

        if(container.scrollTop > cursorCell.parentNode.offsetTop)
            container.scrollTop = cursorCell.parentNode.offsetTop - container.offsetHeight;

        // if(!this.cursorCell)
        //     return;
        // const currentCellParent = this.cursorCell.parentNode;
        // console.log("TODO: ", currentCellParent.offsetTop, this.scrollTop, this.offsetHeight);
        // if(currentCellParent.offsetTop < this.scrollTop)
        //     this.scrollTop = currentCellParent.offsetTop;
        // if(currentCellParent.offsetTop > this.scrollTop + this.offsetHeight)
        //     this.scrollTop = currentCellParent.offsetTop - this.offsetHeight + this.cursorCell.offsetHeight;
    }

    findInstructionElement(instructionIndex) {
        // const instructions = this.querySelectorAll(`.instruction`);
        // return this.instructionElms[instructionIndex];
        return this.querySelector(`ascg-instruction[i='${instructionIndex}']`);
    }

    getInstructionHTML(index, instruction) {
        return `<div class="instruction" data-index="${index}">
                    <div class="command">${instruction.command}</div>
                    ${instruction.instrument !== null ? `<div class="instrument">${this.editor.values.format(instruction.instrument, 'instrument')}</div>` : ''}
                    ${instruction.velocity !== null ? `<div class="velocity">${this.editor.values.format(instruction.velocity, 'velocity')}</div>` : ''}
                    ${instruction.duration !== null ? `<div class="duration">${this.editor.values.format(instruction.duration, 'duration')}</div>` : ''}
                </div>`;
    }


    getRowHTML(songPositionInTicks, subDurationInTicks, instructionList, startingIndex) {
        const rowHTML = [];
        let currentIndex = startingIndex;
        for(let i=0; i<instructionList.length; i++)
            rowHTML.push(this.getInstructionHTML(currentIndex++, instructionList[i]));

        return `<div data-position="${songPositionInTicks}">
                   ${rowHTML.join('')}
                   <div class="delta">${this.editor.values.format(subDurationInTicks, 'duration')}</div>
                </div>`;
    }

    renderCursorRow() {
        const songPositionInTicks = parseInt(this.cursorRow.getAttribute('data-position'));
        const instructionList = [];
        let startingIndex = null;
        let lastSongPositionInTicks = 0, lastSubDurationInTicks=0;

        this.editor.renderer.eachInstruction(this.groupName, (index, instruction, stats) => {
            if(lastSongPositionInTicks !== stats.groupPositionInTicks) {
                lastSubDurationInTicks = stats.groupPositionInTicks - lastSongPositionInTicks;
                lastSongPositionInTicks = stats.groupPositionInTicks;
            }
            if (stats.groupPositionInTicks === songPositionInTicks) {
                if(startingIndex === null)
                    startingIndex = index;
                instructionList.push(instruction);
            } else if (stats.groupPositionInTicks > songPositionInTicks) {
                return false;
            }
        });

        this.cursorRow.outerHTML = this.getRowHTML(songPositionInTicks, lastSubDurationInTicks, instructionList, startingIndex);
        this.update();
    }

    update() {
        let cellList = this.querySelectorAll('.instruction'); //,.grid-row
        if(cellList.length === 0)
            return;

        const selectedIndicies = this.editor.selectedIndicies;
        for (let i = 0; i < cellList.length; i++) {
            const cell = cellList[i];
            const index = parseInt(cell.getAttribute('data-index'));
            // cell.classList.toggle('cursor', selectedIndicies[0] === index);
            cell.classList.remove('selected');
            if (selectedIndicies.indexOf(index) !== -1) {
                cell.classList.add('selected');
            }
        }

        // Check for missing cursor
        if(selectedIndicies.length > 0) {
            // let missingCell = this.querySelector('.instruction.selected');
            // if (!missingCell)
            //     this.querySelector('.instruction').classList.add('selected');
            let missingCell = this.querySelector('.instruction.cursor');
            if (!missingCell)
                this.querySelector('.instruction.selected').classList.add('cursor');
        }
    }
}
customElements.define('asc-grid', AudioSourceComposerGrid);





class AudioSourceComposerGridRow extends HTMLElement {
    constructor() {
        super();
    }
    get grid() { return this.parentNode; }
    // get editor() { return this.grid.editor; }

    set position(songPositionInTicks)   { this.setAttribute('p', songPositionInTicks); }
    get position()                      { return parseInt(this.getAttribute('p'))}

    set duration(durationInTicks)       { this.setAttribute('d', durationInTicks); }
    get duration()                      { return parseInt(this.getAttribute('d'))}

    set index(rowIndex)                 { this.setAttribute('i', rowIndex); }
    get index()                         { return parseInt(this.getAttribute('i'))}

    get visible() {
        const parentBottom = this.parentNode.scrollTop + this.parentNode.offsetHeight;
        if(this.offsetTop - parentBottom > 20)
            return false;
        if(this.offsetTop < this.parentNode.scrollTop - 20)
            return false;
        return true;
    }

    select() {
        this.grid.querySelectorAll('ascg-row.selected')
            .forEach((elm) => elm.classList.remove('selected'));
        this.classList.add('selected');

        // Remove existing new instruction button
        this.grid.querySelectorAll('ascg-instruction-add')
            .forEach((elm) => elm.parentNode.removeChild(elm));

        // Unselect all instrument cells
        this.grid.querySelectorAll('ascg-instruction.selected,ascg-instruction-add.selected')
            .forEach((elm) => elm.classList.remove('selected'));
        this.grid.querySelectorAll('ascg-instruction.cursor,ascg-instruction-add.cursor')
            .forEach((elm) => elm.classList.remove('cursor'));

        const newInstructionElm = document.createElement('ascg-instruction-add');
        newInstructionElm.classList.add('cursor');
        newInstructionElm.position = this.position; // setAttribute('p', rowElement.position);
        newInstructionElm.innerHTML = `+`;

        const deltaElm = this.querySelector('ascg-delta');
        this.insertBefore(newInstructionElm, deltaElm);
        // TODO: this.editor.selectInstructions([]);
        // const newInstructionElm = this.createNewInstructionCell(selectedRow);
        // this.selectCell(e, newInstructionElm);

    }

    connectedCallback() {
        // setTimeout(e => this.render(), 1);
    }


    render() {
        // setTimeout(e => {
            if(this.visible) {
                if(this.childNodes.length === 0) {
                    const startIndex = this.index;
                    const instructionList = this.grid.getInstructionRange(startIndex);
                    for (let i = 0; i < instructionList.length; i++) {
                        const instructionElm = document.createElement('ascg-instruction');
                        instructionElm.index = startIndex + i;
                        this.appendChild(instructionElm);
                        instructionElm.render(instructionList[i]);
                    }
                    const deltaElm = document.createElement('ascg-delta');
                    // deltaElm.innerHTML = this.editor.values.format(this.duration, 'duration')
                    this.appendChild(deltaElm);
                }
            } else {
                if(this.childNodes.length > 0) {
                    this.innerHTML = '';
                    // console.info("Clear ", this);
                }
            }
        // }, 1);
    }

}

customElements.define('ascg-row', AudioSourceComposerGridRow);


class AudioSourceComposerGridInstruction extends HTMLElement {
    constructor() {
        super();
    }
    get row() { return this.parentNode; }
    get grid() { return this.parentNode.parentNode; }
    get editor() { return this.grid.editor; }

    set index(instructionIndex) {
        this.setAttribute('i', instructionIndex);
        // this.render();
    }
    get index() { return parseInt(this.getAttribute('i'))}

    getInstruction() { return this.row.grid.getInstruction(this.index); }

    connectedCallback() {
        // this.render();
    }

    select() {
        // Select row
        this.row.select();

        // Remove other cursor elements
        this.grid.querySelectorAll('ascg-instruction.cursor,ascg-instruction-add.cursor')
            .forEach((elm) => elm.classList.remove('cursor'));

        this.classList.add('selected');
        this.classList.add('cursor');

        // TODO: this.editor.selectInstructions([]);

    }
    render(instruction=null) {
        instruction = instruction || this.getInstruction();

        let paramElm;
        this.appendChild(paramElm = document.createElement('ascgi-command'));
        paramElm.render(instruction);
        this.appendChild(paramElm = document.createElement('ascgi-instrument'));
        paramElm.render(instruction);
        this.appendChild(paramElm = document.createElement('ascgi-velocity'));
        paramElm.render(instruction);
        this.appendChild(paramElm = document.createElement('ascgi-duration'));
        paramElm.render(instruction);
        // this.innerHTML = JSON.stringify(instruction); // .editor.values.format(this.duration, 'duration');
    }

}

customElements.define('ascg-instruction', AudioSourceComposerGridInstruction);



class AudioSourceComposerGridParameter extends HTMLElement {
    constructor() {
        super();
    }
    get instruction() { return this.parentNode; }
    get grid() { return this.parentNode.parentNode.parentNode; }
    get editor() { return this.grid.editor; }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = this.editor.values.format(this.row.duration, 'duration');
    }
}

class AudioSourceComposerParamCommand extends AudioSourceComposerGridParameter {
    render(instruction=null) {
        instruction = instruction || this.instruction.getInstruction();
        this.innerHTML = this.editor.values.format(instruction.command, 'command');
    }
}
customElements.define('ascgi-command', AudioSourceComposerParamCommand);

class AudioSourceComposerParamInstrument extends AudioSourceComposerGridParameter {
    render(instruction=null) {
        instruction = instruction || this.instruction.getInstruction();
        this.innerHTML = this.editor.values.format(instruction.instrument, 'instrument');
    }
}
customElements.define('ascgi-instrument', AudioSourceComposerParamInstrument);

class AudioSourceComposerParamVelocity extends AudioSourceComposerGridParameter {
    render(instruction=null) {
        instruction = instruction || this.instruction.getInstruction();
        this.innerHTML = this.editor.values.format(instruction.velocity, 'velocity');
    }
}
customElements.define('ascgi-velocity', AudioSourceComposerParamVelocity);

class AudioSourceComposerGridDuration extends AudioSourceComposerGridParameter {
    render(instruction=null) {
        instruction = instruction || this.instruction.getInstruction();
        this.innerHTML = this.editor.values.format(instruction.duration, 'duration');
    }
}
customElements.define('ascgi-duration', AudioSourceComposerGridDuration);





class AudioSourceComposerGridDelta extends HTMLElement {
    constructor() {
        super();
    }
    get editor() { return this.grid.editor; }
    get grid() { return this.parentNode.parentNode; }
    get row() { return this.parentNode; }

    // set duration(durationInTicks) { this.setAttribute('d', durationInTicks)}
    // get duration() { return parseInt(this.parentNode.getAttribute('d'))}

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = this.editor.values.format(this.row.duration, 'duration');
    }
}

customElements.define('ascg-delta', AudioSourceComposerGridDelta);
