import SongInstruction from "./SongInstruction";

class SongInstructionIterator {
    constructor(song, groupName, stats = {}) {
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
            bpm: song.data.bpm,
            timeDivision: song.data.bpm,
        }, stats);
        this.nextQuantizationBreakInTicks = 0;
        // this.lastInstructionGroupPositionInTicks = 0;

    }

    hasReachedEnd() {
        return this.currentIndex >= this.instructionList.length - 1;
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
        if (this.currentIndex === -1)
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

export default SongInstructionIterator;
