import {ASUIMenuAction, ASUIMenuBreak, ASUIMenuDropDown} from "../../components/menu";
import React from "react";
import ProgramLoader from "../program/ProgramLoader";

class Library {

    getTitle() {
        return this.constructor.name;
    }

    getLibraries() {
        return [];
    }


    getPresets() {
        return [];
    }


    /** Shortcuts **/


    supportsProgram(programClassName) {
        const presets = this.getPresets();
        for(let i=0; i<presets.length; i++) {
            const [className] = presets[i];
            if(className === programClassName)
                return true;
        }
        return false;
    }

    /** Menu **/


    renderMenuProgramAll(onSelectPreset, programClass=null) {
        return (<>
            <ASUIMenuDropDown options={() => this.renderMenuProgramNew(onSelectPreset, programClass)}>New Program</ASUIMenuDropDown>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuProgramAllPresets(onSelectPreset, programClass, true)}>Using Preset</ASUIMenuDropDown>
        </>);
    }

    renderMenuProgramNew(onSelectPreset) {
        return (<>
            {ProgramLoader.getRegisteredPrograms().map((config, i) =>
                <ASUIMenuAction key={i} onAction={e => onSelectPreset(config.className)}>{config.title || 'Untitled Preset #' + i}</ASUIMenuAction>
            )}
        </>);
    }

    renderMenuProgramAllPresets(onSelectPreset, programClass=null, includeRecent=true) {
        return (<>
            {includeRecent && false ? <ASUIMenuDropDown
                disabled={true}
                options={() => this.renderMenuProgramRecentPresets(onSelectPreset, programClass)}>
                Recent Presets
            </ASUIMenuDropDown> : null}
            {includeRecent && Library.lastSelectedLibrary ? <ASUIMenuDropDown
                disabled={Library.lastSelectedLibrary.getPresets().length === 0}
                options={() => Library.lastSelectedLibrary.renderMenuProgramPresets(onSelectPreset, programClass)}>
                Current Library
            </ASUIMenuDropDown> : null }
            <ASUIMenuDropDown
                disabled={this.getPresets().length === 0}
                options={() => this.renderMenuProgramPresets(onSelectPreset, programClass)}>
                Presets
            </ASUIMenuDropDown>
            <ASUIMenuDropDown
                disabled={this.getLibraries().length === 0}
                options={() => this.renderMenuLibraryOptions(library =>
                    library.renderMenuProgramAllPresets(onSelectPreset, programClass, false)
                    , programClass)}>
                Other Libraries
            </ASUIMenuDropDown>
        </>);
    }


    renderMenuProgramRecentPresets(onSelectPreset, programClass=null) {
        // let recentLibrary = Library.lastSelectedLibrary; // TODO: move to state?
        return (<>
            <ASUIMenuAction onAction={()=>{}} disabled>{this.getTitle()}</ASUIMenuAction>
            <ASUIMenuBreak />
            {this.getPresets().map(([className, presetConfig], i) => {
                return programClass === null || programClass === className
                    ? <ASUIMenuAction key={i} onAction={e => onSelectPreset(className, presetConfig)}>{presetConfig.title || 'Untitled Preset #' + i}</ASUIMenuAction>
                    : null;
            })}
        </>);
    }


    renderMenuProgramPresets(onSelectPreset, programClass=null) {
        return (<>
            <ASUIMenuAction onAction={()=>{}} disabled>{this.getTitle()}</ASUIMenuAction>
            <ASUIMenuBreak />
            {this.getPresets().map(([className, presetConfig], i) => {
                return programClass === null || programClass === className
                    ? <ASUIMenuAction key={i} onAction={e => onSelectPreset(className, presetConfig)}>{presetConfig.title || 'Untitled Preset #' + i}</ASUIMenuAction>
                    : null;
            })}
        </>);
    }

    renderMenuLibraryOptions(onSelectLibraryOptions, programClass=null) {
        return this.getLibraries().map((library, i) => {
            // if (programClass !== null && !library.supportsProgram(programClass))
            //     return null;
            return (
                <ASUIMenuDropDown key={i++}
                                  options={() => {
                                  Library.lastSelectedLibrary = library;
                                  return onSelectLibraryOptions(library);
                              }}>
                    {library.getTitle()}
                </ASUIMenuDropDown>
            );
        });
    }

    // renderMenuProgramLibraryPresets(onSelectPreset, programClass=null) {
    //     return this.renderMenuLibraryOptions(programClass, library =>
    //         library.renderSubMenuProgramPresets(onSelectPreset, programClass)
    //     );
    // }

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
    // this.programs = {};
    // this.presets = [];
    // this.samples = [];
    // Object.assign(this, data);
    // }

    // load(data) {
    //     Object.assign(this, data);
    // }

    // getPrograms() { return this.data.programs || []; }


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

    /** @var Library **/
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
