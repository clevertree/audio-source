// import {parseArrayBuffer} from 'midi-json-parser';
import MidiFileReader from 'midijs';
import Song from "../Song";
import Values from "../values/Values";
// console.log('MidiFileReader', MidiFileReader)

export default class MIDIFileSupport {

    // addSongEventListener(callback) { this.eventListeners.push(callback); }

    async parseArrayBuffer(fileBuffer) {
        return new Promise(resolve => {
            var file = new MidiFileReader.File(fileBuffer, function (err) {
                if (err) {
                    throw err;
                }
                resolve(file);
                // file.header contains header data
                // file.tracks contains file tracks
            });
        })
    }

    async processSongFromFileBuffer(fileBuffer, filePath) {
        const midiData = await this.parseArrayBuffer(fileBuffer);

        const song = new Song();
        const songData = song.data;
        songData.tracks = {
            root: [[0, '@track*']]
        }; // .root = [];
        songData.title = filePath.split('/').pop();
        songData.comment = '# MIDI Tracks:';

        songData.timeDivision = midiData.division;

        let programID = 0;
        for (let trackID = 0; trackID < midiData.tracks.length; trackID++) {
            const trackEvents = midiData.tracks[trackID];
            let songPositionInTicks = 0;


            let trackName = 'track' + trackID;
            let trackText = null; // trackName.trim();

            songPositionInTicks = 0;
            for(const trackEvent of trackEvents) {
                songPositionInTicks += trackEvent.delta;
                if(trackEvent.trackName) {
                    trackText = trackEvent.trackName.trim();
                }
            }

            // songData.tracks[trackName] = []; // {url: defaultProgramURL + '', name: defaultProgramName};
            const newTrack = []; // songData.tracks[trackName];
            // songData.tracks.root.push([0, `@${trackName}`]);


            const lastNote = {};
            songPositionInTicks = 0;
            let nextDelta = 0;
            for(const trackEvent of trackEvents) {
                songPositionInTicks += trackEvent.delta;
                nextDelta += trackEvent.delta;

                if(trackEvent.setTempo) {
                    songData.beatsPerMinute = 60 / (trackEvent.setTempo.microsecondsPerQuarter / 1000000);

                    // console.log("TODO Tempo: ", bpm);
                    // trackEvent.setTempo.microsecondsPerQuarter;
                }

                if(trackEvent.programChange) {
                    // trackEvent.programChange.programNumber
                }

                if(trackEvent.noteOn) {
                    let newMIDICommandOn = this.getCommandFromMIDINote(trackEvent.noteOn.noteNumber);
                    let newMIDIVelocityOn = trackEvent.noteOn.velocity; // Math.round((trackEvent.data[1] / 128) * 100);
                    // console.log("ON ", newMIDICommandOn, newMIDIVelocityOn, songPositionInTicks, trackEvent);
                    // trackEvent.noteOn.noteNumber;
                    // trackEvent.noteOn.velocity;

                    // if (newMIDIVelocityOn <= 0) {
                    //     // Note Off
                    //     if (lastNote[newMIDICommandOn]) {
                    //         const [lastNoteInsertPositionInTicks, lastNoteData] = lastNote[newMIDICommandOn];
                    //         lastNoteData[2] = songPositionInTicks - lastNoteInsertPositionInTicks;
                    //         delete lastNote[newMIDICommandOn];
                    //     } else {
                    //         console.warn("No 'ON' note was found before 'OFF' note: " + newMIDICommandOn);
                    //     }
                    // } else {

                        const newInstructionData = [nextDelta, newMIDICommandOn, 0, newMIDIVelocityOn];
                        newTrack.push(newInstructionData);
                        nextDelta = 0;

                        if(lastNote[newMIDICommandOn])
                            console.warn("MIDI On hit same note twice: " + newMIDICommandOn)
                        lastNote[newMIDICommandOn] = [songPositionInTicks, newInstructionData];

                    // }
                }

                if(trackEvent.noteOff) {
                    let newMIDICommandOff = this.getCommandFromMIDINote(trackEvent.noteOff.noteNumber);
                    // console.log("OFF", newMIDICommandOff, -1, songPositionInTicks, trackEvent);

                    // Note Off
                    if (lastNote[newMIDICommandOff]) {
                        const [lastNoteInsertPositionInTicks, lastNoteData] = lastNote[newMIDICommandOff];
                        lastNoteData[2] = songPositionInTicks - lastNoteInsertPositionInTicks;
                        delete lastNote[newMIDICommandOff];
                    } else {
                        console.warn("No 'ON' note was found before 'OFF' note: " + newMIDICommandOff);
                    }
                }

            }
            if(trackText)
                songData.comment += `\n* ${trackText}`;
            if(newTrack.length === 0) {
                // delete songData.tracks[trackName];
            } else {
                songData.tracks[trackName] = newTrack;
                newTrack.unshift([0, '!p', programID])
                songData.programs[programID] = ['empty', {title: trackText}]; // {url: defaultProgramURL + '', name: defaultProgramName};
                programID++;
            }

        }

        console.log('midiData', midiData, song.data)
        return song;
    }
//
//
    getCommandFromMIDINote(midiNote) {
        // midiNote -= 4;
        // midiNote -= 24;
        const octave = Math.floor(midiNote / 12);
        const pitch = midiNote % 12;
        const MIDIList = Values.instance.listMIDINotes();
        return MIDIList[pitch] + '' + octave;
    }
}

// (async function() {
//     const midiFilePath = require('../../../assets/files/test2.mid');
//     const response = await fetch(midiFilePath);
//     const midiFileBuffer = await response.arrayBuffer();
//     console.log('midiFilePath', midiFilePath, midiFileBuffer);
//     new MIDIFileSupport().processSongFromFileBuffer(midiFileBuffer, 'test2.mid');
//
// })();

(async function() {
    const File = MidiFileReader.File;
    var file = new MidiFileReader.File();
    file.getHeader().setTicksPerBeat(60); // speed up twice
    file.getHeader().setFileType(File.Header.FILE_TYPE.SINGLE_TRACK); // change file type

    /** edit tracks **/


// add a track with events
    file.addTrack(2, // position (optional)
        new File.ChannelEvent(File.ChannelEvent.TYPE.NOTE_ON, {
            note: 45
        }),
        new File.MetaEvent(File.MetaEvent.TYPE.END_OF_TRACK)
    );

    /** edit events in a track **/

    file.getTracks(); // get all tracks
    const track = file.getTrack(0); // get a track
    track.getEvents(); // get all events
    track.getEvent(0); // get an event
    track.removeEvent(0); // remove given event
    track.addEvent(1, // position (optional)
        new File.ChannelEvent(File.ChannelEvent.TYPE.PROGRAM_CHANGE, {
            program: MidiFileReader.gm.getProgram('Church Organ')
        }, 0, 200)
    );

    console.log('TODO: refactor MIDI', track.getEvents());
    file.removeTrack(0); // remove given track

})();
