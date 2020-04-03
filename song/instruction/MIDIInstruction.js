import Instruction from "./Instruction";

class MIDIInstruction extends Instruction {

    get instruction() {
        return this.data[2];
    }

    set instruction(newCommand) {
        this.data[2] = newCommand;
    }

    get durationTicks() {
        return null;
    }

    set durationTicks(newDuration) {
        throw new Error("Unable to set duration on MIDI instruction");
    }

}

export default MIDIInstruction;
