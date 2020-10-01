import {Values, ProgramLoader} from "../../song";

class PolyphonyInstrument {
    constructor(config={}) {
        this.config = config;
        this.loadedVoices = [];
        this.eventListeners = [];
        this.cb = {
            dispatchEvent: e => this.dispatchEvent(e)
        }
    }

    /** Event Listeners **/

    addEventListener(eventName, listenerCallback) {
        this.eventListeners.push([eventName, listenerCallback]);
    }

    dispatchEvent(e) {
        for (const [eventName, listenerCallback] of this.eventListeners) {
            if(e.name === eventName || eventName === '*') {
                listenerCallback(e);
            }
        }
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
        if(typeof loadedVoice.addEventListener === "function")
            loadedVoice.addEventListener('*', this.cb.dispatchEvent);
        this.loadedVoices[voiceID] = loadedVoice;
        return loadedVoice;
    }

    /** Async loading **/

    async waitForAssetLoad() {
        const promises = [];
        const voices = this.config.voices || [];
        for (let i = 0; i < voices.length; i++) {
            const voice = this.loadVoice(i);
            if(typeof voice.waitForAssetLoad === "function")
                promises.push(voice.waitForAssetLoad());
        }
        for(let i=0; i < promises.length; i++)
            await promises[i];
    }

    eachVoice(callback) {

        let played = false;
        const voices = this.config.voices || [];
        for (let i = 0; i < voices.length; i++) {
            const voice = this.loadVoice(i);

            const response = callback(voice);
            if(response !== false)
                played = true;
        }
        return played;
    }

    /** Playback **/

    playFrequency(destination, frequency, startTime, duration=null, velocity=null, onended=null) {
        if(typeof frequency === "string")
            frequency = Values.instance.parseFrequencyString(frequency);
        const played = this.eachVoice(voice => {
            return voice.playFrequency(destination, frequency, startTime, duration, velocity, onended);
        })
        if(!played)
            console.warn("No voices were played: ", this.config);
    }

    /** MIDI Events **/

    playMIDIEvent(destination, eventData, onended=null) {
        const played = this.eachVoice(voice => {
            if(voice.playMIDIEvent)
                return voice.playMIDIEvent(destination, eventData, onended);
            return false;
            // console.warn("Voice " + voice.constructor.name + " has no method 'playMIDIEvent'");
        })
        if(!played)
            console.warn("No voices were played: ", this.config);
    }

    /** Static **/

    static stopPlayback() {
        // this.loadedVoices.forEach(loadedVoice => loadedVoice.stopPlayback())
    }

    static unloadAll() {
        // Unload all cached samples from this program type
    }


}


export default PolyphonyInstrument;

