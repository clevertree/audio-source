import SongInstruction from "./SongInstruction";

class SongInstructionIterator {
    constructor(song, groupName, stats={}) {
        if (!song.data.instructions[groupName])
            throw new Error("Song group not found: " + groupName);

        this.song = song;
        this.groupName = groupName;
        // this.nextIndex = 0;
        this.currentIndex = -1;
        this.positionTicks = 0;
        this.endPositionTicks = 0;
        this.positionSeconds = 0;
        this.endPositionSeconds = 0;
        this.lastInstructionPositionInTicks = 0;
        this.lastInstructionPositionInSeconds = 0;

        this.instructionList = song.data.instructions[groupName];
        this.stats = Object.assign({
            bpm: song.getStartingBeatsPerMinute(),
            timeDivision: song.getStartingBeatsPerMinute(),
        }, stats);
        this.nextQuantizationBreakInTicks = 0;
        // this.lastInstructionGroupPositionInTicks = 0;

    }

    hasReachedEnd() {
        return this.currentIndex >= this.instructionList.length-1;
    }

    incrementPositionByInstruction(instruction) {
        const deltaDuration = instruction.deltaDuration;
        this.positionTicks = this.lastInstructionPositionInTicks + deltaDuration;
        this.lastInstructionPositionInTicks = this.positionTicks;

        const elapsedTime = (deltaDuration / this.stats.timeDivision) / (this.stats.bpm / 60);
        this.positionSeconds = this.lastInstructionPositionInSeconds + elapsedTime;
        this.lastInstructionPositionInSeconds = this.positionSeconds;

        const groupEndPositionInTicks = this.positionTicks + instruction.duration;
        if (groupEndPositionInTicks > this.endPositionTicks)
            this.endPositionTicks = groupEndPositionInTicks;
        const groupPlaybackEndTime = this.positionSeconds + (instruction.duration / this.stats.timeDivision) / (this.stats.bpm / 60);
        if (groupPlaybackEndTime > this.endPositionSeconds)
            this.endPositionSeconds = groupPlaybackEndTime;
    }

    incrementPositionTo(positionInTicks) {
        const elapsedTimeInTicks = positionInTicks - this.positionTicks; // nextInstructionPositionInTicks - nextBreakPositionInTicks;
        this.positionTicks = positionInTicks;
        const elapsedTimeInSeconds = (elapsedTimeInTicks / this.stats.timeDivision) / (this.stats.bpm / 60);
        this.positionSeconds += elapsedTimeInSeconds;
    }


    getInstruction(index) {
        return index >= this.instructionList.length ? null : new SongInstruction(this.instructionList[index]);
    }

    currentInstruction() {
        if(this.currentIndex === -1)
            throw new Error("Iterator has not been started");
        return this.getInstruction(this.currentIndex);
    }

    nextInstruction() {
        if (this.hasReachedEnd())
            return null;

        this.currentIndex++;
        let currentInstruction = this.currentInstruction(); // new SongInstruction(this.instructionList[this.groupIndex]);
        this.incrementPositionByInstruction(currentInstruction); // , currentInstruction.duration);
        return currentInstruction;
    }

    seekToIndex(index) {
        if(!Number.isInteger(index))
            throw new Error("Invalid seek index");
        while(true) {
            if(index === this.currentIndex)
                break;
            if(!this.nextInstruction())
                break;
        }
        return this;
    }

    seekToEnd() {
        while (!this.hasReachedEnd() && this.nextInstruction()) {}
        return this;
    }

