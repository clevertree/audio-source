class AudioBufferInstrument {
    constructor(config={}, audioContext=null) {
        this.config = {};
        this.audioContext = audioContext;
    }


    /** Playback **/

    playNote(destination, frequency, startTime, duration, velocity, onended=null) {
        const source = destination.context.createOscillator();   // instantiate an oscillator
        source.frequency.value = frequency;    // set Frequency (hz)
        if (typeof this.config.detune !== "undefined")
            source.detune = this.config.detune;

        source.setPeriodicWave(periodicWave);


        let adsr = this.config.adsr || [0, 0, 0, .1];
        let currentTime = destination.context.currentTime;
        startTime = startTime !== null ? startTime : currentTime;
        duration = duration !== null ? duration : 0;

        let velocityGain = destination.context.createGain();
        velocityGain.gain.value = parseFloat(velocity || 127) / 127;
        velocityGain.connect(destination);
        destination = velocityGain;

        velocityGain.gain.linearRampToValueAtTime(velocityGain.gain.value, startTime + duration);
        velocityGain.gain.linearRampToValueAtTime(0, startTime + duration + adsr[3]);

        // Add to active sources
        this.activeSources.push(source);
        this.updateActive();

        // await new Promise((resolve, reject) => {
        //     setTimeout(reject, 10000);
        //     // Set up 'ended' event listener
        //     source.addEventListener('ended', e => {
        //         resolve();
        //     });
        //
        //     // Start Playback
        //     source.connect(destination);
        //
        //     // Play note
        //     source.start(startTime);
        //     source.stop(startTime + duration + adsr[3]);
        // });

        const activeSourceI = this.activeSources.indexOf(source);
        if (activeSourceI !== -1)
            this.activeSources.splice(activeSourceI, 1);
        else
            throw new Error("Active source not found: " + activeSourceI);
        this.updateActive();
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

}

export default AudioBufferInstrument;

