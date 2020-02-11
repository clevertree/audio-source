(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    if(isBrowser) // Hack for browsers
        window.require = thisRequire;

    const {
        ASUIDiv,
        ASUIComponent,
        ASUIIcon
    } = require('../../common/ui/asui-component.js');
    // const {ASUIInputButton} = require('../../common/ui/asui-input-button.js');
    // const {ASUIMenu} = require('../../common/ui/asui-menu.js');

    const {ASPPlaylistEntry} = require('./asp-playlist-entry.js');

    class ASPPlaylist extends ASUIComponent {
        constructor(props = {}) {
            super(props, {});
            if(!this.player)
                throw new Error("Invalid player");

            this.state = this.player.state.playlist;
            this.state.position = this.state.position || 0;
            this.state.entries = this.state.entries || [];
            this.state.selectedPositions = this.state.selectedPositions || [];
        }

        get player() { return this.props.player; }
        // get position() { return this.state.position; }
        // get entries() { return this.state.entries; }


        render() {
            // TODO: move to entry - this.addEventHandler('click', e => this.onClick(e));
            // await this.updateEntries();
            return [
                ASUIDiv.createElement('header', [
                    ASUIDiv.createElement('id', 'ID'),
                    ASUIDiv.createElement('name', 'Name'),
                    // ASUIDiv.createElement('url', 'URL'),
                    ASUIDiv.createElement('length', 'Length'),
                ], {key: 'asp-playlist-header'}),
                ASUIDiv.createElement('asp-playlist-container', [
                    this.state.entries.length > 0
                    ? this.eachEntry((entryData, position, depth) => {
                        const props = {
                            key: position,
                            data:entryData,
                            playlist: this,
                            depth,
                            onPress: (e) => this.toggleEntryAtPosition(position)
                        };
                        const classes = [];
                        if(this.state.position === position)
                            classes.push('position');
                            if(this.state.selectedPositions.indexOf(position) !== -1)
                                classes.push('selected');
                            if(entryData.loading)
                                classes.push('loading');
                        if(classes.length > 0)
                            props.class = classes.join(' ');
                        return ASPPlaylistEntry.createElement(props)
                    })
                    : ASUIDiv.createElement('empty-playlist', "Empty Playlist")
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

        clear() {
            this.setState({entries: []})
        }

        getCurrentEntry(throwException=true) {
            if(this.state.entries.length === 0)
                throw new Error("Empty playlist");
            return this.getEntry(this.getPlaylistPosition(), throwException);
        }

        getEntry(position, throwException=true) {
            let foundEntry=null;
            this.eachEntry((entry, i) => {
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

        findEntryPosition(findEntry) {
            if(findEntry instanceof ASPPlaylistEntry)
                findEntry = findEntry.props.data;
            let foundPosition = -1;
            this.eachEntry((entry, position) => {
                if(findEntry === entry) {
                    foundPosition = position;
                    return false;
                }
            });
            return foundPosition;
        }

        selectEntries(selectedPositions) {
            if(!Array.isArray(selectedPositions))
                selectedPositions = [selectedPositions];
            this.setState({selectedPositions}); // TODO: optimize
        }

        async toggleEntryAtPosition(entryPosition) {
            const entry = this.getEntry(entryPosition);
            if(this.isPlaylist(entry.url)) {
                entry.open = !entry.open;
                if(entry.open === true) {
                    if(!entry.playlist) {
                        entry.loading = true;
                        this.forceUpdate(); // TODO: optimize
                        entry.playlist = await this.loadPlaylistFromURL(entry.url);
                        delete entry.loading;
                        this.forceUpdate(); // TODO: optimize
                    }

                }
            } else {
                console.log("TODO Play", entryPosition, entry);

            }
        }

        isPlaylist(entryUrl) {
            return (entryUrl.toString().toLowerCase().endsWith('.pl.json'));
        }


        async loadPlaylistFromURL(playlistURL) {
            console.log("Loading playlist: ", playlistURL);
            playlistURL = new URL(playlistURL, document.location);

            const playlistData = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', playlistURL.toString(), true);
                xhr.responseType = 'json';
                xhr.onload = () => resolve(xhr.response);
                xhr.onerror = reject;
                xhr.send();
            });

            if(!playlistData.entries)
                throw new Error("No playlist entries: " + playlistURL);
            if(!Array.isArray(playlistData.entries))
                throw new Error("Invalid playlist entries: " + playlistURL);

            let urlPrefix = playlistData.urlPrefix;
            if(!urlPrefix || urlPrefix[0] !== '/')
                urlPrefix = playlistURL.pathname.split("/").slice(0,-1).join("/") + '/' + (urlPrefix||'');
            for(let id=0; id<playlistData.entries.length; id++) {
                let entry = playlistData.entries[id];
                if(typeof entry === "object")   entry.url = urlPrefix + entry.url;
                else                            entry = urlPrefix + entry;

                entry = this.parseEntryData(entry);
                playlistData.entries[id] = entry;
            }

            console.log("Loaded playlist: ", playlistURL, playlistData);
            return playlistData;
        }


        parseEntryData(entryData) {
            if(typeof entryData === "string") {
                const split = entryData.split(';');
                entryData = {url: split[0]};
                if(split[1]) entryData.name = split[1];
                if(split[2]) entryData.length = split[2];
            }
            if(!entryData.url)
                throw new Error("Invalid Playlist Entry URL");
            if(!entryData.name)
                entryData.name = '../' + entryData.url.split('/').pop();
            return entryData;
        }

        /** Entries **/

        eachEntry(callback) {
            const results = [];
            let offset=0;
            each(this.state.entries, 0);
            return results;

            function each(playlist, depth) {
                for (let i = 0; i < playlist.length; i++) {
                    const entry = playlist[i];
                    const ret = callback(entry, offset, depth);
                    if (ret === false) return false;
                    if (ret !== null) results.push(ret);
                    offset++;
                    if(entry.playlist && entry.open === true) {
                        const ret = each(entry.playlist.entries, depth+1);
                        if (ret === false)
                            return false;
                    }
                }
                return true;
            }
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

        // async addEntry(entry, insertAtPosition=null, skipDuplicate=true) {
        //     if(!entry instanceof ASPPlaylistEntry)
        //         throw new Error("Invalid ASPPlaylistEntry");
        //     if(skipDuplicate && this.entries.find(e => e.url === entry.url)) {
        //         return false;
        //     }
        //     if(insertAtPosition === null) {
        //         insertAtPosition = this.entries.length;
        //         this.entries.push(entry);
        //     } else {
        //         this.entries.splice(insertAtPosition, 0, entry);
        //     }
        //     await entry.updateID(insertAtPosition);
        //     // await this.forceUpdate();
        //     return true;
        // }


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
            const position = await this.findEntryPosition(entry);
            await this.setPlaylistPosition(position);
        }

        async addSongURLToPlaylist(url, name=null, length=null) {
            const entry = ASPPlaylistEntry.parseFromData({url, name, length});
            await this.addEntry(entry);
            await this.forceUpdate();
        }

        async addSongFileToPlaylist(file, name=null, length=null) {
            const entry = ASPPlaylistEntry.parseFromData({
                url: 'file://' + file.name,
                name: name || file.name.split('/').pop(),
                length
            });
            await this.addEntry(entry);
            await this.forceUpdate();
        }

    }
    if(isBrowser)
        customElements.define('asp-playlist', ASPPlaylist);


    /** Export this script **/
    thisModule.exports = {
        ASPPlaylist,
        // ASPPlaylistContainer
    };


}).apply(null, (function() {
    const thisScriptPath = 'player/ui/asp-playlist.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [thisRequire, thisModule, thisScriptPath, isBrowser]
})());
