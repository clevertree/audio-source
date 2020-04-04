import Instruction from "./Instruction";

class CommandInstruction extends Instruction {


    get durationTicks() {
        return this.data[2] || null;
    }

    set durationTicks(newDuration) {
        newDuration = parseFloat(newDuration);
        if (Number.isNaN(newDuration))
            throw new Error("Invalid Duration");
        this.data[2] = newDuration;
    }

}

export default CommandInstruction;
