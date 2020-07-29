import {ProgramLoader} from "../../../common";

class EnvelopeEffect {
    constructor(config={}) {
        this.config = config;

        if(!this.config.voice)
            throw new Error("Voice config is missing");
        const [voiceClassName, voiceConfig] = this.config.voice;
        let {classProgram:voiceClass} = ProgramLoader.getProgramClassInfo(voiceClassName);
        this.voice = new voiceClass(voiceConfig);
        // console.log(this.constructor.name, this);
    }


    /** Async loading **/

    async waitForAssetLoad() {
        if(typeof this.voice.waitForAssetLoad === "function")
            await this.voice.waitForAssetLoad();
    }

    /** Playback **/

    playFrequency(destination, frequency, startTime, duration=null, velocity=null, onended=null) {

        const velocityValue = parseFloat(velocity || 127) / 127;
        let velocityGain = destination.context.createGain();
        velocityGain.gain.value = 0;
        velocityGain.connect(destination);

        // Attack is the time taken for initial run-up of level from nil to peak, beginning when the key is pressed.
        if(this.config.attack) {
            velocityGain.gain.linearRampToValueAtTime(velocityValue, startTime + (this.config.attack / 1000));
        }

        // Decay is the time taken for the subsequent run down from the attack level to the designated sustain level.
        // Sustain is the level during the main sequence of the sound's duration, until the key is released.
        velocityGain.gain.linearRampToValueAtTime(velocityValue, startTime + duration);

        // Release is the time taken for the level to decay from the sustain level to zero after the key is released.[4]
        if(duration !== null && this.config.release) {
            duration += this.config.release / 1000;
            velocityGain.gain.linearRampToValueAtTime(0, startTime + duration);
        }
        return this.voice.playFrequency(velocityGain, frequency, startTime, duration, velocity, onended);
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

