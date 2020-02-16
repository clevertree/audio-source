import SongInstruction from "./SongInstruction";

class SongInstructionIterator {
    constructor(song, groupName, currentBPM = null, groupPositionInTicks = 0) {
        if (!song.data.instructions[groupName])
            throw new Error("Song group not found: " + groupName);

        this.song = song;
        this.groupName = groupName;
        this.currentBPM = currentBPM || song.getStartingBeatsPerMinute();
        this.timeDivision = song.getTimeDivision();
        this.groupIndex = -1;

        // this.lastRowPositionInTicks = 0;
        // this.lastRowPlaybackTime = 0;
        this.groupPositionInTicks = groupPositionInTicks;
        this.lastDeltaDuration = 0;
        this.groupEndPositionInTicks = groupPositionInTicks;
        this.lastInstructionGroupPositionInTicks = groupPositionInTicks;

        this.groupPlaybackTime = 0;
        this.groupPlaybackEndTime = 0;
        this.lastInstructionGroupPlaybacktime = 0;


        this.nextQuantizationBreakInTicks = 0;


        // this.lastRowPositionInTicks = null;
        // this.lastRowIndex = 0;
    }

    get hasReachedEnd() {
        return this.groupIndex >= this.instructionList.length;
    }

    get instructionList() {
        return this.song.data.instructions[this.groupName];
    }

    // getCurrentInstruction() {
    //     const data = this.instructionList[this.groupIndex];
    //     if (!data) {
    //         return null;
    //     }
    //     const instruction = new SongInstruction(data);
    //     instruction.index = this.groupIndex;
    //     instruction.positionInTicks = this.groupPositionInTicks;
    //     return instruction;
    // }

    // getCurrentInstructionRow() {
    //     const instructionRowList = [];
    //     let instruction, currentIndex = this.groupIndex;
    //     while (instruction = this.getInstruction(currentIndex, this.groupPositionInTicks)) {
    //         instructionRowList.push(instruction);
    //
    //         if (instruction.deltaDuration)
    //             break;
    //         currentIndex++;
    //     }
    //     return instructionRowList;
    // }

    // getInstruction(index, positionInTicks, throwException=true) {
    //     const data = this.instructionList[index];
    //     if (!data) {
    //         if (throwException)
    //             throw new Error("Instruction not found at index: " + index);
    //         return null;
    //     }
    //     const instruction = new SongInstruction(data);
    //     instruction.index = index;
    //     instruction.positionInTicks = positionInTicks;
    //     return instruction;
    // }

    // getInstructionRow(startIndex) {
    //     const instructionRowList = [];
    //     let instruction;
    //     while (instruction = this.getInstruction(startIndex, this.groupPositionInTicks)) {
    //         instructionRowList.push(instruction);
    //
    //         if (instruction.deltaDuration)
    //             break;
    //         startIndex++;
    //     }
    //     return instructionRowList;
    // }

    currentInstruction() {
        if (this.groupIndex === -1)
            return null;
        const data = this.instructionList[this.groupIndex];
        if (!data)
            return null;
        const instruction = new SongInstruction(data);
        instruction.index = this.groupIndex;
        instruction.positionInTicks = this.groupPositionInTicks;
        return instruction;
    }

    nextConditionalInstruction(conditionalCallback) {
        let nextInstruction;
        let deltaDurationInTicks = 0;
        while (nextInstruction = this.nextInstruction()) {
            deltaDurationInTicks += nextInstruction.deltaDuration;
            const ret = conditionalCallback(nextInstruction);
            if (ret !== true)
                continue;
            nextInstruction.deltaDuration = deltaDurationInTicks;
            return nextInstruction;
        }
        return null;
    }

    nextInstruction() {
        if (this.groupIndex >= this.instructionList.length)
            return null;

        this.groupIndex++;
        let currentInstruction = this.currentInstruction(); // new SongInstruction(this.instructionList[this.groupIndex]);
        if (currentInstruction) {
            this._incrementPositionBy(currentInstruction.deltaDuration, currentInstruction.duration);
            currentInstruction.positionInTicks = this.lastInstructionGroupPositionInTicks;
        }
        return currentInstruction;
    }

    scanAheadInstruction() {
        const index = this.groupIndex + 1;
        if (index >= this.instructionList.length)
            return null;
        const data = this.instructionList[index];
        const instruction = new SongInstruction(data);
        instruction.index = index;
        instruction.positionInTicks = this.lastInstructionGroupPositionInTicks + instruction.deltaDuration;
        return instruction;
    }


