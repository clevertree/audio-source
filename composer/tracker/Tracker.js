import * as React from "react";
// import TrackerDelta from "./TrackerDelta";
import {
    TrackerInstructionAdd,
    TrackerInstruction,
    TrackerRow
} from "./";
import {Div, Form, Panel, MenuAction} from "../../components/";
import Instruction from "../../song/instruction/Instruction";

import "./assets/Tracker.css";

class Tracker extends React.Component {
    constructor(props) {
        super(props);

        if(!props.composer)
            throw new Error("Invalid composer");
        // this.state = this.props.composer.state;
    }

    getQuantizationInTicks() {
        return this.props.quantizationInTicks || this.props.composer.song.data.timeDivision
    }
    getSegmentLengthInTicks() {
        return this.props.segmentLengthInTicks || (this.getQuantizationInTicks() * 16);
    }
    getCurrentSegmentID() {
        return this.props.currentSegmentID || 0;
    }
    getCursorPositionInTicks() {
        return 0;
    }

    render() {
        return <Panel
                className="asc-tracker"
                title={this.getTrackName()}
                >
            {this.renderRowSegments()}
                <Div className="asc-tracker-container">
                    {this.renderRowContent()}
                </Div>
            </Panel>;
    }

    renderOptions() {
        return <>
            <Form className="tracker-row-length" title="Row &#120491;">
                <MenuAction
                    arrow={'▼'}
                    // className="tracker-row-length"
                    onAction={e => this.openMenuTrackerSetQuantization(e)}
                >1B</MenuAction>
            </Form>

            <Form className="tracker-segment-length" title="Seg &#120491;">
                <MenuAction
                    arrow={'▼'}
                    // className="tracker-segment-length"
                    onAction={e => this.openMenuTrackerSetSegmentLength(e)}
                    title="Select Tracker Segment Length"
                >16B</MenuAction>
            </Form>
        </>;
    }

    renderRowSegments() {
        const composer = this.props.composer;

        const segmentLengthInTicks = this.getSegmentLengthInTicks();
        let songLengthTicks = composer.state.songLengthTicks;
        let segmentCount = Math.ceil(songLengthTicks / segmentLengthInTicks) || 1;
        if (segmentCount > 256)
            segmentCount = 256;

        const buttons = [];

        buttons.push(<MenuAction
            arrow={'▼'}
            key="segment-quantization"
            onAction={e => this.openMenuTrackerSetQuantization(e)}
        >1B</MenuAction>);

        // let rowSegmentCount = Math.ceil(lastSegmentRowPositionInTicks / trackerSegmentLengthInTicks) + 1;
        const currentRowSegmentID = Math.floor(this.getCursorPositionInTicks() / segmentLengthInTicks);
        if (segmentCount < currentRowSegmentID + 1)
            segmentCount = currentRowSegmentID + 1;
        for (let segmentID = 0; segmentID <= segmentCount; segmentID++)
            buttons.push(<MenuAction
                key={segmentID}
                selected={segmentID === currentRowSegmentID}
                onAction={e => composer.trackerChangeSegment(this.props.trackName, segmentID)}
            >{segmentID}</MenuAction>);

        buttons.push(<MenuAction
            key="segment-add"
            onAction={e => this.groupAdd(e)}
        >+</MenuAction>);

        // buttons.push(<MenuAction
        //     arrow={'▼'}
        //     key="segment-length"
        //     onAction={e => this.openMenuTrackerSetSegmentLength(e)}
        //     title="Select Tracker Segment Length"
        // >16B</MenuAction>);

        return buttons;
    }

