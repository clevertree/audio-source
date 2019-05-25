class AudioSourceLibraries {
    constructor() {
    }

    get sources() {
        return {
            'MidiParser': [
                'https://cdn.jsdelivr.net/gh/colxi/midi-parser-js/src/main.js'
            ],
            'LZString': [
                'https://cdn.jsdelivr.net/gh/pieroxy/lz-string/libs/lz-string.min.js'
            ]
        }
    }

    async loadScript(src) {
        await new Promise((resolve, reject) => {
            const newScriptElm = document.createElement('script');
            newScriptElm.src = src;
            newScriptElm.onload = e => resolve();
            document.head.appendChild(newScriptElm);
        });
    }

    async loadLibrary(libraryName, test=null) {
        if(!test)
            test = () => typeof window[libraryName] !== 'undefined';
        if(test())
            return true;
        const sources = this.sources[libraryName];
        for(let i=0; i<sources.length; i++) {
            if(test())
                return true;
            await this.loadScript(sources[i]);
        }
        throw new Error(`Failed to load ${libraryName} Library`);

    }

    async getMidiParser() {
        await this.loadLibrary('MidiParser');
        return MidiParser;
    }


    async getLZString() {
        await this.loadLibrary('LZString');
        return LZString;
    }


}
