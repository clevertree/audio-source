import {parseArrayBuffer} from 'midi-json-parser';
import Values from "../../common/values/Values";
import {Song} from "../";


export default class MIDIFileSupport {

    // addSongEventListener(callback) { this.eventListeners.push(callback); }

    async processSongFromFileBuffer(fileBuffer, filePath) {
        const midiData = await parseArrayBuffer(fileBuffer);

        const song = new Song();
        const songData = song.getProxiedData();
        songData.tracks.root = [];
        songData.title = filePath.split('/').pop();

        songData.timeDivision = midiData.division;


        for (let trackID = 0; trackID < midiData.tracks.length; trackID++) {
            const trackEvents = midiData.tracks[trackID];
            let songPositionInTicks = 0;


            let trackName = 't' + trackID;
            let programName = trackName;

            songPositionInTicks = 0;
            for(const trackEvent of trackEvents) {
                songPositionInTicks += trackEvent.delta;
                if(trackEvent.trackName) {
                    programName = trackEvent.trackName.trim();
                }
            }

            songData.programs[trackID] = ['empty', {title: programName}]; // {url: defaultProgramURL + '', name: defaultProgramName};
            songData.tracks[trackName] = [
                [0, '!p', trackID],
            ]; // {url: defaultProgramURL + '', name: defaultProgramName};
            const thisTrack = songData.tracks[trackName];
            songData.tracks.root.push([0, `@${trackName}`]);


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
                        thisTrack.push(newInstructionData);
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
        }

        console.log('midiData', midiData, song.getProxiedData())
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
