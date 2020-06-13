import {Instruction, ProgramLoader, Song, Storage} from "../song";
import PromptManager from "../common/prompt/PromptManager";
import ASComposerMenu from "./ASComposerMenu";
import FileService from "../song/file/FileService";
import {InstructionProcessor} from "../common";

// import {TrackInfo} from "./track/";

class ASComposerActions extends ASComposerMenu {
    // constructor(props) {
    //     super(props);
    // }

    setStatus(statusText, statusType='log') {
        this.setState({statusText, statusType: statusType + ''});
    }

    setError(statusText) {
        this.setStatus(statusText, 'error');
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

        const activeTracks = {
            'root': {
                // destination: this.getAudioContext()
            },
        };

        this.song.addEventListener('*', this.onSongEventCallback);
        // this.setStatus("Initializing song: " + song.data.title);
        // this.song.connect(this.getAudioContext());
        // this.setStatus("Loaded song: " + song.data.title);
        this.setState({
            statusText: "Loaded song: " + song.data.title,
            statusType: 'log',
            title: song.data.title,
            songUUID: song.data.uuid,
            songLength: song.getSongLengthInSeconds(),
            selectedTrack: song.getStartTrackName() || 'root',
            activeTracks
        });
        // this.trackerToggleTrack('track0', true);
        // this.trackerToggleTrack('track1', true);
    }

    updateCurrentSong() {
        this.setState({
            songLength: this.song.getSongLengthInSeconds(),
        });
        for(let key in this.activeTracks) {
            if(this.activeTracks.hasOwnProperty(key)) {
                const activeTrack = this.activeTracks[key];
                if(activeTrack.current) {
                    activeTrack.current.updateTrackLengthInTicks();
                }
            }
        }
    }


    /** State **/

    async loadState() {
        const storage = new Storage();
        const state = await storage.loadState('audio-source-composer-state');
        console.log('Loading State: ', state);


        if (state) {
            if (typeof state.volume !== "undefined")
                this.setVolume(state.volume);
            // delete state.volume;
            // if(state.songUUID)
            await this.loadDefaultSong(state.songUUID);
            delete state.songUUID;
            this.setState(state);
            this.updateCurrentSong();
            // this.setCurrentSong(this.song); // Hack: resetting current song after setting state, bad idea

        } else {
            await this.loadDefaultSong();
        }
    }


    async saveAll() {
        await this.saveSongToMemory();
        // await this.saveState()
    }

    async saveState() {
        const storage = new Storage();
        const state = Object.assign({}, this.state, {
            activeTracks: {}
        });
        for(let key in this.activeTracks) {
            if(this.activeTracks.hasOwnProperty(key)) {
                const activeTrack = this.activeTracks[key];
                if(activeTrack.current) {
                    state.activeTracks[key] = activeTrack.current.state;
                }
            }
        }
        delete state.paused;
        delete state.playing;
        delete state.statusText;
        delete state.statusType;
        delete state.version;
        delete state.portrait;
        state.songUUID = this.song.data.uuid;
        console.log('Saving State: ', state);
        await storage.saveState(state, 'audio-source-composer-state');
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
        newSongTitle = await PromptManager.openPromptDialog("Enter a new song name", this.song.data.title);
        this.setSongName(newSongTitle);
    }
    setSongName(newSongTitle=null) {
        if(typeof newSongTitle !== "string")
            throw new Error("Invalid song title: " + newSongTitle);
        this.song.data.title = newSongTitle;
        this.setStatus(`Song title updated: ${newSongTitle}`);
    }

    async setSongVersionPrompt(newSongVersion) {
        newSongVersion = await PromptManager.openPromptDialog("Enter a new song version", this.song.data.version);
        this.setSongVersion(newSongVersion);
    }
    setSongVersion(newSongVersion) {
        if(typeof newSongVersion !== "string")
            throw new Error("Invalid song version: " + newSongVersion);
        this.song.data.version = newSongVersion;
        this.setStatus(`Song version updated: ${newSongVersion}`);
    }

    songChangeStartingBeatsPerMinute(newSongBeatsPerMinute) {
        this.song.data.beatsPerMinute = newSongBeatsPerMinute; // songChangeStartingBeatsPerMinute(newSongBeatsPerMinute);
        this.setStatus(`Song beats per minute updated: ${newSongBeatsPerMinute}`);
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

        this.loadNewSongData();
        await this.saveSongToMemory();

        return false;
    }

