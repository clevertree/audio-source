(async function() {

    /** Register This Async Module **/
    const _module = typeof module !== "undefined" ? module : findThisScript();
    _module.promise = new Promise((resolve) => _module.resolve = resolve);

    /** Required Modules **/
    // const {AudioSourceValues} = await requireAsync('common/audio-source-values.js');
    // const {AudioSourceLibrary} = await requireAsync('common/audio-source-library.js');

    const {AudioSourcePlayerActions} = await requireAsync('player/audio-source-player-actions.js');
    /**
     * Player requires a modern browser
     */

    class AudioSourcePlayerRenderer extends AudioSourcePlayerActions {

        async render(force=false) {
            const linkHRefComposer = this.getScriptDirectory('player/assets/audio-source-player-internal.css');
            const linkHRefCommon = this.getScriptDirectory('common/assets/audio-source-common.css');

            if(force || !this.shadowDOM) {
                this.shadowDOM = this.shadowDOM || this.attachShadow({mode: 'open'});
                this.shadowDOM.innerHTML = `
                <link rel="stylesheet" href="${linkHRefComposer}" />
                <link rel="stylesheet" href="${linkHRefCommon}" />
                `;
                const {AudioSourceUIDiv} = await requireAsync('common/audio-source-ui.js');
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
                        this.fieldSongPlaybackPlay.classList.add('hide-on-playing');
                        this.fieldSongPlaybackPause = divElm.addButtonInput('pause',
                            e => this.songPause(e),
                            divElm.createIcon('pause'),
                            "Pause Song");
                        this.fieldSongPlaybackPause.classList.add('show-on-playing');
                        // this.fieldSongPlaybackPause.disabled = true;
                        this.fieldSongPlaybackStop = divElm.addButtonInput('stop',
                            e => this.songStop(e),
                            divElm.createIcon('stop'),
                            "Stop Song");
                        // this.fieldSongPlaybackStop.classList.add('show-on-playing');
                    });

                    divElm.addDiv('asp-form-file', divElm => {
                        divElm.classList.add('asp-form');
                        divElm.addDiv('caption', 'File');
                        this.fieldSongFileLoad = divElm.addFileInput('file-load',
                            e => this.loadSongFromFileInput(),
                            divElm.createIcon('file-load'),
                            `.json,.mid,.midi`,
                            "Load Song from File"
                        );
                        this.fieldSongFileSave = divElm.addButtonInput('file-save',
                            e => this.saveSongToFile(),
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
                            headerRowElm.addDiv('url', 'URL');
                            headerRowElm.addDiv('length', 'Length');
                        });
                        for(let i=0; i<this.playlist.length; i++) {
                            gridElm.addGridRow(i, (rowElm) => {
                                const i = parseInt(rowElm.key);
                                const entry = this.playlist[i];
                                const formattedLength = new Date(entry.length * 1000).toISOString().substr(14, 5);
                                rowElm.classList.add('asp-playlist-entry');
                                rowElm.addDiv('id', i);
                                rowElm.addDiv('name', entry.name);
                                rowElm.addDiv('url', entry.url);
                                rowElm.addDiv('length', formattedLength);
                                rowElm.classList.toggle('selected', this.playlistPosition === i);
                                rowElm.addEventListener('click', async e => {
                                    await this.loadSongFromPlaylistEntry(i);
                                    await this.songPlay();
                                })
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

            this.fieldSongName.value = this.song.getName();
            this.fieldSongVersion.value = this.song.getVersion();

            this.fieldSongVolume.value = this.song.getVolumeValue();

        }



        populateMenu(divElm, menuKey) {
            /** File Menu **/
            switch(menuKey) {
                case 'file':
                    divElm.addSubMenu('from Memory ►',
                        async (divElm) => {
                            const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
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
                    let menu = divElm.addActionMenu('from URL');
                    menu.disabled = true;

                    break;

                case 'view':
                    divElm.addActionMenu(`${this.classList.contains('fullscreen') ? 'Disable' : 'Enable'} Fullscreen`, (e) => this.toggleFullscreen(e));
                    divElm.addActionMenu(`${this.classList.contains('hide-panel-song') ? 'Show' : 'Hide'} Song Forms`, (e) => this.togglePanelSong(e));
                    divElm.addActionMenu(`${this.classList.contains('hide-panel-playlist') ? 'Show' : 'Hide'} Playlist`, (e) => this.togglePanelPlaylist(e));
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


    /** Finish Registering Async Module **/
    _module.exports = {AudioSourcePlayerRenderer};
    _module.resolve(); // Resolve async promise
    delete _module.resolve;
    delete _module.promise;

    /** Module Loader Methods **/
    function findThisScript() {
        const SCRIPT_PATH = 'player/audio-source-player-renderer.js';
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