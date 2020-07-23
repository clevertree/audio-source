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

        songData.timeDivision = midiData.division;


        for (let trackID = 0; trackID < midiData.tracks.length; trackID++) {
            const trackEvents = midiData.tracks[trackID];
            let songPositionInTicks = 0;


            let trackName = 'track' + trackID;

            songPositionInTicks = 0;
            for(const trackEvent of trackEvents) {
                songPositionInTicks += trackEvent.delta;
                if(trackEvent.trackName) {
                    trackName = trackEvent.trackName.trim();
                }
            }

            songData.programs[trackID] = ['PolyphonyInstrument', {title: trackName}]; // {url: defaultProgramURL + '', name: defaultProgramName};
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
                    const tempo = 60 / (trackEvent.setTempo.microsecondsPerQuarter / 1000000);
                    console.log("TODO Tempo: ", tempo);
                    // trackEvent.setTempo.microsecondsPerQuarter;
                }

                if(trackEvent.programChange) {
                    // trackEvent.programChange.programNumber
                }

                if(trackEvent.noteOn) {
                    let newMIDICommandOn = this.getCommandFromMIDINote(trackEvent.noteOn.noteNumber);
                    let newMIDIVelocityOn = trackEvent.noteOn.velocity; // Math.round((trackEvent.data[1] / 128) * 100);
                    console.log("ON ", newMIDICommandOn, newMIDIVelocityOn, songPositionInTicks, trackEvent);
                    // trackEvent.noteOn.noteNumber;
                    // trackEvent.noteOn.velocity;

                    if (newMIDIVelocityOn === 0) {
                        // Note Off
                        if (lastNote[newMIDICommandOn]) {
                            const [lastNoteInsertPositionInTicks, lastNoteData] = lastNote[newMIDICommandOn];
                            lastNoteData[2] = songPositionInTicks - lastNoteInsertPositionInTicks;
                            delete lastNote[newMIDICommandOn];
                        } else {
                            console.warn("No 'ON' note was found before 'OFF' note: " + newMIDICommandOn);
                        }
                    } else {

                        const newInstructionData = [nextDelta, newMIDICommandOn, 0, newMIDIVelocityOn];
                        thisTrack.push(newInstructionData);
                        nextDelta = 0;

                        if(lastNote[newMIDICommandOn])
                            console.warn("MIDI On hit same note twice: " + newMIDICommandOn)
                        lastNote[newMIDICommandOn] = [songPositionInTicks, newInstructionData];

                    }
                }

                if(trackEvent.noteOff) {
                    let newMIDICommandOff = this.getCommandFromMIDINote(trackEvent.noteOff.noteNumber);
                    console.log("OFF", newMIDICommandOff, -1, songPositionInTicks, trackEvent);

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
//
//
//     async loadMIDIFile(file) {
//
//         const Util = new AudioSourceUtilities();
//         const fileResult = await new Promise((resolve, reject) => {
//             let reader = new FileReader();                                      // prepare the file Reader
//             reader.readAsArrayBuffer(file);                 // read the binary data
//             reader.onload = (e) => {
//                 resolve(e.target.result);
//             };
//         });
//
//         const midiData = new MIDIFile(fileResult);
//         // Move to renderer
//         console.info("MIDI Data Loaded: ", midiData);
//         return midiData;
//     }
//
//     async loadSongDataFromFileInput(file, defaultProgramURL = null) {
//         const midiData = await this.loadMIDIFile(file);
//         const songData = this.loadSongFromMIDIData(midiData, defaultProgramURL);
//         return songData;
//     }
//
//     /** Loading **/
//     loadSongFromMIDIData(midiData, defaultProgramURL = null) {
//
//         const newInstructions = {};
//         newInstructions.root = {
//             instructions:[]
//         };
//
//         const storage = new Storage();
//         let songData = storage.generateDefaultSong();
//
//         songData.tracks = newInstructions;
//         songData.timeDivision = midiData.timeDivision;
//         const song = new Song(songData);
//
//
//         let programCount = 0;
//
//         for (let trackID = 0; trackID < midiData.track.length; trackID++) {
//             // newInstructions.root.push([0, `@track` + trackID]);
//             // const currentGroup = newInstructions.root;
//             // const newTrack = [];
//             // newInstructions['track' + trackID] = newTrack;
//
//             const currentGroup = 'root';
//             const lastNote = {};
//             const trackEvents = midiData.track[trackID].event;
//             let songPositionInTicks = 0, lastInsertSongPositionInTicks = 0;
//
//
//             let notesFound = false;
//             let defaultProgramName = 'ASCTrack ' + trackID;
//             for (let eventID = 0; eventID < trackEvents.length; eventID++) {
//                 const trackEvent = trackEvents[eventID];
//                 switch (trackEvent.type) {
//                     case 8:
//                     case 9:
//                         notesFound = true;
//                         break;
//                     case 255:
//                         switch (trackEvent.metaType) {
//                             case 3:
//                                 defaultProgramName = trackEvent.data.trim();
//                                 break;
//                         }
//                 }
//             }
//
//             if (!notesFound) {
//                 console.info("Skipping empty track: ", trackID, trackEvents);
//                 continue;
//             }
//
//             const programID = programCount++;
//             if (defaultProgramURL) {
//                 songData.programs[programID] = {url: defaultProgramURL + '', name: defaultProgramName};
//             }
//
//             for (let eventID = 0; eventID < trackEvents.length; eventID++) {
//                 const trackEvent = trackEvents[eventID];
//                 // let deltaDuration = trackEvent.deltaTime; // midiData.timeDivision;
//                 songPositionInTicks += trackEvent.deltaTime;
//
//                 // newTrack.push
//                 switch (trackEvent.type) {
//                     case 8:
//                         let newMIDICommandOff = this.getCommandFromMIDINote(trackEvent.data[0]);
//                         if (lastNote[newMIDICommandOff]) {
//                             const lastNoteSongPositionInTicks = lastNote[newMIDICommandOff][0];
//                             const insertIndex = lastNote[newMIDICommandOff][1];
//                             let noteDuration = songPositionInTicks - lastNoteSongPositionInTicks;
//                             delete lastNote[newMIDICommandOff];
//
//                             song.instructionReplaceDuration(currentGroup, insertIndex, noteDuration);
// //                             console.log("OFF", lastNoteSongPositionInTicks, trackEvent.deltaTime, newMIDICommandOff, noteDuration);
//
//                             // lastNote[newMIDICommandOff][1][3] = noteDuration;
//                         }
//                         break;
//                     case 9:
//                         let newMIDICommandOn = this.getCommandFromMIDINote(trackEvent.data[0]);
//                         let newMIDIVelocityOn = trackEvent.data[1]; // Math.round((trackEvent.data[1] / 128) * 100);
//                         if (newMIDIVelocityOn === 0) {
//                             // Note Off
//                             if (lastNote[newMIDICommandOn]) {
//                                 // const lastNoteSongPositionInTicks = lastNote[newMIDICommandOff][0];
//                                 const insertIndex = lastNote[newMIDICommandOn][1];
//                                 let noteDuration = songPositionInTicks - lastInsertSongPositionInTicks;
//                                 // lastNote[newMIDICommandOn][1][3] = noteDuration;
//
//                                 song.instructionReplaceDuration(currentGroup, insertIndex, noteDuration);
// //                                 console.log("OFF", lastInsertSongPositionInTicks, trackEvent.deltaTime, newMIDICommandOn, noteDuration);
//                                 delete lastNote[newMIDICommandOn];
//                                 break;
//                             }
//                         }
//
//                         // let newInstructionDelta = trackEvent.deltaTime + (songPositionInTicks - lastInsertSongPositionInTicks);
//                         lastInsertSongPositionInTicks = songPositionInTicks;
//                         const newInstructionData = [0, newMIDICommandOn, programID, 0, newMIDIVelocityOn];
//                         const insertIndex = song.instructionInsertAtPosition(currentGroup, songPositionInTicks, newInstructionData);
//
//                         lastNote[newMIDICommandOn] = [songPositionInTicks, insertIndex];
//                         // newTrack.push(newInstruction);
// //                         console.log("ON ", songPositionInTicks, newMIDICommandOn, newMIDIVelocityOn);
//                         // newTrack.push
//                         break;
//                 }
//             }
//         }
//
//         return song.data;
//     }
}

// (async function() {
//     const midiFilePath = require('../../../assets/files/test2.mid');
//     const response = await fetch(midiFilePath);
//     const midiFileBuffer = await response.arrayBuffer();
//     console.log('midiFilePath', midiFilePath, midiFileBuffer);
//     new MIDIFileSupport().processSongFromFileBuffer(midiFileBuffer, 'test2.mid');
//
// })();
