import Song from "../song/Song";
import InstrumentLoader from "../instrument/InstrumentLoader";

import Storage from "../song/Storage";
import ComposerMenu from "./ComposerMenu";

class ComposerActions extends ComposerMenu {
    constructor(state = {}, props = {}) {
        super(state, props);
        this.onSongEventCallback = (e) => this.onSongEvent(e);
    }

    getDefaultInstrumentClass() {
        return 'AudioSourceSynthesizer';
        // return new URL('../instrument/audio-source-synthesizer.js', thisModule.src);
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
        this.state.volume = volume;
        this.fieldSongVolume.value = volume * 100;
    }


    /** Song commands **/


    async setSongName(e, newSongName=null) {
        if(newSongName === null)
            newSongName = await this.openPromptDialog("Enter a new song name", this.song.getTitle());
        this.song.songChangeName(newSongName);
        this.setStatus(`Song name updated: ${newSongName}`);
    }

    setSongVersion(e, newSongVersion) {
        this.song.songChangeVersion(newSongVersion);
        this.setStatus(`Song version updated: ${newSongVersion}`);
    }

    songChangeStartingBPM(e, newSongBPM) {
        this.song.songChangeStartingBPM(newSongBPM);
        this.setStatus(`Song beats per minute updated: ${newSongBPM}`);
    }


