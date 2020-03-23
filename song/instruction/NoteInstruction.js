import Instruction from "./Instruction";

class NoteInstruction extends Instruction {
    get command() {
        return this.data[1];
    }

    set command(newCommand) {
        this.data[1] = newCommand;
    }


    get duration() {
        return this.data[2];
    }

    set duration(newDuration) {
        newDuration = parseFloat(newDuration);
        if (Number.isNaN(newDuration))
            throw new Error("Invalid Duration");
        this.data[2] = newDuration;
    }

    getDurationAsTicks(timeDivision) {
        return Instruction.parseDurationAsTicks(this.duration, timeDivision);
    }

    get velocity() {
        return this.data[3];
    }

    set velocity(newVelocity) {
        newVelocity = parseInt(newVelocity);
        if (Number.isNaN(newVelocity))
            throw new Error("Invalid Velocity");
        this.data[3] = newVelocity;
    }

}


export default NoteInstruction;
