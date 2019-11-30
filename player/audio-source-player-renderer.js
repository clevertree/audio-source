(async function() {

    /** Register Script Exports **/
    function getThisScriptPath() { return 'player/audio-source-player-renderer.js'; }
    const exportThisScript = function(module) {
        module.exports = {AudioSourcePlayerRenderer};
    }

    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();




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
                const {AudioSourceUIDiv} = await requireAsync('common/audio-source-ui.js');
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
                            e => this.playlistPlay(e),
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

                        this.fieldSongPlaylistNext = divElm.addButtonInput('playlist-next',
                            e => this.playlistNext(e),
                            divElm.createIcon('next'),
                            "Next Song");
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

                    divElm.addDiv('asp-form-timing', divElm => {
                        divElm.classList.add('asp-form');
                        divElm.addDiv('caption', 'Timing');
                        this.fieldSongTiming = divElm.addTextInput('timing',
                            (e, pos) => this.setSongPosition(e, pos),
                            'Song Timing',
                            '00:00:000'
                        );
                    });

                    divElm.addDiv('asp-form-position', divElm => {
                        divElm.classList.add('asp-form');
                        divElm.addDiv('caption', 'Position');
                        this.fieldSongPosition = divElm.addRangeInput('position',
                            (e, pos) => this.setSongPosition(e, pos),
                            0,
                            Math.ceil(this.song.getSongLength()),
                            'Song Position',
                            0
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
                                const [length, fade] = (entry.length || 0).toString().split(':');
                                const formattedLength = new Date(length * 1000).toISOString().substr(14, 5);
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