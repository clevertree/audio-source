{
    /** Required Modules **/
    if(typeof window !== "undefined")
        window.require = customElements.get('audio-source-loader').require;


    class AudioSourceUtilities {
        constructor() {
        }
        /** Javascript Libraries **/

        get sources() {
            return {
                'MidiParser': [
                    this.getScriptDirectory('../assets/3rdparty/MidiParser/main.js'),
                    'https://cdn.jsdelivr.net/gh/colxi/midi-parser-js/src/main.js'
                ],
                'MIDIFile': [
                    this.getScriptDirectory('../assets/3rdparty/MIDIFile/MIDIFile.min.js')
                ],
                'LZString': [
                    this.getScriptDirectory('../assets/3rdparty/LZString/lz-string.min.js'),
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
            const AudioSourceLoader = customElements.get('audio-source-loader')
            const url = AudioSourceLoader.resolveURL('../package.json');

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
            const AudioSourceLoader = customElements.get('audio-source-loader');
            return AudioSourceLoader.resolveURL(appendPath);
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
            return require(relativeScriptPath);
        }

    }
    AudioSourceUtilities.instrumentLibrary = null;
    AudioSourceUtilities.packageInfo = null;




    /** Export this script **/
    const thisScriptPath = 'common/audio-source-utilities.js';
    let thisModule = typeof document !== 'undefined' ? customElements.get('audio-source-loader').findScript(thisScriptPath) : module;
    thisModule.exports = {
        AudioSourceUtilities,
    };

}

