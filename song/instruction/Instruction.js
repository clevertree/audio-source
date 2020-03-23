import DeltaInstruction from "./DeltaInstruction";

class Instruction {
    constructor(data) {
        this.data = data;
    }


    static getInstructionFromData(instructionData) {
        if(typeof instructionData === 'number')
            return new DeltaInstruction(instructionData);
    }

    static parse(instruction) {
        if (instruction instanceof Instruction)
            return instruction;

        if (typeof instruction === 'number')
            instruction = [instruction]; // Single entry array means pause

        else if (typeof instruction === 'string') {
            instruction = instruction.split(':');
            // instruction[0] = parseFloat(instruction[0]);
            if (instruction.length >= 2) {
                instruction[1] = parseInt(instruction[1])
            }
        }

        if (typeof instruction[0] === 'string')
            instruction.unshift(0);

        return new Instruction(instruction);
    }

    static parseDurationAsTicks(durationString, timeDivision) {
        if (durationString === null || typeof durationString === 'number')
            return durationString;
        switch (durationString[durationString.length - 1].toLowerCase()) {
            case 't':
                return parseInt(durationString.substr(0, durationString.length - 1));
            case 'b':
                return timeDivision * parseFloat(durationString.substr(0, durationString.length - 1));
            default:
                throw new Error("Invalid Duration: " + durationString);
        }
    }
}


export default Instruction;
