import {ProgramLoader, NoteInstruction} from "../../song/";

/** @deprecated **/
export default class TrackInfo {
    constructor(trackName, composer) {
        this.trackName = trackName;
        this.composer = composer;
        const activeTracks = composer.state.activeTracks;
        if(typeof activeTracks[trackName] === "undefined")
            throw new Error(`Track ${trackName} is not active`);
        this.track = activeTracks[trackName];
    }

    getComposer()               { return this.composer; }
    getSong()                   { return this.composer.getSong(); }
    // getInstructionList()        { return new InstructionList(this.getSong().instructionGetList(this.trackName))}
    getTrackName()              { return this.trackName; }
    getSelectedIndices()        { return this.track.selectedIndices; }
    getCursorOffset()           { return this.track.cursorOffset; }
    getStartingTimeDivision()   { return this.composer.song.data.timeDivision; }
    getQuantizationInTicks() {
        return this.track.quantizationTicks || this.getStartingTimeDivision();
    }

    updateState() {

        const activeTracks = {...this.composer.state.activeTracks};
        this.composer.setState({activeTracks, selectedTrack: this.trackName});

    }

    setActive() {
        if(this.composer.state.selectedTrack !== this.trackName) {
            this.composer.setState({selectedTrack: this.trackName})
        }
    }


    calculateCursorOffsetPositionTicks() {
        const {cursorPositionTicks} = this.findCursorRow();
        return cursorPositionTicks;
    }

    /** @deprecated **/
    selectIndices(selectedIndices=null, cursorOffset=null) {
//         console.info('TrackInfo.selectIndices', selectedIndices, cursorOffset);
        // if(cursorIndex === null)
        //     cursorIndex = selectedIndices.length > 0 ? selectedIndices[0] : 0;

        // if selectedIndices is an array, clear selection, if integer, add to selection
        if(selectedIndices === null)
            selectedIndices = this.track.selectedIndices || [];

        // Filter unique indices
        selectedIndices = selectedIndices.filter((v, i, a) => a.indexOf(v) === i && v !== null);
        // Sort indices
        selectedIndices.sort((a, b) => a - b);

        this.track.selectedIndices = selectedIndices;
        if(cursorOffset !== null) {
            if(cursorOffset < 0)
                throw new Error("Invalid cursor offset: " + cursorOffset);
            this.track.cursorOffset = cursorOffset;
        } else {

        }

        this.track.rowOffset = this.calculateRowOffset(cursorOffset);
        this.updateCurrentInstruction();
        this.updateState(); // TODO: ugly double update
        return selectedIndices;
    }

    /** @deprecated **/
    updateCurrentInstruction() {
        const selectedIndices = this.track.selectedIndices;
        if(selectedIndices.length > 0) {
            const firstSelectedInstruction = this.getSong().instructionGetByIndex(this.getTrackName(), selectedIndices[0]);
            this.track.currentCommand = firstSelectedInstruction.command;
            if(firstSelectedInstruction instanceof NoteInstruction) {
                if(typeof firstSelectedInstruction.durationTicks !== "undefined")
                    this.track.currentDuration = firstSelectedInstruction.getDurationString(this.getStartingTimeDivision());
                if(typeof firstSelectedInstruction.velocity !== "undefined")
                    this.track.currentVelocity = firstSelectedInstruction.velocity;
            }
//             console.log(this.track);
            this.updateState();
        }
    }

    /** @deprecated **/
    calculateRowOffset(trackName, cursorOffset=null) {

        const rowLength = this.track.rowLength;
        let rowOffset = this.track.rowOffset;
        if(cursorOffset === null)
            cursorOffset = this.track.cursorOffset;

        // Update rowOffset
        const {currentRow} = this.findCursorRow(cursorOffset);
        if(rowOffset < currentRow - rowLength)
            rowOffset = currentRow - rowLength - 1;
        if(rowOffset > currentRow - 2)
            rowOffset = currentRow - 2;
        return rowOffset;
    }

    /** @deprecated **/
    findCursorRow(cursorOffset=null) {
        if(cursorOffset === null)
            cursorOffset = this.getCursorOffset();

        let currentRow = 0, cursorPositionTicks=null;
        this.eachRow((rowCount2, startPositionTicks, endPositionTicks, cursorPosition) => {
            currentRow++;
            cursorPositionTicks = startPositionTicks;
            return cursorPosition < cursorOffset;
        }, (index, instruction, cursorPosition) => {
        });
        return {currentRow, cursorPositionTicks};
    }

