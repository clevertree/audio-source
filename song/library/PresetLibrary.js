import React from "react";
import {ASUIMenuAction} from "../../components";

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
        const data = this.getData();
        const presets = data.presets;
        for (let i = 0; i < presets.length; i++) {
            const presetData = presets[i];
            for (let voiceData of presetData.voices) {
                const url = new URL(data.urlPrefix + voiceData.url, this.url).toString();
            }
        }
    }

    setPresetList(presets, url=null) {
        if(!Array.isArray(presets))
            throw new Error("Invalid preset list");
        this.presets = presets;
        if(url)
            fixPresetURLs(presets, url);
        console.log('fixPresetURLs', url, presets);
    }


    /** Sample Menu **/

    renderMenuSamples(onSelectSample, fileRegex=null) { ///^(.*\.(?!(htm|html|class|js)$))?[^.]*$/i
        const callback = onSelectSample;
        onSelectSample = function(sampleURL) {
            addUnique(sampleURL, recentSampleURLs);
            callback(sampleURL);
        }

        let i=0;
        const content = [];
        for (let sampleURL of this.getSamples()) {
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
        return content.length === 0 ? null : content;
    }

    static renderMenuRecentSamples(onSelectSample, fileRegex=null) { ///^(.*\.(?!(htm|html|class|js)$))?[^.]*$/i
        const content = recentSampleURLs
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
        let i=0;
        const content = [];

        for (const [presetClassName, presetConfig] of this.getPresetList()) {
            content.push(
                <ASUIMenuAction key={`preset-${i}`} onAction={e => onSelectPreset(presetClassName, presetConfig)}>
                    {presetConfig.title || 'Untitled Preset #' + i}
                </ASUIMenuAction>
            )
            // TODO: scrollable container?
        }
        return content.length === 0 ? null : content;
    }

    static renderMenuRecentPresets(onSelectPreset, classFilter=null) {
        const content = recentPresets
            .filter(([presetClassName, presetConfig]) => !classFilter || classFilter === presetClassName)
            .map(([presetClassName, presetConfig], i) => (
                <ASUIMenuAction key={`preset-${i}`} onAction={e => onSelectPreset(presetClassName, presetConfig)}>
                    {presetConfig.title || 'Untitled Preset #' + i}
                </ASUIMenuAction>
            ));

        return content.length === 0 ? null : content;
    }

    /** Libraries **/

    static addLibrary(library) {
        if(!library instanceof PresetLibrary)
            throw new Error("Library is not a PresetLibrary: " + typeof library);
        libraries.push(library);
        console.log("Added library: ", library.getTitle(), library);
    }

    static getLibraries() {
        return libraries;
    }

    static loadDefault() {
        return libraries[0];
    }
}

const libraries = [];
const recentPresets = [];
const recentSampleURLs = [];

function addUnique(value, array, limit=10) {
    if(array.indexOf(value) === -1)
        array.unshift(value);
    while(array.length > limit)
        array.pop();
}


function fixPresetURLs(object, baseURL) {
    if(typeof object !== "object")
        return;
    if(Array.isArray(object)) {
        for (let i = 0; i < object.length; i++) {
            fixPresetURLs(object[i], baseURL);
        }
        return;
    }
    if(typeof object.url !== "undefined")
        object.url = new URL(object.url, baseURL).toString();
    Object.keys(object).forEach(key => {
        fixPresetURLs(object[key], baseURL);
    })
}
