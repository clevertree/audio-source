{
    class LibGMESupport {
        constructor() {
        }

        async getBufferFromFileInput(file) {
            return await new Promise((resolve, reject) => {
                let reader = new FileReader();                                      // prepare the file Reader
                reader.readAsArrayBuffer(file);                 // read the binary data
                reader.onload = (e) => {
                    resolve(e.target.result);
                };
            });
        }

        async getDataURLFromFileInput(file) {
            return await new Promise((resolve, reject) => {
                let reader = new FileReader();                                      // prepare the file Reader
                reader.readAsDataURL(file);                 // read the binary data
                reader.onload = (e) => {
                    resolve(e.target.result);
                };
            });
        }

        async getBufferFromURL(url) {
            var request = new XMLHttpRequest();
            await new Promise((resolve, reject) => {
                request.open("GET", url, true);
                request.responseType = "arraybuffer";
                request.send();
                request.onload = resolve;
            });

            return request.response;
        }

        async loadSongDataFromFileInput(file) {
            const buffer = await this.getBufferFromFileInput(file);
            const spcURL = await this.getDataURLFromFileInput(file);
            const player = this.loadSPCPlayerFromBuffer(buffer);
            return this.loadSongDataFromPlayer(player, spcURL);             // TODO: no url??
        }

        loadSongDataFromPlayer(player, spcURL) {
            const id666 = player.state.id666;
            console.log(player.state);
            // id666.length = 5;
            const timeDivision = 96;
            const beatsPerMinute = 120;
            const lengthInTicks = (id666.length * (beatsPerMinute / 60)) * timeDivision;

            const songData = {
                name: id666.song,
                version: '0.0.1a',
                root: 'root',
                created: new Date().getTime(),
                timeDivision: timeDivision,
                beatsPerMinute: beatsPerMinute,
                beatsPerMeasure: 4,
                instruments: [
                    {
                        url: findThisScript().basePath + 'instrument/chip/spc-player-synthesizer.js',
                        spcURL: spcURL
                    }
                ],
                instructions: {
                    'root': [
                        ['C4', 0, lengthInTicks],
                    ]
                }
            };

            return songData;
        }

        async loadSongDataFromURL(url, options={}) {
            // const doOnTrackReadyToPlay = function(e) { console.info(e, 'ready')}

            // --------------------------- music player -----------------------
            var basePath= '';		// not needed here
            ScriptNodePlayer.createInstance(new SNESBackendAdapter(), basePath, [], true, doOnPlayerReady,
                doOnTrackReadyToPlay, doOnTrackEnd);

            var p = ScriptNodePlayer.getInstance();
            p.setTraceMode(true);
            if (p.isReady()) {
                const buffer = await this.getBufferFromURL(url);

                const options = {};
                if(!p.prepareTrackForPlayback(url, buffer, options)) {
                    if (!p.isWaitingForFile()) {
                        // onFail();
                    }
                } else {
                    // onCompletion(fullFilename);
                }

                // p.loadMusicFromURL(url, options,
                //     (function(filename){ resolve() }),
                //     (function(){ this.removeFromPlaylist(someSong);	/* no point trying to play this again */ }.bind(this)),
                //     (function(total, loaded){}));
                console.log(p._songInfo);
            }


            // const buffer = await this.getBufferFromURL(url);
//             const player = this.loadSPCPlayerFromBuffer(buffer);
//             return this.loadSongDataFromPlayer(player, url);
        }


        // loadSPCPlayerFromBuffer(buffer) {
        //     const stream = new DataView(buffer);
        //     stream.length = buffer.byteLength;
        //     stream.pos = 0;
        //
        //     var signature = readString(stream, 37);
        //
        //     if (signature != "SNES-SPC700 Sound File Data v0.30\x1A\x1A\x1A\x1E")
        //         invalid();
        //
        //     var state = {};
        //     var pcl = readByte(stream);
        //     var pch = readByte(stream);
        //     state.pc = (pch * 0x100) + pcl;
        //     state.a = readByte(stream);
        //     state.x = readByte(stream);
        //     state.y = readByte(stream);
        //     state.psw = readByte(stream);
        //     state.sp = readByte(stream);
        //
        //     stream.pos += 2; // unused
        //
        //     state.id666 = parseID666(stream);
        //     state.ram = mmap(stream, 0x10000);
        //     state.regs = mmap(stream, 128);
        //
        //     const player = new SPCPlayer(state);
        //     return player;
        // }

    }

    class SPCPlayer {
        constructor(state) {
            this.state = state;
            this.driver = null;
        }

        play(restart=false) {
            if(!this.driver || restart) {
                this.driver = new Driver(this.state);
            }
            this.driver.play();
        }

        pause() {
            this.driver.stop();
        }

        stop() {
            if(this.driver) {
                this.driver.stop();
                this.driver = null;
            }
        }
    }



    /** Register This Module **/
    const _module = typeof module !== "undefined" ? module : findThisScript();
    _module.exports = {
        LibGMESupport,
    };

    /** Module Loader Methods **/
    function findThisScript() {
        const SCRIPT_PATH = 'common/support/libgme-support.js';
        const thisScript = document.head.querySelector(`script[src$="${SCRIPT_PATH}"]`)
            || (() => { throw new Error("Base script not found: " + SCRIPT_PATH); })()
        thisScript.relativePath = SCRIPT_PATH;
        thisScript.basePath = thisScript.src.replace(document.location.origin, '').replace(SCRIPT_PATH, '');
        return thisScript;
    }




    /** 3rd party libraries **/

    /**
     * Generic ScriptProcessor based WebAudio player.
     *
     * This infrastructure consists of two parts:
     *
     * <p>SamplePlayer: The generic player which must be parameterized with a specific AudioBackendAdapterBase
     *                  subclass (which is not contained in this lib)
     *
     * <p>AudioBackendAdapterBase: an abstract base class for specific backend (i.e. 'sample data producer') integration.
     *
     *	version 1.1.2 (with WASM support, cached filename translation & track switch bugfix, "internal filename"
     *				mapping, getVolume, setPanning, AudioContext get/resume, AbstractTicker revisited, bugfix for
     *               duplicate events, improved "play after user gesture" support  + doubled sample buffer size),
     *               support for use of "alias" names for same file (see modland), added EmsHEAPF32BackendAdapter,
     *               added silence detection, extended copyTickerData signature, added JCH's "choppy ticker" fix,
     *				added setSilenceTimeout()
     *
     * 	Copyright (C) 2019 Juergen Wothke
     *
     * Terms of Use: This software is licensed under a CC BY-NC-SA
     * (http://creativecommons.org/licenses/by-nc-sa/4.0/).
     */

    var fetchSamples= function (e) {
        // it seems that it is necessary to keep this explicit reference to the event-handler
        // in order to pervent the dumbshit Chrome GC from detroying it eventually

        var f= window.player['genSamples'].bind(window.player); // need to re-bind the instance.. after all this
                                                                // joke language has no real concept of OO
        f(e);
    };

    var calcTick= function (e) {
        var f= window.player['tick'].bind(window.player);
        f(e);
    };

    var setGlobalWebAudioCtx= function() {
        if (typeof window._gPlayerAudioCtx == 'undefined') {	// cannot be instantiated 2x (so make it global)
            var errText= 'Web Audio API is not supported in this browser';
            try {
                if('AudioContext' in window) {
                    window._gPlayerAudioCtx = new AudioContext();
                } else if('webkitAudioContext' in window) {
                    window._gPlayerAudioCtx = new webkitAudioContext();		// legacy stuff
                } else {
                    alert(errText + e);
                }
            } catch(e) {
                alert(errText + e);
            }
        }
        try {
            if (window._gPlayerAudioCtx.state === 'suspended' && 'ontouchstart' in window) {	//iOS shit
                window._gPlayerAudioCtx.resume();
            }
        } catch(ignore) {}
    }

    /*
        Poor man's JavaScript inheritance: 'extend' must be used to subclass AudioBackendAdapterBase to create backend specific adapters.

        usage:

        SomeBackendAdapter = (function(){ var $this = function () { $this.base.call(this, channels, bytesPerSample);};
            extend(AudioBackendAdapterBase, $this, {
                getAudioBuffer: function() {
                    ...
                },
                getAudioBufferLength: function() {
                    ...
                },
                ...
            });	return $this; })();
    */
    function surrogateCtor() {}
    function extend(base, sub, methods) {
        surrogateCtor.prototype = base.prototype;
        sub.prototype = new surrogateCtor();
        sub.prototype.constructor = sub;
        sub.base = base;
        for (var name in methods) {
            sub.prototype[name] = methods[name];
        }
        return sub;
    }

    /*
    * Subclass this class in order to sync/associate stuff with the audio playback.
    *
    * The basic problem: WebAudio will request additional audio data whenever *it feels like* requesting it. The provider of that data has
    * no way of knowing when exactly the delivered data will actually be used. WebAudio usually requests it *before* its current supply runs
    * out. Supposing WebAudio requests chunks of 8192 samples at a time (which is the default used here). Depending on the user's screen refresh
    * rate (e.g. 50Hz) and the browser's playback rate (e.g. 44100Hz) a different number of samples will correspond to one typical animation frame,
    * i.e. screen redraw (e.g. 882 samples). The sample "supply" delivered in one batch may then last for roughly 1/5 of a second (obviously much less
    * when higher playback speeds are used).
    * The size of the sample data batches delivered by the underlying emulator may then not directly match the chunks requested by WebAudio, i.e.
    * there may be more or also less data than what is needed for one WebAudio request. And as a further complication the sample rate used by the
    * backend may differ from the one used by WebAudio, i.e. the raw data relivered by the emulator backend may be subject to a resampling.
    * With regards to the actual audio playback this isn't a problem. But the problems start if there is additional data accociated with the
    * audio data (maybe some raw data that was used to create the respective audio data) and the GUI needs to handle that add-on data *IN SYNC*
    * with the actual playback, e.g. visualize the audio that is played back.
    *
    * It is the purpose of this AbstractTicker API to deal with that problem and provide the GUI with some API that allows to access
    * add-on data in-sync with the playback.
    *
    * If a respective subclass is specified upon instanciation of the ScriptNodePlayer, then the player will track
    * playback progress as 'ticks' (one 'tick' typically measuring 256 audio samples). "Ticks" are measured within the
    * context of the current playback buffer and whenever a new buffer is played the counting restarts from 0.
    *
    * During playback (e.g. from some "animation frame" handler) the current playback position can be queried using
    * ScriptNodePlayer.getInstance().getCurrentTick().
    *
    * The idea is for the AbstractTicker to provide additional "tick resolution" data that can be queried using the
    * "current tick". During playback the original audio buffers are fed to the AbstractTicker before they are played
    * (see 'calcTickData'). This allows the AbstractTicker to build/update its "tick resolution" data.
    */
    AbstractTicker = function() {}
    AbstractTicker.prototype = {
        /*
        * Constructor that allows the AbstractTicker to setup its own data structures (the
        * number of 'tick' events associated with each sample buffer is: samplesPerBuffer/tickerStepWidth).
        * @samplesPerBuffer number of audio samples in the original playback buffers - that the AbstractTicker can use to
        *                   derive its additional data streams from
        * @tickerStepWidth  number of audio samples that are played between "tick events"
        */
        init: function(samplesPerBuffer, tickerStepWidth) {},
        /*
        * Gets called at the start of each audio buffer generation.
        */
        start: function() {},
        /*
        * Gets called each time the computeAudioSamples() has been invoked.
        * @deprecated Legacy API used in early VU meter experiments
        */
        computeAudioSamplesNotify: function() {},
        /*
        * Hook allows to resample the add-on data in-sync with the underlying audio data.
        */
        resampleData: function(sampleRate, inputSampleRate, origLen, backendAdapter) {},
        /*
        * Copies data from the resampled input buffers to the "WebAudio audio buffer" sized output.
        */
        copyTickerData: function(outBufferIdx, inBufferIdx, backendAdapter) {},
        /*
        * Invoked after audio buffer content has been generated.
        * @deprecated Legacy API used in early VU meter experiments
        */
        calcTickData: function(output1, output2) {}
    };


    var SAMPLES_PER_BUFFER = 16384; // allowed: buffer sizes: 256, 512, 1024, 2048, 4096, 8192, 16384


    /*
    * Abstract 'audio backend adapter'.
    *
    * Not for "end users"! Base infrastructure for the integration of new backends:
    *
    * Must be subclassed for the integration of a specific backend: It adapts the APIs provided by a
    * specific backend to the ones required by the player (e.g. access to raw sample data.) It
    * provides hooks that can be used to pass loaded files to the backend. The adapter also has
    * built-in resampling logic so that exactly the sampleRate required by the player is provided).
    *
    * Most backends are pretty straight forward: A music file is input and the backend plays it. Things are
    * more complicated if the backend code relies on additional files - maybe depending on the input -
    * that must be loaded in order to play the music. The problem arises because in the traditional runtime
    * environment files are handled synchronously: the code waits until the file is loaded and then uses it.
    *
    * "Unfortunately" there is no blocking file-load available to JavaScript on a web page. So unless some
    * virtual filesystem is built-up beforehand (containing every file that the backend could possibly ever
    * try to load) the backend code is stuck with an asynchronous file loading scheme, and the original
    * backend code must be changed to a model that deals with browser's "file is not yet ready" response.
    *
    * The player offers a trial & error approach to deal with asynchronous file-loading. The backend code
    * is expected (i.e. it must be adapted accordingly) to attempt a file-load call (which is handled by
    * an async web request linked to some sort of result cache). If the requested data isn't cached yet,
    * then the backend code is expected to fail but return a corresponding error status back to the
    * player (i.e. the player then knows that the code failed because some file wasn't available yet - and
    * as soon as the file-load is completed it retries the whole initialization sequence).
    *  (see "fileRequestCallback()" for more info)
    */
    AudioBackendAdapterBase = function (channels, bytesPerSample) {
        this._resampleBuffer=  new Float32Array();
        this._channels= channels;
        this._bytesPerSample= bytesPerSample;
        this._sampleRate= 44100;
        this._inputSampleRate= 44100;
        this._observer;
        this._manualSetupComplete= true;	// override if necessary
    };

    AudioBackendAdapterBase.prototype = {

// ************* core functions that must be defined by a subclass

        /**
         * Fills the audio buffer with the next batch of samples
         * Return 0: OK, -1: temp issue - waiting for file, 1: end, 2: error
         */
        computeAudioSamples: function() 			{this.error("computeAudioSamples");},

        /**
         * Load the song's binary data into the backend as a first step towards playback.
         * The subclass can either use the 'data' directly or us the 'filename' to retrieve it indirectly
         * (e.g. when regular file I/O APIs are used).
         */
        loadMusicData: function(sampleRate, path, filename, data, options) {this.error("loadMusicData");},

        /**
         * Second step towards playback: Select specific sub-song from the loaded song file.
         * Allows to select a specific sub-song and/or apply additional song setting..
         */
        evalTrackOptions: function(options)  {this.error("evalTrackOptions");},

        /**
         * Get info about currently selected music file and track. Respective info very much depends on
         * the specific backend - use getSongInfoMeta() to check for available attributes.
         */
        updateSongInfo: function(filename, result) {this.error("updateSongInfo");},

        /**
         * Advertises the song attributes that can be provided by this backend.
         */
        getSongInfoMeta: function() {this.error("getSongInfoMeta");},


// ************* sample buffer and format related

        /**
         * Return: pointer to memory buffer that contains the sample data
         */
        getAudioBuffer: function() 					{this.error("getAudioBuffer");},

        /**
         * Return: length of the audio buffer in 'ticks' (e.g. mono buffer with 1 8-bit
         *         sample= 1; stereo buffer with 1 32-bit * sample for each channel also= 1)
         */
        getAudioBufferLength: function() 			{this.error("getAudioBufferLength");},

        /**
         * Reads one audio sample from the specified position.
         * Return sample value in range: -1..1
         */
        readFloatSample: function(buffer, idx) 		{this.error("readFloatSample");},

        /**
         * @param pan 0..2 (1 creates mono)
         */
        applyPanning: function(buffer, len, pan) 	{this.error("applyPanning");},

        /**
         * Return size one sample in bytes
         */
        getBytesPerSample: function() {
            return this._bytesPerSample;
        },

        /**
         * Number of channels, i.e. 1= mono, 2= stereo
         */
        getChannels: function() {
            return this._channels;
        },

// ************* optional: setup related
        /*
        * Implement if subclass needs additional setup logic.
        */
        isAdapterReady: function() {
            return true;
        },

        /*
        * Creates the URL used to retrieve the song file.
        */
        mapInternalFilename: function(overridePath, defaultPath, uri) {
            return ((overridePath)?overridePath:defaultPath) + uri;	// this._basePath ever needed?
        },
        /*
        * Allows to map the filenames used in the emulation to external URLs.
        */
        mapUrl: function(filename) {
            return filename;
        },

        /*
        * Allows to perform some file input based manual setup sequence (e.g. setting some BIOS).
        * return 0: step successful & init completed, -1: error, 1: step successful
        */
        uploadFile: function(filename, options) {
            return 0;
        },

        /*
        * Check if this AudioBackendAdapterBase still needs manually performed
        * setup steps (see uploadFile())
        */
        isManualSetupComplete: function() {
            return this._manualSetupComplete;
        },

        /**
         * Cleanup backend before playing next music file
         */
        teardown: function()		 	{this.error("teardown");},

// ************* optional: song "position seek" functionality (only available in backend)

        /**
         * Return: default 0 = seeking not supported
         */
        getMaxPlaybackPosition: function() 				{ return 0;},

        /**
         * Return: default 0
         */
        getPlaybackPosition: function() 				{ return 0;},

        /**
         * Move playback to 'pos': must be between 0 and getMaxPlaybackPosition()
         * Return: 0 if successful
         */
        seekPlaybackPosition: function(pos) 				{ return -1;},

// ************* optional: async file-loading related (only if needed)

        /**
         * Transform input filename into path/filename expected by the backend
         * Return array with 2 elements: 0: basePath (backend specific - most don't need one),
         *        1: filename (incl. the remainder of the path)
         */
        getPathAndFilename: function(filename) {this.error("getPathAndFilename");},

        /**
         * Let backend store a loaded file in such a way that it can later deal with it.
         * Return a filehandle meaningful to the used backend
         */
        registerFileData: function(pathFilenameArray, data)	{this.error("registerFileData");},

        // if filename/path used by backend does not match the one used by the browser
        mapBackendFilename: function(name) { return name;},

        // introduced for backward-compatibility..
        mapCacheFileName: function(name) { return name;},
        /*
        * Backend may "push" update of song attributes (like author, copyright, etc)
        */
        handleBackendSongAttributes: function(backendAttr, target) {this.error("handleBackendSongAttributes");},


// ************* built-in utility functions
        mapUri2Fs: function(uri) {		// use extended ASCII that most likely isn't used in filenames
            // replace chars that cannot be used in file/foldernames
            var out= uri.replace(/\/\//, "ýý");
            out = out.replace(/\?/, "ÿ");
            out = out.replace(/:/, "þ");
            out = out.replace(/\*/, "ü");
            out = out.replace(/"/, "û");
            out = out.replace(/</, "ù");
            out = out.replace(/>/, "ø");
            out = out.replace(/\|/, "÷");
            return out;
        },
        mapFs2Uri: function(fs) {
            var out= fs.replace(/ýý/, "//");
            out = out.replace(/ÿ/, "?");
            out = out.replace(/þ/, ":");
            out = out.replace(/ü/, "*");
            out = out.replace(/û/, "\"");
            out = out.replace(/ù/, "<");
            out = out.replace(/ø/, ">");
            out = out.replace(/÷/, "|");
            return out;
        },

        // used for interaction with player
        setObserver: function(o) {
            this._observer= o;
        },
        notifyAdapterReady: function() {
            if (typeof this._observer !== "undefined" )	this._observer.notify();
        },
        error: function(name) {
            alert("fatal error: abstract method '"+name+"' must be defined");
        },
        resetSampleRate: function(sampleRate, inputSampleRate) {
            if (sampleRate > 0) { this._sampleRate= sampleRate; }
            if (inputSampleRate > 0) { this._inputSampleRate= inputSampleRate; }

            var s= Math.round(SAMPLES_PER_BUFFER *this._sampleRate/this._inputSampleRate) *this.getChannels();

            if (s > this._resampleBuffer.length) {
                this._resampleBuffer= this.allocResampleBuffer(s);
            }
        },
        allocResampleBuffer: function(s) {
            return new Float32Array(s);
        },
        getCopiedAudio: function(input, len, funcReadFloat, resampleOutput) {
            var i;
            // just copy the rescaled values so there is no need for special handling in playback loop
            for(i= 0; i<len*this._channels; i++){
                resampleOutput[i]= funcReadFloat(input, i);
            }
            return len;
        },
        resampleTickerData: function(externalTicker, origLen) {
            externalTicker.resampleData(this._sampleRate, this._inputSampleRate, origLen, this);
        },
        getResampledAudio: function(input, len) {
            return this.getResampledFloats(input, len, this._sampleRate, this._inputSampleRate);
        },
        getResampledFloats: function(input, len, sampleRate, inputSampleRate) {
            var resampleLen;
            if (sampleRate == inputSampleRate) {
                resampleLen= this.getCopiedAudio(input, len, this.readFloatSample.bind(this), this._resampleBuffer);
            } else {
                resampleLen= Math.round(len * sampleRate / inputSampleRate);
                var bufSize= resampleLen * this._channels;	// for each of the x channels

                if (bufSize > this._resampleBuffer.length) { this._resampleBuffer= this.allocResampleBuffer(bufSize); }

                // only mono and interleaved stereo data is currently implemented..
                this.resampleToFloat(this._channels, 0, input, len, this.readFloatSample.bind(this), this._resampleBuffer, resampleLen);
                if (this._channels == 2) {
                    this.resampleToFloat(this._channels, 1, input, len, this.readFloatSample.bind(this), this._resampleBuffer, resampleLen);
                }
            }
            return resampleLen;
        },

        // utility
        resampleToFloat: function(channels, channelId, inputPtr, len, funcReadFloat, resampleOutput, resampleLen) {
            // Bresenham (line drawing) algorithm based resampling
            var x0= 0;
            var y0= 0;
            var x1= resampleLen - 0;
            var y1= len - 0;

            var dx =  Math.abs(x1-x0), sx = x0<x1 ? 1 : -1;
            var dy = -Math.abs(y1-y0), sy = y0<y1 ? 1 : -1;
            var err = dx+dy, e2;

            var i;
            for(;;){
                i= (x0*channels) + channelId;
                resampleOutput[i]= funcReadFloat(inputPtr, (y0*channels) + channelId);

                if (x0>=x1 && y0>=y1) { break; }
                e2 = 2*err;
                if (e2 > dy) { err += dy; x0 += sx; }
                if (e2 < dx) { err += dx; y0 += sy; }
            }
        },
        getResampleBuffer: function() {
            return this._resampleBuffer;
        }
    };

    /*
    * Emscripten based backends that produce 16-bit sample data.
    *
    * NOTE: This impl adds handling for asynchronously initialized 'backends', i.e.
    *       the 'backend' that is passed in, may not yet be usable (see WebAssebly based impls:
    *       here a respective "onRuntimeInitialized" event will eventually originate from the 'backend').
    *       The 'backend' allows to register a "adapterCallback" hook to propagate the event - which is
    *       used here. The player typically observes the backend-adapter and when the adapter state changes, a
    *       "notifyAdapterReady" is triggered so that the player is notified of the change.
    */
    EmsHEAP16BackendAdapter = (function(){ var $this = function (backend, channels) {
        $this.base.call(this, channels, 2);
        this.Module= backend;

        // required if WASM (asynchronously loaded) is used in the backend impl
        this.Module["adapterCallback"] = function() { 	// when Module is ready
            this.doOnAdapterReady();	// hook allows to perform additional initialization
            this.notifyAdapterReady();	// propagate to change to player
        }.bind(this);

        if (!window.Math.fround) { window.Math.fround = window.Math.round; } // < Chrome 38 hack
    };
        extend(AudioBackendAdapterBase, $this, {
            doOnAdapterReady: function() { },		// noop, to be overridden in subclasses

            /* async emscripten init means that adapter may not immediately be ready - see async WASM compilation */
            isAdapterReady: function() {
                if (typeof this.Module.notReady === "undefined")	return true; // default for backward compatibility
                return !this.Module.notReady;
            },
            registerEmscriptenFileData: function(pathFilenameArray, data) {
                // create a virtual emscripten FS for all the songs that are touched.. so the compiled code will
                // always find what it is looking for.. some players will look to additional resource files in the same folder..

                // Unfortunately the FS.findObject() API is not exported.. so it's exception catching time
                try {
                    this.Module.FS_createPath("/", pathFilenameArray[0], true, true);
                } catch(e) {
                }
                var f;
                try {
                    if (typeof this.Module.FS_createDataFile == 'undefined') {
                        f= true;	// backend without FS (ignore for drag&drop files)
                    } else {
                        f= this.Module.FS_createDataFile(pathFilenameArray[0], pathFilenameArray[1], data, true, true);

                        var p= ScriptNodePlayer.getInstance().trace("registerEmscriptenFileData: [" +
                            pathFilenameArray[0]+ "][" +pathFilenameArray[1]+ "] size: "+ data.length);
                    }
                } catch(err) {
                    // file may already exist, e.g. drag/dropped again.. just keep entry

                }
                return f;
            },
            readFloatSample: function(buffer, idx) {
                return (this.Module.HEAP16[buffer+idx])/0x8000;
            },
            // certain songs use an unfavorable L/R separation - e.g. bass on one channel - that is
            // not nice to listen to. This "panning" impl allows to "mono"-ify those songs.. (this._pan=1
            // creates mono)
            applyPanning: function(buffer, len, pan) {
                pan=  pan * 256.0 / 2.0;

                var i, l, r, m;
                for (i = 0; i < len*2; i+=2) {
                    l = this.Module.HEAP16[buffer+i];
                    r = this.Module.HEAP16[buffer+i+1];
                    m = (r - l) * pan;

                    var nl= ((l << 8) + m) >> 8;
                    var nr= ((r << 8) - m) >> 8;
                    this.Module.HEAP16[buffer+i] = nl;
                    this.Module.HEAP16[buffer+i+1] = nr;
                    /*
                    if ((this.Module.HEAP16[buffer+i] != nl) || (this.Module.HEAP16[buffer+i+1] == nr)) {
                        console.log("X");
                    }*/
                }
            }
        });	return $this; })();

    /*
    * Emscripten based backends that produce 32-bit float sample data.
    *
    * NOTE: This impl adds handling for asynchronously initialized 'backends', i.e.
    *       the 'backend' that is passed in, may not yet be usable (see WebAssebly based impls:
    *       here a respective "onRuntimeInitialized" event will eventually originate from the 'backend').
    *       The 'backend' allows to register a "adapterCallback" hook to propagate the event - which is
    *       used here. The player typically observes the backend-adapter and when the adapter state changes, a
    *       "notifyAdapterReady" is triggered so that the player is notified of the change.
    */
    EmsHEAPF32BackendAdapter = (function(){ var $this = function (backend, channels) {
        $this.base.call(this, backend, channels);

        this._bytesPerSample= 4;
    };
        extend(EmsHEAP16BackendAdapter, $this, {
            readFloatSample: function(buffer, idx) {
                return (this.Module.HEAPF32[buffer+idx]);
            },
            // certain songs use an unfavorable L/R separation - e.g. bass on one channel - that is
            // not nice to listen to. This "panning" impl allows to "mono"-ify those songs.. (this._pan=1
            // creates mono)
            applyPanning: function(buffer, len, pan) {
                pan=  pan * 256.0 / 2.0;
                var i, l, r, m;
                for (i = 0; i < len*2; i+=2) {
                    l = this.Module.HEAPF32[buffer+i];
                    r = this.Module.HEAPF32[buffer+i+1];
                    m = (r - l) * pan;

                    var nl= ((l *256) + m) /256;
                    var nr= ((r *256) - m) /256;
                    this.Module.HEAPF32[buffer+i] = nl;
                    this.Module.HEAPF32[buffer+i+1] = nr;
                }
            }
        });	return $this; })();

// cache all loaded files in global cache.
    FileCache = function() {
        this._binaryFileMap= {};	// cache for loaded "file" binaries
        this._pendingFileMap= {};

        this._isWaitingForFile= false;	// signals that some file loading is still in progress
    };

    FileCache.prototype = {
        getFileMap: function () {
            return this._binaryFileMap;
        },
        getPendingMap: function () {
            return this._pendingFileMap;
        },
        setWaitingForFile: function (val) {
            this._isWaitingForFile= val;
        },
        isWaitingForFile: function () {
            return this._isWaitingForFile;
        },
        getFile: function (filename) {
            var data;
            if (filename in this._binaryFileMap) {
                data= this._binaryFileMap[filename];
            }
            return data;
        },

        // FIXME the unlimited caching of files should probably be restricted:
        // currently all loaded song data stays in memory as long as the page is opened
        // maybe just add some manual "reset"?
        setFile: function(filename, data) {
            this._binaryFileMap[filename]= data;
            this._isWaitingForFile= false;
        }
    };


    /**
     * Generic ScriptProcessor based WebAudio music player (end user API).
     *
     * <p>Deals with the WebAudio node pipeline, feeds the sample data chunks delivered by
     * the backend into the WebAudio input buffers, provides basic file input facilities.
     *
     * This player is used as a singleton (i.e. instanciation of a player destroys the previous one).
     *
     * GUI can use the player via:
     *	    ScriptNodePlayer.createInstance(...); and
     *       ScriptNodePlayer.getInstance();
     */
    var ScriptNodePlayer = (function () {
        /*
        * @param externalTicker must be a subclass of AbstractTicker
        */
        PlayerImpl = function(backendAdapter, basePath, requiredFiles, spectrumEnabled, onPlayerReady, onTrackReadyToPlay, onTrackEnd, onUpdate, externalTicker, bufferSize) {
            if(typeof backendAdapter === 'undefined')		{ alert("fatal error: backendAdapter not specified"); }
            if(typeof onPlayerReady === 'undefined')		{ alert("fatal error: onPlayerReady not specified"); }
            if(typeof onTrackReadyToPlay === 'undefined')	{ alert("fatal error: onTrackReadyToPlay not specified"); }
            if(typeof onTrackEnd === 'undefined')			{ alert("fatal error: onTrackEnd not specified"); }
            if(typeof bufferSize !== 'undefined')			{ window.SAMPLES_PER_BUFFER= bufferSize; }

            if (backendAdapter.getChannels() >2) 			{ alert("fatal error: only 1 or 2 output channels supported"); }
            this._backendAdapter= backendAdapter;
            this._backendAdapter.setObserver(this);

            this._basePath= basePath;
            this._traceSwitch= false;

            this._spectrumEnabled= spectrumEnabled;

            // container for song infos like: name, author, etc
            this._songInfo = {};

            // hooks that allow to react to specific events
            this._onTrackReadyToPlay= onTrackReadyToPlay;
            this._onTrackEnd= onTrackEnd;
            this._onPlayerReady= onPlayerReady;
            this._onUpdate= onUpdate;	// optional


            // "external ticker" allows to sync separately maintained data with the actual audio playback
            this._tickerStepWidth= 256;		// shortest available (i.e. tick every 256 samples)
            if(typeof externalTicker !== 'undefined') {
                externalTicker.init(SAMPLES_PER_BUFFER, this._tickerStepWidth);
            }
            this._externalTicker = externalTicker;
            this._currentTick= 0;

            this._silenceStarttime= -1;
            this._silenceTimeout= 5; // by default 5 secs of silence will end a song

            // audio buffer handling
            this._sourceBuffer;
            this._sourceBufferLen;
            this._numberOfSamplesRendered= 0;
            this._numberOfSamplesToRender= 0;
            this._sourceBufferIdx=0;

            // // additional timeout based "song end" handling
            this._currentPlaytime= 0;
            this._currentTimeout= -1;

            if (!this.isAutoPlayCripple()) {
                // original impl
                setGlobalWebAudioCtx();

                this._sampleRate = window._gPlayerAudioCtx.sampleRate;
                this._correctSampleRate= this._sampleRate;
                this._backendAdapter.resetSampleRate(this._sampleRate, -1);
            }
            // general WebAudio stuff
            this._bufferSource;
            this._gainNode;
            this._analyzerNode;
            this._scriptNode;
            this._freqByteData = 0;

            this._pan= null;	// default: inactive

            // the below entry points are published globally they can be
            // easily referenced from the outside..

            window.fileRequestCallback= this.fileRequestCallback.bind(this);
            window.fileSizeRequestCallback= this.fileSizeRequestCallback.bind(this);
            window.songUpdateCallback= this.songUpdateCallback.bind(this);

            // --------------- player status stuff ----------

            this._isPaused= false;					// 'end' of a song also triggers this state

            // setup asyc completion of initialization
            this._isPlayerReady= false;		// this state means that the player is initialized and can be used now
            this._isSongReady= false;		// initialized (including file-loads that might have been necessary)
            this._initInProgress= false;

            this._preLoadReady= false;

            window.player= this;

            var f= window.player['preloadFiles'].bind(window.player);
            f(requiredFiles, function() {
                this._preLoadReady= true;
                if (this._preLoadReady && this._backendAdapter.isAdapterReady() && this._backendAdapter.isManualSetupComplete()) {
                    this._isPlayerReady= true;
                    this._onPlayerReady();
                }
            }.bind(this));
        };


        PlayerImpl.prototype = {

// ******* general
            notify: function() {	// used to handle asynchronously initialized backend impls
                if ((typeof this.deferredPreload !== "undefined") && this._backendAdapter.isAdapterReady()) {
                    // now that the runtime is ready the "preload" can be started
                    var files= this.deferredPreload[0];
                    var onCompletionHandler= this.deferredPreload[1];
                    delete this.deferredPreload;

                    this.preload(files, files.length, onCompletionHandler);
                }

                if (!this._isPlayerReady && this._preLoadReady && this._backendAdapter.isAdapterReady() && this._backendAdapter.isManualSetupComplete()) {
                    this._isPlayerReady= true;
                    this._onPlayerReady();
                }
            },
            handleBackendEvent: function() { this.notify(); }, // deprecated, use notify()!

            /**
             * Is the player ready for use? (i.e. initialization completed)
             */
            isReady: function() {
                return this._isPlayerReady;
            },

            /**
             * Change the default 5sec timeout  (0 means no timeout).
             */
            setSilenceTimeout: function(silenceTimeout) {
                // usecase: user may temporarrily turn off output (see DeepSID) and player should not end song
                this._silenceTimeout= silenceTimeout;
            },

            /**
             * Turn on debug output to JavaScript console.
             */
            setTraceMode: function (on) {
                this._traceSwitch= on;
            },

// ******* basic playback features

            /*
            * start audio playback
            */
            play: function() {
                this._isPaused= false;

                // this function isn't invoked directly from some "user gesture" (but
                // indirectly from "onload" handler) so it might not work on braindead iOS shit
                try { this._bufferSource.start(0); } catch(ignore) {}
            },
            /*
            * pause audio playback
            */
            pause: function() {
                if ((!this.isWaitingForFile()) && (!this._initInProgress) && this._isSongReady) {
                    this._isPaused= true;
                }
            },
            isPaused: function() {
                return this._isPaused;
            },

            /*
            * resume audio playback
            */
            resume: function() {
                if ((!this.isWaitingForFile()) && (!this._initInProgress) && this._isSongReady) {
                    this.play();
                }
            },

            /*
            * gets the index of the 'tick' that is currently playing.
            * allows to sync separately stored data with the audio playback.
            */
            getCurrentTick: function() {
                var idx= Math.ceil(SAMPLES_PER_BUFFER/this._tickerStepWidth)-1;
                idx= Math.min(idx, this._currentTick)
                return idx;
            },

            /*
            * set the playback volume (input between 0 and 1)
            */
            setVolume: function(value) {
                if (typeof this._gainNode != 'undefined') {
                    this._gainNode.gain.value= value;
                }
            },

            getVolume: function() {
                if (typeof this._gainNode != 'undefined') {
                    return this._gainNode.gain.value;
                }
                return -1;
            },
            /**
             * @value null=inactive; or range; -1 to 1 (-1 is original stereo, 0 creates "mono", 1 is inverted stereo)
             */
            setPanning: function(value) {
                this._pan= value;
            },

            /*
            * is playback in stereo?
            */
            isStereo: function() {
                return this._backendAdapter.getChannels() == 2;
            },

            /**
             * Get backend specific song infos like 'author', 'name', etc.
             */
            getSongInfo: function () {
                return this._songInfo;
            },

            /**
             * Get meta info about backend specific song infos, e.g. what attributes are available and what type are they.
             */
            getSongInfoMeta: function() {
                return this._backendAdapter.getSongInfoMeta();
            },

            /*
            * Manually defined playback time to use until 'end' of a track (only affects the
            * currently selected track).
            * @param t time in millis
            */
            setPlaybackTimeout: function(t) {
                this._currentPlaytime= 0;
                if (t<0) {
                    this._currentTimeout= -1;
                } else {
                    this._currentTimeout= t/1000*this._correctSampleRate;
                }
            },
            /*
            * Timeout in seconds.
            */
            getPlaybackTimeout: function() {
                if (this._currentTimeout < 0) {
                    return -1;
                } else {
                    return Math.round(this._currentTimeout/this._correctSampleRate);
                }
            },

            getCurrentPlaytime: function() {
//			return Math.round(this._currentPlaytime/this._correctSampleRate);
                return this._currentPlaytime/this._correctSampleRate;	// let user do the rounding in needed
            },

// ******* access to frequency spectrum data (if enabled upon construction)

            getFreqByteData: function () {
                if (this._analyzerNode) {
                    if (this._freqByteData === 0) {
                        this._freqByteData = new Uint8Array(this._analyzerNode.frequencyBinCount);
                    }
                    this._analyzerNode.getByteFrequencyData(this._freqByteData);
                }
                return this._freqByteData;
            },

// ******* song "position seek" related (if available with used backend)

            /**
             * Return: default 0 seeking not supported
             */
            getMaxPlaybackPosition: function() 				{ return this._backendAdapter.getMaxPlaybackPosition();},

            /**
             * Return: default 0
             */
            getPlaybackPosition: function() 				{ return this._backendAdapter.getPlaybackPosition();},

            /**
             * Move playback to 'pos': must be between 0 and getMaxSeekPosition()
             * Return: 0 if successful
             */
            seekPlaybackPosition: function(pos) 				{ return this._backendAdapter.seekPlaybackPosition(pos);},

// ******* (music) file input related

            /**
             * Loads from a JavaScript File object - e.g. used for 'drag & drop'.
             */
            loadMusicFromTmpFile: function (file, options, onCompletion, onFail, onProgress) {
                this.initByUserGesture();	// cannot be done from the callbacks below.. see iOS shit

                var filename= file.name;	// format detection may depend on prefixes and postfixes..

                this._fileReadyNotify= "";

                var fullFilename= ((options.basePath)?options.basePath:this._basePath) + filename;	// this._basePath ever needed?
                if (this.loadMusicDataFromCache(fullFilename, options, onFail)) { return; }

                var reader = new FileReader();
                reader.onload = function() {

                    var pfn= this._backendAdapter.getPathAndFilename(filename);
                    var data= new Uint8Array(reader.result);
                    var fileHandle= this._backendAdapter.registerFileData(pfn, data);
                    if (typeof fileHandle === 'undefined' ) {
                        onFail();
                        return;
                    } else {
                        var cacheFilename= this._backendAdapter.mapCacheFileName(fullFilename);
                        this.getCache().setFile(cacheFilename, data);
                    }
                    this.prepareTrackForPlayback(fullFilename, reader.result, options);
                    onCompletion(filename);
                }.bind(this);
                reader.onprogress = function (oEvent) {
                    if (onProgress) {
                        onProgress(oEvent.total, oEvent.loaded);
                    }
                }.bind(this);

                reader.readAsArrayBuffer(file);
            },
            isAppleShit: function() {
                return !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
            },
            isAutoPlayCripple: function() {
                return window.chrome || this.isAppleShit();
            },
            initByUserGesture: function() {
                // try to setup as much as possible while it is "directly triggered"
                // by "user gesture" (i.e. here).. seems POS iOS does not correctly
                // recognize any async-indirections started from here.. bloody Apple idiots
                if (typeof this._sampleRate == 'undefined') {
                    setGlobalWebAudioCtx();

                    this._sampleRate = window._gPlayerAudioCtx.sampleRate;
                    this._correctSampleRate= this._sampleRate;
                    this._backendAdapter.resetSampleRate(this._sampleRate, -1);
                } else {
                    // just in case: handle Chrome's new bullshit "autoplay policy"
                    if (window._gPlayerAudioCtx.state == "suspended") {
                        try {window._gPlayerAudioCtx.resume();} catch(e) {}
                    }
                }

                if (typeof this._bufferSource != 'undefined') {
                    try {
                        this._bufferSource.stop(0);
                    } catch(err) {}	// ignore for the benefit of Safari(OS X)
                } else {
                    var ctx= window._gPlayerAudioCtx;

                    if (this.isAppleShit()) this.iOSHack(ctx);

                    this._analyzerNode = ctx.createAnalyser();
                    this._scriptNode= this.createScriptProcessor(ctx);
                    this._gainNode = ctx.createGain();

                    this._scriptNode.connect(this._gainNode);

                    // optional add-on
                    if (typeof this._externalTicker !== 'undefined') {
                        var tickerScriptNode= this.createTickerScriptProcessor(ctx);
                        tickerScriptNode.connect(this._gainNode);
                    }

                    // note: "panning" experiments using StereoPanner, ChannelSplitter / ChannelMerger
                    // led to bloody useless results: rather implement respective "panning"
                    // logic directly to get the exact effect that is needed here..

                    if (this._spectrumEnabled) {
                        this._gainNode.connect(this._analyzerNode);
                        this._analyzerNode.connect(ctx.destination);
                    } else {
                        this._gainNode.connect(ctx.destination);

                    }
                    this._bufferSource = ctx.createBufferSource();
                    if (!this._bufferSource.start) {
                        this._bufferSource.start = this._bufferSource.noteOn;
                        this._bufferSource.stop = this._bufferSource.noteOff;
                    }
                }
            },
            /**
             * Loads from an URL.
             */
            loadMusicFromURL: function(url, options, onCompletion, onFail, onProgress) {
                this.initByUserGesture();	// cannot be done from the callbacks below.. see iOS shit

                var fullFilename= this._backendAdapter.mapInternalFilename(options.basePath, this._basePath, url);

                this._fileReadyNotify= "";

                if (this.loadMusicDataFromCache(fullFilename, options, onFail)) { return; }

                var xhr = new XMLHttpRequest();
                xhr.open("GET", this._backendAdapter.mapUrl(fullFilename), true);
                xhr.responseType = "arraybuffer";

                xhr.onload = function (oEvent) {
                    this.trace("loadMusicFromURL successfully loaded: "+ fullFilename);

                    if(!this.prepareTrackForPlayback(fullFilename, xhr.response, options)) {
                        if (!this.isWaitingForFile()) {
                            onFail();
                        }
                    } else {
                        onCompletion(fullFilename);
                    }
                    /*else {		// playback should be started from _onTrackReadyToPlay()
                        this.play();
                    }*/
                }.bind(this);
                xhr.onprogress = function (oEvent) {
                    if(onProgress) {
                        onProgress(oEvent.total, oEvent.loaded);
                    }
                }.bind(this);
                xhr.onreadystatuschange = function (oEvent) {
                    if (oReq.readyState==4 && oReq.status==404) {
                        this.trace("loadMusicFromURL failed to load: "+ fullFilename);
                    }
                }.bind(this);

                xhr.send(null);
            },

            /*
            * Manually perform some file input based initialization sequence -
            * as/if required by the backend. (only needed for special cases)
            */
            uploadFile: function (file, options, onCompletion, onFail, onProgress) {
                var reader = new FileReader();
                reader.onload = function() {
                    var pfn= this._backendAdapter.getPathAndFilename(file.name);
                    var data= new Uint8Array(reader.result);
                    var fileHandle= this._backendAdapter.registerFileData(pfn, data);
                    if (typeof fileHandle === 'undefined' ) {
                        onFail();
                        return;
                    }
                    var status = this._backendAdapter.uploadFile(file.name, options);
                    if (status === 0) {
                        onCompletion(file.name);
                        this._onPlayerReady();
                    } else if (status == 1) {
                        onCompletion(file.name);
                    }
                }.bind(this);
                reader.onprogress = function (oEvent) {
                    if (onProgress) {
                        onProgress(oEvent.total, oEvent.loaded);
                    }
                }.bind(this);

                reader.readAsArrayBuffer(file);
            },

// ******** internal utils (MUST NOT be ued outside of the player or respective backendAdapters --------------

            /**
             * Load a music data and prepare to play a specific track.
             */
            prepareTrackForPlayback: function (fullFilename, data, options) {
                this._isPaused= true;

                // hack: so we get back at the options during retry attempts
                this.lastUsedFilename= fullFilename;
                this.lastUsedData= data;
                this.lastUsedOptions= options;

                this._isSongReady= false;
                this.setWaitingForFile(false);

                return this.initIfNeeded(fullFilename, data, options);
            },
            trace: function(str) {
                if (this._traceSwitch) { console.log(str); }
            },
            setWait: function(isWaiting) {
                this.setWaitingForFile(isWaiting);
            },
            getDefaultSampleRate: function() {
                return this._correctSampleRate;
            },
            initIfNeeded: function (fullFilename, data, options) {
                var status= this.loadMusicData(fullFilename, data, options);
                if (status <0) {
                    this._isSongReady= false;
                    this.setWaitingForFile(true);
                    this._initInProgress= false;

                } else if (status === 0) {
                    //	this._isPaused= false;
                    this.setWaitingForFile(false);
                    this._isSongReady= true;
                    this._currentPlaytime= 0;
                    this._initInProgress= false;

                    this.trace("successfully completed init");

                    // in scenarios where a synchronous file-load is involved this first call will typically fail
                    // but trigger the file load
                    var ret= this._backendAdapter.evalTrackOptions(options);
                    if (ret !== 0) {
                        this.trace("error preparing track options");
                        return false;
                    }
                    this.updateSongInfo(fullFilename);

                    if ((this.lastUsedFilename == fullFilename)) {
                        if (this._fileReadyNotify == fullFilename) {
                            // duplicate we already notified about.. probably some retry due to missing load-on-demand files
                            this.play();	// user had already expressed his wish to play
                        } else {
                            this._silenceStarttime= -1;	// reset silence detection

                            this._onTrackReadyToPlay();
                        }
                        this._fileReadyNotify= fullFilename;
                    }
                    this._isPaused= false;
                    return true;

                } else {
                    this._initInProgress= false;
                    // error that cannot be resolved.. (e.g. file not exists)
                    this.trace("initIfNeeded - fatal error");
                }
                return false;
            },
            loadMusicDataFromCache: function(fullFilename, options, onFail) {
                // reset timeout handling (of previous song.. which still might be playing)
                this._currentTimeout= -1;
                this._currentPlaytime= 0;
                this._isPaused= true;

                var cacheFilename= this._backendAdapter.mapCacheFileName(fullFilename);
                var data= this.getCache().getFile(cacheFilename);

                if (typeof data != 'undefined') {

                    this.trace("loadMusicDataFromCache found cached file using name: "+ cacheFilename);

                    if(!this.prepareTrackForPlayback(fullFilename, data, options)) {
                        if (!this.isWaitingForFile()) {
                            onFail();
                        } else {
                        }
                    }
                    return true;
                } else {
                    this.trace("loadMusicDataFromCache FAILED to find cached file using name: "+ cacheFilename);
                }
                return false;
            },
            getAudioContext: function() {
                this.initByUserGesture();	// for backward compatibility
                return window._gPlayerAudioCtx; // exposed due to Chrome's new bullshit "autoplay policy"
            },
            iOSHack: function(ctx) {
                try {
                    var source = window._gPlayerAudioCtx.createBufferSource();
                    if (!source.start) {
                        source.start = source.noteOn;
                        source.stop = source.noteOff;
                    }

                    source.buffer = window._gPlayerAudioCtx.createBuffer(1, 1, 22050);	// empty buffer
                    source.connect(window._gPlayerAudioCtx.destination);

                    source.start(0);

                } catch (ignore) {}
            },
            updateSongInfo: function (fullFilename) {
                this._songInfo= {};
                this._backendAdapter.updateSongInfo(fullFilename, this._songInfo);
            },
            loadMusicData: function(fullFilename, arrayBuffer, options) {
                this._backendAdapter.teardown();

                if (arrayBuffer) {
                    var pfn= this._backendAdapter.getPathAndFilename(fullFilename);

                    var data= new Uint8Array(arrayBuffer);
                    this._backendAdapter.registerFileData(pfn, data);	// in case the backend "needs" to retrieve the file by name

                    var cacheFilename= this._backendAdapter.mapCacheFileName(fullFilename);
                    this.getCache().setFile(cacheFilename, data);

                    var ret= this._backendAdapter.loadMusicData(this._sampleRate, pfn[0], pfn[1], data, options);

                    if (ret === 0) {
                        this.resetBuffer();
                    }
                    return ret;
                }
            },
            resetBuffer: function () {
                this._numberOfSamplesRendered= 0;
                this._numberOfSamplesToRender= 0;
                this._sourceBufferIdx=0;
            },
            resetSampleRate: function(sampleRate) {
                // override the default (correct) sample rate to make playback faster/slower
                this._backendAdapter.resetSampleRate(sampleRate, -1);

                if (sampleRate > 0) { this._sampleRate= sampleRate; }

                this.resetBuffer();
            },
            createScriptProcessor: function(audioCtx) {
                // use the number of channels that the backend wants
                var scriptNode = audioCtx.createScriptProcessor(SAMPLES_PER_BUFFER, 0, this._backendAdapter.getChannels());
                scriptNode.onaudioprocess = fetchSamples;
                //	scriptNode.onaudioprocess = window.player.genSamples.bind(window.player);	// doesn't work with dumbshit Chrome GC
                return scriptNode;
            },
            createTickerScriptProcessor: function(audioCtx) {
                var scriptNode;
                // "ticker" uses shortest buffer length available so that onaudioprocess
                // is invoked more frequently than the above scriptProcessor.. it is the purpose
                // of the "ticker" to supply data that is used for an "animation frame" (e.g. to display a VU meter),
                // i.e. accuracy is not a big issue since we are talking about 60fps.. (at 48000kHz the 256 sample
                // buffer would work up to 187.5 fps.. only people using unusually high playback rates might touch the limit..)

                // this script processor does not actually produce any audible output.. it just provides a callback
                // that is synchronized with the actual music playback.. (the alternative would be to manually try and
                // keep track of the playback progress..)
                scriptNode = audioCtx.createScriptProcessor(256, 0, 1);
                scriptNode.onaudioprocess = calcTick;
                return scriptNode;
            },
            fillEmpty: function(outSize, output1, output2) {
                var availableSpace = outSize-this._numberOfSamplesRendered;

                for (i= 0; i<availableSpace; i++) {
                    output1[i+this._numberOfSamplesRendered]= 0;
                    if (typeof output2 !== 'undefined') { output2[i+this._numberOfSamplesRendered]= 0; }
                }
                this._numberOfSamplesToRender = 0;
                this._numberOfSamplesRendered = outSize;
            },

            // ------------------- async file-load ( also explained in introduction above) --------------------------------

            // backend attempts to read some file using fileRequestCallback() function: if the file is available
            // (i.e. its binary data has already been loaded) the function signals the success by returning 0 where as 1 means
            // that the file does not exist. If the file has not yet been loaded the function returns -1.
            // As soon as the player completes an asynchronous file-load it passes the loaded data to the backendAdapter's
            // registerFileData() API. It is then up to the backendAdapter's impl to create some filename based file
            // cache which is used by the backend to retrieve "available" files. (Example: An Emscripten based backend uses
            // Emscripten's virtual FS and "normal" File IO APIs to access files. The respective backendAdaper.registerFileData()
            // implemntation just creates respective File nodes with the data it receives..)

            fileRequestCallback: function (name) {
                var fullFilename = this._backendAdapter.mapBackendFilename(name);

                this.trace("fileRequestCallback backend name: "+ name + " > FS name: "+fullFilename );

                return this.preloadFile(fullFilename, function() {
                    this.initIfNeeded(this.lastUsedFilename, this.lastUsedData, this.lastUsedOptions);
                }.bind(this), false);
            },
            // convenience API which lets backend directly query the file size
            fileSizeRequestCallback: function (name) {
                var filename= this._backendAdapter.mapBackendFilename(name);
                var cacheFilename= this._backendAdapter.mapCacheFileName(filename);
                var f= this.getCache().getFile(cacheFilename);	// this API is only called after the file has actually loaded
                return f.length;
            },

            // may be invoked by backend to "push" updated song attributes (some backends only "learn" about infos
            // like songname, author, etc while the song is actually played..)
            songUpdateCallback:function(attr) {
                // notification that emu has updated infos regarding the currently played song..
                this._backendAdapter.handleBackendSongAttributes(attr, this._songInfo);

                if(this._onUpdate) {
                    this._onUpdate();
                }
            },

            // -------------------------------------------------------------------------------------------------------

            preload: function(files, id, onCompletionHandler) {
                if (id === 0) {
                    // we are done preloading
                    onCompletionHandler();
                } else {
                    id--;
                    var funcCompleted= function() {this.preload(files, id, onCompletionHandler);}.bind(this); // trigger next load
                    this.preloadFile(files[id], funcCompleted, true);
                }
            },
            preloadFile: function (fullFilename, onLoadedHandler, notifyOnCached) {
                // note: function is used for "preload" and for "backend callback" loading... return values
                // are only used for the later

                var cacheFilename= this._backendAdapter.mapCacheFileName(fullFilename);
                var data= this.getCache().getFile(cacheFilename);
                if (typeof data != 'undefined')	{
                    var retVal= 0;
                    // the respective file has already been setup
                    if (data == 0) {
                        retVal= 1;
                        this.trace("error: preloadFile could not get cached: "+ fullFilename);
                    } else {
                        this.trace("preloadFile found cached file using name: "+ cacheFilename);

                        // but in cases were alias names as used for the same file (see modland shit)
                        // the file may NOT yet have been registered in the FS
                        // setup data in our virtual FS (the next access should then be OK)
                        var pfn= this._backendAdapter.getPathAndFilename(fullFilename);
                        var f= this._backendAdapter.registerFileData(pfn, data);
                    }
                    if(notifyOnCached)
                        onLoadedHandler();	// trigger next in chain	  needed for preload / but hurts "backend callback"
                    return retVal;
                } else {
                    this.trace("preloadFile FAILED to find cached file using name: "+ cacheFilename);
                }

                // backend will be stuck without this file and we better make
                // sure to not use it before it has been properly reinitialized
                this._isPaused= true;
                this.setWaitingForFile(true);
                this._isSongReady= false;

                // requested data not available.. we better load it for next time
                if (!(cacheFilename in this.getCache().getPendingMap())) {		// avoid duplicate loading
                    this.getCache().getPendingMap()[cacheFilename] = 1;

                    var oReq = new XMLHttpRequest();
                    oReq.open("GET", this._backendAdapter.mapUrl(fullFilename), true);
                    oReq.responseType = "arraybuffer";

                    oReq.onload = function (oEvent) {
                        var arrayBuffer = oReq.response;
                        if (arrayBuffer) {
                            this.trace("preloadFile successfully loaded: "+ fullFilename);

                            // setup data in our virtual FS (the next access should then be OK)
                            var pfn= this._backendAdapter.getPathAndFilename(fullFilename);
                            var data= new Uint8Array(arrayBuffer);
                            var f= this._backendAdapter.registerFileData(pfn, data);

                            this.trace("preloadFile cached file using name: "+ cacheFilename);

                            this.getCache().setFile(cacheFilename, data);
                        }
                        if(!delete this.getCache().getPendingMap()[cacheFilename]) {
                            this.trace("remove file from pending failed: "+cacheFilename);
                        }
                        onLoadedHandler();
                    }.bind(this);
                    oReq.onreadystatuschange = function (oEvent) {
                        if (oReq.readyState==4 && oReq.status==404) {
                            this.trace("preloadFile failed to load: "+ fullFilename);

                            this.getCache().setFile(cacheFilename, 0);
                        }
                    }.bind(this);
                    oReq.onerror  = function (oEvent) {

                        this.getCache().setFile(cacheFilename, 0);
                    }.bind(this);

                    oReq.send(null);
                }
                return -1;
            },
            tick: function(event) {
                if (!this._isPaused)
                    this._currentTick++;
            },
            // called for 'onaudioprocess' to feed new batch of sample data
            genSamples: function(event) {
                var genStereo= this.isStereo() && event.outputBuffer.numberOfChannels>1;

                var output1 = event.outputBuffer.getChannelData(0);
                var output2;
                if (genStereo) {
                    output2 = event.outputBuffer.getChannelData(1);
                }
                if ((!this._isSongReady) || this.isWaitingForFile() || this._isPaused) {
                    var i;
                    for (i= 0; i<output1.length; i++) {
                        output1[i]= 0;
                        if (genStereo) { output2[i]= 0; }
                    }
                } else {
                    if (typeof this._externalTicker !== 'undefined') {
                        this._externalTicker.start();
                    }

                    var outSize= output1.length;

                    this._numberOfSamplesRendered = 0;

                    while (this._numberOfSamplesRendered < outSize)
                    {
                        if (this._numberOfSamplesToRender === 0) {

                            var status;
                            if ((this._currentTimeout>0) && (this._currentPlaytime > this._currentTimeout)) {
                                this.trace("'song end' forced after "+ this._currentTimeout/this._correctSampleRate +" secs");
                                status= 1;
                            } else {
                                status = this._backendAdapter.computeAudioSamples();
                                if (typeof this._externalTicker !== 'undefined') {
                                    this._externalTicker.computeAudioSamplesNotify();
                                }
                            }

                            if (status !== 0) {
                                // no frame left
                                this.fillEmpty(outSize, output1, output2);

                                if (status <0) {
                                    // file-load: emu just discovered that we need to load another file
                                    this._isPaused= true;
                                    this._isSongReady= false; 		// previous init is invalid
                                    this.setWaitingForFile(true);
                                    return; // complete init sequence must be repeated
                                }
                                if (this.isWaitingForFile()) {
                                    // this state may just have been set by the backend.. try again later
                                    return;
                                } else {
                                    if (status > 1)	{
                                        this.trace("playback aborted with an error");
                                    }

                                    this._isPaused= true;	// stop playback (or this will retrigger again and again before new song is started)
                                    if (this._onTrackEnd) {
                                        this._onTrackEnd();
                                    }
                                    return;
                                }
                            }
                            // refresh just in case they are not using one fixed buffer..
                            this._sourceBuffer= this._backendAdapter.getAudioBuffer();
                            this._sourceBufferLen= this._backendAdapter.getAudioBufferLength();

                            if (this._pan != null)
                                this._backendAdapter.applyPanning(this._sourceBuffer, this._sourceBufferLen, this._pan+1.0);

                            this._numberOfSamplesToRender =  this._backendAdapter.getResampledAudio(this._sourceBuffer, this._sourceBufferLen);

                            if (typeof this._externalTicker !== 'undefined') {
                                this._backendAdapter.resampleTickerData(this._externalTicker, this._sourceBufferLen);
                            }
                            this._sourceBufferIdx=0;
                        }

                        var resampleBuffer= this._backendAdapter.getResampleBuffer();
                        if (genStereo) {
                            this.copySamplesStereo(resampleBuffer, output1, output2, outSize);
                        } else {
                            this.copySamplesMono(resampleBuffer, output1, outSize);
                        }
                    }
                    // keep track how long we are playing: just filled one WebAudio buffer which will be played at
                    this._currentPlaytime+= outSize * this._correctSampleRate/this._sampleRate;

                    // silence detection at end of song
                    if ((this._silenceStarttime > 0) && ((this._currentPlaytime - this._silenceStarttime) >= this._silenceTimeout*this._correctSampleRate ) && (this._silenceTimeout >0)) {
                        this._isPaused= true;	// stop playback (or this will retrigger again and again before new song is started)
                        if (this._onTrackEnd) {
                            this._onTrackEnd();
                        }
                    }
                }
                if (typeof this._externalTicker !== 'undefined') {
                    this._externalTicker.calcTickData(output1, output2);
                    this._currentTick= 0;
                }
            },
            detectSilence: function(s) {
                if (this._silenceStarttime == 0) {	// i.e. song has been playing
                    if (s == 0) {	// silence detected
                        this._silenceStarttime= this._currentPlaytime;
                    }
                } else if (s > 0) {	// i.e. false alarm or very start of playback
                    this._silenceStarttime= 0;
                }
            },
            copySamplesStereo: function(resampleBuffer, output1, output2, outSize) {
                var i;
                var s= 0, l= 0, r=  0;
                var abs= Math.abs;
                if (this._numberOfSamplesRendered + this._numberOfSamplesToRender > outSize) {
                    var availableSpace = outSize-this._numberOfSamplesRendered;

                    for (i= 0; i<availableSpace; i++) {
                        if (typeof this._externalTicker !== 'undefined') {
                            this._externalTicker.copyTickerData(i+this._numberOfSamplesRendered, (this._sourceBufferIdx>>1), this._backendAdapter);
                        }
                        l= resampleBuffer[this._sourceBufferIdx++];
                        r= resampleBuffer[this._sourceBufferIdx++];

                        output1[i+this._numberOfSamplesRendered]= l;
                        output2[i+this._numberOfSamplesRendered]= r;

                        s+= abs(l) + abs(r);
                    }

                    this._numberOfSamplesToRender -= availableSpace;
                    this._numberOfSamplesRendered = outSize;
                } else {
                    for (i= 0; i<this._numberOfSamplesToRender; i++) {
                        if (typeof this._externalTicker !== 'undefined') {
                            this._externalTicker.copyTickerData(i+this._numberOfSamplesRendered, (this._sourceBufferIdx>>1), this._backendAdapter);
                        }
                        l= resampleBuffer[this._sourceBufferIdx++];
                        r= resampleBuffer[this._sourceBufferIdx++];

                        output1[i+this._numberOfSamplesRendered]= l;
                        output2[i+this._numberOfSamplesRendered]= r;

                        s+= abs(l) + abs(r);
                    }
                    this._numberOfSamplesRendered += this._numberOfSamplesToRender;
                    this._numberOfSamplesToRender = 0;
                }
                this.detectSilence(s);
            },
            copySamplesMono: function(resampleBuffer, output1, outSize) {
                var i;
                var s= 0, o=  0;
                var abs= Math.abs;
                if (this._numberOfSamplesRendered + this._numberOfSamplesToRender > outSize) {
                    var availableSpace = outSize-this._numberOfSamplesRendered;

                    for (i= 0; i<availableSpace; i++) {
                        if (typeof this._externalTicker !== 'undefined') {
                            this._externalTicker.copyTickerData(i+this._numberOfSamplesRendered, this._sourceBufferIdx, this._backendAdapter);
                        }
                        o= resampleBuffer[this._sourceBufferIdx++];
                        output1[i+this._numberOfSamplesRendered]= o;

                        s+= abs(o);
                    }
                    this._numberOfSamplesToRender -= availableSpace;
                    this._numberOfSamplesRendered = outSize;
                } else {
                    for (i= 0; i<this._numberOfSamplesToRender; i++) {
                        if (typeof this._externalTicker !== 'undefined') {
                            this._externalTicker.copyTickerData(i+this._numberOfSamplesRendered, this._sourceBufferIdx, this._backendAdapter);
                        }
                        o= resampleBuffer[this._sourceBufferIdx++];
                        output1[i+this._numberOfSamplesRendered]= o;

                        s+= abs(o);
                    }
                    this._numberOfSamplesRendered += this._numberOfSamplesToRender;
                    this._numberOfSamplesToRender = 0;
                }
                this.detectSilence(s);
            },

            // Avoid the async trial&error loading (if available) for those files that
            // we already know we'll be needing
            preloadFiles: function(files, onCompletionHandler) {
                this._isPaused= true;

                if (this._backendAdapter.isAdapterReady()) {
                    // sync scenario: runtime is ready
                    this.preload(files, files.length, onCompletionHandler);
                } else {
                    // async scenario:  runtime is NOT ready (e.g. emscripten WASM)
                    this["deferredPreload"] = [files, onCompletionHandler];
                }
            },
            setWaitingForFile: function(val) {
                this.getCache().setWaitingForFile(val);
            },
            isWaitingForFile: function() {
                return this.getCache().isWaitingForFile();
            },
            getCache: function() {
                if(typeof window._fileCache == 'undefined')
                    window._fileCache= new FileCache();

                return window._fileCache;
            }
        };

        return {
            /*
                @param bufferSize size of the used sample buffer; allowed: 256, 512, 1024, 2048, 4096, 8192, 16384 (default)
            */
            createInstance: function(backendAdapter, basePath, requiredFiles, enableSpectrum,
                                     onPlayerReady, onTrackReadyToPlay, onTrackEnd, doOnUpdate, externalTicker, bufferSize) {

                if ((externalTicker != null) &&  (typeof player !== "undefined")) {
                    // JCH's hack: The audio context must be recreated to avoid choppy updating in the oscilloscope voices
                    _gPlayerAudioCtx.close();
                    _gPlayerAudioCtx.ctx = null;
                    try {
                        if("AudioContext" in window) {
                            _gPlayerAudioCtx = new AudioContext();
                        } else if('webkitAudioContext' in window) {
                            _gPlayerAudioCtx = new webkitAudioContext(); // Legacy
                        } else {
                            alert(errText + e);
                        }
                    } catch(e) {
                        alert(errText + e);
                    }
                }

                var trace= false;
                if (typeof window.player != 'undefined' ) {			// stop existing pipeline
                    var old= window.player;
                    old._isPaused= true;

                    if (typeof old._bufferSource != 'undefined') {
                        try {
                            old._bufferSource.stop(0);
                        } catch(err) {}	// ignore for the benefit of Safari(OS X)
                    }
                    if (old._scriptNode) old._scriptNode.disconnect(0);		// XXX FIXME why 0???
                    if (old._analyzerNode) old._analyzerNode.disconnect(0);
                    if (old._gainNode) old._gainNode.disconnect(0);

                    trace= old._traceSwitch;
                }
                // FIXME ugly side-effect: internally the below constructor sets window.player to 'p'
                var p = new PlayerImpl(backendAdapter, basePath, requiredFiles, enableSpectrum,
                    onPlayerReady, onTrackReadyToPlay, onTrackEnd, doOnUpdate, externalTicker, bufferSize);
                p._traceSwitch= trace;
            },
            getInstance: function () {
                if (typeof window.player === 'undefined' ) {
                    alert("fatal error: window.player not defined");
                }
                return window.player;
            }
        };
    })();


    window.player = PlayerImpl;

    // create separate namespace for all the Emscripten stuff.. otherwise naming clashes may occur especially when
// optimizing using closure compiler..
    const spp_backend_state_SNES= {
        notReady: true,
        adapterCallback: function(){}	// overwritten later
    };
    spp_backend_state_SNES["onRuntimeInitialized"] = function() {	// emscripten callback needed in case async init is used (e.g. for WASM)
        this.notReady= false;
        this.adapterCallback();
    }.bind(spp_backend_state_SNES);

    var backend_SNES = (function(Module) {var d;d||(d=typeof Module !== 'undefined' ? Module : {});var aa={},h;for(h in d)d.hasOwnProperty(h)&&(aa[h]=d[h]);d.arguments=[];d.thisProgram="./this.program";d.quit=function(a,b){throw b;};d.preRun=[];d.postRun=[];var ba=!1,k=!1,m=!1,ca=!1;
        if(d.ENVIRONMENT)if("WEB"===d.ENVIRONMENT)ba=!0;else if("WORKER"===d.ENVIRONMENT)k=!0;else if("NODE"===d.ENVIRONMENT)m=!0;else if("SHELL"===d.ENVIRONMENT)ca=!0;else throw Error("Module['ENVIRONMENT'] value is not valid. must be one of: WEB|WORKER|NODE|SHELL.");else ba="object"===typeof window,k="function"===typeof importScripts,m="object"===typeof process&&"function"===typeof require&&!ba&&!k,ca=!ba&&!m&&!k;
        if(m){var da,ea;d.read=function(a,b){var c=n(a);c||(da||(da=require("fs")),ea||(ea=require("path")),a=ea.normalize(a),c=da.readFileSync(a));return b?c:c.toString()};d.readBinary=function(a){a=d.read(a,!0);a.buffer||(a=new Uint8Array(a));assert(a.buffer);return a};1<process.argv.length&&(d.thisProgram=process.argv[1].replace(/\\/g,"/"));d.arguments=process.argv.slice(2);"undefined"!==typeof module&&(module.exports=d);process.on("uncaughtException",function(a){if(!(a instanceof fa))throw a;});process.on("unhandledRejection",
            function(){d.printErr("node.js exiting due to unhandled promise rejection");process.exit(1)});d.inspect=function(){return"[Emscripten Module object]"}}else if(ca)"undefined"!=typeof read&&(d.read=function(a){var b=n(a);return b?ha(b):read(a)}),d.readBinary=function(a){var b;if(b=n(a))return b;if("function"===typeof readbuffer)return new Uint8Array(readbuffer(a));b=read(a,"binary");assert("object"===typeof b);return b},"undefined"!=typeof scriptArgs?d.arguments=scriptArgs:"undefined"!=typeof arguments&&
            (d.arguments=arguments),"function"===typeof quit&&(d.quit=function(a){quit(a)});else if(ba||k)d.read=function(a){try{var b=new XMLHttpRequest;b.open("GET",a,!1);b.send(null);return b.responseText}catch(c){if(a=n(a))return ha(a);throw c;}},k&&(d.readBinary=function(a){try{var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)}catch(c){if(a=n(a))return a;throw c;}}),d.readAsync=function(a,b,c){var e=new XMLHttpRequest;e.open("GET",a,!0);
            e.responseType="arraybuffer";e.onload=function(){if(200==e.status||0==e.status&&e.response)b(e.response);else{var f=n(a);f?b(f.buffer):c()}};e.onerror=c;e.send(null)},"undefined"!=typeof arguments&&(d.arguments=arguments),d.setWindowTitle=function(a){document.title=a};else throw Error("unknown runtime environment");d.print="undefined"!==typeof console?console.log:"undefined"!==typeof print?print:null;d.printErr="undefined"!==typeof printErr?printErr:"undefined"!==typeof console&&console.warn||d.print;
        d.print=d.print;d.printErr=d.printErr;for(h in aa)aa.hasOwnProperty(h)&&(d[h]=aa[h]);aa=void 0;ja=ka=la=ma=function(){p("cannot use the stack before compiled code is ready to run, and has provided stack access")};function na(a){assert(!oa);var b=q;q=q+a+15&-16;return b}function pa(a){var b;b||(b=16);return Math.ceil(a/b)*b}function qa(a){ra||(ra={});ra[a]||(ra[a]=1,d.printErr(a))}var ra;
        function sa(a){switch(a){case 1:return"i8";case 2:return"i16";case 4:return"i32";case 8:return"double";default:assert(0)}}
        function ta(a,b){0>=a&&p("segmentation fault storing 4 bytes to address "+a);0!==a%4&&p("alignment error storing to address "+a+", which was expected to be aligned to a multiple of 4");oa?(a+4>r[v>>2]&&p("segmentation fault, exceeded the top of the available dynamic heap when storing 4 bytes to address "+a+". STATICTOP="+q+", DYNAMICTOP="+r[v>>2]),assert(v),assert(r[v>>2]<=w)):a+4>q&&p("segmentation fault, exceeded the top of the available static heap when storing 4 bytes to address "+a+". STATICTOP="+
            q);var c=sa(4);c=c||"i8";"*"===c.charAt(c.length-1)&&(c="i32");switch(c){case "i1":x[a>>0]=b;break;case "i8":x[a>>0]=b;break;case "i16":ua[a>>1]=b;break;case "i32":r[a>>2]=b;break;case "i64":tempI64=[b>>>0,(tempDouble=b,1<=+va(tempDouble)?0<tempDouble?(wa(+xa(tempDouble/4294967296),4294967295)|0)>>>0:~~+ya((tempDouble-+(~~tempDouble>>>0))/4294967296)>>>0:0)];r[a>>2]=tempI64[0];r[a+4>>2]=tempI64[1];break;case "float":za[a>>2]=b;break;case "double":Aa[a>>3]=b;break;default:p("invalid type for setValue: "+
            c)}}
        function Ba(a,b,c){0>=a&&p("segmentation fault loading "+b+" bytes from address "+a);0!==a%b&&p("alignment error loading from address "+a+", which was expected to be aligned to a multiple of "+b);oa?(a+b>r[v>>2]&&p("segmentation fault, exceeded the top of the available dynamic heap when loading "+b+" bytes from address "+a+". STATICTOP="+q+", DYNAMICTOP="+r[v>>2]),assert(v),assert(r[v>>2]<=w)):a+b>q&&p("segmentation fault, exceeded the top of the available static heap when loading "+b+" bytes from address "+a+
            ". STATICTOP="+q);b=sa(b);a=Ca(a,b);c&&(c=parseInt(b.substr(1)),a=0<=a?a:32>=c?2*Math.abs(1<<c-1)+a:Math.pow(2,c)+a);return a}var Da=0;function assert(a,b){a||p("Assertion failed: "+b)}
        var Fa={stackSave:function(){ja()},stackRestore:function(){ka()},arrayToC:function(a){var b=la(a.length);assert(0<=a.length,"writeArrayToMemory array must have a length (should be an array or typed array)");x.set(a,b);return b},stringToC:function(a){var b=0;if(null!==a&&void 0!==a&&0!==a){var c=(a.length<<2)+1,e=b=la(c);assert("number"==typeof c,"stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");Ea(a,y,e,c)}return b}},Ga={string:Fa.stringToC,
            array:Fa.arrayToC};function Ca(a,b){b=b||"i8";"*"===b.charAt(b.length-1)&&(b="i32");switch(b){case "i1":return x[a>>0];case "i8":return x[a>>0];case "i16":return ua[a>>1];case "i32":return r[a>>2];case "i64":return r[a>>2];case "float":return za[a>>2];case "double":return Aa[a>>3];default:p("invalid type for getValue: "+b)}return null}
        function Ha(a,b){if(0===b||!a)return"";for(var c=0,e,f=0;;){assert(a+f<w);e=Ba(a+f|0,1,1)|0;c|=e;if(0==e&&!b)break;f++;if(b&&f==b)break}b||(b=f);e="";if(128>c){for(;0<b;)c=String.fromCharCode.apply(String,y.subarray(a,a+Math.min(b,1024))),e=e?e+c:c,a+=1024,b-=1024;return e}return Ia(y,a)}var Ja="undefined"!==typeof TextDecoder?new TextDecoder("utf8"):void 0;
        function Ia(a,b){for(var c=b;a[c];)++c;if(16<c-b&&a.subarray&&Ja)return Ja.decode(a.subarray(b,c));for(c="";;){var e=a[b++];if(!e)return c;if(e&128){var f=a[b++]&63;if(192==(e&224))c+=String.fromCharCode((e&31)<<6|f);else{var g=a[b++]&63;if(224==(e&240))e=(e&15)<<12|f<<6|g;else{var l=a[b++]&63;if(240==(e&248))e=(e&7)<<18|f<<12|g<<6|l;else{var t=a[b++]&63;if(248==(e&252))e=(e&3)<<24|f<<18|g<<12|l<<6|t;else{var u=a[b++]&63;e=(e&1)<<30|f<<24|g<<18|l<<12|t<<6|u}}}65536>e?c+=String.fromCharCode(e):(e-=
            65536,c+=String.fromCharCode(55296|e>>10,56320|e&1023))}}else c+=String.fromCharCode(e)}}
        function Ea(a,b,c,e){if(!(0<e))return 0;var f=c;e=c+e-1;for(var g=0;g<a.length;++g){var l=a.charCodeAt(g);55296<=l&&57343>=l&&(l=65536+((l&1023)<<10)|a.charCodeAt(++g)&1023);if(127>=l){if(c>=e)break;b[c++]=l}else{if(2047>=l){if(c+1>=e)break;b[c++]=192|l>>6}else{if(65535>=l){if(c+2>=e)break;b[c++]=224|l>>12}else{if(2097151>=l){if(c+3>=e)break;b[c++]=240|l>>18}else{if(67108863>=l){if(c+4>=e)break;b[c++]=248|l>>24}else{if(c+5>=e)break;b[c++]=252|l>>30;b[c++]=128|l>>24&63}b[c++]=128|l>>18&63}b[c++]=128|
            l>>12&63}b[c++]=128|l>>6&63}b[c++]=128|l&63}}b[c]=0;return c-f}"undefined"!==typeof TextDecoder&&new TextDecoder("utf-16le");function Ka(a){return a.replace(/__Z[\w\d_]+/g,function(a){qa("warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");return a===a?a:a+" ["+a+"]"})}
        function La(){a:{var a=Error();if(!a.stack){try{throw Error(0);}catch(b){a=b}if(!a.stack){a="(no stack trace available)";break a}}a=a.stack.toString()}d.extraStackTrace&&(a+="\n"+d.extraStackTrace());return Ka(a)}var buffer,x,y,ua,r,z,za,Aa,Ma,q,oa,Na,Oa,A,Pa,v;Ma=q=Na=Oa=A=Pa=v=0;oa=!1;
        function Qa(){34821223==z[(A>>2)-1]&&2310721022==z[(A>>2)-2]||p("Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x02135467, but received 0x"+z[(A>>2)-2].toString(16)+" "+z[(A>>2)-1].toString(16));if(1668509029!==r[0])throw"Runtime error: The application has corrupted its heap memory area (address zero)!";}
        function Ra(){p("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value "+w+", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ")}var Sa=d.TOTAL_STACK||5242880,w=d.TOTAL_MEMORY||67108864;
        w<Sa&&d.printErr("TOTAL_MEMORY should be larger than TOTAL_STACK, was "+w+"! (TOTAL_STACK="+Sa+")");assert("undefined"!==typeof Int32Array&&"undefined"!==typeof Float64Array&&void 0!==Int32Array.prototype.subarray&&void 0!==Int32Array.prototype.set,"JS engine does not provide full typed array support");d.buffer?(buffer=d.buffer,assert(buffer.byteLength===w,"provided buffer should be "+w+" bytes, but it is "+buffer.byteLength)):(buffer=new ArrayBuffer(w),assert(buffer.byteLength===w),d.buffer=buffer);
        d.HEAP8=x=new Int8Array(buffer);d.HEAP16=ua=new Int16Array(buffer);d.HEAP32=r=new Int32Array(buffer);d.HEAPU8=y=new Uint8Array(buffer);d.HEAPU16=new Uint16Array(buffer);d.HEAPU32=z=new Uint32Array(buffer);d.HEAPF32=za=new Float32Array(buffer);d.HEAPF64=Aa=new Float64Array(buffer);r[0]=1668509029;ua[1]=25459;if(115!==y[2]||99!==y[3])throw"Runtime error: expected the system to be little-endian!";
        function Ua(a){for(;0<a.length;){var b=a.shift();if("function"==typeof b)b();else{var c=b.Xc;"number"===typeof c?void 0===b.X?d.dynCall_v(c):d.dynCall_vi(c,b.X):c(void 0===b.X?null:b.X)}}}var Va=[],Wa=[],Xa=[],Ya=[],Za=[],B=!1,C=!1;function $a(){var a=d.preRun.shift();Va.unshift(a)}assert(Math.imul&&Math.fround&&Math.clz32&&Math.trunc,"this is a legacy browser, build with LEGACY_VM_SUPPORT");var va=Math.abs,ya=Math.ceil,xa=Math.floor,ab=Math.pow,wa=Math.min,D=0,E=null,bb=null,cb={};
        function db(a){for(var b=a;cb[a];)a=b+Math.random();return a}function eb(a){D++;d.monitorRunDependencies&&d.monitorRunDependencies(D);a?(assert(!cb[a]),cb[a]=1,null===E&&"undefined"!==typeof setInterval&&(E=setInterval(function(){if(Da)clearInterval(E),E=null;else{var a=!1,c;for(c in cb)a||(a=!0,d.printErr("still waiting on run dependencies:")),d.printErr("dependency: "+c);a&&d.printErr("(end of list)")}},1E4))):d.printErr("warning: run dependency added without ID")}
        function fb(a){D--;d.monitorRunDependencies&&d.monitorRunDependencies(D);a?(assert(cb[a]),delete cb[a]):d.printErr("warning: run dependency removed without ID");0==D&&(null!==E&&(clearInterval(E),E=null),bb&&(a=bb,bb=null,a()))}d.preloadedImages={};d.preloadedAudios={};var F=null,gb="data:application/octet-stream;base64,";Ma=8;q=Ma+30032;Wa.push();F="data:application/octet-stream;base64,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eSBsZW5ndGggb3IgZGlzdGFuY2Ugc3ltYm9scwBpbnZhbGlkIGNvZGUgbGVuZ3RocyBzZXQAaW52YWxpZCBiaXQgbGVuZ3RoIHJlcGVhdABpbnZhbGlkIGxpdGVyYWwvbGVuZ3RocyBzZXQAaW52YWxpZCBkaXN0YW5jZXMgc2V0AGluY29ycmVjdCBkYXRhIGNoZWNrAGluY29ycmVjdCBsZW5ndGggY2hlY2sAaW52YWxpZCBsaXRlcmFsL2xlbmd0aCBjb2RlAGludmFsaWQgZGlzdGFuY2UgY29kZQBpbnZhbGlkIGRpc3RhbmNlIHRvbyBmYXIgYmFjawBzYW1wbGVfcmF0ZSgpAC4uL2dtZS9NdXNpY19FbXUuY3BwAG11dGVfdm9pY2VzAGNsb2Nrc19lbXVsYXRlZAAuLi9nbWUvQ2xhc3NpY19FbXUuY3BwAHBsYXlfAChjaC5jZW50ZXIgJiYgY2gubGVmdCAmJiBjaC5yaWdodCkgfHwgKCFjaC5jZW50ZXIgJiYgIWNoLmxlZnQgJiYgIWNoLnJpZ2h0KQBtdXRlX3ZvaWNlc18AIShjb3VudCAmIDEpAC4uL2dtZS9NdWx0aV9CdWZmZXIuY3BwAGNvdW50IDw9IHNhbXBsZXNfYXZhaWwoKQAuLi9nbWUvQmxpcF9CdWZmZXIuY3BwAHJlbW92ZV9zaWxlbmNlAHNhbXBsZXNfYXZhaWwoKSA8PSAobG9uZykgYnVmZmVyX3NpemVfAGZhY3RvciA+IDAgfHwgIXNhbXBsZV9yYXRlXwBjbG9ja19yYXRlX2ZhY3RvcgAwAGJ1ZmZlcl9zaXplXyAhPSBzaWxlbnRfYnVmX3NpemUAbGVuZ3RoXyA9PSBtc2VjADEzU3RlcmVvX0J1ZmZlcgAxMk11bHRpX0J1ZmZlcgAhYnVmICYmIG5ld19idWYALi4vZ21lL0NsYXNzaWNfRW11LmgAc2V0X2J1ZmZlcgBzZXRfbXVsdGlfY2hhbm5lbF8Ac2V0X3RlbXBvAHByZV9sb2FkAGRhdGEgIT0gZmlsZV9kYXRhLmJlZ2luKCkALi4vZ21lL0dtZV9GaWxlLmNwcABsb2FkX21lbV8AQ29ycnVwdCBmaWxlAFVuZXhwZWN0ZWQgZW5kIG9mIGZpbGUAUmVhZCBlcnJvcgAxNU1lbV9GaWxlX1JlYWRlcgAxMUZpbGVfUmVhZGVyADExRGF0YV9SZWFkZXIAH4sxLjIuMwA4R21lX0ZpbGUAdW5zdXBwb3J0ZWQgZm9yIHRoaXMgZW11bGF0b3IgdHlwZQA5TXVzaWNfRW11ADExQ2xhc3NpY19FbXUAMTREdWFsX1Jlc2FtcGxlcgB0b3RhbF9zYW1wbGVzICUgbl9jaGFubmVscyA9PSAwAC4uL2dtZS9FZmZlY3RzX0J1ZmZlci5jcHAAcmVhZF9zYW1wbGVzAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemUAMTRFZmZlY3RzX0J1ZmZlcgBXcm9uZyBmaWxlIHR5cGUgZm9yIHRoaXMgZW11bGF0b3IAVXNlIGZ1bGwgZW11bGF0b3IgZm9yIHBsYXliYWNrADlHbWVfSW5mb18AY291bnRfY2xvY2tzAGtlcm5lbF91bml0ID4gMAB2b2x1bWVfdW5pdABWb2ljZSAxAFZvaWNlIDIAVm9pY2UgMwBWb2ljZSA0AFZvaWNlIDUAVm9pY2UgNgBWb2ljZSA3AFZvaWNlIDgAKih2b2xhdGlsZSBjaGFyKikgJmkgIT0gMAAuLi9nbWUvYmxhcmdnX2VuZGlhbi5oAGJsYXJnZ192ZXJpZnlfYnl0ZV9vcmRlcgBuZXdfY291bnQgPCByZXNhbXBsZXJfc2l6ZQAuLi9nbWUvRHVhbF9SZXNhbXBsZXIuY3BwAHBsYXlfZnJhbWVfAGJsaXBfYnVmLnNhbXBsZXNfYXZhaWwoKSA9PSBwYWlyX2NvdW50AGNvdW50ID09IChsb25nKSBzYW1wbGVfYnVmX3NpemUAd3JpdGVfcG9zIDw9IGJ1Zi5lbmQoKQAuLi9nbWUvRmlyX1Jlc2FtcGxlci5oAChkYXRhIHx8ICFzaXplKSAmJiBvdXQALi4vZ21lL2dtZS5jcHAAZ21lX29wZW5fZGF0YQBzZXRfc2FtcGxlX3JhdGUAbiA8PSBzaXplXwAuLi9nbWUvYmxhcmdnX2NvbW1vbi5oAG9wZXJhdG9yW10ASW52YWxpZCB0cmFjayBpbiBtM3UgcGxheWxpc3QASW52YWxpZCB0cmFjawA/ADw/PgA8ID8gPgAhYnVmX3JlbWFpbgBmaWxsX2J1ZgBjdXJyZW50X3RyYWNrKCkgPj0gMABvdXRfY291bnQgJSBvdXRfY2hhbm5lbHMoKSA9PSAwAGVtdV90aW1lID49IG91dF90aW1lAHNraXAAbGFzdF90aW1lID49IHRpbWUAZmluYWxfZW5kX3RpbWUgPj0gbGFzdF90aW1lAC4uL2dtZS9BeV9BcHUuY3BwAAACAwQGCAsQFyAtQFqAtP8tcmVtYWluIDw9IGVudl9wZXJpb2QAZW52LmRlbGF5ID4gMABlbnYucG9zIDwgMAAoYmxpcF9sb25nKSAodGltZSA+PiBCTElQX0JVRkZFUl9BQ0NVUkFDWSkgPCBibGlwX2J1Zi0+YnVmZmVyX3NpemVfAC4uL2dtZS9CbGlwX0J1ZmZlci5oAG9mZnNldF9yZXNhbXBsZWQABAoHBgQEBwQECwcGBAQHBA0KBwYEBAcEDAsHBgQEBwQMChAGBAQHBAwLEAYEBAcEDAoNBgsLCgQMCw0GBAQHBAQEBAQEBAcEBAQEBAQEBwQEBAQEBAQHBAQEBAQEBAcEBAQEBAQEBwQEBAQEBAQHBAcHBwcHBwQHBAQEBAQEBwQEBAQEBAQHBAQEBAQEBAcEBAQEBAQEBwQEBAQEBAQHBAQEBAQEBAcEBAQEBAQEBwQEBAQEBAQHBAQEBAQEBAcECwoKChELBwsLCgoIEREHCwsKCgsRCwcLCwQKCxEIBwsLCgoTEQsHCwsECgQRCAcLCwoKBBELBwsLBgoEEQgHCwAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAYMAgAAAwAABwwCAAADAAAAAAAPDwsAAAcAAAAAAABAQHDAAGALEEBAcMAAYAsQQEBwwABgCxBAQHDAAGALEEBAcMAAYAugQEBwwABgC6BLS3vLC2sAC0BAcMAAYAsAAAAAAAAACwAAAAAAAAALAAAAAAAAAAsAAAAAAAAACwCAgICAAAALAICAgIAAAAsA0NDQ0AAACwDQ0NDQAAALAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAYADwAHAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAodW5zaWduZWQpIGFkZHIgPCByZWdfY291bnQAd3JpdGVfZGF0YV8AKHVuc2lnbmVkKSBpIDwgb3NjX2NvdW50AC4uL2dtZS9BeV9BcHUuaABCYWQgZGF0YSBibG9jayBzaXplAE1pc3NpbmcgZmlsZSBkYXRhAPPNAADtXvt2GPrzzQAA7Vb7ds0AABj3RmlsZSBkYXRhIG1pc3NpbmcAKHVuc2lnbmVkIGxvbmcpIHBvcyA8PSAodW5zaWduZWQgbG9uZykgZmlsZV9zaXplIC0gMgAuLi9nbWUvQXlfRW11LmNwcABnZXRfZGF0YQBVbmtub3duIGZpbGUgdmVyc2lvbgBaWEFZRU1VTABNaXNzaW5nIHRyYWNrIGRhdGEANkF5X0VtdQA2QXlfQ3B1AFpYIFNwZWN0cnVtAEFZADdBeV9GaWxlAFdhdmUgMQBXYXZlIDIAV2F2ZSAzAEJlZXBlcgAVARk9Kj4mAmxhc3RfdGltZSA+PSBlbmRfdGltZQAuLi9nbWUvU21zX0FwdS5jcHAAZW5kX3RpbWUgPj0gbGFzdF90aW1lAHJ1bl91bnRpbAB3cml0ZV9kYXRhAEAyJx8YEw8MCQcFBAMCAQAodW5zaWduZWQpIGRhdGEgPD0gMHhGRgAuLi9nbWUvWW0yNjEyX0VtdS5jcHAAd3JpdGUxAAAAAAAAAAABAgMDAwMDAwMfBAEAAAECAwQGDBh3cml0ZTAAKHVuc2lnbmVkKSBpbmRleCA8IG9zY19jb3VudABvc2Nfb3V0cHV0AChjZW50ZXIgJiYgbGVmdCAmJiByaWdodCkgfHwgKCFjZW50ZXIgJiYgIWxlZnQgJiYgIXJpZ2h0KQBPdXQgb2YgbWVtb3J5AHNhbXBsZV9yYXRlAHNldF9yYXRlAGNsb2NrX3JhdGUgPiBzYW1wbGVfcmF0ZQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQICAgICAwMDBAQEBQUGBgcICAgIAQEBAQICAgICAwMDBAQEBQUGBgcICAkKCwwNDhAQEBACAgICAgMDAwQEBAUFBgYHCAgJCgsMDQ4QERMUFhYWFlVua25vd24gU29uZwBVbmtub3duIEdhbWUAVW5rbm93biBQdWJsaXNoZXIAVW5rbm93biBQZXJzb24ASGVhZGVyIGFkZGVkIGJ5IFlNQU1QAFBhY2tlZCBHWU0gZmlsZSBub3Qgc3VwcG9ydGVkADdHeW1fRW11AFNl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AAAAAAkMAAAAAAAMAAAMAAAtKyAgIDBYMHgAKG51bGwpAC0wWCswWCAwWC0weCsweCAweABpbmYASU5GAG5hbgBOQU4AMDEyMzQ1Njc4OUFCQ0RFRi4AVCEiGQ0BAgMRSxwMEAQLHRIeJ2hub3BxYiAFBg8TFBUaCBYHKCQXGAkKDhsfJSODgn0mKis8PT4/Q0dKTVhZWltcXV5fYGFjZGVmZ2lqa2xyc3R5ent8AElsbGVnYWwgYnl0ZSBzZXF1ZW5jZQBEb21haW4gZXJyb3IAUmVzdWx0IG5vdCByZXByZXNlbnRhYmxlAE5vdCBhIHR0eQBQZXJtaXNzaW9uIGRlbmllZABPcGVyYXRpb24gbm90IHBlcm1pdHRlZABObyBzdWNoIGZpbGUgb3IgZGlyZWN0b3J5AE5vIHN1Y2ggcHJvY2VzcwBGaWxlIGV4aXN0cwBWYWx1ZSB0b28gbGFyZ2UgZm9yIGRhdGEgdHlwZQBObyBzcGFjZSBsZWZ0IG9uIGRldmljZQBPdXQgb2YgbWVtb3J5AFJlc291cmNlIGJ1c3kASW50ZXJydXB0ZWQgc3lzdGVtIGNhbGwAUmVzb3VyY2UgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGUASW52YWxpZCBzZWVrAENyb3NzLWRldmljZSBsaW5rAFJlYWQtb25seSBmaWxlIHN5c3RlbQBEaXJlY3Rvcnkgbm90IGVtcHR5AENvbm5lY3Rpb24gcmVzZXQgYnkgcGVlcgBPcGVyYXRpb24gdGltZWQgb3V0AENvbm5lY3Rpb24gcmVmdXNlZABIb3N0IGlzIGRvd24ASG9zdCBpcyB1bnJlYWNoYWJsZQBBZGRyZXNzIGluIHVzZQBCcm9rZW4gcGlwZQBJL08gZXJyb3IATm8gc3VjaCBkZXZpY2Ugb3IgYWRkcmVzcwBCbG9jayBkZXZpY2UgcmVxdWlyZWQATm8gc3VjaCBkZXZpY2UATm90IGEgZGlyZWN0b3J5AElzIGEgZGlyZWN0b3J5AFRleHQgZmlsZSBidXN5AEV4ZWMgZm9ybWF0IGVycm9yAEludmFsaWQgYXJndW1lbnQAQXJndW1lbnQgbGlzdCB0b28gbG9uZwBTeW1ib2xpYyBsaW5rIGxvb3AARmlsZW5hbWUgdG9vIGxvbmcAVG9vIG1hbnkgb3BlbiBmaWxlcyBpbiBzeXN0ZW0ATm8gZmlsZSBkZXNjcmlwdG9ycyBhdmFpbGFibGUAQmFkIGZpbGUgZGVzY3JpcHRvcgBObyBjaGlsZCBwcm9jZXNzAEJhZCBhZGRyZXNzAEZpbGUgdG9vIGxhcmdlAFRvbyBtYW55IGxpbmtzAE5vIGxvY2tzIGF2YWlsYWJsZQBSZXNvdXJjZSBkZWFkbG9jayB3b3VsZCBvY2N1cgBTdGF0ZSBub3QgcmVjb3ZlcmFibGUAUHJldmlvdXMgb3duZXIgZGllZABPcGVyYXRpb24gY2FuY2VsZWQARnVuY3Rpb24gbm90IGltcGxlbWVudGVkAE5vIG1lc3NhZ2Ugb2YgZGVzaXJlZCB0eXBlAElkZW50aWZpZXIgcmVtb3ZlZABEZXZpY2Ugbm90IGEgc3RyZWFtAE5vIGRhdGEgYXZhaWxhYmxlAERldmljZSB0aW1lb3V0AE91dCBvZiBzdHJlYW1zIHJlc291cmNlcwBMaW5rIGhhcyBiZWVuIHNldmVyZWQAUHJvdG9jb2wgZXJyb3IAQmFkIG1lc3NhZ2UARmlsZSBkZXNjcmlwdG9yIGluIGJhZCBzdGF0ZQBOb3QgYSBzb2NrZXQARGVzdGluYXRpb24gYWRkcmVzcyByZXF1aXJlZABNZXNzYWdlIHRvbyBsYXJnZQBQcm90b2NvbCB3cm9uZyB0eXBlIGZvciBzb2NrZXQAUHJvdG9jb2wgbm90IGF2YWlsYWJsZQBQcm90b2NvbCBub3Qgc3VwcG9ydGVkAFNvY2tldCB0eXBlIG5vdCBzdXBwb3J0ZWQATm90IHN1cHBvcnRlZABQcm90b2NvbCBmYW1pbHkgbm90IHN1cHBvcnRlZABBZGRyZXNzIGZhbWlseSBub3Qgc3VwcG9ydGVkIGJ5IHByb3RvY29sAEFkZHJlc3Mgbm90IGF2YWlsYWJsZQBOZXR3b3JrIGlzIGRvd24ATmV0d29yayB1bnJlYWNoYWJsZQBDb25uZWN0aW9uIHJlc2V0IGJ5IG5ldHdvcmsAQ29ubmVjdGlvbiBhYm9ydGVkAE5vIGJ1ZmZlciBzcGFjZSBhdmFpbGFibGUAU29ja2V0IGlzIGNvbm5lY3RlZABTb2NrZXQgbm90IGNvbm5lY3RlZABDYW5ub3Qgc2VuZCBhZnRlciBzb2NrZXQgc2h1dGRvd24AT3BlcmF0aW9uIGFscmVhZHkgaW4gcHJvZ3Jlc3MAT3BlcmF0aW9uIGluIHByb2dyZXNzAFN0YWxlIGZpbGUgaGFuZGxlAFJlbW90ZSBJL08gZXJyb3IAUXVvdGEgZXhjZWVkZWQATm8gbWVkaXVtIGZvdW5kAFdyb25nIG1lZGl1bSB0eXBlAE5vIGVycm9yIGluZm9ybWF0aW9uAAB2ZWN0b3IAdGVybWluYXRpbmcgd2l0aCAlcyBleGNlcHRpb24gb2YgdHlwZSAlczogJXMAdGVybWluYXRpbmcgd2l0aCAlcyBleGNlcHRpb24gb2YgdHlwZSAlcwB0ZXJtaW5hdGluZyB3aXRoICVzIGZvcmVpZ24gZXhjZXB0aW9uAHRlcm1pbmF0aW5nAHVuY2F1Z2h0AFN0OWV4Y2VwdGlvbgBOMTBfX2N4eGFiaXYxMTZfX3NoaW1fdHlwZV9pbmZvRQBTdDl0eXBlX2luZm8ATjEwX19jeHhhYml2MTIwX19zaV9jbGFzc190eXBlX2luZm9FAE4xMF9fY3h4YWJpdjExN19fY2xhc3NfdHlwZV9pbmZvRQBwdGhyZWFkX29uY2UgZmFpbHVyZSBpbiBfX2N4YV9nZXRfZ2xvYmFsc19mYXN0KCkAY2Fubm90IGNyZWF0ZSBwdGhyZWFkIGtleSBmb3IgX19jeGFfZ2V0X2dsb2JhbHMoKQBjYW5ub3QgemVybyBvdXQgdGhyZWFkIHZhbHVlIGZvciBfX2N4YV9nZXRfZ2xvYmFscygpAHRlcm1pbmF0ZV9oYW5kbGVyIHVuZXhwZWN0ZWRseSByZXR1cm5lZAB0ZXJtaW5hdGVfaGFuZGxlciB1bmV4cGVjdGVkbHkgdGhyZXcgYW4gZXhjZXB0aW9uAHN0ZDo6YmFkX2FsbG9jAFN0OWJhZF9hbGxvYwBTdDExbG9naWNfZXJyb3IAU3QxMmxlbmd0aF9lcnJvcgBOMTBfX2N4eGFiaXYxMTlfX3BvaW50ZXJfdHlwZV9pbmZvRQBOMTBfX2N4eGFiaXYxMTdfX3BiYXNlX3R5cGVfaW5mb0UATjEwX19jeHhhYml2MTIxX192bWlfY2xhc3NfdHlwZV9pbmZvRQ==";
        var hb=q;q+=16;assert(0==hb%8);function ib(){return!!ib.u}var jb=0,kb=[],G={};function lb(a){if(!a||G[a])return a;for(var b in G)if(G[b].ia===a)return b;return a}function ___cxa_free_exception(a){try{return mb(a)}catch(b){d.printErr("exception during cxa_free_exception: "+b)}}
        function H(){var a=jb;if(!a)return(ma(0),0)|0;var b=G[a],c=b.type;if(!c)return(ma(0),a)|0;var e=Array.prototype.slice.call(arguments);d.___cxa_is_pointer_type(c);H.buffer||(H.buffer=nb(4));ta(H.buffer|0,a|0);a=H.buffer;for(var f=0;f<e.length;f++)if(e[f]&&d.___cxa_can_catch(e[f],c,a))return a=Ba(a|0,4,0)|0,b.ia=a,(ma(e[f]),a)|0;a=Ba(a|0,4,0)|0;return(ma(c),a)|0}
        var I={D:1,s:2,Ic:3,Eb:4,A:5,ha:6,Xa:7,bc:8,S:9,lb:10,da:11,Sc:11,Ca:12,R:13,xb:14,oc:15,T:16,ea:17,Tc:18,V:19,fa:20,M:21,h:22,Xb:23,Ba:24,C:25,Pc:26,yb:27,kc:28,W:29,Fc:30,Qb:31,yc:32,ub:33,Cc:34,fc:42,Bb:43,mb:44,Hb:45,Ib:46,Jb:47,Pb:48,Qc:49,$b:50,Gb:51,rb:35,cc:37,cb:52,gb:53,Uc:54,Yb:55,hb:56,ib:57,sb:35,jb:59,mc:60,ac:61,Mc:62,lc:63,hc:64,ic:65,Ec:66,dc:67,$a:68,Jc:69,nb:70,zc:71,Sb:72,vb:73,fb:74,tc:76,eb:77,Dc:78,Kb:79,Lb:80,Ob:81,Nb:82,Mb:83,nc:38,ga:39,Tb:36,U:40,uc:95,xc:96,qb:104,Zb:105,
            ab:97,Bc:91,rc:88,jc:92,Gc:108,pb:111,Ya:98,ob:103,Wb:101,Ub:100,Nc:110,zb:112,Ab:113,Db:115,bb:114,tb:89,Rb:90,Ac:93,Hc:94,Za:99,Vb:102,Fb:106,pc:107,Oc:109,Rc:87,wb:122,Kc:116,sc:95,ec:123,Cb:84,vc:75,kb:125,qc:131,wc:130,Lc:86},ob={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",
            13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",
            35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",
            54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",
            75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",
            92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",
            109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};function pb(a){d.___errno_location?ta(d.___errno_location()|0,a|0):d.printErr("failed to set errno from JS");return a}
        function qb(a,b){for(var c=0,e=a.length-1;0<=e;e--){var f=a[e];"."===f?a.splice(e,1):".."===f?(a.splice(e,1),c++):c&&(a.splice(e,1),c--)}if(b)for(;c;c--)a.unshift("..");return a}function rb(a){var b="/"===a.charAt(0),c="/"===a.substr(-1);(a=qb(a.split("/").filter(function(a){return!!a}),!b).join("/"))||b||(a=".");a&&c&&(a+="/");return(b?"/":"")+a}
        function sb(a){var b=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);a=b[0];b=b[1];if(!a&&!b)return".";b&&(b=b.substr(0,b.length-1));return a+b}function tb(a){if("/"===a)return"/";var b=a.lastIndexOf("/");return-1===b?a:a.substr(b+1)}function ub(){var a=Array.prototype.slice.call(arguments,0);return rb(a.join("/"))}function K(a,b){return rb(a+"/"+b)}
        function xb(){for(var a="",b=!1,c=arguments.length-1;-1<=c&&!b;c--){b=0<=c?arguments[c]:"/";if("string"!==typeof b)throw new TypeError("Arguments to path.resolve must be strings");if(!b)return"";a=b+"/"+a;b="/"===b.charAt(0)}a=qb(a.split("/").filter(function(a){return!!a}),!b).join("/");return(b?"/":"")+a||"."}var yb=[];function zb(a,b){yb[a]={input:[],output:[],H:b};Ab(a,Bb)}
        var Bb={open:function(a){var b=yb[a.node.rdev];if(!b)throw new L(I.V);a.tty=b;a.seekable=!1},close:function(a){a.tty.H.flush(a.tty)},flush:function(a){a.tty.H.flush(a.tty)},read:function(a,b,c,e){if(!a.tty||!a.tty.H.ta)throw new L(I.ha);for(var f=0,g=0;g<e;g++){try{var l=a.tty.H.ta(a.tty)}catch(t){throw new L(I.A);}if(void 0===l&&0===f)throw new L(I.da);if(null===l||void 0===l)break;f++;b[c+g]=l}f&&(a.node.timestamp=Date.now());return f},write:function(a,b,c,e){if(!a.tty||!a.tty.H.aa)throw new L(I.ha);
                    for(var f=0;f<e;f++)try{a.tty.H.aa(a.tty,b[c+f])}catch(g){throw new L(I.A);}e&&(a.node.timestamp=Date.now());return f}},Db={ta:function(a){if(!a.input.length){var b=null;if(m){var c=new Buffer(256),e=0,f=process.stdin.fd;if("win32"!=process.platform){var g=!1;try{f=fs.openSync("/dev/stdin","r"),g=!0}catch(l){}}try{e=fs.readSync(f,c,0,256,null)}catch(l){if(-1!=l.toString().indexOf("EOF"))e=0;else throw l;}g&&fs.closeSync(f);0<e?b=c.slice(0,e).toString("utf-8"):b=null}else"undefined"!=typeof window&&
                "function"==typeof window.prompt?(b=window.prompt("Input: "),null!==b&&(b+="\n")):"function"==typeof readline&&(b=readline(),null!==b&&(b+="\n"));if(!b)return null;a.input=Cb(b)}return a.input.shift()},aa:function(a,b){null===b||10===b?(d.print(Ia(a.output,0)),a.output=[]):0!=b&&a.output.push(b)},flush:function(a){a.output&&0<a.output.length&&(d.print(Ia(a.output,0)),a.output=[])}},Eb={aa:function(a,b){null===b||10===b?(d.printErr(Ia(a.output,0)),a.output=[]):0!=b&&a.output.push(b)},flush:function(a){a.output&&
                0<a.output.length&&(d.printErr(Ia(a.output,0)),a.output=[])}},M={m:null,j:function(){return M.createNode(null,"/",16895,0)},createNode:function(a,b,c,e){if(24576===(c&61440)||4096===(c&61440))throw new L(I.D);M.m||(M.m={dir:{node:{o:M.c.o,i:M.c.i,lookup:M.c.lookup,J:M.c.J,rename:M.c.rename,unlink:M.c.unlink,rmdir:M.c.rmdir,readdir:M.c.readdir,symlink:M.c.symlink},stream:{v:M.f.v}},file:{node:{o:M.c.o,i:M.c.i},stream:{v:M.f.v,read:M.f.read,write:M.f.write,ja:M.f.ja,wa:M.f.wa,za:M.f.za}},link:{node:{o:M.c.o,
                            i:M.c.i,readlink:M.c.readlink},stream:{}},na:{node:{o:M.c.o,i:M.c.i},stream:Fb}});c=Gb(a,b,c,e);N(c.mode)?(c.c=M.m.dir.node,c.f=M.m.dir.stream,c.b={}):32768===(c.mode&61440)?(c.c=M.m.file.node,c.f=M.m.file.stream,c.g=0,c.b=null):40960===(c.mode&61440)?(c.c=M.m.link.node,c.f=M.m.link.stream):8192===(c.mode&61440)&&(c.c=M.m.na.node,c.f=M.m.na.stream);c.timestamp=Date.now();a&&(a.b[b]=c);return c},Ia:function(a){if(a.b&&a.b.subarray){for(var b=[],c=0;c<a.g;++c)b.push(a.b[c]);return b}return a.b},Yc:function(a){return a.b?
                a.b.subarray?a.b.subarray(0,a.g):new Uint8Array(a.b):new Uint8Array},pa:function(a,b){a.b&&a.b.subarray&&b>a.b.length&&(a.b=M.Ia(a),a.g=a.b.length);if(!a.b||a.b.subarray){var c=a.b?a.b.length:0;c>=b||(b=Math.max(b,c*(1048576>c?2:1.125)|0),0!=c&&(b=Math.max(b,256)),c=a.b,a.b=new Uint8Array(b),0<a.g&&a.b.set(c.subarray(0,a.g),0))}else for(!a.b&&0<b&&(a.b=[]);a.b.length<b;)a.b.push(0)},Sa:function(a,b){if(a.g!=b)if(0==b)a.b=null,a.g=0;else{if(!a.b||a.b.subarray){var c=a.b;a.b=new Uint8Array(new ArrayBuffer(b));
                    c&&a.b.set(c.subarray(0,Math.min(b,a.g)))}else if(a.b||(a.b=[]),a.b.length>b)a.b.length=b;else for(;a.b.length<b;)a.b.push(0);a.g=b}},c:{o:function(a){var b={};b.dev=8192===(a.mode&61440)?a.id:1;b.ino=a.id;b.mode=a.mode;b.nlink=1;b.uid=0;b.gid=0;b.rdev=a.rdev;N(a.mode)?b.size=4096:32768===(a.mode&61440)?b.size=a.g:40960===(a.mode&61440)?b.size=a.link.length:b.size=0;b.atime=new Date(a.timestamp);b.mtime=new Date(a.timestamp);b.ctime=new Date(a.timestamp);b.B=4096;b.blocks=Math.ceil(b.size/b.B);return b},
                    i:function(a,b){void 0!==b.mode&&(a.mode=b.mode);void 0!==b.timestamp&&(a.timestamp=b.timestamp);void 0!==b.size&&M.Sa(a,b.size)},lookup:function(){throw Hb[I.s];},J:function(a,b,c,e){return M.createNode(a,b,c,e)},rename:function(a,b,c){if(N(a.mode)){try{var e=Ib(b,c)}catch(g){}if(e)for(var f in e.b)throw new L(I.ga);}delete a.parent.b[a.name];a.name=c;b.b[c]=a;a.parent=b},unlink:function(a,b){delete a.b[b]},rmdir:function(a,b){var c=Ib(a,b),e;for(e in c.b)throw new L(I.ga);delete a.b[b]},readdir:function(a){var b=
                        [".",".."],c;for(c in a.b)a.b.hasOwnProperty(c)&&b.push(c);return b},symlink:function(a,b,c){a=M.createNode(a,b,41471,0);a.link=c;return a},readlink:function(a){if(40960!==(a.mode&61440))throw new L(I.h);return a.link}},f:{read:function(a,b,c,e,f){var g=a.node.b;if(f>=a.node.g)return 0;a=Math.min(a.node.g-f,e);assert(0<=a);if(8<a&&g.subarray)b.set(g.subarray(f,f+a),c);else for(e=0;e<a;e++)b[c+e]=g[f+e];return a},write:function(a,b,c,e,f,g){if(!e)return 0;a=a.node;a.timestamp=Date.now();if(b.subarray&&
                    (!a.b||a.b.subarray)){if(g)return assert(0===f,"canOwn must imply no weird position inside the file"),a.b=b.subarray(c,c+e),a.g=e;if(0===a.g&&0===f)return a.b=new Uint8Array(b.subarray(c,c+e)),a.g=e;if(f+e<=a.g)return a.b.set(b.subarray(c,c+e),f),e}M.pa(a,f+e);if(a.b.subarray&&b.subarray)a.b.set(b.subarray(c,c+e),f);else for(g=0;g<e;g++)a.b[f+g]=b[c+g];a.g=Math.max(a.g,f+e);return e},v:function(a,b,c){1===c?b+=a.position:2===c&&32768===(a.node.mode&61440)&&(b+=a.node.g);if(0>b)throw new L(I.h);return b},
                    ja:function(a,b,c){M.pa(a.node,b+c);a.node.g=Math.max(a.node.g,b+c)},wa:function(a,b,c,e,f,g,l){if(32768!==(a.node.mode&61440))throw new L(I.V);c=a.node.b;if(l&2||c.buffer!==b&&c.buffer!==b.buffer){if(0<f||f+e<a.node.g)c.subarray?c=c.subarray(f,f+e):c=Array.prototype.slice.call(c,f,f+e);a=!0;e=nb(e);if(!e)throw new L(I.Ca);b.set(c,e)}else a=!1,e=c.byteOffset;return{Ra:e,Vc:a}},za:function(a,b,c,e,f){if(32768!==(a.node.mode&61440))throw new L(I.V);if(f&2)return 0;M.f.write(a,b,0,e,c,!1);return 0}}},
            O={O:!1,Va:function(){O.O=!!process.platform.match(/^win/);var a=process.binding("constants");a.fs&&(a=a.fs);O.qa={1024:a.O_APPEND,64:a.O_CREAT,128:a.O_EXCL,0:a.O_RDONLY,2:a.O_RDWR,4096:a.O_SYNC,512:a.O_TRUNC,1:a.O_WRONLY}},ka:function(a){return Buffer.u?Buffer.from(a):new Buffer(a)},j:function(a){assert(m);return O.createNode(null,"/",O.sa(a.$.root),0)},createNode:function(a,b,c){if(!N(c)&&32768!==(c&61440)&&40960!==(c&61440))throw new L(I.h);a=Gb(a,b,c);a.c=O.c;a.f=O.f;return a},sa:function(a){try{var b=
                    fs.lstatSync(a);O.O&&(b.mode=b.mode|(b.mode&292)>>2)}catch(c){if(!c.code)throw c;throw new L(I[c.code]);}return b.mode},l:function(a){for(var b=[];a.parent!==a;)b.push(a.name),a=a.parent;b.push(a.j.$.root);b.reverse();return ub.apply(null,b)},Ha:function(a){a&=-2656257;var b=0,c;for(c in O.qa)a&c&&(b|=O.qa[c],a^=c);if(a)throw new L(I.h);return b},c:{o:function(a){a=O.l(a);try{var b=fs.lstatSync(a)}catch(c){if(!c.code)throw c;throw new L(I[c.code]);}O.O&&!b.B&&(b.B=4096);O.O&&!b.blocks&&(b.blocks=
                        (b.size+b.B-1)/b.B|0);return{dev:b.dev,ino:b.ino,mode:b.mode,nlink:b.nlink,uid:b.uid,gid:b.gid,rdev:b.rdev,size:b.size,atime:b.atime,mtime:b.mtime,ctime:b.ctime,B:b.B,blocks:b.blocks}},i:function(a,b){var c=O.l(a);try{void 0!==b.mode&&(fs.chmodSync(c,b.mode),a.mode=b.mode),void 0!==b.size&&fs.truncateSync(c,b.size)}catch(e){if(!e.code)throw e;throw new L(I[e.code]);}},lookup:function(a,b){var c=K(O.l(a),b);c=O.sa(c);return O.createNode(a,b,c)},J:function(a,b,c,e){a=O.createNode(a,b,c,e);b=O.l(a);
                        try{N(a.mode)?fs.mkdirSync(b,a.mode):fs.writeFileSync(b,"",{mode:a.mode})}catch(f){if(!f.code)throw f;throw new L(I[f.code]);}return a},rename:function(a,b,c){a=O.l(a);b=K(O.l(b),c);try{fs.renameSync(a,b)}catch(e){if(!e.code)throw e;throw new L(I[e.code]);}},unlink:function(a,b){a=K(O.l(a),b);try{fs.unlinkSync(a)}catch(c){if(!c.code)throw c;throw new L(I[c.code]);}},rmdir:function(a,b){a=K(O.l(a),b);try{fs.rmdirSync(a)}catch(c){if(!c.code)throw c;throw new L(I[c.code]);}},readdir:function(a){a=O.l(a);
                        try{return fs.readdirSync(a)}catch(b){if(!b.code)throw b;throw new L(I[b.code]);}},symlink:function(a,b,c){a=K(O.l(a),b);try{fs.symlinkSync(c,a)}catch(e){if(!e.code)throw e;throw new L(I[e.code]);}},readlink:function(a){var b=O.l(a);try{return b=fs.readlinkSync(b),b=Jb.relative(Jb.resolve(a.j.$.root),b)}catch(c){if(!c.code)throw c;throw new L(I[c.code]);}}},f:{open:function(a){var b=O.l(a.node);try{32768===(a.node.mode&61440)&&(a.L=fs.openSync(b,O.Ha(a.flags)))}catch(c){if(!c.code)throw c;throw new L(I[c.code]);
                    }},close:function(a){try{32768===(a.node.mode&61440)&&a.L&&fs.closeSync(a.L)}catch(b){if(!b.code)throw b;throw new L(I[b.code]);}},read:function(a,b,c,e,f){if(0===e)return 0;try{return fs.readSync(a.L,O.ka(b.buffer),c,e,f)}catch(g){throw new L(I[g.code]);}},write:function(a,b,c,e,f){try{return fs.writeSync(a.L,O.ka(b.buffer),c,e,f)}catch(g){throw new L(I[g.code]);}},v:function(a,b,c){if(1===c)b+=a.position;else if(2===c&&32768===(a.node.mode&61440))try{b+=fs.fstatSync(a.L).size}catch(e){throw new L(I[e.code]);
                    }if(0>b)throw new L(I.h);return b}}};q+=16;q+=16;q+=16;var Kb=null,Lb={},P=[],Mb=1,Q=null,Nb=!0,R={},L=null,Hb={};
        function S(a,b){a=xb("/",a);b=b||{};if(!a)return{path:"",node:null};var c={ra:!0,ba:0},e;for(e in c)void 0===b[e]&&(b[e]=c[e]);if(8<b.ba)throw new L(I.U);a=qb(a.split("/").filter(function(a){return!!a}),!1);var f=Kb;c="/";for(e=0;e<a.length;e++){var g=e===a.length-1;if(g&&b.parent)break;f=Ib(f,a[e]);c=K(c,a[e]);f.K&&(!g||g&&b.ra)&&(f=f.K.root);if(!g||b.I)for(g=0;40960===(f.mode&61440);)if(f=Ob(c),c=xb(sb(c),f),f=S(c,{ba:b.ba}).node,40<g++)throw new L(I.U);}return{path:c,node:f}}
        function T(a){for(var b;;){if(a===a.parent)return a=a.j.ya,b?"/"!==a[a.length-1]?a+"/"+b:a+b:a;b=b?a.name+"/"+b:a.name;a=a.parent}}function Pb(a,b){for(var c=0,e=0;e<b.length;e++)c=(c<<5)-c+b.charCodeAt(e)|0;return(a+c>>>0)%Q.length}function Qb(a){var b=Pb(a.parent.id,a.name);a.G=Q[b];Q[b]=a}function Ib(a,b){var c;if(c=(c=Rb(a,"x"))?c:a.c.lookup?0:I.R)throw new L(c,a);for(c=Q[Pb(a.id,b)];c;c=c.G){var e=c.name;if(c.parent.id===a.id&&e===b)return c}return a.c.lookup(a,b)}
        function Gb(a,b,c,e){Sb||(Sb=function(a,b,c,e){a||(a=this);this.parent=a;this.j=a.j;this.K=null;this.id=Mb++;this.name=b;this.mode=c;this.c={};this.f={};this.rdev=e},Sb.prototype={},Object.defineProperties(Sb.prototype,{read:{get:function(){return 365===(this.mode&365)},set:function(a){a?this.mode|=365:this.mode&=-366}},write:{get:function(){return 146===(this.mode&146)},set:function(a){a?this.mode|=146:this.mode&=-147}},La:{get:function(){return N(this.mode)}},Ka:{get:function(){return 8192===(this.mode&
                    61440)}}}));a=new Sb(a,b,c,e);Qb(a);return a}function N(a){return 16384===(a&61440)}var Tb={r:0,rs:1052672,"r+":2,w:577,wx:705,xw:705,"w+":578,"wx+":706,"xw+":706,a:1089,ax:1217,xa:1217,"a+":1090,"ax+":1218,"xa+":1218};function Ub(a){var b=["r","w","rw"][a&3];a&512&&(b+="w");return b}function Rb(a,b){if(Nb)return 0;if(-1===b.indexOf("r")||a.mode&292){if(-1!==b.indexOf("w")&&!(a.mode&146)||-1!==b.indexOf("x")&&!(a.mode&73))return I.R}else return I.R;return 0}
        function Vb(a,b){try{return Ib(a,b),I.ea}catch(c){}return Rb(a,"wx")}function Wb(){var a=4096;for(var b=0;b<=a;b++)if(!P[b])return b;throw new L(I.Ba);}function Xb(a){Yb||(Yb=function(){},Yb.prototype={},Object.defineProperties(Yb.prototype,{object:{get:function(){return this.node},set:function(a){this.node=a}}}));var b=new Yb,c;for(c in a)b[c]=a[c];a=b;b=Wb();a.fd=b;return P[b]=a}var Fb={open:function(a){a.f=Lb[a.node.rdev].f;a.f.open&&a.f.open(a)},v:function(){throw new L(I.W);}};
        function Ab(a,b){Lb[a]={f:b}}function Zb(a,b){var c="/"===b,e=!b;if(c&&Kb)throw new L(I.T);if(!c&&!e){var f=S(b,{ra:!1});b=f.path;f=f.node;if(f.K)throw new L(I.T);if(!N(f.mode))throw new L(I.fa);}b={type:a,$:{},ya:b,Na:[]};a=a.j(b);a.j=b;b.root=a;c?Kb=a:f&&(f.K=b,f.j&&f.j.Na.push(b))}function $b(a,b,c){var e=S(a,{parent:!0}).node;a=tb(a);if(!a||"."===a||".."===a)throw new L(I.h);var f=Vb(e,a);if(f)throw new L(f);if(!e.c.J)throw new L(I.D);return e.c.J(e,a,b,c)}
        function U(a,b){return $b(a,(void 0!==b?b:511)&1023|16384,0)}function ac(a,b,c){"undefined"===typeof c&&(c=b,b=438);return $b(a,b|8192,c)}function bc(a,b){if(!xb(a))throw new L(I.s);var c=S(b,{parent:!0}).node;if(!c)throw new L(I.s);b=tb(b);var e=Vb(c,b);if(e)throw new L(e);if(!c.c.symlink)throw new L(I.D);return c.c.symlink(c,b,a)}
        function cc(a){var b=S(a,{parent:!0}).node,c=tb(a),e=Ib(b,c);a:{try{var f=Ib(b,c)}catch(l){f=l.F;break a}var g=Rb(b,"wx");f=g?g:N(f.mode)?I.M:0}if(f)throw new L(f);if(!b.c.unlink)throw new L(I.D);if(e.K)throw new L(I.T);try{R.willDeletePath&&R.willDeletePath(a)}catch(l){console.log("FS.trackingDelegate['willDeletePath']('"+a+"') threw an exception: "+l.message)}b.c.unlink(b,c);b=Pb(e.parent.id,e.name);if(Q[b]===e)Q[b]=e.G;else for(b=Q[b];b;){if(b.G===e){b.G=e.G;break}b=b.G}try{if(R.onDeletePath)R.onDeletePath(a)}catch(l){console.log("FS.trackingDelegate['onDeletePath']('"+
            a+"') threw an exception: "+l.message)}}function Ob(a){a=S(a).node;if(!a)throw new L(I.s);if(!a.c.readlink)throw new L(I.h);return xb(T(a.parent),a.c.readlink(a))}function dc(a,b){var c;"string"===typeof a?c=S(a,{I:!0}).node:c=a;if(!c.c.i)throw new L(I.D);c.c.i(c,{mode:b&4095|c.mode&-4096,timestamp:Date.now()})}
        function ec(a,b){if(""===a)throw new L(I.s);if("string"===typeof b){var c=Tb[b];if("undefined"===typeof c)throw Error("Unknown file open mode: "+b);b=c}var e=b&64?("undefined"===typeof e?438:e)&4095|32768:0;if("object"===typeof a)var f=a;else{a=rb(a);try{f=S(a,{I:!(b&131072)}).node}catch(l){}}c=!1;if(b&64)if(f){if(b&128)throw new L(I.ea);}else f=$b(a,e,0),c=!0;if(!f)throw new L(I.s);8192===(f.mode&61440)&&(b&=-513);if(b&65536&&!N(f.mode))throw new L(I.fa);if(!c&&(e=f?40960===(f.mode&61440)?I.U:N(f.mode)&&
        ("r"!==Ub(b)||b&512)?I.M:Rb(f,Ub(b)):I.s))throw new L(e);if(b&512){e=f;var g;"string"===typeof e?g=S(e,{I:!0}).node:g=e;if(!g.c.i)throw new L(I.D);if(N(g.mode))throw new L(I.M);if(32768!==(g.mode&61440))throw new L(I.h);if(e=Rb(g,"w"))throw new L(e);g.c.i(g,{size:0,timestamp:Date.now()})}b&=-641;f=Xb({node:f,path:T(f),flags:b,seekable:!0,position:0,f:f.f,Wa:[],error:!1});f.f.open&&f.f.open(f);!d.logReadFiles||b&1||(fc||(fc={}),a in fc||(fc[a]=1,d.printErr("read file: "+a)));try{R.onOpenFile&&(g=0,
        1!==(b&2097155)&&(g|=1),0!==(b&2097155)&&(g|=2),R.onOpenFile(a,g))}catch(l){console.log("FS.trackingDelegate['onOpenFile']('"+a+"', flags) threw an exception: "+l.message)}return f}function hc(a){a.Y&&(a.Y=null);try{a.f.close&&a.f.close(a)}catch(b){throw b;}finally{P[a.fd]=null}}function ic(a,b,c){if(!a.seekable||!a.f.v)throw new L(I.W);a.position=a.f.v(a,b,c);a.Wa=[];return a.position}
        function jc(a,b,c,e,f,g){if(0>e||0>f)throw new L(I.h);if(0===(a.flags&2097155))throw new L(I.S);if(N(a.node.mode))throw new L(I.M);if(!a.f.write)throw new L(I.h);a.flags&1024&&(f=ic(a,0,2));var l=!0;if("undefined"===typeof f)f=a.position,l=!1;else if(!a.seekable)throw new L(I.W);b=a.f.write(a,b,c,e,f,g);l||(a.position+=b);try{if(a.path&&R.onWriteToFile)R.onWriteToFile(a.path)}catch(t){console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: "+t.message)}return b}
        function kc(){L||(L=function(a,b){this.node=b;this.Ua=function(a){this.F=a;for(var b in I)if(I[b]===a){this.code=b;break}};this.Ua(a);this.message=ob[a];this.stack&&Object.defineProperty(this,"stack",{value:Error().stack,writable:!0});this.stack&&(this.stack=Ka(this.stack))},L.prototype=Error(),L.prototype.constructor=L,[I.s].forEach(function(a){Hb[a]=new L(a);Hb[a].stack="<generic error, no stack>"}))}var lc;function mc(a,b){var c=0;a&&(c|=365);b&&(c|=146);return c}
        function nc(a,b,c,e){a=K("string"===typeof a?a:T(a),b);return U(a,mc(c,e))}function oc(a,b){a="string"===typeof a?a:T(a);for(b=b.split("/").reverse();b.length;){var c=b.pop();if(c){var e=K(a,c);try{U(e)}catch(f){}a=e}}return e}function pc(a,b,c,e){a=K("string"===typeof a?a:T(a),b);c=mc(c,e);return $b(a,(void 0!==c?c:438)&4095|32768,0)}
        function qc(a,b,c,e,f,g){a=b?K("string"===typeof a?a:T(a),b):a;e=mc(e,f);f=$b(a,(void 0!==e?e:438)&4095|32768,0);if(c){if("string"===typeof c){a=Array(c.length);b=0;for(var l=c.length;b<l;++b)a[b]=c.charCodeAt(b);c=a}dc(f,e|146);a=ec(f,"w");jc(a,c,0,c.length,0,g);hc(a);dc(f,e)}return f}
        function V(a,b,c,e){a=K("string"===typeof a?a:T(a),b);b=mc(!!c,!!e);V.va||(V.va=64);var f=V.va++<<8|0;Ab(f,{open:function(a){a.seekable=!1},close:function(){e&&e.buffer&&e.buffer.length&&e(10)},read:function(a,b,e,f){for(var g=0,l=0;l<f;l++){try{var t=c()}catch(Ta){throw new L(I.A);}if(void 0===t&&0===g)throw new L(I.da);if(null===t||void 0===t)break;g++;b[e+l]=t}g&&(a.node.timestamp=Date.now());return g},write:function(a,b,c,f){for(var g=0;g<f;g++)try{e(b[c+g])}catch(ia){throw new L(I.A);}f&&(a.node.timestamp=
                Date.now());return g}});return ac(a,b,f)}function rc(a,b,c){a=K("string"===typeof a?a:T(a),b);return bc(c,a)}
        function sc(a){if(a.Ka||a.La||a.link||a.b)return!0;var b=!0;if("undefined"!==typeof XMLHttpRequest)throw Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");if(d.read)try{a.b=Cb(d.read(a.url)),a.g=a.b.length}catch(c){b=!1}else throw Error("Cannot load without read() or XMLHttpRequest.");b||pb(I.A);return b}
        function tc(a,b,c,e,f){function g(){this.Z=!1;this.N=[]}g.prototype.get=function(a){if(!(a>this.length-1||0>a)){var b=a%this.chunkSize;return this.ua(a/this.chunkSize|0)[b]}};g.prototype.Ta=function(a){this.ua=a};g.prototype.la=function(){var a=new XMLHttpRequest;a.open("HEAD",c,!1);a.send(null);if(!(200<=a.status&&300>a.status||304===a.status))throw Error("Couldn't load "+c+". Status: "+a.status);var b=Number(a.getResponseHeader("Content-length")),e,f=(e=a.getResponseHeader("Accept-Ranges"))&&"bytes"===
            e;a=(e=a.getResponseHeader("Content-Encoding"))&&"gzip"===e;var g=1048576;f||(g=b);var l=this;l.Ta(function(a){var e=a*g,f=(a+1)*g-1;f=Math.min(f,b-1);if("undefined"===typeof l.N[a]){var t=l.N;if(e>f)throw Error("invalid range ("+e+", "+f+") or no bytes requested!");if(f>b-1)throw Error("only "+b+" bytes available! programmer error!");var u=new XMLHttpRequest;u.open("GET",c,!1);b!==g&&u.setRequestHeader("Range","bytes="+e+"-"+f);"undefined"!=typeof Uint8Array&&(u.responseType="arraybuffer");u.overrideMimeType&&
        u.overrideMimeType("text/plain; charset=x-user-defined");u.send(null);if(!(200<=u.status&&300>u.status||304===u.status))throw Error("Couldn't load "+c+". Status: "+u.status);e=void 0!==u.response?new Uint8Array(u.response||[]):Cb(u.responseText||"");t[a]=e}if("undefined"===typeof l.N[a])throw Error("doXHR failed!");return l.N[a]});if(a||!b)g=b=1,g=b=this.ua(0).length,console.log("LazyFiles on gzip forces download of the whole file when length is accessed");this.Ea=b;this.Da=g;this.Z=!0};if("undefined"!==
            typeof XMLHttpRequest){if(!k)throw"Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";var l=new g;Object.defineProperties(l,{length:{get:function(){this.Z||this.la();return this.Ea}},chunkSize:{get:function(){this.Z||this.la();return this.Da}}});var t=void 0}else t=c,l=void 0;var u=pc(a,b,e,f);l?u.b=l:t&&(u.b=null,u.url=t);Object.defineProperties(u,{g:{get:function(){return this.b.length}}});var J={};Object.keys(u.f).forEach(function(a){var b=
            u.f[a];J[a]=function(){if(!sc(u))throw new L(I.A);return b.apply(null,arguments)}});J.read=function(a,b,c,e,f){if(!sc(u))throw new L(I.A);a=a.node.b;if(f>=a.length)return 0;e=Math.min(a.length-f,e);assert(0<=e);if(a.slice)for(var g=0;g<e;g++)b[c+g]=a[f+g];else for(g=0;g<e;g++)b[c+g]=a.get(f+g);return e};u.f=J;return u}
        function uc(a,b,c,e,f,g,l,t,u,J){function ia(c){function ia(c){J&&J();t||qc(a,b,c,e,f,u);g&&g();fb(Ta)}var wb=!1;d.preloadPlugins.forEach(function(a){!wb&&a.canHandle(vb)&&(a.handle(c,vb,ia,function(){l&&l();fb(Ta)}),wb=!0)});wb||ia(c)}Browser.Zc();var vb=b?xb(K(a,b)):a,Ta=db("cp "+vb);eb(Ta);"string"==typeof c?Browser.Wc(c,function(a){ia(a)},l):ia(c)}var FS={},Sb,Yb,fc,vc=0;function W(){vc+=4;return Ba(vc-4|0,4,0)|0}function wc(){var a=P[W()];if(!a)throw new L(I.S);return a}
        var X=[8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,
            0,3,0,1,0,2,0,1,0],xc=void 0,yc,zc;"number"===typeof X?(yc=!0,zc=X):(yc=!1,zc=X.length);var Y;Y=na(Math.max(zc,1));if(yc){var Ac;xc=Y;assert(0==(Y&3));for(Ac=Y+(zc&-4);xc<Ac;xc+=4)r[xc>>2]=0;for(Ac=Y+zc;xc<Ac;)x[xc++>>0]=0}else X.subarray||X.slice?y.set(X,Y):y.set(new Uint8Array(X),Y);var Bc={},Cc=1;function Dc(a,b){Dc.u||(Dc.u={});a in Dc.u||(d.dynCall_v(b),Dc.u[a]=1)}kc();Q=Array(4096);Zb(M,"/");U("/tmp");U("/home");U("/home/web_user");
        (function(){U("/dev");Ab(259,{read:function(){return 0},write:function(a,b,f,g){return g}});ac("/dev/null",259);zb(1280,Db);zb(1536,Eb);ac("/dev/tty",1280);ac("/dev/tty1",1536);if("undefined"!==typeof crypto){var a=new Uint8Array(1);var b=function(){crypto.getRandomValues(a);return a[0]}}else b=m?function(){return require("crypto").randomBytes(1)[0]}:function(){return 256*Math.random()|0};V("/dev","random",b);V("/dev","urandom",b);U("/dev/shm");U("/dev/shm/tmp")})();U("/proc");U("/proc/self");U("/proc/self/fd");
        Zb({j:function(){var a=Gb("/proc/self","fd",16895,73);a.c={lookup:function(a,c){var b=P[+c];if(!b)throw new L(I.S);a={parent:null,j:{ya:"fake"},c:{readlink:function(){return b.path}}};return a.parent=a}};return a}},"/proc/self/fd");
        Wa.unshift(function(){if(!d.noFSInit&&!lc){assert(!lc,"FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");lc=!0;kc();d.stdin=d.stdin;d.stdout=d.stdout;d.stderr=d.stderr;d.stdin?V("/dev","stdin",d.stdin):bc("/dev/tty","/dev/stdin");d.stdout?V("/dev","stdout",null,d.stdout):bc("/dev/tty","/dev/stdout");d.stderr?V("/dev","stderr",null,d.stderr):bc("/dev/tty1","/dev/stderr");var a=
            ec("/dev/stdin","r");assert(0===a.fd,"invalid handle for stdin ("+a.fd+")");a=ec("/dev/stdout","w");assert(1===a.fd,"invalid handle for stdout ("+a.fd+")");a=ec("/dev/stderr","w");assert(2===a.fd,"invalid handle for stderr ("+a.fd+")")}});Xa.push(function(){Nb=!1});Ya.push(function(){lc=!1;var a=d._fflush;a&&a(0);for(a=0;a<P.length;a++){var b=P[a];b&&hc(b)}});d.FS_createFolder=nc;d.FS_createPath=oc;d.FS_createDataFile=qc;d.FS_createPreloadedFile=uc;d.FS_createLazyFile=tc;d.FS_createLink=rc;
        d.FS_createDevice=V;d.FS_unlink=cc;Wa.unshift(function(){});Ya.push(function(){});if(m){var fs=require("fs"),Jb=require("path");O.Va()}v=na(4);Na=Oa=pa(q);A=Na+Sa;Pa=pa(A);r[v>>2]=Pa;oa=!0;assert(Pa<w,"TOTAL_MEMORY not big enough for stack");var Ec=!0;
        function Cb(a){for(var b=0,c=0;c<a.length;++c){var e=a.charCodeAt(c);55296<=e&&57343>=e&&(e=65536+((e&1023)<<10)|a.charCodeAt(++c)&1023);127>=e?++b:b=2047>=e?b+2:65535>=e?b+3:2097151>=e?b+4:67108863>=e?b+5:b+6}b=Array(b+1);a=Ea(a,b,0,b.length);b.length=a;return b}function ha(a){for(var b=[],c=0;c<a.length;c++){var e=a[c];255<e&&(Ec&&assert(!1,"Character code "+e+" ("+String.fromCharCode(e)+")  at offset "+c+" not in 0x00-0xFF."),e&=255);b.push(String.fromCharCode(e))}return b.join("")}
        var Fc="function"===typeof atob?atob:function(a){var b="",c=0;a=a.replace(/[^A-Za-z0-9\+\/=]/g,"");do{var e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(c++));var f="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(c++));var g="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(c++));var l="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(c++));e=e<<2|f>>4;
            f=(f&15)<<4|g>>2;var t=(g&3)<<6|l;b+=String.fromCharCode(e);64!==g&&(b+=String.fromCharCode(f));64!==l&&(b+=String.fromCharCode(t))}while(c<a.length);return b};
        function n(a){if(String.prototype.startsWith?a.startsWith(gb):0===a.indexOf(gb)){a=a.slice(gb.length);if("boolean"===typeof m&&m){try{var b=Buffer.from(a,"base64")}catch(g){b=new Buffer(a,"base64")}var c=new Uint8Array(b.buffer,b.byteOffset,b.byteLength)}else try{var e=Fc(a),f=new Uint8Array(e.length);for(b=0;b<e.length;++b)f[b]=e.charCodeAt(b);c=f}catch(g){throw Error("Converting base64 string to bytes failed.");}return c}}
        d.Fa={Math:Math,Int8Array:Int8Array,Int16Array:Int16Array,Int32Array:Int32Array,Uint8Array:Uint8Array,Uint16Array:Uint16Array,Uint32Array:Uint32Array,Float32Array:Float32Array,Float64Array:Float64Array,NaN:NaN,Infinity:Infinity};
        d.Ga={abort:p,assert:assert,enlargeMemory:function(){Ra()},getTotalMemory:function(){return w},abortOnCannotGrowMemory:Ra,abortStackOverflow:function(a){p("Stack overflow! Attempted to allocate "+a+" bytes on the stack, but stack has only "+(A-ja()+a)+" bytes available!")},segfault:function(){p("segmentation fault")},alignfault:function(){p("alignment fault")},ftfault:function(){p("Function table mask error")},nullFunc_i:function(a){d.printErr("Invalid function pointer called with signature 'i'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
                d.printErr("Build with ASSERTIONS=2 for more info.");p(a)},nullFunc_ii:function(a){d.printErr("Invalid function pointer called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");d.printErr("Build with ASSERTIONS=2 for more info.");
                p(a)},nullFunc_iii:function(a){d.printErr("Invalid function pointer called with signature 'iii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");d.printErr("Build with ASSERTIONS=2 for more info.");p(a)},nullFunc_iiii:function(a){d.printErr("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
                d.printErr("Build with ASSERTIONS=2 for more info.");p(a)},nullFunc_iiiii:function(a){d.printErr("Invalid function pointer called with signature 'iiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");d.printErr("Build with ASSERTIONS=2 for more info.");
                p(a)},nullFunc_v:function(a){d.printErr("Invalid function pointer called with signature 'v'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");d.printErr("Build with ASSERTIONS=2 for more info.");p(a)},nullFunc_vi:function(a){d.printErr("Invalid function pointer called with signature 'vi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
                d.printErr("Build with ASSERTIONS=2 for more info.");p(a)},nullFunc_vid:function(a){d.printErr("Invalid function pointer called with signature 'vid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");d.printErr("Build with ASSERTIONS=2 for more info.");
                p(a)},nullFunc_vii:function(a){d.printErr("Invalid function pointer called with signature 'vii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");d.printErr("Build with ASSERTIONS=2 for more info.");p(a)},nullFunc_viii:function(a){d.printErr("Invalid function pointer called with signature 'viii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
                d.printErr("Build with ASSERTIONS=2 for more info.");p(a)},nullFunc_viiii:function(a){d.printErr("Invalid function pointer called with signature 'viiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");d.printErr("Build with ASSERTIONS=2 for more info.");
                p(a)},nullFunc_viiiii:function(a){d.printErr("Invalid function pointer called with signature 'viiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");d.printErr("Build with ASSERTIONS=2 for more info.");p(a)},nullFunc_viiiiii:function(a){d.printErr("Invalid function pointer called with signature 'viiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
                d.printErr("Build with ASSERTIONS=2 for more info.");p(a)},invoke_i:function(a){try{return d.dynCall_i(a)}catch(b){if("number"!==typeof b&&"longjmp"!==b)throw b;d.setThrew(1,0)}},invoke_ii:function(a,b){try{return d.dynCall_ii(a,b)}catch(c){if("number"!==typeof c&&"longjmp"!==c)throw c;d.setThrew(1,0)}},invoke_iii:function(a,b,c){try{return d.dynCall_iii(a,b,c)}catch(e){if("number"!==typeof e&&"longjmp"!==e)throw e;d.setThrew(1,0)}},invoke_iiii:function(a,b,c,e){try{return d.dynCall_iiii(a,b,c,e)}catch(f){if("number"!==
                typeof f&&"longjmp"!==f)throw f;d.setThrew(1,0)}},invoke_iiiii:function(a,b,c,e,f){try{return d.dynCall_iiiii(a,b,c,e,f)}catch(g){if("number"!==typeof g&&"longjmp"!==g)throw g;d.setThrew(1,0)}},invoke_v:function(a){try{d.dynCall_v(a)}catch(b){if("number"!==typeof b&&"longjmp"!==b)throw b;d.setThrew(1,0)}},invoke_vi:function(a,b){try{d.dynCall_vi(a,b)}catch(c){if("number"!==typeof c&&"longjmp"!==c)throw c;d.setThrew(1,0)}},invoke_vid:function(a,b,c){try{d.dynCall_vid(a,b,c)}catch(e){if("number"!==
                typeof e&&"longjmp"!==e)throw e;d.setThrew(1,0)}},invoke_vii:function(a,b,c){try{d.dynCall_vii(a,b,c)}catch(e){if("number"!==typeof e&&"longjmp"!==e)throw e;d.setThrew(1,0)}},invoke_viii:function(a,b,c,e){try{d.dynCall_viii(a,b,c,e)}catch(f){if("number"!==typeof f&&"longjmp"!==f)throw f;d.setThrew(1,0)}},invoke_viiii:function(a,b,c,e,f){try{d.dynCall_viiii(a,b,c,e,f)}catch(g){if("number"!==typeof g&&"longjmp"!==g)throw g;d.setThrew(1,0)}},invoke_viiiii:function(a,b,c,e,f,g){try{d.dynCall_viiiii(a,
                b,c,e,f,g)}catch(l){if("number"!==typeof l&&"longjmp"!==l)throw l;d.setThrew(1,0)}},invoke_viiiiii:function(a,b,c,e,f,g,l){try{d.dynCall_viiiiii(a,b,c,e,f,g,l)}catch(t){if("number"!==typeof t&&"longjmp"!==t)throw t;d.setThrew(1,0)}},__ZSt18uncaught_exceptionv:ib,___assert_fail:function(a,b,c,e){p("Assertion failed: "+Ha(a)+", at: "+[b?Ha(b):"unknown filename",c,e?Ha(e):"unknown function"])},___cxa_allocate_exception:function(a){return nb(a)},___cxa_begin_catch:function(a){var b=G[a];b&&!b.ma&&(b.ma=
                !0,ib.u--);b&&(b.Aa=!1);kb.push(a);(b=lb(a))&&G[b].P++;return a},___cxa_end_catch:function(){d.setThrew(0);var a=kb.pop();if(a){if(a=lb(a)){var b=G[a];assert(0<b.P);b.P--;0!==b.P||b.Aa||(b.oa&&d.dynCall_vi(b.oa,a),delete G[a],___cxa_free_exception(a))}jb=0}},___cxa_find_matching_catch:H,___cxa_find_matching_catch_2:function(){return H.apply(null,arguments)},___cxa_find_matching_catch_3:function(){return H.apply(null,arguments)},___cxa_free_exception:___cxa_free_exception,___cxa_pure_virtual:function(){Da=
                !0;throw"Pure virtual function called!";},___cxa_throw:function(a,b,c){G[a]={Ra:a,ia:a,type:b,oa:c,P:0,ma:!1,Aa:!1};jb=a;"uncaught_exception"in ib?ib.u++:ib.u=1;throw a;},___gxx_personality_v0:function(){},___lock:function(){},___resumeException:function(a){jb||(jb=a);throw a;},___setErrNo:pb,___syscall140:function(a,b){vc=b;try{var c=wc();W();var e=W(),f=W(),g=W();ic(c,e,g);ta(f|0,c.position|0);c.Y&&0===e&&0===g&&(c.Y=null);return 0}catch(l){return"undefined"!==typeof FS&&l instanceof L||p(l),-l.F}},
            ___syscall146:function(a,b){vc=b;try{var c=wc(),e=W();a:{var f=W();for(b=a=0;b<f;b++){var g=Ba(e+8*b|0,4,0)|0,l=Ba(e+(8*b+4)|0,4,0)|0,t=jc(c,x,g,l,void 0);if(0>t){var u=-1;break a}a+=t}u=a}return u}catch(J){return"undefined"!==typeof FS&&J instanceof L||p(J),-J.F}},___syscall54:function(a,b){vc=b;try{var c=wc(),e=W();switch(e){case 21509:case 21505:return c.tty?0:-I.C;case 21510:case 21511:case 21512:case 21506:case 21507:case 21508:return c.tty?0:-I.C;case 21519:if(!c.tty)return-I.C;var f=W();ta(f|
                0,0);return 0;case 21520:return c.tty?-I.h:-I.C;case 21531:a=f=W();if(!c.f.Ja)throw new L(I.C);return c.f.Ja(c,e,a);case 21523:return c.tty?0:-I.C;default:p("bad ioctl syscall "+e)}}catch(g){return"undefined"!==typeof FS&&g instanceof L||p(g),-g.F}},___syscall6:function(a,b){vc=b;try{var c=wc();hc(c);return 0}catch(e){return"undefined"!==typeof FS&&e instanceof L||p(e),-e.F}},___unlock:function(){},_abort:function(){d.abort()},_emscripten_memcpy_big:function(a,b,c){y.set(y.subarray(b,b+c),a);return a},
            _llvm_eh_typeid_for:function(a){return a},_llvm_pow_f64:ab,_pthread_getspecific:function(a){return Bc[a]||0},_pthread_key_create:function(a){if(0==a)return I.h;ta(a|0,Cc|0);Bc[Cc]=0;Cc++;return 0},_pthread_once:Dc,_pthread_setspecific:function(a,b){if(!(a in Bc))return I.h;Bc[a]=b;return 0},DYNAMICTOP_PTR:v,tempDoublePtr:hb,ABORT:Da,STACKTOP:Oa,STACK_MAX:A,cttz_i8:Y};// EMSCRIPTEN_START_ASM
        var Z=(/** @suppress {uselessCode} */ function(global,env,buffer) {
            "use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.DYNAMICTOP_PTR|0;var j=env.tempDoublePtr|0;var k=env.ABORT|0;var l=env.STACKTOP|0;var m=env.STACK_MAX|0;var n=env.cttz_i8|0;var o=0;var p=0;var q=0;var r=0;var s=global.NaN,t=global.Infinity;var u=0,v=0,w=0,x=0,y=0.0;var z=0;var A=global.Math.floor;var B=global.Math.abs;var C=global.Math.sqrt;var D=global.Math.pow;var E=global.Math.cos;var F=global.Math.sin;var G=global.Math.tan;var H=global.Math.acos;var I=global.Math.asin;var J=global.Math.atan;var K=global.Math.atan2;var L=global.Math.exp;var M=global.Math.log;var N=global.Math.ceil;var O=global.Math.imul;var P=global.Math.min;var Q=global.Math.max;var R=global.Math.clz32;var S=env.abort;var T=env.assert;var U=env.enlargeMemory;var V=env.getTotalMemory;var W=env.abortOnCannotGrowMemory;var X=env.abortStackOverflow;var Y=env.segfault;var Z=env.alignfault;var _=env.ftfault;var $=env.nullFunc_i;var aa=env.nullFunc_ii;var ba=env.nullFunc_iii;var ca=env.nullFunc_iiii;var da=env.nullFunc_iiiii;var ea=env.nullFunc_v;var fa=env.nullFunc_vi;var ga=env.nullFunc_vid;var ha=env.nullFunc_vii;var ia=env.nullFunc_viii;var ja=env.nullFunc_viiii;var ka=env.nullFunc_viiiii;var la=env.nullFunc_viiiiii;var ma=env.invoke_i;var na=env.invoke_ii;var oa=env.invoke_iii;var pa=env.invoke_iiii;var qa=env.invoke_iiiii;var ra=env.invoke_v;var sa=env.invoke_vi;var ta=env.invoke_vid;var ua=env.invoke_vii;var va=env.invoke_viii;var wa=env.invoke_viiii;var xa=env.invoke_viiiii;var ya=env.invoke_viiiiii;var za=env.__ZSt18uncaught_exceptionv;var Aa=env.___assert_fail;var Ba=env.___cxa_allocate_exception;var Ca=env.___cxa_begin_catch;var Da=env.___cxa_end_catch;var Ea=env.___cxa_find_matching_catch;var Fa=env.___cxa_find_matching_catch_2;var Ga=env.___cxa_find_matching_catch_3;var Ha=env.___cxa_free_exception;var Ia=env.___cxa_pure_virtual;var Ja=env.___cxa_throw;var Ka=env.___gxx_personality_v0;var La=env.___lock;var Ma=env.___resumeException;var Na=env.___setErrNo;var Oa=env.___syscall140;var Pa=env.___syscall146;var Qa=env.___syscall54;var Ra=env.___syscall6;var Sa=env.___unlock;var Ta=env._abort;var Ua=env._emscripten_memcpy_big;var Va=env._llvm_eh_typeid_for;var Wa=env._llvm_pow_f64;var Xa=env._pthread_getspecific;var Ya=env._pthread_key_create;var Za=env._pthread_once;var _a=env._pthread_setspecific;var $a=0.0;
// EMSCRIPTEN_START_FUNCS
            function nb(a){a=a|0;var b=0;b=l;l=l+a|0;l=l+15&-16;if((l|0)>=(m|0))X(a|0);return b|0}function ob(){return l|0}function pb(a){a=a|0;l=a}function qb(a,b){a=a|0;b=b|0;l=a;m=b}function rb(a,b){a=a|0;b=b|0;if(!o){o=a;p=b}}function sb(a){a=a|0;tb(i|0,a|0,4)}function tb(d,e,f){d=d|0;e=e|0;f=f|0;if((d|0)<=0)Y();if((d+f|0)>(c[i>>2]|0))Y();if((f|0)==4){if(d&3)Z();c[d>>2]=e}else if((f|0)==1)a[d>>0]=e;else{if(d&1)Z();b[d>>1]=e}}function ub(a,b,d){a=a|0;b=+b;d=d|0;if((a|0)<=0)Y();if((a+d|0)>(c[i>>2]|0))Y();if((d|0)==8){if(a&7)Z();h[a>>3]=b}else{if(a&3)Z();g[a>>2]=b}}function vb(f,g,h){f=f|0;g=g|0;h=h|0;if((f|0)<=0)Y();if((f+g|0)>(c[i>>2]|0))Y();if((g|0)==4){if(f&3)Z();return c[f>>2]|0}else if((g|0)==1)if(h)return d[f>>0]|0;else return a[f>>0]|0;if(f&1)Z();if(h)return e[f>>1]|0;return b[f>>1]|0}function wb(a,b){a=a|0;b=b|0;if((a|0)<=0)Y();if((a+b|0)>(c[i>>2]|0))Y();if((b|0)==8){if(a&7)Z();return +h[a>>3]}if(a&3)Z();return +g[a>>2]}function xb(a,b){a=a|0;b=b|0;b=a&b;if((b|0)!=(a|0))_();return b|0}function yb(a){a=a|0;z=a}function zb(){return z|0}function Ab(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=a>>>16;a=a&65535;if((c|0)==1){g=(vb(b>>0|0,1,1)|0|0)+a|0;g=g>>>0>65520?g+-65521|0:g;f=g+d|0;g=(f>>>0>65520?f+15|0:f)<<16|g;return g|0}if(!b){g=1;return g|0}if(c>>>0<16){if(c)while(1){c=c+-1|0;a=(vb(b>>0|0,1,1)|0|0)+a|0;d=a+d|0;if(!c)break;else b=b+1|0}g=((d>>>0)%65521|0)<<16|(a>>>0>65520?a+-65521|0:a);return g|0}if(c>>>0>5551){do{e=b;f=347;while(1){v=(vb(e>>0|0,1,1)|0|0)+a|0;u=v+(vb(e+1>>0|0,1,1)|0|0)|0;t=u+(vb(e+2>>0|0,1,1)|0|0)|0;s=t+(vb(e+3>>0|0,1,1)|0|0)|0;r=s+(vb(e+4>>0|0,1,1)|0|0)|0;q=r+(vb(e+5>>0|0,1,1)|0|0)|0;p=q+(vb(e+6>>0|0,1,1)|0|0)|0;o=p+(vb(e+7>>0|0,1,1)|0|0)|0;n=o+(vb(e+8>>0|0,1,1)|0|0)|0;m=n+(vb(e+9>>0|0,1,1)|0|0)|0;l=m+(vb(e+10>>0|0,1,1)|0|0)|0;k=l+(vb(e+11>>0|0,1,1)|0|0)|0;j=k+(vb(e+12>>0|0,1,1)|0|0)|0;i=j+(vb(e+13>>0|0,1,1)|0|0)|0;h=i+(vb(e+14>>0|0,1,1)|0|0)|0;a=h+(vb(e+15>>0|0,1,1)|0|0)|0;d=v+d+u+t+s+r+q+p+o+n+m+l+k+j+i+h+a|0;f=f+-1|0;if(!f)break;else e=e+16|0}c=c+-5552|0;b=b+5552|0;a=(a>>>0)%65521|0;d=(d>>>0)%65521|0}while(c>>>0>5551);if(c)if(c>>>0>15)g=14;else g=17}else g=14;if((g|0)==14){f=c+-16|0;g=f&-16;e=b;while(1){c=c+-16|0;h=(vb(e>>0|0,1,1)|0|0)+a|0;i=h+(vb(e+1>>0|0,1,1)|0|0)|0;j=i+(vb(e+2>>0|0,1,1)|0|0)|0;k=j+(vb(e+3>>0|0,1,1)|0|0)|0;l=k+(vb(e+4>>0|0,1,1)|0|0)|0;m=l+(vb(e+5>>0|0,1,1)|0|0)|0;n=m+(vb(e+6>>0|0,1,1)|0|0)|0;o=n+(vb(e+7>>0|0,1,1)|0|0)|0;p=o+(vb(e+8>>0|0,1,1)|0|0)|0;q=p+(vb(e+9>>0|0,1,1)|0|0)|0;r=q+(vb(e+10>>0|0,1,1)|0|0)|0;s=r+(vb(e+11>>0|0,1,1)|0|0)|0;t=s+(vb(e+12>>0|0,1,1)|0|0)|0;u=t+(vb(e+13>>0|0,1,1)|0|0)|0;v=u+(vb(e+14>>0|0,1,1)|0|0)|0;a=v+(vb(e+15>>0|0,1,1)|0|0)|0;d=h+d+i+j+k+l+m+n+o+p+q+r+s+t+u+v+a|0;if(c>>>0<=15)break;else e=e+16|0}c=f-g|0;if(!c)g=18;else{b=b+(g+16)|0;g=17}}if((g|0)==17)while(1){c=c+-1|0;a=(vb(b>>0|0,1,1)|0|0)+a|0;d=a+d|0;if(!c){g=18;break}else{b=b+1|0;g=17}}if((g|0)==18){a=(a>>>0)%65521|0;d=(d>>>0)%65521|0}v=d<<16|a;return v|0}function Bb(a,b,c){a=a|0;b=b|0;c=c|0;if(!b)b=0;else b=Cb(a,b,c)|0;return b|0}function Cb(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0;a=~a;if(!c){g=a;g=~g;return g|0}while(1){if(!(b&3))break;a=(vb(448+(((vb(b>>0|0,1,1)|0|0)^a&255)<<2)|0,4,0)|0)^a>>>8;c=c+-1|0;if(!c){d=15;break}else b=b+1|0}if((d|0)==15){g=~a;return g|0}if(c>>>0>31){e=c+-32|0;f=e&-32;d=b+(f+32)|0;while(1){g=(vb(b|0,4,0)|0)^a;g=(vb(2496+((g>>>8&255)<<2)|0,4,0)|0)^(vb(3520+((g&255)<<2)|0,4,0)|0)^(vb(1472+((g>>>16&255)<<2)|0,4,0)|0)^(vb(448+(g>>>24<<2)|0,4,0)|0)^(vb(b+4|0,4,0)|0);g=(vb(2496+((g>>>8&255)<<2)|0,4,0)|0)^(vb(3520+((g&255)<<2)|0,4,0)|0)^(vb(1472+((g>>>16&255)<<2)|0,4,0)|0)^(vb(448+(g>>>24<<2)|0,4,0)|0)^(vb(b+8|0,4,0)|0);g=(vb(2496+((g>>>8&255)<<2)|0,4,0)|0)^(vb(3520+((g&255)<<2)|0,4,0)|0)^(vb(1472+((g>>>16&255)<<2)|0,4,0)|0)^(vb(448+(g>>>24<<2)|0,4,0)|0)^(vb(b+12|0,4,0)|0);g=(vb(2496+((g>>>8&255)<<2)|0,4,0)|0)^(vb(3520+((g&255)<<2)|0,4,0)|0)^(vb(1472+((g>>>16&255)<<2)|0,4,0)|0)^(vb(448+(g>>>24<<2)|0,4,0)|0)^(vb(b+16|0,4,0)|0);g=(vb(2496+((g>>>8&255)<<2)|0,4,0)|0)^(vb(3520+((g&255)<<2)|0,4,0)|0)^(vb(1472+((g>>>16&255)<<2)|0,4,0)|0)^(vb(448+(g>>>24<<2)|0,4,0)|0)^(vb(b+20|0,4,0)|0);g=(vb(2496+((g>>>8&255)<<2)|0,4,0)|0)^(vb(3520+((g&255)<<2)|0,4,0)|0)^(vb(1472+((g>>>16&255)<<2)|0,4,0)|0)^(vb(448+(g>>>24<<2)|0,4,0)|0)^(vb(b+24|0,4,0)|0);g=(vb(2496+((g>>>8&255)<<2)|0,4,0)|0)^(vb(3520+((g&255)<<2)|0,4,0)|0)^(vb(1472+((g>>>16&255)<<2)|0,4,0)|0)^(vb(448+(g>>>24<<2)|0,4,0)|0)^(vb(b+28|0,4,0)|0);a=(vb(2496+((g>>>8&255)<<2)|0,4,0)|0)^(vb(3520+((g&255)<<2)|0,4,0)|0)^(vb(1472+((g>>>16&255)<<2)|0,4,0)|0)^(vb(448+(g>>>24<<2)|0,4,0)|0);c=c+-32|0;if(c>>>0<=31)break;else b=b+32|0}b=d;c=e-f|0}if(c>>>0>3){f=c+-4|0;g=f>>>2;d=g+1|0;e=b;while(1){h=(vb(e|0,4,0)|0)^a;a=(vb(2496+((h>>>8&255)<<2)|0,4,0)|0)^(vb(3520+((h&255)<<2)|0,4,0)|0)^(vb(1472+((h>>>16&255)<<2)|0,4,0)|0)^(vb(448+(h>>>24<<2)|0,4,0)|0);c=c+-4|0;if(c>>>0<=3)break;else e=e+4|0}b=b+(d<<2)|0;c=f-(g<<2)|0}if(!c){h=a;h=~h;return h|0}while(1){a=(vb(448+(((vb(b>>0|0,1,1)|0|0)^a&255)<<2)|0,4,0)|0)^a>>>8;c=c+-1|0;if(!c)break;else b=b+1|0}h=~a;return h|0}function Db(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;h=l;l=l+64|0;if((l|0)>=(m|0))X(64);f=h;tb(f|0,c|0,4);e=f+4|0;tb(e|0,d|0,4);tb(f+12|0,a|0,4);tb(f+16|0,vb(b|0,4,0)|0|0,4);tb(f+32|0,0|0,4);tb(f+36|0,0|0,4);c=Ib(f)|0;if(c|0){g=c;l=h;return g|0}c=Jb(f,4)|0;if((c|0)==1){tb(b|0,vb(f+20|0,4,0)|0|0,4);g=Mb(f)|0;l=h;return g|0}Mb(f)|0;switch(c|0){case -5:{g=4;break}case 2:{g=-3;l=h;return g|0}default:{}}if((g|0)==4?(vb(e|0,4,0)|0|0)==0:0){g=-3;l=h;return g|0}g=c;l=h;return g|0}function Eb(a,b,c){a=a|0;b=b|0;c=c|0;return zl(O(c,b)|0)|0}function Fb(a,b){a=a|0;b=b|0;Al(b);return}function Gb(a){a=a|0;var b=0;if(!a){a=-2;return a|0}b=vb(a+28|0,4,0)|0|0;if(!b){a=-2;return a|0}tb(b+28|0,0|0,4);tb(a+20|0,0|0,4);tb(a+8|0,0|0,4);tb(a+24|0,0|0,4);tb(a+48|0,1|0,4);tb(b|0,0|0,4);tb(b+4|0,0|0,4);tb(b+12|0,0|0,4);tb(b+20|0,32768|0,4);tb(b+32|0,0|0,4);tb(b+40|0,0|0,4);tb(b+44|0,0|0,4);tb(b+48|0,0|0,4);tb(b+56|0,0|0,4);tb(b+60|0,0|0,4);a=b+1328|0;tb(b+108|0,a|0,4);tb(b+80|0,a|0,4);tb(b+76|0,a|0,4);a=0;return a|0}function Hb(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;if(!c){a=-6;return a|0}if((vb(c>>0|0,1,0)|0|0)!=49){a=-6;return a|0}if(!a){a=-2;return a|0}tb(a+24|0,0|0,4);d=a+32|0;c=vb(d|0,4,0)|0|0;if(!c){tb(d|0,29|0,4);tb(a+40|0,0|0,4);c=29}g=a+36|0;if(!(vb(g|0,4,0)|0))tb(g|0,21|0,4);f=a+40|0;d=db[(xb(c|0,31|0)|0)&31](vb(f|0,4,0)|0|0,1,9520)|0;if(!d){a=-4;return a|0}e=a+28|0;tb(e|0,d|0,4);if((b|0)<0){tb(d+8|0,0|0,4);c=0-b|0}else{tb(d+8|0,(b>>>4)+1|0,4);c=(b|0)<48?b&15:b}if((c&-8|0)==8){tb(d+36|0,c|0,4);tb(d+52|0,0|0,4);a=Gb(a)|0;return a|0}else{ib[(xb(vb(g|0,4,0)|0|0,63|0)|0)&63](vb(f|0,4,0)|0|0,d);tb(e|0,0|0,4);a=-2;return a|0}return 0}function Ib(a){a=a|0;return Hb(a,15,15346)|0}function Jb(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0;wa=l;l=l+16|0;if((l|0)>=(m|0))X(16);$=wa;if(!a){a=-2;l=wa;return a|0}va=vb(a+28|0,4,0)|0|0;if(!va){a=-2;l=wa;return a|0}ua=a+12|0;e=vb(ua|0,4,0)|0|0;if(!e){a=-2;l=wa;return a|0}d=vb(a|0,4,0)|0|0;if((d|0)==0?vb(a+4|0,4,0)|0|0:0){a=-2;l=wa;return a|0}c=vb(va|0,4,0)|0|0;if((c|0)==11){tb(va|0,12|0,4);c=12;d=vb(a|0,4,0)|0|0;e=vb(ua|0,4,0)|0|0}ia=a+16|0;s=vb(ia|0,4,0)|0|0;ea=a+4|0;ca=vb(ea|0,4,0)|0|0;da=va+56|0;sa=va+60|0;ka=va+8|0;qa=va+24|0;N=$+1|0;oa=va+16|0;Q=va+32|0;S=a+24|0;t=va+36|0;u=va+20|0;ta=a+48|0;v=va+64|0;w=va+12|0;O=(b|0)==5;ra=va+4|0;R=va+76|0;x=va+84|0;y=va+72|0;z=va+68|0;A=va+44|0;B=va+48|0;C=va+52|0;ba=va+40|0;na=a+20|0;la=va+28|0;L=$+2|0;M=$+3|0;P=va+80|0;D=va+88|0;E=va+104|0;F=va+96|0;G=va+100|0;I=va+1328|0;T=va+108|0;J=va+112|0;K=va+752|0;H=va+92|0;g=vb(sa|0,4,0)|0|0;i=ca;f=vb(da|0,4,0)|0|0;U=s;o=0;a:while(1){b:do switch(c|0){case 26:{ma=g;ja=i;fa=f;ga=U;aa=d;ha=s;pa=1;break a}case 27:{r=274;break a}case 28:{c=-4;r=287;break a}case 0:{c=vb(ka|0,4,0)|0|0;if(!c){tb(va|0,12|0,4);h=i;n=U;k=s;j=o;break b}if(g>>>0<16){h=d;while(1){if(!i){ma=g;ja=0;fa=f;ga=U;aa=h;ha=s;pa=o;break a}i=i+-1|0;d=h+1|0;f=((vb(h>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0<16)h=d;else{j=i;break}}}else j=i;if((f|0)==35615&(c&2|0)!=0){g=Bb(0,0,0)|0;tb(qa|0,g|0,4);tb($>>0|0,31|0,1);tb(N>>0|0,-117|0,1);tb(qa|0,Bb(g,$,2)|0|0,4);tb(va|0,1|0,4);g=0;h=j;f=0;n=U;k=s;j=o;break b}tb(oa|0,0|0,4);h=vb(Q|0,4,0)|0|0;if(h){tb(h+48|0,-1|0,4);c=vb(ka|0,4,0)|0|0}if(c&1|0?((((f<<8&65280)+(f>>>8)|0)>>>0)%31|0|0)==0:0){if((f&15|0)!=8){tb(S|0,14261|0,4);tb(va|0,27|0,4);h=j;n=U;k=s;j=o;break b}i=f>>>4;c=i&15;if((c+8|0)>>>0>(vb(t|0,4,0)|0|0)>>>0){tb(S|0,14288|0,4);tb(va|0,27|0,4);g=g+-4|0;h=j;f=i;n=U;k=s;j=o;break b}else{tb(u|0,256<<c|0,4);g=Ab(0,0,0)|0;tb(qa|0,g|0,4);tb(ta|0,g|0,4);tb(va|0,f>>>12&2^11|0,4);g=0;h=j;f=0;n=U;k=s;j=o;break b}}tb(S|0,14238|0,4);tb(va|0,27|0,4);h=j;n=U;k=s;j=o;break}case 1:{if(g>>>0<16){h=i;c=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=c;ha=s;pa=o;break a}h=h+-1|0;d=c+1|0;f=((vb(c>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0<16)c=d;else break}}else h=i;tb(oa|0,f|0,4);if((f&255|0)!=8){tb(S|0,14261|0,4);tb(va|0,27|0,4);n=U;k=s;j=o;break b}if(f&57344|0){tb(S|0,14308|0,4);tb(va|0,27|0,4);n=U;k=s;j=o;break b}c=vb(Q|0,4,0)|0|0;if(!c)c=f;else{tb(c|0,f>>>8&1|0,4);c=vb(oa|0,4,0)|0|0}if(c&512|0){tb($>>0|0,f|0,1);tb(N>>0|0,f>>>8|0,1);tb(qa|0,Bb(vb(qa|0,4,0)|0|0,$,2)|0|0,4)}tb(va|0,2|0,4);g=0;c=h;f=0;r=48;break}case 2:{if(g>>>0<32){c=i;r=48}else r=50;break}case 3:{if(g>>>0<16){c=i;h=d;r=56}else{h=i;r=58}break}case 4:{c=vb(oa|0,4,0)|0|0;h=i;r=63;break}case 5:{h=i;r=74;break}case 6:{c=vb(oa|0,4,0)|0|0;j=i;r=84;break}case 7:{j=i;r=97;break}case 8:{c=i;r=110;break}case 9:{if(g>>>0<32){c=i;h=d;while(1){if(!c){ma=g;ja=0;fa=f;ga=U;aa=h;ha=s;pa=o;break a}c=c+-1|0;d=h+1|0;f=((vb(h>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0>=32)break;else h=d}}else c=i;g=Ln(f|0)|0;tb(qa|0,g|0,4);tb(ta|0,g|0,4);tb(va|0,10|0,4);g=0;f=0;r=122;break}case 10:{c=i;r=122;break}case 11:{c=i;r=125;break}case 12:{c=i;r=126;break}case 13:{q=g&7;f=f>>>q;g=g-q|0;if(g>>>0<32){h=i;c=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=c;ha=s;pa=o;break a}h=h+-1|0;d=c+1|0;f=((vb(c>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0<32)c=d;else break}}else h=i;c=f&65535;if((c|0)==(f>>>16^65535|0)){tb(v|0,c|0,4);tb(va|0,14|0,4);g=0;f=0;r=143;break b}else{tb(S|0,14372|0,4);tb(va|0,27|0,4);n=U;k=s;j=o;break b}}case 14:{c=vb(v|0,4,0)|0|0;h=i;r=143;break}case 15:{if(g>>>0<14){h=i;c=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=c;ha=s;pa=o;break a}h=h+-1|0;d=c+1|0;f=((vb(c>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0<14)c=d;else{i=h;break}}}p=(f&31)+257|0;tb(F|0,p|0,4);q=(f>>>5&31)+1|0;tb(G|0,q|0,4);h=(f>>>10&15)+4|0;tb(H|0,h|0,4);f=f>>>14;g=g+-14|0;if(p>>>0>286|q>>>0>30){tb(S|0,14401|0,4);tb(va|0,27|0,4);h=i;n=U;k=s;j=o;break b}else{tb(E|0,0|0,4);tb(va|0,16|0,4);c=0;r=153;break b}}case 16:{c=vb(E|0,4,0)|0|0;h=vb(H|0,4,0)|0|0;if(c>>>0<h>>>0)r=153;else{h=i;r=154}break}case 17:{j=vb(E|0,4,0)|0|0;h=i;r=163;break}case 18:{h=i;r=197;break}case 19:{j=vb(y|0,4,0)|0|0;h=i;i=o;r=214;break}case 20:{h=i;r=220;break}case 21:{k=vb(y|0,4,0)|0|0;h=i;j=o;r=231;break}case 22:{n=i;r=240;break}case 23:{if(!U){ma=g;ja=i;fa=f;ga=0;aa=d;ha=s;pa=o;break a}tb(e>>0|0,vb(v|0,4,0)|0|0,1);tb(va|0,18|0,4);h=i;n=U+-1|0;k=s;e=e+1|0;j=o;break}case 24:{if(vb(ka|0,4,0)|0){if(g>>>0<32){c=i;h=d;while(1){if(!c){ma=g;ja=0;fa=f;ga=U;aa=h;ha=s;pa=o;break a}c=c+-1|0;d=h+1|0;f=((vb(h>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0<32)h=d;else break}}else c=i;j=s-U|0;tb(na|0,(vb(na|0,4,0)|0|0)+j|0,4);tb(la|0,(vb(la|0,4,0)|0|0)+j|0,4);if(j|0){h=vb(qa|0,4,0)|0|0;i=e+(0-j)|0;if(!(vb(oa|0,4,0)|0))h=Ab(h,i,j)|0;else h=Bb(h,i,j)|0;tb(qa|0,h|0,4);tb(ta|0,h|0,4)}q=(vb(oa|0,4,0)|0|0)==0;s=Ln(f|0)|0;if(((q?s:f)|0)==(vb(qa|0,4,0)|0|0)){g=0;f=0;h=U}else{tb(S|0,14538|0,4);tb(va|0,27|0,4);h=c;n=U;k=U;j=o;break b}}else{c=i;h=s}tb(va|0,25|0,4);k=h;r=266;break}case 25:{c=i;k=s;r=266;break}default:{r=286;break a}}while(0);do if((r|0)==48)while(1){r=0;if(!c){ma=g;ja=0;fa=f;ga=U;aa=d;ha=s;pa=o;break a}c=c+-1|0;h=d+1|0;f=((vb(d>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0>=32){i=c;d=h;r=50;break}else{d=h;r=48}}else if((r|0)==122){if(!(vb(w|0,4,0)|0)){r=123;break a}r=Ab(0,0,0)|0;tb(qa|0,r|0,4);tb(ta|0,r|0,4);tb(va|0,11|0,4);r=125}else if((r|0)==143){r=0;if(!c){tb(va|0,11|0,4);n=U;k=s;j=o;break}c=c>>>0>h>>>0?h:c;c=c>>>0>U>>>0?U:c;if(!c){ma=g;ja=h;fa=f;ga=U;aa=d;ha=s;pa=o;break a}Mn(e|0,d|0,c|0)|0;tb(v|0,(vb(v|0,4,0)|0|0)-c|0,4);h=h-c|0;n=U-c|0;d=d+c|0;k=s;e=e+c|0;j=o}else if((r|0)==153){r=0;while(1){if(g>>>0<3){if(!i){ma=g;ja=0;fa=f;ga=U;aa=d;ha=s;pa=o;break a}k=g+8|0;i=i+-1|0;f=((vb(d>>0|0,1,1)|0|0)<<g)+f|0;d=d+1|0}else k=g;j=c+1|0;tb(E|0,j|0,4);tb(va+112+((vb(10748+(c<<1)|0,2,1)|0|0)<<1)|0,f&7|0,2);f=f>>>3;g=k+-3|0;if(j>>>0<h>>>0)c=j;else{c=j;h=i;r=154;break}}}else if((r|0)==266){r=0;if(!(vb(ka|0,4,0)|0)){r=273;break a}if(!(vb(oa|0,4,0)|0)){r=273;break a}if(g>>>0<32){h=d;while(1){if(!c){ma=g;ja=0;fa=f;ga=U;aa=h;ha=k;pa=o;break a}c=c+-1|0;d=h+1|0;f=((vb(h>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0<32)h=d;else break}}if((f|0)==(vb(la|0,4,0)|0|0)){g=0;f=0;r=273;break a}tb(S|0,14559|0,4);tb(va|0,27|0,4);h=c;n=U;j=o}while(0);do if((r|0)==50){c=vb(Q|0,4,0)|0|0;if(c|0)tb(c+4|0,f|0,4);if((vb(oa|0,4,0)|0)&512|0){tb($>>0|0,f|0,1);tb(N>>0|0,f>>>8|0,1);tb(L>>0|0,f>>>16|0,1);tb(M>>0|0,f>>>24|0,1);tb(qa|0,Bb(vb(qa|0,4,0)|0|0,$,4)|0|0,4)}tb(va|0,3|0,4);g=0;c=i;f=0;h=d;r=56}else if((r|0)==125){r=0;if(O){ma=g;ja=c;fa=f;ga=U;aa=d;ha=s;pa=o;break a}else r=126}else if((r|0)==154){r=0;if(c>>>0<19)do{q=c;c=c+1|0;tb(E|0,c|0,4);tb(va+112+((vb(10748+(q<<1)|0,2,1)|0|0)<<1)|0,0|0,2)}while((c|0)!=19);tb(T|0,I|0,4);tb(R|0,I|0,4);tb(x|0,7|0,4);c=Nb(0,J,19,T,x,K)|0;if(!c){tb(E|0,0|0,4);tb(va|0,17|0,4);j=0;o=0;r=163;break}else{tb(S|0,14437|0,4);tb(va|0,27|0,4);n=U;k=s;j=c;break}}while(0);c:do if((r|0)==56)while(1){r=0;if(!c){ma=g;ja=0;fa=f;ga=U;aa=h;ha=s;pa=o;break a}c=c+-1|0;d=h+1|0;f=((vb(h>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0>=16){h=c;r=58;break}else{h=d;r=56}}else if((r|0)==126){r=0;if(vb(ra|0,4,0)|0|0){n=g&7;tb(va|0,24|0,4);g=g-n|0;h=c;f=f>>>n;n=U;k=s;j=o;break}if(g>>>0<3){if(!c){ma=g;ja=0;fa=f;ga=U;aa=d;ha=s;pa=o;break a}i=g+8|0;h=c+-1|0;f=((vb(d>>0|0,1,1)|0|0)<<g)+f|0;d=d+1|0}else{i=g;h=c}tb(ra|0,f&1|0,4);switch(f>>>1&3){case 0:{c=13;break}case 1:{Kb(va);c=18;break}case 2:{c=15;break}case 3:{tb(S|0,14353|0,4);c=27;break}default:{r=136;break a}}tb(va|0,c|0,4);g=i+-3|0;f=f>>>3;n=U;k=s;j=o}else if((r|0)==163){r=0;c=vb(F|0,4,0)|0|0;i=vb(G|0,4,0)|0|0;do if(j>>>0<(i+c|0)>>>0){q=j;d:while(1){p=vb(R|0,4,0)|0|0;n=(1<<(vb(x|0,4,0)|0))+-1|0;j=n&f;k=vb(p+(j<<2)+1>>0|0,1,1)|0|0;if(k>>>0>g>>>0){j=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=j;ha=s;pa=o;break a}h=h+-1|0;d=j+1|0;f=((vb(j>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;j=n&f;k=vb(p+(j<<2)+1>>0|0,1,1)|0|0;if(k>>>0>g>>>0)j=d;else break}}j=vb(p+(j<<2)+2|0,2,0)|0|0;if((j&65535)>=16){switch(j<<16>>16){case 16:{n=k+2|0;if(g>>>0<n>>>0){j=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=j;ha=s;pa=o;break a}h=h+-1|0;d=j+1|0;f=((vb(j>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0<n>>>0)j=d;else break}}f=f>>>k;g=g-k|0;if(!q){r=190;break d}g=g+-2|0;k=(f&3)+3|0;f=f>>>2;j=vb(va+112+(q+-1<<1)|0,2,1)|0|0;break}case 17:{n=k+3|0;if(g>>>0<n>>>0){j=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=j;ha=s;pa=o;break a}h=h+-1|0;d=j+1|0;f=((vb(j>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0<n>>>0)j=d;else break}}f=f>>>k;g=-3-k+g|0;k=(f&7)+3|0;f=f>>>3;j=0;break}default:{n=k+7|0;if(g>>>0<n>>>0){j=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=j;ha=s;pa=o;break a}h=h+-1|0;d=j+1|0;f=((vb(j>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0<n>>>0)j=d;else break}}f=f>>>k;g=-7-k+g|0;k=(f&127)+11|0;f=f>>>7;j=0}}if((q+k|0)>>>0>(i+c|0)>>>0){r=190;break}i=j&65535;c=k+-1|0;tb(E|0,q+1|0,4);tb(va+112+(q<<1)|0,i|0,2);if(c)do{q=vb(E|0,4,0)|0|0;c=c+-1|0;tb(E|0,q+1|0,4);tb(va+112+(q<<1)|0,i|0,2)}while((c|0)!=0)}else{if(g>>>0<k>>>0){c=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=c;ha=s;pa=o;break a}h=h+-1|0;d=c+1|0;f=((vb(c>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0<k>>>0)c=d;else break}}tb(E|0,q+1|0,4);tb(va+112+(q<<1)|0,j|0,2);g=g-k|0;f=f>>>k}q=vb(E|0,4,0)|0|0;c=vb(F|0,4,0)|0|0;i=vb(G|0,4,0)|0|0;if(q>>>0>=(i+c|0)>>>0){r=191;break}}if((r|0)==190){r=0;tb(S|0,14462|0,4);tb(va|0,27|0,4);n=U;k=s;j=o;break c}else if((r|0)==191){r=0;if((vb(va|0,4,0)|0|0)==27){n=U;k=s;j=o;break c}else break}}while(0);tb(T|0,I|0,4);tb(R|0,I|0,4);tb(x|0,9|0,4);c=Nb(1,J,c,T,x,K)|0;if(c|0){tb(S|0,14488|0,4);tb(va|0,27|0,4);n=U;k=s;j=c;break}tb(P|0,vb(T|0,4,0)|0|0,4);tb(D|0,6|0,4);c=Nb(2,va+112+((vb(F|0,4,0)|0)<<1)|0,vb(G|0,4,0)|0|0,T,D,K)|0;if(!c){tb(va|0,18|0,4);o=0;r=197;break}else{tb(S|0,14516|0,4);tb(va|0,27|0,4);n=U;k=s;j=c;break}}while(0);do if((r|0)==58){c=vb(Q|0,4,0)|0|0;if(c|0){tb(c+8|0,f&255|0,4);tb((vb(Q|0,4,0)|0|0)+12|0,f>>>8|0,4)}c=vb(oa|0,4,0)|0|0;if(c&512|0){tb($>>0|0,f|0,1);tb(N>>0|0,f>>>8|0,1);tb(qa|0,Bb(vb(qa|0,4,0)|0|0,$,2)|0|0,4)}tb(va|0,4|0,4);g=0;f=0;r=63}else if((r|0)==197){r=0;if(U>>>0>257&h>>>0>5){tb(ua|0,e|0,4);tb(ia|0,U|0,4);tb(a|0,d|0,4);tb(ea|0,h|0,4);tb(da|0,f|0,4);tb(sa|0,g|0,4);Ob(a,s);g=vb(sa|0,4,0)|0|0;h=vb(ea|0,4,0)|0|0;f=vb(da|0,4,0)|0|0;n=vb(ia|0,4,0)|0|0;d=vb(a|0,4,0)|0|0;k=s;e=vb(ua|0,4,0)|0|0;j=o;break}p=vb(R|0,4,0)|0|0;k=(1<<(vb(x|0,4,0)|0))+-1|0;c=k&f;i=vb(p+(c<<2)+1>>0|0,1,0)|0|0;j=i&255;if(j>>>0>g>>>0){c=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=c;ha=s;pa=o;break a}h=h+-1|0;d=c+1|0;f=((vb(c>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;c=k&f;i=vb(p+(c<<2)+1>>0|0,1,0)|0|0;j=i&255;if(j>>>0>g>>>0)c=d;else break}}n=vb(p+(c<<2)+2|0,2,0)|0|0;k=vb(p+(c<<2)>>0|0,1,0)|0|0;c=k&255;if(k<<24>>24!=0&(c&240|0)==0){n=n&65535;k=(1<<j+c)+-1|0;c=((f&k)>>>j)+n|0;i=vb(p+(c<<2)+1>>0|0,1,0)|0|0;if(((i&255)+j|0)>>>0>g>>>0){c=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=c;ha=s;pa=o;break a}h=h+-1|0;d=c+1|0;f=((vb(c>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;c=((f&k)>>>j)+n|0;i=vb(p+(c<<2)+1>>0|0,1,0)|0|0;if(((i&255)+j|0)>>>0>g>>>0)c=d;else break}}g=g-j|0;f=f>>>j;k=vb(p+(c<<2)>>0|0,1,0)|0|0;c=vb(p+(c<<2)+2|0,2,0)|0|0}else c=n;q=i&255;f=f>>>q;g=g-q|0;tb(v|0,c&65535|0,4);c=k&255;if(!(k<<24>>24)){tb(va|0,23|0,4);n=U;k=s;j=o;break}if(c&32|0){tb(va|0,11|0,4);n=U;k=s;j=o;break}if(!(c&64)){j=c&15;tb(y|0,j|0,4);tb(va|0,19|0,4);i=o;r=214;break}else{tb(S|0,14582|0,4);tb(va|0,27|0,4);n=U;k=s;j=o;break}}while(0);if((r|0)==63){r=0;if(!(c&1024)){c=vb(Q|0,4,0)|0|0;if(c)tb(c+16|0,0|0,4)}else{if(g>>>0<16){i=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=i;ha=s;pa=o;break a}h=h+-1|0;d=i+1|0;f=((vb(i>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0>=16)break;else i=d}}tb(v|0,f|0,4);g=vb(Q|0,4,0)|0|0;if(g){tb(g+20|0,f|0,4);c=vb(oa|0,4,0)|0|0}if(!(c&512)){g=0;f=0}else{tb($>>0|0,f|0,1);tb(N>>0|0,f>>>8|0,1);tb(qa|0,Bb(vb(qa|0,4,0)|0|0,$,2)|0|0,4);g=0;f=0}}tb(va|0,5|0,4);r=74}else if((r|0)==214){r=0;if(j){if(g>>>0<j>>>0){c=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=c;ha=s;pa=i;break a}h=h+-1|0;d=c+1|0;f=((vb(c>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0<j>>>0)c=d;else break}}tb(v|0,(vb(v|0,4,0)|0|0)+(f&(1<<j)+-1)|0,4);g=g-j|0;f=f>>>j}tb(va|0,20|0,4);o=i;r=220}do if((r|0)==74){r=0;c=vb(oa|0,4,0)|0|0;if(c&1024){j=vb(v|0,4,0)|0|0;k=j>>>0>h>>>0?h:j;if(k){i=vb(Q|0,4,0)|0|0;if((i|0)!=0?(V=vb(i+16|0,4,0)|0|0,(V|0)!=0):0){c=(vb(i+20|0,4,0)|0|0)-j|0;q=vb(i+24|0,4,0)|0|0;Mn(V+c|0,d|0,((c+k|0)>>>0>q>>>0?q-c|0:k)|0)|0;c=vb(oa|0,4,0)|0|0}if(c&512|0)tb(qa|0,Bb(vb(qa|0,4,0)|0|0,d,k)|0|0,4);j=(vb(v|0,4,0)|0|0)-k|0;tb(v|0,j|0,4);h=h-k|0;d=d+k|0}if(j){ma=g;ja=h;fa=f;ga=U;aa=d;ha=s;pa=o;break a}}tb(v|0,0|0,4);tb(va|0,6|0,4);j=h;r=84}else if((r|0)==220){r=0;p=vb(P|0,4,0)|0|0;k=(1<<(vb(D|0,4,0)|0))+-1|0;c=k&f;i=vb(p+(c<<2)+1>>0|0,1,0)|0|0;j=i&255;if(j>>>0>g>>>0){c=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=c;ha=s;pa=o;break a}h=h+-1|0;d=c+1|0;f=((vb(c>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;c=k&f;i=vb(p+(c<<2)+1>>0|0,1,0)|0|0;j=i&255;if(j>>>0>g>>>0)c=d;else{n=j;break}}}else n=j;j=vb(p+(c<<2)+2|0,2,0)|0|0;k=vb(p+(c<<2)>>0|0,1,0)|0|0;c=k&255;if(!(c&240)){k=j&65535;j=(1<<n+c)+-1|0;c=((f&j)>>>n)+k|0;i=vb(p+(c<<2)+1>>0|0,1,0)|0|0;if(((i&255)+n|0)>>>0>g>>>0){c=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=c;ha=s;pa=o;break a}h=h+-1|0;d=c+1|0;f=((vb(c>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;c=((f&j)>>>n)+k|0;i=vb(p+(c<<2)+1>>0|0,1,0)|0|0;if(((i&255)+n|0)>>>0>g>>>0)c=d;else break}}g=g-n|0;f=f>>>n;k=vb(p+(c<<2)>>0|0,1,0)|0|0;j=vb(p+(c<<2)+2|0,2,0)|0|0}c=i&255;f=f>>>c;g=g-c|0;c=k&255;if(!(c&64)){tb(z|0,j&65535|0,4);k=c&15;tb(y|0,k|0,4);tb(va|0,21|0,4);j=o;r=231;break}else{tb(S|0,14610|0,4);tb(va|0,27|0,4);n=U;k=s;j=o;break}}while(0);do if((r|0)==84){r=0;if(!(c&2048)){c=vb(Q|0,4,0)|0|0;if(!c)c=j;else{tb(c+28|0,0|0,4);c=j}}else{if(!j){ma=g;ja=0;fa=f;ga=U;aa=d;ha=s;pa=o;break a}else i=0;do{c=i;i=i+1|0;c=vb(d+c>>0|0,1,0)|0|0;h=vb(Q|0,4,0)|0|0;if((h|0?(W=vb(h+28|0,4,0)|0|0,W|0):0)?(Y=vb(v|0,4,0)|0|0,Y>>>0<(vb(h+32|0,4,0)|0|0)>>>0):0){tb(v|0,Y+1|0,4);tb(W+Y>>0|0,c|0,1)}h=c<<24>>24!=0}while(h&j>>>0>i>>>0);if((vb(oa|0,4,0)|0)&512|0)tb(qa|0,Bb(vb(qa|0,4,0)|0|0,d,i)|0|0,4);c=j-i|0;d=d+i|0;if(h){ma=g;ja=c;fa=f;ga=U;aa=d;ha=s;pa=o;break a}}tb(v|0,0|0,4);tb(va|0,7|0,4);j=c;r=97}else if((r|0)==231){r=0;if(!k)c=vb(z|0,4,0)|0|0;else{if(g>>>0<k>>>0){c=d;while(1){if(!h){ma=g;ja=0;fa=f;ga=U;aa=c;ha=s;pa=j;break a}h=h+-1|0;d=c+1|0;f=((vb(c>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0<k>>>0)c=d;else break}}c=(vb(z|0,4,0)|0|0)+(f&(1<<k)+-1)|0;tb(z|0,c|0,4);g=g-k|0;f=f>>>k}if(c>>>0>(s-U+(vb(A|0,4,0)|0|0)|0)>>>0){tb(S|0,14632|0,4);tb(va|0,27|0,4);n=U;k=s;break}else{tb(va|0,22|0,4);n=h;o=j;r=240;break}}while(0);if((r|0)==97){r=0;if(!((vb(oa|0,4,0)|0)&4096)){c=vb(Q|0,4,0)|0|0;if(!c)c=j;else{tb(c+36|0,0|0,4);c=j}}else{if(!j){ma=g;ja=0;fa=f;ga=U;aa=d;ha=s;pa=o;break}else i=0;do{c=i;i=i+1|0;c=vb(d+c>>0|0,1,0)|0|0;h=vb(Q|0,4,0)|0|0;if((h|0?(Z=vb(h+36|0,4,0)|0|0,Z|0):0)?(_=vb(v|0,4,0)|0|0,_>>>0<(vb(h+40|0,4,0)|0|0)>>>0):0){tb(v|0,_+1|0,4);tb(Z+_>>0|0,c|0,1)}h=c<<24>>24!=0}while(h&j>>>0>i>>>0);if((vb(oa|0,4,0)|0)&512|0)tb(qa|0,Bb(vb(qa|0,4,0)|0|0,d,i)|0|0,4);c=j-i|0;d=d+i|0;if(h){ma=g;ja=c;fa=f;ga=U;aa=d;ha=s;pa=o;break}}tb(va|0,8|0,4);r=110}else if((r|0)==240){r=0;if(!U){ma=g;ja=n;fa=f;ga=0;aa=d;ha=s;pa=o;break}c=s-U|0;h=vb(z|0,4,0)|0|0;if(h>>>0>c>>>0){h=h-c|0;c=vb(B|0,4,0)|0|0;if(h>>>0>c>>>0){c=h-c|0;i=c;c=(vb(ba|0,4,0)|0|0)-c|0}else{i=h;c=c-h|0}q=vb(v|0,4,0)|0|0;j=q;i=i>>>0>q>>>0?q:i;c=(vb(C|0,4,0)|0|0)+c|0}else{i=vb(v|0,4,0)|0|0;j=i;c=e+(0-h)|0}k=i>>>0>U>>>0?U:i;tb(v|0,j-k|0,4);i=k;h=e;while(1){tb(h>>0|0,vb(c>>0|0,1,0)|0|0|0,1);i=i+-1|0;if(!i)break;else{c=c+1|0;h=h+1|0}}c=U-k|0;e=e+-1+(k+1)|0;if(!(vb(v|0,4,0)|0)){tb(va|0,18|0,4);h=n;n=c;k=s;j=o}else{h=n;n=c;k=s;j=o}}do if((r|0)==110){r=0;i=vb(oa|0,4,0)|0|0;if(i&512){if(g>>>0<16){h=d;while(1){if(!c){ma=g;ja=0;fa=f;ga=U;aa=h;ha=s;pa=o;break a}c=c+-1|0;d=h+1|0;f=((vb(h>>0|0,1,1)|0|0)<<g)+f|0;g=g+8|0;if(g>>>0<16)h=d;else break}}if((f|0)==((vb(qa|0,4,0)|0)&65535|0)){g=0;h=c;f=0}else{tb(S|0,14333|0,4);tb(va|0,27|0,4);h=c;n=U;k=s;j=o;break}}else h=c;c=vb(Q|0,4,0)|0|0;if(c|0){tb(c+44|0,i>>>9&1|0,4);tb((vb(Q|0,4,0)|0|0)+48|0,1|0,4)}n=Bb(0,0,0)|0;tb(qa|0,n|0,4);tb(ta|0,n|0,4);tb(va|0,11|0,4);n=U;k=s;j=o}while(0);c=vb(va|0,4,0)|0|0;i=h;U=n;s=k;o=j}if((r|0)==123){tb(ua|0,e|0,4);tb(ia|0,U|0,4);tb(a|0,d|0,4);tb(ea|0,c|0,4);tb(da|0,f|0,4);tb(sa|0,g|0,4);a=2;l=wa;return a|0}else if((r|0)!=136)if((r|0)==273){tb(va|0,26|0,4);ma=g;ja=c;fa=f;ga=U;aa=d;ha=k;pa=1}else if((r|0)==274){ma=g;ja=i;fa=f;ga=U;aa=d;ha=s;pa=-3}else if((r|0)==286){a=-2;l=wa;return a|0}else if((r|0)==287){l=wa;return c|0}tb(ua|0,e|0,4);tb(ia|0,ga|0,4);tb(a|0,aa|0,4);tb(ea|0,ja|0,4);tb(da|0,fa|0,4);tb(sa|0,ma|0,4);if(!(vb(ba|0,4,0)|0)){if((vb(va|0,4,0)|0|0)>>>0<24?(ha|0)!=(vb(ia|0,4,0)|0|0):0)r=278}else r=278;if((r|0)==278?Lb(a,ha)|0:0){tb(va|0,28|0,4);a=-4;l=wa;return a|0}f=ca-(vb(ea|0,4,0)|0|0)|0;e=ha-(vb(ia|0,4,0)|0|0)|0;ma=a+8|0;tb(ma|0,(vb(ma|0,4,0)|0|0)+f|0,4);tb(na|0,(vb(na|0,4,0)|0|0)+e|0,4);tb(la|0,(vb(la|0,4,0)|0|0)+e|0,4);if((e|0)!=0&(vb(ka|0,4,0)|0|0)!=0){d=vb(qa|0,4,0)|0|0;c=(vb(ua|0,4,0)|0|0)+(0-e)|0;if(!(vb(oa|0,4,0)|0))c=Ab(d,c,e)|0;else c=Bb(d,c,e)|0;tb(qa|0,c|0,4);tb(ta|0,c|0,4)}tb(a+44|0,(vb(ra|0,4,0)|0|0?64:0)+(vb(sa|0,4,0)|0|0)+((vb(va|0,4,0)|0|0)==11?128:0)|0,4);a=(pa|0)==0&((b|0)==4|(e|f|0)==0)?-5:pa;l=wa;return a|0}function Kb(a){a=a|0;tb(a+76|0,10786|0,4);tb(a+84|0,9|0,4);tb(a+80|0,12834|0,4);tb(a+88|0,5|0,4);return}function Lb(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;i=vb(a+28|0,4,0)|0|0;j=i+52|0;c=vb(j|0,4,0)|0|0;if(!c){c=db[(xb(vb(a+32|0,4,0)|0|0,31|0)|0)&31](vb(a+40|0,4,0)|0|0,1<<(vb(i+36|0,4,0)|0),1)|0;tb(j|0,c|0,4);if(!c){j=1;return j|0}}h=i+40|0;d=vb(h|0,4,0)|0|0;if(!d){d=1<<(vb(i+36|0,4,0)|0);tb(h|0,d|0,4);tb(i+48|0,0|0,4);tb(i+44|0,0|0,4)}e=b-(vb(a+16|0,4,0)|0|0)|0;a=a+12|0;b=vb(a|0,4,0)|0|0;if(e>>>0>=d>>>0){Mn(c|0,b+(0-d)|0,d|0)|0;tb(i+48|0,0|0,4);tb(i+44|0,vb(h|0,4,0)|0|0,4);j=0;return j|0}f=i+48|0;k=vb(f|0,4,0)|0|0;g=d-k|0;g=g>>>0>e>>>0?e:g;Mn(c+k|0,b+(0-e)|0,g|0)|0;c=e-g|0;if(c|0){Mn(vb(j|0,4,0)|0|0,(vb(a|0,4,0)|0|0)+(0-c)|0,c|0)|0;tb(f|0,c|0,4);tb(i+44|0,vb(h|0,4,0)|0|0,4);k=0;return k|0}d=(vb(f|0,4,0)|0|0)+g|0;k=vb(h|0,4,0)|0|0;tb(f|0,((d|0)==(k|0)?0:d)|0,4);d=i+44|0;c=vb(d|0,4,0)|0|0;if(c>>>0>=k>>>0){k=0;return k|0}tb(d|0,c+g|0,4);k=0;return k|0}function Mb(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;if(!a){f=-2;return f|0}f=a+28|0;b=vb(f|0,4,0)|0|0;if(!b){f=-2;return f|0}e=a+36|0;c=vb(e|0,4,0)|0|0;if(!c){f=-2;return f|0}d=vb(b+52|0,4,0)|0|0;a=a+40|0;if(d){ib[(xb(c|0,63|0)|0)&63](vb(a|0,4,0)|0|0,d);c=vb(e|0,4,0)|0|0;b=vb(f|0,4,0)|0|0}ib[(xb(c|0,63|0)|0)&63](vb(a|0,4,0)|0|0,b);tb(f|0,0|0,4);f=0;return f|0}function Nb(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;G=l;l=l+64|0;if((l|0)>=(m|0))X(64);D=G+32|0;B=G;g=D;h=g+32|0;do{tb(g|0,0|0,2);g=g+2|0}while((g|0)<(h|0));A=(c|0)==0;if(!A){g=0;do{E=D+((vb(b+(g<<1)|0,2,1)|0)<<1)|0;tb(E|0,(vb(E|0,2,0)|0|0)+1<<16>>16|0,2);g=g+1|0}while((g|0)!=(c|0));g=vb(D+30|0,2,0)|0|0;h=vb(e|0,4,0)|0|0;if(!(g<<16>>16))if(!(vb(D+28|0,2,0)|0))F=72;else{g=0;i=16;C=14}else{i=15;C=15}}else{h=vb(e|0,4,0)|0|0;F=72}if((F|0)==72)if(!(vb(D+26|0,2,0)|0))if(!(vb(D+24|0,2,0)|0))if(!(vb(D+22|0,2,0)|0))if(!(vb(D+20|0,2,0)|0))if(!(vb(D+18|0,2,0)|0))if(!(vb(D+16|0,2,0)|0))if(!(vb(D+14|0,2,0)|0))if(!(vb(D+12|0,2,0)|0))if(!(vb(D+10|0,2,0)|0))if(!(vb(D+8|0,2,0)|0))if(!(vb(D+6|0,2,0)|0))if(!(vb(D+4|0,2,0)|0))if(!(vb(D+2|0,2,0)|0)){F=vb(d|0,4,0)|0|0;tb(d|0,F+4|0,4);tb(F>>0|0,64|0,1);tb(F+1>>0|0,1|0,1);tb(F+2|0,0|0,2);F=vb(d|0,4,0)|0|0;tb(d|0,F+4|0,4);tb(F>>0|0,64|0,1);tb(F+1>>0|0,1|0,1);tb(F+2|0,0|0,2);tb(e|0,1|0,4);d=0;l=G;return d|0}else{g=0;i=16;C=1}else{g=0;i=16;C=2}else{g=0;i=16;C=3}else{g=0;i=16;C=4}else{g=0;i=16;C=5}else{g=0;i=16;C=6}else{g=0;i=16;C=7}else{g=0;i=16;C=8}else{g=0;i=16;C=9}else{g=0;i=16;C=10}else{g=0;i=16;C=11}else{g=0;i=16;C=12}else{g=0;i=16;C=13}h=h>>>0>C>>>0?C:h;z=vb(D+2|0,2,0)|0|0;if(!(z<<16>>16))if(!(vb(D+4|0,2,0)|0))if(!(vb(D+6|0,2,0)|0))if(!(vb(D+8|0,2,0)|0))if(!(vb(D+10|0,2,0)|0))if(!(vb(D+12|0,2,0)|0))if(!(vb(D+14|0,2,0)|0))if(!(vb(D+16|0,2,0)|0))if(!(vb(D+18|0,2,0)|0))if(!(vb(D+20|0,2,0)|0))if(!(vb(D+22|0,2,0)|0))if(!(vb(D+24|0,2,0)|0))if(!(vb(D+26|0,2,0)|0))k=(vb(D+28|0,2,0)|0|0)==0?i:14;else k=13;else k=12;else k=11;else k=10;else k=9;else k=8;else k=7;else k=6;else k=5;else k=4;else k=3;else k=2;else k=1;E=h>>>0<k>>>0?k:h;x=z&65535;h=2-x|0;if((h|0)<0){d=-1;l=G;return d|0}y=vb(D+4|0,2,1)|0|0;h=(h<<1)-y|0;if((h|0)<0){d=-1;l=G;return d|0}w=vb(D+6|0,2,1)|0|0;h=(h<<1)-w|0;if((h|0)<0){d=-1;l=G;return d|0}v=vb(D+8|0,2,1)|0|0;h=(h<<1)-v|0;if((h|0)<0){d=-1;l=G;return d|0}u=vb(D+10|0,2,1)|0|0;h=(h<<1)-u|0;if((h|0)<0){d=-1;l=G;return d|0}t=vb(D+12|0,2,1)|0|0;h=(h<<1)-t|0;if((h|0)<0){d=-1;l=G;return d|0}s=vb(D+14|0,2,1)|0|0;h=(h<<1)-s|0;if((h|0)<0){d=-1;l=G;return d|0}r=vb(D+16|0,2,1)|0|0;h=(h<<1)-r|0;if((h|0)<0){d=-1;l=G;return d|0}q=vb(D+18|0,2,1)|0|0;h=(h<<1)-q|0;if((h|0)<0){d=-1;l=G;return d|0}p=vb(D+20|0,2,1)|0|0;h=(h<<1)-p|0;if((h|0)<0){d=-1;l=G;return d|0}o=vb(D+22|0,2,1)|0|0;h=(h<<1)-o|0;if((h|0)<0){d=-1;l=G;return d|0}n=vb(D+24|0,2,1)|0|0;h=(h<<1)-n|0;if((h|0)<0){d=-1;l=G;return d|0}j=vb(D+26|0,2,1)|0|0;h=(h<<1)-j|0;if((h|0)<0){d=-1;l=G;return d|0}i=vb(D+28|0,2,1)|0|0;h=(h<<1)-i|0;if((h|0)<0){d=-1;l=G;return d|0}g=(h<<1)-(g&65535)|0;if((g|0)<0){d=-1;l=G;return d|0}if(g|0?(a|0)==0|(C|0)!=1:0){d=-1;l=G;return d|0}tb(B+2|0,0|0,2);tb(B+4|0,z|0,2);z=y+x|0;tb(B+6|0,z|0,2);z=w+z|0;tb(B+8|0,z|0,2);z=v+z|0;tb(B+10|0,z|0,2);z=u+z|0;tb(B+12|0,z|0,2);z=t+z|0;tb(B+14|0,z|0,2);z=s+z|0;tb(B+16|0,z|0,2);z=r+z|0;tb(B+18|0,z|0,2);z=q+z|0;tb(B+20|0,z|0,2);z=p+z|0;tb(B+22|0,z|0,2);z=o+z|0;tb(B+24|0,z|0,2);z=n+z|0;tb(B+26|0,z|0,2);z=j+z|0;tb(B+28|0,z|0,2);tb(B+30|0,i+z|0,2);if(!A){h=0;do{g=vb(b+(h<<1)|0,2,0)|0|0;if(g<<16>>16){z=B+((g&65535)<<1)|0;A=vb(z|0,2,0)|0|0;tb(z|0,A+1<<16>>16|0,2);tb(f+((A&65535)<<1)|0,h|0,2)}h=h+1|0}while((h|0)!=(c|0))}a:do switch(a|0){case 0:{u=f;v=0;w=19;x=f;break}case 1:{if(E>>>0>10)g=1;else{u=12574;v=1;w=256;x=12448;break a}l=G;return g|0}default:{u=13150;v=0;w=-1;x=13024}}while(0);z=1<<E;c=z+-1|0;A=E&255;g=E;h=0;n=0;y=-1;j=vb(d|0,4,0)|0|0;i=0;b:while(1){s=1<<g;r=k;t=i;while(1){o=r-h|0;g=o&255;i=vb(f+(t<<1)|0,2,0)|0|0;k=i&65535;do if((k|0)<(w|0))q=0;else{if((k|0)<=(w|0)){i=0;q=96;break}i=vb(u+(k<<1)|0,2,0)|0|0;q=(vb(x+(k<<1)|0,2,0)|0)&255}while(0);o=1<<o;p=n>>>h;k=s;do{k=k-o|0;a=k+p|0;tb(j+(a<<2)>>0|0,q|0,1);tb(j+(a<<2)+1>>0|0,g|0,1);tb(j+(a<<2)+2|0,i|0,2)}while((k|0)!=0);i=1<<r+-1;while(1)if(!(i&n))break;else i=i>>>1;n=(i|0)==0?0:(i+-1&n)+i|0;t=t+1|0;B=D+(r<<1)|0;a=(vb(B|0,2,0)|0|0)+-1<<16>>16;tb(B|0,a|0,2);if(!(a<<16>>16)){if((r|0)==(C|0))break b;r=vb(b+((vb(f+(t<<1)|0,2,1)|0)<<1)|0,2,1)|0|0}if(r>>>0<=E>>>0)continue;p=n&c;if((p|0)!=(y|0))break}h=(h|0)==0?E:h;j=j+(s<<2)|0;i=r-h|0;c:do if(r>>>0<C>>>0){k=r;g=i;i=1<<i;while(1){i=i-(vb(D+(k<<1)|0,2,1)|0|0)|0;if((i|0)<1)break c;g=g+1|0;k=g+h|0;if(k>>>0>=C>>>0)break;else i=i<<1}}else g=i;while(0);o=(1<<g)+z|0;if(v&o>>>0>1455){g=1;F=45;break}tb((vb(d|0,4,0)|0|0)+(p<<2)>>0|0,g|0,1);tb((vb(d|0,4,0)|0|0)+(p<<2)+1>>0|0,A|0,1);k=vb(d|0,4,0)|0|0;tb(k+(p<<2)+2|0,(j-k|0)>>>2|0,2);k=r;y=p;i=t;z=o}if((F|0)==45){l=G;return g|0}if(n|0){i=C;while(1){if((h|0)==0|(n&c|0)==(y|0))k=g;else{h=0;i=E;j=vb(d|0,4,0)|0|0;k=A}g=n>>>h;tb(j+(g<<2)>>0|0,64|0,1);tb(j+(g<<2)+1>>0|0,k|0,1);tb(j+(g<<2)+2|0,0|0,2);g=1<<i+-1;while(1)if(!(g&n))break;else g=g>>>1;n=(g|0)==0?0:(g+-1&n)+g|0;if(!n)break;else g=k}}tb(d|0,(vb(d|0,4,0)|0|0)+(z<<2)|0,4);tb(e|0,E|0,4);d=0;l=G;return d|0}function Ob(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;y=vb(a+28|0,4,0)|0|0;c=(vb(a|0,4,0)|0|0)+-1|0;B=a+4|0;z=c+((vb(B|0,4,0)|0|0)+-5)|0;F=a+12|0;l=(vb(F|0,4,0)|0|0)+-1|0;C=a+16|0;q=vb(C|0,4,0)|0|0;A=l+(q+-257)|0;t=vb(y+40|0,4,0)|0|0;u=vb(y+44|0,4,0)|0|0;v=vb(y+48|0,4,0)|0|0;E=y+56|0;D=y+60|0;r=vb(y+76|0,4,0)|0|0;s=vb(y+80|0,4,0)|0|0;w=(1<<(vb(y+84|0,4,0)|0))+-1|0;x=(1<<(vb(y+88|0,4,0)|0))+-1|0;q=l+(q-b)|0;n=(vb(y+52|0,4,0)|0|0)+-1|0;p=(v|0)==0;o=v+t|0;m=q-v|0;e=vb(D|0,4,0)|0|0;d=vb(E|0,4,0)|0|0;b=l;a:while(1){if(e>>>0<15){l=c+2|0;h=e+16|0;d=((vb(c+1>>0|0,1,1)|0|0)<<e)+d+((vb(l>>0|0,1,1)|0|0)<<e+8)|0;c=l}else h=e;e=d&w;g=vb(r+(e<<2)>>0|0,1,0)|0|0;f=vb(r+(e<<2)+2|0,2,0)|0|0;e=vb(r+(e<<2)+1>>0|0,1,1)|0|0;d=d>>>e;e=h-e|0;do if(g<<24>>24){g=g&255;while(1){if(g&16|0)break;if(g&64|0){G=51;break a}l=(d&(1<<g)+-1)+(f&65535)|0;g=vb(r+(l<<2)>>0|0,1,0)|0|0;f=vb(r+(l<<2)+2|0,2,0)|0|0;l=vb(r+(l<<2)+1>>0|0,1,1)|0|0;d=d>>>l;e=e-l|0;if(!(g<<24>>24)){G=6;break}else g=g&255}if((G|0)==6){f=f&255;G=7;break}h=f&65535;i=g&15;if(!i)g=d;else{f=c+1|0;if(e>>>0<i>>>0){g=e+8|0;d=((vb(f>>0|0,1,1)|0|0)<<e)+d|0;c=f}else g=e;e=g-i|0;g=d>>>i;h=(d&(1<<i)+-1)+h|0}if(e>>>0<15){l=c+2|0;f=e+16|0;d=((vb(c+1>>0|0,1,1)|0|0)<<e)+g+((vb(l>>0|0,1,1)|0|0)<<e+8)|0;c=l}else{f=e;d=g}l=d&x;g=vb(s+(l<<2)+2|0,2,0)|0|0;e=vb(s+(l<<2)+1>>0|0,1,1)|0|0;d=d>>>e;e=f-e|0;f=vb(s+(l<<2)>>0|0,1,1)|0|0;if(!(f&16))do{if(f&64|0){f=14610;G=53;break a}f=(d&(1<<f)+-1)+(g&65535)|0;g=vb(s+(f<<2)+2|0,2,0)|0|0;l=vb(s+(f<<2)+1>>0|0,1,1)|0|0;d=d>>>l;e=e-l|0;f=vb(s+(f<<2)>>0|0,1,1)|0|0}while((f&16|0)==0);i=g&65535;j=f&15;if(e>>>0<j>>>0){g=c+1|0;d=((vb(g>>0|0,1,1)|0|0)<<e)+d|0;f=e+8|0;c=c+2|0;if(f>>>0<j>>>0){e=e+16|0;d=((vb(c>>0|0,1,1)|0|0)<<f)+d|0}else{e=f;c=g}}l=(d&(1<<j)+-1)+i|0;d=d>>>j;e=e-j|0;j=b;f=j-q|0;if(l>>>0<=f>>>0){i=b+(0-l)|0;g=b;while(1){tb(g+1>>0|0,vb(i+1>>0|0,1,0)|0|0|0,1);tb(g+2>>0|0,vb(i+2>>0|0,1,0)|0|0|0,1);f=i+3|0;b=g+3|0;tb(b>>0|0,vb(f>>0|0,1,0)|0|0|0,1);h=h+-3|0;if(h>>>0<=2)break;else{i=f;g=b}}if(!h)break;b=g+4|0;tb(b>>0|0,vb(i+4>>0|0,1,0)|0|0|0,1);if((h|0)==1)break;b=g+5|0;tb(b>>0|0,vb(i+5>>0|0,1,0)|0|0|0,1);break}i=l-f|0;if(i>>>0>u>>>0){f=14632;G=53;break a}do if(p){f=n+(t-i)|0;if(h>>>0>i>>>0){g=h-i|0;h=i;i=b;do{f=f+1|0;i=i+1|0;tb(i>>0|0,vb(f>>0|0,1,0)|0|0|0,1);h=h+-1|0}while((h|0)!=0);b=b+q+(l-j)|0;f=b+(0-l)|0}else g=h}else{if(v>>>0>=i>>>0){f=n+(v-i)|0;if(h>>>0<=i>>>0){g=h;break}g=h-i|0;h=i;i=b;do{f=f+1|0;i=i+1|0;tb(i>>0|0,vb(f>>0|0,1,0)|0|0|0,1);h=h+-1|0}while((h|0)!=0);b=b+q+(l-j)|0;f=b+(0-l)|0;break}f=n+(o-i)|0;i=i-v|0;if(h>>>0>i>>>0){g=h-i|0;h=i;i=b;do{f=f+1|0;i=i+1|0;tb(i>>0|0,vb(f>>0|0,1,0)|0|0|0,1);h=h+-1|0}while((h|0)!=0);h=l-j|0;k=b+m+h|0;if(g>>>0>v>>>0){i=n;j=v;f=k;do{i=i+1|0;f=f+1|0;tb(f>>0|0,vb(i>>0|0,1,0)|0|0|0,1);j=j+-1|0}while((j|0)!=0);b=b+q+h|0;f=b+(0-l)|0;g=g-v|0}else{f=n;b=k}}else g=h}while(0);if(g>>>0>2){do{tb(b+1>>0|0,vb(f+1>>0|0,1,0)|0|0|0,1);tb(b+2>>0|0,vb(f+2>>0|0,1,0)|0|0|0,1);f=f+3|0;b=b+3|0;tb(b>>0|0,vb(f>>0|0,1,0)|0|0|0,1);g=g+-3|0}while(g>>>0>2);h=b}else h=b;if(g){b=h+1|0;tb(b>>0|0,vb(f+1>>0|0,1,0)|0|0|0,1);if((g|0)!=1){b=h+2|0;tb(b>>0|0,vb(f+2>>0|0,1,0)|0|0|0,1)}}else b=h}else{f=f&255;G=7}while(0);if((G|0)==7){G=0;b=b+1|0;tb(b>>0|0,f|0,1)}if(!(b>>>0<A>>>0&c>>>0<z>>>0)){G=55;break}}if((G|0)==51)if(!(g&32)){f=14582;G=53}else f=11;else if((G|0)==55){G=e>>>3;x=0-G|0;x=c+x|0;G=G<<3;G=e-G|0;y=1<<G;y=y+-1|0;y=y&d;w=x+1|0;tb(a|0,w|0,4);a=b+1|0;tb(F|0,a|0,4);a=x;F=z;F=F+5|0;a=F-a|0;tb(B|0,a|0,4);a=b;F=A;F=F+257|0;a=F-a|0;tb(C|0,a|0,4);tb(E|0,y|0,4);tb(D|0,G|0,4);return}if((G|0)==53){tb(a+24|0,f|0,4);f=27}tb(y|0,f|0,4);v=e;y=d;u=c;x=b;G=v>>>3;w=0-G|0;w=u+w|0;G=G<<3;G=v-G|0;v=1<<G;v=v+-1|0;y=v&y;v=w+1|0;tb(a|0,v|0,4);a=x+1|0;tb(F|0,a|0,4);a=w;F=z;F=F+5|0;a=F-a|0;tb(B|0,a|0,4);a=x;F=A;F=F+257|0;a=F-a|0;tb(C|0,a|0,4);tb(E|0,y|0,4);tb(D|0,G|0,4);return}function Pb(a){a=a|0;var b=0;tb(a|0,8648|0,4);b=vb(a+324|0,4,0)|0|0;if(!b){Bd(a);return}gb[(xb(vb((vb(b|0,4,0)|0|0)+4|0,4,0)|0|0,127|0)|0)&127](b);Bd(a);return}function Qb(a){a=a|0;Pb(a);Ad(a);return}function Rb(a){a=a|0;tb(a+232|0,0|0,4);sd(a);td(a);return}function Sb(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0;e=a+132|0;c=qd(e,bb[(xb(vb((vb(b|0,4,0)|0|0)+16|0,4,0)|0|0,15|0)|0)&15](b)|0)|0;if(c|0){a=c;return a|0}g=vb((vb(b|0,4,0)|0|0)+12|0,4,0)|0|0;f=Zc(vb(e|0,4,0)|0|0)|0;d=a+136|0;c=rd(vb(d|0,4,0)|0|0)|0;c=db[(xb(g|0,31|0)|0)&31](b,f,c)|0;if(c|0){g=c;return g|0}b=vb((vb(a|0,4,0)|0|0)+16|0,4,0)|0|0;f=Zc(vb(e|0,4,0)|0|0)|0;g=rd(vb(d|0,4,0)|0|0)|0;g=db[(xb(b|0,31|0)|0)&31](a,f,g)|0;return g|0}function Tb(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;e=l;l=l+32|0;if((l|0)>=(m|0))X(32);d=e;if((Zc(vb(a+132|0,4,0)|0|0)|0)==(b|0))Aa(15195,15221,55,15241);id(d,b,c);o=0;b=oa(vb((vb(a|0,4,0)|0|0)+12|0,4,0)|0|0,a|0,d|0)|0;a=o;o=0;if(a&1){e=Fa()|0;_c(d);Ma(e|0)}else{_c(d);l=e;return b|0}return 0}function Ub(a){a=a|0;if(!(fc(vb(a+260|0,4,0)|0|0)|0))Aa(14662,14676,88,15186);else{Yc(a);return}}function Vb(a){a=a|0;Xc(a,+(+wb(a+240|0,8)));hc(a);return}function Wb(a){a=a|0;return}function Xb(a,b){a=a|0;b=b|0;Wc(a,b);return 0}function Yb(a,b){a=a|0;b=b|0;a=a+320|0;if((b|0)!=0&(vb(a|0,4,0)|0|0)==0){tb(a|0,b|0,4);return}else Aa(15109,15125,46,15146)}function Zb(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;d=a+320|0;c=vb(d|0,4,0)|0|0;if(!c){a=a+324|0;e=vb(a|0,4,0)|0|0;c=e;do if(!e){c=nc(172)|0;if(!c){tb(a|0,0|0,4);e=17698;return e|0}o=0;sa(55,c|0);e=o;o=0;if(e&1){e=Fa()|0;oc(c);Ma(e|0)}else{tb(a|0,c|0,4);break}}while(0);tb(d|0,c|0,4)}e=db[(xb(vb((vb(c|0,4,0)|0|0)+16|0,4,0)|0|0,31|0)|0)&31](c,b,50)|0;return e|0}function _b(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=l;l=l+32|0;if((l|0)>=(m|0))X(32);d=c;e=vb((vb(a|0,4,0)|0|0)+80|0,4,0)|0|0;lc(d,+(+wb(b|0,8)));ib[(xb(e|0,63|0)|0)&63](a,d);b=vb(a+320|0,4,0)|0|0;if(!b){l=c;return}d=vb((vb(b|0,4,0)|0|0)+24|0,4,0)|0|0;e=~~+(+wb((mc(a)|0)+8|0,8));ib[(xb(d|0,63|0)|0)&63](b,e);l=c;return}function $b(a,b){a=a|0;b=b|0;return}function ac(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,n=0,o=0,p=0;p=l;l=l+16|0;if((l|0)>=(m|0))X(16);j=p;c=jc(vb(a+232|0,4,0)|0|0)|0;if(!c){l=p;return}i=a+320|0;o=a+336|0;k=j+4|0;n=j+8|0;while(1){c=c+-1|0;if(!(1<<c&b)){e=vb(i|0,4,0)|0|0;d=vb(o|0,4,0)|0|0;if(!d)d=0;else d=vb(d+(c<<2)|0,4,0)|0|0;kb[(xb(vb((vb(e|0,4,0)|0|0)+12|0,4,0)|0|0,15|0)|0)&15](j,e,c,d);h=vb(j|0,4,0)|0|0;e=vb(k|0,4,0)|0|0;f=(e|0)==0;d=vb(n|0,4,0)|0|0;g=(d|0)==0;if(!h)if(f&g){e=0;d=0}else{c=11;break}else if(f|g){c=11;break}lb[(xb(vb((vb(a|0,4,0)|0|0)+76|0,4,0)|0|0,7|0)|0)&7](a,c,h,e,d)}else lb[(xb(vb((vb(a|0,4,0)|0|0)+76|0,4,0)|0|0,7|0)|0)&7](a,c,0,0,0);if(!c){c=3;break}}if((c|0)==3){l=p;return}else if((c|0)==11)Aa(14754,14725,76,14830)}function bc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,n=0;k=l;l=l+16|0;if((l|0)>=(m|0))X(16);j=k;if(!b){a=0;l=k;return a|0}g=a+320|0;h=a+332|0;i=a+328|0;d=b;while(1){f=vb(g|0,4,0)|0|0;d=d-(db[(xb(vb((vb(f|0,4,0)|0|0)+36|0,4,0)|0|0,31|0)|0)&31](f,c+(b-d<<1)|0,d)|0)|0;if(!d){d=0;e=11;break}n=vb(h|0,4,0)|0|0;e=vb(g|0,4,0)|0|0;f=gc(vb(e+4|0,4,0)|0|0)|0;if((n|0)!=(f|0)){tb(h|0,f|0,4);hc(a);e=vb(g|0,4,0)|0|0}f=ic(vb(e+12|0,4,0)|0|0)|0;tb(j|0,(O(vb(i|0,4,0)|0|0,f)|0)/1e3|0|0,4);f=db[(xb(vb((vb(a|0,4,0)|0|0)+84|0,4,0)|0|0,31|0)|0)&31](a,j,f)|0;if(f|0){e=10;break}e=vb(j|0,4,0)|0|0;if(!e){e=9;break}n=vb(g|0,4,0)|0|0;ib[(xb(vb((vb(n|0,4,0)|0|0)+32|0,4,0)|0|0,63|0)|0)&63](n,e)}if((e|0)==9)Aa(14709,14725,120,14748);else if((e|0)==10){n=f;l=k;return n|0}else if((e|0)==11){l=k;return d|0}return 0}function cc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;do if((b|0)>3e4){f=vb(a+236|0,4,0)|0|0;dc(a,-1);i=a+276|0;g=a+308|0;while(1){if(vb(i>>0|0,1,0)|0|0){h=b;b=7;break}m=vb((vb(a|0,4,0)|0|0)+68|0,4,0)|0|0;e=ec(vb(g|0,4,0)|0|0)|0;e=db[(xb(m|0,31|0)|0)&31](a,2048,e)|0;if(e|0){c=e;b=12;break}b=b+-2048|0;if((b|0)<=15e3){h=b;b=7;break}}if((b|0)==7){dc(a,f);j=a;k=g;d=h;l=i;break}else if((b|0)==12)return c|0}else{j=a;k=a+308|0;d=b;l=a+276|0}while(0);while(1){if(!d){c=0;b=12;break}if(vb(l>>0|0,1,0)|0|0){c=0;b=12;break}b=(d|0)<2048?d:2048;m=vb((vb(j|0,4,0)|0|0)+68|0,4,0)|0|0;c=ec(vb(k|0,4,0)|0|0)|0;c=db[(xb(m|0,31|0)|0)&31](a,b,c)|0;if(!c)d=d-b|0;else{b=12;break}}if((b|0)==12)return c|0;return 0}function dc(a,b){a=a|0;b=b|0;if(!(fc(vb(a+260|0,4,0)|0|0)|0))Aa(14662,14676,129,14697);else{tb(a+236|0,b|0,4);ib[(xb(vb((vb(a|0,4,0)|0|0)+56|0,4,0)|0|0,63|0)|0)&63](a,b);return}}function ec(a){a=a|0;return a|0}function fc(a){a=a|0;return a|0}function gc(a){a=a|0;return a|0}function hc(a){a=a|0;dc(a,vb(a+236|0,4,0)|0|0);return}function ic(a){a=a|0;return a|0}function jc(a){a=a|0;return a|0}function kc(a,b){a=a|0;b=b|0;return}function lc(a,b){a=a|0;b=+b;ub(a|0,+b,8);tb(a+8|0,0|0,4);tb(a+12|0,44100|0,4);tb(a+16|0,0|0,4);return}function mc(a){a=a|0;return a+144|0}function nc(a){a=a|0;return zl(a)|0}function oc(a){a=a|0;Al(a);return}function pc(a){a=a|0;var b=0,c=0,d=0;qc(a,2);tb(a|0,8744|0,4);d=a+20|0;tc(d);c=a+64|0;tc(c);b=a+108|0;tc(b);tb(a+152|0,d|0,4);tb(a+156|0,c|0,4);tb(a+160|0,b|0,4);return}function qc(a,b){a=a|0;b=b|0;tb(a|0,8796|0,4);tb(a+16|0,b|0,4);tb(a+12|0,0|0,4);tb(a+8|0,0|0,4);tb(a+4|0,1|0,4);return}function rc(a){a=a|0;return}function sc(a){a=a|0;if((vb(a+12|0,4,0)|0|0)==1)return;Al(vb(a+8|0,4,0)|0|0);return}function tc(a){a=a|0;var b=0;tb(a|0,2147483647|0,4);b=a+4|0;tb(b|0,0|0,4);tb(b+4|0,0|0,4);tb(b+8|0,0|0,4);tb(b+12|0,0|0,4);tb(b+16|0,0|0,4);tb(b+20|0,0|0,4);tb(b+24|0,0|0,4);tb(a+32|0,16|0,4);tb(a+36|0,0|0,4);return}function uc(a){a=a|0;tb(a|0,8744|0,4);sc(a+108|0);sc(a+64|0);sc(a+20|0);return}function vc(a){a=a|0;uc(a);oc(a);return}function wc(a,b){a=a|0;b=b|0;return 0}function xc(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;b=b+152|0;tb(a|0,vb(b|0,4,0)|0|0,4);tb(a+4|0,vb(b+4|0,4,0)|0|0,4);tb(a+8|0,vb(b+8|0,4,0)|0|0,4);return}function yc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=Rc(a+20|0,b,c)|0;if(d|0){a=d;return a|0}d=Rc(a+64|0,b,c)|0;if(d|0){a=d;return a|0}d=Rc(a+108|0,b,c)|0;if(d|0){a=d;return a|0}b=Sc(vb(a+44|0,4,0)|0|0)|0;Uc(a,b,Tc(vb(a+56|0,4,0)|0|0)|0);a=0;return a|0}function zc(a,b){a=a|0;b=b|0;Pc(a+20|0,b);Pc(a+64|0,b);Pc(a+108|0,b);return}function Ac(a,b){a=a|0;b=b|0;Oc(a+20|0,b);Oc(a+64|0,b);Oc(a+108|0,b);return}function Bc(a){a=a|0;tb(a+164|0,0|0,4);tb(a+168|0,0|0,4);Nc(a+20|0);Nc(a+64|0);Nc(a+108|0);return}function Cc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;d=a+164|0;tb(d|0,0|0,4);c=a+20|0;e=Lc(c)|0;tb(d|0,vb(d|0,4,0)|0|e|0,4);Mc(c,b);c=a+64|0;e=(Lc(c)|0)<<1;tb(d|0,vb(d|0,4,0)|0|e|0,4);Mc(c,b);a=a+108|0;c=(Lc(a)|0)<<2;tb(d|0,vb(d|0,4,0)|0|c|0,4);Mc(a,b);return}function Dc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0;if(c&1|0)Aa(14843,14856,108,15497);e=c>>>1;c=a+20|0;d=a+24|0;h=Fc(vb(d|0,4,0)|0|0)|0;e=(e|0)>(h|0)?h:e;if(!e){a=e<<1;return a|0}g=a+164|0;h=a+168|0;f=vb(h|0,4,0)|0|(vb(g|0,4,0)|0);do if((f|0)>=2)if(!(f&1)){Kc(a,b,e);Ic(c,e);Hc(a+64|0,e);Hc(a+108|0,e);break}else{Jc(a,b,e);Hc(c,e);Hc(a+64|0,e);Hc(a+108|0,e);break}else{Gc(a,b,e);Hc(c,e);Ic(a+64|0,e);Ic(a+108|0,e)}while(0);if(Fc(vb(d|0,4,0)|0|0)|0){a=e<<1;return a|0}tb(h|0,vb(g|0,4,0)|0|0,4);tb(g|0,0|0,4);a=e<<1;return a|0}function Ec(a){a=a|0;return (Fc(vb(a+24|0,4,0)|0|0)|0)<<1|0}function Fc(a){a=a|0;return a>>>16|0}function Gc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0;f=vb(a+40|0,4,0)|0|0;g=a+36|0;d=vb(g|0,4,0)|0|0;if(!c){f=d;tb(g|0,f|0,4);return}e=d;a=vb(a+28|0,4,0)|0|0;while(1){h=e>>14;d=e-(e>>f)+(vb(a|0,4,0)|0|0)|0;e=((h<<16>>16|0)==(h|0)?h:32767-(e>>31)|0)&65535;tb(b|0,e|0,2);tb(b+2|0,e|0,2);c=c+-1|0;if(!c)break;else{e=d;a=a+4|0;b=b+4|0}}tb(g|0,d|0,4);return}function Hc(a,b){a=a|0;b=b|0;var c=0,d=0;if(!b)return;Ic(a,b);c=(Fc(vb(a+4|0,4,0)|0|0)|0)+18|0;a=a+8|0;d=vb(a|0,4,0)|0|0;Nn(d|0,d+(b<<2)|0,c<<2|0)|0;On((vb(a|0,4,0)|0|0)+(c<<2)|0,0,b<<2|0)|0;return}function Ic(a,b){a=a|0;b=b|0;var c=0;a=a+4|0;c=vb(a|0,4,0)|0|0;if((Fc(c)|0)<(b|0))Aa(14880,14905,152,14928);else{tb(a|0,c-(b<<16)|0,4);return}}function Jc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;i=vb(a+84|0,4,0)|0|0;j=a+80|0;e=vb(j|0,4,0)|0|0;k=a+124|0;d=vb(k|0,4,0)|0|0;l=a+36|0;f=vb(l|0,4,0)|0|0;if(!c){g=f;i=e;h=d;tb(l|0,g|0,4);tb(k|0,h|0,4);tb(j|0,i|0,4);return}h=vb(a+28|0,4,0)|0|0;g=vb(a+72|0,4,0)|0|0;a=vb(a+116|0,4,0)|0|0;while(1){m=f>>14;n=m+(e>>14)|0;m=m+(d>>14)|0;f=f-(f>>i)+(vb(h|0,4,0)|0|0)|0;e=e-(e>>i)+(vb(g|0,4,0)|0|0)|0;d=d-(d>>i)+(vb(a|0,4,0)|0|0)|0;tb(b|0,((n<<16>>16|0)==(n|0)?n:32767-(n>>24)|0)|0,2);tb(b+2|0,((m<<16>>16|0)==(m|0)?m:32767-(m>>24)|0)|0,2);c=c+-1|0;if(!c)break;else{h=h+4|0;g=g+4|0;b=b+4|0;a=a+4|0}}tb(l|0,f|0,4);tb(k|0,d|0,4);tb(j|0,e|0,4);return}function Kc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;j=vb(a+84|0,4,0)|0|0;k=a+80|0;d=vb(k|0,4,0)|0|0;l=a+124|0;e=vb(l|0,4,0)|0|0;if(!c){j=d;i=e;tb(l|0,i|0,4);tb(k|0,j|0,4);return}i=c;g=d;h=vb(a+72|0,4,0)|0|0;f=e;e=vb(a+116|0,4,0)|0|0;while(1){m=g>>14;a=f>>14;d=g-(g>>j)+(vb(h|0,4,0)|0|0)|0;c=f-(f>>j)+(vb(e|0,4,0)|0|0)|0;tb(b|0,((m<<16>>16|0)==(m|0)?m:32767-(g>>31)|0)|0,2);tb(b+2|0,((a<<16>>16|0)==(a|0)?a:32767-(f>>31)|0)|0,2);i=i+-1|0;if(!i)break;else{g=d;h=h+4|0;b=b+4|0;f=c;e=e+4|0}}tb(l|0,c|0,4);tb(k|0,d|0,4);return}function Lc(a){a=a|0;var b=0;b=a+40|0;a=vb(b|0,4,0)|0|0;tb(b|0,0|0,4);return a|0}function Mc(a,b){a=a|0;b=b|0;var c=0;b=O(vb(a|0,4,0)|0|0,b)|0;c=a+4|0;b=(vb(c|0,4,0)|0|0)+b|0;tb(c|0,b|0,4);b=Fc(b)|0;if((b|0)>(vb(a+12|0,4,0)|0|0))Aa(14943,14905,147,18514);else return}function Nc(a){a=a|0;var b=0;tb(a+4|0,0|0,4);tb(a+16|0,0|0,4);tb(a+40|0,0|0,4);b=vb(a+8|0,4,0)|0|0;if(!b)return;On(b|0,0,((vb(a+12|0,4,0)|0)<<2)+72|0)|0;return}function Oc(a,b){a=a|0;b=b|0;tb(a+32|0,b|0,4);if((b|0)>0){b=(b<<16|0)/(vb(a+24|0,4,0)|0|0)|0;if(b>>>0>=2)if(b>>>0>=4)if(b>>>0>=8)if(b>>>0>=16)if(b>>>0>=32)if(b>>>0>=64)if(b>>>0>=128)if(b>>>0>=256)if(b>>>0>=512)if(b>>>0>=1024)if(b>>>0>=2048)if(b>>>0<4096)b=2;else b=b>>>0<8192&1;else b=3;else b=4;else b=5;else b=6;else b=7;else b=8;else b=9;else b=10;else b=11;else b=12;else b=13}else b=31;tb(a+20|0,b|0,4);return}function Pc(a,b){a=a|0;b=b|0;tb(a+28|0,b|0,4);tb(a|0,Qc(vb(a+24|0,4,0)|0|0,b)|0|0,4);return}function Qc(a,b){a=a|0;b=b|0;b=~~+A(+(+(a|0)/+(b|0)*65536.0+.5));if((a|0)==0|(b|0)>0)return b|0;else Aa(14982,14905,127,15010);return 0}function Rc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0;f=a+12|0;d=vb(f|0,4,0)|0|0;if((d|0)==1)Aa(15028,14905,83,16084);g=(c|0)!=0;do if(g){e=(O(c+1|0,b)|0)+999|0;if((e|0)<65453e3){h=(e|0)/1e3|0;break}else Aa(15028,14905,95,16084)}else h=65453;while(0);do if((d|0)!=(h|0)){d=a+8|0;e=Bl(vb(d|0,4,0)|0|0,(h<<2)+72|0)|0;if(!e){a=17698;return a|0}else{tb(d|0,e|0,4);break}}while(0);tb(f|0,h|0,4);if((h|0)==1)Aa(15030,14905,107,16084);tb(a+24|0,b|0,4);h=((h*1e3|0)/(b|0)|0)+-1|0;tb(a+36|0,h|0,4);if(!((h|0)==(c|0)|g^1))Aa(15062,14905,113,16084);d=vb(a+28|0,4,0)|0|0;if(d|0)Pc(a,d);Oc(a,vb(a+32|0,4,0)|0|0);Nc(a);a=0;return a|0}function Sc(a){a=a|0;return a|0}function Tc(a){a=a|0;return a|0}function Uc(a,b,c){a=a|0;b=b|0;c=c|0;tb(a+8|0,b|0,4);tb(a+12|0,c|0,4);return}function Vc(a){a=a|0;oc(a);return}function Wc(a,b){a=a|0;b=b|0;if(!(fc(vb(a+260|0,4,0)|0|0)|0)){tb(a+256>>0|0,b&1|0,1);return}else Aa(19230,14676,112,15157)}function Xc(a,b){a=a|0;b=+b;if(!(fc(vb(a+260|0,4,0)|0|0)|0))Aa(14662,14676,136,15176);else{b=b<.02?.02:b;b=b>4.0?4.0:b;ub(a+240|0,+b,8);hb[(xb(vb((vb(a|0,4,0)|0|0)+60|0,4,0)|0|0,7|0)|0)&7](a,b);return}}function Yc(a){a=a|0;gb[(xb(vb((vb(a|0,4,0)|0|0)+8|0,4,0)|0|0,127|0)|0)&127](a);return}function Zc(a){a=a|0;return a|0}function _c(a){a=a|0;tb(a|0,8848|0,4);if(!(vb(a+16>>0|0,1,0)|0))return;Al(vb(a+4|0,4,0)|0|0);return}function $c(a){a=a|0;return}function ad(a){a=a|0;_c(a);Em(a);return}function bd(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=bb[(xb(vb((vb(a|0,4,0)|0|0)+16|0,4,0)|0|0,15|0)|0)&15](a)|0;c=(c|0)<0|(d|0)<(c|0)?d:c;d=a+12|0;Mn(b|0,(vb(a+4|0,4,0)|0|0)+(vb(d|0,4,0)|0|0)|0,c|0)|0;tb(d|0,(vb(d|0,4,0)|0|0)+c|0,4);return c|0}function cd(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<1){c=15251;return c|0}b=db[(xb(vb((vb(a|0,4,0)|0|0)+8|0,4,0)|0|0,31|0)|0)&31](a,b,c)|0;if((b|0)==(c|0)){c=0;return c|0}else return ((b|0)>-1&(b|0)<(c|0)?15264:15287)|0;return 0}function dd(a){a=a|0;var b=0;b=bb[(xb(vb((vb(a|0,4,0)|0|0)+24|0,4,0)|0|0,15|0)|0)&15](a)|0;return b-(bb[(xb(vb((vb(a|0,4,0)|0|0)+28|0,4,0)|0|0,15|0)|0)&15](a)|0)|0}function ed(a,b){a=a|0;b=b|0;var c=0,d=0;if((b|0)<0){a=15251;return a|0}if(!b){a=0;return a|0}d=vb(a|0,4,0)|0|0;c=vb(d+32|0,4,0)|0|0;b=(bb[(xb(vb(d+28|0,4,0)|0|0,15|0)|0)&15](a)|0)+b|0;a=cb[(xb(c|0,31|0)|0)&31](a,b)|0;return a|0}function fd(a){a=a|0;return vb(a+8|0,4,0)|0|0}function gd(a){a=a|0;return vb(a+12|0,4,0)|0|0}function hd(a,b){a=a|0;b=b|0;if((b|0)>=0)if((vb(a+8|0,4,0)|0|0)<(b|0))b=15264;else{tb(a+12|0,b|0,4);b=0}else b=15251;return b|0}function id(a,b,c){a=a|0;b=b|0;c=c|0;jd(a);tb(a|0,8848|0,4);tb(a+4|0,b|0,4);tb(a+8|0,kd(c)|0|0,4);tb(a+12|0,0|0,4);c=a+16|0;tb(c>>0|0,0|0,1);if(!b)return;if(!(ld(a)|0))return;tb(c>>0|0,1|0,1);return}function jd(a){a=a|0;md(a);tb(a|0,8892|0,4);return}function kd(a){a=a|0;return ((a|0)>0?a:0)|0}function ld(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=l;l=l+64|0;if((l|0)>=(m|0))X(64);j=k;i=a+8|0;c=vb(i|0,4,0)|0|0;if((c|0)>1?Ol(vb(a+4|0,4,0)|0|0,15344,2)|0:0){j=0;l=k;return j|0}h=(c|0)/2|0;b=zl(c)|0;if(!b){j=0;l=k;return j|0}e=a+4|0;tb(j|0,vb(e|0,4,0)|0|0,4);tb(j+4|0,c|0,4);g=j+20|0;tb(g|0,0|0,4);tb(j+32|0,0|0,4);tb(j+36|0,0|0,4);a:do if(!(Hb(j,31,15346)|0)){f=j+12|0;d=j+16|0;do{a=vb(g|0,4,0)|0|0;if(a>>>0>=c>>>0){c=c+h|0;b=Bl(b,c)|0;if(!b){a=0;break a}a=vb(g|0,4,0)|0|0}tb(f|0,b+a|0,4);tb(d|0,c-a|0,4)}while((Jb(j,2)|0)==0);if(!(Mb(j)|0)){tb(e|0,b|0,4);tb(i|0,vb(g|0,4,0)|0|0,4);a=1;break}else{Al(b);a=0;break}}else{Al(b);a=0}while(0);j=a;l=k;return j|0}function md(a){a=a|0;tb(a|0,8936|0,4);return}function nd(a){a=a|0;Em(a);return}function od(a){a=a|0;Em(a);return}function pd(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;f=l;l=l+512|0;if((l|0)>=(m|0))X(512);e=f;if((b|0)<0){a=15251;l=f;return a|0}c=b;while(1){if(!c){b=0;break}d=(c|0)<512?c:512;b=db[(xb(vb((vb(a|0,4,0)|0|0)+12|0,4,0)|0|0,31|0)|0)&31](a,e,d)|0;if(!b)c=c-d|0;else break}a=b;l=f;return a|0}function qd(a,b){a=a|0;b=b|0;var c=0;c=Bl(vb(a|0,4,0)|0|0,b)|0;if((b|0)!=0&(c|0)==0){a=17698;return a|0}tb(a|0,c|0,4);tb(a+4|0,b|0,4);a=0;return a|0}function rd(a){a=a|0;return a|0}function sd(a){a=a|0;tb(a+264|0,-1|0,4);tb(a+268|0,0|0,4);tb(a+272|0,0|0,4);tb(a+276>>0|0,1|0,1);tb(a+277>>0|0,1|0,1);tb(a+280|0,1073741824|0,4);tb(a+284|0,1|0,4);tb(a+296|0,0|0,4);tb(a+300|0,0|0,4);tb(a+304|0,0|0,4);zd(a)|0;return}function td(a){a=a|0;ud(a);tb(a+8|0,0|0,4);tb(a+12|0,0|0,4);vd(a+132|0);return}function ud(a){a=a|0;wd(a+28|0);gb[(xb(vb((vb(a|0,4,0)|0|0)+32|0,4,0)|0|0,127|0)|0)&127](a);tb(a+8|0,vb(a+12|0,4,0)|0|0,4);return}function vd(a){a=a|0;var b=0;b=vb(a|0,4,0)|0|0;tb(a|0,0|0,4);tb(a+4|0,0|0,4);Al(b);return}function wd(a){a=a|0;tb(a+16|0,0|0,4);xd(a);yd(a+8|0);return}function xd(a){a=a|0;var b=0;b=vb(a|0,4,0)|0|0;tb(a|0,0|0,4);tb(a+4|0,0|0,4);Al(b);return}function yd(a){a=a|0;var b=0;b=vb(a|0,4,0)|0|0;tb(a|0,0|0,4);tb(a+4|0,0|0,4);Al(b);return}function zd(a){a=a|0;var b=0;b=a+16|0;a=vb(b|0,4,0)|0|0;tb(b|0,0|0,4);return a|0}function Ad(a){a=a|0;Al(a);return}function Bd(a){a=a|0;var b=0;tb(a|0,8968|0,4);b=vb(a+316|0,4,0)|0|0;if(b|0)gb[(xb(vb((vb(b|0,4,0)|0|0)+4|0,4,0)|0|0,127|0)|0)&127](b);Cd(a+308|0);Dd(a);return}function Cd(a){a=a|0;Al(vb(a|0,4,0)|0|0);return}function Dd(a){a=a|0;var b=0;tb(a|0,9052|0,4);b=vb(a+24|0,4,0)|0|0;if(b|0?(o=0,sa(b|0,vb(a+20|0,4,0)|0|0),b=o,o=0,b&1):0){b=Ga(0)|0;Ed(vb(a+132|0,4,0)|0|0);Fd(a+28|0);Gd(b)}Ed(vb(a+132|0,4,0)|0|0);Fd(a+28|0);return}function Ed(a){a=a|0;Al(a);return}function Fd(a){a=a|0;Hd(vb(a+8|0,4,0)|0|0);Id(a);return}function Gd(a){a=a|0;Ca(a|0)|0;cn()}function Hd(a){a=a|0;Al(a);return}function Id(a){a=a|0;Al(vb(a|0,4,0)|0|0);return}function Jd(a){a=a|0;Dd(a);Ad(a);return}function Kd(a){a=a|0;return}function Ld(a){a=a|0;Bd(a);Ad(a);return}function Md(a,b){a=a|0;b=b|0;return 15362}function Nd(a,b){a=a|0;b=b|0;return}function Od(a){a=a|0;tb(a|0,9096|0,4);Qd(a+32|0);Cd(a+4|0);return}function Pd(a){a=a|0;Od(a);Em(a);return}function Qd(a){a=a|0;Cd(a);return}function Rd(a){a=a|0;tb(a|0,9116|0,4);qe(a+164|0);qe(a+152|0);re(a+140|0);re(a+128|0);se(a+36|0);te(a+24|0);return}function Sd(a){a=a|0;Rd(a);oc(a);return}function Td(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if(d)if(!(d&512))d=(((d&255)>>>0)%3|0|0)==0?2:d&1;else d=2;else{d=(c|0)%5|0;d=(d|0)<2?d:2}b=(vb(b+36|0,4,0)|0|0)+(((((c|0)%(vb(b+20|0,4,0)|0|0)|0)*3|0)+d|0)*12|0)|0;tb(a|0,vb(b|0,4,0)|0|0,4);tb(a+4|0,vb(b+4|0,4,0)|0|0,4);tb(a+8|0,vb(b+8|0,4,0)|0|0,4);return}function Ud(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0;h=a+20|0;a:do if((vb(h|0,4,0)|0|0)>0){e=a+140|0;f=a+128|0;g=0;while(1){i=vb(e|0,4,0)|0|0;d=i+(g*12|0)|0;if((vb(i+(g*12|0)+4|0,4,0)|0|0)==(vb(d|0,4,0)|0|0)?(o=0,ua(22,d|0,4096),i=o,o=0,i&1):0)break;i=vb(f|0,4,0)|0|0;d=i+(g*12|0)|0;if((vb(i+(g*12|0)+4|0,4,0)|0|0)==(vb(d|0,4,0)|0|0)?(o=0,ua(22,d|0,16384),i=o,o=0,i&1):0)break;g=g+1|0;if((g|0)>=(vb(h|0,4,0)|0|0))break a}d=Ga(352)|0;i=z;if((i|0)!=(Va(352)|0))Ma(d|0);Ca(d|0)|0;Da();i=17698;return i|0}while(0);f=a+120|0;e=a+24|0;b:do if((vb(f|0,4,0)|0|0)>0){g=0;while(1){d=Rc((vb(e|0,4,0)|0|0)+(g*44|0)|0,b,c)|0;g=g+1|0;if(d|0)break;if((g|0)>=(vb(f|0,4,0)|0|0))break b}return d|0}while(0);ib[(xb(vb((vb(a|0,4,0)|0|0)+44|0,4,0)|0|0,63|0)|0)&63](a,a+48|0);gb[(xb(vb((vb(a|0,4,0)|0|0)+28|0,4,0)|0|0,127|0)|0)&127](a);i=vb(e|0,4,0)|0|0;b=Sc(vb(i+24|0,4,0)|0|0)|0;Uc(a,b,Tc(vb(i+36|0,4,0)|0|0)|0);i=0;return i|0}function Vd(a,b){a=a|0;b=b|0;var c=0,d=0;d=a+120|0;if((vb(d|0,4,0)|0|0)<=0)return;a=a+24|0;c=0;do{Pc((vb(a|0,4,0)|0|0)+(c*44|0)|0,b);c=c+1|0}while((c|0)<(vb(d|0,4,0)|0|0));return}function Wd(a,b){a=a|0;b=b|0;var c=0,d=0;d=a+120|0;if((vb(d|0,4,0)|0|0)<=0)return;a=a+24|0;c=0;do{Oc((vb(a|0,4,0)|0|0)+(c*44|0)|0,b);c=c+1|0}while((c|0)<(vb(d|0,4,0)|0|0));return}function Xd(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;tb(a+112|0,0|0,4);tb(a+116|0,0|0,4);f=a+20|0;if((vb(f|0,4,0)|0|0)>0){c=a+140|0;d=a+128|0;e=0;do{g=vb(c|0,4,0)|0|0;b=vb(g+(e*12|0)|0,4,0)|0|0;if((vb(g+(e*12|0)+4|0,4,0)|0|0)!=(b|0))On(b|0,0,8192)|0;g=vb(d|0,4,0)|0|0;b=vb(g+(e*12|0)|0,4,0)|0|0;if((vb(g+(e*12|0)+4|0,4,0)|0|0)!=(b|0))On(b|0,0,32768)|0;e=e+1|0}while((e|0)<(vb(f|0,4,0)|0|0))}d=a+120|0;if((vb(d|0,4,0)|0|0)<=0)return;b=a+24|0;c=0;do{Nc((vb(b|0,4,0)|0|0)+(c*44|0)|0);c=c+1|0}while((c|0)<(vb(d|0,4,0)|0|0));return}function Yd(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;o=a+104|0;c=vb(o>>0|0,1,0)|0|0;m=c<<24>>24?120:6;l=a+120|0;p=a+20|0;d=vb(p|0,4,0)|0|0;n=(vb(l|0,4,0)|0|0)/(d|0)|0;if((d|0)<=0){p=c;o=a+124|0;tb(o>>0|0,p|0,1);return}i=(n|0)>0;h=a+24|0;k=a+124|0;j=a+116|0;g=a+112|0;c=d;f=0;do{if(i){e=O(f,n)|0;a=0;d=0;do{c=d+e|0;a=(Lc((vb(h|0,4,0)|0|0)+(c*44|0)|0)|0)<<d|a;Mc((vb(h|0,4,0)|0|0)+(c*44|0)|0,b);if(a&m|0?(vb(l|0,4,0)|0|0)==((vb(p|0,4,0)|0|0)*7|0):0){q=vb(g|0,4,0)|0|0;tb(g|0,ie(q,(Fc(vb((vb(h|0,4,0)|0|0)+(c*44|0)+4|0,4,0)|0|0)|0)+8|0)|0|0,4)}if(!((vb(k>>0|0,1,0)|0|0)==0?!(vb(o>>0|0,1,0)|0|0):0)){q=vb(j|0,4,0)|0|0;tb(j|0,ie(q,(Fc(vb((vb(h|0,4,0)|0|0)+(c*44|0)+4|0,4,0)|0|0)|0)+8|0)|0|0,4)}d=d+1|0}while((d|0)!=(n|0));c=vb(p|0,4,0)|0|0}f=f+1|0}while((f|0)<(c|0));q=vb(o>>0|0,1,0)|0|0;p=k;tb(p>>0|0,q|0,1);return}function Zd(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;p=a+20|0;o=vb(p|0,4,0)|0|0;q=o<<1;o=(vb(a+120|0,4,0)|0|0)/(o|0)|0;if((c|0)%(q|0)|0|0)Aa(15439,15471,297,15497);n=a+24|0;j=de(Fc(vb((vb(n|0,4,0)|0|0)+4|0,4,0)|0|0)|0,(c|0)/(q|0)|0)|0;if(!j){a=O(j,q)|0;return a|0}l=a+116|0;m=a+112|0;k=(o|0)>0;i=j;do{c=vb(l|0,4,0)|0|0;do if(!c)if(!(vb(m|0,4,0)|0)){he(a,b,i);h=1;c=i;break}else{ge(a,b,i);h=3;c=i;break}else{c=(i|0)>(c|0)?c:i;if(!(vb(m|0,4,0)|0)){fe(a,b,c);h=3;break}else{ee(a,b,c);h=o;break}}while(0);b=b+((O(c,q)|0)<<1)|0;i=i-c|0;d=(vb(m|0,4,0)|0|0)-c|0;tb(m|0,((d|0)>0?d:0)|0,4);d=(vb(l|0,4,0)|0|0)-c|0;tb(l|0,((d|0)>0?d:0)|0,4);d=vb(p|0,4,0)|0|0;if((d|0)>0){g=0;do{if(k){f=O(g,o)|0;e=0;do{d=(vb(n|0,4,0)|0|0)+((e+f|0)*44|0)|0;if((e|0)<(h|0))Hc(d,c);else Ic(d,c);e=e+1|0}while((e|0)!=(o|0));d=vb(p|0,4,0)|0|0}g=g+1|0}while((g|0)<(d|0))}}while((i|0)!=0);a=O(j,q)|0;return a|0}function _d(a){a=a|0;return (Fc(vb((vb(a+24|0,4,0)|0|0)+4|0,4,0)|0|0)|0)<<1|0}function $d(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0.0,m=0.0;ae(a);g=a+48|0;h=a+104|0;if(((((vb(h>>0|0,1,0)|0|0)==0?vb(b+56>>0|0,1,0)|0|0:0)?(d=a+140|0,j=vb(d|0,4,0)|0|0,i=vb(j|0,4,0)|0|0,c=i,(vb(j+4|0,4,0)|0|0)!=(i|0)):0)?(f=a+20|0,(vb(f|0,4,0)|0|0)>0):0)?(e=a+128|0,On(c|0,0,8192)|0,On(vb(vb(e|0,4,0)|0|0,4,0)|0|0,0,32768)|0,(vb(f|0,4,0)|0|0)>1):0){c=1;do{On(vb((vb(d|0,4,0)|0|0)+(c*12|0)|0,4,0)|0|0,0,8192)|0;On(vb((vb(e|0,4,0)|0|0)+(c*12|0)|0,4,0)|0|0,0,32768)|0;c=c+1|0}while((c|0)<(vb(f|0,4,0)|0|0))}c=g;d=b;e=c+56|0;do{tb(c|0,vb(d|0,4,0)|0|0,4);c=c+4|0;d=d+4|0}while((c|0)<(e|0));tb(g+56>>0|0,vb(b+56>>0|0,1,0)|0|0|0,1);if(!(vb(h>>0|0,1,0)|0)){b=a+20|0;c=vb(b|0,4,0)|0|0;if((c|0)>0){e=a+36|0;d=a+24|0;f=0;do{j=f*3|0;g=f*7|0;h=g+1|0;c=g+2|0;i=vb(e|0,4,0)|0|0;tb(i+(j*12|0)|0,(vb(d|0,4,0)|0|0)+(g*44|0)|0,4);tb(i+(j*12|0)+4|0,(vb(d|0,4,0)|0|0)+(h*44|0)|0,4);tb(i+(j*12|0)+8|0,(vb(d|0,4,0)|0|0)+(c*44|0)|0,4);i=j+1|0;k=vb(e|0,4,0)|0|0;tb(k+(i*12|0)|0,(vb(d|0,4,0)|0|0)+(g*44|0)|0,4);tb(k+(i*12|0)+4|0,(vb(d|0,4,0)|0|0)+(h*44|0)|0,4);tb(k+(i*12|0)+8|0,(vb(d|0,4,0)|0|0)+(c*44|0)|0,4);j=j+2|0;i=vb(e|0,4,0)|0|0;tb(i+(j*12|0)|0,(vb(d|0,4,0)|0|0)+(g*44|0)|0,4);tb(i+(j*12|0)+4|0,(vb(d|0,4,0)|0|0)+(h*44|0)|0,4);tb(i+(j*12|0)+8|0,(vb(d|0,4,0)|0|0)+(c*44|0)|0,4);f=f+1|0;c=vb(b|0,4,0)|0|0}while((f|0)<(c|0))}}else{c=32768-~~(+(+wb(g|0,8))*32768.0+.5)|0;tb(a+176|0,c|0,4);tb(a+180|0,65536-c|0,4);c=32768-~~(+(+wb(a+56|0,8))*32768.0+.5)|0;tb(a+184|0,c|0,4);tb(a+188|0,65536-c|0,4);tb(a+212|0,~~(+(+wb(a+96|0,8))*32768.0+.5)|0,4);tb(a+200|0,~~(+(+wb(a+72|0,8))*32768.0+.5)|0,4);m=+(+wb(a+88|0,8))*.0005;l=+(be(vb(a+8|0,4,0)|0|0)|0);c=~~(m*l);b=~~(+(+wb(a+80|0,8))*.001*l);tb(a+204|0,ce(16384-(b-c<<1)|0,16382,0)|0|0,4);tb(a+208|0,ce(16385-(b+c<<1)|0,16383,1)|0|0,4);b=~~(+(+wb(a+64|0,8))*.001*l);tb(a+192|0,ce(c+4095-b|0,4095,0)|0|0,4);tb(a+196|0,ce(4095-c-b|0,4095,0)|0|0,4);b=a+20|0;c=vb(b|0,4,0)|0|0;if((c|0)>0){d=a+24|0;e=a+36|0;f=0;do{c=f*7|0;k=f*3|0;tb((vb(e|0,4,0)|0|0)+(k*12|0)|0,(vb(d|0,4,0)|0|0)+(c*44|0)|0,4);h=c+3|0;tb((vb(e|0,4,0)|0|0)+(k*12|0)+4|0,(vb(d|0,4,0)|0|0)+(h*44|0)|0,4);j=c+4|0;tb((vb(e|0,4,0)|0|0)+(k*12|0)+8|0,(vb(d|0,4,0)|0|0)+(j*44|0)|0,4);i=k+1|0;tb((vb(e|0,4,0)|0|0)+(i*12|0)|0,(vb(d|0,4,0)|0|0)+((c+1|0)*44|0)|0,4);tb((vb(e|0,4,0)|0|0)+(i*12|0)+4|0,(vb(d|0,4,0)|0|0)+(h*44|0)|0,4);tb((vb(e|0,4,0)|0|0)+(i*12|0)+8|0,(vb(d|0,4,0)|0|0)+(j*44|0)|0,4);k=k+2|0;tb((vb(e|0,4,0)|0|0)+(k*12|0)|0,(vb(d|0,4,0)|0|0)+((c+2|0)*44|0)|0,4);tb((vb(e|0,4,0)|0|0)+(k*12|0)+4|0,(vb(d|0,4,0)|0|0)+((c+5|0)*44|0)|0,4);tb((vb(e|0,4,0)|0|0)+(k*12|0)+8|0,(vb(d|0,4,0)|0|0)+((c+6|0)*44|0)|0,4);f=f+1|0;c=vb(b|0,4,0)|0|0}while((f|0)<(c|0))}}if((vb(a+120|0,4,0)|0|0)>=7)return;e=a+20|0;if((c|0)<=0)return;c=a+36|0;d=0;do{j=d*3|0;a=vb(c|0,4,0)|0|0;k=vb(a+(j*12|0)|0,4,0)|0|0;tb(a+(j*12|0)+4|0,k|0,4);tb(a+(j*12|0)+8|0,k|0,4);k=j+1|0;a=vb(c|0,4,0)|0|0;i=vb(a+(k*12|0)|0,4,0)|0|0;tb(a+(k*12|0)+4|0,i|0,4);tb(a+(k*12|0)+8|0,i|0,4);j=j+2|0;i=vb(c|0,4,0)|0|0;k=vb(i+(j*12|0)|0,4,0)|0|0;tb(i+(j*12|0)+4|0,k|0,4);tb(i+(j*12|0)+8|0,k|0,4);d=d+1|0}while((d|0)<(vb(e|0,4,0)|0|0));return}function ae(a){a=a|0;a=a+4|0;tb(a|0,(vb(a|0,4,0)|0|0)+1|0,4);return}function be(a){a=a|0;return a|0}function ce(a,b,c){a=a|0;b=b|0;c=c|0;return ((a|0)<(c|0)?c:(a|0)>(b|0)?b:a)|0}function de(a,b){a=a|0;b=b|0;return ((a|0)<(b|0)?a:b)|0}function ee(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0;V=a+20|0;if((vb(V|0,4,0)|0|0)<=0)return;J=a+24|0;N=a+128|0;M=a+140|0;L=a+164|0;K=a+152|0;Z=(c|0)==0;P=a+176|0;S=a+184|0;W=a+204|0;Q=a+180|0;R=a+188|0;X=a+208|0;Y=a+212|0;U=a+200|0;T=a+192|0;G=a+196|0;H=0;do{I=H*7|0;A=I+2|0;u=vb(J|0,4,0)|0|0;z=vb(u+(A*44|0)+20|0,4,0)|0|0;h=vb(u+(A*44|0)+16|0,4,0)|0|0;B=I+3|0;l=vb(u+(B*44|0)+16|0,4,0)|0|0;C=I+4|0;i=vb(u+(C*44|0)+16|0,4,0)|0|0;D=I+5|0;j=vb(u+(D*44|0)+16|0,4,0)|0|0;E=I+6|0;g=vb(u+(E*44|0)+16|0,4,0)|0|0;d=vb(u+(I*44|0)+16|0,4,0)|0|0;F=I+1|0;a=vb(u+(F*44|0)+16|0,4,0)|0|0;x=vb((vb(N|0,4,0)|0|0)+(H*12|0)|0,4,0)|0|0;y=vb((vb(M|0,4,0)|0|0)+(H*12|0)|0,4,0)|0|0;k=vb((vb(L|0,4,0)|0|0)+(H<<2)|0,4,0)|0|0;e=vb(K|0,4,0)|0|0;f=vb(e+(H<<2)|0,4,0)|0|0;if(!Z){w=H<<1;v=w|1;s=vb(u+(A*44|0)+8|0,4,0)|0|0;t=c;r=vb(u+(B*44|0)+8|0,4,0)|0|0;p=vb(u+(D*44|0)+8|0,4,0)|0|0;q=b;o=vb(u+(C*44|0)+8|0,4,0)|0|0;n=vb(u+(E*44|0)+8|0,4,0)|0|0;m=vb(u+(I*44|0)+8|0,4,0)|0|0;e=vb(u+(F*44|0)+8|0,4,0)|0|0;while(1){t=t+-1|0;$=d>>14;aa=a>>14;d=d-(d>>z)+(vb(m|0,4,0)|0|0)|0;a=a-(a>>z)+(vb(e|0,4,0)|0|0)|0;u=(O(vb(P|0,4,0)|0|0,$)|0)>>15;_=(O(vb(S|0,4,0)|0|0,aa)|0)>>15;_=u+(l>>14)+_+(vb(x+(((vb(W|0,4,0)|0|0)+f&16383)<<1)|0,2,0)|0|0)|0;$=(O(vb(Q|0,4,0)|0|0,$)|0)>>15;aa=(O(vb(R|0,4,0)|0|0,aa)|0)>>15;aa=$+(i>>14)+aa+(vb(x+(((vb(X|0,4,0)|0|0)+f&16383)<<1)|0,2,0)|0|0)|0;l=l-(l>>z)+(vb(r|0,4,0)|0|0)|0;i=i-(i>>z)+(vb(o|0,4,0)|0|0)|0;$=vb(Y|0,4,0)|0|0;tb(x+(f<<1)|0,(O($,_)|0)>>>15|0,2);tb(x+(f+1<<1)|0,(O(aa,$)|0)>>>15|0,2);f=f+2&16383;$=h>>14;h=h-(h>>z)+(vb(s|0,4,0)|0|0)|0;u=vb(U|0,4,0)|0|0;_=$+(j>>14)+_+((O(vb(y+(((vb(T|0,4,0)|0|0)+k&4095)<<1)|0,2,0)|0|0,u)|0)>>15)|0;u=$+(g>>14)+aa+((O(vb(y+(((vb(G|0,4,0)|0|0)+k&4095)<<1)|0,2,0)|0|0,u)|0)>>15)|0;j=j-(j>>z)+(vb(p|0,4,0)|0|0)|0;g=g-(g>>z)+(vb(n|0,4,0)|0|0)|0;tb(y+(k<<1)|0,$|0,2);k=k+1&4095;tb(q+(w<<1)|0,((_<<16>>16|0)==(_|0)?_:32767-(_>>24)|0)|0,2);tb(q+(v<<1)|0,((u<<16>>16|0)==(u|0)?u:32767-(u>>24)|0)|0,2);if(!t)break;else{s=s+4|0;r=r+4|0;p=p+4|0;q=q+((vb(V|0,4,0)|0)<<1<<1)|0;o=o+4|0;n=n+4|0;m=m+4|0;e=e+4|0}}e=vb(K|0,4,0)|0|0}tb(e+(H<<2)|0,f|0,4);tb((vb(L|0,4,0)|0|0)+(H<<2)|0,k|0,4);tb((vb(J|0,4,0)|0|0)+(B*44|0)+16|0,l|0,4);tb((vb(J|0,4,0)|0|0)+(C*44|0)+16|0,i|0,4);tb((vb(J|0,4,0)|0|0)+(D*44|0)+16|0,j|0,4);tb((vb(J|0,4,0)|0|0)+(E*44|0)+16|0,g|0,4);tb((vb(J|0,4,0)|0|0)+(I*44|0)+16|0,d|0,4);tb((vb(J|0,4,0)|0|0)+(F*44|0)+16|0,a|0,4);tb((vb(J|0,4,0)|0|0)+(A*44|0)+16|0,h|0,4);H=H+1|0}while((H|0)<(vb(V|0,4,0)|0|0));return}function fe(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0;I=a+20|0;if((vb(I|0,4,0)|0|0)<=0)return;x=a+24|0;z=a+128|0;y=a+140|0;B=a+164|0;A=a+152|0;M=(c|0)==0;C=a+176|0;D=a+184|0;J=a+204|0;E=a+180|0;F=a+188|0;K=a+208|0;L=a+212|0;H=a+200|0;G=a+192|0;u=a+196|0;v=0;do{w=v*7|0;s=w+2|0;m=vb(x|0,4,0)|0|0;p=vb(m+(s*44|0)+20|0,4,0)|0|0;h=vb(m+(s*44|0)+16|0,4,0)|0|0;d=vb(m+(w*44|0)+16|0,4,0)|0|0;t=w+1|0;a=vb(m+(t*44|0)+16|0,4,0)|0|0;q=vb((vb(z|0,4,0)|0|0)+(v*12|0)|0,4,0)|0|0;r=vb((vb(y|0,4,0)|0|0)+(v*12|0)|0,4,0)|0|0;g=vb((vb(B|0,4,0)|0|0)+(v<<2)|0,4,0)|0|0;e=vb(A|0,4,0)|0|0;f=vb(e+(v<<2)|0,4,0)|0|0;if(!M){o=v<<1;n=o|1;k=vb(m+(s*44|0)+8|0,4,0)|0|0;l=c;j=b;i=vb(m+(w*44|0)+8|0,4,0)|0|0;e=vb(m+(t*44|0)+8|0,4,0)|0|0;while(1){l=l+-1|0;Q=d>>14;P=a>>14;d=d-(d>>p)+(vb(i|0,4,0)|0|0)|0;a=a-(a>>p)+(vb(e|0,4,0)|0|0)|0;N=(O(vb(C|0,4,0)|0|0,Q)|0)>>15;N=((O(vb(D|0,4,0)|0|0,P)|0)>>15)+N|0;N=N+(vb(q+(((vb(J|0,4,0)|0|0)+f&16383)<<1)|0,2,0)|0|0)|0;Q=(O(vb(E|0,4,0)|0|0,Q)|0)>>15;Q=((O(vb(F|0,4,0)|0|0,P)|0)>>15)+Q|0;Q=Q+(vb(q+(((vb(K|0,4,0)|0|0)+f&16383)<<1)|0,2,0)|0|0)|0;P=vb(L|0,4,0)|0|0;tb(q+(f<<1)|0,(O(P,N)|0)>>>15|0,2);tb(q+(f+1<<1)|0,(O(Q,P)|0)>>>15|0,2);f=f+2&16383;P=h>>14;h=h-(h>>p)+(vb(k|0,4,0)|0|0)|0;m=vb(H|0,4,0)|0|0;N=N+P+((O(vb(r+(((vb(G|0,4,0)|0|0)+g&4095)<<1)|0,2,0)|0|0,m)|0)>>15)|0;m=Q+P+((O(vb(r+(((vb(u|0,4,0)|0|0)+g&4095)<<1)|0,2,0)|0|0,m)|0)>>15)|0;tb(r+(g<<1)|0,P|0,2);g=g+1&4095;tb(j+(o<<1)|0,((N<<16>>16|0)==(N|0)?N:32767-(N>>24)|0)|0,2);tb(j+(n<<1)|0,((m<<16>>16|0)==(m|0)?m:32767-(m>>24)|0)|0,2);if(!l)break;else{k=k+4|0;j=j+((vb(I|0,4,0)|0)<<1<<1)|0;i=i+4|0;e=e+4|0}}e=vb(A|0,4,0)|0|0}tb(e+(v<<2)|0,f|0,4);tb((vb(B|0,4,0)|0|0)+(v<<2)|0,g|0,4);tb((vb(x|0,4,0)|0|0)+(w*44|0)+16|0,d|0,4);tb((vb(x|0,4,0)|0|0)+(t*44|0)+16|0,a|0,4);tb((vb(x|0,4,0)|0|0)+(s*44|0)+16|0,h|0,4);v=v+1|0}while((v|0)<(vb(I|0,4,0)|0|0));return}function ge(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;t=a+20|0;if((vb(t|0,4,0)|0|0)<=0)return;n=a+24|0;s=(c|0)==0;q=0;do{r=q*7|0;f=vb(n|0,4,0)|0|0;k=vb(f+(r*44|0)+20|0,4,0)|0|0;e=vb(f+(r*44|0)+16|0,4,0)|0|0;o=r+1|0;d=vb(f+(o*44|0)+16|0,4,0)|0|0;p=r+2|0;a=vb(f+(p*44|0)+16|0,4,0)|0|0;if(!s){m=q<<1;l=m|1;i=vb(f+(r*44|0)+8|0,4,0)|0|0;j=c;g=vb(f+(o*44|0)+8|0,4,0)|0|0;h=b;f=vb(f+(p*44|0)+8|0,4,0)|0|0;while(1){j=j+-1|0;u=e>>14;e=e-(e>>k)+(vb(i|0,4,0)|0|0)|0;v=(d>>14)+u|0;u=(a>>14)+u|0;d=d-(d>>k)+(vb(g|0,4,0)|0|0)|0;a=a-(a>>k)+(vb(f|0,4,0)|0|0)|0;tb(h+(m<<1)|0,((v<<16>>16|0)==(v|0)?v:32767-(v>>24)|0)|0,2);tb(h+(l<<1)|0,((u<<16>>16|0)==(u|0)?u:32767-(u>>24)|0)|0,2);if(!j)break;else{i=i+4|0;g=g+4|0;h=h+((vb(t|0,4,0)|0)<<1<<1)|0;f=f+4|0}}f=vb(n|0,4,0)|0|0}tb(f+(p*44|0)+16|0,a|0,4);tb((vb(n|0,4,0)|0|0)+(o*44|0)+16|0,d|0,4);tb((vb(n|0,4,0)|0|0)+(r*44|0)+16|0,e|0,4);q=q+1|0}while((q|0)<(vb(t|0,4,0)|0|0));return}function he(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;q=a+20|0;if((vb(q|0,4,0)|0|0)<=0)return;n=a+24|0;o=c>>1;p=(o|0)==0;m=(c&1|0)==0;j=o<<1;k=0;do{l=k*7|0;a=vb(n|0,4,0)|0|0;i=vb(a+(l*44|0)+20|0,4,0)|0|0;h=vb(a+(l*44|0)+8|0,4,0)|0|0;a=vb(a+(l*44|0)+16|0,4,0)|0|0;if(p){e=a;a=h;c=b}else{g=k<<1;f=g|1;d=h;e=o;c=b;while(1){u=a>>14;r=(vb(d|0,4,0)|0|0)-(a>>i)+a|0;s=r>>14;t=a;a=r+(vb(d+4|0,4,0)|0|0)-(r>>i)|0;t=(u<<16>>16|0)==(u|0)?u:32767-(t>>31)|0;tb(c+(g<<2)|0,t&65535|t<<16|0,4);r=(s<<16>>16|0)==(s|0)?s:32767-(r>>31)|0;tb(c+(f<<2)|0,r&65535|r<<16|0,4);c=c+((vb(q|0,4,0)|0)<<2<<1)|0;e=e+-1|0;if(!e)break;else d=d+8|0}e=a;a=h+(j<<2)|0}if(!m){u=e>>14;a=(vb(a|0,4,0)|0|0)-(e>>i)+e|0;t=u&65535;s=k<<1;d=c+(s<<1)|0;tb(d|0,t|0,2);c=c+((s|1)<<1)|0;tb(c|0,t|0,2);if((u<<16>>16|0)!=(u|0)){u=32767-(e>>31)&65535;tb(d|0,u|0,2);tb(c|0,u|0,2)}}else a=e;tb((vb(n|0,4,0)|0|0)+(l*44|0)+16|0,a|0,4);k=k+1|0}while((k|0)<(vb(q|0,4,0)|0|0));return}function ie(a,b){a=a|0;b=b|0;return ((b|0)<(a|0)?a:b)|0}function je(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;f=a+4|0;e=vb(f|0,4,0)|0|0;c=vb(a|0,4,0)|0|0;d=e-c>>1;if(d>>>0<b>>>0){ke(a,b-d|0);return}if(d>>>0<=b>>>0)return;c=c+(b<<1)|0;if((e|0)==(c|0))return;tb(f|0,e+(~((e+-2-c|0)>>>1)<<1)|0,4);return}function ke(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0;h=l;l=l+32|0;if((l|0)>=(m|0))X(32);g=h;e=vb(a+8|0,4,0)|0|0;c=vb(a+4|0,4,0)|0|0;if(e-c>>1>>>0>=b>>>0){le(a,b);l=h;return}f=vb(a|0,4,0)|0|0;d=c-f>>1;c=d+b|0;if((c|0)<0)Cm();f=e-f|0;me(g,f>>1>>>0<1073741823?(f>>>0<c>>>0?c:f):2147483647,d,a+8|0);ne(g,b);oe(a,g);pe(g);l=h;return}function le(a,b){a=a|0;b=b|0;var c=0,d=0;d=a+4|0;c=vb(d|0,4,0)|0|0;a=b;do{tb(c|0,0|0,2);c=(vb(d|0,4,0)|0|0)+2|0;tb(d|0,c|0,4);a=a+-1|0}while((a|0)!=0);return}function me(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;tb(a+12|0,0|0,4);tb(a+16|0,d|0,4);do if(b){if((b|0)>=0){d=Dm(b<<1)|0;break}d=Ba(8)|0;o=0;ua(23,d|0,15510);a=o;o=0;if(a&1){a=Fa()|0;Ha(d|0);Ma(a|0)}else{tb(d|0,10696|0,4);Ja(d|0,384,51)}}else d=0;while(0);tb(a|0,d|0,4);c=d+(c<<1)|0;tb(a+8|0,c|0,4);tb(a+4|0,c|0,4);tb(a+12|0,d+(b<<1)|0,4);return}function ne(a,b){a=a|0;b=b|0;var c=0,d=0;d=a+8|0;c=vb(d|0,4,0)|0|0;a=b;do{tb(c|0,0|0,2);c=(vb(d|0,4,0)|0|0)+2|0;tb(d|0,c|0,4);a=a+-1|0}while((a|0)!=0);return}function oe(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0;d=vb(a|0,4,0)|0|0;g=a+4|0;f=b+4|0;e=(vb(g|0,4,0)|0|0)-d|0;c=(vb(f|0,4,0)|0|0)+(0-(e>>1)<<1)|0;tb(f|0,c|0,4);if((e|0)>0){Mn(c|0,d|0,e|0)|0;d=f;c=vb(f|0,4,0)|0|0}else d=f;e=vb(a|0,4,0)|0|0;tb(a|0,c|0,4);tb(d|0,e|0,4);e=b+8|0;f=vb(g|0,4,0)|0|0;tb(g|0,vb(e|0,4,0)|0|0,4);tb(e|0,f|0,4);f=a+8|0;g=b+12|0;a=vb(f|0,4,0)|0|0;tb(f|0,vb(g|0,4,0)|0|0,4);tb(g|0,a|0,4);tb(b|0,vb(d|0,4,0)|0|0,4);return}function pe(a){a=a|0;var b=0,c=0,d=0;b=vb(a+4|0,4,0)|0|0;d=a+8|0;c=vb(d|0,4,0)|0|0;if((c|0)!=(b|0))tb(d|0,c+(~((c+-2-b|0)>>>1)<<1)|0,4);b=vb(a|0,4,0)|0|0;if(!b)return;Em(b);return}function qe(a){a=a|0;var b=0,c=0;c=vb(a|0,4,0)|0|0;if(!c)return;b=a+4|0;a=vb(b|0,4,0)|0|0;if((a|0)!=(c|0))tb(b|0,a+(~((a+-4-c|0)>>>2)<<2)|0,4);Em(c);return}function re(a){a=a|0;var b=0,c=0,d=0,e=0;b=vb(a|0,4,0)|0|0;if(!b)return;d=a+4|0;c=vb(d|0,4,0)|0|0;if((c|0)!=(b|0)){do{e=c+-12|0;tb(d|0,e|0,4);ue(e);c=vb(d|0,4,0)|0|0}while((c|0)!=(b|0));b=vb(a|0,4,0)|0|0}Em(b);return}function se(a){a=a|0;var b=0,c=0;c=vb(a|0,4,0)|0|0;if(!c)return;b=a+4|0;a=vb(b|0,4,0)|0|0;if((a|0)!=(c|0))tb(b|0,a+(~(((a+-12-c|0)>>>0)/12|0)*12|0)|0,4);Em(c);return}function te(a){a=a|0;var b=0,c=0,d=0,e=0;b=vb(a|0,4,0)|0|0;if(!b)return;d=a+4|0;c=vb(d|0,4,0)|0|0;if((c|0)!=(b|0)){do{e=c+-44|0;tb(d|0,e|0,4);sc(e);c=vb(d|0,4,0)|0|0}while((c|0)!=(b|0));b=vb(a|0,4,0)|0|0}Em(b);return}function ue(a){a=a|0;var b=0,c=0;c=vb(a|0,4,0)|0|0;if(!c)return;b=a+4|0;a=vb(b|0,4,0)|0|0;if((a|0)!=(c|0))tb(b|0,a+(~((a+-2-c|0)>>>1)<<1)|0,4);Em(c);return}function ve(a){a=a|0;Bd(a);Ad(a);return}function we(a){a=a|0;Yc(a);return}function xe(a){a=a|0;return}function ye(a,b){a=a|0;b=b|0;return 0}function ze(a,b){a=a|0;b=b|0;return}function Ae(a,b){a=a|0;b=b|0;return}function Be(a,b){a=a|0;b=b|0;return}function Ce(a,b){a=a|0;b=+b;return}function De(a,b){a=a|0;b=b|0;return 15629}function Ee(a,b,c){a=a|0;b=b|0;c=c|0;return 15629}function Fe(a){a=a|0;return a|0}function Ge(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if(!a)Aa(15028,14905,167,15671);else return ((a+-1-b+(((c|0)<(d|0)?c:d)<<16)|0)>>>0)/(a>>>0)|0|0;return 0}function He(a,b,c){a=a|0;b=b|0;c=c|0;tb(a+24|0,b|0,4);tb(a+28|0,c|0,4);ub(a+16|0,+(0.0),8);tb(a+32|0,0|0,4);tb(a|0,0|0,4);tb(a+4|0,0|0,4);tb(a+8|0,0|0,4);return}function Ie(a,b,c){a=a|0;b=b|0;c=c|0;var d=0.0,e=0.0,f=0;d=+(vb(a+12|0,4,0)|0|0)*.5;f=vb(a+16|0,4,0)|0|0;e=(f|0)==0?144.0/+(c|0)+.85:d/+(f|0);Je(b,c,e*64.0,+(+wb(a|0,8)),+(vb(a+8|0,4,0)|0|0)*e/d);d=3.141592653589793/+(c+-1|0);if(!c)return;do{c=c+-1|0;e=.5400000214576721-+E(+(d*+(c|0)))*.46000000834465027;f=b+(c<<2)|0;ub(f|0,+(+(+wb(f|0,4))*e),4)}while((c|0)!=0);return}function Je(a,b,c,d,e){a=a|0;b=b|0;c=+c;d=+d;e=+e;var f=0.0,g=0.0,h=0.0,i=0,j=0.0,k=0.0,l=0.0;l=e>=.999?.999:e;j=d<-300.0?-300.0:d;j=+D(10.0,+((j>5.0?5.0:j)*.00001220703125/(1.0-l)));k=+D(+j,+(4096.0-l*4096.0));h=3.834951969714103e-04/c;if((b|0)>0)i=0;else return;do{c=h*+(i-b<<1|1|0);f=c*4096.0;g=l*f;if(g!=0.0)e=+F(+g)/g*4096.0;else e=4096.0;d=+E(+c);d=j*(j-d-d)+1.0;if(d>1.0e-13)e=l*e+(+E(+g)+(k*(j*+E(+(f-c))-+E(+f))-j*+E(+(g-c))))/d;ub(a+(i<<2)|0,+e,4);i=i+1|0}while((i|0)!=(b|0));return}function Ke(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;h=Le(vb(a+28|0,4,0)|0|0)|0;j=a+32|0;i=(h|0)>1;e=a+24|0;g=h+-64|0;f=63;a=64;while(1){d=63-a|0;a=vb(j|0,4,0)|0|0;c=vb(e|0,4,0)|0|0;if(i){b=1;do{a=a-(vb(c+(b+f<<1)|0,2,0)|0|0)-(vb(c+(b+d<<1)|0,2,0)|0|0)|0;b=b+64|0}while((b|0)<(h|0))}c=c+(g+f<<1)|0;tb(c|0,(vb(c|0,2,1)|0|0)+((f|0)==(d|0)?(a|0)/2|0:a)|0,2);if((f|0)>31){a=f;f=f+-1|0}else break}return}function Le(a){a=a|0;return a<<5|1|0}function Me(a,b){a=a|0;b=b|0;var c=0.0,d=0,e=0,f=0.0,g=0.0,h=0,i=0,j=0,k=0;k=l;l=l+2432|0;if((l|0)>=(m|0))X(2432);j=k;i=a+28|0;e=(vb(i|0,4,0)|0)<<5;h=e+-32|0;Ie(b,j+256|0,h);b=e+32|0;e=e|31;d=63;while(1){tb(j+(b+d<<2)|0,vb(j+(e-d<<2)|0,4,0)|0|0,4);if(!d)break;else d=d+-1|0}On(j|0,0,256)|0;if((h|0)>0){b=0;c=0.0;do{c=c+ +(+wb(j+(b+64<<2)|0,4));b=b+1|0}while((b|0)!=(h|0))}else c=0.0;g=16384.0/c;tb(a+32|0,32768|0,4);b=Le(vb(i|0,4,0)|0|0)|0;if((b|0)>0){e=a+24|0;d=0;c=0.0;f=0.0;do{i=~~+A(+(g*(c-f)+.5));tb((vb(e|0,4,0)|0|0)+(d<<1)|0,i|0,2);f=f+ +(+wb(j+(d<<2)|0,4));c=c+ +(+wb(j+(d+64<<2)|0,4));d=d+1|0}while((d|0)!=(b|0))}Ke(a);b=a+16|0;c=+(+wb(b|0,8));if(!(c!=0.0)){l=k;return}ub(b|0,+(0.0),8);Ne(a,c);l=k;return}function Ne(a,b){a=a|0;b=+b;var c=0,d=0,e=0,f=0,g=0,h=0,i=0;h=l;l=l+32|0;if((l|0)>=(m|0))X(32);d=h;e=a+16|0;if(!(+(+wb(e|0,8))!=b)){l=h;return}f=a+32|0;c=vb(f|0,4,0)|0|0;if(!c){lc(d,-8.0);Me(a,d);c=vb(f|0,4,0)|0|0}ub(e|0,+b,8);b=b*1073741824.0/+(c|0);if(b>0.0&b<2.0){d=0;while(1){g=d+1|0;b=b*2.0;if(!(b<2.0))break;else d=g}e=c>>g;tb(f|0,e|0,4);if((e|0)<=0)Aa(15684,14905,381,15700);d=(1<<d)+32768|0;f=32768>>>g;c=Le(vb(a+28|0,4,0)|0|0)|0;if(c|0){e=a+24|0;do{c=c+-1|0;i=(vb(e|0,4,0)|0|0)+(c<<1)|0;tb(i|0,(d+(vb(i|0,2,0)|0|0)>>g)-f|0,2)}while((c|0)!=0)}Ke(a)}tb(a+8|0,~~+A(+(b+.5))|0,4);l=h;return}function Oe(a){a=a|0;Pe(a);tb(a|0,8648|0,4);tb(a+320|0,0|0,4);tb(a+324|0,0|0,4);tb(a+336|0,0|0,4);return}function Pe(a){a=a|0;var b=0,c=0;Qe(a);tb(a|0,8968|0,4);b=a+308|0;Re(b);tb(a+316|0,0|0,4);tb(a+256>>0|0,0|0,1);tb(a+260|0,0|0,4);tb(a+236|0,0|0,4);ub(a+240|0,+(1.0),8);ub(a+248|0,+(1.0),8);tb(a+224|0,2|0,4);tb(a+288|0,3|0,4);tb(a+292>>0|0,0|0,1);ub(a+144|0,+(-1.0),8);ub(a+152|0,+(60.0),8);Se(a,9248);o=0;sa(3,a|0);c=o;o=0;if(c&1){c=Fa()|0;Cd(b);Dd(a);Ma(c|0)}else return}function Qe(a){a=a|0;var b=0,c=0;tb(a|0,9052|0,4);c=a+28|0;Te(c);b=a+132|0;Ue(b);tb(a+4|0,0|0,4);tb(a+20|0,0|0,4);tb(a+24|0,0|0,4);o=0;sa(vb((vb(a|0,4,0)|0|0)+8|0,4,0)|0|0,a|0);a=o;o=0;if(!(a&1)?(o=0,ra(3),a=o,o=0,!(a&1)):0)return;a=Fa()|0;Ed(vb(b|0,4,0)|0|0);Fd(c);Ma(a|0)}function Re(a){a=a|0;tb(a|0,0|0,4);tb(a+4|0,0|0,4);return}function Se(a,b){a=a|0;b=b|0;tb(a+228|0,b|0,4);return}function Te(a){a=a|0;We(a);Xe(a+8|0);return}function Ue(a){a=a|0;tb(a|0,0|0,4);tb(a+4|0,0|0,4);return}function Ve(){var a=0,b=0;a=l;l=l+16|0;if((l|0)>=(m|0))X(16);b=a;tb(b|0,1|0,4);if(!(vb(b>>0|0,1,0)|0))Aa(15776,15802,62,15825);else{l=a;return}}function We(a){a=a|0;tb(a|0,0|0,4);tb(a+4|0,0|0,4);return}function Xe(a){a=a|0;tb(a|0,0|0,4);tb(a+4|0,0|0,4);return}function Ye(a,b){a=a|0;b=b|0;tb(a+328|0,b|0,4);a=vb(a+320|0,4,0)|0|0;ib[(xb(vb((vb(a|0,4,0)|0|0)+20|0,4,0)|0|0,63|0)|0)&63](a,b);return}function Ze(a){a=a|0;var b=0,c=0,d=0,e=0;Ye(a,3546900);b=a+320|0;d=vb(b|0,4,0)|0|0;e=vb((vb(d|0,4,0)|0|0)+8|0,4,0)|0|0;c=jc(vb(a+232|0,4,0)|0|0)|0;c=cb[(xb(e|0,31|0)|0)&31](d,c)|0;if(c|0){e=c;return e|0}_e(a,mc(a)|0);tb(a+332|0,gc(vb((vb(b|0,4,0)|0|0)+4|0,4,0)|0|0)|0|0,4);e=0;return e|0}function _e(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=a+144|0;d=b;e=c+80|0;do{tb(c|0,vb(d|0,4,0)|0|0,4);c=c+4|0;d=d+4|0}while((c|0)<(e|0));ib[(xb(vb((vb(a|0,4,0)|0|0)+48|0,4,0)|0|0,63|0)|0)&63](a,b);return}function $e(a){a=a|0;a=vb(a+320|0,4,0)|0|0;gb[(xb(vb((vb(a|0,4,0)|0|0)+28|0,4,0)|0|0,127|0)|0)&127](a);return}function af(a){a=a|0;return (vb(a+2>>0|0,1,1)|0|0)<<16|(vb(a+3>>0|0,1,1)|0|0)<<24|(vb(a+1>>0|0,1,1)|0|0)<<8|(vb(a>>0|0,1,1)|0|0)|0}function bf(a){a=a|0;tb(a|0,9096|0,4);Re(a+4|0);tb(a+12|0,0|0,4);tb(a+16|0,-1|0,4);tb(a+20|0,-1|0,4);tb(a+24|0,0|0,4);cf(a+32|0);return}function cf(a){a=a|0;df(a,12,a+52|0);return}function df(a,b,c){a=a|0;b=b|0;c=c|0;Re(a);tb(a+20|0,b|0,4);tb(a+24|0,(b<<1)+-2|0,4);tb(a+48|0,c|0,4);tb(a+8|0,0|0,4);tb(a+12|0,1|0,4);tb(a+16|0,0|0,4);tb(a+28|0,0|0,4);tb(a+32|0,2|0,4);ub(a+40|0,+(1.0),8);return}function ef(a,b){a=a|0;b=b|0;var c=0;c=ff(a+4|0,(b>>2)+b<<1)|0;if(c|0){a=c;return a|0}gf(a,b);b=vb(a+16|0,4,0)|0|0;b=(b>>2)+b|0;tb(a+24|0,b|0,4);a=hf(a+32|0,b)|0;return a|0}function ff(a,b){a=a|0;b=b|0;var c=0;c=Bl(vb(a|0,4,0)|0|0,b<<1)|0;if((b|0)!=0&(c|0)==0){a=17698;return a|0}tb(a|0,c|0,4);tb(a+4|0,b|0,4);a=0;return a|0}function gf(a,b){a=a|0;b=b|0;var c=0,d=0;c=b<<1;d=a+12|0;if((vb(d|0,4,0)|0|0)==(c|0))return;if(c>>>0>(kf(vb(a+8|0,4,0)|0|0)|0)>>>0)return;tb(d|0,c|0,4);tb(a+16|0,(~~(+(b|0)*+mf(+(+wb(a+72|0,8))))<<1)+2|0,4);nf(a);return}function hf(a,b){a=a|0;b=b|0;b=ff(a,(vb(a+24|0,4,0)|0|0)+b|0)|0;if(b|0){a=b;return a|0}jf(a);a=0;return a|0}function jf(a){a=a|0;var b=0;tb(a+16|0,0|0,4);if(!(kf(vb(a+4|0,4,0)|0|0)|0))return;b=a+24|0;tb(a+8|0,lf(a,vb(b|0,4,0)|0|0)|0|0,4);a=vb(a|0,4,0)|0|0;ec(a)|0;On(a|0,0,(vb(b|0,4,0)|0)<<1|0)|0;return}function kf(a){a=a|0;return a|0}function lf(a,b){a=a|0;b=b|0;if((vb(a+4|0,4,0)|0|0)>>>0<b>>>0)Aa(16100,16111,58,16134);else return (vb(a|0,4,0)|0|0)+(b<<1)|0;return 0}function mf(a){a=+a;return +a}function nf(a){a=a|0;tb(a+20|0,vb(a+12|0,4,0)|0|0,4);jf(a+32|0);return}function of(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;h=a+12|0;i=(vb(h|0,4,0)|0)>>1;d=b+4|0;e=Ge(vb(b|0,4,0)|0|0,vb(d|0,4,0)|0|0,vb(b+12|0,4,0)|0|0,i)|0;j=vb(a+16|0,4,0)|0|0;g=a+32|0;j=j-(pf(g)|0)|0;k=vb((vb(a|0,4,0)|0|0)+8|0,4,0)|0|0;f=qf(vb(a+40|0,4,0)|0|0)|0;f=eb[(xb(k|0,3|0)|0)&3](a,e,j,f)|0;if((f|0)>=(vb(a+24|0,4,0)|0|0))Aa(15850,15877,65,15903);Mc(b,e);if((Fc(vb(d|0,4,0)|0|0)|0)!=(i|0))Aa(15915,15877,68,15903);rf(g,f);k=ec(vb(a+4|0,4,0)|0|0)|0;k=sf(g,k,vb(h|0,4,0)|0|0)|0;if((k|0)==(vb(h|0,4,0)|0|0)){tf(a,b,c);Hc(b,i);return}else Aa(15954,15877,73,15903)}function pf(a){a=a|0;var b=0;b=vb(a+8|0,4,0)|0|0;return b-(lf(a,vb(a+24|0,4,0)|0|0)|0)>>1|0}function qf(a){a=a|0;return a|0}function rf(a,b){a=a|0;b=b|0;var c=0;c=a+8|0;b=(vb(c|0,4,0)|0|0)+(b<<1)|0;tb(c|0,b|0,4);if(b>>>0>(yf(vb(a|0,4,0)|0|0,vb(a+4|0,4,0)|0|0)|0)>>>0)Aa(15986,16009,96,18443);else return}function sf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=vb(a|0,4,0)|0|0;l=ec(f)|0;o=a+8|0;e=vb(o|0,4,0)|0|0;m=a+28|0;p=a+16|0;i=vb(p|0,4,0)|0|0;q=a+12|0;g=vb(q|0,4,0)|0|0;d=g-i|0;n=vb(a+32|0,4,0)|0|0;h=e;if((h-l|0)<=46){k=g;m=h;n=f;q=b;l=d;l=k-l|0;tb(p|0,l|0,4);p=n;p=m-p|0;m=p>>1;m=lf(a,m)|0;tb(o|0,m|0,4);a=vb(a|0,4,0)|0|0;ec(a)|0;Nn(a|0,n|0,p|0)|0;a=b;a=q-a|0;a=a>>1;return a|0}k=e+-48|0;l=a+52|0;j=c>>1;g=a+52+(i*24|0)|0;e=b;c=(vb(m|0,4,0)|0|0)>>>i;while(1){if((j|0)<1)break;h=vb(g|0,2,0)|0|0;i=O(vb(f|0,2,0)|0|0,h)|0;h=O(vb(f+2|0,2,0)|0|0,h)|0;r=vb(g+2|0,2,0)|0|0;i=i+(O(vb(f+4|0,2,0)|0|0,r)|0)|0;r=h+(O(vb(f+6|0,2,0)|0|0,r)|0)|0;h=vb(g+4|0,2,0)|0|0;i=(O(vb(f+8|0,2,0)|0|0,h)|0)+i|0;r=(O(vb(f+10|0,2,0)|0|0,h)|0)+r|0;h=vb(g+6|0,2,0)|0|0;i=i+(O(vb(f+12|0,2,0)|0|0,h)|0)|0;h=r+(O(vb(f+14|0,2,0)|0|0,h)|0)|0;r=vb(g+8|0,2,0)|0|0;i=(O(vb(f+16|0,2,0)|0|0,r)|0)+i|0;h=(O(vb(f+18|0,2,0)|0|0,r)|0)+h|0;r=vb(g+10|0,2,0)|0|0;i=i+(O(vb(f+20|0,2,0)|0|0,r)|0)|0;r=h+(O(vb(f+22|0,2,0)|0|0,r)|0)|0;h=vb(g+12|0,2,0)|0|0;i=(O(vb(f+24|0,2,0)|0|0,h)|0)+i|0;r=(O(vb(f+26|0,2,0)|0|0,h)|0)+r|0;h=vb(g+14|0,2,0)|0|0;i=i+(O(vb(f+28|0,2,0)|0|0,h)|0)|0;h=r+(O(vb(f+30|0,2,0)|0|0,h)|0)|0;r=vb(g+16|0,2,0)|0|0;i=(O(vb(f+32|0,2,0)|0|0,r)|0)+i|0;h=(O(vb(f+34|0,2,0)|0|0,r)|0)+h|0;r=vb(g+18|0,2,0)|0|0;i=i+(O(vb(f+36|0,2,0)|0|0,r)|0)|0;r=h+(O(vb(f+38|0,2,0)|0|0,r)|0)|0;h=vb(g+20|0,2,0)|0|0;i=(O(vb(f+40|0,2,0)|0|0,h)|0)+i|0;r=(O(vb(f+42|0,2,0)|0|0,h)|0)+r|0;h=vb(g+22|0,2,0)|0|0;i=i+(O(vb(f+44|0,2,0)|0|0,h)|0)|0;d=d+-1|0;h=(r+(O(vb(f+46|0,2,0)|0|0,h)|0)|0)>>>15;f=f+((c<<1&2)<<1)+(n<<1)|0;if(!d){g=l;d=vb(q|0,4,0)|0|0;c=vb(m|0,4,0)|0|0}else{g=g+24|0;c=c>>>1}tb(e|0,i>>>15|0,2);tb(e+2|0,h|0,2);e=e+4|0;if(f>>>0>k>>>0)break;else j=j+-1|0}l=vb(q|0,4,0)|0|0;m=vb(o|0,4,0)|0|0;n=f;r=e;q=d;q=l-q|0;tb(p|0,q|0,4);q=n;q=m-q|0;p=q>>1;p=lf(a,p)|0;tb(o|0,p|0,4);a=vb(a|0,4,0)|0|0;ec(a)|0;Nn(a|0,n|0,q|0)|0;a=r;r=b;r=a-r|0;r=r>>1;return r|0}function tf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;h=l;l=l+16|0;if((l|0)>=(m|0))X(16);g=h;f=uf(g,b)|0;d=(vb(a+12|0,4,0)|0)>>1;if(!d){g=g+4|0;g=vb(g|0,4,0)|0|0;vf(g,b);l=h;return}e=vb(a+4|0,4,0)|0|0;ec(e)|0;a=g+4|0;while(1){d=d+-1|0;i=wf(vb(a|0,4,0)|0|0)|0;j=((vb(e|0,2,0)|0)<<1)+i|0;xf(g,f);i=((vb(e+2|0,2,0)|0)<<1)+i|0;tb(c|0,((j<<16>>16|0)==(j|0)?j:32767-(j>>24)|0)|0,2);tb(c+2|0,((i<<16>>16|0)==(i|0)?i:32767-(i>>24)|0)|0,2);if(!d)break;else{e=e+4|0;c=c+4|0}}j=vb(a|0,4,0)|0|0;vf(j,b);l=h;return}function uf(a,b){a=a|0;b=b|0;tb(a|0,vb(b+8|0,4,0)|0|0,4);tb(a+4|0,vb(b+16|0,4,0)|0|0,4);return vb(b+20|0,4,0)|0|0}function vf(a,b){a=a|0;b=b|0;tb(b+16|0,a|0,4);return}function wf(a){a=a|0;return a>>14|0}function xf(a,b){a=a|0;b=b|0;var c=0,d=0;c=vb(a|0,4,0)|0|0;tb(a|0,c+4|0,4);d=a+4|0;a=vb(d|0,4,0)|0|0;tb(d|0,a+(vb(c|0,4,0)|0|0)-(a>>b)|0,4);return}function yf(a,b){a=a|0;b=b|0;return a+(b<<1)|0}function zf(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;h=a+12|0;e=vb(h|0,4,0)|0|0;i=a+20|0;f=vb(i|0,4,0)|0|0;g=e-f|0;if(g){g=(g|0)>(b|0)?b:g;Mn(c|0,lf(a+4|0,f)|0,g<<1|0)|0;tb(i|0,(vb(i|0,4,0)|0|0)+g|0,4);e=vb(h|0,4,0)|0|0;b=b-g|0;c=c+(g<<1)|0}if((b|0)>=(e|0))do{of(a,d,c);g=vb(h|0,4,0)|0|0;c=c+(g<<1)|0;b=b-g|0}while((b|0)>=(g|0));if(!b)return;h=a+4|0;of(a,d,ec(vb(h|0,4,0)|0|0)|0);tb(i|0,b|0,4);a=vb(h|0,4,0)|0|0;ec(a)|0;Mn(c|0,a|0,b<<1|0)|0;return}function Af(a){a=a|0;ub(a|0,+(-.15000000596046448),8);ub(a+8|0,+(.15000000596046448),8);ub(a+32|0,+(88.0),8);ub(a+48|0,+(.11999999731779099),8);ub(a+16|0,+(61.0),8);ub(a+24|0,+(.10000000149011612),8);ub(a+40|0,+(18.0),8);tb(a+56>>0|0,0|0,1);return}function Bf(a){a=a|0;var b=0,c=0;b=l;l=l+64|0;if((l|0)>=(m|0))X(64);c=b;Af(c);ub(c|0,+(-0.0),8);ub(c+8|0,+(0.0),8);ub(c+32|0,+(88.0),8);ub(c+16|0,+(61.0),8);ub(c+48|0,+(0.0),8);ub(c+24|0,+(0.0),8);ub(c+40|0,+(18.0),8);tb(c+56>>0|0,0|0,1);ib[(xb(vb((vb(a|0,4,0)|0|0)+44|0,4,0)|0|0,63|0)|0)&63](a,c);l=b;return}function Cf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;g=l;l=l+16|0;if((l|0)>=(m|0))X(16);e=g;qc(a,b<<1);tb(a|0,9116|0,4);f=a+20|0;tb(f|0,b|0,4);k=a+24|0;d=c?3:7;i=O(d,b)|0;o=0;ua(24,k|0,i|0);i=o;o=0;if(i&1){k=Fa()|0;Ma(k|0)}i=a+36|0;o=0;ua(25,i|0,(vb(f|0,4,0)|0|0)*3|0);h=o;o=0;if(h&1)c=Fa()|0;else{Af(a+48|0);tb(a+112|0,0|0,4);tb(a+116|0,0|0,4);c=vb(f|0,4,0)|0|0;tb(a+120|0,O(c,d)|0|0,4);tb(a+124>>0|0,0|0,1);h=a+128|0;o=0;ua(26,e|0,16384);d=o;o=0;do if(d&1){c=Fa()|0;j=15}else{o=0;va(1,h|0,c|0,e|0);d=o;o=0;if(d&1){c=Fa()|0;ue(e);j=15;break}ue(e);d=a+140|0;c=vb(f|0,4,0)|0|0;o=0;ua(26,e|0,4096);b=o;o=0;do if(b&1){c=Fa()|0;j=18}else{o=0;va(1,d|0,c|0,e|0);b=o;o=0;if(b&1){c=Fa()|0;ue(e);j=18;break}ue(e);b=a+152|0;o=0;ua(27,b|0,vb(f|0,4,0)|0|0);e=o;o=0;if(e&1)c=Fa()|0;else{c=a+164|0;o=0;ua(27,c|0,vb(f|0,4,0)|0|0);f=o;o=0;do if(!(f&1)){o=0;sa(56,a|0);a=o;o=0;if(a&1){g=Fa()|0;qe(c);c=g;break}else{l=g;return}}else c=Fa()|0;while(0);qe(b)}re(d)}while(0);re(h)}while(0);se(i)}te(k);k=c;Ma(k|0)}function Df(a,b){a=a|0;b=b|0;var c=0;tb(a|0,0|0,4);tb(a+4|0,0|0,4);tb(a+8|0,0|0,4);if(!b)return;o=0;ua(28,a|0,b|0);c=o;o=0;if(c&1){c=Fa()|0;te(a);Ma(c|0)}Rf(a,b);return}function Ef(a,b){a=a|0;b=b|0;var c=0;tb(a|0,0|0,4);tb(a+4|0,0|0,4);tb(a+8|0,0|0,4);if(!b)return;o=0;ua(29,a|0,b|0);c=o;o=0;if(c&1){c=Fa()|0;se(a);Ma(c|0)}Pf(a,b);return}function Ff(a,b){a=a|0;b=b|0;var c=0;tb(a|0,0|0,4);tb(a+4|0,0|0,4);tb(a+8|0,0|0,4);if(!b)return;o=0;ua(30,a|0,b|0);c=o;o=0;if(c&1){c=Fa()|0;ue(a);Ma(c|0)}le(a,b);return}function Gf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;tb(a|0,0|0,4);e=a+4|0;tb(e|0,0|0,4);tb(a+8|0,0|0,4);if(!b)return;o=0;ua(31,a|0,b|0);d=o;o=0;a:do if(!(d&1)){d=vb(e|0,4,0)|0|0;do{o=0;ua(32,d|0,c|0);d=o;o=0;if(d&1)break a;d=(vb(e|0,4,0)|0|0)+12|0;tb(e|0,d|0,4);b=b+-1|0}while((b|0)!=0);return}while(0);c=Fa()|0;re(a);Ma(c|0)}function Hf(a,b){a=a|0;b=b|0;var c=0;tb(a|0,0|0,4);tb(a+4|0,0|0,4);tb(a+8|0,0|0,4);if(!b)return;o=0;ua(33,a|0,b|0);c=o;o=0;if(c&1){c=Fa()|0;qe(a);Ma(c|0)}Jf(a,b);return}function If(a,b){a=a|0;b=b|0;var c=0;if(b>>>0>1073741823)Cm();else{c=Dm(b<<2)|0;tb(a+4|0,c|0,4);tb(a|0,c|0,4);tb(a+8|0,c+(b<<2)|0,4);return}}function Jf(a,b){a=a|0;b=b|0;var c=0,d=0;d=a+4|0;c=vb(d|0,4,0)|0|0;a=b;do{tb(c|0,0|0,4);c=(vb(d|0,4,0)|0|0)+4|0;tb(d|0,c|0,4);a=a+-1|0}while((a|0)!=0);return}function Kf(a,b){a=a|0;b=b|0;var c=0;if(b>>>0>357913941)Cm();else{c=Dm(b*12|0)|0;tb(a+4|0,c|0,4);tb(a|0,c|0,4);tb(a+8|0,c+(b*12|0)|0,4);return}}function Lf(a,b){a=a|0;b=b|0;var c=0,d=0;tb(a|0,0|0,4);tb(a+4|0,0|0,4);tb(a+8|0,0|0,4);c=b+4|0;d=(vb(c|0,4,0)|0|0)-(vb(b|0,4,0)|0|0)>>1;if(!d)return;o=0;ua(30,a|0,d|0);d=o;o=0;if(d&1){d=Fa()|0;ue(a);Ma(d|0)}Nf(a,vb(b|0,4,0)|0|0,vb(c|0,4,0)|0|0);return}function Mf(a,b){a=a|0;b=b|0;var c=0;if((b|0)<0)Cm();else{c=Dm(b<<1)|0;tb(a+4|0,c|0,4);tb(a|0,c|0,4);tb(a+8|0,c+(b<<1)|0,4);return}}function Nf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=a+4|0;a=c-b|0;if((a|0)<=0)return;Mn(vb(d|0,4,0)|0|0,b|0,a|0)|0;tb(d|0,(vb(d|0,4,0)|0|0)+(a>>>1<<1)|0,4);return}function Of(a,b){a=a|0;b=b|0;var c=0;if(b>>>0>357913941)Cm();else{c=Dm(b*12|0)|0;tb(a+4|0,c|0,4);tb(a|0,c|0,4);tb(a+8|0,c+(b*12|0)|0,4);return}}function Pf(a,b){a=a|0;b=b|0;var c=0,d=0;d=a+4|0;c=vb(d|0,4,0)|0|0;a=b;do{tb(c|0,0|0,4);tb(c+4|0,0|0,4);tb(c+8|0,0|0,4);c=(vb(d|0,4,0)|0|0)+12|0;tb(d|0,c|0,4);a=a+-1|0}while((a|0)!=0);return}function Qf(a,b){a=a|0;b=b|0;var c=0;if(b>>>0>97612893)Cm();else{c=Dm(b*44|0)|0;tb(a+4|0,c|0,4);tb(a|0,c|0,4);tb(a+8|0,c+(b*44|0)|0,4);return}}function Rf(a,b){a=a|0;b=b|0;var c=0,d=0;d=a+4|0;c=vb(d|0,4,0)|0|0;a=b;do{tc(c);c=(vb(d|0,4,0)|0|0)+44|0;tb(d|0,c|0,4);a=a+-1|0}while((a|0)!=0);return}function Sf(a,b,c,d){a=a|0;b=+b;c=+c;d=+d;var e=0.0,f=0.0,g=0,h=0.0,i=0.0,j=0.0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;q=a+40|0;ub(q|0,+b,8);r=a+12|0;tb(r|0,-1|0,4);g=-1;h=0.0;i=2.0;j=0.0;k=1;while(1){j=j+b;f=+A(+(j+.5));e=+B(+(j-f));if(e<i){tb(r|0,k|0,4);g=k;h=f/+(k|0)}else e=i;k=k+1|0;if((k|0)==33)break;else i=e}o=a+28|0;tb(o|0,0|0,4);p=a+32|0;tb(p|0,~~+A(+h)<<1|0,4);ub(q|0,+h,8);i=+om(h);h=h<1.0?1.0:1.0/h;n=a+36|0;tb(n|0,0|0,4);if((g|0)<=0){jf(a);c=+(+wb(q|0,8));return +c}m=a+20|0;f=d*32767.0*h;l=a+48|0;k=0;e=0.0;do{g=vb(m|0,4,0)|0|0;Tf(c,~~(h*+(g|0)+1.0)&-2,e,h,f,g,(vb(l|0,4,0)|0|0)+((O(g,k)|0)<<1)|0);e=i+e;g=(vb(n|0,4,0)|0|0)+(vb(p|0,4,0)|0|0)|0;tb(n|0,g|0,4);if(e>=.9999999){tb(o|0,vb(o|0,4,0)|0|1<<k|0,4);tb(n|0,g+1|0,4);e=e+-1.0}k=k+1|0}while((k|0)<(vb(r|0,4,0)|0|0));jf(a);c=+(+wb(q|0,8));return +c}function Tf(a,b,c,d,e,f,g){a=+a;b=b|0;c=+c;d=+d;e=+e;f=f|0;g=g|0;var h=0.0,i=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0;m=d*.01227184630308513;l=512.0/+(b|0);k=+D(+a,256.0);h=e*.001953125;if(!f)return;i=k*a;j=a*a;e=-(m*(+(((f|0)/2|0)+-1|0)+c));while(1){f=f+-1|0;d=l*e;if(+B(+d)<3.141592653589793){c=+E(+e)*a;n=1.0-c;c=h*(n-k*+E(+(e*256.0))+i*+E(+(e*255.0)))/(j+(n-c))-h;b=~~(c+ +E(+d)*c)}else b=0;tb(g|0,b|0,2);if(!f)break;else{e=m+e;g=g+2|0}}return}function Uf(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;d=a+8|0;c=vb(d|0,4,0)|0|0;c=c-(ec(vb(a|0,4,0)|0|0)|0)>>1;e=c-((vb(a+20|0,4,0)|0)<<1)|0;b=(e|0)<(b|0)?e:b;c=c-b|0;tb(d|0,lf(a,c)|0|0,4);d=vb(a|0,4,0)|0|0;ec(d)|0;Nn(d|0,lf(a,b)|0,c<<1|0)|0;return b|0}function Vf(){if(vb(22480|0,1,0)|0|0)return;if(!(xn()|0))return;tb(5622*4|0,9376|0,4);tb(5623*4|0,9668|0,4);tb(5624*4|0,10020|0,4);tb(5625*4|0,0|0,4);return}function Wf(a){a=a|0;var b=0;a=Xf(a)|0;a:do if((a|0)<1397638483){switch(a|0){case 1197034840:break;default:{b=4;break a}}a=18019}else{if((a|0)>=1515733337)switch(a|0){case 1515733337:{a=17364;break a}default:{b=4;break a}}switch(a|0){case 1397638483:break;default:{b=4;break a}}a=19216}while(0);if((b|0)==4)a=27200;return a|0}function Xf(a){a=a|0;return (vb(a+1>>0|0,1,1)|0|0)<<16|(vb(a>>0|0,1,1)|0|0)<<24|(vb(a+2>>0|0,1,1)|0|0)<<8|(vb(a+3>>0|0,1,1)|0|0)|0}function Yf(a){a=a|0;var b=0,c=0,d=0;d=l;l=l+16|0;if((l|0)>=(m|0))X(16);c=d;b=zm(a)|0;Zf((b|0)==0?a:b+1|0,c);Vf();a=vb(5622*4|0,4,0)|0|0;if(!a){c=0;l=d;return c|0}else b=22488;while(1){b=b+4|0;if(!(Nl(c,vb(a+16|0,4,0)|0|0)|0)){b=4;break}a=vb(b|0,4,0)|0|0;if(!a){a=0;b=4;break}}if((b|0)==4){l=d;return a|0}return 0}function Zf(a,b){a=a|0;b=b|0;var c=0;c=(Ll(vb(a>>0|0,1,0)|0|0)|0)&255;tb(b>>0|0,c|0,1);if(!(c<<24>>24))return;c=(Ll(vb(a+1>>0|0,1,0)|0|0)|0)&255;tb(b+1>>0|0,c|0,1);if(!(c<<24>>24))return;c=(Ll(vb(a+2>>0|0,1,0)|0|0)|0)&255;tb(b+2>>0|0,c|0,1);if(!(c<<24>>24))return;c=(Ll(vb(a+3>>0|0,1,0)|0|0)|0)&255;tb(b+3>>0|0,c|0,1);if(!(c<<24>>24))return;c=(Ll(vb(a+4>>0|0,1,0)|0|0)|0)&255;tb(b+4>>0|0,c|0,1);if(!(c<<24>>24))return;c=(Ll(vb(a+5>>0|0,1,0)|0|0)|0)&255;tb(b+5>>0|0,c|0,1);if(!(c<<24>>24))return;tb(b>>0|0,0|0,1);return}function _f(a,b){a=a|0;b=b|0;var c=0,d=0;if(!((a|0)!=0|(b|0)==0))Aa(16032,16055,142,16070);tb(5627*4|0,0|0,4);if((b|0)<=3){b=15595;return b|0}c=Yf(Wf(a)|0)|0;if(!c){b=15595;return b|0}d=$f(c)|0;if(!d){b=17698;return b|0}c=ag(d,a,b)|0;if(!c){tb(5627*4|0,d|0,4);b=0;return b|0}else{gb[(xb(vb((vb(d|0,4,0)|0|0)+4|0,4,0)|0|0,127|0)|0)&127](d);b=c;return b|0}return 0}function $f(a){a=a|0;return gg(a)|0}function ag(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;e=l;l=l+32|0;if((l|0)>=(m|0))X(32);d=e;id(d,b,c);o=0;b=oa(19,a|0,d|0)|0;c=o;o=0;if(c&1){e=Fa()|0;_c(d);Ma(e|0)}else{_c(d);l=e;return b|0}return 0}function bg(a,b){a=a|0;b=b|0;gb[(xb(vb((vb(a|0,4,0)|0|0)+24|0,4,0)|0|0,127|0)|0)&127](a);return cg(a,cb[(xb(vb((vb(a|0,4,0)|0|0)+12|0,4,0)|0|0,31|0)|0)&31](a,b)|0)|0}function cg(a,b){a=a|0;b=b|0;var c=0;if(!(dg(vb(a+8|0,4,0)|0|0)|0)){c=vb(a+4|0,4,0)|0|0;eg(c)|0;fg(a,vb(c+4|0,4,0)|0|0)}c=vb(a|0,4,0)|0|0;if(!b){gb[(xb(vb(c+28|0,4,0)|0|0,127|0)|0)&127](a);return b|0}else{gb[(xb(vb(c+8|0,4,0)|0|0,127|0)|0)&127](a);return b|0}return 0}function dg(a){a=a|0;return a|0}function eg(a){a=a|0;return a|0}function fg(a,b){a=a|0;b=b|0;tb(a+12|0,b|0,4);tb(a+8|0,b|0,4);return}function gg(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;if(!a){e=0;return e|0}d=ab[(xb(vb(a+8|0,4,0)|0|0,7|0)|0)&7]()|0;if(!d){e=0;return e|0}cb[(xb(vb((vb(d|0,4,0)|0|0)+36|0,4,0)|0|0,31|0)|0)&31](d,0)|0;c=a+20|0;do if((vb(c|0,4,0)|0)&1|0){f=hg(vb(d+256>>0|0,1,0)|0|0)|0;a=nc(216)|0;b=(a|0)==0;if(f)if(!b){o=0;va(2,a|0,8,0);f=o;o=0;if(f&1){f=Fa()|0;oc(a);Ma(f|0)}}else e=11;else if(!b){o=0;va(2,a|0,1,0);f=o;o=0;if(f&1){f=Fa()|0;oc(a);Ma(f|0)}}else e=11;if((e|0)==11){tb(d+316|0,0|0,4);break}tb(d+316|0,a|0,4);if(a|0)ib[(xb(vb((vb(d|0,4,0)|0|0)+40|0,4,0)|0|0,63|0)|0)&63](d,a)}while(0);if(!(((vb(c|0,4,0)|0)&1|0)!=0?!(vb(d+316|0,4,0)|0|0):0))e=16;if((e|0)==16?(ig(d)|0)==0:0){f=d;return f|0}gb[(xb(vb((vb(d|0,4,0)|0|0)+4|0,4,0)|0|0,127|0)|0)&127](d);f=0;return f|0}function hg(a){a=a|0;return a<<24>>24!=0|0}function ig(a){a=a|0;var b=0,c=0;c=a+260|0;if(fc(vb(c|0,4,0)|0|0)|0)Aa(19230,14676,79,16084);b=cb[(xb(vb((vb(a|0,4,0)|0|0)+44|0,4,0)|0|0,31|0)|0)&31](a,44100)|0;if(b|0){c=b;return c|0}b=ff(a+308|0,2048)|0;if(b|0){c=b;return c|0}tb(c|0,44100|0,4);c=0;return c|0}function jg(a){a=a|0;if(!a)return;gb[(xb(vb((vb(a|0,4,0)|0|0)+4|0,4,0)|0|0,127|0)|0)&127](a);return}function kg(a){a=a|0;return dg(vb(a+8|0,4,0)|0|0)|0}function lg(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0;tb(5628*4|0,0|0,4);g=mg()|0;if(!g){g=17698;return g|0}a=ng(a,g+128|0,b)|0;if(a|0){og(g);g=a;return g|0}a=vb(g+132|0,4,0)|0|0;tb(g|0,a|0,4);b=vb(g+136|0,4,0)|0|0;tb(g+4|0,b|0,4);c=vb(g+140|0,4,0)|0|0;tb(g+8|0,c|0,4);d=g+92|0;e=g+16|0;f=e+48|0;do{tb(e|0,-1|0,4);e=e+4|0}while((e|0)<(f|0));tb(d|0,27200|0,4);tb(g+96|0,27200|0,4);tb(g+100|0,27200|0,4);tb(g+104|0,27200|0,4);tb(g+108|0,27200|0,4);tb(g+112|0,27200|0,4);tb(g+116|0,27200|0,4);tb(g+120|0,27200|0,4);tb(g+124|0,27200|0,4);tb(g+64|0,g+144|0,4);tb(g+68|0,g+400|0,4);tb(g+72|0,g+656|0,4);tb(g+76|0,g+912|0,4);tb(g+80|0,g+1168|0,4);tb(g+84|0,g+1424|0,4);tb(g+88|0,g+1680|0,4);if((a|0)<1){a=(c<<1)+b|0;a=(a|0)<1?15e4:a}tb(g+12|0,a|0,4);tb(5628*4|0,g|0,4);g=0;return g|0}function mg(){return zl(1936)|0}function ng(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,n=0,o=0,p=0;o=l;l=l+16|0;if((l|0)>=(m|0))X(16);e=o;tb(b|0,dg(vb(a+8|0,4,0)|0|0)|0|0,4);j=b+4|0;tb(j|0,-1|0,4);n=b+12|0;tb(n|0,-1|0,4);k=b+8|0;tb(k|0,-1|0,4);i=b+528|0;tb(i>>0|0,0|0,1);f=b+272|0;tb(f>>0|0,0|0,1);g=b+784|0;tb(g>>0|0,0|0,1);tb(b+1040>>0|0,0|0,1);tb(b+1296>>0|0,0|0,1);h=b+1552|0;tb(h>>0|0,0|0,1);p=b+16|0;tb(p>>0|0,0|0,1);d=vb(a+4|0,4,0)|0|0;eg(d)|0;qg(p,vb(d|0,4,0)|0|0);tb(e|0,c|0,4);d=rg(a,e)|0;if(d|0){p=d;l=o;return p|0}d=db[(xb(vb((vb(a|0,4,0)|0|0)+20|0,4,0)|0|0,31|0)|0)&31](a,b,vb(e|0,4,0)|0|0)|0;if(d|0){p=d;l=o;return p|0}d=a+28|0;if(!(sg(d)|0)){p=0;l=o;return p|0}b=tg(d)|0;qg(f,vb(b|0,4,0)|0|0);qg(g,vb(b+8|0,4,0)|0|0);qg(g,vb(b+4|0,4,0)|0|0);qg(h,vb(b+12|0,4,0)|0|0);b=ug(d,c)|0;qg(i,vb(b+8|0,4,0)|0|0);d=vb(b+20|0,4,0)|0|0;if((d|0)>-1)tb(j|0,d*1e3|0,4);d=vb(b+24|0,4,0)|0|0;if((d|0)>-1)tb(k|0,d*1e3|0,4);d=vb(b+28|0,4,0)|0|0;if((d|0)<=-1){p=0;l=o;return p|0}tb(n|0,d*1e3|0,4);p=0;l=o;return p|0}function og(a){a=a|0;if(!a)return;pg(a);return}function pg(a){a=a|0;Al(a);return}function qg(a,b){a=a|0;b=b|0;xg(a,b,255);return}function rg(a,b){a=a|0;b=b|0;var c=0,d=0;c=vb(b|0,4,0)|0|0;if(c>>>0>=(dg(vb(a+8|0,4,0)|0|0)|0)>>>0){a=16175;return a|0}d=a+28|0;if(c>>>0<(sg(d)|0)>>>0){d=ug(d,c)|0;tb(b|0,0|0,4);c=vb(d+16|0,4,0)|0|0;if((c|0)>-1){tb(b|0,c|0,4);if(!((vb((vb(a+4|0,4,0)|0|0)+20|0,4,0)|0)&2)){c=c-(vb(d+12>>0|0,1,1)|0|0)|0;tb(b|0,c|0,4)}}else c=0;if((c|0)>=(vb(a+12|0,4,0)|0|0)){a=16145;return a|0}}a=0;return a|0}function sg(a){a=a|0;return wg(vb(a+4|0,4,0)|0|0)|0}function tg(a){a=a|0;return a+20|0}function ug(a,b){a=a|0;b=b|0;return vg(a,b)|0}function vg(a,b){a=a|0;b=b|0;if((vb(a+4|0,4,0)|0|0)>>>0<b>>>0)Aa(16100,16111,58,16134);else return (vb(a|0,4,0)|0|0)+(b*40|0)|0;return 0}function wg(a){a=a|0;return a|0}function xg(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;if(!b)return;d=vb(b>>0|0,1,0)|0|0;if(!(d<<24>>24))return;a:do if(c){if(((d<<24>>24)+-1|0)>>>0<32){d=c;while(1){b=b+1|0;c=d+-1|0;if(!c){c=b;d=0;break a}d=vb(b>>0|0,1,0)|0|0;if(((d<<24>>24)+-1|0)>>>0<32)d=c;else break}}e=(c|0)<255?c:255;if((c|0)>0){c=d;d=0;while(1){if(!(c<<24>>24)){c=b;break a}d=d+1|0;if((d|0)>=(e|0)){c=b;break a}c=vb(b+d>>0|0,1,0)|0|0}}else{c=b;d=0}}else{c=b;d=0}while(0);while(1){if(!d){d=0;break}b=d+-1|0;if((vb(c+b>>0|0,1,1)|0|0)<33)d=b;else break}tb(a+d>>0|0,0|0,1);Mn(a|0,c|0,d|0)|0;if((Nl(a,16189)|0?Nl(a,16191)|0:0)?Nl(a,16195)|0:0)return;tb(a>>0|0,0|0,1);return}function yg(a,b){a=a|0;b=b|0;return zg(a,b)|0}function zg(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0;h=l;l=l+16|0;if((l|0)>=(m|0))X(16);d=h;sd(a);tb(d|0,b|0,4);c=rg(a,d)|0;if(c|0){g=c;l=h;return g|0}tb(a+264|0,b|0,4);c=cb[(xb(vb((vb(a|0,4,0)|0|0)+64|0,4,0)|0|0,31|0)|0)&31](a,vb(d|0,4,0)|0|0)|0;if(c|0){g=c;l=h;return g|0}b=a+276|0;tb(b>>0|0,0|0,1);tb(a+277>>0|0,0|0,1);if(!(vb(a+292>>0|0,1,0)|0)){e=vb(a+224|0,4,0)|0|0;e=O(Ag(vb(a+256>>0|0,1,0)|0|0)|0,e)|0;e=O(e,fc(vb(a+260|0,4,0)|0|0)|0)|0;f=a+272|0;d=a+304|0;do{if((vb(f|0,4,0)|0|0)>=(e|0)){g=6;break}Bg(a);c=vb(d|0,4,0)|0|0}while(!(vb(b>>0|0,1,1)|0|c|0));if((g|0)==6)c=vb(d|0,4,0)|0|0;tb(f|0,c|0,4);tb(a+268|0,0|0,4);tb(a+296|0,0|0,4);tb(a+300|0,0|0,4)}if(!(Cg(a)|0)){g=0;l=h;return g|0}g=zd(a)|0;l=h;return g|0}function Ag(a){a=a|0;a=hg(a)|0;return (a?16:2)|0}function Bg(a){a=a|0;var b=0,c=0;b=a+304|0;if(vb(b|0,4,0)|0|0)Aa(16201,14676,342,16213);if((vb(a+276>>0|0,1,0)|0|0)==0?(c=a+308|0,Dg(a,2048,ec(vb(c|0,4,0)|0|0)|0),c=Eg(ec(vb(c|0,4,0)|0|0)|0,2048)|0,(c|0)<2048):0){tb(a+296|0,(vb(a+272|0,4,0)|0|0)-c|0,4);tb(b|0,2048|0,4);return}a=a+300|0;tb(a|0,(vb(a|0,4,0)|0|0)+2048|0,4);return}function Cg(a){a=a|0;return (vb(a+277>>0|0,1,0)|0|0)!=0|0}function Dg(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=a+272|0;tb(d|0,(vb(d|0,4,0)|0|0)+b|0,4);if((vb(a+264|0,4,0)|0|0)>-1?(vb(a+276>>0|0,1,0)|0|0)==0:0){Fg(a,db[(xb(vb((vb(a|0,4,0)|0|0)+68|0,4,0)|0|0,31|0)|0)&31](a,b,c)|0);return}On(c|0,0,b<<1|0)|0;return}function Eg(a,b){a=a|0;b=b|0;var c=0,d=0;c=vb(a|0,2,0)|0|0;tb(a|0,16|0,2);d=a+(b<<1)|0;do d=d+-2|0;while(((vb(d|0,2,0)|0|0)+8|0)>>>0<17);tb(a|0,c|0,2);return b-(d-a>>1)|0}function Fg(a,b){a=a|0;b=b|0;if(!b)return;tb(a+276>>0|0,1|0,1);Gg(a,b);return}function Gg(a,b){a=a|0;b=b|0;tb(a+16|0,b|0,4);return}function Hg(a){a=a|0;Ig(a);return}function Ig(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;i=a+277|0;if(vb(i>>0|0,1,0)|0|0){On(23104,0,2048)|0;k=a+268|0;a=vb(k|0,4,0)|0|0;a=a+1024|0;tb(k|0,a|0,4);return}if((Jg(vb(a+264|0,4,0)|0|0)|0)<=-1)Aa(16222,14676,365,18383);h=a+256|0;if(1024%(Ag(vb(h>>0|0,1,0)|0|0)|0)|0|0)Aa(16243,14676,366,18383);j=a+272|0;e=vb(j|0,4,0)|0|0;k=a+268|0;c=vb(k|0,4,0)|0|0;if((e|0)<(c|0))Aa(16275,14676,368,18383);f=a+300|0;b=vb(f|0,4,0)|0|0;if(b){g=a+296|0;d=vb(g|0,4,0)|0|0;c=(O(c+1024-d|0,vb(a+288|0,4,0)|0|0)|0)+d|0;d=a+304|0;if((e|0)<(c|0)){b=a+276|0;do{if(vb(b>>0|0,1,1)|0|(vb(d|0,4,0)|0)|0)break;Bg(a)}while((vb(j|0,4,0)|0|0)<(c|0));b=vb(f|0,4,0)|0|0}b=Kg(b,1024)|0;On(23104,0,b<<1|0)|0;tb(f|0,(vb(f|0,4,0)|0|0)-b|0,4);g=(vb(j|0,4,0)|0|0)-(vb(g|0,4,0)|0|0)|0;h=(Ag(vb(h>>0|0,1,0)|0|0)|0)*6|0;if((g|0)>(O(h,fc(vb(a+260|0,4,0)|0|0)|0)|0)){tb(a+276>>0|0,1|0,1);tb(i>>0|0,1|0,1);tb(f|0,0|0,4);tb(d|0,0|0,4)}}else{d=a+304|0;b=0}c=vb(d|0,4,0)|0|0;if(c){h=Kg(c,1024-b|0)|0;Mn(23104+(b<<1)|0,(vb(a+308|0,4,0)|0|0)+(2048-c<<1)|0,h<<1|0)|0;tb(d|0,(vb(d|0,4,0)|0|0)-h|0,4);b=h+b|0}e=1024-b|0;do if(e|0){b=23104+(b<<1)|0;Dg(a,e,b);tb(i>>0|0,vb(i>>0|0,1,0)|0|(vb(a+276>>0|0,1,0)|0)|0,1);if(vb(a+292>>0|0,1,0)|0|0?(vb(k|0,4,0)|0|0)<=(vb(a+280|0,4,0)|0|0):0)break;d=Eg(b,e)|0;c=vb(j|0,4,0)|0|0;b=a+296|0;if((d|0)<(e|0)){j=c-d|0;tb(b|0,j|0,4);b=j}else b=vb(b|0,4,0)|0|0;if((c-b|0)>2047)Bg(a)}while(0);b=vb(a+280|0,4,0)|0|0;if((b|0)<=-1){a=vb(k|0,4,0)|0|0;a=a+1024|0;tb(k|0,a|0,4);return}if((vb(k|0,4,0)|0|0)<=(b|0)){a=vb(k|0,4,0)|0|0;a=a+1024|0;tb(k|0,a|0,4);return}Lg(a);a=vb(k|0,4,0)|0|0;a=a+1024|0;tb(k|0,a|0,4);return}function Jg(a){a=a|0;return a|0}function Kg(a,b){a=a|0;b=b|0;return ((a|0)<(b|0)?a:b)|0}function Lg(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0;f=a+268|0;d=a+280|0;e=a+284|0;h=a+276|0;g=a+277|0;c=Mg(((vb(f|0,4,0)|0|0)-(vb(d|0,4,0)|0|0)|0)/512|0,vb(e|0,4,0)|0|0)|0;if((c|0)<64){tb(h>>0|0,1|0,1);tb(g>>0|0,1|0,1)}a=Kg(512,1024)|0;if(a|0){b=23104;while(1){tb(b|0,(O(vb(b|0,2,0)|0|0,c)|0)>>>14|0,2);a=a+-1|0;if(!a)break;else b=b+2|0}}c=Mg(((vb(f|0,4,0)|0|0)+512-(vb(d|0,4,0)|0|0)|0)/512|0,vb(e|0,4,0)|0|0)|0;if((c|0)<64){tb(h>>0|0,1|0,1);tb(g>>0|0,1|0,1)}a=Kg(512,512)|0;if(!a)return;else b=24128;while(1){tb(b|0,(O(vb(b|0,2,0)|0|0,c)|0)>>>14|0,2);a=a+-1|0;if(!a)break;else b=b+2|0}return}function Mg(a,b){a=a|0;b=b|0;var c=0;c=(a|0)/(b|0)|0;a=(a-(O(c,b)|0)<<14|0)/(b|0)|0;return 16384-a+(a>>1)>>c|0}function Ng(a,b){a=a|0;b=b|0;Og(a,b);return}function Og(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=vb(a+260|0,4,0)|0|0;e=(fc(c)|0)*8e3|0;d=vb(a+256>>0|0,1,0)|0|0;tb(a+284|0,(e|0)/(4096e3/(Ag(d)|0)|0|0)|0|0,4);tb(a+280|0,Pg(d,c,b)|0|0,4);return}function Pg(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=(c|0)/1e3|0;c=(O(d,-1e3)|0)+c|0;b=fc(b)|0;b=((O(b,c)|0)/1e3|0)+(O(b,d)|0)|0;return O(b,Ag(a)|0)|0}function Qg(a){a=a|0;return (Cg(a)|0)&1|0}function Rg(a,b,c){a=a|0;b=b|0;c=c|0;return Sg(a,b,c)|0}function Sg(a,b,c){a=a|0;b=b|0;c=c|0;b=fc(b)|0;b=O(Ag(a)|0,b)|0;a=(c|0)/(b|0)|0;return (a*1e3|0)+(((c-(O(a,b)|0)|0)*1e3|0)/(b|0)|0)|0}function Tg(a,b){a=a|0;b=b|0;Ug(a,b);return}function Ug(a,b){a=a|0;b=b|0;Vg(a,Pg(vb(a+256>>0|0,1,0)|0|0,vb(a+260|0,4,0)|0|0,b)|0);return}function Vg(a,b){a=a|0;b=b|0;var c=0,d=0;d=a+268|0;c=vb(d|0,4,0)|0|0;do if((c|0)>(b|0))if(!(zg(a,vb(a+264|0,4,0)|0|0)|0)){c=vb(d|0,4,0)|0|0;break}else return;while(0);Wg(a,b-c|0);return}function Wg(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0;if((Jg(vb(a+264|0,4,0)|0|0)|0)<=-1)Aa(16222,14676,225,16296);f=a+268|0;tb(f|0,(vb(f|0,4,0)|0|0)+b|0,4);f=a+300|0;c=vb(f|0,4,0)|0|0;g=Kg(b,c)|0;c=c-g|0;tb(f|0,c|0,4);g=b-g|0;d=a+304|0;b=vb(d|0,4,0)|0|0;e=Kg(g,b)|0;b=b-e|0;tb(d|0,b|0,4);e=g-e|0;if((e|0)!=0?(vb(a+276>>0|0,1,0)|0|0)==0:0){b=a+272|0;tb(b|0,(vb(b|0,4,0)|0|0)+e|0,4);Fg(a,cb[(xb(vb((vb(a|0,4,0)|0|0)+72|0,4,0)|0|0,31|0)|0)&31](a,e)|0);b=vb(d|0,4,0)|0|0;c=vb(f|0,4,0)|0|0}if(b|c|0)return;g=a+277|0;tb(g>>0|0,vb(g>>0|0,1,0)|0|(vb(a+276>>0|0,1,0)|0)|0,1);return}function Xg(a){a=a|0;ib[(xb(vb((vb(a|0,4,0)|0|0)+52|0,4,0)|0|0,63|0)|0)&63](a,0);return}function Yg(a){a=a|0;Pb(a);return}function Zg(a){a=a|0;Yg(a);Ad(a);return}function _g(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=a+904|0;b=Hh(b,c,d)|0;if(b|0){a=b;return a|0}fg(a,(vb((vb(d|0,4,0)|0|0)+16>>0|0,1,1)|0|0)+1|0);if((vb((vb(d|0,4,0)|0|0)+8>>0|0,1,1)|0|0)>2)Gg(a,17287);Ih(a,4);Kh(a+67e3|0,+Jh(+(+wb(a+248|0,8))));a=Ze(a)|0;return a|0}function $g(a,b,c){a=a|0;b=b|0;c=c|0;Gh(a+904|0,b,c);return 0}function ah(a,b){a=a|0;b=+b;tb(a+916|0,~~(+((Fh(vb(a+328|0,4,0)|0|0)|0)/50|0|0)/b)|0,4);return}function bh(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;$e(a);n=a+1202|0;On(n|0,-55,256)|0;On(a+1458|0,-1,16128)|0;On(a+17586|0,0,49152)|0;On(a+946|0,-1,256)|0;m=a+66738|0;On(m|0,-1,256)|0;i=a+904|0;b=Bh(i,(vb(a+912|0,4,0)|0|0)+(b<<2)+2|0,14)|0;if(!b){a=17189;return a|0}k=Bh(i,b+10|0,6)|0;if(!k){a=17189;return a|0}c=Bh(i,b+12|0,8)|0;if(!c){a=17189;return a|0}Ch(a+340|0,n);tb(a+874|0,Dh(vb(k>>0|0,1,0)|0|0,vb(k+1>>0|0,1,0)|0|0)|0|0,2);g=vb(b+8>>0|0,1,0)|0|0;l=a+880|0;tb(a+885>>0|0,g|0,1);tb(a+883>>0|0,g|0,1);tb(a+881>>0|0,g|0,1);tb(a+886>>0|0,g|0,1);g=vb(b+9>>0|0,1,0)|0|0;b=a+884|0;tb(b>>0|0,g|0,1);tb(a+882>>0|0,g|0,1);tb(l>>0|0,g|0,1);tb(a+887>>0|0,g|0,1);g=l;g=vb(g|0,2,1)|0|(vb(g+2|0,2,1)|0)<<16;l=l+4|0;l=vb(l|0,2,1)|0|(vb(l+2|0,2,1)|0)<<16;h=a+888|0;f=h;tb(f|0,g|0,2);tb(f+2|0,g>>>16|0,2);h=h+4|0;tb(h|0,l|0,2);tb(h+2|0,l>>>16|0,2);b=vb(b|0,2,0)|0|0;tb(a+878|0,b|0,2);tb(a+876|0,b|0,2);b=Dh(vb(c>>0|0,1,0)|0|0,vb(c+1>>0|0,1,0)|0|0)|0;if(!b){a=17189;return a|0}l=Dh(vb(k+2>>0|0,1,0)|0|0,vb(k+3>>0|0,1,0)|0|0)|0;l=(l|0)==0?b:l;h=a+908|0;g=c;do{c=Dh(vb(g+2>>0|0,1,0)|0|0,vb(g+3>>0|0,1,0)|0|0)|0;if((c+b|0)>>>0>65536){Gg(a,17128);c=65536-b|0}f=Bh(i,g+4|0,0)|0;e=g;g=g+6|0;d=f;if(c>>>0>((vb(h|0,4,0)|0|0)-d|0)>>>0){Gg(a,17148);c=(vb(h|0,4,0)|0|0)-d|0}Mn(a+1202+b|0,f|0,c|0)|0;if(((vb(h|0,4,0)|0|0)-g|0)<8){j=11;break}b=Dh(vb(g>>0|0,1,0)|0|0,vb(e+7>>0|0,1,0)|0|0)|0}while((b|0)!=0);if((j|0)==11)Gg(a,17148);c=n;d=17166;e=c+10|0;do{tb(c>>0|0,vb(d>>0|0,1,0)|0|0|0,1);c=c+1|0;d=d+1|0}while((c|0)<(e|0));b=Dh(vb(k+4>>0|0,1,0)|0|0,vb(k+5>>0|0,1,0)|0|0)|0;if(b|0){c=n;d=17176;e=c+13|0;do{tb(c>>0|0,vb(d>>0|0,1,0)|0|0|0,1);c=c+1|0;d=d+1|0}while((c|0)<(e|0));tb(a+1211>>0|0,b|0,1);tb(a+1212>>0|0,b>>>8|0,1)}tb(a+1204>>0|0,l|0,1);tb(a+1205>>0|0,l>>>8|0,1);tb(a+1258>>0|0,-5|0,1);c=m;d=n;e=c+128|0;do{tb(c>>0|0,vb(d>>0|0,1,0)|0|0|0,1);c=c+1|0;d=d+1|0}while((c|0)<(e|0));tb(a+928|0,165|0,4);tb(a+932|0,0|0,4);Eh(a+67e3|0);tb(a+920|0,vb(a+916|0,4,0)|0|0,4);Ye(a,3546900);Xc(a,+wh(+(+wb(a+240|0,8))));tb(a+944>>0|0,0|0,1);tb(a+945>>0|0,0|0,1);tb(a+940|0,0|0,4);a=0;return a|0}function ch(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;if((b|0)>2){tb(a+924|0,c|0,4);return}else{Ah(a+67e3|0,b,c);return}}function dh(a,b){a=a|0;b=b|0;yh(a+67e3|0,b);return}function eh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;m=a+340|0;o=a+860|0;fh(vb(o|0,4,0)|0|0);c=vb(b|0,4,0)|0|0;if(!((vb(a+945>>0|0,1,0)|0|(vb(a+944>>0|0,1,0)|0))<<24>>24)){c=(c|0)/2|0;tb(b|0,c|0,4)}e=vb(o|0,4,0)|0|0;d=vb(e|0,4,0)|0|0;e=vb(e+4|0,4,0)|0|0;n=a+920|0;if((gh(d,e)|0)>=(c|0)){l=d;m=e;m=gh(l,m)|0;tb(b|0,m|0,4);l=vb(n|0,4,0)|0|0;m=l-m|0;tb(n|0,m|0,4);n=vb(b|0,4,0)|0|0;n=0-n|0;o=vb(o|0,4,0)|0|0;jh(o,n);o=a+67e3|0;a=vb(b|0,4,0)|0|0;kh(o,a);return 0}j=a+916|0;f=a+896|0;k=a+872|0;g=a+897|0;l=a+874|0;h=a+900|0;i=a+899|0;do{ih(m,hh(c,vb(n|0,4,0)|0|0)|0);e=vb(o|0,4,0)|0|0;d=gh(vb(e|0,4,0)|0|0,vb(e+4|0,4,0)|0|0)|0;c=vb(n|0,4,0)|0|0;if((d|0)>=(c|0)?(tb(n|0,(vb(j|0,4,0)|0|0)+c|0,4),vb(f>>0|0,1,0)|0|0):0){c=vb(k|0,2,0)|0|0;if((vb((c&65535)+(a+1202)>>0|0,1,0)|0|0)==118){c=c+1<<16>>16;tb(k|0,c|0,2);d=c&255;c=(c&65535)>>>8&255}else{d=c&255;c=(c&65535)>>>8&255}tb(g>>0|0,0|0,1);tb(f>>0|0,0|0,1);p=vb(l|0,2,0)|0|0;tb((p+-1&65535)+(a+1202)>>0|0,c|0,1);c=p+-2<<16>>16;tb(l|0,c|0,2);tb((c&65535)+(a+1202)>>0|0,d|0,1);tb(k|0,56|0,2);jh(e,12);if((vb(h>>0|0,1,0)|0|0)==2){jh(vb(o|0,4,0)|0|0,6);p=(vb(i>>0|0,1,1)|0)<<8|255;tb(k|0,(vb((p+1&65280)+(a+1202)>>0|0,1,1)|0)<<8|(vb(a+1202+p>>0|0,1,1)|0)|0,2)}}e=vb(o|0,4,0)|0|0;d=vb(e|0,4,0)|0|0;e=vb(e+4|0,4,0)|0|0;p=gh(d,e)|0;c=vb(b|0,4,0)|0|0}while((p|0)<(c|0));c=e;p=gh(d,c)|0;tb(b|0,p|0,4);m=vb(n|0,4,0)|0|0;p=m-p|0;tb(n|0,p|0,4);p=vb(b|0,4,0)|0|0;p=0-p|0;o=vb(o|0,4,0)|0|0;jh(o,p);a=a+67e3|0;p=vb(b|0,4,0)|0|0;kh(a,p);return 0}function fh(a){a=a|0;tb(a+4|0,0-(vb(a|0,4,0)|0|0)|0,4);return}function gh(a,b){a=a|0;b=b|0;return a+b|0}function hh(a,b){a=a|0;b=b|0;return ((a|0)<(b|0)?a:b)|0}
            function Zj(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0,R=0;P=a+1984|0;g=(vb(P|0,4,0)|0|0)-b|0;if((g|0)>=1)Aa(18648,18662,138,18679);tb(P|0,b|0,4);H=a+1980|0;tb(H|0,(vb(H|0,4,0)|0|0)+g|0,4);I=a+1868|0;tb(I|0,(vb(I|0,4,0)|0|0)+g|0,4);J=a+1892|0;tb(J|0,(vb(J|0,4,0)|0|0)+g|0,4);K=a+1916|0;tb(K|0,(vb(K|0,4,0)|0|0)+g|0,4);G=a+1974|0;j=vb(G>>0|0,1,0)|0|0;Q=a+1975|0;d=vb(Q>>0|0,1,0)|0|0;R=a+1976|0;c=vb(R>>0|0,1,0)|0|0;L=a+1972|0;e=vb(L|0,2,0)|0|0;N=a+1978|0;f=vb(N>>0|0,1,0)|0|0;M=a+1977|0;o=vb(M>>0|0,1,1)|0|0;l=o<<8;m=o<<3&256;n=(o<<4&2048|o&2)^2;i=vb((e&65535)+(a+2700)>>0|0,1,0)|0|0;k=i&255;h=vb(a+2188+k>>0|0,1,0)|0|0;g=(h&255)+g|0;a:do if((g|0)<=0){u=a+68202|0;v=a+68203|0;q=j;p=m;j=e;t=f;r=d;b:while(1){f=j+1<<16>>16;m=f&65535;h=vb(a+2700+m>>0|0,1,0)|0|0;d=h&255;c:do switch(i<<24>>24){case -17:{s=276;break b}case -16:{e=j+2<<16>>16;if(!((n&255)<<24>>24)){j=q;e=(h<<24>>24)+(e&65535)&65535;f=t;d=r;break c}else{j=q;g=g+-2|0;f=t;d=r;break c}}case -48:{e=j+2<<16>>16;if(!((n&255)<<24>>24)){j=q;g=g+-2|0;f=t;d=r;break c}else{j=q;e=(h<<24>>24)+(e&65535)&65535;f=t;d=r;break c}}case 63:{j=m+2|0;e=((vb((m+1&65535)+(a+2700)>>0|0,1,1)|0)<<8|d)&65535;tb((t&255|256)+(a+2700)>>0|0,j>>>8|0,1);tb((t+-1&255|256)+(a+2700)>>0|0,j|0,1);j=q;f=t+-2<<24>>24;d=r;break}case 111:{f=t+2<<24>>24;j=q;e=((vb((f&255|256)+(a+2700)>>0|0,1,1)|0)<<8|(vb((t+1&255|256)+(a+2700)>>0|0,1,1)|0))&65535;d=r;break}case -28:{e=j+2<<16>>16;f=d|p;d=f+-253|0;if(d>>>0>=3){h=vb(a+2700+f>>0|0,1,0)|0|0;d=f+-240|0;if(d>>>0>=16){j=h;n=h&255;f=t;d=r;break c}n=gk(a,d,g)|0;j=n&255;f=t;d=r;break c}d=a+1868+(d*24|0)|0;if((g|0)>=(vb(d|0,4,0)|0|0))fk(d,g)|0;j=d+20|0;n=vb(j|0,4,0)|0|0;tb(j|0,0|0,4);j=n&255;f=t;d=r;break}case -6:{f=g+-2|0;e=d|p;d=e+-253|0;if(d>>>0>=3){d=vb(a+2700+e>>0|0,1,1)|0|0;e=e+-240|0;if(e>>>0<16)d=gk(a,e,f)|0}else{d=a+1868+(d*24|0)|0;if((f|0)>=(vb(d|0,4,0)|0|0))fk(d,f)|0;s=d+20|0;d=vb(s|0,4,0)|0|0;tb(s|0,0|0,4)}d=d+8192|0;s=30;break}case -113:{s=30;break}case -60:{e=j+2<<16>>16;d=d|p;tb(a+2700+d>>0|0,q|0,1);f=d+-240|0;if(f>>>0<16){tb(a+1940+f>>0|0,q|0,1);switch(d&511){case 242:{j=q;f=t;d=r;break c}case 243:{ik(a,q&255,g);j=q;f=t;d=r;break c}default:{jk(a,q&255,g,f&65535);j=q;f=t;d=r;break c}}}else{j=q;f=t;d=r}break}case -26:{d=r&255|p;e=j;s=44;break}case -9:{d=d|p;d=((vb(d+1+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+d>>0|0,1,1)|0))+(c&255)|0;e=f;s=44;break}case -25:{d=d+(r&255)&255|p;d=(vb(d+1+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+d>>0|0,1,1)|0);e=f;s=44;break}case -10:{d=d+(c&255)|0;s=42;break}case -11:{d=d+(r&255)|0;s=42;break}case -27:{s=42;break}case -12:{d=d+(r&255)&255|p;e=f;s=44;break}case -65:{d=r&255;n=kk(a,(d|p)&65535,g+-1|0)|0;j=n&255;e=f;f=t;d=d+1&255;break}case -24:{j=h;n=d;e=f;f=o;d=r;s=6;break}case -7:{d=d+(c&255)&255;s=47;break}case -8:{s=47;break}case -23:{d=kk(a,((vb((m+1&65535)+(a+2700)>>0|0,1,1)|0)<<8|d)&65535,g)|0;e=j+2<<16>>16;s=54;break}case -51:{e=f;s=54;break}case -5:{d=d+(r&255)&255;s=56;break}case -21:{s=56;break}case -20:{d=(vb((m+1&65535)+(a+2700)>>0|0,1,1)|0)<<8|d;e=m+2&65535;c=d+-253|0;if(c>>>0>=3){c=vb(a+2700+d>>0|0,1,0)|0|0;d=d+-240|0;if(d>>>0>=16){j=q;n=c&255;f=t;d=r;break c}c=gk(a,d,g)|0;j=q;n=c;f=t;d=r;c=c&255;break c}c=a+1868+(c*24|0)|0;if((g|0)>=(vb(c|0,4,0)|0|0))fk(c,g)|0;j=c+20|0;c=vb(j|0,4,0)|0|0;tb(j|0,0|0,4);j=q;n=c;f=t;d=r;c=c&255;break}case -115:{j=q;n=d;e=f;f=o;d=r;c=h;s=6;break}case -58:{d=r&255|p;e=j;s=76;break}case -41:{d=d|p;d=((vb(d+1+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+d>>0|0,1,1)|0))+(c&255)|0;e=f;s=76;break}case -57:{d=d+(r&255)&255|p;d=(vb(d+1+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+d>>0|0,1,1)|0);e=f;s=76;break}case -42:{d=d+(c&255)|0;s=74;break}case -43:{d=d+(r&255)|0;s=74;break}case -59:{s=74;break}case -44:{d=d+(r&255)&255|p;e=f;s=76;break}case -52:{e=c;s=78;break}case -55:{e=r;s=78;break}case -39:{d=d+(c&255)&255;s=80;break}case -40:{s=80;break}case -37:{d=d+(r&255)&255;s=82;break}case -53:{s=82;break}case 125:{j=r;n=r&255;e=f;f=t;d=r;break}case -35:{j=c;n=c&255;e=f;f=t;d=r;break}case 93:{j=q;n=q&255;e=f;f=t;d=q;break}case -3:{j=q;n=q&255;e=f;f=t;d=r;c=q;break}case -99:{j=q;n=t&255;e=f;f=t;d=t;break}case -67:{j=q;e=f;f=r;d=r;break}case -81:{d=r&255;lk(a,q&255|8192,(d|p)&65535,g);j=q;e=f;f=t;d=d+1&255;break}case 38:{d=r&255|p;e=j;s=97;break}case 55:{d=d|p;d=((vb(d+1+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+d>>0|0,1,1)|0))+(c&255)|0;e=f;s=97;break}case 39:{d=d+(r&255)&255|p;d=(vb(d+1+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+d>>0|0,1,1)|0);e=f;s=97;break}case 54:{d=d+(c&255)|0;s=94;break}case 53:{d=d+(r&255)|0;s=94;break}case 37:{s=94;break}case 52:{d=d+(r&255)&255;s=96;break}case 36:{s=96;break}case 40:{e=f;s=98;break}case 57:{h=r;d=kk(a,(c&255|p)&65535,g+-2|0)|0;e=f;s=102;break}case 41:{d=kk(a,(d|p)&65535,g+-3|0)|0;s=101;break}case 56:{s=101;break}case 6:{d=r&255|p;e=j;s=111;break}case 23:{d=d|p;d=((vb(d+1+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+d>>0|0,1,1)|0))+(c&255)|0;e=f;s=111;break}case 7:{d=d+(r&255)&255|p;d=(vb(d+1+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+d>>0|0,1,1)|0);e=f;s=111;break}case 22:{d=d+(c&255)|0;s=108;break}case 21:{d=d+(r&255)|0;s=108;break}case 5:{s=108;break}case 20:{d=d+(r&255)&255;s=110;break}case 4:{s=110;break}case 8:{e=f;s=112;break}case 25:{h=r;d=kk(a,(c&255|p)&65535,g+-2|0)|0;e=f;s=116;break}case 9:{d=kk(a,(d|p)&65535,g+-3|0)|0;s=115;break}case 24:{s=115;break}case 70:{d=r&255|p;e=j;s=125;break}case 87:{d=d|p;d=((vb(d+1+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+d>>0|0,1,1)|0))+(c&255)|0;e=f;s=125;break}case 71:{d=d+(r&255)&255|p;d=(vb(d+1+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+d>>0|0,1,1)|0);e=f;s=125;break}case 86:{d=d+(c&255)|0;s=122;break}case 85:{d=d+(r&255)|0;s=122;break}case 69:{s=122;break}case 84:{d=d+(r&255)&255;s=124;break}case 68:{s=124;break}case 72:{e=f;s=126;break}case 89:{h=r;d=kk(a,(c&255|p)&65535,g+-2|0)|0;e=f;s=130;break}case 73:{d=kk(a,(d|p)&65535,g+-3|0)|0;s=129;break}case 88:{s=129;break}case 102:{d=r&255|p;e=j;s=139;break}case 119:{d=d|p;d=((vb(d+1+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+d>>0|0,1,1)|0))+(c&255)|0;e=f;s=139;break}case 103:{d=d+(r&255)&255|p;d=(vb(d+1+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+d>>0|0,1,1)|0);e=f;s=139;break}case 118:{d=d+(c&255)|0;s=136;break}case 117:{d=d+(r&255)|0;s=136;break}case 101:{s=136;break}case 116:{d=d+(r&255)&255;s=138;break}case 100:{s=138;break}case 104:{e=f;s=140;break}case 121:{n=kk(a,(c&255|p)&65535,g+-2|0)|0;n=(kk(a,(r&255|p)&65535,g+-1|0)|0)-n|0;j=q;l=~n;n=n&255;e=f;f=t;d=r;break}case 105:{d=kk(a,(d|p)&65535,g+-3|0)|0;s=143;break}case 120:{s=143;break}case 62:{e=f;f=p;s=145;break}case 30:{e=j+2<<16>>16;f=(vb((m+1&65535)+(a+2700)>>0|0,1,1)|0)<<8;s=145;break}case -56:{e=f;s=146;break}case 126:{e=f;f=p;s=148;break}case 94:{e=j+2<<16>>16;f=(vb((m+1&65535)+(a+2700)>>0|0,1,1)|0)<<8;s=148;break}case -83:{e=f;s=149;break}case -103:case -71:{f=r;d=kk(a,(c&255|p)&65535,g+-2|0)|0;e=j;s=153;break}case -119:case -87:{d=kk(a,(d|p)&65535,g+-3|0)|0;s=152;break}case -104:case -72:{s=152;break}case -90:case -122:{d=r&255|p;e=j;s=162;break}case -73:case -105:{d=d|p;d=((vb(d+1+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+d>>0|0,1,1)|0))+(c&255)|0;e=f;s=162;break}case -89:case -121:{d=d+(r&255)&255|p;d=(vb(d+1+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+d>>0|0,1,1)|0);e=f;s=162;break}case -74:case -106:{d=d+(c&255)|0;s=159;break}case -75:case -107:{d=d+(r&255)|0;s=159;break}case -91:case -123:{s=159;break}case -76:case -108:{d=d+(r&255)&255;s=161;break}case -92:case -124:{s=161;break}case -120:case -88:{e=f;s=163;break}case -68:{n=(q&255)+1|0;j=n&255;e=f;f=t;d=r;break}case 61:{d=(r&255)+1|0;j=q;n=d;e=f;f=t;d=d&255;break}case -4:{c=(c&255)+1|0;j=q;n=c;e=f;f=t;d=r;c=c&255;break}case -100:{n=(q&255)+-1|0;j=n&255;e=f;f=t;d=r;break}case 29:{d=(r&255)+-1|0;j=q;n=d;e=f;f=t;d=d&255;break}case -36:{c=(c&255)+-1|0;j=q;n=c;e=f;f=t;d=r;c=c&255;break}case -69:case -101:{d=d+(r&255)&255;s=174;break}case -85:case -117:{s=174;break}case -84:case -116:{d=(vb((m+1&65535)+(a+2700)>>0|0,1,1)|0)<<8|d;e=j+2<<16>>16;s=176;break}case 92:{d=0;s=178;break}case 124:{d=l;s=178;break}case 28:{d=0;s=180;break}case 60:{d=l;s=180;break}case 11:{e=0;d=d|p;s=187;break}case 27:{e=0;s=183;break}case 59:{e=l;s=183;break}case 43:{e=l;s=184;break}case 12:{e=0;s=186;break}case 44:{e=l;s=186;break}case 75:{e=0;d=d|p;s=194;break}case 91:{e=0;s=190;break}case 123:{e=l;s=190;break}case 107:{e=l;s=191;break}case 76:{e=0;s=193;break}case 108:{e=l;s=193;break}case -97:{n=q&255;n=n>>>4|n<<4;j=n&255;n=n&255;e=f;f=t;d=r;break}case -70:{n=kk(a,(d|p)&65535,g+-2|0)|0;c=kk(a,(d+1&255|p)&65535,g)|0;j=n&255;n=(n>>>1|n)&127|c&255;e=f;f=o;d=r;c=c&255;s=6;break}case -38:{lk(a,q&255,(d|p)&65535,g+-1|0);lk(a,c&255|8192,(d+1&255|p)&65535,g);j=q;e=f;f=o;d=r;s=6;break}case 26:case 58:{j=(d|p)&65535;e=(k>>>4&2)+-1+(kk(a,j,g+-3|0)|0)|0;lk(a,e,j,g+-2|0);j=(d+1&255|p)&65535;n=(e>>>8)+(kk(a,j,g+-1|0)|0)&255;lk(a,n,j,g);j=q;n=(e>>>1|e)&127|n;e=f;f=o;d=r;s=6;break}case -102:case 122:{n=kk(a,(d|p)&65535,g+-2|0)|0;j=kk(a,(d+1&255|p)&65535,g)|0;d=i<<24>>24==-102;j=d?j^255:j;n=(d?(n^255)+1|0:n)+(q&255)|0;d=c&255;c=j+d+(n>>8)|0;d=j^d^c;j=n&255;l=c;n=(n>>>1|n)&127|c&255;e=f;f=d>>>1&8|o&-73|(d+128|0)>>>2&64;d=r;c=c&255;s=6;break}case 90:{e=(q&255)-(kk(a,(d|p)&65535,g+-1|0)|0)|0;n=(c&255)-(kk(a,(d+1&255|p)&65535,g)|0)+(e>>8)|0;j=q;l=~n;n=(e>>>1|e)&127|n&255;e=f;f=o;d=r;s=6;break}case -49:{n=O(q&255,c&255)|0;c=n>>>8;j=n&255;n=(n>>>1|n)&127|c;e=f;f=t;d=r;c=c&255;break}case -98:{k=c&255;d=q&255|k<<8;h=o&-73;i=r&255;h=(c&255)<(r&255)?h:h|64;if(k>>>0<i<<1>>>0){m=(d>>>0)/(i>>>0)|0;c=m;m=d-(O(m&255,i)|0)|0}else{q=d-(i<<9)|0;m=256-i|0;c=255-((q>>>0)/(m>>>0)|0)|0;m=((q>>>0)%(m>>>0)|0)+i|0}j=c&255;n=c&255;e=f;o=(k&15)>>>0<(i&15)>>>0?h:h|8;f=t;d=r;c=m&255;break}case -33:{e=(l&256|0)==0&(q&255)<154;j=e?q:(q&255)+96&255;n=j&255;n=(o&8|0)==0&(n&14)>>>0<10?j:n+6&255;j=n;l=e?l:256;n=n&255;e=f;f=t;d=r;break}case -66:{e=(l&256|0)==0|(q&255)>153;n=e?(q&255)+160&255:q;j=n&255;n=(o&8|0)==0|(j&14)>>>0>9?j+250&255:n;j=n;l=e?0:l;n=n&255;e=f;f=t;d=r;break}case 47:{j=q;e=(h<<24>>24)+m&65535;f=o;d=r;s=6;break}case 48:{e=j+2<<16>>16;if(!(n&2176)){j=q;g=g+-2|0;f=t;d=r;break c}else{j=q;e=(h<<24>>24)+(e&65535)&65535;f=t;d=r;break c}}case 16:{e=j+2<<16>>16;if(!(n&2176)){j=q;e=(h<<24>>24)+(e&65535)&65535;f=t;d=r;break c}else{j=q;g=g+-2|0;f=t;d=r;break c}}case -80:{e=j+2<<16>>16;if(!(l&256)){j=q;g=g+-2|0;f=t;d=r;break c}else{j=q;e=(h<<24>>24)+(e&65535)&65535;f=t;d=r;break c}}case -112:{e=j+2<<16>>16;if(!(l&256)){j=q;e=(h<<24>>24)+(e&65535)&65535;f=t;d=r;break c}else{j=q;g=g+-2|0;f=t;d=r;break c}}case 112:{e=j+2<<16>>16;if(!(o&64)){j=q;g=g+-2|0;f=t;d=r;break c}else{j=q;e=(h<<24>>24)+(e&65535)&65535;f=t;d=r;break c}}case 80:{e=j+2<<16>>16;if(!(o&64)){j=q;e=(h<<24>>24)+(e&65535)&65535;f=t;d=r;break c}else{j=q;g=g+-2|0;f=t;d=r;break c}}case -29:case -61:case -93:case -125:case 99:case 67:case 35:case 3:{s=((kk(a,(d|p)&65535,g+-4|0)|0)&1<<(k>>>5)|0)==0;d=s?4:3;g=s?g+-2|0:g;s=278;break}case -13:case -45:case -77:case -109:case 115:case 83:case 51:case 19:{s=((kk(a,(d|p)&65535,g+-4|0)|0)&1<<(k>>>5)|0)==0;d=s?3:4;g=s?g:g+-2|0;s=278;break}case -34:{d=d+(r&255)&255;s=230;break}case 46:{s=230;break}case 110:{d=(d|p)&65535;s=kk(a,d,g+-4|0)|0;lk(a,s+8191|0,d,g+-3|0);s=(s|0)==1;d=s?4:3;g=s?g+-2|0:g;s=278;break}case -2:{c=(c&255)+255&255;e=j+2<<16>>16;if(!(c<<24>>24)){j=q;g=g+-2|0;f=t;d=r;c=0;break c}else{j=q;e=(h<<24>>24)+(e&65535)&65535;f=t;d=r;break c}}case 31:{f=((vb((m+1&65535)+(a+2700)>>0|0,1,1)|0)<<8|d)+(r&255)|0;d=vb((f&65535)+(a+2700)>>0|0,1,0)|0|0;f=f&65535;s=242;break}case 95:{d=h;s=242;break}case 15:{e=((vb(v>>0|0,1,1)|0)<<8|(vb(u>>0|0,1,1)|0))&65535;tb((t&255|256)+(a+2700)>>0|0,(f&65535)>>>8|0,1);tb((t+-1&255|256)+(a+2700)>>0|0,f|0,1);j=l>>>8&1|p>>>3|o&-164|(n>>>4|n)&128;tb((t+-2&255|256)+(a+2700)>>0|0,((n&255)<<24>>24==0?j|2:j)|0,1);j=q;o=o&-21|16;f=t+-3<<24>>24;d=r;break}case 79:{j=m+1|0;tb((t&255|256)+(a+2700)>>0|0,j>>>8|0,1);tb((t+-1&255|256)+(a+2700)>>0|0,j|0,1);j=q;e=(d|65280)&65535;f=t+-2<<24>>24;d=r;break}case -15:case -31:case -47:case -63:case -79:case -95:case -111:case -127:case 113:case 97:case 81:case 65:case 49:case 33:case 17:case 1:{e=65502-(k>>>3)|0;e=((vb((e+1&65535)+(a+2700)>>0|0,1,1)|0)<<8|(vb(a+2700+e>>0|0,1,1)|0))&65535;tb((t&255|256)+(a+2700)>>0|0,(f&65535)>>>8|0,1);tb((t+-1&255|256)+(a+2700)>>0|0,f|0,1);j=q;f=t+-2<<24>>24;d=r;break}case 127:{f=t+3<<24>>24;e=((vb((f&255|256)+(a+2700)>>0|0,1,1)|0)<<8|(vb((t+2&255|256)+(a+2700)>>0|0,1,1)|0))&65535;d=vb((t+1&255|256)+(a+2700)>>0|0,1,1)|0|0;s=248;break}case -114:{d=t+1<<24>>24;e=f;f=d;d=vb((d&255|256)+(a+2700)>>0|0,1,1)|0|0;s=248;break}case 13:{j=l>>>8&1|p>>>3|o&-164|(n>>>4|n)&128;tb((t&255|256)+(a+2700)>>0|0,((n&255)<<24>>24==0?j|2:j)|0,1);j=q;e=f;f=t+-1<<24>>24;d=r;break}case 45:{tb((t&255|256)+(a+2700)>>0|0,q|0,1);j=q;e=f;f=t+-1<<24>>24;d=r;break}case 77:{tb((t&255|256)+(a+2700)>>0|0,r|0,1);j=q;e=f;f=t+-1<<24>>24;d=r;break}case 109:{tb((t&255|256)+(a+2700)>>0|0,c|0,1);j=q;e=f;f=t+-1<<24>>24;d=r;break}case -82:{d=t+1<<24>>24;j=vb((d&255|256)+(a+2700)>>0|0,1,0)|0|0;e=f;f=d;d=r;break}case -50:{d=t+1<<24>>24;j=q;e=f;f=d;d=vb((d&255|256)+(a+2700)>>0|0,1,0)|0|0;break}case -18:{c=t+1<<24>>24;j=q;e=f;f=c;d=r;c=vb((c&255|256)+(a+2700)>>0|0,1,0)|0|0;break}case -14:case -46:case -78:case -110:case 114:case 82:case 50:case 18:case -30:case -62:case -94:case -126:case 98:case 66:case 34:case 2:{e=1<<(k>>>5);j=(d|p)&65535;lk(a,(kk(a,j,g+-1|0)|0)&~e|((k&16|0)==0?e:0),j,g);j=q;e=f;f=o;d=r;s=6;break}case 78:case 14:{j=((vb((m+1&65535)+(a+2700)>>0|0,1,1)|0)<<8|d)&65535;n=kk(a,j,g+-2|0)|0;e=q&255;lk(a,n&~e|(i<<24>>24==14?e:0),j,g);j=q;n=e-n&255;e=m+2&65535;f=t;d=r;break}case 74:{j=q;l=(mk(a,f,g)|0)&l;e=m+2&65535;f=t;d=r;break}case 106:{j=q;l=l&~(mk(a,f,g)|0);e=m+2&65535;f=t;d=r;break}case 10:{j=q;l=mk(a,f,g+-1|0)|0|l;e=m+2&65535;f=t;d=r;break}case 42:{j=q;l=l|~(mk(a,f,g+-1|0)|0);e=m+2&65535;f=t;d=r;break}case -118:{j=q;l=(mk(a,f,g+-1|0)|0)^l;e=m+2&65535;f=t;d=r;break}case -22:{e=vb((m+1&65535)+(a+2700)>>0|0,1,1)|0|0;j=(e<<8&7936|d)&65535;lk(a,1<<(e>>>5)^(kk(a,j,g+-1|0)|0),j,g);j=q;e=m+2&65535;f=t;d=r;break}case -54:{e=vb((m+1&65535)+(a+2700)>>0|0,1,1)|0|0;j=(e<<8&7936|d)&65535;e=e>>>5;lk(a,((kk(a,j,g+-2|0)|0)&~(1<<e)|(l>>>8&1)<<e)+8192|0,j,g);j=q;e=m+2&65535;f=t;d=r;break}case -86:{j=q;l=mk(a,f,g)|0;e=m+2&65535;f=t;d=r;break}case 96:{j=q;l=0;e=f;f=t;d=r;break}case -128:{j=q;l=-1;e=f;f=t;d=r;break}case -19:{j=q;l=l^256;e=f;f=t;d=r;break}case -32:{j=q;e=f;o=o&-73;f=t;d=r;break}case 32:{j=q;p=0;e=f;f=t;d=r;break}case 64:{j=q;p=256;e=f;f=t;d=r;break}case -96:{j=q;e=f;o=o|4;f=t;d=r;break}case -64:{j=q;e=f;o=o&-5;f=t;d=r;break}case 0:{j=q;e=f;f=t;d=r;break}case -1:{if(!(f<<16>>16)){j=q;e=0;f=t;d=r}else{s=276;break b}break}default:{s=277;break b}}while(0);switch(s|0){case 30:{s=0;e=m+2&65535;h=vb(m+1+(a+2700)>>0|0,1,1)|0|p;f=d&255;tb(a+2700+h>>0|0,f|0,1);h=h+-240|0;if(h>>>0<16?(tb(a+1940+h>>0|0,f|0,1),!((h|0)==2|(h&-4|0)==4)):0){hk(a,d,g,h&65535);j=q;f=t;d=r}else{j=q;f=t;d=r}break}case 42:{e=j+2<<16>>16;d=((vb((e&65535)+(a+2700)>>0|0,1,1)|0)<<8)+d|0;s=44;break}case 47:{e=d|p;d=e+-253|0;if(d>>>0>=3){h=vb(a+2700+e>>0|0,1,0)|0|0;d=e+-240|0;if(d>>>0>=16){j=q;n=h&255;e=f;f=o;d=h;s=6;break}d=gk(a,d,g)|0;j=q;n=d;e=f;f=o;d=d&255;s=6;break}d=a+1868+(d*24|0)|0;if((g|0)>=(vb(d|0,4,0)|0|0))fk(d,g)|0;j=d+20|0;d=vb(j|0,4,0)|0|0;tb(j|0,0|0,4);j=q;n=d;e=f;f=o;d=d&255;s=6;break}case 54:{j=q;n=d;f=o;d=d&255;s=6;break}case 56:{s=0;e=j+2<<16>>16;d=d|p;c=d+-253|0;if(c>>>0>=3){c=vb(a+2700+d>>0|0,1,0)|0|0;d=d+-240|0;if(d>>>0>=16){j=q;n=c&255;f=t;d=r;break}c=gk(a,d,g)|0;j=q;n=c;f=t;d=r;c=c&255;break}c=a+1868+(c*24|0)|0;if((g|0)>=(vb(c|0,4,0)|0|0))fk(c,g)|0;j=c+20|0;c=vb(j|0,4,0)|0|0;tb(j|0,0|0,4);j=q;n=c;f=t;d=r;c=c&255;break}case 74:{e=j+2<<16>>16;d=((vb((e&65535)+(a+2700)>>0|0,1,1)|0)<<8)+d|0;s=76;break}case 78:{s=0;lk(a,e&255,((vb((m+1&65535)+(a+2700)>>0|0,1,1)|0)<<8|d)&65535,g);j=q;e=m+2&65535;f=t;d=r;break}case 80:{lk(a,r&255,(d|p)&65535,g);j=q;e=f;f=o;d=r;s=6;break}case 82:{lk(a,c&255,(d|p)&65535,g);j=q;e=f;f=o;d=r;s=6;break}case 94:{e=j+2<<16>>16;d=((vb((e&65535)+(a+2700)>>0|0,1,1)|0)<<8)+d|0;s=97;break}case 96:{d=d|p;e=f;s=97;break}case 101:{h=vb((m+1&65535)+(a+2700)>>0|0,1,0)|0|0;e=m+2&65535;s=102;break}case 108:{e=j+2<<16>>16;d=((vb((e&65535)+(a+2700)>>0|0,1,1)|0)<<8)+d|0;s=111;break}case 110:{d=d|p;e=f;s=111;break}case 115:{h=vb((m+1&65535)+(a+2700)>>0|0,1,0)|0|0;e=m+2&65535;s=116;break}case 122:{e=j+2<<16>>16;d=((vb((e&65535)+(a+2700)>>0|0,1,1)|0)<<8)+d|0;s=125;break}case 124:{d=d|p;e=f;s=125;break}case 129:{h=vb((m+1&65535)+(a+2700)>>0|0,1,0)|0|0;e=m+2&65535;s=130;break}case 136:{e=j+2<<16>>16;d=((vb((e&65535)+(a+2700)>>0|0,1,1)|0)<<8)+d|0;s=139;break}case 138:{d=d|p;e=f;s=139;break}case 143:{e=j+2<<16>>16;n=(kk(a,(vb((e&65535)+(a+2700)>>0|0,1,1)|0|p)&65535,g+-1|0)|0)-d|0;j=q;l=~n;n=n&255;f=o;d=r;s=6;break}case 145:{d=kk(a,(f|d)&65535,g)|0;s=146;break}case 148:{d=kk(a,(f|d)&65535,g)|0;s=149;break}case 152:{e=j+2<<16>>16;f=vb((e&65535)+(a+2700)>>0|0,1,0)|0|0;s=153;break}case 159:{e=j+2<<16>>16;d=((vb((e&65535)+(a+2700)>>0|0,1,1)|0)<<8)+d|0;s=162;break}case 161:{d=d|p;e=f;s=162;break}case 174:{d=d|p;e=f;s=176;break}case 178:{s=0;l=q&255;n=d>>>1&128|l>>>1;j=n&255;l=l<<8;e=f;f=t;d=r;break}case 180:{s=0;l=(q&255)<<1;n=d>>>8&1|l;j=n&255;e=f;f=t;d=r;break}case 183:{d=d+(r&255)&255;s=184;break}case 186:{d=(vb((m+1&65535)+(a+2700)>>0|0,1,1)|0)<<8|d;f=j+2<<16>>16;s=187;break}case 190:{d=d+(r&255)&255;s=191;break}case 193:{d=(vb((m+1&65535)+(a+2700)>>0|0,1,1)|0)<<8|d;f=j+2<<16>>16;s=194;break}case 230:{f=g+-4|0;e=d|p;d=e+-253|0;if(d>>>0>=3){d=vb(a+2700+e>>0|0,1,1)|0|0;e=e+-240|0;if(e>>>0<16)d=gk(a,e,f)|0}else{d=a+1868+(d*24|0)|0;if((f|0)>=(vb(d|0,4,0)|0|0))fk(d,f)|0;s=d+20|0;d=vb(s|0,4,0)|0|0;tb(s|0,0|0,4)}s=(d|0)==(q&255|0);d=s?4:3;g=s?g+-2|0:g;s=278;break}case 242:{s=0;j=q;e=((vb(((f&65535)+1&65535)+(a+2700)>>0|0,1,1)|0)<<8|d&255)&65535;f=t;d=r;break}case 248:{s=0;j=q;l=d<<8;p=d<<3&256;n=(d<<4&2048|d&2)^2;o=d;d=r;break}}d:switch(s|0){case 44:{n=kk(a,d&65535,g)|0;j=n&255;f=o;d=r;s=6;break}case 76:{lk(a,q&255,d&65535,g);j=q;f=o;d=r;s=6;break}case 97:{d=kk(a,d&65535,g)|0;s=98;break}case 102:{s=0;j=(h&255|p)&65535;n=(kk(a,j,g+-1|0)|0)&d;lk(a,n,j,g);j=q;f=t;d=r;break}case 111:{d=kk(a,d&65535,g)|0;s=112;break}case 116:{s=0;j=(h&255|p)&65535;n=kk(a,j,g+-1|0)|0|d;lk(a,n,j,g);j=q;f=t;d=r;break}case 125:{d=kk(a,d&65535,g)|0;s=126;break}case 130:{s=0;j=(h&255|p)&65535;n=(kk(a,j,g+-1|0)|0)^d;lk(a,n,j,g);j=q;f=t;d=r;break}case 139:{d=kk(a,d&65535,g)|0;s=140;break}case 146:{n=(r&255)-d|0;j=q;l=~n;n=n&255;f=o;d=r;s=6;break}case 149:{n=(c&255)-d|0;j=q;l=~n;n=n&255;f=o;d=r;s=6;break}case 153:{f=f&255|p;h=f;f=kk(a,f&65535,g+-1|0)|0;s=164;break}case 162:{d=kk(a,d&65535,g)|0;s=163;break}case 176:{j=d&65535;n=(k>>>4&2)+-1+(kk(a,j,g+-1|0)|0)|0;lk(a,n,j,g);j=q;f=o;d=r;s=6;break}case 184:{d=d|p;s=187;break}case 191:{d=d|p;s=194;break}case 278:{s=0;e=j+2<<16>>16;switch(d&7){case 5:{s=279;break b}case 2:{j=q;f=t;d=r;break d}case 4:{j=q;f=o;d=r;s=6;break d}case 3:break;default:{s=284;break b}}e=e&65535;j=q;e=(vb(a+2700+e>>0|0,1,0)|0|0)+e&65535;f=o;d=r;s=6;break}}if((s|0)==98){n=d&(q&255);j=n&255;f=o;d=r;s=6}else if((s|0)==112){n=d|q&255;j=n&255;n=n&255;f=o;d=r;s=6}else if((s|0)==126){n=d^q&255;j=n&255;n=n&255;f=o;d=r;s=6}else if((s|0)==140){n=(q&255)-d|0;j=q;l=~n;n=n&255;f=o;d=r;s=6}else if((s|0)==163){h=-1;f=q&255;s=164}else if((s|0)==187){j=d&65535;l=(kk(a,j,g+-1|0)|0)<<1;n=l|e>>>8&1;lk(a,n,j,g);j=q;e=f;f=o;d=r;s=6}else if((s|0)==194){j=d&65535;l=kk(a,j,g+-1|0)|0;n=l>>1|e>>>1&128;lk(a,n,j,g);j=q;l=l<<8;e=f;f=o;d=r;s=6}do if((s|0)==164){s=(i&255)>159?d^255:d;d=f+(l>>>8&1)+s|0;f=s^f^d;f=f>>>1&8|o&-73|(f+128|0)>>>2&64;if((h|0)<0){j=d&255;l=d;n=d;d=r;s=6;break}else{lk(a,d,h&65535,g);j=q;l=d;n=d;d=r;s=6;break}}while(0);if((s|0)==6){s=0;e=e+1<<16>>16;o=f;f=t}i=vb((e&65535)+(a+2700)>>0|0,1,0)|0|0;k=i&255;h=vb(a+2188+k>>0|0,1,0)|0|0;g=(h&255)+g|0;if((g|0)>0){m=p;k=n;i=o;s=280;break a}else{q=j;j=e;t=f;r=d}}if((s|0)==276){tb(a+2004|0,18690|0,4);F=q;E=l;D=p;C=n;B=j;A=o;z=0;y=t;x=r;w=c;break}else if((s|0)!=277)if((s|0)==279){h=vb((vb((e&65535)+(a+2700)>>0|0,1,1)|0|0)+(a+2188)>>0|0,1,0)|0|0;j=q;m=p;k=n;i=o;f=t;d=r;s=280;break}}else{k=n;i=o;s=280}while(0);if((s|0)==280){F=j;E=l;D=m;C=k;B=e;A=i;z=g-(h&255)|0;y=f;x=d;w=c}tb(L|0,B|0,2);tb(N>>0|0,y|0,1);tb(G>>0|0,F|0,1);tb(Q>>0|0,x|0,1);tb(R>>0|0,w|0,1);R=E>>>8&1|D>>>3|A&-164|(C>>>4|C)&128;tb(M>>0|0,((C&255)<<24>>24==0?R|2:R)|0,1);R=(vb(P|0,4,0)|0|0)+z|0;tb(P|0,R|0,4);tb(H|0,(vb(H|0,4,0)|0|0)-z|0,4);tb(I|0,(vb(I|0,4,0)|0|0)-z|0,4);tb(J|0,(vb(J|0,4,0)|0|0)-z|0,4);tb(K|0,(vb(K|0,4,0)|0|0)-z|0,4);if((R|0)>(b|0))Aa(18710,18662,1182,18679);else return}function _j(a,b){a=a|0;b=b|0;if((vb(a|0,4,0)|0|0)>(b|0)){b=a;return b|0}fk(a,b)|0;b=a;return b|0}function $j(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0;la=a+280|0;ma=(vb(la|0,4,0)|0|0)+b|0;d=ma>>5;tb(la|0,ma&31|0,4);if(!d)return;ga=vb(a+1556|0,4,0)|0|0;ka=ga+((vb(a+93>>0|0,1,1)|0)<<8)|0;ha=a+45|0;ia=a+61|0;ma=(vb(ha>>0|0,1,1)|0|0)>>>1|(vb(ia>>0|0,1,1)|0);ja=a+108|0;c=(vb(ja>>0|0,1,0)|0)&31;b=vb(a+12>>0|0,1,0)|0|0;la=vb(a+28>>0|0,1,0)|0|0;fa=O(la,b)|0;fa=(fa|0)<(vb(a+1564|0,4,0)|0|0)?0-b|0:b;ea=a+260|0;da=a+1428+(c<<2)|0;G=9892+(c<<2)|0;$=a+268|0;z=a+308|0;D=a+124|0;ca=a+304|0;Z=a+264|0;C=a+77|0;Y=a+272|0;F=a+109|0;H=a+125|0;X=a+276|0;W=a+256|0;I=a+192|0;A=a+128|0;J=a+127|0;K=a+15|0;L=a+31|0;M=a+47|0;N=a+63|0;P=a+79|0;Q=a+95|0;R=a+111|0;S=a+13|0;T=a+44|0;U=a+60|0;aa=a+1568|0;ba=a+1572|0;B=a+1580|0;V=a+1612|0;_=a+300|0;E=a+92|0;a:while(1){x=(vb(ea|0,4,0)|0)^1;tb(ea|0,x|0,4);if(x|0){x=(vb(_|0,4,0)|0)&~(vb(Z|0,4,0)|0);tb(_|0,x|0,4);tb(Z|0,x|0,4);tb(ca|0,vb(E>>0|0,1,1)|0|0,4)}ek(a,1);ek(a,2);ek(a,3);if(!((vb(G|0,4,0)|0)&(vb(vb(da|0,4,0)|0|0,4,0)|0))){j=vb($|0,4,0)|0|0;tb($|0,(j<<13^j<<14)&16384^j>>1|0,4);j=0;k=0;l=0;m=0;c=0;v=z;w=a;x=1}else{j=0;k=0;l=0;m=0;c=0;v=z;w=a;x=1}while(1){p=v+104|0;b=vb(ga+(vb(p|0,4,0)|0|0)>>0|0,1,1)|0|0;o=v+112|0;u=vb(o|0,4,0)|0|0;e=(sh(vb(w+2>>0|0,1,0)|0|0,vb(w+3>>0|0,1,0)|0|0)|0)&16383;f=u+-1|0;if((u|0)<=0){c=(O(e,c>>5)|0)>>10;i=(((vb(ha>>0|0,1,1)|0)&x|0)==0?0:c)+e|0;h=v+120|0;g=vb(h|0,4,0)|0|0;tb(w+8>>0|0,g>>>4|0,1);if(!g){g=0;r=j;s=k;n=h;t=l;u=m;q=0;k=i}else{f=vb(v+100|0,4,0)|0|0;e=f>>>3&510;c=13214+(e<<1)|0;e=14234+(0-e<<1)|0;f=(vb(v+96|0,4,0)|0|0)+(f>>>12<<2)|0;if(!(x&ma)){u=O(vb(c|0,2,0)|0|0,vb(f|0,4,0)|0|0)|0;c=(O(vb(c+2|0,2,0)|0|0,vb(f+4|0,4,0)|0|0)|0)+u|0;c=c+(O(vb(e+2|0,2,0)|0|0,vb(f+8|0,4,0)|0|0)|0)|0;c=(O(c+(O(vb(e|0,2,0)|0|0,vb(f+12|0,4,0)|0|0)|0)>>11,g)|0)>>11}else{if(!((vb(ia>>0|0,1,1)|0)&x)){u=(O(vb(c|0,2,0)|0|0,vb(f|0,4,0)|0|0)|0)>>>11;c=((O(vb(c+2|0,2,0)|0|0,vb(f+4|0,4,0)|0|0)|0)>>>11)+u|0;c=c+((O(vb(e+2|0,2,0)|0|0,vb(f+8|0,4,0)|0|0)|0)>>>11)<<16>>16;c=c+((O(vb(e|0,2,0)|0|0,vb(f+12|0,4,0)|0|0)|0)>>11)|0;c=((c<<16>>16|0)==(c|0)?c:c>>31^32766)&-2}else c=(vb($|0,4,0)|0)<<17>>16;c=(O(c,g)|0)>>11&-2}t=O(vb(v+128|0,4,0)|0|0,c)|0;u=O(vb(v+132|0,4,0)|0|0,c)|0;s=((vb(C>>0|0,1,1)|0)&x|0)==0;r=(s?0:t)+j|0;s=(s?0:u)+k|0;n=h;t=t+l|0;u=u+m|0;q=c;k=i}}else{tb(o|0,f|0,4);if((f|0)==4){b=ka+((vb(w+4>>0|0,1,1)|0)<<2)|0;tb(p|0,sh(vb(b>>0|0,1,0)|0|0,vb(b+1>>0|0,1,0)|0|0)|0|0,4);tb(v+108|0,1|0,4);tb(v+96|0,v|0,4);b=0}n=v+120|0;tb(n|0,0|0,4);tb(v+124|0,0|0,4);tb(v+100|0,(f&3|0?16384:0)|0,4);tb(w+8>>0|0,0|0,1);g=0;r=j;s=k;t=l;u=m;q=0;k=0}tb(w+9>>0|0,q>>>8|0,1);if((b&3|0)==1|(vb(ja>>0|0,1,0)|0|0)<0){tb(v+116|0,0|0,4);g=0}if(vb(ea|0,4,0)|0|0){if((vb(ca|0,4,0)|0)&x|0)tb(v+116|0,0|0,4);if((vb(Z|0,4,0)|0)&x|0){tb(o|0,5|0,4);tb(v+116|0,1|0,4);tb(D>>0|0,(vb(D>>0|0,1,1)|0)&(x^255)|0,1)}}b:do if(!(vb(o|0,4,0)|0)){j=v+116|0;i=vb(j|0,4,0)|0|0;if(!i){m=g+-8|0;tb(n|0,m|0,4);if((m|0)>=1){y=51;break}tb(n|0,0|0,4);break}m=vb(w+5>>0|0,1,0)|0|0;e=m&255;f=vb(w+6>>0|0,1,1)|0|0;do if(m<<24>>24<0){if((i|0)>2){c=g+-1|0;c=c-(c>>8)|0;y=f&31;tb(v+124|0,c|0,4);if((vb(9892+(y<<2)|0,4,0)|0)&(vb(vb(a+1428+(y<<2)|0,4,0)|0|0,4,0)|0)|0){y=51;break b}tb(n|0,c|0,4);y=51;break b}if((i|0)==2){c=g+-1|0;c=c-(c>>8)|0;e=e>>>3&14|16;y=44;break}else{e=e<<1&30|1;f=i;c=((e|0)!=31?32:1024)+g|0;break}}else{c=vb(w+7>>0|0,1,0)|0|0;f=c&255;h=f>>>5;if(c<<24>>24>-1){c=f<<4;e=31;y=44;break}e=f&31;if((h|0)==4){c=g+-32|0;y=44;break}if((c&255)<192){c=g+-1|0;c=c-(c>>8)|0;y=44;break}c=g+32|0;if((h|0)==7){c=(vb(v+124|0,4,0)|0|0)>>>0>1535?g+8|0:c;y=44}else y=44}while(0);if((y|0)==44)if((c>>8|0)==(f>>>5|0)&(i|0)==2){tb(j|0,3|0,4);f=3}else f=i;tb(v+124|0,c|0,4);if(c>>>0>2047){c=(c>>31&-2047)+2047|0;if((f|0)==1)tb(j|0,2|0,4)}if(!((vb(9892+(e<<2)|0,4,0)|0)&(vb(vb(a+1428+(e<<2)|0,4,0)|0|0,4,0)|0))){tb(n|0,c|0,4);y=51}else y=51}else y=51;while(0);if((y|0)==51?(y=0,l=v+100|0,n=vb(l|0,4,0)|0|0,m=(n&16383)+k|0,tb(l|0,((m|0)<32767?m:32767)|0,4),(n|0)>16383):0){e=vb(p|0,4,0)|0|0;f=v+108|0;c=vb(f|0,4,0)|0|0;g=c+e|0;g=(vb(ga+(g&65535)>>0|0,1,1)|0)<<8|(vb(ga+(g+1&65535)>>0|0,1,1)|0);c=c+2|0;if((c|0)>8){if((c|0)!=9){y=54;break a}if(b&1){c=ka+((vb(w+4>>0|0,1,1)|0)<<2|2)|0;c=sh(vb(c>>0|0,1,0)|0|0,vb(c+1>>0|0,1,0)|0|0)|0;if(!(vb(o|0,4,0)|0))tb(D>>0|0,vb(D>>0|0,1,1)|0|x|0,1)}else c=e+9&65535;tb(p|0,c|0,4);c=1}tb(f|0,c|0,4);p=b>>4;o=vb(18616+p>>0|0,1,1)|0|0;p=vb(18616+(p+16)>>0|0,1,1)|0|0;n=v+96|0;m=vb(n|0,4,0)|0|0;l=b&12;j=l>>>0>7;k=(l|0)==8;l=(l|0)==0;h=g;i=0;f=m;g=vb(m+44|0,4,0)|0|0;while(1){b=(h<<16>>16>>o&65535)<<p<<16>>16;c=vb(f+40|0,4,0)|0|0;e=c>>1;do if(j){b=g+b-e|0;if(k){b=((O(g,-3)|0)>>6)+(c>>5)+b|0;break}else{b=b+((O(g,-13)|0)>>7)+(e*3>>4)|0;break}}else b=l?b:(g>>1)+b+(0-g>>5)|0;while(0);g=((b<<16>>16|0)==(b|0)?b:b>>31^32767)<<17>>16;tb(f|0,g|0,4);tb(f+48|0,g|0,4);b=i+1|0;if((b|0)==4)break;else{h=h<<4;i=b;f=m+(b<<2)|0}}p=m+16|0;tb(n|0,(p>>>0<(v+48|0)>>>0?p:v)|0,4)}x=x<<1;if((x|0)>=256)break;else{j=r;k=s;l=t;m=u;c=q;v=v+140|0;w=w+16|0}}b=vb(Y|0,4,0)|0|0;g=ga+(((vb(F>>0|0,1,1)|0)<<8)+b&65535)|0;if(!b){c=((vb(H>>0|0,1,0)|0)&15)<<11;tb(X|0,c|0,4)}else c=vb(X|0,4,0)|0|0;e=b+4|0;tb(Y|0,((e|0)>=(c|0)?0:e)|0,4);e=(sh(vb(g>>0|0,1,0)|0|0,vb(g+1>>0|0,1,0)|0|0)|0)<<16>>16;c=g+2|0;f=(sh(vb(c>>0|0,1,0)|0|0,vb(c+1>>0|0,1,0)|0|0)|0)<<16>>16;b=(vb(W|0,4,0)|0|0)+8|0;b=b>>>0<I>>>0?b:A;tb(W|0,b|0,4);tb(b+64|0,e|0,4);tb(b|0,e|0,4);tb(b+68|0,f|0,4);tb(b+4|0,f|0,4);x=vb(J>>0|0,1,0)|0|0;e=O(x,e)|0;f=O(x,f)|0;x=vb(K>>0|0,1,0)|0|0;e=(O(x,vb(b+8|0,4,0)|0|0)|0)+e|0;f=(O(vb(b+12|0,4,0)|0|0,x)|0)+f|0;x=vb(L>>0|0,1,0)|0|0;e=e+(O(x,vb(b+16|0,4,0)|0|0)|0)|0;x=f+(O(vb(b+20|0,4,0)|0|0,x)|0)|0;f=vb(M>>0|0,1,0)|0|0;e=e+(O(f,vb(b+24|0,4,0)|0|0)|0)|0;f=x+(O(vb(b+28|0,4,0)|0|0,f)|0)|0;x=vb(N>>0|0,1,0)|0|0;e=e+(O(x,vb(b+32|0,4,0)|0|0)|0)|0;x=f+(O(vb(b+36|0,4,0)|0|0,x)|0)|0;f=vb(P>>0|0,1,0)|0|0;e=e+(O(f,vb(b+40|0,4,0)|0|0)|0)|0;f=x+(O(vb(b+44|0,4,0)|0|0,f)|0)|0;x=vb(Q>>0|0,1,0)|0|0;e=e+(O(x,vb(b+48|0,4,0)|0|0)|0)|0;x=f+(O(vb(b+52|0,4,0)|0|0,x)|0)|0;f=vb(R>>0|0,1,0)|0|0;e=e+(O(f,vb(b+56|0,4,0)|0|0)|0)|0;f=x+(O(vb(b+60|0,4,0)|0|0,f)|0)|0;b=vb(ja>>0|0,1,0)|0|0;if(!(b&32)){b=vb(S>>0|0,1,0)|0|0;x=((O(b,e)|0)>>14)+(r>>7)|0;b=((O(b,f)|0)>>14)+(s>>7)|0;th(g,(x<<16>>16|0)==(x|0)?x:x>>31^32767);th(c,(b<<16>>16|0)==(b|0)?b:b>>31^32767);b=vb(ja>>0|0,1,0)|0|0}t=O(t,fa)|0;t=(O(vb(T>>0|0,1,0)|0|0,e)|0)+t|0;s=t>>14;x=O(u,la)|0;x=(O(vb(U>>0|0,1,0)|0|0,f)|0)+x|0;w=x>>14;v=(b&64)==0;b=vb(aa|0,4,0)|0|0;tb(b|0,(v?((s<<16>>16|0)==(s|0)?s:t>>31^32767)&65535:0)|0,2);tb(b+2|0,(v?((w<<16>>16|0)==(w|0)?w:x>>31^32767)&65535:0)|0,2);b=b+4|0;if(b>>>0>=(vb(ba|0,4,0)|0|0)>>>0){tb(ba|0,V|0,4);b=B}tb(aa|0,b|0,4);d=d+-1|0;if(!d){y=76;break}}if((y|0)==54)Aa(18568,18597,471,18842);else if((y|0)==76)return}function ak(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=vb(a+2016|0,4,0)|0|0;c=vb(a+1568|0,4,0)|0|0;g=bk(c)|0;e=vb(a+2012|0,4,0)|0|0;if(g>>>0>b>>>0|e>>>0>g>>>0){g=c;c=b}else g=ck(a)|0;b=a+2024|0;d=dk(vb(a+2008|0,4,0)|0|0)|0;f=e+(d<<1)|0;if(f>>>0<c>>>0){e=c+(0-d<<1)+~e+2026&-2;d=f;while(1){tb(b|0,vb(d|0,2,0)|0|0|0,2);d=d+2|0;if(d>>>0>=c>>>0)break;else b=b+2|0}b=a+e|0}c=ck(a)|0;if(c>>>0<g>>>0){e=(g+~c|0)>>>1;d=b;while(1){tb(d|0,vb(c|0,2,0)|0|0|0,2);c=c+2|0;if(c>>>0>=g>>>0)break;else d=d+2|0}b=b+(e+1<<1)|0}tb(a+2020|0,b|0,4);if(b>>>0>(a+2056|0)>>>0)Aa(18524,18363,334,18557);else return}function bk(a){a=a|0;return a|0}function ck(a){a=a|0;return a+1580|0}function dk(a){a=a|0;return a>>5<<1|0}function ek(a,b){a=a|0;b=b|0;var c=0;c=a+284+(b<<2)|0;a=vb(c|0,4,0)|0|0;tb(c|0,a+-1+((a&7|0)==0?b+-6|0:0)|0,4);return}function fk(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;f=vb(a|0,4,0)|0|0;d=vb(a+4|0,4,0)|0|0;b=(b-f|0)/(d|0)|0;e=b+1|0;tb(a|0,(O(e,d)|0)+f|0,4);if(!(vb(a+16|0,4,0)|0))return a|0;c=vb(a+8|0,4,0)|0|0;f=a+12|0;d=vb(f|0,4,0)|0|0;b=b-(c+255-d&255)|0;if((b|0)>-1){e=(b|0)/(c|0)|0;d=a+20|0;tb(d|0,e+1+(vb(d|0,4,0)|0|0)&15|0,4);b=b-(O(e,c)|0)|0}else b=d+e|0;tb(f|0,b&255|0,4);return a|0}function gk(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=b+-2|0;if(d>>>0>=2){c=vb(a+1956+b>>0|0,1,1)|0|0;return c|0}if((d|0)!=1){c=vb(a+1942>>0|0,1,1)|0|0;return c|0}c=pk(a,c)|0;return c|0}function hk(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if(d<<16>>16==3){ik(a,b,c);return}else{jk(a,b,c,d);return}}function ik(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;f=a+1942|0;d=vb(f>>0|0,1,0)|0|0;g=a+1980|0;e=vb(g|0,4,0)|0|0;c=c-(vb((d&255)+(a+1612)>>0|0,1,0)|0|0)-e|0;a:do if((c|0)<=-1){if((e|0)==127)switch(d<<24>>24){case 76:{g=a+1996|0;tb(g|0,~(Xj(a,92)|0)&b|(vb(g|0,4,0)|0)|0,4);break a}case 92:{g=a+2e3|0;tb(g|0,vb(g|0,4,0)|0|b|0,4);g=a+1996|0;tb(g|0,(vb(g|0,4,0)|0)&~b|0,4);break a}default:break a}}else{d=c+32&-32;tb(g|0,d+e|0,4);$j(a,d)}while(0);c=vb(f>>0|0,1,0)|0|0;if(c<<24>>24<=-1)return;Uj(a,c&255,b);return}function jk(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;e=d&65535;switch(d<<16>>16){case 12:case 11:case 10:{e=e+-10|0;d=(b+255&255)+1|0;if((vb(a+1868+(e*24|0)+8|0,4,0)|0|0)==(d|0))return;tb((_j(a+1868+(e*24|0)|0,c)|0)+8|0,d|0,4);return}case 15:case 14:case 13:{if((b|0)>=4096)return;tb((_j(a+1868+((e+-13|0)*24|0)|0,c+-1|0)|0)+20|0,0|0,4);return}case 9:case 8:{tb(a+1956+e>>0|0,b|0,1);return}case 1:{if(b&16|0){tb(a+1960>>0|0,0|0,1);tb(a+1961>>0|0,0|0,1)}if(b&32|0){tb(a+1962>>0|0,0|0,1);tb(a+1963>>0|0,0|0,1)}d=b&1;if((vb(a+1884|0,4,0)|0|0)!=(d|0)?(f=_j(a+1868|0,c)|0,tb(f+16|0,d|0,4),d|0):0){tb(f+12|0,0|0,4);tb(f+20|0,0|0,4)}d=b>>>1&1;if((vb(a+1908|0,4,0)|0|0)!=(d|0)?(g=_j(a+1892|0,c)|0,tb(g+16|0,d|0,4),d|0):0){tb(g+12|0,0|0,4);tb(g+20|0,0|0,4)}d=b>>>2&1;if((vb(a+1932|0,4,0)|0|0)!=(d|0)?(h=_j(a+1916|0,c)|0,tb(h+16|0,d|0,4),d|0):0){tb(h+12|0,0|0,4);tb(h+20|0,0|0,4)}ok(a,b&128);return}default:return}}function kk(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0;g=b&65535;h=g+-240|0;e=(h|0)>-1&(g+-256|0)>>>0>65279;f=g+-253|0;d=f>>>0<3;b=(b&65535)<253;while(1){if(!e){b=9;break}if(d){b=4;break}if(b){b=8;break}}if((b|0)==4){b=a+1868+(f*24|0)|0;if((vb(b|0,4,0)|0|0)<=(c|0))fk(b,c)|0;a=b+20|0;c=vb(a|0,4,0)|0|0;tb(a|0,0|0,4);return c|0}else if((b|0)==8){c=gk(a,h,c)|0;return c|0}else if((b|0)==9){c=vb(a+2700+g>>0|0,1,1)|0|0;return c|0}return 0}function lk(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b&255;h=c&65535;tb(a+2700+h>>0|0,e|0,1);if((c&65535)<=239)return;i=h+65296|0;f=i&65535;g=i&65535;if(g>>>0<16){tb(a+1940+g>>0|0,e|0,1);if((g|0)==2|(i&65532|0)==4)return;hk(a,b,d,f);return}else{if((c&65535)<=65471)return;nk(a,b,h+64&255);return}}function mk(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=b&65535;b=vb((d+1&65535)+(a+2700)>>0|0,1,1)|0|0;return (kk(a,(b<<8&7936|(vb(a+2700+d>>0|0,1,1)|0|0))&65535,c)|0)>>>(b>>>5)<<8&256|0}function nk(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=c&255;if((c&255)>=64)Aa(18733,18495,398,18746);tb(a+2124+d>>0|0,b|0,1);if(!(vb(a+2056|0,4,0)|0))return;tb(d+65472+(a+2700)>>0|0,vb(a+2060+d>>0|0,1,0)|0|0|0,1);return}function ok(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a+2056|0;if((vb(c|0,4,0)|0|0)==(b|0))return;tb(c|0,b|0,4);c=(b|0)!=0;b=a+68172|0;if(c){d=a+2124|0;e=b;f=d+64|0;do{tb(d|0,vb(e|0,4,0)|0|0,4);d=d+4|0;e=e+4|0}while((d|0)<(f|0))}d=b;e=c?a+2060|0:a+2124|0;f=d+64|0;do{tb(d|0,vb(e|0,4,0)|0|0,4);d=d+4|0;e=e+4|0}while((d|0)<(f|0));return}function pk(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0;e=a+1942|0;c=vb(e>>0|0,1,0)|0|0;f=a+1980|0;d=vb(f|0,4,0)|0|0;g=b-(vb((c&127)+(a+1612)>>0|0,1,0)|0|0)-d|0;b=g+32&-32;if((g|0)<=-1){g=c;g=g&127;g=g&255;g=Xj(a,g)|0;return g|0}tb(f|0,b+d|0,4);$j(a,b);g=vb(e>>0|0,1,0)|0|0;g=g&127;g=g&255;g=Xj(a,g)|0;return g|0}function qk(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if(!(c&1)){d=(b|0)==0;b=d?a+1580|0:b;tb(a+1576|0,b|0,4);tb(a+1568|0,b|0,4);tb(a+1572|0,b+((d?16:c)<<1)|0,4);return}else Aa(18776,18597,78,18792)}function rk(a){a=a|0;var b=0,c=0;c=a+2040|0;b=a+2026|0;b=(c>>>0>b>>>0?c:b)+(-2025-a)&-2;On(a+2024|0,0,b+2|0)|0;tb(a+2020|0,a+(b+2026)|0,4);tb(a+2012|0,0|0,4);qk(a,0,0);return}function sk(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=vb(a|0,4,0)|0|0;o=ec(f)|0;s=a+8|0;e=vb(s|0,4,0)|0|0;p=a+28|0;t=a+16|0;i=vb(t|0,4,0)|0|0;r=a+12|0;h=vb(r|0,4,0)|0|0;d=h-i|0;q=vb(a+32|0,4,0)|0|0;g=e;if((g-o|0)>94){n=e+-96|0;o=a+52|0;m=c>>1;l=a+52+(i*48|0)|0;e=b;i=(vb(p|0,4,0)|0|0)>>>i;while(1){if((m|0)<1)break;else{g=f;h=l;j=0;c=12;k=0}m=m+-1|0;while(1){v=vb(h|0,2,0)|0|0;w=(O(vb(g|0,2,0)|0|0,v)|0)+j|0;v=(O(vb(g+2|0,2,0)|0|0,v)|0)+k|0;u=vb(h+2|0,2,0)|0|0;j=w+(O(vb(g+4|0,2,0)|0|0,u)|0)|0;k=v+(O(vb(g+6|0,2,0)|0|0,u)|0)|0;c=c+-1|0;if(!c)break;else{g=g+8|0;h=h+4|0}}d=d+-1|0;f=f+((i<<1&2)<<1)+(q<<1)|0;if(!d){g=o;d=vb(r|0,4,0)|0|0;h=vb(p|0,4,0)|0|0}else{g=l+48|0;h=i>>>1}tb(e|0,j>>>15|0,2);tb(e+2|0,k>>>15|0,2);e=e+4|0;if(f>>>0>n>>>0)break;else{l=g;i=h}}h=vb(r|0,4,0)|0|0;g=vb(s|0,4,0)|0|0}else e=b;tb(t|0,h-d|0,4);w=g-f|0;tb(s|0,lf(a,w>>1)|0|0,4);v=vb(a|0,4,0)|0|0;ec(v)|0;Nn(v|0,f|0,w|0)|0;return e-b>>1|0}function tk(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=Wj(a+1956|0,b,c)|0;if(d|0){a=d;return a|0}vk(a+1920|0,c,b);a=0;return a|0}function uk(a){a=a|0;var b=0;b=yf(vb(a|0,4,0)|0|0,vb(a+4|0,4,0)|0|0)|0;return b-(vb(a+8|0,4,0)|0|0)>>1|0}function vk(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if(c&1|0)Aa(18803,18820,32,18842);o=vb(a|0,4,0)|0|0;if(!(vb(a+8>>0|0,1,0)|0)){if((o|0)==256)return;d=b+(c<<1)|0;if((c|0)<=0)return;do{c=O(vb(b|0,2,0)|0|0,o)|0;n=c>>8;tb(b|0,((n<<16>>16|0)==(n|0)?n:c>>31^32767)|0,2);b=b+2|0}while(b>>>0<d>>>0);return}else{n=vb(a+4|0,4,0)|0|0;m=(c|0)>0;l=a+32|0;d=vb(l|0,4,0)|0|0;k=a+28|0;f=vb(k|0,4,0)|0|0;j=a+24|0;e=vb(j|0,4,0)|0|0;if(m){i=0;while(1){q=b+(i<<1)|0;p=vb(q|0,2,0)|0|0;g=p+e|0;e=p*3|0;p=d>>10;h=d-(d>>n)+(O(g-f|0,o)|0)|0;tb(q|0,((p<<16>>16|0)==(p|0)?p:d>>31^32767)|0,2);i=i+2|0;if((i|0)>=(c|0)){f=g;d=h;break}else{f=g;d=h}}}tb(j|0,e|0,4);tb(k|0,f|0,4);tb(l|0,d|0,4);i=b+2|0;l=a+20|0;b=vb(l|0,4,0)|0|0;k=a+16|0;d=vb(k|0,4,0)|0|0;j=a+12|0;e=vb(j|0,4,0)|0|0;if(m){h=0;while(1){p=i+(h<<1)|0;q=vb(p|0,2,0)|0|0;f=q+e|0;e=q*3|0;q=b>>10;g=b-(b>>n)+(O(f-d|0,o)|0)|0;tb(p|0,((q<<16>>16|0)==(q|0)?q:b>>31^32767)|0,2);h=h+2|0;if((h|0)>=(c|0)){d=f;b=g;break}else{d=f;b=g}}}tb(j|0,e|0,4);tb(k|0,d|0,4);tb(l|0,b|0,4);return}}function wk(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<35){a=18846;return a|0}if(Ol(b,18071,27)|0){a=18846;return a|0}if((c|0)<65920){a=18862;return a|0}tb(a+1972|0,(vb(b+38>>0|0,1,1)|0|0)<<8|(vb(b+37>>0|0,1,1)|0|0)|0,2);tb(a+1974>>0|0,vb(b+39>>0|0,1,0)|0|0|0,1);tb(a+1975>>0|0,vb(b+40>>0|0,1,0)|0|0|0,1);tb(a+1976>>0|0,vb(b+41>>0|0,1,0)|0|0|0,1);tb(a+1977>>0|0,vb(b+42>>0|0,1,0)|0|0|0,1);tb(a+1978>>0|0,vb(b+43>>0|0,1,0)|0|0|0,1);Mn(a+2700|0,b+256|0,65536)|0;yk(a);zk(a,b+65792|0);Ak(a);a=0;return a|0}function xk(a,b){a=a|0;b=b|0;tb(a|0,b|0,4);return}function yk(a){a=a|0;tb(a+2056|0,0|0,4);Hk(a,a+2940|0);On(a+2444|0,-1,256)|0;On(a+68236|0,-1,256)|0;return}function zk(a,b){a=a|0;b=b|0;var c=0,d=0;d=a;c=d+128|0;do{tb(d>>0|0,vb(b>>0|0,1,0)|0|0|0,1);d=d+1|0;b=b+1|0}while((d|0)<(c|0));On(a+128|0,0,1428)|0;tb(a+1396|0,1|0,4);tb(a+1384|0,a+1288|0,4);tb(a+1256|0,1|0,4);tb(a+1244|0,a+1148|0,4);tb(a+1116|0,1|0,4);tb(a+1104|0,a+1008|0,4);tb(a+976|0,1|0,4);tb(a+964|0,a+868|0,4);tb(a+836|0,1|0,4);tb(a+824|0,a+728|0,4);tb(a+696|0,1|0,4);tb(a+684|0,a+588|0,4);tb(a+556|0,1|0,4);tb(a+544|0,a+448|0,4);tb(a+416|0,1|0,4);tb(a+404|0,a+308|0,4);tb(a+300|0,vb(a+76>>0|0,1,1)|0|0,4);Ek(a,vb(a+1560|0,4,0)|0|0);Fk(a);return}function Ak(a){a=a|0;tb(a+2004|0,0|0,4);tb(a+1988>>0|0,0|0,1);tb(a+1984|0,0|0,4);tb(a+1980|0,33|0,4);tb(a+1868|0,1|0,4);tb(a+1880|0,0|0,4);tb(a+1892|0,1|0,4);tb(a+1904|0,0|0,4);tb(a+1916|0,1|0,4);tb(a+1928|0,0|0,4);Bk(a);tb(a+2008|0,0|0,4);rk(a);return}function Bk(a){a=a|0;ok(a,(vb(a+1941>>0|0,1,0)|0)&-128&255);Ck(a);return}function Ck(a){a=a|0;var b=0;tb(a+1876|0,((vb(a+1950>>0|0,1,1)|0|0)+255&255)+1|0,4);b=vb(a+1941>>0|0,1,1)|0|0;tb(a+1884|0,b&1|0,4);tb(a+1888|0,(vb(a+1969>>0|0,1,0)|0)&15|0,4);tb(a+1900|0,((vb(a+1951>>0|0,1,1)|0|0)+255&255)+1|0,4);tb(a+1908|0,b>>>1&1|0,4);tb(a+1912|0,(vb(a+1970>>0|0,1,0)|0)&15|0,4);tb(a+1924|0,((vb(a+1952>>0|0,1,1)|0|0)+255&255)+1|0,4);tb(a+1932|0,b>>>2&1|0,4);tb(a+1936|0,(vb(a+1971>>0|0,1,0)|0)&15|0,4);Dk(a,vb(a+1992|0,4,0)|0|0);return}function Dk(a,b){a=a|0;b=b|0;tb(a+1992|0,b|0,4);b=(b|0)==0?1:b;b=((b>>1)+4096|0)/(b|0)|0;b=(b|0)>4?b:4;tb(a+1920|0,b|0,4);b=b<<3;tb(a+1896|0,b|0,4);tb(a+1872|0,b|0,4);return}function Ek(a,b){a=a|0;b=b|0;tb(a+1560|0,b|0,4);tb(a+444|0,(b&1)+-1|0,4);Yj(a,0);tb(a+584|0,(b>>>1&1)+-1|0,4);Yj(a,16);tb(a+724|0,(b>>>2&1)+-1|0,4);Yj(a,32);tb(a+864|0,(b>>>3&1)+-1|0,4);Yj(a,48);tb(a+1004|0,(b>>>4&1)+-1|0,4);Yj(a,64);tb(a+1144|0,(b>>>5&1)+-1|0,4);Yj(a,80);tb(a+1284|0,(b>>>6&1)+-1|0,4);Yj(a,96);tb(a+1424|0,(b>>>7&1)+-1|0,4);Yj(a,112);return}function Fk(a){a=a|0;if(!(vb(a+1556|0,4,0)|0))Aa(18879,18597,668,18885);else{tb(a+268|0,16384|0,4);tb(a+256|0,a+128|0,4);tb(a+260|0,1|0,4);tb(a+272|0,0|0,4);tb(a+280|0,0|0,4);Gk(a);return}}function Gk(a){a=a|0;var b=0,c=0,d=0,e=0;c=a+284|0;tb(c|0,1|0,4);tb(a+288|0,0|0,4);d=a+292|0;tb(d|0,-32|0,4);tb(a+296|0,11|0,4);e=1;b=2;while(1){tb(a+1428+(e<<2)|0,a+284+(b<<2)|0,4);b=b+-1|0;e=e+1|0;if((e|0)==32)break;else b=b|0?b:3}tb(a+1428|0,c|0,4);tb(a+1548|0,d|0,4);return}function Hk(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=a+1940|0;d=b;e=c+16|0;do{tb(c>>0|0,vb(d>>0|0,1,0)|0|0|0,1);c=c+1|0;d=d+1|0}while((c|0)<(e|0));e=a+1956|0;Nn(e|0,b|0,16)|0;tb(e>>0|0,0|0,1);tb(a+1957>>0|0,0|0,1);tb(a+1966>>0|0,0|0,1);tb(a+1967>>0|0,0|0,1);tb(a+1968>>0|0,0|0,1);return}function Ik(a,b){a=a|0;b=b|0;Ek(a,b);return}function Jk(a,b){a=a|0;b=b|0;tb(a+8>>0|0,b&1|0,1);return}function Kk(a){a=a|0;var b=0,c=0,d=0;On(a+1868|0,0,66624)|0;Lk(a,a+2700|0);tb(a+1992|0,256|0,4);tb(a+2122>>0|0,-1|0,1);tb(a+2123>>0|0,-64|0,1);b=0;do{c=vb(18903+b>>0|0,1,0)|0|0;d=b<<1;tb(a+2188+d>>0|0,(c&255)>>>4|0,1);tb((d|1)+(a+2188)>>0|0,c&15|0,1);b=b+1|0}while((b|0)!=128);Mn(a+1612|0,18107,256)|0;Mk(a);return}function Lk(a,b){a=a|0;b=b|0;tb(a+1556|0,b|0,4);Ek(a,0);Pk(a);qk(a,0,0);Ok(a);Ve();return}function Mk(a){a=a|0;On(a+2700|0,-1,65536)|0;yk(a);Nk(a);Ok(a);return}function Nk(a){a=a|0;var b=0,c=0;b=a+1969|0;tb(b>>0|0,15|0,1);tb(b+1>>0|0,15|0,1);tb(b+2>>0|0,15|0,1);b=a+1972|0;c=b;tb(c|0,0|0,4);tb(c+4|0,0|0,4);tb(b|0,-64|0,2);tb(a+1940>>0|0,10|0,1);tb(a+1941>>0|0,-80|0,1);b=a+1960|0;tb(b>>0|0,0|0,1);tb(b+1>>0|0,0|0,1);tb(b+2>>0|0,0|0,1);tb(b+3>>0|0,0|0,1);Ak(a);return}function Ok(a){a=a|0;zk(a,19031);return}function Pk(a){a=a|0;tb(a+1564|0,-16384|0,4);return}function Qk(a){a=a|0;return vb(a+320|0,4,0)|0|0}function Rk(a,b){a=a|0;b=b|0;return a+(Xk(b)|0)|0}function Sk(a){a=a|0;return Wk(a+-66048|0)|0}function Tk(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;g=vb(a+169>>0|0,1,0)|0|0;e=(g&255)+-48|0;h=vb(a+170>>0|0,1,0)|0|0;do if(e>>>0<=9){f=(h&255)+-48|0;if(f>>>0>9){if(vb(a+176>>0|0,1,0)|0|0){i=6;break}if(!(vb(a+177>>0|0,1,0)|0)){i=6;break}}else{e=f+(e*10|0)|0;f=(vb(a+171>>0|0,1,1)|0|0)+-48|0;if(f>>>0<=9)e=f+(e*10|0)|0}if((e|0)==0|(e|0)>8191)i=6}else i=6;while(0);if((i|0)==6)e=sh(g,h)|0;if((e|0)<8191)tb(d+4|0,e*1e3|0,4);i=vb(a+176>>0|0,1,0)|0|0;i=(i<<24>>24<32|((i<<24>>24)+-48|0)>>>0<10)&1;xg(d+784|0,a+176+i|0,32-i|0);xg(d+528|0,a+46|0,32);xg(d+272|0,a+78|0,32);xg(d+1552|0,a+110|0,16);xg(d+1296|0,a+126|0,32);if(!c)return;Uk(b,c,d);return}function Uk(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;u=l;l=l+272|0;if((l|0)>=(m|0))X(272);t=u;d=a+b|0;if((b|0)<8){l=u;return}if(Ol(a,19159,4)|0){l=u;return}q=af(a+4|0)|0;e=a+8|0;p=e;q=(d-p|0)>(q|0)?e+q|0:d;r=q;if((r-p|0)>3){p=a;i=c+528|0;j=c+272|0;k=c+784|0;n=c+1552|0;o=c+1296|0;b=t+5|0;d=0;a=0;do{f=(vb(e+3>>0|0,1,1)|0)<<8|(vb(e+2>>0|0,1,1)|0);h=vb(e+1>>0|0,1,0)|0|0?f:0;g=e+4|0;if((h|0)>(r-g|0))break;switch(vb(e>>0|0,1,0)|0|0){case 1:{e=i;s=14;break}case 2:{e=j;s=14;break}case 3:{e=k;s=14;break}case 4:{e=n;s=14;break}case 7:{e=o;s=14;break}case 20:{a=f;break}case 19:{d=Vk(h)|0;Mn(b|0,g|0,d|0)|0;break}default:{}}if((s|0)==14){s=0;xg(e,g,h)}e=g+h|0;f=e;while(1){if(!(f>>>0<q>>>0&(f-p&3|0)!=0)){e=f;break}if(!(vb(f>>0|0,1,0)|0))f=f+1|0;else break}}while((r-e|0)>3);if(a){tb(t+4>>0|0,32|0,1);tb(t+3>>0|0,((a|0)%10|0)+48|0,1);tb(t+2>>0|0,(((a|0)/10|0|0)%10|0)+48|0,1);tb(t+1>>0|0,(((a|0)/100|0|0)%10|0)+48|0,1);tb(t>>0|0,(((a|0)/1e3|0|0)%10|0)+48|0,1);d=d+5|0;b=t}if(d|0)xg(c+1040|0,b,d)}l=u;return}function Vk(a){a=a|0;return ((a|0)<256?a:256)|0}function Wk(a){a=a|0;return ((a|0)>0?a:0)|0}function Xk(a){a=a|0;return ((a|0)<66048?a:66048)|0}function Yk(a){a=a|0;a=(Ol(a,19164,27)|0)==0;return (a?0:15595)|0}function Zk(){var a=0,b=0;a=Oh(70448)|0;if(!a){a=0;return a|0}o=0;sa(63,a|0);b=o;o=0;if(b&1){b=Fa()|0;Ad(a);Ma(b|0)}else{b=a;return b|0}return 0}function _k(){var a=0,b=0;a=Oh(584)|0;if(!a){a=0;return a|0}o=0;sa(64,a|0);b=o;o=0;if(b&1){b=Fa()|0;Ad(a);Ma(b|0)}else{b=a;return b|0}return 0}function $k(a){a=a|0;Qh(a);tb(a|0,10052|0,4);Ue(a+576|0);Rh(a,10020);return}function al(a){a=a|0;tb(a|0,10052|0,4);Ed(vb(a+576|0,4,0)|0|0);Bd(a);return}function bl(a){a=a|0;al(a);Ad(a);return}function cl(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;e=bb[(xb(vb((vb(b|0,4,0)|0|0)+16|0,4,0)|0|0,15|0)|0)&15](b)|0;if((e|0)<65920){a=15595;return a|0}c=a+320|0;d=db[(xb(vb((vb(b|0,4,0)|0|0)+12|0,4,0)|0|0,31|0)|0)&31](b,c,256)|0;if(d|0){a=d;return a|0}c=Yk(c)|0;if(c|0){a=c;return a|0}if((e|0)>66048){d=a+576|0;c=qd(d,e+-66048|0)|0;if(c|0){a=c;return a|0}c=cb[(xb(vb((vb(b|0,4,0)|0|0)+20|0,4,0)|0|0,31|0)|0)&31](b,65792)|0;if(c|0){a=c;return a|0}f=vb((vb(b|0,4,0)|0|0)+12|0,4,0)|0|0;e=Zc(vb(d|0,4,0)|0|0)|0;c=rd(vb(a+580|0,4,0)|0|0)|0;c=db[(xb(f|0,31|0)|0)&31](b,e,c)|0;if(c|0){f=c;return f|0}}f=0;return f|0}function dl(a,b,c){a=a|0;b=b|0;c=c|0;c=Zc(vb(a+576|0,4,0)|0|0)|0;Tk(a+320|0,c,rd(vb(a+580|0,4,0)|0|0)|0,b);return 0}function el(a){a=a|0;var b=0,c=0;Pe(a);tb(a|0,9816|0,4);b=a+328|0;fl(b);hl(a+1920|0);Rh(a,10020);Se(a,10128);o=0;sa(65,a|0);c=o;o=0;if(c&1){c=Fa()|0;Qd(b);Bd(a);Ma(c|0)}else return}function fl(a){a=a|0;df(a,24,a+52|0);return}function gl(a){a=a|0;if(!(fc(vb(a+260|0,4,0)|0|0)|0)){ub(a+248|0,+(1.4),8);return}else Aa(19230,19245,240,19264)}function hl(a){a=a|0;tb(a+8>>0|0,1|0,1);tb(a|0,256|0,4);tb(a+4|0,8|0,4);Rj(a);return}function il(){return xl()|0}function jl(){return 23104}function kl(){return vb(5626*4|0,4,0)|0|0}function ll(){var a=0;a=vb(5627*4|0,4,0)|0|0;return Rg(vb(a+256>>0|0,1,0)|0|0,vb(a+260|0,4,0)|0|0,vb(a+268|0,4,0)|0|0)|0}function ml(){return vb(vb(5628*4|0,4,0)|0|0,4,0)|0|0}function nl(){return 44100}function ol(){return 10160}function pl(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;f=l;l=l+16|0;if((l|0)>=(m|0))X(16);e=f;sl();if(Ol(b,19335,4)|0){e=c;b=_f(b,e)|0;b=vl(b)|0;b=(b|0)!=0;b=b&1;l=f;return b|0}d=wl(b+424|0)|0;tb(e|0,d|0,4);if(!d)a=b;else{a=vb(5629*4|0,4,0)|0|0;if(a|0)Al(a);d=zl(d+428|0)|0;tb(5629*4|0,d|0,4);Mn(d|0,b|0,424)|0;a=d+424|0;tb(a>>0|0,0|0,1);tb(a+1>>0|0,0|0,1);tb(a+2>>0|0,0|0,1);tb(a+3>>0|0,0|0,1);if(Db(d+428|0,e,b+428|0,c+-428|0)|0)sm();c=(vb(e|0,4,0)|0|0)+428|0;a=vb(5629*4|0,4,0)|0|0}b=c;e=a;b=_f(e,b)|0;b=vl(b)|0;b=(b|0)!=0;b=b&1;l=f;return b|0}function ql(a){a=a|0;Tg(vb(5627*4|0,4,0)|0|0,a);return}function rl(a,b){a=a|0;b=b|0;b=(a|0)>0?a:0;a=tl()|0;return ul((b|0)<(a|0)?b:a+-1|0)|0}function sl(){tb(28736|0,0|0,1);tb(28481|0,0|0,1);tb(28226|0,0|0,1);tb(27971|0,0|0,1);tb(27716|0,0|0,1);tb(27461|0,0|0,1);tb(27206|0,0|0,1);og(vb(5628*4|0,4,0)|0|0);tb(5628*4|0,0|0,4);jg(vb(5627*4|0,4,0)|0|0);tb(5627*4|0,0|0,4);return}function tl(){var a=0;a=vb(5627*4|0,4,0)|0|0;if(!a){a=1;return a|0}a=kg(a)|0;return a|0}function ul(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;j=l;l=l+64|0;if((l|0)>=(m|0))X(64);g=j+48|0;f=j+40|0;e=j+32|0;i=j+24|0;h=j+16|0;d=j+8|0;c=j;b=vb(5628*4|0,4,0)|0|0;if(b|0)og(b);if(vl(lg(vb(5627*4|0,4,0)|0|0,a)|0)|0){i=1;l=j;return i|0}if(vl(yg(vb(5627*4|0,4,0)|0|0,a)|0)|0){i=1;l=j;return i|0}a=vb(5628*4|0,4,0)|0|0;b=vb(a|0,4,0)|0|0;if((b|0)<1){b=((vb(a+8|0,4,0)|0)<<1)+(vb(a+4|0,4,0)|0|0)|0;k=(b|0)<1;tb(a|0,(k?15e4:b)|0,4);b=k?15e4:b}Ng(vb(5627*4|0,4,0)|0|0,b);tb(c|0,vb((vb(5628*4|0,4,0)|0|0)+72|0,4,0)|0|0,4);qm(27206,0,0,c);tb(d|0,vb((vb(5628*4|0,4,0)|0|0)+76|0,4,0)|0|0,4);qm(27461,0,0,d);tb(h|0,vb((vb(5628*4|0,4,0)|0|0)+68|0,4,0)|0|0,4);qm(27716,0,0,h);tb(i|0,vb((vb(5628*4|0,4,0)|0|0)+84|0,4,0)|0|0,4);qm(27971,0,0,i);tb(e|0,vb((vb(5628*4|0,4,0)|0|0)+80|0,4,0)|0|0,4);qm(28226,0,0,e);tb(f|0,vb((vb(5628*4|0,4,0)|0|0)+88|0,4,0)|0|0,4);qm(28481,0,0,f);tb(g|0,vb((vb(5628*4|0,4,0)|0|0)+64|0,4,0)|0|0,4);qm(28736,0,0,g);k=0;l=j;return k|0}function vl(a){a=a|0;var b=0,c=0;c=l;l=l+16|0;if((l|0)>=(m|0))X(16);b=c;if(a|0){tb(b|0,a|0,4);ym(0,0,b)}l=c;return a|0}function wl(a){a=a|0;return (vb(a+1>>0|0,1,1)|0|0)<<8|(vb(a>>0|0,1,1)|0|0)|(vb(a+2>>0|0,1,1)|0|0)<<16|(vb(a+3>>0|0,1,1)|0|0)<<24|0}function xl(){var a=0;Hg(vb(5627*4|0,4,0)|0|0);vl(0)|0;a=yl()|0;tb(5626*4|0,(a?0:512)|0,4);return a&1|0}function yl(){var a=0;a=vb(5627*4|0,4,0)|0|0;if(!a){a=0;return a|0}a=(Qg(a)|0)!=0;return a|0}function zl(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;x=l;l=l+16|0;if((l|0)>=(m|0))X(16);o=x;do if(a>>>0<245){j=a>>>0<11?16:a+11&-8;a=j>>>3;n=vb(5630*4|0,4,0)|0|0;c=n>>>a;if(c&3|0){d=(c&1^1)+a|0;e=22560+(d<<1<<2)|0;b=e+8|0;a=vb(b|0,4,0)|0|0;f=a+8|0;c=vb(f|0,4,0)|0|0;if((e|0)==(c|0))tb(5630*4|0,n&~(1<<d)|0,4);else{tb(c+12|0,e|0,4);tb(b|0,c|0,4)}w=d<<3;tb(a+4|0,w|3|0,4);w=a+w+4|0;tb(w|0,vb(w|0,4,0)|0|1|0,4);w=f;l=x;return w|0}k=vb(5632*4|0,4,0)|0|0;if(j>>>0>k>>>0){if(c|0){g=2<<a;c=c<<a&(g|0-g);c=(c&0-c)+-1|0;g=c>>>12&16;c=c>>>g;a=c>>>5&8;c=c>>>a;e=c>>>2&4;c=c>>>e;b=c>>>1&2;c=c>>>b;d=c>>>1&1;d=(a|g|e|b|d)+(c>>>d)|0;c=22560+(d<<1<<2)|0;b=c+8|0;e=vb(b|0,4,0)|0|0;g=e+8|0;a=vb(g|0,4,0)|0|0;if((c|0)==(a|0)){a=n&~(1<<d);tb(5630*4|0,a|0,4)}else{tb(a+12|0,c|0,4);tb(b|0,a|0,4);a=n}f=(d<<3)-j|0;tb(e+4|0,j|3|0,4);e=e+j|0;tb(e+4|0,f|1|0,4);tb(e+f|0,f|0,4);if(k|0){d=vb(5635*4|0,4,0)|0|0;b=k>>>3;c=22560+(b<<1<<2)|0;b=1<<b;if(!(a&b)){tb(5630*4|0,a|b|0,4);b=c+8|0;a=c}else{a=c+8|0;b=a;a=vb(a|0,4,0)|0|0}tb(b|0,d|0,4);tb(a+12|0,d|0,4);tb(d+8|0,a|0,4);tb(d+12|0,c|0,4)}tb(5632*4|0,f|0,4);tb(5635*4|0,e|0,4);w=g;l=x;return w|0}h=vb(5631*4|0,4,0)|0|0;if(h){c=(h&0-h)+-1|0;g=c>>>12&16;c=c>>>g;f=c>>>5&8;c=c>>>f;i=c>>>2&4;c=c>>>i;a=c>>>1&2;c=c>>>a;d=c>>>1&1;d=vb(22824+((f|g|i|a|d)+(c>>>d)<<2)|0,4,0)|0|0;c=((vb(d+4|0,4,0)|0)&-8)-j|0;a=vb(d+16+(((vb(d+16|0,4,0)|0|0)==0&1)<<2)|0,4,0)|0|0;if(!a){i=c;g=d}else{do{g=((vb(a+4|0,4,0)|0)&-8)-j|0;i=g>>>0<c>>>0;c=i?g:c;d=i?a:d;a=vb(a+16+(((vb(a+16|0,4,0)|0|0)==0&1)<<2)|0,4,0)|0|0}while((a|0)!=0);i=c;g=d}f=g+j|0;if(g>>>0<f>>>0){e=vb(g+24|0,4,0)|0|0;b=vb(g+12|0,4,0)|0|0;do if((b|0)==(g|0)){a=g+20|0;b=vb(a|0,4,0)|0|0;if(!b){a=g+16|0;b=vb(a|0,4,0)|0|0;if(!b){c=0;break}}while(1){d=b+20|0;c=vb(d|0,4,0)|0|0;if(c|0){b=c;a=d;continue}d=b+16|0;c=vb(d|0,4,0)|0|0;if(!c)break;else{b=c;a=d}}tb(a|0,0|0,4);c=b}else{c=vb(g+8|0,4,0)|0|0;tb(c+12|0,b|0,4);tb(b+8|0,c|0,4);c=b}while(0);do if(e|0){b=vb(g+28|0,4,0)|0|0;a=22824+(b<<2)|0;if((g|0)==(vb(a|0,4,0)|0|0)){tb(a|0,c|0,4);if(!c){tb(5631*4|0,h&~(1<<b)|0,4);break}}else{tb(e+16+(((vb(e+16|0,4,0)|0|0)!=(g|0)&1)<<2)|0,c|0,4);if(!c)break}tb(c+24|0,e|0,4);b=vb(g+16|0,4,0)|0|0;if(b|0){tb(c+16|0,b|0,4);tb(b+24|0,c|0,4)}b=vb(g+20|0,4,0)|0|0;if(b|0){tb(c+20|0,b|0,4);tb(b+24|0,c|0,4)}}while(0);if(i>>>0<16){w=i+j|0;tb(g+4|0,w|3|0,4);w=g+w+4|0;tb(w|0,vb(w|0,4,0)|0|1|0,4)}else{tb(g+4|0,j|3|0,4);tb(f+4|0,i|1|0,4);tb(f+i|0,i|0,4);if(k|0){d=vb(5635*4|0,4,0)|0|0;b=k>>>3;c=22560+(b<<1<<2)|0;b=1<<b;if(!(n&b)){tb(5630*4|0,n|b|0,4);b=c+8|0;a=c}else{a=c+8|0;b=a;a=vb(a|0,4,0)|0|0}tb(b|0,d|0,4);tb(a+12|0,d|0,4);tb(d+8|0,a|0,4);tb(d+12|0,c|0,4)}tb(5632*4|0,i|0,4);tb(5635*4|0,f|0,4)}w=g+8|0;l=x;return w|0}else n=j}else n=j}else n=j}else if(a>>>0<=4294967231){a=a+11|0;j=a&-8;d=vb(5631*4|0,4,0)|0|0;if(d){c=0-j|0;a=a>>>8;if(a)if(j>>>0>16777215)i=31;else{n=(a+1048320|0)>>>16&8;v=a<<n;k=(v+520192|0)>>>16&4;v=v<<k;i=(v+245760|0)>>>16&2;i=14-(k|n|i)+(v<<i>>>15)|0;i=j>>>(i+7|0)&1|i<<1}else i=0;a=vb(22824+(i<<2)|0,4,0)|0|0;a:do if(!a){e=0;a=0;v=57}else{e=0;g=j<<((i|0)==31?0:25-(i>>>1)|0);h=a;a=0;while(1){f=((vb(h+4|0,4,0)|0)&-8)-j|0;if(f>>>0<c>>>0)if(!f){c=0;e=h;a=h;v=61;break a}else{c=f;a=h}f=vb(h+20|0,4,0)|0|0;h=vb(h+16+(g>>>31<<2)|0,4,0)|0|0;e=(f|0)==0|(f|0)==(h|0)?e:f;f=(h|0)==0;if(f){v=57;break}else g=g<<((f^1)&1)}}while(0);if((v|0)==57){if((e|0)==0&(a|0)==0){a=2<<i;a=d&(a|0-a);if(!a){n=j;break}a=(a&0-a)+-1|0;i=a>>>12&16;a=a>>>i;h=a>>>5&8;a=a>>>h;k=a>>>2&4;a=a>>>k;n=a>>>1&2;a=a>>>n;e=a>>>1&1;e=vb(22824+((h|i|k|n|e)+(a>>>e)<<2)|0,4,0)|0|0;a=0}if(!e){h=c;i=a}else v=61}if((v|0)==61)while(1){v=0;k=((vb(e+4|0,4,0)|0)&-8)-j|0;n=k>>>0<c>>>0;c=n?k:c;a=n?e:a;e=vb(e+16+(((vb(e+16|0,4,0)|0|0)==0&1)<<2)|0,4,0)|0|0;if(!e){h=c;i=a;break}else v=61}if((i|0)!=0?h>>>0<((vb(5632*4|0,4,0)|0|0)-j|0)>>>0:0){g=i+j|0;if(i>>>0>=g>>>0){w=0;l=x;return w|0}f=vb(i+24|0,4,0)|0|0;b=vb(i+12|0,4,0)|0|0;do if((b|0)==(i|0)){a=i+20|0;b=vb(a|0,4,0)|0|0;if(!b){a=i+16|0;b=vb(a|0,4,0)|0|0;if(!b){b=0;break}}while(1){e=b+20|0;c=vb(e|0,4,0)|0|0;if(c|0){b=c;a=e;continue}e=b+16|0;c=vb(e|0,4,0)|0|0;if(!c)break;else{b=c;a=e}}tb(a|0,0|0,4)}else{w=vb(i+8|0,4,0)|0|0;tb(w+12|0,b|0,4);tb(b+8|0,w|0,4)}while(0);do if(f){a=vb(i+28|0,4,0)|0|0;c=22824+(a<<2)|0;if((i|0)==(vb(c|0,4,0)|0|0)){tb(c|0,b|0,4);if(!b){d=d&~(1<<a);tb(5631*4|0,d|0,4);break}}else{tb(f+16+(((vb(f+16|0,4,0)|0|0)!=(i|0)&1)<<2)|0,b|0,4);if(!b)break}tb(b+24|0,f|0,4);a=vb(i+16|0,4,0)|0|0;if(a|0){tb(b+16|0,a|0,4);tb(a+24|0,b|0,4)}a=vb(i+20|0,4,0)|0|0;if(a){tb(b+20|0,a|0,4);tb(a+24|0,b|0,4)}}while(0);do if(h>>>0>=16){tb(i+4|0,j|3|0,4);tb(g+4|0,h|1|0,4);tb(g+h|0,h|0,4);b=h>>>3;if(h>>>0<256){c=22560+(b<<1<<2)|0;a=vb(5630*4|0,4,0)|0|0;b=1<<b;if(!(a&b)){tb(5630*4|0,a|b|0,4);b=c+8|0;a=c}else{a=c+8|0;b=a;a=vb(a|0,4,0)|0|0}tb(b|0,g|0,4);tb(a+12|0,g|0,4);tb(g+8|0,a|0,4);tb(g+12|0,c|0,4);break}b=h>>>8;if(b)if(h>>>0>16777215)b=31;else{v=(b+1048320|0)>>>16&8;w=b<<v;u=(w+520192|0)>>>16&4;w=w<<u;b=(w+245760|0)>>>16&2;b=14-(u|v|b)+(w<<b>>>15)|0;b=h>>>(b+7|0)&1|b<<1}else b=0;c=22824+(b<<2)|0;tb(g+28|0,b|0,4);a=g+16|0;tb(a+4|0,0|0,4);tb(a|0,0|0,4);a=1<<b;if(!(d&a)){tb(5631*4|0,d|a|0,4);tb(c|0,g|0,4);tb(g+24|0,c|0,4);tb(g+12|0,g|0,4);tb(g+8|0,g|0,4);break}a=h<<((b|0)==31?0:25-(b>>>1)|0);c=vb(c|0,4,0)|0|0;while(1){if(((vb(c+4|0,4,0)|0)&-8|0)==(h|0)){v=97;break}d=c+16+(a>>>31<<2)|0;b=vb(d|0,4,0)|0|0;if(!b){v=96;break}else{a=a<<1;c=b}}if((v|0)==96){tb(d|0,g|0,4);tb(g+24|0,c|0,4);tb(g+12|0,g|0,4);tb(g+8|0,g|0,4);break}else if((v|0)==97){v=c+8|0;w=vb(v|0,4,0)|0|0;tb(w+12|0,g|0,4);tb(v|0,g|0,4);tb(g+8|0,w|0,4);tb(g+12|0,c|0,4);tb(g+24|0,0|0,4);break}}else{w=h+j|0;tb(i+4|0,w|3|0,4);w=i+w+4|0;tb(w|0,vb(w|0,4,0)|0|1|0,4)}while(0);w=i+8|0;l=x;return w|0}else n=j}else n=j}else n=-1;while(0);c=vb(5632*4|0,4,0)|0|0;if(c>>>0>=n>>>0){a=c-n|0;b=vb(5635*4|0,4,0)|0|0;if(a>>>0>15){w=b+n|0;tb(5635*4|0,w|0,4);tb(5632*4|0,a|0,4);tb(w+4|0,a|1|0,4);tb(w+a|0,a|0,4);tb(b+4|0,n|3|0,4)}else{tb(5632*4|0,0|0,4);tb(5635*4|0,0|0,4);tb(b+4|0,c|3|0,4);w=b+c+4|0;tb(w|0,vb(w|0,4,0)|0|1|0,4)}w=b+8|0;l=x;return w|0}g=vb(5633*4|0,4,0)|0|0;if(g>>>0>n>>>0){v=g-n|0;tb(5633*4|0,v|0,4);w=vb(5636*4|0,4,0)|0|0;u=w+n|0;tb(5636*4|0,u|0,4);tb(u+4|0,v|1|0,4);tb(w+4|0,n|3|0,4);w=w+8|0;l=x;return w|0}if(!(vb(5748*4|0,4,0)|0)){tb(5750*4|0,4096|0,4);tb(5749*4|0,4096|0,4);tb(5751*4|0,-1|0,4);tb(5752*4|0,-1|0,4);tb(5753*4|0,0|0,4);tb(5741*4|0,0|0,4);a=o&-16^1431655768;tb(o|0,a|0,4);tb(5748*4|0,a|0,4);a=4096}else a=vb(5750*4|0,4,0)|0|0;h=n+48|0;i=n+47|0;f=a+i|0;d=0-a|0;j=f&d;if(j>>>0<=n>>>0){w=0;l=x;return w|0}a=vb(5740*4|0,4,0)|0|0;if(a|0?(k=vb(5738*4|0,4,0)|0|0,o=k+j|0,o>>>0<=k>>>0|o>>>0>a>>>0):0){w=0;l=x;return w|0}b:do if(!((vb(5741*4|0,4,0)|0)&4)){c=vb(5636*4|0,4,0)|0|0;c:do if(c){e=22968;while(1){a=vb(e|0,4,0)|0|0;if(a>>>0<=c>>>0?(r=e+4|0,(a+(vb(r|0,4,0)|0|0)|0)>>>0>c>>>0):0)break;a=vb(e+8|0,4,0)|0|0;if(!a){v=118;break c}else e=a}b=f-g&d;if(b>>>0<2147483647){a=Pn(b|0)|0;if((a|0)==((vb(e|0,4,0)|0|0)+(vb(r|0,4,0)|0|0)|0)){if((a|0)!=(-1|0)){g=a;f=b;v=135;break b}}else{d=a;v=126}}else b=0}else v=118;while(0);do if((v|0)==118){c=Pn(0)|0;if((c|0)!=(-1|0)?(b=c,p=vb(5749*4|0,4,0)|0|0,q=p+-1|0,b=((q&b|0)==0?0:(q+b&0-p)-b|0)+j|0,p=vb(5738*4|0,4,0)|0|0,q=b+p|0,b>>>0>n>>>0&b>>>0<2147483647):0){r=vb(5740*4|0,4,0)|0|0;if(r|0?q>>>0<=p>>>0|q>>>0>r>>>0:0){b=0;break}a=Pn(b|0)|0;if((a|0)==(c|0)){g=c;f=b;v=135;break b}else{d=a;v=126}}else b=0}while(0);do if((v|0)==126){c=0-b|0;if(!(h>>>0>b>>>0&(b>>>0<2147483647&(d|0)!=(-1|0))))if((d|0)==(-1|0)){b=0;break}else{g=d;f=b;v=135;break b}a=vb(5750*4|0,4,0)|0|0;a=i-b+a&0-a;if(a>>>0>=2147483647){g=d;f=b;v=135;break b}if((Pn(a|0)|0)==(-1|0)){Pn(c|0)|0;b=0;break}else{g=d;f=a+b|0;v=135;break b}}while(0);tb(5741*4|0,vb(5741*4|0,4,0)|0|4|0,4);v=133}else{b=0;v=133}while(0);if(((v|0)==133?j>>>0<2147483647:0)?(s=Pn(j|0)|0,r=Pn(0)|0,u=r-s|0,t=u>>>0>(n+40|0)>>>0,!((s|0)==(-1|0)|t^1|s>>>0<r>>>0&((s|0)!=(-1|0)&(r|0)!=(-1|0))^1)):0){g=s;f=t?u:b;v=135}if((v|0)==135){b=(vb(5738*4|0,4,0)|0|0)+f|0;tb(5738*4|0,b|0,4);if(b>>>0>(vb(5739*4|0,4,0)|0|0)>>>0)tb(5739*4|0,b|0,4);i=vb(5636*4|0,4,0)|0|0;do if(i){e=22968;while(1){b=vb(e|0,4,0)|0|0;d=e+4|0;a=vb(d|0,4,0)|0|0;if((g|0)==(b+a|0)){v=145;break}c=vb(e+8|0,4,0)|0|0;if(!c)break;else e=c}if(((v|0)==145?((vb(e+12|0,4,0)|0)&8|0)==0:0)?i>>>0<g>>>0&i>>>0>=b>>>0:0){tb(d|0,a+f|0,4);w=i+8|0;w=(w&7|0)==0?0:0-w&7;v=i+w|0;w=(vb(5633*4|0,4,0)|0|0)+(f-w)|0;tb(5636*4|0,v|0,4);tb(5633*4|0,w|0,4);tb(v+4|0,w|1|0,4);tb(v+w+4|0,40|0,4);tb(5637*4|0,vb(5752*4|0,4,0)|0|0,4);break}if(g>>>0<(vb(5634*4|0,4,0)|0|0)>>>0)tb(5634*4|0,g|0,4);c=g+f|0;a=22968;while(1){if((vb(a|0,4,0)|0|0)==(c|0)){v=153;break}b=vb(a+8|0,4,0)|0|0;if(!b)break;else a=b}if((v|0)==153?((vb(a+12|0,4,0)|0)&8|0)==0:0){tb(a|0,g|0,4);k=a+4|0;tb(k|0,(vb(k|0,4,0)|0|0)+f|0,4);k=g+8|0;k=g+((k&7|0)==0?0:0-k&7)|0;b=c+8|0;b=c+((b&7|0)==0?0:0-b&7)|0;j=k+n|0;h=b-k-n|0;tb(k+4|0,n|3|0,4);do if((b|0)!=(i|0)){if((b|0)==(vb(5635*4|0,4,0)|0|0)){w=(vb(5632*4|0,4,0)|0|0)+h|0;tb(5632*4|0,w|0,4);tb(5635*4|0,j|0,4);tb(j+4|0,w|1|0,4);tb(j+w|0,w|0,4);break}a=vb(b+4|0,4,0)|0|0;if((a&3|0)==1){g=a&-8;d=a>>>3;d:do if(a>>>0<256){a=vb(b+8|0,4,0)|0|0;c=vb(b+12|0,4,0)|0|0;if((c|0)==(a|0)){tb(5630*4|0,(vb(5630*4|0,4,0)|0)&~(1<<d)|0,4);break}else{tb(a+12|0,c|0,4);tb(c+8|0,a|0,4);break}}else{f=vb(b+24|0,4,0)|0|0;a=vb(b+12|0,4,0)|0|0;do if((a|0)==(b|0)){d=b+16|0;c=d+4|0;a=vb(c|0,4,0)|0|0;if(!a){a=vb(d|0,4,0)|0|0;if(!a){a=0;break}else e=d}else e=c;while(1){d=a+20|0;c=vb(d|0,4,0)|0|0;if(c|0){a=c;e=d;continue}d=a+16|0;c=vb(d|0,4,0)|0|0;if(!c)break;else{a=c;e=d}}tb(e|0,0|0,4)}else{w=vb(b+8|0,4,0)|0|0;tb(w+12|0,a|0,4);tb(a+8|0,w|0,4)}while(0);if(!f)break;c=vb(b+28|0,4,0)|0|0;d=22824+(c<<2)|0;do if((b|0)!=(vb(d|0,4,0)|0|0)){tb(f+16+(((vb(f+16|0,4,0)|0|0)!=(b|0)&1)<<2)|0,a|0,4);if(!a)break d}else{tb(d|0,a|0,4);if(a|0)break;tb(5631*4|0,(vb(5631*4|0,4,0)|0)&~(1<<c)|0,4);break d}while(0);tb(a+24|0,f|0,4);d=b+16|0;c=vb(d|0,4,0)|0|0;if(c|0){tb(a+16|0,c|0,4);tb(c+24|0,a|0,4)}c=vb(d+4|0,4,0)|0|0;if(!c)break;tb(a+20|0,c|0,4);tb(c+24|0,a|0,4)}while(0);b=b+g|0;e=g+h|0}else e=h;b=b+4|0;tb(b|0,(vb(b|0,4,0)|0)&-2|0,4);tb(j+4|0,e|1|0,4);tb(j+e|0,e|0,4);b=e>>>3;if(e>>>0<256){c=22560+(b<<1<<2)|0;a=vb(5630*4|0,4,0)|0|0;b=1<<b;if(!(a&b)){tb(5630*4|0,a|b|0,4);b=c+8|0;a=c}else{a=c+8|0;b=a;a=vb(a|0,4,0)|0|0}tb(b|0,j|0,4);tb(a+12|0,j|0,4);tb(j+8|0,a|0,4);tb(j+12|0,c|0,4);break}b=e>>>8;do if(!b)a=0;else{if(e>>>0>16777215){a=31;break}v=(b+1048320|0)>>>16&8;w=b<<v;u=(w+520192|0)>>>16&4;w=w<<u;a=(w+245760|0)>>>16&2;a=14-(u|v|a)+(w<<a>>>15)|0;a=e>>>(a+7|0)&1|a<<1}while(0);d=22824+(a<<2)|0;tb(j+28|0,a|0,4);b=j+16|0;tb(b+4|0,0|0,4);tb(b|0,0|0,4);b=vb(5631*4|0,4,0)|0|0;c=1<<a;if(!(b&c)){tb(5631*4|0,b|c|0,4);tb(d|0,j|0,4);tb(j+24|0,d|0,4);tb(j+12|0,j|0,4);tb(j+8|0,j|0,4);break}a=e<<((a|0)==31?0:25-(a>>>1)|0);c=vb(d|0,4,0)|0|0;while(1){if(((vb(c+4|0,4,0)|0)&-8|0)==(e|0)){v=194;break}d=c+16+(a>>>31<<2)|0;b=vb(d|0,4,0)|0|0;if(!b){v=193;break}else{a=a<<1;c=b}}if((v|0)==193){tb(d|0,j|0,4);tb(j+24|0,c|0,4);tb(j+12|0,j|0,4);tb(j+8|0,j|0,4);break}else if((v|0)==194){v=c+8|0;w=vb(v|0,4,0)|0|0;tb(w+12|0,j|0,4);tb(v|0,j|0,4);tb(j+8|0,w|0,4);tb(j+12|0,c|0,4);tb(j+24|0,0|0,4);break}}else{w=(vb(5633*4|0,4,0)|0|0)+h|0;tb(5633*4|0,w|0,4);tb(5636*4|0,j|0,4);tb(j+4|0,w|1|0,4)}while(0);w=k+8|0;l=x;return w|0}a=22968;while(1){b=vb(a|0,4,0)|0|0;if(b>>>0<=i>>>0?(w=b+(vb(a+4|0,4,0)|0|0)|0,w>>>0>i>>>0):0)break;a=vb(a+8|0,4,0)|0|0}e=w+-47|0;a=e+8|0;a=e+((a&7|0)==0?0:0-a&7)|0;e=i+16|0;a=a>>>0<e>>>0?i:a;b=a+8|0;c=g+8|0;c=(c&7|0)==0?0:0-c&7;v=g+c|0;c=f+-40-c|0;tb(5636*4|0,v|0,4);tb(5633*4|0,c|0,4);tb(v+4|0,c|1|0,4);tb(v+c+4|0,40|0,4);tb(5637*4|0,vb(5752*4|0,4,0)|0|0,4);c=a+4|0;tb(c|0,27|0,4);tb(b|0,vb(5742*4|0,4,0)|0|0,4);tb(b+4|0,vb(5743*4|0,4,0)|0|0,4);tb(b+8|0,vb(5744*4|0,4,0)|0|0,4);tb(b+12|0,vb(5745*4|0,4,0)|0|0,4);tb(5742*4|0,g|0,4);tb(5743*4|0,f|0,4);tb(5745*4|0,0|0,4);tb(5744*4|0,b|0,4);b=a+24|0;do{v=b;b=b+4|0;tb(b|0,7|0,4)}while((v+8|0)>>>0<w>>>0);if((a|0)!=(i|0)){f=a-i|0;tb(c|0,(vb(c|0,4,0)|0)&-2|0,4);tb(i+4|0,f|1|0,4);tb(a|0,f|0,4);b=f>>>3;if(f>>>0<256){c=22560+(b<<1<<2)|0;a=vb(5630*4|0,4,0)|0|0;b=1<<b;if(!(a&b)){tb(5630*4|0,a|b|0,4);b=c+8|0;a=c}else{a=c+8|0;b=a;a=vb(a|0,4,0)|0|0}tb(b|0,i|0,4);tb(a+12|0,i|0,4);tb(i+8|0,a|0,4);tb(i+12|0,c|0,4);break}b=f>>>8;if(b)if(f>>>0>16777215)c=31;else{v=(b+1048320|0)>>>16&8;w=b<<v;u=(w+520192|0)>>>16&4;w=w<<u;c=(w+245760|0)>>>16&2;c=14-(u|v|c)+(w<<c>>>15)|0;c=f>>>(c+7|0)&1|c<<1}else c=0;d=22824+(c<<2)|0;tb(i+28|0,c|0,4);tb(i+20|0,0|0,4);tb(e|0,0|0,4);b=vb(5631*4|0,4,0)|0|0;a=1<<c;if(!(b&a)){tb(5631*4|0,b|a|0,4);tb(d|0,i|0,4);tb(i+24|0,d|0,4);tb(i+12|0,i|0,4);tb(i+8|0,i|0,4);break}a=f<<((c|0)==31?0:25-(c>>>1)|0);c=vb(d|0,4,0)|0|0;while(1){if(((vb(c+4|0,4,0)|0)&-8|0)==(f|0)){v=216;break}d=c+16+(a>>>31<<2)|0;b=vb(d|0,4,0)|0|0;if(!b){v=215;break}else{a=a<<1;c=b}}if((v|0)==215){tb(d|0,i|0,4);tb(i+24|0,c|0,4);tb(i+12|0,i|0,4);tb(i+8|0,i|0,4);break}else if((v|0)==216){v=c+8|0;w=vb(v|0,4,0)|0|0;tb(w+12|0,i|0,4);tb(v|0,i|0,4);tb(i+8|0,w|0,4);tb(i+12|0,c|0,4);tb(i+24|0,0|0,4);break}}}else{w=vb(5634*4|0,4,0)|0|0;if((w|0)==0|g>>>0<w>>>0)tb(5634*4|0,g|0,4);tb(5742*4|0,g|0,4);tb(5743*4|0,f|0,4);tb(5745*4|0,0|0,4);tb(5639*4|0,vb(5748*4|0,4,0)|0|0,4);tb(5638*4|0,-1|0,4);b=0;do{w=22560+(b<<1<<2)|0;tb(w+12|0,w|0,4);tb(w+8|0,w|0,4);b=b+1|0}while((b|0)!=32);w=g+8|0;w=(w&7|0)==0?0:0-w&7;v=g+w|0;w=f+-40-w|0;tb(5636*4|0,v|0,4);tb(5633*4|0,w|0,4);tb(v+4|0,w|1|0,4);tb(v+w+4|0,40|0,4);tb(5637*4|0,vb(5752*4|0,4,0)|0|0,4)}while(0);b=vb(5633*4|0,4,0)|0|0;if(b>>>0>n>>>0){v=b-n|0;tb(5633*4|0,v|0,4);w=vb(5636*4|0,4,0)|0|0;u=w+n|0;tb(5636*4|0,u|0,4);tb(u+4|0,v|1|0,4);tb(w+4|0,n|3|0,4);w=w+8|0;l=x;return w|0}}tb(5770*4|0,12|0,4);w=0;l=x;return w|0}function Al(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;if(!a)return;c=a+-8|0;d=vb(5634*4|0,4,0)|0|0;a=vb(a+-4|0,4,0)|0|0;b=a&-8;j=c+b|0;do if(!(a&1)){e=vb(c|0,4,0)|0|0;if(!(a&3))return;f=c+(0-e)|0;g=e+b|0;if(f>>>0<d>>>0)return;if((f|0)==(vb(5635*4|0,4,0)|0|0)){b=j+4|0;a=vb(b|0,4,0)|0|0;if((a&3|0)!=3){h=f;i=f;b=g;break}tb(5632*4|0,g|0,4);tb(b|0,a&-2|0,4);tb(f+4|0,g|1|0,4);tb(f+g|0,g|0,4);return}c=e>>>3;if(e>>>0<256){a=vb(f+8|0,4,0)|0|0;b=vb(f+12|0,4,0)|0|0;if((b|0)==(a|0)){tb(5630*4|0,(vb(5630*4|0,4,0)|0)&~(1<<c)|0,4);h=f;i=f;b=g;break}else{tb(a+12|0,b|0,4);tb(b+8|0,a|0,4);h=f;i=f;b=g;break}}e=vb(f+24|0,4,0)|0|0;a=vb(f+12|0,4,0)|0|0;do if((a|0)==(f|0)){c=f+16|0;b=c+4|0;a=vb(b|0,4,0)|0|0;if(!a){a=vb(c|0,4,0)|0|0;if(!a){c=0;break}else d=c}else d=b;while(1){c=a+20|0;b=vb(c|0,4,0)|0|0;if(b|0){a=b;d=c;continue}c=a+16|0;b=vb(c|0,4,0)|0|0;if(!b)break;else{a=b;d=c}}tb(d|0,0|0,4);c=a}else{c=vb(f+8|0,4,0)|0|0;tb(c+12|0,a|0,4);tb(a+8|0,c|0,4);c=a}while(0);if(e){a=vb(f+28|0,4,0)|0|0;b=22824+(a<<2)|0;if((f|0)==(vb(b|0,4,0)|0|0)){tb(b|0,c|0,4);if(!c){tb(5631*4|0,(vb(5631*4|0,4,0)|0)&~(1<<a)|0,4);h=f;i=f;b=g;break}}else{tb(e+16+(((vb(e+16|0,4,0)|0|0)!=(f|0)&1)<<2)|0,c|0,4);if(!c){h=f;i=f;b=g;break}}tb(c+24|0,e|0,4);b=f+16|0;a=vb(b|0,4,0)|0|0;if(a|0){tb(c+16|0,a|0,4);tb(a+24|0,c|0,4)}a=vb(b+4|0,4,0)|0|0;if(a){tb(c+20|0,a|0,4);tb(a+24|0,c|0,4);h=f;i=f;b=g}else{h=f;i=f;b=g}}else{h=f;i=f;b=g}}else{h=c;i=c}while(0);if(h>>>0>=j>>>0)return;a=j+4|0;d=vb(a|0,4,0)|0|0;if(!(d&1))return;if(!(d&2)){a=vb(5635*4|0,4,0)|0|0;if((j|0)==(vb(5636*4|0,4,0)|0|0)){j=(vb(5633*4|0,4,0)|0|0)+b|0;tb(5633*4|0,j|0,4);tb(5636*4|0,i|0,4);tb(i+4|0,j|1|0,4);if((i|0)!=(a|0))return;tb(5635*4|0,0|0,4);tb(5632*4|0,0|0,4);return}if((j|0)==(a|0)){j=(vb(5632*4|0,4,0)|0|0)+b|0;tb(5632*4|0,j|0,4);tb(5635*4|0,h|0,4);tb(i+4|0,j|1|0,4);tb(h+j|0,j|0,4);return}e=(d&-8)+b|0;c=d>>>3;do if(d>>>0<256){b=vb(j+8|0,4,0)|0|0;a=vb(j+12|0,4,0)|0|0;if((a|0)==(b|0)){tb(5630*4|0,(vb(5630*4|0,4,0)|0)&~(1<<c)|0,4);break}else{tb(b+12|0,a|0,4);tb(a+8|0,b|0,4);break}}else{f=vb(j+24|0,4,0)|0|0;a=vb(j+12|0,4,0)|0|0;do if((a|0)==(j|0)){c=j+16|0;b=c+4|0;a=vb(b|0,4,0)|0|0;if(!a){a=vb(c|0,4,0)|0|0;if(!a){c=0;break}else d=c}else d=b;while(1){c=a+20|0;b=vb(c|0,4,0)|0|0;if(b|0){a=b;d=c;continue}c=a+16|0;b=vb(c|0,4,0)|0|0;if(!b)break;else{a=b;d=c}}tb(d|0,0|0,4);c=a}else{c=vb(j+8|0,4,0)|0|0;tb(c+12|0,a|0,4);tb(a+8|0,c|0,4);c=a}while(0);if(f|0){a=vb(j+28|0,4,0)|0|0;b=22824+(a<<2)|0;if((j|0)==(vb(b|0,4,0)|0|0)){tb(b|0,c|0,4);if(!c){tb(5631*4|0,(vb(5631*4|0,4,0)|0)&~(1<<a)|0,4);break}}else{tb(f+16+(((vb(f+16|0,4,0)|0|0)!=(j|0)&1)<<2)|0,c|0,4);if(!c)break}tb(c+24|0,f|0,4);b=j+16|0;a=vb(b|0,4,0)|0|0;if(a|0){tb(c+16|0,a|0,4);tb(a+24|0,c|0,4)}a=vb(b+4|0,4,0)|0|0;if(a|0){tb(c+20|0,a|0,4);tb(a+24|0,c|0,4)}}}while(0);tb(i+4|0,e|1|0,4);tb(h+e|0,e|0,4);if((i|0)==(vb(5635*4|0,4,0)|0|0)){tb(5632*4|0,e|0,4);return}}else{tb(a|0,d&-2|0,4);tb(i+4|0,b|1|0,4);tb(h+b|0,b|0,4);e=b}a=e>>>3;if(e>>>0<256){c=22560+(a<<1<<2)|0;b=vb(5630*4|0,4,0)|0|0;a=1<<a;if(!(b&a)){tb(5630*4|0,b|a|0,4);a=c+8|0;b=c}else{b=c+8|0;a=b;b=vb(b|0,4,0)|0|0}tb(a|0,i|0,4);tb(b+12|0,i|0,4);tb(i+8|0,b|0,4);tb(i+12|0,c|0,4);return}a=e>>>8;if(a)if(e>>>0>16777215)b=31;else{h=(a+1048320|0)>>>16&8;j=a<<h;g=(j+520192|0)>>>16&4;j=j<<g;b=(j+245760|0)>>>16&2;b=14-(g|h|b)+(j<<b>>>15)|0;b=e>>>(b+7|0)&1|b<<1}else b=0;d=22824+(b<<2)|0;tb(i+28|0,b|0,4);tb(i+20|0,0|0,4);tb(i+16|0,0|0,4);a=vb(5631*4|0,4,0)|0|0;c=1<<b;do if(a&c){b=e<<((b|0)==31?0:25-(b>>>1)|0);c=vb(d|0,4,0)|0|0;while(1){if(((vb(c+4|0,4,0)|0)&-8|0)==(e|0)){a=73;break}d=c+16+(b>>>31<<2)|0;a=vb(d|0,4,0)|0|0;if(!a){a=72;break}else{b=b<<1;c=a}}if((a|0)==72){tb(d|0,i|0,4);tb(i+24|0,c|0,4);tb(i+12|0,i|0,4);tb(i+8|0,i|0,4);break}else if((a|0)==73){h=c+8|0;j=vb(h|0,4,0)|0|0;tb(j+12|0,i|0,4);tb(h|0,i|0,4);tb(i+8|0,j|0,4);tb(i+12|0,c|0,4);tb(i+24|0,0|0,4);break}}else{tb(5631*4|0,a|c|0,4);tb(d|0,i|0,4);tb(i+24|0,d|0,4);tb(i+12|0,i|0,4);tb(i+8|0,i|0,4)}while(0);j=(vb(5638*4|0,4,0)|0|0)+-1|0;tb(5638*4|0,j|0,4);if(!j)a=22976;else return;while(1){a=vb(a|0,4,0)|0|0;if(!a)break;else a=a+8|0}tb(5638*4|0,-1|0,4);return}function Bl(a,b){a=a|0;b=b|0;var c=0,d=0;if(!a){a=zl(b)|0;return a|0}if(b>>>0>4294967231){tb(5770*4|0,12|0,4);a=0;return a|0}c=Cl(a+-8|0,b>>>0<11?16:b+11&-8)|0;if(c|0){a=c+8|0;return a|0}c=zl(b)|0;if(!c){a=0;return a|0}d=vb(a+-4|0,4,0)|0|0;d=(d&-8)-((d&3|0)==0?8:4)|0;Mn(c|0,a|0,(d>>>0<b>>>0?d:b)|0)|0;Al(a);a=c;return a|0}function Cl(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;l=a+4|0;k=vb(l|0,4,0)|0|0;c=k&-8;h=a+c|0;if(!(k&3)){if(b>>>0<256){a=0;return a|0}if(c>>>0>=(b+4|0)>>>0?(c-b|0)>>>0<=(vb(5750*4|0,4,0)|0)<<1>>>0:0)return a|0;a=0;return a|0}if(c>>>0>=b>>>0){c=c-b|0;if(c>>>0<=15)return a|0;j=a+b|0;tb(l|0,k&1|b|2|0,4);tb(j+4|0,c|3|0,4);b=j+c+4|0;tb(b|0,vb(b|0,4,0)|0|1|0,4);Dl(j,c);return a|0}if((h|0)==(vb(5636*4|0,4,0)|0|0)){j=(vb(5633*4|0,4,0)|0|0)+c|0;d=j-b|0;c=a+b|0;if(j>>>0<=b>>>0){a=0;return a|0}tb(l|0,k&1|b|2|0,4);tb(c+4|0,d|1|0,4);tb(5636*4|0,c|0,4);tb(5633*4|0,d|0,4);return a|0}if((h|0)==(vb(5635*4|0,4,0)|0|0)){e=(vb(5632*4|0,4,0)|0|0)+c|0;if(e>>>0<b>>>0){a=0;return a|0}c=e-b|0;d=k&1;if(c>>>0>15){k=a+b|0;j=k+c|0;tb(l|0,d|b|2|0,4);tb(k+4|0,c|1|0,4);tb(j|0,c|0,4);d=j+4|0;tb(d|0,(vb(d|0,4,0)|0)&-2|0,4);d=k}else{tb(l|0,d|e|2|0,4);d=a+e+4|0;tb(d|0,vb(d|0,4,0)|0|1|0,4);d=0;c=0}tb(5632*4|0,c|0,4);tb(5635*4|0,d|0,4);return a|0}d=vb(h+4|0,4,0)|0|0;if(d&2|0){a=0;return a|0}i=(d&-8)+c|0;if(i>>>0<b>>>0){a=0;return a|0}j=i-b|0;e=d>>>3;do if(d>>>0<256){d=vb(h+8|0,4,0)|0|0;c=vb(h+12|0,4,0)|0|0;if((c|0)==(d|0)){tb(5630*4|0,(vb(5630*4|0,4,0)|0)&~(1<<e)|0,4);break}else{tb(d+12|0,c|0,4);tb(c+8|0,d|0,4);break}}else{g=vb(h+24|0,4,0)|0|0;c=vb(h+12|0,4,0)|0|0;do if((c|0)==(h|0)){e=h+16|0;d=e+4|0;c=vb(d|0,4,0)|0|0;if(!c){c=vb(e|0,4,0)|0|0;if(!c){e=0;break}else f=e}else f=d;while(1){e=c+20|0;d=vb(e|0,4,0)|0|0;if(d|0){c=d;f=e;continue}e=c+16|0;d=vb(e|0,4,0)|0|0;if(!d)break;else{c=d;f=e}}tb(f|0,0|0,4);e=c}else{e=vb(h+8|0,4,0)|0|0;tb(e+12|0,c|0,4);tb(c+8|0,e|0,4);e=c}while(0);if(g|0){c=vb(h+28|0,4,0)|0|0;d=22824+(c<<2)|0;if((h|0)==(vb(d|0,4,0)|0|0)){tb(d|0,e|0,4);if(!e){tb(5631*4|0,(vb(5631*4|0,4,0)|0)&~(1<<c)|0,4);break}}else{tb(g+16+(((vb(g+16|0,4,0)|0|0)!=(h|0)&1)<<2)|0,e|0,4);if(!e)break}tb(e+24|0,g|0,4);d=h+16|0;c=vb(d|0,4,0)|0|0;if(c|0){tb(e+16|0,c|0,4);tb(c+24|0,e|0,4)}c=vb(d+4|0,4,0)|0|0;if(c|0){tb(e+20|0,c|0,4);tb(c+24|0,e|0,4)}}}while(0);c=k&1;if(j>>>0<16){tb(l|0,i|c|2|0,4);b=a+i+4|0;tb(b|0,vb(b|0,4,0)|0|1|0,4);return a|0}else{k=a+b|0;tb(l|0,c|b|2|0,4);tb(k+4|0,j|3|0,4);b=k+j+4|0;tb(b|0,vb(b|0,4,0)|0|1|0,4);Dl(k,j);return a|0}return 0}function Dl(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0;i=a+b|0;c=vb(a+4|0,4,0)|0|0;do if(!(c&1)){d=vb(a|0,4,0)|0|0;if(!(c&3))return;f=a+(0-d)|0;g=d+b|0;if((f|0)==(vb(5635*4|0,4,0)|0|0)){a=i+4|0;c=vb(a|0,4,0)|0|0;if((c&3|0)!=3){h=f;a=g;break}tb(5632*4|0,g|0,4);tb(a|0,c&-2|0,4);tb(f+4|0,g|1|0,4);tb(f+g|0,g|0,4);return}b=d>>>3;if(d>>>0<256){c=vb(f+8|0,4,0)|0|0;a=vb(f+12|0,4,0)|0|0;if((a|0)==(c|0)){tb(5630*4|0,(vb(5630*4|0,4,0)|0)&~(1<<b)|0,4);h=f;a=g;break}else{tb(c+12|0,a|0,4);tb(a+8|0,c|0,4);h=f;a=g;break}}e=vb(f+24|0,4,0)|0|0;c=vb(f+12|0,4,0)|0|0;do if((c|0)==(f|0)){b=f+16|0;a=b+4|0;c=vb(a|0,4,0)|0|0;if(!c){c=vb(b|0,4,0)|0|0;if(!c){b=0;break}else d=b}else d=a;while(1){b=c+20|0;a=vb(b|0,4,0)|0|0;if(a|0){c=a;d=b;continue}b=c+16|0;a=vb(b|0,4,0)|0|0;if(!a)break;else{c=a;d=b}}tb(d|0,0|0,4);b=c}else{b=vb(f+8|0,4,0)|0|0;tb(b+12|0,c|0,4);tb(c+8|0,b|0,4);b=c}while(0);if(e){c=vb(f+28|0,4,0)|0|0;a=22824+(c<<2)|0;if((f|0)==(vb(a|0,4,0)|0|0)){tb(a|0,b|0,4);if(!b){tb(5631*4|0,(vb(5631*4|0,4,0)|0)&~(1<<c)|0,4);h=f;a=g;break}}else{tb(e+16+(((vb(e+16|0,4,0)|0|0)!=(f|0)&1)<<2)|0,b|0,4);if(!b){h=f;a=g;break}}tb(b+24|0,e|0,4);a=f+16|0;c=vb(a|0,4,0)|0|0;if(c|0){tb(b+16|0,c|0,4);tb(c+24|0,b|0,4)}c=vb(a+4|0,4,0)|0|0;if(c){tb(b+20|0,c|0,4);tb(c+24|0,b|0,4);h=f;a=g}else{h=f;a=g}}else{h=f;a=g}}else{h=a;a=b}while(0);c=i+4|0;d=vb(c|0,4,0)|0|0;if(!(d&2)){c=vb(5635*4|0,4,0)|0|0;if((i|0)==(vb(5636*4|0,4,0)|0|0)){i=(vb(5633*4|0,4,0)|0|0)+a|0;tb(5633*4|0,i|0,4);tb(5636*4|0,h|0,4);tb(h+4|0,i|1|0,4);if((h|0)!=(c|0))return;tb(5635*4|0,0|0,4);tb(5632*4|0,0|0,4);return}if((i|0)==(c|0)){i=(vb(5632*4|0,4,0)|0|0)+a|0;tb(5632*4|0,i|0,4);tb(5635*4|0,h|0,4);tb(h+4|0,i|1|0,4);tb(h+i|0,i|0,4);return}e=(d&-8)+a|0;b=d>>>3;do if(d>>>0<256){a=vb(i+8|0,4,0)|0|0;c=vb(i+12|0,4,0)|0|0;if((c|0)==(a|0)){tb(5630*4|0,(vb(5630*4|0,4,0)|0)&~(1<<b)|0,4);break}else{tb(a+12|0,c|0,4);tb(c+8|0,a|0,4);break}}else{f=vb(i+24|0,4,0)|0|0;c=vb(i+12|0,4,0)|0|0;do if((c|0)==(i|0)){b=i+16|0;a=b+4|0;c=vb(a|0,4,0)|0|0;if(!c){c=vb(b|0,4,0)|0|0;if(!c){b=0;break}else d=b}else d=a;while(1){b=c+20|0;a=vb(b|0,4,0)|0|0;if(a|0){c=a;d=b;continue}b=c+16|0;a=vb(b|0,4,0)|0|0;if(!a)break;else{c=a;d=b}}tb(d|0,0|0,4);b=c}else{b=vb(i+8|0,4,0)|0|0;tb(b+12|0,c|0,4);tb(c+8|0,b|0,4);b=c}while(0);if(f|0){c=vb(i+28|0,4,0)|0|0;a=22824+(c<<2)|0;if((i|0)==(vb(a|0,4,0)|0|0)){tb(a|0,b|0,4);if(!b){tb(5631*4|0,(vb(5631*4|0,4,0)|0)&~(1<<c)|0,4);break}}else{tb(f+16+(((vb(f+16|0,4,0)|0|0)!=(i|0)&1)<<2)|0,b|0,4);if(!b)break}tb(b+24|0,f|0,4);a=i+16|0;c=vb(a|0,4,0)|0|0;if(c|0){tb(b+16|0,c|0,4);tb(c+24|0,b|0,4)}c=vb(a+4|0,4,0)|0|0;if(c|0){tb(b+20|0,c|0,4);tb(c+24|0,b|0,4)}}}while(0);tb(h+4|0,e|1|0,4);tb(h+e|0,e|0,4);if((h|0)==(vb(5635*4|0,4,0)|0|0)){tb(5632*4|0,e|0,4);return}}else{tb(c|0,d&-2|0,4);tb(h+4|0,a|1|0,4);tb(h+a|0,a|0,4);e=a}c=e>>>3;if(e>>>0<256){b=22560+(c<<1<<2)|0;a=vb(5630*4|0,4,0)|0|0;c=1<<c;if(!(a&c)){tb(5630*4|0,a|c|0,4);c=b+8|0;a=b}else{a=b+8|0;c=a;a=vb(a|0,4,0)|0|0}tb(c|0,h|0,4);tb(a+12|0,h|0,4);tb(h+8|0,a|0,4);tb(h+12|0,b|0,4);return}c=e>>>8;if(c)if(e>>>0>16777215)a=31;else{g=(c+1048320|0)>>>16&8;i=c<<g;f=(i+520192|0)>>>16&4;i=i<<f;a=(i+245760|0)>>>16&2;a=14-(f|g|a)+(i<<a>>>15)|0;a=e>>>(a+7|0)&1|a<<1}else a=0;d=22824+(a<<2)|0;tb(h+28|0,a|0,4);tb(h+20|0,0|0,4);tb(h+16|0,0|0,4);c=vb(5631*4|0,4,0)|0|0;b=1<<a;if(!(c&b)){tb(5631*4|0,c|b|0,4);tb(d|0,h|0,4);tb(h+24|0,d|0,4);tb(h+12|0,h|0,4);tb(h+8|0,h|0,4);return}a=e<<((a|0)==31?0:25-(a>>>1)|0);b=vb(d|0,4,0)|0|0;while(1){if(((vb(b+4|0,4,0)|0)&-8|0)==(e|0)){c=69;break}d=b+16+(a>>>31<<2)|0;c=vb(d|0,4,0)|0|0;if(!c){c=68;break}else{a=a<<1;b=c}}if((c|0)==68){tb(d|0,h|0,4);tb(h+24|0,b|0,4);tb(h+12|0,h|0,4);tb(h+8|0,h|0,4);return}else if((c|0)==69){g=b+8|0;i=vb(g|0,4,0)|0|0;tb(i+12|0,h|0,4);tb(g|0,h|0,4);tb(h+8|0,i|0,4);tb(h+12|0,b|0,4);tb(h+24|0,0|0,4);return}}function El(a){a=a|0;var b=0,c=0;b=l;l=l+16|0;if((l|0)>=(m|0))X(16);c=b;tb(c|0,Jl(vb(a+60|0,4,0)|0|0)|0|0,4);a=Hl(Ra(6,c|0)|0)|0;l=b;return a|0}function Fl(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,n=0,o=0,p=0;n=l;l=l+48|0;if((l|0)>=(m|0))X(48);h=n+16|0;e=n;d=n+32|0;i=a+28|0;f=vb(i|0,4,0)|0|0;tb(d|0,f|0,4);j=a+20|0;f=(vb(j|0,4,0)|0|0)-f|0;tb(d+4|0,f|0,4);tb(d+8|0,b|0,4);tb(d+12|0,c|0,4);f=f+c|0;g=a+60|0;tb(e|0,vb(g|0,4,0)|0|0,4);tb(e+4|0,d|0,4);tb(e+8|0,2|0,4);b=Hl(Pa(146,e|0)|0)|0;a:do if((f|0)!=(b|0)){e=2;while(1){if((b|0)<0)break;f=f-b|0;o=vb(d+4|0,4,0)|0|0;p=b>>>0>o>>>0;d=p?d+8|0:d;e=(p<<31>>31)+e|0;o=b-(p?o:0)|0;tb(d|0,(vb(d|0,4,0)|0|0)+o|0,4);p=d+4|0;tb(p|0,(vb(p|0,4,0)|0|0)-o|0,4);tb(h|0,vb(g|0,4,0)|0|0,4);tb(h+4|0,d|0,4);tb(h+8|0,e|0,4);b=Hl(Pa(146,h|0)|0)|0;if((f|0)==(b|0)){k=3;break a}}tb(a+16|0,0|0,4);tb(i|0,0|0,4);tb(j|0,0|0,4);tb(a|0,vb(a|0,4,0)|0|32|0,4);if((e|0)==2)c=0;else c=c-(vb(d+4|0,4,0)|0|0)|0}else k=3;while(0);if((k|0)==3){p=vb(a+44|0,4,0)|0|0;tb(a+16|0,p+(vb(a+48|0,4,0)|0|0)|0,4);tb(i|0,p|0,4);tb(j|0,p|0,4)}l=n;return c|0}function Gl(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;e=l;l=l+32|0;if((l|0)>=(m|0))X(32);f=e;d=e+20|0;tb(f|0,vb(a+60|0,4,0)|0|0,4);tb(f+4|0,0|0,4);tb(f+8|0,b|0,4);tb(f+12|0,d|0,4);tb(f+16|0,c|0,4);if((Hl(Oa(140,f|0)|0)|0)<0){tb(d|0,-1|0,4);a=-1}else a=vb(d|0,4,0)|0|0;l=e;return a|0}function Hl(a){a=a|0;if(a>>>0>4294963200){tb(5770*4|0,0-a|0,4);a=-1}return a|0}function Il(){return 23080}function Jl(a){a=a|0;return a|0}function Kl(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;e=l;l=l+32|0;if((l|0)>=(m|0))X(32);d=e;tb(a+36|0,24|0,4);if(((vb(a|0,4,0)|0)&64|0)==0?(tb(d|0,vb(a+60|0,4,0)|0|0,4),tb(d+4|0,21523|0,4),tb(d+8|0,e+16|0,4),Qa(54,d|0)|0):0)tb(a+75>>0|0,-1|0,1);d=Fl(a,b,c)|0;l=e;return d|0}function Ll(a){a=a|0;var b=0;b=(Ml(a)|0)==0;return (b?a:a&95)|0}function Ml(a){a=a|0;return (a+-97|0)>>>0<26|0}function Nl(a,b){a=a|0;b=b|0;var c=0,d=0;c=vb(a>>0|0,1,0)|0|0;d=vb(b>>0|0,1,0)|0|0;if(!(c<<24>>24==0?1:c<<24>>24!=d<<24>>24))do{a=a+1|0;b=b+1|0;c=vb(a>>0|0,1,0)|0|0;d=vb(b>>0|0,1,0)|0|0}while(!(c<<24>>24==0?1:c<<24>>24!=d<<24>>24));return (c&255)-(d&255)|0}function Ol(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;a:do if(!c)a=0;else{while(1){d=vb(a>>0|0,1,0)|0|0;e=vb(b>>0|0,1,0)|0|0;if(d<<24>>24!=e<<24>>24)break;c=c+-1|0;if(!c){a=0;break a}else{a=a+1|0;b=b+1|0}}a=(d&255)-(e&255)|0}while(0);return a|0}function Pl(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0;g=l;l=l+128|0;if((l|0)>=(m|0))X(128);f=g;c=f;d=10440;e=c+124|0;do{tb(c|0,vb(d|0,4,0)|0|0,4);c=c+4|0;d=d+4|0}while((c|0)<(e|0));e=-2-a|0;e=e>>>0<255?e:255;tb(f+48|0,e|0,4);d=f+20|0;tb(d|0,a|0,4);tb(f+44|0,a|0,4);a=a+e|0;c=f+16|0;tb(c|0,a|0,4);tb(f+28|0,a|0,4);Ql(f,19321,b);if(e|0){f=vb(d|0,4,0)|0|0;tb(f+(((f|0)==(vb(c|0,4,0)|0|0))<<31>>31)>>0|0,0|0,1)}l=g;return}function Ql(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,n=0,o=0,p=0;p=l;l=l+224|0;if((l|0)>=(m|0))X(224);j=p+120|0;o=p+80|0;n=p;k=p+136|0;d=o;e=d+40|0;do{tb(d|0,0|0,4);d=d+4|0}while((d|0)<(e|0));tb(j|0,vb(c|0,4,0)|0|0,4);if((Rl(0,b,j,n,o)|0)>=0){c=vb(a|0,4,0)|0|0;i=c&32;if((vb(a+74>>0|0,1,0)|0|0)<1)tb(a|0,c&-33|0,4);e=a+48|0;if(!(vb(e|0,4,0)|0)){d=a+44|0;c=vb(d|0,4,0)|0|0;tb(d|0,k|0,4);f=a+28|0;tb(f|0,k|0,4);h=a+20|0;tb(h|0,k|0,4);tb(e|0,80|0,4);g=a+16|0;tb(g|0,k+80|0,4);Rl(a,b,j,n,o)|0;if(c|0){db[(xb(vb(a+36|0,4,0)|0|0,31|0)|0)&31](a,0,0)|0;tb(d|0,c|0,4);tb(e|0,0|0,4);tb(g|0,0|0,4);tb(f|0,0|0,4);tb(h|0,0|0,4)}}else Rl(a,b,j,n,o)|0;tb(a|0,vb(a|0,4,0)|0|i|0,4)}l=p;return}function Rl(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,A=0,B=0,C=0,D=0,E=0;E=l;l=l+64|0;if((l|0)>=(m|0))X(64);A=E+16|0;w=E;v=E+24|0;D=E+8|0;y=E+20|0;tb(A|0,b|0,4);C=(a|0)!=0;u=v+40|0;B=u;v=v+39|0;x=D+4|0;n=b;b=0;f=0;i=0;a:while(1){do if((b|0)>-1)if((f|0)>(2147483647-b|0)){tb(5770*4|0,75|0,4);b=-1;break}else{b=f+b|0;break}while(0);f=vb(n>>0|0,1,0)|0|0;if(!(f<<24>>24)){t=87;break}else g=n;b:while(1){switch(f<<24>>24){case 37:{f=g;t=9;break b}case 0:{f=g;break b}default:{}}s=g+1|0;tb(A|0,s|0,4);f=vb(s>>0|0,1,0)|0|0;g=s}c:do if((t|0)==9)while(1){t=0;if((vb(f+1>>0|0,1,0)|0|0)!=37)break c;g=g+1|0;f=f+2|0;tb(A|0,f|0,4);if((vb(f>>0|0,1,0)|0|0)==37)t=9;else break}while(0);g=g-n|0;if(C)Tl(a,n,g);if(g|0){n=f;f=g;continue}h=f+1|0;g=(vb(h>>0|0,1,0)|0|0)+-48|0;if(g>>>0<10){s=(vb(f+2>>0|0,1,0)|0|0)==36;p=s?g:-1;k=s?1:i;h=s?f+3|0:h}else{p=-1;k=i}tb(A|0,h|0,4);f=vb(h>>0|0,1,0)|0|0;g=(f<<24>>24)+-32|0;d:do if(g>>>0<32){i=0;while(1){g=1<<g;if(!(g&75913)){j=i;break d}i=g|i;h=h+1|0;tb(A|0,h|0,4);f=vb(h>>0|0,1,0)|0|0;g=(f<<24>>24)+-32|0;if(g>>>0>=32){j=i;break}}}else j=0;while(0);if(f<<24>>24==42){g=h+1|0;f=(vb(g>>0|0,1,0)|0|0)+-48|0;if(f>>>0<10?(vb(h+2>>0|0,1,0)|0|0)==36:0){tb(e+(f<<2)|0,10|0,4);i=1;f=h+3|0;g=vb(d+((vb(g>>0|0,1,0)|0|0)+-48<<3)|0,4,0)|0|0}else{if(k|0){b=-1;break}if(C){i=(vb(c|0,4,0)|0|0)+(4-1)&~(4-1);s=vb(i|0,4,0)|0|0;tb(c|0,i+4|0,4);i=0;f=g;g=s}else{i=0;f=g;g=0}}tb(A|0,f|0,4);r=(g|0)<0;h=f;o=r?j|8192:j;s=i;r=r?0-g|0:g}else{f=Ul(A)|0;if((f|0)<0){b=-1;break}h=vb(A|0,4,0)|0|0;o=j;s=k;r=f}do if((vb(h>>0|0,1,0)|0|0)==46){f=h+1|0;if((vb(f>>0|0,1,0)|0|0)!=42){tb(A|0,f|0,4);j=Ul(A)|0;f=vb(A|0,4,0)|0|0;break}f=h+2|0;g=(vb(f>>0|0,1,0)|0|0)+-48|0;if(g>>>0<10?(vb(h+3>>0|0,1,0)|0|0)==36:0){tb(e+(g<<2)|0,10|0,4);j=vb(d+((vb(f>>0|0,1,0)|0|0)+-48<<3)|0,4,0)|0|0;f=h+4|0;tb(A|0,f|0,4);break}if(s|0){b=-1;break a}if(C){q=(vb(c|0,4,0)|0|0)+(4-1)&~(4-1);g=vb(q|0,4,0)|0|0;tb(c|0,q+4|0,4)}else g=0;tb(A|0,f|0,4);j=g}else{f=h;j=-1}while(0);k=0;while(1){if(((vb(f>>0|0,1,0)|0|0)+-65|0)>>>0>57){b=-1;break a}q=f+1|0;tb(A|0,q|0,4);g=vb((vb(f>>0|0,1,0)|0|0)+-65+(19361+(k*58|0))>>0|0,1,0)|0|0;i=g&255;if((i+-1|0)>>>0<8){f=q;k=i}else break}if(!(g<<24>>24)){b=-1;break}h=(p|0)>-1;do if(g<<24>>24==19)if(h){b=-1;break a}else t=49;else{if(h){tb(e+(p<<2)|0,i|0,4);i=d+(p<<3)|0;t=vb(i+4|0,4,0)|0|0;p=w;tb(p|0,vb(i|0,4,0)|0|0,4);tb(p+4|0,t|0,4);t=49;break}if(!C){b=0;break a}Vl(w,i,c)}while(0);if((t|0)==49?(t=0,!C):0){n=q;f=0;i=s;continue}i=vb(f>>0|0,1,0)|0|0;i=(k|0)!=0&(i&15|0)==3?i&-33:i;g=o&-65537;p=(o&8192|0)==0?o:g;e:do switch(i|0){case 110:switch((k&255)<<24>>24){case 0:{tb(vb(w|0,4,0)|0|0,b|0,4);n=q;f=0;i=s;continue a}case 1:{tb(vb(w|0,4,0)|0|0,b|0,4);n=q;f=0;i=s;continue a}case 2:{n=vb(w|0,4,0)|0|0;tb(n|0,b|0,4);tb(n+4|0,((b|0)<0)<<31>>31|0,4);n=q;f=0;i=s;continue a}case 3:{tb(vb(w|0,4,0)|0|0,b|0,2);n=q;f=0;i=s;continue a}case 4:{tb((vb(w|0,4,0)|0)>>0|0,b|0,1);n=q;f=0;i=s;continue a}case 6:{tb(vb(w|0,4,0)|0|0,b|0,4);n=q;f=0;i=s;continue a}case 7:{n=vb(w|0,4,0)|0|0;tb(n|0,b|0,4);tb(n+4|0,((b|0)<0)<<31>>31|0,4);n=q;f=0;i=s;continue a}default:{n=q;f=0;i=s;continue a}}case 112:{f=p|8;g=j>>>0>8?j:8;i=120;t=61;break}case 88:case 120:{f=p;g=j;t=61;break}case 111:{o=w;n=vb(o|0,4,0)|0|0;o=vb(o+4|0,4,0)|0|0;k=Xl(n,o,u)|0;g=B-k|0;f=p;g=(p&8|0)==0|(j|0)>(g|0)?j:g+1|0;h=0;j=19825;t=67;break}case 105:case 100:{g=w;f=vb(g|0,4,0)|0|0;g=vb(g+4|0,4,0)|0|0;if((g|0)<0){f=En(0,0,f|0,g|0)|0;g=z;h=w;tb(h|0,f|0,4);tb(h+4|0,g|0,4);h=1;i=19825;t=66;break e}else{h=(p&2049|0)!=0&1;i=(p&2048|0)==0?((p&1|0)==0?19825:19827):19826;t=66;break e}}case 117:{g=w;f=vb(g|0,4,0)|0|0;g=vb(g+4|0,4,0)|0|0;h=0;i=19825;t=66;break}case 99:{tb(v>>0|0,vb(w|0,4,0)|0|0,1);n=v;k=g;i=1;h=0;g=19825;f=u;break}case 109:{f=Zl(vb(5770*4|0,4,0)|0|0)|0;t=71;break}case 115:{f=vb(w|0,4,0)|0|0;f=f|0?f:19835;t=71;break}case 67:{tb(D|0,vb(w|0,4,0)|0|0,4);tb(x|0,0|0,4);tb(w|0,D|0,4);f=D;j=-1;t=75;break}case 83:{f=vb(w|0,4,0)|0|0;if(!j){$l(a,32,r,0,p);f=0;t=84}else t=75;break}case 65:case 71:case 70:case 69:case 97:case 103:case 102:case 101:{n=q;f=bm(a,+(+wb(w|0,8)),r,j,p,i)|0;i=s;continue a}default:{k=p;i=j;h=0;g=19825;f=u}}while(0);f:do if((t|0)==61){o=w;n=vb(o|0,4,0)|0|0;o=vb(o+4|0,4,0)|0|0;k=Wl(n,o,u,i&32)|0;j=(f&8|0)==0|(n|0)==0&(o|0)==0;h=j?0:2;j=j?19825:19825+(i>>4)|0;t=67}else if((t|0)==66){n=f;o=g;k=Yl(f,g,u)|0;f=p;g=j;j=i;t=67}else if((t|0)==71){t=0;p=_l(f,j)|0;o=(p|0)==0;n=f;k=g;i=o?j:p-f|0;h=0;g=19825;f=o?f+j|0:p}else if((t|0)==75){t=0;h=0;g=0;k=f;while(1){i=vb(k|0,4,0)|0|0;if(!i)break;g=am(y,i)|0;if((g|0)<0|g>>>0>(j-h|0)>>>0)break;h=g+h|0;if(j>>>0>h>>>0)k=k+4|0;else break}if((g|0)<0){b=-1;break a}$l(a,32,r,h,p);if(!h){f=0;t=84}else{i=0;while(1){g=vb(f|0,4,0)|0|0;if(!g){f=h;t=84;break f}g=am(y,g)|0;i=g+i|0;if((i|0)>(h|0)){f=h;t=84;break f}Tl(a,y,g);if(i>>>0>=h>>>0){f=h;t=84;break}else f=f+4|0}}}while(0);if((t|0)==67){t=0;i=(n|0)!=0|(o|0)!=0;p=(g|0)!=0|i;i=((i^1)&1)+(B-k)|0;n=p?k:u;k=(g|0)>-1?f&-65537:f;i=p?((g|0)>(i|0)?g:i):g;g=j;f=u}else if((t|0)==84){t=0;$l(a,32,r,f,p^8192);n=q;f=(r|0)>(f|0)?r:f;i=s;continue}p=f-n|0;o=(i|0)<(p|0)?p:i;i=o+h|0;f=(r|0)<(i|0)?i:r;$l(a,32,f,i,k);Tl(a,g,h);$l(a,48,f,i,k^65536);$l(a,48,o,p,0);Tl(a,n,p);$l(a,32,f,i,k^8192);n=q;i=s}g:do if((t|0)==87)if(!a)if(!i)b=0;else{b=1;while(1){f=vb(e+(b<<2)|0,4,0)|0|0;if(!f){f=0;break}Vl(d+(b<<3)|0,f,c);b=b+1|0;if((b|0)>=10){b=1;break g}}while(1){b=b+1|0;if(f|0){b=-1;break g}if((b|0)>=10){b=1;break g}f=vb(e+(b<<2)|0,4,0)|0|0}}while(0);l=E;return b|0}function Sl(){return 0}function Tl(a,b,c){a=a|0;b=b|0;c=c|0;if(!((vb(a|0,4,0)|0)&32))lm(b,c,a)|0;return}function Ul(a){a=a|0;var b=0,c=0,d=0;b=vb(a|0,4,0)|0|0;c=(vb(b>>0|0,1,0)|0|0)+-48|0;if(c>>>0<10){d=b;b=0;do{b=c+(b*10|0)|0;d=d+1|0;tb(a|0,d|0,4);c=(vb(d>>0|0,1,0)|0|0)+-48|0}while(c>>>0<10)}else b=0;return b|0}function Vl(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0.0;a:do if(b>>>0<=20)do switch(b|0){case 9:{d=(vb(c|0,4,0)|0|0)+(4-1)&~(4-1);b=vb(d|0,4,0)|0|0;tb(c|0,d+4|0,4);tb(a|0,b|0,4);break a}case 10:{b=(vb(c|0,4,0)|0|0)+(4-1)&~(4-1);d=vb(b|0,4,0)|0|0;tb(c|0,b+4|0,4);b=a;tb(b|0,d|0,4);tb(b+4|0,((d|0)<0)<<31>>31|0,4);break a}case 11:{d=(vb(c|0,4,0)|0|0)+(4-1)&~(4-1);b=vb(d|0,4,0)|0|0;tb(c|0,d+4|0,4);d=a;tb(d|0,b|0,4);tb(d+4|0,0|0,4);break a}case 12:{b=(vb(c|0,4,0)|0|0)+(8-1)&~(8-1);d=b;e=vb(d|0,4,0)|0|0;d=vb(d+4|0,4,0)|0|0;tb(c|0,b+8|0,4);b=a;tb(b|0,e|0,4);tb(b+4|0,d|0,4);break a}case 13:{d=(vb(c|0,4,0)|0|0)+(4-1)&~(4-1);e=vb(d|0,4,0)|0|0;tb(c|0,d+4|0,4);e=(e&65535)<<16>>16;d=a;tb(d|0,e|0,4);tb(d+4|0,((e|0)<0)<<31>>31|0,4);break a}case 14:{e=(vb(c|0,4,0)|0|0)+(4-1)&~(4-1);d=vb(e|0,4,0)|0|0;tb(c|0,e+4|0,4);e=a;tb(e|0,d&65535|0,4);tb(e+4|0,0|0,4);break a}case 15:{d=(vb(c|0,4,0)|0|0)+(4-1)&~(4-1);e=vb(d|0,4,0)|0|0;tb(c|0,d+4|0,4);e=(e&255)<<24>>24;d=a;tb(d|0,e|0,4);tb(d+4|0,((e|0)<0)<<31>>31|0,4);break a}case 16:{e=(vb(c|0,4,0)|0|0)+(4-1)&~(4-1);d=vb(e|0,4,0)|0|0;tb(c|0,e+4|0,4);e=a;tb(e|0,d&255|0,4);tb(e+4|0,0|0,4);break a}case 17:{e=(vb(c|0,4,0)|0|0)+(8-1)&~(8-1);f=+(+wb(e|0,8));tb(c|0,e+8|0,4);ub(a|0,+f,8);break a}case 18:{e=(vb(c|0,4,0)|0|0)+(8-1)&~(8-1);f=+(+wb(e|0,8));tb(c|0,e+8|0,4);ub(a|0,+f,8);break a}default:break a}while(0);while(0);return}function Wl(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if(!((a|0)==0&(b|0)==0))do{c=c+-1|0;tb(c>>0|0,vb(19877+(a&15)>>0|0,1,1)|0|0|d|0,1);a=Jn(a|0,b|0,4)|0;b=z}while(!((a|0)==0&(b|0)==0));return c|0}function Xl(a,b,c){a=a|0;b=b|0;c=c|0;if(!((a|0)==0&(b|0)==0))do{c=c+-1|0;tb(c>>0|0,a&7|48|0,1);a=Jn(a|0,b|0,3)|0;b=z}while(!((a|0)==0&(b|0)==0));return c|0}function Yl(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if(b>>>0>0|(b|0)==0&a>>>0>4294967295)while(1){d=In(a|0,b|0,10,0)|0;c=c+-1|0;tb(c>>0|0,d&255|48|0,1);d=a;a=Hn(a|0,b|0,10,0)|0;if(!(b>>>0>9|(b|0)==9&d>>>0>4294967295))break;else b=z}if(a)while(1){c=c+-1|0;tb(c>>0|0,(a>>>0)%10|0|48|0,1);if(a>>>0<10)break;else a=(a>>>0)/10|0}return c|0}function Zl(a){a=a|0;return gm(a,23056)|0}function _l(a,b){a=a|0;b=b|0;var c=0,d=0;c=(b|0)!=0;a:do if(c&(a&3|0)!=0)while(1){if(!(vb(a>>0|0,1,0)|0))break a;a=a+1|0;b=b+-1|0;c=(b|0)!=0;if(!(c&(a&3|0)!=0)){d=4;break}}else d=4;while(0);b:do if((d|0)==4)if(c){if(vb(a>>0|0,1,0)|0){c:do if(b>>>0>3)while(1){c=vb(a|0,4,0)|0|0;if((c&-2139062144^-2139062144)&c+-16843009|0)break;a=a+4|0;b=b+-4|0;if(b>>>0<=3){d=10;break c}}else d=10;while(0);if((d|0)==10)if(!b){b=0;break}while(1){if(!(vb(a>>0|0,1,0)|0))break b;a=a+1|0;b=b+-1|0;if(!b){b=0;break}}}}else b=0;while(0);return (b|0?a:0)|0}function $l(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;g=l;l=l+256|0;if((l|0)>=(m|0))X(256);f=g;if((c|0)>(d|0)&(e&73728|0)==0){e=c-d|0;On(f|0,b|0,(e>>>0<256?e:256)|0)|0;if(e>>>0>255){d=e;do{Tl(a,f,256);d=d+-256|0}while(d>>>0>255);e=e&255}Tl(a,f,e)}l=g;return}function am(a,b){a=a|0;b=b|0;if(!a)a=0;else a=fm(a,b)|0;return a|0}function bm(a,b,c,d,e,f){a=a|0;b=+b;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,n=0,o=0,p=0.0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,A=0,B=0,C=0,D=0,E=0,F=0;F=l;l=l+560|0;if((l|0)>=(m|0))X(560);i=F+8|0;s=F;E=F+524|0;D=E;j=F+512|0;tb(s|0,0|0,4);C=j+12|0;cm(b)|0;if((z|0)<0){B=1;y=19842;b=-b}else{B=(e&2049|0)!=0&1;y=(e&2048|0)==0?((e&1|0)==0?19843:19848):19845}cm(b)|0;A=z&2146435072;do if(A>>>0<2146435072|(A|0)==2146435072&0<0){p=+dm(b,s)*2.0;g=p!=0.0;if(g)tb(s|0,(vb(s|0,4,0)|0|0)+-1|0,4);u=f|32;if((u|0)==97){q=f&32;o=(q|0)==0?y:y+9|0;n=B|2;g=12-d|0;do if(!(d>>>0>11|(g|0)==0)){b=8.0;do{g=g+-1|0;b=b*16.0}while((g|0)!=0);if((vb(o>>0|0,1,0)|0|0)==45){b=-(b+(-p-b));break}else{b=p+b-b;break}}else b=p;while(0);h=vb(s|0,4,0)|0|0;g=(h|0)<0?0-h|0:h;g=Yl(g,((g|0)<0)<<31>>31,C)|0;if((g|0)==(C|0)){g=j+11|0;tb(g>>0|0,48|0,1)}tb(g+-1>>0|0,(h>>31&2)+43|0,1);k=g+-2|0;tb(k>>0|0,f+15|0,1);i=(d|0)<1;j=(e&8|0)==0;h=E;while(1){B=~~b;g=h+1|0;tb(h>>0|0,vb(19877+B>>0|0,1,1)|0|q|0,1);b=(b-+(B|0))*16.0;if((g-D|0)==1?!(j&(i&b==0.0)):0){tb(g>>0|0,46|0,1);g=h+2|0}if(!(b!=0.0))break;else h=g}B=g-D|0;D=C-k|0;C=(d|0)!=0&(B+-2|0)<(d|0)?d+2|0:B;g=D+n+C|0;$l(a,32,c,g,e);Tl(a,o,n);$l(a,48,c,g,e^65536);Tl(a,E,B);$l(a,48,C-B|0,0,0);Tl(a,k,D);$l(a,32,c,g,e^8192);break}h=(d|0)<0?6:d;if(g){g=(vb(s|0,4,0)|0|0)+-28|0;tb(s|0,g|0,4);b=p*268435456.0}else{g=vb(s|0,4,0)|0|0;b=p}A=(g|0)<0?i:i+288|0;i=A;do{w=~~b>>>0;tb(i|0,w|0,4);i=i+4|0;b=(b-+(w>>>0))*1.0e9}while(b!=0.0);if((g|0)>0){j=A;k=i;while(1){n=(g|0)<29?g:29;g=k+-4|0;if(g>>>0>=j>>>0){i=0;do{v=Kn(vb(g|0,4,0)|0|0,0,n|0)|0;v=Dn(v|0,z|0,i|0,0)|0;w=z;t=In(v|0,w|0,1e9,0)|0;tb(g|0,t|0,4);i=Hn(v|0,w|0,1e9,0)|0;g=g+-4|0}while(g>>>0>=j>>>0);if(i){j=j+-4|0;tb(j|0,i|0,4)}}i=k;while(1){if(i>>>0<=j>>>0)break;g=i+-4|0;if(!(vb(g|0,4,0)|0))i=g;else break}g=(vb(s|0,4,0)|0|0)-n|0;tb(s|0,g|0,4);if((g|0)>0)k=i;else break}}else j=A;if((g|0)<0){d=((h+25|0)/9|0)+1|0;r=(u|0)==102;do{q=0-g|0;q=(q|0)<9?q:9;if(j>>>0<i>>>0){n=(1<<q)+-1|0;k=1e9>>>q;o=0;g=j;do{w=vb(g|0,4,0)|0|0;tb(g|0,(w>>>q)+o|0,4);o=O(w&n,k)|0;g=g+4|0}while(g>>>0<i>>>0);g=(vb(j|0,4,0)|0|0)==0?j+4|0:j;if(!o){j=g;g=i}else{tb(i|0,o|0,4);j=g;g=i+4|0}}else{j=(vb(j|0,4,0)|0|0)==0?j+4|0:j;g=i}i=r?A:j;i=(g-i>>2|0)>(d|0)?i+(d<<2)|0:g;g=(vb(s|0,4,0)|0|0)+q|0;tb(s|0,g|0,4)}while((g|0)<0);g=j;d=i}else{g=j;d=i}w=A;if(g>>>0<d>>>0){i=(w-g>>2)*9|0;k=vb(g|0,4,0)|0|0;if(k>>>0>=10){j=10;do{j=j*10|0;i=i+1|0}while(k>>>0>=j>>>0)}}else i=0;r=(u|0)==103;t=(h|0)!=0;j=h-((u|0)!=102?i:0)+((t&r)<<31>>31)|0;if((j|0)<(((d-w>>2)*9|0)+-9|0)){k=j+9216|0;j=A+4+(((k|0)/9|0)+-1024<<2)|0;k=((k|0)%9|0)+1|0;if((k|0)<9){n=10;do{n=n*10|0;k=k+1|0}while((k|0)!=9)}else n=10;o=vb(j|0,4,0)|0|0;q=(o>>>0)%(n>>>0)|0;k=(j+4|0)==(d|0);if(!(k&(q|0)==0)){p=(((o>>>0)/(n>>>0)|0)&1|0)==0?9007199254740992.0:9007199254740994.0;v=(n|0)/2|0;b=q>>>0<v>>>0?.5:k&(q|0)==(v|0)?1.0:1.5;if(B){v=(vb(y>>0|0,1,0)|0|0)==45;p=v?-p:p;b=v?-b:b}k=o-q|0;tb(j|0,k|0,4);if(p+b!=p){v=k+n|0;tb(j|0,v|0,4);if(v>>>0>999999999){i=j;while(1){j=i+-4|0;tb(i|0,0|0,4);if(j>>>0<g>>>0){g=g+-4|0;tb(g|0,0|0,4)}v=(vb(j|0,4,0)|0|0)+1|0;tb(j|0,v|0,4);if(v>>>0>999999999)i=j;else break}}i=(w-g>>2)*9|0;n=vb(g|0,4,0)|0|0;if(n>>>0>=10){k=10;do{k=k*10|0;i=i+1|0}while(n>>>0>=k>>>0)}}}u=j+4|0;v=g;g=d>>>0>u>>>0?u:d}else{v=g;g=d}u=g;while(1){if(u>>>0<=v>>>0){s=0;break}g=u+-4|0;if(!(vb(g|0,4,0)|0))u=g;else{s=1;break}}d=0-i|0;do if(r){g=((t^1)&1)+h|0;if((g|0)>(i|0)&(i|0)>-5){h=g+-1-i|0;k=f+-1|0}else{h=g+-1|0;k=f+-2|0}g=e&8;if(!g){if(s?(x=vb(u+-4|0,4,0)|0|0,(x|0)!=0):0)if(!((x>>>0)%10|0)){g=10;j=0;do{g=g*10|0;j=j+1|0}while(!((x>>>0)%(g>>>0)|0|0))}else j=0;else j=9;g=((u-w>>2)*9|0)+-9|0;if((k|32|0)==102){f=g-j|0;f=(f|0)>0?f:0;q=0;h=(h|0)<(f|0)?h:f;break}else{f=g+i-j|0;f=(f|0)>0?f:0;q=0;h=(h|0)<(f|0)?h:f;break}}else q=g}else{q=e&8;k=f}while(0);r=h|q;n=(r|0)!=0&1;o=(k|32|0)==102;if(o){t=0;g=(i|0)>0?i:0}else{g=(i|0)<0?d:i;g=Yl(g,((g|0)<0)<<31>>31,C)|0;j=C;if((j-g|0)<2)do{g=g+-1|0;tb(g>>0|0,48|0,1)}while((j-g|0)<2);tb(g+-1>>0|0,(i>>31&2)+43|0,1);g=g+-2|0;tb(g>>0|0,k|0,1);t=g;g=j-g|0}g=B+1+h+n+g|0;$l(a,32,c,g,e);Tl(a,y,B);$l(a,48,c,g,e^65536);if(o){n=v>>>0>A>>>0?A:v;q=E+9|0;o=q;k=E+8|0;j=n;do{i=Yl(vb(j|0,4,0)|0|0,0,q)|0;if((j|0)==(n|0)){if((i|0)==(q|0)){tb(k>>0|0,48|0,1);i=k}}else if(i>>>0>E>>>0){On(E|0,48,i-D|0)|0;do i=i+-1|0;while(i>>>0>E>>>0)}Tl(a,i,o-i|0);j=j+4|0}while(j>>>0<=A>>>0);if(r|0)Tl(a,19893,1);if(j>>>0<u>>>0&(h|0)>0)while(1){i=Yl(vb(j|0,4,0)|0|0,0,q)|0;if(i>>>0>E>>>0){On(E|0,48,i-D|0)|0;do i=i+-1|0;while(i>>>0>E>>>0)}Tl(a,i,(h|0)<9?h:9);j=j+4|0;i=h+-9|0;if(!(j>>>0<u>>>0&(h|0)>9)){h=i;break}else h=i}$l(a,48,h+9|0,9,0)}else{s=s?u:v+4|0;if((h|0)>-1){r=E+9|0;d=(q|0)==0;q=r;k=0-D|0;o=E+8|0;n=v;do{i=Yl(vb(n|0,4,0)|0|0,0,r)|0;if((i|0)==(r|0)){tb(o>>0|0,48|0,1);i=o}do if((n|0)==(v|0)){j=i+1|0;Tl(a,i,1);if(d&(h|0)<1){i=j;break}Tl(a,19893,1);i=j}else{if(i>>>0<=E>>>0)break;On(E|0,48,i+k|0)|0;do i=i+-1|0;while(i>>>0>E>>>0)}while(0);D=q-i|0;Tl(a,i,(h|0)>(D|0)?D:h);h=h-D|0;n=n+4|0}while(n>>>0<s>>>0&(h|0)>-1)}$l(a,48,h+18|0,18,0);Tl(a,t,C-t|0)}$l(a,32,c,g,e^8192)}else{E=(f&32|0)!=0;g=B+3|0;$l(a,32,c,g,e&-65537);Tl(a,y,B);Tl(a,b!=b|0.0!=0.0?(E?19869:19873):E?19861:19865,3);$l(a,32,c,g,e^8192)}while(0);l=F;return ((g|0)<(c|0)?c:g)|0}function cm(a){a=+a;var b=0;ub(j|0,+a,8);b=vb(j|0,4,0)|0|0;z=vb(j+4|0,4,0)|0|0;return b|0}function dm(a,b){a=+a;b=b|0;return +(+em(a,b))}function em(a,b){a=+a;b=b|0;var c=0,d=0,e=0;ub(j|0,+a,8);c=vb(j|0,4,0)|0|0;d=vb(j+4|0,4,0)|0|0;e=Jn(c|0,d|0,52)|0;switch(e&2047){case 0:{if(a!=0.0){a=+em(a*18446744073709551616.0,b);c=(vb(b|0,4,0)|0|0)+-64|0}else c=0;tb(b|0,c|0,4);break}case 2047:break;default:{tb(b|0,(e&2047)+-1022|0,4);tb(j|0,c|0,4);tb(j+4|0,d&-2146435073|1071644672|0,4);a=+(+wb(j|0,8))}}return +a}function fm(a,b){a=a|0;b=b|0;do if(a){if(b>>>0<128){tb(a>>0|0,b|0,1);a=1;break}if(!(vb(5764*4|0,4,0)|0))if((b&-128|0)==57216){tb(a>>0|0,b|0,1);a=1;break}else{tb(5770*4|0,84|0,4);a=-1;break}if(b>>>0<2048){tb(a>>0|0,b>>>6|192|0,1);tb(a+1>>0|0,b&63|128|0,1);a=2;break}if(b>>>0<55296|(b&-8192|0)==57344){tb(a>>0|0,b>>>12|224|0,1);tb(a+1>>0|0,b>>>6&63|128|0,1);tb(a+2>>0|0,b&63|128|0,1);a=3;break}if((b+-65536|0)>>>0<1048576){tb(a>>0|0,b>>>18|240|0,1);tb(a+1>>0|0,b>>>12&63|128|0,1);tb(a+2>>0|0,b>>>6&63|128|0,1);tb(a+3>>0|0,b&63|128|0,1);a=4;break}else{tb(5770*4|0,84|0,4);a=-1;break}}else a=1;while(0);return a|0}function gm(a,b){a=a|0;b=b|0;var c=0,d=0;c=0;while(1){if((vb(19895+c>>0|0,1,1)|0|0)==(a|0)){d=2;break}c=c+1|0;if((c|0)==87){c=87;a=19983;d=5;break}}if((d|0)==2)if(!c)c=19983;else{a=19983;d=5}if((d|0)==5)while(1){do{d=a;a=a+1|0}while((vb(d>>0|0,1,0)|0|0)!=0);c=c+-1|0;if(!c){c=a;break}else d=5}return hm(c,vb(b+20|0,4,0)|0|0)|0}function hm(a,b){a=a|0;b=b|0;return im(a,b)|0}function im(a,b){a=a|0;b=b|0;if(!b)b=0;else b=jm(vb(b|0,4,0)|0|0,vb(b+4|0,4,0)|0|0,a)|0;return (b|0?b:a)|0}function jm(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;m=(vb(a|0,4,0)|0|0)+1794895138|0;f=km(vb(a+8|0,4,0)|0|0,m)|0;d=km(vb(a+12|0,4,0)|0|0,m)|0;e=km(vb(a+16|0,4,0)|0|0,m)|0;a:do if((f>>>0<b>>>2>>>0?(l=b-(f<<2)|0,d>>>0<l>>>0&e>>>0<l>>>0):0)?((e|d)&3|0)==0:0){l=d>>>2;k=e>>>2;j=0;while(1){i=f>>>1;h=j+i|0;g=h<<1;e=g+l|0;d=km(vb(a+(e<<2)|0,4,0)|0|0,m)|0;e=km(vb(a+(e+1<<2)|0,4,0)|0|0,m)|0;if(!(e>>>0<b>>>0&d>>>0<(b-e|0)>>>0)){d=0;break a}if(vb(a+(e+d)>>0|0,1,0)|0|0){d=0;break a}d=Nl(c,a+e|0)|0;if(!d)break;d=(d|0)<0;if((f|0)==1){d=0;break a}else{j=d?j:h;f=d?i:f-i|0}}d=g+k|0;e=km(vb(a+(d<<2)|0,4,0)|0|0,m)|0;d=km(vb(a+(d+1<<2)|0,4,0)|0|0,m)|0;if(d>>>0<b>>>0&e>>>0<(b-d|0)>>>0)d=(vb(a+(d+e)>>0|0,1,0)|0|0)==0?a+d|0:0;else d=0}else d=0;while(0);return d|0}function km(a,b){a=a|0;b=b|0;var c=0;c=Ln(a|0)|0;return ((b|0)==0?a:c)|0}function lm(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0;e=c+16|0;d=vb(e|0,4,0)|0|0;if(!d)if(!(mm(c)|0)){d=vb(e|0,4,0)|0|0;f=5}else d=0;else f=5;a:do if((f|0)==5){h=c+20|0;g=vb(h|0,4,0)|0|0;e=g;if((d-g|0)>>>0<b>>>0){d=db[(xb(vb(c+36|0,4,0)|0|0,31|0)|0)&31](c,a,b)|0;break}b:do if((vb(c+75>>0|0,1,0)|0|0)>-1){g=b;while(1){if(!g){f=e;c=0;e=b;d=a;break b}d=g+-1|0;if((vb(a+d>>0|0,1,0)|0|0)==10)break;else g=d}d=db[(xb(vb(c+36|0,4,0)|0|0,31|0)|0)&31](c,a,g)|0;if(d>>>0<g>>>0)break a;f=vb(h|0,4,0)|0|0;c=g;e=b-g|0;d=a+g|0}else{f=e;c=0;e=b;d=a}while(0);Mn(f|0,d|0,e|0)|0;tb(h|0,(vb(h|0,4,0)|0|0)+e|0,4);d=c+e|0}while(0);return d|0}function mm(a){a=a|0;var b=0,c=0;c=a+74|0;b=vb(c>>0|0,1,0)|0|0;tb(c>>0|0,b+255|b|0,1);b=vb(a|0,4,0)|0|0;if(!(b&8)){tb(a+8|0,0|0,4);tb(a+4|0,0|0,4);b=vb(a+44|0,4,0)|0|0;tb(a+28|0,b|0,4);tb(a+20|0,b|0,4);tb(a+16|0,b+(vb(a+48|0,4,0)|0|0)|0,4);b=0}else{tb(a|0,b|32|0,4);b=-1}return b|0}function nm(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=a+20|0;e=vb(d|0,4,0)|0|0;a=(vb(a+16|0,4,0)|0|0)-e|0;a=a>>>0>c>>>0?c:a;Mn(e|0,b|0,a|0)|0;tb(d|0,(vb(d|0,4,0)|0|0)+a|0,4);return c|0}function om(a){a=+a;var b=0,c=0,d=0,e=0,f=0,g=0,h=0;ub(j|0,+a,8);g=vb(j|0,4,0)|0|0;e=vb(j+4|0,4,0)|0|0;c=Jn(g|0,e|0,52)|0;c=c&2047;h=e&-2147483648;a:do if((c|0)==2047)a=a/a;else{b=Kn(g|0,e|0,1)|0;d=z;if(!(d>>>0>2145386496|(d|0)==2145386496&b>>>0>0))return +((b|0)==0&(d|0)==2145386496?a*0.0:a);if(!c){b=Kn(g|0,e|0,12)|0;c=z;if((c|0)>-1|(c|0)==-1&b>>>0>4294967295){d=c;c=0;do{c=c+-1|0;b=Kn(b|0,d|0,1)|0;d=z}while((d|0)>-1|(d|0)==-1&b>>>0>4294967295)}else c=0;g=Kn(g|0,e|0,1-c|0)|0;f=z}else f=e&1048575|1048576;b=Dn(g|0,f|0,0,-1048576)|0;d=z;e=(d|0)>-1|(d|0)==-1&b>>>0>4294967295;b:do if((c|0)>1023){while(1){if(e){if((b|0)==0&(d|0)==0)break}else{b=g;d=f}g=Kn(b|0,d|0,1)|0;f=z;c=c+-1|0;b=Dn(g|0,f|0,0,-1048576)|0;d=z;e=(d|0)>-1|(d|0)==-1&b>>>0>4294967295;if((c|0)<=1023)break b}a=a*0.0;break a}while(0);if(e){if((b|0)==0&(d|0)==0){a=a*0.0;break}}else{d=f;b=g}if(d>>>0<1048576|(d|0)==1048576&b>>>0<0)do{b=Kn(b|0,d|0,1)|0;d=z;c=c+-1|0}while(d>>>0<1048576|(d|0)==1048576&b>>>0<0);if((c|0)>0){g=Dn(b|0,d|0,0,-1048576)|0;b=z;c=Kn(c|0,0,52)|0;b=b|z;c=g|c}else{c=Jn(b|0,d|0,1-c|0)|0;b=z}tb(j|0,c|0,4);tb(j+4|0,b|h|0,4);a=+(+wb(j|0,8))}while(0);return +a}function pm(a){a=a|0;var b=0,c=0,d=0;d=a;a:do if(!(d&3)){b=a;c=4}else{b=d;while(1){if(!(vb(a>>0|0,1,0)|0))break a;a=a+1|0;b=a;if(!(b&3)){b=a;c=4;break}}}while(0);if((c|0)==4){while(1){a=vb(b|0,4,0)|0|0;if(!((a&-2139062144^-2139062144)&a+-16843009))b=b+4|0;else break}if((a&255)<<24>>24)do b=b+1|0;while((vb(b>>0|0,1,0)|0|0)!=0)}return b-d|0}function qm(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;c=l;l=l+16|0;if((l|0)>=(m|0))X(16);b=c;tb(b|0,d|0,4);Pl(a,b);l=c;return}function rm(a){a=+a;var b=0,c=0,d=0,e=0,f=0.0,g=0.0,h=0.0,i=0.0,k=0.0;ub(j|0,+a,8);c=vb(j|0,4,0)|0|0;b=vb(j+4|0,4,0)|0|0;d=(b|0)<0;do if(d|b>>>0<1048576){if((c|0)==0&(b&2147483647|0)==0){a=-1.0/(a*a);break}if(d){a=(a-a)/0.0;break}else{ub(j|0,+(a*18014398509481984.0),8);b=vb(j+4|0,4,0)|0|0;d=vb(j|0,4,0)|0|0;c=-1077;e=9;break}}else if(b>>>0<=2146435071)if((c|0)==0&0==0&(b|0)==1072693248)a=0.0;else{d=c;c=-1023;e=9}while(0);if((e|0)==9){e=b+614242|0;tb(j|0,d|0,4);tb(j+4|0,(e&1048575)+1072079006|0,4);h=+(+wb(j|0,8))+-1.0;g=h*(h*.5);i=h/(h+2.0);k=i*i;a=k*k;ub(j|0,+(h-g),8);d=vb(j+4|0,4,0)|0|0;tb(j|0,0|0,4);tb(j+4|0,d|0,4);f=+(+wb(j|0,8));a=h-f-g+i*(g+(a*(a*(a*.15313837699209373+.22222198432149784)+.3999999999940942)+k*(a*(a*(a*.14798198605116586+.1818357216161805)+.2857142874366239)+.6666666666666735)));k=f*.4342944818781689;g=+(c+(e>>>20)|0);i=g*.30102999566361177;h=i+k;a=h+(k+(i-h)+(a*.4342944818781689+(g*3.694239077158931e-13+(f+a)*2.5082946711645275e-11)))}return +a}function sm(){lm(19340,20,10188)|0;return}function tm(){var a=0,b=0,c=0,d=0;d=l;l=l+16|0;if((l|0)>=(m|0))X(16);c=d;tb(c>>0|0,10|0,1);a=vb(2551*4|0,4,0)|0|0;if(!a)if(!(mm(10188)|0)){a=vb(2551*4|0,4,0)|0|0;b=4}else a=-1;else b=4;do if((b|0)==4){b=vb(2552*4|0,4,0)|0|0;if(!(b>>>0>=a>>>0|(vb(10263|0,1,0)|0|0)==10)){tb(2552*4|0,b+1|0,4);tb(b>>0|0,10|0,1);a=10;break}if((db[(xb(vb(10224|0,4,0)|0|0,31|0)|0)&31](10188,c,1)|0)==1)a=vb(c>>0|0,1,1)|0|0;else a=-1}while(0);l=d;return a|0}function um(){La(23084);return}function vm(){Sa(23084);return}function wm(a){a=a|0;if(!a){if(!(vb(2609*4|0,4,0)|0))a=0;else a=wm(vb(2609*4|0,4,0)|0|0)|0;um();vm()}else a=xm(a)|0;return a|0}function xm(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;g=a+20|0;f=a+28|0;if((vb(g|0,4,0)|0|0)>>>0>(vb(f|0,4,0)|0|0)>>>0?(db[(xb(vb(a+36|0,4,0)|0|0,31|0)|0)&31](a,0,0)|0,(vb(g|0,4,0)|0|0)==0):0)b=-1;else{e=a+4|0;b=vb(e|0,4,0)|0|0;d=a+8|0;c=vb(d|0,4,0)|0|0;if(b>>>0<c>>>0)db[(xb(vb(a+40|0,4,0)|0|0,31|0)|0)&31](a,b-c|0,1)|0;tb(a+16|0,0|0,4);tb(f|0,0|0,4);tb(g|0,0|0,4);tb(d|0,0|0,4);tb(e|0,0|0,4);b=0}return b|0}function ym(a,b,c){a=a|0;b=b|0;c=c|0;a=l;l=l+16|0;if((l|0)>=(m|0))X(16);b=a;tb(b|0,c|0,4);Ql(10188,19324,b);l=a;return}function zm(a){a=a|0;return Am(a,(pm(a)|0)+1|0)|0}function Am(a,b){a=a|0;b=b|0;var c=0;c=b;do{if(!c){b=0;break}c=c+-1|0;b=a+c|0}while((vb(b>>0|0,1,0)|0|0)!=46);return b|0}function Bm(){var a=0,b=0,c=0;do if((vb(2566*4|0,4,0)|0|0)>=0?(Sl()|0)!=0:0){if((vb(10263|0,1,0)|0|0)!=10?(b=vb(2552*4|0,4,0)|0|0,b>>>0<(vb(2551*4|0,4,0)|0|0)>>>0):0){tb(2552*4|0,b+1|0,4);tb(b>>0|0,10|0,1);break}tm()|0}else c=3;while(0);do if((c|0)==3){if((vb(10263|0,1,0)|0|0)!=10?(a=vb(2552*4|0,4,0)|0|0,a>>>0<(vb(2551*4|0,4,0)|0|0)>>>0):0){tb(2552*4|0,a+1|0,4);tb(a>>0|0,10|0,1);break}tm()|0}while(0);return}function Cm(){var a=0,b=0;a=Ba(8)|0;o=0;ua(23,a|0,21787);b=o;o=0;if(b&1){b=Fa()|0;Ha(a|0);Ma(b|0)}else{tb(a|0,10696|0,4);Ja(a|0,384,51)}}function Dm(a){a=a|0;var b=0,c=0;b=(a|0)==0?1:a;while(1){c=zl(b)|0;if(c|0){a=6;break}a=zn()|0;if(!a){a=5;break}fb[(xb(a|0,7|0)|0)&7]()}if((a|0)==5){c=Ba(4)|0;yn(c);Ja(c|0,352,49)}else if((a|0)==6)return c|0;return 0}function Em(a){a=a|0;Al(a);return}function Fm(a,b){a=a|0;b=b|0;var c=0,d=0;d=pm(b)|0;c=Dm(d+13|0)|0;tb(c|0,d|0,4);tb(c+4|0,d|0,4);tb(c+8|0,0|0,4);c=Gm(c)|0;Mn(c|0,b|0,d+1|0)|0;tb(a|0,c|0,4);return}function Gm(a){a=a|0;return a+12|0}function Hm(a,b){a=a|0;b=b|0;tb(a|0,10676|0,4);Fm(a+4|0,b);return}function Im(){var a=0,b=0,c=0,d=0,e=0,f=0,g=0,h=0;a=l;l=l+48|0;if((l|0)>=(m|0))X(48);g=a+32|0;c=a+24|0;h=a+16|0;f=a;e=a+36|0;a=Jm()|0;if(a|0?(d=vb(a|0,4,0)|0|0,d|0):0){b=d+48|0;a=vb(b|0,4,0)|0|0;b=vb(b+4|0,4,0)|0|0;if(!((a&-256|0)==1126902528&(b|0)==1129074247)){tb(c|0,21930|0,4);Km(21880,c)}if((a|0)==1126902529&(b|0)==1129074247)a=vb(d+44|0,4,0)|0|0;else a=d+80|0;tb(e|0,a|0,4);d=vb(d|0,4,0)|0|0;a=vb(d+4|0,4,0)|0|0;if(Pm(288,d,e)|0){h=vb(e|0,4,0)|0|0;h=bb[(xb(vb((vb(h|0,4,0)|0|0)+8|0,4,0)|0|0,15|0)|0)&15](h)|0;tb(f|0,21930|0,4);tb(f+4|0,a|0,4);tb(f+8|0,h|0,4);Km(21794,f)}else{tb(h|0,21930|0,4);tb(h+4|0,a|0,4);Km(21839,h)}}Km(21918,g)}function Jm(){var a=0,b=0;a=l;l=l+16|0;if((l|0)>=(m|0))X(16);if(!(Za(23092,4)|0)){b=Xa(vb(5774*4|0,4,0)|0|0)|0;l=a;return b|0}else Km(22069,a);return 0}function Km(a,b){a=a|0;b=b|0;var c=0;c=l;l=l+16|0;if((l|0)>=(m|0))X(16);tb(c|0,b|0,4);Ql(10188,a,c);Bm();Ta()}function Lm(a){a=a|0;return}function Mm(a){a=a|0;Em(a);return}function Nm(a){a=a|0;return}function Om(a){a=a|0;return}
            function ih(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0;la=l;l=l+16|0;if((l|0)>=(m|0))X(16);ja=la+8|0;ia=la;qh(a,b);ga=a+524|0;aa=ga;b=vb(aa+4|0,4,0)|0|0;fa=ja;tb(fa|0,vb(aa|0,4,0)|0|0,4);tb(fa+4|0,b|0,4);fa=a+520|0;tb(fa|0,ja|0,4);aa=a+540|0;ha=aa;da=ha;ha=ha+4|0;ha=vb(ha>>0|0,1,1)|0|(vb(ha+1>>0|0,1,1)|0)<<8|(vb(ha+2>>0|0,1,1)|0)<<16|(vb(ha+3>>0|0,1,1)|0)<<24;$=ia;tb($|0,vb(da>>0|0,1,1)|0|(vb(da+1>>0|0,1,1)|0)<<8|(vb(da+2>>0|0,1,1)|0)<<16|(vb(da+3>>0|0,1,1)|0)<<24|0,4);tb($+4|0,ha|0,4);ha=ja+4|0;$=vb(a+512|0,4,0)|0|0;da=a+532|0;j=vb(da|0,2,0)|0|0;ea=a+534|0;k=vb(ea|0,2,0)|0|0;ba=a+536|0;f=vb(ba|0,2,0)|0|0;ca=a+538|0;e=vb(ca|0,2,0)|0|0;h=vb(aa+7>>0|0,1,1)|0|0;d=vb($+(j&65535)>>0|0,1,0)|0|0;i=d&255;c=(vb(16535+i>>0|0,1,1)|0|0)+b|0;if((c|b|0)>=0){Y=h;Z=ia+7|0;_=f;$=e;ka=j;W=b;a=k;tb(ha|0,W|0,4);ha=Y&255;tb(Z>>0|0,ha|0,1);tb(ba|0,_|0,2);tb(ca|0,$|0,2);tb(ea|0,a|0,2);tb(da|0,ka|0,2);ka=ia;ha=ka;ha=vb(ha|0,4,0)|0|0;ka=ka+4|0;ka=vb(ka|0,4,0)|0|0;ia=aa;ea=ia;tb(ea>>0|0,ha|0,1);tb(ea+1>>0|0,ha>>8|0,1);tb(ea+2>>0|0,ha>>16|0,1);tb(ea+3>>0|0,ha>>24|0,1);ia=ia+4|0;tb(ia>>0|0,ka|0,1);tb(ia+1>>0|0,ka>>8|0,1);tb(ia+2>>0|0,ka>>16|0,1);tb(ia+3>>0|0,ka>>24|0,1);ka=ja;ia=ka;ia=vb(ia|0,4,0)|0|0;ka=ka+4|0;ka=vb(ka|0,4,0)|0|0;ja=ga;ha=ja;tb(ha|0,ia|0,4);ja=ja+4|0;tb(ja|0,ka|0,4);tb(fa|0,ga|0,4);l=la;return}u=a+554|0;v=ia+6|0;R=a+548+7|0;Z=ia+4|0;N=ia+1|0;S=ia+4|0;w=ia+-24|0;F=ia+-184|0;G=ia+-1|0;H=ia+-160|0;I=ia+-176|0;J=ia+-168|0;K=ia+-112|0;L=ia+-8|0;P=ia+2|0;O=a+548|0;Q=a+550|0;T=a+552|0;V=a+556|0;W=a+557|0;x=ia+-16|0;y=ia+-32|0;z=ia+-48|0;A=ia+-40|0;B=ia+-56|0;g=ia+7|0;C=ia+-9|0;U=a+559|0;_=a+558|0;Y=a+560|0;D=ia+-96|0;E=ia+-104|0;M=a+255|0;t=d;n=i;r=j;a:while(1){d=r+1<<16>>16;i=d&65535;j=$+i|0;s=vb(j>>0|0,1,0)|0|0;b=s&255;b:do switch(t<<24>>24){case 118:{ka=266;break a}case 127:case 109:case 100:case 91:case 82:case 73:case 64:case 0:{b=k;break}case 8:{b=vb(u>>0|0,1,0)|0|0;tb(u>>0|0,vb(v>>0|0,1,0)|0|0|0,1);tb(v>>0|0,b|0,1);b=vb(R>>0|0,1,1)|0|0;tb(R>>0|0,h|0,1);h=b;b=k;break}case -45:{d=vb(v>>0|0,1,1)|0|0;rh(a,(vb(ja|0,4,0)|0|0)+c|0,d<<8|s&255,d);d=r+2<<16>>16;b=k;break}case 46:{tb(Z>>0|0,s|0,1);d=r+2<<16>>16;b=k;break}case 62:{tb(v>>0|0,s|0,1);d=r+2<<16>>16;b=k;break}case 58:{tb(v>>0|0,vb($+((sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535)>>0|0,1,0)|0|0|0,1);d=i+2&65535;b=k;break}case 32:{d=r+2<<16>>16;if(!(h&64)){d=(s<<24>>24)+(d&65535)&65535;b=k}else ka=4;break}case 40:{d=r+2<<16>>16;if(!(h&64))ka=4;else{d=(s<<24>>24)+(d&65535)&65535;b=k}break}case 48:{d=r+2<<16>>16;if(!(h&1)){d=(s<<24>>24)+(d&65535)&65535;b=k}else ka=4;break}case 56:{d=r+2<<16>>16;if(!(h&1))ka=4;else{d=(s<<24>>24)+(d&65535)&65535;b=k}break}case 24:{d=(s<<24>>24)+(r+2&65535)&65535;b=k;break}case 16:{t=(vb(N>>0|0,1,1)|0|0)+-1|0;tb(N>>0|0,t|0,1);d=r+2<<16>>16;if(!t)ka=4;else{d=(s<<24>>24)+(d&65535)&65535;b=k}break}case -62:{if(!(h&64)){d=(sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535;b=k}else ka=7;break}case -54:{if(!(h&64))ka=7;else{d=(sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535;b=k}break}case -46:{if(!(h&1)){d=(sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535;b=k}else ka=7;break}case -38:{if(!(h&1))ka=7;else{d=(sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535;b=k}break}case -30:{if(!(h&4)){d=(sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535;b=k}else ka=7;break}case -22:{if(!(h&4))ka=7;else{d=(sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535;b=k}break}case -14:{if(!(h&128)){d=(sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535;b=k}else ka=7;break}case -6:{if(!(h&128))ka=7;else{d=(sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535;b=k}break}case -61:{d=(sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535;b=k;break}case -23:{d=vb(S|0,2,0)|0|0;b=k;break}case -64:{if(!(h&64))ka=59;else{c=c+-6|0;b=k}break}case -56:{if(!(h&64)){c=c+-6|0;b=k}else ka=59;break}case -48:{if(!(h&1))ka=59;else{c=c+-6|0;b=k}break}case -40:{if(!(h&1)){c=c+-6|0;b=k}else ka=59;break}case -32:{if(!(h&4))ka=59;else{c=c+-6|0;b=k}break}case -24:{if(!(h&4)){c=c+-6|0;b=k}else ka=59;break}case -16:{if(!(h&128))ka=59;else{c=c+-6|0;b=k}break}case -8:{if(!(h&128)){c=c+-6|0;b=k}else ka=59;break}case -55:{ka=59;break}case -60:{if(!(h&64))ka=68;else ka=6;break}case -52:{if(!(h&64))ka=6;else ka=68;break}case -44:{if(!(h&1))ka=68;else ka=6;break}case -36:{if(!(h&1))ka=6;else ka=68;break}case -28:{if(!(h&4))ka=68;else ka=6;break}case -20:{if(!(h&4))ka=6;else ka=68;break}case -12:{if(!(h&128))ka=68;else ka=6;break}case -4:{if(!(h&128))ka=6;else ka=68;break}case -51:{ka=68;break}case -1:{b=i+-1|0;if((b|0)>65535){d=b&65535;c=c+-11|0;b=k}else ka=71;break}case -9:case -17:case -25:case -33:case -41:case -49:case -57:{ka=71;break}case -11:{b=((vb(v>>0|0,1,1)|0|0)<<8)+h&65535;ka=74;break}case -27:case -43:case -59:{b=vb(w+(n>>>3)|0,2,0)|0|0;ka=74;break}case -15:{b=k&65535;h=vb($+b>>0|0,1,1)|0|0;tb(v>>0|0,vb($+(b+1)>>0|0,1,0)|0|0|0,1);b=b+2&65535;break}case -31:case -47:case -63:{b=k&65535;t=$+b|0;tb(w+(n>>>3)|0,sh(vb(t>>0|0,1,0)|0|0,vb(t+1>>0|0,1,0)|0|0)|0|0,2);b=b+2&65535;break}case -122:case -106:{h=h&-2;ka=78;break}case -114:case -98:{ka=78;break}case -58:case -42:{h=h&-2;ka=80;break}case -50:case -34:{ka=80;break}case -121:case -123:case -124:case -125:case -126:case -127:case -128:case -105:case -107:case -108:case -109:case -110:case -111:case -112:{h=h&-2;ka=82;break}case -113:case -115:case -116:case -117:case -118:case -119:case -120:case -97:case -99:case -100:case -101:case -102:case -103:case -104:{ka=82;break}case -66:{b=vb($+(vb(S|0,2,1)|0|0)>>0|0,1,1)|0|0;ka=87;break}case -2:{d=r+2<<16>>16;ka=87;break}case -65:case -67:case -68:case -69:case -70:case -71:case -72:{b=vb(F+(n^1)>>0|0,1,1)|0|0;ka=87;break}case 57:{b=k;ka=89;break}case 41:case 25:case 9:{b=vb(G+(n>>>3)|0,2,0)|0|0;ka=89;break}case 39:{s=vb(v>>0|0,1,0)|0|0;t=s&255;s=(s&255)>153|h;b=0-(s&1)&96;b=(h&16|0)!=0|(t&14)>>>0>9?b|6:b;b=((h&2|0)==0?b:0-b|0)+t|0;h=s&3|(vb(a+(b&255)>>0|0,1,1)|0|0)|(b^t)&16;tb(v>>0|0,b|0,1);b=k;break}case 52:{ka=$+(vb(S|0,2,1)|0|0)|0;b=(vb(ka>>0|0,1,1)|0|0)+1|0;tb(ka>>0|0,b|0,1);b=b&65535;ka=93;break}case 60:case 44:case 36:case 28:case 20:case 12:case 4:{ka=ia+(n>>>3^1)|0;b=(vb(ka>>0|0,1,0)|0|0)+1<<24>>24;tb(ka>>0|0,b|0,1);b=b&255;ka=93;break}case 53:{ka=$+(vb(S|0,2,1)|0|0)|0;i=(vb(ka>>0|0,1,1)|0|0)+65535|0;tb(ka>>0|0,i|0,1);i=i&65535;ka=96;break}case 61:case 45:case 37:case 29:case 21:case 13:case 5:{ka=ia+(n>>>3^1)|0;i=(vb(ka>>0|0,1,0)|0|0)+-1<<24>>24;tb(ka>>0|0,i|0,1);i=i&255;ka=96;break}case 35:case 19:case 3:{b=ia+(n>>>3)|0;tb(b|0,(vb(b|0,2,0)|0|0)+1<<16>>16|0,2);b=k;break}case 51:{b=(k&65535)+1&65535;break}case 43:case 27:case 11:{b=G+(n>>>3)|0;tb(b|0,(vb(b|0,2,0)|0|0)+-1<<16>>16|0,2);b=k;break}case 59:{b=(k&65535)+65535&65535;break}case -90:{b=vb($+(vb(S|0,2,1)|0|0)>>0|0,1,1)|0|0;ka=106;break}case -26:{d=r+2<<16>>16;ka=106;break}case -89:case -91:case -92:case -93:case -94:case -95:case -96:{b=vb(H+(n^1)>>0|0,1,1)|0|0;ka=106;break}case -74:{b=vb($+(vb(S|0,2,1)|0|0)>>0|0,1,1)|0|0;ka=110;break}case -10:{d=r+2<<16>>16;ka=110;break}case -73:case -75:case -76:case -77:case -78:case -79:case -80:{b=vb(I+(n^1)>>0|0,1,1)|0|0;ka=110;break}case -82:{b=vb($+(vb(S|0,2,1)|0|0)>>0|0,1,1)|0|0;ka=114;break}case -18:{d=r+2<<16>>16;ka=114;break}case -81:case -83:case -84:case -85:case -86:case -87:case -88:{b=vb(J+(n^1)>>0|0,1,1)|0|0;ka=114;break}case 119:case 117:case 116:case 115:case 114:case 113:case 112:{tb($+(vb(S|0,2,1)|0|0)>>0|0,vb(K+(n^1)>>0|0,1,0)|0|0|0,1);b=k;break}case 125:case 124:case 123:case 122:case 121:case 120:case 111:case 108:case 107:case 106:case 105:case 104:case 103:case 101:case 99:case 98:case 97:case 96:case 95:case 93:case 92:case 90:case 89:case 88:case 87:case 85:case 84:case 83:case 81:case 80:case 79:case 77:case 76:case 75:case 74:case 72:case 71:case 69:case 68:case 67:case 66:case 65:{tb(ia+(n>>>3&7^1)>>0|0,vb(ia+(n&7^1)>>0|0,1,0)|0|0|0,1);b=k;break}case 38:case 30:case 22:case 14:case 6:{tb(ia+(n>>>3^1)>>0|0,s|0,1);d=r+2<<16>>16;b=k;break}case 54:{tb($+(vb(S|0,2,1)|0|0)>>0|0,s|0,1);d=r+2<<16>>16;b=k;break}case 126:case 110:case 102:case 94:case 86:case 78:case 70:{tb(L+(n>>>3^1)>>0|0,vb($+(vb(S|0,2,1)|0|0)>>0|0,1,0)|0|0|0,1);b=k;break}case 33:case 17:case 1:{tb(ia+(n>>>3)|0,sh(s,vb(j+1>>0|0,1,0)|0|0)|0|0,2);d=i+2&65535;b=k;break}case 49:{d=i+2&65535;b=(sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535;break}case 42:{d=$+((sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535)|0;tb(S|0,sh(vb(d>>0|0,1,0)|0|0,vb(d+1>>0|0,1,0)|0|0)|0|0,2);d=i+2&65535;b=k;break}case 50:{tb($+((sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535)>>0|0,vb(v>>0|0,1,0)|0|0|0,1);d=i+2&65535;b=k;break}case 34:{th($+((sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535)|0,vb(S|0,2,1)|0|0);d=i+2&65535;b=k;break}case 18:case 2:{tb($+(vb(ia+(n>>>3)|0,2,1)|0|0)>>0|0,vb(v>>0|0,1,0)|0|0|0,1);b=k;break}case 26:case 10:{tb(v>>0|0,vb($+(vb(G+(n>>>3)|0,2,1)|0|0)>>0|0,1,0)|0|0|0,1);b=k;break}case -7:{b=vb(S|0,2,0)|0|0;break}case 7:{b=vb(v>>0|0,1,1)|0|0;b=b<<1|b>>>7;tb(v>>0|0,b|0,1);h=b&41|h&196;b=k;break}case 15:{t=vb(v>>0|0,1,1)|0|0;b=t>>>1;tb(v>>0|0,t<<7|b|0,1);h=t&1|h&196|b&40;b=k;break}case 23:{t=vb(v>>0|0,1,1)|0|0;b=t<<1;tb(v>>0|0,b|h&1|0,1);h=t>>>7|h&196|b&40;b=k;break}case 31:{t=vb(v>>0|0,1,1)|0|0;b=t>>>1;tb(v>>0|0,b|h<<7|0,1);h=t&1|h&196|b&40;b=k;break}case 47:{b=(vb(v>>0|0,1,1)|0|0)^65535;tb(v>>0|0,b|0,1);h=h&197|b&40|18;b=k;break}case 63:{h=(h<<4&16|h&197|(vb(v>>0|0,1,0)|0)&40)^1;b=k;break}case 55:{h=h&196|(vb(v>>0|0,1,0)|0)&40|1;b=k;break}case -37:{tb(v>>0|0,-1|0,1);d=r+2<<16>>16;b=k;break}case -29:{t=$+(k&65535)|0;b=(sh(vb(t>>0|0,1,0)|0|0,vb(t+1>>0|0,1,0)|0|0)|0)&65535;th(t,vb(S|0,2,1)|0|0);tb(S|0,b|0,2);b=k;break}case -21:{b=vb(S|0,2,0)|0|0;tb(S|0,vb(P|0,2,0)|0|0|0,2);tb(P|0,b|0,2);b=k;break}case -39:{b=vb(O|0,2,0)|0|0;tb(O|0,vb(ia|0,2,0)|0|0|0,2);tb(ia|0,b|0,2);b=vb(Q|0,2,0)|0|0;tb(Q|0,vb(P|0,2,0)|0|0|0,2);tb(P|0,b|0,2);b=vb(T|0,2,0)|0|0;tb(T|0,vb(S|0,2,0)|0|0|0,2);tb(S|0,b|0,2);b=k;break}case -13:{tb(V>>0|0,0|0,1);tb(W>>0|0,0|0,1);b=k;break}case -5:{tb(V>>0|0,1|0,1);tb(W>>0|0,1|0,1);b=k;break}case -53:{d=r+2<<16>>16;i=s&255;do switch(s<<24>>24){case 6:{i=vb(S|0,2,0)|0|0;c=c+7|0;ka=143;break b}case 7:case 5:case 4:case 3:case 2:case 1:case 0:{t=ia+(i^1)|0;b=vb(t>>0|0,1,1)|0|0;h=b>>>7;b=b<<1|h;h=vb(a+(b&255)>>0|0,1,1)|0|0|h;tb(t>>0|0,b|0,1);b=k;break b}case 22:{i=vb(S|0,2,0)|0|0;c=c+7|0;ka=146;break b}case 23:case 21:case 20:case 19:case 18:case 17:case 16:{t=x+(i^1)|0;b=(vb(t>>0|0,1,1)|0|0)<<1|h&1;h=vb(a+b>>0|0,1,1)|0|0;tb(t>>0|0,b|0,1);b=k;break b}case 38:{i=vb(S|0,2,0)|0|0;c=c+7|0;ka=149;break b}case 39:case 37:case 36:case 35:case 34:case 33:case 32:{t=y+(i^1)|0;b=(vb(t>>0|0,1,1)|0|0)<<1;h=vb(a+b>>0|0,1,1)|0|0;tb(t>>0|0,b|0,1);b=k;break b}case 54:{i=vb(S|0,2,0)|0|0;c=c+7|0;ka=152;break b}case 55:case 53:case 52:case 51:case 50:case 49:case 48:{t=z+(i^1)|0;b=(vb(t>>0|0,1,1)|0|0)<<1|1;h=vb(a+b>>0|0,1,1)|0|0;tb(t>>0|0,b|0,1);b=k;break b}case 14:{i=vb(S|0,2,0)|0|0;c=c+7|0;ka=155;break b}case 15:case 13:case 12:case 11:case 10:case 9:case 8:{t=L+(i^1)|0;h=vb(t>>0|0,1,1)|0|0;b=h<<7|h>>>1;h=h&1|(vb(a+(b&255)>>0|0,1,1)|0|0);tb(t>>0|0,b|0,1);b=k;break b}case 30:{i=vb(S|0,2,0)|0|0;c=c+7|0;ka=158;break b}case 31:case 29:case 28:case 27:case 26:case 25:case 24:{t=w+(i^1)|0;s=vb(t>>0|0,1,1)|0|0;b=s>>>1|h<<7;h=vb(a+(b&255)>>0|0,1,1)|0|0|s&1;tb(t>>0|0,b|0,1);b=k;break b}case 46:{i=vb(S|0,2,0)|0|0;c=c+7|0;ka=161;break b}case 47:case 45:case 44:case 43:case 42:case 41:case 40:{t=A+(i^1)|0;h=vb(t>>0|0,1,1)|0|0;b=h&128|h>>>1;h=h&1|(vb(a+b>>0|0,1,1)|0|0);tb(t>>0|0,b|0,1);b=k;break b}case 62:{i=vb(S|0,2,0)|0|0;c=c+7|0;ka=164;break b}case 63:case 61:case 60:case 59:case 58:case 57:case 56:{t=B+(i^1)|0;h=vb(t>>0|0,1,0)|0|0;b=(h&255)>>>1;h=(h&1|(vb(a+(b&255)>>0|0,1,0)|0))&255;tb(t>>0|0,b|0,1);b=k;break b}case 126:case 118:case 110:case 102:case 94:case 86:case 78:case 70:{h=h&1;c=c+4|0;b=vb($+(vb(S|0,2,1)|0|0)>>0|0,1,1)|0|0;break}case 127:case 125:case 124:case 123:case 122:case 121:case 120:case 119:case 117:case 116:case 115:case 114:case 113:case 112:case 111:case 109:case 108:case 107:case 106:case 105:case 104:case 103:case 101:case 100:case 99:case 98:case 97:case 96:case 95:case 93:case 92:case 91:case 90:case 89:case 88:case 87:case 85:case 84:case 83:case 82:case 81:case 80:case 79:case 77:case 76:case 75:case 74:case 73:case 72:case 71:case 69:case 68:case 67:case 66:case 65:case 64:{b=vb(ia+(i&7^1)>>0|0,1,1)|0|0;h=b&40|h&1;break}case -2:case -10:case -18:case -26:case -34:case -42:case -50:case -58:case -66:case -74:case -82:case -90:case -98:case -106:case -114:case -122:{t=$+(vb(S|0,2,1)|0|0)|0;b=1<<(i>>>3&7);tb(t>>0|0,(vb(t>>0|0,1,1)|0|0|b)^((i&64|0)==0?b:0)|0,1);c=c+7|0;b=k;break b}case -1:case -3:case -4:case -5:case -6:case -7:case -8:case -9:case -11:case -12:case -13:case -14:case -15:case -16:case -17:case -19:case -20:case -21:case -22:case -23:case -24:case -25:case -27:case -28:case -29:case -30:case -31:case -32:case -33:case -35:case -36:case -37:case -38:case -39:case -40:case -41:case -43:case -44:case -45:case -46:case -47:case -48:case -49:case -51:case -52:case -53:case -54:case -55:case -56:case -57:case -59:case -60:case -61:case -62:case -63:case -64:{b=ia+(i&7^1)|0;tb(b>>0|0,vb(b>>0|0,1,1)|0|0|1<<(i>>>3&7)|0,1);b=k;break b}case -65:case -67:case -68:case -69:case -70:case -71:case -72:case -73:case -75:case -76:case -77:case -78:case -79:case -80:case -81:case -83:case -84:case -85:case -86:case -87:case -88:case -89:case -91:case -92:case -93:case -94:case -95:case -96:case -97:case -99:case -100:case -101:case -102:case -103:case -104:case -105:case -107:case -108:case -109:case -110:case -111:case -112:case -113:case -115:case -116:case -117:case -118:case -119:case -120:case -121:case -123:case -124:case -125:case -126:case -127:case -128:{b=ia+(i&7^1)|0;tb(b>>0|0,(vb(b>>0|0,1,1)|0|0)&(1<<(i>>>3&7)^255)|0,1);b=k;break b}default:{ka=172;break a}}while(0);b=b&1<<(i>>>3&7);h=h|b&128|(b+32767|0)>>>8&68|16;b=k;break}case -19:{d=r+2<<16>>16;i=s&255;c=((vb(16791+i>>0|0,1,1)|0|0)>>>4)+c|0;do switch(s<<24>>24){case 122:case 114:{b=k;ka=175;break}case 106:case 90:case 74:case 98:case 82:case 66:{b=vb(ia+(i>>>3&6)|0,2,0)|0|0;ka=175;break}case 120:case 112:case 104:case 96:case 88:case 80:case 72:case 64:{tb(L+(i>>>3^1)>>0|0,-1|0,1);h=vb(M>>0|0,1,1)|0|0|h&1;b=k;break b}case 113:{tb(g>>0|0,0|0,1);ka=178;break}case 121:case 105:case 97:case 89:case 81:case 73:case 65:{ka=178;break}case 115:{b=k;ka=180;break}case 83:case 67:{b=vb(L+(i>>>3)|0,2,0)|0|0;ka=180;break}case 91:case 75:{d=d&65535;b=$+d|0;b=$+((sh(vb(b>>0|0,1,0)|0|0,vb(b+1>>0|0,1,0)|0|0)|0)&65535)|0;tb(C+(i>>>3)|0,sh(vb(b>>0|0,1,0)|0|0,vb(b+1>>0|0,1,0)|0|0)|0|0,2);d=d+2&65535;b=k;break b}case 123:{d=d&65535;b=$+d|0;b=$+((sh(vb(b>>0|0,1,0)|0|0,vb(b+1>>0|0,1,0)|0|0)|0)&65535)|0;d=d+2&65535;b=(sh(vb(b>>0|0,1,0)|0|0,vb(b+1>>0|0,1,0)|0|0)|0)&65535;break b}case 103:{t=$+(vb(S|0,2,1)|0|0)|0;b=vb(t>>0|0,1,1)|0|0;tb(t>>0|0,(vb(v>>0|0,1,1)|0|0)<<4|b>>>4|0,1);b=(vb(v>>0|0,1,0)|0)&-16&255|b&15;h=vb(a+b>>0|0,1,1)|0|0|h&1;tb(v>>0|0,b|0,1);b=k;break b}case 111:{t=$+(vb(S|0,2,1)|0|0)|0;b=vb(t>>0|0,1,1)|0|0;tb(t>>0|0,(vb(v>>0|0,1,0)|0)&15|b<<4|0,1);b=(vb(v>>0|0,1,0)|0)&-16&255|b>>>4;h=vb(a+b>>0|0,1,1)|0|0|h&1;tb(v>>0|0,b|0,1);b=k;break b}case 124:case 116:case 108:case 100:case 92:case 84:case 76:case 68:{b=vb(v>>0|0,1,1)|0|0;tb(v>>0|0,0|0,1);h=h&-2;i=16;ka=83;break b}case -71:case -87:{b=-1;ka=187;break}case -79:case -95:{b=1;ka=187;break}case -72:case -88:{b=-1;ka=191;break}case -80:case -96:{b=1;ka=191;break}case -69:case -85:{b=-1;ka=195;break}case -77:case -93:{b=1;ka=195;break}case -70:case -86:{b=-1;ka=197;break}case -78:case -94:{b=1;ka=197;break}case 71:{tb(U>>0|0,vb(v>>0|0,1,0)|0|0|0,1);b=k;break b}case 79:{tb(_>>0|0,vb(v>>0|0,1,0)|0|0|0,1);b=k;break b}case 87:{b=U;ka=201;break}case 95:{b=_;ka=201;break}case 125:case 117:case 109:case 101:case 93:case 85:case 77:case 69:{tb(V>>0|0,vb(W>>0|0,1,0)|0|0|0,1);ka=59;break b}case 110:case 102:case 78:case 70:{tb(Y>>0|0,0|0,1);b=k;break b}case 118:case 86:{tb(Y>>0|0,1|0,1);b=k;break b}case 126:case 94:{tb(Y>>0|0,2|0,1);b=k;break b}default:{b=k;break b}}while(0);if((ka|0)==175){ka=0;t=(b&65535)+(h&1)|0;s=i>>>2&2^2;h=vb(S|0,2,0)|0|0;t=((s|0)==0?t:0-t|0)+(h&65535)|0;h=t^(h^b)&65535;h=t>>>16&1|s|t>>>8&168|h>>>8&16|(h+32768|0)>>>14&4;b=t&65535;tb(S|0,b|0,2);h=b<<16>>16==0?h|64:h;b=k;break b}else if((ka|0)==178){ka=0;rh(a,(vb(ja|0,4,0)|0|0)+c|0,vb(ia|0,2,1)|0|0,vb(L+(i>>>3^1)>>0|0,1,1)|0|0);b=k;break b}else if((ka|0)==180){ka=0;d=d&65535;t=$+d|0;th($+((sh(vb(t>>0|0,1,0)|0|0,vb(t+1>>0|0,1,0)|0|0)|0)&65535)|0,b&65535);d=d+2&65535;b=k;break b}else if((ka|0)==187){ka=0;r=vb(S|0,2,1)|0|0;tb(S|0,r+b|0,2);r=vb($+r>>0|0,1,0)|0|0;b=vb(v>>0|0,1,0)|0|0;t=(b&255)-(r&255)|0;r=(b^r)&16^t&144;b=(t&255)<<24>>24==0?66:2;t=t-(r>>>4&1)|0;h=r|h&1|b|t&8|t<<4&32;t=(vb(ia|0,2,0)|0|0)+-1<<16>>16;tb(ia|0,t|0,2);if(!(t<<16>>16)){b=k;break b}h=h|4;if((s&255)<176|(b&64|0)!=0){b=k;break b}d=(d&65535)+65534&65535;c=c+5|0;b=k;break b}else if((ka|0)==191){ka=0;t=vb(S|0,2,1)|0|0;tb(S|0,t+b|0,2);t=vb($+t>>0|0,1,0)|0|0;r=vb(P|0,2,1)|0|0;tb(P|0,r+b|0,2);tb($+r>>0|0,t|0,1);t=(vb(v>>0|0,1,1)|0|0)+(t&255)|0;h=t&8|h&193|t<<4&32;t=(vb(ia|0,2,0)|0|0)+-1<<16>>16;tb(ia|0,t|0,2);if(!(t<<16>>16)){b=k;break b}h=h|4;if((s&255)<176){b=k;break b}d=(d&65535)+65534&65535;c=c+5|0;b=k;break b}else if((ka|0)==195){ka=0;t=vb(S|0,2,1)|0|0;tb(S|0,t+b|0,2);t=vb($+t>>0|0,1,1)|0|0;b=(vb(N>>0|0,1,0)|0|0)+-1<<24>>24;tb(N>>0|0,b|0,1);h=(vb(a+(b&255)>>0|0,1,0)|0)&-5&255|t>>>6&2;b=(s&255)>175&b<<24>>24!=0;c=b?c+5|0:c;rh(a,c+(vb(ja|0,4,0)|0|0)|0,vb(ia|0,2,1)|0|0,t);d=b?(d&65535)+65534&65535:d;b=k;break b}else if((ka|0)==197){ka=0;t=vb(S|0,2,1)|0|0;tb(S|0,t+b|0,2);b=(vb(N>>0|0,1,0)|0|0)+-1<<24>>24;tb(N>>0|0,b|0,1);h=((vb(a+(b&255)>>0|0,1,0)|0)&-7|2)&255;b=(s&255)>175&b<<24>>24!=0;tb($+t>>0|0,-1|0,1);d=b?(d&65535)+65534&65535:d;c=b?c+5|0:c;b=k;break b}else if((ka|0)==201){ka=0;b=vb(b>>0|0,1,0)|0|0;tb(v>>0|0,b|0,1);h=(vb(a+(b&255)>>0|0,1,0)|0)&-5&255|h&1|(vb(W>>0|0,1,1)|0|0)<<2&4;b=k;break b}break}case -35:{b=f;ka=207;break}case -3:{b=e;ka=207;break}default:{ka=265;break a}}while(0);c:switch(ka|0){case 4:{ka=0;c=c+-5|0;b=k;break}case 6:{c=c+-7|0;ka=7;break}case 59:{ka=0;b=k&65535;d=$+b|0;d=(sh(vb(d>>0|0,1,0)|0|0,vb(d+1>>0|0,1,0)|0|0)|0)&65535;b=b+2&65535;break}case 68:{ka=0;d=(sh(s,vb(j+1>>0|0,1,0)|0|0)|0)&65535;b=(k&65535)+65534|0;th($+(b&65535)|0,i+2&65535);b=b&65535;break}case 71:{b=d;d=n&56;ka=74;break}case 78:{b=vb($+(vb(S|0,2,1)|0|0)>>0|0,1,1)|0|0;i=t;ka=83;break}case 80:{i=t;d=r+2<<16>>16;ka=83;break}case 82:{b=vb(ia+(n&7^1)>>0|0,1,1)|0|0;i=t;ka=83;break}case 89:{ka=0;s=vb(S|0,2,0)|0|0;t=(s&65535)+(b&65535)|0;tb(S|0,t|0,2);h=t>>>16|h&196|t>>>8&40|((s^b)&65535^t)>>>8&16;b=k;break}case 207:{ka=0;q=r+2<<16>>16;p=q&65535;n=$+p|0;o=vb(n>>0|0,1,0)|0|0;i=o&255;j=s&255;c=((vb(16791+j>>0|0,1,0)|0)&15)+c|0;do switch(s<<24>>24){case 109:case 100:{d=q;b=k;break c}case -27:{d=q;ka=74;break c}case -122:case -106:{h=h&-2;ka=209;break}case -114:case -98:{ka=209;break}case -124:case -108:{h=h&-2;ka=211;break}case -116:case -100:{ka=211;break}case -123:case -107:{h=h&-2;ka=213;break}case -115:case -99:{ka=213;break}case 57:{d=k;ka=216;break}case 41:{d=b;ka=216;break}case 25:case 9:{d=vb(G+(j>>>3)|0,2,0)|0|0;ka=216;break}case -90:{b=vb($+((o<<24>>24)+(b&65535)&65535)>>0|0,1,1)|0|0;d=r+3<<16>>16;ka=106;break c}case -92:{b=(b&65535)>>>8;d=q;ka=106;break c}case -91:{b=b&255;d=q;ka=106;break c}case -74:{b=vb($+((o<<24>>24)+(b&65535)&65535)>>0|0,1,1)|0|0;d=r+3<<16>>16;ka=110;break c}case -76:{b=(b&65535)>>>8;d=q;ka=110;break c}case -75:{b=b&255;d=q;ka=110;break c}case -82:{b=vb($+((o<<24>>24)+(b&65535)&65535)>>0|0,1,1)|0|0;d=r+3<<16>>16;ka=114;break c}case -84:{b=(b&65535)>>>8;d=q;ka=114;break c}case -83:{b=b&255;d=q;ka=114;break c}case -66:{b=vb($+((o<<24>>24)+(b&65535)&65535)>>0|0,1,1)|0|0;d=r+3<<16>>16;ka=87;break c}case -68:{b=(b&65535)>>>8;d=q;ka=87;break c}case -67:{b=b&255;d=q;ka=87;break c}case 119:case 117:case 116:case 115:case 114:case 113:case 112:{d=K+(j^1)|0;i=q;ka=231;break}case 54:{i=r+3<<16>>16;d=$+(i&65535)|0;ka=231;break}case 124:case 92:case 84:case 76:case 68:{tb(L+(j>>>3^1)>>0|0,(b&65535)>>>8|0,1);d=q;b=k;break c}case 125:case 93:case 85:case 77:case 69:{tb(L+(j>>>3^1)>>0|0,b|0,1);d=q;b=k;break c}case 126:case 110:case 102:case 94:case 86:case 78:case 70:{tb(L+(j>>>3^1)>>0|0,vb($+((o<<24>>24)+(b&65535)&65535)>>0|0,1,0)|0|0|0,1);d=r+3<<16>>16;b=k;break c}case 38:{d=r+3<<16>>16;ka=238;break}case 101:{i=b&255;d=q;ka=238;break}case 103:case 99:case 98:case 97:case 96:{i=vb(D+(j^1)>>0|0,1,1)|0|0;d=q;ka=238;break}case 46:{d=r+3<<16>>16;ka=242;break}case 108:{i=(b&65535)>>>8;d=q;ka=242;break}case 111:case 107:case 106:case 105:case 104:{i=vb(E+(j^1)>>0|0,1,1)|0|0;d=q;ka=242;break}case -7:{d=q;break c}case 34:{th($+((sh(o,vb(n+1>>0|0,1,0)|0|0)|0)&65535)|0,b&65535);d=p+2&65535;b=k;break c}case 33:{i=sh(o,vb(n+1>>0|0,1,0)|0|0)|0;d=p+2&65535;b=k;break}case 42:{i=$+((sh(o,vb(n+1>>0|0,1,0)|0|0)|0)&65535)|0;i=sh(vb(i>>0|0,1,0)|0|0,vb(i+1>>0|0,1,0)|0|0)|0;d=p+2&65535;b=k;break}case -53:{b=(o<<24>>24)+(b&65535)|0;i=b&65535;j=vb($+(r+3&65535)>>0|0,1,1)|0|0;d=r+4<<16>>16;t=j+-6|0;switch(t>>>3|t<<29|0){case 0:{ka=143;break c}case 2:{ka=146;break c}case 4:{ka=149;break c}case 6:{ka=152;break c}case 1:{ka=155;break c}case 3:{ka=158;break c}case 5:{ka=161;break c}case 7:{ka=164;break c}case 15:case 14:case 13:case 12:case 11:case 10:case 9:case 8:{b=(vb($+(b&65535)>>0|0,1,1)|0|0)&1<<(j>>>3&7);h=h&1|b&128|(b+32767|0)>>>8&68|16;b=k;break c}case 31:case 30:case 29:case 28:case 27:case 26:case 25:case 24:case 23:case 22:case 21:case 20:case 19:case 18:case 17:case 16:{t=$+(b&65535)|0;b=1<<(j>>>3&7);tb(t>>0|0,(vb(t>>0|0,1,1)|0|0|b)^((j&64|0)==0?b:0)|0,1);b=k;break c}default:{b=k;break c}}}case 35:{i=(b&65535)+1|0;d=q;b=k;break}case 43:{i=(b&65535)+-1|0;d=q;b=k;break}case 52:{d=$+((o<<24>>24)+(b&65535)&65535)|0;b=(vb(d>>0|0,1,1)|0|0)+1|0;tb(d>>0|0,b|0,1);b=b&65535;d=r+3<<16>>16;ka=93;break c}case 53:{d=$+((o<<24>>24)+(b&65535)&65535)|0;i=(vb(d>>0|0,1,1)|0|0)+65535|0;tb(d>>0|0,i|0,1);i=i&65535;d=r+3<<16>>16;ka=96;break c}case 36:{d=(b&65535)+256|0;b=d>>>8&255;ka=257;break}case 44:{d=b&65535;ka=d+1&255;b=ka;d=ka&65535|d&65280;ka=257;break}case 37:{d=(b&65535)+65280|0;b=d>>>8&255;ka=260;break}case 45:{d=b&65535;ka=d+255&255;b=ka;d=ka&65535|d&65280;ka=260;break}case -31:{b=k&65535;i=$+b|0;i=sh(vb(i>>0|0,1,0)|0|0,vb(i+1>>0|0,1,0)|0|0)|0;d=q;b=b+2&65535;break}case -23:{d=b;b=k;break c}case -29:{d=$+(k&65535)|0;i=sh(vb(d>>0|0,1,0)|0|0,vb(d+1>>0|0,1,0)|0|0)|0;th(d,b&65535);d=q;b=k;break}default:{b=k;break c}}while(0);if((ka|0)==209){b=vb($+((o<<24>>24)+(b&65535)&65535)>>0|0,1,1)|0|0;i=s;d=r+3<<16>>16;ka=83;break}else if((ka|0)==211){b=(b&65535)>>>8;i=s;d=q;ka=83;break}else if((ka|0)==213){b=b&255;i=s;d=q;ka=83;break}else if((ka|0)==216){ka=0;i=(d&65535)+(b&65535)|0;h=i>>>16|h&196|i>>>8&40|((d^b)&65535^i)>>>8&16;d=q;b=k}else if((ka|0)==231){ka=0;tb($+((o<<24>>24)+(b&65535)&65535)>>0|0,vb(d>>0|0,1,0)|0|0|0,1);d=i+1<<16>>16;b=k;break}else if((ka|0)==238){ka=0;i=i<<8|b&255;b=k}else if((ka|0)==242){ka=0;i=i|b&-256&65535;b=k}else if((ka|0)==257){d=d&65535;t=t<<24>>24==-35;f=t?d:f;e=t?e:d;d=q;ka=93;break}else if((ka|0)==260){d=d&65535;t=t<<24>>24==-35;i=b;f=t?d:f;e=t?e:d;d=q;ka=96;break}s=i&65535;t=t<<24>>24==-35;f=t?s:f;e=t?e:s;break}}switch(ka|0){case 7:{ka=0;d=i+2&65535;b=k;break}case 74:{ka=0;t=(k&65535)+65534|0;th($+(t&65535)|0,b&65535);b=t&65535;break}case 83:{ka=0;s=b&65535;b=(h&1)+s|0;h=vb(v>>0|0,1,1)|0|0;t=(i&255)>>>3&2;b=h+((t|0)==0?b:0-b|0)|0;h=h^s^b&65535;h=(vb(a+(b&511)>>0|0,1,0)|0)&-5&255|t|h&16|(h+128|0)>>>6&4;tb(v>>0|0,b|0,1);b=k;break}case 87:{ka=0;t=vb(v>>0|0,1,1)|0|0;s=b&65535;b=t-s|0;h=t^s;h=b>>>8&1|s&40|h&16^b&144|((b&255)<<24>>24==0?66:2)|((b^t)&h)>>>5&4;b=k;break}case 93:{ka=0;h=(b&15)+31&16|h&1|(vb(a+(b&255)>>0|0,1,0)|0)&-5&255;h=b<<16>>16==128?h|4:h;b=k;break}case 96:{ka=0;b=(i&15)+1&16|h&1|(vb(a+(i&255)>>0|0,1,0)|0)&-7&255;if(i<<16>>16==127){h=b|6;b=k;break}else{h=b|2;b=k;break}}case 106:{ka=0;h=(vb(v>>0|0,1,1)|0|0)&(b&65535);tb(v>>0|0,h|0,1);h=(vb(a+h>>0|0,1,0)|0|16)&255;b=k;break}case 110:{ka=0;h=vb(v>>0|0,1,1)|0|0|b&65535;tb(v>>0|0,h|0,1);h=vb(a+h>>0|0,1,1)|0|0;b=k;break}case 114:{ka=0;h=(vb(v>>0|0,1,1)|0|0)^b&65535;tb(v>>0|0,h|0,1);h=vb(a+h>>0|0,1,1)|0|0;b=k;break}case 143:{ka=0;t=$+(i&65535)|0;b=vb(t>>0|0,1,1)|0|0;h=b>>>7;b=b<<1|h;h=vb(a+(b&255)>>0|0,1,1)|0|0|h;tb(t>>0|0,b|0,1);b=k;break}case 146:{ka=0;t=$+(i&65535)|0;b=(vb(t>>0|0,1,1)|0|0)<<1|h&1;h=vb(a+b>>0|0,1,1)|0|0;tb(t>>0|0,b|0,1);b=k;break}case 149:{ka=0;t=$+(i&65535)|0;b=(vb(t>>0|0,1,1)|0|0)<<1;h=vb(a+b>>0|0,1,1)|0|0;tb(t>>0|0,b|0,1);b=k;break}case 152:{ka=0;t=$+(i&65535)|0;b=(vb(t>>0|0,1,1)|0|0)<<1|1;h=vb(a+b>>0|0,1,1)|0|0;tb(t>>0|0,b|0,1);b=k;break}case 155:{ka=0;t=$+(i&65535)|0;h=vb(t>>0|0,1,1)|0|0;b=h<<7|h>>>1;h=h&1|(vb(a+(b&255)>>0|0,1,1)|0|0);tb(t>>0|0,b|0,1);b=k;break}case 158:{ka=0;t=$+(i&65535)|0;s=vb(t>>0|0,1,1)|0|0;b=s>>>1|h<<7;h=vb(a+(b&255)>>0|0,1,1)|0|0|s&1;tb(t>>0|0,b|0,1);b=k;break}case 161:{ka=0;t=$+(i&65535)|0;h=vb(t>>0|0,1,1)|0|0;b=h&128|h>>>1;h=h&1|(vb(a+b>>0|0,1,1)|0|0);tb(t>>0|0,b|0,1);b=k;break}case 164:{ka=0;t=$+(i&65535)|0;h=vb(t>>0|0,1,0)|0|0;b=(h&255)>>>1;h=(h&1|(vb(a+(b&255)>>0|0,1,0)|0))&255;tb(t>>0|0,b|0,1);b=k;break}}t=vb($+(d&65535)>>0|0,1,0)|0|0;n=t&255;i=(vb(16535+n>>0|0,1,1)|0|0)+c|0;if((i|c|0)>=0){ka=267;break}else{c=i;r=d;k=b}}if((ka|0)!=172)if((ka|0)!=265)if((ka|0)==266){Y=h;Z=g;_=f;$=e;ka=r;W=c&3;a=k;tb(ha|0,W|0,4);ha=Y&255;tb(Z>>0|0,ha|0,1);tb(ba|0,_|0,2);tb(ca|0,$|0,2);tb(ea|0,a|0,2);tb(da|0,ka|0,2);ka=ia;ha=ka;ha=vb(ha|0,4,0)|0|0;ka=ka+4|0;ka=vb(ka|0,4,0)|0|0;ia=aa;ea=ia;tb(ea>>0|0,ha|0,1);tb(ea+1>>0|0,ha>>8|0,1);tb(ea+2>>0|0,ha>>16|0,1);tb(ea+3>>0|0,ha>>24|0,1);ia=ia+4|0;tb(ia>>0|0,ka|0,1);tb(ia+1>>0|0,ka>>8|0,1);tb(ia+2>>0|0,ka>>16|0,1);tb(ia+3>>0|0,ka>>24|0,1);ka=ja;ia=ka;ia=vb(ia|0,4,0)|0|0;ka=ka+4|0;ka=vb(ka|0,4,0)|0|0;ja=ga;ha=ja;tb(ha|0,ia|0,4);ja=ja+4|0;tb(ja|0,ka|0,4);tb(fa|0,ga|0,4);l=la;return}else if((ka|0)==267){tb(ha|0,c|0,4);ka=h&255;tb(g>>0|0,ka|0,1);tb(ba|0,f|0,2);tb(ca|0,e|0,2);tb(ea|0,b|0,2);tb(da|0,d|0,2);ka=ia;ha=ka;ha=vb(ha|0,4,0)|0|0;ka=ka+4|0;ka=vb(ka|0,4,0)|0|0;ia=aa;ea=ia;tb(ea>>0|0,ha|0,1);tb(ea+1>>0|0,ha>>8|0,1);tb(ea+2>>0|0,ha>>16|0,1);tb(ea+3>>0|0,ha>>24|0,1);ia=ia+4|0;tb(ia>>0|0,ka|0,1);tb(ia+1>>0|0,ka>>8|0,1);tb(ia+2>>0|0,ka>>16|0,1);tb(ia+3>>0|0,ka>>24|0,1);ka=ja;ia=ka;ia=vb(ia|0,4,0)|0|0;ka=ka+4|0;ka=vb(ka|0,4,0)|0|0;ja=ga;ha=ja;tb(ha|0,ia|0,4);ja=ja+4|0;tb(ja|0,ka|0,4);tb(fa|0,ga|0,4);l=la;return}}function jh(a,b){a=a|0;b=b|0;a=a+4|0;tb(a|0,(vb(a|0,4,0)|0|0)+b|0,4);return}function kh(a,b){a=a|0;b=b|0;var c=0,d=0;d=a+48|0;c=vb(d|0,4,0)|0|0;if((c|0)<(b|0)){lh(a,b);c=vb(d|0,4,0)|0|0}if((c|0)<(b|0))Aa(16301,17112,102,18514);else{tb(d|0,c-b|0,4);return}}function lh(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0;P=a+48|0;if((vb(P|0,4,0)|0|0)>(b|0))Aa(16319,16347,166,17475);H=(vb(a+58>>0|0,1,0)|0)&31;H=H<<24>>24?(H&255)<<5:32;D=a+68|0;z=vb(D|0,4,0)|0|0;G=a+72|0;A=vb(G|0,4,0)|0|0;Q=(vb(a+64>>0|0,1,1)|0)<<8|(vb(a+63>>0|0,1,1)|0);Q=Q|0?Q<<5:32;N=a+76|0;if(!(vb(N|0,4,0)|0))tb(N|0,Q|0,4);B=a+59|0;L=a+84|0;I=b+-1|0;J=a+472|0;K=a+80|0;C=a+65|0;F=0;do{c=(vb(B>>0|0,1,1)|0|0)>>>F;x=vb(a+(F<<4)+12|0,4,0)|0|0;if(x|0){mh(x);E=((nh(vb(x+28|0,4,0)|0|0)|0)+16384|0)>>>15;y=vb(a+(F<<4)|0,4,0)|0|0;E=(c&1|0)==0&(y|0)<=(E|0)&1;c=E|c;h=vb(P|0,4,0)|0|0;w=vb(F+8+(a+52)>>0|0,1,1)|0|0;d=(vb(16365+(w&15)>>0|0,1,1)|0|0)>>>E;g=vb(L|0,4,0)|0|0;do if(w&16){d=(vb((vb(K|0,4,0)|0|0)+g>>0|0,1,1)|0|0)>>>E;if((g|0)<-32|((vb(C>>0|0,1,0)|0)&1)==0){f=(vb(N|0,4,0)|0|0)+h|0;f=(f|0)<(b|0)?f:b;break}else{f=b;c=(d|0)==0?9:c;break}}else{f=b;c=(d|0)==0?9:c}while(0);u=a+(F<<4)+4|0;e=(vb(u|0,4,0)|0|0)+h|0;t=c&1;w=(t|0)!=0;if(w){s=(I+y-e|0)/(y|0)|0;e=(O(s,y)|0)+e|0;v=a+(F<<4)+10|0;tb(v|0,(vb(v|0,2,1)|0)^s&1|0,2)}else v=a+(F<<4)+10|0;s=(c&8|0)!=0;r=c>>>3;q=a+(F<<4)+8|0;p=f;j=s?1:A;k=s?b:h+z|0;o=g;while(1){f=((j|r)&1&(vb(v|0,2,1)|0|c)|0)==0?0:d;g=f-(vb(q|0,2,0)|0|0)|0;if(g|0){tb(q|0,f|0,2);oh(J,h,g,x)}if((e|0)<(p|0)|(k|0)<(p|0)){i=(f<<1)-d|0;n=(i|0)!=0&1;f=j;h=k;l=vb(v|0,2,0)|0|t;while(1){k=(p|0)>(e|0)?e:p;if(!(l&n)){g=k-h|0;if((g|0)>-1)m=k+H-((g|0)%(H|0)|0)|0;else m=h}else if((k|0)<(h|0))m=h;else while(1){j=0-(f&1)&73728^f>>>1;g=0-i|0;if(!(f+1&2))f=i;else{oh(J,h,g,x);f=g}h=h+H|0;if((h|0)>(k|0)){i=f;f=j;m=h;break}else{i=f;f=j}}k=(p|0)>(m|0);j=k?m:p;h=(e|0)<(j|0);if(!(f&n))if(h){g=l;do{e=e+y|0;g=g^1}while((e|0)<(j|0));h=i}else{h=i;g=l}else{g=0-i|0;if(h){h=g;while(1){oh(J,e,h,x);e=e+y|0;g=0-h|0;if((e|0)<(j|0))h=g;else break}}else h=i;g=g>>>31}if((e|0)<(p|0)|k){i=h;h=m;l=g}else break}tb(q|0,(h+d|0)>>>1|0,2);if(w)d=m;else{tb(v|0,g|0,2);d=m}}else{f=j;d=k}if((p|0)>=(b|0))break;n=((o|0)>-2?-31:1)+o|0;j=p+Q|0;h=p;p=(j|0)>(b|0)?b:j;j=f;k=d;o=n;d=(vb((vb(K|0,4,0)|0|0)+n>>0|0,1,1)|0|0)>>>E}tb(u|0,e-b|0,4);if(!s){tb(D|0,d-b|0,4);tb(G|0,f|0,4)}}F=F+1|0}while((F|0)!=3);c=b-(vb(P|0,4,0)|0|0)-(vb(N|0,4,0)|0|0)|0;if((c|0)>-1){d=(c+Q|0)/(Q|0)|0;e=(vb(L|0,4,0)|0|0)+d|0;e=(e|0)>-1?e|-32:e;tb(L|0,e|0,4);c=c-(O(d,Q)|0)|0;d=0-c|0;if((Q|0)<(d|0))Aa(16381,16347,388,17475);tb(N|0,d|0,4);if((c|0)<0)M=e;else Aa(16403,16347,391,17475)}else{tb(N|0,0-c|0,4);M=vb(L|0,4,0)|0|0}if((M|0)<0){tb(P|0,b|0,4);return}else Aa(16417,16347,392,17475)}function mh(a){a=a|0;tb(a+40|0,1|0,4);return}function nh(a){a=a|0;return a|0}function oh(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;b=O(vb(d|0,4,0)|0|0,b)|0;ph(a,b+(vb(d+4|0,4,0)|0|0)|0,c,d);return}function ph(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=b>>>16;if((e|0)<(vb(d+12|0,4,0)|0|0)){f=O(vb(a+8|0,4,0)|0|0,c)|0;d=(vb(d+8|0,4,0)|0|0)+(e<<2)|0;b=b>>>10&63;e=a+168+(0-b<<1)|0;c=O(vb(e|0,2,0)|0|0,f)|0;h=d+8|0;j=O(vb(e+128|0,2,0)|0|0,f)|0;g=d+12|0;j=j+(vb(g|0,4,0)|0|0)|0;i=vb(e+256|0,2,0)|0|0;tb(h|0,c+(vb(h|0,4,0)|0|0)|0,4);tb(g|0,j|0,4);i=O(i,f)|0;j=d+16|0;g=O(vb(e+384|0,2,0)|0|0,f)|0;h=d+20|0;g=g+(vb(h|0,4,0)|0|0)|0;c=vb(e+512|0,2,0)|0|0;tb(j|0,(vb(j|0,4,0)|0|0)+i|0,4);tb(h|0,g|0,4);c=O(c,f)|0;g=d+24|0;e=O(vb(e+640|0,2,0)|0|0,f)|0;h=d+28|0;e=e+(vb(h|0,4,0)|0|0)|0;b=a+40+(b<<1)|0;a=vb(b+640|0,2,0)|0|0;tb(g|0,(vb(g|0,4,0)|0|0)+c|0,4);tb(h|0,e|0,4);a=O(a,f)|0;e=d+32|0;h=O(vb(b+512|0,2,0)|0|0,f)|0;c=d+36|0;h=h+(vb(c|0,4,0)|0|0)|0;g=vb(b+384|0,2,0)|0|0;tb(e|0,(vb(e|0,4,0)|0|0)+a|0,4);tb(c|0,h|0,4);g=O(g,f)|0;h=d+40|0;c=O(vb(b+256|0,2,0)|0|0,f)|0;a=d+44|0;c=c+(vb(a|0,4,0)|0|0)|0;e=vb(b+128|0,2,0)|0|0;tb(h|0,(vb(h|0,4,0)|0|0)+g|0,4);tb(a|0,c|0,4);e=O(e,f)|0;c=d+48|0;b=O(vb(b|0,2,0)|0|0,f)|0;a=d+52|0;b=b+(vb(a|0,4,0)|0|0)|0;tb(c|0,(vb(c|0,4,0)|0|0)+e|0,4);tb(a|0,b|0,4);return}else Aa(16429,16497,344,16518)}function qh(a,b){a=a|0;b=b|0;var c=0,d=0;a=a+520|0;d=vb(a|0,4,0)|0|0;c=(vb(d|0,4,0)|0|0)-b|0;tb(d|0,b|0,4);a=(vb(a|0,4,0)|0|0)+4|0;tb(a|0,c+(vb(a|0,4,0)|0|0)|0,4);return}function rh(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0;e=a+-340|0;if((c&255|0)==254?(vb(a+605>>0|0,1,0)|0|0)==0:0){f=a+588|0;g=vb(f|0,4,0)|0|0;c=d&16;e=a+592|0;if((vb(e|0,4,0)|0|0)==(c|0))return;tb(e|0,c|0,4);tb(f|0,0-g|0,4);tb(a+604>>0|0,1|0,1);c=vb(a+584|0,4,0)|0|0;if(!c)return;oh(a+67132|0,b,g,c);return}uh(e,b,c,d);return}function sh(a,b){a=a|0;b=b|0;return (b&255)<<8|a&255|0}function th(a,b){a=a|0;b=b|0;tb(a+1>>0|0,b>>>8|0,1);tb(a>>0|0,b|0,1);return}function uh(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0;g=a+945|0;e=vb(g>>0|0,1,0)|0|0;a:do if(!(e<<24>>24)){f=c&65279;if(f<<16>>16<-259){switch(f<<16>>16){case -16643:break;default:break a}tb(a+944>>0|0,1|0,1);vh(a+67e3|0,b,vb(a+936|0,4,0)|0|0,d);return}else{switch(f<<16>>16){case -259:break;default:break a}tb(a+944>>0|0,1|0,1);tb(a+936|0,d&15|0,4);return}}while(0);if(vb(a+944>>0|0,1,0)|0|0)return;b:do switch(c>>>8&16777215|0){case 246:switch((d&192)<<24>>24){case -64:{tb(a+936|0,(vb(a+940|0,4,0)|0)&15|0,4);break b}case -128:{vh(a+67e3|0,b,vb(a+936|0,4,0)|0|0,vb(a+940|0,4,0)|0|0);e=vb(g>>0|0,1,0)|0|0;break b}default:return}case 244:{tb(a+940|0,d|0,4);break}default:return}while(0);if(e<<24>>24)return;tb(g>>0|0,1|0,1);Ye(a,2e6);Xc(a,+wh(+(+wb(a+240|0,8))));return}function vh(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;lh(a,b);xh(a,c,d);return}function wh(a){a=+a;return +a}function xh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if(b>>>0>=16)Aa(17047,16347,122,17075);if((b|0)==13){b=(c&8|0)==0?(c&4|0?15:9):c;tb(a+80|0,a+88+((b+-7|0)*48|0)|0,4);tb(a+84|0,-48|0,4);tb(a+76|0,0|0,4);tb(a+65>>0|0,b|0,1);return}tb(a+52+b>>0|0,c|0,1);c=b>>>1;if(b>>>0>=6)return;b=c<<1;b=((vb((b|1)+(a+52)>>0|0,1,0)|0)&15)<<12|(vb(a+52+b>>0|0,1,1)|0|0)<<4;b=b|0?b:16;d=a+(c<<4)|0;c=a+(c<<4)+4|0;a=b-(vb(d|0,4,0)|0|0)+(vb(c|0,4,0)|0|0)|0;tb(c|0,((a|0)>0?a:0)|0,4);tb(d|0,b|0,4);return}function yh(a,b){a=a|0;b=b|0;zh(a+472|0,b);return}function zh(a,b){a=a|0;b=b|0;Me(a,b);return}function Ah(a,b,c){a=a|0;b=b|0;c=c|0;if(b>>>0<3){tb(a+(b<<4)+12|0,c|0,4);return}else Aa(17087,17112,86,17629)}function Bh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=vb(a|0,4,0)|0|0;e=b-d|0;d=(vb(a+4|0,4,0)|0|0)-d|0;if(e>>>0>(d+-2|0)>>>0)Aa(17207,17260,52,17278);a=(Dh(vb(b>>0|0,1,0)|0|0,vb(b+1>>0|0,1,0)|0|0)|0)<<16>>16;if(!a)return 0;else return ((a+e|0)>>>0>(d-c|0)>>>0?0:b+a|0)|0;return 0}function Ch(a,b){a=a|0;b=b|0;var c=0;tb(a+512|0,b|0,4);c=a+524|0;tb(a+520|0,c|0,4);tb(a+516|0,0|0,4);b=c;a=b+36|0;do{tb(b|0,0|0,4);b=b+4|0}while((b|0)<(a|0));tb(c+36|0,0|0,2);return}function Dh(a,b){a=a|0;b=b|0;return (a&255)<<8|b&255|0}function Eh(a){a=a|0;var b=0,c=0;tb(a+48|0,0|0,4);tb(a+68|0,0|0,4);tb(a+72|0,1|0,4);tb(a+32|0,16|0,4);b=a+36|0;tb(b|0,0|0,4);tb(b+4|0,0|0,4);tb(a+16|0,16|0,4);b=a+20|0;tb(b|0,0|0,4);tb(b+4|0,0|0,4);tb(a|0,16|0,4);b=a+4|0;tb(b|0,0|0,4);tb(b+4|0,0|0,4);b=a+52|0;c=b+16|0;do{tb(b>>0|0,0|0,1);b=b+1|0}while((b|0)<(c|0));tb(a+59>>0|0,-1|0,1);xh(a,13,0);return}function Fh(a){a=a|0;return a|0}function Gh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=a+8|0;c=c<<2;qg(b+528|0,Bh(a,(vb(d|0,4,0)|0|0)+c|0,1)|0);c=Bh(a,(vb(d|0,4,0)|0|0)+c+2|0,6)|0;if(c|0)tb(b+4|0,(Dh(vb(c+4>>0|0,1,0)|0|0,vb(c+5>>0|0,1,0)|0|0)|0)*20|0,4);qg(b+784|0,Bh(a,(vb(a|0,4,0)|0|0)+12|0,1)|0);qg(b+1296|0,Bh(a,(vb(a|0,4,0)|0|0)+14|0,1)|0);return}function Hh(a,b,c){a=a|0;b=b|0;c=c|0;tb(c|0,a|0,4);tb(c+4|0,a+b|0,4);if((b|0)<20){b=15595;return b|0}if(Ol(a,17308,8)|0){b=15595;return b|0}b=Bh(c,a+18|0,((vb(a+16>>0|0,1,1)|0|0)<<2)+4|0)|0;tb(c+8|0,b|0,4);b=(b|0)==0?17317:0;return b|0}function Ih(a,b){a=a|0;b=b|0;tb(a+232|0,b|0,4);return}function Jh(a){a=+a;return +a}function Kh(a,b){a=a|0;b=+b;Lh(a+472|0,b*.000915032679738562);return}function Lh(a,b){a=a|0;b=+b;Ne(a,b);return}function Mh(){var a=0,b=0;a=Oh(68288)|0;if(!a){a=0;return a|0}o=0;sa(57,a|0);b=o;o=0;if(b&1){b=Fa()|0;Ad(a);Ma(b|0)}else{b=a;return b|0}return 0}function Nh(){var a=0,b=0;a=Oh(336)|0;if(!a){a=0;return a|0}o=0;sa(58,a|0);b=o;o=0;if(b&1){b=Fa()|0;Ad(a);Ma(b|0)}else{b=a;return b|0}return 0}function Oh(a){a=a|0;return zl(a)|0}function Ph(a){a=a|0;Qh(a);tb(a|0,9408|0,4);Rh(a,9376);return}function Qh(a){a=a|0;Pe(a);tb(a|0,9172|0,4);return}function Rh(a,b){a=a|0;b=b|0;tb(a+4|0,b|0,4);return}function Sh(a){a=a|0;Bd(a);Ad(a);return}function Th(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=a+320|0;b=Hh(b,c,d)|0;if(b|0){a=b;return a|0}fg(a,(vb((vb(d|0,4,0)|0|0)+16>>0|0,1,1)|0|0)+1|0);a=0;return a|0}function Uh(a,b,c){a=a|0;b=b|0;c=c|0;Gh(a+320|0,b,c);return 0}function Vh(a){a=a|0;var b=0;Wh(a+340|0);Oe(a);tb(a|0,9288|0,4);o=0;sa(59,a+67e3|0);b=o;o=0;if(b&1){b=Fa()|0;Pb(a);Ma(b|0)}else{tb(a+924|0,0|0,4);Rh(a,9376);Se(a,9484);Xh(a);Yh(a,6);return}}function Wh(a){a=a|0;var b=0,c=0,d=0,e=0;tb(a+520|0,a+524|0,4);d=255;e=256;while(1){if(!d)b=1;else{b=1;c=d;do{b=c^b;c=c>>1}while((c|0)!=0)}c=b<<2&4|d&168;tb(a+d>>0|0,c|0,1);tb(a+(e+255)>>0|0,c|1|0,1);if((d|0)>0){e=d;d=d+-1|0}else break}tb(a>>0|0,vb(a>>0|0,1,0)|0|64|0,1);a=a+256|0;tb(a>>0|0,vb(a>>0|0,1,0)|0|64|0,1);return}function Xh(a){a=a|0;tb(a+336|0,9500|0,4);return}function Yh(a,b){a=a|0;b=b|0;tb(a+288|0,b|0,4);return}function Zh(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;_h(a+472|0);b=7;while(1){c=2;d=vb(17404+b>>0|0,1,1)|0|0;e=a+88+(b*48|0)|0;while(1){f=d&1;g=(d>>>1&1)-f|0;f=0-f&15;tb(e>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);f=g+f|0;tb(e+1>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);f=g+f|0;tb(e+2>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);f=g+f|0;tb(e+3>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);f=g+f|0;tb(e+4>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);f=g+f|0;tb(e+5>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);f=g+f|0;tb(e+6>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);f=g+f|0;tb(e+7>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);f=g+f|0;tb(e+8>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);f=g+f|0;tb(e+9>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);f=g+f|0;tb(e+10>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);f=g+f|0;tb(e+11>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);f=g+f|0;tb(e+12>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);f=g+f|0;tb(e+13>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);f=g+f|0;tb(e+14>>0|0,vb(16365+f>>0|0,1,0)|0|0|0,1);tb(e+15>>0|0,vb(16365+(g+f)>>0|0,1,0)|0|0|0,1);if((c|0)>0){c=c+-1|0;d=d>>2;e=e+16|0}else break}if(!b)break;else b=b+-1|0}$h(a);Kh(a,1.0);Eh(a);return}function _h(a){a=a|0;He(a,a+40|0,12);return}function $h(a){a=a|0;Ah(a,0,0);Ah(a,1,0);Ah(a,2,0);return}function ai(a){a=a|0;var b=0;tb(a|0,9524|0,4);b=a+320|0;tb(b|0,9612|0,4);rj(a+1692|0);sc(a+1648|0);Od(b);Bd(a);return}function bi(a){a=a|0;ai(a);Ad(a);return}function ci(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;f=l;l=l+16|0;if((l|0)>=(m|0))X(16);e=f;tb(e|0,0|0,4);d=qj(b,c,e)|0;if(d|0){b=d;l=f;return b|0}Ih(a,8);e=vb(e|0,4,0)|0|0;tb(a+1176|0,b+e|0,4);tb(a+1188|0,b+c|0,4);tb(a+1180|0,0|0,4);d=a+1196|0;if(!e){On(d|0,0,428)|0;b=0;l=f;return b|0}else{Mn(d|0,b|0,428)|0;b=0;l=f;return b|0}return 0}function di(a,b,c){a=a|0;b=b|0;c=c|0;oj(a+1196|0,nj(vb(a+1176|0,4,0)|0|0,vb(a+1188|0,4,0)|0|0)|0,b);return 0}function ei(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0.0,g=0;g=l;l=l+32|0;if((l|0)>=(m|0))X(32);c=g;fj(c,b);d=a+2256|0;gj(d,c);e=a+1696|0;hj(e,c);c=a+248|0;ij(d,+Jh(+(+wb(c|0,8)))*.405);jj(e,+Jh(+(+wb(c|0,8)))*.00146484375);e=a+320|0;f=+(b|0);d=a+1624|0;ub(d|0,+(f*+kj(e,+Jh(+(+wb(c|0,8)))*3.0)),8);c=a+1648|0;b=Rc(c,b,66)|0;if(b|0){e=b;l=g;return e|0}Pc(c,3580020);b=lj(a+1692|0,+(+wb(d|0,8)))|0;if(b|0){e=b;l=g;return e|0}e=ef(e,~~(f*.06666666666666667))|0;l=g;return e|0}function fi(a,b){a=a|0;b=b|0;bj(vb(a+1692|0,4,0)|0|0,b);tb(a+1645>>0|0,b>>>6&1|0,1);cj(a+2256|0,b&128|0?0:a+1648|0);return}function gi(a,b){a=a|0;b=+b;if(b<.25){Xc(a,.25);return}if(!(Sc(vb(a+1672|0,4,0)|0|0)|0))return;b=+wh(+(+wb(a+240|0,8)));tb(a+1632|0,~~(59667.0/b)|0,4);gf(a+320|0,~~(+(fc(vb(a+260|0,4,0)|0|0)|0)/(b*60.0)));return}function hi(a,b){a=a|0;b=b|0;tb(a+1184|0,vb(a+1176|0,4,0)|0|0,4);tb(a+1192|0,af(a+1616|0)|0|0,4);tb(a+1640|0,0|0,4);tb(a+1644>>0|0,0|0,1);tb(a+1636|0,-1|0,4);Xi(vb(a+1692|0,4,0)|0|0);Yi(a+2256|0);Nc(a+1648|0);nf(a+320|0);return 0}function ii(a,b,c){a=a|0;b=b|0;c=c|0;zf(a+320|0,b,c,a+1648|0);return 0}function ji(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if(!(Cg(a)|0))ni(a);oi(a+2256|0,b);On(d|0,0,c<<1|0)|0;pi(vb(a+1692|0,4,0)|0|0,c>>1,d);return c|0}function ki(a){a=a|0;ai(a+-320|0);return}function li(a){a=a|0;bi(a+-320|0);return}function mi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ji(a+-320|0,b,c,d)|0}function ni(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;n=a+1184|0;e=vb(n|0,4,0)|0|0;c=a+1192|0;b=vb(c|0,4,0)|0|0;if(b|0?(m=b+-1|0,tb(c|0,m|0,4),(m|0)==0):0)tb(a+1180|0,e|0,4);c=e+1|0;b=vb(e>>0|0,1,0)|0|0;a:do if(!(b<<24>>24))d=0;else{l=a+1644|0;k=a+2256|0;m=a+1692|0;d=0;while(1){j=(d|0)<1024;h=e;b:while(1){e=h+2|0;f=vb(c>>0|0,1,0)|0|0;g=f&255;c:do switch(b<<24>>24){case 1:{i=h+3|0;b=vb(e>>0|0,1,0)|0|0;c=b&255;switch(f<<24>>24){case 42:if(j)break b;else{e=i;break c}case 43:{tb(l>>0|0,(b&255)>>>7|0,1);break}default:{}}Li(vb(m|0,4,0)|0|0,g,c);e=i;break}case 2:{Mi(vb(m|0,4,0)|0|0,g,vb(e>>0|0,1,1)|0|0);e=h+3|0;break}case 3:{Ni(k,g);break}default:e=c}while(0);c=e+1|0;b=vb(e>>0|0,1,0)|0|0;if(!(b<<24>>24))break a;else h=e}tb(a+3856+d>>0|0,b|0,1);d=(vb(l>>0|0,1,1)|0|0)+d|0;c=h+4|0;b=vb(i>>0|0,1,0)|0|0;if(!(b<<24>>24))break;else e=i}}while(0);if(c>>>0>=(vb(a+1188|0,4,0)|0|0)>>>0){b=vb(a+1180|0,4,0)|0|0;if(!b){Oi(a);b=c}}else b=c;tb(n|0,b|0,4);if(!d){a=a+1640|0;tb(a|0,d|0,4);return}if(vb(a+1645>>0|0,1,0)|0|0){a=a+1640|0;tb(a|0,d|0,4);return}Pi(a,d);a=a+1640|0;tb(a|0,d|0,4);return}function oi(a,b){a=a|0;b=b|0;var c=0,d=0;d=a+976|0;c=vb(d|0,4,0)|0|0;if((c|0)<(b|0)){Ei(a,b);c=vb(d|0,4,0)|0|0}if((c|0)<(b|0))Aa(17412,17434,263,18514);else{tb(d|0,c-b|0,4);return}}function pi(a,b,c){a=a|0;b=b|0;c=c|0;qi(a,b,c);return}function qi(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((b|0)<1)return;i=a+32|0;if(!((vb(i|0,4,0)|0)&3))j=0;else{ri(a,b);j=0}do{if((vb(a+40+(j*556|0)+148|0,4,0)|0|0)==-1){if((j|0)==2){k=0;l=(vb(i|0,4,0)|0|0)>>>5&2}else{k=0;l=0}while(1){d=vb(a+40+(j*556|0)+72+(l<<2)|0,4,0)|0|0;e=d>>(vb(a+40+(j*556|0)+88+(k*116|0)+20|0,4,0)|0);tb(a+40+(j*556|0)+88+(k*116|0)+60|0,O((vb((vb(a+40+(j*556|0)+88+(k*116|0)|0,4,0)|0|0)+(d<<2)|0,4,0)|0|0)+((vb(a+150956+((vb(a+40+(j*556|0)+40+(l<<2)|0,4,0)|0)<<2)|0,4,0)|0|0)>>>(7-(vb(a+40+(j*556|0)+56+(l<<2)|0,4,0)|0|0)|0))|0,vb(a+40+(j*556|0)+88+(k*116|0)+4|0,4,0)|0|0)|0|0,4);d=a+40+(j*556|0)+88+(k*116|0)+24|0;a:do if((vb(d|0,4,0)|0|0)!=(e|0)){tb(d|0,e|0,4);f=vb((vb(a+40+(j*556|0)+88+(k*116|0)+40|0,4,0)|0|0)+(e<<2)|0,4,0)|0|0;tb(a+40+(j*556|0)+88+(k*116|0)+80|0,f|0,4);g=vb((vb(a+40+(j*556|0)+88+(k*116|0)+44|0,4,0)|0|0)+(e<<2)|0,4,0)|0|0;tb(a+40+(j*556|0)+88+(k*116|0)+84|0,g|0,4);h=vb((vb(a+40+(j*556|0)+88+(k*116|0)+48|0,4,0)|0|0)+(e<<2)|0,4,0)|0|0;tb(a+40+(j*556|0)+88+(k*116|0)+88|0,h|0,4);d=vb((vb(a+40+(j*556|0)+88+(k*116|0)+52|0,4,0)|0|0)+(e<<2)|0,4,0)|0|0;tb(a+40+(j*556|0)+88+(k*116|0)+92|0,d|0,4);e=vb(a+40+(j*556|0)+88+(k*116|0)+64|0,4,0)|0|0;switch(e|0){case 0:{tb(a+40+(j*556|0)+88+(k*116|0)+72|0,f|0,4);break a}case 1:{tb(a+40+(j*556|0)+88+(k*116|0)+72|0,g|0,4);break a}default:{if((vb(a+40+(j*556|0)+88+(k*116|0)+68|0,4,0)|0|0)>=536870912)break a;switch(e|0){case 2:{tb(a+40+(j*556|0)+88+(k*116|0)+72|0,h|0,4);break a}case 3:{tb(a+40+(j*556|0)+88+(k*116|0)+72|0,d|0,4);break a}default:break a}}}}while(0);k=k+1|0;if((k|0)==4)break;else l=(l|0)==0?0:l^2^l>>1}}j=j+1|0}while((j|0)!=6);e=a+5424|0;f=a+5428|0;d=vb(e|0,4,0)|0|0;if(!(d&1)){kb[(xb(vb(9624+((vb(a+64|0,4,0)|0)<<2)|0,4,0)|0|0,15|0)|0)&15](f,a+40|0,c,b);d=vb(e|0,4,0)|0|0}if(!(d&2)){kb[(xb(vb(9624+((vb(a+620|0,4,0)|0)<<2)|0,4,0)|0|0,15|0)|0)&15](f,a+596|0,c,b);d=vb(e|0,4,0)|0|0}if(!(d&4)){kb[(xb(vb(9624+((vb(a+1176|0,4,0)|0)<<2)|0,4,0)|0|0,15|0)|0)&15](f,a+1152|0,c,b);d=vb(e|0,4,0)|0|0}if(!(d&8)){kb[(xb(vb(9624+((vb(a+1732|0,4,0)|0)<<2)|0,4,0)|0|0,15|0)|0)&15](f,a+1708|0,c,b);d=vb(e|0,4,0)|0|0}if(!(d&16)){kb[(xb(vb(9624+((vb(a+2288|0,4,0)|0)<<2)|0,4,0)|0|0,15|0)|0)&15](f,a+2264|0,c,b);d=vb(e|0,4,0)|0|0}if((d&32|0)==0?(vb(a+36|0,4,0)|0|0)==0:0)kb[(xb(vb(9624+((vb(a+2844|0,4,0)|0)<<2)|0,4,0)|0|0,15|0)|0)&15](f,a+2820|0,c,b);b=O(vb(a+13624|0,4,0)|0|0,b)|0;a=a+13620|0;tb(a|0,(vb(a|0,4,0)|0|0)+b|0,4);return}function ri(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=a+32|0;j=a+28|0;f=a+4|0;i=a+24|0;h=a+16|0;g=a+12|0;k=a+1152|0;c=vb(e|0,4,0)|0|0;do{d=(b|0)<6?b:6;b=b-d|0;d=O(d,vb(a|0,4,0)|0|0)|0;if(((c&1|0)!=0?(m=(vb(h|0,4,0)|0|0)-d|0,tb(h|0,m|0,4),(m|0)<1):0)?(tb(f|0,vb(f|0,4,0)|0|c>>>2&1|0,4),tb(h|0,m+(vb(g|0,4,0)|0|0)|0,4),(c&128|0)!=0):0){Di(a,k,0);Di(a,k,1);Di(a,k,2);Di(a,k,3);c=vb(e|0,4,0)|0|0}if(c&2|0?(l=(vb(j|0,4,0)|0|0)-d|0,tb(j|0,l|0,4),(l|0)<1):0){tb(f|0,vb(f|0,4,0)|0|c>>>2&2|0,4);tb(j|0,l+(vb(i|0,4,0)|0|0)|0,4)}}while((b|0)>0);return}function si(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0;L=b+436|0;r=b+504|0;e=vb(r|0,4,0)|0|0;M=b+4|0;N=b+88|0;x=b+144|0;P=b+320|0;z=b+376|0;Q=b+204|0;A=b+260|0;y=b+492|0;m=vb(a+8196|0,4,0)|0|0;if((e|0)==536870912)return;s=b+156|0;H=b+100|0;V=b+120|0;n=b+196|0;R=b+124|0;t=b+388|0;I=b+332|0;W=b+352|0;p=b+428|0;T=b+356|0;u=b+272|0;J=b+216|0;X=b+236|0;q=b+312|0;U=b+240|0;K=b+448|0;Y=b+468|0;o=b+544|0;S=b+472|0;v=b+28|0;w=b+32|0;B=b+148|0;C=b+380|0;D=b+264|0;E=b+496|0;F=b+16|0;G=b+20|0;f=vb(a+8192|0,4,0)|0|0;l=vb(M|0,4,0)|0|0;g=vb(x|0,4,0)|0|0;h=vb(z|0,4,0)|0|0;i=vb(A|0,4,0)|0|0;j=vb(y|0,4,0)|0|0;while(1){f=f+m|0;Z=f>>>18&1023;$=vb(a+26744+(Z<<1)|0,2,0)|0|0;_=(vb(a+10344+((vb(s|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(H|0,4,0)|0|0)|0;ba=(vb(a+10344+((vb(t|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(I|0,4,0)|0|0)|0;aa=(vb(a+10344+((vb(u|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(J|0,4,0)|0|0)|0;e=(vb(a+10344+(e>>16<<1)|0,2,0)|0|0)+(vb(K|0,4,0)|0|0)|0;k=vb(b|0,4,0)|0|0;_=vb(a+30840+((vb(a+((((k+l>>(vb(v|0,4,0)|0))+g|0)>>>14&4095)<<1)|0,2,0)|0|0)+(_-(vb(R|0,4,0)|0|0)>>31&($>>(vb(n|0,4,0)|0))+(_^(vb(V|0,4,0)|0)))<<2)|0,4,0)|0|0;l=(vb(a+30840+((vb(a+((((vb(a+30840+((vb(a+((((vb(a+30840+((vb(a+(((k+h|0)>>>14&4095)<<1)|0,2,0)|0|0)+(ba-(vb(T|0,4,0)|0|0)>>31&($>>(vb(p|0,4,0)|0))+(ba^(vb(W|0,4,0)|0)))<<2)|0,4,0)|0|0)+i|0)>>>14&4095)<<1)|0,2,0)|0|0)+(aa-(vb(U|0,4,0)|0|0)>>31&($>>(vb(q|0,4,0)|0))+(aa^(vb(X|0,4,0)|0)))<<2)|0,4,0)|0|0)+j|0)>>>14&4095)<<1)|0,2,0)|0|0)+(e-(vb(S|0,4,0)|0|0)>>31&($>>(vb(o|0,4,0)|0))+(e^(vb(Y|0,4,0)|0)))<<2)|0,4,0)|0)>>16;Z=((O(vb(a+28792+(Z<<1)|0,2,0)|0|0,vb(w|0,4,0)|0|0)|0)>>10)+256|0;g=((O(Z,vb(B|0,4,0)|0|0)|0)>>>8)+g|0;h=((O(Z,vb(C|0,4,0)|0|0)|0)>>>8)+h|0;i=((O(vb(D|0,4,0)|0|0,Z)|0)>>>8)+i|0;j=((O(vb(E|0,4,0)|0|0,Z)|0)>>>8)+j|0;Z=((vb(F|0,4,0)|0)&l)+(vb(c|0,2,1)|0|0)|0;e=c+2|0;l=((vb(G|0,4,0)|0)&l)+(vb(e|0,2,1)|0|0)|0;Ai(N);Ai(Q);Ai(P);Ai(L);tb(b|0,_|0,4);tb(c|0,Z|0,2);tb(e|0,l|0,2);d=d+-1|0;if(!d)break;e=vb(r|0,4,0)|0|0;l=k;c=c+4|0}tb(M|0,k|0,4);tb(x|0,g|0,4);tb(z|0,h|0,4);tb(A|0,i|0,4);tb(y|0,j|0,4);return}function ti(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0;L=b+436|0;r=b+504|0;e=vb(r|0,4,0)|0|0;M=b+4|0;N=b+88|0;x=b+144|0;P=b+320|0;z=b+376|0;Q=b+204|0;A=b+260|0;y=b+492|0;m=vb(a+8196|0,4,0)|0|0;if((e|0)==536870912)return;s=b+156|0;H=b+100|0;V=b+120|0;n=b+196|0;R=b+124|0;t=b+388|0;I=b+332|0;W=b+352|0;p=b+428|0;T=b+356|0;u=b+272|0;J=b+216|0;X=b+236|0;q=b+312|0;U=b+240|0;K=b+448|0;Y=b+468|0;o=b+544|0;S=b+472|0;v=b+28|0;w=b+32|0;B=b+148|0;C=b+380|0;D=b+264|0;E=b+496|0;F=b+16|0;G=b+20|0;f=vb(a+8192|0,4,0)|0|0;l=vb(M|0,4,0)|0|0;g=vb(x|0,4,0)|0|0;h=vb(z|0,4,0)|0|0;i=vb(A|0,4,0)|0|0;j=vb(y|0,4,0)|0|0;while(1){f=f+m|0;Z=f>>>18&1023;$=vb(a+26744+(Z<<1)|0,2,0)|0|0;_=(vb(a+10344+((vb(s|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(H|0,4,0)|0|0)|0;ba=(vb(a+10344+((vb(t|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(I|0,4,0)|0|0)|0;aa=(vb(a+10344+((vb(u|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(J|0,4,0)|0|0)|0;e=(vb(a+10344+(e>>16<<1)|0,2,0)|0|0)+(vb(K|0,4,0)|0|0)|0;k=vb(b|0,4,0)|0|0;_=vb(a+30840+((vb(a+((((k+l>>(vb(v|0,4,0)|0))+g|0)>>>14&4095)<<1)|0,2,0)|0|0)+(_-(vb(R|0,4,0)|0|0)>>31&($>>(vb(n|0,4,0)|0))+(_^(vb(V|0,4,0)|0)))<<2)|0,4,0)|0|0;l=(vb(a+30840+((vb(a+((((vb(a+30840+((vb(a+(((k+i+(vb(a+30840+((vb(a+((h>>>14&4095)<<1)|0,2,0)|0|0)+(ba-(vb(T|0,4,0)|0|0)>>31&($>>(vb(p|0,4,0)|0))+(ba^(vb(W|0,4,0)|0)))<<2)|0,4,0)|0|0)|0)>>>14&4095)<<1)|0,2,0)|0|0)+(aa-(vb(U|0,4,0)|0|0)>>31&($>>(vb(q|0,4,0)|0))+(aa^(vb(X|0,4,0)|0)))<<2)|0,4,0)|0|0)+j|0)>>>14&4095)<<1)|0,2,0)|0|0)+(e-(vb(S|0,4,0)|0|0)>>31&($>>(vb(o|0,4,0)|0))+(e^(vb(Y|0,4,0)|0)))<<2)|0,4,0)|0)>>16;Z=((O(vb(a+28792+(Z<<1)|0,2,0)|0|0,vb(w|0,4,0)|0|0)|0)>>10)+256|0;g=((O(Z,vb(B|0,4,0)|0|0)|0)>>>8)+g|0;h=((O(Z,vb(C|0,4,0)|0|0)|0)>>>8)+h|0;i=((O(vb(D|0,4,0)|0|0,Z)|0)>>>8)+i|0;j=((O(vb(E|0,4,0)|0|0,Z)|0)>>>8)+j|0;Z=((vb(F|0,4,0)|0)&l)+(vb(c|0,2,1)|0|0)|0;e=c+2|0;l=((vb(G|0,4,0)|0)&l)+(vb(e|0,2,1)|0|0)|0;Ai(N);Ai(Q);Ai(P);Ai(L);tb(b|0,_|0,4);tb(c|0,Z|0,2);tb(e|0,l|0,2);d=d+-1|0;if(!d)break;e=vb(r|0,4,0)|0|0;l=k;c=c+4|0}tb(M|0,k|0,4);tb(x|0,g|0,4);tb(z|0,h|0,4);tb(A|0,i|0,4);tb(y|0,j|0,4);return}function ui(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0;L=b+436|0;r=b+504|0;e=vb(r|0,4,0)|0|0;M=b+4|0;N=b+88|0;x=b+144|0;P=b+320|0;z=b+376|0;Q=b+204|0;A=b+260|0;y=b+492|0;m=vb(a+8196|0,4,0)|0|0;if((e|0)==536870912)return;s=b+156|0;H=b+100|0;V=b+120|0;n=b+196|0;R=b+124|0;t=b+388|0;I=b+332|0;W=b+352|0;p=b+428|0;T=b+356|0;u=b+272|0;J=b+216|0;X=b+236|0;q=b+312|0;U=b+240|0;K=b+448|0;Y=b+468|0;o=b+544|0;S=b+472|0;v=b+28|0;w=b+32|0;B=b+148|0;C=b+380|0;D=b+264|0;E=b+496|0;F=b+16|0;G=b+20|0;f=vb(a+8192|0,4,0)|0|0;l=vb(M|0,4,0)|0|0;g=vb(x|0,4,0)|0|0;h=vb(z|0,4,0)|0|0;i=vb(A|0,4,0)|0|0;j=vb(y|0,4,0)|0|0;while(1){f=f+m|0;Z=f>>>18&1023;$=vb(a+26744+(Z<<1)|0,2,0)|0|0;_=(vb(a+10344+((vb(s|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(H|0,4,0)|0|0)|0;ba=(vb(a+10344+((vb(t|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(I|0,4,0)|0|0)|0;aa=(vb(a+10344+((vb(u|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(J|0,4,0)|0|0)|0;e=(vb(a+10344+(e>>16<<1)|0,2,0)|0|0)+(vb(K|0,4,0)|0|0)|0;k=vb(b|0,4,0)|0|0;_=vb(a+30840+((vb(a+((((k+l>>(vb(v|0,4,0)|0))+g|0)>>>14&4095)<<1)|0,2,0)|0|0)+(_-(vb(R|0,4,0)|0|0)>>31&($>>(vb(n|0,4,0)|0))+(_^(vb(V|0,4,0)|0)))<<2)|0,4,0)|0|0;l=(vb(a+30840+((vb(a+(((k+j+(vb(a+30840+((vb(a+((((vb(a+30840+((vb(a+((h>>>14&4095)<<1)|0,2,0)|0|0)+(ba-(vb(T|0,4,0)|0|0)>>31&($>>(vb(p|0,4,0)|0))+(ba^(vb(W|0,4,0)|0)))<<2)|0,4,0)|0|0)+i|0)>>>14&4095)<<1)|0,2,0)|0|0)+(aa-(vb(U|0,4,0)|0|0)>>31&($>>(vb(q|0,4,0)|0))+(aa^(vb(X|0,4,0)|0)))<<2)|0,4,0)|0|0)|0)>>>14&4095)<<1)|0,2,0)|0|0)+(e-(vb(S|0,4,0)|0|0)>>31&($>>(vb(o|0,4,0)|0))+(e^(vb(Y|0,4,0)|0)))<<2)|0,4,0)|0)>>16;Z=((O(vb(a+28792+(Z<<1)|0,2,0)|0|0,vb(w|0,4,0)|0|0)|0)>>10)+256|0;g=((O(Z,vb(B|0,4,0)|0|0)|0)>>>8)+g|0;h=((O(Z,vb(C|0,4,0)|0|0)|0)>>>8)+h|0;i=((O(vb(D|0,4,0)|0|0,Z)|0)>>>8)+i|0;j=((O(vb(E|0,4,0)|0|0,Z)|0)>>>8)+j|0;Z=((vb(F|0,4,0)|0)&l)+(vb(c|0,2,1)|0|0)|0;e=c+2|0;l=((vb(G|0,4,0)|0)&l)+(vb(e|0,2,1)|0|0)|0;Ai(N);Ai(Q);Ai(P);Ai(L);tb(b|0,_|0,4);tb(c|0,Z|0,2);tb(e|0,l|0,2);d=d+-1|0;if(!d)break;e=vb(r|0,4,0)|0|0;l=k;c=c+4|0}tb(M|0,k|0,4);tb(x|0,g|0,4);tb(z|0,h|0,4);tb(A|0,i|0,4);tb(y|0,j|0,4);return}function vi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0;L=b+436|0;r=b+504|0;e=vb(r|0,4,0)|0|0;M=b+4|0;N=b+88|0;x=b+144|0;P=b+320|0;z=b+376|0;Q=b+204|0;A=b+260|0;y=b+492|0;m=vb(a+8196|0,4,0)|0|0;if((e|0)==536870912)return;s=b+156|0;H=b+100|0;V=b+120|0;n=b+196|0;R=b+124|0;t=b+388|0;I=b+332|0;W=b+352|0;p=b+428|0;T=b+356|0;u=b+272|0;J=b+216|0;X=b+236|0;q=b+312|0;U=b+240|0;K=b+448|0;Y=b+468|0;o=b+544|0;S=b+472|0;v=b+28|0;w=b+32|0;B=b+148|0;C=b+380|0;D=b+264|0;E=b+496|0;F=b+16|0;G=b+20|0;f=vb(a+8192|0,4,0)|0|0;l=vb(M|0,4,0)|0|0;g=vb(x|0,4,0)|0|0;h=vb(z|0,4,0)|0|0;i=vb(A|0,4,0)|0|0;j=vb(y|0,4,0)|0|0;while(1){f=f+m|0;Z=f>>>18&1023;$=vb(a+26744+(Z<<1)|0,2,0)|0|0;_=(vb(a+10344+((vb(s|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(H|0,4,0)|0|0)|0;ba=(vb(a+10344+((vb(t|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(I|0,4,0)|0|0)|0;aa=(vb(a+10344+((vb(u|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(J|0,4,0)|0|0)|0;e=(vb(a+10344+(e>>16<<1)|0,2,0)|0|0)+(vb(K|0,4,0)|0|0)|0;k=vb(b|0,4,0)|0|0;_=vb(a+30840+((vb(a+((((k+l>>(vb(v|0,4,0)|0))+g|0)>>>14&4095)<<1)|0,2,0)|0|0)+(_-(vb(R|0,4,0)|0|0)>>31&($>>(vb(n|0,4,0)|0))+(_^(vb(V|0,4,0)|0)))<<2)|0,4,0)|0|0;l=(vb(a+30840+((vb(a+((((vb(a+30840+((vb(a+(((k+h|0)>>>14&4095)<<1)|0,2,0)|0|0)+(ba-(vb(T|0,4,0)|0|0)>>31&($>>(vb(p|0,4,0)|0))+(ba^(vb(W|0,4,0)|0)))<<2)|0,4,0)|0|0)+j+(vb(a+30840+((vb(a+((i>>>14&4095)<<1)|0,2,0)|0|0)+(aa-(vb(U|0,4,0)|0|0)>>31&($>>(vb(q|0,4,0)|0))+(aa^(vb(X|0,4,0)|0)))<<2)|0,4,0)|0|0)|0)>>>14&4095)<<1)|0,2,0)|0|0)+(e-(vb(S|0,4,0)|0|0)>>31&($>>(vb(o|0,4,0)|0))+(e^(vb(Y|0,4,0)|0)))<<2)|0,4,0)|0)>>16;Z=((O(vb(a+28792+(Z<<1)|0,2,0)|0|0,vb(w|0,4,0)|0|0)|0)>>10)+256|0;g=((O(Z,vb(B|0,4,0)|0|0)|0)>>>8)+g|0;h=((O(Z,vb(C|0,4,0)|0|0)|0)>>>8)+h|0;i=((O(vb(D|0,4,0)|0|0,Z)|0)>>>8)+i|0;j=((O(vb(E|0,4,0)|0|0,Z)|0)>>>8)+j|0;Z=((vb(F|0,4,0)|0)&l)+(vb(c|0,2,1)|0|0)|0;e=c+2|0;l=((vb(G|0,4,0)|0)&l)+(vb(e|0,2,1)|0|0)|0;Ai(N);Ai(Q);Ai(P);Ai(L);tb(b|0,_|0,4);tb(c|0,Z|0,2);tb(e|0,l|0,2);d=d+-1|0;if(!d)break;e=vb(r|0,4,0)|0|0;l=k;c=c+4|0}tb(M|0,k|0,4);tb(x|0,g|0,4);tb(z|0,h|0,4);tb(A|0,i|0,4);tb(y|0,j|0,4);return}function wi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0;M=b+436|0;s=b+504|0;f=vb(s|0,4,0)|0|0;P=b+320|0;u=b+388|0;e=vb(u|0,4,0)|0|0;Q=b+4|0;R=b+88|0;y=b+144|0;z=b+376|0;N=b+204|0;A=b+260|0;B=b+492|0;n=vb(a+8196|0,4,0)|0|0;if(!(e+-536870912|f+-536870912))return;t=b+156|0;I=b+100|0;W=b+120|0;o=b+196|0;S=b+124|0;J=b+332|0;Y=b+352|0;q=b+428|0;U=b+356|0;v=b+272|0;K=b+216|0;Z=b+236|0;r=b+312|0;V=b+240|0;L=b+448|0;X=b+468|0;p=b+544|0;T=b+472|0;w=b+28|0;x=b+32|0;C=b+148|0;D=b+380|0;E=b+264|0;F=b+496|0;G=b+16|0;H=b+20|0;g=vb(a+8192|0,4,0)|0|0;m=vb(Q|0,4,0)|0|0;h=vb(y|0,4,0)|0|0;i=vb(z|0,4,0)|0|0;j=vb(A|0,4,0)|0|0;k=vb(B|0,4,0)|0|0;while(1){g=g+n|0;$=g>>>18&1023;aa=vb(a+26744+($<<1)|0,2,0)|0|0;_=(vb(a+10344+((vb(t|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(I|0,4,0)|0|0)|0;ca=(vb(a+10344+(e>>16<<1)|0,2,0)|0|0)+(vb(J|0,4,0)|0|0)|0;ba=(vb(a+10344+((vb(v|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(K|0,4,0)|0|0)|0;e=(vb(a+10344+(f>>16<<1)|0,2,0)|0|0)+(vb(L|0,4,0)|0|0)|0;l=vb(b|0,4,0)|0|0;_=vb(a+30840+((vb(a+((((l+m>>(vb(w|0,4,0)|0))+h|0)>>>14&4095)<<1)|0,2,0)|0|0)+(_-(vb(S|0,4,0)|0|0)>>31&(aa>>(vb(o|0,4,0)|0))+(_^(vb(W|0,4,0)|0)))<<2)|0,4,0)|0|0;m=(vb(a+30840+((vb(a+(((l+i|0)>>>14&4095)<<1)|0,2,0)|0|0)+(ca-(vb(U|0,4,0)|0|0)>>31&(aa>>(vb(q|0,4,0)|0))+(ca^(vb(Y|0,4,0)|0)))<<2)|0,4,0)|0|0)+(vb(a+30840+((vb(a+((((vb(a+30840+((vb(a+((j>>>14&4095)<<1)|0,2,0)|0|0)+(ba-(vb(V|0,4,0)|0|0)>>31&(aa>>(vb(r|0,4,0)|0))+(ba^(vb(Z|0,4,0)|0)))<<2)|0,4,0)|0|0)+k|0)>>>14&4095)<<1)|0,2,0)|0|0)+(e-(vb(T|0,4,0)|0|0)>>31&(aa>>(vb(p|0,4,0)|0))+(e^(vb(X|0,4,0)|0)))<<2)|0,4,0)|0|0)>>16;e=((O(vb(a+28792+($<<1)|0,2,0)|0|0,vb(x|0,4,0)|0|0)|0)>>10)+256|0;h=((O(e,vb(C|0,4,0)|0|0)|0)>>>8)+h|0;i=((O(e,vb(D|0,4,0)|0|0)|0)>>>8)+i|0;j=((O(vb(E|0,4,0)|0|0,e)|0)>>>8)+j|0;k=((O(vb(F|0,4,0)|0|0,e)|0)>>>8)+k|0;e=((vb(G|0,4,0)|0)&m)+(vb(c|0,2,1)|0|0)|0;f=c+2|0;m=((vb(H|0,4,0)|0)&m)+(vb(f|0,2,1)|0|0)|0;Ai(R);Ai(N);Ai(P);Ai(M);tb(b|0,_|0,4);tb(c|0,e|0,2);tb(f|0,m|0,2);d=d+-1|0;if(!d)break;e=vb(u|0,4,0)|0|0;f=vb(s|0,4,0)|0|0;m=l;c=c+4|0}tb(Q|0,l|0,4);tb(y|0,h|0,4);tb(z|0,i|0,4);tb(A|0,j|0,4);tb(B|0,k|0,4);return}function xi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0;N=b+436|0;t=b+504|0;g=vb(t|0,4,0)|0|0;R=b+204|0;v=b+272|0;f=vb(v|0,4,0)|0|0;S=b+320|0;w=b+388|0;e=vb(w|0,4,0)|0|0;P=b+4|0;Q=b+88|0;z=b+144|0;A=b+376|0;B=b+260|0;C=b+492|0;o=vb(a+8196|0,4,0)|0|0;if(!(f+-536870912|g+-536870912|e+-536870912))return;u=b+156|0;J=b+100|0;X=b+120|0;p=b+196|0;T=b+124|0;L=b+332|0;Z=b+352|0;r=b+428|0;V=b+356|0;M=b+216|0;_=b+236|0;s=b+312|0;W=b+240|0;K=b+448|0;Y=b+468|0;q=b+544|0;U=b+472|0;x=b+28|0;y=b+32|0;D=b+148|0;E=b+380|0;F=b+264|0;G=b+496|0;H=b+16|0;I=b+20|0;h=vb(a+8192|0,4,0)|0|0;n=vb(P|0,4,0)|0|0;i=vb(z|0,4,0)|0|0;j=vb(A|0,4,0)|0|0;k=vb(B|0,4,0)|0|0;l=vb(C|0,4,0)|0|0;while(1){h=h+o|0;$=h>>>18&1023;aa=vb(a+26744+($<<1)|0,2,0)|0|0;ca=(vb(a+10344+((vb(u|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(J|0,4,0)|0|0)|0;ba=(vb(a+10344+(e>>16<<1)|0,2,0)|0|0)+(vb(L|0,4,0)|0|0)|0;f=(vb(a+10344+(f>>16<<1)|0,2,0)|0|0)+(vb(M|0,4,0)|0|0)|0;g=(vb(a+10344+(g>>16<<1)|0,2,0)|0|0)+(vb(K|0,4,0)|0|0)|0;m=vb(b|0,4,0)|0|0;e=vb(a+30840+((vb(a+((((m+n>>(vb(x|0,4,0)|0))+i|0)>>>14&4095)<<1)|0,2,0)|0|0)+(ca-(vb(T|0,4,0)|0|0)>>31&(aa>>(vb(p|0,4,0)|0))+(ca^(vb(X|0,4,0)|0)))<<2)|0,4,0)|0|0;n=(vb(a+30840+((vb(a+(((m+j|0)>>>14&4095)<<1)|0,2,0)|0|0)+(ba-(vb(V|0,4,0)|0|0)>>31&(aa>>(vb(r|0,4,0)|0))+(ba^(vb(Z|0,4,0)|0)))<<2)|0,4,0)|0|0)+(vb(a+30840+((vb(a+(((m+l|0)>>>14&4095)<<1)|0,2,0)|0|0)+(g-(vb(U|0,4,0)|0|0)>>31&(aa>>(vb(q|0,4,0)|0))+(g^(vb(Y|0,4,0)|0)))<<2)|0,4,0)|0|0)+(vb(a+30840+((vb(a+(((m+k|0)>>>14&4095)<<1)|0,2,0)|0|0)+(f-(vb(W|0,4,0)|0|0)>>31&(aa>>(vb(s|0,4,0)|0))+(f^(vb(_|0,4,0)|0)))<<2)|0,4,0)|0|0)>>16;f=((O(vb(a+28792+($<<1)|0,2,0)|0|0,vb(y|0,4,0)|0|0)|0)>>10)+256|0;i=((O(f,vb(D|0,4,0)|0|0)|0)>>>8)+i|0;j=((O(f,vb(E|0,4,0)|0|0)|0)>>>8)+j|0;k=((O(vb(F|0,4,0)|0|0,f)|0)>>>8)+k|0;l=((O(vb(G|0,4,0)|0|0,f)|0)>>>8)+l|0;f=((vb(H|0,4,0)|0)&n)+(vb(c|0,2,1)|0|0)|0;g=c+2|0;n=((vb(I|0,4,0)|0)&n)+(vb(g|0,2,1)|0|0)|0;Ai(Q);Ai(R);Ai(S);Ai(N);tb(b|0,e|0,4);tb(c|0,f|0,2);tb(g|0,n|0,2);d=d+-1|0;if(!d)break;e=vb(w|0,4,0)|0|0;f=vb(v|0,4,0)|0|0;g=vb(t|0,4,0)|0|0;n=m;c=c+4|0}tb(P|0,m|0,4);tb(z|0,i|0,4);tb(A|0,j|0,4);tb(B|0,k|0,4);tb(C|0,l|0,4);return}function yi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0;N=b+436|0;t=b+504|0;g=vb(t|0,4,0)|0|0;R=b+204|0;v=b+272|0;f=vb(v|0,4,0)|0|0;S=b+320|0;w=b+388|0;e=vb(w|0,4,0)|0|0;P=b+4|0;Q=b+88|0;z=b+144|0;A=b+376|0;B=b+260|0;C=b+492|0;o=vb(a+8196|0,4,0)|0|0;if(!(f+-536870912|g+-536870912|e+-536870912))return;u=b+156|0;J=b+100|0;X=b+120|0;p=b+196|0;T=b+124|0;L=b+332|0;Z=b+352|0;r=b+428|0;V=b+356|0;M=b+216|0;_=b+236|0;s=b+312|0;W=b+240|0;K=b+448|0;Y=b+468|0;q=b+544|0;U=b+472|0;x=b+28|0;y=b+32|0;D=b+148|0;E=b+380|0;F=b+264|0;G=b+496|0;H=b+16|0;I=b+20|0;h=vb(a+8192|0,4,0)|0|0;n=vb(P|0,4,0)|0|0;i=vb(z|0,4,0)|0|0;j=vb(A|0,4,0)|0|0;k=vb(B|0,4,0)|0|0;l=vb(C|0,4,0)|0|0;while(1){h=h+o|0;$=h>>>18&1023;aa=vb(a+26744+($<<1)|0,2,0)|0|0;ca=(vb(a+10344+((vb(u|0,4,0)|0)>>16<<1)|0,2,0)|0|0)+(vb(J|0,4,0)|0|0)|0;ba=(vb(a+10344+(e>>16<<1)|0,2,0)|0|0)+(vb(L|0,4,0)|0|0)|0;f=(vb(a+10344+(f>>16<<1)|0,2,0)|0|0)+(vb(M|0,4,0)|0|0)|0;g=(vb(a+10344+(g>>16<<1)|0,2,0)|0|0)+(vb(K|0,4,0)|0|0)|0;m=vb(b|0,4,0)|0|0;e=vb(a+30840+((vb(a+((((m+n>>(vb(x|0,4,0)|0))+i|0)>>>14&4095)<<1)|0,2,0)|0|0)+(ca-(vb(T|0,4,0)|0|0)>>31&(aa>>(vb(p|0,4,0)|0))+(ca^(vb(X|0,4,0)|0)))<<2)|0,4,0)|0|0;n=(vb(a+30840+((vb(a+(((m+j|0)>>>14&4095)<<1)|0,2,0)|0|0)+(ba-(vb(V|0,4,0)|0|0)>>31&(aa>>(vb(r|0,4,0)|0))+(ba^(vb(Z|0,4,0)|0)))<<2)|0,4,0)|0|0)+(vb(a+30840+((vb(a+((l>>>14&4095)<<1)|0,2,0)|0|0)+(g-(vb(U|0,4,0)|0|0)>>31&(aa>>(vb(q|0,4,0)|0))+(g^(vb(Y|0,4,0)|0)))<<2)|0,4,0)|0|0)+(vb(a+30840+((vb(a+((k>>>14&4095)<<1)|0,2,0)|0|0)+(f-(vb(W|0,4,0)|0|0)>>31&(aa>>(vb(s|0,4,0)|0))+(f^(vb(_|0,4,0)|0)))<<2)|0,4,0)|0|0)>>16;f=((O(vb(a+28792+($<<1)|0,2,0)|0|0,vb(y|0,4,0)|0|0)|0)>>10)+256|0;i=((O(f,vb(D|0,4,0)|0|0)|0)>>>8)+i|0;j=((O(f,vb(E|0,4,0)|0|0)|0)>>>8)+j|0;k=((O(vb(F|0,4,0)|0|0,f)|0)>>>8)+k|0;l=((O(vb(G|0,4,0)|0|0,f)|0)>>>8)+l|0;f=((vb(H|0,4,0)|0)&n)+(vb(c|0,2,1)|0|0)|0;g=c+2|0;n=((vb(I|0,4,0)|0)&n)+(vb(g|0,2,1)|0|0)|0;Ai(Q);Ai(R);Ai(S);Ai(N);tb(b|0,e|0,4);tb(c|0,f|0,2);tb(g|0,n|0,2);d=d+-1|0;if(!d)break;e=vb(w|0,4,0)|0|0;f=vb(v|0,4,0)|0|0;g=vb(t|0,4,0)|0|0;n=m;c=c+4|0}tb(P|0,m|0,4);tb(z|0,i|0,4);tb(A|0,j|0,4);tb(B|0,k|0,4);tb(C|0,l|0,4);return}function zi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0;P=b+436|0;u=b+504|0;h=vb(u|0,4,0)|0|0;S=b+88|0;w=b+156|0;e=vb(w|0,4,0)|0|0;T=b+204|0;x=b+272|0;g=vb(x|0,4,0)|0|0;Q=b+320|0;v=b+388|0;f=vb(v|0,4,0)|0|0;R=b+4|0;A=b+144|0;B=b+376|0;C=b+260|0;D=b+492|0;p=vb(a+8196|0,4,0)|0|0;if(!(e+-536870912|h+-536870912|g+-536870912|f+-536870912))return;K=b+100|0;Y=b+120|0;q=b+196|0;U=b+124|0;M=b+332|0;_=b+352|0;s=b+428|0;W=b+356|0;N=b+216|0;$=b+236|0;t=b+312|0;X=b+240|0;L=b+448|0;Z=b+468|0;r=b+544|0;V=b+472|0;y=b+28|0;z=b+32|0;E=b+148|0;F=b+380|0;G=b+264|0;H=b+496|0;I=b+16|0;J=b+20|0;i=vb(a+8192|0,4,0)|0|0;o=vb(R|0,4,0)|0|0;j=vb(A|0,4,0)|0|0;k=vb(B|0,4,0)|0|0;l=vb(C|0,4,0)|0|0;m=vb(D|0,4,0)|0|0;while(1){i=i+p|0;aa=i>>>18&1023;ba=vb(a+26744+(aa<<1)|0,2,0)|0|0;ca=(vb(a+10344+(e>>16<<1)|0,2,0)|0|0)+(vb(K|0,4,0)|0|0)|0;e=(vb(a+10344+(f>>16<<1)|0,2,0)|0|0)+(vb(M|0,4,0)|0|0)|0;g=(vb(a+10344+(g>>16<<1)|0,2,0)|0|0)+(vb(N|0,4,0)|0|0)|0;h=(vb(a+10344+(h>>16<<1)|0,2,0)|0|0)+(vb(L|0,4,0)|0|0)|0;n=vb(b|0,4,0)|0|0;f=vb(a+30840+((vb(a+((((n+o>>(vb(y|0,4,0)|0))+j|0)>>>14&4095)<<1)|0,2,0)|0|0)+(ca-(vb(U|0,4,0)|0|0)>>31&(ba>>(vb(q|0,4,0)|0))+(ca^(vb(Y|0,4,0)|0)))<<2)|0,4,0)|0|0;o=(vb(a+30840+((vb(a+((m>>>14&4095)<<1)|0,2,0)|0|0)+(h-(vb(V|0,4,0)|0|0)>>31&(ba>>(vb(r|0,4,0)|0))+(h^(vb(Z|0,4,0)|0)))<<2)|0,4,0)|0|0)+n+(vb(a+30840+((vb(a+((k>>>14&4095)<<1)|0,2,0)|0|0)+(e-(vb(W|0,4,0)|0|0)>>31&(ba>>(vb(s|0,4,0)|0))+(e^(vb(_|0,4,0)|0)))<<2)|0,4,0)|0|0)+(vb(a+30840+((vb(a+((l>>>14&4095)<<1)|0,2,0)|0|0)+(g-(vb(X|0,4,0)|0|0)>>31&(ba>>(vb(t|0,4,0)|0))+(g^(vb($|0,4,0)|0)))<<2)|0,4,0)|0|0)>>16;g=((O(vb(a+28792+(aa<<1)|0,2,0)|0|0,vb(z|0,4,0)|0|0)|0)>>10)+256|0;j=((O(g,vb(E|0,4,0)|0|0)|0)>>>8)+j|0;k=((O(g,vb(F|0,4,0)|0|0)|0)>>>8)+k|0;l=((O(vb(G|0,4,0)|0|0,g)|0)>>>8)+l|0;m=((O(vb(H|0,4,0)|0|0,g)|0)>>>8)+m|0;g=((vb(I|0,4,0)|0)&o)+(vb(c|0,2,1)|0|0)|0;h=c+2|0;o=((vb(J|0,4,0)|0)&o)+(vb(h|0,2,1)|0|0)|0;Ai(S);Ai(T);Ai(Q);Ai(P);tb(b|0,f|0,4);tb(c|0,g|0,2);tb(h|0,o|0,2);d=d+-1|0;if(!d)break;e=vb(w|0,4,0)|0|0;f=vb(v|0,4,0)|0|0;g=vb(x|0,4,0)|0|0;h=vb(u|0,4,0)|0|0;o=n;c=c+4|0}tb(R|0,n|0,4);tb(A|0,j|0,4);tb(B|0,k|0,4);tb(C|0,l|0,4);tb(D|0,m|0,4);return}function Ai(a){a=a|0;var b=0,c=0,d=0;b=vb(a+76|0,4,0)|0|0;d=a+68|0;c=(vb(d|0,4,0)|0|0)+(vb(a+72|0,4,0)|0|0)|0;tb(d|0,c|0,4);if((c|0)<(b|0))return;Bi(a);return}function Bi(a){a=a|0;var b=0,c=0;c=a+64|0;a:do switch(vb(c|0,4,0)|0|0){case 0:{tb(a+68|0,268435456|0,4);tb(a+72|0,vb(a+84|0,4,0)|0|0,4);tb(a+76|0,vb(a+16|0,4,0)|0|0,4);tb(c|0,1|0,4);return}case 1:{tb(a+68|0,vb(a+16|0,4,0)|0|0,4);tb(a+72|0,vb(a+88|0,4,0)|0|0,4);tb(a+76|0,536870912|0,4);tb(c|0,2|0,4);return}case 2:{b=vb(a+28|0,4,0)|0|0;if(b&8|0){if(b&1|0){Ci(a,b<<1&4);break a}tb(a+68|0,0|0,4);tb(a+72|0,vb(a+80|0,4,0)|0|0,4);tb(a+76|0,268435456|0,4);tb(c|0,0|0,4);Ci(a,b<<1&4);return}break}case 3:break;default:return}while(0);tb(a+68|0,536870912|0,4);tb(a+72|0,0|0,4);tb(a+76|0,536870913|0,4);return}function Ci(a,b){a=a|0;b=b|0;var c=0,d=0;d=a+32|0;tb(d|0,0|0,4);c=a+36|0;tb(c|0,2147483647|0,4);tb(a+28|0,b|0,4);if(!(b&4))return;tb(d|0,4095|0,4);tb(c|0,4095|0,4);return}function Di(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=b+88+(c*116|0)+64|0;if((vb(d|0,4,0)|0|0)!=3)return;tb(b+88+(c*116|0)+56|0,0|0,4);f=b+88+(c*116|0)+68|0;e=b+88+(c*116|0)+104|0;tb(f|0,(vb(e|0,4,0)|0)&(vb(a+134572+((vb(a+15772+((vb(f|0,4,0)|0)>>16<<1)|0,2,0)|0)<<2)|0,4,0)|0)|0,4);tb(e|0,-1|0,4);tb(b+88+(c*116|0)+72|0,vb(b+88+(c*116|0)+80|0,4,0)|0|0,4);tb(b+88+(c*116|0)+76|0,268435456|0,4);tb(d|0,0|0,4);return}function Ei(a,b){a=a|0;b=b|0;var c=0,d=0;d=a+976|0;c=vb(d|0,4,0)|0|0;if((c|0)>(b|0))Aa(17453,17434,236,17475);if((c|0)>=(b|0))return;c=vb((vb(a|0,4,0)|0|0)+16|0,4,0)|0|0;if(c|0){mh(c);Fi(a+16|0,vb(d|0,4,0)|0|0,b)}c=vb((vb(a+4|0,4,0)|0|0)+16|0,4,0)|0|0;if(c|0){mh(c);Fi(a+64|0,vb(d|0,4,0)|0|0,b)}c=vb((vb(a+8|0,4,0)|0|0)+16|0,4,0)|0|0;if(c|0){mh(c);Fi(a+112|0,vb(d|0,4,0)|0|0,b)}c=vb((vb(a+12|0,4,0)|0|0)+16|0,4,0)|0|0;if(c|0){mh(c);Gi(a+984|0,vb(d|0,4,0)|0|0,b)}tb(d|0,b|0,4);return}function Fi(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;l=a+32|0;d=vb(l|0,4,0)|0|0;i=a+28|0;e=vb(i|0,4,0)|0|0;if(d|0?(j=a+36|0,(vb(j|0,4,0)|0|0)>=129):0){k=a+40|0;f=vb(k|0,4,0)|0|0?d:0-d|0;d=f-e|0;if(d|0){tb(i|0,f|0,4);oh(vb(a+44|0,4,0)|0|0,b,d,vb(a+16|0,4,0)|0|0)}h=a+24|0;d=(vb(h|0,4,0)|0|0)+b|0;if((d|0)>=(c|0)){l=h;k=d;c=k-c|0;tb(l|0,c|0,4);return}g=vb(a+16|0,4,0)|0|0;b=a+44|0;f=f<<1;do{f=0-f|0;Ki(vb(b|0,4,0)|0|0,d,f,g);d=(vb(j|0,4,0)|0|0)+d|0;e=(vb(k|0,4,0)|0)^1;tb(k|0,e|0,4)}while((d|0)<(c|0));l=vb(l|0,4,0)|0|0;tb(i|0,(e|0?l:0-l|0)|0,4);l=h;k=d;c=k-c|0;tb(l|0,c|0,4);return}if(e|0){oh(vb(a+44|0,4,0)|0|0,b,0-e|0,vb(a+16|0,4,0)|0|0);tb(i|0,0|0,4)}f=a+24|0;e=(vb(f|0,4,0)|0|0)+b|0;d=vb(a+36|0,4,0)|0|0;if(!d){l=f;k=c;c=k-c|0;tb(l|0,c|0,4);return}if((e|0)>=(c|0)){l=f;k=e;c=k-c|0;tb(l|0,c|0,4);return}k=(c+-1-e+d|0)/(d|0)|0;l=a+40|0;tb(l|0,(vb(l|0,4,0)|0|0)+k&1|0,4);l=f;k=(O(k,d)|0)+e|0;c=k-c|0;tb(l|0,c|0,4);return}function Gi(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=a+32|0;d=vb(f|0,4,0)|0|0;m=a+40|0;g=((vb(m|0,4,0)|0)&1|0)==0?d:0-d|0;l=a+28|0;e=g-(vb(l|0,4,0)|0|0)|0;if(e){tb(l|0,g|0,4);Hi(a+48|0,b,e,vb(a+16|0,4,0)|0|0);d=vb(f|0,4,0)|0|0}k=a+24|0;e=(d|0)==0?c:(vb(k|0,4,0)|0|0)+b|0;if((e|0)>=(c|0)){m=e;m=m-c|0;tb(k|0,m|0,4);return}h=vb(a+16|0,4,0)|0|0;j=vb(vb(a+36|0,4,0)|0|0,4,0)|0|0;j=j|0?j<<1:16;i=a+44|0;a=a+48|0;d=g<<1;b=vb(m|0,4,0)|0|0;f=e;do{g=b;b=(vb(i|0,4,0)|0)&0-(b&1)^b>>>1;e=0-d|0;if(g+1&2){Ii(a,f,e,h);d=e}f=f+j|0}while((f|0)<(c|0));tb(m|0,b|0,4);tb(l|0,d>>1|0,4);m=f;m=m-c|0;tb(k|0,m|0,4);return}function Hi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;b=O(vb(d|0,4,0)|0|0,b)|0;Ji(a,b+(vb(d+4|0,4,0)|0|0)|0,c,d);return}function Ii(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;b=O(vb(d|0,4,0)|0|0,b)|0;Ji(a,b+(vb(d+4|0,4,0)|0|0)|0,c,d);return}function Ji(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=b>>>16;if((e|0)<(vb(d+12|0,4,0)|0|0)){f=O(vb(a+8|0,4,0)|0|0,c)|0;d=(vb(d+8|0,4,0)|0|0)+(e<<2)|0;b=b>>>10&63;h=a+168+(0-b<<1)|0;j=O(vb(h|0,2,0)|0|0,f)|0;g=d+16|0;i=O(vb(h+128|0,2,0)|0|0,f)|0;c=d+20|0;i=i+(vb(c|0,4,0)|0|0)|0;e=vb(h+256|0,2,0)|0|0;tb(g|0,j+(vb(g|0,4,0)|0|0)|0,4);tb(c|0,i|0,4);e=O(e,f)|0;i=d+24|0;h=O(vb(h+384|0,2,0)|0|0,f)|0;c=d+28|0;h=h+(vb(c|0,4,0)|0|0)|0;b=a+40+(b<<1)|0;g=vb(b+384|0,2,0)|0|0;tb(i|0,(vb(i|0,4,0)|0|0)+e|0,4);tb(c|0,h|0,4);g=O(g,f)|0;h=d+32|0;c=O(vb(b+256|0,2,0)|0|0,f)|0;a=d+36|0;c=c+(vb(a|0,4,0)|0|0)|0;e=vb(b+128|0,2,0)|0|0;tb(h|0,(vb(h|0,4,0)|0|0)+g|0,4);tb(a|0,c|0,4);e=O(e,f)|0;c=d+40|0;b=O(vb(b|0,2,0)|0|0,f)|0;a=d+44|0;b=b+(vb(a|0,4,0)|0|0)|0;tb(c|0,(vb(c|0,4,0)|0|0)+e|0,4);tb(a|0,b|0,4);return}else Aa(16429,16497,344,16518)}function Ki(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;b=O(vb(d|0,4,0)|0|0,b)|0;ph(a,b+(vb(d+4|0,4,0)|0|0)|0,c,d);return}function Li(a,b,c){a=a|0;b=b|0;c=c|0;Ui(a,b,c);return}function Mi(a,b,c){a=a|0;b=b|0;c=c|0;Ri(a,b,c);return}function Ni(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;if(b>>>0>=256)Aa(17512,17434,299,17485);Ei(a,0);e=b&128;f=(e|0)!=0;c=a+980|0;if(f){tb(c|0,b|0,4);c=b}else c=vb(c|0,4,0)|0|0;d=c>>>5&3;if(c&16|0){tb((vb(a+(d<<2)|0,4,0)|0|0)+32|0,vb(17496+(b&15)>>0|0,1,1)|0|0,4);return}if((d|0)==3){f=b&3;tb(a+1020|0,((f|0)!=3?9656+(f<<2)|0:a+148|0)|0,4);tb(a+1028|0,vb(((b&4|0)==0?a+1596|0:a+1592|0)|0,4,0)|0|0,4);tb(a+1024|0,32768|0,4);return}else{a=a+16+(d*48|0)+36|0;tb(a|0,(vb(a|0,4,0)|0)&(f?65280:255)|b<<(e>>>5^4)+4&(f?240:16128)|0,4);return}}function Oi(a){a=a|0;tb(a+276>>0|0,1|0,1);return}function Pi(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;e=vb(a+1184|0,4,0)|0|0;c=vb(e>>0|0,1,0)|0|0;if(!(c<<24>>24))d=0;else{d=0;do{j=e;e=(c&255)<3?e+3|0:e+2|0;d=(c<<24>>24==1&(vb(j+1>>0|0,1,0)|0|0)==42&1)+d|0;c=vb(e>>0|0,1,0)|0|0}while(c<<24>>24!=0)}c=vb(a+1640|0,4,0)|0|0;e=(c|0)==0;f=(d|0)!=0;if((d|0)>(b|0)&(f&e)){c=d;d=d-b|0}else{c=(c|0)>(b|0)&((f|e)^1)?c:b;d=0}j=a+1648|0;i=((Qi(vb(j|0,4,0)|0|0,vb(a+1632|0,4,0)|0|0)|0)>>>0)/(c>>>0)|0;d=(Fe(vb(a+1652|0,4,0)|0|0)|0)+(O(i,d)|0)+(i>>>1)|0;h=a+1636|0;c=vb(h|0,4,0)|0|0;if((c|0)<0)c=vb(a+3856>>0|0,1,1)|0|0;if((b|0)<=0){a=c;tb(h|0,a|0,4);return}g=a+1696|0;e=c;f=0;while(1){c=vb(a+3856+f>>0|0,1,1)|0|0;Ji(g,d,c-e|0,j);f=f+1|0;if((f|0)==(b|0))break;else{e=c;d=d+i|0}}tb(h|0,c|0,4);return}function Qi(a,b){a=a|0;b=b|0;return O(a,b)|0}function Ri(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if(c>>>0>=256)Aa(17512,17536,870,17558);if((b|0)<=47)return;d=a+4400+(b<<2)|0;if((vb(d|0,4,0)|0|0)==(c|0))return;tb(d|0,c|0,4);d=b+256|0;if((b|0)<160){Si(a,d,c);return}else{Ti(a,d,c);return}}function Si(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=b&3;if((d|0)==3)return;e=(b&256|0?3:0)+d|0;f=b>>>2&3;d=a+40+(e*556|0)+88+(f*116|0)|0;switch(((b&240)+-48|0)>>>4&268435455|0){case 0:{b=c&15;tb(a+40+(e*556|0)+88+(f*116|0)+4|0,((b|0)==0?1:b<<1)|0,4);tb(d|0,a+14524+((c>>>4&7)<<7)|0,4);tb(a+40+(e*556|0)+148|0,-1|0,4);return}case 1:{c=c&127;tb(a+40+(e*556|0)+88+(f*116|0)+8|0,c|0,4);tb(a+40+(e*556|0)+88+(f*116|0)+12|0,c<<5|0,4);return}case 2:{tb(a+40+(e*556|0)+88+(f*116|0)+20|0,3-(c>>6)|0,4);tb(a+40+(e*556|0)+148|0,-1|0,4);d=c&31;d=(d|0)==0?a+15612|0:a+13628+(d<<1<<2)|0;tb(a+40+(e*556|0)+88+(f*116|0)+40|0,d|0,4);d=vb(d+((vb(a+40+(e*556|0)+88+(f*116|0)+24|0,4,0)|0)<<2)|0,4,0)|0|0;tb(a+40+(e*556|0)+88+(f*116|0)+80|0,d|0,4);if(vb(a+40+(e*556|0)+88+(f*116|0)+64|0,4,0)|0|0)return;tb(a+40+(e*556|0)+88+(f*116|0)+72|0,d|0,4);return}case 3:{b=c&128;tb(a+40+(e*556|0)+88+(f*116|0)+112|0,b|0,4);if(!b)d=31;else d=vb(a+40+(e*556|0)+36|0,4,0)|0|0;tb(a+40+(e*556|0)+88+(f*116|0)+108|0,d|0,4);d=c&31;d=(d|0)==0?a+15612|0:a+14140+(d<<1<<2)|0;tb(a+40+(e*556|0)+88+(f*116|0)+44|0,d|0,4);d=vb(d+((vb(a+40+(e*556|0)+88+(f*116|0)+24|0,4,0)|0)<<2)|0,4,0)|0|0;tb(a+40+(e*556|0)+88+(f*116|0)+84|0,d|0,4);if((vb(a+40+(e*556|0)+88+(f*116|0)+64|0,4,0)|0|0)!=1)return;tb(a+40+(e*556|0)+88+(f*116|0)+72|0,d|0,4);return}case 4:{d=c&31;d=(d|0)==0?a+15612|0:a+14140+(d<<1<<2)|0;tb(a+40+(e*556|0)+88+(f*116|0)+48|0,d|0,4);d=vb(d+((vb(a+40+(e*556|0)+88+(f*116|0)+24|0,4,0)|0)<<2)|0,4,0)|0|0;tb(a+40+(e*556|0)+88+(f*116|0)+88|0,d|0,4);if((vb(a+40+(e*556|0)+88+(f*116|0)+64|0,4,0)|0|0)!=2)return;if((vb(a+40+(e*556|0)+88+(f*116|0)+68|0,4,0)|0|0)>=536870912)return;tb(a+40+(e*556|0)+88+(f*116|0)+72|0,d|0,4);return}case 5:{tb(a+40+(e*556|0)+88+(f*116|0)+16|0,vb(a+15548+(c>>4<<2)|0,4,0)|0|0,4);d=a+14140+((c<<2&60|2)<<2)|0;tb(a+40+(e*556|0)+88+(f*116|0)+52|0,d|0,4);d=vb(d+((vb(a+40+(e*556|0)+88+(f*116|0)+24|0,4,0)|0)<<2)|0,4,0)|0|0;tb(a+40+(e*556|0)+88+(f*116|0)+92|0,d|0,4);if((vb(a+40+(e*556|0)+88+(f*116|0)+64|0,4,0)|0|0)!=3)return;if((vb(a+40+(e*556|0)+88+(f*116|0)+68|0,4,0)|0|0)>=536870912)return;tb(a+40+(e*556|0)+88+(f*116|0)+72|0,d|0,4);return}case 6:{Ci(d,c&8|0?c&15:0);return}default:return}}function Ti(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=b&3;if((d|0)==3)return;e=(b&256|0?3:0)+d|0;switch(((b&252)+-160|0)>>>2&1073741823|0){case 0:{d=a+40+(e*556|0)+40|0;c=((vb(d|0,4,0)|0)&1792)+c|0;tb(d|0,c|0,4);tb(a+40+(e*556|0)+72|0,vb(17565+(c>>7)>>0|0,1,1)|0|0|(vb(a+40+(e*556|0)+56|0,4,0)|0)<<2|0,4);tb(a+40+(e*556|0)+148|0,-1|0,4);return}case 1:{b=a+40+(e*556|0)+40|0;d=(vb(b|0,4,0)|0)&255|c<<8&1792;tb(b|0,d|0,4);c=c>>>3&7;tb(a+40+(e*556|0)+56|0,c|0,4);tb(a+40+(e*556|0)+72|0,vb(17565+(d>>>7)>>0|0,1,1)|0|0|c<<2|0,4);tb(a+40+(e*556|0)+148|0,-1|0,4);return}case 2:{if((b|0)>=256)return;e=d+1|0;d=a+1192+(e<<2)|0;c=((vb(d|0,4,0)|0)&1792)+c|0;tb(d|0,c|0,4);tb(a+1224+(e<<2)|0,vb(17565+(c>>7)>>0|0,1,1)|0|0|(vb(a+1208+(e<<2)|0,4,0)|0)<<2|0,4);tb(a+1300|0,-1|0,4);return}case 3:{if((b|0)>=256)return;d=d+1|0;b=a+1192+(d<<2)|0;e=(vb(b|0,4,0)|0)&255|c<<8&1792;tb(b|0,e|0,4);c=c>>>3&7;tb(a+1208+(d<<2)|0,c|0,4);tb(a+1224+(d<<2)|0,vb(17565+(e>>>7)>>0|0,1,1)|0|0|c<<2|0,4);tb(a+1300|0,-1|0,4);return}case 4:{b=a+40+(e*556|0)+24|0;d=c&7;if((vb(b|0,4,0)|0|0)!=(d|0)){tb(b|0,d|0,4);tb(a+40+(e*556|0)+192|0,0|0,4);tb(a+40+(e*556|0)+308|0,0|0,4);tb(a+40+(e*556|0)+424|0,0|0,4);tb(a+40+(e*556|0)+540|0,0|0,4)}tb(a+40+(e*556|0)+28|0,9-(c>>>3&7)|0,4);return}case 5:{tb(a+40+(e*556|0)+16|0,0-(c>>>7&1)|0,4);tb(a+40+(e*556|0)+20|0,0-(c>>>6&1)|0,4);b=vb(17581+(c>>>4&3)>>0|0,1,1)|0|0;tb(a+40+(e*556|0)+36|0,b|0,4);tb(a+40+(e*556|0)+32|0,vb(17585+(c&7)>>0|0,1,1)|0|0,4);tb(a+40+(e*556|0)+196|0,((vb(a+40+(e*556|0)+200|0,4,0)|0|0)==0?31:b)|0,4);tb(a+40+(e*556|0)+312|0,((vb(a+40+(e*556|0)+316|0,4,0)|0|0)==0?31:b)|0,4);tb(a+40+(e*556|0)+428|0,((vb(a+40+(e*556|0)+432|0,4,0)|0|0)==0?31:b)|0,4);tb(a+40+(e*556|0)+544|0,((vb(a+40+(e*556|0)+548|0,4,0)|0|0)==0?31:b)|0,4);return}default:return}}function Ui(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if(c>>>0>=256)Aa(17512,17536,850,17593);d=a+3376+(b<<2)|0;if((b|0)<48){tb(d|0,c|0,4);Vi(a,b,c);return}if((vb(d|0,4,0)|0|0)==(c|0))return;tb(d|0,c|0,4);if((b|0)<160){Si(a,b,c);return}else{Ti(a,b,c);return}}function Vi(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;switch(b|0){case 34:{if(!(c&8)){tb(a+13620|0,0|0,4);b=0}else b=vb(a+15740+((c&7)<<2)|0,4,0)|0|0;tb(a+13624|0,b|0,4);return}case 36:{b=a+8|0;d=(vb(b|0,4,0)|0)&3|c<<2;tb(b|0,d|0,4);b=a+12|0;d=1024-d<<12;if((vb(b|0,4,0)|0|0)==(d|0))return;tb(b|0,d|0,4);tb(a+16|0,d|0,4);return}case 37:{b=a+8|0;d=(vb(b|0,4,0)|0)&1020|c&3;tb(b|0,d|0,4);b=a+12|0;d=1024-d<<12;if((vb(b|0,4,0)|0|0)==(d|0))return;tb(b|0,d|0,4);tb(a+16|0,d|0,4);return}case 38:{tb(a+20|0,c|0,4);d=a+24|0;b=256-c<<16;if((vb(d|0,4,0)|0|0)==(b|0))return;tb(d|0,b|0,4);tb(a+28|0,b|0,4);return}case 39:{b=a+32|0;if(((vb(b|0,4,0)|0)^c)&64|0)tb(a+1300|0,-1|0,4);a=a+4|0;tb(a|0,(c^-16)>>4&c>>2&(vb(a|0,4,0)|0)|0,4);tb(b|0,c|0,4);return}case 40:{b=c&3;if((b|0)==3)return;b=a+40+(((c&4|0)==0?b:b+3|0)*556|0)|0;if(!(c&16))Wi(a,b,0);else Di(a,b,0);if(!(c&32))Wi(a,b,2);else Di(a,b,2);if(!(c&64))Wi(a,b,1);else Di(a,b,1);if(!(c&128)){Wi(a,b,3);return}else{Di(a,b,3);return}}case 43:{tb(a+36|0,c&128|0,4);return}default:return}}function Wi(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;f=b+88+(c*116|0)+64|0;if((vb(f|0,4,0)|0|0)==3)return;e=b+88+(c*116|0)+68|0;d=vb(e|0,4,0)|0|0;if((d|0)<268435456)tb(e|0,((vb(a+15772+(d>>16<<1)|0,2,1)|0|0)<<16)+268435456|0,4);tb(b+88+(c*116|0)+72|0,vb(b+88+(c*116|0)+92|0,4,0)|0|0,4);tb(b+88+(c*116|0)+76|0,536870912|0,4);tb(f|0,3|0,4);return}function Xi(a){a=a|0;aj(a);return}function Yi(a){a=a|0;tb(a+976|0,0|0,4);tb(a+980|0,0|0,4);tb(a+1596|0,32768|0,4);tb(a+1592|0,36864|0,4);Zi(a+16|0);Zi(a+64|0);Zi(a+112|0);_i(a+984|0);return}function Zi(a){a=a|0;tb(a+36|0,0|0,4);tb(a+40|0,0|0,4);$i(a);return}function _i(a){a=a|0;tb(a+36|0,9656|0,4);tb(a+40|0,32768|0,4);tb(a+44|0,36864|0,4);$i(a);return}function $i(a){a=a|0;tb(a+24|0,0|0,4);tb(a+28|0,0|0,4);tb(a+32|0,0|0,4);tb(a+20|0,3|0,4);tb(a+16|0,vb(a+12|0,4,0)|0|0,4);return}function aj(a){a=a|0;var b=0;tb(a+13620|0,0|0,4);tb(a+36|0,0|0,4);b=a+4|0;tb(b|0,0|0,4);tb(b+4|0,0|0,4);tb(b+8|0,0|0,4);tb(b+12|0,0|0,4);tb(b+16|0,0|0,4);tb(b+20|0,0|0,4);tb(b+24|0,0|0,4);b=0;do{tb(a+40+(b*556|0)+16|0,-1|0,4);tb(a+40+(b*556|0)+20|0,-1|0,4);tb(a+40+(b*556|0)+24|0,0|0,4);tb(a+40+(b*556|0)+28|0,31|0,4);tb(a+40+(b*556|0)+32|0,0|0,4);tb(a+40+(b*556|0)+36|0,0|0,4);tb(a+40+(b*556|0)|0,0|0,4);tb(a+40+(b*556|0)+40|0,0|0,4);tb(a+40+(b*556|0)+56|0,0|0,4);tb(a+40+(b*556|0)+72|0,0|0,4);tb(a+40+(b*556|0)+144|0,0|0,4);tb(a+40+(b*556|0)+148|0,0|0,4);tb(a+40+(b*556|0)+156|0,536870912|0,4);tb(a+40+(b*556|0)+160|0,0|0,4);tb(a+40+(b*556|0)+164|0,0|0,4);tb(a+40+(b*556|0)+152|0,3|0,4);tb(a+40+(b*556|0)+192|0,0|0,4);tb(a+40+(b*556|0)+4|0,0|0,4);tb(a+40+(b*556|0)+44|0,0|0,4);tb(a+40+(b*556|0)+60|0,0|0,4);tb(a+40+(b*556|0)+76|0,0|0,4);tb(a+40+(b*556|0)+260|0,0|0,4);tb(a+40+(b*556|0)+264|0,0|0,4);tb(a+40+(b*556|0)+272|0,536870912|0,4);tb(a+40+(b*556|0)+276|0,0|0,4);tb(a+40+(b*556|0)+280|0,0|0,4);tb(a+40+(b*556|0)+268|0,3|0,4);tb(a+40+(b*556|0)+308|0,0|0,4);tb(a+40+(b*556|0)+8|0,0|0,4);tb(a+40+(b*556|0)+48|0,0|0,4);tb(a+40+(b*556|0)+64|0,0|0,4);tb(a+40+(b*556|0)+80|0,0|0,4);tb(a+40+(b*556|0)+376|0,0|0,4);tb(a+40+(b*556|0)+380|0,0|0,4);tb(a+40+(b*556|0)+388|0,536870912|0,4);tb(a+40+(b*556|0)+392|0,0|0,4);tb(a+40+(b*556|0)+396|0,0|0,4);tb(a+40+(b*556|0)+384|0,3|0,4);tb(a+40+(b*556|0)+424|0,0|0,4);tb(a+40+(b*556|0)+12|0,0|0,4);tb(a+40+(b*556|0)+52|0,0|0,4);tb(a+40+(b*556|0)+68|0,0|0,4);tb(a+40+(b*556|0)+84|0,0|0,4);tb(a+40+(b*556|0)+492|0,0|0,4);tb(a+40+(b*556|0)+496|0,0|0,4);tb(a+40+(b*556|0)+504|0,536870912|0,4);tb(a+40+(b*556|0)+508|0,0|0,4);tb(a+40+(b*556|0)+512|0,0|0,4);tb(a+40+(b*556|0)+500|0,3|0,4);tb(a+40+(b*556|0)+540|0,0|0,4);b=b+1|0}while((b|0)!=6);b=0;do{tb(a+3376+(b<<2)|0,-1|0,4);tb(a+4400+(b<<2)|0,-1|0,4);b=b+1|0}while((b|0)!=256);Ui(a,182,192);Ri(a,182,192);Ui(a,181,192);Ri(a,181,192);Ui(a,180,192);Ri(a,180,192);b=178;do{Ui(a,b,0);Ri(a,b,0);b=b+-1|0}while((b|0)>33);Ui(a,42,128);return}function bj(a,b){a=a|0;b=b|0;tb(a+5424|0,b|0,4);return}function cj(a,b){a=a|0;b=b|0;dj(a,b,b,b);return}function dj(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ej(a,0,b,c,d);ej(a,1,b,c,d);ej(a,2,b,c,d);ej(a,3,b,c,d);return}function ej(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;if(b>>>0>=4)Aa(17600,17434,194,17629);h=(c|0)!=0;g=(d|0)!=0;f=(e|0)!=0;if(h&g&f^(h|g|f))Aa(17640,17434,195,17629);else{h=vb(a+(b<<2)|0,4,0)|0|0;tb(h+4|0,e|0,4);tb(h+8|0,d|0,4);tb(h+12|0,c|0,4);tb(h+16|0,vb(h+((vb(h+20|0,4,0)|0)<<2)|0,4,0)|0|0,4);return}}function fj(a,b){a=a|0;b=b|0;ub(a|0,+(-32.0),8);tb(a+8|0,8e3|0,4);tb(a+12|0,b|0,4);tb(a+16|0,0|0,4);return}function gj(a,b){a=a|0;b=b|0;zh(a+160|0,b);hj(a+1032|0,b);return}function hj(a,b){a=a|0;b=b|0;Me(a,b);return}function ij(a,b){a=a|0;b=+b;b=b*.00166015625;Lh(a+160|0,b);jj(a+1032|0,b);return}function jj(a,b){a=a|0;b=+b;Ne(a,b);return}function kj(a,b){a=a|0;b=+b;return +(+Sf(a+32|0,1.6666666666666667,.99,b*.5))}function lj(a,b){a=a|0;b=+b;var c=0;c=vb(a|0,4,0)|0|0;do if(!c){c=zl(159148)|0;tb(a|0,c|0,4);if(!c){a=17698;return a|0}else{tb(c+5424|0,0|0,4);break}}while(0);On(c|0,0,5424)|0;mj(vb(a|0,4,0)|0|0,b);a=0;return a|0}function mj(a,b){a=a|0;b=+b;var c=0,d=0,e=0,f=0.0,g=0.0;if(!(b!=0.0))Aa(17712,17536,633,17724);if(!(b<7671471.428571428))Aa(17733,17536,634,17724);f=7671471.428571428/b/144.0;e=+B(+(f+-1.0))<1.0e-07;f=e?1.0:f;tb(a|0,~~(f*4096.0)|0,4);e=0;do{if((e|0)>3327){c=0;d=0}else{d=~~(268435455.0/+D(10.0,+(+(e|0)*.0234375/20.0)));c=0-d|0}tb(a+36268+(e<<2)|0,d|0,4);tb(a+36268+(e+12288<<2)|0,c|0,4);e=e+1|0}while((e|0)!=12288);tb(a+9524|0,3328|0,2);tb(a+5428|0,3328|0,2);c=1;do{e=~~(+rm(1.0/+F(+(+(c|0)*6.283185307179586*.000244140625)))*20.0/.0234375);e=(e|0)<3328?e:3328;d=e&65535;tb(a+5428+(2048-c<<1)|0,d|0,2);tb(a+5428+(c<<1)|0,d|0,2);e=e+12288&65535;tb(a+5428+(4096-c<<1)|0,e|0,2);tb(a+5428+(c+2048<<1)|0,e|0,2);c=c+1|0}while((c|0)!=1025);c=0;do{g=+F(+(+(c|0)*6.283185307179586*.0009765625));tb(a+32172+(c<<1)|0,~~((g+1.0)*.5*503.4666666666667)|0,2);tb(a+34220+(c<<1)|0,~~(g*511.0)|0,2);c=c+1|0}while((c|0)!=1024);c=0;do{tb(a+15772+(c<<1)|0,~~(+D(+(+(4095-c|0)*.000244140625),8.0)*4096.0)|0,2);tb(a+15772+(c+4096<<1)|0,~~(+(c|0)*.000244140625*4096.0)|0,2);c=c+1|0}while((c|0)!=4096);d=a+32158|0;tb(d|0,0|0,2);tb(d+2|0,0|0,2);tb(d+4|0,0|0,2);tb(d+6|0,0|0,2);tb(d+8|0,0|0,2);tb(d+10|0,0|0,2);tb(d+12|0,0|0,2);tb(a+32156|0,4095|0,2);d=0;c=4095;while(1){a:do if(!c)c=0;else while(1){if((vb(a+15772+(c<<1)|0,2,0)|0|0)>=(d|0))break a;c=c+-1|0;if(!c){c=0;break}}while(0);tb(a+134572+(d<<2)|0,c<<16|0,4);d=d+1|0;if((d|0)==4096){c=0;break}}do{tb(a+15548+(c<<2)|0,(~~(+(c*3|0)/.0234375)<<16)+268435456|0,4);c=c+1|0}while((c|0)!=15);tb(a+15608|0,536805376|0,4);c=0;do{tb(a+150956+(c<<2)|0,~~(f*+(c|0)*4096.0*.5)>>>0|0,4);c=c+1|0}while((c|0)!=2048);e=a+13628|0;c=a+14140|0;tb(e|0,0|0,4);tb(e+4|0,0|0,4);tb(e+8|0,0|0,4);tb(e+12|0,0|0,4);tb(c|0,0|0,4);tb(c+4|0,0|0,4);tb(c+8|0,0|0,4);tb(c+12|0,0|0,4);c=0;do{g=+(1<<(c>>2)|0)*(f*(+(c&3|0)*.25+1.0))*268435456.0;e=c+4|0;tb(a+13628+(e<<2)|0,~~(g/399128.0)>>>0|0,4);tb(a+14140+(e<<2)|0,~~(g/5514396.0)>>>0|0,4);c=c+1|0}while((c|0)!=60);c=a+13880|0;d=a+14392|0;e=64;do{tb(a+13628+(e<<2)|0,vb(c|0,4,0)|0|0,4);tb(a+14140+(e<<2)|0,vb(d|0,4,0)|0|0,4);tb(a+15612+(e+-64<<2)|0,0|0,4);e=e+1|0}while((e|0)!=96);c=a+14012|0;d=c+128|0;do{tb(c|0,0|0,4);c=c+4|0}while((c|0)<(d|0));c=0;do{g=f*+(vb(17758+c>>0|0,1,1)|0|0)*32.0;tb(a+14524+(c<<2)|0,~~g|0,4);tb(a+15036+(c<<2)|0,~~-g|0,4);c=c+1|0}while((c|0)!=32);c=0;do{g=f*+(vb(17758+(c+32)>>0|0,1,1)|0|0)*32.0;tb(a+14652+(c<<2)|0,~~g|0,4);tb(a+15164+(c<<2)|0,~~-g|0,4);c=c+1|0}while((c|0)!=32);c=0;do{g=f*+(vb(17758+(c+64)>>0|0,1,1)|0|0)*32.0;tb(a+14780+(c<<2)|0,~~g|0,4);tb(a+15292+(c<<2)|0,~~-g|0,4);c=c+1|0}while((c|0)!=32);c=0;do{g=f*+(vb(17758+(c+96)>>0|0,1,1)|0|0)*32.0;tb(a+14908+(c<<2)|0,~~g|0,4);tb(a+15420+(c<<2)|0,~~-g|0,4);c=c+1|0}while((c|0)!=32);tb(a+15740|0,~~(1068373114.88/b)>>>0|0,4);tb(a+15744|0,~~(1492501135.36/b)>>>0|0,4);tb(a+15748|0,~~(1615981445.12/b)>>>0|0,4);tb(a+15752|0,~~(1709933854.72/b)>>>0|0,4);tb(a+15756|0,~~(1846835937.28/b)>>>0|0,4);tb(a+15760|0,~~(2585033441.28/b)>>>0|0,4);tb(a+15764|0,~~(12911745433.6/b)>>>0|0,4);tb(a+15768|0,~~(19381039923.2/b)>>>0|0,4);aj(a);return}function nj(a,b){a=a|0;b=b|0;return pj(a,b)|0}function oj(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;if(Ol(a,19335,4)|0)return;e=(b*50|0)/3|0;b=af(a+420|0)|0;if(!b){tb(c+4|0,e|0,4);d=0;b=e}else{b=(b*50|0)/3|0;d=e-b|0}tb(c+8|0,b|0,4);tb(c+12|0,d|0,4);b=a+4|0;if(Nl(b,17886)|0)xg(c+528|0,b,32);b=a+36|0;if(Nl(b,17899)|0)xg(c+272|0,b,32);b=a+68|0;if(Nl(b,17912)|0)xg(c+1040|0,b,32);b=a+132|0;if(Nl(b,17930)|0)xg(c+1552|0,b,32);b=a+164|0;if(!(Nl(b,17945)|0))return;xg(c+1296|0,b,256);return}function pj(a,b){a=a|0;b=b|0;var c=0,d=0;if(a>>>0<b>>>0)c=0;else{b=0;return b|0}a:while(1){d=a;b:while(1){a=d+1|0;switch(vb(d>>0|0,1,0)|0|0){case 0:break b;case 2:case 1:{a=d+3|0;break}case 3:{a=d+2|0;break}default:{}}if(a>>>0<b>>>0)d=a;else{a=c;c=8;break a}}c=c+1|0;if(a>>>0>=b>>>0){a=c;c=8;break}}if((c|0)==8)return a|0;return 0}function qj(a,b,c){a=a|0;b=b|0;c=c|0;if((b|0)>=4){if(Ol(a,19335,4)|0)return ((vb(a>>0|0,1,1)|0|0)>3?15595:0)|0;if((b|0)>=429)if(!(Ol(a+424|0,27201,4)|0))if(!c)c=0;else{tb(c|0,428|0,4);c=0}else c=17967;else c=15595}else c=15595;return c|0}function rj(a){a=a|0;Al(vb(a|0,4,0)|0|0);return}function sj(){var a=0,b=0;a=Oh(4880)|0;if(!a){a=0;return a|0}o=0;sa(60,a|0);b=o;o=0;if(b&1){b=Fa()|0;Ad(a);Ma(b|0)}else{b=a;return b|0}return 0}function tj(){var a=0,b=0;a=Oh(336)|0;if(!a){a=0;return a|0}o=0;sa(61,a|0);b=o;o=0;if(b&1){b=Fa()|0;Ad(a);Ma(b|0)}else{b=a;return b|0}return 0}function uj(a){a=a|0;Qh(a);tb(a|0,9700|0,4);Rh(a,9668);return}function vj(a){a=a|0;Bd(a);Ad(a);return}function wj(a,b,c){a=a|0;b=b|0;c=c|0;tb(a+320|0,b|0,4);tb(a+324|0,b+c|0,4);a=a+328|0;tb(a|0,0|0,4);return qj(b,c,a)|0}function xj(a,b,c){a=a|0;b=b|0;c=c|0;c=vb(a+320|0,4,0)|0|0;oj(c,pj(c+(vb(a+328|0,4,0)|0|0)|0,vb(a+324|0,4,0)|0|0)|0,b);return 0}function yj(a){a=a|0;var b=0,c=0,d=0,e=0;Pe(a);b=a+320|0;bf(b);tb(a|0,9524|0,4);tb(b|0,9612|0,4);c=a+1648|0;tc(c);d=a+1692|0;zj(d);Aj(a+1696|0);o=0;sa(62,a+2256|0);e=o;o=0;if(e&1){e=Fa()|0;rj(d);sc(c);Od(b);Bd(a);Ma(e|0)}else{tb(a+1176|0,0|0,4);tb(a+1184|0,0|0,4);Rh(a,9668);Se(a,9776);Yh(a,1);return}}function zj(a){a=a|0;tb(a|0,0|0,4);return}function Aj(a){a=a|0;He(a,a+40|0,8);return}function Bj(a){a=a|0;var b=0,c=0;Cj(a+16|0);Cj(a+64|0);Cj(a+112|0);c=a+160|0;_h(c);b=a+984|0;Dj(b);tb(a+60|0,c|0,4);tb(a|0,a+16|0,4);tb(a+108|0,c|0,4);tb(a+4|0,a+64|0,4);tb(a+156|0,c|0,4);tb(a+8|0,a+112|0,4);tb(a+12|0,b|0,4);ij(a,1.0);Yi(a);return}function Cj(a){a=a|0;Ej(a);return}function Dj(a){a=a|0;Ej(a);Aj(a+48|0);return}function Ej(a){a=a|0;tb(a|0,0|0,4);tb(a+4|0,0|0,4);tb(a+8|0,0|0,4);tb(a+12|0,0|0,4);tb(a+16|0,0|0,4);return}function Fj(a){a=a|0;tb(a|0,9816|0,4);Qd(a+328|0);Bd(a);return}function Gj(a){a=a|0;Fj(a);Ad(a);return}function Hj(a,b,c){a=a|0;b=b|0;c=c|0;tb(a+320|0,b|0,4);tb(a+324|0,c|0,4);Ih(a,8);if((c|0)<65920){a=15595;return a|0}a=Yk(b)|0;return a|0}function Ij(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=Qk(a)|0;c=vb(a+324|0,4,0)|0|0;a=Rk(vb(a+320|0,4,0)|0|0,c)|0;Tk(d,a,Sk(c)|0,b);return 0}function Jj(a,b){a=a|0;b=b|0;var c=0;Kk(a+1956|0);Xg(a);if((b|0)==32e3){b=0;return b|0}c=a+328|0;a=hf(c,3200)|0;if(a|0){b=a;return b|0}+Sf(c,32.0e3/+(b|0),.9965,1.0);b=0;return b|0}function Kj(a,b){a=a|0;b=b|0;Jk(a+1920|0,b);return}function Lj(a,b){a=a|0;b=b|0;Ik(a+1956|0,b);return}function Mj(a,b){a=a|0;b=+b;Dk(a+1956|0,~~(b*256.0));return}function Nj(a,b){a=a|0;b=b|0;var c=0,d=0;jf(a+328|0);d=a+1920|0;Rj(d);b=a+1956|0;c=wk(b,vb(a+320|0,4,0)|0|0,vb(a+324|0,4,0)|0|0)|0;if(c|0){a=c;return a|0}xk(d,~~(+Jh(+(+wb(a+248|0,8)))*256.0));Vj(b);a=0;return a|0}function Oj(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0;if((fc(vb(a+260|0,4,0)|0|0)|0)==32e3){a=tk(a,b,c)|0;return a|0}h=a+328|0;if((b|0)<=0){a=0;return a|0}d=b-(sk(h,c,b)|0)|0;if((d|0)<=0){a=0;return a|0}g=a+336|0;f=d;while(1){e=uk(h)|0;d=tk(a,e,qf(vb(g|0,4,0)|0|0)|0)|0;if(d|0){e=8;break}rf(h,e);f=f-(sk(h,c+(b-f<<1)|0,f)|0)|0;if((f|0)<=0){d=0;e=8;break}}if((e|0)==8)return d|0;return 0}function Pj(a,b){a=a|0;b=b|0;var c=0,d=0;d=l;l=l+128|0;if((l|0)>=(m|0))X(128);c=d;if((fc(vb(a+260|0,4,0)|0|0)|0)!=32e3){b=~~(+(b|0)*+mf(+(+wb(a+368|0,8))))&-2;b=b-(Uf(a+328|0,b)|0)|0}do if((b|0)>0){b=Qj(a+1956|0,b)|0;if(!b){Rj(a+1920|0);break}else{a=b;l=d;return a|0}}while(0);a=db[(xb(vb((vb(a|0,4,0)|0|0)+68|0,4,0)|0|0,31|0)|0)&31](a,64,c)|0;l=d;return a|0}function Qj(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0;if((b|0)<=128e3){a=Wj(a,b,0)|0;return a|0}Sj(a,0,0);c=b&3|64e3;h=b-c<<4;b=a+1996|0;tb(b|0,0|0,4);d=a+2e3|0;tb(d|0,0|0,4);e=a+1980|0;g=vb(e|0,4,0)|0|0;f=vb(a+1984|0,4,0)|0|0;tb(e|0,h+127-f|0,4);Tj(a,h);tb(e|0,g+-127+f+(vb(e|0,4,0)|0|0)|0,4);Uj(a,92,(vb(d|0,4,0)|0)&~(vb(b|0,4,0)|0));Uj(a,76,vb(b|0,4,0)|0|0);Vj(a);b=c;a=Wj(a,b,0)|0;return a|0}function Rj(a){a=a|0;a=a+12|0;tb(a|0,0|0,4);tb(a+4|0,0|0,4);tb(a+8|0,0|0,4);tb(a+12|0,0|0,4);tb(a+16|0,0|0,4);tb(a+20|0,0|0,4);return}function Sj(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;if(c&1|0)Aa(18776,18363,279,18792);h=a+2008|0;tb(h|0,(vb(h|0,4,0)|0)&31|0,4);if(!b){rk(a);return}g=b+(c<<1)|0;tb(a+2012|0,b|0,4);tb(a+2016|0,g|0,4);e=a+2024|0;h=a+2020|0;d=vb(h|0,4,0)|0|0;c=(c|0)>0;if(c&e>>>0<d>>>0){d=b;while(1){f=e+2|0;b=d+2|0;tb(d|0,vb(e|0,2,0)|0|0|0,2);d=vb(h|0,4,0)|0|0;e=b>>>0<g>>>0;if(e&f>>>0<d>>>0){e=f;d=b}else{c=e;e=f;break}}}if(!c){f=ck(a)|0;c=f+32|0;if(e>>>0<d>>>0){b=0;while(1){d=b+1|0;tb(f+(b<<1)|0,vb(e|0,2,0)|0|0|0,2);e=e+2|0;if(e>>>0>=(vb(h|0,4,0)|0|0)>>>0)break;else b=d}if((d|0)>16)Aa(18761,18363,303,18792);else{i=f+(d<<1)|0;j=c}}else{i=f;j=c}}else{i=b;j=g}qk(a,i,j-i>>1);return}function Tj(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;d=a+1984|0;c=vb(d|0,4,0)|0|0;if((c|0)<(b|0)){Zj(a,b);c=vb(d|0,4,0)|0|0}c=c-b|0;tb(d|0,c|0,4);d=a+2008|0;tb(d|0,(vb(d|0,4,0)|0|0)+b|0,4);if((c+11|0)>>>0>=12)Aa(18449,18495,531,18514);_j(a+1868|0,0)|0;_j(a+1892|0,0)|0;_j(a+1916|0,0)|0;b=a+1980|0;c=vb(b|0,4,0)|0|0;if((c|0)<0?(d=-29-c|0,e=d+32&-32,(d|0)>-1):0){tb(b|0,e+c|0,4);$j(a,e)}if(!(vb(a+2012|0,4,0)|0))return;ak(a);return}function Uj(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if(b>>>0>=128)Aa(18388,18421,180,18443);tb(a+b>>0|0,c|0,1);d=b&15;if(d>>>0<2){Yj(a,d^b);return}if((d|0)!=12)return;switch(b|0){case 76:{tb(a+300|0,c&255|0,4);return}case 124:{tb(a+124>>0|0,0|0,1);return}default:return}}function Vj(a){a=a|0;var b=0,c=0;if((Xj(a,108)|0)&32|0)return;b=(Xj(a,109)|0)<<8;c=((Xj(a,125)|0)<<11&30720)+b|0;On(a+2700+b|0,-1,((c|0)<65536?c:65536)-b|0)|0;return}function Wj(a,b,c){a=a|0;b=b|0;c=c|0;if(b&1|0)Aa(18803,18363,339,18383);if(b|0){Sj(a,c,b);Tj(a,b<<4)}c=a+2004|0;a=vb(c|0,4,0)|0|0;tb(c|0,0|0,4);return a|0}function Xj(a,b){a=a|0;b=b|0;if(b>>>0<128)return vb(a+b>>0|0,1,1)|0|0|0;else Aa(18388,18421,156,18438);return 0}function Yj(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;f=vb(a+b>>0|0,1,0)|0|0;c=vb(a+(b+1)>>0|0,1,0)|0|0;d=O(c,f)|0;d=(d|0)<(vb(a+1564|0,4,0)|0|0);e=b>>4;b=vb(a+308+(e*140|0)+136|0,4,0)|0|0;tb(a+308+(e*140|0)+128|0,((d?f>>7:0)^f)&b|0,4);tb(a+308+(e*140|0)+132|0,((d?c>>7:0)^c)&b|0,4);return}
            function Pm(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;g=l;l=l+64|0;if((l|0)>=(m|0))X(64);f=g;if(!(Tm(a,b)|0))if((b|0)!=0?(e=Xm(b,296)|0,(e|0)!=0):0){b=f+4|0;d=b+52|0;do{tb(b|0,0|0,4);b=b+4|0}while((b|0)<(d|0));tb(f|0,e|0,4);tb(f+8|0,a|0,4);tb(f+12|0,-1|0,4);tb(f+48|0,1|0,4);kb[(xb(vb((vb(e|0,4,0)|0|0)+28|0,4,0)|0|0,15|0)|0)&15](e,f,vb(c|0,4,0)|0|0,1);if((vb(f+24|0,4,0)|0|0)==1){tb(c|0,vb(f+16|0,4,0)|0|0,4);b=1}else b=0}else b=0;else b=1;l=g;return b|0}function Qm(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;if(Tm(a,vb(b+8|0,4,0)|0|0)|0)Wm(b,c,d,e);return}function Rm(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;do if(!(Tm(a,vb(b+8|0,4,0)|0|0)|0)){if(Tm(a,vb(b|0,4,0)|0|0)|0){a=b+32|0;if((vb(b+16|0,4,0)|0|0)!=(c|0)?(f=b+20|0,(vb(f|0,4,0)|0|0)!=(c|0)):0){tb(a|0,d|0,4);tb(f|0,c|0,4);d=b+40|0;tb(d|0,(vb(d|0,4,0)|0|0)+1|0,4);if((vb(b+36|0,4,0)|0|0)==1?(vb(b+24|0,4,0)|0|0)==2:0)tb(b+54>>0|0,1|0,1);tb(b+44|0,4|0,4);break}if((d|0)==1)tb(a|0,1|0,4)}}else Vm(b,c,d);while(0);return}function Sm(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if(Tm(a,vb(b+8|0,4,0)|0|0)|0)Um(b,c,d);return}function Tm(a,b){a=a|0;b=b|0;return (a|0)==(b|0)|0}function Um(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;e=a+16|0;d=vb(e|0,4,0)|0|0;f=a+36|0;g=a+24|0;do if(d){if((d|0)!=(b|0)){tb(f|0,(vb(f|0,4,0)|0|0)+1|0,4);tb(g|0,2|0,4);tb(a+54>>0|0,1|0,1);break}if((vb(g|0,4,0)|0|0)==2)tb(g|0,c|0,4)}else{tb(e|0,b|0,4);tb(g|0,c|0,4);tb(f|0,1|0,4)}while(0);return}function Vm(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((vb(a+4|0,4,0)|0|0)==(b|0)?(d=a+28|0,(vb(d|0,4,0)|0|0)!=1):0)tb(d|0,c|0,4);return}function Wm(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;tb(a+53>>0|0,1|0,1);do if((vb(a+4|0,4,0)|0|0)==(c|0)){tb(a+52>>0|0,1|0,1);f=a+16|0;e=vb(f|0,4,0)|0|0;i=a+54|0;h=a+48|0;g=a+24|0;c=a+36|0;if(!e){tb(f|0,b|0,4);tb(g|0,d|0,4);tb(c|0,1|0,4);if(!((vb(h|0,4,0)|0|0)==1&(d|0)==1))break;tb(i>>0|0,1|0,1);break}if((e|0)!=(b|0)){tb(c|0,(vb(c|0,4,0)|0|0)+1|0,4);tb(i>>0|0,1|0,1);break}c=vb(g|0,4,0)|0|0;if((c|0)==2){tb(g|0,d|0,4);c=d}if((vb(h|0,4,0)|0|0)==1&(c|0)==1)tb(i>>0|0,1|0,1)}while(0);return}function Xm(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,n=0,o=0,p=0;p=l;l=l+64|0;if((l|0)>=(m|0))X(64);o=p;k=vb(a|0,4,0)|0|0;n=a+(vb(k+-8|0,4,0)|0|0)|0;k=vb(k+-4|0,4,0)|0|0;tb(o|0,b|0,4);tb(o+4|0,a|0,4);tb(o+8|0,312|0,4);j=o+12|0;d=o+16|0;e=o+20|0;g=o+24|0;i=o+28|0;h=o+32|0;f=o+40|0;a=Tm(k,b)|0;b=j;c=b+40|0;do{tb(b|0,0|0,4);b=b+4|0}while((b|0)<(c|0));tb(j+40|0,0|0,2);tb(j+42>>0|0,0|0,1);a:do if(a){tb(o+48|0,1|0,4);mb[(xb(vb((vb(k|0,4,0)|0|0)+20|0,4,0)|0|0,3|0)|0)&3](k,o,n,n,1,0);a=(vb(g|0,4,0)|0|0)==1?n:0}else{lb[(xb(vb((vb(k|0,4,0)|0|0)+24|0,4,0)|0|0,7|0)|0)&7](k,o,n,1,0);switch(vb(o+36|0,4,0)|0|0){case 0:{a=(vb(f|0,4,0)|0|0)==1&(vb(i|0,4,0)|0|0)==1&(vb(h|0,4,0)|0|0)==1?vb(e|0,4,0)|0|0:0;break a}case 1:break;default:{a=0;break a}}if((vb(g|0,4,0)|0|0)!=1?!((vb(f|0,4,0)|0|0)==0&(vb(i|0,4,0)|0|0)==1&(vb(h|0,4,0)|0|0)==1):0){a=0;break}a=vb(d|0,4,0)|0|0}while(0);l=p;return a|0}function Ym(a){a=a|0;Em(a);return}function Zm(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;if(Tm(a,vb(b+8|0,4,0)|0|0)|0)Wm(b,c,d,e);else{a=vb(a+8|0,4,0)|0|0;mb[(xb(vb((vb(a|0,4,0)|0|0)+20|0,4,0)|0|0,3|0)|0)&3](a,b,c,d,e,f)}return}function _m(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;do if(!(Tm(a,vb(b+8|0,4,0)|0|0)|0)){f=a+8|0;if(!(Tm(a,vb(b|0,4,0)|0|0)|0)){h=vb(f|0,4,0)|0|0;lb[(xb(vb((vb(h|0,4,0)|0|0)+24|0,4,0)|0|0,7|0)|0)&7](h,b,c,d,e);break}a=b+32|0;if((vb(b+16|0,4,0)|0|0)!=(c|0)?(g=b+20|0,(vb(g|0,4,0)|0|0)!=(c|0)):0){tb(a|0,d|0,4);d=b+44|0;if((vb(d|0,4,0)|0|0)==4)break;a=b+52|0;tb(a>>0|0,0|0,1);i=b+53|0;tb(i>>0|0,0|0,1);f=vb(f|0,4,0)|0|0;mb[(xb(vb((vb(f|0,4,0)|0|0)+20|0,4,0)|0|0,3|0)|0)&3](f,b,c,c,1,e);if(vb(i>>0|0,1,0)|0)if(!(vb(a>>0|0,1,0)|0)){a=3;h=11}else a=3;else{a=4;h=11}if((h|0)==11){tb(g|0,c|0,4);i=b+40|0;tb(i|0,(vb(i|0,4,0)|0|0)+1|0,4);if((vb(b+36|0,4,0)|0|0)==1?(vb(b+24|0,4,0)|0|0)==2:0)tb(b+54>>0|0,1|0,1)}tb(d|0,a|0,4);break}if((d|0)==1)tb(a|0,1|0,4)}else Vm(b,c,d);while(0);return}function $m(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if(Tm(a,vb(b+8|0,4,0)|0|0)|0)Um(b,c,d);else{a=vb(a+8|0,4,0)|0|0;kb[(xb(vb((vb(a|0,4,0)|0|0)+28|0,4,0)|0|0,15|0)|0)&15](a,b,c,d)}return}function an(){var a=0;a=l;l=l+16|0;if((l|0)>=(m|0))X(16);if(!(Ya(23096,66)|0)){l=a;return}else Km(22118,a)}function bn(a){a=a|0;var b=0;b=l;l=l+16|0;if((l|0)>=(m|0))X(16);Al(a);if(!(_a(vb(5774*4|0,4,0)|0|0,0)|0)){l=b;return}else Km(22168,b)}function cn(){var a=0,b=0,c=0;o=0;a=ma(7)|0;c=o;o=0;if(c&1){c=Ga(0)|0;Gd(c)}if((a|0?(b=vb(a|0,4,0)|0|0,b|0):0)?(a=b+48|0,((vb(a|0,4,0)|0)&-256|0)==1126902528?(vb(a+4|0,4,0)|0|0)==1129074247:0):0)dn(vb(b+12|0,4,0)|0|0);dn(en()|0)}function dn(a){a=a|0;var b=0;b=l;l=l+16|0;if((l|0)>=(m|0))X(16);o=0;ra(a|0);a=o;o=0;if(!(a&1)){o=0;ua(34,22221,b|0);o=0}a=Ga(0)|0;Ca(a|0)|0;o=0;ua(34,22261,b+8|0);o=0;a=Ga(0)|0;o=0;ra(5);b=o;o=0;if(b&1){b=Ga(0)|0;Gd(b)}else Gd(a)}function en(){var a=0;a=vb(2641*4|0,4,0)|0|0;tb(2641*4|0,a+0|0,4);return a|0}function fn(a){a=a|0;return}function gn(a){a=a|0;Em(a);return}function hn(a){a=a|0;return 22311}function jn(a){a=a|0;tb(a|0,10676|0,4);nn(a+4|0);return}function kn(a){a=a|0;jn(a);Em(a);return}function ln(a){a=a|0;return mn(vb(a+4|0,4,0)|0|0)|0}function mn(a){a=a|0;return a|0}function nn(a){a=a|0;var b=0,c=0;a=on(vb(a|0,4,0)|0|0)|0;c=a+8|0;b=vb(c|0,4,0)|0|0;tb(c|0,b+-1|0,4);if((b+-1|0)<0)Em(a);return}function on(a){a=a|0;return a+-12|0}function pn(a){a=a|0;jn(a);Em(a);return}function qn(a){a=a|0;Em(a);return}function rn(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;if(Tm(a,vb(b+8|0,4,0)|0|0)|0)Wm(b,c,d,e);else{l=b+52|0;g=vb(l>>0|0,1,0)|0|0;k=b+53|0;h=vb(k>>0|0,1,0)|0|0;n=vb(a+12|0,4,0)|0|0;j=a+16+(n<<3)|0;tb(l>>0|0,0|0,1);tb(k>>0|0,0|0,1);vn(a+16|0,b,c,d,e,f);a:do if((n|0)>1){m=b+24|0;n=b+54|0;i=a+8|0;a=a+24|0;do{if(vb(n>>0|0,1,0)|0|0)break a;if(!(vb(l>>0|0,1,0)|0)){if(vb(k>>0|0,1,0)|0|0?((vb(i|0,4,0)|0)&1|0)==0:0)break a}else{if((vb(m|0,4,0)|0|0)==1)break a;if(!((vb(i|0,4,0)|0)&2))break a}tb(l>>0|0,0|0,1);tb(k>>0|0,0|0,1);vn(a,b,c,d,e,f);a=a+8|0}while(a>>>0<j>>>0)}while(0);tb(l>>0|0,g|0,1);tb(k>>0|0,h|0,1)}return}function sn(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;a:do if(!(Tm(a,vb(b+8|0,4,0)|0|0)|0)){g=a+12|0;o=b+24|0;p=b+36|0;q=b+54|0;m=a+8|0;k=a+16|0;if(!(Tm(a,vb(b|0,4,0)|0|0)|0)){n=vb(g|0,4,0)|0|0;h=a+16+(n<<3)|0;wn(k,b,c,d,e);f=a+24|0;if((n|0)<=1)break;g=vb(m|0,4,0)|0|0;if((g&2|0)==0?(vb(p|0,4,0)|0|0)!=1:0){if(!(g&1))while(1){if(vb(q>>0|0,1,0)|0|0)break a;if((vb(p|0,4,0)|0|0)==1)break a;wn(f,b,c,d,e);f=f+8|0;if(f>>>0>=h>>>0)break a}while(1){if(vb(q>>0|0,1,0)|0|0)break a;if((vb(p|0,4,0)|0|0)==1?(vb(o|0,4,0)|0|0)==1:0)break a;wn(f,b,c,d,e);f=f+8|0;if(f>>>0>=h>>>0)break a}}while(1){if(vb(q>>0|0,1,0)|0|0)break a;wn(f,b,c,d,e);f=f+8|0;if(f>>>0>=h>>>0)break a}}f=b+32|0;if((vb(b+16|0,4,0)|0|0)!=(c|0)?(n=b+20|0,(vb(n|0,4,0)|0|0)!=(c|0)):0){tb(f|0,d|0,4);l=b+44|0;if((vb(l|0,4,0)|0|0)==4)break;h=a+16+((vb(g|0,4,0)|0)<<3)|0;i=b+52|0;d=b+53|0;j=0;f=0;a=k;b:while(1){if(a>>>0>=h>>>0){g=18;break}tb(i>>0|0,0|0,1);tb(d>>0|0,0|0,1);vn(a,b,c,c,1,e);if(vb(q>>0|0,1,0)|0|0){g=18;break}do if(vb(d>>0|0,1,0)|0){if(!(vb(i>>0|0,1,0)|0))if(!((vb(m|0,4,0)|0)&1)){f=1;g=18;break b}else{g=j;f=1;break}if((vb(o|0,4,0)|0|0)==1){g=23;break b}if(!((vb(m|0,4,0)|0)&2)){g=23;break b}else{g=1;f=1}}else g=j;while(0);j=g;a=a+8|0}do if((g|0)==18){if((!j?(tb(n|0,c|0,4),b=b+40|0,tb(b|0,(vb(b|0,4,0)|0|0)+1|0,4),(vb(p|0,4,0)|0|0)==1):0)?(vb(o|0,4,0)|0|0)==2:0){tb(q>>0|0,1|0,1);if(f){g=23;break}else{f=4;break}}if(f)g=23;else f=4}while(0);if((g|0)==23)f=3;tb(l|0,f|0,4);break}if((d|0)==1)tb(f|0,1|0,4)}else Vm(b,c,d);while(0);return}function tn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;a:do if(!(Tm(a,vb(b+8|0,4,0)|0|0)|0)){f=vb(a+12|0,4,0)|0|0;e=a+16+(f<<3)|0;un(a+16|0,b,c,d);if((f|0)>1){f=b+54|0;a=a+24|0;do{un(a,b,c,d);if(vb(f>>0|0,1,0)|0|0)break a;a=a+8|0}while(a>>>0<e>>>0)}}else Um(b,c,d);while(0);return}function un(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;f=vb(a+4|0,4,0)|0|0;e=f>>8;if(f&1)e=vb((vb(c|0,4,0)|0|0)+e|0,4,0)|0|0;a=vb(a|0,4,0)|0|0;kb[(xb(vb((vb(a|0,4,0)|0|0)+28|0,4,0)|0|0,15|0)|0)&15](a,b,c+e|0,f&2|0?d:2);return}function vn(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;h=vb(a+4|0,4,0)|0|0;g=h>>8;if(h&1)g=vb((vb(d|0,4,0)|0|0)+g|0,4,0)|0|0;a=vb(a|0,4,0)|0|0;mb[(xb(vb((vb(a|0,4,0)|0|0)+20|0,4,0)|0|0,3|0)|0)&3](a,b,c,d+g|0,h&2|0?e:2,f);return}function wn(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;g=vb(a+4|0,4,0)|0|0;f=g>>8;if(g&1)f=vb((vb(c|0,4,0)|0|0)+f|0,4,0)|0|0;a=vb(a|0,4,0)|0|0;lb[(xb(vb((vb(a|0,4,0)|0|0)+24|0,4,0)|0|0,7|0)|0)&7](a,b,c+f|0,g&2|0?d:2,e);return}function xn(){var a=0;if((vb(22480|0,1,0)|0|0)==1)a=0;else{tb(22480|0,1|0,1);a=1}return a|0}function yn(a){a=a|0;tb(a|0,10656|0,4);return}function zn(){var a=0;a=vb(5775*4|0,4,0)|0|0;tb(5775*4|0,a+0|0,4);return a|0}function An(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;e=l;l=l+16|0;if((l|0)>=(m|0))X(16);d=e;tb(d|0,vb(c|0,4,0)|0|0,4);a=db[(xb(vb((vb(a|0,4,0)|0|0)+16|0,4,0)|0|0,31|0)|0)&31](a,b,d)|0;if(a)tb(c|0,vb(d|0,4,0)|0|0,4);l=e;return a&1|0}function Bn(a){a=a|0;if(!a)a=0;else a=(Xm(a,416)|0)!=0;return a&1|0}function Cn(){}function Dn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;c=a+c>>>0;return (z=b+d+(c>>>0<a>>>0|0)>>>0,c|0)|0}function En(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;d=b-d-(c>>>0>a>>>0|0)>>>0;return (z=d,a-c>>>0|0)|0}function Fn(a){a=a|0;var b=0;b=vb(n+(a&255)|0,1,0)|0;if((b|0)<8)return b|0;b=vb(n+(a>>8&255)|0,1,0)|0;if((b|0)<8)return b+8|0;b=vb(n+(a>>16&255)|0,1,0)|0;if((b|0)<8)return b+16|0;return (vb(n+(a>>>24)|0,1,0)|0)+24|0}function Gn(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;k=a;i=b;j=i;g=c;m=d;h=m;if(!j){f=(e|0)!=0;if(!h){if(f){tb(e|0,(k>>>0)%(g>>>0)|0,4);tb(e+4|0,0|0,4)}m=0;e=(k>>>0)/(g>>>0)>>>0;return (z=m,e)|0}else{if(!f){m=0;e=0;return (z=m,e)|0}tb(e|0,a|0|0,4);tb(e+4|0,b&0|0,4);m=0;e=0;return (z=m,e)|0}}f=(h|0)==0;do if(g){if(!f){f=(R(h|0)|0)-(R(j|0)|0)|0;if(f>>>0<=31){l=f+1|0;h=31-f|0;b=f-31>>31;g=l;a=k>>>(l>>>0)&b|j<<h;b=j>>>(l>>>0)&b;f=0;h=k<<h;break}if(!e){m=0;e=0;return (z=m,e)|0}tb(e|0,a|0|0,4);tb(e+4|0,i|b&0|0,4);m=0;e=0;return (z=m,e)|0}f=g-1|0;if(f&g|0){h=(R(g|0)|0)+33-(R(j|0)|0)|0;o=64-h|0;l=32-h|0;i=l>>31;n=h-32|0;b=n>>31;g=h;a=l-1>>31&j>>>(n>>>0)|(j<<l|k>>>(h>>>0))&b;b=b&j>>>(h>>>0);f=k<<o&i;h=(j<<o|k>>>(n>>>0))&i|k<<l&h-33>>31;break}if(e|0){tb(e|0,f&k|0,4);tb(e+4|0,0|0,4)}if((g|0)==1){n=i|b&0;o=a|0|0;return (z=n,o)|0}else{o=Fn(g|0)|0;n=j>>>(o>>>0)|0;o=j<<32-o|k>>>(o>>>0)|0;return (z=n,o)|0}}else{if(f){if(e|0){tb(e|0,(j>>>0)%(g>>>0)|0,4);tb(e+4|0,0|0,4)}n=0;o=(j>>>0)/(g>>>0)>>>0;return (z=n,o)|0}if(!k){if(e|0){tb(e|0,0|0,4);tb(e+4|0,(j>>>0)%(h>>>0)|0,4)}n=0;o=(j>>>0)/(h>>>0)>>>0;return (z=n,o)|0}f=h-1|0;if(!(f&h)){if(e|0){tb(e|0,a|0|0,4);tb(e+4|0,f&j|b&0|0,4)}n=0;o=j>>>((Fn(h|0)|0)>>>0);return (z=n,o)|0}f=(R(h|0)|0)-(R(j|0)|0)|0;if(f>>>0<=30){b=f+1|0;h=31-f|0;g=b;a=j<<h|k>>>(b>>>0);b=j>>>(b>>>0);f=0;h=k<<h;break}if(!e){n=0;o=0;return (z=n,o)|0}tb(e|0,a|0|0,4);tb(e+4|0,i|b&0|0,4);n=0;o=0;return (z=n,o)|0}while(0);if(!g){j=h;i=0;h=0}else{l=c|0|0;k=m|d&0;j=Dn(l|0,k|0,-1,-1)|0;c=z;i=h;h=0;do{d=i;i=f>>>31|i<<1;f=h|f<<1;d=a<<1|d>>>31|0;m=a>>>31|b<<1|0;En(j|0,c|0,d|0,m|0)|0;o=z;n=o>>31|((o|0)<0?-1:0)<<1;h=n&1;a=En(d|0,m|0,n&l|0,(((o|0)<0?-1:0)>>31|((o|0)<0?-1:0)<<1)&k|0)|0;b=z;g=g-1|0}while((g|0)!=0);j=i;i=0}g=0;if(e|0){tb(e|0,a|0,4);tb(e+4|0,b|0,4)}n=(f|0)>>>31|(j|g)<<1|(g<<1|f>>>31)&0|i;o=(f<<1|0>>>31)&-2|h;return (z=n,o)|0}function Hn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return Gn(a,b,c,d,0)|0}function In(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;f=l;l=l+16|0;e=f|0;Gn(a,b,c,d,e)|0;l=f;return (z=vb(e+4|0,4,0)|0|0,vb(e|0,4,0)|0|0)|0}function Jn(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){z=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}z=0;return b>>>c-32|0}function Kn(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){z=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}z=a<<c-32;return 0}function Ln(a){a=a|0;return (a&255)<<24|(a>>8&255)<<16|(a>>16&255)<<8|a>>>24|0}function Mn(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;if((c|0)>=8192)return Ua(a|0,b|0,c|0)|0;f=a|0;e=a+c|0;if((a&3)==(b&3)){while(a&3){if(!c)return f|0;tb(a|0,vb(b|0,1,0)|0,1);a=a+1|0;b=b+1|0;c=c-1|0}c=e&-4|0;d=c-64|0;while((a|0)<=(d|0)){tb(a|0,vb(b|0,4,0)|0,4);tb(a+4|0,vb(b+4|0,4,0)|0,4);tb(a+8|0,vb(b+8|0,4,0)|0,4);tb(a+12|0,vb(b+12|0,4,0)|0,4);tb(a+16|0,vb(b+16|0,4,0)|0,4);tb(a+20|0,vb(b+20|0,4,0)|0,4);tb(a+24|0,vb(b+24|0,4,0)|0,4);tb(a+28|0,vb(b+28|0,4,0)|0,4);tb(a+32|0,vb(b+32|0,4,0)|0,4);tb(a+36|0,vb(b+36|0,4,0)|0,4);tb(a+40|0,vb(b+40|0,4,0)|0,4);tb(a+44|0,vb(b+44|0,4,0)|0,4);tb(a+48|0,vb(b+48|0,4,0)|0,4);tb(a+52|0,vb(b+52|0,4,0)|0,4);tb(a+56|0,vb(b+56|0,4,0)|0,4);tb(a+60|0,vb(b+60|0,4,0)|0,4);a=a+64|0;b=b+64|0}while((a|0)<(c|0)){tb(a|0,vb(b|0,4,0)|0,4);a=a+4|0;b=b+4|0}}else{c=e-4|0;while((a|0)<(c|0)){tb(a|0,vb(b|0,1,0)|0,1);tb(a+1|0,vb(b+1|0,1,0)|0,1);tb(a+2|0,vb(b+2|0,1,0)|0,1);tb(a+3|0,vb(b+3|0,1,0)|0,1);a=a+4|0;b=b+4|0}}while((a|0)<(e|0)){tb(a|0,vb(b|0,1,0)|0,1);a=a+1|0;b=b+1|0}return f|0}function Nn(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((b|0)<(a|0)&(a|0)<(b+c|0)){d=a;b=b+c|0;a=a+c|0;while((c|0)>0){a=a-1|0;b=b-1|0;c=c-1|0;tb(a|0,vb(b|0,1,0)|0,1)}a=d}else Mn(a,b,c)|0;return a|0}function On(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;f=a+c|0;b=b&255;if((c|0)>=67){while(a&3){tb(a|0,b|0,1);a=a+1|0}d=f&-4|0;e=d-64|0;g=b|b<<8|b<<16|b<<24;while((a|0)<=(e|0)){tb(a|0,g|0,4);tb(a+4|0,g|0,4);tb(a+8|0,g|0,4);tb(a+12|0,g|0,4);tb(a+16|0,g|0,4);tb(a+20|0,g|0,4);tb(a+24|0,g|0,4);tb(a+28|0,g|0,4);tb(a+32|0,g|0,4);tb(a+36|0,g|0,4);tb(a+40|0,g|0,4);tb(a+44|0,g|0,4);tb(a+48|0,g|0,4);tb(a+52|0,g|0,4);tb(a+56|0,g|0,4);tb(a+60|0,g|0,4);a=a+64|0}while((a|0)<(d|0)){tb(a|0,g|0,4);a=a+4|0}}while((a|0)<(f|0)){tb(a|0,b|0,1);a=a+1|0}return f-c|0}function Pn(a){a=a|0;var b=0,c=0;c=a+15&-16|0;b=vb(i|0,4,0)|0|0;a=b+c|0;if((c|0)>0&(a|0)<(b|0)|(a|0)<0){W()|0;Na(12);return -1}tb(i|0,a|0,4);if((a|0)>(V()|0)?(U()|0)==0:0){tb(i|0,b|0,4);Na(12);return -1}return b|0}function Qn(a){a=a|0;return ab[(xb(a|0,7|0)|0)&7]()|0}function Rn(a,b){a=a|0;b=b|0;return bb[(xb(a|0,15|0)|0)&15](b|0)|0}function Sn(a,b,c){a=a|0;b=b|0;c=c|0;return cb[(xb(a|0,31|0)|0)&31](b|0,c|0)|0}function Tn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return db[(xb(a|0,31|0)|0)&31](b|0,c|0,d|0)|0}function Un(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return eb[(xb(a|0,3|0)|0)&3](b|0,c|0,d|0,e|0)|0}function Vn(a){a=a|0;fb[(xb(a|0,7|0)|0)&7]()}function Wn(a,b){a=a|0;b=b|0;gb[(xb(a|0,127|0)|0)&127](b|0)}function Xn(a,b,c){a=a|0;b=b|0;c=+c;hb[(xb(a|0,7|0)|0)&7](b|0,+c)}function Yn(a,b,c){a=a|0;b=b|0;c=c|0;ib[(xb(a|0,63|0)|0)&63](b|0,c|0)}function Zn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;jb[(xb(a|0,3|0)|0)&3](b|0,c|0,d|0)}function _n(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;kb[(xb(a|0,15|0)|0)&15](b|0,c|0,d|0,e|0)}function $n(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;lb[(xb(a|0,7|0)|0)&7](b|0,c|0,d|0,e|0,f|0)}function ao(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;mb[(xb(a|0,3|0)|0)&3](b|0,c|0,d|0,e|0,f|0,g|0)}function bo(){$(0);return 0}function co(a){a=a|0;aa(1);return 0}function eo(a,b){a=a|0;b=b|0;ba(2);return 0}function fo(a,b,c){a=a|0;b=b|0;c=c|0;ca(3);return 0}function go(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;da(4);return 0}function ho(){ea(5)}function io(){Ia()}function jo(){Da()}function ko(a){a=a|0;fa(6)}function lo(a,b){a=a|0;b=+b;ga(7)}function mo(a,b){a=a|0;b=b|0;ha(8)}function no(a,b,c){a=a|0;b=b|0;c=c|0;ia(9)}function oo(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ja(10)}function po(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ka(11)}function qo(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;la(12)}

// EMSCRIPTEN_END_FUNCS
            var ab=[bo,Mh,Nh,sj,tj,Zk,_k,Jm];var bb=[co,Ec,dd,fd,gd,_d,El,hn,ln,co,co,co,co,co,co,co];var cb=[eo,Sb,Xb,Zb,cc,wc,ed,hd,pd,Md,ye,De,bh,ei,hi,Jj,Nj,Pj,cl,bg,eo,eo,eo,eo,eo,eo,eo,eo,eo,eo,eo,eo];var db=[fo,Tb,bc,yc,Dc,bd,cd,Ud,Zd,Ee,_g,$g,eh,Th,Uh,ci,di,ii,wj,xj,Hj,Ij,Oj,dl,Fl,Gl,Kl,nm,Pm,Eb,fo,fo];var eb=[go,ji,mi,go];var fb=[ho,io,Im,Ve,an,jo,ho,ho];var gb=[ko,Pb,Qb,Rb,Ub,Vb,Wb,uc,vc,Bc,rc,Vc,_c,ad,$c,nd,od,Bd,Ld,Dd,Jd,td,Yc,Kd,Od,Pd,Rd,Sd,Xd,ve,we,xe,Yg,Zg,Sh,ai,bi,ki,li,vj,Fj,Gj,al,bl,Lm,Mm,Nm,Om,Ym,fn,gn,jn,kn,pn,qn,pc,Bf,Vh,Ph,Zh,yj,uj,Bj,el,$k,gl,bn,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko,ko];var hb=[lo,Ce,ah,gi,Mj,lo,lo,lo];var ib=[mo,Yb,_b,$b,ac,zc,Ac,Cc,Nd,kc,Vd,Wd,Yd,$d,ze,Ae,Be,dh,fi,Kj,Lj,Fb,je,Hm,Df,Ef,Ff,Hf,Qf,Of,Mf,Kf,Lf,If,Km,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo,mo];var jb=[no,Gf,Cf,no];var kb=[oo,xc,Td,si,ti,ui,vi,wi,xi,yi,zi,Sm,$m,tn,oo,oo];var lb=[po,ch,Rm,_m,sn,po,po,po];var mb=[qo,Qm,Zm,rn];return{___cxa_can_catch:An,___cxa_is_pointer_type:Bn,___errno_location:Il,___udivdi3:Hn,___uremdi3:In,_bitshift64Lshr:Jn,_bitshift64Shl:Kn,_emu_compute_audio_samples:il,_emu_get_audio_buffer:jl,_emu_get_audio_buffer_length:kl,_emu_get_current_position:ll,_emu_get_max_position:ml,_emu_get_sample_rate:nl,_emu_get_track_info:ol,_emu_load_file:pl,_emu_seek_position:ql,_emu_set_subsong:rl,_emu_teardown:sl,_fflush:wm,_free:Al,_i64Add:Dn,_i64Subtract:En,_llvm_bswap_i32:Ln,_malloc:zl,_memcpy:Mn,_memmove:Nn,_memset:On,_sbrk:Pn,dynCall_i:Qn,dynCall_ii:Rn,dynCall_iii:Sn,dynCall_iiii:Tn,dynCall_iiiii:Un,dynCall_v:Vn,dynCall_vi:Wn,dynCall_vid:Xn,dynCall_vii:Yn,dynCall_viii:Zn,dynCall_viiii:_n,dynCall_viiiii:$n,dynCall_viiiiii:ao,establishStackSpace:qb,getTempRet0:zb,runPostSets:Cn,setDynamicTop:sb,setTempRet0:yb,setThrew:rb,stackAlloc:nb,stackRestore:pb,stackSave:ob}})


        // EMSCRIPTEN_END_ASM
        (d.Fa,d.Ga,buffer),Gc=Z.___cxa_can_catch;
        Z.___cxa_can_catch=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Gc.apply(null,arguments)};var Hc=Z.___cxa_is_pointer_type;
        Z.___cxa_is_pointer_type=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Hc.apply(null,arguments)};var Ic=Z.___errno_location;
        Z.___errno_location=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Ic.apply(null,arguments)};var Jc=Z.___udivdi3;
        Z.___udivdi3=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Jc.apply(null,arguments)};var Kc=Z.___uremdi3;Z.___uremdi3=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Kc.apply(null,arguments)};
        var Lc=Z._bitshift64Lshr;Z._bitshift64Lshr=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Lc.apply(null,arguments)};var Mc=Z._bitshift64Shl;
        Z._bitshift64Shl=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Mc.apply(null,arguments)};var Nc=Z._emu_compute_audio_samples;
        Z._emu_compute_audio_samples=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Nc.apply(null,arguments)};var Oc=Z._emu_get_audio_buffer;
        Z._emu_get_audio_buffer=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Oc.apply(null,arguments)};var Pc=Z._emu_get_audio_buffer_length;
        Z._emu_get_audio_buffer_length=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Pc.apply(null,arguments)};var Qc=Z._emu_get_current_position;
        Z._emu_get_current_position=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Qc.apply(null,arguments)};var Rc=Z._emu_get_max_position;
        Z._emu_get_max_position=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Rc.apply(null,arguments)};var Sc=Z._emu_get_sample_rate;
        Z._emu_get_sample_rate=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Sc.apply(null,arguments)};var Tc=Z._emu_get_track_info;
        Z._emu_get_track_info=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Tc.apply(null,arguments)};var Uc=Z._emu_load_file;
        Z._emu_load_file=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Uc.apply(null,arguments)};var Vc=Z._emu_seek_position;
        Z._emu_seek_position=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Vc.apply(null,arguments)};var Wc=Z._emu_set_subsong;
        Z._emu_set_subsong=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Wc.apply(null,arguments)};var Xc=Z._emu_teardown;
        Z._emu_teardown=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Xc.apply(null,arguments)};var Yc=Z._fflush;Z._fflush=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Yc.apply(null,arguments)};
        var Zc=Z._free;Z._free=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return Zc.apply(null,arguments)};var $c=Z._i64Add;Z._i64Add=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return $c.apply(null,arguments)};
        var ad=Z._i64Subtract;Z._i64Subtract=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return ad.apply(null,arguments)};var bd=Z._llvm_bswap_i32;
        Z._llvm_bswap_i32=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return bd.apply(null,arguments)};var cd=Z._malloc;Z._malloc=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return cd.apply(null,arguments)};
        var dd=Z._memmove;Z._memmove=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return dd.apply(null,arguments)};var ed=Z._sbrk;
        Z._sbrk=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return ed.apply(null,arguments)};var fd=Z.establishStackSpace;
        Z.establishStackSpace=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return fd.apply(null,arguments)};var gd=Z.getTempRet0;
        Z.getTempRet0=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return gd.apply(null,arguments)};var hd=Z.setDynamicTop;
        Z.setDynamicTop=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return hd.apply(null,arguments)};var id=Z.setTempRet0;
        Z.setTempRet0=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return id.apply(null,arguments)};var jd=Z.setThrew;Z.setThrew=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return jd.apply(null,arguments)};
        var kd=Z.stackAlloc;Z.stackAlloc=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return kd.apply(null,arguments)};var ld=Z.stackRestore;
        Z.stackRestore=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return ld.apply(null,arguments)};var md=Z.stackSave;Z.stackSave=function(){assert(B,"you need to wait for the runtime to be ready (e.g. wait for main() to be called)");assert(!C,"the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");return md.apply(null,arguments)};
        d.___cxa_can_catch=Z.___cxa_can_catch;d.___cxa_is_pointer_type=Z.___cxa_is_pointer_type;d.___errno_location=Z.___errno_location;d.___udivdi3=Z.___udivdi3;d.___uremdi3=Z.___uremdi3;d._bitshift64Lshr=Z._bitshift64Lshr;d._bitshift64Shl=Z._bitshift64Shl;d._emu_compute_audio_samples=Z._emu_compute_audio_samples;d._emu_get_audio_buffer=Z._emu_get_audio_buffer;d._emu_get_audio_buffer_length=Z._emu_get_audio_buffer_length;d._emu_get_current_position=Z._emu_get_current_position;d._emu_get_max_position=Z._emu_get_max_position;
        d._emu_get_sample_rate=Z._emu_get_sample_rate;d._emu_get_track_info=Z._emu_get_track_info;d._emu_load_file=Z._emu_load_file;d._emu_seek_position=Z._emu_seek_position;d._emu_set_subsong=Z._emu_set_subsong;d._emu_teardown=Z._emu_teardown;d._fflush=Z._fflush;var mb=d._free=Z._free;d._i64Add=Z._i64Add;d._i64Subtract=Z._i64Subtract;d._llvm_bswap_i32=Z._llvm_bswap_i32;var nb=d._malloc=Z._malloc;d._memcpy=Z._memcpy;d._memmove=Z._memmove;d._memset=Z._memset;d._sbrk=Z._sbrk;d.establishStackSpace=Z.establishStackSpace;
        d.getTempRet0=Z.getTempRet0;d.runPostSets=Z.runPostSets;d.setDynamicTop=Z.setDynamicTop;var ma=d.setTempRet0=Z.setTempRet0;d.setThrew=Z.setThrew;var la=d.stackAlloc=Z.stackAlloc,ka=d.stackRestore=Z.stackRestore,ja=d.stackSave=Z.stackSave;d.dynCall_i=Z.dynCall_i;d.dynCall_ii=Z.dynCall_ii;d.dynCall_iii=Z.dynCall_iii;d.dynCall_iiii=Z.dynCall_iiii;d.dynCall_iiiii=Z.dynCall_iiiii;d.dynCall_v=Z.dynCall_v;d.dynCall_vi=Z.dynCall_vi;d.dynCall_vid=Z.dynCall_vid;d.dynCall_vii=Z.dynCall_vii;d.dynCall_viii=Z.dynCall_viii;
        d.dynCall_viiii=Z.dynCall_viiii;d.dynCall_viiiii=Z.dynCall_viiiii;d.dynCall_viiiiii=Z.dynCall_viiiiii;d.asm=Z;d.intArrayFromString||(d.intArrayFromString=function(){p("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.intArrayToString||(d.intArrayToString=function(){p("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});
        d.ccall=function(a,b,c,e){var f=d["_"+a];assert(f,"Cannot call unknown function "+a+", make sure it is exported");var g=[];a=0;assert("array"!==b,'Return type should not be "array".');if(e)for(var l=0;l<e.length;l++){var t=Ga[c[l]];t?(0===a&&(a=ja()),g[l]=t(e[l])):g[l]=e[l]}c=f.apply(null,g);"string"===b&&(c=Ha(c));0!==a&&ka(a);return c};d.cwrap||(d.cwrap=function(){p("'cwrap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.setValue||(d.setValue=function(){p("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});
        d.getValue||(d.getValue=function(){p("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.allocate||(d.allocate=function(){p("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.getMemory=function(a){if(oa)if(B)var b=nb(a);else{assert(v);b=r[v>>2];a=b+a+15&-16;r[v>>2]=a;if(a=a>=w)Ra(),a=!0;a&&(r[v>>2]=b,b=0)}else b=na(a);return b};d.Pointer_stringify=Ha;d.AsciiToString||(d.AsciiToString=function(){p("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});
        d.stringToAscii||(d.stringToAscii=function(){p("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.UTF8ArrayToString||(d.UTF8ArrayToString=function(){p("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.UTF8ToString||(d.UTF8ToString=function(){p("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.stringToUTF8Array||(d.stringToUTF8Array=function(){p("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});
        d.stringToUTF8||(d.stringToUTF8=function(){p("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.UTF16ToString||(d.UTF16ToString=function(){p("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.stringToUTF16||(d.stringToUTF16=function(){p("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.lengthBytesUTF16||(d.lengthBytesUTF16=function(){p("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});
        d.UTF32ToString||(d.UTF32ToString=function(){p("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.stringToUTF32||(d.stringToUTF32=function(){p("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.lengthBytesUTF32||(d.lengthBytesUTF32=function(){p("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.allocateUTF8||(d.allocateUTF8=function(){p("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});
        d.stackTrace||(d.stackTrace=function(){p("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.addOnPreRun||(d.addOnPreRun=function(){p("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.addOnInit||(d.addOnInit=function(){p("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.addOnPreMain||(d.addOnPreMain=function(){p("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});
        d.addOnExit||(d.addOnExit=function(){p("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.addOnPostRun||(d.addOnPostRun=function(){p("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.writeStringToMemory||(d.writeStringToMemory=function(){p("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.writeArrayToMemory||(d.writeArrayToMemory=function(){p("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});
        d.writeAsciiToMemory||(d.writeAsciiToMemory=function(){p("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.addRunDependency=eb;d.removeRunDependency=fb;d.FS||(d.FS=function(){p("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.FS_createFolder=nc;d.FS_createPath=oc;d.FS_createDataFile=qc;d.FS_createPreloadedFile=uc;d.FS_createLazyFile=tc;d.FS_createLink=rc;d.FS_createDevice=V;d.FS_unlink=cc;d.GL||(d.GL=function(){p("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});
        d.staticAlloc||(d.staticAlloc=function(){p("'staticAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.dynamicAlloc||(d.dynamicAlloc=function(){p("'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.warnOnce||(d.warnOnce=function(){p("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.loadDynamicLibrary||(d.loadDynamicLibrary=function(){p("'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});
        d.loadWebAssemblyModule||(d.loadWebAssemblyModule=function(){p("'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.getLEB||(d.getLEB=function(){p("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.getFunctionTables||(d.getFunctionTables=function(){p("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.alignFunctionTables||(d.alignFunctionTables=function(){p("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});
        d.registerFunctions||(d.registerFunctions=function(){p("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.addFunction||(d.addFunction=function(){p("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.removeFunction||(d.removeFunction=function(){p("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.getFuncWrapper||(d.getFuncWrapper=function(){p("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});
        d.prettyPrint||(d.prettyPrint=function(){p("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.makeBigInt||(d.makeBigInt=function(){p("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.dynCall||(d.dynCall=function(){p("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.getCompilerSetting||(d.getCompilerSetting=function(){p("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});
        d.intArrayFromBase64||(d.intArrayFromBase64=function(){p("'intArrayFromBase64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.tryParseAsDataURI||(d.tryParseAsDataURI=function(){p("'tryParseAsDataURI' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")});d.ALLOC_NORMAL||Object.defineProperty(d,"ALLOC_NORMAL",{get:function(){p("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")}});
        d.ALLOC_STACK||Object.defineProperty(d,"ALLOC_STACK",{get:function(){p("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")}});d.ALLOC_STATIC||Object.defineProperty(d,"ALLOC_STATIC",{get:function(){p("'ALLOC_STATIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")}});d.ALLOC_DYNAMIC||Object.defineProperty(d,"ALLOC_DYNAMIC",{get:function(){p("'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")}});
        d.ALLOC_NONE||Object.defineProperty(d,"ALLOC_NONE",{get:function(){p("'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")}});
        if(F)if((String.prototype.startsWith?F.startsWith(gb):0===F.indexOf(gb))||("function"===typeof d.locateFile?F=d.locateFile(F):d.memoryInitializerPrefixURL&&(F=d.memoryInitializerPrefixURL+F)),m||ca){var nd=d.readBinary(F);y.set(nd,8)}else{var pd=function(){d.readAsync(F,od,function(){throw"could not load memory initializer "+F;})};eb("memory initializer");var od=function(a){a.byteLength&&(a=new Uint8Array(a));for(var b=0;b<a.length;b++)assert(0===y[8+b],"area for memory initializer should not have been touched before it's loaded");
            y.set(a,8);d.memoryInitializerRequest&&delete d.memoryInitializerRequest.response;fb("memory initializer")},qd=n(F);if(qd)od(qd.buffer);else if(d.memoryInitializerRequest){var rd=function(){var a=d.memoryInitializerRequest,b=a.response;if(200!==a.status&&0!==a.status)if(b=n(d.memoryInitializerRequestURL))b=b.buffer;else{console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: "+a.status+", retrying "+F);pd();return}od(b)};d.memoryInitializerRequest.response?setTimeout(rd,
            0):d.memoryInitializerRequest.addEventListener("load",rd)}else pd()}function fa(a){this.name="ExitStatus";this.message="Program terminated with exit("+a+")";this.status=a}fa.prototype=Error();fa.prototype.constructor=fa;var sd=null;bb=function td(){d.calledRun||ud();d.calledRun||(bb=td)};
        function ud(){function a(){if(!d.calledRun&&(d.calledRun=!0,!Da)){Qa();B||(B=!0,Ua(Wa));Qa();Ua(Xa);ba&&null!==sd&&d.printErr("pre-main prep time: "+(Date.now()-sd)+" ms");if(d.onRuntimeInitialized)d.onRuntimeInitialized();assert(!d._main,'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');Qa();if(d.postRun)for("function"==typeof d.postRun&&(d.postRun=[d.postRun]);d.postRun.length;){var a=d.postRun.shift();Za.unshift(a)}Ua(Za)}}null===sd&&(sd=
            Date.now());if(!(0<D)){assert(0==(A&3));z[(A>>2)-1]=34821223;z[(A>>2)-2]=2310721022;if(d.preRun)for("function"==typeof d.preRun&&(d.preRun=[d.preRun]);d.preRun.length;)$a();Ua(Va);0<D||d.calledRun||(d.setStatus?(d.setStatus("Running..."),setTimeout(function(){setTimeout(function(){d.setStatus("")},1);a()},1)):a(),Qa())}}d.run=ud;
        function vd(){var a=d.print,b=d.printErr,c=!1;d.print=d.printErr=function(){c=!0};try{var e=d._fflush;e&&e(0);["stdout","stderr"].forEach(function(a){a="/dev/"+a;try{var b=S(a,{I:!0});a=b.path}catch(t){}var e={Ma:!1,exists:!1,error:0,name:null,path:null,object:null,Oa:!1,Qa:null,Pa:null};try{b=S(a,{parent:!0}),e.Oa=!0,e.Qa=b.path,e.Pa=b.node,e.name=tb(a),b=S(a,{I:!0}),e.exists=!0,e.path=b.path,e.object=b.node,e.name=b.node.name,e.Ma="/"===b.path}catch(t){e.error=t.F}e&&(b=yb[e.object.rdev])&&b.output&&
        b.output.length&&(c=!0)})}catch(f){}d.print=a;d.printErr=b;c&&qa("stdio streams had content in them that was not flushed. you should set NO_EXIT_RUNTIME to 0 (see the FAQ), or make sure to emit a newline when you printf etc.")}
        d.exit=function(a,b){vd();if(!b||!d.noExitRuntime||0!==a){if(d.noExitRuntime)b||d.printErr("exit("+a+") called, but NO_EXIT_RUNTIME is set, so halting execution but not exiting the runtime or preventing further async execution (build with NO_EXIT_RUNTIME=0, if you want a true shutdown)");else if(Da=!0,Oa=void 0,Qa(),Ua(Ya),C=!0,d.onExit)d.onExit(a);m&&process.exit(a);d.quit(a,new fa(a))}};var wd=[];
        function p(a){if(d.onAbort)d.onAbort(a);void 0!==a?(d.print(a),d.printErr(a),a=JSON.stringify(a)):a="";Da=!0;var b="abort("+a+") at "+La()+"";wd&&wd.forEach(function(c){b=c(b,a)});throw b;}d.abort=p;if(d.preInit)for("function"==typeof d.preInit&&(d.preInit=[d.preInit]);0<d.preInit.length;)d.preInit.pop()();d.noExitRuntime=!0;ud();

        return {
            Module: Module,  // expose original Module
        };
    })(spp_backend_state_SNES);
    /*
     snes_adapter.js: Adapts GME backend to generic WebAudio/ScriptProcessor player.

     version 1.0

         Copyright (C) 2018 Juergen Wothke

     LICENSE

     GNU LESSER GENERAL PUBLIC LICENSE Version 2.1, February 1999 (see separate license.txt in gme folder).
    */
    SNESBackendAdapter = (function(){ var $this = function () {
        $this.base.call(this, backend_SNES.Module, 2);
        this._manualSetupComplete= true;
        this._undefined;
        this._currentPath;
        this._currentFile;

        if (!backend_SNES.Module.notReady) {
            // in sync scenario the "onRuntimeInitialized" has already fired before execution gets here,
            // i.e. it has to be called explicitly here (in async scenario "onRuntimeInitialized" will trigger
            // the call directly)
            this.doOnAdapterReady();
        }
    };
        // sample buffer contains 2-byte integer sample data (i.e.
        // must be rescaled) of 2 interleaved channels
        extend(EmsHEAP16BackendAdapter, $this, {
            doOnAdapterReady: function() {
                // called when runtime is ready (e.g. asynchronously when WASM is loaded)
                // if FS needed to be setup of would be done here..
            },
            getAudioBuffer: function() {
                var ptr=  this.Module.ccall('emu_get_audio_buffer', 'number');
                // make it a this.Module.HEAP16 pointer
                return ptr >> 1;	// 2 x 16 bit samples
            },
            getAudioBufferLength: function() {
                var len= this.Module.ccall('emu_get_audio_buffer_length', 'number');
                return len;
            },
            computeAudioSamples: function() {
                return this.Module.ccall('emu_compute_audio_samples', 'number');
            },
            getMaxPlaybackPosition: function() {
                return this.Module.ccall('emu_get_max_position', 'number');
            },
            getPlaybackPosition: function() {
                return this.Module.ccall('emu_get_current_position', 'number');
            },
            seekPlaybackPosition: function(pos) {
                this.Module.ccall('emu_seek_position', 'number', ['number'], [pos]);
            },
            getPathAndFilename: function(filename) {
                var sp = filename.split('/');
                var fn = sp[sp.length-1];
                var path= filename.substring(0, filename.lastIndexOf("/"));
                if (path.lenght) path= path+"/";

                return [path, fn];
            },
            mapBackendFilename: function (name) {
                // "name" comes from the C++ side
                var input= this.Module.Pointer_stringify(name);
                return input;
            },
            registerFileData: function(pathFilenameArray, data) {
                return this.registerEmscriptenFileData(pathFilenameArray, data);
            },
            loadMusicData: function(sampleRate, path, filename, data, options) {
                var buf = this.Module._malloc(data.length);
                this.Module.HEAPU8.set(data, buf);
                var ret = this.Module.ccall('emu_load_file', 'number', ['string', 'number', 'number'], [filename, buf, data.length]);
                this.Module._free(buf);

                if (ret == 0) {
                    this.playerSampleRate = this.Module.ccall('emu_get_sample_rate', 'number');
                    this.resetSampleRate(sampleRate, this.playerSampleRate);
                    this._currentPath= path;
                    this._currentFile= filename;
                } else {
                    this._currentPath= this._undefined;
                    this._currentFile= this._undefined;
                }
                return ret;
            },
            evalTrackOptions: function(options) {
                if (typeof options.timeout != 'undefined') {
                    ScriptNodePlayer.getInstance().setPlaybackTimeout(options.timeout*1000);
                } else {
                    ScriptNodePlayer.getInstance().setPlaybackTimeout(-1);	// reset last songs setting
                }
                var id= (options && options.track) ? options.track : -1;	// by default do not set track
                var boostVolume= (options && options.boostVolume) ? options.boostVolume : 0;
                return this.Module.ccall('emu_set_subsong', 'number', ['number', 'number'], [id, boostVolume]);
            },
            teardown: function() {
                this.Module.ccall('emu_teardown', 'number');	// just in case
            },
            getSongInfoMeta: function() {
                return {title: String,
                    artist: String,
                    game: String,
                    comment: String,
                    copyright: String,
                    dumper: String,
                    system: String,
                };
            },

            updateSongInfo: function(filename, result) {
                var numAttr= 7;
                var ret = this.Module.ccall('emu_get_track_info', 'number');

                // the automatic string creation fucks up the UNICODE chars beyond
                // recognition.. base64	wrapping is used to handle the strings properly
                var array = this.Module.HEAP32.subarray(ret>>2, (ret>>2)+numAttr);
                result.title= this.Module.Pointer_stringify(array[0]);
                result.artist= this.Module.Pointer_stringify(array[1]);
                result.game= this.Module.Pointer_stringify(array[2]);
                result.comment= this.Module.Pointer_stringify(array[5]);
                result.copyright= this.Module.Pointer_stringify(array[6]);
                result.dumper= this.Module.Pointer_stringify(array[7]);
                result.system= this.Module.Pointer_stringify(array[8]);
            }
        });	return $this; })();


    class BasicPlayerControls {
        /**
         * Minimal controls for ScriptNodePlayer.
         *
         * <p>Features an initial playlist, drag&drop of additional music files, and controls for "play", "pause",
         * "next song", "previous song", "seek" (optional), "volume".
         *
         * <p>This crude UI is not meant to be reusable but to show how the ScriptNodePlayer is used. ()
         */
        constructor(songs, enableSeek, enableSpeedTweak, doParseUrl, doOnDropFile, current) {
            this._doOnDropFile= doOnDropFile;
            this._current= (typeof current != 'undefined')?current:-1;
            if(Object.prototype.toString.call( songs ) === '[object Array]') {
                this._someSongs=  songs;
            } else {
                console.log("warning: no valid song list supplied.. starting empty");
                this._someSongs= [];
            }
            this._enableSeek= enableSeek;
            this._enableSpeedTweak= enableSpeedTweak;
            this._doParseUrl = doParseUrl;

            this.initDomElements();
        }

// facade for player functionality so that BasicPlayerControls user does not also need to know the player
        pause() { ScriptNodePlayer.getInstance().pause(); }

        resume() { ScriptNodePlayer.getInstance().resume(); }

        setVolume(value) { ScriptNodePlayer.getInstance().setVolume(value); }

        getSongInfo() { return ScriptNodePlayer.getInstance().getSongInfo(); }

        addSong(filename) {
                    this._someSongs.push(filename);
                }

        seekPos(relPos) {
                    var p= ScriptNodePlayer.getInstance();
                    p.seekPlaybackPosition(Math.round(p.getMaxPlaybackPosition()*relPos));
                }

// some playlist handling
        removeFromPlaylist(songname) {
                    if (this._someSongs[this._current] == songname) {
                        this._someSongs.splice(this._current, 1);
                        if (this._current + 1 == this._someSongs.length) this._current= 0;
                    }
                }

        playNextSong() {
                    var ready= ScriptNodePlayer.getInstance().isReady();
                    if (ready && this._someSongs.length) {
                        this._current= (++this._current >=this._someSongs.length) ? 0 : this._current;
                        var someSong= this._someSongs[this._current];
                        this.playSong(someSong);
                    }
                }

        playPreviousSong() {
                    if (ScriptNodePlayer.getInstance().isReady() && this._someSongs.length) {
                        this._current= (--this._current<0) ? this._current+this._someSongs.length : this._current;
                        var someSong= this._someSongs[this._current];
                        this.playSong(someSong);
                    }
                }

        playSongWithBackand(options, onSuccess) {
                    // backend adapter to be used has been explicitly specified
                    var o= options.backendAdapter;
                    ScriptNodePlayer.createInstance(o.adapter, o.basePath, o.preload, o.enableSpectrum,
                        onSuccess, o.doOnTrackReadyToPlay, o.doOnTrackEnd);
                }

        playSong(someSong) {
                    var audioCtx= ScriptNodePlayer.getInstance().getAudioContext();	// handle Google's bullshit "autoplay policy"
                    if (audioCtx.state == "suspended") {
                        var modal = document.getElementById('autoplayConfirm');
                        modal.style.display = "block";		// force user to click

                        window.globalDeferredPlay = function() {	// setup function to be used "onClick"
                            audioCtx.resume();
                            this._playSong(someSong);
                        }.bind(this);

                    } else {
                        this._playSong(someSong);
                    }
                }

        _playSong(someSong) {
                    var arr= this._doParseUrl(someSong);
                    var options= arr[1];
                    if (typeof options.backendAdapter != 'undefined') {
                        var name= arr[0];
                        var o= options.backendAdapter;
                        this.playSongWithBackand(options, (function(){
                            var p= ScriptNodePlayer.getInstance();

                            p.loadMusicFromURL(name, options,
                                (function(filename){
                                }),
                                (function(){
                                    this.removeFromPlaylist(someSong);	/* no point trying to play this again */ }.bind(this)),
                                (function(total, loaded){}));

                            o.doOnPlayerReady();
                        }.bind(this)));
                    } else {
                        var p= ScriptNodePlayer.getInstance();
                        if (p.isReady()) {
                            p.loadMusicFromURL(arr[0], options,
                                (function(filename){}),
                                (function(){ this.removeFromPlaylist(someSong);	/* no point trying to play this again */ }.bind(this)),
                                (function(total, loaded){}));
                        }
                    }
                }

        animate() {
                    // animate playback position slider
                    var slider = document.getElementById("seekPos");
                    if(slider && !slider.blockUpdates) {
                        var p= ScriptNodePlayer.getInstance();
                        slider.value = Math.round(255*p.getPlaybackPosition()/p.getMaxPlaybackPosition());
                    }
                }

// ---------------------    drag&drop feature -----------------------------------
        dropFile(checkReady, ev, funcName, options, onCompletion) {
                    ev.preventDefault();
                    var data = ev.dataTransfer.getData("Text");
                    var file = ev.dataTransfer.files[0];
                    var p= ScriptNodePlayer.getInstance();

                    if ((!checkReady || ScriptNodePlayer.getInstance().isReady()) && file instanceof File) {
                        if (this._doOnDropFile) {
                            var options= this._doOnDropFile(file.name);	// get suitable backend, etc
                            var o= options.backendAdapter;

                            this.pause();	// don't play while reconfiguring..

                            this.playSongWithBackand(options, (function(){
                                var p= ScriptNodePlayer.getInstance();
                                var f= p.loadMusicFromTmpFile.bind(p);

                                f(file, options,
                                    onCompletion,
                                    (function(){ /* fail */
                                        this.removeFromPlaylist(file.name);	/* no point trying to play this again */
                                    }.bind(this)),
                                    (function(total, loaded){})	/* progress */
                                );

                                o.doOnPlayerReady();
                            }.bind(this)));

                        } else {
                            var p= ScriptNodePlayer.getInstance();
                            var f= p[funcName].bind(p);
                            f(file, options, onCompletion, (function(){console.log("fatal error: tmp file could not be stored");}), (function(total, loaded){}));
                        }
                    }
                }

        drop(ev) {
                    var options= {};
                    this.dropFile(true, ev, 'loadMusicFromTmpFile', options, (function(filename){
                        this.addSong(filename);
                    }).bind(this));
                }

        initExtensions() {}

        allowDrop(ev) {
                    ev.preventDefault();
                    ev.dataTransfer.dropEffect = 'move'; 	// needed for FF
                }

        initUserEngagement() {
                    // handle Goggle's latest "autoplay policy" bullshit (patch the HTML/Script from here within this
                    // lib so that the various existing html files need not be touched)

                    var d = document.createElement("DIV");
                    d.setAttribute("id", "autoplayConfirm");
                    d.setAttribute("class", "modal-autoplay");

                    var dc = document.createElement("DIV");
                    dc.setAttribute("class", "modal-autoplay-content");

                    var p = document.createElement("P");
                    var t = document.createTextNode("You may thank the clueless Google Chrome idiots for this useless add-on dialog - without which their \
                user unfriendly browser will no longer play the music (which is the whole point of this page).\
                Click outside of this box to continue.");
                    p.appendChild(t);

                    dc.appendChild(p);
                    d.appendChild(dc);

                    document.body.insertBefore(d, document.body.firstChild);


                    var s= document.createElement('script');
                    s.text = 'var modal = document.getElementById("autoplayConfirm");\
                    window.onclick = function(event) {\
                        if (event.target == modal) {\
                            modal.style.display = "none";\
                            if (typeof window.globalDeferredPlay !== "undefined") { window.globalDeferredPlay();\
                            delete window.globalDeferredPlay; }\
                        }\
                    }';
                    document.body.appendChild(s);

                }

        initTooltip() {
                    var tooltipDiv= document.getElementById("tooltip");

                    var f = document.createElement("form");
                    f.setAttribute('method',"post");
                    f.setAttribute('action',"https://www.paypal.com/cgi-bin/webscr");
                    f.setAttribute('target',"_blank");

                    var i1 = document.createElement("input");
                    i1.type = "hidden";
                    i1.value = "_s-xclick";
                    i1.name = "cmd";
                    f.appendChild(i1);

                    var i2 = document.createElement("input");
                    i2.type = "hidden";
                    i2.value = "E7ACAHA7W5FYC";
                    i2.name = "hosted_button_id";
                    f.appendChild(i2);

                    // var i3 = document.createElement("input");
                    // i3.type = "image";
                    // i3.src= "stdlib/btn_donate_LG.gif";
                    // i3.border= "0";
                    // i3.name="submit";
                    // i3.alt="PayPal - The safer, easier way to pay online!";
                    // f.appendChild(i3);

                    var i4 = document.createElement("img");
                    i4.alt = "";
                    i4.border = "0";
                    i4.src = "stdlib/pixel.gif";
                    i4.width = "1";
                    i4.height = "1";
                    f.appendChild(i4);

                    // tooltipDiv.appendChild(f);
                }

        initDrop() {
                    // the 'window' level handlers are needed to show a useful mouse cursor in Firefox
                    window.addEventListener("dragover",function(e){
                        e = e || event;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'none';
                    },true);
                    window.addEventListener("drop",function(e){
                        e = e || event;
                        e.preventDefault();
                    },true);

                    var dropDiv= document.getElementById("drop") || document.body;
                    dropDiv.ondrop  = this.drop.bind(this);
                    dropDiv.ondragover  = this.allowDrop.bind(this);
                }

        appendControlElement(elmt) {
                    var controls= document.getElementById("controls") || document.body;
                    controls.appendChild(elmt);
                    controls.appendChild(document.createTextNode(" "));  	// spacer
                }

        initDomElements() {
                    var play = document.createElement("BUTTON");
                    play.id = "play";
                    play.innerHTML= " &gt;";
                    play.onclick = function(e){ this.resume(); }.bind(this);
                    this.appendControlElement(play);

                    var pause = document.createElement("BUTTON");
                    pause.id = "pause";
                    pause.innerHTML= " ||";
                    pause.onclick = function(e){ this.pause(); }.bind(this);
                    this.appendControlElement(pause);

                    var previous = document.createElement("BUTTON");
                    previous.id = "previous";
                    previous.innerHTML= " |&lt;&lt;";
                    previous.onclick = this.playPreviousSong.bind(this);
                    this.appendControlElement(previous);

                    var next = document.createElement("BUTTON");
                    next.id = "next";
                    next.innerHTML= " &gt;&gt;|";
                    next.onclick = this.playNextSong.bind(this);
                    this.appendControlElement(next);

                    var gain = document.createElement("input");
                    gain.id = "gain";
                    gain.name = "gain";
                    gain.type = "range";
                    gain.min = 0;
                    gain.max = 255;
                    gain.value = 255;
                    gain.onchange = function(e){ this.setVolume(gain.value/255); }.bind(this);
                    this.appendControlElement(gain);

                    if (this._enableSeek) {
                        var seek = document.createElement("input");
                        seek.type = "range";
                        seek.min = 0;
                        seek.max = 255;
                        seek.value = 0;
                        seek.id = "seekPos";
                        seek.name = "seekPos";
                        // FF: 'onchange' triggers once the final value is selected;
                        // Chrome: already triggers while dragging; 'oninput' does not exist in IE
                        // but supposedly has the same functionality in Chrome & FF
                        seek.oninput  = function(e){
                            if (window.chrome)
                                seek.blockUpdates= true;
                        };
                        seek.onchange  = function(e){
                            if (!window.chrome)
                                seek.onmouseup(e);
                        };
                        seek.onmouseup = function(e){
                            var p= ScriptNodePlayer.getInstance();
                            this.seekPos(seek.value/255);
                            seek.blockUpdates= false;
                        }.bind(this);
                        this.appendControlElement(seek);
                    }
                    if (this._enableSpeedTweak) {
                        var speed = document.createElement("input");
                        speed.type = "range";
                        speed.min = 0;
                        speed.max = 100;
                        speed.value = 50;
                        speed.id = "speed";
                        speed.name = "speed";
                        speed.onchange  = function(e){
                            if (!window.chrome)
                                speed.onmouseup(e);
                        };

                        speed.onmouseup = function(e){
                            var p= ScriptNodePlayer.getInstance();

                            var tweak= 0.2; 			// allow 20% speed correction
                            var f= (speed.value/50)-1;	// -1..1

                            var s= p.getDefaultSampleRate();
                            s= Math.round(s*(1+(tweak*f)));
                            p.resetSampleRate(s);
                        }.bind(this);
                        this.appendControlElement(speed);
                    }

                    this.initUserEngagement();
                    this.initDrop();
                    this.initTooltip();

                    this.initExtensions();
                }
    }





    /**
     * Simple music visualization for ScriptNodePlayer.
     *
     * <p>Use SongDisplay to render animated frequency spectrum and basic meta info about the current song.
     *
     * <p>This file also handles HTML5 <details> and their simulation in Firefox: set "window.openDetails"
     * (before loading this file) to control if "details" are initially open/closed
     */


    /**
     * Accessor must be subclassed to define attribute access for a specific backend.
     */
    DisplayAccessor = function (doGetSongInfo) {
        this.doGetSongInfo= doGetSongInfo;
    };

    DisplayAccessor.prototype = {
        getDisplayTitle: function() {},
        getDisplaySubtitle: function() {},
        getDisplayLine1: function() {},
        getDisplayLine2: function() {},
        getDisplayLine3: function() {},

        // ---------------- utilities -----------------
        getSongInfo: function() {
            return this.doGetSongInfo();
        },
    };

    /*
    * This render class drives the "requestAnimationFrame" cycle.
    *
    * external dependencies:
    *	 ScriptNodePlayer.getInstance()
    *    document canvas elements: "spectrumCanvas", "logoCanvas",
    *    document div elements: "moz-reflect-spectrum", "moz-reflect-logo"
    *
    * @param displayAccessor subclass of DisplayAccessor
    * @param colors either the URL to an image or an array containing color strings
    * @param barType 0: "growing bars", 1: "jumping bars"
    * @param cpuLimit percentage of CPU that can be used for graphics: 0= 0%, 1=100%.. or anything inbetween
    * @param doAnimate some function that will be added to the built-in rendering
    */
    SongDisplay = function(displayAccessor, colors, barType, cpuLimit, doAnimate) {
        this.displayAccessor= displayAccessor;
        this.hexChars= "0123456789ABCDEF";

        if (typeof colors == 'string' || colors instanceof String) {
            // URL of image to be used
            this.colors;
            this.backgroundImgUrl= colors;
            this.backgroundImg= 0;
        } else if( Object.prototype.toString.call( colors ) === '[object Array]' ) {
            // array containing colors
            this.colors= colors;
        } else {
            console.log("fatal error: invalid 'colors' argument");
        }

        this.doAnimate= doAnimate;
        this.barType= barType;

        this.WIDTH= 800;
        this.HEIGHT= 100;

        this.barWidth = 5;
        this.barHeigth= 30;
        this.barSpacing= 10;
        this.colorOffset=0;

        this.refreshCounter=0;
        this.lastRenderTime=0;
        this.worstRenderTime=0;

        this.timeLimit= 1000/60*cpuLimit;	// renderiung should take no longer than 10% of the available time (e.g. 3-4 millis per frame)

        this.canvasSpectrum = document.getElementById('spectrumCanvas');
        this.ctxSpectrum = this.canvasSpectrum.getContext('2d');
//	this.canvasSpectrum.width = this.WIDTH;

        this.mozReflectSpectrum = document.getElementById('moz-reflect-spectrum');
        this.mozReflectLogo = document.getElementById('moz-reflect-logo');

        this.canvasLegend = document.getElementById('logoCanvas');
        this.ctxLegend = this.canvasLegend.getContext('2d');
    };

    SongDisplay.prototype = {
        reqAnimationFrame: function() {
            window.requestAnimationFrame(this.redraw.bind(this));
        },
        updateImage: function(src) {
            this.backgroundImg= 0;
            var imgObj = new Image();

            imgObj.onload = function () {
                this.backgroundImg= imgObj;
            }.bind(this);
            imgObj.src=src;
        },
        redraw: function() {
            if (!this.colors && !this.backgroundImg) this.updateImage(this.backgroundImgUrl);

            if(this.doAnimate) this.doAnimate();
            this.redrawSpectrum();

            this.reqAnimationFrame();
        },
        setBarDimensions: function(w, h, s) {
            this.barWidth = w;
            this.barHeigth= h;
            this.barSpacing= s;
        },
        redrawSpectrum: function() {
            // with low enough load the browser should be able to render 60fps: the load from the music generation
            // cannot be changed but the load from the rendering can..
            this.worstRenderTime= Math.max(this.worstRenderTime, this.lastRenderTime);

            this.lastRenderTime= new Date().getTime();	// start new measurement

            var slowdownFactor= this.timeLimit?Math.max(1, this.worstRenderTime/this.timeLimit):1;
            this.refreshCounter++;

            if (this.refreshCounter >= slowdownFactor) {
                this.refreshCounter= 0;

                var freqByteData= ScriptNodePlayer.getInstance().getFreqByteData();

                var OFFSET = 100;

                var numBars = Math.round(this.WIDTH / this.barSpacing);

                if(typeof this.caps === 'undefined') {
                    this.caps= new Array(numBars);
                    this.decayRate= 0.99;
                    for (var i= 0; i<numBars; i++) this.caps[i]= 0;
                }

                try {
                    // seems that dumbshit Safari (11.0.1 OS X) uses the fillStyle for "clearRect"!
                    this.ctxSpectrum.fillStyle = "rgba(0, 0, 0, 0.0)";
                } catch (err) {}

                this.ctxSpectrum.clearRect(0, 0, this.WIDTH, this.HEIGHT);

                this.ctxSpectrum.lineCap = 'round';

                if (this.colors) {
                    if (this.barType & 0x2) {
                        this.colorOffset-= 2;	// cycle colors
                        /*
                        if (window.chrome) {		// FF "blur" is too slow for this
                            this.ctxSpectrum.shadowBlur = 20;
                            this.ctxSpectrum.shadowColor = "black";
                        }
                        */
                    }
                    // colors based effects
                    if ((this.barType & 0x1) == 1) {
                        // "jumping" bars

                        for (var i = 0; i < numBars; ++i) {
                            var scale= freqByteData[i + OFFSET]/0xff;
                            var magnitude = scale*this.HEIGHT;

                            var p= Math.abs((i+this.colorOffset)%numBars);

                            this.ctxSpectrum.fillStyle = this.colorGradient(this.colors,p/numBars);	// computationally much less expensive than previous impl with use of a scaled image
                            this.ctxSpectrum.fillRect(i * this.barSpacing, this.HEIGHT- magnitude, this.barWidth, this.barHeigth*(scale*1.4));
                        }
                    } else {
                        // "growing" bars
                        for (var i = 0; i < numBars; ++i) {
                            this.ctxSpectrum.fillStyle = this.colorGradient(this.colors,i/numBars);
                            var magnitude = freqByteData[i + OFFSET]*this.HEIGHT/255;
                            this.ctxSpectrum.fillRect(i * this.barSpacing, this.HEIGHT, this.barWidth, -magnitude);

                            this.ctxSpectrum.fillStyle= "#b75b4e";
                            var d= this.caps[i]*this.decayRate;
                            this.caps[i]= Math.max(d, magnitude);

                            this.ctxSpectrum.fillRect(i * this.barSpacing, this.HEIGHT-this.caps[i], this.barWidth, 3);
                        }
                    }
                } else {
                    // background image based effects
                    if (this.backgroundImg) {
                        if (this.barType == 1) {
                            var o;
                            for (var i = 0; i < numBars; ++i) {
                                var scale= freqByteData[i + OFFSET]/0xff;
                                var magnitude = scale*this.HEIGHT;
                                o= Math.round(this.HEIGHT - magnitude);
                                this.ctxSpectrum.drawImage(this.backgroundImg, 0,0, this.barWidth, 255,
                                    i * this.barSpacing, o, this.barWidth, 30*(scale*1.4));
                            }
                        } else {
                            var imgW= this.backgroundImg.naturalWidth;
                            var imgH= this.backgroundImg.naturalHeight;

                            var sliceW= imgW/numBars;
                            var o;
                            for (var i = 0; i < numBars; ++i) {
                                var magnitude = freqByteData[i + OFFSET]*this.HEIGHT/255;
                                o= Math.round(this.HEIGHT - magnitude);
                                this.ctxSpectrum.drawImage(this.backgroundImg, i*sliceW, 0, sliceW, imgH,
                                    i * this.barSpacing, o, this.barWidth, Math.round(magnitude));
                            }
                        }
                    }

                }
                // hack: make sure dumb Firefox knows that redraw is needed..
                this.mozReflectSpectrum.style.visibility = "hidden";
                this.mozReflectSpectrum.style.visibility = "visible";
            }
            this.lastRenderTime= new Date().getTime()-this.lastRenderTime;
        },
        text: function(ctx, t, x, y) {
            if(typeof t === 'undefined')
                return;

            t = t.replace(/&#.*?;/g, function (needle) {	// replace html chars "&#111;"
                return String.fromCharCode( parseInt(needle.substring(2, needle.length-1)));
            }.bind(this));


            ctx.strokeText(t, x, y);
            ctx.fillText(t, x, y);
        },
        redrawSongInfo: function() {
            this.reqAnimationFrame();	// start the animation going

            try {
                // seems that the Safari (11.0.1 OS X) idiots use the fillStyle for
                // "clearRect", i.e. it is impossible to properly make this canvas
                // completely transparent
                this.ctxLegend.fillStyle = "rgba(0, 0, 0, 0.0)";
            } catch (err) {}

            this.ctxLegend.clearRect(0, 0, 800, 300);
            //this.canvasLegend.width  += 0;

            this.ctxLegend.textBaseline = "middle";
            this.ctxLegend.fillStyle = '#000';
            this.ctxLegend.strokeStyle = "#FFFFFF";

            this.ctxLegend.font = '30px  arial, sans-serif';	// FUCKING CHROME SHIT NO LONGER UNDERSTANDS: '90px serif bold'

            this.text(this.ctxLegend, this.displayAccessor.getDisplayTitle(), 20, 15);

            this.ctxLegend.font = '15px sans-serif';
            this.text(this.ctxLegend, this.displayAccessor.getDisplaySubtitle(), 20, 35);

            this.ctxLegend.fillStyle = '#888';
            this.ctxLegend.font = '15px sans-serif';

            this.ctxLegend.textBaseline = 'bottom';

            this.text(this.ctxLegend, this.displayAccessor.getDisplayLine1(), 20, 65);
            this.text(this.ctxLegend, this.displayAccessor.getDisplayLine2(), 20, 80);
            this.text(this.ctxLegend, this.displayAccessor.getDisplayLine3(), 20, 95);

            // hack: make sure dumb Firefox knows that redraw is needed..
            this.mozReflectLogo.style.visibility = "hidden";
            this.mozReflectLogo.style.visibility = "visible";
        },
        colorGradient: function(cols, s) {
            var p= (cols.length-1)*s;
            var i= Math.floor(p);

            return this.fadeColor(cols[i], cols[i+1], p-i);
        },
        fadeColor: function(from, to, s) {
            var r1= (from >>16) & 0xff;
            var g1= (from >>8) & 0xff;
            var b1= from & 0xff;

            var r= Math.round(r1+(((to >>16) & 0xff)-r1)*s);
            var g= Math.round(g1+(((to >>8) & 0xff)-g1)*s);
            var b= Math.round(b1+((to & 0xff)-b1)*s);

            return "#" +this.hex(r>>4) +this.hex(r) +this.hex(g>>4) +this.hex(g) +this.hex(b>>4) +this.hex(b);
        },
        hex: function(n) {
            return this.hexChars.charAt(n & 0xf);
        }
    };


    window.console || (window.console = { 'log': alert });
    (function() {
        // document.body.addClass($.fn.details.support ? 'details' : 'no-details');
        // $('details').details();

        // initially expand details
        if (!(window.openDetails === 'undefined') && window.openDetails) {
            if ($.fn.details.support) {
                $('details').attr('open', '');	// Chrome
            } else {
                var $details= $('details');
                var $detailsSummary = $('summary', $details).first();
                var $detailsNotSummary = $details.children(':not(summary)');

                $details.addClass('open').prop('open', true).triggerHandler('open.details');
                $detailsNotSummary.show();
            }
        }
        if (!window.chrome) {
            // hack to get rid of Firefox specific pseudo elements used to sim webkit-box-reflect
            var e = document.getElementById("moz-reflect-logo");
            e.className += " enableMozReflection";
            var e2 = document.getElementById("moz-reflect-spectrum");
            e2.className += " enableMozReflection";
        }
    })();


    /** Init script **/

    var playerControls;
    // var	songDisplay;

// configure what music infos to display in SongDisplay
    SNESDisplayAccessor = (function(){ var $this = function (doGetSongInfo) {
        $this.base.call(this, doGetSongInfo);
    };
        extend(DisplayAccessor, $this, {
            getDisplayTitle: function() 	{ return "webSNES";},
            getDisplaySubtitle: function() 	{ return "Super Nintendo music";},
            getDisplayLine1: function() { return this.getSongInfo().title; },
            getDisplayLine2: function() { return this.getSongInfo().artist+ (this.getSongInfo().artist.length?" ":"") + this.getSongInfo().game; },
            getDisplayLine3: function() { return this.getSongInfo().copyright+ (this.getSongInfo().copyright.length?" ":"") +this.getSongInfo().year; }
        });	return $this; })();

// link player events to "controls" and "display"
    function doOnTrackEnd(){
        if (playerControls) playerControls.playNextSong();
    }
    function doOnTrackReadyToPlay(){
        ScriptNodePlayer.getInstance().play();
        // songDisplay.redrawSongInfo();
    }
// depending on the browser/timing the player may be ready before or after (see WASM) init(), i.e.
// the startup sequence must handle both cases (music can only be started when
// both the player is ready and init() has been completed..)
    var playerReady= false;
    function doOnPlayerReady() {
        playerReady= true;
        if (playerControls) playerControls.playNextSong(); // playerControls are used to check for init()
    }

    function init() {
        // --------------------------- music player -----------------------
        var basePath= '';		// not needed here
        ScriptNodePlayer.createInstance(new SNESBackendAdapter(), basePath, [], true, doOnPlayerReady,
            doOnTrackReadyToPlay, doOnTrackEnd);

        // --------------------------- UI - basic player controls --------------
        var songs = [
            "/audio-source/assets/files/kefka.spc",
            // "/modland/proxy.php?mirror=1&mod=Nintendo SPC/Richard Joseph/Super James Pond/super james pond - codename robocod.spc",
            // "/modland/proxy.php?mirror=1&mod=Nintendo SPC/David Whittaker/Batman - Revenge of the Joker/brj-01.spc",
            // "/modland/proxy.php?mirror=1&mod=Nintendo SPC/Allister Brimble/Street Racer/srace-01.spc",
            // "/modland/proxy.php?mirror=1&mod=Nintendo SPC/Barry Leitch/Lethal Weapon/lethal weapon - ending.spc",
        ];
        playerControls= new BasicPlayerControls(songs, true, false,
            (function(someSong) {
                var arr= someSong.split(";");
                var track= arr.length>1?parseInt(arr[1]):-1;
                var timeout= arr.length>2?parseInt(arr[2]):-1;

                var options= {};
                options.track= isNaN(track) ? -1 : track;
                options.timeout= isNaN(timeout) ? -1 : timeout;
                return [arr[0], options];
            })
        );

        // songDisplay= new SongDisplay(new SNESDisplayAccessor((function(){return playerControls.getSongInfo();})),
        //     [0x505050,0xffffff,0x404040,0xffffff], 1, 1, (function(){playerControls.animate()}));

        if (playerReady) playerControls.playNextSong();	// player was ready before it could trigger the playback
    }
    // init();
    document.body.addEventListener('click', init);
    document.addEventListener('DOMContentLoaded', init);
}
