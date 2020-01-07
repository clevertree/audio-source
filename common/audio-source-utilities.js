{
    const thisScriptPath = 'common/audio-source-utilities.js';
    const isRN = typeof document === 'undefined';
    const thisModule = isRN ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    // const require =  isRN ? window.require : customElements.get('audio-source-loader').getRequire(thisModule);

    /** Required Modules **/



    class AudioSourceUtilitiesBase {
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



        /** Midi Support **/


    }
    AudioSourceUtilitiesBase.instrumentLibrary = null;
    AudioSourceUtilitiesBase.packageInfo = null;

    let AudioSourceUtilities;
    if(isRN) {
        class AudioSourceUtilitiesReactNative extends AudioSourceUtilitiesBase {

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

        }
        AudioSourceUtilities = AudioSourceUtilitiesReactNative;
    } else {
        class AudioSourceUtilitiesBrowser extends AudioSourceUtilitiesBase {

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

        }
        AudioSourceUtilities = AudioSourceUtilitiesBrowser;
    }


        /** Export this script **/
    thisModule.exports = {
        AudioSourceUtilities,
    };

}

