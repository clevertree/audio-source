import Instruction from "./Instruction";

class TrackInstruction extends Instruction {


    getTrackName() {
        return typeof this.data[1] === "string" ? this.data[1].substr(1) : null;
    }

    setTrackName(newTrackName) {
        this.data[1] = `@${newTrackName}`;
    }

    get instruction() {
        return this.data[2];
    }

    set instruction(newCommand) {
        this.data[2] = newCommand;
    }

    get durationTicks() {
        return this.data[3] || null;
    }

    set durationTicks(newDuration) {
        newDuration = parseFloat(newDuration);
        if (Number.isNaN(newDuration))
            throw new Error("Invalid Duration");
        this.data[3] = newDuration;
    }

}

export default TrackInstruction;
