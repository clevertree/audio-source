(async function() {

    /** Register Script Exports **/
    function getThisScriptPath() { return 'player/audio-source-player-renderer.js'; }
    const exportThisScript = function(module) {
        module.exports = {AudioSourcePlayerRenderer};
    };

    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();




    /** Required Modules **/
    // const {AudioSourceValues} = await requireAsync('common/audio-source-values.js');
    // const {AudioSourceLibrary} = await requireAsync('common/audio-source-library.js');
    const {
        ASUIComponent,
        ASUIDiv,
        ASUIMenu,
        ASUIGrid,
        ASUIGridRow,
        ASUIButton,
        ASUIFileInput,
        ASUIRangeInput,
        ASUITextInput,
        ASUIcon,
    } = await requireAsync('common/audio-source-ui.js');

    class AudioSourcePlayerRenderer extends ASUIComponent {
        constructor(playerElm, props={}) {
            super({
                fullscreen: false,
                showPanelSong: true,
                showPanelPlaylist: true,
            }. props);
            this.playerElm = playerElm;
        }

        async render() {
            return [
                new ASUIDiv('asp-menu-container', () => [
                    new ASUIMenu('File', () => [
                        new ASUIMenu('from Memory', async () => {
                            const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
                            const Storage = new AudioSourceStorage();
                            const songRecentUUIDs = await Storage.getRecentSongList() ;
                            return songRecentUUIDs.map(entry => new ASUIMenu(entry.name || entry.uuid,
                                null, () => this.loadSongFromMemory(entry.uuid)));
                        }),

                        new ASUIMenu('from File', null, (e) => this.fieldSongFileLoad.inputElm.click()),
                        new ASUIMenu('from URL', null, null, {disabled: true}),
                    ]),
                    new ASUIMenu('Edit'),
                    new ASUIMenu('View', () => [
                        new ASUIMenu(`${this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen`, null, (e) => this.toggleFullscreen(e)),
                        new ASUIMenu(`${this.state.showPanelSong ? 'Show' : 'Hide'} Song Forms`, null, (e) => this.togglePanelSong(e)),
                        new ASUIMenu(`${this.state.showPanelPlaylist ? 'Show' : 'Hide'} Playlist`, null, (e) => this.togglePanelPlaylist(e)),
                    ]),
                ]),

                new ASUIDiv('asp-form-container', () => [
                    new ASPUIPanel('asp-panel-song', 'Song', () => [
                        new ASPUIForm('asp-form-playback', 'Playback', () => [
                            this.fieldSongPlaybackPlay = new ASUIButton('play',
                                e => this.playlistPlay(e),
                                new ASUIcon('play'),
                                "Play Song",
                                {class: 'hide-on-playing'}),
                            this.fieldSongPlaybackPause = new ASUIButton('pause',
                                e => this.songPause(e),
                                new ASUIcon('pause'),
                                "Pause Song",
                                {class: 'show-on-playing'}),
                            this.fieldSongPlaybackStop = new ASUIButton('stop',
                                e => this.songStop(e),
                                new ASUIcon('stop'),
                                "Stop Song"),
                            this.fieldSongPlaylistNext = new ASUIButton('playlist-next',
                                e => this.playlistNext(e),
                                new ASUIcon('next'),
                                "Next Song")
                        ]),

                        new ASPUIForm('asp-form-file', 'File', () => [
                            this.fieldSongFileLoad = new ASUIFileInput('file-load',
                                e => this.loadSongFromFileInput(),
                                new ASUIcon('file-load'),
                                `.json,.mid,.midi`,
                                "Load Song from File"
                            ),
                            this.fieldSongFileSave = new ASUIButton('file-save',
                                e => this.saveSongToFile(),
                                new ASUIcon('file-save'),
                                "Save Song to File"
                            ),
                        ]),

                        new ASPUIForm('asp-form-volume', 'File', () => [
                            this.fieldSongVolume = new ASUIRangeInput('volume', 
                                (e, newVolume) => this.setSongVolume(e, newVolume), 1, 100, 'Song Volume', this.playerElm.song.getVolumeValue())
                        ]),

                        new ASPUIForm('asp-form-timing', 'Timing', () => [
                            this.fieldSongTiming = new ASUITextInput('timing',
                                (e, pos) => this.setSongPosition(e, pos),
                                'Song Timing',
                                '00:00:000'
                            )
                        ]),

                        new ASPUIForm('asp-form-position', 'Position', () => [
                            this.fieldSongPosition = new ASUIRangeInput('position',
                                (e, pos) => this.setSongPosition(e, pos),
                                0,
                                Math.ceil(this.playerElm.song.getSongLength()),
                                'Song Position',
                                0
                            )
                        ]),

                        new ASPUIForm('asp-form-name', 'Name', () => [
                            this.fieldSongName = new ASUITextInput('name',
                                (e, newSongName) => this.setSongName(e, newSongName), "Song Name")
                        ]),

                        new ASPUIForm('asp-form-version', 'Version', () => [
                            this.fieldSongVersion = new ASUITextInput('version',
                                (e, newSongVersion) => this.setSongVersion(e, newSongVersion))
                        ])
                    ]),

                    new ASPUIPanel('asp-panel-playlist', 'Playlist',  () => [
                        this.playlistElm = new ASPUIPlaylist(() => this.playerElm.playlist)
                    ]),
                ]),

                new ASUIDiv('asp-status-container', () => [
                    this.textStatus = new ASUIDiv('status-text'),
                    this.textVersion = new ASUIDiv('version-text'),
                ])

            ];

            // this.containerElm.classList.toggle('fullscreen', this.classList.contains('fullscreen'));
            //
            // this.fieldSongName.value = this.song.getName();
            // this.fieldSongVersion.value = this.song.getVersion();
            //
            // this.fieldSongVolume.value = this.song.getVolumeValue();

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


    class ASPUIPlaylist extends ASUIComponent {
        constructor(playlist, props={}) {
            super({}, props);
            this.state = {
                position: 0,
                playlist: playlist
            };
        }

        async render() {
            let playlist = this.state.playlist;
            if(typeof playlist === "function")
                playlist = playlist();
            return [
                new ASUIGrid('asp-playlist-container', () => [
                    new ASUIGridRow('header', () => [
                        new ASUIDiv('id', 'ID'),
                        new ASUIDiv('name', 'Name'),
                        new ASUIDiv('url', 'URL'),
                        new ASUIDiv('length', 'Length'),
                    ], {class: 'asp-playlist-header'}),
                    playlist.map((entry, i) => {
                        const [length, fade] = (entry.length || 0).toString().split(':');
                        const formattedLength = new Date(length * 1000).toISOString().substr(14, 5);
                        // rowElm.addEventListener('click', async e => {
                        //     await this.loadSongFromPlaylistEntry(i);
                        //     await this.songPlay();
                        // })

                        return new ASUIGridRow(i, () => [
                            new ASUIDiv('id', i),
                            new ASUIDiv('name', entry.name),
                            new ASUIDiv('url', entry.url),
                            new ASUIDiv('length', formattedLength),
                        ], {class: this.state.position === i ? 'selected' : null})
                    })
                ])
            ];
        }
    }
    customElements.define('asp-playlist', ASPUIPlaylist);



    class ASPUIPanel extends ASUIDiv {
        constructor(key, caption, contentCallback, props={}) {
            super(key, contentCallback, props);
            this.state.caption = caption;
        }

        async render() {
            return [
                new ASUIDiv('caption', this.state.caption),
                super.render()
            ]
        }
    }
    customElements.define('asp-panel', ASPUIPanel);

    class ASPUIForm extends ASPUIPanel {}
    customElements.define('asp-form', ASPUIForm);





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