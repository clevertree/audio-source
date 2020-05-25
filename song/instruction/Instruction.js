import Values from "../../common/values/Values";
import InstructionProcessor from "../../common/program/InstructionProcessor";

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

    getCommandString() {
        return this.data[1];
    }

    getArgs() {
        return this.data.slice(2);
    }

    isTrackInstruction() {
        return InstructionProcessor.isTrackCommand(this.getCommandString());
    }

    getTrackNameFromInstruction() {
        return InstructionProcessor.getTrackNameFromInstruction(this);
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
    /** @deprecated **/
    set durationTicks(newDuration)  { throw new Error("TODO: Implement for " + this.constructor.name);}
    /** @deprecated **/
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
            instructionData = instructionData.data.slice();
        if(typeof instructionData === "number")
            instructionData = [instructionData];
        if(typeof instructionData === "string")
            instructionData = [0, instructionData];
        if(!Array.isArray(instructionData))
            throw new Error("Invalid instruction data");
        if(typeof instructionData[0] === "string")
            instructionData.unshift(0);
        return new Instruction(instructionData);
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