    nextInstructionRow(conditionalCallback = null) {
        let currentRowInstructionList = [];
        let nextInstruction = this.nextInstruction(); // Increment ahead for real
        if (!nextInstruction) {
            // If we found end of the group, we're done
            return null;
        }

        while (true) {

            if (!nextInstruction) {
                // If we found end of the group, we're done
                break;
            }
            // If not, add it to the list and check the next instruction
            currentRowInstructionList.push(nextInstruction);
            // if (nextInstruction.deltaDuration) {
            //     // If the next instruction has a delta, then we found the end of the current row
            //     break;
            // }

            nextInstruction = this.scanAheadInstruction();
            if (!nextInstruction || nextInstruction.deltaDuration) {
                break;
            }
            nextInstruction = this.nextInstruction(); // Increment ahead for real
        }

        if (conditionalCallback !== null) {
            currentRowInstructionList = currentRowInstructionList.filter(conditionalCallback);
            // if(currentRowInstructionList.length === 0) {
            //     return this.nextInstructionRow(conditionalCallback);
            // }
        }
        return currentRowInstructionList;
        // throw new Error("Recursion limit");
    }

    // TODO: refactor
    nextInstructionQuantizedRow(quantizationInTicks, maxLengthInTicks = null, conditionalCallback = null) {
        if (!quantizationInTicks)
            throw new Error("Invalid Quantization value: " + typeof quantizationInTicks);
        let nextInstruction = this.scanAheadInstruction();
        // const nextInstruction = new SongInstruction(this.instructionList[this.groupIndex + 1]);


        if (!nextInstruction) {
            // If we found end of the group, we're done, but first, check if we need to render more quantized rows
            if ((this.groupPositionInTicks < maxLengthInTicks)) { //
                this._incrementTo(this.nextQuantizationBreakInTicks);
                this.nextQuantizationBreakInTicks += quantizationInTicks;
                return [];
            }
            if (this.nextInstruction()) // Forward to the end of the array
                throw new Error("Shouldn't be a next instruction");
            // If we're truly at the end of all things, then return null
            return null;
        }

        // Calculate the next instruction position
        let nextInstructionPositionInTicks = nextInstruction.positionInTicks; // this.lastInstructionGroupPositionInTicks + nextInstruction.deltaDuration;
        if (nextInstructionPositionInTicks > maxLengthInTicks)
            maxLengthInTicks = nextInstructionPositionInTicks;

        // Skip quantization if equal to current position
        if (this.nextQuantizationBreakInTicks === nextInstructionPositionInTicks)
            this.nextQuantizationBreakInTicks += quantizationInTicks;

        // If the next rendered position is greater than the next break position
        if (
            nextInstructionPositionInTicks > this.nextQuantizationBreakInTicks && this.nextQuantizationBreakInTicks < maxLengthInTicks
        ) {
            this._incrementTo(this.nextQuantizationBreakInTicks);
            this.nextQuantizationBreakInTicks += quantizationInTicks;
            // Return an empty row
            return [];
        }

        return this.nextInstructionRow(conditionalCallback);
    }

    _incrementPositionBy(deltaDuration, instructionDuration) {

        // this.lastRowPositionInTicks = this.groupPositionInTicks;
        this.groupPositionInTicks = this.lastInstructionGroupPositionInTicks + deltaDuration;
        this.lastInstructionGroupPositionInTicks = this.groupPositionInTicks;

        const elapsedTime = (deltaDuration / this.timeDivision) / (this.currentBPM / 60);
        // this.lastRowPlaybackTime = this.groupPlaybackTime;
        this.groupPlaybackTime = this.lastInstructionGroupPlaybacktime + elapsedTime;
        this.lastInstructionGroupPlaybacktime = this.groupPlaybackTime;

        instructionDuration = instructionDuration || 0;
        const groupEndPositionInTicks = this.groupPositionInTicks + instructionDuration;
        if (groupEndPositionInTicks > this.groupEndPositionInTicks)
            this.groupEndPositionInTicks = groupEndPositionInTicks;
        const groupPlaybackEndTime = this.groupPlaybackTime + (instructionDuration / this.song.getTimeDivision()) / (this.currentBPM / 60);
        if (groupPlaybackEndTime > this.groupPlaybackEndTime)
            this.groupPlaybackEndTime = groupPlaybackEndTime;
    }

    _incrementTo(positionInTicks) {

        const elapsedTimeInTicks = positionInTicks - this.groupPositionInTicks; // nextInstructionPositionInTicks - nextBreakPositionInTicks;
        // Set the last rendered position as the next break position
        this.groupPositionInTicks = positionInTicks;
        const elapsedTimeInSeconds = (elapsedTimeInTicks / this.timeDivision) / (this.currentBPM / 60);
        this.groupPlaybackTime += elapsedTimeInSeconds;
    }

    // * [Symbol.iterator]() {
    //     // const instructionList = this.instructionList;
    //     let instruction;
    //     while (instruction = this.nextInstruction()) {
    //         yield instruction;
    //     }
    // }
}

export default SongInstructionIterator;
