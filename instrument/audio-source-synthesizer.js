if(!customElements.get('audio-source-synthesizer')) {
    class SynthesizerInstrument extends HTMLElement {
        // get DEFAULT_SAMPLE_LIBRARY_URL() { return '/sample/index.library.json'; }
        get DEFAULT_SAMPLE_LIBRARY_URL() {
            return getScriptDirectory('sample/sample.library.json');
        }


        constructor(config, renderer = null) {
            super();

            this.renderer = renderer;
            this.eventHandlers = [];

            // Create a shadow root
            this.shadowDOM = this.attachShadow({mode: 'open'});

            // if (!config)
            //     throw new Error("Instrument config object is required");
            // if(!config.name)
            //     config.name = this0.constructor.name + BufferSourceInstrument.NEW_COUNTER++;
            this.config = config || {};
            this.loadConfig(this.config);
            // this.config = config || {};            // TODO: validate config

            // if(!SynthesizerInstrument.sampleLoader)
            //     SynthesizerInstrument.sampleLoader = new SampleLoader();
            this.sampleLoader = new SampleLoader(); // SynthesizerInstrument.sampleLoader;
            this.samples = [];
            this.activeSources = [];

            const SampleLibrary = customElements.get('asci-sample-library');
            this.sampleLibrary = new SampleLibrary();
            // this.instrumentLibrary = null;
            this.libraryHistory = [];
            this.audioContext = null;
            // this.loadDefaultSampleLibrary(); // TODO: load samples before audio source loads
        }

        get editor() {
            const editor = this.closest('div.asc-container').parentNode.host;
            if (!editor)
                throw new Error("Editor not found");
            return editor;
        }

        get sampleLibraryURL() {
            return this.config.libraryURL
                || this.getAttribute('sampleLibraryURL')
                || (this.editor ? this.editor.getAttribute('sampleLibraryURL') : null)
                || this.DEFAULT_SAMPLE_LIBRARY_URL;
        }

        set sampleLibraryURL(url) {
            this.setAttribute('sampleLibraryURL', url);
        }

        connectedCallback() {
            this.attachEventHandler([
                    'change',
                    'blur',
                    'focus',
                    'submit'
                ],
                e => this.onInput(e), this.shadowDOM);
            // this.loadCSS();
            // this.song = this.closest('music-song'); // Don't rely on this !!!
            // this.shadowDOM.addEventListener('change', e => this.onInput(e));
            // this.shadowDOM.addEventListener('blur', e => this.onInput(e), true);
            // this.shadowDOM.addEventListener('focus', e => this.onInput(e), true);
            // this.addEventListener('input', this.onSubmit);
            // this.shadowDOM.addEventListener('submit', e => this.onInput(e));
            // this.addEventListener('click', onInput);

            this.sampleLibrary.loadURL(this.sampleLibraryURL)
                .then(() => this.render());
            // this.loadSampleLibrary(this.sampleLibraryURL);
            this.render();
        }


        disconnectedCallback() {
            this.eventHandlers.forEach(eventHandler =>
                eventHandler[2].removeEventListener(eventHandler[0], eventHandler[1]));
        }

        attachEventHandler(eventNames, method, context) {
            if(!Array.isArray(eventNames))
                eventNames = [eventNames];
            for(let i=0; i<eventNames.length; i++) {
                const eventName = eventNames[i];
                context = context || this;
                context.addEventListener(eventName, method);
                this.eventHandlers.push([eventName, method, context]);
            }
        }

        loadConfig(newConfig) {
            if (!newConfig.samples)
                newConfig.samples = [];
            else
                newConfig.samples = Object.values(newConfig.samples);
            // TODO: unload samples - this.samples
            Object.assign(this.config, newConfig);
            this.loadSamples();

            // document.dispatchEvent(new CustomEvent('instrument:modified', {
            //     detail: {
            //         config: this.config
            //     },
            //     bubbles: true
            // }));
        }

        loadSamples() {
            this.sampleLoader = new SampleLoader(); // SynthesizerInstrument.sampleLoader;
            this.samples = [];
            for (let sampleID = 0; sampleID < this.config.samples.length; sampleID++) {
                try {
                    this.loadAudioSample(sampleID); // Async?
                } catch (e) {
                    console.warn("Error loading sample: " + sampleID, e);
                }
            }
        }


        async init(audioContext) {
            const promises = [];
            this.audioContext = audioContext;
            for (let sampleID=0; sampleID<this.samples.length; sampleID++) {
                // noinspection JSIgnoredPromiseFromCall
                const promise = this.initSample(audioContext, sampleID);
                promises.push(promise);
            }

            for (let i = 0; i < promises.length; i++) {
                await promises[i];
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
                    sampleData.buffer = await this.sampleLoader.initAudioSample(audioContext, sampleURL, this);
                    break;

                case 'json':
                    sampleData.periodicWave = await this.sampleLoader.initAudioSample(audioContext, sampleURL, this);
                    break;
//                 default:
//                     reject("Unknown extension: " + ext);
            }

            this.samples[sampleID] = sampleData;
        }


        async loadAudioSample(sampleID) {
            const sampleConfig = this.config.samples[sampleID];
            if (!sampleConfig)
                throw new Error("Sample config is missing: " + sampleID);
            let sampleURL = sampleConfig.url;
            if (!sampleURL)
                throw new Error("Sample config is missing url: " + sampleID);
            sampleURL = new URL(sampleURL, document.location) + '';

            await this.sampleLoader.loadAudioSampleData(sampleURL, this);
            if (this.audioContext)
                await this.initSample(this.audioContext, sampleID);
        }

        isSampleLoaded(sampleID) {
            return typeof this.samples[sampleID] !== 'undefined';
        }



        // TODO: break up / redefine
        async loadDefaultSampleLibrary() {
            this.loadSamples();

            if (!this.sampleLibrary) {
                await this.sampleLibrary.loadURL(this.config.libraryURL || this.DEFAULT_SAMPLE_LIBRARY_URL);
                this.render();
            }

            // Load first library
            if (this.sampleLibrary.libraries && !this.sampleLibrary.instruments && !this.sampleLibrary.samples) {
                const firstLibrary = this.sampleLibrary.libraries[0];
                firstLibrary.url = new URL(firstLibrary.url, this.sampleLibrary.url) + '';
                if (firstLibrary.url !== this.sampleLibrary.url) {
                    await this.sampleLibrary.loadURL(firstLibrary.url);
                    this.render();
                }

            }

            // Load default sample
            if (this.sampleLibrary.instruments) {
                if (Object.keys(this.config.samples).length === 0) {
                    const sampleInstrument = Object.keys(this.sampleLibrary.instruments)[0];

                    this.loadConfig(this.sampleLibrary.getPresetConfig(sampleInstrument));

//                 console.info("Loaded default sample instrument: " + sampleInstrument, this.config);
//                 if(this.audioContext)
//                     await this.initSamples(this.audioContext);
                }
            }

            this.render();
        }

        async playPeriodicWave(destination, periodicWave, frequency, startTime=null, duration=null, velocity=null, detune=null, adsr=null) {
            const source = destination.context.createOscillator();   // instantiate an oscillator
            source.frequency.value = frequency;    // set Frequency (hz)
            if(detune !== null)
                source.detune = detune;

            source.setPeriodicWave(periodicWave);

            await this.playSource(destination, source, startTime, duration, velocity, adsr);
            // return source;
        }

        async playBuffer(destination, buffer, playbackRate, loop=false, startTime=null, duration=null, velocity=null, detune=null, adsr=null) {
            const source = destination.context.createBufferSource();
            source.buffer = buffer;
            source.loop = loop;
            source.playbackRate.value = playbackRate; //  Math.random()*2;
            if(detune !== null)
                source.detune = detune;
            await this.playSource(destination, source, startTime, duration, velocity, adsr);
            // return source;
        }

        async playSource(destination, source, startTime=null, duration=null, velocity=null, adsr=null) {
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

            source.connect(destination);

            // Add to active sources
            this.activeSources.push(source);

            if(startTime > currentTime) {
                await new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve();
                    }, (startTime - currentTime) * 1000);
                });
            }

            // console.log("activeSources", this.activeSources, source);


            currentTime = destination.context.currentTime;


            if(duration) {
                await new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve();
                    }, (startTime - currentTime + duration) * 1000);
                });
                const activeSourceI = this.activeSources.indexOf(source);
                if(activeSourceI !== -1)
                    this.activeSources.splice(activeSourceI, 1);
                // console.log("activeSources-", this.activeSources, source);
            }

        }

        async playSample(destination, sampleID, frequencyValue=null, startTime=null, duration=null, velocity=null, adsr = null) {
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

        async play(destination, commandFrequency, startTime, duration, velocity) {
            // if(!this.audioContext)
            //     this.init(destination.context);

            const sources = [];
            // if (this.config.samples.hasOwnProperty(commandFrequency)) {
            //     await this.playSample(destination, commandFrequency, null, startTime, duration, velocity);
            //     return null;
            // }

            let frequencyValue = this.getCommandFrequency(commandFrequency);
            if (Number.isNaN(frequencyValue)) {
                console.warn("Invalid command frequency: ", commandFrequency, this.config);
                return null;
            }

            // Loop through sample
            for (let i=0; i<this.config.samples.length; i++) {
                const sampleConfig = this.config.samples[i];

                // Filter sample playback
                if (sampleConfig.keyAlias)
                    continue;
                if (sampleConfig.keyLow && this.getCommandFrequency(sampleConfig.keyLow) > frequencyValue)
                    continue;
                if (sampleConfig.keyHigh && this.getCommandFrequency(sampleConfig.keyHigh) < frequencyValue)
                    continue;

                // TODO: polyphony

                await this.playSample(destination, i, frequencyValue, startTime, duration, velocity, sampleConfig.adsr || null);
                // this.playBuffer(buffer, destination, frequencyValue, sampleConfig, startTime, duration, velocity);
                // if (source)
                //     sources.push(sources);
            }

            // if(sources.length === 0)
            //     console.warn("No samples were played: ", commandFrequency, this.config);
            // return sources;
        }

        stopPlayback() {
            // Stop all active sources
            console.log("activeSources!", this.activeSources);
            for(let i=0; i<this.activeSources.length; i++) {
                try {
                    this.activeSources[i].stop();
                } catch (e) {
                    console.warn(e);
                }
            }
            this.activeSources = [];

        }

        // queueActiveSource(source, startTime, duration) {
        //     this.activeSources.push(source);
        // }

// Experiment with various ways of applying an envelope.
//     function startTone( mode )
//     {
//         var now = audioContext.currentTime;
//         gainNode.gain.cancelScheduledValues( now );
//
//         // Anchor beginning of ramp at current value.
//         gainNode.gain.setValueAtTime(gainNode.gain.value, now);
//         if( mode == 1 )
//         {
//             // Ramp slowly up with a 1 second duration.
//             gainNode.gain.linearRampToValueAtTime(1.0, now + 1.0);
//         }
//         else if( mode == 2 )
//         {
//             // Ramp up and down.
//             gainNode.gain.linearRampToValueAtTime(1.0, now + 0.5);
//             gainNode.gain.linearRampToValueAtTime(0.0, now + 1.0);
//             gainNode.gain.linearRampToValueAtTime(1.0, now + 1.5);
//             gainNode.gain.linearRampToValueAtTime(0.0, now + 2.0);
//             gainNode.gain.linearRampToValueAtTime(1.0, now + 2.5);
//         }
//         else if( mode == 3 )
//         {
//             // Ramp quickly up.
//             gainNode.gain.linearRampToValueAtTime(1.0, now + 0.1);
//             // Then decay down to a sustain level.
//             gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.3);
//         }
//         else if( mode == 4 )
//         {
//             gainNode.gain.setTargetValueAtTime(1.0, now, 0.2 );
//         }
//     }

//         async loadSampleLibrary(url) {
//             if (!url)
//                 throw new Error("Invalid url");
//             url = new URL(url, document.location) + '';
//
//             return new Promise((resolve, reject) => {
//                 const xhr = new XMLHttpRequest();
//                 xhr.open('GET', url + '', true);
//                 xhr.responseType = 'json';
//                 xhr.onload = () => {
//                     if (xhr.status !== 200)
//                         return reject("Sample library not found: " + url);
//
//                     this.sampleLibrary = xhr.response;
//                     this.sampleLibrary.url = url + '';
//
//                     if (!this.libraryHistory.find(historyEntry => historyEntry.url === this.sampleLibrary.url))
//                         this.libraryHistory.push({
//                             url: this.sampleLibrary.url,
//                             title: this.libraryHistory.length === 0 ? "Home Index" : this.sampleLibrary.name
//                         });
// //                 console.log("LIBRARY", this.sampleLibrary);
//
//                     this.render(); // Re-render
//                     resolve(this.sampleLibrary);
//                 };
//                 xhr.send();
//             });
//         }

        get instrumentID() {
            return this.getAttribute('data-id');
        }


        render() {
            const instrumentID = this.instrumentID || 'N/A'; // this.getAttribute('data-id') || '0';
            const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID + ":");
            const instrumentPreset = this.config;

            const SampleLibrary = customElements.get('asci-sample-library');

            const noteFrequencies = this.noteFrequencies;
            let noteFrequencyOptionsHTML = '';
            for (let i = 1; i <= 6; i++)
                for (let j = 0; j < noteFrequencies.length; j++)
                    noteFrequencyOptionsHTML += `<option>${noteFrequencies[j] + i}</option>`;

            let polyphonyOptionsHTML = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16, 24, 32, 48, 64, 128, 256, 512]
                .map(polyphonyCount => `<option>${polyphonyCount}</option>`)


            // <form class="instrument-setting replace-instrument submit-on-change" data-action="instrument:change">
            //     <input type="hidden" name="instrumentID" value="${instrumentID}"/>
            //     <select name="instrumentURL">
            //         <optgroup label="Change Instrument">
            //             ${this.instrumentLibrary ? this.instrumentLibrary.instruments.map((instrumentConfig) => {
            //                 if (typeof instrumentConfig !== 'object') instrumentConfig = {url: instrumentConfig};
            //                 return `<option value="${instrumentConfig.url}">${instrumentConfig.name || instrumentConfig.url.split('/').pop()}</option>`;
            //             }).join("\n") : ''}
            //         </optgroup>
            //     </select>
            // </form>
            // TODO:
            // const defaultSampleLibraryURL = new URL('/sample/', NAMESPACE) + '';

            let containerElm = this.shadowDOM.querySelector('div.audio-source-synthesizer');
            if(!containerElm) {

                const linkHRef = getScriptDirectory('instrument/audio-source-synthesizer.css');
                this.shadowDOM.innerHTML = `
                    <link rel="stylesheet" href="${linkHRef}" />
                    <div class="audio-source-synthesizer"></div>
                `;
                containerElm = this.shadowDOM.querySelector('div.audio-source-synthesizer');
            }

            containerElm.innerHTML = `
                <div class="instrument-container-header">
                    <form class="instrument-setting instrument-name submit-on-change" data-action="instrument:name">
                        <input type="hidden" name="instrumentID" value="${instrumentID}"/>
                        <label class="label-instrument-name">${instrumentIDHTML}<!--
                            --><input name="name" type="text" value="${instrumentPreset.name || ''}" placeholder="Unnamed Instrument"/>
                        </label>
                    </form>
                    <span style="float: right;">
                        <form class="instrument-setting instrument-setting-preset submit-on-change" data-action="instrument:preset">
                            <input type="hidden" name="instrumentID" value="${instrumentID}"/>
                            <select name="preset">
                                <option value="">Select Preset</option>
                                    <optgroup label="${this.sampleLibrary.name || 'Unnamed Library'}">
                                    ${this.sampleLibrary.eachPreset((presetConfig, presetURL, presetName) => {
                                        return `<option value="${presetURL}" ${presetName === this.config.preset ? ` selected="selected"` : ''}>${presetName}</option>`;
                                    }).join("\n")}
                                    </optgroup>
                                    <optgroup label="Libraries">
                                    ${this.sampleLibrary.eachLibrary((libraryConfig, libraryURL, libraryName) => {
                                        return `<option value="${libraryURL}">${libraryName}</option>`;
                                    }).join("\n")}
                                    </optgroup>
                                    <optgroup label="Other Libraries">
                                    ${SampleLibrary.eachHistoricLibrary((libraryConfig, libraryURL, libraryName) => {
                                        return `<option value="${libraryURL}">${libraryName}</option>`;
                                    }).join("\n")}
                                    </optgroup>
                            </select>
                        </form>
                        <form class="instrument-setting instrument-setting-remove" data-action="instrument:remove">
                            <input type="hidden" name="instrumentID" value="${instrumentID}"/>
                            <button class="remove-instrument">
                                <i class="ui-icon ui-remove"></i>
                            </button>
                        </form>
                    </span>
                </div>
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
                                            if(iSampleURL === sampleConfig.url)
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
                
                        <tr>
                            <td colspan="7">   
                                <form action="#" class="instrument-setting instrument-setting-add submit-on-change" data-action="sample:add">
                                    <select name="url">
                                        <option value="">Add Sample</option>
                                        <optgroup label="${this.sampleLibrary.name || 'Unnamed Library'}">
                                            ${this.sampleLibrary.eachSample((iSampleConfig, iSampleURL, iSampleName) => {
                                                const iSampleFileName = iSampleURL.split('/').pop();
                                                return `<option value="${iSampleURL}">${iSampleFileName}</option>`
                                            }).join('')}
                                            <option value="">Custom URL</option>
                                        </optgroup>
                                        <optgroup label="Libraries">
                                            ${this.sampleLibrary.eachLibrary((libraryConfig, libraryURL, libraryName) => {
                                                return `<option value="${libraryURL}">${libraryName}</option>`;
                                            }).join("\n")}
                                        </optgroup>
                                        <optgroup label="Other Libraries">
                                            ${SampleLibrary.eachHistoricLibrary((libraryConfig, libraryURL, libraryName) => {
                                                return `<option value="${libraryURL}">${libraryName}</option>`;
                                            }).join("\n")}
                                        </optgroup>
                                    </select>
                                </form>
                            </td>  
                        </tr>
                
                
                    </tbody>
                </table>
                <datalist id="noteFrequencies">
                    ${noteFrequencyOptionsHTML}
                </datalist>
                <datalist id="polyphonyOptions">
                    ${polyphonyOptionsHTML}
                </datalist>
        `;

        };

        // <td>
        //     <form action="#" class="instrument-setting instrument-setting-range submit-on-change" data-action="instrument:keyRange">
        //         <input type="hidden" name="sample" value="${sampleName}"/>
        //         <input name="keyLow" value="${this.config.samples[sampleName].keyLow || ''}" list="noteFrequencies" placeholder="N/A"> -
        //         <input name="keyHigh" value="${this.config.samples[sampleName].keyHigh || ''}" list="noteFrequencies" placeholder="N/A">
        //     </form>
        // </td>

        onInput(e) {
            // console.log(e.target, e.type);
            if (!this.shadowDOM.contains(e.target))
                return;

            // try {
            switch (e.type) {
                case 'submit':
                    this.onSubmit(e);
                    break;
                case 'change':
                case 'blur':
                    if (e.target.form && e.target.form.classList.contains('submit-on-' + e.type)) {
                        this.onSubmit(e);
                        break;
                    }


                    break;
                case 'focus':
                    switch (e.target.name) {
                        case 'preset':
                            e.target.value = '';
                    }
                    break;
            }
            // } catch (err) {
            //     this.editor.onError(err);
            // }
        }

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
                    this.renderer.replaceInstrumentParam(instrumentID, ['samples', addSampleID], {
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
                            this.renderer.replaceInstrumentParam(instrumentID, ['samples', sampleID]);
                            this.render();
                            break;

                        case 'sample:changeName':
                            // TODO: change sample name.
                            const newSampleName = form.elements.name.value;
                            if(!newSampleName)
                                throw new Error("Invalid new sample name");
                            this.renderer.replaceInstrumentParam(instrumentID, ['samples', sampleID, 'name'], newSampleName);
                            // this.render();
                            break;

                        case 'sample:changeURL':
                            const changeSampleURL = form.elements.url.value || prompt(`Change Sample URL: (ID ${sampleID})`, sampleConfig.url);
                            if (changeSampleURL) {
                                // TODO: change sample name
                                this.renderer.replaceInstrumentParam(instrumentID, ['samples', sampleID, 'url'], changeSampleURL);
                                await this.loadSamples();
                            } else {
                                console.info("Change sample URL canceled");
                            }
                            break;

                        case 'sample:mixer':
                            this.renderer.replaceInstrumentParam(instrumentID, ['samples', sampleID, 'mixer'], parseInt(form.elements.mixer.value));
                            break;

                        case 'sample:detune':
                            this.renderer.replaceInstrumentParam(instrumentID, ['samples', sampleID, 'detune'], parseInt(form.elements.detune.value));
                            break;

                        case 'sample:keyRoot':
                            this.renderer.replaceInstrumentParam(instrumentID, ['samples', sampleID, 'keyRoot'], form.elements.keyRoot.value);
                            break;
                        case 'sample:keyAlias':
                            this.renderer.replaceInstrumentParam(instrumentID, ['samples', sampleID, 'keyAlias'], form.elements.keyAlias.value);
                            break;
                        case 'sample:loop':
                            this.renderer.replaceInstrumentParam(instrumentID, ['samples', sampleID, 'loop'], form.elements.loop.checked);
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
                    if(newPresetURL.hash) {
                        this.loadConfig(this.sampleLibrary.getPresetConfig(newPresetURL.hash.substr(1)))
                    }
                    
                    this.render();

                    break;


                case 'instrument:name':
                    this.renderer.replaceInstrumentParam(instrumentID, 'name', form.elements.name.value);
                    break;

                case 'instrument:remove':
                    // TODO: dispatch to shadow host
                    this.renderer.removeInstrument(form.elements['instrumentID'].value);
                    break;

                case 'instrument:change':
                    this.renderer.replaceInstrument(form.elements['instrumentID'].value, form.elements['instrumentURL'].value);
                    await this.renderer.loadInstrument(form.elements['instrumentID'].value, true);
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


        loadCSS() {
            if (document.head.querySelector('link[href$="audio-source-synthesizer.css"]'))
                return;
            const linkHRef = getScriptDirectory('instrument/audio-source-synthesizer.css');
            // console.log(linkHRef);
            let cssLink = document.createElement("link");
            cssLink.setAttribute("rel", "stylesheet");
            cssLink.setAttribute("type", "text/css");
            cssLink.setAttribute("href", linkHRef);
            document.head.appendChild(cssLink);
        }

    }


    function getScriptElm() {
        return document.head.querySelector('script[src$="audio-source-synthesizer.js"],script[src$="audio-source-synthesizer.min.js"]');
    }

    function getScriptDirectory(appendPath = '') {
        const scriptElm = getScriptElm();
        const basePath = scriptElm.src.split('/').slice(0, -2).join('/') + '/';
        return basePath + appendPath;
    }


    customElements.define('audio-source-synthesizer', SynthesizerInstrument);


    let dispatchInterval = setInterval(() => {
        const scriptElm = getScriptElm();
        if (!scriptElm)
            return;
        clearInterval(dispatchInterval);
        document.dispatchEvent(new CustomEvent('instrument:loaded', {
            detail: {
                "class": SynthesizerInstrument,
                "url": scriptElm.src,
                "script": scriptElm
            },
            bubbles: true
        }));
    }, 500);


    // TODO: memory leak on many sample load
    class SampleLoader {
        constructor() {
            this.samplesByURL = {};
        }

        unloadSamples(instrumentInstance) {

        }

        async loadAudioSampleData(sampleURL) {
            // let sampleURL = sampleConfig.url;
            if (!sampleURL)
                throw new Error("Invalid url");
            sampleURL = new URL(sampleURL, document.location) + '';

            let sampleCache;
            if (typeof this.samplesByURL[sampleURL] !== 'undefined') {
                sampleCache = this.samplesByURL[sampleURL];
                // if(sampleCache.instances.indexOf(instrumentInstance) === -1)
                //     sampleCache.instances.push(instrumentInstance);
                if (sampleCache.loadingPromise)
                    return await sampleCache.loadingPromise;
                return sampleCache.response;
            }

            let resolvePromise = function () {
            };
            sampleCache = {
                // instances: [instrumentInstance],
                loadingPromise: new Promise((resolve, reject) => {
                    resolvePromise = resolve;
                })
            };
            this.samplesByURL[sampleURL] = sampleCache;

            sampleCache.response = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.open('GET', sampleURL, true);
                const ext = sampleURL.split('.').pop().toLowerCase();
                switch (ext) {
                    default:
                    case 'wav':
                        xhr.responseType = 'arraybuffer';
                        break;
                    case 'json':
                        xhr.responseType = 'json';
                        break;
//                 default:
//                     reject("Unknown extension: " + ext);
                }
                xhr.onload = () => {
                    if (xhr.status !== 200)
                        return reject("Sample file not found: " + sampleURL);
                    resolve(xhr.response);
                };
                xhr.send();
            });

            console.info("Sample Loaded: ", sampleURL);
            resolvePromise(sampleCache.response);

            return sampleCache.response;
        }

        async initAudioSample(audioContext, sampleURL) {
            sampleURL = new URL(sampleURL, document.location) + '';

            let audioData = await this.loadAudioSampleData(sampleURL);
            const sampleCache = this.samplesByURL[sampleURL];
            if (sampleCache.buffer)
                return sampleCache.buffer;
            if (sampleCache.decodingPromise)
                return await sampleCache.decodingPromise;

            let resolvePromise = function () {
            };
            sampleCache.decodingPromise = new Promise((resolve, reject) => {
                resolvePromise = resolve;
            });

            console.info("Loading Initiated: ", sampleURL);
            const ext = sampleURL.split('.').pop().toLowerCase();
            switch (ext) {
                default:
                case 'wav':
                    // sampleCache.buffer = await audioContext.decodeAudioData(audioData);
                    sampleCache.buffer = await new Promise((resolve, reject) => {
                        audioContext.decodeAudioData(audioData, // Safari does not support await for decodeAudioData
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
                    if (!audioData.real || !audioData.imag)
                        return reject("Invalid JSON for periodic wave");

                    sampleCache.buffer = context.createPeriodicWave(
                        new Float32Array(audioData.real),
                        new Float32Array(audioData.imag)
                    );
                    break;
//                 default:
//                     reject("Unknown extension: " + ext);
            }

            console.info("Sample Initiated: ", sampleURL);
            resolvePromise(sampleCache.buffer);
            return sampleCache.buffer;
        }
    }

    if(!customElements.get('asci-sample-library')) {

        class SampleLibrary extends HTMLElement {
            constructor() {
                super();
                this.url = "N/A";
                this.sampleLibrary = {
                    "name": "Loading Sample Library...",
                    "samples": {},
                    "libraries": {}
                };
            }

            get name() { return this.sampleLibrary.name; }

            eachSample(callback) {
                const result = [];
                if (this.sampleLibrary.samples) {
                    Object.keys(this.sampleLibrary.samples).map(sampleName => {
                        let sampleConfig = this.sampleLibrary.samples[sampleName];
                        let sampleURL = new URL((this.sampleLibrary.urlPrefix || '') + (sampleConfig.url || sampleName), this.url);
                        result.push(callback(sampleConfig, sampleURL + '', sampleName));
                    });
                }
                return result;
            }

            eachPreset(callback) {
                const result = [];
                if (this.sampleLibrary.presets) {
                    Object.keys(this.sampleLibrary.presets).map(presetName => {
                        let presetConfig = this.sampleLibrary.presets[presetName];
                        const presetURL = this.url + '#' + presetName; // New Preset URL
                        result.push(callback(presetConfig, presetURL, presetName));
                    });
                }
                return result;
            }

            eachLibrary(callback) {
                const result = [];
                if (this.sampleLibrary.libraries) {
                    for (let i = 0; i < this.sampleLibrary.libraries.length; i++) {
                        let libraryConfig = this.sampleLibrary.libraries[i];
                        if (typeof libraryConfig !== 'object')
                            libraryConfig = {url: libraryConfig};
                        const libraryURL = new URL((this.sampleLibrary.urlPrefix || '') + libraryConfig.url, this.url) + ''; // New Library URL
                        let libraryName = libraryConfig.name || libraryConfig.url.split('/').pop();
                        result.push(callback(libraryConfig, libraryURL, libraryName));
                    }
                }
                return result;
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
                const result = [];
                Object.keys(SampleLibrary.cache).forEach(cacheURL => {
                    let libraryConfig = SampleLibrary.cache[cacheURL];
                    let libraryName = libraryConfig.name || libraryConfig.url.split('/').pop();
                    result.push(callback(libraryConfig, libraryConfig.url, libraryName));
                });
                return result;
            }

            async loadURL(url) {
                if (!url)
                    throw new Error("Invalid url");
                url = new URL((url+'').split('#')[0], document.location) + '';
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

        customElements.define('asci-sample-library', SampleLibrary);
    }

}


























