import React from "react";

import {Song, Storage, InstructionList, InstrumentLoader} from "../song";
import ComposerMenu from "./ComposerMenu";
import {Div} from "../components";
import {TrackInfo} from "./tracker/";

class ComposerActions extends ComposerMenu {
    constructor(state = {}, props = {}) {
        super(state, props);
        this.onSongEventCallback = (e) => this.onSongEvent(e);
    }

    setStatus(newStatus) {
        console.info.apply(null, arguments); // (newStatus);
        this.setState({status: newStatus});
    }

    setError(newStatus) {
        this.setStatus(<Div className="error">{newStatus}</Div>);
    }

    setVersion(versionString) {
        this.setState({version: versionString});
    }

    /** Playback **/


    getAudioContext() {
        if (this.audioContext)
            return this.audioContext;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioContext = audioContext;
        return audioContext;
    }

    getVolumeGain() {
        if (!this.volumeGain) {
            const context = this.getAudioContext();
            let gain = context.createGain();
            gain.gain.value = this.state.volume; // Song.DEFAULT_VOLUME;
            gain.connect(context.destination);
            this.volumeGain = gain;
        }
        return this.volumeGain;
    }

    getVolume () {
        if(this.volumeGain) {
            return this.volumeGain.gain.value;
        }
        return this.state.volume;
    }
    setVolume (volume) {
        console.info("Setting volume: ", volume);
        const gain = this.getVolumeGain();
        if(gain.gain.value !== volume) {
            gain.gain.value = volume;
        }
        this.setState({volume});
        // this.state.volume = volume;
        this.fieldSongVolume.value = volume * 100;
    }

    /** Playback **/

    playSelectedInstructions(stopPlayback=true) {
        const trackInfo = this.trackerGetSelectedTrackInfo();
        return trackInfo.playSelectedInstructions(this.getVolumeGain(), stopPlayback);
    }
    playInstructions(selectedIndices) {
        const trackInfo = this.trackerGetSelectedTrackInfo();
        trackInfo.stopPlayback();
        return trackInfo.playInstructions(this.getVolumeGain(), selectedIndices);
    }

    /** Song actions **/


    async setSongName(e, newSongName=null) {
        if(newSongName === null)
            newSongName = await this.openPromptDialog("Enter a new song name", this.song.data.title);
        this.song.songChangeName(newSongName);
        this.setStatus(`Song name updated: ${newSongName}`);
    }

    setSongVersion(e, newSongVersion) {
        this.song.songChangeVersion(newSongVersion);
        this.setStatus(`Song version updated: ${newSongVersion}`);
    }

    songChangeStartingBPM(e, newSongBPM) {
        this.song.data.bpm = newSongBPM; // songChangeStartingBPM(newSongBPM);
        this.setStatus(`Song beats per minute updated: ${newSongBPM}`);
    }



    async openSongFromFileDialog(e, accept=null) {
        const file = await this.openFileDialog(accept);
        this.loadSongFromFileInput(e, file);
    }

    async loadSongFromFileInput(e, file=null, accept=null) {
        if(file === null)
            file = await this.openFileDialog(accept);
        if (!file)
            throw new Error("Invalid file input");
        const song = await Song.loadSongFromFileInput(file);
        this.setCurrentSong(song);
        // await this.song.loadSongFromFileInput(file);
        // this.render();
    }


    /** Song utilities **/


    loadNewSongData() {
        // const storage = new Storage();
        // const defaultInstrumentURL = this.getDefaultInstrumentClass() + '';
        // let songData = storage.generateDefaultSong(defaultInstrumentURL);
        // const song = Song.loadSongFromData(songData);
        const song = new Song(this.audioContext);
        this.setCurrentSong(song);
        // this.forceUpdate();
        this.setStatus("Loaded new song", song.getProxiedData());
    }


    loadRecentSongData() {
        const storage = new Storage();
        let songRecentUUIDs = storage.getRecentSongList();
        if (songRecentUUIDs[0] && songRecentUUIDs[0].uuid) {
            this.setStatus("Loading recent song: " + songRecentUUIDs[0].uuid);
            this.loadSongFromMemory(songRecentUUIDs[0].uuid);
            return true;
        }
        return false;
    }


