import AudioBufferLoader from "./loader/AudioBufferLoader";
import {Values} from "../../../common";


class AudioBufferInstrument {
    constructor(config={}) {
        this.config = config;
        this.audioBuffer = null;
        this.loadAudioBuffer();
        console.log('AudioBufferInstrument', config);

        this.activeMIDINotes = []
    }
    async loadAudioBuffer() {
        const service = new AudioBufferLoader();
        // console.log("Loaded audio buffer: ", this.config.url);
        this.audioBuffer = await service.loadAudioBufferFromURL(this.config.url);
        // console.log("Loaded audio buffer: ", this.audioBuffer);
    }

    /** Playback **/

    playFrequency(destination, frequencyValue, startTime=null, duration=null, velocity=null, onended=null) {
        let endTime;
        const audioContext = destination.context;
        if(typeof duration === "number") {
            endTime = startTime + duration;
            if (endTime < audioContext.currentTime) {
                console.info("Skipping note: ", startTime, endTime, audioContext.currentTime)
                return false;
            }
        }
        if(startTime === null)
            startTime = audioContext.currentTime;
        else if(startTime < 0)
            startTime = 0; // TODO: adjust buffer offset.

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
        const playbackRate = frequencyValue / (this.config.root ? Values.instance.parseFrequencyString(this.config.root) : 440);
        source.playbackRate.value = playbackRate; //  Math.random()*2;
        if(typeof this.config.detune !== "undefined")
            source.detune.value = this.config.detune;


        source.connect(destination);
        source.start(startTime);
        if(duration !== null) {
            if(duration instanceof Promise) {
                // Support for duration promises
                duration.then(function() {
                    source.stop();
                })
            } else {
                source.stop(endTime);
            }
        }
        if(onended)
            source.onended = onended;

        return source;
    }

    /** MIDI Events **/

    playMIDIEvent(destination, eventData, onended=null) {
        let newMIDICommand;

        switch (eventData[0]) {
            case 144:   // Note On
                newMIDICommand = Values.instance.getCommandFromMIDINote(eventData[1]);
                const newMIDIFrequency = Values.instance.parseFrequencyString(newMIDICommand);
                let newMIDIVelocity = Math.round((eventData[2] / 128) * 100);
                const source = this.playFrequency(destination, newMIDIFrequency);
                if(this.activeMIDINotes[newMIDICommand])
                    this.activeMIDINotes[newMIDICommand].stop();
                this.activeMIDINotes[newMIDICommand] = source;
                console.log("MIDI On", newMIDICommand, newMIDIVelocity, eventData);
                break;

            case 128:   // Note Off
                newMIDICommand = Values.instance.getCommandFromMIDINote(eventData[1]);
                if(this.activeMIDINotes[newMIDICommand]) {
                    this.activeMIDINotes[newMIDICommand].stop();
                    delete this.activeMIDINotes[newMIDICommand];
                    console.log("MIDI Off", newMIDICommand, eventData);
                } else {
                    console.warn("No 'ON' note was found for : " + newMIDICommand);
                }
                // TODO: turn off playing note, optionally set duration of note
                break;

            default:
                break;
        }
    }
}

export default AudioBufferInstrument;

