import PeriodicWaveLoader from "./loader/PeriodicWaveLoader";
import {ArgType, ProgramLoader} from "../../../common/";


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
        this.loadedLFOs = [];
        this.loadedEnvelope = null;
        this.loading = this.loadPrograms();
    }

    /** Async loading **/

    async waitForAssetLoad() {
        await this.loading;
    }

    /** Loading **/

    loadLFO(lfoID) {
        if(this.loadedLFOs[lfoID])
            return this.loadedLFOs[lfoID];
        if(!this.config.lfos[lfoID])
            throw new Error("LFO config is missing: " + lfoID);
        const [voiceClassName, voiceConfig] = this.config.lfos[lfoID];
        let {classProgram:lfoClass} = ProgramLoader.getProgramClassInfo(voiceClassName);
        const loadedVoice = new lfoClass(voiceConfig);
        this.loadedLFOs[lfoID] = loadedVoice;
        return loadedVoice;
    }

    loadEnvelope() {
        const [voiceClassName, voiceConfig] = this.config.envelope || OscillatorInstrument.defaultEnvelope;
        let {classProgram:envelopeClass} = ProgramLoader.getProgramClassInfo(voiceClassName);
        const loadedVoice = new envelopeClass(voiceConfig);
        this.loadedEnvelope = loadedVoice;
        return loadedVoice;
    }

    async loadPrograms() {
        const promises = [
            this.loadEnvelope()
        ];
        const lfos = this.config.lfos || [];
        for (let i = 0; i < lfos.length; i++) {
            const lfo = this.loadLFO(i);
            if(typeof lfo.waitForAssetLoad === "function")
                promises.push(lfo.waitForAssetLoad());
        }
        for(let i=0; i < promises.length; i++)
            await promises[i];
    }


    /** Command Routing **/


    /** Effect **/

    // useDestination(oldDestination) {
    //     return null; // Null is no effect processing
    // }

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


        const waveLoader = new PeriodicWaveLoader(audioContext);

        // Convert frequency from string
        // if(typeof frequency === "string")
        //     frequency = Values.instance.parseFrequencyString(frequency);

        // TODO: Detect config changes on the fly. Leave caching to browser. Destination cache?

        // console.log('playFrequency', destination, frequency, startTime, duration, velocity)


        //         // Filter voice playback
        //         if (voiceConfig.alias) {
        //             if(voiceConfig.alias !== commandFrequency)
        //                 // if(voiceConfig.name !== namedFrequency)
        //                 continue;
        //         } else {
        //             frequencyValue = this.getCommandFrequency(commandFrequency);
        //         }
        //
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
                if(!this.config.url)
                    throw new Error("Custom osc requires a url");
                if(waveLoader.isPeriodicWaveAvailable(this.config.url)) {
                    oscillator.setPeriodicWave(waveLoader.getCachedPeriodicWaveFromURL(this.config.url))
                } else {
                    waveLoader.loadPeriodicWaveFromURL(this.config.url)
                        .then(periodicWave => oscillator.setPeriodicWave(periodicWave));
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
        console.log('TODO playMIDIEvent', destination, eventData);
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