    loadSongFromMemory(songUUID) {
        const song = Song.loadSongFromMemory(this.audioContext, songUUID);
        this.setCurrentSong(song);
        this.setStatus("Song loaded from memory: " + songUUID, this.song, this.state);
//         console.info(songData);
    }

    loadSongFromURL(url) {
        const song = Song.loadSongFromURL(this.audioContext, url);
        this.setCurrentSong(song);
        this.setStatus("Loaded from url: " + url);
    }

    saveSongToMemory() {
        const song = this.song;
        const songData = song.data;
        const songHistory = song.history;
        const storage = new Storage();
        this.setStatus("Saving song to memory...");
        storage.saveSongToMemory(songData, songHistory);
        this.setStatus("Saved song to memory: " + songData.uuid);
    }

    saveSongToFile() {
        const songData = this.song.data;
        // const songHistory = this.song.history;
        const storage = new Storage();
        this.setStatus("Saving song to file");
        storage.saveSongToFile(songData);
    }


//         async loadSongFromMemory(songUUID) {
//             await this.song.loadSongFromMemory(songUUID);
//             this.forceUpdate();
//             this.setStatus("Song loaded from memory: " + songUUID);
// //         console.info(songData);
//         }
//
//         async loadSongFromFileInput(fileInput = null) {
//             fileInput = fileInput || this.fieldSongFileLoad.inputElm;
//             if (!fileInput || !fileInput.files || fileInput.files.length === 0)
//                 throw new Error("Invalid file input");
//             if (fileInput.files.length > 1)
//                 throw new Error("Invalid file input: only one file allowed");
//             const file = fileInput.files[0];
//             await this.song.loadSongFromFileInput(file);
//             this.forceUpdate();
//             this.setStatus("Song loaded from file: ", file);
//         }
//
//
//
//         async loadSongFromURL(url=null, promptUser=true) {
//             if (promptUser)
//                 url = await this.openPromptDialog("Enter a Song URL:", url || 'https://mysite.com/songs/mysong.json');
//             await this.song.loadSongFromURL(url);
//             this.setStatus("Song loaded from url: " + url);
//             // console.info(this.song.data);
//             this.forceUpdate();
//         }
//
//         async loadSongFromData(songData) {
//             await this.song.loadSongData(songData);
//             // this.render(true);
//             this.setStatus("Song loaded from data", songData);
//             this.forceUpdate();
//         }

    /** Song Playback **/



    setPlaybackPositionInTicks(groupPositionInTicks) {
        this.clearRowPositions();
        const rowElm = this.findRowElement(groupPositionInTicks);
        if (rowElm)
            rowElm.setProps({position: true});
        else
            console.warn('row not found: ' + groupPositionInTicks);
        // console.warn('REFACTOR');
        // TODO: get current 'playing' and check position
        // let rowElm = this.navigateGroup(groupPositionInTicks);
        // this.querySelectorAll('asct-row.position')
        //     .forEach(rowElm => rowElm.classList.remove('position'));
        // rowElm.classList.add('position');

    }

    async updateSongPositionValue(playbackPositionInSeconds) {
        const roundedSeconds = Math.round(playbackPositionInSeconds);
        this.fieldSongTiming.value = this.values.formatPlaybackPosition(playbackPositionInSeconds);
        if (this.fieldSongPosition.value !== roundedSeconds)
            this.fieldSongPosition.value = roundedSeconds;

        let positionRow;
        for (let i = this.rows.length - 1; i >= 0; i--) {
            positionRow = this.rows[i];
            if (playbackPositionInSeconds > positionRow.positionInSeconds)
                break;
        }
        // console.info('playbackPositionInSeconds', playbackPositionInSeconds, positionRow.positionInSeconds, positionRow);


        if (positionRow && !positionRow.props.position) {
            await this.clearAllPositions();
            positionRow.setPosition();
        }
    }


    async songPlay() {
        await this.song.play(this.getVolumeGain());
    }

    async songPause() {
        this.song.stopPlayback();
    }

    async songStop() {
        if (this.song.playback)
            this.song.stopPlayback();
        this.song.setPlaybackPositionInTicks(0);
    }