    renderRowContent() {
        console.time('tracker.renderRowContent()');

        const composer = this.props.composer;

        const quantizationInTicks = this.getQuantizationInTicks();
        const currentSegmentStartInTicks = this.getCurrentSegmentID() * this.getSegmentLengthInTicks();
        const currentSegmentEndInTicks = currentSegmentStartInTicks + this.getSegmentLengthInTicks();
        const maxLengthInTicks = this.getMaxLengthInTicks();

        // Instruction Iterator
        let instructionIterator = composer.song.instructionGetIterator(this.props.trackName);

        const trackerFilterByInstrumentID = composer.state.trackerFilterByInstrumentID;

        const selectedIndices = this.props.selectedIndices || [];
        const cursorIndex = this.props.cursorIndex || 0;


        // let     rowCount = 0;
        // const   rowTotal = this.state.rowTotal,
        //         rowOffset = this.state.rowOffset, // by row or ticks? ticks. rows are can be variable length
        const rowContent = [];

        let lastRowPositionInTicks = 0;

        let nextQuantizationBreakInTicks = 0;
        let rowInstructionElms = [];
        while (true) {
            const nextInstruction = instructionIterator.nextInstruction();
            if(!nextInstruction)
                break;

            // lastRowSegmentID = Math.floor(instructionIterator.positionTicks / trackerSegmentLengthInTicks);


            if(nextInstruction.deltaDurationInTicks > 0) {
                // Finish rendering last row
                let endPositionTicks = instructionIterator.positionTicks;

                // Move next quantized row up to current position
                while(nextQuantizationBreakInTicks <= lastRowPositionInTicks)
                    nextQuantizationBreakInTicks += quantizationInTicks;

                // Render extra quantized rows if necessary
                while(nextQuantizationBreakInTicks < endPositionTicks) {
                    addRow(nextQuantizationBreakInTicks);
                    nextQuantizationBreakInTicks += quantizationInTicks;
                }

                addRow(endPositionTicks);
            }

            if(trackerFilterByInstrumentID !== null && trackerFilterByInstrumentID !== nextInstruction.instrument)
                continue;

            // Render instruction
            const index = instructionIterator.currentIndex;
            const props = {
                instruction:nextInstruction,
                composer,
                index
            };
            if (selectedIndices.indexOf(index) !== -1) props.selected = true;
            if (index === cursorIndex) props.cursor = true;
            rowInstructionElms.push(<TrackerInstruction
                key={index}
                {...props}
                />);

        }
        // renderQuantizedRows(maxLengthInTicks);

        while(nextQuantizationBreakInTicks < maxLengthInTicks) {
            addRow(nextQuantizationBreakInTicks);
            nextQuantizationBreakInTicks += quantizationInTicks;
        }

        function addRow(toPositionTicks) {
            let rowDeltaDuration = toPositionTicks - lastRowPositionInTicks;
            lastRowPositionInTicks = toPositionTicks;
            if (toPositionTicks >= currentSegmentStartInTicks
                && toPositionTicks < currentSegmentEndInTicks
            ) {
                const newRowElm = <TrackerRow
                    key={rowContent.length}
                    deltaDuration={composer.values.formatDuration(rowDeltaDuration)}
                >{rowInstructionElms}</TrackerRow>;
                rowContent.push(newRowElm);
            }
            rowInstructionElms = [];
            // rowCount++;
        }


        console.timeEnd('tracker.renderRowContent()');
        return rowContent;
    }



    getComposer()               { return this.props.composer; }
    // getTimeDivision()           { return this.getComposer().song.data.timeDivision; }
    // // getQuantizationInTicks()    { return this.state.quantizationInTicks; }
    // getSegmentLengthInTicks()   { return this.getComposer().state.trackerSegmentLengthInTicks; }
    getMaxLengthInTicks()       {
        let songLength = this.getComposer().state.songLengthTicks;
        let segmentLengthInTicks = this.getSegmentLengthInTicks();

        if(songLength < segmentLengthInTicks)
            return segmentLengthInTicks;
        return Math.ceil(songLength / segmentLengthInTicks) * segmentLengthInTicks
    }
    getSong()                   { return this.props.composer.song; }
    getTrackName()              { return this.props.trackName; }

    // getSegmentIDFromPositionInTicks(positionInTicks) {
    //     // const composer = this.props.composer;
    //     const timeDivision = this.state.quantizationInTicks;
    //     const trackerSegmentLengthInTicks = this.state.trackerSegmentLengthInTicks || (timeDivision * 16);
    //     const segmentID = Math.floor(positionInTicks / trackerSegmentLengthInTicks);
    //     return segmentID;
    // }



    // instructionFind(index) {
    //     return this.getSong().instructionFind(this.gettrackName(), index);
    // }

    instructionGetFormValues(command = null) {
        const composer = this.props.composer;
        if (!command)
            command = composer.refs.fieldInstructionCommand.value;
        let newInstruction = new Instruction();

        if (composer.refs.fieldInstructionInstrument.value || composer.refs.fieldInstructionInstrument.value === 0)
            newInstruction.instrument = parseInt(composer.refs.fieldInstructionInstrument.value);
        if (composer.refs.fieldInstructionDuration.value) // TODO: refactor DURATIONS
            newInstruction.durationInTicks = parseFloat(composer.refs.fieldInstructionDuration.value);
        const velocityValue = parseInt(composer.refs.fieldInstructionVelocity.value);
        if (velocityValue || velocityValue === 0)
            newInstruction.velocity = velocityValue;

        command = this.replaceFrequencyAlias(command, newInstruction.instrument);
        newInstruction.command = command;

        return newInstruction;
    }



