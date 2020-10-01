import AudioBufferLoader from "./loader/AudioBufferLoader";
import {ArgType, ProgramLoader, Values} from "../../../song";


export default class AudioBufferInstrument {
    /** Command Args **/
    static argTypes = {
        playFrequency: [ArgType.destination, ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.velocity, ArgType.onended],
        pitchBendTo: [ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.onended],
    };

    /** Command Aliases **/
    static commandAliases = {
        pf: "playFrequency",
        bt: "pitchBendTo",
    }

    static defaultEnvelope = ['envelope', {}];
    static defaultRootFrequency = 220;
    static sampleFileRegex = /\.wav$/i;

    /** Parameters **/
    static inputParameters = {
        source: {
            label:      'Sample',
            title:      'Choose Sample',
        },
        mixer: {
            label:      'Mixer',
            title:      'Edit Mixer Amplitude',
            default: 0.8,
            min: 0,
            max: 1,
            step: 0.01,
            format: value => `${Math.round(value*100)}%`
        },
        detune: {
            label:      'Detune',
            title:      `Detune in cents`,
            default: 0,
            min: -1000,
            max: 1000,
            step: 10,
            format: value => `${value}c`

        },
        pulseWidth: {
            label:      'P.Width',
            title:      `Pulse Width`,
            default: 0.5,
            min: 0,
            max: 1,
            step: 0.01,
            format: value => `${Math.round(value*100)}%`
        },
        keyRoot: {
            label: "Root",
            title: "Key Root",
        },
        keyRange: {
            label: "Range",
            title: "Key Range",
        }
    }

    /** Automation Parameters **/
    static sourceParameters = {
        playbackRate: "Playback Rate",
        detune: "Detune",
    };


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

        this.eventListeners = [];
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

    /** Source Buffer **/

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

    addEnvelopeDestination(destination, startTime, velocity) {
        let amplitude = AudioBufferInstrument.inputParameters.mixer.default;
        if(typeof this.config.mixer !== "undefined")
            amplitude = this.config.mixer;
        if(velocity !== null)
            amplitude *= parseFloat(velocity || 127) / 127;
        return this.loadedEnvelope.createEnvelope(destination, startTime, amplitude);
    }

    createAudioBuffer(destination) {
        const config = this.config;
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

        // Connect Source
        source.connect(destination);

        return source;
    }

    playFrequency(destination, frequency, startTime=null, duration=null, velocity=null, onended=null) {
        const config = this.config;
        if(config.keyRange) {
            if(!AudioBufferInstrument.isFrequencyWithinRange(frequency, config.keyRange))
                return false;
        }

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

        // Envelope
        const gainNode = this.addEnvelopeDestination(destination, startTime, velocity);
        destination = gainNode;


        // Audio Buffer
        const source = this.createAudioBuffer(destination);

        // Detune
        if(typeof config.detune !== "undefined")
            source.detune.value = config.detune;

        // Playback Rate
        let freqRoot = AudioBufferInstrument.defaultRootFrequency;
        if(config.keyRoot) {
            const keyRoot = Values.instance.parseFrequencyString(config.keyRoot);
            frequency *= keyRoot / AudioBufferInstrument.defaultRootFrequency;
        }
        source.playbackRate.value = frequency / freqRoot;



        // LFOs

        const activeLFOs = [];
        for(const LFO of this.loadedLFOs) {
            activeLFOs.push(LFO.createLFO(source, frequency, startTime, null, velocity));
        }
        source.lfos = activeLFOs;

        // Start Source
        source.start(startTime);
        this.dispatchEvent({
            type: 'program:play',
            frequency,
            velocity
        })
        // console.log("Note Start: ", config.url, frequency);

        // Set up Note-Off
        source.noteOff = (endTime=audioContext.currentTime) => {
            gainNode.noteOff(endTime); // End Envelope on the note end time

            // Get the source end time, when the note actually stops rendering
            const sourceEndTime = this.loadedEnvelope.increaseDurationByRelease(endTime);
            for(const lfo of activeLFOs) {
                lfo.noteOff(sourceEndTime); // End LFOs on the source end time.
            }
            // console.log('noteOff', {frequency, endTime});

            // Stop the source at the source end time
            source.stop(sourceEndTime);

        };

        // Set up on end.
        source.onended = () => {
            if(hasActiveNote(source)) {
                removeActiveNote(source);
                activeLFOs.forEach(lfo => lfo.stop());
                onended && onended();
            }
            this.dispatchEvent({
                type: 'program:stop',
                frequency,
            })
            // console.log("Note Ended: ", config.url, frequency);
        }

        // Add Active Note
        activeNotes.push(source);

        // If Duration, queue note end
        if(duration !== null) {
            if(duration instanceof Promise) {
                // Support for duration promises
                duration.then(() => source.noteOff())
            } else {
                source.noteOff(startTime + duration);
            }
        }

        // Return source
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
        console.log(this.name, `stopping ${activeNotes.length} notes`, activeNotes);
        for(const activeNote of activeNotes)
            activeNote.stop();
        activeNotes = [];
    }


    static isFrequencyWithinRange(frequency, range) {
        let [rangeStart, rangeEnd] = this.getRange(range);
        if(rangeStart) {
            if(typeof rangeStart === "string")
                rangeStart = Values.instance.parseFrequencyString(rangeStart);
            if(rangeStart < frequency) {
                // console.log("Skipping note below rangeStart: ", rangeStart, "<", frequency);
                return false;
            }
        }
        if(rangeEnd) {
            if(typeof rangeEnd === "string")
                rangeEnd = Values.instance.parseFrequencyString(rangeEnd);
            if(rangeEnd > frequency) {
                // console.log("Skipping note after rangeEnd: ", rangeEnd, ">", frequency);
                return false;
            }
        }
        // console.log("Frequency is within range: ", rangeStart, ">", frequency, ">", rangeEnd);

        return true;
    }

    static getRange(keyRange) {
        if(!keyRange)
            return null;
        let range = keyRange;
        if(typeof range === "string")
            range = range.split(':');

        if(range.length === 1)
            range[1] = range[0];

        return range;
    }


}

let activeNotes = [];
function removeActiveNote(source) {
    const i=activeNotes.indexOf(source);
    if(i !== -1)
        activeNotes.splice(i, 1);
}
function hasActiveNote(source) {
    return activeNotes.indexOf(source) !== -1;
}


