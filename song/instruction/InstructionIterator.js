import Instruction from "./Instruction";



export default class InstructionIterator {
    constructor(instructionList, timeDivision, beatsPerMinute, quantizationTicks=null) {
        this.instructions = instructionList;
        this.beatsPerMinute = beatsPerMinute;
        this.timeDivision = timeDivision;

        this.positionTicks = 0;
        this.endPositionTicks = 0;
        this.positionSeconds = 0;
        this.endPositionSeconds = 0;
        this.lastInstructionPositionInTicks = 0;
        // this.lastInstructionPositionInSeconds = 0;

        this.currentIndex = -1; // TODO: rename to index?
        this.generator = this.run();
    }

    [Symbol.iterator]() {
        return {
            next: () => this.generator.next()
        }
    }

    * run() {
        const count = this.instructions.length;
        for(this.currentIndex=0; this.currentIndex<count; this.currentIndex++) {
            const instructionData = this.instructions[this.currentIndex];
            const instruction = Instruction.getInstruction(instructionData);
            this.incrementPositionByInstruction(instruction);
            yield instruction;
        }
    }

    getPositionInTicks() { return this.positionTicks; }
    getPositionInSeconds() { return this.positionSeconds; }
    getCurrentIndex() { return this.currentIndex; }

    hasReachedEnd() {
        return this.currentIndex >= this.instructions.length - 1;
    }

    incrementPositionByDelta(deltaDurationTicks) {
        // console.log('incrementPositionByDelta', deltaDurationTicks);
        this.positionTicks += deltaDurationTicks;

        const elapsedTime = (deltaDurationTicks / this.timeDivision) / (this.beatsPerMinute / 60);
        this.positionSeconds += elapsedTime;
        // this.lastInstructionPositionInSeconds = this.positionSeconds;
    }

    incrementPositionByInstruction(instruction) {
        let deltaDurationTicks = instruction.deltaDurationTicks;

        if(deltaDurationTicks > 0) {
            // if(this.quantizationTicks !== null)
            //     deltaDurationTicks = this.incrementPositionByQuantizedDelta(deltaDurationTicks, this.quantizationTicks, callback);

            const instructionPositionTicks = this.lastInstructionPositionInTicks + deltaDurationTicks;
            this.lastInstructionPositionInTicks = instructionPositionTicks;
            // this.positionTicks = this.lastInstructionPositionInTicks;
            if(this.positionTicks >= instructionPositionTicks)
                console.warn(`Next instruction appears before current position ${this.positionTicks} >= ${instructionPositionTicks}`);
            this.incrementPositionByDelta(instructionPositionTicks - this.positionTicks);
        }


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

    nextInstruction() {
        return this.generator.next().value;
    }

    /** Seeking **/

    seekToIndex(index, callback=null) {
        if (!Number.isInteger(index))
            throw new Error("Invalid seek index");
        while (index > this.currentIndex) {
            const instruction = this.nextInstruction();
            if(callback)
                callback(instruction);
        }
    }

    seekToEnd(callback=null) {
        while (true) {
            const instruction = this.nextInstruction();
            if(!instruction)
                break;
            if(callback)
                callback(instruction);
        }
    }

    seekToPosition(positionSeconds, callback=null) {
        while (!this.hasReachedEnd()) {
            const nextInstruction = this.getInstruction(this.currentIndex + 1);
            const elapsedTime = (nextInstruction.deltaDurationTicks / this.timeDivision) / (this.beatsPerMinute / 60);
            if(this.positionSeconds + elapsedTime >= positionSeconds) {
                break;
            }
            const instruction = this.nextInstruction();
            if(!instruction)
                break;
            if(callback)
                callback(instruction);
        }
    }

    seekToPositionTicks(positionTicks, callback=null) {
        while (!this.hasReachedEnd() && this.positionTicks <= positionTicks) {
            const nextInstruction = this.getInstruction(this.currentIndex + 1);
            if(this.positionTicks + nextInstruction.deltaDurationTicks > positionTicks) {
                break;
            }
            const instruction = this.nextInstruction();
            if(!instruction)
                break;
            if(callback)
                callback(instruction);
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