    // isSelectionRectActive() {
    //     let rectElm = this.querySelector('div.selection-rect');
    //     return !!rectElm;
    // }
    //
    // commitSelectionRect(eDown = null, eUp = null) {
    //     if (!eDown) eDown = this.mousePosition.lastDown;
    //
    //     let rectElm = this.querySelector('div.selection-rect');
    //     if (!rectElm)
    //         return console.warn("No selection rect");
    //
    //     const sRect = rectElm.getBoundingClientRect();
    //     // const {x,y,w,h} = this.updateSelectionRect(eDown, eUp);
    //
    //     rectElm.parentNode.removeChild(rectElm);
    //
    //
    //     const composer = this.props.composer;
    //     composer.clearselectedIndices();
    //
    //     const searchElements = this.querySelectorAll('asct-instruction,asct-row');
    //     const selectionList = [];
    //     searchElements.forEach(searchElm => {
    //         const rect = searchElm.getBoundingClientRect();
    //         const selected =
    //             rect.x + rect.width > sRect.x
    //             && rect.x < sRect.x + sRect.width
    //             && rect.y + rect.height > sRect.y
    //             && rect.y < sRect.y + sRect.height;
    //
    //         // cellElm.classList.toggle('selected', selected);
    //         if (selected) {
    //             selectionList.push(searchElm);
    //             searchElm.select(true, false);
    //         }
    //     });
    //     console.log("Selection ", selectionList, sRect);
    //
    // }


    setPlaybackPositionInTicks(groupPositionInTicks) {
        this.clearRowPositions();
        const rowElm = this.findRowElement(groupPositionInTicks);
        if (rowElm)
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

    async updateSongPositionValue(playbackPositionInSeconds) {
        let positionRow;
        for (let i = this.rows.length - 1; i >= 0; i--) {
            positionRow = this.rows[i];
            if (playbackPositionInSeconds > positionRow.positionInSeconds)
                break;
        }
        // console.info('playbackPositionInSeconds', playbackPositionInSeconds, positionRow.positionInSeconds, positionRow);


        if (positionRow && !positionRow.props.position) {
            await this.clearAllPositions();
            positionRow.setPosition();
        }
    }


    async onSongEvent(e) {
//         console.log("onSongEvent", e.type);
        switch (e.type) {

            case 'song:seek':
                this.setPlaybackPositionInTicks(e.detail.positionInTicks);
                break;

            case 'group:seek':
//                 console.log(e.type, e.detail);
                if (e.detail.trackName === this.getTrackName())
                    this.setPlaybackPositionInTicks(e.detail.positionInTicks);

                break;

            case 'group:play':
                break;

            case 'note:start':
                if (e.detail.trackName === this.getTrackName()) {
                    let instructionElm = this.findInstructionElement(e.detail.instruction.index);
                    if (instructionElm) {
                        instructionElm.classList.add('playing');
                    }
                }
                break;
            case 'note:end':
                if (e.detail.trackName === this.getTrackName()) {
                    let instructionElm = this.findInstructionElement(e.detail.instruction.index);
                    if (instructionElm) {
                        instructionElm.classList.remove('playing');
                    }
                }
                break;

            default:
                console.warn("Unknown song event: ", e.type);
        }
    }

    // TODO: refactor?
    // get selectedCells() {
    //     return this.querySelectorAll('asct-instruction.selected');
    // }
    //
    // get cursorCell() {
    //     return this.querySelector('asct-instruction.cursor,asct-instruction-add.cursor');
    // }
    //
    // // get cursorRow() { return this.cursorCell.parentNode; }
    // get cursorPosition() {
    //     return ((cell) => (cell ? cell.parentNode.positionInTicks : null))(this.cursorCell);
    // }
    //
    // get cursorInstruction() {
    //     return this.instructionFind(this.cursorCell.index);
    // }

    async setCursorElement(elm) {
        const listPos = this.cursorList.indexOf(elm);
        if (listPos === -1)
            throw new Error("Not a local element");
        this.state.cursorListOffset = listPos;
        await this.clearAllCursors();
        elm.setCursor();
        this.focus();
    }

    async selectIndicies(selectedIndices, cursorIndex = null) {
        if (cursorIndex === null)
            cursorIndex = selectedIndices.length > 0 ? selectedIndices[0] : null;
        for (let i = 0; i < this.cursorList.length; i++) {
            const cursorItem = this.cursorList[i];
            if (cursorItem instanceof TrackerInstruction) {
                await cursorItem.select(selectedIndices.indexOf(cursorItem.index) !== -1);
                if (cursorIndex !== null)
                    cursorItem.setCursor(cursorIndex === cursorItem.index);
            }
        }
    }

    // async selectCell(selectedCell, clearSelection = null, toggleValue=null) {
    //     this.selectIndex(selectedCell.index, clearSelection, toggleValue);
    // }


    // selectIndex(e, selectedIndex, clearSelection = false) {
    //     const cell = this.findInstructionElement(selectedIndex);
    //     if (cell) {
    //         this.selectCell(e, cell, clearSelection);
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }

