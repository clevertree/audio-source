(async function() {

    class AudioSourceLoader extends HTMLElement {
        constructor() {
            super();
        }

        static require(relativeScriptPath) {
            let scriptElm = AudioSourceLoader.findScript(relativeScriptPath);
            // console.info('require', relativeScriptPath, scriptElm.exports);
            return scriptElm.exports
                || (() => {
                    throw new Error("Script module has no exports: " + relativeScriptPath);
                })()
        }

        static resolveURL(relativeScriptURL) {
            if (relativeScriptURL.startsWith('../')) {
                relativeScriptURL = new URL(basePathURL + relativeScriptURL, document.location) + ''
            }
            return relativeScriptURL;
        }

        static findScript(relativeScriptURL, throwException = true) {
            relativeScriptURL = AudioSourceLoader.resolveURL(relativeScriptURL);
            const scriptElm = document.head.querySelector(`script[src$="${relativeScriptURL}"]`);
            if (!scriptElm && throwException)
                throw new Error("Required script not found: " + relativeScriptURL);
            return scriptElm;
        }

        static getBasePath() { return basePathURL; }
    }
    AudioSourceLoader.requireAsync = async function(relativeScriptURL) {
        let scriptElm = AudioSourceLoader.findScript(relativeScriptURL, false);
        if(!scriptElm) {
            const scriptURL = AudioSourceLoader.resolveURL(relativeScriptURL);
            scriptElm = document.createElement('script');
            scriptElm.src = scriptURL;
            scriptElm.loadPromise = new Promise(async (resolve, reject) => {
                scriptElm.onload = resolve;
                document.head.appendChild(scriptElm);
            });
        }
        await scriptElm.loadPromise;
        return scriptElm.exports
            || (() => { throw new Error("Script module has no exports: " + relativeScriptURL); })()
    };

    if(!customElements.get('audio-source-loader'))
        customElements.define('audio-source-loader', AudioSourceLoader);

    const thisScriptPath = 'audio-source-player-loader.js';
    const thisScript = customElements.get('audio-source-loader').findScript(thisScriptPath);
    const basePathURL = thisScript.src.replace(document.location.origin, '').replace(thisScriptPath, '');

    const req = AudioSourceLoader.requireAsync;

    await req('../common/audio-source-song.js');
    await req('../common/audio-source-storage.js');
    await req('../common/audio-source-ui.js');
    await req('../common/audio-source-values.js');
    await req('../common/audio-source-file-service.js');
    await req('../common/audio-source-utilities.js');

    await req('../player/audio-source-player-renderer.js');
    await req('../player/audio-source-player-actions.js');
    await req('../player/audio-source-player.js');
})();