import {Instruction, LibraryProcessor, ProgramLoader, Song, ClientStorage, FileService, FileSupport} from "../song";
import PromptManager from "../common/prompt/PromptManager";
import ASComposerMenu from "./ASComposerMenu";
import {InstructionProcessor} from "../common";
import TrackState from "./track/state/TrackState";
import Values from "../common/values/Values";

// import {TrackInfo} from "./track/";

class ASComposerActions extends ASComposerMenu {

    setStatus(statusText, statusType='log') {
        // console.log(`ASC.${statusType}`, statusText);
        this.setState({statusText, statusType: statusType + ''});
    }

    setError(statusText) {
        this.setStatus(statusText, 'error');
    }

    /** Library **/

    setLibrary(library) {
        if(!(library instanceof LibraryProcessor))
            throw new Error("Invalid library: " + typeof library);
        this.library = library;
        // console.log('Current library: ', library);
    }


    /** Selected Component **/

    setSelectedComponent(type, id) {
        const selectedComponent = [type, id];
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

    getSelectedTrackName() {
        const [type, name] = this.state.selectedComponent;
        if(type === 'track')
            return name;
        return null;
    }

    /** Song rendering **/
    getSong() { return this.song; }

    /**
     * Sets current composer song
     * @param song
     */
    setCurrentSong(song) {
        if(!song instanceof Song)
            throw new Error("Invalid current song");
        if(this.song) {
            this.setStatus("Unloading song: " + this.song.data.title);
            if(this.song.isPlaying()) {
                this.song.stopPlayback();
            }
            this.song.removeEventListener('*', this.onSongEventCallback);
            this.song.unloadAll();
        }
        this.song = song;
        console.log("Current Song: ", song.getProxiedData());

        this.song.addEventListener('*', this.onSongEventCallback);
        this.song.programLoadAll();

        const startTrackName = song.getStartTrackName() || 'root';
        const state = {
            statusText: "Loaded song: " + song.data.title,
            statusType: 'log',
            title: song.data.title,
            songUUID: song.data.uuid,
            songLength: song.getSongLengthInSeconds(),
            selectedComponent: ['track', startTrackName],
            activeTracks: {}
        }
        state.activeTracks[startTrackName] = {}; // TODO: open root, why not?
        this.setState(state);
    }

    updateCurrentSong() {
        const selectedTrack = this.getSelectedTrackName();
        const activeTracks = this.state.activeTracks;
        if(Object.keys(activeTracks).length === 0)
            activeTracks[selectedTrack || 'root'] = {}


        const songData = this.song.getProxiedData();
        for(let trackName in this.state.activeTracks) {
            if(this.state.activeTracks.hasOwnProperty(trackName)) {
                if (songData.tracks[trackName]) {
                    // if (this.state.activeTracks.hasOwnProperty(trackName)) {
                        // const trackState = new TrackState(this, trackName);
                        // trackState.updateRenderingProps();
                    // }
                    console.log("TODO finish")
                } else {
                    // delete activeTracks[trackName];
                    console.warn("Removing unavailable active track: " + trackName);
                }
            }
        }

        this.setState({
            songLength: this.song.getSongLengthInSeconds(),
            activeTracks
        });
    }


    /** Focus **/

    focusActiveTrack() {
        const trackName = this.getSelectedTrackName();
        if(trackName) try {
            const trackRef = this.trackGetRef(trackName);
            trackRef.focus();
        } catch (e) {
            console.warn(e);
        }
    }

    /** State **/

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
            delete state.recentValues;
            this.setState(state);
            this.updateCurrentSong();
            // this.setCurrentSong(this.song); // Hack: resetting current song after setting state, bad idea

            if(recentValues) {
                Values.recentDurations = recentValues.recentDurations || [];
                Values.recentFrequencies = recentValues.recentFrequencies || [];
                LibraryProcessor.recentSampleURLs = recentValues.recentLibrarySampleURLs || [];
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
            // activeTracks: {}
        });
        for(let key in this.ref.activeTracks) {
            if(this.ref.activeTracks.hasOwnProperty(key)) {
                const activeTrack = this.ref.activeTracks[key];
                if(activeTrack.current) {
                    Object.assign(state.activeTracks[key], activeTrack.current.state);
                }
            }
        }

        state.recentValues = {
            recentFrequencies: Values.recentFrequencies,
            recentDurations: Values.recentDurations,
            recentLibrarySampleURLs: LibraryProcessor.recentSampleURLs,
        }

