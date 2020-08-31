import {ArgType, Values} from "../../common";
import ASCTrackActions from "./ASCTrackActions";


// TODO: ASCTrackRowContainer
export default class ASCTrackInput extends ASCTrackActions {

    constructor(props) {
        super(props);
        this.cb.onContextMenu = e => this.onContextMenu(e);
        this.cb.onKeyDown =     e => this.onKeyDown(e);
        this.cb.onWheel =       e => this.onWheel(e);
        // this.cb.onTouchStart =  e => this.onTouchStart(e);
        // this.cb.onTouchEnd =    e => this.onTouchEnd(e);
    }

    /** User Input **/

    // onTouchStart(e) {
    //     console.log(e.type, e);
    // }
    // onTouchEnd(e) {
    //     console.log(e.type, e);
    // }

    onContextMenu(e, options=null) {
        if(!options)
            options = this.getComposer().renderMenuEdit();
        this.openContextMenu(e, options);
    }

    onWheel(e) {
        e.preventDefault();
        let rowOffset = parseInt(this.getRowOffset()) || 0; // this.getTrackState().rowOffset;
        rowOffset += e.deltaY > 0 ? 1 : -1;
        if(rowOffset < 0)
            rowOffset = 0; // return console.log("Unable to scroll past beginning");

        this.setRowOffset(rowOffset);
        // console.log('onWheel', e.deltaY);
        // this.getComposer().trackerSetRowOffset(this.getTrackName(), newRowOffset)
        // this.getComposer().trackerUpdateSegmentInfo(this.getTrackName());
        // this.getTrackInfo().changeRowOffset(this.getTrackName(), newRowOffset);
    }


    // onClick(e) {
    //     this.toggleViewMode()
    // }

    onKeyDown(e) {
        const composer = this.getComposer();
        // console.log(e.type, e.key, e.ctrlKey);
        if(e.isDefaultPrevented())
            return;
        if(e.ctrlKey) switch(e.key) {
            case 'x': composer.instructionCutSelected(); return;
            case 'c': composer.instructionCopySelected(); return;
            case 'v': composer.instructionPasteAtCursor(); return;
            default: break;
        }
        const cursorInfo = this.cursorGetInfo();
        // const trackState = this.getTrackState();
        // console.log('cursorInfo', cursorInfo);

        // let selectedIndices;
        switch(e.key) {
            case 'Delete':
                if(cursorInfo.cursorIndex)
                    composer.instructionDeleteIndices(this.getTrackName(), cursorInfo.cursorIndex);
                else
                    composer.instructionDeleteIndices(); // cursorDeleteIndex !== null ? [cursorDeleteIndex] : null
                break;
            //
            // case 'Escape':
            // case 'Backspace':
            //     break;
            //
            //
            // case ' ':
            case 'Play':
                composer.songPlay(); // TODO: play track?
                break;

            case 'ArrowLeft':
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                let targetCursorOffset;
                switch(e.key) {
                    case 'ArrowRight':
                        targetCursorOffset = cursorInfo.nextCursorOffset;
                        break;

                    case 'ArrowLeft':
                        targetCursorOffset = cursorInfo.previousCursorOffset;
                        break;

                    case 'ArrowUp':
                        targetCursorOffset = cursorInfo.previousRowOffset;
                        break;

                    case 'ArrowDown':
                        targetCursorOffset = cursorInfo.nextRowOffset;
                        break;
                    default:
                        throw new Error("Invalid: " + e.key);
                }
                const targetCursorInfo = this.cursorGetInfo(targetCursorOffset)
                this.setCursorOffset(targetCursorOffset, targetCursorInfo.positionTicks);
                //, targetCursorInfo.adjustedCursorRow
                if(targetCursorInfo.cursorIndex !== null) {
                    if(e.shiftKey) {
                        let selectedIndices = [targetCursorInfo.cursorIndex];
                        if(cursorInfo.cursorIndex !== null)
                            selectedIndices.push(cursorInfo.cursorIndex);
                        selectedIndices = this.selectIndices(selectedIndices, false);
                        if(e.ctrlKey) {
                            this.playInstructions(selectedIndices, true);
                        }
                    } else {
                        this.selectIndices('none', true);
                        if(e.ctrlKey) {
                            this.playInstructions(targetCursorInfo.cursorIndex, true);
                        }
                    }
                } else {
                    if(!e.shiftKey) {
                        this.selectIndices('none', true);
                    }
                }

                const rowLength = this.getRowLength();
                if(targetCursorInfo.cursorRow > this.getRowOffset() + (rowLength - 1))
                    this.setRowOffset(targetCursorInfo.cursorRow - (rowLength - 1))
                else if(targetCursorInfo.cursorRow < this.getRowOffset())
                    this.setRowOffset(targetCursorInfo.cursorRow)
                break;

            //
            // case ' ':
            //     break;
            //
            // case 'PlayFrequency':
            //     break;
            case 'PageDown':
                const {cursorOffset: nextCursorOffset} = this.getPositionInfo(cursorInfo.positionTicks + this.getSegmentLengthTicks())
                this.setCursorOffset(nextCursorOffset);
                this.adjustRowOffset(nextCursorOffset + this.getRowLength() / 4);
                // console.log('nextCursorOffset', nextCursorOffset);
                break;

            case 'PageUp':
                const {cursorOffset: previousCursorOffset} = this.getPositionInfo(cursorInfo.positionTicks - this.getSegmentLengthTicks())
                this.setCursorOffset(previousCursorOffset);
                this.adjustRowOffset(previousCursorOffset);
                // console.log('previousCursorOffset', previousCursorOffset);
                break;


            case 'ContextMenu':
                e.preventDefault();
                this.getComposer().openMenuByKey('edit');
                // this.toggleDropDownMenu(); // TODO: open composer edit menu instead
                break;

            case 'Enter':
                if(cursorInfo.cursorIndex !== null)
                    this.selectIndices(cursorInfo.cursorIndex, 'toggle');
                break;

            case ' ':
                if(e.ctrlKey)
                    this.playSelectedInstructions();
                else if(cursorInfo.cursorIndex !== null) {
                    // if(e.shiftKey)
                    //     this.selectIndices(cursorInfo.cursorIndex, 'toggle');
                    // else
                    this.playInstructions([cursorInfo.cursorIndex]);
                }
                // else if(this.getSelectedIndices().length > 0)
                //     this.playSelectedInstructions();
                break;

            case 'Shift':
            case 'Control':
            case 'Alt':
                break;

            default:
                const {keyboardOctave} = composer.getTrackPanelState();
                const keyboardCommand = composer.keyboard.getKeyboardCommand(e.key, keyboardOctave);
                if(keyboardCommand) {
                    // const selectedIndices = this.getSelectedIndices();
                    // const {cursorIndex} = this.cursorGetInfo()
                    if(cursorInfo.cursorIndex !== null) {
                        try {
                            composer.instructionReplaceArgByType(this.getTrackName(), cursorInfo.cursorIndex, ArgType.frequency, keyboardCommand);
                        } catch (e) { // Hack
                            console.warn(e);
                            composer.instructionReplaceArgByType(this.getTrackName(), cursorInfo.cursorIndex, ArgType.command, keyboardCommand);
                        }

                    } else {
                        this.instructionInsertAtCursor(keyboardCommand);
                    }
                    // console.log('TODO: keyboardCommand', keyboardCommand, selectedIndices, cursorOffset);
                    return;
                }
                // this.instructionInsert
                console.info("Unhandled key: ", e.key);
                break;
        }
    }

