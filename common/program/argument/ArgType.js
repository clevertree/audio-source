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


ArgType.command = new ArgType(
    "Command",
    command => { return command; },
    command => { return command; },
    true
)


ArgType.frequency = new ArgType(
    "Frequency",
    (frequency, stats) => {
        if(typeof frequency === "string")
            frequency = Values.instance.parseFrequencyString(frequency);
        if(stats.transpose)
            frequency /= stats.transpose;
        return frequency;
    },
    (frequency, values) => {
        if(frequency === null)
            return 'N/A';
        return frequency;
    },
    true
)


ArgType.duration = new ArgType(
    "Duration",
    (durationTicks, stats) => {
        if(typeof durationTicks === "string")
            durationTicks = Values.instance.parseDurationAsTicks(durationTicks, stats.timeDivision);
        const durationSeconds = Values.instance.durationTicksToSeconds(durationTicks, stats.timeDivision, stats.beatsPerMinute);
        // if(stats.onInstructionEnd) {
        //     const startTime = stats.startTime
        //         + stats.positionSeconds; // start time equals current track's start + playback times
        //     stats.onInstructionEnd(startTime + durationSeconds, stats);
        // }
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
        // if(Number.isInteger(velocity))
        return velocity;
        // console.error("Invalid velocity: " + velocity);
    },
    (velocity, values) => { return velocity; },
    true
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


ArgType.onended = new ArgType(
    "Note End",
    (arg, stats) => {
        const index = stats.currentIndex;
        return stats.onInstructionEnd ? function() {
            stats.onInstructionEnd(index);
        } : null;
    },
    callback => { return callback; },
    false
)

ArgType.offset = new ArgType(
    "Offset",
    (offsetDurationTicks, stats) => {
        return Values.instance.durationTicksToSeconds(offsetDurationTicks, stats.timeDivision, stats.beatsPerMinute);
    },
    (offsetTicks, values) => {
        return values.formatDuration(offsetTicks);
    },
    true
)

/** Track Args **/

ArgType.trackName = new ArgType(
    "Track Name",
    trackName => {
        if(trackName[0] === '@')
            return trackName.substr(1);
        return trackName;
    },
    trackName => { return trackName; },
    true
)

// ArgType.trackCommand = new ArgType(
//     "Track Command",
//     trackName => { return trackName; },
//     trackName => { return trackName; },
//     true
// )

// ArgType.trackDuration = new ArgType(
//     "Track Duration",
//     trackDuration => { return trackDuration; },
//     (durationTicks, values) => {
//         return values.formatDuration(durationTicks);
//     },
//     true
// )

// ArgType.trackKey = new ArgType(
//     "Track Key",
//     trackKey => { return trackKey; },
//     trackKey => { return trackKey; },
//     true
// )

/** Program Args **/

ArgType.program = new ArgType(
    "Program",
    program => { return program; },
    program => { return program; },
    true
)


// TF + NF
// C4 + A4 = A4;
// C4 + C4 = C4;
// D4 + C4 = D4;
// C4 + D4 = D4;