        // Delete playback stats
        delete state.paused;
        delete state.playing;
        delete state.statusText;
        delete state.statusType;
        delete state.version;
        delete state.portrait;
        state.songUUID = this.song.data.uuid;
        console.log('Saving State: ', state);
        storage.saveState(state, 'audio-source-composer-state');
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
            throw new Error("Invalid song title: " + newSongTitle);
        this.song.data.title = newSongTitle;
        this.setStatus(`Song title updated: ${newSongTitle}`);
    }

    async setSongVersionPrompt(newSongVersion) {
        newSongVersion = await PromptManager.openPromptDialog("Enter a new song version:", this.song.data.version);
        this.setSongVersion(newSongVersion);
    }
    setSongVersion(newSongVersion) {
        if(typeof newSongVersion !== "string")
            throw new Error("Invalid song version: " + newSongVersion);
        this.song.data.version = newSongVersion;
        this.setStatus(`Song version updated: ${newSongVersion}`);
    }

    async setSongStartingBPMPrompt() {
        const beatsPerMinute = await PromptManager.openPromptDialog("Enter a new song BPM:", this.song.data.beatsPerMinute);
        this.setSongStartingBPM(beatsPerMinute);
    }

    setSongStartingBPM(newSongBeatsPerMinute) {
        const bpm = Number.parseFloat(newSongBeatsPerMinute)
        if(Number.isNaN(bpm))
            throw new Error("Invalid BPM: " + newSongBeatsPerMinute)
        this.song.data.beatsPerMinute = bpm; // songChangeStartingBeatsPerMinute(newSongBeatsPerMinute);
        this.setStatus(`Song beats per minute updated: ${bpm}`);
    }



    async openSongFromFileDialog(e, accept=null) {
        const file = await this.openFileDialog(accept);
        this.loadSongFromFileInput(e, file);
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
        this.setCurrentSong(song);
        // this.forceUpdate();
        this.setStatus("Loaded new song");
        await this.saveSongToMemory();
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

    async loadSongFromURL(url) {
        const fileService = new FileService();
        const buffer = await fileService.loadBufferFromURL(url);
        return await this.loadSongFromBuffer(buffer, url);
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
        return await this.loadSongFromBuffer(buffer, file.name);
    }

    async loadSongFromBuffer(buffer, filePath) {
        const fileSupport = new FileSupport();
        const song = await fileSupport.processSongFromFileBuffer(buffer, filePath);
        this.setCurrentSong(song);
        return song;
    }



    async loadSongFromMemory(songUUID) {
        const storage = new ClientStorage();
        const songData = await storage.loadSongFromMemory(songUUID);
        const songHistory = await storage.loadSongHistoryFromMemory(songUUID);
        const song = new Song(songData);
        // song.loadSongData(songData);
        song.loadSongHistory(songHistory);
        this.setCurrentSong(song);
        this.setStatus("Song loaded from memory: " + songUUID);
        this.saveState();
    }


    async saveSongToMemory(setStatus=true) {
        const song = this.song;
        const songData = song.getProxiedData();
        const songHistory = song.history;
        const storage = new ClientStorage();
        setStatus && this.setStatus("Saving song to memory...");
        await storage.saveSongToMemory(songData, songHistory);
        setStatus && this.setStatus("Saved song to memory: " + (songData.title || songData.uuid));
        this.saveState();
    }

    saveSongToMemoryWithTimeout(autoSaveTimeout=null, setStatus=false) {
        clearTimeout(this.timeouts.saveSongToMemory);
        this.timeouts.saveSongToMemory = setTimeout(e => this.saveSongToMemory(setStatus), autoSaveTimeout || this.autoSaveTimeout);
    }

    async saveSongToFile(prompt=true) {
        const songData = this.song.getProxiedData();
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

    setSongPosition(songPosition) {
        // TODO: parse % percentage
        if(typeof songPosition === 'string')
            songPosition = this.values.parsePlaybackPosition(songPosition);
        if(isNaN(songPosition))
            throw new Error("Invalid song position: " + songPosition);
        this.updateSongPositionValue(songPosition);
        // this.state.songPosition = songPosition;
        // this.setState({songPosition})
//         console.info('setSongPosition', songPosition);
    }

    async setSongPositionPrompt() {
        let songPosition = this.values.formatPlaybackPosition(this.songStats.position || 0);
        songPosition = await PromptManager.openPromptDialog("Set playback position:", songPosition);
        this.setSongPosition(songPosition);
    }

    updateSongPositionValue(playbackPositionInSeconds, updateTrackPositions=true) {
        this.songStats.position = playbackPositionInSeconds;

        // Update Song Panel
        const panelSong = this.ref.panelSong.current;
        panelSong && panelSong.forceUpdate();

        // Update Tracks
        if(updateTrackPositions) {
            // TODO Optimize: skip update if position change is less than next row?
            for (const trackName in this.ref.activeTracks) {
                if (this.ref.activeTracks.hasOwnProperty(trackName)) {
                    const activeTrack = this.ref.activeTracks[trackName].current;
                    activeTrack && activeTrack.forceUpdate();
                }
            }
        }
        // this.setState({songPosition:playbackPositionInSeconds})
    }

    /** Keyboard Commands **/

    keyboardChangeOctave(keyboardOctave = null) {
        if (!Number.isInteger(keyboardOctave))
            throw new Error("Invalid segment ID");
        this.setState({keyboardOctave});
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
        return this.trackPlay(this.state.selectedTrack, this.state.selectedTrackIndices, stopPlayback);
    }

    trackPlay(trackName, selectedIndices, stopPlayback=true) {
        // const trackState = new ActiveTrackState(this, trackName);


        const song = this.getSong();
        if(stopPlayback && song.isPlaying())
            song.stopPlayback();

        let destination = this.getDestination();
        // let destination = audioContext.destination;


        // destination = destination || this.getDestination();
        if(!Array.isArray(selectedIndices))
            selectedIndices = [selectedIndices];
        // console.log('playInstructions', selectedIndices);
        // const programID = typeof trackState.programID !== "undefined" ? trackState.programID : 0;

        // if(stopPlayback)
        //     song.programLoader.stopAllPlayback();

        song.playSelectedInstructions(destination, trackName, selectedIndices);
    }


    /** Track Commands **/

    async trackAdd(newTrackName = null, promptUser = true) {
        const song = this.song;

        newTrackName = newTrackName || song.generateInstructionTrackName();
        if(promptUser)
            newTrackName = await PromptManager.openPromptDialog("Create new instruction group?", newTrackName);
        if (newTrackName) {
            song.trackAdd(newTrackName, []);
            await this.trackSelectIndices(newTrackName);
        } else {
            this.setError("Create instruction group canceled");
        }
    }

    async trackRename(oldTrackName, newTrackName = null, promptUser = true) {
        const song = this.song;

        if(promptUser)
            newTrackName = await PromptManager.openPromptDialog(`Rename instruction group (${oldTrackName})?`, oldTrackName);
        if (newTrackName !== oldTrackName) {
            song.trackRename(oldTrackName, newTrackName);
            this.trackSelectIndices(newTrackName);
            this.trackSelectIndices(oldTrackName);
        } else {
            this.setError("Rename instruction group canceled");
        }
    }

    async trackRemove(trackName, promptUser = true) {
        const song = this.song;

        const result = promptUser ? await PromptManager.openPromptDialog(`Remove instruction group (${trackName})?`) : true;
        if (result) {
            song.trackRemove(trackName);
            this.trackUnselect(trackName);
        } else {
            this.setError("Remove instruction group canceled");
        }

    }

    /** Track State **/


    trackHasActive(trackName) {
        return !!this.state.activeTracks[trackName]
    }

    trackGetRef(trackName) {
        const trackRef = this.ref.activeTracks[trackName];
        if(!trackRef)
            throw new Error("Invalid Track ref: " + trackName);
        if(!trackRef.current)
            throw new Error("Track ref is not rendered: " + trackName);
        return trackRef.current;
    }

    trackGetState(trackName) {
        return new TrackState(this, trackName);
    }

    trackUpdatePlayingIndices(trackName, playingIndices) {
        this.trackGetState(trackName)
            .updatePlayingIndices(playingIndices);
    }


    /** Track Selection **/

    trackSelectActive(trackName, trackData=null, reorderLast=false) {
        this.setState(state => {
            const oldTrackData = state.activeTracks[trackName];
            if(reorderLast) {
                delete state.activeTracks[trackName];
            }
            state.activeTracks[trackName] = oldTrackData || {};
            if(trackData !== null)
                Object.assign(state.activeTracks[trackName], trackData);
            state.selectedComponent = ['track', trackName];
            return state;
        });

        // TODO: parent stats
        // trackData = this.state.activeTracks[trackName];
        // if(trackData.destinationList)
        //     selectedTrack = trackData.destinationList.slice(-1)[0]; // Select last track
        // else
        //     selectedTrack = this.getSong().getStartTrackName();
    }

    async trackSelectIndicesPrompt(trackName=null) {
        if(trackName === null)
            trackName = this.getSelectedTrackName();
        let selectedIndices = this.state.selectedTrackIndices.join(', ');
        selectedIndices = await PromptManager.openPromptDialog(`Select indices for track ${trackName}: `, selectedIndices);
        this.trackSelectIndices(trackName, selectedIndices);
    }



    trackUnselect(trackName) {
        this.setState(state => {
            delete state.activeTracks[trackName];
            state.selectedComponent = ['track', Object.keys(state.activeTracks)[0]];
            return state;
        });
    }



    trackSelectIndices(trackName, selectedIndices=[], clearSelection=true, playback=true) {
        // console.log('trackSelectIndices', trackName, selectedIndices, this.state.selectedTrackIndices)

        if (typeof selectedIndices === "string") {
            switch (selectedIndices) {
                case 'cursor':
                    throw new Error('TODO');
                case 'all':
                    selectedIndices = [];
                    const maxLength = this.getSong().instructionGetList(trackName).length;
                    for (let i = 0; i < maxLength; i++)
                        selectedIndices.push(i);
                    break;
                case 'segment':


                    break;
                // selectedIndices = [].map.call(this.querySelectorAll('asct-instruction'), (elm => elm.index));
                case 'row':
                    throw new Error('TODO');
                case 'none':
                    selectedIndices = [];
                    break;
                default:
                    selectedIndices = selectedIndices.split(/[^0-9]/).map(index => parseInt(index));
                // throw new Error("Invalid selection: " + selectedIndices);
            }
        }

        selectedIndices = this.values.parseSelectedIndices(selectedIndices);
        switch(clearSelection) {
            case false:
                if (this.state.selectedTrackIndices.length > 0)
                    selectedIndices = this.values.filterAndSort(selectedIndices.concat(this.state.selectedTrackIndices));
                break;

            default:
            case true:
                break;

            case 'toggle':
                if (this.state.selectedTrackIndices.length > 0) {
                    const toggledSelectedIndices = this.state.selectedTrackIndices.slice();
                    for(const selectedIndex of selectedIndices) {
                        const p = toggledSelectedIndices.indexOf(selectedIndex);
                        if(p === -1) {
                            toggledSelectedIndices.push(selectedIndex);
                        } else {
                            toggledSelectedIndices.splice(p, 1);
                        }
                    }
                    selectedIndices = this.values.filterAndSort(toggledSelectedIndices);
                }

                break;
        }

        const state = {
            // selectedIndices,
            activeTracks: this.state.activeTracks,
            selectedComponent: ['track', trackName],
            selectedTrackIndices: selectedIndices
        }
        if(!state.activeTracks[trackName])
            state.activeTracks[trackName] = {}; // TODO: hack
        if(selectedIndices.length > 0) {
            const instructionData = this.getSong().instructionDataGetByIndex(trackName, selectedIndices[0]);
            state.selectedInstructionData = instructionData.slice();
            state.selectedInstructionData[0] = 0;
            // console.log('selectedInstructionData', state.selectedInstructionData);
        }

        if(this.state.playbackOnSelect && playback)
            this.trackPlay(trackName, selectedIndices, false);


        this.setState(state);
        return selectedIndices;

    }



    trackerChangeQuantization(trackName=null, trackerQuantizationTicks) {
        return this.trackGetState(trackName || this.getSelectedTrackName())
            .changeQuantization(trackerQuantizationTicks)
    }

    async trackerChangeQuantizationPrompt(trackName) {
        return this.trackGetState(trackName || this.getSelectedTrackName())
            .changeQuantizationPrompt();
    }


    trackerChangeSegmentLength(trackName, rowLength = null) {
        return this.trackGetState(trackName || this.getSelectedTrackName())
            .changeRowLength(rowLength)
    }

    async trackerChangeSegmentLengthPrompt(trackName) {
        return this.trackGetState(trackName || this.getSelectedTrackName())
            .changeRowLengthPrompt()
    }



    /** Current Instruction Args **/

    /** Instruction Modification **/

    async instructionInsertAtCursorPrompt(trackName = null, newCommand = null, promptUser = false, select=true, playback=true) {
        if(promptUser)
            newCommand = await PromptManager.openPromptDialog("Set custom command:", newCommand || '');
        return this.instructionInsertAtCursor(trackName, newCommand, select, playback);
    }

    instructionInsertBeforeCursor(trackName = null, newCommand = null, select=true, playback=true) {

    }


    instructionInsertAtCursor(trackName = null, newInstructionData = null) {
        trackName = trackName || this.getSelectedTrackName();
        // newCommand = newCommand || this.state.currentCommand;
        const trackRef = this.trackGetRef(trackName);
        trackRef.instructionInsertAtCursor(newInstructionData);
    }

    instructionInsertAtPosition(trackName, positionTicks, newInstructionData = null) {
        //: TODO: check for recursive group

        if (newInstructionData === null)
            newInstructionData = this.state.selectedInstructionData.slice();
        if (!Array.isArray(newInstructionData)) {
            const commandString = newInstructionData;
            newInstructionData = this.state.selectedInstructionData.slice();
            newInstructionData.splice(1, 1, commandString);
        }
        if (!newInstructionData)
            throw new Error("Invalid Instruction command");

        newInstructionData = Instruction.parseInstructionData(newInstructionData);
        newInstructionData[0] = 0;

        const index = this.song.instructionInsertAtPosition(trackName, positionTicks, newInstructionData);
        // if(select)      this.trackSelectIndices(trackName, index);
        // if(playback)    this.trackPlay(trackName, index);
        this.updateCurrentSong();
        return index;
    }

    /** Instruction Args **/

    instructionReplaceArg(trackName, selectedIndices, argIndex, newArgValue) {
        const song = this.song;
        selectedIndices = this.values.parseSelectedIndices(selectedIndices);
        for (let i = 0; i < selectedIndices.length; i++) {
            song.instructionReplaceArg(trackName, selectedIndices[i], argIndex, newArgValue);
        }

        if(this.state.playbackOnChange)
            this.trackPlay(trackName, selectedIndices);
        // trackInfo.updateCurrentInstruction();
    }

    instructionReplaceArgByType(trackName, selectedIndices, argType, newArgValue) {
        const song = this.song;
        selectedIndices = this.values.parseSelectedIndices(selectedIndices);

        // console.log('instructionReplaceArg', trackName, selectedIndices, argIndex, newArgValue, selectedInstructionData);

        const selectedInstructionData = this.state.selectedInstructionData;
        const processor = new InstructionProcessor(selectedInstructionData);
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

    instructionDeleteIndices(trackName=null, selectedIndices=null) {
        trackName = trackName || this.getSelectedTrackName();
        selectedIndices = selectedIndices || this.state.selectedTrackIndices;
        selectedIndices = this.values.parseSelectedIndices(selectedIndices);

        selectedIndices.sort((a, b) => a - b);
        for (let i=selectedIndices.length-1; i>=0; i--)
            this.song.instructionDeleteAtIndex(trackName, selectedIndices[i]);

        this.trackSelectIndices(trackName, 'none');
        this.updateCurrentSong();
    }

    /** Tracker Clip Board **/

    instructionCopySelected() {
        const trackName = this.getSelectedTrackName();
        const selectedIndices = this.state.selectedTrackIndices;
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
        this.trackSelectIndices(trackName, selectedIndices);
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
        return this.trackGetState(trackName)
            .getIterator(timeDivision, beatsPerMinute);
    }


    /** Programs **/

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


    /** Settings **/

    toggleSetting(stateKey, callback=null) {
        if(typeof this.state[stateKey] === 'undefined')
            throw new Error("Invalid state key: " + stateKey);
        const newState = {};
        newState[stateKey] = !this.state[stateKey];
        this.setState(newState, callback);
        return false;
    }

    /** Toggle Playback Settings **/

    togglePlaybackOnSelection()         { return this.toggleSetting('playbackOnSelect'); }
    togglePlaybackOnChange()            { return this.toggleSetting('playbackOnChange'); }


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

    toggleSongPanel()                   { return this.toggleSetting('showPanelSong'); }
    toggleProgramPanel()                { return this.toggleSetting('showPanelProgram'); }
    toggleInstructionPanel()            { return this.toggleSetting('showPanelInstruction'); }
    toggleTrackPanel()                  { return this.toggleSetting('showPanelTrack'); }
    togglePresetBrowserPanel()          { return this.toggleSetting('showPanelPresetBrowser'); }

    toggleFullscreen() {
        this.toggleSetting('fullscreen', () => {
            this.onResize();
        });
    }

    /** Toggle Track Formatting **/

    toggleTrackRowPositionInTicks() { this.setState({showTrackRowPositionInTicks: !this.state.showTrackRowPositionInTicks}); }
    toggleTrackRowDurationInTicks() { this.setState({showTrackRowDurationInTicks: !this.state.showTrackRowDurationInTicks}); }


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
