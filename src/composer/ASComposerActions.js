import {PresetLibrary, ProgramLoader, Song, ClientStorage, FileService, FileSupport} from "../song";
import {Instruction, Values} from "../song";
import PromptManager from "../common/prompt/PromptManager";
import ASComposerMenu from "./ASComposerMenu";
import ClientUserAPI from "../server/user/ClientUserAPI";

// import {TrackInfo} from "./track/";

class ASComposerActions extends ASComposerMenu {


    /** Status **/
    setStatus(statusText, statusType='log') {
        console[statusType](statusText);
        this.setState({statusText, statusType: statusType + ''});
    }

    setError(statusText) {
        this.setStatus(statusText, 'error');
    }


    /** User Session **/
    async sessionRefresh() {
        const userAPI = new ClientUserAPI();
        const session = await userAPI.getSession();
        // console.log('User Session: ', session);
        this.setState({
            session
        })
    }

    sessionIsUserLoggedIn() { return this.state.session.loggedIn; }

    toggleModal(modalName) {
        this.setState({
            showModal: this.state.showModal === modalName ? null : modalName
        })
    }

    showModal(modalName, modalArgs=null) {
        const state = {
            showModal: modalName,
            modalArgs
        };
        this.setState(state);
    }

    /** Library **/

    setLibrary(library) {
        if(!(library instanceof PresetLibrary))
            throw new Error("Invalid library: " + typeof library);
        this.library = library;
        // console.log('Current library: ', library);
    }


    /** Selected Component **/

    setSelectedComponent(type, id) {
        const selectedComponent = [type, id];
        console.log('selectedComponent', selectedComponent);
        if(this.state.selectedComponent.type === type
            && this.state.selectedComponent.id === id)
            return;
        this.setState({selectedComponent})
    }

    getSelectedComponent() {
        const [type, id] = this.state.selectedComponent;
        switch(type) {
            case 'program':
                return this.programGetRef(id);
            case 'track':
                return this.trackGetRef(id);
            default:
                throw new Error("Invalid component type: " + type);
        }
    }


    // getSelectedViewKey() {
    //     return this.state.selectedViewKey;
    // }

    getSelectedTrackName() {
        const [type, id] = this.state.selectedComponent;
        if(type === 'track')
            return id;
        return null;
    }

    /** Song rendering **/
    getSong() { return this.song; }

    /**
     * Sets current composer song
     * @param song
     */
    async setCurrentSong(song) {
        if(!song instanceof Song)
            throw new Error("Invalid current song");
        if(this.song) {
            this.setStatus("Unloading song: " + this.song.data.title);
            if(this.song.isPlaying()) {
                this.song.stopPlayback();
            }
            this.song.removeEventListener('*', this.cb.onSongEventCallback);
            this.song.unloadAll();
        }
        this.song = song;
        this.song.addEventListener('*', this.cb.onSongEventCallback);

        let songLength = 0;
        try {
            songLength = song.getSongLengthInSeconds();
        } catch (e) {
            console.error("Error loading song length: ", e);
        }

        if(this.props.onSongLoad)
            this.props.onSongLoad(song);

        const startTrackName = song.getStartTrackName() || 'root';
        const state = {
            statusText: "Loaded song: " + song.data.title,
            statusType: 'log',
            title: song.data.title,
            songUUID: song.data.uuid,
            songLength,
            selectedComponent: ['track', startTrackName],
            activeTracks: {},
            programStates: [],
        }
        state.activeTracks[startTrackName] = {viewMode: 'none'}; // TODO: Reset offsets
        await this.setStateAsync(state);
        console.log("Loading Song: ", song.data, songLength);
        await this.song.programLoadAll();
        // console.log("Current Song: ", song.data, songLength);
    }

    updateCurrentSong() {
        const selectedTrack = this.getSelectedTrackName();
        const activeTracks = this.state.activeTracks;
        if(Object.keys(activeTracks).length === 0)
            activeTracks[selectedTrack || 'root'] = {}


        // const songData = this.song.getProxiedData();
        // for(let trackName in this.state.activeTracks) {
        //     if(this.state.activeTracks.hasOwnProperty(trackName)) {
        //         if (songData.tracks[trackName]) {
        //             // if (this.state.activeTracks.hasOwnProperty(trackName)) {
        //                 // const trackState = new TrackState(this, trackName);
        //                 // trackState.updateRenderingStats();
        //             // }
        //             console.log("TODO finish")
        //         } else {
        //             // delete activeTracks[trackName];
        //             console.warn("Removing unavailable active track: " + trackName);
        //         }
        //     }
        // }

        let songLength = 0;
        try {
            songLength = this.song.getSongLengthInSeconds();
        } catch (e) {
            console.error("Error loading song length: ", e);
        }

        this.setState({
            songLength,
            activeTracks
        });
    }


