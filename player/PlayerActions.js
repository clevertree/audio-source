import Song from "../song/Song";
import Storage from "../song/Storage";
import PlayerMenu from "./PlayerMenu";


class PlayerActions extends PlayerMenu {
    constructor(props={}) {
        super(props);
        this.onSongEventCallback = (e) => this.onSongEvent(e);

        // this.activeSong = null;
        // this.nextPlaylistSong = null;
    }


    // getDefaultInstrumentURL() {
    //     return findThisScript()[0].basePath + 'instruments/audio-source-synthesizer.js';
    // }



    /** Song rendering **/

    async setCurrentSong(song) {
        if(this.song) {
            this.setStatus("Unloading song: " + this.song.data.title);
            if(this.song.isPlaying) {
                this.song.stopPlayback();
            }
            this.song.removeEventListener('*', this.onSongEventCallback);
            // this.song.removeDispatchElement(this);
            // TODO: unload song?
        }
        this.song = song;
        this.song.addEventListener('*', this.onSongEventCallback);
        this.state.songLength = song.getSongLengthInSeconds();
        // this.song.setVolume(this.state.volume);
        // this.song.addDispatchElement(this);
        song.playlistPosition = this.getCurrentEntryPosition();
        const currentEntry = await this.getCurrentEntry();
        currentEntry.name = song.data.title;
        currentEntry.length = song.getSongLengthInSeconds();
        this.forceUpdate();
        this.setStatus("Initializing song: " + song.data.title);
        await this.song.init(this.getAudioContext());
        this.setStatus("Loaded song: " + song.data.title);
    }

    // handleError(err) {
    //     this.setStatus(`<span style="error">${err}</span>`);
    //     console.error(err);
    //     // if(this.webSocket)
    // }

    setStatus(newStatus) {
        console.info.apply(null, arguments); // (newStatus);
        this.setState({status: newStatus});
    }

    setVersion(versionString) {
        this.setState({version: versionString});
    }


    // closeAllMenus() {
    //     this.menuFile.closeAllMenus();
    // }


    /** Song loading **/

    saveSongToFile() {
        const songData = this.song.data;
        // const songHistory = this.song.history;
        const storage = new Storage();
        storage.saveSongToFile(songData);
        this.setStatus("Saved song to file");
    }


    /** Song commands **/



    /** Playback **/

    getAudioContext()               {
        if (this.audioContext)
            return this.audioContext;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioContext = audioContext;
        return audioContext;
    }

    getVolumeGain()                 {
        if (!this.volumeGain) {
            const context = this.getAudioContext();
            let gain = context.createGain();
            gain.gain.value = this.state.volume; // Song.DEFAULT_VOLUME;
            gain.connect(context.destination);
            this.volumeGain = gain;
        }
        return this.volumeGain; }

    getVolume () {
        return this.state.volume;
        // if(this.volumeGain) {
        //     return this.volumeGain.gain.value;
        // }
        // return Player.DEFAULT_VOLUME;
    }
    setVolume (volume) {
        console.info("Setting volume: ", volume);
        const gain = this.getVolumeGain();
        if(gain.gain.value !== volume) {
            gain.gain.value = volume;
        }
        // this.state.volume = volume;
        this.fieldSongVolume.value = volume * 100;
    }


    async updateSongPositionMaxLength(maxSongLength) {
        await this.fieldSongPosition.setState({max: Math.ceil(maxSongLength)});
    }

    updateSongPositionValue(playbackPositionInSeconds) {
        const roundedSeconds = Math.round(playbackPositionInSeconds);
        this.fieldSongTiming.value = this.values.formatPlaybackPosition(playbackPositionInSeconds);
        if (this.fieldSongPosition.value !== roundedSeconds)
            this.fieldSongPosition.value = roundedSeconds;
    }


//         async loadSongFromMemory(songUUID) {
//             await this.song.loadSongFromMemory(songUUID);
//             // this.render();
//             this.setStatus("Song loaded from memory: " + songUUID, this.song);
// //         console.info(songData);
//         }
//
//         async loadSongFromFileInput(file=null) {
//             if(file === null)
//                 file = this.fieldSongFileLoad.inputElm.files[0];
//             if (!file)
//                 throw new Error("Invalid file input");
//             await this.song.loadSongFromFileInput(file);
//             this.addSongFileToPlaylist(file, this.song.data.title, this.song.getSongLengthInSeconds());
//             // this.render();
//         }


    // async loadSongFromPlaylistEntry(playlistPosition) {
    //     // this.setStatus("Loading from playlist: " + url);
    //     await this.playlist.loadSongFromURL(playlistPosition);
    // }

    /** Song Playlist **/

    // async loadPlaylistFromURL(playlistURL) {
    //     await this.playlist.loadSongFromURL(playlistURL);
    //     this.setStatus("Loaded playlist from url: " + playlistURL);
    // }

