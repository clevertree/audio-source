import {Values} from "../../index";

export default class ArgType {
    constructor(processArgumentCallback, renderArgumentCallback, consumesArgument=true) {
        this.processArgument = processArgumentCallback;
        this.renderArgument = renderArgumentCallback;
        this.consumesArgument = consumesArgument;
    }
}

ArgType.destination = new ArgType(
    () => {
    },
() => {

    },
    false
)


ArgType.frequency = new ArgType(
    frequency => {
        if(typeof frequency === "string")
            frequency = Values.instance.parseFrequencyString(frequency);
        return frequency;
    },
    velocity => {

    },
    true
)


// ** Convert from ticks to seconds
ArgType.duration = new ArgType(
    (durationTicks, trackStats) => {
        let beatsPerMinute = trackStats.beatsPerMinute; // getStartingBeatsPerMinute();
        let timeDivision = trackStats.timeDivision;
        const durationSeconds = (durationTicks / timeDivision) / (beatsPerMinute / 60);
        return durationSeconds;
    },
    velocity => {

    },
    true
)


ArgType.velocity = new ArgType(
    velocity => {
        if(Number.isInteger(velocity))
            return velocity;
        throw new Error("Invalid velocity: " + velocity);
    },
    velocity => {

    },
    true
)


ArgType.onended = new ArgType(
    velocity => {
    },
    velocity => {

    },
    false
)



ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.velocity, ArgType.onended