    /** Menu **/


    openMenuByKey(menuName) {
        if(this.state.portrait) {
            let options = this.renderMenuByKey(menuName);
            /** @var {ASUIContextMenuContainer} **/
            const menuContextContainer = this.ref.menu.contextContainer.current;
            menuContextContainer.openMenu(options);
            return;
        }
        const menu = this.ref.menu[menuName];
        console.log('menu', menu);
        if(!menu)
            throw new Error("Menu not found: " + menu);
        if(!menu.current)
            throw new Error("Menu not rendered: " + menu);
        menu.current.openDropDownMenu();
    }


    /** State **/

    async setStateAsync(state) {
        await new Promise(resolve => {
            this.setState(state, resolve);
        })
    }

    async loadState() {
        const storage = new ClientStorage();
        const state = await storage.loadState('audio-source-composer-state');
        console.log('Loading State: ', state);


        if (state) {
            // if (typeof state.volume !== "undefined")
            //     this.setVolume(state.volume);
            // delete state.volume;
            // if(state.songUUID)
            await this.loadDefaultSong(state.songUUID);
            const recentValues = state.recentValues;
            delete state.songUUID;
            delete state.songLength;
            delete state.recentValues;
            delete state.session;
            await this.setStateAsync(state);
            // this.updateCurrentSong();
            // this.setCurrentSong(this.song); // Hack: resetting current song after setting state, bad idea

            if(recentValues) {
                Values.recentDurations = recentValues.recentDurations || [];
                Values.recentFrequencies = recentValues.recentFrequencies || [];
                PresetLibrary.recentSampleURLs = recentValues.recentLibrarySampleURLs || [];
            }

            const panelTrack = this.ref.panelTrack.current;
            if(panelTrack)
                panelTrack.setState(state.panelTrackState);

            for(let key in state.activeTracks) {
                if(state.activeTracks.hasOwnProperty(key)) try {
                    const trackState = state.activeTracks[key];
                    const activeTrack = this.ref.activeTracks[key].current;
                    activeTrack.setState(trackState, () => activeTrack.updateRenderingStats());
                } catch (e) {
                    console.error(e);
                }
            }
        } else {
            await this.loadDefaultSong();
        }
    }


    // async saveAll() {
    //     await this.saveSongToMemory();
    //     // await this.saveState()
    // }

    saveState() {
        const storage = new ClientStorage();
        const state = Object.assign({}, this.state, {
            activeTracks: {}
        });
        for(let key in this.ref.activeTracks) {
            if(this.ref.activeTracks.hasOwnProperty(key)) try {
                const activeTrack = this.ref.activeTracks[key];
                if(activeTrack.current)
                    state.activeTracks[key] = activeTrack.current.getStorageState();
            } catch (e) {
                console.error(e);
            }
        }

        state.recentValues = {
            recentFrequencies: Values.recentFrequencies,
            recentDurations: Values.recentDurations,
            recentLibrarySampleURLs: PresetLibrary.recentSampleURLs,
        }

        const panelTrack = this.ref.panelTrack.current;
        if(panelTrack)
            state.panelTrackState = panelTrack.state;

        // Delete playback stats
        delete state.paused;
        delete state.playing;
        delete state.statusText;
        delete state.statusType;
        delete state.version;
        delete state.portrait;
        state.songUUID = this.song.data.uuid;
        console.log('Saving State: ', state, this.ref.activeTracks);
        storage.saveState(state, 'audio-source-composer-state');
    }

    clearUIState() {
        this.setState({
            viewModes: {},
            activeTracks: {},
        });
    }


    /** Volume **/


    getVolume () {
        return this.state.volume;
    }

    setVolume (volume) {
        console.info("Setting volume: ", volume);
        this.setState({volume});
        if(this.lastVolumeGain)
            this.lastVolumeGain.gain.value = volume;
    }

    /** Song actions **/


