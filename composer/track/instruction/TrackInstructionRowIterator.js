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

    // incrementPositionByDelta(deltaDurationTicks, callback = null) {
    //     // Skip quantized rows
    //     while(this.nextQuantizationBreakInTicks <= this.positionTicks)
    //         this.nextQuantizationBreakInTicks += this.quantizationTicks;
    //
    //     // Check for quantized rows
    //     while(this.nextQuantizationBreakInTicks < this.positionTicks + deltaDurationTicks) {
    //         const quantizedRowDelta = this.nextQuantizationBreakInTicks - this.positionTicks;
    //         deltaDurationTicks -= quantizedRowDelta;
    //         this.nextQuantizationBreakInTicks += this.quantizationTicks;
    //         super.incrementPositionByDelta(quantizedRowDelta, callback);
    //     }
    //
    //     return super.incrementPositionByDelta(deltaDurationTicks, callback);
    // }

    incrementPositionByDelta(deltaDurationTicks, callback = null) {
        super.incrementPositionByDelta(deltaDurationTicks, callback);

        // Update next quantized row position
        while(this.nextQuantizationBreakInTicks <= this.positionTicks)
            this.nextQuantizationBreakInTicks += this.quantizationTicks;
    }

    nextCursorPosition(callback=null) {
        this.cursorPosition++;

        if(!this.hasReachedEnd()) {
            // Seek ahead to next instruction
            let nextInstruction = this.getInstruction(this.currentIndex+1);
            const nextInstructionPositionTicks = this.lastInstructionPositionInTicks + nextInstruction.deltaDurationTicks;
            if(this.cursorPositionIsInstruction) {
                // If the current position is an instruction, and the next instruction has a delta, then end the row
                if(nextInstruction.deltaDurationTicks > 0) {
                    // Add cursor position for end of the row
                    this.cursorPositionIsInstruction = false;
                    if(nextInstructionPositionTicks <= this.nextQuantizationBreakInTicks)
                        return nextInstructionPositionTicks - this.positionTicks;
                    return this.nextQuantizationBreakInTicks - this.positionTicks;
                }
                // Return instruction
                return this.nextInstruction(callback);
            } else {
                // If the next instruction position is before the next quantization break, render it first
                if(nextInstructionPositionTicks <= this.nextQuantizationBreakInTicks) {
                    this.rowCount++;
                    this.cursorPositionIsInstruction = true;
                    // Return instruction
                    return this.nextInstruction(callback);
                }

                // Otherwise, render another quantization row
            }
        }

        // Render quantization row
        const quantizedRowDelta = this.nextQuantizationBreakInTicks - this.positionTicks;
        this.incrementPositionByDelta(quantizedRowDelta, callback);
        this.cursorPositionIsInstruction = false;
        this.rowCount++;
        return quantizedRowDelta;
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
