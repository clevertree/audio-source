import Library from "../../song/Library";
import PolyphonyInstrumentRenderer from "./render/PolyphonyInstrumentRenderer";
import React from "react";
import AudioBufferVoice from "./voice/AudioBufferVoice";
import OscillatorNodeVoice from "./voice/OscillatorNodeVoice";
// import Values from "../../song/Values";

class PolyphonyInstrument {
    constructor(destination, config={}) {
        this.config = {};
        this.voices = [];
        this.destination = destination;
        this.loadConfig(config);
    }

    /** Loading **/

    loadConfig(newConfig) {
        if (!newConfig.voices)
            newConfig.voices = [];
        Object.assign(this.config, newConfig);
        this.loadVoices();
    }


    loadVoices() {
        this.voices = [];
        for (let voiceID = 0; voiceID < this.config.voices.length; voiceID++)
            this.loadAudioVoice(voiceID);
    }

    loadAudioVoice(voiceID) {
        const voiceConfig = this.config.voices[voiceID];
        if (!voiceConfig)
            throw new Error("Voice config is missing: " + voiceID);
        this.voices[voiceID] = this.getVoiceFromConfig(voiceConfig);
    }

    static voiceClasses = [
        AudioBufferVoice,
        OscillatorNodeVoice
    ];
    getVoiceFromConfig(voiceConfig) {
        const classes = PolyphonyInstrument.voiceClasses;
        for(let i=0; i<classes.length; i++) {
            if(classes[i].isValidConfig(voiceConfig))
                return new classes[i](voiceConfig);
        }
        throw new Error("Invalid Config");
    }


    isVoiceLoaded(voiceID) {
        return !!this.voices[voiceID];
    }


    /** Playback **/