    getFirstCursor() {
        return this.cursorList[0];
    }

    getLastCursor() {
        return this.cursorList[this.cursorList.length - 1];
    }

    getNextCursor() {
        let position = this.state.cursorListOffset;
        const cursorList = this.cursorList;
        if (!cursorList[position])
            throw new Error("Shouldn't happen");
        return cursorList[position + 1] || null;
    }

    getNextRowCursor() {
        let offset = this.state.cursorListOffset;
        const cursorList = this.cursorList;
        if (!cursorList[offset])
            throw new Error("Shouldn't happen");
        // Find the end of the row, and return the next entry
        let lastRowOffset = offset, rowPosition = 0;
        while (cursorList[--lastRowOffset] instanceof TrackerInstruction) rowPosition++;

        while (cursorList[offset++] instanceof TrackerInstruction) ;
        while (cursorList[offset] instanceof TrackerInstruction && rowPosition-- > 0) offset++;
        return cursorList[offset] || null;
    }

    getPreviousCursor() {
        let offset = this.state.cursorListOffset;
        const cursorList = this.cursorList;
        if (!cursorList[offset])
            throw new Error("Shouldn't happen");
        return cursorList[offset - 1] || null;
    }

    /** @todo fix **/
    getPreviousRowCursor() {
        let offset = this.state.cursorListOffset;
        const cursorList = this.cursorList;
        if (!cursorList[offset])
            throw new Error("Shouldn't happen");
        let lastRowOffset = offset, rowPosition = 0;
        while (cursorList[--lastRowOffset] instanceof TrackerInstruction) rowPosition++;
        offset -= rowPosition + 1;

        // Find the previous non-instruction entry
        while (cursorList[offset] instanceof TrackerInstruction) offset--;
        offset--;
        while (cursorList[offset] instanceof TrackerInstruction) offset--;
        // offset++;
        while (cursorList[offset + 1] instanceof TrackerInstruction && rowPosition-- > -1) offset++;
        return cursorList[offset] || null;
    }

