
class Instruction {
    constructor(instructionData = [0], index) {
        this.index = index;
        this.data = instructionData;
    }

    get deltaDuration() {
        return this.data[0];
    }

    set deltaDuration(newDeltaDuration) {
        this.data[0] = newDeltaDuration;
    }

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
