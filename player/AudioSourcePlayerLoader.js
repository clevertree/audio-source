(async function() {

    class AudioSourceLoader extends HTMLElement {
        constructor() {
            super();
        }

        /** Append CSS */
        static appendCSS(cssPath, destination=null) {
            destination = destination || document.head;

            const linkHRef = AudioSourceLoader.resolveURL(cssPath);
            let linkElms = destination.querySelectorAll('link');
            for(let i=0; i<linkElms.length; i++) {
                if(linkElms[i].href.endsWith(linkHRef))
                    return;
            }
            const linkElm = document.createElement('link');
            linkElm.setAttribute('rel', 'stylesheet');
            linkElm.setAttribute('href', linkHRef);
            destination.insertBefore(linkElm, destination.firstChild);
            return linkElm;
        }

        static getRequire(sourceScriptElm) {
            // const sourceScriptElm = AudioSourceLoader.findScript(sourceScriptElm);
            return function(relativeScriptPath) {
                const absScriptPath = new URL(relativeScriptPath, sourceScriptElm.src);
                let scriptElm = AudioSourceLoader.findScript(absScriptPath);
                return scriptElm.exports
                    || (() => {throw new Error("Script module has no exports: " + absScriptPath);})()
            }
        }

        static getRequireAsync(sourceScriptElm) {
            // const sourceScriptElm = AudioSourceLoader.findScript(sourceScriptPath);
            return async function(relativeScriptPath) {
                const absScriptPath = new URL(relativeScriptPath, sourceScriptElm.src);
                let scriptElm = AudioSourceLoader.findScript(absScriptPath, false);
                if(!scriptElm) {
                    scriptElm = document.createElement('script');
                    scriptElm.src = absScriptPath;
                    scriptElm.loadPromise = new Promise(async (resolve, reject) => {
                        scriptElm.onload = resolve;
                        document.head.appendChild(scriptElm);
                    });
                }
                await scriptElm.loadPromise;
                return scriptElm.exports
                    || (() => {throw new Error("Script module has no exports: " + absScriptPath);})()
            }
        }

        static findScript(relativeScriptURL, throwException = true) {
            // relativeScriptURL = AudioSourceLoader.resolveURL(relativeScriptURL);
            const scriptElm = document.head.querySelector(`script[src$="${relativeScriptURL}"]`);
            if (!scriptElm && throwException)
                throw new Error("Required script not found: " + relativeScriptURL);
            return scriptElm;
        }

        // static getBasePath() { return basePathURL; }
    }

    if(!customElements.get('audio-source-loader'))
        // customElements.define('audio-source-loader', AudioSourceLoader);

    const thisScriptPath = 'audio-source-player-loader.js';
    const thisScript = AudioSourceLoader.findScript(thisScriptPath);
    // const basePathURL = new URL('../', thisScript.src); //thisScript.src.replace(document.location.origin, '').replace(thisScriptPath, '');

    const require = AudioSourceLoader.getRequireAsync(thisScript);

    await require('../assets/3rdparty/LZString/lz-string.min.js');


    await require('../common/ui/ASUIComponent.js');
    // await require('../common/ui/ASUIGrid.js');
    await require('../common/ui/ASUIMenu.js');
    await require('../common/ui/ASUIInputButton.js');
    await require('../common/ui/ASUIInputCheckbox.js');
    await require('../common/ui/ASUIInputFile.js');
    await require('../common/ui/ASUIInputRange.js');
    await require('../common/ui/ASUIInputSelect.js');
    await require('../common/ui/ASUIInputText.js');

    await require('../common/AudioSourceSong.js');
    await require('../common/AudioSourceStorage.js');
    await require('../common/AudioSourceLibrary.js');
    await require('../common/AudioSourceValues.js');
    await require('../common/AudioSourceFileService.js');

    await require('audio-source/player/ui/aspui-playlist-entry.js');
    await require('audio-source/player/ui/aspui-playlist.js');
    await require('audio-source/player/ui/aspui-header.js');

    await require('src/audio-source/player/AudioSourcePlayerRenderer.js');
    await require('src/audio-source/player/AudioSourcePlayerActions.js');
    await require('src/audio-source/player/AudioSourcePlayer.js');


})();
