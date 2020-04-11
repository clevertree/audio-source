import InstrumentLoader from "../../song/instrument/InstrumentLoader";
// import Values from "../../song/Values";

class PolyphonyInstrument {
    constructor(config={}) {
        this.config = config;
    }

    /** Loading **/

    loadVoice(voiceID) {
        if(!this.config.voices[voiceID])
            throw new Error("Voice config is missing: " + voiceID);
        const [voiceClassName, voiceConfig] = this.config.voices[voiceID];
        let {classInstrument:voiceClass} = InstrumentLoader.getInstrumentClassInfo(voiceClassName);
        return new voiceClass(voiceConfig);
    }


    /** Playback **/

    playFrequency(destination, frequency, startTime, duration, velocity=null, onended=null) {
        for (let i = 0; i < this.config.voices.length; i++) {
            const voice = this.loadVoice(i);
            voice.playFrequency(destination, frequency, startTime, duration, velocity, onended);
        }
    }

    stopPlayback() {
        // Stop all active sources
//             console.log("activeSources!", this.activeSources);
        for (let i = 0; i < this.config.voices.length; i++) {
            try {
                const voice = this.loadVoice(i);
                voice.stopPlayback(); // TODO: hacky?
            } catch (e) {
                console.warn(e);
            }
        }

    }

    /** Static **/

    unloadAll() {
        // Unload all cached samples from this instrument type
    }

    /** Modify Instrument **/


    // async addVoice(voiceURL, voiceName=null, promptUser=false) {
    //     const defaultVoiceName = voiceURL.split('/').pop();
    //     // voiceURL = new URL(voiceURL) + '';
    //     if(promptUser) {
    //         voiceURL = prompt(`Add Voice URL:`, voiceURL || 'https://mysite.com/myvoice.wav');
    //         voiceName = prompt(`Set Voice Name:`, voiceName || defaultVoiceName);
    //     }
    //     if (!voiceURL)
    //         throw new Error("Change voice URL canceled");
    //     if(!voiceName)
    //         voiceName = defaultVoiceName;
    //
    //
    //     // if (voiceURL.endsWith('.library.json')) {
    //     //     console.log("Loading library: " + voiceURL);
    //     //     await this.voiceLibrary.loadFromURL(voiceURL);
    //     //     this.fieldAddVoice.value = '';
    //     // } else {
    //
    //     if(!voiceName && promptUser)
    //         voiceName = prompt(`Set Voice Name:`, voiceName);
    //     const addVoiceID = this.config.voices.length;
    //     this.config.voices[addVoiceID] = {
    //         url: voiceURL,
    //         name: voiceName,
    //         // name: addVoiceName
    //     };
    //     await this.loadVoice(addVoiceID);
    //
    //     if(this.grid) await this.grid.forceUpdate();
    //     else this.forceUpdate();
    // }

    /** Voice Library **/

    // async loadVoiceLibrary() {
    //     if(this.config.libraryURL)
    //         this.voiceLibrary = await Library.loadFromURL(this.config.libraryURL);
    //     else
    //         this.voiceLibrary = await Library.loadDefaultLibrary();
    //     console.log("TODO: refresh renderer");
    // }

    // onSourceEnd(e, source) {
    //     const activeSourceI = this.activeSources.indexOf(source);
    //     if (activeSourceI !== -1)
    //         this.activeSources.splice(activeSourceI, 1);
    // }




    // getFrequencyFromAlias(aliasName) {
    //     for (let voiceID = 0; voiceID < this.config.voices.length; voiceID++) {
    //         const voiceConfig = this.config.voices[voiceID];
    //         if (voiceConfig && voiceConfig.alias && aliasName === voiceConfig.name) {
    //             return voiceConfig.alias;
    //         }
    //     }
    //     return null;
    // }


//     getFrequencyAliases() {
//         const aliases = {};
//         for (let voiceID = 0; voiceID < this.config.voices.length; voiceID++) {
//             const voiceConfig = this.config.voices[voiceID];
//             if (voiceConfig && voiceConfig.alias)
//                 aliases[voiceConfig.name] = voiceConfig.alias;
//         }
//         return aliases;
//     }
//
//
//     getCommandKeyNumber(command) {
//         if (Number(command) === command && command % 1 !== 0)
//             return command;
//         if (!command)
//             return null;
//
//         const noteCommands = this.noteFrequencies; // ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
//         let octave = command.length === 3 ? command.charAt(2) : command.charAt(1),
//             keyNumber = noteCommands.indexOf(command.slice(0, -1));
//         if (keyNumber < 3) keyNumber = keyNumber + 12 + ((octave - 1) * 12) + 1;
//         else keyNumber = keyNumber + ((octave - 1) * 12) + 1;
//         return keyNumber;
//     }
//
//     getCommandFrequency(command) {
//         const keyNumber = this.getCommandKeyNumber(command);
//         return 440 * Math.pow(2, (keyNumber - 49) / 12);
//     }
//
//     get noteFrequencies() {
//         return ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
//     }
//


}


export default PolyphonyInstrument;