    /** Entries **/


    getCurrentEntryPosition() { return this.state.playlist.position || 0; }
    getCurrentEntry(throwException=true) {
        if(this.state.playlist.entries.length === 0)
            throw new Error("Empty playlist");
        return this.getEntry(this.getCurrentEntryPosition(), throwException);
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


    eachEntry(callback) {
        const results = [];
        let offset=0;
        each(this.state.playlist.entries, 0);
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

    async toggleEntryAtPosition(entryPosition) {
        const entryData = this.getEntry(entryPosition);
        if(this.isPlaylist(entryData.url)) {
            await this.togglePlaylistEntry(entryData);
        } else {
            if(this.state.playlist.position !== entryPosition) {
                this.state.playlist.position = entryPosition;
                this.playlistPlay();
            } else {
                console.warn('no action');
            }

        }
    }

    async togglePlaylistEntry(entryData) {
        if(!this.isPlaylist(entryData.url))
            throw new Error("Invalid playlist entry");
        entryData.open = !entryData.open;
        if(entryData.open === true) {
            if(!entryData.playlist) {
                entryData.loading = true;
                this.playlist && this.playlist.forceUpdate(); // TODO: optimize
                entryData.playlist = await this.loadPlaylistDataFromURL(entryData.url);
                delete entryData.loading;
            }

        }
        this.playlist && this.playlist.forceUpdate(); // TODO: optimize
    }

    playEntry(entryData) {

    }

    /** Loading **/

//     /** @deprecated **/
//     async loadSongFromURL(url) {
//         const song = this.song;
//         if(this.isPlaylist(url)) {
//             const playlistEntry = new PlaylistPlaylistEntry({url});
//             this.addEntry(playlistEntry);
//             this.forceUpdate();
//             // await this.loadPlaylistFromURL(url);
//             // const entry = this.getCurrentEntry();
//             // if(entry.url && !this.isPlaylist(entry.url))
//             //     await this.loadSongFromPlaylistEntry(this.position);
//         } else {
//             await song.loadSongFromURL(url);
//             this.setStatus("Loaded from url: " + url);
// //                 this.addSongURLToPlaylist(url, song.data.title, song.getSongLengthInSeconds());
//         }
//         // this.render();
//     }


    /** @deprecated **/
    async loadURLAsPlaylist(playlistURL) {
        this.addEntryToPlaylist(playlistURL);
        this.toggleEntryAtPosition(0);
        // this.state.playlist = await this.loadPlaylistDataFromURL(playlistURL);
        // this.forceUpdate();
    }

    async loadSongFromPlaylistEntry() {
        const currentEntry = await this.getCurrentEntry();

        let song;
        if(this.isPlaylist(currentEntry.url))
            throw new Error("Invalid song (playlist): " + currentEntry.url);

        if(currentEntry.file) {
            this.setStatus("Loading playlist song from file: " + currentEntry.file.name);
            song = await Song.loadSongFromFileInput(currentEntry.file);
        } else if(currentEntry.url) {
            this.setStatus("Loading playlist song from url: " + currentEntry.url);
            song = await Song.loadSongFromURL(currentEntry.url);
        } else {
            throw new Error("Invalid song entry: " + JSON.stringify(currentEntry));
        }
        return song;
        // this.setPositionEntry(currentEntry);

        // song.playlistPosition = this.position;
        // this.render();
    }

    async loadPlaylistDataFromURL(playlistURL) {
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

    addEntryToPlaylist(entryData, insertAtPosition=null) {
        entryData = this.parseEntryData(entryData);
        const playlist = this.state.playlist;
        if(!playlist.entries)
            playlist.entries = [];
        const entries = playlist.entries;
        if(insertAtPosition === null) {
            insertAtPosition = entries.length;
            entries.push(entryData);
        } else {
            entries.splice(insertAtPosition, 0, entryData);
        }
    }

    async openSongFromFileDialog(e, accept=null) {
        const file = await this.openFileDialog(accept);
        this.addInputFileToPlaylist(file);
    }

    addInputFileToPlaylist(file) {
        const entryData = {
            file,
            name: 'file://' + file.name,
            url: 'file://' + file.name
        };
        this.addEntryToPlaylist(entryData);
        this.playlist.forceUpdate();
    }

    // addSongURLToPlaylist(url, name=null, length=null) {
    //     this.addEntryToPlaylist({url, name, length});
    //     if(this.playlist)
    //         this.playlist.forceUpdate();
    //     this.setStatus("Added URL to playlist: " + url);
    // }
    // addSongFileToPlaylist(file, name=null, length=null) {
    //     const entryData = {
    //         url: 'file://' + file.name,
    //         name: name || file.name.split('/').pop(),
    //         length
    //     };
    //     this.addEntryToPlaylist(entryData);
    //     this.forceUpdate();
    //     this.setStatus("Added file to playlist: " + file.name);
    // }

    scrollToEntry(entryPosition) {
        console.log('TODO scrollToEntry', entryPosition)
        // (currentEntry.scrollIntoViewIfNeeded || currentEntry.scrollIntoView).apply(currentEntry);
    }

    /** Playback **/

    async playlistPlay() {
        // this.playlistStop();
        let position = this.getCurrentEntryPosition();
        if(this.song && this.song.playlistPosition === position) {
            if(this.song.isPaused)
                return this.song.resume();
            if(this.song.isPlaying)
                throw new Error("Song is already playing");
            await this.setCurrentSong(this.song);
            this.setStatus("Playing: " + this.song.data.title);
            return await this.song.play(this.getVolumeGain());
        }
        // let entry = await this.playlist.getCurrentEntry();
        // if(entry instanceof PlaylistPlaylistEntry)
        //     entry = await this.playlistMoveToNextSongEntry();

        this.setState({playing: true});
        let currentEntry = await this.getCurrentEntry();
        if(this.isPlaylist(currentEntry.url))
            await this.playlistMoveToNextSongEntry();
        while(this.state.playing) {
            this.scrollToEntry(this.getCurrentEntryPosition());
            const currentSong = await this.loadSongFromPlaylistEntry();
            await this.setCurrentSong(currentSong);
            this.setStatus("Playing: " + currentSong.data.title);
            await currentSong.play(this.getVolumeGain());
            if(!this.state.playing)
                break;
            // currentEntry = await this.playlistMoveToNextSongEntry();
        }
        this.setState({playing: false});
    }

    /** @deprecated **/
    async playlistStop() {
        this.isPlaylistActive = false;
        if(this.song && this.song.isPlaying) {
            this.setStatus("Stopping: " + this.song.data.title);
            this.song.stopPlayback();
            this.song.setPlaybackPositionInTicks(0);
            this.setStatus("Stopped: " + this.song.data.title);
        }
    }

    /** @deprecated **/
    async playlistNext() {
        this.playlistStop();
        await this.playlistMoveToNextSongEntry();
        await this.playlistPlay();
    }

    async playlistMovePosition(position) {
        let nextEntry = await this.getEntry(position,false);
        if(!nextEntry) position = 0;
        return await this.setPlaylistPosition(position);
    }

    /** @deprecated **/
    async playlistMoveToEntry(nextEntry) {
        const position = await this.getEntryPosition(nextEntry);
        return await this.playlistMovePosition(position);
    }

    async playlistMoveToNextSongEntry() {
        let position = this.getCurrentEntryPosition();
        const currentEntry = await this.getEntry(position);
        if(this.isPlaylist(currentEntry.url) && currentEntry.open !== true) {
            await this.togglePlaylistEntry(currentEntry);
            // this.playlist.forceUpdate();
            // await currentEntry.togglePlaylist(true);
        }
        let totalCount = await this.getPlaylistCount();
        for(let i=0; i<totalCount; i++) {
            position++;

            const currentEntry = await this.getEntry(position);
            if(this.isPlaylist(currentEntry.url)) {
                await this.togglePlaylistEntry(currentEntry);
                // this.playlist.forceUpdate();
                totalCount = await this.getPlaylistCount();
            } else {
                if(position >= totalCount)
                    position = 0;
                await this.setPlaylistPosition(position);
                return; // Done
                // return currentEntry;
            }
        }
        throw new Error("Song entry not found");
    }

    async getPlaylistCount() {
        let count=0;
        await this.eachEntry((entry, i) => count = i+1);
        return count;
    }

    async setPlaylistPosition(position) {
        if(position !== this.state.playlist.position) {
            this.state.playlist.position = position;
            this.playlist.forceUpdate();
            // const nextEntry = await this.getEntry(position);
            // await currentEntry.removePosition();
            // await nextEntry.setPosition();
        }
        // this.setState({position});
        // return nextEntry;
    }
    async setPositionEntry(entry) {
        const position = await this.findEntryPosition(entry);
        await this.setPlaylistPosition(position);
    }


    /** Utilities **/

    isPlaylist(entryUrl) {
        return entryUrl && (entryUrl.toString().toLowerCase().endsWith('.pl.json'));
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
    //         if(entry instanceof PlaylistPlaylistEntry)
    //             return null;
    //         return await callback(entry, offset++);
    //     })
    // }
    //
    // async eachPlaylistEntry(callback) {
    //     let offset=0;
    //     return await this.eachEntry(async (entry, i) => {
    //         if(!entry instanceof PlaylistPlaylistEntry)
    //             return null;
    //         return await callback(entry, offset++);
    //     })
    // }

    // getCurrentEntry() {
    //     if(this.state.playlist.length === 0)
    //         throw new Error("Empty playlist");
    //     return this.getEntry(this.state.playlist.position);
    // }

    // async addEntry(entry, insertAtPosition=null, skipDuplicate=true) {
    //     if(!entry instanceof PlaylistEntry)
    //         throw new Error("Invalid PlaylistEntry");
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
    //     // this.forceUpdate();
    //     return true;
    // }


    // async updateNextPosition() {
    //     let position = this.state.playlist.position;
    //     const currentEntry = await this.getEntry(position);
    //     await currentEntry.removePosition();
    //     position++;
    //     let nextEntry = await this.getEntry(position,false);
    //     if(!nextEntry) position = 0;
    //     return await this.setPlaylistPosition(position);
    // }


    // getPlaylistPosition() { return this.state.playlist.position; }


    // async updatePosition(position) {
    //     if(!this.playlist[position])
    //         throw new Error("Invalid playlist position: " + position);
    //     this.state.playlist.position = position;
    //     // await this.updateEntries();
    // }




    /** Song Playback **/

    // async songPlay() {
    //     if(this.playlistActive)
    //         throw new Error("Playback is already active");
    //     this.playlistActive = true;
    //     await this.song.play();
    //     await this.songNext(); // TODO: prevent async playback
    // }
    //
    // async songNext() {
    //     this.playlistActive = true;
    //     while(this.playlistActive) {
    //         const entry = await this.playlistMovePosition();
    //         (entry.scrollIntoViewIfNeeded || entry.scrollIntoView).apply(entry);
    //         const nextSong = await this.playlist.loadSongFromPlaylistEntry();
    //         this.setCurrentSong(nextSong);
    //         await this.song.play();
    //     }
    // }
    //
    // async songPause() {
    //     this.song.stopPlayback();
    // }

    // songStopIfPlaying() {
    //     if(this.playlistActive)
    //         this.songStop();
    // }


    setSongPosition(playbackPosition = null) {
        // const wasPlaying = !!this.song.playback;
        // if (wasPlaying)
        //     this.song.stopPlayback();
        if(!this.song)
            throw new Error("No song loaded");
        const song = this.song;
        if (playbackPosition === null) {
            playbackPosition = this.fieldSongPosition.value; // this.values.parsePlaybackPosition(this.fieldSongPosition.value);
        }
        song.setPlaybackPosition(playbackPosition);
        // if (wasPlaying)
        //     this.song.play();
    }

    // async clearPlaylist() {
    //     this.playlist.clear();
    // }

    /** @deprecated **/
    async playlistPlayTest() {
        let entry = await this.playlist.getCurrentEntry();
        while(entry) {
            (entry.scrollIntoViewIfNeeded || entry.scrollIntoView).apply(entry);
            await new Promise((resolve, reject) => {
                setTimeout(resolve, 1000);
            });
            entry = await this.playlistMoveToNextSongEntry();
        }
    }

    /** Toggle Panels **/

    togglePanelPlaylist(e) {
        this.classList.toggle('hide-panel-playlist');
    }

    togglePanelSong(e) {
        this.classList.toggle('hide-panel-song');
    }
    toggleFullscreen(e) {
        const setFullScreen = !this.classList.contains('fullscreen');
        // this.containerElm.classList.toggle('fullscreen', setFullScreen);
        this.classList.toggle('fullscreen', setFullScreen);

        if (setFullScreen) {

        }
    }




    /** Prompt **/

    openPromptDialog(message, defaultValue='') {
        return window.prompt(message, defaultValue);
    }

    async openFileDialog(accept=null) {
        return await new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            if(accept)
                input.setAttribute('accept', accept);
            input.addEventListener('change', () => {
                const file = input.files[0];
                if(file)
                    resolve(file);
                else
                    reject();
            });
            input.click();
        })
    }



    // get playlist() { return this.state.playlist; }

    // createStyleSheetLink(stylePath, scriptElm=null) {
    //     // const AudioSourceLoader = customElements.get('audio-source-loader');
    //     const linkHRef = new URL(stylePath, (scriptElm || thisModule).src);
    //     const link = document.createElement('link');
    //     link.setAttribute('rel', 'stylesheet');
    //     link.href = linkHRef;
    //     return link;
    // }

    // restart() {
    //     const RNRestart = require('react-native-restart').default;
    //     RNRestart.Restart();
    // }

    // openMenu(menuKey) {
    //     this.state.menuKey = menuKey;
    //     // if(this.props.onUpdateMenu)
    //         this.props.onUpdateMenu();
    //     // setTimeout(e => this.toggleMenu(), 10);
    // }
    //
    // toggleMenu(menuKey=null) {
    //     if(this.props.onToggleMenu)
    //         this.props.onToggleMenu();
    // }

}

export default PlayerActions;
