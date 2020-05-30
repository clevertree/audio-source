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
        const startTime = stats.startTime
            + stats.positionSeconds; // start time equals current track's start + playback times
        if(stats.onInstructionStart)
            stats.onInstructionStart(startTime, stats);
        return startTime;
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
        const startTime = stats.startTime
            + stats.positionSeconds; // start time equals current track's start + playback times
        let beatsPerMinute = stats.beatsPerMinute; // getStartingBeatsPerMinute();
        let timeDivision = stats.timeDivision;
        const durationSeconds = (durationTicks / timeDivision) / (beatsPerMinute / 60);
        if(stats.onInstructionEnd)
            stats.onInstructionEnd(startTime + durationSeconds, stats);
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
    callback => { return callback; },
    callback => { return callback; },
    false
)


ArgType.command = new ArgType(
    command => { return command; },
    command => { return command; },
    true
)

/** Track Args **/

ArgType.trackName = new ArgType(
    trackName => { return trackName; },
    trackName => { return trackName; },
    true
)

ArgType.trackCommand = new ArgType(
    trackName => { return trackName; },
    trackName => { return trackName; },
    true
)

ArgType.trackDuration = new ArgType(
    trackDuration => { return trackDuration; },
    trackDuration => { return trackDuration; },
    true
)

ArgType.trackOffset = new ArgType(
    trackOffset => { return trackOffset; },
    trackOffset => { return trackOffset; },
    true
)

ArgType.trackKey = new ArgType(
    trackKey => { return trackKey; },
    trackKey => { return trackKey; },
    true
)

/** Program Args **/

ArgType.program = new ArgType(
    program => { return program; },
    program => { return program; },
    true
)



