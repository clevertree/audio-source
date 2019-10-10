{
    class AudioSourceSynthesizer {


        constructor(config, song=null, instrumentID=null) {
            this.song = song;
            this.id = instrumentID;
            this.form = null;

            this.samples = [];
            this.sampleDataByURL = {};
            this.activeSources = [];

            this.audioContext = null;

            this.config = config || {};
            this.loadConfig(this.config);
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
                    await this.loadAudioSample(sampleID); // Async?
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

                sampleData = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();

                    xhr.open('GET', sampleURL, true);
                    const ext = sampleURL.indexOf('.') === -1 ? '' : sampleURL.split('.').pop().toLowerCase();
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

                console.info("Sample Data Loaded: ", sampleURL);
                this.sampleDataByURL[sampleURL] = sampleData;
            }
            sampleData = this.sampleDataByURL[sampleURL];
            if(!cache)
                delete this.sampleDataByURL[sampleURL];

            return sampleData;
        }

        isSampleLoaded(sampleID) {
            return typeof this.samples[sampleID] !== 'undefined';
        }

        /** Initializing Audio **/


        async init(audioContext) {
            this.audioContext = audioContext;
            for (let sampleID = 0; sampleID < this.samples.length; sampleID++) {
                await this.initSample(audioContext, sampleID);
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

            const ext = sampleURL.indexOf('.') === -1 ? '' : sampleURL.split('.').pop().toLowerCase();
            switch (ext) {
                case '':
                case 'wav':
                    sampleData.buffer = await this.initAudioSample(audioContext, sampleURL);
                    break;

                case 'json':
                    sampleData.periodicWave = await this.initAudioSample(audioContext, sampleURL);
                    break;
                default:
                    reject("Unknown extension: " + ext);
            }

            this.samples[sampleID] = sampleData;
        }

        async initAudioSample(audioContext, sampleURL) {
            sampleURL = new URL(sampleURL, document.location) + '';

            let sampleData = await this.loadAudioSampleData(sampleURL, false);
            let audioBuffer;

            console.info("Loading Initiated: ", sampleURL);
            const ext = sampleURL.indexOf('.') === -1 ? '' : sampleURL.split('.').pop().toLowerCase();

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
            // Play note
            if (startTime) {
                source.start(startTime);
                if (duration) {
                    source.stop(startTime + duration + adsr[3]);
                }
            }

            let velocityGain = destination.context.createGain();
            velocityGain.gain.value = parseFloat(velocity || 127) / 127;
            velocityGain.connect(destination);
            destination = velocityGain;

            velocityGain.gain.linearRampToValueAtTime(velocityGain.gain.value, startTime + duration);
            velocityGain.gain.linearRampToValueAtTime(0, startTime + duration + adsr[3]);
            await new Promise((resolve, reject) => {

                // Set up 'ended' event listener
                source.addEventListener('ended', e => {
                    this.onSourceEnd(e, source);
                    resolve();
                });
                // Add to active sources
                this.activeSources.push(source);

                // Start Playback
                source.connect(destination);
            });

        }

        async playSample(destination, sampleID, frequencyValue = null, startTime = null, duration = null, velocity = null, adsr = null) {
            if (!this.isSampleLoaded(sampleID))
                await this.initSample(destination.context, sampleID);

            // throw new Error("Sample not loaded: " + sampleName);
            const sampleData = this.samples[sampleID];
            const sampleConfig = this.config.samples[sampleID];

            if (!frequencyValue)
                frequencyValue = (this.getCommandFrequency(sampleConfig.keyRoot) || 440);

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
        async play(destination, commandFrequency, startTime, duration, velocity) {
            let frequencyValue = this.getCommandFrequency(commandFrequency);
            if (Number.isNaN(frequencyValue)) {
                console.warn("Invalid command frequency: ", commandFrequency, this.config);
                return null;
            }

            // Loop through sample
            const samplePromises = [];
            for (let i = 0; i < this.config.samples.length; i++) {
                const sampleConfig = this.config.samples[i];

                // Filter sample playback
                if (sampleConfig.keyAlias)
                    continue;
                if (sampleConfig.keyLow && this.getCommandFrequency(sampleConfig.keyLow) > frequencyValue)
                    continue;
                if (sampleConfig.keyHigh && this.getCommandFrequency(sampleConfig.keyHigh) < frequencyValue)
                    continue;

                // TODO: polyphony

                const samplePromise = this.playSample(destination, i, frequencyValue, startTime, duration, velocity, sampleConfig.adsr || null);
                samplePromises.push(samplePromise);
            }

            for (let i = 0; i < samplePromises.length; i++) {
                await samplePromises[i];
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

        onSourceEnd(e, source) {
            const activeSourceI = this.activeSources.indexOf(source);
            if (activeSourceI !== -1)
                this.activeSources.splice(activeSourceI, 1);
        }


        // get instrumentID() {
        //     return this.getAttribute('data-id');
        // }

        render(renderObject=null) {
            if(renderObject instanceof HTMLElement && renderObject.matches('asc-form')) {
                this.form = new AudioSourceSynthesizerFormRenderer(renderObject, this);
            } else {
                throw new Error("Unknown renderer");
            }
        }

        /** Modify Instrument **/


        async addSample(sampleURL) {
            if (!sampleURL)
                throw new Error("Change sample URL canceled");

            let addSampleName = sampleURL.split('/').pop().split('.').slice(0, -1).join('.');
            addSampleName = prompt(`Set Sample Name:`, addSampleName);
            const addSampleID = this.config.samples.length;
            this.song.replaceInstrumentParam(this.id, ['samples', addSampleID], {
                url: sampleURL,
                name: addSampleName
            });
            await this.loadAudioSample(addSampleID);

        }

        /** Modify Sample **/

        setSampleName(sampleID, newSampleName) {
            if(!newSampleName)
                throw new Error("Invalid sample name");
            this.song.replaceInstrumentParam(this.id, ['samples', sampleID, 'name'], newSampleName);
        }

        setSamplePolyphony(sampleID, polyphonyLimit) {
            if(!Number.isInteger(polyphonyLimit))
                throw new Error("Invalid polyphony value");
            this.song.replaceInstrumentParam(this.id, ['samples', sampleID, 'polyphony'], polyphonyLimit);
        }

        async setSampleURL(sampleID, newSampleURL) {
            newSampleURL = new URL(newSampleURL) + '';
            this.song.replaceInstrumentParam(this.id, ['samples', sampleID, 'url'], newSampleURL);
            await this.loadAudioSample(sampleID);
        }

        async setSampleMixer(sampleID, newMixerValue) {
            if(!Number.isInteger(newMixerValue))
                throw new Error("Invalid mixer value");
            this.song.replaceInstrumentParam(this.id, ['samples', sampleID, 'mixer'], newMixerValue);
        }

        async setSampleDetune(sampleID, newDetuneValue) {
            if(!Number.isInteger(newDetuneValue))
                throw new Error("Invalid detune value");
            this.song.replaceInstrumentParam(this.id, ['samples', sampleID, 'detune'], newDetuneValue);
        }

        async setSampleKeyRoot(sampleID, newKeyRootValue) {
            if(!newKeyRootValue)
                throw new Error("Invalid keyRoot value");
            this.song.replaceInstrumentParam(this.id, ['samples', sampleID, 'keyRoot'], newKeyRootValue);
        }

        async setSampleKeyAlias(sampleID, newKeyAliasValue) {
            if(!newKeyAliasValue)
                throw new Error("Invalid keyAlias value");
            this.song.replaceInstrumentParam(this.id, ['samples', sampleID, 'keyAlias'], newKeyAliasValue);
        }

        async setSampleLoop(sampleID, newLoopValue) {
            if(typeof newLoopValue !== 'boolean')
                throw new Error("Invalid loop value");
            this.song.replaceInstrumentParam(this.id, ['samples', sampleID, 'loop'], newLoopValue);
        }




        getFrequencyAliases() {
            const aliases = {};
            for (let sampleID = 0; sampleID < this.config.samples.length; sampleID++) {
                const sampleConfig = this.config.samples[sampleID];
                if (sampleConfig && sampleConfig.keyAlias)
                    aliases[sampleConfig.keyAlias] = sampleID;
            }
            return aliases;
        }


        getCommandKeyNumber(command) {
            if (Number(command) === command && command % 1 !== 0)
                return command;
            if (!command)
                return null;

            const instructions = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
            let octave = command.length === 3 ? command.charAt(2) : command.charAt(1),
                keyNumber = instructions.indexOf(command.slice(0, -1));
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


    }





    /**
     * Used for all Instrument UI. Instance not necessary for song playback
     */
    class AudioSourceSynthesizerFormRenderer {
        get DEFAULT_SAMPLE_LIBRARY_URL() {
            return getScriptDirectory('sample/sample.library.json');
        }

        get noteFrequencies() {
            return ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
        }

        /**
         *
         * @param {AudioSourceComposerForm} instrumentForm
         * @param instrument
         */
        constructor(instrumentForm, instrument) {
            this.form = instrumentForm;
            this.instrument = instrument;
            this.sampleLibrary = new SampleLibrary();

            const sampleLibraryURL = instrument.config.libraryURL
                || this.DEFAULT_SAMPLE_LIBRARY_URL;

            this.render().then();
            this.loadDefaultSampleLibrary(sampleLibraryURL).then();

            const root = instrumentForm.getRootNode() || document;
            this.appendCSS(root);
        }

        async loadDefaultSampleLibrary(sampleLibraryURL) {
            await this.sampleLibrary.loadURL(sampleLibraryURL);
            await this.render(); // TODO: inefficient?
            // this.fieldAddSample.renderOptions();
        }

        // TODO: break up / redefine
//         async loadDefaultSampleLibrary() {
//             this.loadSamples();
//
//             if (!this.sampleLibrary) {
//                 await this.sampleLibrary.loadURL(this.config.libraryURL || this.DEFAULT_SAMPLE_LIBRARY_URL);
//                 this.render();
//             }
//
//             // Load first library
//             if (this.sampleLibrary.libraries && !this.sampleLibrary.instruments && !this.sampleLibrary.samples) {
//                 const firstLibrary = this.sampleLibrary.libraries[0];
//                 firstLibrary.url = new URL(firstLibrary.url, this.sampleLibrary.url) + '';
//                 if (firstLibrary.url !== this.sampleLibrary.url) {
//                     await this.sampleLibrary.loadURL(firstLibrary.url);
//                     this.render();
//                 }
//
//             }
//
//             // Load default sample
//             if (this.sampleLibrary.instruments) {
//                 if (Object.keys(this.config.samples).length === 0) {
//                     const sampleInstrument = Object.keys(this.sampleLibrary.instruments)[0];
//
//                     this.loadConfig(this.sampleLibrary.getPresetConfig(sampleInstrument));
//
// //                 console.info("Loaded default sample instrument: " + sampleInstrument, this.config);
// //                 if(this.audioContext)
// //                     await this.initSamples(this.audioContext);
//                 }
//             }
//
//             this.render();
//         }




        appendCSS(rootElm) {

            // Append Instrument CSS
            const PATH = 'instrument/audio-source-synthesizer.css';
            const linkHRef = getScriptDirectory(PATH);
            console.log(rootElm);
            let linkElms = rootElm.querySelectorAll('link');
            for(let i=0; i<linkElms.length; i++) {
                if(linkElms[i].href.endsWith(PATH))
                    return;
            }
            const linkElm = document.createElement('link');
            linkElm.setAttribute('href', linkHRef);
            linkElm.setAttribute('rel', 'stylesheet');
            rootElm.prepend(linkElm);
        }

        async render() {
            // const instrument = this.instrument;
            const instrumentID = typeof this.instrument.id !== "undefined" ? this.instrument.id : -1;
            const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);
            this.form.clearInputs();
            this.form.classList.add('audio-source-synthesizer-container');

            this.form.addButton('instrument-id',
                null, //TODO: toggle view
                instrumentIDHTML + ':'
            );

            this.form.addTextInput('instrument-name',
                (e, newInstrumentName) => this.setInstrumentName(newInstrumentName),
                'Instrument Name',
                this.instrument.config.name || '',
                'Unnamed'
            );



            this.form.addIconButton('instrument-remove',
                (e) => this.remove(e, instrumentID),
                'remove',
                'Remove Instrument');

            this.fieldChangePreset = this.form.addSelectInput('instrument-preset',
                (e, presetURL) => this.setPreset(presetURL),
                (addOption, setOptgroup) => {
                    addOption('', 'Change Preset');
                    setOptgroup(this.sampleLibrary.name || 'Unnamed Library');
                    this.sampleLibrary.eachPreset(addOption);
                    setOptgroup('Libraries');
                    this.sampleLibrary.eachLibrary(addOption);
                    setOptgroup('Other Libraries');
                    SampleLibrary.eachHistoricLibrary(addOption);
                },
                'Change Instrument',
                '');


            this.form.addBreak();

            /** Sample Forms **/

            const samples = this.instrument.config.samples;
            if(samples.length > 0) {
                const sampleGrid = this.form.addGrid('samples');
                const headerRow = sampleGrid.getOrCreateRow('header');
                headerRow.addText('name', 'Name');
                headerRow.addText('url', 'URL');
                headerRow.addText('mixer', 'Mixer');
                headerRow.addText('detune', 'Detune');
                headerRow.addText('root', 'Root');
                headerRow.addText('alias', 'Alias');
                headerRow.addText('loop', 'Loop');
                headerRow.addText('adsr', 'ADSR');
                headerRow.addText('remove', 'Rem');

                const getNoteFrequencies = (addOption) => {
                    addOption('', "None");
                    const noteFrequencies = this.noteFrequencies;
                    for (let i = 1; i <= 6; i++) {
                        for (let j = 0; j < noteFrequencies.length; j++) {
                            addOption(noteFrequencies[j] + i);
                        }
                    }
                };

                const getSampleURLs = (addOption) => {
                    this.sampleLibrary.eachSample(addOption);
                };


                samples.forEach((sampleData, sampleID) => {
                    const sampleRow = sampleGrid.getOrCreateRow('sample-' + sampleID);
                    // const sampleRow = this.form.addGrid(i);
                    sampleRow.addTextInput('name', (e, nameString) => this.setSampleName(sampleID, nameString), 'Name', sampleData.name);
                    sampleRow.addSelectInput('url', (e, url) => this.setSampleURL(sampleID, url), getSampleURLs, 'URL', sampleData.url);
                    sampleRow.addRangeInput('mixer', (e, mixerValue) => this.setSampleMixer(sampleID, mixerValue), 1, 100, 'Mixer', sampleData.mixer);
                    sampleRow.addRangeInput('detune', (e, detuneValue) => this.setSampleDetune(sampleID, detuneValue), -100, 100, 'Detune', sampleData.detune);
                    sampleRow.addSelectInput('root', (e, keyRoot) => this.setSampleKeyRoot(sampleID, keyRoot), getNoteFrequencies, 'Root', sampleData.keyRoot);
                    sampleRow.addSelectInput('alias', (e, keyAlias) => this.setSampleKeyAlias(sampleID, keyAlias), getNoteFrequencies, 'Alias', sampleData.keyAlias);
                    sampleRow.addCheckBoxInput('loop', (e, isLoop) => this.setSampleLoop(sampleID, isLoop), 'Loop', sampleData.loop);
                    sampleRow.addTextInput('adsr', (e, asdr) => this.setSampleASDR(sampleID, asdr), 'ADSR', sampleData.adsr, '0,0,0,0');
                });
            }


            /** Add New Sample **/

            this.fieldAddSample = this.form.addSelectInput(
                'add-sample',
                (e, sampleURL) => this.addSample(sampleURL),
                (addOption, setOptgroup) => {
                    addOption('', 'Add Sample');
                    setOptgroup(this.sampleLibrary.name || 'Unnamed Library');
                    this.sampleLibrary.eachSample(addOption);
                    setOptgroup('Libraries');
                    this.sampleLibrary.eachLibrary(addOption);
                    setOptgroup('Other Libraries');
                    SampleLibrary.eachHistoricLibrary(addOption);
                },
                'Add Sample',
                '');
        }

        /** Modify Instrument **/

        remove() {
            this.instrument.song.removeInstrument(this.instrument.id);
            document.dispatchEvent(new CustomEvent('instrument:remove', this));
        }

        setInstrumentName(newInstrumentName) {
            return this.instrument.song.setInstrumentName(this.instrument.id, newInstrumentName);
        }

        async setPreset(presetURL) {
            presetURL = new URL(presetURL);
            await this.sampleLibrary.loadURL(presetURL + '');
            if (presetURL.hash) {
                const newPresetName = presetURL.hash.substr(1);
                let newPresetConfig = this.sampleLibrary.getPresetConfig(newPresetName);
                newPresetConfig = Object.assign({}, this.instrument.config, newPresetConfig);
                await this.instrument.song.replaceInstrument(this.instrument.id, newPresetConfig);
                await this.instrument.loadConfig(newPresetConfig);
                this.render();
            }
            this.fieldChangePreset.renderOptions();
            this.fieldChangePreset.value = '';
        }

        async addSample(sampleURL, promptUser=false) {
            if(promptUser)
                sampleURL = prompt(`Add Sample URL:`, sampleURL || 'https://mysite.com/mysample.wav');
            sampleURL = new URL(sampleURL) + '';

            if (sampleURL.endsWith('.library.json')) {
                console.log("Loading library: " + sampleURL);
                await this.sampleLibrary.loadURL(sampleURL);
                this.fieldAddSample.renderOptions(); // TODO: re-trigger drop down on RN?
                this.fieldAddSample.value = '';
            } else {
                await this.instrument.addSample(sampleURL);
                this.render();
            }

        }

        async setSampleName(sampleID, nameString) {
            return this.instrument.setSampleName(sampleID, nameString);
        }

        async setSampleURL(sampleID, url) {
            return this.instrument.setSampleURL(sampleID, url);
        }

        async setSampleDetune(sampleID, detuneValue) {
            return this.instrument.setSampleDetune(sampleID, detuneValue);
        }

        async setSampleMixer(sampleID, mixValue) {
            return this.instrument.setSampleMixer(sampleID, mixValue);
        }

        async setSampleKeyRoot(sampleID, keyRoot) {
            return this.instrument.setSampleKeyRoot(sampleID, keyRoot);
        }

        async setSampleKeyAlias(sampleID, keyAlias) {
            return this.instrument.setSampleKeyAlias(sampleID, keyAlias);
        }

        async setSampleLoop(sampleID, isLoop) {
            return this.instrument.setSampleLoop(sampleID, isLoop);
        }

        async setSampleASDR(sampleID, asdr) {
            return this.instrument.setSampleASDR(sampleID, asdr);
        }
    }



    class SampleLibrary {
        constructor() {
            this.url = null;
            this.sampleLibrary = {
                "name": "Loading Sample Library...",
                "samples": {},
                "libraries": {}
            };
        }

        get name() {
            return this.sampleLibrary.name;
        }

        eachSample(callback) {
            for(let sampleName in this.sampleLibrary.samples) {
                if(this.sampleLibrary.samples.hasOwnProperty(sampleName)) {
                    let sampleConfig = this.sampleLibrary.samples[sampleName];
                    let sampleURL = new URL((this.sampleLibrary.urlPrefix || '') + (sampleConfig.url || sampleName), this.url) + '';
                    // const iSampleFileName = iSampleURL.split('/').pop();
                    const result = callback(sampleURL, sampleName);
                    if(result === false)
                        return;
                }
            }
        }

        eachPreset(callback) {
            for(let presetName in this.sampleLibrary.presets) {
                if(this.sampleLibrary.presets.hasOwnProperty(presetName)) {
                    // let presetConfig = this.sampleLibrary.presets[presetName];
                    const presetURL = this.url + '#' + presetName; // New Preset URL
                    const result = callback(presetURL, presetName);
                    if(result === false)
                        return;
                }
            }
        }

        eachLibrary(callback) {
            if (this.sampleLibrary.libraries) {
                for (let i = 0; i < this.sampleLibrary.libraries.length; i++) {
                    let libraryConfig = this.sampleLibrary.libraries[i];
                    if (typeof libraryConfig !== 'object')
                        libraryConfig = {url: libraryConfig};
                    const libraryURL = new URL((this.sampleLibrary.urlPrefix || '') + libraryConfig.url, this.url) + ''; // New Library URL
                    let libraryName = libraryConfig.name || libraryConfig.url.split('/').pop();
                    const result = callback(libraryURL, libraryName);
                    if(result === false)
                        return;
                }
            }
        }

        getPresetConfig(presetName) {
            const urlPrefix = this.sampleLibrary.urlPrefix || '';
            const newConfig = {};
            newConfig.preset = presetName;
            newConfig.samples = [];
            if (!this.sampleLibrary.presets[presetName])
                throw new Error("Invalid Instrument Preset: " + presetName);
            const presetConfig = this.sampleLibrary.presets[presetName];
            if (!presetConfig.samples)
                presetConfig.samples = {};
            if (Object.keys(presetConfig.samples).length === 0)
                presetConfig.samples[presetName] = {};
            // Object.assign(newConfig, presetConfig);
            Object.keys(presetConfig.samples).forEach((sampleName) => {
                const sampleConfig =
                    Object.assign({
                            url: sampleName
                        },
                        presetConfig.samples[sampleName],
                        this.sampleLibrary.samples[sampleName]);
                sampleConfig.url = new URL(urlPrefix + sampleConfig.url, this.sampleLibrary.url) + '';

                if (typeof sampleConfig.keyRange !== "undefined") {
                    let pair = sampleConfig.keyRange;
                    if (typeof pair === 'string')
                        pair = pair.split(':');
                    sampleConfig.keyLow = pair[0];
                    sampleConfig.keyHigh = pair[1] || pair[0];
                    delete sampleConfig.keyRange;
                }
                sampleConfig.name = sampleName;
                newConfig.samples.push(sampleConfig);
            });
            newConfig.libraryURL = this.url;
            return newConfig;
        }


        static eachHistoricLibrary(callback) {
            for(let cacheURL in SampleLibrary.cache) {
                if(SampleLibrary.cache.hasOwnProperty(cacheURL)) {
                    let libraryConfig = SampleLibrary.cache[cacheURL];
                    let libraryName = libraryConfig.name || libraryConfig.url.split('/').pop();
                    const result = callback(libraryConfig.url, libraryName);
                    if(result === false)
                        return;
                }
            }
        }


        async loadURL(url) {
            if (!url)
                throw new Error("Invalid url");
            url = new URL((url + '').split('#')[0], document.location) + '';
            this.url = url;
            if (SampleLibrary.cache[url]) {
                this.sampleLibrary = SampleLibrary.cache[url];
                this.sampleLibrary.url = url;
                return this.sampleLibrary;
            }

            if (SampleLibrary.XHRPromises[url]) {
                this.sampleLibrary = await SampleLibrary.XHRPromises[url];
                this.sampleLibrary.url = url;
                return this.sampleLibrary;
            }

            const promise = new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url + '', true);
                xhr.responseType = 'json';
                xhr.onload = () => {
                    if (xhr.status !== 200)
                        return reject("Sample library not found: " + url);

                    this.sampleLibrary = xhr.response;
                    this.sampleLibrary.url = url + '';

                    Object.keys(SampleLibrary.cache).forEach(cacheURL => {
                        if (Object.values(SampleLibrary.cache) > 5)
                            delete SampleLibrary.cache[cacheURL];
                    });
                    SampleLibrary.cache[url] = this.sampleLibrary;

                    console.info("Sample Library Loaded: ", url, this.sampleLibrary, SampleLibrary.cache);
                    resolve(this.sampleLibrary);
                };
                xhr.send();
            });
            SampleLibrary.XHRPromises[url] = promise;
            return await promise;
        }
    }


    SampleLibrary.cache = {};
    SampleLibrary.XHRPromises = {};


    /** Utilities & Dispatch Class **/



    function getScriptElm() {
        return document.head.querySelector('script[src$="audio-source-synthesizer.js"],script[src$="audio-source-synthesizer.min.js"]');
    }

    function getScriptDirectory(appendPath = '') {
        const scriptElm = getScriptElm();
        const basePath = scriptElm.src.split('/').slice(0, -2).join('/') + '/';
        return basePath + appendPath;
    }

    const scriptElm = getScriptElm();
    if (!scriptElm)
        throw new Error("Couldn't find head script");
    const eventData = {
        detail: {
            "class": AudioSourceSynthesizer,
            // "renderClass": SynthesizerInstrumentElement,
            "url": scriptElm.src,
            "script": scriptElm
        },
        bubbles: true
    };
    document.dispatchEvent(new CustomEvent('instrument:loaded', eventData));

    // window.addEventListener('DOMContentLoaded', e => {
    //     document.dispatchEvent(new CustomEvent('instrument:loaded', eventData));
    // });


}























