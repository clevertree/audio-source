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


    constructor(config={}) {
        // console.log('OscillatorInstrument', config);
        this.config = config;
        this.playingOSCs = [];
        this.loadedLFOs = [];
        this.loading = this.loadLFOs();
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

    async loadLFOs() {

        const promises = [];
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

    useDestination(oldDestination) {
        return null; // Null is no effect processing
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

        // Velocity
//         console.log('velocity', velocity);
//         if(velocity !== null) {
//             let velocityGain = destination.context.createGain();
//             velocityGain.gain.value = parseFloat(velocity || 127) / 127;
//             velocityGain.connect(destination);
//             destination = velocityGain;
//         }

        // https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode
        const osc = destination.context.createOscillator();   // instantiate an oscillator
        osc.frequency.value = frequency;    // set Frequency (hz)
        if (typeof this.config.detune !== "undefined")
            osc.detune.value = this.config.detune;

        switch(this.config.type) {
            default:
                osc.type = this.config.type;
                break;

            // case null:
            case 'custom':
                if(!this.config.url)
                    throw new Error("Custom osc requires a url");
                if(waveLoader.isPeriodicWaveAvailable(this.config.url)) {
                    osc.setPeriodicWave(waveLoader.getCachedPeriodicWaveFromURL(this.config.url))
                } else {
                    waveLoader.loadPeriodicWaveFromURL(this.config.url)
                        .then(periodicWave => osc.setPeriodicWave(periodicWave));
                }
                break;
        }

        // TODO: vibrato LFO effect on parameters? don't wrap effect, just include it in instrument
        let vibratoLFO = destination.context.createOscillator();
        vibratoLFO.frequency.value = 5;
        for(const LFO of this.loadedLFOs) {
            LFO.playFrequency(destination, frequency, startTime, duration, velocity);
        }

        // TODO: mixer AudioParam


        osc.connect(destination);
        osc.start(startTime);
        if(duration !== null) {
            if(duration instanceof Promise) {
                // Support for duration promises
                duration.then(function() {
                    osc.stop();
                })
            } else {
                osc.stop(endTime);
            }
        }

        this.playingOSCs.push(osc);
        osc.onended = () => {
            const i = this.playingOSCs.indexOf(osc);
            if(i !== -1)
                this.playingOSCs.splice(i, 1);
            onended && onended();
        };

        return osc;
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

