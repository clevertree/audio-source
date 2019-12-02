(async function() {

    /** Register Script Exports **/
    function getThisScriptPath() { return 'player/audio-source-player.js'; }
    const exportThisScript = function(module) {
        module.exports = {AudioSourcePlayerElement};
    }

    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();


    /** Required Modules **/
    // const {AudioSourceValues} = await requireAsync('common/audio-source-values.js');
    // const {AudioSourceLibrary} = await requireAsync('common/audio-source-library.js');

    // const {ASUIDiv} = await requireAsync('common/audio-source-ui.js');
    const {AudioSourcePlayerRenderer} = await requireAsync('player/audio-source-player-renderer.js');
    const {AudioSourcePlayerActions} = await requireAsync('player/audio-source-player-actions.js');
    const {AudioSourceValues} = await requireAsync('common/audio-source-values.js');
    const {AudioSourceFileService} = await requireAsync('common/audio-source-file-service.js');
    /**
     * Player requires a modern browser
     */

    // const fs = new AudioSourceFileService();
    // setTimeout(async e => {
    //     const torrentID = "005ff6b3e47f34ad254b301481561d3145187467";
    //     const torrent = await fs.getTorrent(torrentID);
    //     console.log(torrent.files);
    //     torrent.files[50].getBuffer(async function(err, buffer) {
    //         if(err) throw new Error(err);
    //         const files = await fs.decompress7ZipArchive(buffer);
    //         console.log(files);
    //     });
    // }, 1000);

    class AudioSourcePlayerElement extends AudioSourcePlayerActions {
        constructor() {
            super();
            this.versionString = '-1';
            this.eventHandlers = [];
            this.shadowDOM = null;
            this.playlist = [];
            this.playlistPosition = 0;
            this.playlistActive = false;
            this.rendererElm = new AudioSourcePlayerRenderer(this)
        }

        get targetElm() { return this.shadowDOM; }

        connectedCallback() {
            const linkHRefComposer = this.getScriptDirectory('player/assets/audio-source-player-internal.css');
            const linkHRefCommon = this.getScriptDirectory('common/assets/audio-source-common.css');
            this.shadowDOM = this.attachShadow({mode: 'open'});
            this.shadowDOM.innerHTML = `
                <link rel="stylesheet" href="${linkHRefComposer}" />
                <link rel="stylesheet" href="${linkHRefCommon}" />
                `;



            this.loadCSS();
            super.connectedCallback();

            this.addEventHandler([
                'song:loaded','song:play','song:end','song:stop','song:modified', 'song:seek',
                'group:play', 'group:seek',
                'note:start', 'note:end'
            ], this.onSongEvent);
            // document.addEventListener('instrument:loaded', e => this.onSongEvent(e));

            this.addEventHandler(['keyup', 'keydown', 'click', 'dragover', 'drop'], e => this.onInput(e), this.shadowDOM, true);

            const url = this.getAttribute('src') || this.getAttribute('url');
            if(url) {
                this.loadSongFromURL(url);
            }


        }


        async render() {
            console.log("TODO: rerender?");
            return [
                this.rendererElm
            ];
        }
        /** Load External CSS **/

        loadCSS() {
            const CSS_PATH = 'player/assets/audio-source-player.css';
            const targetDOM = this.shadowDOM || document.head;
            if (targetDOM.querySelector(`link[href$="${CSS_PATH}"]`))
                return;

            const linkHRef = this.getScriptDirectory(CSS_PATH);
            let cssLink = document.createElement("link");
            cssLink.setAttribute("rel", "stylesheet");
            cssLink.setAttribute("type", "text/css");
            cssLink.setAttribute("href", linkHRef);
            targetDOM.appendChild(cssLink);
        }


        async onSongEvent(e) {
            switch(e.type) {
                case 'song:seek':
                    this.updateSongPositionValue(e.detail.position);

                    break;

                case 'song:volume':
                    this.rendererElm.fieldSongVolume.value = e.detail.volume;
                    break;

                case 'song:play':
                    this.containerElm.classList.add('playing');
                    if(e.detail.promise) {
                        await e.detail.promise;
                        this.containerElm.classList.remove('playing');
                    }

                    this.rendererElm.fieldSongPlaybackPause.disabled = false;
                    const updateSongPositionInterval = setInterval(e => {
                        if (!this.song.isPlaying) {
                            clearInterval(updateSongPositionInterval);
                            this.rendererElm.fieldSongPlaybackPause.disabled = true;
                            this.containerElm.classList.remove('playing');
                            this.classList.remove('playing');
                        }
                        this.updateSongPositionValue(this.song.songPlaybackPosition);
                    }, 10);
                    break;

                case 'song:end':
                case 'song:pause':
                    this.containerElm.classList.remove('playing');
                    break;
            }
        }



        getScriptDirectory(appendPath=null) {
            return findThisScript()[0].basePath + appendPath;
        }

        setStatus(newStatus) {
            this.rendererElm.textStatus.content = newStatus;
            console.info.apply(null, arguments); // (newStatus);
        }

        handleError(err) {
            this.statusElm.innerHTML = `<span style="red">${err}</span>`;
            console.error(err);
            // if(this.webSocket)
        }

        setVersion(versionString) {
            this.versionString = versionString;
            this.versionElm.innerHTML = versionString;
        }


        closeAllMenus() {
            this.shadowDOM.querySelector(`asui-menu`)
                .closeAllMenus();
        }


        /** Playback **/


        updateSongPositionValue(playbackPositionInSeconds) {
            const values = new AudioSourceValues();
            const roundedSeconds = Math.round(playbackPositionInSeconds);
            this.rendererElm.fieldSongTiming.value = values.formatPlaybackPosition(playbackPositionInSeconds);
            if(this.rendererElm.fieldSongPosition.value !== roundedSeconds) {
                this.rendererElm.fieldSongPosition.value = roundedSeconds;
            }
        }


        getAudioContext()               { return this.song.getAudioContext(); }
        getVolumeGain()                 { return this.song.getVolumeGain(); }

        getVolume () {
            if(this.volumeGain) {
                return this.volumeGain.gain.value * 100;
            }
            return AudioSourcePlayerElement.DEFAULT_VOLUME * 100;
        }
        setVolume (volume) {
            const gain = this.getVolumeGain();
            if(gain.gain.value !== volume) {
                gain.gain.value = volume / 100;
                console.info("Setting volume: ", volume);
            }
        }

        // Rendering
        get statusElm() { return this.shadowDOM.querySelector(`asui-div[key=asp-status-container] asui-div[key=status-text]`); }
        get versionElm() { return this.shadowDOM.querySelector(`asui-div[key=asp-status-container] asui-div[key=version-text]`); }


        toggleFullscreen(e) {
            const setFullScreen = !this.classList.contains('fullscreen');
            this.containerElm.classList.toggle('fullscreen', setFullScreen);
            this.classList.toggle('fullscreen', setFullScreen);
        }


        // Input

        onInput(e) {
            if(e.defaultPrevented)
                return;
            switch(e.type) {
                case 'click':
                    break;
                case 'dragover':
                    e.stopPropagation();
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                    break;
                case 'drop':
                    e.stopPropagation();
                    e.preventDefault();
                    var files = e.dataTransfer.files; // Array of all files
                    this.loadSongFromFileInput(files[0]);
                    console.log(files);
                    break;
            }
        }

    }
    AudioSourcePlayerElement.DEFAULT_VOLUME = 0.3;

    // Define custom elements
    customElements.define('audio-source-player', AudioSourcePlayerElement);

    // MusicPlayerElement.loadStylesheet('client/player/audio-source-player.css');



    /** Export this script **/
    registerModule(exportThisScript);

    /** Finish Registering Async Module **/
    resolveExports();



    /** Module Loader Methods **/
    function registerAsyncModule() {
        let resolve;
        const promise = new Promise((r) => resolve = r);
        registerModule(module => {
            module.promises = (module.promises || []).concat(promise);
        });
        return resolve;
    }
    function registerModule(callback) {
        if(typeof window === 'undefined')
            callback(module);
        else findThisScript()
            .forEach(scriptElm => callback(scriptElm))
    }

    function findThisScript() {
        return findScript(getThisScriptPath());
    }

    function findScript(scriptURL) {
        let scriptElms = document.head.querySelectorAll(`script[src$="${scriptURL}"]`);
        scriptElms.forEach(scriptElm => {
            scriptElm.relativePath = scriptURL;
            scriptElm.basePath = scriptElm.src.replace(document.location.origin, '').replace(scriptURL, '');
        });
        return scriptElms;
    }

    async function requireAsync(relativeScriptPath) {
        if(typeof require !== "undefined")
            return require('../' + relativeScriptPath);

        let scriptElm = findScript(relativeScriptPath)[0];
        if(!scriptElm) {
            const scriptURL = findThisScript()[0].basePath + relativeScriptPath;
            scriptElm = document.createElement('script');
            scriptElm.src = scriptURL;
            scriptElm.promises = (scriptElm.promises || []).concat(new Promise(async (resolve, reject) => {
                scriptElm.onload = resolve;
                document.head.appendChild(scriptElm);
            }));
        }
        for (let i=0; i<scriptElm.promises.length; i++)
            await scriptElm.promises[i];
        return scriptElm.exports
            || (() => { throw new Error("Script module has no exports: " + relativeScriptPath); })()
    }



})();