    // nextQuantizedInstruction(quantizationInTicks, maxLengthInTicks) {
    //     if (this.hasReachedEnd())
    //         return null;
    //
    //
    //     const scanAheadInstruction = this.getInstruction(this.groupIndex+1);
    //     // If we found end of the group, we're done, but first, check if we need to render more quantized rows
    //     if (!scanAheadInstruction) {
    //         if (this.nextInstruction()) // Forward to the end of the array
    //             throw new Error("Shouldn't be a next instruction");
    //
    //         // If we found end of the group, we're done, but first, check if we need to render more quantized rows
    //         if ((this.positionTicks < maxLengthInTicks)) { //
    //             this.incrementPositionTo(this.nextQuantizationBreakInTicks);
    //             this.nextQuantizationBreakInTicks += quantizationInTicks;
    //             return [];
    //         }
    //         // If we're truly at the end of all things, then return null
    //         return null;
    //     }
    //
    //     // Calculate the next instruction position
    //     let nextInstructionPositionInTicks = this.positionTicks + scanAheadInstruction.deltaDuration; // this.lastInstructionGroupPositionInTicks + nextInstruction.deltaDuration;
    //     if (nextInstructionPositionInTicks > maxLengthInTicks)
    //         maxLengthInTicks = nextInstructionPositionInTicks;
    //
    //     // Skip quantization if equal to current position
    //     while (this.nextQuantizationBreakInTicks === nextInstructionPositionInTicks)
    //         this.nextQuantizationBreakInTicks += quantizationInTicks;
    //
    //     // If the next rendered position is greater than the next break position
    //     if (
    //         nextInstructionPositionInTicks > this.nextQuantizationBreakInTicks
    //         && this.nextQuantizationBreakInTicks < maxLengthInTicks
    //     ) {
    //         this.incrementPositionTo(this.nextQuantizationBreakInTicks);
    //         this.nextQuantizationBreakInTicks += quantizationInTicks;
    //         // Return an empty row
    //         return [];
    //     }
    //
    //     // We know there's a next instruction before the next quantization, so return it
    //     return this.nextInstruction();
    // }

    nextInstructionRow(conditionalCallback = null) {
        let currentRowInstructionList = [];
        let nextInstruction = this.nextInstruction(); // Increment ahead for real
        if (!nextInstruction) {
            // If we found end of the group, we're done
            return null;
        }

        while (nextInstruction) {

            // If not, add it to the list and check the next instruction
            if(!conditionalCallback || conditionalCallback(nextInstruction) === true)
                currentRowInstructionList.push(nextInstruction);

            const scanAheadInstruction = this.getInstruction(this.currentIndex+1);
            if (!scanAheadInstruction || scanAheadInstruction.deltaDuration) {
                // If there's no next instruction, or the next instruction has a delta duration, then this row ends.
                break;
            }
            nextInstruction = this.nextInstruction(); // Increment ahead for real
        }

        return currentRowInstructionList;
    }


    nextInstructionQuantizedRow(quantizationInTicks, maxLengthInTicks = null, conditionalCallback = null) {
        if (!quantizationInTicks)
            throw new Error("Invalid Quantization value: " + typeof quantizationInTicks);

        const scanAheadInstruction = this.getInstruction(this.currentIndex+1);
        // const nextInstruction = new SongInstruction(this.instructionList[this.groupIndex + 1]);


        if (!scanAheadInstruction) {
            if (this.nextInstruction()) // Forward to the end of the array
                throw new Error("Shouldn't be a next instruction");

            // If we found end of the group, we're done, but first, check if we need to render more quantized rows
            if ((this.positionTicks < maxLengthInTicks)) { //
                this.incrementPositionTo(this.nextQuantizationBreakInTicks);
                this.nextQuantizationBreakInTicks += quantizationInTicks;
                return [];
            }
            // If we're truly at the end of all things, then return null
            return null;
        }

        // Calculate the next instruction position
        let nextInstructionPositionInTicks = this.lastInstructionPositionInTicks + scanAheadInstruction.deltaDuration; // this.lastInstructionGroupPositionInTicks + nextInstruction.deltaDuration;
        if (nextInstructionPositionInTicks > maxLengthInTicks)
            maxLengthInTicks = nextInstructionPositionInTicks;

        // Skip quantization if equal to current position
        if (this.nextQuantizationBreakInTicks === nextInstructionPositionInTicks)
            this.nextQuantizationBreakInTicks += quantizationInTicks;

        // If the next rendered position is greater than the next break position
        if (
            nextInstructionPositionInTicks > this.nextQuantizationBreakInTicks
            && this.nextQuantizationBreakInTicks < maxLengthInTicks
        ) {
            this.incrementPositionTo(this.nextQuantizationBreakInTicks);
            this.nextQuantizationBreakInTicks += quantizationInTicks;
            // Return an empty row
            return [];
        }

        return this.nextInstructionRow(conditionalCallback);
    }

    // nextConditionalInstruction(conditionalCallback) {
    //     let nextInstruction;
    //     let deltaDurationInTicks = 0;
    //
    //     while (nextInstruction = this.nextInstruction()) {
    //         deltaDurationInTicks += nextInstruction.deltaDuration;
    //         const ret = conditionalCallback(nextInstruction);
    //         if (ret !== true)
    //             continue;
    //         nextInstruction.deltaDuration = deltaDurationInTicks;
    //         return nextInstruction;
    //     }
    //     return null;
    // }


}

