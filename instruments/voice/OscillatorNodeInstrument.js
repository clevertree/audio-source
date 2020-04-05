class OscillatorNodeInstrument {
    constructor(config={}, audioContext=null) {
        this.config = config;
        this.audioContext = audioContext;

        this.periodicWave = null;
        if(config.url || config.real || config.imag)
            config.type = 'custom';
        if(config.type === 'custom')
            this.loadPeriodicWave()
                .then()

        this.playingOSCs = [];
    }

    async loadPeriodicWave() {
        let waveData = this.config;
        if(this.config.url) {
            const response = await fetch(this.config.url);
            waveData = await response.json();
        }
        if(!waveData.real)
            throw new Error("Invalid 'real' data for createPeriodicWave");
        if(!waveData.imag)
            throw new Error("Invalid 'imag' data for createPeriodicWave");
        this.periodicWave = this.audioContext.createPeriodicWave(
            new Float32Array(waveData.real),
            new Float32Array(waveData.imag)
        );

    }

    /** Playback **/

    playNote(destination, frequency, startTime, duration, velocity, onended=null) {
//         console.log('playNote', destination, frequency, startTime, duration, velocity)


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
        console.log('velocity', velocity);
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

        osc.type = this.config.type;
        switch(this.config.type) {
            default:
                break;
            case 'custom':
                osc.setPeriodicWave(this.periodicWave);
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
//             console.log("activeSources!", this.activeSources);
        for (let i = 0; i < this.playingOSCs.length; i++) {
            try {
                this.playingOSCs[i].stop();
            } catch (e) {
                console.warn(e);
            }
        }
        this.playingOSCs = [];

    }
}

export default OscillatorNodeInstrument;
