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
    const {
        ASUIComponent,
        ASUIDiv,
        AudioSourceUIButton,
        AudioSourceUIFileInput,
        AudioSourceUIRangeInput,
        AudioSourceUITextInput,
        AudioSourceUIIcon,
    } = await requireAsync('common/audio-source-ui.js');

    // const {AudioSourcePlayerActions} = await requireAsync('player/audio-source-player-actions.js');
    /**
     * Player requires a modern browser
     */

    class ASPUIPanel extends ASUIDiv {
        constructor(key, caption, contentCallback) {
            super(key, contentCallback);
            this.state.caption = caption;
        }

        async render() {
            return [
                new ASUIDiv('caption', this.state.caption),
                super.render()
            ]
        }
    }
    customElements.define('aspui-panel', ASPUIPanel);

    class ASPUIForm extends ASPUIPanel {}
    customElements.define('aspui-form', ASPUIForm);


    class ASPUIMenu extends ASUIMenu {}
    customElements.define('aspui-menu', ASUIMenu);


    class AudioSourcePlayerRenderer extends ASUIComponent {

        async render() {
            return [
                new ASUIDiv('asp-menu-container', () => [
                    new ASPUIMenu('File'),
                    new ASPUIMenu('Edit'),
                    new ASPUIMenu('View'),
                ]),

                new ASUIDiv('asp-form-container', () => [
                    new ASPUIPanel('asp-panel-song', 'Song', () => [
                        new ASPUIForm('asp-form-playback', 'Playback', () => [
                            this.fieldSongPlaybackPlay = new AudioSourceUIButton('play',
                                e => this.playlistPlay(e),
                                new AudioSourceUIIcon('play'),
                                "Play Song",
                                {class: 'hide-on-playing'}),
                            this.fieldSongPlaybackPause = new AudioSourceUIButton('pause',
                                e => this.songPause(e),
                                new AudioSourceUIIcon('pause'),
                                "Pause Song",
                                {class: 'show-on-playing'}),
                            this.fieldSongPlaybackStop = new AudioSourceUIButton('stop',
                                e => this.songStop(e),
                                new AudioSourceUIIcon('stop'),
                                "Stop Song"),
                            this.fieldSongPlaylistNext = new AudioSourceUIButton('playlist-next',
                                e => this.playlistNext(e),
                                new AudioSourceUIIcon('next'),
                                "Next Song")
                        ]),

                        new ASPUIForm('asp-form-file', 'File', () => [
                            this.fieldSongFileLoad = new AudioSourceUIFileInput('file-load',
                                e => this.loadSongFromFileInput(),
                                new AudioSourceUIIcon('file-load'),
                                `.json,.mid,.midi`,
                                "Load Song from File"
                            ),
                            this.fieldSongFileSave = new AudioSourceUIButton('file-save',
                                e => this.saveSongToFile(),
                                new AudioSourceUIIcon('file-save'),
                                "Save Song to File"
                            ),
                        ]),

                        new ASPUIForm('asp-form-volume', 'File', () => [
                            this.fieldSongVolume = new AudioSourceUIRangeInput('volume',
                                (e, newVolume) => this.setSongVolume(e, newVolume), 1, 100, 'Song Volume', this.song.getVolumeValue())
                        ]),

                        new ASPUIForm('asp-form-timing', 'Timing', () => [
                            this.fieldSongTiming = AudioSourceUITextInput('timing',
                                (e, pos) => this.setSongPosition(e, pos),
                                'Song Timing',
                                '00:00:000'
                            )
                        ]),

                        new ASPUIForm('asp-form-position', 'Position', () => [
                            this.fieldSongPosition = AudioSourceUIRangeInput('position',
                                (e, pos) => this.setSongPosition(e, pos),
                                0,
                                Math.ceil(this.song.getSongLength()),
                                'Song Position',
                                0
                            )
                        ]),

                        new ASPUIForm('asp-form-name', 'Name', () => [
                            this.fieldSongName = AudioSourceUITextInput('name',
                                (e, newSongName) => this.setSongName(e, newSongName), "Song Name")
                        ]),

                        new ASPUIForm('asp-form-version', 'Version', () => [
                            this.fieldSongVersion = new AudioSourceUITextInput('version',
                                (e, newSongVersion) => this.setSongVersion(e, newSongVersion))
                        ])
                    ]),

                    new ASPUIPanel('asp-panel-playlist', 'Playlist', () => [
                        new ASPUIPlaylist('asp-playlist-container')
                    ])
                ]),


            ];

        }

        async render2() {



            let divElm = this.containerElm;
            divElm.addDiv('asp-menu-container', (divElm) => {
                this.menuFile = divElm.addSubMenu('File', divElm => this.populateMenu(divElm, 'file'));
                this.menuEdit = divElm.addSubMenu('Edit', divElm => this.populateMenu(divElm, 'edit'));
                this.menuView = divElm.addSubMenu('View', divElm => this.populateMenu(divElm, 'view'));
            });

            divElm.addDiv('asp-form-container', (divElm) => {

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
                        this.playlistEntryElms = [];
                        for(let i=0; i<this.playlist.length; i++) {
                            this.playlistEntryElms[i] = gridElm.addGridRow(i, (rowElm) => {
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


    }
    customElements.define('asp-renderer', AudioSourcePlayerRenderer);




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