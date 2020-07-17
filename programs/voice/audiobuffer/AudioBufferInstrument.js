import {FileService} from "../../../song/";


class AudioBufferInstrument {
    constructor(config={}, audioContext=null) {
        this.config = config;
        this.audioContext = audioContext;
        this.audioBuffer = null;
        this.loadAudioBuffer();
        console.log('AudioBufferInstrument', config);
    }
    async loadAudioBuffer() {

        const service = new FileService();
        const buffer = await service.loadBufferFromURL(this.config.url);
        this.audioBuffer = this.audioContext.decodeAudioData(buffer);
    }

    /** Playback **/

    playFrequency(destination, frequencyValue, startTime, duration, velocity, onended=null) {
        // Velocity
        let velocityGain = destination.context.createGain();
        velocityGain.gain.value = parseFloat(velocity || 127) / 127;
        velocityGain.connect(destination);
        destination = velocityGain;

        // Audio Buffer
        const source = destination.context.createBufferSource();
        source.buffer = this.audioBuffer;
        if(typeof this.config.loop !== "undefined")
            source.loop = !!this.config.loop;
        const playbackRate = frequencyValue / (this.config.root ? this.getCommandFrequency(this.config.root) : 440);
        source.playbackRate.value = playbackRate; //  Math.random()*2;
        if(typeof this.config.detune !== "undefined")
            source.detune.value = this.config.detune;


        source.connect(destination);
        source.start(startTime);
        source.stop(startTime + duration);
        if(onended)
            source.onended = onended;

        // TODO: envelop is an effect
        // let adsr = this.config.adsr || [0, 0, 0, .1];
        // let currentTime = destination.context.currentTime;
        // startTime = startTime !== null ? startTime : currentTime;
        // duration = duration !== null ? duration : 0;


        // velocityGain.gain.linearRampToValueAtTime(velocityGain.gain.value, startTime + duration);
        // velocityGain.gain.linearRampToValueAtTime(0, startTime + duration + adsr[3]);
        return source;
    }

    /** MIDI Events **/

    playMIDIEvent(destination, eventData, onended=null) {
        console.log('TODO playMIDIEvent', destination, eventData);
    }
}

export default AudioBufferInstrument;

