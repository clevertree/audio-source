import Instruction from "./Instruction";

class InstructionIterator {
    constructor(instructionList, timeDivision, beatsPerMinute, quantizationTicks=null) {
        this.instructions = instructionList;
        this.beatsPerMinute = beatsPerMinute;
        this.timeDivision = timeDivision;

        this.positionTicks = 0;
        this.endPositionTicks = 0;
        this.positionSeconds = 0;
        this.endPositionSeconds = 0;
        this.lastInstructionPositionInTicks = 0;
        this.lastInstructionPositionInSeconds = 0;

        this.currentIndex = -1; // TODO: rename to index?
    }


    hasReachedEnd() {
        return this.currentIndex >= this.instructions.length - 1;
    }

    doCallback(callback=null, instruction, deltaDurationTicks, elapsedTime) {
        if(!callback)
            return true;
        return callback(instruction, deltaDurationTicks, elapsedTime);
    }

    incrementPositionByDelta(deltaDurationTicks, callback=null) {
        // console.log('incrementPositionByDelta', deltaDurationTicks);
        this.positionTicks += deltaDurationTicks;

        const elapsedTime = (deltaDurationTicks / this.timeDivision) / (this.beatsPerMinute / 60);
        this.positionSeconds = this.lastInstructionPositionInSeconds + elapsedTime;
        this.lastInstructionPositionInSeconds = this.positionSeconds;
        // this.cursorPosition++;
        // this.rowCount++;
        this.doCallback(callback);
    }

    incrementPositionByInstruction(instruction, callback=null) {
        let deltaDurationTicks = instruction.deltaDurationTicks;

        if(deltaDurationTicks > 0) {
            // if(this.quantizationTicks !== null)
            //     deltaDurationTicks = this.incrementPositionByQuantizedDelta(deltaDurationTicks, this.quantizationTicks, callback);

            const instructionPositionTicks = this.lastInstructionPositionInTicks + deltaDurationTicks;
            this.lastInstructionPositionInTicks = instructionPositionTicks;
            if(this.positionTicks >= instructionPositionTicks)
                console.warn(`Next instruction appears before current position ${this.positionTicks} >= ${instructionPositionTicks}`);
            this.incrementPositionByDelta(instructionPositionTicks - this.positionTicks, callback);
        }

        this.currentIndex++;
        // this.cursorPosition++;

        // Calculate song end point
        const durationTicks = instruction.durationTicks;
        if(durationTicks) {

            const trackEndPositionInTicks = this.positionTicks + durationTicks;
            if (trackEndPositionInTicks > this.endPositionTicks)
                this.endPositionTicks = trackEndPositionInTicks;
            const trackPlaybackEndTime = this.positionSeconds + (durationTicks / this.timeDivision) / (this.beatsPerMinute / 60);
            if (trackPlaybackEndTime > this.endPositionSeconds)
                this.endPositionSeconds = trackPlaybackEndTime;

        }
        if(callback)
            callback(instruction);

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

        let currentInstruction = this.getInstruction(this.currentIndex + 1); // new SongInstruction(this.instructionList[this.trackIndex]);
        this.incrementPositionByInstruction(currentInstruction, callback); // , currentInstruction.duration);
        return currentInstruction;
    }

    /** Seeking **/

    seekToIndex(index, callback=null) {
        if (!Number.isInteger(index))
            throw new Error("Invalid seek index");
        while (!this.hasReachedEnd()) {
            if (index <= this.currentIndex)
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
        while (!this.hasReachedEnd()) {
            const nextInstruction = this.getInstruction(this.currentIndex + 1);
            const elapsedTime = (nextInstruction.deltaDurationTicks / this.timeDivision) / (this.beatsPerMinute / 60);
            if(this.positionSeconds + elapsedTime >= positionSeconds) {
                break;
            }
            this.nextInstruction(callback);
        }
    }

    seekToPositionTicks(positionTicks, callback=null) {
        while (!this.hasReachedEnd() && this.positionTicks <= positionTicks) {
            const nextInstruction = this.getInstruction(this.currentIndex + 1);
            if(this.positionTicks + nextInstruction.deltaDurationTicks > positionTicks) {
                break;
            }
            this.nextInstruction(callback);
        }
        // TODO
        // const remainingTicks = positionTicks - this.positionTicks;
        // deltaDurationTicks = this.incrementPositionByQuantizedDelta(deltaDurationTicks, this.quantizationTicks, callback);
    }

    /** Static **/

    static getIteratorFromSong(song, trackName, timeDivision=null, beatsPerMinute=null) {
        const songData = song.getProxiedData();
        if(!songData.tracks[trackName])
            throw new Error("Invalid instruction track: " + trackName);
        const instructionList = songData.tracks[trackName];

        return new InstructionIterator(
            instructionList,
            timeDivision || songData.timeDivision,
            beatsPerMinute || songData.beatsPerMinute,
        )
    }
}

export default InstructionIterator;