    setSongPosition(playbackPosition = null) {
        // const wasPlaying = !!this.song.playback;
        // if (wasPlaying)
        //     this.song.stopPlayback();
        const song = this.song;
        if (playbackPosition === null) {
            const values = this.values;
            playbackPosition = values.parsePlaybackPosition(this.fieldSongPosition.value);
        }
        song.setPlaybackPosition(playbackPosition);
        // if (wasPlaying)
        //     this.song.play();
    }

    /** Tracker Instruction Modification **/


    async instructionInsert(newCommand = null, promptUser = false) {
        const trackName = this.state.selectedTrack;
        const activeTracks = {...this.state.activeTracks};
        const trackState = activeTracks[trackName];
        // if (instrumentID !== null)
        //     newInstruction.instrument = instrumentID;

        //: TODO: check for recursive group
        const song = this.song;
        // let selectedIndices = this.getSelectedIndices();

        // if(selectedIndices.length === 0)
        //     throw new Error("No selection");
        if (newCommand === null)
            newCommand = trackState.currentCommand;
        if (promptUser)
            newCommand = await this.openPromptDialog("Set custom command:", newCommand || '');
        if (!newCommand)
            throw new Error("Invalid Instruction command");

        const newInstruction = InstructionList.parseInstruction([0, newCommand]);
        trackState.currentCommand = newInstruction.command;
        if(trackState.currentDuration)
            newInstruction.durationTicks = trackState.currentDuration;
        if(trackState.currentVelocity)
            newInstruction.velocity = trackState.currentVelocity;
        this.setState({activeTracks});

        const songPositionTicks = this.trackerGetTrackInfo(trackName).calculateCursorOffsetPositionTicks();
        let insertIndex = song.instructionInsertAtPosition(trackName, songPositionTicks, newInstruction);
        this.selectIndices([insertIndex]);

        this.playSelectedInstructions();
    }

    async instructionReplaceCommand(newCommand = null, promptUser = false) {
        //: TODO: check for recursive group
        const song = this.song;
        const trackInfo = this.trackerGetSelectedTrackInfo();
        const selectedIndices = trackInfo.getSelectedIndices();

        if (selectedIndices.length === 0)
            throw new Error("No selection");
        if (newCommand === null)
            newCommand = trackInfo.track.currentCommand;
        if (promptUser)
            newCommand = await this.openPromptDialog("Set custom command:", newCommand || '');
        if (!newCommand)
            throw new Error("Invalid Instruction command");

        // this.setState({currentTrackerCommand: newCommand});
        for (let i = 0; i < selectedIndices.length; i++) {
            const instruction = song.instructionGetByIndex(trackInfo.getTrackName(), selectedIndices[i]);
            instruction.command = newCommand;
        }

        this.playSelectedInstructions();
        trackInfo.updateCurrentInstruction();
    }
    // }

    async instructionReplaceDuration(duration = null, promptUser = false) {
        const song = this.song;
        const trackInfo = this.trackerGetSelectedTrackInfo();
        const selectedIndices = trackInfo.getSelectedIndices();

        if (duration === null && promptUser)
            duration = parseInt(await this.openPromptDialog("Set custom duration in ticks:", duration), 10);
        if (isNaN(duration))
            throw new Error("Invalid duration: " + typeof duration);
        for (let i = 0; i < selectedIndices.length; i++) {
            const instruction = song.instructionGetByIndex(trackInfo.getTrackName(), selectedIndices[i]);
            instruction.durationTicks = duration;
        }
        this.playSelectedInstructions();
        trackInfo.updateCurrentInstruction();
    }

    async instructionReplaceVelocity(velocity = null, promptUser = false) {
        const song = this.song;
        const trackInfo = this.trackerGetSelectedTrackInfo();
        const selectedIndices = trackInfo.getSelectedIndices();

        if (velocity === null && promptUser)
            velocity = parseInt(await this.openPromptDialog("Set custom velocity (0-127):", this.fieldInstructionVelocity.value));
        velocity = parseFloat(velocity);
        if (velocity === null || isNaN(velocity))
            throw new Error("Invalid velocity: " + typeof velocity);
        for (let i = 0; i < selectedIndices.length; i++) {
            const instruction = song.instructionGetByIndex(trackInfo.getTrackName(), selectedIndices[i]);
            instruction.velocity = velocity;
        }
        this.playSelectedInstructions();
        trackInfo.updateCurrentInstruction();
    }