    async setSongNamePrompt(newSongTitle) {
        newSongTitle = await PromptManager.openPromptDialog("Enter a new song name:", this.song.data.title);
        this.setSongName(newSongTitle);
    }
    setSongName(newSongTitle=null) {
        if(typeof newSongTitle !== "string")
            return this.setError("Invalid song title: " + newSongTitle);
        const data = this.song.getProxiedData();
        data.title = newSongTitle;
        this.setStatus(`Song title updated: ${newSongTitle}`);
    }

    async setSongVersionPrompt(newSongVersion) {
        newSongVersion = await PromptManager.openPromptDialog("Enter a new song version:", this.song.data.version);
        this.setSongVersion(newSongVersion);
    }
    setSongVersion(newSongVersion) {
        if(typeof newSongVersion !== "string")
            return this.setError("Invalid song version: " + newSongVersion);
        const data = this.song.getProxiedData();
        data.version = newSongVersion;
        this.setStatus(`Song version updated: ${newSongVersion}`);
    }

    async setSongStartingBPMPrompt() {
        const beatsPerMinute = await PromptManager.openPromptDialog("Enter a new song BPM:", this.song.data.beatsPerMinute);
        this.setSongStartingBPM(beatsPerMinute);
    }

    setSongStartingBPM(newSongBeatsPerMinute) {
        const bpm = Number.parseFloat(newSongBeatsPerMinute)
        if(Number.isNaN(bpm))
            return this.setError("Invalid BPM: " + newSongBeatsPerMinute)
        const data = this.song.getProxiedData();
        data.beatsPerMinute = bpm; // songChangeStartingBeatsPerMinute(newSongBeatsPerMinute);
        this.setStatus(`Song beats per minute updated: ${bpm}`);
    }



    async openSongFromFileDialog(e, accept=null) {
        const file = await this.openFileDialog(accept);
        await this.loadSongFromFileInput(e, file);
    }


    /** Song Loading **/

    async loadDefaultSong(recentSongUUID = null) {
        const src = this.props.src || this.props.url;
        if (src) {
            await this.loadSongFromURL(src);
            return true;
        }


        if (recentSongUUID) {
            try {
                await this.loadSongFromMemory(recentSongUUID);
                return;
            } catch (e) {
                console.error(e);
                this.setError("Error: " + e.message)
            }
        }

        await this.loadNewSongData();

        return false;
    }


    async loadNewSongData() {
        // const storage = new Storage();
        // const defaultProgramURL = this.getDefaultProgramClass() + '';
        // let songData = storage.generateDefaultSong(defaultProgramURL);
        // const song = Song.loadSongFromData(songData);
        const song = new Song();
        await this.setCurrentSong(song);
        await this.saveSongToMemory();
        // this.forceUpdate();
        this.clearUIState();
        this.setStatus("Loaded new song");
    }


    async loadRecentSongData() {
        const storage = new ClientStorage();
        let songRecentUUIDs = await storage.getRecentSongList();
        if (songRecentUUIDs[0] && songRecentUUIDs[0].uuid) {
            this.setStatus("Loading recent song: " + songRecentUUIDs[0].uuid);
            await this.loadSongFromMemory(songRecentUUIDs[0].uuid);
            return true;
        }
        return false;
    }

    async loadSongFromURLPrompt() {
        const url = await PromptManager.openPromptDialog("URL:", 'https://');
        return await this.loadSongFromURL(url);
    }
    async loadSongFromURL(url) {
        if(typeof url !== "string")
            throw new Error("Invalid URL: " + typeof url);
        this.setStatus("Loading song from url: " + url);
        try {
            const fileService = new FileService();
            const buffer = await fileService.loadBufferFromURL(url);
            const song = await this.loadSongFromBuffer(buffer, url);
            // await this.saveSongToMemory();
            this.setStatus("Song loaded from url: " + url);
            return song;
        } catch (e) {
            this.setError(e.message);
            throw e;
        }
    }

    async loadSongFromFileInput(e, file=null, accept=null) {
        if(file === null)
            file = await this.openFileDialog(accept);
        if (!file)
            throw new Error("Invalid file input");

        const buffer = await new Promise((resolve, reject) => {
            let reader = new FileReader();                                      // prepare the file Reader
            reader.readAsArrayBuffer(file);                 // read the binary data
            reader.onload =  (e) => {
                resolve(e.target.result);
            };
        });
        const song = await this.loadSongFromBuffer(buffer, file.name);
        await this.saveSongToMemory();
        return song;
    }

