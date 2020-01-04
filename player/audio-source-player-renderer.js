{

    /** Required Modules **/
    const isRN  = typeof document === 'undefined';
    if(!isRN)   window.require = customElements.get('audio-source-loader').require;


    // const {AudioSourceUtilities} = require('../common/audio-source-utilities.js');
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

        }
        get targetElm() { return this.shadowDOM; }

        // get playlist() { return this.state.playlist; }

        render() {
            console.log('ohok');
            return [
                this.createStyleSheetLink('../player/assets/audio-source-player.css'),
                this.createStyleSheetLink('../common/assets/audio-source-common.css'),
                this.containerElm = ASUIDiv.cE('asp-container', () => [
                    ASUIDiv.cE('asp-menu-container', () => [
                        ASUIMenu.cME({vertical: true}, 'File', () => [
                            ASUIMenu.cME({}, 'from Memory', async () => {
                                const {AudioSourceStorage} = require('../common/audio-source-storage.js');
                                const Storage = new AudioSourceStorage();
                                const songRecentUUIDs = await Storage.getRecentSongList() ;
                                return songRecentUUIDs.map(entry => ASUIMenu.cME({}, entry.name || entry.uuid,
                                    null, () => this.loadSongFromMemory(entry.uuid)));
                            }),

                            ASUIMenu.cME({}, 'from File', null, (e) => this.fieldSongFileLoad.click()),
                            ASUIMenu.cME({}, 'from URL', null, null, {disabled: true}),
                            ASUIMenu.cME({}, 'from Library', null, null, {disabled: true}),
                        ]),
                        ASUIMenu.cME({vertical: true}, 'Playlist', () => [
                            ASUIMenu.cME({}, 'Play Next Song', null, (e) => this.playlistNext()),
                            ASUIMenu.cME({}, 'Clear Playlist', null, (e) => this.clearPlaylist(), {hasBreak: true}),

                        ]),
                        // this.menuEdit = ASUIMenu.cME({vertical: true}, 'Edit'),
                        ASUIMenu.cME({vertical: true}, 'View', () => [
                            ASUIMenu.cME({}, `${this.classList.contains('fullscreen') ? 'Disable' : 'Enable'} Fullscreen`, null, (e) => this.toggleFullscreen(e)),
                            ASUIMenu.cME({}, `${this.classList.contains('hide-panel-song') ? 'Show' : 'Hide'} Song Forms`, null, (e) => this.togglePanelSong(e)),
                            ASUIMenu.cME({}, `${this.classList.contains('hide-panel-playlist') ? 'Show' : 'Hide'} Playlist`, null, (e) => this.togglePanelPlaylist(e)),
                        ]),
                    ]),

                    ASUIDiv.cE('asp-forms-container', () => [
                        ASPPanel.cE('song', () => [
                            ASUIDiv.cE('title', 'Song'),
                            ASPForm.cE('playback', () => [
                                ASUIDiv.cE('title', 'Playback'),
                                this.fieldSongPlaybackPlay = ASUIInputButton.cE('play',
                                    new ASUIcon('play'),
                                    e => this.playlistPlay(e),
                                    "Play Song",
                                    {class: 'hide-on-playing'}),
                                this.fieldSongPlaybackPause = ASUIInputButton.cE('pause',
                                    new ASUIcon('pause'),
                                    e => this.playlistPause(e),
                                    "Pause Song",
                                    {class: 'show-on-playing'}),
                                this.fieldSongPlaybackStop = ASUIInputButton.cE('stop',
                                    new ASUIcon('stop'),
                                    e => this.playlistStop(e),
                                    "Stop Song"),
                                this.fieldSongPlaylistNext = ASUIInputButton.cE('playlist-next',
                                    new ASUIcon('next'),
                                    e => this.playlistNext(e),
                                    "Next Song")
                            ]),

                            ASPForm.cE('file', () => [
                                ASUIDiv.cE('title', 'File'),
                                this.fieldSongFileLoad = ASUIFileInput.cE('file-load',
                                    e => this.loadSongFromFileInput(),
                                    new ASUIcon('file-load'),
                                    `.json,.mid,.midi`,
                                    "Load Song from File"
                                ),
                                this.fieldSongFileSave = ASUIInputButton.cE('file-save',
                                    new ASUIcon('file-save'),
                                    e => this.saveSongToFile(),
                                    "Save Song to File"
                                ),
                            ]),

                            ASPForm.cE('volume', () => [
                                ASUIDiv.cE('title', 'Volume'),
                                this.fieldSongVolume = ASUIInputRange.cE('volume',
                                    (e, newVolume) => this.setVolume(newVolume / 100), 1, 100, this.state.volume * 100, 'Song Volume')
                            ]),

                            ASPForm.cE('timing', () => [
                                ASUIDiv.cE('title', 'Timing'),
                                this.fieldSongTiming = ASUIInputText.cE('timing',
                                    (e, pos) => this.setSongPosition(pos),
                                    '00:00:000',
                                    'Song Timing',
                                )
                            ]),

                            ASPForm.cE('position', () => [
                                ASUIDiv.cE('title', 'Position'),
                                this.fieldSongPosition = ASUIInputRange.cE('position',
                                    (e, pos) => this.setSongPosition(pos),
                                    0,
                                    Math.ceil(this.state.songLength),
                                    0,
                                    'Song Position',
                                )
                            ]),

                            ASPForm.cE('name', () => [
                                ASUIDiv.cE('title', 'Name'),
                                this.fieldSongName = ASUIInputText.cE('name',
                                    (e, newSongName) => this.setSongName(e, newSongName),
                                    this.song ? this.song.name : "[ no song loaded ]",
                                    "Song Name"
                                )
                            ]),

                            ASPForm.cE('version', () => [
                                ASUIDiv.cE('title', 'Version'),
                                this.fieldSongVersion = ASUIInputText.cE('version',
                                    (e, newSongVersion) => this.setSongVersion(e, newSongVersion),
                                    this.song ? this.song.version : "0.0.0",
                                    "Song Version",
                                )
                            ]),

                            ASPForm.cE('source', () => [
                                this.fieldSongVersion = ASUIInputButton.cE('version',
                                    "Edit<br/>Source",
                                    (e) => this.openSongSource(e),
                                    "Open Song Source",
                                    {disabled: true}
                                )
                            ])
                        ]),

                        ASPPanel.cE('playlist', () => [
                            ASUIDiv.cE('title', 'Playlist'),
                            ASPPlaylist.cE({
                                state: this.state.playlist,
                                ref:ref=>this.elmPlayer=ref
                            })
                        ]),
                    ]),

                    ASUIDiv.cE('asp-status-container', () => [
                        ASUIDiv.cE({attrClass: 'status-text', ref:ref=>this.textStatus=ref}, () => this.state.status),
                        ASUIDiv.cE({attrClass: 'version-text', ref:ref=>this.textVersion=ref}, () => this.state.version),
                    ])
                ])

            ];

            // this.containerElm.classList.toggle('fullscreen', this.classList.contains('fullscreen'));
            //
            // this.fieldSongName.value = this.song.name;
            // this.fieldSongVersion.value = this.song.getVersion();
            //
            // this.fieldSongVolume.value = this.song.getVolumeValue();

        }


    }
    // customElements.define('asp-renderer', AudioSourcePlayerRenderer);


    class ASPPanel extends ASUIDiv {
        // constructor(props={}) {
        //     super(props, contentCallback);
        // }

        // render() {
        //     return [
        //         this.props.title ? ASUIDiv.createElement('title', this.props.title) : null,
        //         super.render()
        //     ]
        // }

    }
    customElements.define('asp-panel', ASPPanel);

    class ASPForm extends ASPPanel {}
    customElements.define('asp-form', ASPForm);




    class ASPPlaylist extends ASUIComponent {
        constructor(props = {}) {
            super(props, {});
            this.state = props.state;
            this.state.position = this.state.position || 0;
            this.state.entries = this.state.entries || [];
            this.state.selectedEntries = this.state.selectedEntries || [];
            this.addEventHandler('click', e => this.onClick(e));
        }

        get position() { return this.state.position; }
        get entries() { return this.state.entries; }

        connectedCallback() {
            super.connectedCallback();
        }

        async clear() {
            this.setState({entries: []})
        }

        // async updateEntries() {
        //     console.time('updateEntries');
        //     for(let i=0; i<this.playlist.length; i++) {
        //         const entry = this.playlist[i];
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

        eachEntry(callback) {
            const results = [];
            let offset=0;
            each(this.entries);
            return results;

            function each(playlist) {
                for (let i = 0; i < playlist.length; i++) {
                    const entry = playlist[i];
                    const ret = callback(entry, offset);
                    if (ret === false) return false;
                    if (ret !== null) results.push(ret);
                    offset++;
                    if (entry instanceof ASPPlaylistPlaylistEntry) {
                        if (entry.state.entries) {
                            const ret = each(entry.state.entries);
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
            if(skipDuplicate && this.entries.find(e => e.url === entry.url)) {
                return false;
            }
            if(insertAtPosition === null) {
                insertAtPosition = this.entries.length;
                this.entries.push(entry);
            } else {
                this.entries.splice(insertAtPosition, 0, entry);
            }
            await entry.updateID(insertAtPosition);
            // await this.renderOS();
            return true;
        }

        async getCurrentEntry(throwException=true) {
            if(this.entries.length === 0)
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
        //     if(!this.playlist[position])
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


        render() {
            // await this.updateEntries();
            return [
                new ASUIGridRow('header', () => [
                    ASUIDiv.createElement('id', 'ID'),
                    ASUIDiv.createElement('name', 'Name'),
                    // ASUIDiv.createElement('url', 'URL'),
                    ASUIDiv.createElement('length', 'Length'),
                ], {class: 'asp-playlist-header'}),
                ASUIDiv.createElement('asp-playlist-container', () => [
                    this.entries.map((entryData, id) => ASPPlaylistEntry.createElement({id, data:entryData}))
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
        constructor(props = {}) {
            super(props, {});
            if(!this.props.data)
                throw new Error("Invalid Entry data");
            // if(!this.state.name)
            //     this.state.name = state.url.split('/').pop();
            // this.props.position = null;
            // this.props.selected = null;
            // props.isPlaylist = entryData.url.toString().toLowerCase().endsWith('.pl.json');
        }

        get id()            { return this.props.id; }
        get data()          { return this.props.data; }
        get file()          { return this.data.file; }
        get url()           { return this.data.url; }
        get name()          { return this.data.name; }
        get length()        { return this.data.length; }
        get isPlaylist()    { return false; }
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
            let id = '-';
            if(Number.isInteger(this.id)) {
                id = this.id;
                if (id <= 9) id = '0' + id;
            }
            const [length, fade] = (this.length || 0).toString().split(':');
            const formattedLength = (() => {
                try { return new Date(length * 1000).toISOString().substr(14, 5); }
                catch { return "N/A"; }
            })();
            // rowElm.addEventListener('click', async e => {
            //     await this.loadSongFromPlaylistEntry(i);
            //     await songPlay();
            // })

            return [
                ASUIDiv.createElement('id', id+':'),
                ASUIDiv.createElement('name', this.name),
                // ASUIDiv.createElement('url', this.state.url),
                ASUIDiv.createElement('length', formattedLength),
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

        // static parseFromData(entryData, id, props={}) {
        //     if(typeof entryData === "string") {
        //         const split = entryData.split(';');
        //         entryData = {url: split[0]};
        //         if(split[1]) entryData.name = split[1];
        //         if(split[2]) entryData.length = split[2];
        //     }
        //     if(!entryData.url)
        //         throw new Error("Invalid Playlist Entry URL");
        //
        //     entryData.id = id;
        //     const isPlaylist = entryData.url.toString().toLowerCase().endsWith('.pl.json');
        //     if(isPlaylist)
        //         return new ASPPlaylistPlaylistEntry(props, entryData);
        //     return new ASPPlaylistEntry(props, entryData);
        // }

    }
    customElements.define('aspp-entry', ASPPlaylistEntry);



    class ASPPlaylistPlaylistEntry extends ASPPlaylistEntry {
        get isPlaylist() { return true; }

        constructor(props={}) {
            super(props, state);
            this.props.status = null;
            this.props.open = null;
            this.state.entries = this.props.entries || null;
            // props.isPlaylist = entryData.url.toString().toLowerCase().endsWith('.pl.json');
        }

        get entries() { return this.state.entries; }

        async togglePlaylist(toggleValue = null) {
            toggleValue = toggleValue === null ? this.props.open ? null : true : toggleValue;
            this.setProps({open: toggleValue});
            if(!this.entries)
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

        render() {
            const content = super.render();
            if(this.entries && this.props.open) {
                // await this.updateEntries();
                content.push(ASUIDiv.createElement('container', this.entries));
            }
            return content;
        }
    }
    customElements.define('aspp-playlist-entry', ASPPlaylistPlaylistEntry);



    /** Export this script **/
    const thisScriptPath = 'player/audio-source-player-renderer.js';
    let thisModule = typeof document !== 'undefined' ? customElements.get('audio-source-loader').findScript(thisScriptPath) : module;
    thisModule.exports = {
        AudioSourcePlayerRenderer,
        ASPPlaylist,
        ASPPlaylistEntry,
        ASPPlaylistPlaylistEntry,
    };

}