    async loadNewSongData() {
        const storage = new Storage();
        const defaultInstrumentURL = this.getDefaultInstrumentClass() + '';
        let songData = storage.generateDefaultSong(defaultInstrumentURL);
        await this.song.loadSongData(songData);
        this.forceUpdate();
        this.setStatus("Loaded new song", songData);
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


    async loadSongFromMemory(songUUID) {
        const song = await Song.loadSongFromMemory(songUUID);
        await this.setCurrentSong(song);
        this.setStatus("Song loaded from memory: " + songUUID, this.song, this.state);
//         console.info(songData);
    }

    async openSongFromFileDialog(e, accept=null) {
        const file = await this.openFileDialog(accept);
        this.loadSongFromFileInput(file);
    }

    async loadSongFromFileInput(e, file=null, accept=null) {
        if(file === null)
            file = await this.openFileDialog(accept);
        if (!file)
            throw new Error("Invalid file input");
        const song = await Song.loadSongFromFileInput(file);
        await this.setCurrentSong(song);
        // await this.song.loadSongFromFileInput(file);
        // this.render();
    }


    async loadSongFromURL(url) {
        const song = await Song.loadSongFromURL(url);
        await this.setCurrentSong(song);
        this.setStatus("Loaded from url: " + url);
    }

    async saveSongToMemory() {
        const song = this.song;
        const songData = song.data;
        const songHistory = song.history;
        const storage = new Storage();
        this.setStatus("Saving song to memory...");
        await storage.saveSongToMemory(songData, songHistory);
        this.setStatus("Saved song to memory: " + songData.uuid);
    }

    async saveSongToFile() {
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
//                 url = prompt("Enter a Song URL:", url || 'https://mysite.com/songs/mysong.json');
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


    async updateSongPositionValue(playbackPositionInSeconds) {
        const roundedSeconds = Math.round(playbackPositionInSeconds);
        this.fieldSongTiming.value = this.values.formatPlaybackPosition(playbackPositionInSeconds);
        if (this.fieldSongPosition.value !== roundedSeconds)
            this.fieldSongPosition.value = roundedSeconds;
        await this.tracker.updateSongPositionValue(playbackPositionInSeconds);
    }

    // setSongPositionAsPercent(e, playbackPositionPercent) {
    //     const song = this.song;
    //     const length = song.getSongLengthInSeconds();
    //     song.setPlaybackPosition(length * (playbackPositionPercent));
    // }

    /** Tracker Commands **/

    // playSelectedInstructions() {
    //     const audioContext = this.getVolumeGain()
    //     if (this.song.isPlaying)
    //         this.song.stopPlayback();
    //     const selectedIndices = this.state.selectedIndices;
    //     for (let i = 0; i < selectedIndices.length; i++) {
    //         this.song.playInstructionAtIndex(this.getVolumeGain(), this.state.selectedGroup, selectedIndices[i]);
    //     }
    // }

    playCursorInstruction() {
        if (this.song.isPlaying)
            this.song.stopPlayback();
        throw new Error("Implement");
        // const cursorItem = this.tracker.refs.cursorList[this.tracker.state.cursorListOffset];
        // if (cursorItem instanceof AudioSourceComposerTrackerInstruction) {
        //     this.song.playInstructionAtIndex(this.getVolumeGain(), this.state.tracker.currentGroup, cursorItem.index);
        // }
    }


    async renderInstruction(groupName, index) {
        const instruction = this.song.instructionFind(groupName, index);
        this.tracker.findInstructionElement(index)
            .update(this.song, instruction);
    }


    instructionInsertOrUpdate(e, commandString = null) {
        let selectedIndices = this.state.selectedIndices;
        if (this.cursorCell.matches('asct-instruction-add')) {
            let newInstruction = this.instructionGetFormValues(commandString);
            if (!newInstruction) {
                this.editorElm.refs.fieldInstructionCommand.focus();
                return console.info("Insert canceled");
            }

            const insertPosition = this.cursorPosition;
            const insertIndex = this.instructionInsertAtPosition(insertPosition, newInstruction);
            // this.cursorRow.render(true);
            this.renderRows();
            this.selectSegmentIndicies(insertIndex, true);
            // selectedIndices = [insertIndex];
//                             console.timeEnd("new");
            // cursorInstruction = instructionList[insertIndex];
        } else {
            for (let i = 0; i < selectedIndices.length; i++) {
                const selectedInstruction = this.instructionFind(selectedIndices[i]);
                const replaceCommand = this.replaceFrequencyAlias(commandString, selectedInstruction.instrument);
                this.instructionReplaceCommand(selectedIndices[i], replaceCommand);
            }
            this.renderRows();
            this.selectSegmentIndicies(selectedIndices);
            // this.selectIndicies(this.state.selectedIndices[0]); // TODO: select all
        }
    }


    async instructionInsert(newCommand = null, promptUser = false, instrumentID = null, groupName = null) {
        //: TODO: check for recursive group
        const tracker = this.tracker;
        groupName = groupName || tracker.getGroupName();
        const song = this.song;
        // let selectedIndices = this.getSelectedIndices();

        // if(selectedIndices.length === 0)
        //     throw new Error("No selection");
        if (newCommand === null)
            newCommand = this.fieldInstructionCommand.value || null;
        if (promptUser)
            newCommand = prompt("Set custom command:", newCommand || '');
        if (!newCommand)
            throw new Error("Invalid Instruction command");

        let newInstruction = tracker.instructionGetFormValues(newCommand);
        if (instrumentID !== null)
            newInstruction.instrument = instrumentID;

        const songPosition = song.getSongPositionInTicks();
        console.log(songPosition);
        let insertIndex = song.instructionInsertAtPosition(groupName, songPosition, newInstruction);
        await tracker.forceUpdate();
        this.selectIndicies(insertIndex);
        this.playCursorInstruction();
    }

    async instructionChangeCommand(newCommand = null, promptUser = false, instrumentID = null, groupName = null, selectedIndices = null) {
        //: TODO: check for recursive group
        const song = this.song;
        const tracker = this.tracker;
        groupName = groupName || tracker.getGroupName();
        selectedIndices = selectedIndices || this.state.selectedIndices;

        if (selectedIndices.length === 0)
            throw new Error("No selection");
        const firstInstruction = this.song.instructionFind(groupName, selectedIndices[0]);
        if (newCommand === null)
            newCommand = firstInstruction.command || this.fieldInstructionCommand.value || null;
        if (promptUser)
            newCommand = prompt("Set custom command:", newCommand || '');
        if (!newCommand)
            throw new Error("Invalid Instruction command");

        for (let i = 0; i < selectedIndices.length; i++) {
            song.instructionReplaceCommand(groupName, selectedIndices[i], newCommand);
            if (instrumentID !== null) {
                song.instructionReplaceInstrument(groupName, selectedIndices[i], instrumentID);
            }
            await this.renderInstruction(groupName, selectedIndices[i]);
        }
        this.playCursorInstruction();
    }

    // TODO: assuming the use of tracker.getGroupName()?
    async instructionChangeInstrument(instrumentID = null, groupName = null, selectedIndices = null) {
        const tracker = this.tracker;
        const song = this.song;
        groupName = groupName || tracker.getGroupName();
        selectedIndices = selectedIndices || this.state.selectedIndices;

        instrumentID = instrumentID !== null ? instrumentID : parseInt(this.fieldInstructionInstrument.value);
        if (!Number.isInteger(instrumentID))
            throw new Error("Invalid Instruction ID");
        for (let i = 0; i < selectedIndices.length; i++) {
            song.instructionReplaceInstrument(tracker.getGroupName(), selectedIndices[i], instrumentID);
            await this.renderInstruction(groupName, selectedIndices[i]);
        }
        await this.fieldInstructionInstrument.setValue(instrumentID);
        this.playCursorInstruction();
    }

    async instructionChangeDuration(duration = null, promptUser = false, groupName = null, selectedIndices = null) {
        const tracker = this.tracker;
        const song = this.song;
        groupName = groupName || tracker.getGroupName();
        selectedIndices = selectedIndices || this.state.selectedIndices;

        if (!duration)
            duration = parseFloat(this.fieldInstructionDuration.value);
        if (promptUser)
            duration = parseInt(prompt("Set custom duration in ticks:", duration));
        if (isNaN(duration))
            throw new Error("Invalid duration: " + typeof duration);
        for (let i = 0; i < selectedIndices.length; i++) {
            song.instructionReplaceDuration(tracker.getGroupName(), selectedIndices[i], duration);
            await this.renderInstruction(groupName, selectedIndices[i]);
        }
        this.playCursorInstruction();

    }

    async instructionChangeVelocity(velocity = null, promptUser = false, groupName = null, selectedIndices = null) {
        const tracker = this.tracker;
        const song = this.song;
        groupName = groupName || tracker.getGroupName();
        selectedIndices = selectedIndices || this.state.selectedIndices;

        if (velocity === null)
            velocity = this.fieldInstructionVelocity.value; //  === "0" ? 0 : parseInt(this.fieldInstructionVelocity.value) || null;
        velocity = parseFloat(velocity);
        if (promptUser)
            velocity = parseInt(prompt("Set custom velocity (0-127):", this.fieldInstructionVelocity.value));
        if (velocity === null || isNaN(velocity))
            throw new Error("Invalid velocity: " + typeof velocity);
        for (let i = 0; i < selectedIndices.length; i++) {
            song.instructionReplaceVelocity(tracker.getGroupName(), selectedIndices[i], velocity);
            await this.renderInstruction(groupName, selectedIndices[i]);
        }
        this.playCursorInstruction();
    }

    async instructionDelete(groupName = null, selectedIndices = null) {
        const tracker = this.tracker;
        const song = this.song;
        groupName = groupName || tracker.getGroupName();
        selectedIndices = selectedIndices || this.state.selectedIndices;

        for (let i = 0; i < selectedIndices.length; i++)
            song.instructionDeleteAtIndex(tracker.getGroupName(), selectedIndices[i]);
        await tracker.forceUpdate();

    }

    /** Tracker Cells **/

    async setCursor(newCursor, clearSelection = null, toggleValue = null) {
        await this.tracker.setCursorElement(newCursor);
        throw new Error("Implement");

        // if (newCursor instanceof AudioSourceComposerTrackerInstruction) {
        //     await this.selectIndex(newCursor.index, clearSelection, toggleValue);
        //     const instruction = newCursor.instructionFind(this.song, this.state.tracker.currentGroup);
        //     this.fieldInstructionCommand.value = instruction.command;
        //     this.fieldInstructionInstrument.value = instruction.instrument;
        //     this.fieldInstructionVelocity.value = instruction.velocity;
        //     this.fieldInstructionDuration.value = instruction.duration;
        // } else if (newCursor instanceof AudioSourceComposerTrackerRow) {
        //     await this.setSongPosition(newCursor.positionInSeconds);
        //     if (clearSelection)
        //         this.clearselectedIndices();
        //
        // }

        // this.playCursorInstruction();
    }

    async setNextCursor(clearSelection = null, toggleValue = null) {
        const nextCursor = this.tracker.getNextCursor();
        if (!nextCursor) {
            await this.trackerChangeSegment(this.tracker.state.trackerRowOffset + 1);
            return this.setCursor(this.tracker.getFirstCursor(), clearSelection, toggleValue);
        }

        await this.setCursor(nextCursor, clearSelection, toggleValue);
    }

    async setPreviousCursor(clearSelection = null, toggleValue = null) {
        const previousCursor = this.tracker.getPreviousCursor();
        if (!previousCursor) {
            if (this.tracker.state.trackerRowOffset <= 0)
                throw new Error("Beginning of song");
            await this.trackerChangeSegment(this.tracker.state.trackerRowOffset - 1);
            return this.setCursor(this.tracker.getLastCursor(), clearSelection, toggleValue);
        }
        await this.setCursor(previousCursor, clearSelection, toggleValue);
    }

    async setNextRowCursor(clearSelection = null, toggleValue = null) {
        const nextRowCursor = this.tracker.getNextRowCursor();
        if (!nextRowCursor) {
            await this.trackerChangeSegment(this.tracker.state.trackerRowOffset + 1);
            return this.setCursor(this.tracker.getFirstCursor(), clearSelection, toggleValue);
        }
        await this.setCursor(nextRowCursor, clearSelection, toggleValue);
    }

    async setPreviousRowCursor(clearSelection = null, toggleValue = null) {
        const previousRowCursor = this.tracker.getPreviousRowCursor();
        if (!previousRowCursor) {
            if (this.tracker.state.trackerRowOffset <= 0)
                throw new Error("Beginning of song");
            await this.trackerChangeSegment(this.tracker.state.trackerRowOffset - 1);
            return this.setCursor(this.tracker.getLastCursor(), clearSelection, toggleValue);
        }
        await this.setCursor(previousRowCursor, clearSelection, toggleValue);
    }


    /** Selection **/

    selectIndex(index, clearSelection = null, toggleValue = null) {
        let selectedIndices = clearSelection ? [] : this.state.selectedIndices;
        if (toggleValue) {
            selectedIndices.unshift(index); // Cursor goes first
        } else {
            const pos = selectedIndices.indexOf(index);
            selectedIndices.splice(pos, 1);
        }
        return this.selectIndicies(selectedIndices);
    }

    selectIndicies(selectedIndices) {
        if (typeof selectedIndices === "string") {

            switch (selectedIndices) {
                case 'all':
                    selectedIndices = [];
                    const maxLength = this.song.instructionFindGroupLength(this.groupName);
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

        selectedIndices = selectedIndices.filter((v, i, a) => a.indexOf(v) === i);

        this.state.selectedIndices = selectedIndices;
        this.fieldTrackerSelection.value = selectedIndices.join(',');

        // await this.tracker.selectIndicies(selectedIndices);
        this.tracker.forceUpdate();
    }

    /** @deprecated **/
    getSelectedIndices() { return this.state.selectedIndices; }
        // const value = this.fieldTrackerSelection ? this.fieldTrackerSelection.value : '';
        // if (value === '')
        //     return [];
        // return value
        //     .split(/\D+/)
        //     .map(index => parseInt(index));
        // return this.selectedIndices;
        // const selectedIndices = [].map.call(this.selectedCells, (elm => elm.index));

    clearselectedIndices() {
        this.fieldTrackerSelection.value = '';
        this.selectIndicies([]);
    }

    toggleSelectionAtIndex(index, toggleValue = null) {
        const selectedIndices = this.state.selectedIndices;
        const pos = selectedIndices.indexOf(index);
        if (toggleValue === null)
            toggleValue = pos === -1;
        if (toggleValue) {
            selectedIndices.splice(pos, 1);
        } else {
            selectedIndices.push(index);
        }
        this.fieldTrackerSelection.value = selectedIndices.join(',');
        return selectedIndices;
    }

    // selectIndex(index) { return this.toggleSelectionAtIndex(index, true); }
    // removeSelectedIndex(index) { return this.toggleSelectionAtIndex(index, false); }

    /** Context menu **/
    async openContextMenu(e) {
        const contextMenu = this.menuContext;
        await contextMenu.openContextMenu(e);
    }

    /** Groups **/

    groupAdd() {
        const song = this.song;

        let newGroupName = song.generateInstructionGroupName();
        newGroupName = window.prompt("Create new instruction group?", newGroupName);
        if (newGroupName) {
            song.groupAdd(newGroupName, []);
            this.panelTrackerGroups.forceUpdate();
        } else {
            this.setStatus("<span class='error'>Create instruction group canceled</span>");
        }
    }

    groupRename(groupName, newGroupName = null) {
        const song = this.song;

        newGroupName = window.prompt(`Rename instruction group (${groupName})?`, groupName);
        if (newGroupName !== groupName) {
            song.groupRename(groupName, newGroupName);
            this.render();
        } else {
            this.setStatus("<span class='error'>Rename instruction group canceled</span>");
        }
    }

    groupRemove(groupName) {
        const song = this.song;

        const result = window.confirm(`Remove instruction group (${groupName})?`);
        if (result) {
            song.groupRemove(groupName);
            this.render();
        } else {
            this.setStatus("<span class='error'>Remove instruction group canceled</span>");
        }

    }

    /** Instruments **/


    async instrumentAdd(instrumentClassName, instrumentConfig = {}, promptUser=false) {
        if (!instrumentClassName)
            throw new Error(`Invalid instrument class`);
        const {title} = InstrumentLoader.getInstrumentClass(instrumentClassName);
        instrumentConfig = InstrumentLoader.createInstrumentConfig(instrumentClassName, instrumentConfig);
        // instrumentConfig.libraryURL = this.defaultLibraryURL;
        // instrumentConfig.name = instrumentConfig.name || instrumentURL.split('/').pop();

//         e.target.form.elements['instrumentURL'].value = '';
        if (promptUser === false || window.confirm(`Add '${title}' to Song?`)) {
            const instrumentID = this.song.instrumentAdd(instrumentConfig);
            this.setStatus(`New instrument (${instrumentID} Added to song: ` + instrumentClassName);
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
        instrumentConfig = InstrumentLoader.createInstrumentConfig(instrumentClassName, instrumentConfig);
        // instrumentConfig.libraryURL = this.libraryURL; // TODO: set library url
        // instrumentConfig.name = instrumentConfig.name || instrumentURL.split('/').pop();
        if (window.confirm(`Change Instrument (${instrumentID}) to ${instrumentClassName}`)) {
            await this.song.instrumentReplace(instrumentID, instrumentConfig);
            await this.song.loadInstrument(instrumentID, true);
            this.setStatus(`Instrument (${instrumentID}) changed to: ${instrumentClassName}`);
            // this.fieldInstructionInstrument.setValue(instrumentID);

        } else {
            this.setError(`Change instrument canceled: ${instrumentClassName}`);
        }
    }

    instrumentRename(instrumentID, newInstrumentName = null) {
        const config = this.song.getInstrumentConfig(instrumentID);
        let oldInstrumentName = config.name;
        if (!newInstrumentName)
            newInstrumentName = prompt(`Change name for instrument ${instrumentID}: `, oldInstrumentName);
        if (!newInstrumentName)
            throw new Error("Instrument name change canceled");
        this.song.instrumentRename(instrumentID, newInstrumentName);
        this.setStatus(`Instrument name updated: ${newInstrumentName}`);
    }

    instrumentRemove(instrumentRemoveID = null) {
        // if (instrumentRemoveID === null)
        //     instrumentRemoveID = parseInt(e.target.form.elements['instrumentID'].value);
        if (window.confirm(`Remove Instrument ID: ${instrumentRemoveID}`)) {
            this.song.instrumentRemove(instrumentRemoveID);
            this.setStatus(`Instrument (${instrumentRemoveID}) removed`);

        } else {
            this.setError(`Remove instrument canceled`);
        }
    }

    /** Tracker Segments **/


    async trackerChangeSegment(newRowSegmentID) {
        if (!Number.isInteger(newRowSegmentID))
            throw new Error("Invalid segment ID");
        const oldSegmentID = this.tracker.state.trackerRowOffset;
        await this.tracker.setState({currentRowSegmentID: newRowSegmentID});
        this.panelTrackerRowSegmentButtons[oldSegmentID].setState({selected: false});
        this.panelTrackerRowSegmentButtons[newRowSegmentID].setState({selected: true});
        // this.currentRowSegmentID = newRowSegmentID;
        // this.renderRows();
    }

    /** Tracker **/

    async trackerChangeGroup(groupName = null) {
        const tracker = this.tracker;

        // groupName = groupName || e.target.form.getAttribute('data-group');
        await tracker.setGroupName(groupName);
        await this.panelTrackerGroups.forceUpdate();
        await this.panelTrackerRowSegments.forceUpdate();
        //TODO: validate
        // this.selectGroup(selectedGroupName);
    }

    trackerChangeOctave(newOctave = null) {
        if (newOctave !== null)
            this.fieldTrackerOctave.value = newOctave;
    }

    trackerChangeRowLength(trackerRowLength = null) {
        const tracker = this.tracker;
        tracker.setState({trackerRowLength});

    }

    async trackerChangeSegmentLength(segmentLengthInTicks = null) {
        const tracker = this.tracker;
        await tracker.setState({segmentLengthInTicks});
        await this.panelTrackerRowSegments.forceUpdate();
    }

    // setTrackerRowSegment(e) {
    //     const tracker = this.tracker;
    //
    //     this.currentRowSegmentID = parseInt(form.elements.id.value);
    //     tracker.renderRows();
    //     tracker.selectNextCell();
    //
    //     let segmentContainer = tracker.querySelector(`asctr-segment[id="${this.currentRowSegmentID}"]`);
    //     segmentContainer.focus();
    //     // this.focusOnContainer();
    // }

    trackerChangeInstrumentFilter(filterByInstrumentID) {
        const tracker = this.tracker;
        tracker.setState({filterByInstrumentID})
        // let selectedIndices = this.getSelectedIndices();

        // tracker.renderRows();
        // this.selectIndicies(e, selectedIndices);
    }

    async trackerChangeSelection(e, selectedIndices = null) {
        if (selectedIndices === null)
            selectedIndices = await this.openPromptDialog("Enter selection: ", this.state.selectedIndices.join(', '));
        this.selectIndicies(selectedIndices);
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



    batchSelect(e, searchCallbackString = null, promptUser = false) {
        if (promptUser || !searchCallbackString)
            searchCallbackString = prompt("Run custom search:", searchCallbackString ||
                `/** Example Search **/ i.command === "C3"   &&   i.instrument === 0`);
        if (!searchCallbackString)
            throw new Error("Batch command canceled: Invalid search");

        const storage = new Storage();
        storage.addBatchRecentSearches(searchCallbackString);

        throw new Error("TODO Implement");
        // const tracker = this.tracker;
        // this.clearselectedIndices();
        // const groupName = tracker.getGroupName();
        // try {
        //     const stats = {count: 0};
        //     const iterator = this.song.instructionGetIterator(groupName);
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

    batchRunCommand(e, commandCallbackString = null, searchCallbackString = null, promptUser = false) {
        const storage = new Storage();

        if (promptUser || !searchCallbackString)
            searchCallbackString = prompt("Run custom search:", searchCallbackString ||
                `/** Example Search **/ i.command === "C3"   &&   i.instrument === 0`);
        if (!searchCallbackString)
            throw new Error("Batch command canceled: Invalid search");
        storage.addBatchRecentSearches(searchCallbackString);


        if (promptUser || !commandCallbackString)
            commandCallbackString = prompt(`Run custom command:`, commandCallbackString ||
                `/** Example Command **/ i.command='C4';`);
        if (!commandCallbackString)
            throw new Error("Batch command canceled: Invalid command");
        storage.addBatchRecentCommands(commandCallbackString);

        throw new Error("TODO Implement");
        // const instructionList = [];
        // const tracker = this.tracker;
        // const groupName = tracker.getGroupName(), g = groupName;
        // try {
        //     const stats = {count: 0, modified: 0};
        //     const iterator = this.song.instructionGetIterator(groupName);
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
