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
        constructor(state={}, props={}) {
            super(state, props);
            state.fullscreen = false;
            state.showPanelSong = true;
            state.showPanelPlaylist = true;
            state.playlist = new ASPPlaylist(this);

        }
        get playlist() { return this.state.playlist; }

        createStyleSheetLink(stylePath) {
            const linkHRef = this.getScriptDirectory(stylePath);
            const link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.href = linkHRef;
            return link;
        }

        async render() {
            return [
                this.createStyleSheetLink('player/assets/audio-source-player.css'),
                this.createStyleSheetLink('common/assets/audio-source-common.css'),
                this.refs.containerElm = new ASUIDiv('asp-container', () => [
                    new ASUIDiv('asp-menu-container', () => [
                        this.refs.menuFile = new ASUIMenu('File', () => [
                            new ASUIMenu('from Memory ►', async () => {
                                const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
                                const Storage = new AudioSourceStorage();
                                const songRecentUUIDs = await Storage.getRecentSongList() ;
                                return songRecentUUIDs.map(entry => new ASUIMenu(entry.name || entry.uuid,
                                    null, () => this.loadSongFromMemory(entry.uuid)));
                            }),

                            new ASUIMenu('from File', null, (e) => this.refs.fieldSongFileLoad.click()),
                            new ASUIMenu('from URL', null, null, {disabled: true}),
                            new ASUIMenu('from Library', null, null, {disabled: true}),
                        ]),
                        this.refs.menuView = new ASUIMenu('Playlist', () => [
                            new ASUIMenu('Play Next Song', null, (e) => this.playlist.playNextSong()),
                            new ASUIMenu('Clear Playlist', null, (e) => this.playlist.clear(), {hasBreak: true}),

                        ]),
                        // this.refs.menuEdit = new ASUIMenu('Edit'),
                        this.refs.menuView = new ASUIMenu('View', () => [
                            new ASUIMenu(`${this.classList.contains('fullscreen') ? 'Disable' : 'Enable'} Fullscreen`, null, (e) => this.toggleFullscreen(e)),
                            new ASUIMenu(`${this.classList.contains('hide-panel-song') ? 'Show' : 'Hide'} Song Forms`, null, (e) => this.togglePanelSong(e)),
                            new ASUIMenu(`${this.classList.contains('hide-panel-playlist') ? 'Show' : 'Hide'} Playlist`, null, (e) => this.togglePanelPlaylist(e)),
                        ]),
                    ]),

                    new ASUIDiv('asp-forms-container', () => [
                        new ASPPanel('song', 'Song', () => [
                            new ASPForm('playback', 'Playback', () => [
                                this.refs.fieldSongPlaybackPlay = new ASUIButton('play',
                                    e => this.playlistPlay(e),
                                    new ASUIcon('play'),
                                    "Play Song",
                                    {class: 'hide-on-playing'}),
                                this.refs.fieldSongPlaybackPause = new ASUIButton('pause',
                                    e => this.songPause(e),
                                    new ASUIcon('pause'),
                                    "Pause Song",
                                    {class: 'show-on-playing'}),
                                this.refs.fieldSongPlaybackStop = new ASUIButton('stop',
                                    e => this.songStop(e),
                                    new ASUIcon('stop'),
                                    "Stop Song"),
                                this.refs.fieldSongPlaylistNext = new ASUIButton('playlist-next',
                                    e => this.playlistNext(e),
                                    new ASUIcon('next'),
                                    "Next Song")
                            ]),

                            new ASPForm('file', 'File', () => [
                                this.refs.fieldSongFileLoad = new ASUIFileInput('file-load',
                                    e => this.loadSongFromFileInput(),
                                    new ASUIcon('file-load'),
                                    `.json,.mid,.midi`,
                                    "Load Song from File"
                                ),
                                this.refs.fieldSongFileSave = new ASUIButton('file-save',
                                    e => this.saveSongToFile(),
                                    new ASUIcon('file-save'),
                                    "Save Song to File"
                                ),
                            ]),

                            new ASPForm('volume', 'Volume', () => [
                                this.refs.fieldSongVolume = new ASUIRangeInput('volume',
                                    (e, newVolume) => this.setSongVolume(e, newVolume), 1, 100, 'Song Volume', this.song.getVolumeValue())
                            ]),

                            new ASPForm('timing', 'Timing', () => [
                                this.refs.fieldSongTiming = new ASUITextInput('timing',
                                    (e, pos) => this.setSongPosition(e, pos),
                                    'Song Timing',
                                    '00:00:000'
                                )
                            ]),

                            new ASPForm('position', 'Position', () => [
                                this.refs.fieldSongPosition = new ASUIRangeInput('position',
                                    (e, pos) => this.setSongPosition(e, pos),
                                    0,
                                    Math.ceil(this.song.getSongLength()),
                                    'Song Position',
                                    0
                                )
                            ]),

                            new ASPForm('name', 'Name', () => [
                                this.refs.fieldSongName = new ASUITextInput('name',
                                    (e, newSongName) => this.setSongName(e, newSongName),
                                    "Song Name",
                                    this.song.name
                                )
                            ]),

                            new ASPForm('version', 'Version', () => [
                                this.refs.fieldSongVersion = new ASUITextInput('version',
                                    (e, newSongVersion) => this.setSongVersion(e, newSongVersion),
                                    "Song Version",
                                    this.song.version)
                            ])
                        ]),

                        new ASPPanel('playlist', 'Playlist',  () => [
                            this.state.playlist
                        ]),
                    ]),

                    new ASUIDiv('asp-status-container', () => [
                        this.refs.textStatus = new ASUIDiv('status-text'),
                        this.refs.textVersion = new ASUIDiv('version-text'),
                    ])
                ])

            ];

            // this.containerElm.classList.toggle('fullscreen', this.classList.contains('fullscreen'));
            //
            // this.refs.fieldSongName.value = this.song.getName();
            // this.refs.fieldSongVersion.value = this.song.getVersion();
            //
            // this.refs.fieldSongVolume.value = this.song.getVolumeValue();

        }


    }
    customElements.define('asp-renderer', AudioSourcePlayerRenderer);


    class ASPPlaylist extends ASUIComponent {
        constructor(playerElm, playlist=[], props={}) {
            super({}, props);
            this.state = {
                position: 0,
                playlist: playlist,
                selected: []
            };
            this.playerElm = playerElm;

            this.addEventHandler('click', e => this.onClick(e));
        }

        get position() { return this.state.position; }
        get playlist() { return this.state.playlist; }

        async clear() {
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
            await this.updateEntries();
        }

        async updateEntries() {
            console.time('updateEntries');
            for(let i=0; i<this.state.playlist.length; i++) {
                const entry = this.state.playlist[i];
                await entry.updatePlaylist(this);
            }
            console.timeEnd('updateEntries');
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
                .updatePlaylist(this);
        }

        getCurrentEntry() {
            if(this.state.playlist.length === 0)
                throw new Error("Empty playlist");
            return this.getEntry(this.state.position);
        }

        getEntry(position) {
            const entry = this.state.playlist[position];
            if(!entry)
                throw new Error("Invalid playlist position: " + position);
            return entry;
        }

        async addEntry(entry, insertAtPosition=null, skipDuplicate=true) {
            if(!entry instanceof ASPPlaylistEntry)
                throw new Error("Invalid ASPPlaylistEntry");
            if(skipDuplicate && this.state.playlist.find(e => e.url === entry.url)) {
                return false;
            }
            if(insertAtPosition === null) {
                this.state.playlist.push(entry);
            } else {
                this.state.playlist.splice(insertAtPosition, 0, entry);
            }
            // await this.renderOS();
            return true;
        }


        isPlaylist(entryUrl) {
            return (entryUrl.toString().toLowerCase().endsWith('.pl.json'));
        }

        async loadSongFromURL(url) {
            const song = this.playerElm.song;
            if(this.isPlaylist(url)) {
                const playlistEntry = new ASPPlaylistPlaylistEntry({url    });
                this.addEntry(playlistEntry);
                await this.renderOS();
                // await this.loadPlaylistFromURL(url);
                // const entry = this.getCurrentEntry();
                // if(entry.url && !this.isPlaylist(entry.url))
                //     await this.loadSongFromPlaylistEntry(this.position);
            } else {
                await song.loadSongFromURL(url);
                this.addSongURLToPlaylist(url, song.name, song.getSongLength());
            }
            // this.render();
        }

        async loadSongFromPlaylistEntry(playlistPosition) {
            const song = this.playerElm.song;
            if(song && song.playlistPosition === playlistPosition) {
                console.info("Skipping load for playlist song: " + playlistPosition);
                return;
            }
            if(song.playback)
                song.stopPlayback();
            await this.updatePosition(playlistPosition);
            const entry = this.getEntry(playlistPosition);


            if(entry.file) {
                await song.loadSongFromFileInput(entry.file);
                await entry.setState({name: song.name, length: song.getSongLength()});
            } else if(entry.url) {
                if(entry.isPlaylist) {
                    await entry.togglePlaylist();
                } else {
                    await this.loadSongFromURL(entry.url);
                    await entry.setState({name: song.name, length: song.getSongLength()});
                }
            } else {
                throw new Error("Invalid Playlist Entry: " + playlistPosition);
            }

            song.playlistPosition = this.position;
            this.render();
        }


        async loadPlaylistFromURL(playlistURL, insertAtPosition=null) {
            const playlistEntry = new ASPPlaylistPlaylistEntry({
                url: playlistURL
            });
            await this.addEntry(playlistEntry);
            await playlistEntry.loadPlaylist();

        }

        async addSongURLToPlaylist(url, name=null, length=null) {
            const entry = ASPPlaylistEntry.parseFromData({url, name, length});
            await this.addEntry(entry);
            await this.renderOS();
        }

        async addSongFileToPlaylist(file, name=null, length=null) {
            const entry = ASPPlaylistEntry.parseFromData({
                url: 'file://' + file.name,
                name: name || file.name.split('/').pop(),
                length
            });
            await this.addEntry(entry);
            await this.renderOS();
        }


        async render() {
            await this.updateEntries();
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
            const entryElm = e.target.closest('aspp-entry,aspp-playlist-entry');
            const position = entryElm.getPosition(this);
            if(entryElm) {
                // entryElm.toggleSelect();
                await this.loadSongFromPlaylistEntry(position);
                //     await songPlay();
            } else {
                console.log(e, this);
            }
        }
    }
    customElements.define('asp-playlist', ASPPlaylist);

    class ASPPlaylistEntry extends ASUIComponent {
        constructor(entryData, props={}) {
            super(entryData, props);
            if(!entryData.name)
                entryData.name = entryData.url.split('/').pop();
            props.position = null;
            props.selected = null;
            // props.isPlaylist = entryData.url.toString().toLowerCase().endsWith('.pl.json');
        }

        get file() { return this.state.file; }
        get url() { return this.state.url; }
        get name() { return this.state.name; }
        get length() { return this.state.length; }
        get isPlaylist() { return false; }
        // get position() { return this.playlistElm.playlist.indexOf(this); }

        // toggleSelect(playlistElm) {
        //     this.playlistElm.toggleSelect(this.getPosition(playlistElm));
        // }


        getPosition(playlistElm) {
            return playlistElm.playlist.indexOf(this);
        }

        async updatePlaylist(playlistElm) {
            const position = this.getPosition(playlistElm);

            const isCurrentPosition = position === playlistElm.position ? true : null;
            if(this.props.position !== isCurrentPosition)
                await this.setProps({position: isCurrentPosition});
            const isSelected = playlistElm.state.selected.indexOf(position) !== -1 ? true : null;
            if(this.props.selected !== isSelected)
                await this.setProps({selected: isSelected});

            if(this.state.id !== position)
                await this.setState({id:position});
        }

        render() {
            const entry = this.state;
            let id = entry.id;
            if(id<=9) id = '0' + id;

            const [length, fade] = (entry.length || 0).toString().split(':');
            const formattedLength = new Date(length * 1000).toISOString().substr(14, 5);
            // rowElm.addEventListener('click', async e => {
            //     await this.loadSongFromPlaylistEntry(i);
            //     await songPlay();
            // })

            return [
                new ASUIDiv('id', id),
                new ASUIDiv('name', entry.name),
                // new ASUIDiv('url', this.state.url),
                new ASUIDiv('length', formattedLength),
            ];
        }

        static parseFromData(entryData, props) {
            if(typeof entryData === "string") {
                const split = entryData.split(';');
                entryData = {url: split[0]};
                if(split[1]) entryData.name = split[1];
                if(split[2]) entryData.length = split[2];
            }
            if(!entryData.url)
                throw new Error("Invalid Playlist Entry URL");


            const isPlaylist = entryData.url.toString().toLowerCase().endsWith('.pl.json');
            if(isPlaylist)
                return new ASPPlaylistPlaylistEntry(entryData, props);
            return new ASPPlaylistEntry(entryData, props);
        }

    }
    customElements.define('aspp-entry', ASPPlaylistEntry);

    class ASPPlaylistPlaylistEntry extends ASPPlaylistEntry {
        get isPlaylist() { return true; }

        constructor(entryData, props={}) {
            super(entryData, props);
            entryData.playlist = entryData.playlist || null;
            // props.isPlaylist = entryData.url.toString().toLowerCase().endsWith('.pl.json');
        }

        get playlist() { return this.state.playlist; }

        async togglePlaylist() {
            if(this.state.playlist) {
                this.state.playlist = null;
            } else {
                await this.loadPlaylist();
            }
        }

        async loadPlaylist() {
            const playlistURL = new URL(this.state.url, document.location);

            await this.setState({
                name: "Loading playlist " + this.state.url.split('/').pop(),
            });

            const playlistData = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', playlistURL.toString(), true);
                xhr.responseType = 'json';
                xhr.onload = () => resolve(xhr.response);
                xhr.onerror = reject;
                xhr.send();
            });

            if(!playlistData.playlist)
                throw new Error("No playlist data: " + playlistURL);
            if(!Array.isArray(playlistData.playlist))
                throw new Error("Invalid playlist data: " + playlistURL);
            let playlist = playlistData.playlist;
            if(!Array.isArray(playlist))
                throw new Error("Invalid playlist");

            let urlPrefix = playlistData.urlPrefix;
            if(!urlPrefix || urlPrefix[0] !== '/')
                urlPrefix = playlistURL.pathname.split("/").slice(0,-1).join("/") + '/' + (urlPrefix||'');
            let newPlaylist = [];
            for(let i=0; i<playlist.length; i++) {
                let entry = playlist[i];
                if(typeof entry === "object")   entry.url = urlPrefix + entry.url;
                else                            entry = urlPrefix + entry;
                entry = ASPPlaylistEntry.parseFromData(entry);
                newPlaylist.push(entry);
            }

            await this.setState({
                name: playlistData.name,
                playlist: newPlaylist
            });
        }

        render() {
            const content = super.render();
            if(this.state.playlist)
                content.push(new ASUIDiv('container', this.state.playlist));
            return content;
        }
    }
    customElements.define('aspp-playlist-entry', ASPPlaylistPlaylistEntry);


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