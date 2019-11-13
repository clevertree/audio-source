(async function() {

    /** Required Modules **/
    const {AudioSourceUtilities} = await loadModule('common/audio-source-utilities.js');
    const {AudioSourceUIDiv} = await loadModule('common/audio-source-ui.js');
    const {AudioSourceValues} = await loadModule('common/audio-source-values.js');
    const {AudioSourceLibrary} = await loadModule('common/audio-source-library.js');
    const {AudioSourceSong} = await loadModule('common/audio-source-song.js');
    const {AudioSourceStorage} = await loadModule('common/audio-source-storage.js');

    /**
     * Player requires a modern browser
     */

    class MusicPlayerElement extends HTMLElement {
        constructor() {
            super();
            this.versionString = '-1';
            this.eventHandlers = [];
            this.shadowDOM = null;
            this.song = new AudioSourceSong({}, this);
        }

        getAudioContext()               { return this.song.getAudioContext(); }
        getVolumeGain()                 { return this.song.getVolumeGain(); }

        getVolume () {
            if(this.volumeGain) {
                return this.volumeGain.gain.value * 100;
            }
            return MusicPlayerElement.DEFAULT_VOLUME * 100;
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
                <asui-div key="asp-container"></asui-div>
                `;
                this.containerElm = this.shadowDOM.querySelector('asui-div[key=asp-container]');
            }

            let divElm = this.containerElm;
            divElm.addDiv('asp-menu-container', (divElm) => {
                this.menuFile = divElm.addMenu('File', divElm => this.populateMenu(divElm, 'file'));
                this.menuEdit = divElm.addMenu('Edit', divElm => this.populateMenu(divElm, 'edit'));
                this.menuView = divElm.addMenu('View', divElm => this.populateMenu(divElm, 'view'));
            });

            divElm.addDiv('asp-form-container', (divElm) => {
                divElm.addDiv('asp-form-panel-song', (divElm) => {
                    divElm.classList.add('asp-form-panel');
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
                    divElm.addMenu('New song',
                        (e) => this.loadNewSongData(e));

                    divElm.addMenu('Open song ►', divElm => {
                        divElm.addMenu('from Memory ►',
                            async (e) => {
                                const menu = e.menuElement;

                                const Storage = new AudioSourceStorage();
                                const songRecentUUIDs = await Storage.getRecentSongList() ;
                                for(let i=0; i<songRecentUUIDs.length; i++) {
                                    const entry = songRecentUUIDs[i];
                                    const menuOpenSongUUID = menu.getOrCreateSubMenu(entry.uuid, entry.title);
                                    menuOpenSongUUID.action = (e) => {
                                        this.loadSongFromMemory(entry.uuid);
                                    }
                                }

                            }
                        );

                        divElm.addMenu(`from File`, (e) => this.fieldSongFileLoad.inputElm.click()); // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
                        // menuFileOpenSongFromFile.disabled = true;
                        let menu = divElm.addMenu('url', 'from URL');
                        menu.disabled = true;
                    });

                    divElm.addMenu('Save song ►', divElm => {
                        divElm.addMenu('memory', 'to Memory', (e) => this.saveSongToMemory(e));
                        divElm.addMenu('file', 'to File', (e) => this.saveSongToFile(e));
                    });

                    divElm.addMenu('Import song ►', divElm => {
                        divElm.addMenu('midi', 'from MIDI File', (e) => this.fieldSongFileLoad.inputElm.click());
                        // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
                        // menuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
                        // menuFileImportSongFromMIDI.disabled = true;
                    });

                    let menu = divElm.addMenu('Export song ►', divElm => {
                        let menu = divElm.addMenu('to MIDI File');
                        menu.disabled = true;
                    });
                    menu.disabled = true;
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
            const songData = await Util.loadJSONFromURL(src);
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
    MusicPlayerElement.DEFAULT_VOLUME = 0.3;

    // Define custom elements
    customElements.define('audio-source-player', MusicPlayerElement);

    // MusicPlayerElement.loadStylesheet('client/player/audio-source-player.css');


    /** Module Loader **/

    async function loadModule(relativeModulePath) {
        if(typeof require === "undefined") {
            const baseScriptRelativePath = 'player/audio-source-player.js';
            const thisScript = document.head.querySelector(`script[src$="${baseScriptRelativePath}"]`);
            if(!thisScript) throw new Error("Base script not found");
            const baseURL = thisScript.src.replace(document.location.origin, '').replace(baseScriptRelativePath, '');
            const scriptURL = baseURL + relativeModulePath;
            let script = document.head.querySelector('script[src$="' + scriptURL + '"]');
            if(!script) {
                await new Promise((resolve, reject) => {
                    script = document.createElement('script');
                    script.src = scriptURL;
                    script.onload = e => resolve();
                    document.head.appendChild(script);
                });
            }
            return script;
        } else {
            return require('../' + relativeModulePath);
        }
    }
})();