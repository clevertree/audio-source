import Instruction from "./Instruction";
import {InstructionList} from "./InstructionList";

class InstructionIterator extends InstructionList {
    constructor(instructionList, stats = null) {
        super(instructionList);
        this.currentIndex = -1;
        this.positionTicks = 0;
        this.endPositionTicks = 0;
        this.positionSeconds = 0;
        this.endPositionSeconds = 0;
        this.lastInstructionPositionInTicks = 0;
        this.lastInstructionPositionInSeconds = 0;

        this.stats = stats || {};
        this.instrumentID = 0;

    }

    hasReachedEnd() {
        return this.currentIndex >= this.instructionList.length - 1;
    }

    incrementPositionByInstruction(instruction) {
        const deltaDuration = instruction.deltaDurationInTicks;
        this.positionTicks = this.lastInstructionPositionInTicks + deltaDuration;
        this.lastInstructionPositionInTicks = this.positionTicks;

        const elapsedTime = (deltaDuration / this.stats.timeDivision) / (this.stats.bpm / 60);
        this.positionSeconds = this.lastInstructionPositionInSeconds + elapsedTime;
        this.lastInstructionPositionInSeconds = this.positionSeconds;

        const groupEndPositionInTicks = this.positionTicks + instruction.durationInTicks;
        if (groupEndPositionInTicks > this.endPositionTicks)
            this.endPositionTicks = groupEndPositionInTicks;
        const groupPlaybackEndTime = this.positionSeconds + (instruction.durationInTicks / this.stats.timeDivision) / (this.stats.bpm / 60);
        if (groupPlaybackEndTime > this.endPositionSeconds)
            this.endPositionSeconds = groupPlaybackEndTime;
    }


    currentInstruction() {
        if (this.currentIndex === -1)
            throw new Error("Iterator has not been started");
        return this.getInstruction(this.currentIndex, this.instrumentID);
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
        if (!Number.isInteger(index))
            throw new Error("Invalid seek index");
        while (true) {
            if (index === this.currentIndex)
                break;
            if (!this.nextInstruction())
                break;
        }
        return this;
    }

    seekToEnd() {
        while (!this.hasReachedEnd() && this.nextInstruction()) {
        }
        return this;
    }
}

export default InstructionIterator;
