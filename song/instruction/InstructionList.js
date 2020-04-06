import Instruction from "./CommandInstruction";
import TrackInstruction from "./TrackInstruction";
import CommandInstruction from "./CommandInstruction";
import MIDIInstruction from "./MIDIInstruction";

export class InstructionList {
    constructor(instructionList) {
        this.instructionList = instructionList;
    }

    splice() { return this.instructionList.splice.apply(this.instructionList, arguments); }
    indexOf() {
        return this.instructionList.indexOf.apply(this.instructionList, arguments);
    }

    processInstructions() {
        for (let i = 0; i < this.instructionList.length; i++) {
            let instructionData = this.instructionList[i];
            instructionData = InstructionList.parseInstruction(instructionData, i);
            this.instructionList[i] = instructionData.data;
        }
        // console.log('this.instructionList', this.instructionList);
    }


    getInstruction(index) {
        if(typeof index !== "number")
            throw new Error("Invalid Index: " + typeof index);
        if(index >= this.instructionList.length)
            return null;
        const instructionData = this.instructionList[index];
        return InstructionList.getInstruction(instructionData, index);
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

    static getInstruction(instructionData, index=null) {
        if(!instructionData)
            throw new Error("Invalid Instruction data at " + index);
        if(this.isTrackInstruction(instructionData))
            return new TrackInstruction(instructionData, index);
        if(this.isMIDIInstruction(instructionData))
            return new MIDIInstruction(instructionData, index);
        return new CommandInstruction(instructionData, index);
    }


    static isTrackInstruction(instructionData) {
        return typeof instructionData[1] === "string" && instructionData[1][0] === '@';
    }

    static isMIDIInstruction(instructionData) {
        return typeof instructionData[1] === "number";
    }


}


export default InstructionList;
