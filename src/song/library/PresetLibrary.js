import React from "react";
import {ASUIMenuAction, ASUIMenuDropDown, ASUIMenuItem} from "../../components";

export default class PresetLibrary {
    constructor(title, uuid=null) {
        this.title = title;
        this.uuid = uuid || title.toLowerCase().replace('/W+', '_');
        this.presets = null;
    }

    getTitle() { return this.title; }
    getUUID() { return this.uuid; }

    /** Async loading **/
    async waitForAssetLoad() {    }


    getPresetList() {
        if(!this.presets)
            throw new Error("Preset list was not fetched. Please reload");
        return this.presets;
    }

    getSampleList() {
        const sampleList = [];
        eachSampleURL(this.presets, (object, url) => {
            sampleList.push(url);
        })
        // console.log('sampleList', sampleList);
        return sampleList;
    }

    setPresetList(presets, libraryURL=null) {
        if(!Array.isArray(presets))
            throw new Error("Invalid preset list");
        if(libraryURL)
            fixPresetURLs(this.presets, libraryURL);
        // console.log('fixPresetURLs', url, presets);
    }


    /** Preset Menu **/

    renderMenuPresets(onSelectPreset) {
        const onSelectPresetCallback = function(presetClassName, presetConfig) {
            addRecentPreset(presetClassName, presetConfig)
            onSelectPreset(presetClassName, presetConfig);
        }
        // TODO: recent
        let i=0;
        const content = [];

        for (const [presetClassName, presetConfig] of this.getPresetList()) {
            content.push(
                <ASUIMenuAction key={`preset-${i}`} onAction={e => onSelectPresetCallback(presetClassName, presetConfig)}>
                    {presetConfig.title || 'Untitled Preset #' + i}
                </ASUIMenuAction>
            )
            // TODO: scrollable container?
        }
        return content.length === 0 ? null : content;
    }

    static renderMenuRecentPresets(onSelectPreset, classFilter=null) {
        const content = PresetLibrary.recentPresets
            .filter(([presetClassName, presetConfig]) => !classFilter || classFilter === presetClassName)
            .map(([presetClassName, presetConfig], i) => (
                <ASUIMenuAction key={`preset-${i}`} onAction={e => onSelectPreset(presetClassName, presetConfig)}>
                    {presetConfig.title || 'Untitled Preset #' + i}
                </ASUIMenuAction>
            ));

        return content.length === 0 ? null : content;
    }



    /** Sample Menu **/

    renderMenuSamples(onSelectSample, fileRegex=null) { ///^(.*\.(?!(htm|html|class|js)$))?[^.]*$/i
        const onSelectSampleCallback = function(sampleURL) {
            addSampleURL(sampleURL);
            onSelectSample(sampleURL);
        }

        let i=0;
        const content = [];
        for (let sampleURL of this.getSampleList()) {
            if (fileRegex !== null) {
                if (!fileRegex.test(sampleURL))
                    continue;
            }
            const title = sampleURL.split('/').pop();
            content.push(
                <ASUIMenuAction
                    key={`sample-${i}`}
                    onAction={e => onSelectSampleCallback(sampleURL)}>
                    {title || 'Untitled Sample'}
                </ASUIMenuAction>
            )
            // TODO: scrollable container?
        }
        return content.length === 0 ? <ASUIMenuItem>No Samples</ASUIMenuItem> : content;
    }

    static renderMenuRecentSamples(onSelectSample, fileRegex=null) { ///^(.*\.(?!(htm|html|class|js)$))?[^.]*$/i
        const content = PresetLibrary.recentSampleURLs
            .filter(sampleURL => !fileRegex || fileRegex.test(sampleURL))
            .map((sampleURL, i) => (
                <ASUIMenuAction key={i} onAction={e => onSelectSample(sampleURL)}>
                    {sampleURL.split('/').pop() || 'Untitled Sample'}
                </ASUIMenuAction>)
            );

        return content.length === 0 ? null : content;
    }


    /** Libraries **/

    static addLibrary(library) {
        if(!library instanceof PresetLibrary)
            throw new Error("Library is not a PresetLibrary: " + typeof library);
        libraries.push(library);
        // console.log("Added library: ", library.getTitle(), library);
    }

    static getLibraries() {
        return libraries;
    }

    static loadDefault() {
        return libraries[0];
    }



    /** Libraries Menu **/

    static renderMenuLibraries(onSelectLibrary) {
        return PresetLibrary.getLibraries()
            .map((library, i) => <ASUIMenuAction
                key={`lib-${i}`}
                onAction={onSelectLibrary(library)}
            >
                {library.getTitle()}
            </ASUIMenuAction>)
    }
    static renderMenuLibraryOptions(onSelectLibraryOptions) {
        return PresetLibrary.getLibraries()
            .map((library, i) => <ASUIMenuDropDown
                key={`lib-${i}`}
                options={onSelectLibraryOptions(library)}
            >
                {library.getTitle()}
            </ASUIMenuDropDown>)
    }


}

const libraries = [];
PresetLibrary.recentPresets = [];
PresetLibrary.recentSampleURLs = [];
PresetLibrary.recentSampleURLLimit = 10;

function addSampleURL(value) {
    const recentSampleURLs = PresetLibrary.recentSampleURLs;
    if(recentSampleURLs.indexOf(value) === -1)
        recentSampleURLs.unshift(value);
    while(recentSampleURLs.length > PresetLibrary.recentSampleURLLimit)
        recentSampleURLs.pop();
}

function addRecentPreset(presetClassName, presetConfig) {
    const recentPresets = PresetLibrary.recentPresets;
    for(let i=recentPresets.length-1; i>=0; i--) {
        const recentPreset = recentPresets[i];
        if(recentPreset[0] === presetClassName) {
            if(recentPreset[1].title === presetConfig.title) {
                recentPreset.splice(i, 1);
            }
        }
    }
    recentPresets.unshift([presetClassName, presetConfig]);
}


// function fixPresetURLs(object, baseURL) {
//     if(typeof object !== "object")
//         return;
//     if(Array.isArray(object)) {
//         for (let i = 0; i < object.length; i++) {
//             fixPresetURLs(object[i], baseURL);
//         }
//         return;
//     }
//     if(typeof object.url !== "undefined")
//         object.url = new URL(object.url, baseURL).toString();
//     Object.keys(object).forEach(key => {
//         fixPresetURLs(object[key], baseURL);
//     })
// }

function fixPresetURLs(object, baseURL) {
    eachSampleURL(object, (subObject, url) => {
        subObject.url = new URL(subObject.url, baseURL).toString();
    })
}

function eachSampleURL(object, callback) {
    if(!object || typeof object !== "object")
        return;
    if(Array.isArray(object)) {
        for (let i = 0; i < object.length; i++) {
            eachSampleURL(object[i], callback);
        }
        return;
    }
    if(typeof object.url !== "undefined")
        callback(object, object.url)
    Object.keys(object).forEach(key => {
        eachSampleURL(object[key], callback);
    })
}