    //
    // async selectNextCell(e) {
    //     let position = this.state.cursorListOffset;
    //     const cursorList = this.cursorList;
    //     if(!cursorList[position])
    //         throw new Error("Shouldn't happen");
    //     if(!cursorList[position+1]) {
    //         throw new Error("Next segment");
    //     }
    //     const nextCursorElm = cursorList[position+1];
    //     await this.selectCell(e, nextCursorElm);
    // }
    //
    // async selectPreviousCell(e) {
    //     let position = this.state.cursorListOffset;
    //     const cursorList = this.cursorList;
    //     if(!cursorList[position])
    //         throw new Error("Shouldn't happen");
    //     if(!cursorList[position-1]) {
    //         throw new Error("Previous segment");
    //     }
    //     const nextCursorElm = cursorList[position-1];
    //     await this.selectCell(e, nextCursorElm);
    //     // let cursorCell = this.querySelector('.cursor') || this.querySelector('asct-instruction:last-child');
    //     //
    //     // if (cursorCell) {
    //     //     if (cursorCell.previousInstructionSibling) {
    //     //         // If previous element is an instruction, select it
    //     //         return this.selectCell(e, cursorCell.previousInstructionSibling);
    //     //
    //     //     } else {
    //     //         return await this.selectPreviousRowCell(e);
    //     //     }
    //     // } else {
    //     //     // If no cursor is selected, use the first available instruction
    //     //     return this.selectCell(e, this.querySelector('asct-row:last-child'));
    //     // }
    // }
    //
    //
    // async selectNextRowCell(e, cellPosition = null) {
    //     let cursorCell = this.querySelector('.cursor') || this.querySelector('asct-instruction');
    //     const cursorRow = cursorCell.parentNode;
    //     if (cellPosition === null)
    //         cellPosition = [].indexOf.call(cursorCell.parentNode.children, cursorCell);
    //
    //     if (!cursorRow.nextElementSibling) {
    //         await this.setState({currentRowSegmentID: this.state.rowOffset+1});
    //         this.focus();
    //         return await this.selectNextCell(e);
    //     }
    //
    //     const nextRowElm = cursorRow.nextElementSibling;
    //
    //     let selectedCell = nextRowElm.querySelector('asct-instruction');
    //     if (nextRowElm.children[cellPosition] && nextRowElm.children[cellPosition].matches('asct-instruction')) {
    //         selectedCell = nextRowElm.children[cellPosition];
    //     }
    //
    //
    //     if (selectedCell) this.selectCell(e, selectedCell);
    //     else this.selectCell(e, cursorRow.nextElementSibling);
    //
    //     return selectedCell;
    // }
    //
    //
    // async selectPreviousRowCell(e, cellPosition = null) {
    //     let cursorCell = this.querySelector('.cursor') || this.querySelector('asct-instruction:last-child');
    //     const cursorRow = cursorCell.parentNode;
    //     if (cellPosition === null)
    //         cellPosition = [].indexOf.call(cursorCell.parentNode.children, cursorCell);
    //     if (!cursorRow.previousElementSibling) {
    //         if (this.currentRowSegmentID === 0)
    //             throw new Error("TODO: reached beginning of song");
    //         await this.setState({currentRowSegmentID: this.state.rowOffset + 1})
    //         this.focus();
    //         return await this.selectPreviousCell(e);
    //     }
    //
    //     let previousRowElm = cursorRow.previousElementSibling;
    //
    //     let selectedCell; // = previousRowElm.querySelector('asct-instruction:last-child');
    //     if (previousRowElm.children[cellPosition] && previousRowElm.children[cellPosition].matches('asct-instruction,asct-instruction-add')) {
    //         selectedCell = previousRowElm.children[cellPosition];
    //     }
    //
    //     if (!selectedCell) this.selectCell(e, previousRowElm);
    //     else this.selectCell(e, selectedCell);
    //     return selectedCell;
    // }


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