    async loadSongFromBuffer(buffer, filePath) {
        const fileSupport = new FileSupport();
        const song = await fileSupport.processSongFromFileBuffer(buffer, filePath);
        await this.setCurrentSong(song);
        this.clearUIState();
        return song;
    }



    async loadSongFromMemory(songUUID) {
        const storage = new ClientStorage();
        const songData = await storage.loadSongFromMemory(songUUID);
        const songHistory = await storage.loadSongHistoryFromMemory(songUUID);
        const song = new Song(songData);
        // song.loadSongData(songData);
        song.loadSongHistory(songHistory);
        await this.setCurrentSong(song);
        this.saveState();
        this.setStatus("Song loaded from memory: " + songUUID);
        return song;
    }


    async saveSongToMemory(setStatus=true) {
        const song = this.song;
        const songData = song.data; // getProxiedData();
        const songHistory = song.history;
        const storage = new ClientStorage();
        setStatus && this.setStatus("Saving song to memory...");
        await storage.saveSongToMemory(songData, songHistory);
        this.saveState();
        setStatus && this.setStatus("Saved song to memory: " + (songData.title || songData.uuid));
    }

    saveSongToMemoryWithTimeout(autoSaveTimeout=null, setStatus=false) {
        clearTimeout(this.timeouts.saveSongToMemory);
        this.timeouts.saveSongToMemory = setTimeout(e => this.saveSongToMemory(setStatus), autoSaveTimeout || this.autoSaveTimeout);
    }

    async saveSongToFile(prompt=true) {
        const songData = this.song.data; // getProxiedData();
        let fileName = (songData.title || "untitled")
                .replace(/\s+/g, '_')
            + '.json';
        if (prompt)
            fileName = await PromptManager.openPromptDialog("Download as file?", fileName);
        if (!fileName) {
            this.setError("Download canceled");
            return false;
        }

        const storage = new ClientStorage();
        storage.saveSongToFile(fileName, songData) &&
        this.setStatus("Saved song to local file: " + fileName);
    }

    /** Song Playback **/

    setSongPositionPercentage(playbackPercentage) {
        const playbackPosition = (playbackPercentage / 100) * this.state.songLength;
        return this.setSongPosition(playbackPosition);
    }

//     setSongPosition(songPosition) {
//         this.updateSongPositionValue(songPosition);
//         // this.state.songPosition = songPosition;
//         // this.setState({songPosition})
// //         console.info('setSongPosition', songPosition);
//     }

    async setSongPositionPrompt() {
        let songPosition = Values.instance.formatPlaybackPosition(this.songStats.position || 0);
        songPosition = await PromptManager.openPromptDialog("Set playback position:", songPosition);
        this.setSongPosition(songPosition);
    }

    setSongPosition(playbackPositionInSeconds, updateTrackPositions=true) {
        // TODO: parse % percentage
        if(typeof playbackPositionInSeconds === 'string')
            playbackPositionInSeconds = Values.instance.parsePlaybackPosition(playbackPositionInSeconds);
        if(isNaN(playbackPositionInSeconds))
            throw new Error("Invalid song position: " + playbackPositionInSeconds);
        this.songStats.position = playbackPositionInSeconds;

        // Update Song Panel
        const panelSong = this.ref.panelSong.current;
        panelSong && panelSong.forceUpdate();

        // Update Tracks
        if(updateTrackPositions) {
            for (const trackName in this.ref.activeTracks) {
                if (this.ref.activeTracks.hasOwnProperty(trackName)) {
                    const activeTrack = this.ref.activeTracks[trackName].current;
                    if(activeTrack) {
                        activeTrack.updateSongPosition(playbackPositionInSeconds);
                    } else {
                        delete this.ref.activeTracks[trackName];
                    }
                }
            }
        }
        // this.setState({songPosition:playbackPositionInSeconds})
    }

    /** Keyboard Commands **/

    keyboardChangeOctave(keyboardOctave = null) {
        this.ref.panelTrack.keyboardChangeOctave(keyboardOctave)
    }

    /** ASComposer State **/

    async updateState(newState) {
        new Promise(resolve => {
            this.setState(state => {
                if(typeof newState === "function")
                    newState = newState(state) || state;
                return newState;
            }, resolve)
        })
    }



    /** Song Playback **/

