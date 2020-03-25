import Instruction from "./Instruction";

class NoteInstruction extends Instruction {
    get command() {
        return this.data[1];
    }

    set command(newCommand) {
        this.data[1] = newCommand;
    }



    /** @deprecated **/
    getDurationAsTicks(timeDivision) {
        return Instruction.parseDurationAsTicks(this.durationInTicks, timeDivision);
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
