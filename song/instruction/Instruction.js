import {SongValues} from "../values";

class Instruction {
    constructor(instructionData = [0]) {
        this.data = instructionData;
    }

    get command() {
        return this.data[1];
    }

    set command(newCommand) {
        this.data[1] = newCommand;
    }


    get deltaDurationTicks() {
        return this.data[0];
    }

    set deltaDurationTicks(newDeltaDuration) {
        this.data[0] = newDeltaDuration;
    }

    getDurationString(timeDivision) {
        const durationTicks = this.durationTicks;
        if(durationTicks === null)
            return 'N/A';
        return SongValues.formatDuration(durationTicks, timeDivision);
    }
    set durationTicks(newDuration)  { throw new Error("TODO: Implement for " + this.constructor.name);}
    get durationTicks()             { throw new Error("TODO: Implement for " + this.constructor.name);}
    get clone()          { throw new Error("TODO: Implement for " + this.constructor.name);}

    /** @deprecated **/
    set velocity(velocity)  { throw new Error("TODO: Implement for " + this.constructor.name);}
    /** @deprecated **/
    get velocity()          { throw new Error("TODO: Implement for " + this.constructor.name);}



    /** Static **/

    static processInstructionTracks(trackList) {
        Object.keys(trackList).forEach((trackName, i) =>
            this.processInstructionTrack(trackList[trackName]));
    }
    static processInstructionTrack(instructionList) {
        if(!Array.isArray(instructionList))
            throw new Error("Invalid Track instruction array");
        for(let i=0; i<instructionList.length; i++) {
            const instruction = this.parseInstruction(instructionList[i]);
            instructionList[i] = instruction.data;
        }
    }

    static parseInstruction(instructionData, index=null) {
        if (instructionData instanceof Instruction)
            return instructionData;
        if(typeof instructionData === "number")
            instructionData = [instructionData];
        if(typeof instructionData === "string")
            instructionData = [0, instructionData];
        if(!Array.isArray(instructionData))
            throw new Error("Invalid instruction data");
        if(typeof instructionData[0] === "string")
            instructionData.unshift(0);
        return this.getInstruction(instructionData, index);
    }

    static getInstruction(instructionData) {
        if(!instructionData)
            throw new Error("Invalid Instruction data");
        if(this.isTrackInstruction(instructionData))
            return new (require("./TrackInstruction").default)(instructionData);
        if(this.isMIDIInstruction(instructionData))
            return new (require("./MIDIInstruction").default)(instructionData);
        return new (require("./NoteInstruction").default)(instructionData);
    }


    static isTrackInstruction(instructionData) {
        return typeof instructionData[1] === "string" && instructionData[1][0] === '@';
    }

    static isMIDIInstruction(instructionData) {
        return typeof instructionData[1] === "number";
    }


}


export default Instruction;



