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
        customElements.define('audio-source-loader', AudioSourceLoader);

    const thisScriptPath = 'audio-source-composer-loader.js';
    const thisScript = customElements.get('audio-source-loader').findScript(thisScriptPath);
    const basePathURL = thisScript.src.replace(document.location.origin, '').replace(thisScriptPath, '');

    const require = AudioSourceLoader.getRequireAsync(thisScript);

    await require('../assets/3rdparty/LZString/lz-string.min.js');


    await require('../common/ui/asui-component.js');
    // await require('../common/ui/asui-grid.js');
    await require('../common/ui/asui-menu.js');
    await require('../common/ui/asui-input-button.js');
    await require('../common/ui/asui-input-checkbox.js');
    await require('../common/ui/asui-input-file.js');
    await require('../common/ui/asui-input-range.js');
    await require('../common/ui/asui-input-select.js');
    await require('../common/ui/asui-input-text.js');

    await require('../common/audio-source-song.js');
    await require('../common/audio-source-storage.js');
    await require('../common/audio-source-library.js');
    await require('../common/audio-source-values.js');
    await require('../common/audio-source-file-service.js');

    await require('./ui/ascui-header.js');
    await require('./ui/ascui-tracker.js');
    await require('../composer/audio-source-composer-renderer.js');
    await require('../composer/audio-source-composer-actions.js');
    await require('../composer/audio-source-composer-keyboard.js');
    await require('../composer/audio-source-composer.js');
})();