    loadNewSongData() {
        // const storage = new Storage();
        // const defaultProgramURL = this.getDefaultProgramClass() + '';
        // let songData = storage.generateDefaultSong(defaultProgramURL);
        // const song = Song.loadSongFromData(songData);
        const song = new Song(this.audioContext);
        this.setCurrentSong(song);
        // this.forceUpdate();
        this.setStatus("Loaded new song", song.getProxiedData());
    }


    async loadRecentSongData() {
        const storage = new Storage();
        let songRecentUUIDs = await storage.getRecentSongList();
        if (songRecentUUIDs[0] && songRecentUUIDs[0].uuid) {
            this.setStatus("Loading recent song: " + songRecentUUIDs[0].uuid);
            await this.loadSongFromMemory(songRecentUUIDs[0].uuid);
            return true;
        }
        return false;
    }

    async loadSongFromURL(url) {
        const library = Song.getFileSupportModule(url);
        if (typeof library.loadSongDataFromBuffer !== "function")
            throw new Error("Invalid library.loadSongDataFromURL method: " + url);

        const fileService = new FileService();
        const buffer = await fileService.loadBufferFromURL(url);
        // const buffer = await response.arrayBuffer();
        const songData = library.loadSongDataFromBuffer(buffer, url);
        const song = new Song();
        song.loadSongData(songData);
        this.setStatus("Loaded from url: " + url);
        return song;
    }

    async loadSongFromFileInput(e, file=null, accept=null) {
        if(file === null)
            file = await this.openFileDialog(accept);
        if (!file)
            throw new Error("Invalid file input");

        const library = Song.getFileSupportModule(file.name);
        if (typeof library.loadSongDataFromFileInput !== "function")
            throw new Error("Invalid library.loadSongDataFromFileInput method");

        const buffer = await this.loadBufferFromFileInput(file);
        const songData = library.loadSongDataFromBuffer(buffer, file.name);
        const song = new Song();
        song.loadSongData(songData);
        this.setCurrentSong(song);
        return song;
    }

    async loadBufferFromFileInput(file) {
        return await new Promise((resolve, reject) => {
            let reader = new FileReader();                                      // prepare the file Reader
            reader.readAsArrayBuffer(file);                 // read the binary data
            reader.onload =  (e) => {
                resolve(e.target.result);
            };
        });
    }


    async loadSongFromMemory(songUUID) {
        const storage = new Storage();
        const songData = await storage.loadSongFromMemory(songUUID);
        const songHistory = await storage.loadSongHistoryFromMemory(songUUID);
        const song = new Song(songData);
        song.loadSongData(songData);
        song.loadSongHistory(songHistory);
        this.setCurrentSong(song);
        this.setStatus("Song loaded from memory: " + songUUID);
        this.saveState();
    }


    async saveSongToMemory() {
        const song = this.song;
        const songData = song.getProxiedData();
        const songHistory = song.history;
        const storage = new Storage();
        this.setStatus("Saving song to memory...");
        await storage.saveSongToMemory(songData, songHistory);
        this.setStatus("Saved song to memory: " + (songData.title || songData.uuid));
        this.saveState();
    }

    saveSongToFile() {
        const songData = this.song.getProxiedData();
        // const songHistory = this.song.history;
        const storage = new Storage();
        this.setStatus("Saving song to file");
        storage.saveSongToFile(songData);
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
        this.setState({songPosition})
//         console.info('setSongPosition', songPosition);
    }

    async setSongPositionPrompt() {
        let songPosition = this.values.formatPlaybackPosition(this.state.songPosition || 0);
        songPosition = await PromptManager.openPromptDialog("Set playback position:", songPosition);
        this.setSongPosition(songPosition);
    }

    updateSongPositionValue(playbackPositionInSeconds) {
        this.setState({songPosition:playbackPositionInSeconds})
    }

    /** Current Instruction Args **/

    /** Instruction Modification **/
// TODO: where is auto-select auto-playback handled?
    async instructionInsertAtCursorPrompt(trackName = null, newCommand = null, promptUser = false, select=true, playback=true) {
        if(promptUser)
            newCommand = await PromptManager.openPromptDialog("Set custom command:", newCommand || '');
        return this.instructionInsertAtCursor(trackName, newCommand, select, playback);
    }

    instructionInsertAtCursor(trackName = null, newCommand = null, select=true, playback=true) {
        trackName = trackName || this.state.selectedTrack;
        newCommand = newCommand || this.state.currentCommand;
        // console.log('instructionInsert', newCommand, trackName);

        const activeTrack = this.getActiveTrack(trackName);
        const {positionTicks} = activeTrack.cursorGetInfo(); // TODO: insert between
        return this.instructionInsertAtPosition(trackName, positionTicks, newCommand, select, playback);
    }