    getDestination() {
        const audioContext = this.getAudioContext();
        return this.getVolumeGain(audioContext.destination);        // TODO: get track destination
    }

    songPlay(songPosition=null, onended=null) {
        this.song.play(this.getDestination(),
            songPosition === null ? this.songStats.position : songPosition,
            onended);
    }

    songPause() {
        this.song.stopPlayback();
    }

    songStop() {
        if (this.song.playback)
            this.song.stopPlayback();
        ProgramLoader.stopAllPlayback();

        this.song.setPlaybackPositionInTicks(0);
    }




    /** Track Playback **/


    trackPlaySelected(stopPlayback=true) {
        const {selectedIndices, selectedTrackName} = this.getTrackPanelState()
        return this.trackPlay(selectedTrackName, selectedIndices.selectedIndices, stopPlayback);
    }

    trackPlay(trackName, selectedIndices, stopPlayback=true) {
        // console.log('trackPlay', trackName, selectedIndices)
        if(typeof selectedIndices === "number")
            selectedIndices = [selectedIndices];
        if(!Array.isArray(selectedIndices))
            throw new Error("Invalid selectedIndices: " + typeof selectedIndices);
        // const trackState = new ActiveTrackState(this, trackName);


        const song = this.getSong();
        if(stopPlayback && song.isPlaying())
            song.stopPlayback();

        let destination = this.getDestination();
        // let destination = audioContext.destination;


        // destination = destination || this.getDestination();
        // console.log('playInstructions', selectedIndices);
        // const programID = typeof trackState.programID !== "undefined" ? trackState.programID : 0;

        // if(stopPlayback)
        //     song.programLoader.stopAllPlayback();

        song.playSelectedInstructions(destination, trackName, selectedIndices);
    }


    /** Track Commands **/

    getTrackPanelState() {
        const panelTrack = this.ref.panelTrack.current;
        if(panelTrack)
            return panelTrack.state;
        return {};
    }

    trackSelect(selectedTrack, selectedIndices=null) {
        const [type, id] = this.state.selectedComponent;
        if(type !== 'track' || id !== selectedTrack) {
            this.setState({
                selectedComponent: ['track', selectedTrack],
            });
            const track = this.trackGetRef(selectedTrack);
            track.setState({viewMode: true});
        }
        if(selectedIndices !== null)
            this.trackSelectIndices(selectedTrack, selectedIndices);
    }

    trackUnselect(trackName) {
        this.setState(state => {
            delete state.activeTracks[trackName];
            state.selectedComponent = ['track', Object.keys(state.activeTracks)[0]];
            return state;
        });
    }



    trackSelectIndices(selectedTrack, selectedIndices=[]) {
        if(typeof selectedIndices === "number")
            selectedIndices = [selectedIndices];
        if(!Array.isArray(selectedIndices))
            throw new Error("Invalid selectedIndices: " + typeof selectedIndices);

        // console.log('selectTrack', state);
        const panelTrack = this.ref.panelTrack.current;
        panelTrack.updateSelectedTrackIndices(selectedTrack, selectedIndices)
    }

    async trackAdd(newTrackName = null, promptUser = true) {
        const song = this.song;

        newTrackName = newTrackName || song.generateInstructionTrackName();
        if(promptUser)
            newTrackName = await PromptManager.openPromptDialog("Create new instruction track?", newTrackName);
        if (newTrackName) {
            song.trackAdd(newTrackName, []);
            this.trackSelect(newTrackName);
        } else {
            this.setError("Create instruction track canceled");
        }
    }

    async trackRenamePrompt(oldTrackName) {
        const newTrackName = await PromptManager.openPromptDialog(`Rename instruction track "${oldTrackName}"?`, oldTrackName);
        this.trackRename(oldTrackName, newTrackName);
    }
    trackRename(oldTrackName, newTrackName) {
        const song = this.song;

        if (!newTrackName || newTrackName !== oldTrackName) {
            song.trackRename(oldTrackName, newTrackName);
            this.trackSelect(newTrackName);
            // this.trackSelect(oldTrackName);
        } else {
            this.setError("Rename instruction track canceled");
        }
    }

    trackRemove(trackName) {
        const song = this.song;
        song.trackRemove(trackName);
        this.trackUnselect(trackName);
    }
    async trackRemovePrompt(trackName) {
        const result = await PromptManager.openConfirmDialog(`Remove instruction track "${trackName}"?`);
        if (result) {
            this.trackRemove(trackName);
        } else {
            this.setError("Remove instruction track canceled");
        }

    }

