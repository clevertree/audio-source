{
    class MIDISupport {
        constructor() {
        }

        // addSongEventListener(callback) { this.eventListeners.push(callback); }



        getCommandFromMIDINote(midiNote) {
            // midiNote -= 4;
            // midiNote -= 24;
            const octave = Math.floor(midiNote / 12);
            const pitch = midiNote % 12;
            const sources = new AudioSourceValues();
            return sources.noteFrequencies[pitch] + octave;
        }


        async loadMIDIFile(file) {

            const Util = new AudioSourceUtilities();
            const MIDIFile = await Util.getMIDIFile();
            const fileResult = await new Promise((resolve, reject) => {
                let reader = new FileReader();                                      // prepare the file Reader
                reader.readAsArrayBuffer(file);                 // read the binary data
                reader.onload = (e) => {
                    resolve(e.target.result);
                };
            });

            const midiData = new MIDIFile(fileResult);
            // Move to renderer
            console.info("MIDI Data Loaded: ", midiData);
            return midiData;
        }

        async loadSongFromFileInput(file, defaultInstrumentURL = null) {
            const midiData = await this.loadMIDIFile(file);
            const songData = this.loadSongFromMIDIData(midiData, defaultInstrumentURL);
            return songData;
        }

        /** Loading **/
        loadSongFromMIDIData(midiData, defaultInstrumentURL = null) {

            const newInstructions = {};
            newInstructions.root = [];

            const storage = new AudioSourceStorage();
            let songData = storage.generateDefaultSong();

            songData.instructions = newInstructions;
            songData.timeDivision = midiData.timeDivision;
            const song = new AudioSourceSong(songData);


            let instrumentCount = 0;

            for (let trackID = 0; trackID < midiData.track.length; trackID++) {
                // newInstructions.root.push([0, `@track` + trackID]);
                // const currentGroup = newInstructions.root;
                // const newTrack = [];
                // newInstructions['track' + trackID] = newTrack;

                const currentGroup = 'root';
                const lastNote = {};
                const trackEvents = midiData.track[trackID].event;
                let songPositionInTicks = 0, lastInsertSongPositionInTicks = 0;


                let notesFound = false;
                let defaultInstrumentName = 'Track ' + trackID;
                for (let eventID = 0; eventID < trackEvents.length; eventID++) {
                    const trackEvent = trackEvents[eventID];
                    switch (trackEvent.type) {
                        case 8:
                        case 9:
                            notesFound = true;
                            break;
                        case 255:
                            switch (trackEvent.metaType) {
                                case 3:
                                    defaultInstrumentName = trackEvent.data.trim();
                                    break;
                            }
                    }
                }

                if (!notesFound) {
                    console.info("Skipping empty track: ", trackID, trackEvents);
                    continue;
                }

                const instrumentID = instrumentCount++;
                if (defaultInstrumentURL) {
                    songData.instruments[instrumentID] = {url: defaultInstrumentURL + '', name: defaultInstrumentName};
                }

                for (let eventID = 0; eventID < trackEvents.length; eventID++) {
                    const trackEvent = trackEvents[eventID];
                    // let deltaDuration = trackEvent.deltaTime; // midiData.timeDivision;
                    songPositionInTicks += trackEvent.deltaTime;

                    // newTrack.push
                    switch (trackEvent.type) {
                        case 8:
                            let newMIDICommandOff = this.getCommandFromMIDINote(trackEvent.data[0]);
                            if (lastNote[newMIDICommandOff]) {
                                const lastNoteSongPositionInTicks = lastNote[newMIDICommandOff][0];
                                const insertIndex = lastNote[newMIDICommandOff][1];
                                let noteDuration = songPositionInTicks - lastNoteSongPositionInTicks;
                                delete lastNote[newMIDICommandOff];

                                song.replaceInstructionDuration(currentGroup, insertIndex, noteDuration);
//                             console.log("OFF", lastNoteSongPositionInTicks, trackEvent.deltaTime, newMIDICommandOff, noteDuration);

                                // lastNote[newMIDICommandOff][1][3] = noteDuration;
                            }
                            break;
                        case 9:
                            let newMIDICommandOn = this.getCommandFromMIDINote(trackEvent.data[0]);
                            let newMIDIVelocityOn = trackEvent.data[1]; // Math.round((trackEvent.data[1] / 128) * 100);
                            if (newMIDIVelocityOn === 0) {
                                // Note Off
                                if (lastNote[newMIDICommandOn]) {
                                    // const lastNoteSongPositionInTicks = lastNote[newMIDICommandOff][0];
                                    const insertIndex = lastNote[newMIDICommandOn][1];
                                    let noteDuration = songPositionInTicks - lastInsertSongPositionInTicks;
                                    // lastNote[newMIDICommandOn][1][3] = noteDuration;

                                    song.replaceInstructionDuration(currentGroup, insertIndex, noteDuration);
//                                 console.log("OFF", lastInsertSongPositionInTicks, trackEvent.deltaTime, newMIDICommandOn, noteDuration);
                                    delete lastNote[newMIDICommandOn];
                                    break;
                                }
                            }

                            // let newInstructionDelta = trackEvent.deltaTime + (songPositionInTicks - lastInsertSongPositionInTicks);
                            lastInsertSongPositionInTicks = songPositionInTicks;
                            const newInstruction = new SongInstruction([0, newMIDICommandOn, instrumentID, 0, newMIDIVelocityOn]);
                            const insertIndex = song.insertInstructionAtPosition(currentGroup, songPositionInTicks, newInstruction);

                            lastNote[newMIDICommandOn] = [songPositionInTicks, insertIndex];
                            // newTrack.push(newInstruction);
//                         console.log("ON ", songPositionInTicks, newMIDICommandOn, newMIDIVelocityOn);
                            // newTrack.push
                            break;
                    }
                }
            }

            return song.data;
        }
    }

    /** Register This Module **/
    const _module = typeof module !== "undefined" ? module : findThisScript();
    _module.exports = {
        MIDISupport,
    };

    /** Module Loader Methods **/
    function findThisScript() {
        const SCRIPT_PATH = 'common/support/midi-support.js';
        const thisScript = document.head.querySelector(`script[src$="${SCRIPT_PATH}"]`);
        if (!thisScript)
            throw new Error("Base script not found: " + SCRIPT_PATH);
        thisScript.relativePath = SCRIPT_PATH;
        thisScript.basePath = thisScript.src.replace(document.location.origin, '').replace(SCRIPT_PATH, '');
        return thisScript;
    }

}
