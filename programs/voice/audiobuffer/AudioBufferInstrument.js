import AudioBufferLoader from "./loader/AudioBufferLoader";
import {Values} from "../../../common";

let activeNotes = [];

class AudioBufferInstrument {
    constructor(config={}) {
        // console.log('AudioBufferInstrument', config);

        this.config = config;
        this.freqRoot = this.config.root ? Values.instance.parseFrequencyString(this.config.root) : 220;
        this.params = {}


        // Filter sample playback
        if (config.alias) {
            const freqAlias = Values.instance.parseFrequencyString(config.alias);
            this.freqRange = [freqAlias, freqAlias];
        } else {
            this.freqRange = null;
        }

        this.audioBuffer = null;
        this.loading = false;

        const service = new AudioBufferLoader();
        if(typeof this.config.url !== "undefined") {
            let buffer = service.tryCache(this.config.url);
            if(buffer) {
                this.audioBuffer = buffer;
            } else {
                this.loading = service.loadAudioBufferFromURL(this.config.url, true)
                    .then(audioBuffer => {
                        console.log("Loaded audio buffer: ", this.config.url, audioBuffer);
                        this.audioBuffer = audioBuffer;
                    });
            }
        }

        this.activeMIDINotes = []
    }



    setBuffer(source) {
        source.buffer = this.audioBuffer;
        // console.log("Set audio buffer: ", this.config.url, source, this.audioBuffer);

        if(this.config.loop) {
            source.loop = true;
            if (typeof this.config.loopStart !== "undefined")
                source.loopStart = this.config.loopStart / this.audioBuffer.sampleRate;
            if (typeof this.config.loopEnd !== "undefined")
                source.loopEnd = this.config.loopEnd / this.audioBuffer.sampleRate;
        }
        // console.log("Set audio buffer: ", this.audioBuffer, this.config.url, source);
    }

    /** Async loading **/

    async waitForAssetLoad() {
        await this.loading;
    }

    /** Playback **/

    playFrequency(destination, frequencyValue, startTime=null, duration=null, velocity=null, onended=null) {
        if (this.freqRange) {
            if (
                this.freqRange[0] < frequencyValue
                || this.freqRange[1] > frequencyValue
            ) {
                // console.log("Skipping out of range note: ", frequencyValue, this.freqRange);
                return false;
            }
        }
        // console.log('playFrequency', frequencyValue, this);

        let endTime;
        const audioContext = destination.context;
        if (typeof duration === "number") {
            endTime = startTime + duration;
            if (endTime < audioContext.currentTime) {
                console.info("Skipping note: ", startTime, endTime, audioContext.currentTime)
                return false;
            }
        }
        if (startTime === null)
            startTime = audioContext.currentTime;
        else if (startTime < 0)
            startTime = 0; // TODO: adjust buffer offset.

        // Velocity
        let velocityGain = destination.context.createGain();
        velocityGain.gain.value = parseFloat(velocity || 127) / 127;
        velocityGain.connect(destination);
        destination = velocityGain;

        // Audio Buffer
        const source = destination.context.createBufferSource();
        if (this.audioBuffer) {
            this.setBuffer(source);
        } else {
            this.loadBuffer()
                .then(buffer => this.setBuffer(source))
            console.warn("Note playback started without an audio buffer: " + this.config.url);
        }
        const playbackRate = frequencyValue / this.freqRoot;
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
        activeNotes.push(source);
        // console.log("Note Start: ", this.config.url, this.audioBuffer, source);
        source.onended = () => {
            const i = activeNotes.indexOf(source);
            activeNotes.splice(i, 1);
            onended && onended();
            // console.log("Note Ended: ", this.config.url, this.audioBuffer, source);
        }

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
                const source = this.playFrequency(destination, newMIDIFrequency, null, null, newMIDIVelocity);
                if(source) {
                    if (this.activeMIDINotes[newMIDICommand])
                        this.activeMIDINotes[newMIDICommand].stop();
                    this.activeMIDINotes[newMIDICommand] = source;
                }
                return source;

            case 128:   // Note Off
                newMIDICommand = Values.instance.getCommandFromMIDINote(eventData[1]);
                if(this.activeMIDINotes[newMIDICommand]) {
                    this.activeMIDINotes[newMIDICommand].stop();
                    delete this.activeMIDINotes[newMIDICommand];
                    return true;
                } else {
                    return false;
                }

            default:
                break;
        }
    }

    /** Static **/


    static stopPlayback() {
        for(const activeNote of activeNotes)
            activeNote.stop();

        activeNotes = [];
    }
}



export default AudioBufferInstrument;

