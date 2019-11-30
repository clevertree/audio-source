{

    /** Register Script Exports **/
    function getThisScriptPath() { return 'common/audio-source-library.js'; }
    function exportThisScript(module) {
        module.exports = {AudioSourceLibrary};
    }


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

        eachLibrary(callback) {
            this.processItemList(this.libraries, (libraryConfig) => {
                libraryConfig.url = new URL(this.urlPrefix + (libraryConfig.url || libraryConfig.name), this.url) + '';
                callback(libraryConfig);
            });
        }

        eachSample(callback) {
            this.processItemList(this.samples, (sampleConfig) => {
                sampleConfig.url = new URL(this.urlPrefix + (sampleConfig.url || sampleConfig.name), this.url) + '';
                callback(sampleConfig);
            });
        }

        eachPreset(callback) {
            this.processItemList(this.presets, (presetConfig) => {
                presetConfig.url = this.url + '#' + presetConfig.name;
                return callback(presetConfig);
            });
        }

        eachInstrument(callback) {
            this.processItemList(this.instruments, (instrumentConfig) => {
                instrumentConfig.url = new URL(this.urlPrefix + (instrumentConfig.url || instrumentConfig.name), this.url) + '';
                callback(instrumentConfig);
            });
        }

        getPresetConfig(presetName) {

            let presetConfig = null;
            this.processItemList(this.presets, (presetConfigItem) => {
                if(presetConfigItem.name === presetName)  {
                    presetConfig = presetConfigItem;
                    return false;
                }
            });
            if(!presetConfig)
                throw new Error("Preset not found: " + presetName);

            if (!presetConfig.samples)
                presetConfig.samples = {};
            if (Object.keys(presetConfig.samples).length === 0)
                presetConfig.samples[presetName] = {};

            const newConfig = {};
            newConfig.preset = presetName;
            newConfig.samples = [];

            this.processItemList(presetConfig.samples, (sampleConfig) => {
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
            newConfig.libraryURL = this.url;
            newConfig.preset = presetName;
            return newConfig;
        }

        // getPresetConfig2(presetName) {
        //     const newConfig = {};
        //     newConfig.preset = presetName;
        //     newConfig.samples = [];
        //     if (!this.presets[presetName])
        //         throw new Error("Invalid Instrument Preset: " + presetName);
        //     const presetConfig = this.presets[presetName];
        //     if (!presetConfig.samples)
        //         presetConfig.samples = {};
        //     if (Object.keys(presetConfig.samples).length === 0)
        //         presetConfig.samples[presetName] = {};
        //     // Object.assign(newConfig, presetConfig);
        //     Object.keys(presetConfig.samples).forEach((sampleName) => {
        //         const sampleConfig =
        //             Object.assign({
        //                     url: sampleName
        //                 },
        //                 presetConfig.samples[sampleName],
        //                 this.samples[sampleName]);
        //         sampleConfig.url = new URL(this.urlPrefix + sampleConfig.url, this.url) + '';
        //
        //         if (typeof sampleConfig.keyRange !== "undefined") {
        //             let pair = sampleConfig.keyRange;
        //             if (typeof pair === 'string')
        //                 pair = pair.split(':');
        //             sampleConfig.keyLow = pair[0];
        //             sampleConfig.keyHigh = pair[1] || pair[0];
        //             delete sampleConfig.keyRange;
        //         }
        //         sampleConfig.name = sampleName;
        //         newConfig.samples.push(sampleConfig);
        //     });
        //     newConfig.libraryURL = this.url;
        //     return newConfig;
        // }

        processItemList(arrayOrObject, eachCallback, defaultParam='url') {
            const eachItem = (itemConfig, itemName=null) => {
                if(typeof itemConfig === "string") {
                    const newItem = {};
                    newItem[defaultParam] = itemConfig;
                    itemConfig = newItem;
                }
                itemConfig = Object.assign({}, itemConfig);
                if(typeof itemConfig.name === "undefined" && itemName)
                    itemConfig.name = itemName;
                eachCallback(itemConfig);
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
        }


    }


    AudioSourceLibrary.eachHistoricLibrary = async (callback) => {
        for (let cacheURL in AudioSourceLibrary.cache) {
            if (AudioSourceLibrary.cache.hasOwnProperty(cacheURL)) {
                let libraryConfig = AudioSourceLibrary.cache[cacheURL];
                if(libraryConfig instanceof Promise)
                    libraryConfig = await libraryConfig;
                let libraryName = libraryConfig.name || libraryConfig.url.split('/').pop();
                const result = callback(libraryConfig.url, libraryName);
                if (result === false)
                    return;
            }
        }
    };

    AudioSourceLibrary.loadURL = async function(url) {
        if (!url)
            throw new Error("Invalid url");
        url = new URL((url + '').split('#')[0], document.location) + '';

        let libraryData;
        if (AudioSourceLibrary.cache[url]) {
            libraryData = AudioSourceLibrary.cache[url];
            if(libraryData instanceof Promise)
                libraryData = await libraryData;

        } else {
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
            libraryData = await AudioSourceLibrary.cache[url];
        }
        return new AudioSourceLibrary(libraryData);
    };

    AudioSourceLibrary.cache = {};


    /** Export this script **/
    registerModule(exportThisScript);

    /** Module Loader Methods **/
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


}