    handleMIDIInput(e) {
        const composer = this.getComposer();
        const {keyboardOctave} = composer.getTrackPanelState();
        // TODO: Send to song
        // console.log('playMIDIEvent', eventData);
        switch (e.data[0]) {
            case 144:   // Note On
                const cursorInfo = this.cursorGetInfo();
                let newMIDICommand = Values.instance.getCommandFromMIDINote(e.data[1]);
                const newMIDIFrequency = Values.instance.parseFrequencyString(newMIDICommand);
                let newMIDIVelocity = Math.round((e.data[2] / 128) * 100);
                // const source = this.playFrequency(destination, newMIDIFrequency, null, null, newMIDIVelocity);
                console.log(newMIDICommand, newMIDIFrequency, newMIDIVelocity, keyboardOctave);
                if(cursorInfo.cursorIndex !== null) {
                    try {
                        composer.instructionReplaceArgByType(this.getTrackName(), cursorInfo.cursorIndex, ArgType.frequency, newMIDICommand);
                    } catch (e) { // Hack
                        console.warn(e);
                        composer.instructionReplaceArgByType(this.getTrackName(), cursorInfo.cursorIndex, ArgType.command, newMIDICommand);
                    }

                } else {
                    this.instructionInsertAtCursor(newMIDICommand);
                }
                break;
                // if(source) {
                //     if (this.activeMIDINotes[newMIDICommand])
                //         this.activeMIDINotes[newMIDICommand].noteOff();
                //     this.activeMIDINotes[newMIDICommand] = source;
                // }
                // return source;

            case 128:   // Note Off
                // newMIDICommand = Values.instance.getCommandFromMIDINote(e.data[1]);
                // console.log(newMIDICommand)
                // if(this.activeMIDINotes[newMIDICommand]) {
                //     this.activeMIDINotes[newMIDICommand].noteOff();
                //     delete this.activeMIDINotes[newMIDICommand];
                //     return true;
                // } else {
                //     return false;
                // }

                break;
        }
    }
}

