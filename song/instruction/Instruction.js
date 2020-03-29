class Instruction {
    constructor(instructionData = [0], index=null) {
        this.index = index;
        this.data = instructionData;
    }

    get deltaDurationInTicks() {
        return this.data[0];
    }

    set deltaDurationInTicks(newDeltaDuration) {
        this.data[0] = newDeltaDuration;
    }

    get command() {
        return this.data[1];
    }

    set command(newCommand) {
        this.data[1] = newCommand;
    }

    isTrackInstruction() {
        return typeof this.data[1] === "string" && this.data[1][0] === '@';
    }

    getTrackNameFromCommand() {
        return typeof this.data[1] === "string" ? this.data[1].substr(1) : null;
    }

    setTrackNameAsCommand(newTrackName) {
        this.data[1] = `@${newTrackName}`;
    }


    get durationInTicks() {
        return this.data[2];
    }

    set durationInTicks(newDuration) {
        newDuration = parseFloat(newDuration);
        if (Number.isNaN(newDuration))
            throw new Error("Invalid Duration");
        this.data[2] = newDuration;
    }

    clone() {
        return new Instruction(
            Object.assign({}, this.data),
            this.index,
        )
    }


    /** @deprecated **/
    static parseDurationAsTicks(durationString, timeDivision) {
        if (typeof durationString !== 'string')
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
