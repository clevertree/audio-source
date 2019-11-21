{


    class AudioSourceUtilities {
        constructor() {
        }
        /** Javascript Libraries **/

        get sources() {
            return {
                'MidiParser': [
                    this.getScriptDirectory('assets/3rdparty/MidiParser/main.js'),
                    'https://cdn.jsdelivr.net/gh/colxi/midi-parser-js/src/main.js'
                ],
                'MIDIFile': [
                    this.getScriptDirectory('assets/3rdparty/MIDIFile/MIDIFile.min.js')
                ],
                'LZString': [
                    this.getScriptDirectory('assets/3rdparty/LZString/lz-string.min.js'),
                    'https://cdn.jsdelivr.net/gh/pieroxy/lz-string/libs/lz-string.min.js'
                ]
            }
        }


        async loadJSLibrary(libraryName, test=null) {
            if(!test)
                test = () => typeof window[libraryName] !== 'undefined';
            if(test())
                return true;
            const sources = this.sources[libraryName];
            for(let i=0; i<sources.length; i++) {
                await this.loadScript(sources[i]);
                if(test())
                    return true;
            }
            throw new Error(`Failed to load ${libraryName} Library`);

        }

        async getMidiParser() {
            if(typeof window.MidiParser === 'undefined')
                await this.loadJSLibrary('MidiParser');
            return window.MidiParser;
        }

        async getMIDIFile() {
            if(typeof window.MIDIFile === 'undefined')
                await this.loadJSLibrary('MIDIFile');
            return window.MIDIFile;
        }

        async getLZString() {
            if(typeof window.LZString === 'undefined')
                await this.loadJSLibrary('LZString');
            return window.LZString;
        }




        /** Package Info **/

        async loadPackageInfo(force=false) {
            const url = this.getScriptDirectory('package.json');

            let packageInfo = AudioSourceUtilities.packageInfo;
            if (!force && packageInfo)
                return packageInfo;

            packageInfo = await this.loadJSONFromURL(url);
            if(!packageInfo.version)
                throw new Error("Invalid package version: " + url);

            console.log("Package Version: ", packageInfo.version, packageInfo);
            AudioSourceUtilities.packageInfo = packageInfo;
            return packageInfo;
        }




        /** Utilities **/


        getScriptDirectory(appendPath='', selector=null) {
            const scriptElm = findThisScript();
            // const basePath = scriptElm.src.split('/').slice(0, -2).join('/') + '/';
    //         console.log("Base Path: ", basePath);
            return scriptElm.basePath + appendPath;
        }

        async loadScript(src) {
            await new Promise((resolve, reject) => {
                const newScriptElm = document.createElement('script');
                newScriptElm.src = src;
                newScriptElm.onload = e => resolve();
                document.head.appendChild(newScriptElm);
            });
        }

        async loadSongFromURL(url) {
            const urlString = url.toString().toLowerCase();
            if(urlString.endsWith('.json'))
                return this.loadJSONFromURL(url);
            throw new Error("Unrecognized file type: " + url);
        }

        async loadJSONFromURL(url) {
            url = new URL(url, document.location) + '';
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.responseType = 'json';
                xhr.onload = () => {
                    if (xhr.status !== 200)
                        return reject("JSON file not found: " + url);

                    resolve(xhr.response);
                };
                xhr.send();
            });
        }


        async loadJSONFile (file) {
            const fileResult = await new Promise((resolve, reject) => {
                let reader = new FileReader();                                      // prepare the file Reader
                reader.readAsText(file);                 // read the binary data
                reader.onload =  (e) => {
                    resolve(e.target.result);
                };
            });

            const json = JSON.parse(fileResult);
            return json;
        }

        /** Midi Support **/


        loadMIDIInterface(callback) {
            // TODO: wait for user input
            if (navigator.requestMIDIAccess) {
                navigator.requestMIDIAccess().then(
                    (MIDI) => {
                        console.info("MIDI initialized", MIDI);
                        const inputDevices = [];
                        MIDI.inputs.forEach(
                            (inputDevice) => {
                                inputDevices.push(inputDevice);
                                inputDevice.addEventListener('midimessage', callback);
                            }
                        );
                        console.log("MIDI input devices detected: " + inputDevices.map(d => d.name).join(', '));
                    },
                    (err) => {
                        throw new Error("error initializing MIDI: " + err);
                    }
                );
            }
        }

        async requireAsync(relativeScriptPath) {
            return await requireAsync(relativeScriptPath);
        }

    }
    AudioSourceUtilities.instrumentLibrary = null;
    AudioSourceUtilities.packageInfo = null;



    /** Register This Module **/
    const _module = typeof module !== "undefined" ? module : findThisScript();
    _module.exports = {AudioSourceUtilities};


    /** Module Loader Methods **/
    function findThisScript() {
        const SCRIPT_PATH = 'common/audio-source-utilities.js';
        const thisScript = document.head.querySelector(`script[src$="${SCRIPT_PATH}"]`);
        if (!thisScript)
            throw new Error("Base script not found: " + SCRIPT_PATH);
        thisScript.relativePath = SCRIPT_PATH;
        thisScript.basePath = thisScript.src.replace(document.location.origin, '').replace(SCRIPT_PATH, '');
        return thisScript;
    }


    async function requireAsync(relativeScriptPath) {
        if(typeof require === "undefined") {
            let scriptElm = document.head.querySelector(`script[src$="${relativeScriptPath}"]`);
            if(!scriptElm) {
                const scriptURL = findThisScript().basePath + relativeScriptPath;
                await new Promise(async (resolve, reject) => {
                    scriptElm = document.createElement('script');
                    scriptElm.src = scriptURL;
                    scriptElm.onload = e => resolve();
                    document.head.appendChild(scriptElm);
                });
                if(scriptElm.promise instanceof Promise)
                    await scriptElm.promise;
            }
            return scriptElm.exports;
        } else {
            return require('../' + relativeScriptPath);
        }
    }
}

