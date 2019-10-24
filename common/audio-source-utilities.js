class AudioSourceUtilities {
    constructor() {
    }

    /** Javascript Libraries **/

    get sources() {
        return {
            'MidiParser': [
                this.getScriptDirectory('assets/3rdparty/MidiParser/main.js'),
                'https://cdn.jsdelivr.net/gh/colxi/midi-parser-js/src/main.js'
            ],
            'LZString': [
                this.getScriptDirectory('assets/3rdparty/LZString/lz-string.min.js'),
                'https://cdn.jsdelivr.net/gh/pieroxy/lz-string/libs/lz-string.min.js'
            ]
        }
    }


    async loadJSLibrary(libraryName, test=null) {
        if(!test)
            test = () => typeof window[libraryName] !== 'undefined';
        if(test())
            return true;
        const sources = this.sources[libraryName];
        for(let i=0; i<sources.length; i++) {
            await this.loadScript(sources[i]);
            if(test())
                return true;
        }
        throw new Error(`Failed to load ${libraryName} Library`);

    }

    async getMidiParser() {
        if(typeof window.MidiParser === 'undefined')
            await this.loadJSLibrary('MidiParser');
        return window.MidiParser;
    }


    async getLZString() {
        if(typeof window.LZString === 'undefined')
            await this.loadJSLibrary('LZString');
        return window.LZString;
    }




    /** Package Info **/

    async loadPackageInfo(force=false) {
        const url = this.getScriptDirectory('package.json');

        let packageInfo = AudioSourceUtilities.packageInfo;
        if (!force && packageInfo)
            return packageInfo;

        packageInfo = await this.loadJSON(url);
        if(!packageInfo.version)
            throw new Error("Invalid package version: " + url);

        console.log("Package Version: ", packageInfo.version, packageInfo);
        AudioSourceUtilities.packageInfo = packageInfo;
        return packageInfo;
    }


    /** Utilities **/

    getScriptElement() {
        return document.head.querySelector('script[src$="audio-source-composer-element.js"],script[src$="audio-source-composer.min.js"]');
    }


    getScriptDirectory(appendPath='') {
        const scriptElm = this.getScriptElement(); // document.head.querySelector('script[src$="audio-source-composer-element.js"],script[src$="audio-source-composer.min.js"]');
        const basePath = scriptElm.src.split('/').slice(0, -2).join('/') + '/';
//         console.log("Base Path: ", basePath);
        return basePath + appendPath;
    }

    async loadScript(src) {
        await new Promise((resolve, reject) => {
            const newScriptElm = document.createElement('script');
            newScriptElm.src = src;
            newScriptElm.onload = e => resolve();
            document.head.appendChild(newScriptElm);
        });
    }

    async loadJSON(url) {
        url = new URL(url, document.location) + '';
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'json';
            xhr.onload = () => {
                if (xhr.status !== 200)
                    return reject("JSON file not found: " + url);

                resolve(xhr.response);
            };
            xhr.send();
        });
    }

}

AudioSourceUtilities.instrumentLibrary = null;
AudioSourceUtilities.packageInfo = null;


if(typeof module !== "undefined")
    module.exports = {AudioSourceUtilities};
