
class Library {
    constructor(data) {
        this.url = null;
        this.urlPrefix = '';
        this.name = "Loading...";
        this.libraries = [];
        this.instruments = {};
        this.presets = [];
        this.samples = [];
        Object.assign(this, data);
    }

    // load(data) {
    //     Object.assign(this, data);
    // }



    get libraryCount() { return Object.values(this.libraries).length; }
    eachLibrary(callback) {
        const results = [];
        const libraries = this.libraries || [];
        for(let i=0; i<libraries.length; i++) {
            const libraryConfig = libraries[i];
            libraryConfig.url = new URL(this.urlPrefix + (libraryConfig.url || libraryConfig.name), this.url) + '';
            if(!libraryConfig.name) libraryConfig.name = libraryConfig.url.split('/').pop();
            const result = callback(libraryConfig);
            if(result !== null) results.push(result);
            if(result === false) break;
        }
        return results;
    }

    get sampleCount() { return Object.values(this.samples).length; }
    eachSample(callback) {
        const results = [];
        const samples = this.samples || [];
        for(let i=0; i<samples.length; i++) {
            const sampleConfig = samples[i];
            sampleConfig.url = new URL(this.urlPrefix + (sampleConfig.url || sampleConfig.name), this.url) + '';
            if(!sampleConfig.name) sampleConfig.name = sampleConfig.url.split('/').pop();
            const result = callback(sampleConfig);
            if(result !== null) results.push(result);
            if(result === false) break;
        }
        return results;
    }

    get presetCount() { return Object.values(this.presets).length; }
    eachPreset(callback) {
        const results = [];
        const presets = this.presets || [];
        for(let i=0; i<presets.length; i++) {
            const presetConfig = presets[i];
            if(!presetConfig.url)
                presetConfig.url = this.url + '#' + presetConfig.name;
            const result = callback(presetConfig);
            if(result !== null) results.push(result);
            if(result === false) break;
        }
        return results;
    }

    get instrumentCount() { return Object.values(this.instruments).length; }
    eachInstrument(callback) {
        const results = [];
        const instruments = this.instruments || [];
        for(let i=0; i<instruments.length; i++) {
            const instrumentConfig = instruments[i];
            instrumentConfig.url = new URL(this.urlPrefix + (instrumentConfig.url || instrumentConfig.name), this.url) + '';
            if(!instrumentConfig.name) instrumentConfig.name = instrumentConfig.url.split('/').pop();
            const result = callback(instrumentConfig);
            if(result !== null) results.push(result);
            if(result === false) break;
        }
        return results;
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
        throw new Error("TODO: Implement");

        // this.processItemList(presetData.samples, (sampleConfig) => {
        //     if(typeof this.samples[sampleConfig.name] !== "undefined")
        //         Object.assign(sampleConfig, this.samples[sampleConfig.name]);
        //     sampleConfig.url = new URL(this.urlPrefix + (sampleConfig.url || sampleConfig.name), this.url) + '';
        //     newConfig.samples.push(sampleConfig);
        //     // if (typeof sampleConfig.keyRange !== "undefined") {
        //     //     let pair = sampleConfig.keyRange;
        //     //     if (typeof pair === 'string')
        //     //         pair = pair.split(':');
        //     //     sampleConfig.keyLow = pair[0];
        //     //     sampleConfig.keyHigh = pair[1] || pair[0];
        //     //     delete sampleConfig.keyRange;
        //     // }
        // });
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


Library.historicLibraryCount = function() { return Object.values(Library.cache).length; }
Library.eachHistoricLibrary = (callback) => {
    const results = [];
    for (let cacheURL in Library.cache) {
        if (Library.cache.hasOwnProperty(cacheURL)) {
            let libraryConfig = Library.cache[cacheURL];
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
 * @returns {Promise<Library>}
 */
Library.loadFromURL = async function(url) {
    if (!url)
        throw new Error("Invalid url");
    url = new URL((url + '').split('#')[0], document.location) + '';

    let libraryData;
    if (!Library.cache[url]) {
        Library.cache[url] = new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url + '', true);
            xhr.responseType = 'json';
            xhr.onload = () => {
                if (xhr.status !== 200)
                    return reject("Sample library not found: " + url);

                const libraryData = xhr.response;
                libraryData.url = url + '';

                Object.keys(Library.cache).forEach(cacheURL => {
                    if (Object.values(Library.cache) > 5)
                        delete Library.cache[cacheURL];
                });
                Library.cache[url] = libraryData;

                console.info("Sample Library Loaded: ", url, Library.cache);
                resolve(libraryData);
            };
            xhr.send();
        });
    }
    libraryData = Library.cache[url];
    if(libraryData instanceof Promise)
        libraryData = await libraryData;
    return new Library(libraryData);
};
/** @returns {Promise<Library>} */
Library.loadDefaultLibrary = async function() {
    return await Library.loadFromURL(Library.defaultLibraryURL);
};
Library.cache = {};
Library.defaultLibraryURL = new URL('../default.library.json', document.location);




/** Export this script **/
export default Library;


