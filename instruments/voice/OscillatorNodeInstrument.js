class OscillatorNodeInstrument {
    constructor(config={}, audioContext=null) {
        console.log('OscillatorNodeInstrument', config, audioContext);
        this.config = config;
        this.audioContext = audioContext;

        this.periodicWave = null;
        if(config.url)
            this.loadPeriodicWaveFromURL(config.url);
        else if(config.real || config.imag)
            this.loadPeriodicWave(this.config);

        this.playingOSCs = [];
    }

    loadPeriodicWave(waveData) {
        if(!waveData.real)
            throw new Error("Invalid 'real' data for createPeriodicWave");
        if(!waveData.imag)
            throw new Error("Invalid 'imag' data for createPeriodicWave");
        this.periodicWave = this.audioContext.createPeriodicWave(
            new Float32Array(waveData.real),
            new Float32Array(waveData.imag)
        );
    }

    async loadPeriodicWaveFromURL(url) {
        // TODO Use file service
        if(OscillatorNodeInstrument.waveURLCache[url]) {
            this.periodicWave = OscillatorNodeInstrument.waveURLCache[url];
        } else {
            const response = await fetch(url);
            const waveData = await response.json();
            this.loadPeriodicWave(waveData);
            OscillatorNodeInstrument.waveURLCache[url] = this.periodicWave;
        }
    }

    /** Playback **/

    playFrequency(destination, frequency, startTime, duration, velocity, onended=null) {

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
            case null:
            case 'custom':
                if(this.periodicWave)
                    osc.setPeriodicWave(this.periodicWave);
                else
                    console.warn("Periodic wave was not loaded");
                break;
        }

        osc.connect(destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
        this.playingOSCs.push(osc);
        osc.onended = () => {
            this.playingOSCs = this.playingOSCs.filter(osc2 => osc2 !== osc);
            onended && onended();
        };

        return osc;
    }



    stopPlayback() {
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


    /** Static **/

    static waveURLCache = {};

    static unloadAll() {
        this.waveURLCache = {}
        // Unload all cached samples from this instrument type
    }
}

export default OscillatorNodeInstrument;