    /** Track Reference **/


    trackGetRef(trackName, throwException = true) {
        const trackRef = this.ref.activeTracks[trackName];
        if(!trackRef) {
            if(throwException)
                throw new Error("Invalid Track ref: " + trackName);
            return null;
        }
        if(!trackRef.current) {
            if(throwException)
                throw new Error("Track ref is not rendered: " + trackName);
            return null;
        }
        return trackRef.current;
    }


    /** Current Instruction Args **/

    /** Instruction Modification **/

    // async instructionInsertAtCursorPrompt(trackName = null, newInstructionData = null) {
    //     newCommand = await PromptManager.openPromptDialog("Set custom command:", newCommand || '');
    //     return this.instructionInsertAtCursor(trackName, newInstructionData);
    // }

    // instructionInsertBeforeCursor(trackName = null, newCommand = null, select=true, playback=true) {
    //
    // }

    instructionInsertAtSelectedTrackCursor(trackName = null, commandString = null, parameters=null) {
        trackName = trackName || this.getSelectedTrackName();
        this.trackGetRef(trackName).instructionInsertAtCursor(commandString, parameters);
    }

    instructionInsertAtPosition(trackName, positionTicks, commandString, parameters = null, select=true) {
        console.log('instructionInsertAtPosition', trackName, positionTicks, commandString, parameters);
        //: TODO: check for recursive group

        let newInstructionData;
        if (Array.isArray(commandString)) {
            newInstructionData = commandString;
        } else if(parameters) {
            newInstructionData = [commandString].concat(parameters);
        } else {
            newInstructionData = this.state.selectedInstructionData.slice();
            newInstructionData.splice(1, 1, commandString);
        }

        const index = this.song.instructionInsertAtPosition(trackName, positionTicks, newInstructionData);
        if(select)
            this.trackSelect(trackName, index);
        if(this.state.playbackOnChange)
            this.trackPlay(trackName, index);
        this.updateCurrentSong();
        return index;
    }

    /** Instruction Args **/

    instructionReplaceArg(trackName, selectedIndices, argIndex, newArgValue) {
        const song = this.song;
        selectedIndices = Values.instance.parseSelectedIndices(selectedIndices);
        for (let i = 0; i < selectedIndices.length; i++) {
            song.instructionReplaceArg(trackName, selectedIndices[i], argIndex, newArgValue);
        }

        if(this.state.playbackOnChange)
            this.trackPlay(trackName, selectedIndices);
        // trackInfo.updateCurrentInstruction();
    }

    instructionReplaceArgByType(trackName, selectedIndices, argType, newArgValue) {
        const song = this.song;
        selectedIndices = Values.instance.parseSelectedIndices(selectedIndices);

        // console.log('instructionReplaceArg', trackName, selectedIndices, argIndex, newArgValue, selectedInstructionData);

        const selectedInstructionData = this.state.selectedInstructionData;
        const processor = new Instruction(selectedInstructionData);
        processor.updateArg(argType, newArgValue)
        this.setState({selectedInstructionData});
        for (let i = 0; i < selectedIndices.length; i++) {
            song.instructionReplaceArgByType(trackName, selectedIndices[i], argType, newArgValue);
        }

        if(this.state.playbackOnChange)
            this.trackPlay(trackName, selectedIndices);
        // trackInfo.updateCurrentInstruction();
    }



    /** Instruction Delete **/

    instructionDeleteIndices() {
        const {selectedIndices, selectedTrackName:trackName} = this.getTrackPanelState()
        // selectedIndices = this.values.parseSelectedIndices(selectedIndices);

        selectedIndices.sort((a, b) => a - b);
        for (let i=selectedIndices.length-1; i>=0; i--)
            this.song.instructionDeleteAtIndex(trackName, selectedIndices[i]);

        this.updateCurrentSong();
    }

    /** Tracker Clip Board **/

    instructionCopySelected() {
        const {selectedIndices, selectedTrackName:trackName} = this.getTrackPanelState()
        const iterator = this.instructionGetIterator(trackName);
        let startPosition = null, lastPosition=null, copyTrack=[];
        iterator.seekToEnd((instructionData) => {
            instructionData = instructionData.slice();

            const index = iterator.getIndex();
            for(let i=0; i<selectedIndices.length; i++)
                if(selectedIndices[i] === index) {
                    if(startPosition === null)
                        lastPosition = startPosition = iterator.getPositionInTicks();
                    instructionData[0] = iterator.getPositionInTicks() - lastPosition;
                    lastPosition = iterator.getPositionInTicks();
                    copyTrack.push(instructionData)
                    return instructionData;
                }
        });
        console.log("Clipboard:", copyTrack);
        this.setState({clipboard: copyTrack});

    }

