import React from "react";
import {ASUIMenuAction, ASUIMenuBreak, ASUIMenuDropDown, ASUIMenuItem} from "../../components/";
import DefaultLibraryData from "../../default.library";
import ProgramLoader from "../program/ProgramLoader";


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
        // if(Array.isArray(presets)) {
        //     presets = function*() {
        //         for(let preset of presets)
        //             yield preset;
        //     }
        //     presets = presets();
        // }
        return presets;
    }

    getSampleGenerator() {
        // console.log('Library.getPresetGenerator', this.data.presets);
        let samples = this.data.samples;
        if(typeof samples === "function")
            samples = this.data.samples();
        // if(Array.isArray(samples)) {
        //     samples = function*() {
        //         for(let preset of samples)
        //             yield preset;
        //     }
        //     samples = samples();
        // }
        return samples;
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
            <ASUIMenuDropDown options={() => this.renderMenuPresets(onSelectPreset, programClass, true)}>Using Preset</ASUIMenuDropDown>
        </>);
    }

    renderMenuProgramNew(onSelectPreset) {
        return (<>
            {ProgramLoader.getRegisteredPrograms().map((config, i) =>
                <ASUIMenuAction key={i} onAction={e => onSelectPreset(config.className)}>{config.title || 'Untitled Preset #' + i}</ASUIMenuAction>
            )}
        </>);
    }

    /** Sample Menu **/

    renderMenuSamples(onSelectSample, fileRegex=null) { ///^(.*\.(?!(htm|html|class|js)$))?[^.]*$/i
        const callback = onSelectSample;
        onSelectSample = function(sampleURL) {
            addUnique(sampleURL, LibraryProcessor.recentSampleURLs);
            callback(sampleURL);
        }
        let samples = this.getSampleGenerator();

        let i=0;
        const content = [];
        if(samples) {
            let nextSample = samples.next();
            while (!nextSample.done) {
                const sampleURL = nextSample.value.toString();
                nextSample = samples.next();
                if (fileRegex !== null) {
                    if (!fileRegex.test(sampleURL))
                        continue;
                }
                const title = sampleURL.split('/').pop();
                content.push(
                    <ASUIMenuAction
                        key={`sample-${i}`}
                        onAction={e => onSelectSample(sampleURL)}>
                        {title || 'Untitled Sample'}
                    </ASUIMenuAction>
                )
                // TODO: scrollable container?
            }
        }
        return content.length === 0 ? null : content;
    }

    static recentSampleURLs = [];
    static renderMenuRecentSamples(onSelectSample, fileRegex=null) { ///^(.*\.(?!(htm|html|class|js)$))?[^.]*$/i
        const content = LibraryProcessor.recentSampleURLs
            .filter(sampleURL => !fileRegex || fileRegex.test(sampleURL))
            .map((sampleURL, i) => (
                <ASUIMenuAction key={i} onAction={e => onSelectSample(sampleURL)}>
                    {sampleURL.split('/').pop() || 'Untitled Sample'}
                </ASUIMenuAction>)
            );

        return content.length === 0 ? null : content;
    }

    /** Preset Menu **/

    renderMenuPresets(onSelectPreset) {
        // TODO: recent
        let presets = this.getPresetGenerator();

        let i=0;
        const content = [];

        if(presets) {
            let nextPreset = presets.next();
            while (!nextPreset.done) {
                const [presetClassName, presetConfig] = nextPreset.value;
                nextPreset = presets.next();
                content.push(
                    <ASUIMenuAction key={`preset-${i}`} onAction={e => onSelectPreset(presetClassName, presetConfig)}>
                        {presetConfig.title || 'Untitled Preset #' + i}
                    </ASUIMenuAction>
                )
                // TODO: scrollable container?
            }
        }
        return content.length === 0 ? null : content;
    }

    static recentPresets = [];
    static renderMenuRecentPresets(onSelectPreset, classFilter=null) {
        const content = LibraryProcessor.recentPresets
            .filter(([presetClassName, presetConfig]) => !classFilter || classFilter === presetClassName)
            .map(([presetClassName, presetConfig], i) => (
                <ASUIMenuAction key={`preset-${i}`} onAction={e => onSelectPreset(presetClassName, presetConfig)}>
                    {presetConfig.title || 'Untitled Preset #' + i}
                </ASUIMenuAction>
            ));

        return content.length === 0 ? null : content;
    }

    /** Libraries Menu **/

    // renderMenuLibraries(onSelectPreset) {
    //     let i=0;
    //     const content = [];
    //     const libraries = this.getLibraryGenerator();
    //
    //     if(libraries) {
    //         let nextLibrary = libraries.next();
    //         while (!nextLibrary.done) {
    //             const library = new LibraryProcessor(nextLibrary.value);
    //             nextLibrary = libraries.next();
    //             content.push(
    //                 <ASUIMenuDropDown
    //                     key={`lib-${i}`}
    //                     options={() => library.renderMenuPresets(onSelectPreset)}
    //                 >
    //                     {library.getTitle()}
    //                 </ASUIMenuDropDown>
    //             )
    //         }
    //     }
    //     return content.length === 0 ? null : content;
    // }

    renderMenuLibraryOptions(onSelectLibraryOptions) {
        let i=0;
        const content = [];
        const libraries = this.getLibraryGenerator();

        if(libraries) {
            let nextLibrary = libraries.next();
            while(!nextLibrary.done) {
                const library = new LibraryProcessor(nextLibrary.value);
                content.push(
                    <ASUIMenuDropDown
                        key={`lib-${i}`}
                        options={onSelectLibraryOptions(library)}
                    >
                        {library.getTitle()}
                    </ASUIMenuDropDown>
                )
                nextLibrary = libraries.next();
            }
        }
        return content.length === 0 ? null : content;
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


function addUnique(value, array, limit=10) {
    if(array.indexOf(value) === -1)
        array.unshift(value);
    while(array.length > limit)
        array.pop();
}


