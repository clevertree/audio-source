(async function() {

    /** Register Script Exports **/
    function getThisScriptPath() { return 'instrument/audio-source-synthesizer.js'; }
    const exportThisScript = function(module) {
        module.exports = {
            instrument: AudioSourceSynthesizer,
            AudioSourceSynthesizer
        };
    };
    
    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();


    const {AudioSourceLibrary} = await requireAsync('common/audio-source-library.js');
    const {AudioSourceValues} = await requireAsync('common/audio-source-values.js');
    const {
        ASUIComponent,
        ASUIDiv,
        ASUIMenu,
        // ASUISelectMenu,
        ASUIGrid,
        ASUIGridRow,
        ASUIInputButton,
        ASUIFileInput,
        ASUIInputRange,
        ASUIInputSelect,
        ASUIInputCheckBox,
        ASUIInputText,
        ASUIcon,
    } = await requireAsync('common/audio-source-ui.js');


    const audioSourceValues = new AudioSourceValues;

    class AudioSourceSynthesizer extends ASUIComponent {
        constructor(config, song=null, instrumentID=null, props={}) {
            super({
                open: true
            }, props);
            this.state.config = config;
            this.song = song;
            this.state.id = instrumentID;

            this.samples = [];
            this.sampleDataByURL = {};
            this.activeSources = [];

            this.audioContext = null;
            if(typeof config.name === "undefined")
                config.name = 'Synthesizer ' + (instrumentID < 10 ? "0" : "") + (instrumentID);
            this.state.config = config || {};
            this.sampleLibrary = this.loadSampleLibrary();
            this.loadConfig(this.state.config); //TODO: get

            // this.loadDefaultSampleLibrary()
            //     .then(e => this.render());

        }

        connectedCallback() {
            super.connectedCallback();
            this.appendCSS();
        }


        // get instrumentID() {
        //     return this.getAttribute('data-id');
        // }

        async render() {

            // const instrument = this;
            const instrumentID = typeof this.state.id !== "undefined" ? this.state.id : -1;
            const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);

            let presetURL = this.state.config.presetURL || '';
            let presetTitle = presetURL.split('#').pop() || presetURL.split('/').pop() || 'Set Preset';
            // if(this.state.config.presetURL && this.state.config.preset)
            //     presetURL = new URL(this.state.config.libraryURL + '#' + this.state.config.preset, document.location) + '';

            const samples = this.state.config.samples;
            const sampleLibrary = await this.sampleLibrary;
            let titleHTML = `${instrumentIDHTML}: ${this.state.config.name || "Unnamed"}`;

            return [

                new ASUIDiv('title', () => [
                    titleHTML,
                    this.refs.selectChangePreset = new ASUIInputSelect('instrument-preset',
                        (selectElm) => [
                            selectElm.getOptGroup((sampleLibrary.name || 'Unnamed Library') + ' ►', () =>
                                sampleLibrary.eachPreset(config => selectElm.getOption(config.url, config.name)),
                            ),
                            selectElm.getOptGroup('Libraries ►', () =>
                                sampleLibrary.eachLibrary(config => selectElm.getOption(config.url, config.name)),
                            ),
                            selectElm.getOptGroup('Other Libraries', async () =>
                                await AudioSourceLibrary.eachHistoricLibrary(config => selectElm.getOption(config.url, config.name)),
                            ),
                        ],
                        (e, presetURL) => this.setPreset(presetURL),
                        presetURL,
                        presetTitle,
                        {vertical: true}
                    ),

                    this.refs.menu = new ASUIMenu(
                        new ASUIcon('config'),
                        () => [
                            new ASUIMenu('Change Instrument to ►',
                                async () => {
                                    const instrumentLibrary = await AudioSourceLibrary.loadDefaultLibrary(); // TODO: get default library url from composer?
                                    return instrumentLibrary.eachInstrument((instrumentConfig) =>
                                        new ASUIMenu(instrumentConfig.name, null, () => {
                                            thisReplace(instrumentID, instrumentConfig.url);
                                        })
                                    );
                                }
                            ),
                            new ASUIMenu('Rename Instrument', null, () => this.composerElm.instrumentRename(instrumentID)),
                            new ASUIMenu('Remove Instrument', null, () => this.composerElm.instrumentRemove(instrumentID)),
                        ], null, {style: {}}
                    ),

                    // new ASUIInputSelect('url',
                    //     (e, changeInstrumentURL) => thisReplace(e, instrumentID, changeInstrumentURL),
                    //     async (selectElm) =>
                    //         instrumentLibrary.eachInstrument((instrumentConfig) =>
                    //             selectElm.getOption(instrumentConfig.url, instrumentConfig.name)),
                    //     'Set Instrument'
                    // )
                ]),

                // this.refs.buttonToggle = new ASUIInputButton('instrument-id',
                //     e => this.form.classList.toggle('selected'),
                //     instrumentIDHTML + ':'
                // ),
                // this.refs.textName = new ASUIInputText('instrument-name',
                //     (e, newInstrumentName) => this.stateRename(newInstrumentName),
                //     'Instrument Name',
                //     this.state.config.name || '',
                //     'Unnamed'
                // ),
                // new ASUIInputButton('instrument-remove',
                //     (e) => this.remove(e, instrumentID),
                //     new ASUIcon('delete'),
                //     'Remove Instrument'),

                /** Sample Forms **/
                !this.state.open ? null : new ASUIGrid('samples', () => [
                    new ASUIGridRow('header', () => [
                        new ASUIDiv('id', 'ID'),
                        new ASUIDiv('url', 'URL'),
                        new ASUIDiv('mixer', 'Mixer'),
                        new ASUIDiv('detune', 'Detune'),
                        new ASUIDiv('root', 'Root'),
                        new ASUIDiv('alias', 'Alias'),
                        new ASUIDiv('loop', 'Loop'),
                        new ASUIDiv('adsr', 'ADSR'),
                        new ASUIDiv('remove', 'Rem'),
                    ]),

                    samples.map((sampleData, sampleID) => new ASUIGridRow(sampleID, () => [
                        // const sampleRow = gridDiv.addGridRow('sample-' + sampleID);
                        // const sampleRow = this.form.addGrid(i);
                        // new ASUIDiv('name', (e, nameString) => this.setSampleName(sampleID, nameString), 'Name', sampleData.name);
                        // new ASUIInputButton('id', (e) => this.moveSample(sampleID), sampleID, 'Sample ' + sampleID);
                        new ASUIDiv('id', sampleID),

                        new ASUIInputSelect('url',
                            selectElm => sampleLibrary.eachSample(config => selectElm.getOption(config.url, config.name)),
                            (e, url) => this.setSampleURL(sampleID, url),
                            sampleData.url,
                            sampleData.name),

                        new ASUIInputRange('mixer',
                            (e, mixerValue) => this.setSampleMixer(sampleID, mixerValue), 1, 100, 'Mixer', sampleData.mixer),

                        new ASUIInputRange('detune',
                            (e, detuneValue) => this.setSampleDetune(sampleID, detuneValue), -100, 100, 'Detune', sampleData.detune),

                        new ASUIInputSelect('root',
                            selectElm => audioSourceValues.getNoteFrequencies(selectElm.getOption),
                            (e, keyRoot) => this.setSampleKeyRoot(sampleID, keyRoot),
                            'Root', sampleData.keyRoot || ''),
                        // new ASUIMenu('root',
                        //     selectElm => audioSourceValues.getNoteFrequencies(freq => {
                        //         new ASUISelectMenu
                        //     }),
                        //     null,
                        //     'Root', sampleData.keyRoot || ''),

                        new ASUIInputSelect('alias',
                            selectElm => audioSourceValues.getNoteFrequencies(selectElm.getOption),
                            (e, keyAlias) => this.setSampleKeyAlias(sampleID, keyAlias),
                            'Alias', sampleData.keyAlias),

                        new ASUIInputCheckBox('loop',
                            (e, isLoop) => this.setSampleLoop(sampleID, isLoop), 'Loop', sampleData.loop),

                        new ASUIInputText('adsr',
                            (e, asdr) => this.setSampleASDR(sampleID, asdr), 'ADSR', sampleData.adsr, '0,0,0,0'),

                        new ASUIInputButton('remove',
                            (e) => this.removeSample(sampleID), '&nbsp;X&nbsp;', 'Remove sample'),
                    ])),

                    new ASUIGridRow('footer', () => [
                        /** Add New Sample **/
                        new ASUIDiv('id', '*'),
                        this.refs.fieldAddSample = new ASUIInputSelect('url',
                            (selectElm) => [
                                selectElm.getOption('', '[New Sample]'),
                                selectElm.getOptGroup((sampleLibrary.name || 'Unnamed Library') + ' ►', () =>
                                    sampleLibrary.eachSample(config => selectElm.getOption(config.url, config.name)),
                                ),
                                selectElm.getOptGroup('Libraries ►', () =>
                                    sampleLibrary.eachLibrary(config => selectElm.getOption(config.url, config.name)),
                                ),
                                selectElm.getOptGroup('Other Libraries', async () =>
                                    await AudioSourceLibrary.eachHistoricLibrary(config => selectElm.getOption(config.url, config.name)),
                                ),
                            ],
                            (e, sampleURL) => this.addSample(sampleURL),
                            'Add Sample',
                            ''),
                        new ASUIDiv('id', '-'),
                        new ASUIDiv('id', '-'),
                        new ASUIDiv('id', '-'),
                        new ASUIDiv('id', '-'),
                        new ASUIDiv('id', '-'),
                        new ASUIDiv('id', '-'),
                        new ASUIDiv('id', '-'),

                    ]),
                ]),

            ];

        }

        /** Sample Library **/

        async loadSampleLibrary() {
            if(this.state.config.libraryURL)
                this.sampleLibrary = await AudioSourceLibrary.loadFromURL(this.state.config.libraryURL);
            else
                this.sampleLibrary = await AudioSourceLibrary.loadDefaultLibrary();
            return this.sampleLibrary;
        }

        /** Loading **/

        async loadConfig(newConfig) {
            if (!newConfig.samples)
                newConfig.samples = [];
            else
                newConfig.samples = Object.values(newConfig.samples);
            // TODO: unload samples - this.samples
            Object.assign(this.state.config, newConfig);
            await this.loadSamples();
        }


        async loadSamples() {
            this.samples = [];
            for (let sampleID = 0; sampleID < this.state.config.samples.length; sampleID++) {
                try {
                    await this.loadAudioSample(sampleID);
                } catch (e) {
                    console.warn("Error loading sample: " + sampleID, e);
                }
            }
        }

        async loadAudioSample(sampleID) {
            const sampleConfig = this.state.config.samples[sampleID];
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
                    const ext = getFileExtension(sampleURL).toLowerCase();
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

        /** Initializing Audio **/


        async init(audioContext) {
            this.audioContext = audioContext;
            for (let sampleID = 0; sampleID < this.samples.length; sampleID++) {
                await this.initSample(audioContext, sampleID);
            }
        }

        // instruments receive audioContext only after user gesture
        async initSample(audioContext, sampleID) {
            const sampleConfig = this.state.config.samples[sampleID];
            let sampleURL = sampleConfig.url;
            if (!sampleURL)
                throw new Error("Sample config is missing url");

            if (typeof this.samples[sampleID] !== "undefined")
                console.warn("Sample is already loaded: " + sampleID);

            const sampleData = {};

            const ext = getFileExtension(sampleURL).toLowerCase();
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
            const ext = getFileExtension(sampleURL).toLowerCase();
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

        async playSample(destination, sampleID, frequencyValue, startTime = null, duration = null, velocity = null, adsr = null) {
            if (!this.isSampleLoaded(sampleID))
                await this.initSample(destination.context, sampleID);

            if (Number.isNaN(frequencyValue)) {
                console.warn("Invalid command frequency: ", frequencyValue, this.state.config);
                return null;
            }
            // throw new Error("Sample not loaded: " + sampleName);
            const sampleData = this.samples[sampleID];
            const sampleConfig = this.state.config.samples[sampleID];

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
            for (let i = 0; i < this.state.config.samples.length; i++) {
                const sampleConfig = this.state.config.samples[i];
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

        onSourceEnd(e, source) {
            const activeSourceI = this.activeSources.indexOf(source);
            if (activeSourceI !== -1)
                this.activeSources.splice(activeSourceI, 1);
        }


        /** Modify Instrument **/


        async addSample(sampleURL) {
            if (!sampleURL)
                throw new Error("Change sample URL canceled");

            // let addSampleName = sampleURL.split('/').pop();
            // addSampleName = prompt(`Set Sample Name:`, addSampleName);
            const addSampleID = this.state.config.samples.length;
            this.song.instrumentReplaceParam(this.state.id, ['samples', addSampleID], {
                url: sampleURL,
                // name: addSampleName
            });
            await this.loadAudioSample(addSampleID);

        }

        /** Modify Sample **/

        // setSampleName(sampleID, newSampleName) {
        //     if(!newSampleName)
        //         throw new Error("Invalid sample name");
        //     this.song.instrumentReplaceParam(this.state.id, ['samples', sampleID, 'name'], newSampleName);
        // }

        setSamplePolyphony(sampleID, polyphonyLimit) {
            if(!Number.isInteger(polyphonyLimit))
                throw new Error("Invalid polyphony value");
            this.song.instrumentReplaceParam(this.state.id, ['samples', sampleID, 'polyphony'], polyphonyLimit);
        }

        async setSampleURL(sampleID, newSampleURL) {
            newSampleURL = new URL(newSampleURL) + '';
            this.song.instrumentReplaceParam(this.state.id, ['samples', sampleID, 'url'], newSampleURL);
            await this.loadAudioSample(sampleID);
        }

        setSampleMixer(sampleID, newMixerValue) {
            if(!Number.isInteger(newMixerValue))
                throw new Error("Invalid mixer value");
            this.song.instrumentReplaceParam(this.state.id, ['samples', sampleID, 'mixer'], newMixerValue);
        }

        setSampleDetune(sampleID, newDetuneValue) {
            if(!Number.isInteger(newDetuneValue))
                throw new Error("Invalid detune value");
            this.song.instrumentReplaceParam(this.state.id, ['samples', sampleID, 'detune'], newDetuneValue);
        }

        setSampleKeyRoot(sampleID, newKeyRootValue) {
            if(!newKeyRootValue)
                this.song.deleteInstrumentParam(this.state.id, ['samples', sampleID, 'keyRoot']);
            else
                this.song.instrumentReplaceParam(this.state.id, ['samples', sampleID, 'keyRoot'], newKeyRootValue);
        }

        setSampleKeyAlias(sampleID, newKeyAliasValue) {
            if(!newKeyAliasValue)
                throw new Error("Invalid keyAlias value");
            this.song.instrumentReplaceParam(this.state.id, ['samples', sampleID, 'keyAlias'], newKeyAliasValue);
        }

        setSampleLoop(sampleID, newLoopValue) {
            if(typeof newLoopValue !== 'boolean')
                throw new Error("Invalid loop value");
            this.song.instrumentReplaceParam(this.state.id, ['samples', sampleID, 'loop'], newLoopValue);
        }

        removeSample(sampleID) {
            this.song.deleteInstrumentParam(this.state.id, ['samples', sampleID]);
        }


        getFrequencyFromAlias(aliasName) {
            for (let sampleID = 0; sampleID < this.state.config.samples.length; sampleID++) {
                const sampleConfig = this.state.config.samples[sampleID];
                if (sampleConfig && sampleConfig.keyAlias && aliasName === sampleConfig.name) {
                    return sampleConfig.keyAlias;
                }
            }
            return null;
        }


        getFrequencyAliases() {
            const aliases = {};
            for (let sampleID = 0; sampleID < this.state.config.samples.length; sampleID++) {
                const sampleConfig = this.state.config.samples[sampleID];
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

        remove() {
            this.song.instrumentRemove(this.state.id);
            document.dispatchEvent(new CustomEvent('instrument:remove', this));
        }

        instrumentRename(newInstrumentName) {
            return this.song.instrumentRename(this.state.id, newInstrumentName);
        }

        async setPreset(presetURL) {
            presetURL = new URL(presetURL);
            this.sampleLibrary = await AudioSourceLibrary.loadFromURL(presetURL + '');
            if (presetURL.hash) {
                const newPresetName = presetURL.hash.substr(1);
                let newPresetConfig = this.sampleLibrary.getPresetConfig(newPresetName);
                newPresetConfig = Object.assign({}, this.state.config, newPresetConfig);
                await this.song.instrumentReplace(this.state.id, newPresetConfig);
                await this.loadConfig(newPresetConfig);
                this.render();
            }
//             await this.refs.selectChangePreset.renderOptions();
            // this.refs.selectChangePreset.value = ''; // TODO: why was this?
            this.refs.selectChangePreset.focus();
//             this.form.classList.add('focus');
        }

        async addSample(sampleURL, promptUser=false) {
            if(promptUser)
                sampleURL = prompt(`Add Sample URL:`, sampleURL || 'https://mysite.com/mysample.wav');
            sampleURL = new URL(sampleURL) + '';

            if (sampleURL.endsWith('.library.json')) {
                console.log("Loading library: " + sampleURL);
                await this.sampleLibrary.loadURL(sampleURL);
                this.refs.fieldAddSample.renderOptions(); // TODO: re-trigger drop down on RN?
                this.refs.fieldAddSample.value = '';
            } else {
                await this.addSample(sampleURL);
                this.render();
            }

        }


        appendCSS() {
            const rootElm = this.getRootNode() || document;

            // Append Instrument CSS
            const PATH = 'instrument/audio-source-synthesizer.css';
            const linkHRef = getScriptDirectory(PATH);
//             console.log(rootElm);
            let linkElms = rootElm.querySelectorAll('link');
            for(let i=0; i<linkElms.length; i++) {
                if(linkElms[i].href.endsWith(PATH))
                    return;
            }
            const linkElm = document.createElement('link');
            linkElm.setAttribute('rel', 'stylesheet');
            linkElm.setAttribute('href', linkHRef);
            rootElm.insertBefore(linkElm, rootElm.firstChild);
        }

    }
    customElements.define('audio-source-synthesizer', AudioSourceSynthesizer);








    /** Utilities & Dispatch Class **/

    function getFileExtension(filePath) {
        const fileName = filePath.split('/').pop();
        const ext = fileName.indexOf('.') === -1 ? '' : fileName.split('.').pop();
        return ext;
    }

    function getScriptDirectory(appendPath = '') {
        const scriptElm = findThisScript()[0];
        // const basePath = scriptElm.src.split('/').slice(0, -2).join('/') + '/';
        return scriptElm.basePath + appendPath;
    }



    /** Export this script **/
    registerModule(exportThisScript);

    /** Finish Registering Async Module **/
    resolveExports();


    /** Module Loader Methods **/
    function registerAsyncModule() {
        let resolve;
        const promise = new Promise((r) => resolve = r);
        registerModule(module => {
            module.promises = (module.promises || []).concat(promise);
        });
        return resolve;
    }
    function registerModule(callback) {
        if(typeof window === 'undefined')
            callback(module);
        else findThisScript()
            .forEach(scriptElm => callback(scriptElm))
    }

    function findThisScript() {
        return findScript(getThisScriptPath());
    }

    function findScript(scriptURL) {
        let scriptElms = document.head.querySelectorAll(`script[src$="${scriptURL}"]`);
        scriptElms.forEach(scriptElm => {
            scriptElm.relativePath = scriptURL;
            scriptElm.basePath = scriptElm.src.replace(document.location.origin, '').replace(scriptURL, '');
        });
        return scriptElms;
    }

    async function requireAsync(relativeScriptPath) {
        if(typeof require !== "undefined")
            return require('../' + relativeScriptPath);

        let scriptElm = findScript(relativeScriptPath)[0];
        if(!scriptElm) {
            const scriptURL = findThisScript()[0].basePath + relativeScriptPath;
            scriptElm = document.createElement('script');
            scriptElm.src = scriptURL;
            scriptElm.promises = (scriptElm.promises || []).concat(new Promise(async (resolve, reject) => {
                scriptElm.onload = resolve;
                document.head.appendChild(scriptElm);
            }));
        }
        for (let i=0; i<scriptElm.promises.length; i++)
            await scriptElm.promises[i];
        return scriptElm.exports
            || (() => { throw new Error("Script module has no exports: " + relativeScriptPath); })()
    }
})();