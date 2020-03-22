class Instruction {
    constructor(instructionData = [0]) {
        this.data = instructionData;
        // this.index = index;
        // this.positionInTicks = positionInTicks;
        // this.playbackTime = null;
    }

    get deltaDuration() {
        return this.data[0];
    }

    set deltaDuration(newDeltaDuration) {
        this.data[0] = Instruction.parseDurationAsTicks(newDeltaDuration);
    }

    get command() {
        return this.data[1] || null;
    }

    set command(newCommand) {
        this.data[1] = newCommand;
    }

    get instrument() {
        return typeof this.data[2] === "undefined" ? null : this.data[2];
    }

    set instrument(newInstrumentID) {
        newInstrumentID = parseInt(newInstrumentID);
        if (Number.isNaN(newInstrumentID))
            throw new Error("Invalid Instrument ID");
        this.data[2] = newInstrumentID;
    }

    get duration() {
        return typeof this.data[3] === "undefined" ? null : this.data[3];
    }

    set duration(newDuration) {
        newDuration = parseFloat(newDuration);
        if (Number.isNaN(newDuration))
            throw new Error("Invalid Duration");
        this.data[3] = newDuration;
    }

    getDurationAsTicks(timeDivision) {
        return Instruction.parseDurationAsTicks(this.duration, timeDivision);
    }

    get velocity() {
        return typeof this.data[4] === "undefined" ? null : this.data[4];
    }

    set velocity(newVelocity) {
        newVelocity = parseInt(newVelocity);
        if (Number.isNaN(newVelocity))
            throw new Error("Invalid Velocity");
        this.data[4] = newVelocity;
    }

    get panning() {
        return typeof this.data[5] === "undefined" ? null : this.data[5];
    }

    set panning(newPanning) {
        newPanning = parseInt(newPanning);
        if (Number.isNaN(newPanning))
            throw new Error("Invalid Panning");
        this.data[5] = newPanning;
    }

    isGroupCommand() {
        return this.command && this.command[0] === '@';
    }

    getGroupFromCommand() {
        return this.command.substr(1);
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
