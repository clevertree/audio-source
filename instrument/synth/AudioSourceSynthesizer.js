import Library from "../../song/Library";
import AudioSourceSynthesizerRenderer from "./AudioSourceSynthesizerRenderer";
import React from "react";
// import Values from "../../song/Values";

class AudioSourceSynthesizer {
    constructor(config, song=null, instrumentID=null) {
        this.config = config || {};
        this.id = instrumentID;

        this.samples = [];
        this.sampleDataByURL = {};
        this.activeSources = [];

        this.audioContext = null;
        if(typeof config.name === "undefined")
            config.name = 'Synthesizer' + (instrumentID === null ? '' : ' ' + (instrumentID < 10 ? "0" : "") + (instrumentID));
        this.config = config || {};


        this.song = song;
        this.values = this.song.values;

        this.sampleLibrary = null;
        // this.loadSampleLibrary();

        // this.loadDefaultSampleLibrary()
        //     .then(e => this.render());

    }

    /** Initializing Audio **/


    async init(audioContext=null) {
        await this.loadConfig(this.config);
        if(audioContext) {
            this.audioContext = audioContext;
            for (let sampleID = 0; sampleID < this.samples.length; sampleID++) {
                await this.initSample(audioContext, sampleID);
            }
        }
    }

    // instruments receive audioContext only after user gesture
    async initSample(audioContext, sampleID) {
        const sampleConfig = this.config.samples[sampleID];
        let sampleURL = sampleConfig.url;
        if (!sampleURL)
            throw new Error("Sample config is missing url");

        if (typeof this.samples[sampleID] !== "undefined")
            console.warn("Sample is already loaded: " + sampleID);

        const sampleData = {};

        const ext = sampleURL.split('.').pop().toLowerCase();
        switch (ext) {
            case '':
            case 'wav':
                sampleData.buffer = await this.initAudioSample(audioContext, sampleURL);
                break;

            case 'json':
                sampleData.periodicWave = await this.initAudioSample(audioContext, sampleURL);
                break;
            default:
                throw new Error("Unknown extension: " + ext);
        }

        this.samples[sampleID] = sampleData;
    }

    async initAudioSample(audioContext, sampleURL) {
        sampleURL = new URL(sampleURL, document.location) + '';

        let sampleData = await this.loadAudioSampleData(sampleURL, false);
        let audioBuffer;

        console.info("Loading Initiated: ", sampleURL);
        const ext = sampleURL.split('.').pop().toLowerCase();
        switch (ext) {
            // default:
            case '':
            case 'wav':
                // sampleCache.buffer = await audioContext.decodeAudioData(audioData);
                audioBuffer = await new Promise((resolve, reject) => {
                    audioContext.decodeAudioData(sampleData, // Safari does not support await for decodeAudioData
                        (buffer) => {
                            resolve(buffer);
                        },

                        (e) => {
                            reject("Error with decoding audio data" + e.error);
                        }
                    );
                });
                break;

            case 'json':
                if (!sampleData.real || !sampleData.imag)
                    throw new Error("Invalid JSON for periodic wave");

                audioBuffer = audioContext.createPeriodicWave(
                    new Float32Array(sampleData.real),
                    new Float32Array(sampleData.imag)
                );
                break;
            default:
                throw new Error("Unknown extension: " + ext);
        }

        console.info("Sample Initiated: ", sampleURL);
        return audioBuffer;
    }


    updateActive() {
        const active = this.activeSources.length > 0;
        // console.info('active', active, this.activeSources);
        if(this.props.active !== active)
            this.setProps({active});
    }

    /** Sample Library **/

    async loadSampleLibrary() {
        if(this.config.libraryURL)
            this.sampleLibrary = await Library.loadFromURL(this.config.libraryURL);
        else
            this.sampleLibrary = await Library.loadDefaultLibrary();
        console.log("TODO: refresh renderer");
    }

    /** Loading **/

    async loadConfig(newConfig) {
        if (!newConfig.samples)
            newConfig.samples = [];
        else
            newConfig.samples = Object.values(newConfig.samples);
        // TODO: unload samples - this.samples
        Object.assign(this.config, newConfig);
        await this.loadSamples();
    }


