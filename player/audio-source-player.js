(async function() {

    /** Register This Async Module **/
    const _module = typeof module !== "undefined" ? module : findThisScript();
    _module.promise = new Promise((resolve) => _module.resolve = resolve);

    /** Required Modules **/
    const {AudioSourceUtilities} = await requireAsync('common/audio-source-utilities.js');
    const {AudioSourceUIDiv} = await requireAsync('common/audio-source-ui.js');
    // const {AudioSourceValues} = await requireAsync('common/audio-source-values.js');
    // const {AudioSourceLibrary} = await requireAsync('common/audio-source-library.js');
    const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');

    const {AudioSourcePlayerActions} = await requireAsync('player/audio-source-player-actions.js');
    /**
     * Player requires a modern browser
     */

    class AudioSourcePlayerElement extends AudioSourcePlayerActions {
        constructor() {
            super();
            this.versionString = '-1';
            this.eventHandlers = [];
            this.shadowDOM = null;
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
        connectedCallback() {
            this.loadCSS();

            this.attachEventHandler([
                'song:loaded','song:play','song:end','song:stop','song:modified', 'song:seek',
                'group:play', 'group:seek',
                'note:start', 'note:end'
            ], this.onSongEvent);
            document.addEventListener('instrument:loaded', e => this.onSongEvent(e));

            this.attachEventHandler(['keyup', 'keydown', 'click'], e => this.onInput(e), this.shadowDOM, true);

            const src = this.getAttribute('src');
            if(src) {
                this.loadSongFromSrc(src);
            }

            this.render();
        }

        disconnectedCallback() {
            this.eventHandlers.forEach(eventHandler =>
                eventHandler[2].removeEventListener(eventHandler[0], eventHandler[1]));
        }

        attachEventHandler(eventNames, method, context, options=null) {
            if(!Array.isArray(eventNames))
                eventNames = [eventNames];
            for(let i=0; i<eventNames.length; i++) {
                const eventName = eventNames[i];
                context = context || this;
                context.addEventListener(eventName, method, options);
                this.eventHandlers.push([eventName, method, context]);
            }
        }

        async onSongEvent(e) {
            switch(e.type) {
                case 'song:play':
                    this.classList.add('playing');
                    if(e.detail.promise) {
                        await e.detail.promise;
                        this.classList.remove('playing');
                    }
                    break;
                case 'song:end':
                case 'song:pause':
                    // this.classList.remove('playing');
                    break;
                case 'instrument:loaded':
                    // this.renderer.loadAllInstruments();
                    break;
            }
        }


        render(force=false) {
            const linkHRefComposer = this.getScriptDirectory('player/assets/audio-source-player-internal.css');
            const linkHRefCommon = this.getScriptDirectory('common/assets/audio-source-common.css');

            if(force || !this.shadowDOM) {
                this.shadowDOM = this.shadowDOM || this.attachShadow({mode: 'open'});
                this.shadowDOM.innerHTML = `
                <link rel="stylesheet" href="${linkHRefComposer}" />
                <link rel="stylesheet" href="${linkHRefCommon}" />
                `;
                this.containerElm = new AudioSourceUIDiv('asp-container');
                this.shadowDOM.appendChild(this.containerElm);
            }

            let divElm = this.containerElm;
            divElm.addDiv('asp-menu-container', (divElm) => {
                this.menuFile = divElm.addSubMenu('File', divElm => this.populateMenu(divElm, 'file'));
                this.menuEdit = divElm.addSubMenu('Edit', divElm => this.populateMenu(divElm, 'edit'));
                this.menuView = divElm.addSubMenu('View', divElm => this.populateMenu(divElm, 'view'));
            });

            divElm.addDiv('asp-form-container', (divElm) => {
                divElm.addDiv('asp-panel-song', (divElm) => {
                    divElm.classList.add('asp-panel');
                    divElm.addDiv('caption', 'Song');


                    divElm.addDiv('asp-form-playback', divElm => {
                        divElm.classList.add('asp-form');
                        divElm.addDiv('caption', 'Playback');
                        this.fieldSongPlaybackPlay = divElm.addButtonInput('play',
                            e => this.songPlay(e),
                            divElm.createIcon('play'),
                            "Play Song");
                        this.fieldSongPlaybackPause = divElm.addButtonInput('pause',
                            e => this.songPause(e),
                            divElm.createIcon('pause'),
                            "Pause Song");
                        this.fieldSongPlaybackPause.disabled = true;
                        this.fieldSongPlaybackStop = divElm.addButtonInput('pause',
                            e => this.songStop(e),
                            divElm.createIcon('stop'),
                            "Stop Song");
                    });

                    divElm.addDiv('asp-form-file', divElm => {
                        divElm.classList.add('asp-form');
                        divElm.addDiv('caption', 'File');
                        this.fieldSongFileLoad = divElm.addFileInput('file-load',
                            e => this.loadSongFromFileInput(e),
                            divElm.createIcon('file-load'),
                            `.json,.mid,.midi`,
                            "Load Song from File"
                        );
                        this.fieldSongFileSave = divElm.addButtonInput('file-save',
                            e => this.saveSongToFile(e),
                            divElm.createIcon('file-save'),
                            "Save Song to File"
                        );
                    });

                    divElm.addDiv('asp-form-volume', divElm => {
                        divElm.classList.add('asp-form');
                        divElm.addDiv('caption', 'Volume');
                        this.fieldSongVolume = divElm.addRangeInput('volume',
                            (e, newVolume) => this.setSongVolume(e, newVolume), 1, 100, 'Song Volume', this.song.getVolumeValue());
                    });

                    divElm.addDiv('asp-form-position', divElm => {
                        divElm.classList.add('asp-form');
                        divElm.addDiv('caption', 'Position');
                        this.fieldSongPosition = divElm.addTextInput('position',
                            e => this.setSongPosition(e),
                            'Song Position',
                            '00:00:000'
                        );
                    });

                    divElm.addDiv('asp-form-name', divElm => {
                        divElm.classList.add('asp-form');
                        divElm.addDiv('caption', 'Name');
                        this.fieldSongName = divElm.addTextInput('name',
                            (e, newSongName) => this.setSongName(e, newSongName), "Song Name");
                    });

                    divElm.addDiv('asp-form-version', divElm => {
                        divElm.classList.add('asp-form');
                        divElm.addDiv('caption', 'Version');
                        this.fieldSongVersion = divElm.addTextInput('version',
                            (e, newSongVersion) => this.setSongVersion(e, newSongVersion));
                    });
                });


                this.playlistContainerElm =
                divElm.addDiv('asp-panel-playlist', (divElm) => {
                    divElm.classList.add('asp-panel');
                    divElm.addDiv('caption', 'Playlist');
                    divElm.addGrid('asp-playlist-container', (gridElm) => {
                        gridElm.addGridRow('header', headerRowElm => {
                            headerRowElm.classList.add('asp-playlist-header');
                            headerRowElm.addDiv('id', 'ID');
                            headerRowElm.addDiv('name', 'Name');
                            headerRowElm.addDiv('length', 'Length');
                            headerRowElm.addDiv('url', 'URL');
                        });
                        for(let i=0; i<10; i++) {
                            gridElm.addGridRow(i, (rowElm) => {
                                rowElm.classList.add('asp-playlist-entry');
                                rowElm.addDiv('id', i);
                                rowElm.addDiv('name', 'Name');
                                rowElm.addDiv('length', 'Length');
                                rowElm.addDiv('url', 'URL');
                            });
                        }
                    });
                });
            });


            divElm.addDiv('asp-status-container', (divElm) => {
                divElm.addDiv('status-text');
                divElm.addDiv('version-text'); // TODO:        <a href="https://github.com/clevertree/audio-source-composer" target="_blank" class="version-text">${this.versionString}</a>
            });

            this.containerElm.classList.toggle('fullscreen', this.classList.contains('fullscreen'));

            this.updateSongForms();
        }



        populateMenu(divElm, menuKey) {
            /** File Menu **/
            switch(menuKey) {
                case 'file':
                    divElm.addSubMenu('Open ►', divElm => {
                        divElm.addSubMenu('from Memory ►',
                            async (divElm) => {
                                const Storage = new AudioSourceStorage();
                                const songRecentUUIDs = await Storage.getRecentSongList() ;
                                for(let i=0; i<songRecentUUIDs.length; i++) {
                                    const entry = songRecentUUIDs[i];
                                    divElm.addActionMenu(entry.name || entry.uuid, (e) => this.loadSongFromMemory(entry.uuid));
                                }
                            }
                        );

                        divElm.addActionMenu(`from File`, (e) => this.fieldSongFileLoad.inputElm.click()); // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
                        // menuFileOpenSongFromFile.disabled = true;
                        let menu = divElm.addActionMenu('url', 'from URL');
                        menu.disabled = true;
                    });

                    break;

            }
        }

        updateSongForms() {

            this.fieldSongPlaybackPause.disabled = true;

            this.fieldSongName.value = this.song.getName();
            this.fieldSongVersion.value = this.song.getVersion();

            this.fieldSongVolume.value = this.song.getVolumeValue();

        }


        getScriptDirectory(appendPath=null) {
            const Util = new AudioSourceUtilities;
            return Util.getScriptDirectory(appendPath, 'script[src$="audio-source-player.js"],script[src$="audio-source-player.min.js"]');
        }

        setStatus(newStatus) {
            this.statusElm.innerHTML = newStatus;
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

        // Rendering
        get statusElm() { return this.shadowDOM.querySelector(`asui-div[key=asp-status-container] asui-div[key=status-text]`); }
        get versionElm() { return this.shadowDOM.querySelector(`asui-div[key=asp-status-container] asui-div[key=version-text]`); }



        async loadSongFromSrc(src) {
            const Util = new AudioSourceUtilities;
            const songData = await Util.loadSongFromSrc(src);
            await this.song.loadSongData(songData);
            this.setStatus("Song loaded from src: " + src);
            this.render();
        }

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
            }
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

    }
    AudioSourcePlayerElement.DEFAULT_VOLUME = 0.3;

    // Define custom elements
    customElements.define('audio-source-player', AudioSourcePlayerElement);

    // MusicPlayerElement.loadStylesheet('client/player/audio-source-player.css');




    /** Finish Registering Async Module **/
    _module.exports = {AudioSourcePlayerElement};
    _module.resolve(); // Resolve async promise
    delete _module.resolve;
    delete _module.promise;

    /** Module Loader Methods **/
    function findThisScript() {
        const SCRIPT_PATH = 'player/audio-source-player.js';
        const thisScript = document.head.querySelector(`script[src$="${SCRIPT_PATH}"]`);
        if(!thisScript)
            throw new Error("Base script not found: " + SCRIPT_PATH);
        thisScript.relativePath = SCRIPT_PATH;
        thisScript.basePath = thisScript.src.replace(document.location.origin, '').replace(SCRIPT_PATH, '');
        return thisScript;
    }

    async function requireAsync(relativeScriptPath) {
        if(typeof require === "undefined") {
            let scriptElm = document.head.querySelector(`script[src$="${relativeScriptPath}"]`);
            if(!scriptElm) {
                const scriptURL = findThisScript().basePath + relativeScriptPath;
                await new Promise(async (resolve, reject) => {
                    scriptElm = document.createElement('script');
                    scriptElm.src = scriptURL;
                    scriptElm.onload = e => resolve();
                    document.head.appendChild(scriptElm);
                });
                if(scriptElm.promise instanceof Promise)
                    await scriptElm.promise;
            }
            return scriptElm.exports;
        } else {
            return require('../' + relativeScriptPath);
        }
    }

})();