class AudioSourceComposerActions {

    constructor(editor) {
        this.editor = editor;
    }

    getDefaultInstrumentURL() {
        const Libraries = new AudioSourceLibraries;
        return Libraries.getScriptDirectory('instrument/audio-source-synthesizer.js');
    }


    /** Song Commands **/

    setInstrumentName(e, instrumentID, newInstrumentName) {
        this.editor.song.setInstrumentName(instrumentID, newInstrumentName);
        this.editor.setStatus(`Instrument name updated: ${newInstrumentName}`);
    }

    setSongName(e, newSongName) {
        this.editor.song.setName(newSongName);
        this.editor.setStatus(`Song name updated: ${newSongName}`);
    }
    setSongVersion(e, newSongVersion) {
        this.editor.song.setVersion(newSongVersion);
        this.editor.setStatus(`Song version updated: ${newSongVersion}`);
    }

    setSongVolume(e, newSongVolume) {
        this.editor.song.setVolume(newSongVolume);
        this.editor.setStatus(`Volume modified: ${newSongVolume}`);
    }

    async loadNewSongData() {
        const storage = new AudioSourceStorage();
        const defaultInstrumentURL = this.getDefaultInstrumentURL() + '';
        let songData = storage.generateDefaultSong(defaultInstrumentURL);
        await this.editor.song.loadSongData(songData);
        this.editor.render();
        this.editor.setStatus("Loaded new song", songData);
    }


    async loadRecentSongData() {
        const storage = new AudioSourceStorage();
        let songRecentGUIDs = await storage.getRecentSongList();
        if(songRecentGUIDs[0] && songRecentGUIDs[0].guid) {
            this.editor.setStatus("Loading recent song: " + songRecentGUIDs[0].guid);
            await this.loadSongFromMemory(songRecentGUIDs[0].guid);
            return true;
        }
        return false;
    }

    async saveSongToMemory() {
        const song = this.editor.song;
        const songData = song.data;
        const songHistory = song.history;
        const storage = new AudioSourceStorage();
        this.editor.setStatus("Saving song to memory...");
        await storage.saveSongToMemory(songData, songHistory);
        this.editor.setStatus("Saved song to memory: " + songData.guid);
    }

    saveSongToFile() {
        const songData = this.editor.song.data;
        // const songHistory = this.editor.song.history;
        const storage = new AudioSourceStorage();
        this.editor.setStatus("Saving song to file");
        storage.saveSongToFile(songData);
    }


    async loadSongFromMemory(songGUID) {
        const song = this.editor.song;
        const storage = new AudioSourceStorage();
        const songData = await storage.loadSongFromMemory(songGUID);
        if(songData.instruments.length === 0)
            console.warn("Song contains no instruments");
        const songHistory = await storage.loadSongHistoryFromMemory(songGUID);
        await song.loadSongData(songData);
        await song.loadSongHistory(songHistory);
        this.editor.render();
        this.editor.setStatus("Song loaded from memory: " + songGUID, songData);
//         console.info(songData);
    }

    async loadSongFromFileInput(e, fileInput=null) {
        fileInput = fileInput || this.editor.fieldSongFileLoad.inputElm;
        if(!fileInput || !fileInput.files || fileInput.files.length === 0)
            throw new Error("Invalid file input");
        if(fileInput.files.length > 1)
            throw new Error("Invalid file input: only one file allowed");
        const file = fileInput.files[0];
        const ext = file.name.split('.').pop().toLowerCase();
        switch(ext) {
            case 'mid':
            case 'midi':
                await this.loadSongFromMIDIFile(file);
                break;

            case 'json':
                await this.loadSongFromJSONFile(file);
                break;

            default:
                throw new Error("Unknown file type: " + ext);
        }
    }




    async loadSongFromJSONFile(file) {
        const storage = new AudioSourceStorage();
        const songData = await storage.loadJSONFile(file);
        if(songData.instruments.length === 0)
            console.warn("Song contains no instruments");
        await this.editor.song.loadSongData(songData);
        this.editor.render();
        this.editor.setStatus("Song loaded from file: ", songData);
    }

