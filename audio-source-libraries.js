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

    async getMidiParser() {
        const sources = this.sources.MidiParser;
        for(let i=0; i<sources.length; i++) {
            if(typeof MidiParser !== "undefined")
                return MidiParser;
            await this.loadScript(sources[i]);
        }
        throw new Error("Failed to load MidiParser Library");
    }


    async getLZString() {
        const sources = this.sources.LZString;
        for(let i=0; i<sources.length; i++) {
            if(typeof LZString !== "undefined")
                return LZString;
            await this.loadScript(sources[i]);
        }
        throw new Error("Failed to load MidiParser Library");
    }


}