    // connectedCallback() {
    //     // this.addEventHandler([ // TODO: input
    //     //         'scroll',
    //     //         'keydown',
    //     //         'mousedown', 'mouseup', 'mousemove', 'mouseout',
    //     //         'touchstart', 'touchend', 'touchmove',
    //     //         'dragstart', 'drag', 'dragend',
    //     //         'contextmenu'
    //     //     ],
    //     //     e => this.onInput(e));
    //
    //     super.connectedCallback();
    // }


//     onInput(e) {
//         if (e.defaultPrevented)
//             return;
//
//         // switch (e.type) {
//         //     case 'mouseup':
//         //         if (this.isSelectionRectActive()) {
//         //             this.commitSelectionRect();
//         //         }
//         //         break;
//         // }
//
//         // if (e.target instanceof Node && !this.contains(e.target))
//         //     return;
//
//         // console.log(e.type);
//
//         const composer = this.props.composer;
//         let selectedIndices = this.state.selectedIndices;
//         // const instructionList = this.instructionEach();
//
//         switch (e.type) {
//             case 'keydown':
//                 // All key actions close all menus
//                 composer.closeAllMenus();
//
//                 let keyEvent = e.key;
//                 if (!e.ctrlKey && composer.keyboard.getKeyboardCommand(
//                     e.key,
//                     composer.refs.fieldTrackerOctave.value
//                 ))
//                     keyEvent = 'PlayFrequency';
//                 if (keyEvent === 'Enter' && e.altKey)
//                     keyEvent = 'ContextMenu';
//
//                 // let keydownCellElm = this.cursorCell;
//
//                 switch (keyEvent) {
//                     case 'Delete':
//                         e.preventDefault();
//                         // this.clearSelection();
//                         const selectedIndicesDesc = selectedIndices.sort((a, b) => b - a);
//                         for (let i = 0; i < selectedIndicesDesc.length; i++)
//                             composer.song.instructionDeleteAtIndex(this.gettrackName(), selectedIndices[i]);
//                         this.renderRows();
//                         // this.selectIndicies(selectedIndices[0]);
//                         // song.render(true);
//                         break;
//
//                     case 'Escape':
//                     case 'Backspace':
//                         throw new Error("TODO: navigate pop")
//                     // e.preventDefault();
//                     // this.navigatePop();
//                     // this.selectIndicies(0);
//                     // this.focus();
//                     // break;
//
//                     case 'Enter':
//                         if (this.contains(e.target)) {
//
//                             e.preventDefault();
//                             composer.instructionInsertOrUpdate(e);
//
//                             let cursorInstruction = this.cursorInstruction;
//                             if (cursorInstruction.isGroupCommand()) {
//                                 const trackName = cursorInstruction.command.substr(1);
//                                 composer.selectGroup(trackName);
//                             } else {
//                                 composer.playCursorInstruction(e);
//                             }
//                         }
//                         break;
//
//                     case 'Play':
//                         e.preventDefault();
//                         composer.playCursorInstruction(e);
//                         // for(let i=0; i<selectedIndices.length; i++) {
//                         //     this.editor.song.playInstruction(instructionList[i]);
//                         // }
//                         break;
//
//                     // ctrlKey && metaKey skips a measure. shiftKey selects a range
//                     case 'ArrowRight':
//                         e.preventDefault();
//                         composer.setNextCursor(!e.shiftKey, e.ctrlKey ? null : true);
//                         // this.focus();
//                         break;
//
//                     case 'ArrowLeft':
//                         e.preventDefault();
//                         composer.setPreviousCursor(!e.shiftKey, e.ctrlKey ? null : true);
//                         // this.focus();
//                         break;
//
//                     case 'ArrowDown':
//                         e.preventDefault();
//                         composer.setNextRowCursor(!e.shiftKey, e.ctrlKey ? null : true);
//                         // this.focus();
//                         break;
//
//                     case 'ArrowUp':
//                         e.preventDefault();
//                         composer.setPreviousRowCursor(!e.shiftKey, e.ctrlKey ? null : true);
//                         // this.focus();
//                         break;
//
//                     case ' ':
//                         e.preventDefault();
//                         // this.selectCell(e, this.cursorCell);
//                         // if(e.ctrlKey) e.preventDefault();
//                         if (composer.song.isActive()) {
//                             composer.song.stopPlayback();
//                         } else {
//                             composer.song.play();
//                         }
//                         break;
//
//                     case 'PlayFrequency':
//                         let newCommand = composer.keyboard.getKeyboardCommand(e.key, composer.refs.fieldTrackerOctave.value);
//                         if (newCommand === null)
//                             break;
//
//                         e.preventDefault();
//
//                         composer.instructionInsertOrUpdate(e, newCommand);
//
//                         // this.render();
//                         // this.renderCursorRow();
//                         composer.playCursorInstruction(e);
//                         this.focus();
//
//                         // song.gridSelectInstructions([selectedInstruction]);
//                         // e.preventDefault();
//                         break;
//
//                     default:
//                         break;
//
//                 }
//                 break;
//
//             case 'touchstart':
//             case 'mousedown':
//                 // All mouse actions close all menus
//                 composer.closeAllMenus();
//
//                 this.mousePosition.isDown = true;
//                 this.mousePosition.isDragging = false;
//                 this.mousePosition.lastDown = e;
//                 // delete this.mousePosition.lastUp;
//                 delete this.mousePosition.lastDrag;
//                 // delete this.mousePosition.lastUp;
//                 // delete this.mousePosition.lastDrag;
//
//                 if (e.target instanceof TrackerInstruction)
//                     return composer.setCursor(e.target, !e.shiftKey, e.ctrlKey ? null : true);
//
//                 if (e.target.parentNode instanceof TrackerInstruction)
//                     return composer.setCursor(e.target.parentNode, !e.shiftKey, e.ctrlKey ? null : true);
//
//                 if (e.target instanceof TrackerInstructionAdd)
//                     return composer.setCursor(e.target.parentNode, !e.shiftKey, e.ctrlKey ? null : true);
//
//                 // if (e.target instanceof TrackerDelta) // TODO: special command for clicking delta
//                 //     return composer.setCursor(e.target.parentNode, !e.shiftKey, e.ctrlKey ? null : true);
//
//
//                 if (e.target instanceof TrackerRow)  // classList.contains('tracker-row')) {
//                     return composer.setCursor(e.target, !e.shiftKey, e.ctrlKey ? null : true);
//                 // e.preventDefault();
//
//
//                 break;
//
//
//             case 'touchmove':
//             case 'mousemove':
//                 if (e.which === 1) {
//                     if (this.mousePosition.isDown) {
//                         this.mousePosition.isDragging = true;
//                         this.mousePosition.lastDrag = e;
//                     }
//                 }
//                 if (this.mousePosition.isDown && this.mousePosition.lastDrag) {
//                     if (this.mousePosition.lastDown.path[0].matches('asct-row')) {
//                         // if(this.isSelectionRectActive()) {
//                         //     this.updateSelectionRect(this.mousePosition.lastDown, this.mousePosition.lastDrag)
//                         // }
//                     }
//                 }
//                 break;
//
//             case 'touchend':
//             case 'mouseup':
//                 this.mousePosition.isDown = false;
//                 if (this.mousePosition.isDragging
//                     && this.mousePosition.lastDown.path[0].matches('asct-row')
//                 ) {
//                     // if(this.isSelectionRectActive()) {
//                     //     this.commitSelectionRect(this.mousePosition.lastDown, this.mousePosition.lastUp);
//                     //     break;
//                     // }
//                 }
//                 this.mousePosition.isDragging = false;
//
//                 const lastMouseUp = this.mousePosition.lastUp;
//                 e.t = new Date();
//                 this.mousePosition.lastUp = e;
//                 if (lastMouseUp && lastMouseUp.t.getTime() + composer.doubleClickTimeout > new Date().getTime()) {
//                     e.preventDefault();
//                     const currentTarget = e.path[0];
//                     const originalTarget = lastMouseUp.path[0];
//                     if (originalTarget === currentTarget
//                         || originalTarget.contains(currentTarget)
//                         || currentTarget.contains(originalTarget)) {
//                         const doubleClickEvent = new CustomEvent('doubleclick', {
//                             detail: {
//                                 firstMouseEvent: lastMouseUp.e,
//                                 secondMouseEvent: e,
//                                 clientX: e.clientX,
//                                 clientY: e.clientY,
//                             },
//                             cancelable: true,
//                             bubbles: true
//                         });
//                         currentTarget.dispatchEvent(doubleClickEvent);
//                     }
//                     // console.log(doubleClickEvent);
//                 }
//                 break;
//
//             case 'mouseout':
//                 if (e.target.matches('asc-tracker')) {
// //                     console.log(e.target, e.path);
//                     if (this.isSelectionRectActive()) {
//                         this.commitSelectionRect();
//                     }
//                 }
//                 break;
//
//             case 'click':
//                 // this.editor.closeMenu();
//                 break;
//
//             case 'doubleclick':
//             case 'longpress':
//                 // if (e.target.classList.contains('tracker-parameter')
//                 //     || e.target.classList.contains('tracker-cell')
//                 //     || e.target.classList.contains('tracker-data')
//                 //     || e.target.classList.contains('tracker-row')) {
//                 e.preventDefault();
//                 // console.log("Longpress", e);
//                 if (this.contains(e.target)) {
//                     composer.menuContext.openContextMenu(e);
//                 }
//                 // }
//                 break;
//
//             case 'contextmenu':
//                 // if (e.target.classList.contains('tracker-parameter')) {
//                 //     console.info("TODO: add parameter song at top of context menu: ", e.target); // huh?
//                 // }
//                 if (!e.altKey) {
//                     e.preventDefault();
//                     composer.openContextMenu(e);
//                 }
//                 break;
//
//             case 'scroll':
//
//                 // if(this.renderScrollLimit < this.scrollTop + this.offsetHeight*4) {
//                 //     this.renderScrollLimit *= 2; // = this.scrollTop + this.offsetHeight*4;
//                 //     console.info("New scroll limit: ", this.renderScrollLimit);
//                 // }
//
//                 // this.renderAllRows(40);
//                 break;
//
//             case 'dragstart':
//             case 'drag':
//             case 'dragend':
//                 console.info(e.type);
//                 break;
//
//             default:
//                 throw new Error("Unhandled type: " + e.type);
//
//         }
//     }
//
//     updateSelectionRect(eDown, eMove) {
//         if (!eMove) eMove = this.mousePosition.lastDrag || this.mousePosition.lastDrag;
//         var a = eDown.clientX - eMove.clientX;
//         var b = eDown.clientY - eMove.clientY;
//         var c = Math.sqrt(a * a + b * b);
//         if (c < 30)
//             return console.warn("Skipping selection rect");
//         // console.log("Dragging", c);// eDown.path[0], eMove.path[0]);
//
//         let rectElm = this.querySelector('div.selection-rect');
//         if (!rectElm) {
//             rectElm = document.createElement('div');
//             rectElm.classList.add('selection-rect');
//             this.appendChild(rectElm);
//         }
//
//         let x, y, w, h;
//         if (eDown.clientX < eMove.clientX) {
//             x = eDown.clientX;
//             w = eMove.clientX - eDown.clientX;
//         } else {
//             x = eMove.clientX;
//             w = eDown.clientX - eMove.clientX;
//         }
//         if (eDown.clientY < eMove.clientY) {
//             y = eDown.clientY;
//             h = eMove.clientY - eDown.clientY;
//         } else {
//             y = eMove.clientY;
//             h = eDown.clientY - eMove.clientY;
//         }
//
//         rectElm.style.left = x + 'px';
//         rectElm.style.width = w + 'px';
//         rectElm.style.top = y + 'px';
//         rectElm.style.height = h + 'px';
//
//
//         const cellList = this.querySelectorAll('asct-instruction');
//         cellList.forEach(cellElm => {
//             const rect = cellElm.getBoundingClientRect();
//             const selected =
//                 rect.x + rect.width > x
//                 && rect.x < x + w
//                 && rect.y + rect.height > y
//                 && rect.y < y + h;
//             cellElm.classList.toggle('selecting', selected);
//         });
//
//         return {x, y, w, h};
//     }

//     selectSegmentIndicies(indicies, clearSelection = false) {
//         const composer = this.props.composer;
//         // const currentselectedIndices = composer.getSelectedIndices();
//         // if(indicies.length === currentselectedIndices.length && indicies.sort().every(function(value, index) { return value === currentselectedIndices.sort()[index]}))
//         //     return;
//         if (!Array.isArray(indicies))
//             indicies = [indicies];
//         if (clearSelection)
//             composer.clearselectedIndices();
//         for (let i = 0; i < indicies.length; i++) {
//             const index = indicies[i];
//             const cell = this.findInstructionElement(index);
//             if (cell) {
//                 cell.select(true, false);
//                 if (i === 0)
//                     this.setCursorElement(cell);
//             } else {
// //                 console.warn("Instruction not found: " + index);
//             }
//         }
//         //    this.focus(); // Prevents tab from working
//     }