    instructionCutSelected() {
        this.instructionCopySelected();
        this.instructionDeleteIndices();
    }

    instructionPasteAtCursor() {
        const trackName = this.getSelectedTrackName();
        const trackRef = this.trackGetRef(trackName);
        trackRef.instructionPasteAtCursor();
    }


    instructionPasteAtPosition(trackName, startPositionTicks) {
        // trackName = trackName || this.getSelectedTrackName();
        // trackName = trackName || this.getSelectedTrackName();

        const copyTrack = this.state.clipboard;
        if(!Array.isArray(copyTrack))
            throw new Error("Invalid clipboard data: " + typeof copyTrack);

        const selectedIndices = [];
        for(let i=0; i<copyTrack.length; i++) {
            const copyInstructionData = copyTrack[i];
            const insertPositionTicks = startPositionTicks + copyInstructionData[0];
            startPositionTicks = insertPositionTicks;
            const insertIndex = this.instructionInsertAtPosition(trackName, insertPositionTicks, copyInstructionData);
            selectedIndices.push(insertIndex);
        }

        // console.log('pastedIndices', selectedIndices);
        this.trackSelect(trackName, selectedIndices);
    }


    instructionGetIndicesInRange(trackName, positionTicksStart, positionTicksEnd) {

        const iterator = this.instructionGetIterator(trackName);
        const rangeIndices = [];
        // eslint-disable-next-line no-unused-vars
        for(const instructionData of iterator) {
            if(iterator.getPositionInTicks() < positionTicksStart)
                continue;
            if(iterator.getPositionInTicks() >= positionTicksEnd)
                continue;
            rangeIndices.push(iterator.getIndex());
        }
        console.log('instructionGetIndicesInRange', trackName, positionTicksStart, positionTicksEnd, rangeIndices);

        return rangeIndices;
    }


    /** Instruction Iterator **/


    instructionGetIterator(trackName, timeDivision=null, beatsPerMinute=null) {
        return this.trackGetRef(trackName)
            .getIterator(timeDivision, beatsPerMinute);
    }


    /** Programs **/

    programSelect(programID) {
        const [type, id] = this.state.selectedComponent;
        if(type !== 'program' || id !== programID) {
            this.setState({
                selectedComponent: ['program', programID],
            }, () => this.ref.panelProgram.current.forceUpdate());
        }
    }

    programGetRef(programID) {
        const programRef = this.ref.activePrograms[programID];
        if(!programRef)
            throw new Error("Invalid Program ref: " + programID);
        if(!programRef.current)
            throw new Error("Program ref is not rendered: " + programID);
        return programRef.current;
    }

    async programAddPrompt(programClassName, programConfig = {}) {
        this.setError(`New program canceled: ${programClassName}`);
    }

    programAdd(programClassName, programConfig = {}) {
        if (!programClassName)
            throw new Error(`Invalid program class`);

        // Verify program class name
        ProgramLoader.getProgramClassInfo(programClassName);

        const programID = this.song.programAdd(programClassName, programConfig);
        this.setStatus(`New program class '${programClassName}' added to song at position ${programID}`);
        this.programSetRendererState(programID, {open: true})
    }

    async programReplacePrompt(programID, programClassName, programConfig = {}) {
        if (!Number.isInteger(programID))
            throw new Error(`Invalid Program ID: Not an integer`);
        if (!programClassName)
            throw new Error(`Invalid Program class`);

        if (await PromptManager.openPromptDialog(`Change Program (${programID}) to ${programClassName}`)) {
            await this.song.programReplace(programID, programClassName, programConfig);
            this.setStatus(`Program (${programID}) changed to: ${programClassName}`);

        } else {
            this.setError(`Change program canceled: ${programClassName}`);
        }
    }

