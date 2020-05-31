import {Values} from "../../../common";

export default class InstructionIterator {
    constructor(instructionList, stats={}, instructionCallback=null) {
        this.instructions = instructionList;
        if(!stats.beatsPerMinute)
            throw new Error("Missing stats.beatsPerMinute");
        if(!stats.timeDivision)
            throw new Error("Missing stats.timeDivision");

        this.stats = stats;
        this.instructionCallback = instructionCallback || function() {};

        stats.currentIndex = -1;        // TODO: rename to index?
        stats.positionTicks = 0;
        stats.positionSeconds = 0;
        stats.lastInstructionPositionInTicks = 0;

        // this.beatsPerMinute = beatsPerMinute;
        // this.timeDivision = timeDivision;
        //
        // this.positionTicks = 0;
        // this.endPositionTicks = 0;
        // this.positionSeconds = 0;
        // this.endPositionSeconds = 0;
        // this.lastInstructionPositionInTicks = 0;
        // this.lastInstructionPositionInSeconds = 0;

        // this.currentIndex = -1;
        this.generator = this.run();
    }


    getBeatsPerMinute() { return this.stats.beatsPerMinute; }
    getTimeDivision() { return this.stats.timeDivision; }
    getPositionInTicks() { return this.stats.positionTicks; }
    getPositionInSeconds() { return this.stats.positionSeconds; }
    getIndex() { return this.stats.currentIndex; }

    hasReachedEnd() {
        return this.stats.currentIndex >= this.instructions.length - 1;
    }

    processInstructionData(instructionData) {
        let deltaDurationTicks = instructionData[0]; // .deltaDurationTicks;

        if(deltaDurationTicks > 0) {
            const stats = this.stats;
            // if(this.quantizationTicks !== null)
            //     deltaDurationTicks = this.incrementPositionByQuantizedDelta(deltaDurationTicks, this.quantizationTicks, callback);

            const instructionPositionTicks = stats.lastInstructionPositionInTicks + deltaDurationTicks;
            stats.lastInstructionPositionInTicks = instructionPositionTicks;
            // this.positionTicks = this.lastInstructionPositionInTicks;
            if(stats.positionTicks >= instructionPositionTicks)
                console.warn(`Next instruction appears before current position ${stats.positionTicks} >= ${instructionPositionTicks}`);
            this.incrementPositionByDelta(instructionPositionTicks - stats.positionTicks);
        }

        this.instructionCallback(instructionData, this.stats);
    }

    incrementPositionByDelta(deltaDurationTicks) {
        const stats = this.stats;
        // console.log('incrementPositionByDelta', deltaDurationTicks);
        stats.positionTicks += deltaDurationTicks;

        const elapsedTime = Values.durationTicksToSeconds(deltaDurationTicks, stats.timeDivision, stats.beatsPerMinute);
        stats.positionSeconds += elapsedTime;
        // this.lastInstructionPositionInSeconds = this.positionSeconds;
    }

    * run() {
        const count = this.instructions.length;
        const stats = this.stats;
        for(stats.currentIndex=0; stats.currentIndex<count; stats.currentIndex++) {
            const instructionData = this.instructions[stats.currentIndex]; // new Instruction(this.instructions[stats.currentIndex]);
            this.processInstructionData(instructionData);
            // this.incrementPositionByInstruction(instruction);
            yield instructionData;
        }
    }



    getInstructionData(index) {
        if(index >= this.instructions.length)
            throw new Error("Instruction is out of index: " + index);
        return this.instructions[index];
    }


    // currentInstruction() {
    //     const stats = this.stats;
    //     if (stats.currentIndex === -1)
    //         throw new Error("Iterator has not been started");
    //     return this.getInstructionData(stats.currentIndex);
    // }

    nextInstructionData() {
        return this.generator.next().value;
    }

    /** Seeking **/

    seekToIndex(index, callback=null) {
        if (!Number.isInteger(index))
            throw new Error("Invalid seek index");
        const stats = this.stats;
        while (index > stats.currentIndex) {
            const instruction = this.nextInstructionData();
            if(callback)
                callback(instruction);
        }
    }

    seekToEnd(callback=null) {
        while (true) {
            const instruction = this.nextInstructionData();
            if(!instruction)
                break;
            if(callback)
                callback(instruction);
        }
    }

    seekToPosition(positionSeconds) {
        const stats = this.stats;
        while (!this.hasReachedEnd()) {
            const nextInstructionData = this.getInstructionData(stats.currentIndex + 1);
            const elapsedTime = Values.durationTicksToSeconds(nextInstructionData[0], stats.timeDivision, stats.beatsPerMinute);
            if(stats.positionSeconds + elapsedTime >= positionSeconds) {
                break;
            }
            const instruction = this.nextInstructionData();
            if(!instruction)
                break;
        }
    }

    seekToPositionTicks(positionTicks, callback=null) {
        const stats = this.stats;
        while (!this.hasReachedEnd() && stats.positionTicks <= positionTicks) {
            const nextInstructionData = this.getInstructionData(stats.currentIndex + 1);
            if(stats.positionTicks + nextInstructionData[0] > positionTicks) {
                break;
            }
            const instruction = this.nextInstructionData();
            if(!instruction)
                break;
            if(callback)
                callback(instruction);
        }
        // TODO
        // const remainingTicks = positionTicks - this.positionTicks;
        // deltaDurationTicks = this.incrementPositionByQuantizedDelta(deltaDurationTicks, this.quantizationTicks, callback);
    }

    /** Iterator **/

    [Symbol.iterator]() { return this.generator; }

    /** Static **/

    static getIteratorFromSong(song, trackName, stats={}, instructionCallback=null) {
        const songData = song.getProxiedData();
        if(!songData.tracks[trackName])
            throw new Error("Invalid instruction track: " + trackName);
        const instructionList = songData.tracks[trackName];

        if(!stats.timeDivision)
            stats.timeDivision = songData.timeDivision;
        if(!stats.beatsPerMinute)
            stats.beatsPerMinute = songData.beatsPerMinute;

        return new InstructionIterator(
            instructionList,
            stats,
            instructionCallback
        )
    }
}


