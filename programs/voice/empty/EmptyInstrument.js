import {ArgType} from "../../../song/";

export default class EmptyInstrument {
    /** Command Args **/
    static argTypes = {
        playFrequency: [ArgType.destination, ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.velocity, ArgType.onended],
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

    /** Static **/

    static stopPlayback() {
        for(const activeNote of activeNotes)
            activeNote.noteOff();
        activeNotes = [];
    }

    static unloadAll() {
    }

}


let activeNotes = [];
// function removeActiveNote(source) {
//     const i=activeNotes.indexOf(source);
//     if(i !== -1)
//         activeNotes.splice(i, 1);
// }
// function hasActiveNote(source) {
//     return activeNotes.indexOf(source) !== -1;
// }

