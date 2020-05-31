import {Values} from "../../index";

export default class ArgType {
    constructor(title, processArgumentCallback, formatArgumentCallback, consumesArgument=true) {
        this.title = title;
        this.process = processArgumentCallback;
        this.format = formatArgumentCallback;
        this.consumesArgument = consumesArgument;
        Object.freeze(this);
    }
}

ArgType.destination = new ArgType(
    "Destination",
    (arg, stats) => {
        return stats.destination;
    },
    (arg, stats) => { return arg; },
    false
)


ArgType.startTime = new ArgType(
    "Start Time",
    (arg, stats) => {
        const startTime = stats.startTime
            + stats.positionSeconds; // start time equals current track's start + playback times
        if(stats.onInstructionStart)
            stats.onInstructionStart(startTime, stats);
        return startTime;
    },
    (arg, stats) => { return arg; },
    false
)


ArgType.frequency = new ArgType(
    "Frequency",
    (frequency, stats) => {
        if(typeof frequency === "string")
            frequency = Values.instance.parseFrequencyString(frequency);
        return frequency;
    },
    (frequency, song) => {
        return frequency;
    },
    true
)


ArgType.duration = new ArgType(
    "Duration",
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
    (durationTicks, values) => {
        return values.formatDuration(durationTicks);
    },
    true
)


ArgType.velocity = new ArgType(
    "Velocity",
    velocity => {
        if(Number.isInteger(velocity))
            return velocity;
        console.error("Invalid velocity: " + velocity);
    },
    (velocity, values) => { return velocity; },
    true
)


ArgType.onended = new ArgType(
    "Note End",
    callback => { return callback; },
    callback => { return callback; },
    false
)


ArgType.command = new ArgType(
    "Command",
    command => { return command; },
    command => { return command; },
    true
)

/** Track Args **/

ArgType.trackName = new ArgType(
    "Track Name",
    trackName => { return trackName; },
    trackName => { return trackName; },
    true
)

ArgType.trackCommand = new ArgType(
    "Track Command",
    trackName => { return trackName; },
    trackName => { return trackName; },
    true
)

// ArgType.trackDuration = new ArgType(
//     "Track Duration",
//     trackDuration => { return trackDuration; },
//     (durationTicks, values) => {
//         return values.formatDuration(durationTicks);
//     },
//     true
// )

ArgType.trackOffset = new ArgType(
    "Track Offset",
    trackOffset => { return trackOffset; },
    (offsetTicks, values) => {
        return values.formatDuration(offsetTicks);
    },
    true
)

ArgType.trackKey = new ArgType(
    "Track Key",
    trackKey => { return trackKey; },
    trackKey => { return trackKey; },
    true
)

/** Program Args **/

ArgType.program = new ArgType(
    "Program",
    program => { return program; },
    program => { return program; },
    true
)



