import {ASUIMenuAction, ASUIMenuBreak, ASUIMenuDropDown, ASUIMenuItem} from "../../components/";
import React from "react";
import ProgramLoader from "../../common/program/ProgramLoader";
import DefaultLibraryData from "../../default.library";


class LibraryProcessor {
    constructor(libraryData) {
        if(libraryData === null)
            throw new Error("Invalid library data: null");
        if(typeof libraryData !== "object")
            throw new Error("Invalid library data: " + typeof libraryData);
        this.data = libraryData;
    }

    getTitle() { return this.data.title; }
    getLibraryGenerator() {
        let libraries = this.data.libraries;
        if(typeof libraries === "function")
            libraries = this.data.libraries();
        // console.log('Library.getLibraryGenerator', libraries);
        return libraries;
    }

    getPresetGenerator() {
        // console.log('Library.getPresetGenerator', this.data.presets);
        let presets = this.data.presets;
        if(typeof presets === "function")
            presets = this.data.presets();
        if(Array.isArray(presets)) {
            presets = function*() {
                for(let preset of presets)
                    yield preset;
            }
            presets = presets();
        }
        return presets;
    }

    async waitForAssetLoad() {
        if(typeof this.data.waitForAssetLoad === "function")
            await this.data.waitForAssetLoad();
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

    async renderMenuProgramAllPresets(onSelectPreset, programClassFilter=null, includeRecent=true) {
        let presets = await this.getPresetGenerator(programClassFilter);
        const libraries = await this.getLibraries();
        return (<>
            {/*{includeRecent && false ? <ASUIMenuDropDown*/}
            {/*    disabled={true}*/}
            {/*    options={() => this.renderMenuProgramRecentPresets(onSelectPreset, programClassFilter)}>*/}
            {/*    Recent Presets*/}
            {/*</ASUIMenuDropDown> : null}*/}
            {/*{includeRecent && Library.lastSelectedLibrary ? <ASUIMenuDropDown*/}
            {/*    disabled={Library.lastSelectedLibrary.getPresets().length === 0}*/}
            {/*    options={() => Library.lastSelectedLibrary.renderMenuProgramPresets(onSelectPreset, programClassFilter)}>*/}
            {/*    Current Library*/}
            {/*</ASUIMenuDropDown> : null }*/}

            {libraries.map((library, i) => (
                <ASUIMenuDropDown
                    key={i++}
                    options={() => library.renderMenuProgramAllPresets(onSelectPreset, programClassFilter, false)}
                >
                    {library.getTitle()}
                </ASUIMenuDropDown>
            ))}

            <ASUIMenuBreak />
            {presets.length > 0 ? <>
                <ASUIMenuItem>{this.getTitle()}</ASUIMenuItem>
                {presets.map(([className, presetConfig], i) =>
                    <ASUIMenuAction key={i} onAction={e => onSelectPreset(className, presetConfig)}>{presetConfig.title || 'Untitled Preset #' + i}</ASUIMenuAction>
                )}
            </> : <ASUIMenuItem>No Presets</ASUIMenuItem>}

        </>);
    }


    // async renderMenuProgramRecentPresets(onSelectPreset, programClassFilter=null) {
    //     let presets = await this.getPresets();
    //     if(programClassFilter !== null) {
    //         presets = presets.filter(([className, presetConfig], i) => programClassFilter === className);
    //     }
    //     // console.log('renderMenuProgramRecentPresets', programClassFilter);
    //     // let recentLibrary = Library.lastSelectedLibrary; // TODO: move to state?
    //     return (<>
    //         <ASUIMenuAction onAction={()=>{}} disabled>{this.getTitle()}</ASUIMenuAction>
    //         <ASUIMenuBreak />
    //         {presets.length > 0 ? presets.map(([className, presetConfig], i) =>
    //             <ASUIMenuAction key={i} onAction={e => onSelectPreset(className, presetConfig)}>{presetConfig.title || 'Untitled Preset #' + i}</ASUIMenuAction>
    //         ) : <ASUIMenuItem>No Presets</ASUIMenuItem>}
    //     </>);
    // }


    async renderMenuProgramPresets(onSelectPreset, programClassFilter=null) {
        let presets = await this.getPresetGenerator(programClassFilter);
        if(programClassFilter !== null) {
            presets = presets.filter(([className, presetConfig], i) => programClassFilter === className);
        }
        // TODO: current/selected preset
        return (<>
            <ASUIMenuAction onAction={()=>{}} disabled>{this.getTitle()}</ASUIMenuAction>
            <ASUIMenuBreak />
            {presets.length > 0 ? presets.map(([className, presetConfig], i) =>
                <ASUIMenuAction key={i} onAction={e => onSelectPreset(className, presetConfig)}>{presetConfig.title || 'Untitled Preset #' + i}</ASUIMenuAction>
            ) : <ASUIMenuItem>No Presets</ASUIMenuItem>}
        </>);
    }

    async renderMenuLibraryOptions(onSelectLibraryOptions) {
        const libraries = await this.getLibraries();
        return libraries.map((library, i) =>
            <ASUIMenuDropDown key={i++}
                options={() => {
                    LibraryProcessor.lastSelectedLibrary = library;
                    return onSelectLibraryOptions(library, i);
                }}>
                {library.getTitle()}
            </ASUIMenuDropDown>
        );
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

    /** @deprecated **/
    static historicLibraryCount() {
        return Object.values(LibraryProcessor.cache).length;
    };

    /** @deprecated **/
    static eachHistoricLibrary(callback) {
        const results = [];
        for (let cacheURL in LibraryProcessor.cache) {
            if (LibraryProcessor.cache.hasOwnProperty(cacheURL)) {
                let libraryConfig = LibraryProcessor.cache[cacheURL];
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

    static defaultLibraryData = DefaultLibraryData;

    /** @returns {LibraryProcessor} */
    static loadDefault() {
        return new LibraryProcessor(LibraryProcessor.defaultLibraryData);
    };

    static setDefaultLibrary(defaultLibraryData) {
        LibraryProcessor.defaultLibraryData = defaultLibraryData;
    }

}


// /** @returns {Promise<Library>} */
// Library.loadDefaultLibrary = async function() {
//     return await Library.loadFromURL(Library.defaultLibraryURL);
// };
/** @deprecated **/
LibraryProcessor.cache = {};
export default LibraryProcessor;

function resolve(item, thisItem, callbackParameter=null) {
    if(typeof item === "function")
        item = item.apply(thisItem, callbackParameter);
    // if(item instanceof Promise)
    //     item = await item;
    return item;
}