    /** @deprecated **/
    findRowCursorOffset() {
        let cursorOffset = this.getCursorOffset();

        let rowOffsets=[0,0];
        this.eachRow((rowCount, lastRowPositionTicks, toPositionTicks, cursorPosition) => {
            // const colOffset = cursorPosition - cursorOffset;
            rowOffsets.push(cursorPosition);
            if(rowOffsets.length > 3)
                rowOffsets.shift();
            return cursorPosition <= cursorOffset;
        }, (index, instruction, cursorPosition) => {
        });
        // console.log('rowOffsets', cursorOffset, rowOffsets);
        const nextRowStartOffset = rowOffsets.pop();
        const currentRowOffset = rowOffsets.pop();
        const previousRowStartOffset = rowOffsets.pop();
        //
        // const nextRowColOffset = nextRowStartOffset - cursorOffset;
        const columnOffset = cursorOffset - currentRowOffset;
        const nextRowOffset = nextRowStartOffset + (columnOffset);
        const previousRowOffset = previousRowStartOffset + columnOffset; // + (nextRowStartOffset - cursorOffset);
        // console.log('rowOffsets', {cursorOffset, nextRowOffset, previousRowOffset});
        return {cursorOffset, nextRowOffset, previousRowOffset};
        // TODO: fix first position bug
    }


    /** Row Iterator **/

    /** @deprecated **/
    eachRow(rowCallback, instructionCallback=null) {
        const cursorOffset = this.track.cursorOffset || 0;
        const selectedIndices = this.track.selectedIndices || [];

        const quantizationTicks = this.getQuantizationInTicks();

        // Instruction Iterator
        const song = this.composer.getSong();
        let instructionIterator = song.instructionGetIterator(this.trackName);

        let rowInstructionElms = [];
        let rowCount=0, cursorPosition=0;
        let currentRowPositionTicks = 0;

        let nextQuantizationBreakInTicks = quantizationTicks;
        while (true) {
            const instruction = instructionIterator.nextInstruction();
            if(!instruction)
                break;


            if(instruction.deltaDurationTicks > 0) {
                // Finish rendering last row
                let endPositionTicks = instructionIterator.positionTicks;

                // Move next quantized row up to current position
                while(nextQuantizationBreakInTicks <= currentRowPositionTicks)
                    nextQuantizationBreakInTicks += quantizationTicks;

                // Render extra quantized rows if necessary
                while(nextQuantizationBreakInTicks < endPositionTicks) {
                    if(doCallback(nextQuantizationBreakInTicks) === false)
                        return;
                    nextQuantizationBreakInTicks += quantizationTicks;
                }

                if(doCallback(endPositionTicks) === false)
                    return;
            }

            if(instructionCallback)
                if(instructionCallback(instructionIterator.currentIndex, instruction, cursorPosition) === false)
                    return;

            // Render instruction
            const index = instructionIterator.currentIndex;
            const props = {
                instruction,
                index,
                cursorPosition // TODO: inefficient? nah.
            };
            if (selectedIndices.indexOf(index) !== -1)
                props.selected = true;
            if (cursorPosition === cursorOffset) {
                props.cursor = true;
            }
            rowInstructionElms.push(props);
            cursorPosition++;

        }
        // renderQuantizedRows(maxLengthInTicks);
        while(nextQuantizationBreakInTicks <= currentRowPositionTicks)
            nextQuantizationBreakInTicks += quantizationTicks;
        for(let i=0; i<256; i++) {
            if(doCallback(nextQuantizationBreakInTicks) === false)
                return;
            nextQuantizationBreakInTicks += quantizationTicks;
        }

        function doCallback(toPositionTicks) {
            if(currentRowPositionTicks === toPositionTicks) {
                console.warn("Row has a duration of zero", toPositionTicks, instructionIterator);
            }
            // let rowDeltaDuration = toPositionTicks - currentRowPositionTicks;

            // TODO: refactor as row props
            const result = rowCallback(rowCount, currentRowPositionTicks, toPositionTicks, cursorPosition, rowInstructionElms);
            currentRowPositionTicks = toPositionTicks;

            rowInstructionElms=[];
            rowCount++;
            cursorPosition++;
            return result;
        }

    }

    /** Playback **/

    /** @deprecated **/
    playInstructions(destination, selectedIndices, stopPlayback=true) {
        if(!Array.isArray(selectedIndices))
            selectedIndices = [selectedIndices];
        // console.log('playInstructions', selectedIndices);
        const programID = typeof this.track.programID !== "undefined" ? this.track.programID : 0;
        const song = this.composer.getSong();

        if(stopPlayback)
            song.programLoader.stopAllPlayback();

        for(let i=0; i<selectedIndices.length; i++) {
            const selectedIndex = selectedIndices[i];
            const instruction = song.instructionGetByIndex(this.getTrackName(), selectedIndex);
            song.playInstruction(destination, instruction, programID);
        }
    }

    playSelectedInstructions(destination, stopPlayback=true) {
        return this.playInstructions(destination, this.getSelectedIndices(), stopPlayback);
    }

    stopPlayback(destination) {
        const programID = typeof this.track.programID !== "undefined" ? this.track.programID : 0;
        this.composer.getSong().stopProgramPlayback(destination, programID);
    }

}





