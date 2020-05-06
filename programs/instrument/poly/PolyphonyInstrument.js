import ProgramLoader from "../../../common/program/ProgramLoader";
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
        let {classProgram:voiceClass} = ProgramLoader.getProgramClassInfo(voiceClassName);
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
        // Unload all cached samples from this program type
    }



}


export default PolyphonyInstrument;