    async loadSamples() {
        this.samples = [];
        for (let sampleID = 0; sampleID < this.config.samples.length; sampleID++) {
            try {
                await this.loadAudioSample(sampleID);
            } catch (e) {
                console.warn("Error loading sample: " + sampleID, e);
            }
        }
    }

    async loadAudioSample(sampleID) {
        const sampleConfig = this.config.samples[sampleID];
        if (!sampleConfig)
            throw new Error("Sample config is missing: " + sampleID);
        let sampleURL = sampleConfig.url;
        if (!sampleURL)
            throw new Error("Sample config is missing url: " + sampleID);
        sampleURL = new URL(sampleURL, document.location) + '';

        await this.loadAudioSampleData(sampleURL, true);
        if (this.audioContext)
            await this.initSample(this.audioContext, sampleID);
    }

    async loadAudioSampleData(sampleURL, cache=false) {
        let sampleData;
        if(typeof this.sampleDataByURL[sampleURL] === "undefined") {
            sampleURL = new URL(sampleURL, document.location) + '';

            this.sampleDataByURL[sampleURL] = new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.open('GET', sampleURL, true);
                const ext = sampleURL.split('.').pop().toLowerCase();
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
                        return reject("Sample file not found: " + sampleURL);
                    resolve(xhr.response);
                };
                xhr.onerror = reject;
                xhr.send();
            });

            // console.info("Sample Data Loaded: ", sampleURL);
            // this.sampleDataByURL[sampleURL] = sampleData;
        }
        sampleData = this.sampleDataByURL[sampleURL];
        if(!cache)
            delete this.sampleDataByURL[sampleURL];
        if(sampleData instanceof Promise)
            sampleData = await sampleData;

        return sampleData;
    }

    isSampleLoaded(sampleID) {
        return typeof this.samples[sampleID] !== 'undefined';
    }
    /** Playback **/

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

        // const adsr = sampleConfig.adsr || [0, 0, 0, 0.1];

        adsr = adsr || [0, 0, 0, .1];
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

        await new Promise((resolve, reject) => {
            setTimeout(reject, 10000);
            // Set up 'ended' event listener
            source.addEventListener('ended', e => {
                resolve();
            });

            // Start Playback
            source.connect(destination);

            // Play note
            source.start(startTime);
            source.stop(startTime + duration + adsr[3]);
        });

        const activeSourceI = this.activeSources.indexOf(source);
        if (activeSourceI !== -1)
            this.activeSources.splice(activeSourceI, 1);
        else
            throw new Error("Active source not found: " + activeSourceI);
        this.updateActive();
    }

    async playSample(destination, sampleID, frequencyValue, startTime = null, duration = null, velocity = null, adsr = null) {
        if (!this.isSampleLoaded(sampleID))
            await this.initSample(destination.context, sampleID);

        if (Number.isNaN(frequencyValue)) {
            console.warn("Invalid command frequency: ", frequencyValue, this.config);
            return null;
        }
        // throw new Error("Sample not loaded: " + sampleName);
        const sampleData = this.samples[sampleID];
        const sampleConfig = this.config.samples[sampleID];

        // if (!frequencyValue)
        //     frequencyValue = (this.getCommandFrequency(sampleConfig.keyRoot) || 440);

        if (sampleData.periodicWave) {
            this.playPeriodicWave(
                destination,
                sampleData.periodicWave,
                frequencyValue,
                startTime,
                duration,
                velocity,
                sampleConfig.detune || null,
                adsr
            );
        }

        if (sampleData.buffer) {
            const playbackRate = frequencyValue / (sampleConfig.keyRoot ? this.getCommandFrequency(sampleConfig.keyRoot) : 440);
            this.playBuffer(
                destination,
                sampleData.buffer,
                playbackRate,
                sampleConfig.loop || false,
                startTime,
                duration,
                velocity,
                sampleConfig.detune || null,
                adsr
            );
        }

    }

    // Instruments return promises
    async play(destination, namedFrequency, startTime, duration, velocity) {

        const commandFrequency = this.getFrequencyFromAlias(namedFrequency) || namedFrequency;

        // Loop through sample
        const samplePromises = [];
        for (let i = 0; i < this.config.samples.length; i++) {
            const sampleConfig = this.config.samples[i];
            let frequencyValue = 440;

            // Filter sample playback
            if (sampleConfig.keyAlias) {
                if(sampleConfig.keyAlias !== commandFrequency)
                // if(sampleConfig.name !== namedFrequency)
                    continue;
            } else {
                frequencyValue = this.getCommandFrequency(commandFrequency);
            }

            if (sampleConfig.keyLow && this.getCommandFrequency(sampleConfig.keyLow) > frequencyValue)
                continue;
            if (sampleConfig.keyHigh && this.getCommandFrequency(sampleConfig.keyHigh) < frequencyValue)
                continue;

            // TODO: polyphony

            const samplePromise = this.playSample(destination, i, frequencyValue, startTime, duration, velocity, sampleConfig.adsr || null);
            samplePromises.push(samplePromise);
        }

        if(samplePromises.length > 0) {
            for (let i = 0; i < samplePromises.length; i++) {
                await samplePromises[i];
            }
        } else {
            console.warn("No samples were played: " + commandFrequency);
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

    // onSourceEnd(e, source) {
    //     const activeSourceI = this.activeSources.indexOf(source);
    //     if (activeSourceI !== -1)
    //         this.activeSources.splice(activeSourceI, 1);
    // }


    /** Modify Instrument **/


    async addSample(sampleURL, sampleName=null, promptUser=false) {
        const defaultSampleName = sampleURL.split('/').pop();
        // sampleURL = new URL(sampleURL) + '';
        if(promptUser) {
            sampleURL = prompt(`Add Sample URL:`, sampleURL || 'https://mysite.com/mysample.wav');
            sampleName = prompt(`Set Sample Name:`, sampleName || defaultSampleName);
        }
        if (!sampleURL)
            throw new Error("Change sample URL canceled");
        if(!sampleName)
            sampleName = defaultSampleName;


        // if (sampleURL.endsWith('.library.json')) {
        //     console.log("Loading library: " + sampleURL);
        //     await this.sampleLibrary.loadFromURL(sampleURL);
        //     this.fieldAddSample.value = '';
        // } else {

        if(!sampleName && promptUser)
            sampleName = prompt(`Set Sample Name:`, sampleName);
        const addSampleID = this.config.samples.length;
        this.song.instrumentReplaceParam(this.id, ['samples', addSampleID], {
            url: sampleURL,
            name: sampleName,
            // name: addSampleName
        });
        await this.loadAudioSample(addSampleID);

        if(this.grid) await this.grid.forceUpdate();
        else this.forceUpdate();
    }




    /** Modify Sample **/

    // setSampleName(sampleID, newSampleName) {
    //     if(!newSampleName)
    //         throw new Error("Invalid sample name");
    //     this.song.instrumentReplaceParam(this.id, ['samples', sampleID, 'name'], newSampleName);
    // }

    setSamplePolyphony(sampleID, polyphonyLimit) {
        if(!Number.isInteger(polyphonyLimit))
            throw new Error("Invalid polyphony value");
        this.song.instrumentReplaceParam(this.id, ['samples', sampleID, 'polyphony'], polyphonyLimit);
    }

    async setSampleURL(sampleID, newSampleURL) {
        newSampleURL = new URL(newSampleURL) + '';
        this.song.instrumentReplaceParam(this.id, ['samples', sampleID, 'url'], newSampleURL);
        await this.loadAudioSample(sampleID);
    }

    async setSampleName(sampleID, sampleName) {
        this.song.instrumentReplaceParam(this.id, ['samples', sampleID, 'name'], sampleName);
    }

    setSampleMixer(sampleID, newMixerValue) {
        if(!Number.isInteger(newMixerValue))
            throw new Error("Invalid mixer value");
        this.song.instrumentReplaceParam(this.id, ['samples', sampleID, 'mixer'], newMixerValue);
    }

    setSampleDetune(sampleID, newDetuneValue) {
        if(!Number.isInteger(newDetuneValue))
            throw new Error("Invalid detune value");
        this.song.instrumentReplaceParam(this.id, ['samples', sampleID, 'detune'], newDetuneValue);
    }

    setSampleKeyRoot(sampleID, newKeyRootValue) {
        if(!newKeyRootValue)
            this.song.deleteInstrumentParam(this.id, ['samples', sampleID, 'keyRoot']);
        else
            this.song.instrumentReplaceParam(this.id, ['samples', sampleID, 'keyRoot'], newKeyRootValue);
    }

    setSampleKeyAlias(sampleID, newKeyAliasValue) {
        if(!newKeyAliasValue)
            throw new Error("Invalid keyAlias value");
        this.song.instrumentReplaceParam(this.id, ['samples', sampleID, 'keyAlias'], newKeyAliasValue);
    }

    setSampleLoop(sampleID, newLoopValue) {
        if(typeof newLoopValue !== 'boolean')
            throw new Error("Invalid loop value");
        this.song.instrumentReplaceParam(this.id, ['samples', sampleID, 'loop'], newLoopValue);
    }

    async removeSample(sampleID) {
        this.song.deleteInstrumentParam(this.id, ['samples', sampleID]);
        if(this.grid) await this.grid.forceUpdate();
        else this.forceUpdate();
    }


    getFrequencyFromAlias(aliasName) {
        for (let sampleID = 0; sampleID < this.config.samples.length; sampleID++) {
            const sampleConfig = this.config.samples[sampleID];
            if (sampleConfig && sampleConfig.keyAlias && aliasName === sampleConfig.name) {
                return sampleConfig.keyAlias;
            }
        }
        return null;
    }


    getFrequencyAliases() {
        const aliases = {};
        for (let sampleID = 0; sampleID < this.config.samples.length; sampleID++) {
            const sampleConfig = this.config.samples[sampleID];
            if (sampleConfig && sampleConfig.keyAlias)
                aliases[sampleConfig.name] = sampleConfig.keyAlias;
        }
        return aliases;
    }


    getCommandKeyNumber(command) {
        if (Number(command) === command && command % 1 !== 0)
            return command;
        if (!command)
            return null;

        const noteCommands = this.noteFrequencies; // ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
        let octave = command.length === 3 ? command.charAt(2) : command.charAt(1),
            keyNumber = noteCommands.indexOf(command.slice(0, -1));
        if (keyNumber < 3) keyNumber = keyNumber + 12 + ((octave - 1) * 12) + 1;
        else keyNumber = keyNumber + ((octave - 1) * 12) + 1;
        return keyNumber;
    }

    getCommandFrequency(command) {
        const keyNumber = this.getCommandKeyNumber(command);
        return 440 * Math.pow(2, (keyNumber - 49) / 12);
    }

    get noteFrequencies() {
        return ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    }

    /** Modify Instrument **/

    instrumentRemove() {
        this.song.instrumentRemove(this.id);
        // document.dispatchEvent(new CustomEvent('instrument:remove', this));
    }

    instrumentRename(newInstrumentName) {
        return this.song.instrumentRename(this.id, newInstrumentName);
    }

    async setPreset(presetURL) {
        presetURL = new URL(presetURL);
        this.sampleLibrary = await Library.loadFromURL(presetURL + '');
        if (presetURL.hash) {
            const newPresetName = presetURL.hash.substr(1);
            let newPresetConfig = this.sampleLibrary.getPresetConfig(newPresetName);
            newPresetConfig = Object.assign({}, this.config, newPresetConfig);
            await this.song.instrumentReplace(this.id, newPresetConfig);
            await this.loadConfig(newPresetConfig);
        }
        this.forceUpdate();
        if (!presetURL.hash) {
            await this.selectChangePreset.open();
        }
//             await this.selectChangePreset.renderOptions();
        // this.selectChangePreset.value = ''; // TODO: why was this?
        this.selectChangePreset.focus();
//             this.form.classList.add('focus');
    }



    static getRenderer(song, instrumentID) {
        return <AudioSourceSynthesizerRenderer
            song={song}
            instrumentID={instrumentID}
        />;
    }


}


export default AudioSourceSynthesizer;
