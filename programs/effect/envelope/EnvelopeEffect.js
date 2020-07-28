import {ProgramLoader} from "../../../common";

class EnvelopeEffect {
    constructor(config={}) {
        this.config = config;

        if(!this.config.voice)
            throw new Error("Voice config is missing");
        const [voiceClassName, voiceConfig] = this.config.voice;
        let {classProgram:voiceClass} = ProgramLoader.getProgramClassInfo(voiceClassName);
        this.voice = new voiceClass(voiceConfig);
        console.log(this.constructor.name, this);
    }


    /** Async loading **/

    async waitForAssetLoad() {
        if(typeof this.voice.waitForAssetLoad === "function")
            await this.voice.waitForAssetLoad();
    }

    /** Playback **/

    playFrequency(destination, frequency, startTime, duration=null, velocity=null, onended=null) {
        return this.voice.playFrequency(destination, frequency, startTime, duration, velocity, onended);
    }

    /** MIDI Events **/

    playMIDIEvent(destination, eventData, onended=null) {
        return this.voice.playFrequency(destination, eventData, onended);
    }

    /** Static **/

    static stopPlayback() {
    }

    static unloadAll() {
    }

}


export default EnvelopeEffect;

