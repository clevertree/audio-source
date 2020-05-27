import {Instruction, ProgramLoader, Song, Storage} from "../song";
import PromptManager from "../common/prompt/PromptManager";
import ASComposerMenu from "./ASComposerMenu";
import FileService from "../song/file/FileService";

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

    updateCurrentInstruction(trackName, selectedIndices) {
        if(selectedIndices.length === 0)
            return;

        // const activeTrack = this.getActiveTrack(trackName);
        const instruction = this.getSong().instructionGetByIndex(trackName, selectedIndices[0]);

        const state = {
            currentInstructionArgs: instruction.data.slice(1),
            selectedIndices,
            selectedTrack: trackName
        }
        this.setState(state);
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
        // state.currentSelectedIndices = selectedIndices;
        // state.selectedTrack = trackName;

    }

    /** Instruction Modification **/
// TODO: where is auto-select auto-playback handled?
    async instructionInsertAtCursorPrompt(trackName = null, newCommand = null, promptUser = false, select=true, playback=true) {
        trackName = trackName || this.state.selectedTrack;
        newCommand = newCommand || this.state.currentCommand;
        if(promptUser)
            newCommand = await PromptManager.openPromptDialog("Set custom command:", newCommand || '');
        return this.instructionInsertAtCursor(trackName, newCommand, select, playback);
    }

    instructionInsertAtCursor(trackName = null, newCommand = null, select=true, playback=true) {
        // console.log('instructionInsert', newCommand, trackName);

        const activeTrack = this.getActiveTrack(trackName);
        const {positionTicks} = activeTrack.cursorGetInfo(); // TODO: insert between
        return this.instructionInsertAtPosition(trackName, positionTicks, newCommand, select, playback);
    }

    instructionInsertAtPosition(trackName, positionTicks, newInstruction = null, select=false, playback=false) {
        //: TODO: check for recursive group

        if (newInstruction === null)
            newInstruction = this.state.currentCommand;
        if (!newInstruction)
            throw new Error("Invalid Instruction command");

        newInstruction = Instruction.parseInstruction(newInstruction);
        newInstruction.deltaDuration = 0;
        // this.setState({currentCommand: newInstruction.command}); // TODO: redundant?
        if(this.state.currentDuration) // TODO: append all current args
            newInstruction.durationTicks = this.song.values.parseDurationAsTicks(this.state.currentDuration);
        if(this.state.currentVelocity) // TODO: append all current args
            newInstruction.velocity = this.state.currentVelocity;
        // this.setState({activeTracks});
        const index = this.song.instructionInsertAtPosition(trackName, positionTicks, newInstruction);
        if(select)      this.trackerSelectIndices(trackName, index);
        if(playback)    this.trackerPlay(trackName, index);
        this.updateCurrentSong();
        return index;
    }

    /** Instruction Command **/


    async instructionReplaceCommandPrompt(trackName=null, selectedIndices=null, newCommand = null, promptUser=false) {
        trackName = trackName || this.state.selectedTrack;
        if (newCommand === null)
            newCommand = this.state.currentCommand;
        if(promptUser)
            newCommand = await PromptManager.openPromptDialog("Set custom command:", newCommand || '');
        if(selectedIndices === null)
            selectedIndices = this.getActiveTrack(trackName).getSelectedIndices();
        return this.instructionReplaceCommand(trackName, selectedIndices, newCommand);
    }

    instructionReplaceCommand(trackName, selectedIndices, newCommand) {
        const song = this.song;
        if(Number.isInteger(selectedIndices))
            selectedIndices = [selectedIndices];
        if (!selectedIndices.length)
            throw new Error("No selection");
        console.log('instructionReplaceCommand', trackName, selectedIndices, selectedIndices.length, newCommand);
        if (!newCommand)
            throw new Error("Invalid Instruction command");

        this.setState({currentCommand: newCommand});
        for (let i = 0; i < selectedIndices.length; i++) {
            song.instructionReplaceCommand(trackName, selectedIndices[i], newCommand);
        }

        this.trackerPlay(trackName, selectedIndices);
        // trackInfo.updateCurrentInstruction();
    }

    /** Instruction Duration **/

    async instructionReplaceDurationPrompt(trackName = null, selectedIndices = null, duration = null, promptUser=false) {
        trackName = trackName || this.state.selectedTrack;
        const activeTrack = this.getActiveTrack(trackName);
        if(selectedIndices === null)
            selectedIndices = activeTrack.getSelectedIndices();

        if (promptUser)
            duration = parseInt(await PromptManager.openPromptDialog("Set custom duration in ticks:", duration), 10);

        this.instructionReplaceDuration(trackName, selectedIndices, duration);
    }

    instructionReplaceDuration(trackName, selectedIndices, duration) {
        const song = this.song;
        if(Number.isInteger(selectedIndices))
            selectedIndices = [selectedIndices];

        if (typeof duration === 'string')
            duration = this.values.parseDurationAsTicks(duration, this.song.data.timeDivision);
        else
            duration = parseInt(duration)

        if (isNaN(duration))
            throw new Error("Invalid duration: " + typeof duration);
        for (let i = 0; i < selectedIndices.length; i++) {
            song.instructionReplaceDuration(trackName, selectedIndices[i], duration);
        }
        this.trackerPlay(trackName, selectedIndices);
        this.setState({currentDuration: this.values.formatDuration(duration)})
        // trackState.updateCurrentInstruction();
    }

    /** Instruction Velocity **/

    async instructionReplaceVelocityPrompt(trackName = null, selectedIndices = null, velocity = null, promptUser=true) {
        trackName = trackName || this.state.selectedTrack;
        velocity = velocity || this.state.currentVelocity;
        const activeTrack = this.getActiveTrack(trackName);
        if(selectedIndices === null)
            selectedIndices = activeTrack.getSelectedIndices();
        if(promptUser)
            velocity = parseInt(await PromptManager.openPromptDialog("Set custom velocity (0-127):", velocity));
        return this.instructionReplaceVelocity(trackName, selectedIndices, velocity);
    }

    instructionReplaceVelocity(trackName, selectedIndices, velocity) {
        const song = this.song;
        trackName = trackName || this.state.selectedTrack;
        if(Number.isInteger(selectedIndices))
            selectedIndices = [selectedIndices];

        velocity = parseFloat(velocity);
        if (velocity === null || isNaN(velocity))
            throw new Error(`Invalid velocity (${typeof velocity}): ${velocity}`);
        for (let i = 0; i < selectedIndices.length; i++) {
            song.instructionReplaceVelocity(trackName, selectedIndices[i], velocity);
        }
        this.trackerPlay(trackName, selectedIndices);
        this.setState({currentVelocity: velocity})
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


    // /** @deprecated **/
    // trackerGetTrackInfo(trackName) {
    //     return new TrackInfo(trackName, this);
    // }
    // trackerGetSelectedTrackInfo() {
    //     const trackName = this.state.selectedTrack;
    //     return new TrackInfo(trackName, this);
    // }



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
            await this.trackerToggleTrack(newTrackName, true);
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
            await this.trackerToggleTrack(newTrackName, true);
            await this.trackerToggleTrack(oldTrackName, false);
        } else {
            this.setError("Rename instruction group canceled");
        }
    }

    async trackRemove(trackName, promptUser = true) {
        const song = this.song;

        const result = promptUser ? await PromptManager.openPromptDialog(`Remove instruction group (${trackName})?`) : true;
        if (result) {
            song.trackRemove(trackName);
            this.trackerToggleTrack(trackName, true);
        } else {
            this.setError("Remove instruction group canceled");
        }

    }

    trackSelect(selectedTrack = null) {
        if(this.state.selectedTrack !== selectedTrack)
            this.setState({selectedTrack});
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
        iterator.seekToEnd((instruction) => {
            const instructionData = instruction.data.slice();

            const index = iterator.getCurrentIndex();
            for(let i=0; i<selectedIndices.length; i++)
                if(selectedIndices[i] === index) {
                    if(startPosition === null)
                        lastPosition = startPosition = iterator.getPositionInTicks();
                    instructionData[0] = iterator.getPositionInTicks() - lastPosition;
                    lastPosition = iterator.getPositionInTicks();
                    copyTrack.push(instructionData)
                    return instruction;
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

    // trackerFindRowOffsetFromPosition(trackName, trackPositionTicks) {
    //     // const trackState = new ActiveTrackState(this, trackName);
    //     const iterator = this.trackerGetQuantizedIterator(trackName);
    //     iterator.seekToPositionTicks(trackPositionTicks);
    //     const rowOffset = iterator.rowCount;
    //     console.log('trackerFindRowOffsetFromPosition', trackPositionTicks, rowOffset, iterator);
    //     return rowOffset;
    // }

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



    // trackerSetCursorOffset(trackName, newCursorOffset, selectedIndices=[]) {
    //     if (!Number.isInteger(newCursorOffset))
    //         throw new Error("Invalid cursor offset");
    //     if(newCursorOffset < 0)
    //         throw new Error("Cursor offset must be >= 0");
    //     return this.trackerSelectIndices(trackName, selectedIndices, newCursorOffset);
    // }
    //
    // trackerSetScrollPosition(trackName, newScrollPositionTicks) {
    //     if (!Number.isInteger(newScrollPositionTicks))
    //         throw new Error("Invalid row offset");
    //     this.setState(state => {
    //         state.activeTracks[trackName].scrollPositionTicks = newScrollPositionTicks;
    //         return state;
    //     });
    // }

    // trackerSetRowOffset

    // trackerSetRowOffsetFromPositionTicks(trackName, trackPositionTicks) {
    //     const rowOffset = this.trackerFindRowOffsetFromPosition(trackName, trackPositionTicks);
    //     this.trackerSetRowOffset(trackName, rowOffset);
    // }

    // trackerSetRowOffset(trackName, newRowOffset) {
    //     if (!Number.isInteger(newRowOffset))
    //         throw new Error("Invalid row offset");
    //     // console.log('trackerSetRowOffset', {trackName, newRowOffset});
    //     this.setState(state => {
    //         // state.selectedTrack = trackName;
    //         state.activeTracks[trackName].rowOffset = newRowOffset;
    //         return state;
    //     });
    // }
    //
    // trackerSetCursorOffset(trackName, newCursorOffset) {
    //     if (!Number.isInteger(newCursorOffset))
    //         throw new Error("Invalid cursor offset");
    //     // console.log('trackerSetRowOffset', {trackName, newRowOffset});
    //     this.setState(state => {
    //         state.selectedTrack = trackName;
    //         state.activeTracks[trackName].cursorOffset = newCursorOffset;
    //         return state;
    //     });
    // }


    // trackerUpdateCurrentInstruction(trackName) {
    //     this.setState(state => {
    //         const track = state.activeTracks[trackName];
    //         const selectedIndices = track.selectedIndices;
    //         if(selectedIndices.length > 0) {
    //             const firstSelectedInstruction = this.getSong().instructionGetByIndex(this.getTrackName(), selectedIndices[0]);
    //             track.currentCommand = firstSelectedInstruction.command;
    //             if(firstSelectedInstruction instanceof NoteInstruction) {
    //                 if(typeof firstSelectedInstruction.durationTicks !== "undefined")
    //                     track.currentDuration = firstSelectedInstruction.getDurationString(this.getStartingTimeDivision());
    //                 if(typeof firstSelectedInstruction.velocity !== "undefined")
    //                     track.currentVelocity = firstSelectedInstruction.velocity;
    //             }
    //         }
    //         return state;
    //     });
    //
    // }





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
