import PeriodicWaveLoader from "../loader/PeriodicWaveLoader";
import {ArgType} from "../../../common/";


class OscillatorInstrument {
    constructor(config={}) {
        // console.log('OscillatorInstrument', config);
        this.config = config;
        this.playingOSCs = [];
    }

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


    /** Command Routing **/


    /** Effect **/

    useDestination(oldDestination) {
        return null; // Null is no effect processing
    }

    /** Playback **/

    playFrequency(destination, frequency, startTime, duration, velocity, onended=null) {
        const audioContext = destination.context;
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
        if(velocity !== null) {
            let velocityGain = destination.context.createGain();
            velocityGain.gain.value = parseFloat(velocity || 127) / 127;
            velocityGain.connect(destination);
            destination = velocityGain;
        }

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

        let gainLFO = destination.context.createGain();
        gainLFO.gain.value = 10;
        gainLFO.connect(osc.frequency);

        vibratoLFO.connect(gainLFO);
        vibratoLFO.start(startTime);

        // TODO: mixer AudioParam


        osc.connect(destination);
        osc.start(startTime);
        osc.stop(startTime + duration);

        this.playingOSCs.push(osc);
        osc.onended = () => {
            const i = this.playingOSCs.indexOf(osc);
            if(i !== -1)
                this.playingOSCs.splice(i, 1);
            onended && onended();
        };

    }

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
        console.log("OscillatorInstrument.stopPlayback", this.playingOSCs);
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

export default OscillatorInstrument;