    instructionInsertAtPosition(trackName, positionTicks, newInstructionData = null, select=false, playback=false) {
        //: TODO: check for recursive group

        if (newInstructionData === null)
            newInstructionData = this.state.currentCommand;
        if (!newInstructionData)
            throw new Error("Invalid Instruction command");

        newInstructionData = Instruction.parseInstructionData(newInstructionData);
        newInstructionData[0] = 0;

        const index = this.song.instructionInsertAtPosition(trackName, positionTicks, newInstructionData);
        if(select)      this.trackerSelectIndices(trackName, index);
        if(playback)    this.trackerPlay(trackName, index);
        this.updateCurrentSong();
        return index;
    }

    /** Instruction Args **/



    instructionReplaceArgByType(trackName, selectedIndices, argType, newArgValue) {
        const song = this.song;
        if(Number.isInteger(selectedIndices))
            selectedIndices = [selectedIndices];
        if (!selectedIndices.length)
            throw new Error("No selection");

        // console.log('instructionReplaceArg', trackName, selectedIndices, argIndex, newArgValue, selectedInstructionData);

        const selectedInstructionData = this.state.selectedInstructionData;
        const processor = new InstructionProcessor(selectedInstructionData);
        processor.updateArg(argType, newArgValue)
        this.setState({selectedInstructionData});
        for (let i = 0; i < selectedIndices.length; i++) {
            song.instructionReplaceArgByType(trackName, selectedIndices[i], argType, newArgValue);
        }

        this.trackerPlay(trackName, selectedIndices);
        // trackInfo.updateCurrentInstruction();
    }



    /** Instruction Delete **/

