import {ArgType} from "../../../common/";

export default class EmptyInstrument {
    /** Command Args **/
    static argTypes = {
        playFrequency: [ArgType.destination, ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.velocity],
        pitchBendTo: [ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.onended],
    };

    /** Command Aliases **/
    static commandAliases = {
        pf: "playFrequency",
        bt: "pitchBendTo",
    }

    static defaultEnvelope = ['envelope', {}];


    // constructor(config={}) {
    // }



    /** Playback **/

    playFrequency(destination, frequency, startTime, duration=null, velocity=null, onended=null) {
        console.info('playFrequency(', frequency, startTime, duration, velocity, ')')
    }


    /** MIDI Events **/

    playMIDIEvent(destination, eventData, onended=null) {
        console.info('playMIDIEvent(', eventData, ')')
    }
}