    async loadSongFromMIDIFile(file, defaultInstrumentURL=null) {
        defaultInstrumentURL = defaultInstrumentURL || this.getDefaultInstrumentURL();
        const midiSupport = new MIDISupport();
        const songData = await midiSupport.loadSongFromMidiFile(file, defaultInstrumentURL);
        await this.editor.song.loadSongData(songData);
        this.editor.render();
        this.editor.setStatus("Song loaded from midi: ", songData);
    }

    async loadSongFromSrc(src) {
        src = new URL(src, document.location) + '';
        const songData = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', src + '', true);
            xhr.responseType = 'json';
            xhr.onload = () => {
                if(xhr.status !== 200)
                    return reject("Song file not found: " + url);
                resolve(xhr.response);
            };
            xhr.send();
        });
        if(songData.instruments.length === 0)
            console.warn("Song contains no instruments");
        await this.editor.song.loadSongData(songData);
        this.editor.setStatus("Song loaded from src: " + src);
        console.info(this.editor.song.data);
        this.editor.render();
    }

    /** Song Playback **/


    async songPlay() {
        await this.editor.song.play();
    }

    async songPause() {
        this.editor.song.stopPlayback();
    }

    async songStop() {
        this.editor.song.stopPlayback();
        this.editor.song.setPlaybackPositionInTicks(0);
    }

    setSongPosition(e, playbackPosition=null) {
        const song = this.editor.song;
        if(playbackPosition === null) {
            playbackPosition = this.editor.parsePlaybackPosition(this.editor.fieldSongPosition.value);
        }
        song.setPlaybackPosition(playbackPosition);

    }

    /** Tracker Commands **/

    insertInstructionCommand(e, newCommand=null, promptUser=false) {
        //: TODO: check for recursive group
        const tracker = this.editor.trackerElm;
        const song = this.editor.song;
        let selectedIndicies = tracker.getSelectedIndicies();

        // if(selectedIndicies.length === 0)
        //     throw new Error("No selection");
        if(newCommand === null)
            newCommand = tracker.fieldInstructionCommand.value || null;
        if (promptUser)
            newCommand = prompt("Set custom command:", newCommand || '');
        if (!newCommand)
            throw new Error("Invalid Instruction command");

        let newInstruction = tracker.getInstructionFormValues(newCommand);

        const songPosition = song.getSongPositionInTicks();
        console.log(songPosition);
        let insertIndex = song.insertInstructionAtPosition(tracker.groupName, songPosition, newInstruction);
        tracker.renderRows();
        tracker.selectIndicies(e, insertIndex);
        tracker.playSelectedInstructions();
    }

    setInstructionCommand(e, newCommand=null, promptUser=false) {
        //: TODO: check for recursive group
        const tracker = this.editor.trackerElm;
        const renderer = this.editor.song;
        let selectedIndicies = tracker.getSelectedIndicies();

        if(selectedIndicies.length === 0)
            throw new Error("No selection");
        if(newCommand === null)
            newCommand = tracker.fieldInstructionCommand.value || null;
        if (promptUser)
            newCommand = prompt("Set custom command:", newCommand || '');
        if (!newCommand)
            throw new Error("Invalid Instruction command");

        for (let i = 0; i < selectedIndicies.length; i++) {
            renderer.replaceInstructionCommand(tracker.groupName, selectedIndicies[i], newCommand);
            tracker.findInstructionElement(selectedIndicies[i]).render();
        }
        tracker.playSelectedInstructions();
    }

    // TODO: assuming the use of tracker.groupName?
    setInstructionInstrument(e, instrumentID=null) {
        const tracker = this.editor.trackerElm;
        const renderer = this.editor.song;
        let selectedIndicies = tracker.getSelectedIndicies();

        instrumentID = instrumentID !== null ? instrumentID : parseInt(tracker.fieldInstructionInstrument.value);
        if (!Number.isInteger(instrumentID))
            throw new Error("Invalid Instruction ID");
        for (let i = 0; i < selectedIndicies.length; i++) {
            renderer.replaceInstructionInstrument(tracker.groupName, selectedIndicies[i], instrumentID);
            tracker.findInstructionElement(selectedIndicies[i]).render();
        }
        this.editor.status.currentInstrumentID = instrumentID;
        tracker.playSelectedInstructions();
    }

    setInstructionDuration(e, duration=null, promptUser=false) {
        const tracker = this.editor.trackerElm;
        const renderer = this.editor.song;
        let selectedIndicies = tracker.getSelectedIndicies();

        if (!duration)
            duration = parseFloat(tracker.fieldInstructionDuration.value);
        if (promptUser)
            duration = parseInt(prompt("Set custom duration in ticks:", duration));
        if (isNaN(duration))
            throw new Error("Invalid duration: " + typeof duration);
        for (let i = 0; i < selectedIndicies.length; i++) {
            renderer.replaceInstructionDuration(tracker.groupName, selectedIndicies[i], duration);
            tracker.findInstructionElement(selectedIndicies[i]).render();
        }
        tracker.playSelectedInstructions();

    }

    setInstructionVelocity(e, velocity=null, promptUser=false) {
        const tracker = this.editor.trackerElm;
        const renderer = this.editor.song;
        let selectedIndicies = tracker.getSelectedIndicies();

        if(velocity === null)
            velocity = tracker.fieldInstructionVelocity.value; //  === "0" ? 0 : parseInt(tracker.fieldInstructionVelocity.value) || null;
        velocity = parseFloat(velocity);
        if (promptUser)
            velocity = parseInt(prompt("Set custom velocity (0-127):", tracker.fieldInstructionVelocity.value));
        if (velocity === null || isNaN(velocity))
            throw new Error("Invalid velocity: " + typeof velocity);
        for (let i = 0; i < selectedIndicies.length; i++) {
            renderer.replaceInstructionVelocity(tracker.groupName, selectedIndicies[i], velocity);
            tracker.findInstructionElement(selectedIndicies[i]).render();
        }
        tracker.playSelectedInstructions();
    }

    deleteInstructionCommand(e) {
        const tracker = this.editor.trackerElm;
        const renderer = this.editor.song;
        let selectedIndicies = tracker.getSelectedIndicies();

        for (let i = 0; i < selectedIndicies.length; i++)
            renderer.deleteInstructionAtIndex(tracker.groupName, selectedIndicies[i]);
        tracker.renderRows();

    }

    /** Groups **/

    addNewSongGroup(e) {
        const tracker = this.editor.trackerElm;
        const renderer = this.editor.song;

        let newGroupName = renderer.generateInstructionGroupName(tracker.groupName);
        newGroupName = prompt("Create new instruction group?", newGroupName);
        if (newGroupName) renderer.addInstructionGroup(newGroupName, []);
        else this.editor.setStatus("<span style='color: red'>Create instruction group canceled</span>");
        this.editor.render();
    }

    /** Instruments **/


    songAddInstrument(e, addInstrumentURL=null) {
        addInstrumentURL = addInstrumentURL || e.target.form.elements['instrumentURL'].value;
        if(!addInstrumentURL) {
            this.editor.setStatus(`<span style='color: red'>Empty URL</span>`);
            return;
        }

//         e.target.form.elements['instrumentURL'].value = '';
        if(confirm(`Add Instrument to Song?\nURL: ${addInstrumentURL}`)) {
            this.editor.song.addInstrument(addInstrumentURL);
            this.editor.setStatus("New instrument Added to song: " + addInstrumentURL);

        } else {
            this.editor.setStatus(`<span style='color: red'>New instrument canceled: ${addInstrumentURL}</span>`);
        }
    }

    async songReplaceInstrument(e, instrumentID, changeInstrumentURL=null) {
        if(!Number.isInteger(instrumentID))
            throw new Error("Invalid Instrument ID: Not an integer");

        changeInstrumentURL = changeInstrumentURL || e.target.form.elements['instrumentURL'].value;
        if(!changeInstrumentURL)
            throw new Error('Failed to change instrument: Empty URL');

        const changeInstrument = {
            url: changeInstrumentURL,
            // id: instrumentID // wtf?
        };
        changeInstrument.title = changeInstrument.url.split('/').pop();
        // if(confirm(`Set Instrument (${instrumentID}) to ${changeInstrument.title}`)) {
        await this.editor.song.replaceInstrument(instrumentID, changeInstrument);
        await this.editor.song.loadInstrument(instrumentID, true);
        this.editor.setStatus(`Instrument (${instrumentID}) changed to: ${changeInstrumentURL}`);
        this.editor.trackerElm.fieldInstructionInstrument.value = instrumentID;
        // } else {
        //     this.editor.setStatus(`<span style='color: red'>Change instrument canceled: ${changeInstrumentURL}</span>`);
        // }
    }

    songRemoveInstrument(e, removeInstrumentID=null) {
        if(removeInstrumentID === null)
            removeInstrumentID = parseInt(e.target.form.elements['instrumentID'].value);
        if(confirm(`Remove Instrument ID: ${removeInstrumentID}`)) {
            this.editor.song.removeInstrument(removeInstrumentID);
            this.editor.setStatus(`Instrument (${removeInstrumentID}) removed`);

        } else {
            this.editor.setStatus(`<span style='color: red'>Remove instrument canceled</span>`);
        }
    }

    /** Tracker **/

    setTrackerChangeGroup(e, groupName=null) {
        const tracker = this.editor.trackerElm;

        groupName = groupName || e.target.form.getAttribute('data-group');
        tracker.groupName = groupName;
        //TODO: validate
        // this.editor.selectGroup(selectedGroupName);
    }

    setTrackerOctave(e) {
        const tracker = this.editor.trackerElm;

        this.editor.status.currentOctave = parseInt(tracker.fieldTrackerOctave.value); // TODO: refactor
    }

    setTrackerRowLength(e, rowLengthInTicks=null) {
        const tracker = this.editor.trackerElm;
        // let selectedIndicies = tracker.getSelectedIndicies();
        if(rowLengthInTicks !== null)
            tracker.fieldTrackerRowLength.value;
        tracker.renderRows();
        // tracker.selectIndicies(e, selectedIndicies);

    }

    setTrackerSegmentLength(e, segmentLength=null) {
        const tracker = this.editor.trackerElm;
        // let selectedIndicies = tracker.getSelectedIndicies();
        if(segmentLength !== null)
            tracker.fieldTrackerSegmentLength.value = segmentLength;
        tracker.renderRows();
        // tracker.selectIndicies(e, selectedIndicies);
    }

    // setTrackerRowSegment(e) {
    //     const tracker = this.editor.trackerElm;
    //
    //     this.currentRowSegmentID = parseInt(form.elements.id.value);
    //     tracker.renderRows();
    //     tracker.selectNextCell();
    //
    //     let segmentContainer = tracker.querySelector(`asctr-segment[id="${this.currentRowSegmentID}"]`);
    //     segmentContainer.focus();
    //     // this.focusOnContainer();
    // }

    setTrackerFilterInstrument(e) {
        const tracker = this.editor.trackerElm;
        // let selectedIndicies = tracker.getSelectedIndicies();

        tracker.renderRows();
        // tracker.selectIndicies(e, selectedIndicies);
    }

    setTrackerSelection(e, selectedIndicies=null) {
        const tracker = this.editor.trackerElm;

        if(!selectedIndicies)
            selectedIndicies = tracker.fieldTrackerSelection.value
                .split(/\D+/)
                .map(index => parseInt(index));
        tracker.selectIndicies(e, selectedIndicies);
        tracker.fieldTrackerSelection.focus();
    }


    /** Toggle Panels **/

    togglePanelInstruments(e) {
        this.editor.containerElm.classList.toggle('hide-panel-instruments')
    }

    togglePanelTracker(e) {
        this.editor.containerElm.classList.toggle('hide-panel-tracker')
    }

    togglePanelSong(e) {
        this.editor.containerElm.classList.toggle('hide-panel-song')
    }

    toggleFullscreen(e) {
        this.editor.classList.toggle('fullscreen')
    }
}


