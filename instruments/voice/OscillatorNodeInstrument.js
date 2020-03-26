class OscillatorNodeInstrument {
    constructor(config={}, audioContext=null) {
        this.config = {};
        this.audioContext = audioContext;

        this.periodicWave = null;
        if(config.url || config.real || config.imag)
            config.type = 'custom';
        if(config.type === 'custom')
            this.loadPeriodicWave()
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
        // Velocity
        let velocityGain = destination.context.createGain();
        velocityGain.gain.value = parseFloat(velocity || 127) / 127;
        velocityGain.connect(destination);
        destination = velocityGain;


        const osc = destination.context.createOscillator();   // instantiate an oscillator
        osc.frequency.value = frequency;    // set Frequency (hz)
        if (typeof this.config.detune !== "undefined")
            osc.detune = this.config.detune;

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
        if(onended)
            osc.onended = onended;

        // TODO: envelop is an effect
        return osc;
    }


    async loadAudioVoiceData(voiceURL, cache=false) {
        let voiceData;
        if(typeof this.voiceDataByURL[voiceURL] === "undefined") {
            voiceURL = new URL(voiceURL, document.location) + '';

            this.voiceDataByURL[voiceURL] = new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.open('GET', voiceURL, true);
                const ext = voiceURL.split('.').pop().toLowerCase();
                switch (ext) {
                    // default:
                    case '':
                    case 'wav':
                        xhr.responseType = 'arraybuffer';
                        break;
                    case 'json':
                        xhr.responseType = 'json';
                        break;
                    default:
                        reject("Unknown extension: " + ext);
                }
                xhr.onload = () => {
                    if (xhr.status !== 200)
                        return reject("Voice file not found: " + voiceURL);
                    resolve(xhr.response);
                };
                xhr.onerror = reject;
                xhr.send();
            });

            // console.info("Voice Data Loaded: ", voiceURL);
            // this.voiceDataByURL[voiceURL] = voiceData;
        }
        voiceData = this.voiceDataByURL[voiceURL];
        if(!cache)
            delete this.voiceDataByURL[voiceURL];
        if(voiceData instanceof Promise)
            voiceData = await voiceData;

        return voiceData;
    }


    // Instruments return promises
    async play(destination, namedFrequency, startTime, duration, velocity) {

        const commandFrequency = this.getFrequencyFromAlias(namedFrequency) || namedFrequency; // TODO: get rid of

        // Loop through voice
        const voicePromises = [];
        for (let i = 0; i < this.config.voices.length; i++) {
            const voiceConfig = this.config.voices[i];
            let frequencyValue = 440;

            // Filter voice playback
            if (voiceConfig.alias) {
                if(voiceConfig.alias !== commandFrequency)
                    // if(voiceConfig.name !== namedFrequency)
                    continue;
            } else {
                frequencyValue = this.getCommandFrequency(commandFrequency);
            }

            if (voiceConfig.keyLow && this.getCommandFrequency(voiceConfig.keyLow) > frequencyValue)
                continue;
            if (voiceConfig.keyHigh && this.getCommandFrequency(voiceConfig.keyHigh) < frequencyValue)
                continue;

            // TODO: polyphony

            const voicePromise = this.playVoice(destination, i, frequencyValue, startTime, duration, velocity, voiceConfig.adsr || null);
            voicePromises.push(voicePromise);
        }

        if(voicePromises.length > 0) {
            for (let i = 0; i < voicePromises.length; i++) {
                await voicePromises[i];
            }
        } else {
            console.warn("No voices were played: " + commandFrequency);
        }
    }


    async playPeriodicWave(destination, periodicWave, frequency, startTime = null, duration = null, velocity = null, detune = null, adsr = null) {
        const source = destination.context.createOscillator();   // instantiate an oscillator
        source.frequency.value = frequency;    // set Frequency (hz)
        if (detune !== null)
            source.detune = detune;

        source.setPeriodicWave(periodicWave);

        await this.playSource(destination, source, startTime, duration, velocity, adsr);
        // return source;
    }

    async playBuffer(destination, buffer, playbackRate, loop = false, startTime = null, duration = null, velocity = null, detune = null, adsr = null) {
        const source = destination.context.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;
        source.playbackRate.value = playbackRate; //  Math.random()*2;
        if (detune !== null)
            source.detune.value = detune;
        await this.playSource(destination, source, startTime, duration, velocity, adsr);
        // return source;
    }

    async playSource(destination, source, startTime = null, duration = null, velocity = null, adsr = null) {
        // songLength = buffer.duration;
        // source.playbackRate.value = playbackControl.value;

        // const adsr = voiceConfig.adsr || [0, 0, 0, 0.1];

    }
    async playVoice(destination, voiceID, frequencyValue, startTime = null, duration = null, velocity = null, adsr = null) {
        if (!this.isVoiceLoaded(voiceID))
            await this.initVoice(destination.context, voiceID);

        if (Number.isNaN(frequencyValue)) {
            console.warn("Invalid command frequency: ", frequencyValue, this.config);
            return null;
        }
        // throw new Error("Voice not loaded: " + voiceName);
        const voiceData = this.voices[voiceID];
        const voiceConfig = this.config.voices[voiceID];

        // if (!frequencyValue)
        //     frequencyValue = (this.getCommandFrequency(voiceConfig.root) || 440);

        if (voiceData.periodicWave) {
            this.playPeriodicWave(
                destination,
                voiceData.periodicWave,
                frequencyValue,
                startTime,
                duration,
                velocity,
                voiceConfig.detune || null,
                adsr
            );
        }

        if (voiceData.buffer) {
            const playbackRate = frequencyValue / (voiceConfig.root ? this.getCommandFrequency(voiceConfig.root) : 440);
            this.playBuffer(
                destination,
                voiceData.buffer,
                playbackRate,
                voiceConfig.loop || false,
                startTime,
                duration,
                velocity,
                voiceConfig.detune || null,
                adsr
            );
        }

    }

    stopPlayback() {
        // Stop all active sources
//             console.log("activeSources!", this.activeSources);
        for (let i = 0; i < this.activeSources.length; i++) {
            try {
                this.activeSources[i].stop();
            } catch (e) {
                console.warn(e);
            }
        }
        this.activeSources = [];

    }
}

export default OscillatorNodeInstrument;
