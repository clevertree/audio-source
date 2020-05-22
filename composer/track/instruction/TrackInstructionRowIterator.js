import {InstructionIterator} from "../../../song";


export default class TrackInstructionRowIterator extends InstructionIterator {
    constructor(instructionList, timeDivision, beatsPerMinute, quantizationTicks) {
        super(instructionList, timeDivision, beatsPerMinute);


        this.nextQuantizationBreakInTicks = 0;
        this.quantizationTicks = quantizationTicks;
        this.rowCount = 0;
        this.cursorPosition = -1;
        this.cursorPositionIsInstruction = true;
    }
    //
    // incrementPositionByDelta(deltaDurationTicks, callback = null) {
    //     super.incrementPositionByDelta(deltaDurationTicks, callback);
    //
    // }

    nextCursorPosition() {
        this.cursorPosition++;

        let nextInstruction=null, nextInstructionPositionTicks=null;
        if(!this.hasReachedEnd()) {
            nextInstruction = this.getInstruction(this.currentIndex + 1);
            nextInstructionPositionTicks = this.lastInstructionPositionInTicks + nextInstruction.deltaDurationTicks;
        }


        // Update next quantized row position //TODO: if cursorPosition === 0
        while(this.nextQuantizationBreakInTicks <= this.positionTicks)
            this.nextQuantizationBreakInTicks += this.quantizationTicks;

        if(this.cursorPositionIsInstruction) {
            // Collect instructions
            // let nextInstructionPositionTicks = null;
            if (nextInstruction) {
                // Seek ahead to next instruction

                // If next instruction occurs before next quantization break
                if (nextInstruction.deltaDurationTicks <= 0) {
                    // and instruction has no delta duration, then return it
                    return this.nextInstruction();
                }

                // let nextInstruction = this.getInstruction(this.currentIndex + 1);
                // nextInstructionPositionTicks = this.lastInstructionPositionInTicks + nextInstruction.deltaDurationTicks;
                if (nextInstructionPositionTicks <= this.nextQuantizationBreakInTicks) {
                    // End the current row by returning the new delta difference
                    this.cursorPositionIsInstruction = false;
                    return nextInstructionPositionTicks - this.positionTicks;
                }
            }

            // End the current row by returning the quantized delta difference
            this.cursorPositionIsInstruction = false;
            return this.nextQuantizationBreakInTicks - this.positionTicks;

        } else {
            // Start a new row
            this.rowCount++;
            // If we haven't reached the end,
            if (nextInstruction) {
                // let nextInstruction = this.nextInstruction();
                if (nextInstructionPositionTicks <= this.nextQuantizationBreakInTicks) {
                    if (nextInstruction.deltaDurationTicks === 0) {
                        console.error("New row instruction should not have a zero delta")
                    }
                    // if(!this.hasReachedEnd())
                    this.cursorPositionIsInstruction = true;
                    return this.nextInstruction();
                }
            }

            // End the current row by returning the quantized delta difference
            let rowDeltaTicks = this.nextQuantizationBreakInTicks - this.positionTicks;
            this.nextQuantizationBreakInTicks += this.quantizationTicks;
            // if(nextInstructionPositionTicks !== null && nextInstructionPositionTicks < this.nextQuantizationBreakInTicks)
            //     rowDeltaTicks = nextInstructionPositionTicks - this.positionTicks;
            this.incrementPositionByDelta(rowDeltaTicks);
            return rowDeltaTicks;
        }
        //
        // if(this.cursorPositionIsInstruction) {
        //     // If the current position is an instruction, and the next instruction has a delta, then end the row
        //     if(nextInstruction.deltaDurationTicks > 0) {
        //         // Add cursor position for end of the row
        //         this.cursorPositionIsInstruction = false;
        //         // If next instruction occurs before next quantization break, return it's position
        //         if(nextInstructionPositionTicks <= this.nextQuantizationBreakInTicks)
        //             return nextInstructionPositionTicks - this.positionTicks;
        //
        //         // Render quantization row
        //         // const quantizedRowDelta = this.nextQuantizationBreakInTicks - this.positionTicks;
        //         if(this.positionTicks === 0) {
        //             this.nextQuantizationBreakInTicks += this.quantizationTicks;
        //             if (nextInstructionPositionTicks <= this.nextQuantizationBreakInTicks)
        //                 return nextInstructionPositionTicks - this.positionTicks;
        //         }
        //         return this.nextQuantizationBreakInTicks - this.positionTicks;
        //         // this.incrementPositionByDelta(quantizedRowDelta, callback);
        //         // this.rowCount++;
        //         // return quantizedRowDelta;
        //     }
        //     // Return instruction
        //     return this.nextInstruction(callback);
        // } else {
        //     // If the next instruction position is before the next quantization break, render it first
        //     if(nextInstructionPositionTicks <= this.nextQuantizationBreakInTicks) {
        //         this.rowCount++;
        //         this.cursorPositionIsInstruction = true;
        //         // Return instruction
        //         return this.nextInstruction(callback);
        //     }
        //
        //     // Otherwise, render another quantization row ..
        //     const quantizedRowDelta = (this.positionTicks === 0)
        //         ? (this.nextQuantizationBreakInTicks + this.quantizationTicks)
        //         : (this.nextQuantizationBreakInTicks - this.positionTicks);
        //     this.incrementPositionByDelta(quantizedRowDelta, callback);
        //     this.cursorPositionIsInstruction = false;
        //     this.rowCount++;
        //     return quantizedRowDelta;
        // }

    }

    nextRowPosition(callback=null) {
        // TODO:
    }






    // seekToNextOffset(callback) {
    //     if(!this.hasReachedEnd()) {
    //         this.nextInstruction(callback);
    //     } else {
    //         this.incrementPositionByQuantizedDelta();
    //     }
    // }

    seekToCursorOffset(cursorOffset) {

    }

    seekToRowOffset(rowOffset) {
        while(this.rowCount < rowOffset) {

        }
    }

    /** Static **/

    static getIteratorFromSong(song, trackName, quantizationTicks, timeDivision=null, beatsPerMinute=null) {
        const songData = song.getProxiedData();
        if(!songData.tracks[trackName])
            throw new Error("Invalid instruction track: " + trackName);
        const instructionList = songData.tracks[trackName];

        return new TrackInstructionRowIterator(
            instructionList,
            timeDivision || songData.timeDivision,
            beatsPerMinute || songData.beatsPerMinute,
            quantizationTicks
        )
    }
}
