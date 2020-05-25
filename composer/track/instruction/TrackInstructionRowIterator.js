import {InstructionIterator} from "../../../song";
// import Instruction from "../../../song/instruction/Instruction";

export default class TrackInstructionRowIterator {
    constructor(instructionIterator, quantizationTicks) {
        this.iterator = instructionIterator;
        this.quantizationTicks = quantizationTicks;


        this.nextQuantizationBreakInTicks = 0;
        this.rowCount = 0;
        this.cursorPosition = 0;
        this.generator = this.run();
    }


    getPositionInTicks() { return this.iterator.getPositionInTicks(); }
    getPositionInSeconds() { return this.iterator.getPositionInSeconds(); }
    getCursorPosition() { return this.cursorPosition; }
    getIndex() { return this.iterator.getIndex(); }
    getRowCount() { return this.rowCount; }

    updateNextQuantizationBreakInTicks() {
        let currentPositionTicks = this.iterator.getPositionInTicks();
        while(this.nextQuantizationBreakInTicks <= currentPositionTicks)
            this.nextQuantizationBreakInTicks += this.quantizationTicks;
    }

    * run() {
        while(!this.iterator.hasReachedEnd()) {
            let currentPositionTicks = this.iterator.getPositionInTicks();

            let nextInstruction = this.iterator.getInstruction(this.iterator.currentIndex + 1);
            let nextInstructionPositionTicks = this.iterator.lastInstructionPositionInTicks + nextInstruction.deltaDurationTicks;
            while(this.nextQuantizationBreakInTicks < nextInstructionPositionTicks) {
                let rowDeltaTicks = this.nextQuantizationBreakInTicks - currentPositionTicks;
                // if(currentPositionTicks === 0 && rowDeltaTicks === 0) {
                //     rowDeltaTicks = this.quantizationTicks;
                // }
                // if(rowDeltaTicks < 0)
                //     throw new Error("Invalid row delta: " + rowDeltaTicks);
                this.nextQuantizationBreakInTicks += this.quantizationTicks;
                if(rowDeltaTicks > 0) {
                    yield rowDeltaTicks;

                    // Increment by quantized row after yielding the row delta
                    this.iterator.incrementPositionByDelta(rowDeltaTicks);
                    this.cursorPosition++;
                    this.rowCount++;
                    currentPositionTicks = this.iterator.getPositionInTicks();
                }
            }

            if(nextInstruction.deltaDurationTicks > 0) {
                // End the current row
                const rowDeltaTicks = nextInstructionPositionTicks - currentPositionTicks;
                if(rowDeltaTicks <= 0)
                    throw new Error("Invalid row delta: " + rowDeltaTicks);
                this.updateNextQuantizationBreakInTicks();
                yield rowDeltaTicks;

                // End the current row after yielding the row delta
                nextInstruction = this.iterator.nextInstruction();
                this.cursorPosition++;
                this.rowCount++;
            } else {
                nextInstruction = this.iterator.nextInstruction();
            }

            // Increment by instruction
            yield nextInstruction;
            this.cursorPosition++;
        }

        this.updateNextQuantizationBreakInTicks();
        while(true) {
            const currentPositionTicks = this.iterator.getPositionInTicks();
            const rowDeltaTicks = this.nextQuantizationBreakInTicks - currentPositionTicks;
            if(rowDeltaTicks <= 0 || rowDeltaTicks > this.quantizationTicks)
                throw new Error("Invalid row delta");
            this.nextQuantizationBreakInTicks += this.quantizationTicks;
            yield rowDeltaTicks;
            this.iterator.incrementPositionByDelta(rowDeltaTicks);
            this.cursorPosition++;
            this.rowCount++;
        }
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
        while(this.rowCount < rowOffset) {

        }
    }

    /** Iterator **/

    [Symbol.iterator]() { return this.generator; }

    /** Static **/

    static getIteratorFromSong(song, trackName, quantizationTicks, timeDivision=null, beatsPerMinute=null) {
        const songData = song.getProxiedData();
        if(!songData.tracks[trackName])
            throw new Error("Invalid instruction track: " + trackName);
        const instructionList = songData.tracks[trackName];

        const instructionIterator = new InstructionIterator(
            instructionList,
            timeDivision || songData.timeDivision,
            beatsPerMinute || songData.beatsPerMinute,
        )
        return new TrackInstructionRowIterator(
            instructionIterator,
            quantizationTicks
        )
    }
}
