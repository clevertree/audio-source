{

    /** Required Modules **/
    if(typeof window !== "undefined")
        window.require = customElements.get('audio-source-loader').require;

        // const {AudioSourceValues} = require('../common/audio-source-values.js');
        // const {AudioSourceLibrary} = require('../common/audio-source-library.js');
    const {
            ASUIComponent,
            ASUIDiv,
            ASUIMenu,
            ASUIGrid,
            ASUIGridRow,
            ASUIInputButton,
            ASUIFileInput,
            ASUIInputRange,
            ASUIInputText,
            ASUIcon,
        } = require('../common/audio-source-ui.js');


    class AudioSourcePlayerRenderer extends ASUIComponent {
        constructor(props={}, state={}) {
            super(props, state);
            this.shadowDOM = null;
            state.fullscreen = false;
            state.showPanelSong = true;
            state.showPanelPlaylist = true;
            state.playlist = new ASPPlaylist({}, this);

        }
        get targetElm() { return this.shadowDOM; }

        get playlist() { return this.state.playlist; }

        createStyleSheetLink(stylePath) {
            const AudioSourceLoader = customElements.get('audio-source-loader');
            const linkHRef = AudioSourceLoader.resolveURL(stylePath);
            const link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.href = linkHRef;
            return link;
        }

        async connectedCallback() {
            this.shadowDOM = this.attachShadow({mode: 'closed'});


            this.addEventHandler([
                'song:loaded','song:play','song:end','song:stop','song:modified', 'song:seek',
                'group:play', 'group:seek',
                'note:start', 'note:end'
            ], this.onSongEvent);
            // document.addEventListener('instrument:loaded', e => this.onSongEvent(e));

            this.addEventHandler(['keyup', 'keydown', 'click', 'dragover', 'drop'], e => this.onInput(e), this.shadowDOM, true);

            // this.loadCSS();
            // Render (with promise)
            super.connectedCallback(false);
            await this.renderOS();

            const url = this.getAttribute('src') || this.getAttribute('url');
            if(url)
                this.addSongURLToPlaylist(url);
        }

        async render() {
            return [
                this.createStyleSheetLink('../player/assets/audio-source-player.css'),
                this.createStyleSheetLink('../common/assets/audio-source-common.css'),
                this.refs.containerElm = new ASUIDiv('asp-container', () => [
                    new ASUIDiv('asp-menu-container', () => [
                        this.refs.menuFile = new ASUIMenu({vertical: true}, 'File', () => [
                            new ASUIMenu({}, 'from Memory', async () => {
                                const {AudioSourceStorage} = require('../common/audio-source-storage.js');
                                const Storage = new AudioSourceStorage();
                                const songRecentUUIDs = await Storage.getRecentSongList() ;
                                return songRecentUUIDs.map(entry => new ASUIMenu({}, entry.name || entry.uuid,
                                    null, () => this.loadSongFromMemory(entry.uuid)));
                            }),

                            new ASUIMenu({}, 'from File', null, (e) => this.refs.fieldSongFileLoad.click()),
                            new ASUIMenu({}, 'from URL', null, null, {disabled: true}),
                            new ASUIMenu({}, 'from Library', null, null, {disabled: true}),
                        ]),
                        this.refs.menuPlaylist = new ASUIMenu({vertical: true}, 'Playlist', () => [
                            new ASUIMenu({}, 'Play Next Song', null, (e) => this.playlistNext()),
                            new ASUIMenu({}, 'Clear Playlist', null, (e) => this.clearPlaylist(), {hasBreak: true}),

                        ]),
                        // this.refs.menuEdit = new ASUIMenu({vertical: true}, 'Edit'),
                        this.refs.menuView = new ASUIMenu({vertical: true}, 'View', () => [
                            new ASUIMenu({}, `${this.classList.contains('fullscreen') ? 'Disable' : 'Enable'} Fullscreen`, null, (e) => this.toggleFullscreen(e)),
                            new ASUIMenu({}, `${this.classList.contains('hide-panel-song') ? 'Show' : 'Hide'} Song Forms`, null, (e) => this.togglePanelSong(e)),
                            new ASUIMenu({}, `${this.classList.contains('hide-panel-playlist') ? 'Show' : 'Hide'} Playlist`, null, (e) => this.togglePanelPlaylist(e)),
                        ]),
                    ]),

                    new ASUIDiv('asp-forms-container', () => [
                        this.refs.panelSong = new ASPPanel('song', 'Song', () => [
                            new ASPForm('playback', 'Playback', () => [
                                this.refs.fieldSongPlaybackPlay = new ASUIInputButton('play',
                                    new ASUIcon('play'),
                                    e => this.playlistPlay(e),
                                    "Play Song",
                                    {class: 'hide-on-playing'}),
                                this.refs.fieldSongPlaybackPause = new ASUIInputButton('pause',
                                    new ASUIcon('pause'),
                                    e => this.playlistPause(e),
                                    "Pause Song",
                                    {class: 'show-on-playing'}),
                                this.refs.fieldSongPlaybackStop = new ASUIInputButton('stop',
                                    new ASUIcon('stop'),
                                    e => this.playlistStop(e),
                                    "Stop Song"),
                                this.refs.fieldSongPlaylistNext = new ASUIInputButton('playlist-next',
                                    new ASUIcon('next'),
                                    e => this.playlistNext(e),
                                    "Next Song")
                            ]),

                            new ASPForm('file', 'File', () => [
                                this.refs.fieldSongFileLoad = new ASUIFileInput('file-load',
                                    e => this.loadSongFromFileInput(),
                                    new ASUIcon('file-load'),
                                    `.json,.mid,.midi`,
                                    "Load Song from File"
                                ),
                                this.refs.fieldSongFileSave = new ASUIInputButton('file-save',
                                    new ASUIcon('file-save'),
                                    e => this.saveSongToFile(),
                                    "Save Song to File"
                                ),
                            ]),

                            new ASPForm('volume', 'Volume', () => [
                                this.refs.fieldSongVolume = new ASUIInputRange('volume',
                                    (e, newVolume) => this.setSongVolume(e, newVolume), 1, 100, this.state.volume, 'Song Volume')
                            ]),

                            new ASPForm('timing', 'Timing', () => [
                                this.refs.fieldSongTiming = new ASUIInputText('timing',
                                    (e, pos) => this.setSongPosition(e, pos),
                                    '00:00:000',
                                    'Song Timing',
                                )
                            ]),

                            new ASPForm('position', 'Position', () => [
                                this.refs.fieldSongPosition = new ASUIInputRange('position',
                                    (e, pos) => this.setSongPosition(e, pos),
                                    0,
                                    Math.ceil(this.state.songLength),
                                    0,
                                    'Song Position',
                                )
                            ]),

                            new ASPForm('name', 'Name', () => [
                                this.refs.fieldSongName = new ASUIInputText('name',
                                    (e, newSongName) => this.setSongName(e, newSongName),
                                    this.song ? this.song.name : "[ no song loaded ]",
                                    "Song Name"
                                )
                            ]),

                            new ASPForm('version', 'Version', () => [
                                this.refs.fieldSongVersion = new ASUIInputText('version',
                                    (e, newSongVersion) => this.setSongVersion(e, newSongVersion),
                                    this.song ? this.song.version : "0.0.0",
                                    "Song Version",
                                )
                            ]),

                            new ASPForm('source', null, () => [
                                this.refs.fieldSongVersion = new ASUIInputButton('version',
                                    "Edit<br/>Source",
                                    (e) => this.openSongSource(e),
                                    "Open Song Source",
                                    {disabled: true}
                                )
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
            // this.refs.fieldSongName.value = this.song.name;
            // this.refs.fieldSongVersion.value = this.song.getVersion();
            //
            // this.refs.fieldSongVolume.value = this.song.getVolumeValue();

        }


    }
    customElements.define('asp-renderer', AudioSourcePlayerRenderer);


    class ASPPanel extends ASUIDiv {
        constructor(props={}, title, contentCallback) {
            super(props, contentCallback);
            this.state.title = title;
        }

        async render() {
            return [
                this.state.title ? new ASUIDiv('title', this.state.title) : null,
                super.render()
            ]
        }
    }
    customElements.define('asp-panel', ASPPanel);

    class ASPForm extends ASPPanel {}
    customElements.define('asp-form', ASPForm);




    class ASPPlaylist extends ASUIComponent {
        constructor(props = {}, playerElm, playlist = []) {
            super(props, {});
            this.state = {
                position: 0,
                playlist: playlist,
                selectedEntries: [],
                // positionEntry: null,
            };
            this.playerElm = playerElm;

            this.addEventHandler('click', e => this.onClick(e));
        }

        get position() { return this.state.position; }
        get playlist() { return this.state.playlist; }

        connectedCallback() {
            super.connectedCallback();
        }

        async clear() {
            this.setState({playlist: []})
        }

        // async updateEntries() {
        //     console.time('updateEntries');
        //     for(let i=0; i<this.state.playlist.length; i++) {
        //         const entry = this.state.playlist[i];
        //         await entry.updateID(i);
        //     }
        //     console.timeEnd('updateEntries');
        // }

        // toggleSelect(position) {
        //     const selected = this.state.selected;
        //     const i = selected.indexOf(position);
        //     if(i === -1) {
        //         selected.push(position);
        //         selected.sort();
        //     } else {
        //         selected.splice(i, 1);
        //     }
        //     this.getEntry(position)
        //         .updatePlaylist(this);
        // }

        /** Entries **/

        async eachEntry(callback) {
            const results = [];
            let offset=0;
            await each(this.state.playlist);
            return results;

            async function each(playlist) {
                for (let i = 0; i < playlist.length; i++) {
                    const entry = playlist[i];
                    const ret = await callback(entry, offset);
                    if (ret === false) return false;
                    if (ret !== null) results.push(ret);
                    offset++;
                    if (entry instanceof ASPPlaylistPlaylistEntry) {
                        if (entry.state.playlist) {
                            const ret = await each(entry.state.playlist);
                            if (ret === false)
                                return false;
                        }
                    }
                }
                return true;
            }
        }

        // async eachEntry(callback) {
        //     let offset=0;
        //     return await this.eachEntry(async (entry, i) => {
        //         if(entry instanceof ASPPlaylistPlaylistEntry)
        //             return null;
        //         return await callback(entry, offset++);
        //     })
        // }
        //
        // async eachPlaylistEntry(callback) {
        //     let offset=0;
        //     return await this.eachEntry(async (entry, i) => {
        //         if(!entry instanceof ASPPlaylistPlaylistEntry)
        //             return null;
        //         return await callback(entry, offset++);
        //     })
        // }

        // getCurrentEntry() {
        //     if(this.state.playlist.length === 0)
        //         throw new Error("Empty playlist");
        //     return this.getEntry(this.state.position);
        // }

        async addEntry(entry, insertAtPosition=null, skipDuplicate=true) {
            if(!entry instanceof ASPPlaylistEntry)
                throw new Error("Invalid ASPPlaylistEntry");
            if(skipDuplicate && this.state.playlist.find(e => e.url === entry.url)) {
                return false;
            }
            if(insertAtPosition === null) {
                insertAtPosition = this.state.playlist.length;
                this.state.playlist.push(entry);
            } else {
                this.state.playlist.splice(insertAtPosition, 0, entry);
            }
            await entry.updateID(insertAtPosition);
            // await this.renderOS();
            return true;
        }

        async getCurrentEntry(throwException=true) {
            if(this.state.playlist.length === 0)
                throw new Error("Empty playlist");
            return await this.getEntry(this.getPlaylistPosition(), throwException);
        }
        async getEntry(position, throwException=true) {
            let foundEntry=null;
            await this.eachEntry((entry, i) => {
                // console.log('entry', i, position);
                if(i === position)
                    foundEntry = entry;
                if(foundEntry)
                    return false;
            });
            if(!foundEntry && throwException)
                throw new Error("Invalid playlist position: " + position);
            // console.log('found', foundEntry.state.id, position);
            return foundEntry;
        }

        async getEntryPosition(searchEntry) {
            let foundEntryPosition=null;
            await this.eachEntry((entry, i) => {
                if(entry === searchEntry)
                    foundEntryPosition = i;
                if(foundEntryPosition !== null)
                    return false;
            });
            if(foundEntryPosition === null)
                throw new Error("Entry position not found");
            return foundEntryPosition;
        }

        // async updateNextPosition() {
        //     let position = this.state.position;
        //     const currentEntry = await this.getEntry(position);
        //     await currentEntry.removePosition();
        //     position++;
        //     let nextEntry = await this.getEntry(position,false);
        //     if(!nextEntry) position = 0;
        //     return await this.setPlaylistPosition(position);
        // }

        
        getPlaylistPosition() { return this.state.position; }

        async getPlaylistCount() {
            let count;
            await this.eachEntry((entry, i) => count = i);
            return count;
        }
        
        async setPlaylistPosition(position) {
            const currentEntry = await this.getEntry(this.state.position);
            if(position === this.state.position)
                return currentEntry;

            const nextEntry = await this.getEntry(position);
            await currentEntry.removePosition();
            await nextEntry.setPosition();
            this.state.position = position;
            // this.setState({position});
            return nextEntry;
        }

        // async updatePosition(position) {
        //     if(!this.state.playlist[position])
        //         throw new Error("Invalid playlist position: " + position);
        //     this.state.position = position;
        //     // await this.updateEntries();
        // }

        async setPositionEntry(entry) {
            const position = await this.getEntryPosition(entry);
            await this.setPlaylistPosition(position);
        }

        isPlaylist(entryUrl) {
            return (entryUrl.toString().toLowerCase().endsWith('.pl.json'));
        }



        /** @deprecated **/
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
            // await this.updateEntries();
            return [
                new ASUIGridRow('header', () => [
                    new ASUIDiv('id', 'ID'),
                    new ASUIDiv('name', 'Name'),
                    // new ASUIDiv('url', 'URL'),
                    new ASUIDiv('length', 'Length'),
                ], {class: 'asp-playlist-header'}),
                new ASUIDiv('asp-playlist-container', () => [
                    this.state.playlist
                ], {'style': `max-height:${Math.round(window.innerHeight / 2)}px;`}),
            ];
        }

        async onClick(e) {
            const entryElm = e.target.closest('aspp-entry,aspp-playlist-entry');
            if(entryElm) {
                // entryElm.toggleSelect();
                if(entryElm.isPlaylist) {
                    await entryElm.togglePlaylist();
                } else {
                    await this.playerElm.playlistMoveToEntry(entryElm);
                    await this.playerElm.playlistPlay();
                }
                //     await songPlay();
            } else {
                console.error(e, this);
            }
        }

    }
    customElements.define('asp-playlist', ASPPlaylist);

    class ASPPlaylistEntry extends ASUIComponent {
        constructor(props = {}, state) {
            super(props, state);
            if(!this.state.name)
                this.state.name = state.url.split('/').pop();
            this.props.position = null;
            this.props.selected = null;
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

        setPosition() {
            if(this.props.position !== true)
                this.setProps({position: true});
        }

        removePosition() {
            if(this.props.position !== false)
                this.setProps({position: false});
        }

        async updateID(id) {
            if(this.state.id !== id)
                await this.setState({id});
        }

        render() {
            const entry = this.state;
            let id = entry.id;
            if(id<=9) id = '0' + id;

            const [length, fade] = (entry.length || 0).toString().split(':');
            const formattedLength = (() => {
                try { return new Date(length * 1000).toISOString().substr(14, 5); }
                catch { return "N/A"; }
            })();
            // rowElm.addEventListener('click', async e => {
            //     await this.loadSongFromPlaylistEntry(i);
            //     await songPlay();
            // })

            return [
                new ASUIDiv('id', id+':'),
                new ASUIDiv('name', entry.name),
                // new ASUIDiv('url', this.state.url),
                new ASUIDiv('length', formattedLength),
            ];
        }

        // scrollIntoView(playlistElm) {
        //
        //     // TODO: find height within scrolling container
        //     const container = this.parentNode;
        //     // const container = this.tracker; // cursorCell.closest('.composer-tracker-container');
        //     if (container.scrollTop < this.offsetTop - container.offsetHeight)
        //         container.scrollTop = this.offsetTop;
        //     //
        //     if (container.scrollTop > this.offsetTop)
        //         container.scrollTop = this.offsetTop - container.offsetHeight;
        // }

        static parseFromData(entryData, id, props={}) {
            if(typeof entryData === "string") {
                const split = entryData.split(';');
                entryData = {url: split[0]};
                if(split[1]) entryData.name = split[1];
                if(split[2]) entryData.length = split[2];
            }
            if(!entryData.url)
                throw new Error("Invalid Playlist Entry URL");

            entryData.id = id;
            const isPlaylist = entryData.url.toString().toLowerCase().endsWith('.pl.json');
            if(isPlaylist)
                return new ASPPlaylistPlaylistEntry(props, entryData);
            return new ASPPlaylistEntry(props, entryData);
        }

    }
    customElements.define('aspp-entry', ASPPlaylistEntry);



    class ASPPlaylistPlaylistEntry extends ASPPlaylistEntry {
        get isPlaylist() { return true; }

        constructor(props={}, state) {
            super(props, state);
            this.props.status = null;
            this.props.open = null;
            this.state.playlist = this.state.playlist || null;
            // props.isPlaylist = entryData.url.toString().toLowerCase().endsWith('.pl.json');
        }

        get playlist() { return this.state.playlist; }

        async togglePlaylist(toggleValue = null) {
            toggleValue = toggleValue === null ? this.props.open ? null : true : toggleValue;
            this.setProps({open: toggleValue});
            if(!this.state.playlist)
                return await this.loadPlaylist();
            await this.renderOS();
        }

        async loadPlaylist() {
            const playlistURL = new URL(this.state.url, document.location);

            await this.setState({
                name: "Loading playlist " + this.state.url.split('/').pop(),
            });
            await this.setProps({status: 'loading'});

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
            for(let id=0; id<playlist.length; id++) {
                let entry = playlist[id];
                if(typeof entry === "object")   entry.url = urlPrefix + entry.url;
                else                            entry = urlPrefix + entry;
                entry = ASPPlaylistEntry.parseFromData(entry, id);
                newPlaylist.push(entry);

                // await entry.updateID(id); d
            }
            await this.setProps({status: 'loaded', open:true});
            await this.setState({
                name: playlistData.name,
                playlist: newPlaylist
            });
        }

        // async updateID(id) {
        //     await super.updateID(id);
        //     // await this.updateEntries();
        // }

        // async updateEntries() {
        //     if(this.state.playlist) {
        //         for (let id = 0; id < this.state.playlist.length; id++) {
        //             const entry = this.state.playlist[id];
        //             await entry.updateID(id);
        //         }
        //     }
        // }

        async render() {
            const content = super.render();
            if(this.state.playlist && this.props.open) {
                // await this.updateEntries();
                content.push(new ASUIDiv('container', this.state.playlist));
            }
            return content;
        }
    }
    customElements.define('aspp-playlist-entry', ASPPlaylistPlaylistEntry);



    /** Export this script **/
    const thisScriptPath = 'player/audio-source-player-renderer.js';
    let thisModule = typeof customElements !== 'undefined' ? customElements.get('audio-source-loader').findScript(thisScriptPath) : module;
    thisModule.exports = {
        AudioSourcePlayerRenderer,
        ASPPlaylist,
        ASPPlaylistEntry,
        ASPPlaylistPlaylistEntry,
    };

}