
class Instruction {

    /** Static **/

    static processInstructionTracks(trackList) {
        Object.keys(trackList).forEach((trackName, i) =>
            this.processInstructionTrack(trackList[trackName]));
    }
    static processInstructionTrack(instructionList) {
        if(!Array.isArray(instructionList))
            throw new Error("Invalid ASCTrack instruction array");
        for(let i=0; i<instructionList.length; i++) {
            instructionList[i] = this.parseInstructionData(instructionList[i]);
        }
    }

    static parseInstructionData(instructionData) {
        // if (instructionData instanceof Instruction)
        //     instructionData = instructionData.data.slice();
        if(typeof instructionData === "number")
            instructionData = [instructionData];
        if(typeof instructionData === "string")
            instructionData = [0, instructionData];
        if(!Array.isArray(instructionData))
            throw new Error("Invalid instruction data");
        if(typeof instructionData[0] === "string")
            instructionData.unshift(0);
        // const processor = new InstructionProcessor(instructionData);
        // processor.updateArg(argType, newArgValue)
        return instructionData;
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



