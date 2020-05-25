import {Values} from "../../index";

export default class ArgType {
    constructor(processArgumentCallback, renderArgumentCallback, consumesArgument=true) {
        this.processArgument = processArgumentCallback;
        this.renderArgument = renderArgumentCallback;
        this.consumesArgument = consumesArgument;
    }
}

ArgType.destination = new ArgType(
    (param, stats) => {
        return stats.destination;
    },
    (param, stats) => {

    },
    false
)


ArgType.startTime = new ArgType(
    (param, stats) => {
        return stats.startTime
            + stats.positionSeconds; // start time equals current track's start + playback times
    },
    (param, stats) => {

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
    (durationTicks, stats) => {
        let beatsPerMinute = stats.beatsPerMinute; // getStartingBeatsPerMinute();
        let timeDivision = stats.timeDivision;
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
        console.error("Invalid velocity: " + velocity);
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