    instructionDeleteSelected(trackName=null, selectedIndices=null) {
        trackName = trackName || this.state.selectedTrack;
        const activeTrack = this.getActiveTrack(trackName);
        if(selectedIndices === null)
            selectedIndices = activeTrack.getSelectedIndices();
        if(Number.isInteger(selectedIndices))
            selectedIndices = [selectedIndices];

        selectedIndices.sort((a, b) => a - b);
        for (let i=selectedIndices.length-1; i>=0; i--)
            this.song.instructionDeleteAtIndex(trackName, selectedIndices[i]);

        activeTrack.setState({selectedIndices: []})
        this.updateCurrentSong();
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
            songPosition === null ? this.state.songPosition : songPosition,
            onended);
    }

    songPause() {
        this.song.stopPlayback();
    }

    songStop() {
        if (this.song.playback)
            this.song.stopPlayback();
        this.song.setPlaybackPositionInTicks(0);
    }

    /** Track Playback **/


    trackerPlaySelected(trackName=null, stopPlayback=true) {
        const activeTrack = this.getActiveTrack(trackName);
        return this.trackerPlay(trackName, activeTrack.getSelectedIndices(), stopPlayback);
    }

    trackerPlay(trackName, selectedIndices, stopPlayback=true) {
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
            await this.trackSelect(newTrackName);
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
            this.trackSelect(newTrackName);
            this.trackSelect(oldTrackName);
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

    /** Track Selection **/

    trackUnselect(trackName) {

    }



    trackSelect(trackName, selectedIndices=[], trackStats=null) {

        selectedIndices = this.values.parseSelectedIndices(selectedIndices);

        const state = {
            // selectedIndices,
            activeTracks: this.state.activeTracks,
            selectedTrack: trackName,
            selectedTrackIndices: selectedIndices
        }
        if(selectedIndices.length > 0) {
            const instructionData = this.getSong().instructionDataGetByIndex(trackName, selectedIndices[0]);
            state.selectedInstructionData = instructionData.slice();
        }

        if(!state.activeTracks[trackName])
            state.activeTracks[trackName] = {};
        if(trackStats)
            state.activeTracks[trackName] = trackStats;
        this.setState(state);
        return selectedIndices;
        // if(instruction instanceof NoteInstruction) {
        //     state.currentInstructionType = 'note';
        //     if(typeof instruction.durationTicks !== "undefined")
        //         state.currentDuration = instruction.getDurationString(activeTrack.getTimeDivision());
        //     if(typeof instruction.velocity !== "undefined")
        //         state.currentVelocity = instruction.velocity;
        // } else {
        //     state.currentInstructionType = 'custom';
        //     state.currentArguments = instruction.commandArgs;
        // }
        // state.selectedTrackIndices = selectedIndices;
        // state.selectedTrack = trackName;

    }

    selectIndices(selectedIndices, clearSelection=true, selectTrack=true) {
        // TODO: get song position by this.props.index
        // let selectedIndices = await PromptManager.openPromptDialog("Enter selection: ", oldSelectedIndices.join(','));


        selectedIndices.forEach((index, i) => {
            if(typeof index !== "number")
                throw new Error(`Invalid selection index (${i}): ${index}`);
        });

        // Filter unique indices
        selectedIndices = selectedIndices.filter((v, i, a) => a.indexOf(v) === i && v !== null);
        // Sort indices
        selectedIndices.sort((a, b) => a - b);


        this.setState({selectedIndices});
        this.getComposer().trackSelect(this.getTrackName(), selectedIndices);
        // if(selectTrack)
        //     this.getComposer().trackSelect(this.getTrackName());
        return selectedIndices;
    }




    // TODO: messy
    trackerToggleTrack(trackName = null, toggleValue=null, trackData={}) {
        // const trackState = this.trackGetState(trackName);
        // const activeTracks = {...this.state.activeTracks};
        let selectedTrack = trackName;
        if(toggleValue === true || typeof this.state.activeTracks[trackName] === "undefined") {
            // const currentTrackData = activeTracks[this.state.selectedTrack];
            // activeTracks[trackName] = trackData; //Object.assign({}, currentTrackData, trackData);
            this.setState(state => {
                state.selectedTrack = selectedTrack;
                state.activeTracks[trackName] = trackData
            })
            // await this.trackerUpdateSegmentInfo(trackName);

        } else {
            trackData = this.state.activeTracks[trackName];
            if(trackData.destinationList)
                selectedTrack = trackData.destinationList.slice(-1)[0]; // Select last track
            else
                selectedTrack = this.getSong().getStartTrackName();
            this.setState(state => {
                state.selectedTrack = selectedTrack;
                delete state.activeTracks[trackName];
            })
        }
    }



    trackerChangeQuantization(trackName=null, trackerQuantizationTicks) {
        return this.getActiveTrack(trackName || this.state.selectedTrack)
            .changeQuantization(trackerQuantizationTicks)
    }

    async trackerChangeQuantizationPrompt(trackName) {
        return this.getActiveTrack(trackName || this.state.selectedTrack)
            .changeQuantizationPrompt();
    }


    trackerChangeSegmentLength(trackName, rowLength = null) {
        return this.getActiveTrack(trackName || this.state.selectedTrack)
            .changeRowLength(rowLength)
    }

    async trackerChangeSegmentLengthPrompt(trackName) {
        return this.getActiveTrack(trackName || this.state.selectedTrack)
            .changeRowLengthPrompt()
    }



    /** Tracker Clip Board **/

    instructionCopy(trackName=null, selectedIndices=null) {
        trackName = trackName || this.state.selectedTrack;
        const activeTrack = this.getActiveTrack(trackName);
        if(selectedIndices === null)
            selectedIndices = activeTrack.getSelectedIndices();
        const iterator = activeTrack.getIterator();
        let startPosition = null, lastPosition=null, copyTrack=[];
        iterator.seekToEnd((instructionData) => {
            instructionData = instructionData.slice();

            const index = iterator.getCurrentIndex();
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

    instructionCut(trackName=null, selectedIndices=null) {
        this.instructionCopy(trackName, selectedIndices);
        this.instructionDeleteSelected(trackName, selectedIndices);
    }

    instructionPasteAtCursor(trackName=null) {
        trackName = trackName || this.state.selectedTrack;

        const copyTrack = this.state.clipboard;
        if(!Array.isArray(copyTrack))
            throw new Error("Invalid clipboard data: " + typeof copyTrack);

        const activeTrack = this.getActiveTrack(trackName);
        const {positionTicks: startPositionTicks} = activeTrack.cursorGetInfo();

        const selectedIndices = [];
        for(let i=0; i<copyTrack.length; i++) {
            const copyInstructionData = copyTrack[i];
            const insertPositionTicks = startPositionTicks + copyInstructionData[0];
            const insertIndex = this.instructionInsertAtPosition(trackName, insertPositionTicks, copyInstructionData, false, false);
            selectedIndices.push(insertIndex);
        }

        console.log('pastedIndices', selectedIndices);
        this.trackerSelectIndices(trackName, selectedIndices);
    }

    /** Iterator **/

    /** @deprecated **/
    trackerGetIterator(trackName=null) {
        const activeTrack = this.getActiveTrack(trackName);
        return this.getSong().instructionGetIterator(
            trackName,
            activeTrack.getTimeDivision(),
            activeTrack.getBeatsPerMinute()
        );
    }

    /** Track State **/

    hasActiveTrack(trackName) {
        return !!this.activeTracks[trackName];
    }

    getActiveTrack(trackName) {
        const activeTrack = this.activeTracks[trackName];
        if(!activeTrack)
            throw new Error("Active track not found: " + trackName);
        if(!activeTrack.current)
            throw new Error("Active track not available: " + trackName);
        return activeTrack.current;
    }

    /** Selection **/

    trackerSelect(trackName) {
        this.setState(state => {
            state.selectedTrack = trackName;
            return state;
        });
    }

    async trackerSelectIndicesPrompt(trackName=null) {
        if(trackName === null)
            trackName = this.state.selectedTrack;
        const activeTrack = this.getActiveTrack(trackName);
        let selectedIndices = activeTrack.getSelectedIndices().join(', ');
        selectedIndices = await PromptManager.openPromptDialog(`Select indices for track ${trackName}: `, selectedIndices);
        this.trackerSelectIndices(trackName, selectedIndices);
    }

    trackerSelectIndices(trackName, selectedIndices, clearSelection=true) {
        return this.getActiveTrack(trackName)
            .selectIndices(selectedIndices, clearSelection);
    }






    /** Context menu **/
    // async openContextMenu(e) {
    //     const contextMenu = this.menuContext;
    //     await contextMenu.openContextMenu(e);
    // }

    /** Programs **/


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

    async programReplace(programID, programClassName, programConfig = {}) {
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

    async programRename(programID, newProgramTitle = null) {
        console.log(this.song.programGetConfig(programID).title, programID);
        const oldProgramTitle = this.song.programGetConfig(programID).title;
        if (!newProgramTitle)
            newProgramTitle = await PromptManager.openPromptDialog(`Change name for programs ${programID}: `, oldProgramTitle);
        if (!newProgramTitle)
            return console.error("Program name change canceled");
        this.song.programRename(programID, newProgramTitle);
        this.setStatus(`Program title updated: ${newProgramTitle}`);
    }

    async programRemove(programRemoveID = null) {
        if (await PromptManager.openConfirmDialog(`Remove Program ID: ${programRemoveID}`)) {
            this.song.programRemove(programRemoveID);
            this.setStatus(`Program (${programRemoveID}) removed`);

        } else {
            this.setError(`Remove program canceled`);
        }
    }


    /** Toggle Panels **/

    toggleSongPanel() { this.setState({showPanelSong: !this.state.showPanelSong}); }
    toggleProgramPanel() { this.setState({showPanelProgram: !this.state.showPanelProgram}); }
    toggleInstructionPanel() { this.setState({showPanelInstruction: !this.state.showPanelInstruction}); }
    toggleFullscreen() {
        this.setState({fullscreen: !this.state.fullscreen});
        setTimeout(() => this.onResize(), 200);
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

        const storage = new Storage();
        storage.addBatchRecentSearches(searchCallbackString);

        throw new Error("TODO Implement");
        // const track = this.track;
        // this.clearselectedIndices();
        // const trackName = track.getTrackName();
        // try {
        //     const stats = {count: 0};
        //     const iterator = this.song.instructionGetIterator(trackName);
        //     let instruction;
        //     while (instruction = iterator.nextConditionalInstruction((instruction) => {
        //         const i = instruction;
        //         const window = null, document = null;
        //         return eval(searchCallbackString);
        //     })) {
        //         stats.count++;
        //         track.selectIndicies(e, iterator.currentIndex);
        //     }
        //     this.setStatus("Batch Search Completed: " + JSON.stringify(stats), stats);
        // } catch (err) {
        //     this.setStatus("Batch Search Failed: " + err.message, err);
        // }
    }

    async batchRunCommand(e, commandCallbackString = null, searchCallbackString = null, promptUser = false) {
        const storage = new Storage();

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
        // const instructionList = [];
        // const track = this.track;
        // const trackName = track.getTrackName(), g = trackName;
        // try {
        //     const stats = {count: 0, modified: 0};
        //     const iterator = this.song.instructionGetIterator(trackName);
        //     let instruction;
        //     const window = null, document = null;
        //     while (instruction = iterator.nextConditionalInstruction((instruction) => {
        //         const i = instruction;
        //         return eval(searchCallbackString);
        //     })) {
        //         const instructionString = JSON.stringify(instruction.data);
        //         const i = instruction;
        //         eval(commandCallbackString);
        //         if (instructionString !== JSON.stringify(instruction.data))
        //             stats.modified++;
        //
        //         stats.count++;
        //         track.selectIndex(e, iterator.currentIndex);
        //     }
        //     this.setStatus("Batch Command Completed: " + JSON.stringify(stats), stats);
        //     return instructionList;
        // } catch (err) {
        //     this.setStatus("Batch Command Failed: " + err.message, err);
        //     return [];
        // }
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
