import {InstructionIterator} from "../../../song";
// import Instruction from "../../../song/instruction/Instruction";

// TODO: Flaw: instructionIterator might seek on it's own.

export default class TrackInstructionRowIterator {
    constructor(instructionIterator, quantizationTicks=null) {
        this.iterator = instructionIterator;
        const stats = this.iterator.stats;
        if(quantizationTicks)
            stats.quantizationTicks = quantizationTicks;
        stats.nextQuantizationBreakInTicks = 0;

        stats.cursorPosition = 0;
        stats.rowCount = 0;



        // this.rowCount = 0;
        // this.cursorPosition = 0;
        this.generator = this.run();
    }


    getPositionInTicks() { return this.iterator.getPositionInTicks(); }
    getPositionInSeconds() { return this.iterator.getPositionInSeconds(); }
    getCursorPosition() { return this.iterator.stats.cursorPosition; }
    getIndex() { return this.iterator.getIndex(); }
    getRowCount() { return this.iterator.stats.rowCount; }

    updateNextQuantizationBreakInTicks() {
        let currentPositionTicks = this.iterator.getPositionInTicks();
        const stats = this.iterator.stats;
        while(stats.nextQuantizationBreakInTicks <= currentPositionTicks)
            stats.nextQuantizationBreakInTicks += stats.quantizationTicks;
    }

    * run() {
        const stats = this.iterator.stats;
        while(!this.iterator.hasReachedEnd()) {
            let currentPositionTicks = stats.positionTicks;

            let nextInstructionData = this.iterator.getInstructionData(stats.currentIndex + 1);
            let nextInstructionPositionTicks = stats.lastInstructionPositionInTicks + nextInstructionData[0];
            while(stats.nextQuantizationBreakInTicks < nextInstructionPositionTicks) {
                let rowDeltaTicks = stats.nextQuantizationBreakInTicks - currentPositionTicks;
                // if(currentPositionTicks === 0 && rowDeltaTicks === 0) {
                //     rowDeltaTicks = this.quantizationTicks;
                // }
                // if(rowDeltaTicks < 0)
                //     throw new Error("Invalid row delta: " + rowDeltaTicks);
                stats.nextQuantizationBreakInTicks += stats.quantizationTicks;
                if(rowDeltaTicks > 0) {
                    yield rowDeltaTicks;

                    // Increment by quantized row after yielding the row delta
                    this.iterator.incrementPositionByDelta(rowDeltaTicks);
                    stats.cursorPosition++;
                    stats.rowCount++;
                    currentPositionTicks = stats.positionTicks;
                }
            }

            const rowDeltaTicks = nextInstructionPositionTicks - currentPositionTicks;
            if(rowDeltaTicks > 0) {
                // Bring iterator to the next instruction position, and end the last row
                this.updateNextQuantizationBreakInTicks();
                yield rowDeltaTicks;
                stats.cursorPosition++;
                stats.rowCount++;
            }

            // Increment by instruction
            nextInstructionData = this.iterator.nextInstructionData();

            yield nextInstructionData;
            stats.cursorPosition++;
        }

        this.updateNextQuantizationBreakInTicks();
        for(let i=0; i<99999; i++) {
            const currentPositionTicks = this.iterator.getPositionInTicks();
            const rowDeltaTicks = stats.nextQuantizationBreakInTicks - currentPositionTicks;
            if(rowDeltaTicks <= 0 || rowDeltaTicks > stats.quantizationTicks)
                throw new Error("Invalid row delta");
            stats.nextQuantizationBreakInTicks += stats.quantizationTicks;
            yield rowDeltaTicks;
            this.iterator.incrementPositionByDelta(rowDeltaTicks);
            stats.cursorPosition++;
            stats.rowCount++;
        }
        throw new Error("Row limit");
    }

    nextCursorPosition() {
        return this.generator.next().value;
    }

    nextRowPosition(callback=null) {
        // TODO:
    }





    seekToPositionTicks(positionTicks, callback=null) {
        while (this.iterator.getPositionInTicks() < positionTicks) {
            this.nextCursorPosition();
        }
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
        const stats = this.iterator.stats;
        while(stats.rowCount < rowOffset) {

        }
    }

    /** Iterator **/

    [Symbol.iterator]() { return this.generator; }

    /** Static **/

    static getIteratorFromSong(song, trackName, stats={}, instructionCallback=null) {
        const instructionIterator = InstructionIterator.getIteratorFromSong(song, trackName, stats, instructionCallback);
        if(!stats.quantizationTicks)
            stats.quantizationTicks = stats.timeDivision;
        return new TrackInstructionRowIterator(
            instructionIterator,
        )
    }
}