    instructionDelete() {
        const song = this.song;
        const {trackName, selectedIndices} = this.trackerGetActiveSelectedTrackState();

        for (let i = 0; i < selectedIndices.length; i++)
            song.instructionDeleteAtIndex(trackName, selectedIndices[i]);

    }

    /** Keyboard Commands **/

    keyboardChangeOctave(keyboardOctave = null) {
        if (!Number.isInteger(keyboardOctave))
            throw new Error("Invalid segment ID");
        this.setState({keyboardOctave});
    }


    /** Track State **/

    /** @deprecated **/
    trackerGetActiveSelectedTrackState() {
        return this.trackerGetActiveTrackState(this.state.selectedTrack);
    }

    /** @deprecated **/
    trackerGetActiveTrackState(trackName) {
        if(typeof this.state.activeTracks[trackName] === "undefined")
            throw new Error("Invalid active track: " + trackName);
        const trackState = this.state.activeTracks[trackName];
        let selectedIndices = trackState.selectedIndices || [];

        return {
            trackState,
            trackName,
            selectedIndices,
        }
    }

    /** Track Info **/

    trackerGetTrackInfo(trackName) {
        return new TrackInfo(trackName, this);
    }
    trackerGetSelectedTrackInfo() {
        const trackName = this.state.selectedTrack;
        return new TrackInfo(trackName, this);
    }

    /** Tracker Commands **/

    async trackAdd(newTrackName = null, promptUser = true) {
        const song = this.song;

        newTrackName = newTrackName || song.generateInstructionTrackName();
        if(promptUser)
            newTrackName = await this.openPromptDialog("Create new instruction group?", newTrackName);
        if (newTrackName) {
            song.groupAdd(newTrackName, []);
            this.trackerToggleTrack(newTrackName, true);
        } else {
            this.setStatus("<span class='error'>Create instruction group canceled</span>");
        }
    }

    async trackRename(oldTrackName, newTrackName = null, promptUser = true) {
        const song = this.song;

        if(promptUser)
            newTrackName = await this.openPromptDialog(`Rename instruction group (${oldTrackName})?`, oldTrackName);
        if (newTrackName !== oldTrackName) {
            song.groupRename(oldTrackName, newTrackName);
            this.trackerToggleTrack(newTrackName, true);
            this.trackerToggleTrack(oldTrackName, false);
        } else {
            this.setStatus("<span class='error'>Rename instruction group canceled</span>");
        }
    }

    async trackRemove(trackName, promptUser = true) {
        const song = this.song;

        const result = promptUser ? await this.openPromptDialog(`Remove instruction group (${trackName})?`) : true;
        if (result) {
            song.groupRemove(trackName);
            this.trackerToggleTrack(trackName, true);
        } else {
            this.setStatus("<span class='error'>Remove instruction group canceled</span>");
        }

    }


    trackerToggleTrack(trackName = null, toggleValue=null, trackData={}) {
        const activeTracks = {...this.state.activeTracks};
        let selectedTrack = trackName;
        if(toggleValue === true || typeof activeTracks[trackName] === "undefined") {
            const currentTrackData = activeTracks[this.state.selectedTrack];
            activeTracks[trackName] = Object.assign({}, currentTrackData, trackData);
        } else {
            trackData = activeTracks[trackName];
            if(trackData.destinationList)
                selectedTrack = trackData.destinationList.slice(-1)[0]; // Select last track
            else
                selectedTrack = this.getSong.getStartTrackName();
            delete activeTracks[trackName];
        }
        this.setState({activeTracks, selectedTrack});
    }

    trackerChangeRowOffset(trackName, newRowOffset) {
        return this.trackerGetTrackInfo(trackName).changeRowOffset(trackName, newRowOffset);
    }


    trackerChangeQuantization(trackName, trackerQuantizationTicks = null, promptUser=true) {
        return this.trackerGetTrackInfo(trackName).changeQuantization(trackerQuantizationTicks, promptUser);
    }

