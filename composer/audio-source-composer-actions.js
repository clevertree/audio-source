class AudioSourceComposerActions {

    constructor(editor) {
        this.editor = editor;
    }


    /** Song Commands **/

    setSongName(e, newSongName) {
        this.editor.song.name = newSongName;
        this.editor.setStatus(`Song name updated: ${newSongName}`);
    }
    setSongVersion(e, newSongVersion) {
        this.editor.song.version = newSongVersion;
        this.editor.setStatus(`Song version updated: ${newSongVersion}`);
    }

    setSongVolume(e, newSongVolume) {
        this.editor.song.setVolume(newSongVolume);
    }

    loadNewSongData() {
        const storage = new AudioSourceStorage();
        const defaultInstrumentURL = this.getDefaultInstrumentURL() + '';
        let songData = storage.generateDefaultSong(defaultInstrumentURL);
        this.editor.song.loadSongData(songData);
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
        const renderer = this.editor.song;
        const songData = renderer.data;
        const songHistory = renderer.history;
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
        const renderer = this.editor.song;
        const storage = new AudioSourceStorage();
        const songData = await storage.loadSongFromMemory(songGUID);
        const songHistory = await storage.loadSongHistoryFromMemory(songGUID);
        renderer.loadSongData(songData);
        renderer.loadSongHistory(songHistory);
        this.editor.render();
        this.editor.setStatus("Song loaded from memory: " + songGUID, songData);
//         console.info(songData);
    }

    async loadSongFromFileInput(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        switch(ext) {
            case 'mid':
            case 'midi':
                await this.loadSongFromMIDIFileInput(file);
                break;

            case 'json':
                await this.loadSongFromJSONFileInput(file);
                break;

            default:
                throw new Error("Unknown file type: " + ext);
        }
    }




    async loadSongFromJSONFileInput(file) {
        const storage = new AudioSourceStorage();
        const songData = await storage.loadJSONFile(file);
        this.editor.song.loadSongData(songData);
        this.editor.render();
        this.editor.setStatus("Song loaded from file: ", songData);
    }

    async loadSongFromMIDIFileInput(file, defaultInstrumentURL=null) {
        defaultInstrumentURL = defaultInstrumentURL || this.getDefaultInstrumentURL();
        const midiSupport = new MIDISupport();
        const songData = await midiSupport.loadSongFromMidiFile(file, defaultInstrumentURL);
        this.editor.song.loadSongData(songData);
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
        this.editor.song.loadSongData(songData, src);
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

    /** Tracker Commands **/

    insertInstructionCommand(e, newCommand=null, prompt=false) {
        // TODO: does not update
        const tracker = this.editor.tracker;
        const renderer = this.editor.song;
        let selectedIndicies = tracker.selectedIndicies;

        // if(selectedIndicies.length === 0)
        //     throw new Error("No selection");
        if(newCommand === null)
            newCommand = tracker.fieldInstructionCommand.value || null;
        if (prompt)
            newCommand = prompt("Set custom command:", newCommand || '');
        if (!newCommand)
            throw new Error("Invalid Instruction command");

        let newInstruction = tracker.getInstructionFormValues(newCommand);
        let newInstrument = null;
        // if (tracker.fieldInstructionCommand.selectedOptions[0] && tracker.fieldInstructionCommand.selectedOptions[0].hasAttribute('data-instrument')) // TODO: wtf?
        //     newInstrument = parseInt(tracker.fieldInstructionCommand.selectedOptions[0].getAttribute('data-instrument'));


        // TODO: use this.insertOrUpdateCommand() ?

        if (tracker.cursorCell) {
            const insertPosition = tracker.cursorPosition;
            if (insertPosition === null)
                throw new Error("No cursor position");
            const insertIndex = renderer.insertInstructionAtPosition(tracker.groupName, insertPosition, newInstruction);
            tracker.renderRows();
            tracker.selectIndicies(e, insertIndex);

        } else {
            throw new Error("No cursor cell");
        }
        tracker.playSelectedInstructions();
    }

    setInstructionCommand(e, newCommand=null, prompt=false) {
        //: TODO: does not allow insert
        const tracker = this.editor.tracker;
        const renderer = this.editor.song;
        let selectedIndicies = tracker.selectedIndicies;

        // if(selectedIndicies.length === 0)
        //     throw new Error("No selection");
        if(newCommand === null)
            newCommand = tracker.fieldInstructionCommand.value || null;
        if (prompt)
            newCommand = prompt("Set custom command:", newCommand || '');
        if (!newCommand)
            throw new Error("Invalid Instruction command");

        let newInstruction = tracker.getInstructionFormValues(newCommand);
        let newInstrument = null;
        // if (tracker.fieldInstructionCommand.selectedOptions[0] && tracker.fieldInstructionCommand.selectedOptions[0].hasAttribute('data-instrument')) // TODO: wtf?
        //     newInstrument = parseInt(tracker.fieldInstructionCommand.selectedOptions[0].getAttribute('data-instrument'));


        // TODO: use this.insertOrUpdateCommand() ?

        if (selectedIndicies.length > 0) {
            for (let i = 0; i < selectedIndicies.length; i++) {
                renderer.replaceInstructionCommand(tracker.groupName, selectedIndicies[i], newCommand);
                if (newInstrument !== null)
                    renderer.replaceInstructionInstrument(tracker.groupName, selectedIndicies[i], newInstrument);
                // renderer.playInstructionAtIndex(this.groupName, selectedIndicies[i]);
                tracker.findInstructionElement(selectedIndicies[i]).render();
            }
            tracker.renderRows();
            tracker.selectIndicies(e, selectedIndicies);

        } else {
            throw new Error("No selection");
        }
        tracker.playSelectedInstructions();
    }

    // TODO: assuming the use of tracker.groupName?
    setInstructionInstrument(e, instrumentID=null) {
        const tracker = this.editor.tracker;
        const renderer = this.editor.song;
        let selectedIndicies = tracker.selectedIndicies;

        instrumentID = instrumentID !== null ? instrumentID : parseInt(tracker.fieldInstructionInstrument.value);
        if (!Number.isInteger(instrumentID))
            throw new Error("Invalid Instruction ID");
        for (let i = 0; i < selectedIndicies.length; i++) {
            renderer.replaceInstructionInstrument(tracker.groupName, selectedIndicies[i], instrumentID);
            tracker.findInstructionElement(selectedIndicies[i]).render();
        }
        this.editor.status.currentInstrumentID = instrumentID;
        tracker.playSelectedInstructions();
        tracker.renderRows();
        tracker.selectIndicies(e, selectedIndicies);
        // this.fieldInstructionInstrument.focus();

    }

    setInstructionDuration(e, duration=null, prompt=false) {
        const tracker = this.editor.tracker;
        const renderer = this.editor.song;
        let selectedIndicies = tracker.selectedIndicies;

        if (!duration)
            duration = parseFloat(tracker.fieldInstructionDuration.value);
        if (prompt)
            duration = parseInt(prompt("Set custom duration in ticks:", duration));
        if (isNaN(duration))
            throw new Error("Invalid duration: " + typeof duration);
        for (let i = 0; i < selectedIndicies.length; i++) {
            renderer.replaceInstructionDuration(tracker.groupName, selectedIndicies[i], duration);
            tracker.findInstructionElement(selectedIndicies[i]).render();
        }
        tracker.playSelectedInstructions();
        tracker.renderRows();
        tracker.selectIndicies(e, selectedIndicies);
        // this.fieldInstructionDuration.focus();

    }

    setInstructionVelocity(e, velocity=null, prompt=false) {
        const tracker = this.editor.tracker;
        const renderer = this.editor.song;
        let selectedIndicies = tracker.selectedIndicies;

        if(velocity === null)
            velocity = tracker.fieldInstructionVelocity.value; //  === "0" ? 0 : parseInt(tracker.fieldInstructionVelocity.value) || null;
        velocity = parseFloat(velocity);
        if (prompt)
            velocity = parseInt(prompt("Set custom velocity (0-127):", tracker.fieldInstructionVelocity.value));
        if (velocity === null || isNaN(velocity))
            throw new Error("Invalid velocity: " + typeof velocity);
        for (let i = 0; i < selectedIndicies.length; i++) {
            renderer.replaceInstructionVelocity(tracker.groupName, selectedIndicies[i], velocity);
            tracker.findInstructionElement(selectedIndicies[i]).render();
        }
        tracker.playSelectedInstructions();
        tracker.renderRows();
        tracker.selectIndicies(e, selectedIndicies);
        // this.selectIndicies(e, selectedIndicies[0]);
        // this.fieldInstructionVelocity.focus();
    }

    deleteInstructionCommand(e) {
        const tracker = this.editor.tracker;
        const renderer = this.editor.song;
        let selectedIndicies = tracker.selectedIndicies;

        for (let i = 0; i < selectedIndicies.length; i++)
            renderer.deleteInstructionAtIndex(tracker.groupName, selectedIndicies[i]);
        tracker.renderRows();
        tracker.selectIndicies(e, selectedIndicies[0]);

    }

    /** Groups **/

    addNewSongGroup(e) {
        const tracker = this.editor.tracker;
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

        e.target.form.elements['instrumentURL'].value = '';
        if(confirm(`Add Instrument to Song?\nURL: ${addInstrumentURL}`)) {
            this.editor.song.addInstrument(addInstrumentURL);
            this.editor.setStatus("New instrument Added to song: " + addInstrumentURL);

        } else {
            this.editor.setStatus(`<span style='color: red'>New instrument canceled: ${addInstrumentURL}</span>`);
        }
    }

    songReplaceInstrument(e, instrumentID, changeInstrumentURL=null) {
        if(!Number.isInteger(instrumentID))
            throw new Error("Invalid Instrument ID");

        changeInstrumentURL = changeInstrumentURL || e.target.form.elements['instrumentURL'].value;
        if(!changeInstrumentURL) {
            this.editor.setStatus(`<span style='color: red'>Empty URL</span>`);
            return;
        }
        const changeInstrument = {
            url: changeInstrumentURL,
            id: instrumentID
        };
        changeInstrument.title = changeInstrument.url.split('/').pop();
        // if(confirm(`Set Instrument (${changeInstrument.id}) to ${changeInstrument.title}`)) {
        this.status.currentInstrumentID = this.editor.song.replaceInstrument(changeInstrument.id, changeInstrument.url);
        this.editor.setStatus(`Instrument (${changeInstrument.id}) changed to: ${changeInstrumentURL}`);
        if(this.tracker)
            this.tracker.fieldInstructionInstrument.value = changeInstrument.id;
        // } else {
        //     this.editor.setStatus(`<span style='color: red'>Change instrument canceled: ${changeInstrumentURL}</span>`);
        // }
    }

    songRemoveInstrument(e, removeInstrumentID=null) {
        removeInstrumentID = removeInstrumentID || parseInt(e.target.form.elements['instrumentID'].value);
        if(confirm(`Remove Instrument ID: ${removeInstrumentID}`)) {
            this.editor.song.removeInstrument(removeInstrumentID);
            this.editor.setStatus(`Instrument (${changeInstrument.id}) removed`);

        } else {
            this.editor.setStatus(`<span style='color: red'>Remove instrument canceled</span>`);
        }
    }

    /** Tracker **/

    setTrackerChangeGroup(e, groupName=null) {
        const tracker = this.editor.tracker;

        groupName = groupName || e.target.form.getAttribute('data-group');
        tracker.groupName = groupName;
        //TODO: validate
        // this.editor.selectGroup(selectedGroupName);
    }

    setTrackerOctave(e) {
        const tracker = this.editor.tracker;

        this.editor.status.currentOctave = parseInt(tracker.fieldRenderOctave.value); // TODO: refactor
    }

    setTrackerRowLength(e) {
        const tracker = this.editor.tracker;
        let selectedIndicies = tracker.selectedIndicies;
        this.rowLengthInTicks = tracker.fieldRenderRowLength.value;
        tracker.renderRows();
        tracker.selectIndicies(e, selectedIndicies);

    }

    setTrackerRowSegment(e) {
        const tracker = this.editor.tracker;

        this.currentRowSegmentID = parseInt(form.elements.id.value);
        tracker.renderRows();
        tracker.selectNextCell();

        let segmentContainer = tracker.querySelector(`asctr-segment[id="${this.currentRowSegmentID}"]`);
        segmentContainer.focus();
        // this.focusOnContainer();
    }

    setTrackerFilterInstrument(e) {
        const tracker = this.editor.tracker;
        let selectedIndicies = tracker.selectedIndicies;

        tracker.renderRows();
        tracker.selectIndicies(e, selectedIndicies);
    }

    setTrackerSelection(e, selectedIndicies=null) {
        const tracker = this.editor.tracker;

        if(!selectedIndicies)
            selectedIndicies = tracker.fieldSelectedIndicies.value
                .split(/\D+/)
                .map(index => parseInt(index));
        tracker.selectIndicies(e, selectedIndicies);
        tracker.fieldSelectedIndicies.focus();
    }

    /** Toggle Panels **/

    togglePanelInstrument(e) {

    }

    togglePanelTracker(e) {

    }

    togglePanelSong(e) {

    }

    toggleFullscreen(e) {

    }
}


