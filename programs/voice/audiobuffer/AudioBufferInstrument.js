import AudioBufferLoader from "./loader/AudioBufferLoader";
import {ArgType, ProgramLoader, Values} from "../../../common";

let activeNotes = [];

class AudioBufferInstrument {
    /** Command Args **/
    static argTypes = {
        playFrequency: [ArgType.destination, ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.velocity],
        pitchBendTo: [ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.onended],
    };

    /** Command Aliases **/
    static commandAliases = {
        pf: "playFrequency",
        bt: "pitchBendTo",
    }

    static defaultEnvelope = ['envelope', {}];


    constructor(config={}) {
        // console.log('AudioBufferInstrument', config);

        this.config = config;
        // this.freqRoot = this.config.root ? Values.instance.parseFrequencyString(this.config.root) : 220;
        this.params = {}
        this.activeMIDINotes = []


        // Filter sample playback

        // Envelope
        const [envelopeClassName, envelopeConfig] = this.config.envelope || AudioBufferInstrument.defaultEnvelope;
        let {classProgram:envelopeClass} = ProgramLoader.getProgramClassInfo(envelopeClassName);
        this.loadedEnvelope = new envelopeClass(envelopeConfig);


        // LFOs
        this.loadedLFOs = [];
        const lfos = this.config.lfos || [];
        for (let lfoID=0; lfoID<lfos.length; lfoID++) {
            const lfo = lfos[lfoID];
            const [voiceClassName, voiceConfig] = lfo;
            let {classProgram:lfoClass} = ProgramLoader.getProgramClassInfo(voiceClassName);
            this.loadedLFOs[lfoID] = new lfoClass(voiceConfig);
        }

    }


    setBuffer(source, audioBuffer) {
        source.buffer = audioBuffer;
        // console.log("Set audio buffer: ", this.config.url, source, this.audioBuffer);

        if(this.config.loop) {
            source.loop = true;
            if (typeof this.config.loopStart !== "undefined")
                source.loopStart = this.config.loopStart / audioBuffer.sampleRate;
            if (typeof this.config.loopEnd !== "undefined")
                source.loopEnd = this.config.loopEnd / audioBuffer.sampleRate;
        }
        // console.log("Set audio buffer: ", this.audioBuffer, this.config.url, source);
    }

    /** Async loading **/


    async waitForAssetLoad() {
        if(this.config.url) {
            const service = new AudioBufferLoader();
            await service.loadAudioBufferFromURL(this.config.url);
        }
    }

    /** Playback **/

    playFrequency(destination, frequency, startTime=null, duration=null, velocity=null, onended=null) {
        const config = this.config;
        if (config.alias) {
            // this.freqRange = null;
            // if (config.alias) {
            //     const freqAlias = Values.instance.parseFrequencyString(config.alias);
            //     this.freqRange = [freqAlias, freqAlias];
            // } else {
            //     this.freqRange = null;
            // }
            // if (
            //     this.freqRange[0] < frequency
            //     || this.freqRange[1] > frequency
            // ) {
            //     console.log("Skipping out of range note: ", frequency, this.freqRange);
            //     return false;
            // }
        }
        // console.log('playFrequency', frequency, this);

        const audioContext = destination.context;
        if (typeof duration === "number") {
            if (startTime + duration < audioContext.currentTime) {
                console.info("Skipping note: ", startTime, '+', duration, '<', audioContext.currentTime)
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

        // Load Sample
        const service = new AudioBufferLoader();
        if(config.url) {
            let buffer = service.tryCache(config.url);
            if (buffer) {
                this.setBuffer(source, buffer);
            } else {
                service.loadAudioBufferFromURL(config.url)
                    .then(audioBuffer => {
                        this.setBuffer(source, audioBuffer);
                    });
            }
        } else {
            console.warn("No config.url is set", this);
        }


        // Playback Rate
        const freqRoot = config.root ? Values.instance.parseFrequencyString(config.root) : 220;
        source.playbackRate.value = frequency / freqRoot;

        // Detune
        if(typeof config.detune !== "undefined")
            source.detune.value = config.detune;


        // Envelope

        let amplitude = 1;
        if(typeof config.mixer !== "undefined")
            amplitude = config.mixer / 100;
        if(velocity !== null)
            amplitude *= parseFloat(velocity || 127) / 127;
        const gainNode = this.loadedEnvelope.createEnvelope(destination, startTime, amplitude);
        destination = gainNode;

        // LFOs

        const activeLFOs = [];
        for(const LFO of this.loadedLFOs) {
            activeLFOs.push(LFO.createLFO(source, frequency, startTime, null, velocity));
        }


        source.connect(destination);
        source.start(startTime);
        source.noteOff = (endTime=audioContext.currentTime, stopSource=true) => {
            const i = activeNotes.indexOf(source);
            if(i !== -1) {
                activeNotes.splice(i, 1);
                const sourceEndTime = this.loadedEnvelope.increaseDurationByRelease(endTime)
                if(stopSource) {
                    source.stop(sourceEndTime);
                }
                gainNode.noteOff(endTime);
                for(const lfo of activeLFOs) {
                    lfo.noteOff(sourceEndTime);
                }
                onended && onended();
            }
        };
        // console.log("Note Start: ", config.url, this.audioBuffer, source);
        source.onended = () => {
            source.noteOff(audioContext.currentTime, false);
            // console.log("Note Ended: ", config.url, this.audioBuffer, source);
        }

        activeNotes.push(source);

        if(duration !== null) {
            if(duration instanceof Promise) {
                // Support for duration promises
                duration.then(() => source.noteOff())
            } else {
                source.noteOff(startTime + duration);
            }
        }

        return source;
    }

    /** MIDI Events **/

    playMIDIEvent(destination, eventData, onended=null) {
        let newMIDICommand;
        // console.log('playMIDIEvent', eventData);
        switch (eventData[0]) {
            case 144:   // Note On
                newMIDICommand = Values.instance.getCommandFromMIDINote(eventData[1]);
                const newMIDIFrequency = Values.instance.parseFrequencyString(newMIDICommand);
                let newMIDIVelocity = Math.round((eventData[2] / 128) * 100);
                const source = this.playFrequency(destination, newMIDIFrequency, null, null, newMIDIVelocity);
                if(source) {
                    if (this.activeMIDINotes[newMIDICommand])
                        this.activeMIDINotes[newMIDICommand].noteOff();
                    this.activeMIDINotes[newMIDICommand] = source;
                }
                return source;

            case 128:   // Note Off
                newMIDICommand = Values.instance.getCommandFromMIDINote(eventData[1]);
                if(this.activeMIDINotes[newMIDICommand]) {
                    this.activeMIDINotes[newMIDICommand].noteOff();
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

