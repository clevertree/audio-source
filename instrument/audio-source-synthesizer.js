{
    class AudioSourceSynthesizer {
        // get DEFAULT_SAMPLE_LIBRARY_URL() { return '/sample/index.library.json'; }
        get DEFAULT_SAMPLE_LIBRARY_URL() {
            return getScriptDirectory('sample/sample.library.json');
        }


        constructor(config, song=null, instrumentID=null) {
            this.song = song;
            this.instrumentID = instrumentID;
            this.form = null;
            this.config = config || {};
            this.loadConfig(this.config);

            this.samples = [];
            this.sampleDataByURL = {};
            this.activeSources = [];

            this.sampleLibrary = new SampleLibrary();
            this.sampleLibrary.loadURL(this.getSampleLibraryURL());
            this.audioContext = null;
        }


        getSampleLibraryURL() {
            return this.config.libraryURL
                || this.DEFAULT_SAMPLE_LIBRARY_URL;
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
            if(typeof this.sampleDataByURL[sampleURL] !== "undefined") {
                sampleURL = new URL(sampleURL, document.location) + '';

                sampleData = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();

                    xhr.open('GET', sampleURL, true);
                    const ext = sampleURL.split('.').pop().toLowerCase();
                    switch (ext) {
                        // default:
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
                        console.info("Sample Data Loaded: ", sampleURL);
                        resolve(xhr.response);
                    };
                    xhr.onerror = reject;
                    xhr.send();
                });

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


            const ext = sampleURL.substr(-4).split('.').pop().toLowerCase();
            switch (ext) {
                default:
                case 'wav':
                    sampleData.buffer = await this.initAudioSample(audioContext, sampleURL);
                    break;

                case 'json':
                    sampleData.periodicWave = await this.initAudioSample(audioContext, sampleURL);
                    break;
//                 default:
//                     reject("Unknown extension: " + ext);
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


        async addSample(sampleURL, promptUser=false) {
            if(promptUser)
                sampleURL = prompt(`Add Sample URL:`, 'https://mysite.com/mysample.wav');
            if (!sampleURL)
                throw new Error("Change sample URL canceled");

            if (sampleURL.endsWith('.library.json')) {
                console.log("Loading library: " + sampleURL);
                await this.sampleLibrary.loadURL(sampleURL);

            } else {
                let addSampleName = sampleURL.split('/').pop().split('.').slice(0, -1).join('.');
                addSampleName = prompt(`Set Sample Name:`, addSampleName);
                const addSampleID = this.config.samples.length;
                this.song.replaceInstrumentParam(this.instrumentID, ['samples', addSampleID], {
                    url: sampleURL,
                    name: addSampleName
                });
                await this.loadAudioSample(addSampleID);
            }

            if(this.form)
                this.form.fieldAddSample.renderOptions(); // TODO: re-trigger drop down on RN?
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
                source.detune = detune;
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

            // if (sources.length === 0)
            //     console.warn("No sources were created");


            // Detune
            if (typeof sampleConfig.detune !== "undefined")
                sources.forEach(source => source.detune.value = sampleConfig.detune);

            // console.log("Buffer Play: ", playbackRate);
            // return sources;

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

        renderForm(instrumentForm) {
            this.form = new AudioSourceSynthesizerFormRenderer(instrumentForm, this);
        }

        renderHTML() {
            // Use Panel UI. If not available, load it
            const instrumentID = this.instrumentID || 'N/A'; // this.getAttribute('data-id') || '0';
            const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID + ":");
            const instrumentPreset = this.config;

            // const SampleLibrary = customElements.get('asci-sample-library');

            const noteFrequencies = this.noteFrequencies;
            let noteFrequencyOptionsHTML = '';
            for (let i = 1; i <= 6; i++)
                for (let j = 0; j < noteFrequencies.length; j++)
                    noteFrequencyOptionsHTML += `<option>${noteFrequencies[j] + i}</option>`;

            let polyphonyOptionsHTML = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16, 24, 32, 48, 64, 128, 256, 512]
                .map(polyphonyCount => `<option>${polyphonyCount}</option>`)



            let containerElm = this.shadowDOM.querySelector('div.audio-source-synthesizer');
            if (!containerElm) {

                // const linkHRef = getScriptDirectory('instrument/audio-source-synthesizer.css');
                this.shadowDOM.innerHTML = `
                <div class="audio-source-synthesizer"></div>
            `;
                containerElm = this.shadowDOM.querySelector('div.audio-source-synthesizer');
            }

            containerElm.innerHTML = `
            <div class="instrument-container-header">
            <table class="instrument-setting-list" style="display: none;">
                <thead>
                    <tr>
                        <th>Poly</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <form action="#" class="instrument-setting instrument-setting-polyphony submit-on-change" data-action="instrument:polyphony">
                                <input type="number" name="polyphony" placeholder="Infinite" list="polyphonyOptions" min="0" max="256" value="${this.config.polyphony || '256'}" />
                            </form>
                        </td>
                    </tr>
                </tbody>
            </table>
            <table class="sample-setting-list">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>URL</th>
                        <th>Mix</th>
                        <th>Detune</th>
                        <th>Root</th>
                        <th>Alias</th>
                        <th>Loop</th>
                        <th>ADSR</th>
                        <th>Rem.</th>
                    </tr>
                </thead>
                <tbody>
            ${this.config.samples.map((sampleConfig, sampleID) => {
                const sampleFileName = sampleConfig.url ? sampleConfig.url.split('/').pop() : "N/A";
                return `
                    <tr>
                        <td>   
                            <form action="#" class="instrument-setting instrument-setting-change-name submit-on-change" data-action="sample:changeName">
                                <input type="hidden" name="sampleID" value="${sampleID}" />
                                <input type="text" name="name" value="${sampleConfig.name || ''}" placeholder="Unnamed">
                            </form>
                        </td>  
                        <td>   
                            <form action="#" class="instrument-setting instrument-setting-change-url submit-on-change" data-action="sample:changeURL">
                                <input type="hidden" name="sampleID" value="${sampleID}" />
                                <select name="url">
                                    <option value="${sampleConfig.url}">${sampleFileName}</option>
                                    ${this.sampleLibrary.eachSample((iSampleConfig, iSampleURL, iSampleName) => {
                    if (iSampleURL === sampleConfig.url)
                        return '';
                    const iSampleFileName = iSampleURL.split('/').pop();
                    return `<option value="${iSampleURL}">${iSampleFileName}</option>`
                }).join('')}
                                    <option value="">Custom URL</option>
                                </select>
                            </form>
                        </td>  
                        <td>   
                            <form action="#" class="instrument-setting instrument-setting-mixer submit-on-change" data-action="sample:mixer">
                                <input type="hidden" name="sampleID" value="${sampleID}" />
                                <input type="range" name="mixer" min="1" max="100" value="${sampleConfig.mixer || '-1'}" />
                            </form>
                        </td>    
                        <td>   
                            <form action="#" class="instrument-setting instrument-setting-detune submit-on-change" data-action="sample:detune">
                                <input type="hidden" name="sampleID" value="${sampleID}" />
                                <input type="range" name="detune" min="-100" max="100" value="${0}" />
                            </form>
                        </td>      
                        <td>   
                            <form action="#" class="instrument-setting instrument-setting-root submit-on-change" data-action="sample:keyRoot">
                                <input type="hidden" name="sampleID" value="${sampleID}" />
                                <input type="text" name="keyRoot" value="${sampleConfig.keyRoot || ''}" list="noteFrequencies" placeholder="N/A" />
                            </form>
                        </td>      
                        <td>   
                            <form action="#" class="instrument-setting instrument-setting-alias submit-on-change" data-action="sample:keyAlias">
                                <input type="hidden" name="sampleID" value="${sampleID}" />
                                <input type="text" name="keyAlias" value="${sampleConfig.keyAlias || ''}" list="noteFrequencies" placeholder="N/A" />
                            </form>
                        </td>  
                        <td>   
                            <form action="#" class="instrument-setting instrument-setting-loop submit-on-change" data-action="sample:loop">
                                <input type="hidden" name="sampleID" value="${sampleID}" />
                                <input type="checkbox" name="loop" ${sampleConfig.loop ? 'checked="checked"' : ''} />
                            </form>
                        </td>  
                        <td>   
                            <form action="#" class="instrument-setting instrument-setting-adsr submit-on-change" data-action="sample:adsr">
                                <input type="hidden" name="sampleID" value="${sampleID}" />
                                <input type="text" name="adsr" value="${sampleConfig.adsr || ''}" placeholder="0,0,0,0" />
                            </form>
                        </td>
                        <td>   
                            <form action="#" class="instrument-setting instrument-setting-remove submit-on-change" data-action="sample:remove">
                                <input type="hidden" name="sampleID" value="${sampleID}" />
                                <button name="remove">
                                    <i class="ui-icon ui-subtract"></i>
                                </button>
                            </form>
                        </td>  
                    </tr>`;
            }).join("\n")}
            
    `;

        };

        // <td>
        //     <form action="#" class="instrument-setting instrument-setting-range submit-on-change" data-action="instrument:keyRange">
        //         <input type="hidden" name="sample" value="${sampleName}"/>
        //         <input name="keyLow" value="${this.config.samples[sampleName].keyLow || ''}" list="noteFrequencies" placeholder="N/A"> -
        //         <input name="keyHigh" value="${this.config.samples[sampleName].keyHigh || ''}" list="noteFrequencies" placeholder="N/A">
        //     </form>
        // </td>

        async onSubmit(e) {
            if (e.defaultPrevented)
                return;
            console.log(e.type, e.target);
            e.preventDefault();
            let form = e.target.form || e.target;
            const command = form.getAttribute('data-action');
            const instrumentID = parseInt(this.getAttribute('data-id') || '0');


            switch (command) {
                case 'instrument:polyphony':
                    let newPolyphony = parseInt(form.elements[0].value);
                    this.config.polyphony = newPolyphony;
                    break;
                case 'sample:add':
                    const addSampleURL = form.elements.url.value || prompt(`Add Sample URL:`, 'https://mysite.com/mysample.wav');
                    if (!addSampleURL) {
                        console.info("Change sample URL canceled");
                        break;
                    }
                    if (addSampleURL.endsWith('.library.json')) {
                        console.log("Loading library: " + addSampleURL);
                        e.preventDefault();
                        e.stopPropagation();
                        // this.loadSampleLibrary(libraryURL);
                        await this.sampleLibrary.loadURL(addSampleURL);
                        this.render();
                        return;
                    }
                    let addSampleName = addSampleURL.split('/').pop().split('.').slice(0, -1).join('.');
                    addSampleName = prompt(`Set Sample Name:`, addSampleName);
                    const addSampleID = this.config.samples.length;
                    this.song.replaceInstrumentParam(instrumentID, ['samples', addSampleID], {
                        url: addSampleURL,
                        name: addSampleName
                    });
                    await this.loadAudioSample(addSampleID);
                    this.render();
                    break;

                case 'sample:changeName':
                case 'sample:changeURL':
                case 'sample:remove':
                case 'sample:mixer':
                case 'sample:detune':
                case 'sample:keyRoot':
                case 'sample:keyAlias':
                case 'sample:loop':
                case 'sample:adsr':
                    const sampleID = form.elements.sampleID.value;
                    const sampleConfig = this.config.samples[sampleID];
                    if (!sampleConfig)
                        throw new Error("Sample not found: " + sampleID);

                    switch (command) {
                        case 'sample:remove':
                            this.song.replaceInstrumentParam(instrumentID, ['samples', sampleID]);
                            this.render();
                            break;

                        case 'sample:changeName':
                            // TODO: change sample name.
                            const newSampleName = form.elements.name.value;
                            if (!newSampleName)
                                throw new Error("Invalid new sample name");
                            this.song.replaceInstrumentParam(instrumentID, ['samples', sampleID, 'name'], newSampleName);
                            // this.render();
                            break;

                        case 'sample:changeURL':
                            const changeSampleURL = form.elements.url.value || prompt(`Change Sample URL: (ID ${sampleID})`, sampleConfig.url);
                            if (changeSampleURL) {
                                // TODO: change sample name
                                this.song.replaceInstrumentParam(instrumentID, ['samples', sampleID, 'url'], changeSampleURL);
                                await this.loadSamples();
                            } else {
                                console.info("Change sample URL canceled");
                            }
                            break;

                        case 'sample:mixer':
                            this.song.replaceInstrumentParam(instrumentID, ['samples', sampleID, 'mixer'], parseInt(form.elements.mixer.value));
                            break;

                        case 'sample:detune':
                            this.song.replaceInstrumentParam(instrumentID, ['samples', sampleID, 'detune'], parseInt(form.elements.detune.value));
                            break;

                        case 'sample:keyRoot':
                            this.song.replaceInstrumentParam(instrumentID, ['samples', sampleID, 'keyRoot'], form.elements.keyRoot.value);
                            break;
                        case 'sample:keyAlias':
                            this.song.replaceInstrumentParam(instrumentID, ['samples', sampleID, 'keyAlias'], form.elements.keyAlias.value);
                            break;
                        case 'sample:loop':
                            this.song.replaceInstrumentParam(instrumentID, ['samples', sampleID, 'loop'], form.elements.loop.checked);
                            break;
                        case 'sample:adsr':
                        default:
                            throw new Error("Shouldn't happen");
                    }
                    break;

                case 'customURL':
                    const libraryURL = e.target.value;
                    if (libraryURL.endsWith('.library.json')) {
                        console.log("Loading library: " + libraryURL);
                        e.preventDefault();
                        e.stopPropagation();
                        // this.loadSampleLibrary(libraryURL);
                        await this.sampleLibrary.loadURL(libraryURL);
                        this.render();
                        return;
                    }
                    break;
                case 'instrument:preset':
                    const newPresetURL = new URL(form.elements['preset'].value);
                    await this.sampleLibrary.loadURL(newPresetURL);
                    if (newPresetURL.hash) {
                        const newPresetName = newPresetURL.hash.substr(1);
                        let newPresetConfig = this.sampleLibrary.getPresetConfig(newPresetName);
                        newPresetConfig = Object.assign({}, this.config, newPresetConfig);
                        this.song.replaceInstrument(instrumentID, newPresetConfig);
                        this.loadConfig(newPresetConfig);
                    }

                    this.render();

                    break;


                case 'instrument:name':
                    this.song.setInstrumentName(instrumentID, form.elements.name.value);
                    break;

                case 'instrument:remove':
                    // TODO: dispatch to shadow host
                    this.song.removeInstrument(form.elements['instrumentID'].value);
                    break;

                case 'instrument:change':
                    this.song.replaceInstrument(form.elements['instrumentID'].value, form.elements['instrumentURL'].value);
                    await this.song.loadInstrument(form.elements['instrumentID'].value, true);
                    break;


                default:
                    console.warn("Unhandled ", e.type, command);
                    break;

                // default:
                //     const newConfig = Object.assign({}, this.config);
                //     for(let i=0; i<form.elements.length; i++)
                //         if(form.elements[i].name)
                //             newConfig[form.elements[i].name] = form.elements[i].value;
                //
                //     // Validate Config
                //     if(newConfig.preset !== this.config.preset) {
                //         Object.assign(newConfig, this.getInstrumentPresetConfig(newConfig.preset));
                //     }
                //
                //     this.config = newConfig;
                //     this.render();
                //     this.dispatchEvent(new CustomEvent('config:updated', {
                //         bubbles:true,
                //         detail: this.config
                //     }))
            }
        }

        // static validateConfig(config, form) {
        //     console.info("Validate: ", config, form);
        // }


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


        // loadCSS() {
        //     if (document.head.querySelector('link[href$="audio-source-synthesizer.css"]'))
        //         return;
        //     const linkHRef = getScriptDirectory('instrument/audio-source-synthesizer.css');
        //     // console.log(linkHRef);
        //     let cssLink = document.createElement("link");
        //     cssLink.setAttribute("rel", "stylesheet");
        //     cssLink.setAttribute("type", "text/css");
        //     cssLink.setAttribute("href", linkHRef);
        //     document.head.appendChild(cssLink);
        // }

    }

    class AudioSourceSynthesizerFormRenderer {
        constructor(instrumentForm, instrument) {


            this.form = instrumentForm;
            this.instrument = instrument;
            this.form.clearInputs();

            this.fieldAddSample = this.form.addSelect(
                'add-sample',
                (e, sampleURL) => this.instrument.addSample(sampleURL), (addOption, setOptgroup) => {
                    addOption('', 'Add Sample');
                        setOptgroup(instrument.sampleLibrary.name || 'Unnamed Library');
                    instrument.sampleLibrary.eachSample(addOption);
                        setOptgroup('Libraries');
                    instrument.sampleLibrary.eachLibrary(addOption);
                        setOptgroup('Other Libraries');
                    SampleLibrary.eachHistoricLibrary(addOption);
                },
                'Add Sample',
                '');
        }

//     <option value="">Add Sample</option>
//     <optgroup label="${this.sampleLibrary.name || 'Unnamed Library'}">
//             ${this.sampleLibrary.eachSample((iSampleConfig, iSampleURL, iSampleName) => {
// const iSampleFileName = iSampleURL.split('/').pop();
// return `<option value="${iSampleURL}">${iSampleFileName}</option>`
//     }).join('')}
// <option value="">Custom URL</option>
// </optgroup>
// <optgroup label="Libraries">
//     ${this.sampleLibrary.eachLibrary((libraryConfig, libraryURL, libraryName) => {
// return `<option value="${libraryURL}">${libraryName}</option>`;
// }).join("
// ")}
// </optgroup>
// <optgroup label="Other Libraries">
//     ${SampleLibrary.eachHistoricLibrary((libraryConfig, libraryURL, libraryName) => {
// return `<option value="${libraryURL}">${libraryName}</option>`;
// }).join("
// ")}
// </optgroup>

        // get formTrackerOctave() { return this.form.getOrCreateForm('octave'); }
        //
        // get formTrackerRowLength() { return this.form.getOrCreateForm('row-length'); }
        // get formTrackerInstrument() { return this.form.getOrCreateForm('instrument'); }
        // get formTrackerSelection() { return this.form.getOrCreateForm('selection'); }

        /** Tracker Fields **/

    }


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



    class SampleLibrary {
        constructor() {
            this.url = "N/A";
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


}























