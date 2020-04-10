import {MenuAction, MenuBreak, MenuDropDown} from "../../components/menu";
import React from "react";

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

    renderMenuInstrumentPresets(instrumentClass, onSelectPreset, key=null) {
        let recentLibrary = Library.lastSelectedLibrary; // TODO: move to state?
        switch(key) {
            case 'child':
                return (<>
                    <MenuDropDown
                        disabled={this.getPresets().length === 0}
                        options={() => this.renderMenuInstrumentPresets(instrumentClass, onSelectPreset, 'preset')}>
                        Presets
                    </MenuDropDown>
                    <MenuDropDown
                        disabled={this.getLibraries().length === 0}
                        options={() => this.renderMenuInstrumentPresets(instrumentClass, onSelectPreset, 'libraries')}>
                        Other Libraries
                    </MenuDropDown>
                </>);

            case null:
                return (<>
                    <MenuDropDown
                        disabled={true}
                        options={() => this.renderMenuInstrumentPresets(instrumentClass, onSelectPreset, 'recent')}>
                        Recent Presets
                    </MenuDropDown>
                    {recentLibrary ? <MenuDropDown
                        disabled={recentLibrary.getPresets().length === 0}
                        options={() => recentLibrary.renderMenuInstrumentPresets(instrumentClass, onSelectPreset, 'preset')}>
                        Recent Library
                    </MenuDropDown> : null }
                    <MenuDropDown
                        disabled={this.getLibraries().length === 0}
                        options={() => this.renderMenuInstrumentPresets(instrumentClass, onSelectPreset, 'libraries')}>
                        Other Libraries
                    </MenuDropDown>
                </>);

            case 'libraries':
                return this.renderMenuLibraryOptions(instrumentClass, library =>
                     library.renderMenuInstrumentPresets(instrumentClass, onSelectPreset, 'child')
                );

            case 'preset':
                return (<>
                    <MenuAction onAction={()=>{}} disabled>{this.getTitle()}</MenuAction>
                    <MenuBreak />
                    {this.getPresets().map((preset, i) => {
                        return <MenuAction key={i} onAction={e => onSelectPreset(preset)}>{preset.title || 'Untitled Preset #' + i}</MenuAction>
                    })}
                </>);

            case 'recent':
                return this.getPresets().map((preset, i) => {
                    return <MenuAction key={i} onAction={e => onSelectPreset(preset)}>{preset.title || 'Untitled Preset #' + i}</MenuAction>
                });

            default:
                throw new Error("Unknown key: " + key);
        }
    }

    renderMenuLibraryOptions(instrumentClass, onSelectLibraryOptions) {
        console.log(this, this.getLibraries());
        return this.getLibraries().map((library, i) => {
            if (!library.supportsInstrument(instrumentClass))
                return null;
            return (
                <MenuDropDown key={i++}
                              options={() => {
                                  Library.lastSelectedLibrary = library;
                                  return onSelectLibraryOptions(library);
                              }}>
                    {library.getTitle()}
                </MenuDropDown>
            );
        });
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

    static lastSelectedLibrary = null;

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
        const defaultLibrary = require("../../default.library.js").default;
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