    playNote(destination, frequency, startTime, duration, velocity, onended=null) {
        for (let i = 0; i < this.voices.length; i++) {
            const voice = this.config.voices[i];
            voice.playVoice(destination, i, frequency, startTime, duration, velocity, onended);

        }
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


    /** Initializing Audio **/


    // connect(destination) {
    //     this.destination = destination;
    //     for (let voiceID = 0; voiceID < this.voices.length; voiceID++) {
    //         this.voices[voiceID].connect(destination);
    //     }
    // }


    // instruments receive audioContext only after user gesture
    // async initVoice(audioContext, voiceID) {
    //     const voiceConfig = this.config.voices[voiceID];
    //     let voiceURL = voiceConfig.url;
    //     if (!voiceURL)
    //         throw new Error("Voice config is missing url");
    //
    //     if (typeof this.voices[voiceID] !== "undefined")
    //         console.warn("Voice is already loaded: " + voiceID);
    //
    //     const voiceData = {};
    //
    //     const ext = voiceURL.split('.').pop().toLowerCase();
    //     switch (ext) {
    //         case '':
    //         case 'wav':
    //             voiceData.buffer = await this.initAudioVoice(audioContext, voiceURL);
    //             break;
    //
    //         case 'json':
    //             voiceData.periodicWave = await this.initAudioVoice(audioContext, voiceURL);
    //             break;
    //         default:
    //             throw new Error("Unknown extension: " + ext);
    //     }
    //
    //     this.voices[voiceID] = voiceData;
    // }

    // async initAudioVoice(audioContext, voiceURL) {
    //     voiceURL = new URL(voiceURL, document.location) + '';
    //
    //     let voiceData = await this.loadAudioVoiceData(voiceURL, false);
    //     let audioBuffer;
    //
    //     console.info("Loading Initiated: ", voiceURL);
    //     const ext = voiceURL.split('.').pop().toLowerCase();
    //     switch (ext) {
    //         // default:
    //         case '':
    //         case 'wav':
    //             // voiceCache.buffer = await audioContext.decodeAudioData(audioData);
    //             audioBuffer = await new Promise((resolve, reject) => {
    //                 audioContext.decodeAudioData(voiceData, // Safari does not file await for decodeAudioData
    //                     (buffer) => {
    //                         resolve(buffer);
    //                     },
    //
    //                     (e) => {
    //                         reject("Error with decoding audio data" + e.error);
    //                     }
    //                 );
    //             });
    //             break;
    //
    //         case 'json':
    //             if (!voiceData.real || !voiceData.imag)
    //                 throw new Error("Invalid JSON for periodic wave");
    //
    //             audioBuffer = audioContext.createPeriodicWave(
    //                 new Float32Array(voiceData.real),
    //                 new Float32Array(voiceData.imag)
    //             );
    //             break;
    //         default:
    //             throw new Error("Unknown extension: " + ext);
    //     }
    //
    //     console.info("Voice Initiated: ", voiceURL);
    //     return audioBuffer;
    // }
    //
    //
    // updateActive() {
    //     const active = this.activeSources.length > 0;
    //     // console.info('active', active, this.activeSources);
    //     if(this.props.active !== active)
    //         this.setProps({active});
    // }

    /** Voice Library **/

    // async loadVoiceLibrary() {
    //     if(this.config.libraryURL)
    //         this.voiceLibrary = await Library.loadFromURL(this.config.libraryURL);
    //     else
    //         this.voiceLibrary = await Library.loadDefaultLibrary();
    //     console.log("TODO: refresh renderer");
    // }

    // onSourceEnd(e, source) {
    //     const activeSourceI = this.activeSources.indexOf(source);
    //     if (activeSourceI !== -1)
    //         this.activeSources.splice(activeSourceI, 1);
    // }


    /** Modify Instrument **/


    async addVoice(voiceURL, voiceName=null, promptUser=false) {
        const defaultVoiceName = voiceURL.split('/').pop();
        // voiceURL = new URL(voiceURL) + '';
        if(promptUser) {
            voiceURL = prompt(`Add Voice URL:`, voiceURL || 'https://mysite.com/myvoice.wav');
            voiceName = prompt(`Set Voice Name:`, voiceName || defaultVoiceName);
        }
        if (!voiceURL)
            throw new Error("Change voice URL canceled");
        if(!voiceName)
            voiceName = defaultVoiceName;


        // if (voiceURL.endsWith('.library.json')) {
        //     console.log("Loading library: " + voiceURL);
        //     await this.voiceLibrary.loadFromURL(voiceURL);
        //     this.fieldAddVoice.value = '';
        // } else {

        if(!voiceName && promptUser)
            voiceName = prompt(`Set Voice Name:`, voiceName);
        const addVoiceID = this.config.voices.length;
        this.config.voices[addVoiceID] = {
            url: voiceURL,
            name: voiceName,
            // name: addVoiceName
        };
        await this.loadAudioVoice(addVoiceID);

        if(this.grid) await this.grid.forceUpdate();
        else this.forceUpdate();
    }




    /** Modify Voice **/

    // setVoiceName(voiceID, newVoiceName) {
    //     if(!newVoiceName)
    //         throw new Error("Invalid voice name");
    //     this.song.instrumentReplaceParam(this.id, ['voices', voiceID, 'name'], newVoiceName);
    // }

    setVoicePolyphony(voiceID, polyphonyLimit) {
        if(!Number.isInteger(polyphonyLimit))
            throw new Error("Invalid polyphony value");
        this.config.voices[voiceID].polyphony = polyphonyLimit;
        // this.song.instrumentReplaceParam(this.id, ['voices', voiceID, 'polyphony'], polyphonyLimit);
    }

    async setVoiceURL(voiceID, newVoiceURL) {
        newVoiceURL = new URL(newVoiceURL) + '';
        this.config.voices[voiceID].url = newVoiceURL;
        // this.song.instrumentReplaceParam(this.id, ['voices', voiceID, 'url'], newVoiceURL);
        await this.loadAudioVoice(voiceID);
    }

    async setVoiceName(voiceID, voiceName) {
        this.config.voices[voiceID].name = voiceName;
        // this.song.instrumentReplaceParam(this.id, ['voices', voiceID, 'name'], voiceName);
    }

    setVoiceMixer(voiceID, newMixerValue) {
        if(!Number.isInteger(newMixerValue))
            throw new Error("Invalid mixer value");
        this.config.voices[voiceID].mixer = newMixerValue;
        // this.song.instrumentReplaceParam(this.id, ['voices', voiceID, 'mixer'], newMixerValue);
    }

    setVoiceDetune(voiceID, newDetuneValue) {
        if(!Number.isInteger(newDetuneValue))
            throw new Error("Invalid detune value");
        this.config.voices[voiceID].detune = newDetuneValue;
        // this.song.instrumentReplaceParam(this.id, ['voices', voiceID, 'detune'], newDetuneValue);
    }

    setVoiceKeyRoot(voiceID, newKeyRootValue) {
        if(!newKeyRootValue)    delete this.config.voices[voiceID].root;
        else                    this.config.voices[voiceID].root = newKeyRootValue;
    }

    setVoiceKeyAlias(voiceID, newKeyAliasValue) {
        if(!newKeyAliasValue)
            throw new Error("Invalid keyAlias value");
        this.config.voices[voiceID].keyAlias = newKeyAliasValue;
        // this.song.instrumentReplaceParam(this.id, ['voices', voiceID, 'keyAlias'], newKeyAliasValue);
    }

    setVoiceLoop(voiceID, newLoopValue) {
        if(typeof newLoopValue !== 'boolean')
            throw new Error("Invalid loop value");
        this.config.voices[voiceID].loop = newLoopValue;
        // this.song.instrumentReplaceParam(this.id, ['voices', voiceID, 'loop'], newLoopValue);
    }

    async removeVoice(voiceID) {
        this.config.voices.splice(voiceID, 1);
    }


    getFrequencyFromAlias(aliasName) {
        for (let voiceID = 0; voiceID < this.config.voices.length; voiceID++) {
            const voiceConfig = this.config.voices[voiceID];
            if (voiceConfig && voiceConfig.alias && aliasName === voiceConfig.name) {
                return voiceConfig.alias;
            }
        }
        return null;
    }


    getFrequencyAliases() {
        const aliases = {};
        for (let voiceID = 0; voiceID < this.config.voices.length; voiceID++) {
            const voiceConfig = this.config.voices[voiceID];
            if (voiceConfig && voiceConfig.alias)
                aliases[voiceConfig.name] = voiceConfig.alias;
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
        // document.dispatchEvent(new CustomEvent('instruments:remove', this));
    }

    instrumentRename(newInstrumentName) {
        return this.config.title = newInstrumentName; // song.instrumentRename(this.id, newInstrumentName);
    }

    async setPreset(presetURL) {
        presetURL = new URL(presetURL);
        this.voiceLibrary = await Library.loadFromURL(presetURL + '');
        if (presetURL.hash) {
            const newPresetName = presetURL.hash.substr(1);
            let newPresetConfig = this.voiceLibrary.getPresetConfig(newPresetName);
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



    static getRenderer(props) {
        return <PolyphonyInstrumentRenderer
            {...props}
        />;
    }


}


export default PolyphonyInstrument;
