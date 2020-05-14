import Values from "../../common/values/Values";

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

    get commandArgs() {
        return this.data.slice(2);
    }

    // TODO: set commandArgs

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
        return Values.instance.formatDuration(durationTicks, timeDivision);
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
            throw new Error("Invalid ASCTrack instruction array");
        for(let i=0; i<instructionList.length; i++) {
            const instruction = this.parseInstruction(instructionList[i]);
            instructionList[i] = instruction.data;
        }
    }

    static parseInstruction(instructionData) {
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
        return this.getInstruction(instructionData);
    }

    static getInstructionClass(instructionData) {
        if(!instructionData)
            throw new Error("Invalid Instruction data");
        const commandString = instructionData[1];
        if(typeof commandString === "string") {
            switch(commandString[0]) {
                case '@':
                    return require("./TrackInstruction").default;
                case '!':
                    return require("./CommandInstruction").default;
                default:
                    return require("./NoteInstruction").default;
            }

        } else if(typeof commandString === "number") {
            return require("./MIDIInstruction").default;
        }
        throw new Error("Unknown Instruction");
        // if(this.isMIDIInstruction(instructionData))
    }

    static getInstruction(instructionData) {
        if(!instructionData)
            throw new Error("Invalid Instruction data");
        const instructionClass = this.getInstructionClass(instructionData);
        return new instructionClass(instructionData);
    }


    // static isTrackInstruction(instructionData) {
    //     return typeof instructionData[1] === "string" && instructionData[1][0] === '@';
    // }
    //
    // static isMIDIInstruction(instructionData) {
    //     return typeof instructionData[1] === "number";
    // }


}


export default Instruction;