    async programRenamePrompt(programID, newProgramTitle = null) {
        const programConfig = this.song.programGetConfig(programID);
        // console.log(programConfig, programID);
        const oldProgramTitle = programConfig.title;
        if (!newProgramTitle)
            newProgramTitle = await PromptManager.openPromptDialog(`Change name for programs ${programID}: `, oldProgramTitle);
        if (!newProgramTitle)
            return console.error("Program name change canceled");
        this.song.programRename(programID, newProgramTitle);
        this.setStatus(`Program title updated: ${newProgramTitle}`);
    }

    async programRemovePrompt(programRemoveID = null) {
        if (await PromptManager.openConfirmDialog(`Remove Program ID: ${programRemoveID}`)) {
            this.song.programRemove(programRemoveID);
            this.setStatus(`Program (${programRemoveID}) removed`);

        } else {
            this.setError(`Remove program canceled`);
        }
    }

    /** Program State **/

    programGetRendererState(programID) {
        return this.state.programStates[programID] || {};
    }
    programSetRendererState(programID, state) {
        const programStates = this.state.programStates;
        if(!programStates[programID])   programStates[programID] = state;
        else                            Object.assign(programStates[programID], state);
        this.setState({
            programStates
        }, () => this.forceUpdate());
    }


    /** Settings **/

    toggleSetting(stateKey, callback=null) {
        if(typeof this.state[stateKey] === 'undefined')
            throw new Error("Invalid state key: " + stateKey);
        const newState = {};
        newState[stateKey] = !this.state[stateKey];
        this.setState(newState, callback);
        return false;
    }

    // /** Toggle Playback Settings **/
    //
    // togglePlaybackOnSelection()         { return this.toggleSetting('playbackOnSelect'); }
    // togglePlaybackOnChange()            { return this.toggleSetting('playbackOnChange'); }
    //
    // /** Toggle Track Formatting **/
    //
    // toggleTrackRowPositionInTicks()     { return this.toggleSetting('showTrackRowPositionInTicks'); }
    // toggleTrackRowDurationInTicks()     { return this.toggleSetting('showTrackRowDurationInTicks'); }


    /** Toggle View Settings **/

    setViewMode(viewKey, mode) {
        const viewModes = this.state.viewModes || {};
        if(mode === null)   delete viewModes[viewKey];
        else                viewModes[viewKey] = mode;
        console.log('viewModes', viewModes);
        this.setState({viewModes});
    }

    getViewMode(viewKey) {
        return this.state.viewModes[viewKey];
    }

    // toggleSongPanel()                   { return this.toggleSetting('showPanelSong'); }
    // toggleProgramPanel()                { return this.toggleSetting('showPanelProgram'); }
    // toggleInstructionPanel()            { return this.toggleSetting('showPanelInstruction'); }
    // toggleTrackPanel()                  { return this.toggleSetting('showPanelTrack'); }
    // togglePresetBrowserPanel()          { return this.toggleSetting('showPanelPresetBrowser'); }

    toggleFullscreen() {
        return this.toggleSetting('fullscreen', () => {
            this.onResize();
        });
    }


    /** Tools **/

    async batchSelect(e, searchCallbackString = null, promptUser = false) {
        if (promptUser || !searchCallbackString)
            searchCallbackString = await PromptManager.openPromptDialog("Run custom search:", searchCallbackString ||
                `/** Example Search **/ i.command === "C3"   &&   i.program === 0`);
        if (!searchCallbackString)
            throw new Error("Batch command canceled: Invalid search");

        const storage = new ClientStorage();
        storage.addBatchRecentSearches(searchCallbackString);

        throw new Error("TODO Implement");
    }

    async batchRunCommand(e, commandCallbackString = null, searchCallbackString = null, promptUser = false) {
        const storage = new ClientStorage();

        if (promptUser || !searchCallbackString)
            searchCallbackString = await PromptManager.openPromptDialog("Run custom search:", searchCallbackString ||
                `/** Example Search **/ i.command === "C3"   &&   i.program === 0`);
        if (!searchCallbackString)
            throw new Error("Batch command canceled: Invalid search");
        storage.addBatchRecentSearches(searchCallbackString);


        if (promptUser || !commandCallbackString)
            commandCallbackString = await PromptManager.openPromptDialog(`Run custom command:`, commandCallbackString ||
                `/** Example Command **/ i.command='C4';`);
        if (!commandCallbackString)
            throw new Error("Batch command canceled: Invalid command");
        storage.addBatchRecentCommands(commandCallbackString);

        throw new Error("TODO Implement");
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

}


export default ASComposerActions;
