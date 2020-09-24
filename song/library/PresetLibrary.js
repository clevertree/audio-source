import React from "react";
import {ASUIMenuAction} from "../../components";

export default class PresetLibrary {
    /** Async loading **/
    async waitForAssetLoad() {    }

    /** Preset Iterator **/
    * getPresetGenerator() {
        throw new Error("Not implemented")
    }

    /** Sample Iterator **/
    * getSampleGenerator() {
        throw new Error("Not implemented")
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

        for (const [presetClassName, presetConfig] of this.getPresets()) {
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

