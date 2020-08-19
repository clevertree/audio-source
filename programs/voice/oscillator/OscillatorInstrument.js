import PeriodicWaveLoader from "./loader/PeriodicWaveLoader";
import {ArgType, ProgramLoader, Values} from "../../../common/";


export default class OscillatorInstrument {
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
        // console.log('OscillatorInstrument', config);
        this.config = config;
        this.playingOSCs = [];
        this.loadedPeriodicWave = null;


        // Envelope
        const [voiceClassName, voiceConfig] = this.config.envelope || OscillatorInstrument.defaultEnvelope;
        let {classProgram:envelopeClass} = ProgramLoader.getProgramClassInfo(voiceClassName);
        this.loadedEnvelope = new envelopeClass(voiceConfig);


        // LFOs
        this.loadedLFOs = [];
        const lfos = this.config.lfos || [];
        for (let lfoID=0; lfoID<lfos.length; lfoID++) {
            const lfo = lfos[lfoID];
            const [voiceClassName, voiceConfig] = lfo;
            let {classProgram:lfoClass} = ProgramLoader.getProgramClassInfo(voiceClassName);
            this.loadedLFOs[lfoID] = new lfoClass(voiceConfig);
        }

        // Audio Buffer
        this.periodicWave = null;
        const service = new PeriodicWaveLoader();
        if(typeof this.config.url !== "undefined") {
            let buffer = service.tryCache(this.config.url);
            if(buffer) {
                this.periodicWave = buffer;
            } else {
                this.periodicWave = service.loadPeriodicWaveFromURL(this.config.url)
                    .then(periodicWave => {
                        console.log("Loaded periodic wave: ", this.config.url, periodicWave);
                        this.periodicWave = periodicWave;
                    });
            }
        }


        this.activeMIDINotes = []
    }

    setPeriodicWave(oscillator, periodicWave) {
        if(!periodicWave instanceof PeriodicWave)
            throw new Error("Invalid Periodic Wave: " + typeof periodicWave);
        oscillator.setPeriodicWave(periodicWave)
    }

    /** Async loading **/

    async waitForAssetLoad() {
        await this.periodicWave;
    }


    /** Playback **/

    playFrequency(destination, frequency, startTime, duration=null, velocity=null, onended=null) {
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
        // console.log('playFrequency', startTime, duration, destination.context.currentTime);



        //         // Filter voice playback

        //         if (voiceConfig.keyLow && this.getCommandFrequency(voiceConfig.keyLow) > frequencyValue)
        //             continue;
        //         if (voiceConfig.keyHigh && this.getCommandFrequency(voiceConfig.keyHigh) < frequencyValue)
        //             continue;


        // https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode
        const oscillator = destination.context.createOscillator();   // instantiate an oscillator
        oscillator.frequency.value = frequency;    // set Frequency (hz)
        if (typeof this.config.detune !== "undefined")
            oscillator.detune.value = this.config.detune;
        switch(this.config.type) {
            default:
                oscillator.type = this.config.type;
                break;

            // case null:
            case 'custom':
                if(this.periodicWave instanceof Promise) {
                    console.warn("Note playback started without an audio buffer: " + this.config.url);
                    this.periodicWave
                        .then(periodicWave => this.setPeriodicWave(oscillator, periodicWave))
                } else {
                    this.setPeriodicWave(oscillator, this.periodicWave);
                }
                break;
        }



        // Envelope

        const gainNode = this.loadedEnvelope.playFrequency(destination, frequency, startTime, duration, velocity);
        destination = gainNode;

        // LFOs

        for(const LFO of this.loadedLFOs) {
            LFO.playFrequency(oscillator, frequency, startTime, duration, velocity);
        }



        oscillator.connect(destination);
        oscillator.start(startTime);
        if(duration !== null) {
            if(duration instanceof Promise) {
                // Support for duration promises
                duration.then(function() {
                    oscillator.stop();
                })
            } else {
                oscillator.stop(endTime);
            }
        }

        this.playingOSCs.push(oscillator);
        oscillator.onended = () => {
            const i = this.playingOSCs.indexOf(oscillator);
            if(i !== -1)
                this.playingOSCs.splice(i, 1);
            onended && onended();
        };

        return oscillator;
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
            // console.log("MIDI On", newMIDICommand, newMIDIVelocity, eventData);

            case 128:   // Note Off
                newMIDICommand = Values.instance.getCommandFromMIDINote(eventData[1]);
                if(this.activeMIDINotes[newMIDICommand]) {
                    this.activeMIDINotes[newMIDICommand].stop();
                    delete this.activeMIDINotes[newMIDICommand];
                    return true;
                    // console.log("MIDI Off", newMIDICommand, eventData);
                } else {
                    return false;
                    // console.warn("No 'ON' note was found for : " + newMIDICommand);
                }

            default:
                break;
        }
    }


    /** Pitch Bend **/

    pitchBendTo(frequency, startTime, duration) {
        // if(typeof frequency === "string")
        //     frequency = Values.instance.parseFrequencyString(frequency);
        const values = [frequency, frequency*2]

        for (let i = 0; i < this.playingOSCs.length; i++) {
            this.playingOSCs[i].frequency.setValueCurveAtTime(values, startTime, duration)
        }
    }





    stopPlayback() {
        // Stop all active sources
        // console.log("OscillatorInstrument.stopPlayback", this.playingOSCs);
        for (let i = 0; i < this.playingOSCs.length; i++) {
            // try {
                this.playingOSCs[i].stop();
            // } catch (e) {
            //     console.warn(e);
            // }
        }
        this.playingOSCs = [];
    }


    /** Static **/


    static unloadAll() {
        // this.waveURLCache = {}
        // Unload all cached samples from this program type
    }
}

