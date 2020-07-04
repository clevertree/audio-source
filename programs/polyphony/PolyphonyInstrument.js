import ProgramLoader from "../../common/program/ProgramLoader";
import {Values} from "../../common";

class PolyphonyInstrument {
    constructor(config={}) {
        this.config = config;
        this.loadedVoices = [];
    }

    /** Loading **/

    loadVoice(voiceID) {
        if(this.loadedVoices[voiceID])
            return this.loadedVoices[voiceID];
        if(!this.config.voices[voiceID])
            throw new Error("Voice config is missing: " + voiceID);
        const [voiceClassName, voiceConfig] = this.config.voices[voiceID];
        let {classProgram:voiceClass} = ProgramLoader.getProgramClassInfo(voiceClassName);
        const loadedVoice = new voiceClass(voiceConfig);
        this.loadedVoices[voiceID] = loadedVoice;
        return loadedVoice;
    }


    /** Playback **/

    playFrequency(destination, frequency, startTime, duration=null, velocity=null, onended=null) {
        if(typeof frequency === "string")
            frequency = Values.instance.parseFrequencyString(frequency);
        for (let i = 0; i < this.config.voices.length; i++) {
            const voice = this.loadVoice(i);
            voice.playFrequency(destination, frequency, startTime, duration, velocity, onended);
        }
    }

    stopPlayback() {
        this.loadedVoices.forEach(loadedVoice => loadedVoice.stopPlayback())
    }

    /** Static **/

    unloadAll() {
        // Unload all cached samples from this program type
    }


}


export default PolyphonyInstrument;

