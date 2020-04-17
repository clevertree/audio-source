import PeriodicWaveLoader from "../loader/PeriodicWaveLoader";


class OscillatorNodeInstrument {
    constructor(config={}) {
        console.log('OscillatorNodeInstrument', config);
        this.config = config;
    }

    /** Effect **/

    getDestination(oldDestination) {
        return null; // Null is no effect processing
    }

    /** Playback **/

    playFrequency(destination, frequency, startTime, duration, velocity, onended=null) {
        const audioContext = destination.context;
        const waveLoader = new PeriodicWaveLoader(audioContext);


        // TODO: Detect config changes on the fly. Leave caching to browser. Destination cache?

//         console.log('playFrequency', destination, frequency, startTime, duration, velocity)


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

        osc.connect(destination);
        osc.start(startTime);
        osc.stop(startTime + duration);

        OscillatorNodeInstrument.playingOSCs.push(osc);
        osc.onended = function() {
            const i = OscillatorNodeInstrument.playingOSCs.indexOf(osc);
            if(i !== -1)
                OscillatorNodeInstrument.playingOSCs.splice(i, 1);
            onended && onended();
        };

    }



    /** Static **/

    static playingOSCs = [];

    static stopPlayback() {
        // Stop all active sources
        //     console.log("this.playingOSCs", this.playingOSCs);
        for (let i = 0; i < this.playingOSCs.length; i++) {
            try {
                this.playingOSCs[i].stop();
            } catch (e) {
                console.warn(e);
            }
        }
        this.playingOSCs = [];
    }


    static waveURLCache = {};

    static unloadAll() {
        this.waveURLCache = {}
        // Unload all cached samples from this program type
    }
}

export default OscillatorNodeInstrument;
