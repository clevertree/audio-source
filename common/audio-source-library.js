(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    // if(isBrowser) // Hack for browsers
    //     window.require = thisRequire;


    class AudioSourceLibrary {
        constructor(data) {
            this.url = null;
            this.urlPrefix = '';
            this.name = "Loading...";
            this.samples = {};
            this.libraries = {};
            this.presets = {};
            this.instruments = {};
            Object.assign(this, data);
        }

        // load(data) {
        //     Object.assign(this, data);
        // }

        get libraryCount() { return Object.values(this.libraries).length; }
        eachLibrary(callback) {
            return this.processItemList(this.libraries, (libraryConfig) => {
                libraryConfig.url = new URL(this.urlPrefix + (libraryConfig.url || libraryConfig.name), this.url) + '';
                if(!libraryConfig.name) libraryConfig.name = libraryConfig.url.split('/').pop();
                return callback(libraryConfig);
            });
        }

        get sampleCount() { return Object.values(this.libraries).length; }
        eachSample(callback) {
            return this.processItemList(this.samples, (sampleConfig) => {
                sampleConfig.url = new URL(this.urlPrefix + (sampleConfig.url || sampleConfig.name), this.url) + '';
                if(!sampleConfig.name) sampleConfig.name = sampleConfig.url.split('/').pop();
                return callback(sampleConfig);
            });
        }

        get presetCount() { return Object.values(this.libraries).length; }
        eachPreset(callback) {
            return this.processItemList(this.presets, (presetConfig) => {
                if(!presetConfig.url)
                    presetConfig.url = this.url + '#' + presetConfig.name;
                return callback(presetConfig);
            });
        }

        get instrumentCount() { return Object.values(this.libraries).length; }
        eachInstrument(callback) {
            return this.processItemList(this.instruments, (instrumentConfig) => {
                instrumentConfig.url = new URL(this.urlPrefix + (instrumentConfig.url || instrumentConfig.name), this.url) + '';
                if(!instrumentConfig.name) instrumentConfig.name = instrumentConfig.url.split('/').pop();
                return callback(instrumentConfig);
            });
        }
        findInstrument(callback) {
            let foundItem;
            const result = this.eachInstrument((config) => {
                if(foundItem || (foundItem = callback(config)))
                    return false;
            })
            return foundItem;
        }

        getPresetConfig(presetName) {

            let presetData = null;
            this.eachPreset((presetConfigItem) => {
                if(presetConfigItem.name === presetName)  {
                    presetData = presetConfigItem;
                    return false;
                }
            });
            if(!presetData)
                throw new Error("Preset not found: " + presetName);

            if (!presetData.samples)
                presetData.samples = {};
            if (Object.keys(presetData.samples).length === 0)
                presetData.samples[presetName] = {};

            const newConfig = {
                presetURL: presetData.url
            };
            // newConfig.presetURL = this.url + '#' + presetName;
            newConfig.samples = [];

            this.processItemList(presetData.samples, (sampleConfig) => {
                if(typeof this.samples[sampleConfig.name] !== "undefined")
                    Object.assign(sampleConfig, this.samples[sampleConfig.name]);
                sampleConfig.url = new URL(this.urlPrefix + (sampleConfig.url || sampleConfig.name), this.url) + '';
                newConfig.samples.push(sampleConfig);
                // if (typeof sampleConfig.keyRange !== "undefined") {
                //     let pair = sampleConfig.keyRange;
                //     if (typeof pair === 'string')
                //         pair = pair.split(':');
                //     sampleConfig.keyLow = pair[0];
                //     sampleConfig.keyHigh = pair[1] || pair[0];
                //     delete sampleConfig.keyRange;
                // }
            });
            // newConfig.libraryURL = this.url;
            // newConfig.preset = presetName;
            return newConfig;
        }

        processItemList(arrayOrObject, eachCallback, defaultParam='url') {
            const results = [];
            const eachItem = (itemConfig, itemName=null) => {
                if(typeof itemConfig === "string") {
                    const newItem = {};
                    newItem[defaultParam] = itemConfig;
                    itemConfig = newItem;
                }
                itemConfig = Object.assign({}, itemConfig);
                if(typeof itemConfig.name === "undefined" && itemName)
                    itemConfig.name = itemName;
                const result = eachCallback(itemConfig);
                if(result !== null && result !== false)
                    results.push(result);
                return result;
            };

            if(Array.isArray(arrayOrObject)) {
                for(let i=0; i<arrayOrObject.length; i++) {
                    if(eachItem(arrayOrObject[i]) === false)
                        break;
                }
            } else if(typeof arrayOrObject === "object") {
                for(let itemName in arrayOrObject) {
                    if(arrayOrObject.hasOwnProperty(itemName)) {
                        if(eachItem(arrayOrObject[itemName], itemName) === false)
                            break;
                    }
                }
            } else {
                throw new Error('Unknown array or object');
            }
            return results;
        }


    }


    AudioSourceLibrary.historicLibraryCount = function() { return Object.values(AudioSourceLibrary.cache).length; }
    AudioSourceLibrary.eachHistoricLibrary = (callback) => {
        const results = [];
        for (let cacheURL in AudioSourceLibrary.cache) {
            if (AudioSourceLibrary.cache.hasOwnProperty(cacheURL)) {
                let libraryConfig = AudioSourceLibrary.cache[cacheURL];
                if(libraryConfig instanceof Promise)
                    continue;
                    // libraryConfig = await libraryConfig;
                libraryConfig.name = libraryConfig.name || libraryConfig.url.split('/').pop();
                const result = callback(libraryConfig);
                if (result === false)
                    break;
                if(result !== null)
                    results.push(result);
            }
        }
        return results;
    };

    /**
     * @param url
     * @returns {Promise<AudioSourceLibrary>}
     */
    AudioSourceLibrary.loadFromURL = async function(url) {
        if (!url)
            throw new Error("Invalid url");
        url = new URL((url + '').split('#')[0], document.location) + '';

        let libraryData;
        if (!AudioSourceLibrary.cache[url]) {
            AudioSourceLibrary.cache[url] = new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url + '', true);
                xhr.responseType = 'json';
                xhr.onload = () => {
                    if (xhr.status !== 200)
                        return reject("Sample library not found: " + url);

                    const libraryData = xhr.response;
                    libraryData.url = url + '';

                    Object.keys(AudioSourceLibrary.cache).forEach(cacheURL => {
                        if (Object.values(AudioSourceLibrary.cache) > 5)
                            delete AudioSourceLibrary.cache[cacheURL];
                    });
                    AudioSourceLibrary.cache[url] = libraryData;

                    console.info("Sample Library Loaded: ", url, AudioSourceLibrary.cache);
                    resolve(libraryData);
                };
                xhr.send();
            });
        }
        libraryData = AudioSourceLibrary.cache[url];
        if(libraryData instanceof Promise)
            libraryData = await libraryData;
        return new AudioSourceLibrary(libraryData);
    };
    /** @returns {Promise<AudioSourceLibrary>} */
    AudioSourceLibrary.loadDefaultLibrary = async function() {
        return await AudioSourceLibrary.loadFromURL(AudioSourceLibrary.defaultLibraryURL);
    };
    AudioSourceLibrary.cache = {};
    AudioSourceLibrary.defaultLibraryURL = customElements.get('audio-source-loader').resolveURL('../default.library.json');




    /** Export this script **/
    thisModule.exports = {
        AudioSourceLibrary,
    };




}).apply(null, (function() {
    const thisScriptPath = 'common/audio-source-library.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [thisRequire, thisModule, thisScriptPath, isBrowser]
})());