// class SongInstructionIterator2 {
//     constructor(song, groupName, currentBPM = null, groupPositionInTicks = 0) {
//         if (!song.data.instructions[groupName])
//             throw new Error("Song group not found: " + groupName);
//
//         this.song = song;
//         this.groupName = groupName;
//         this.stats.bpm = currentBPM || song.getStartingBeatsPerMinute();
//         this.stats.timeDivision = song.getTimeDivision();
//         this.groupIndex = -1;
//
//         // this.lastRowPositionInTicks = 0;
//         // this.lastRowPlaybackTime = 0;
//         this.positionTicks = groupPositionInTicks;
//         this.lastDeltaDuration = 0;
//         this.groupEndPositionInTicks = groupPositionInTicks;
//         this.lastInstructionGroupPositionInTicks = groupPositionInTicks;
//
//         this.groupPlaybackTime = 0;
//         this.groupPlaybackEndTime = 0;
//         this.lastInstructionGroupPlaybacktime = 0;
//
//
//         this.nextQuantizationBreakInTicks = 0;
//
//
//         // this.lastRowPositionInTicks = null;
//         // this.lastRowIndex = 0;
//     }
//
//     get hasReachedEnd() {
//         return this.groupIndex >= this.instructionList.length;
//     }
//
//
//     currentInstruction() {
//         if (this.groupIndex === -1)
//             return null;
//         const data = this.instructionList[this.groupIndex];
//         if (!data)
//             return null;
//         const instruction = new SongInstruction(data);
//         instruction.index = this.groupIndex;
//         instruction.positionInTicks = this.positionTicks;
//         return instruction;
//     }
//
//     nextConditionalInstruction(conditionalCallback) {
//         let nextInstruction;
//         let deltaDurationInTicks = 0;
//         while (nextInstruction = this.nextInstruction()) {
//             deltaDurationInTicks += nextInstruction.deltaDuration;
//             const ret = conditionalCallback(nextInstruction);
//             if (ret !== true)
//                 continue;
//             nextInstruction.deltaDuration = deltaDurationInTicks;
//             return nextInstruction;
//         }
//         return null;
//     }
//
//     nextInstruction() {
//         if (this.groupIndex >= this.instructionList.length)
//             return null;
//
//         this.groupIndex++;
//         let currentInstruction = this.currentInstruction(); // new SongInstruction(this.instructionList[this.groupIndex]);
//         if (currentInstruction) {
//             this._incrementPositionBy(currentInstruction.deltaDuration, currentInstruction.duration);
//             currentInstruction.positionInTicks = this.lastInstructionGroupPositionInTicks;
//         }
//         return currentInstruction;
//     }
//
//     scanAheadInstruction() {
//         const index = this.groupIndex + 1;
//         if (index >= this.instructionList.length)
//             return null;
//         const data = this.instructionList[index];
//         const instruction = new SongInstruction(data);
//         instruction.index = index;
//         instruction.positionInTicks = this.lastInstructionGroupPositionInTicks + instruction.deltaDuration;
//         return instruction;
//     }
//
//
//     nextInstructionRow(conditionalCallback = null) {
//         let currentRowInstructionList = [];
//         let nextInstruction = this.nextInstruction(); // Increment ahead for real
//         if (!nextInstruction) {
//             // If we found end of the group, we're done
//             return null;
//         }
//
//         while (true) {
//
//             if (!nextInstruction) {
//                 // If we found end of the group, we're done
//                 break;
//             }
//             // If not, add it to the list and check the next instruction
//             currentRowInstructionList.push(nextInstruction);
//             // if (nextInstruction.deltaDuration) {
//             //     // If the next instruction has a delta, then we found the end of the current row
//             //     break;
//             // }
//
//             nextInstruction = this.scanAheadInstruction();
//             if (!nextInstruction || nextInstruction.deltaDuration) {
//                 break;
//             }
//             nextInstruction = this.nextInstruction(); // Increment ahead for real
//         }
//
//         if (conditionalCallback !== null) {
//             currentRowInstructionList = currentRowInstructionList.filter(conditionalCallback);
//             // if(currentRowInstructionList.length === 0) {
//             //     return this.nextInstructionRow(conditionalCallback);
//             // }
//         }
//         return currentRowInstructionList;
//         // throw new Error("Recursion limit");
//     }
//
//     // TODO: refactor
//     nextInstructionQuantizedRow(quantizationInTicks, maxLengthInTicks = null, conditionalCallback = null) {
//         if (!quantizationInTicks)
//             throw new Error("Invalid Quantization value: " + typeof quantizationInTicks);
//         let nextInstruction = this.scanAheadInstruction();
//         // const nextInstruction = new SongInstruction(this.instructionList[this.groupIndex + 1]);
//
//
//         if (!nextInstruction) {
//             // If we found end of the group, we're done, but first, check if we need to render more quantized rows
//             if ((this.positionTicks < maxLengthInTicks)) { //
//                 this._incrementTo(this.nextQuantizationBreakInTicks);
//                 this.nextQuantizationBreakInTicks += quantizationInTicks;
//                 return [];
//             }
//             if (this.nextInstruction()) // Forward to the end of the array
//                 throw new Error("Shouldn't be a next instruction");
//             // If we're truly at the end of all things, then return null
//             return null;
//         }
//
//         // Calculate the next instruction position
//         let nextInstructionPositionInTicks = nextInstruction.positionInTicks; // this.lastInstructionGroupPositionInTicks + nextInstruction.deltaDuration;
//         if (nextInstructionPositionInTicks > maxLengthInTicks)
//             maxLengthInTicks = nextInstructionPositionInTicks;
//
//         // Skip quantization if equal to current position
//         if (this.nextQuantizationBreakInTicks === nextInstructionPositionInTicks)
//             this.nextQuantizationBreakInTicks += quantizationInTicks;
//
//         // If the next rendered position is greater than the next break position
//         if (
//             nextInstructionPositionInTicks > this.nextQuantizationBreakInTicks && this.nextQuantizationBreakInTicks < maxLengthInTicks
//         ) {
//             this._incrementTo(this.nextQuantizationBreakInTicks);
//             this.nextQuantizationBreakInTicks += quantizationInTicks;
//             // Return an empty row
//             return [];
//         }
//
//         return this.nextInstructionRow(conditionalCallback);
//     }
//
//     _incrementPositionBy(deltaDuration, instructionDuration) {
//
//         // this.lastRowPositionInTicks = this.positionTicks;
//         this.positionTicks = this.lastInstructionGroupPositionInTicks + deltaDuration;
//         this.lastInstructionGroupPositionInTicks = this.positionTicks;
//
//         const elapsedTime = (deltaDuration / this.stats.timeDivision) / (this.stats.bpm / 60);
//         // this.lastRowPlaybackTime = this.groupPlaybackTime;
//         this.groupPlaybackTime = this.lastInstructionGroupPlaybacktime + elapsedTime;
//         this.lastInstructionGroupPlaybacktime = this.groupPlaybackTime;
//
//         instructionDuration = instructionDuration || 0;
//         const groupEndPositionInTicks = this.positionTicks + instructionDuration;
//         if (groupEndPositionInTicks > this.groupEndPositionInTicks)
//             this.groupEndPositionInTicks = groupEndPositionInTicks;
//         const groupPlaybackEndTime = this.groupPlaybackTime + (instructionDuration / this.song.getTimeDivision()) / (this.stats.bpm / 60);
//         if (groupPlaybackEndTime > this.groupPlaybackEndTime)
//             this.groupPlaybackEndTime = groupPlaybackEndTime;
//     }
//
//     _incrementTo(positionInTicks) {
//
//         const elapsedTimeInTicks = positionInTicks - this.positionTicks; // nextInstructionPositionInTicks - nextBreakPositionInTicks;
//         // Set the last rendered position as the next break position
//         this.positionTicks = positionInTicks;
//         const elapsedTimeInSeconds = (elapsedTimeInTicks / this.stats.timeDivision) / (this.stats.bpm / 60);
//         this.groupPlaybackTime += elapsedTimeInSeconds;
//     }
//
//     // * [Symbol.iterator]() {
//     //     // const instructionList = this.instructionList;
//     //     let instruction;
//     //     while (instruction = this.nextInstruction()) {
//     //         yield instruction;
//     //     }
//     // }
// }

export default SongInstructionIterator;