    trackerChangeSegmentLength(trackName, trackerSegmentLengthInRows = null, promptUser=true) {
        return this.trackerGetTrackInfo(trackName).changeSegmentLength(trackerSegmentLengthInRows, trackerSegmentLengthInRows, promptUser);
    }

    trackerChangeSelection(trackName, selectedIndices = null) {
        return this.trackerGetTrackInfo(trackName).changeSelection(selectedIndices);
    }


    trackerSelectIndices(trackName, selectedIndices=null, cursorOffset=null, rowOffset=null) {
        return this.trackerGetTrackInfo(trackName).selectIndices(selectedIndices, cursorOffset, rowOffset);
    }


    trackerCalculateRowOffset(trackName, cursorOffset=null) {
        return this.trackerGetTrackInfo(trackName).calculateRowOffset(trackName, cursorOffset);
    }

    trackerFindCursorRow(trackName, cursorOffset=null) {
        return this.trackerGetTrackInfo(trackName).findCursorRow(trackName, cursorOffset);
    }

    /** Row Iterator **/

    trackerEachRow(trackName, rowCallback, instructionCallback=null) {
        return this.trackerGetTrackInfo(trackName).eachRow(rowCallback, instructionCallback=null);
    }


    /** Selection **/

    // selectIndex(index, clearSelection = null, toggleValue = null) {
    //     let selectedIndices = clearSelection ? [] : this.state.selectedIndices;
    //     if (toggleValue) {
    //         selectedIndices.unshift(index); // Cursor goes first
    //     } else {
    //         const pos = selectedIndices.indexOf(index);
    //         selectedIndices.splice(pos, 1);
    //     }
    //     return this.selectIndicies(selectedIndices);
    // }

    selectIndices(selectedIndices, cursorOffset=null) {
        const trackName = this.state.selectedTrack;
        if (typeof selectedIndices === "string") {

            switch (selectedIndices) {
                case 'all':
                    selectedIndices = [];
                    const maxLength = this.song.instructionFindGroupLength(this.trackName);
                    for (let i = 0; i < maxLength; i++)
                        selectedIndices.push(i);
                    break;
                case 'segment':
                    selectedIndices = [].map.call(this.querySelectorAll('asct-instruction'), (elm => elm.index));
                    break;
                case 'row':
                    throw new Error('TODO');
                case 'none':
                    selectedIndices = [];
                    break;
                default:
                    throw new Error("Invalid selection: " + selectedIndices);
            }
        }
        if (typeof selectedIndices === 'number')
            selectedIndices = [selectedIndices];
        if (!Array.isArray(selectedIndices)) {
            console.warn("Invalid selection");
            return;
        }

        this.trackerSelectIndices(trackName, selectedIndices, cursorOffset);

        // this.state.selectedIndices = selectedIndices;
        // this.fieldTrackerSelection.value = selectedIndices.join(',');

        // await this.tracker.selectIndicies(selectedIndices);
        // this.tracker.forceUpdate();
    }

    /** Context menu **/
    // async openContextMenu(e) {
    //     const contextMenu = this.menuContext;
    //     await contextMenu.openContextMenu(e);
    // }

    /** Instruments **/


    async instrumentAdd(instrumentClassName, instrumentConfig = {}, promptUser=false) {
        if (!instrumentClassName)
            throw new Error(`Invalid instrument class`);
        const {title} = InstrumentLoader.getInstrumentClassInfo(instrumentClassName);
        // instrumentConfig = InstrumentLoader.createInstrumentConfig(instrumentClassName, instrumentConfig);
        // instrumentConfig.libraryURL = this.defaultLibraryURL;
        // instrumentConfig.name = instrumentConfig.name || instrumentURL.split('/').pop();

//         e.target.form.elements['instrumentURL'].value = '';
        if (promptUser === false || await this.openConfirmDialog(`Add '${title}' to Song?`)) {
            const instrumentID = this.song.instrumentAdd(instrumentConfig);
            this.setStatus(`New instrument class '${instrumentClassName}' added to song at position ${instrumentID}`);
            // this.forceUpdate();
            // this.fieldInstructionInstrument.setValue(instrumentID);
            // await this.panelInstruments.forceUpdate();

        } else {
            this.setError(`New instrument canceled: ${instrumentClassName}`);
        }
    }

