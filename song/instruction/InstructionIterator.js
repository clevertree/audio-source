import Instruction from "./Instruction";

class InstructionIterator {
    constructor(instructionList, timeDivision, bpm) {
        this.instructions = instructionList;
        this.bpm = bpm;
        this.timeDivision = timeDivision;

        this.currentIndex = -1; // TODO: rename to index?
        this.positionTicks = 0;
        this.endPositionTicks = 0;
        this.positionSeconds = 0;
        this.endPositionSeconds = 0;
        this.lastInstructionPositionInTicks = 0;
        this.lastInstructionPositionInSeconds = 0;
        this.rowCount = 0;
        this.cursorPosition = 0;

        // this.nextQuantizationBreakInTicks = null;
        // this.stats = stats || {};

    }

    hasReachedEnd() {
        return this.currentIndex >= this.instructions.length - 1;
    }

    incrementPositionByInstruction(instruction, callback=null) {
        const deltaDurationTicks = instruction.deltaDurationTicks;
        this.positionTicks = this.lastInstructionPositionInTicks + deltaDurationTicks;
        this.lastInstructionPositionInTicks = this.positionTicks;

        const elapsedTime = (deltaDurationTicks / this.timeDivision) / (this.bpm / 60);
        this.positionSeconds = this.lastInstructionPositionInSeconds + elapsedTime;
        this.lastInstructionPositionInSeconds = this.positionSeconds;

        const durationTicks = instruction.durationTicks || 0;
        if(durationTicks) {

            const trackEndPositionInTicks = this.positionTicks + durationTicks;
            if (trackEndPositionInTicks > this.endPositionTicks)
                this.endPositionTicks = trackEndPositionInTicks;
            const trackPlaybackEndTime = this.positionSeconds + (durationTicks / this.timeDivision) / (this.bpm / 60);
            if (trackPlaybackEndTime > this.endPositionSeconds)
                this.endPositionSeconds = trackPlaybackEndTime;

        }
        if(callback)
            callback(instruction);
        this.cursorPosition++;

        // TODO: calculate bpm changes
    }

    getInstruction(index) {
        const instructionData = this.instructions[index];
        return Instruction.getInstruction(instructionData);
    }


    currentInstruction() {
        if (this.currentIndex === -1)
            throw new Error("Iterator has not been started");
        return this.getInstruction(this.currentIndex);
    }

    nextInstruction(callback=null) {
        if (this.hasReachedEnd())
            return null;

        this.currentIndex++;
        let currentInstruction = this.currentInstruction(); // new SongInstruction(this.instructionList[this.trackIndex]);
        this.incrementPositionByInstruction(currentInstruction, callback); // , currentInstruction.duration);
        return currentInstruction;
    }

    nextInstructionRow(rowCallback=null, instructionCallback=null) {
        if(this.hasReachedEnd())
            return null;

        const instructionList = [];
        while(true) {
            const instruction = this.nextInstruction(instructionCallback);
            // Add instruction to the list
            instructionList.push(instruction);

            if(this.hasReachedEnd())
                break;

            // Check next instruction
            const nextInstruction = this.getInstruction(this.currentIndex + 1);

            // If the next instruction has a delta, then the current row ends
            if (nextInstruction.deltaDurationTicks > 0) {
                // Finish last row
                break;
            }

            // Get next instruction
            // instruction = this.nextInstruction(instructionCallback);
        }

        if(rowCallback)
            rowCallback(instructionList);
        this.rowCount++;
        this.cursorPosition++;
        return instructionList;
    }


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

export default InstructionIterator;


