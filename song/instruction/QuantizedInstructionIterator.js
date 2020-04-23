import InstructionIterator from "./InstructionIterator";

export default class QuantizedInstructionIterator extends InstructionIterator {
    constructor(instructionList, quantizationTicks, timeDivision, bpm) {
        super(instructionList, timeDivision, bpm);
        if(!quantizationTicks)
            throw new Error("Invalid quantizationTicks");
        this.quantizationTicks = quantizationTicks;
        // Initiate quantization breaks
        this.nextQuantizationBreakInTicks = 0; // TODO: missing first quantization position
    }

    getNextInstructionPositionInTicks() {
        if(this.hasReachedEnd())
            return null;
        let instruction = this.getInstruction(this.currentIndex + 1);
        return instruction.deltaDurationTicks + this.lastInstructionPositionInTicks;
    }

    // getNextQuantizationBreaksInTicks() {
    //     // Catch up the quantization breaks
    //     const nextPositionTicks = this.getNextInstructionPositionInTicks();
    //     while(this.nextQuantizationBreakInTicks <= this.positionTicks)
    //         this.nextQuantizationBreakInTicks += this.quantizationTicks;
    //
    //     return this.nextQuantizationBreakInTicks;
    // }

    updateNextQuantizationBreakInTicks() {
        let nextPositionTicks = this.getNextInstructionPositionInTicks();
        if(nextPositionTicks < this.positionTicks)
            nextPositionTicks = this.positionTicks;
        while(this.nextQuantizationBreakInTicks <= nextPositionTicks)
            this.nextQuantizationBreakInTicks += this.quantizationTicks;
    }

    getNextRowPositionTicks() {
        const nextQuantizationBreakInTicks = this.nextQuantizationBreakInTicks;
        // const nextQuantizationBreakInTicks = this.getNextQuantizationBreaksInTicks();
        if(this.hasReachedEnd())
            return nextQuantizationBreakInTicks;
        // If there is a next instruction
        let instruction = this.getInstruction(this.currentIndex + 1);
        const nextPositionTicks = instruction.deltaDurationTicks + this.lastInstructionPositionInTicks;

        if(nextPositionTicks < nextQuantizationBreakInTicks)
            return nextPositionTicks;
        return nextQuantizationBreakInTicks;
    }


    nextQuantizedInstructionRow(rowCallback=null, instructionCallback=null) {
        // if(toPositionTicks !== null && this.positionTicks >= toPositionTicks)
        //     return null; // Reached the end

        const nextQuantizationBreakInTicks = this.nextQuantizationBreakInTicks;
        const doRow = () => {
            const elapsedTime = ((nextQuantizationBreakInTicks - this.positionTicks) / this.timeDivision) / (this.bpm / 60);
            this.positionSeconds += elapsedTime;
            this.positionTicks = nextQuantizationBreakInTicks;
            this.updateNextQuantizationBreakInTicks();
            // this.nextQuantizationBreakInTicks += this.quantizationTicks;
            const row = [];
            if(rowCallback)
                rowCallback(row);

            this.rowCount++;
            this.cursorPosition++;
            return row;
        };

        if(!this.hasReachedEnd()) {
            // If there is a next instruction
            const nextPositionTicks = this.getNextInstructionPositionInTicks();
            if (
                nextQuantizationBreakInTicks < nextPositionTicks) {
                // Next break comes before next instruction

                return doRow();
            }

            this.updateNextQuantizationBreakInTicks();
            // Return the next row
            return this.nextInstructionRow(rowCallback, instructionCallback);
        }

        // Render the next quantized row
        return doRow();
    }


    // nextQuantizedInstructionRow(quantizationTicks, toPositionTicks, rowCallback=null, instructionCallback=null) {
    //     // let nextQuantizationBreakInTicks = quantizationTicks;
    //     const instructionList = [];
    //     if(instructionCallback === null)
    //         instructionCallback = function(instruction) { return instruction };
    //
    //     // Scan ahead to next instruction
    //     let nextPositionTicks = this.positionTicks;
    //     if(!this.hasReachedEnd()) {
    //         let instruction = this.getInstruction(this.currentIndex + 1);
    //         nextPositionTicks += instruction.deltaDurationTicks;
    //     }
    //
    //     if(this.hasReachedEnd()) {
    //
    //     } else if(nextPositionTicks < this.nextQuantizationBreakInTicks) {
    //         // If next position is after next quantized break, return a blank row
    //         this.rowPositionTicks = this.nextQuantizationBreakInTicks;
    //         this.nextQuantizationBreakInTicks += this.quantizationTicks;
    //
    //     } else {
    //         // Increment instruction position
    //         this.nextInstruction();
    //
    //
    //         while (!this.hasReachedEnd()) {
    //             // Scan ahead to next instruction
    //             let instruction = this.getInstruction(this.currentIndex + 1);
    //
    //             // If the next instruction has a delta, then the current row ends
    //             if (!instruction || instruction.deltaDurationTicks > 0) {
    //                 // Finish rendering last row
    //                 break;
    //
    //                 // Move next quantized row up to current position
    //                 // while (this.nextQuantizationBreakInTicks <= currentRowPositionTicks)
    //                 //     this.nextQuantizationBreakInTicks += quantizationTicks;
    //
    //
    //             }
    //
    //             // Increment instruction position
    //             instruction = this.nextInstruction();
    //
    //             // Increment instruction cursor offset
    //             this.cursorOffset++;
    //             const ret = instructionCallback(instruction);
    //             if (ret !== null)
    //                 instructionList.push(ret);
    //         }
    //         this.rowPositionTicks = this.positionTicks;
    //     }
    //     this.rowCount++;
    //     this.cursorOffset++;
    //     return instructionList;
    //
    //
    // }

    /** Seeking **/

    seekToIndex(index, callback=null) {
        if (!Number.isInteger(index))
            throw new Error("Invalid seek index");
        while (true) {
            if (index === this.currentIndex)
                break;
            if (!this.nextInstruction(callback))
                break;
        }
    }

    seekToEnd(callback=null) {
        while (!this.hasReachedEnd())
            this.nextInstruction(callback);
    }

    seekToPosition(positionSeconds, callback=null) {
        while (!this.hasReachedEnd() && this.positionSeconds < positionSeconds) {
            this.nextInstruction(callback);
        }
    }

    seekToPositionTicks(positionTicks, callback=null) {
        while (!this.hasReachedEnd() && this.positionTicks < positionTicks) {
            this.nextInstruction(callback);
        }
    }
}



