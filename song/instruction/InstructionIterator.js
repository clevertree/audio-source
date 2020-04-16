import Instruction from "./Instruction";

class InstructionIterator {
    constructor(instructionList, timeDivision, bpm) {
        this.instructions = instructionList;
        this.bpm = bpm;
        this.timeDivision = timeDivision;

        this.currentIndex = -1;
        this.positionTicks = 0;
        this.endPositionTicks = 0;
        this.positionSeconds = 0;
        this.endPositionSeconds = 0;
        this.lastInstructionPositionInTicks = 0;
        this.lastInstructionPositionInSeconds = 0;

        // this.stats = stats || {};

    }

    hasReachedEnd() {
        return this.currentIndex >= this.instructions.length - 1;
    }

    incrementPositionByInstruction(instruction) {
        const deltaDurationTicks = instruction.deltaDurationTicks;
        this.positionTicks = this.lastInstructionPositionInTicks + deltaDurationTicks;
        this.lastInstructionPositionInTicks = this.positionTicks;

        const elapsedTime = (deltaDurationTicks / this.timeDivision) / (this.bpm / 60);
        this.positionSeconds = this.lastInstructionPositionInSeconds + elapsedTime;
        this.lastInstructionPositionInSeconds = this.positionSeconds;

        const durationTicks = instruction.durationTicks || 0;
        const trackEndPositionInTicks = this.positionTicks + durationTicks;
        if (trackEndPositionInTicks > this.endPositionTicks)
            this.endPositionTicks = trackEndPositionInTicks;
        const trackPlaybackEndTime = this.positionSeconds + (durationTicks / this.timeDivision) / (this.bpm / 60);
        if (trackPlaybackEndTime > this.endPositionSeconds)
            this.endPositionSeconds = trackPlaybackEndTime;

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
        this.incrementPositionByInstruction(currentInstruction); // , currentInstruction.duration);
        if(callback)
            callback(currentInstruction);
        return currentInstruction;
    }

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
