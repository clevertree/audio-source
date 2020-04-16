import Instruction from "./Instruction";

class CommandInstruction extends Instruction {


    get durationTicks() {
        return undefined;
    }

    get velocity() {
        return undefined;
    }

    clone() {
        return new CommandInstruction(this.data.slice());
    }
}

export default CommandInstruction;
