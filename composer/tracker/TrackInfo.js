import {InstructionList} from "../../song/instruction/";


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
    getInstructionList()        { return new InstructionList(this.getSong().instructionGetList(this.trackName))}
    getTrackName()              { return this.trackName; }
    getSelectedIndices()        { return this.track.selectedIndices; }
    getCursorOffset()           { return this.track.cursorOffset; }
    getQuantizationInTicks() {
        return this.track.quantizationTicks || this.composer.song.data.timeDivision;
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

    changeRowOffset(trackName, newRowOffset) {
        if (!Number.isInteger(newRowOffset))
            throw new Error("Invalid row offset");
        this.track.rowOffset = newRowOffset;
        this.updateState();
    }

    async changeQuantization(trackerQuantizationTicks = null, promptUser=true) {
        if(trackerQuantizationTicks === null && promptUser)
            trackerQuantizationTicks = parseInt(await this.composer.openPromptDialog(`Enter custom tracker quantization in ticks:`, this.track.quantizationTicks));
        if (!Number.isInteger(trackerQuantizationTicks))
            throw new Error("Invalid quantization value");

        this.track.quantizationTicks = trackerQuantizationTicks;
        this.updateState();

    }

    async changeSegmentLength(trackerSegmentLengthInRows = null, promptUser=true) {
        if(trackerSegmentLengthInRows === null && promptUser)
            trackerSegmentLengthInRows = parseInt(await this.composer.openPromptDialog(`Enter custom tracker segment length in rows:`, this.track.rowLength));
        if (!Number.isInteger(trackerSegmentLengthInRows))
            throw new Error("Invalid tracker row length value");
        this.track.rowLength = trackerSegmentLengthInRows;
        this.updateState();
    }

    async changeSelection(selectedIndices = null, promptUser=true) {
        const oldSelectedIndices = this.track.selectedIndices;

        if (selectedIndices === null && promptUser)
            selectedIndices = await this.composer.openPromptDialog("Enter selection: ", oldSelectedIndices.join(','));
        selectedIndices = selectedIndices.split(/[^0-9]/).map(index => parseInt(index));
        this.selectIndices(selectedIndices);
    }


    selectIndices(selectedIndices=null, cursorOffset=null, rowOffset=null) {
//         console.info('trackerSelectIndices', trackName, selectedIndices, cursorOffset);
        // if(cursorIndex === null)
        //     cursorIndex = selectedIndices.length > 0 ? selectedIndices[0] : 0;

        // if selectedIndices is an array, clear selection, if integer, add to selection
        if(selectedIndices === null)
            selectedIndices = this.track.selectedIndices || [];

        // Filter unique indices
        selectedIndices = selectedIndices.filter((v, i, a) => a.indexOf(v) === i);
        // Sort indices
        selectedIndices.sort((a, b) => a - b);

        this.track.selectedIndices = selectedIndices;
        if(cursorOffset !== null) {
            if(cursorOffset < 0)
                throw new Error("Invalid cursor offset: " + cursorOffset);
            this.track.cursorOffset = cursorOffset;
        } else {

        }

        if(rowOffset === null) {
            rowOffset = this.calculateRowOffset(cursorOffset);
        }

        this.track.rowOffset = rowOffset;

        this.updateState();
        return selectedIndices;
    }


    calculateRowOffset(trackName, cursorOffset=null) {

        const rowLength = this.track.rowLength;
        let rowOffset = this.track.rowOffset;
        if(cursorOffset === null)
            cursorOffset = this.track.cursorOffset;

        // Update rowOffset
        const currentRow = this.findCursorRow(cursorOffset);
        if(rowOffset < currentRow - rowLength)
            rowOffset = currentRow - rowLength - 1;
        if(rowOffset > currentRow - 2)
            rowOffset = currentRow - 2;
        return rowOffset;
    }

    findCursorRow(cursorOffset=null) {
        if(cursorOffset === null)
            cursorOffset = this.getCursorOffset();

        let rowCount = 0;
        this.eachRow((rowCount2, lastRowPositionTicks, toPositionTicks, cursorPosition) => {
            rowCount++;
            return cursorPosition <= cursorOffset;
        }, (instruction, cursorPosition) => {
        });
        return rowCount;
    }

    findRowCursorOffset() {
        let cursorOffset = this.getCursorOffset();

        let rowOffsets=[0,0];
        this.eachRow((rowCount, lastRowPositionTicks, toPositionTicks, cursorPosition) => {
            // const colOffset = cursorPosition - cursorOffset;
            rowOffsets.push(cursorPosition);
            if(rowOffsets.length > 3)
                rowOffsets.shift();
            return cursorPosition <= cursorOffset;
        }, (instruction, cursorPosition) => {
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
                if(instructionCallback(instruction, cursorPosition) === false)
                    return;

            // Render instruction
            const index = instructionIterator.currentIndex;
            const props = {
                instruction,
                index,
                cursorPosition // TODO: inefficient?
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

        for(let i=0; i<256; i++) {
            if(doCallback(nextQuantizationBreakInTicks) === false)
                return;
            nextQuantizationBreakInTicks += quantizationTicks;
        }

        function doCallback(toPositionTicks) {
            const lastRowPositionTicks = currentRowPositionTicks;
            // let rowDeltaDuration = toPositionTicks - currentRowPositionTicks;
            currentRowPositionTicks = toPositionTicks;

            const result = rowCallback(rowCount, lastRowPositionTicks, toPositionTicks, cursorPosition, rowInstructionElms);

            rowInstructionElms=[];
            rowCount++;
            cursorPosition++;
            return result;
        }

    }

    /** Playback **/

    playInstructions(destination, selectedIndices) {
        // console.log('playInstructions', selectedIndices);
        const instrumentID = typeof this.track.instrumentID !== "undefined" ? this.track.instrumentID : 0;
        const song = this.composer.getSong();
        for(let i=0; i<selectedIndices.length; i++) {
            const selectedIndex = selectedIndices[i];
            const instruction = song.instructionGetByIndex(this.getTrackName(), selectedIndex);
            song.playInstruction(destination, instruction, instrumentID);
        }
    }

    playSelectedInstructions(destination) {
        return this.playInstructions(destination, this.getSelectedIndices());
    }

    stopPlayback() {
        console.log("TODO: stop playback")
    }

}





