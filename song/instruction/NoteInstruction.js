import Instruction from "./Instruction";

class NoteInstruction {
    constructor(instructionData = [0]) {
        this.data = instructionData;
    }


    get command() {
        return this.data[0] || null;
    }

    set command(newCommand) {
        this.data[0] = newCommand;
    }


    get duration() {
        return this.data[1];
    }

    set duration(newDuration) {
        newDuration = parseFloat(newDuration);
        if (Number.isNaN(newDuration))
            throw new Error("Invalid Duration");
        this.data[1] = newDuration;
    }

    getDurationAsTicks(timeDivision) {
        return Instruction.parseDurationAsTicks(this.duration, timeDivision);
    }

    get velocity() {
        return this.data[2];
    }

    set velocity(newVelocity) {
        newVelocity = parseInt(newVelocity);
        if (Number.isNaN(newVelocity))
            throw new Error("Invalid Velocity");
        this.data[2] = newVelocity;
    }

}


export default NoteInstruction;
