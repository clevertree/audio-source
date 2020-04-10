import {MenuAction, MenuDropDown} from "../../components/menu";
import React from "react";
import {Preset} from "./Preset";

class Library {
    supportsInstrument(instrumentClass) {
        return true;
    }

    getTitle() {
        return this.constructor.name;
    }

    getLibraries() {
        return [];
    }

    /** @deprecated **/
    getSamples() {
        return [];
    }

    getPresets() {
        return [];
    }


    /** Menu **/

    // Render Other libraries
    renderMenuInstrumentLibraryPresets(instrumentClass, onSelectPreset) {
        return this.renderMenuInstrumentLibraries(instrumentClass, library => {
            return library.renderMenuInstrumentPresets(onSelectPreset);
        })
    }

    renderMenuInstrumentLibraries(instrumentClass, onSelectOptions) {
        let i = 0;
        return this.getLibraries((library) => {
            if (!library.supportsInstrument(instrumentClass))
                return null;
            return (
                <MenuDropDown key={i++}
                              options={() => onSelectOptions(library)}>
                    {library.getTitle()}
                </MenuDropDown>
            );
        });
    }


    renderMenuInstrumentPresets(instrumentClass, onSelectPreset) {
        return this.getPresets().map((preset, i) => {
                // if (!preset instanceof Preset)
                //     preset = new Preset(preset);
                return <MenuAction onAction={e => onSelectPreset(preset)}>{preset.title || 'Untitled Preset #' + i}</MenuAction>
            }
        );
    }


    // constructor(title=null) {
    // this.title = title || this.constructor.name;
    // this.baseURL = baseURL || document.location;
    // ['libraries', 'samples', 'presets']
    //     .forEach(key => {
    //         if(!this.data[key])
    //             this.data[key] = []
    //     });
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
    // }

    // load(data) {
    //     Object.assign(this, data);
    // }

    // getInstruments() { return this.data.instruments || []; }


    // getPresetConfig(presetName, presetConfig={}) {
    //     let presetData = this.getPresets().find(p => p.name = presetName)
    //         || (()=>{ throw new Error("Could not find preset config for: " + presetName);})();
    //
    //     const samples = presetData.samples || [];
    //     for(let i=0; i<samples.length; i++) {
    //         samples[i] = this.getSampleConfig(samples[i]);
    //     }
    //     presetConfig.presetName = presetName;
    //     presetConfig.samples = samples;
    //
    //     return presetConfig;
    // }

    static historicLibraryCount() {
        return Object.values(Library.cache).length;
    };

    static eachHistoricLibrary(callback) {
        const results = [];
        for (let cacheURL in Library.cache) {
            if (Library.cache.hasOwnProperty(cacheURL)) {
                let libraryConfig = Library.cache[cacheURL];
                if (libraryConfig instanceof Promise)
                    continue;
                // libraryConfig = await libraryConfig;
                libraryConfig.name = libraryConfig.name || libraryConfig.url.split('/').pop();
                const result = callback(libraryConfig);
                if (result === false)
                    break;
                if (result !== null)
                    results.push(result);
            }
        }
        return results;
    }

    static loadDefault() {
        const defaultLibrary = require("../default.library.js").default;
        return new defaultLibrary();
    };

    /**
     * @param url
     * @returns {Promise<Library>}
     */
    static async loadFromURL(url) {
        if (!url)
            throw new Error("Invalid url");
        const response = await fetch(url);
        const libraryData = await response.json();
        if (typeof libraryData.url === "undefined")
            libraryData.url = url.toString();
        console.log('library', libraryData);
        return new Library(libraryData);
    }

    static async loadFromURL2(url) {
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
        if (libraryData instanceof Promise)
            libraryData = await libraryData;
        return new Library(libraryData);
    }

}


// /** @returns {Promise<Library>} */
// Library.loadDefaultLibrary = async function() {
//     return await Library.loadFromURL(Library.defaultLibraryURL);
// };
Library.cache = {};
export default Library;
