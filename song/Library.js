
class Library {
    constructor(data) {
        this.data = data;
        ['libraries', 'samples', 'presets']
            .forEach(key => {
                if(!this.data[key])
                    this.data[key] = []
            });
        // if(!this.data.url)
        //     this.data.url = document.location.toString();
        // this.data.url = null;
        // this.data.urlPrefix = '';
        // this.name = "Loading...";
        // this.libraries = [];
        // this.instruments = {};
        // this.presets = [];
        // this.samples = [];
        // Object.assign(this, data);
    }

    // load(data) {
    //     Object.assign(this, data);
    // }


    getName() { return this.data.name || "Unnamed Library"; }

    getLibraries() { return this.data.libraries || []; }
    getSamples() { return this.data.samples || []; }
    getPresets() { return this.data.presets || []; }
    // getInstruments() { return this.data.instruments || []; }

    getLibraryConfig(libraryURL) {
        return this.getLibraries().find(s => s.url = libraryURL)
            || (()=>{ throw new Error("Could not find library config for: " + libraryURL);})();
    }


    getSampleConfig(sampleURL) {
        return this.getSamples().find(s => s.url = sampleURL)
            || (()=>{ throw new Error("Could not find voice config for: " + sampleURL);})();
    }

    getPresetConfig(presetName, presetConfig={}) {
        let presetData = this.getPresets().find(p => p.name = presetName)
            || (()=>{ throw new Error("Could not find preset config for: " + presetName);})();

        const samples = presetData.samples || [];
        for(let i=0; i<samples.length; i++) {
            samples[i] = this.getSampleConfig(samples[i]);
        }
        presetConfig.presetName = presetName;
        presetConfig.samples = samples;

        return presetConfig;
    }

    // throw new Error("TODO: Implement");

        // this.processItemList(presetData.samples, (sampleConfig) => {
        //     if(typeof this.samples[sampleConfig.name] !== "undefined")
        //         Object.assign(sampleConfig, this.samples[sampleConfig.name]);
        //     sampleConfig.url = new URL((sampleConfig.url || sampleConfig.name), this.data.url).toString();
        //     newConfig.samples.push(sampleConfig);
        //     // if (typeof sampleConfig.range !== "undefined") {
        //     //     let pair = sampleConfig.range;
        //     //     if (typeof pair === 'string')
        //     //         pair = pair.split(':');
        //     //     sampleConfig.keyLow = pair[0];
        //     //     sampleConfig.keyHigh = pair[1] || pair[0];
        //     //     delete sampleConfig.range;
        //     // }
        // });
        // newConfig.libraryURL = this.data.url;
        // newConfig.preset = presetName;
        // return newConfig;
    // getLibraries().map(callback) {
    //     const results = [];
    //     const libraries = this.data.libraries || [];
    //     for(let i=0; i<libraries.length; i++) {
    //         const libraryConfig = libraries[i];
    //         if(!libraryConfig.name)
    //             libraryConfig.name = libraryConfig.url.split('/').pop();
    //         if(libraryConfig.url)
    //             libraryConfig.url = new URL(libraryConfig.url, this.data.url).toString();
    //         const result = callback(libraryConfig);
    //         if(result !== null) results.push(result);
    //         if(result === false) break;
    //     }
    //     return results;
    // }

    // eachSample(callback) {
    //     const results = [];
    //     const samples = this.data.samples || [];
    //     for(let i=0; i<samples.length; i++) {
    //         const sampleConfig = samples[i];
    //         if(!sampleConfig.name)
    //             sampleConfig.name = sampleConfig.url.split('/').pop();
    //         if(sampleConfig.url)
    //             sampleConfig.url = new URL(sampleConfig.url, this.data.url).toString();
    //         const result = callback(sampleConfig);
    //         if(result !== null) results.push(result);
    //         if(result === false) break;
    //     }
    //     return results;
    // }

    // getPresets().map(callback) {
    //     const results = [];
    //     const presets = this.data.presets || [];
    //     for(let i=0; i<presets.length; i++) {
    //         const presetConfig = presets[i];
    //         presetConfig.url = new URL(this.data.url + '#' + presetConfig.name, this.data.url).toString();
    //         const result = callback(presetConfig);
    //         if(result !== null) results.push(result);
    //         if(result === false) break;
    //     }
    //     return results;
    // }

    // getInstruments().map(callback) {
    //     const results = [];
    //     const instruments = this.data.instruments || [];
    //     for(let i=0; i<instruments.length; i++) {
    //         const instrumentConfig = instruments[i];
    //         if(!instrumentConfig.name)
    //             instrumentConfig.name = instrumentConfig.url.split('/').pop();
    //         if(instrumentConfig.url)
    //             instrumentConfig.url = new URL(instrumentConfig.url, this.data.url).toString();
    //         const result = callback(instrumentConfig);
    //         if(result !== null) results.push(result);
    //         if(result === false) break;
    //     }
    //     return results;
    // }

    // processItemList(arrayOrObject, eachCallback, defaultParam='url') {
    //     const results = [];
    //     const eachItem = (itemConfig, itemName=null) => {
    //         if(typeof itemConfig === "string") {
    //             const newItem = {};
    //             newItem[defaultParam] = itemConfig;
    //             itemConfig = newItem;
    //         }
    //         itemConfig = Object.assign({}, itemConfig);
    //         if(typeof itemConfig.name === "undefined" && itemName)
    //             itemConfig.name = itemName;
    //         const result = eachCallback(itemConfig);
    //         if(result !== null && result !== false)
    //             results.push(result);
    //         return result;
    //     };
    //
    //     if(Array.isArray(arrayOrObject)) {
    //         for(let i=0; i<arrayOrObject.length; i++) {
    //             if(eachItem(arrayOrObject[i]) === false)
    //                 break;
    //         }
    //     } else if(typeof arrayOrObject === "object") {
    //         for(let itemName in arrayOrObject) {
    //             if(arrayOrObject.hasOwnProperty(itemName)) {
    //                 if(eachItem(arrayOrObject[itemName], itemName) === false)
    //                     break;
    //             }
    //         }
    //     } else {
    //         throw new Error('Unknown array or object');
    //     }
    //     return results;
    // }


}


Library.historicLibraryCount = function() { return Object.values(Library.cache).length; };
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

Library.loadDefault = function() {
    return new Library(require("../default.library"));
};

/**
 * @param url
 * @returns {Promise<Library>}
 */
Library.loadFromURL = async function(url) {
    if (!url)
        throw new Error("Invalid url");
    const response = await fetch(url);
    const libraryData = await response.json();
    if(typeof libraryData.url === "undefined")
        libraryData.url = url.toString();
    console.log('library',libraryData);
    return new Library(libraryData);
};

Library.loadFromURL2 = async function(url) {
    if (!url)
        throw new Error("Invalid url");
    url = new URL((url.toString()).split('#')[0], document.location).toString();

    let libraryData;
    if (!Library.cache[url]) {
        Library.cache[url] = new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url.toString(), true);
            xhr.responseType = 'json';
            xhr.onload = () => {
                if (xhr.status !== 200)
                    return reject("Sample library not found: " + url);

                const libraryData = xhr.response;
                libraryData.url = url.toString();

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


// /** @returns {Promise<Library>} */
// Library.loadDefaultLibrary = async function() {
//     return await Library.loadFromURL(Library.defaultLibraryURL);
// };
Library.cache = {};
// Library.defaultLibraryURL = new URL('../default.library.json', document.location);




/** Export this script **/
export default Library;


