/**
 * Player requires a modern browser
 */

class MIDISupport {
    constructor() {
    }
    // addSongEventListener(callback) { this.eventListeners.push(callback); }

    // TODO: duplicate
    get noteFrequencies() {
        return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    }


    getCommandFromMIDINote(midiNote) {
        // midiNote -= 4;
        // midiNote -= 24;
        const octave = Math.floor(midiNote / 12);
        const pitch = midiNote % 12;
        return this.noteFrequencies[pitch] + octave;
    }


    async loadMIDIFile(file) {

        const Sources = new AudioSourceLibraries;
        const MidiParser = await Sources.getMidiParser();
        const fileResult = await new Promise((resolve, reject) => {
            let reader = new FileReader();                                      // prepare the file Reader
            reader.readAsArrayBuffer(file);                 // read the binary data
            reader.onload =  (e) => {
                resolve(e.target.result);
            };
        });

        // Move to renderer
        const midiData = MidiParser.parse(new Uint8Array(fileResult));
        console.info("MIDI Data Loaded: ", midiData);
        return midiData;
    }

    async loadSongFromMidiFile(file) {
        const midiData = await this.loadMIDIFile(file);
        const songData = this.loadSongFromMIDIData(midiData);
        return songData;
    }

    /** Loading **/
    loadSongFromMIDIData(midiData) {

        const newInstructions = {};
        newInstructions.root = [];

        const storage = new AudioSourceStorage();
        let songData = storage.generateDefaultSong();

        songData.instructions = newInstructions;
        songData.timeDivision = midiData.timeDivision;
        const renderer = new AudioSourceRenderer(songData);


        let instrumentCount = 0;

        for(let trackID=0; trackID<midiData.track.length; trackID++) {
            // newInstructions.root.push([0, `@track` + trackID]);
            // const currentGroup = newInstructions.root;
            // const newTrack = [];
            // newInstructions['track' + trackID] = newTrack;

            const currentGroup = 'root';
            const lastNote = {};
            const trackEvents = midiData.track[trackID].event;
            let songPositionInTicks = 0, lastInsertSongPositionInTicks=0;


            let notesFound = false;
            for(let eventID=0; eventID<trackEvents.length; eventID++) {
                const trackEvent = trackEvents[eventID];
                switch(trackEvent.type) {
                    case 8:
                    case 9:
                        notesFound = true;
                }
            }

            if(!notesFound) {
                console.info("Skipping empty track: ", trackID, trackEvents);
                continue;
            }

            const instrumentID = instrumentCount++;

            for(let eventID=0; eventID<trackEvents.length; eventID++) {
                const trackEvent = trackEvents[eventID];
                // let deltaDuration = trackEvent.deltaTime; // midiData.timeDivision;
                songPositionInTicks += trackEvent.deltaTime;

                // newTrack.push
                switch(trackEvent.type) {
                    case 8:
                        let newMIDICommandOff = this.getCommandFromMIDINote(trackEvent.data[0]);
                        if(lastNote[newMIDICommandOff]) {
                            const lastNoteSongPositionInTicks = lastNote[newMIDICommandOff][0];
                            const insertIndex = lastNote[newMIDICommandOff][1];
                            let noteDuration = songPositionInTicks - lastNoteSongPositionInTicks;
                            delete lastNote[newMIDICommandOff];

                            renderer.replaceInstructionDuration(currentGroup, insertIndex, noteDuration);
                            console.log("OFF", lastNoteSongPositionInTicks, trackEvent.deltaTime, newMIDICommandOff, noteDuration);

                            // lastNote[newMIDICommandOff][1][3] = noteDuration;
                        }
                        break;
                    case 9:
                        let newMIDICommandOn = this.getCommandFromMIDINote(trackEvent.data[0]);
                        let newMIDIVelocityOn = trackEvent.data[1]; // Math.round((trackEvent.data[1] / 128) * 100);
                        if(newMIDIVelocityOn === 0) {
                            // Note Off
                            if (lastNote[newMIDICommandOn]) {
                                const lastNoteSongPositionInTicks = lastNote[newMIDICommandOff][0];
                                const insertIndex = lastNote[newMIDICommandOff][1];
                                let noteDuration = songPositionInTicks - lastInsertSongPositionInTicks;
                                // lastNote[newMIDICommandOn][1][3] = noteDuration;

                                renderer.replaceInstructionDuration(currentGroup, insertIndex, noteDuration);
                                console.log("OFF", lastInsertSongPositionInTicks, trackEvent.deltaTime, newMIDICommandOn, noteDuration);
                                delete lastNote[newMIDICommandOn];
                                break;
                            }
                        }

                        // let newInstructionDelta = trackEvent.deltaTime + (songPositionInTicks - lastInsertSongPositionInTicks);
                        lastInsertSongPositionInTicks = songPositionInTicks;
                        const newInstruction = [0, newMIDICommandOn, instrumentID, 0, newMIDIVelocityOn];
                        const insertIndex = renderer.insertInstructionAtPosition(currentGroup, songPositionInTicks, newInstruction);

                        lastNote[newMIDICommandOn] = [songPositionInTicks, insertIndex];
                        // newTrack.push(newInstruction);
                        console.log("ON ", songPositionInTicks, newMIDICommandOn, newMIDIVelocityOn);
                        // newTrack.push
                        break;
                }
            }
        }

        return renderer.getSongData();
    }


}
