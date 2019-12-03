(async function() {

    /** Register Script Exports **/
    function getThisScriptPath() { return 'player/audio-source-player-renderer.js'; }
    const exportThisScript = function(module) {
        module.exports = {
            AudioSourcePlayerRenderer,
            ASPPlaylist
        };
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
            this.playlistElm = new ASPPlaylist()

        }

        async render() {
            return [
                new ASUIDiv('asp-menu-container', () => [
                    new ASUIMenu('File', () => [
                        new ASUIMenu('from Memory ►', async () => {
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

                new ASUIDiv('asp-forms-container', () => [
                    new ASPPanel('song', 'Song', () => [
                        new ASPForm('playback', 'Playback', () => [
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

                        new ASPForm('file', 'File', () => [
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

                        new ASPForm('volume', 'Volume', () => [
                            this.fieldSongVolume = new ASUIRangeInput('volume', 
                                (e, newVolume) => this.setSongVolume(e, newVolume), 1, 100, 'Song Volume', this.playerElm.song.getVolumeValue())
                        ]),

                        new ASPForm('timing', 'Timing', () => [
                            this.fieldSongTiming = new ASUITextInput('timing',
                                (e, pos) => this.setSongPosition(e, pos),
                                'Song Timing',
                                '00:00:000'
                            )
                        ]),

                        new ASPForm('position', 'Position', () => [
                            this.fieldSongPosition = new ASUIRangeInput('position',
                                (e, pos) => this.setSongPosition(e, pos),
                                0,
                                Math.ceil(this.playerElm.song.getSongLength()),
                                'Song Position',
                                0
                            )
                        ]),

                        new ASPForm('name', 'Name', () => [
                            this.fieldSongName = new ASUITextInput('name',
                                (e, newSongName) => this.setSongName(e, newSongName),
                                "Song Name",
                                this.playerElm.song.name
                                )
                        ]),

                        new ASPForm('version', 'Version', () => [
                            this.fieldSongVersion = new ASUITextInput('version',
                                (e, newSongVersion) => this.setSongVersion(e, newSongVersion),
                                "Song Version",
                                this.playerElm.song.version)
                        ])
                    ]),

                    new ASPPanel('playlist', 'Playlist',  () => [
                        this.playerElm.playlist
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


    }
    customElements.define('asp-renderer', AudioSourcePlayerRenderer);


    class ASPPlaylist extends ASUIComponent {
        constructor(playlist=[], props={}) {
            super({}, props);
            this.state = {
                position: 0,
                playlist: playlist,
                selected: []
            };

            this.addEventHandler('click', e => this.onClick(e));
        }

        get position() { return this.state.position; }
        get playlist() { return this.state.playlist; }

        async clearPlaylist() {
            this.setState({playlist: []})
        }

        async updateNextPosition() {
            let position = this.state.position;
            position++;
            if (position >= this.state.playlist.length)
                position = 0;
            this.setState({position});
        }

        async updatePosition(position) {
            if(!this.state.playlist[position])
                throw new Error("Invalid playlist position: " + position);
            this.state.position = position;
            for(let i=0; i<this.state.playlist.length; i++) {
                const entry = this.state.playlist[i];
                await entry.updateProps();
            }
        }

        toggleSelect(position) {
            const selected = this.state.selected;
            const i = selected.indexOf(position);
            if(i === -1) {
                selected.push(position);
                selected.sort();
            } else {
                selected.splice(i, 1);
            }
            this.getEntry(position)
                .updateProps();
        }

        getCurrentEntry() {
            if(this.state.playlist.length === 0)
                throw new Error("Empty playlist");
            return this.getEntry(this.state.position);
        }

        getEntry(position) {
            const entry = this.state.playlist[position];
            if(!entry)
                throw new Error("Invalid playlist position: " + playlistPosition);
            return entry;
        }

        async addEntry(entry, skipDuplicate=true) {
            entry = new ASPPlaylistEntry(this, entry);
            if(skipDuplicate && this.state.playlist.find(e => e.url === entry.url)) {
                return false;
            }
            this.state.playlist.push(entry);
            await this.renderOS();
            return true;
        }

        async loadPlaylistFromData(playlistData, playlistURL, spliceAtPosition=null) {
            if(Array.isArray(playlistData))
                playlistData = {playlist: playlistData};
            let playlist = playlistData.playlist;
            let urlPrefix = playlistData.urlPrefix;
            if(!urlPrefix || urlPrefix[0] !== '/')
                urlPrefix = new URL(playlistURL).pathname.split("/").slice(0,-1).join("/") + '/' + (urlPrefix||'');
            if(!Array.isArray(playlist))
                throw new Error("Invalid playlist");
            let newPlaylist = [];
            for(let i=0; i<playlist.length; i++) {
                let entry = playlist[i];
                if(typeof entry === "object")   entry.url = urlPrefix + entry.url;
                else                            entry = urlPrefix + entry;
                newPlaylist.push(new ASPPlaylistEntry(this, entry));
            }
            if(spliceAtPosition === null) {
                await this.setState({playlist: newPlaylist});
            } else {
                newPlaylist = this.state.playlist.splice(spliceAtPosition, 1, ...newPlaylist);
                await this.setState({playlist: newPlaylist});
            }

        }


        async render() {
            return [
                new ASUIGridRow('header', () => [
                    new ASUIDiv('id', 'ID'),
                    new ASUIDiv('name', 'Name'),
                    // new ASUIDiv('url', 'URL'),
                    new ASUIDiv('length', 'Length'),
                ], {class: 'asp-playlist-header'}),
                new ASUIDiv('asp-playlist-container', () => [
                    this.state.playlist
                ]),
            ];
        }

        async onClick(e) {
            const entryElm = e.target.closest('aspp-entry');
            if(entryElm) {
                // entryElm.toggleSelect();
                await this.loadSongFromPlaylistEntry(entryElm.position);
                //     await this.songPlay();
            } else {
                console.log(e, this);
            }
        }
    }
    customElements.define('asp-playlist', ASPPlaylist);

    class ASPPlaylistEntry extends ASUIComponent {
        constructor(playlistElm, entry, props={}) {
            super({
                entry
            }, props);
            this.playlistElm = playlistElm;
        }

        get url() { return this.parseEntry().url; }
        get name() { return this.parseEntry().name; }
        get length() { return this.parseEntry().length; }
        get position() { return this.playlistElm.playlist.indexOf(this); }

        parseEntry() {
            let entry = this.state.entry;
            if(typeof entry === "string") {
                const split = entry.split(';');
                entry = {url: split[0]};
                if(split[1]) entry.name = split[1];
                if(split[2]) entry.length = split[2];
            }
            if(!entry.url)
                throw new Error("Invalid Playlist Entry URL");
            return entry;
        }

        toggleSelect() {
            this.playlistElm.toggleSelect(this.position);
        }

        async updateProps() {
            let classes = [];
            const position = this.position;
            if(position === this.playlistElm.position)
                classes.push('position');
            if(this.playlistElm.state.selected.indexOf(position) !== -1)
                classes.push('selected');
            classes = classes.join(' ');
            if((this.props.class||'') !== (classes||''))
                await this.setProps({class: classes});
        }

        render() {
            let i = this.position;
            if(i<=9) i = '0' + i;

            const entry = this.parseEntry();
            const [length, fade] = (entry.length || 0).toString().split(':');
            const formattedLength = new Date(length * 1000).toISOString().substr(14, 5);
            // rowElm.addEventListener('click', async e => {
            //     await this.loadSongFromPlaylistEntry(i);
            //     await this.songPlay();
            // })

            return [
                new ASUIDiv('id', i),
                new ASUIDiv('name', entry.name),
                // new ASUIDiv('url', this.state.url),
                new ASUIDiv('length', formattedLength),
            ];
        }
    }
    customElements.define('aspp-entry', ASPPlaylistEntry);


    class ASPPanel extends ASUIDiv {
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
    customElements.define('asp-panel', ASPPanel);

    class ASPForm extends ASPPanel {}
    customElements.define('asp-form', ASPForm);





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