    async instrumentReplace(instrumentID, instrumentClassName, instrumentConfig = {}) {
        if (!Number.isInteger(instrumentID))
            throw new Error(`Invalid Instrument ID: Not an integer`);
        if (!instrumentClassName)
            throw new Error(`Invalid Instrument class`);

        if (await this.openPromptDialog(`Change Instrument (${instrumentID}) to ${instrumentClassName}`)) {
            await this.song.instrumentReplace(instrumentID, instrumentConfig);
            this.setStatus(`Instrument (${instrumentID}) changed to: ${instrumentClassName}`);

        } else {
            this.setError(`Change instrument canceled: ${instrumentClassName}`);
        }
    }

    async instrumentRename(instrumentID, newInstrumentTitle = null) {
        console.log(this.song.instrumentGetConfig(instrumentID).title, instrumentID);
        const oldInstrumentTitle = this.song.instrumentGetConfig(instrumentID).title;
        if (!newInstrumentTitle)
            newInstrumentTitle = await this.openPromptDialog(`Change name for instruments ${instrumentID}: `, oldInstrumentTitle);
        if (!newInstrumentTitle)
            return console.error("Instrument name change canceled");
        this.song.instrumentRename(instrumentID, newInstrumentTitle);
        this.setStatus(`Instrument title updated: ${newInstrumentTitle}`);
    }

    async instrumentRemove(instrumentRemoveID = null) {
        if (await this.openConfirmDialog(`Remove Instrument ID: ${instrumentRemoveID}`)) {
            this.song.instrumentRemove(instrumentRemoveID);
            this.setStatus(`Instrument (${instrumentRemoveID}) removed`);

        } else {
            this.setError(`Remove instrument canceled`);
        }
    }


    /** Toggle Panels **/

    togglePanelInstruments() {
        this.classList.toggle('hide-panel-instruments');
    }

    togglePanelTracker() {
        this.classList.toggle('hide-panel-tracker');
    }

    togglePanelSong() {
        this.classList.toggle('hide-panel-song');
    }

    toggleFullscreen() {
        const setFullScreen = !this.classList.contains('fullscreen');
        this.classList.toggle('fullscreen', setFullScreen);
    }

    /** Tools **/



    async batchSelect(e, searchCallbackString = null, promptUser = false) {
        if (promptUser || !searchCallbackString)
            searchCallbackString = await this.openPromptDialog("Run custom search:", searchCallbackString ||
                `/** Example Search **/ i.command === "C3"   &&   i.instrument === 0`);
        if (!searchCallbackString)
            throw new Error("Batch command canceled: Invalid search");

        const storage = new Storage();
        storage.addBatchRecentSearches(searchCallbackString);

        throw new Error("TODO Implement");
        // const tracker = this.tracker;
        // this.clearselectedIndices();
        // const trackName = tracker.getTrackName();
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
        //         tracker.selectIndicies(e, iterator.currentIndex);
        //     }
        //     this.setStatus("Batch Search Completed: " + JSON.stringify(stats), stats);
        // } catch (err) {
        //     this.setStatus("Batch Search Failed: " + err.message, err);
        // }
    }

    async batchRunCommand(e, commandCallbackString = null, searchCallbackString = null, promptUser = false) {
        const storage = new Storage();

        if (promptUser || !searchCallbackString)
            searchCallbackString = await this.openPromptDialog("Run custom search:", searchCallbackString ||
                `/** Example Search **/ i.command === "C3"   &&   i.instrument === 0`);
        if (!searchCallbackString)
            throw new Error("Batch command canceled: Invalid search");
        storage.addBatchRecentSearches(searchCallbackString);


        if (promptUser || !commandCallbackString)
            commandCallbackString = await this.openPromptDialog(`Run custom command:`, commandCallbackString ||
                `/** Example Command **/ i.command='C4';`);
        if (!commandCallbackString)
            throw new Error("Batch command canceled: Invalid command");
        storage.addBatchRecentCommands(commandCallbackString);

        throw new Error("TODO Implement");
        // const instructionList = [];
        // const tracker = this.tracker;
        // const trackName = tracker.getTrackName(), g = trackName;
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
        //         tracker.selectIndex(e, iterator.currentIndex);
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


export default ComposerActions;