    // async clearAllCursors() {
    //     for (let i = 0; i < this.cursorList.length; i++) {
    //         const cursorElm = this.cursorList[i];
    //         await cursorElm.removeCursor();
    //     }
    // }

    // async clearAllPositions() {
    //     for (let i = 0; i < this.cursorList.length; i++) {
    //         const cursorElm = this.cursorList[i];
    //         await cursorElm.removePosition();
    //     }
    // }

    // onRowInput(e, selectedRow = null) {
    //     e.preventDefault();
    //
    //     selectedRow = selectedRow || e.target;
    //     this.selectCell(e, selectedRow);
    // }
    //
    // onCellInput(e, selectedCell) {
    //     e.preventDefault();
    //     selectedCell = selectedCell || e.target;
    //     this.selectCell(e, selectedCell);
    //     composer.playCursorInstruction(e);
    // }


    // instructionReplaceParams(replaceIndex, replaceParams) {
    //     return this.editor.song.instructionReplaceParams(this.gettrackName(), replaceIndex, replaceParams);
    // }

    // replaceFrequencyAlias(noteFrequency, instrumentID) {
    //     const composer = this.props.composer;
    //     const instrument = composer.song.getInstrument(instrumentID, false);
    //     if (!instrument || !instrument.getFrequencyAliases)
    //         return noteFrequency;
    //     const aliases = instrument.getFrequencyAliases(noteFrequency);
    //     if (typeof aliases[noteFrequency] === "undefined")
    //         return noteFrequency;
    //     return aliases[noteFrequency];
    // }


    // selectInstructions(selectedIndices) {
    //     return this.selectIndicies(selectedIndices);
    // }

    // clearRowPositions() {
    //     this.querySelectorAll(`asct-row[position]`)
    //         .forEach(row => row.setProps({position: false}));
    // }

    // findRowElement(positionInTicks) {
    //     return this.querySelector(`asct-row[t='${positionInTicks}']`);
    // }


    // findInstructionElement(instructionIndex) {
    //     return this.querySelector(`asct-instruction[i='${instructionIndex}']`);
    // }

}

export default Tracker;
