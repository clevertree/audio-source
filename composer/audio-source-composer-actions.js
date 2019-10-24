class AudioSourceComposerActions {

    constructor(editor) {
        this.editor = editor;
    }

    getDefaultInstrumentURL() {
        const Util = new AudioSourceUtilities;
        return Util.getScriptDirectory('instrument/audio-source-synthesizer.js');
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
        this.editor.render(true);
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
            const values = new AudioSourceValues();
            playbackPosition = values.parsePlaybackPosition(this.editor.fieldSongPosition.value);
        }
        song.setPlaybackPosition(playbackPosition);

    }

    /** Tracker Commands **/

    insertInstructionCommand(e, newCommand=null, promptUser=false, instrumentID=null) {
        //: TODO: check for recursive group
        const tracker = this.editor.trackerElm;
        const song = this.editor.song;
        // let selectedIndicies = tracker.getSelectedIndicies();

        // if(selectedIndicies.length === 0)
        //     throw new Error("No selection");
        if(newCommand === null)
            newCommand = tracker.fieldInstructionCommand.value || null;
        if (promptUser)
            newCommand = prompt("Set custom command:", newCommand || '');
        if (!newCommand)
            throw new Error("Invalid Instruction command");

        let newInstruction = tracker.getInstructionFormValues(newCommand);
        if(instrumentID !== null)
            newInstruction.instrument = instrumentID;

        const songPosition = song.getSongPositionInTicks();
        console.log(songPosition);
        let insertIndex = song.insertInstructionAtPosition(tracker.groupName, songPosition, newInstruction);
        tracker.renderRows();
        tracker.selectIndicies(e, insertIndex);
        tracker.playSelectedInstructions();
    }

    setInstructionCommand(e, newCommand=null, promptUser=false, instrumentID=null) {
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
            if(instrumentID !== null)
                renderer.replaceInstructionInstrument(tracker.groupName, selectedIndicies[i], instrumentID);
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
        tracker.fieldInstructionInstrument.value = instrumentID;
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

    songGroupAddNew(e) {
        const tracker = this.editor.trackerElm;
        const song = this.editor.song;

        let newGroupName = song.generateInstructionGroupName();
        newGroupName = prompt("Create new instruction group?", newGroupName);
        if (newGroupName) {
            song.addInstructionGroup(newGroupName, []);
            this.editor.render();
        } else {
            this.editor.setStatus("<span class='error'>Create instruction group canceled</span>");
        }
    }

    songGroupRename(e, groupName, newGroupName=null) {
        const song = this.editor.song;

        newGroupName = prompt(`Rename instruction group (${groupName})?`, groupName);
        if (newGroupName !== groupName) {
            song.renameInstructionGroup(groupName, newGroupName);
            this.editor.render();
        } else {
            this.editor.setStatus("<span class='error'>Rename instruction group canceled</span>");
        }
    }

    songGroupRemove(e, groupName) {
        const song = this.editor.song;

        const result = confirm(`Remove instruction group (${groupName})?`);
        if (result) {
            song.removeInstructionGroup(groupName);
            this.editor.render();
        } else {
            this.editor.setStatus("<span class='error'>Remove instruction group canceled</span>");
        }

    }

    /** Instruments **/


    songAddInstrument(e, instrumentURL, instrumentConfig={}) {
        if(!instrumentURL)
            return this.editor.handleError(`Empty URL`);
        instrumentConfig.url = instrumentURL;
        instrumentConfig.libraryURL = this.editor.libraryURL;
        // instrumentConfig.name = instrumentConfig.name || instrumentURL.split('/').pop();

//         e.target.form.elements['instrumentURL'].value = '';
        if(confirm(`Add Instrument to Song?\nURL: ${instrumentURL}`)) {
            const instrumentID = this.editor.song.addInstrument(instrumentConfig);
            this.editor.setStatus("New instrument Added to song: " + instrumentURL);
            this.editor.trackerElm.fieldInstructionInstrument.value = instrumentID;

        } else {
            this.editor.handleError(`New instrument canceled: ${instrumentURL}`);
        }
    }

    async songReplaceInstrument(e, instrumentID, instrumentURL, instrumentConfig={}) {
        if(!Number.isInteger(instrumentID))
            return this.editor.handleError(`Invalid Instrument ID: Not an integer`);
        if(!instrumentURL)
            return this.editor.handleError(`Empty URL`);
        instrumentConfig.url = instrumentURL;
        instrumentConfig.libraryURL = this.editor.libraryURL;
        // instrumentConfig.name = instrumentConfig.name || instrumentURL.split('/').pop();
        if(confirm(`Change Instrument (${instrumentID}) to ${instrumentURL}`)) {
            await this.editor.song.replaceInstrument(instrumentID, instrumentConfig);
            await this.editor.song.loadInstrument(instrumentID, true);
            this.editor.setStatus(`Instrument (${instrumentID}) changed to: ${instrumentURL}`);
            this.editor.trackerElm.fieldInstructionInstrument.value = instrumentID;

        } else {
            this.editor.handleError(`Change instrument canceled: ${instrumentURL}`);
        }
    }

    songRemoveInstrument(e, removeInstrumentID=null) {
        if(removeInstrumentID === null)
            removeInstrumentID = parseInt(e.target.form.elements['instrumentID'].value);
        if(confirm(`Remove Instrument ID: ${removeInstrumentID}`)) {
            this.editor.song.removeInstrument(removeInstrumentID);
            this.editor.setStatus(`Instrument (${removeInstrumentID}) removed`);

        } else {
            this.editor.handleError(`Remove instrument canceled`);
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

    setTrackerOctave(e, newOctave=null) {
        if(newOctave !== null)
            this.editor.trackerElm.fieldTrackerOctave.value = newOctave;
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

    /** Tools **/



    batchSelect(e, searchCallbackString=null, promptUser=false) {
        if(promptUser || !searchCallbackString)
            searchCallbackString = prompt("Run custom search:", searchCallbackString ||
                `/** Example Search **/ i.command === "C3"   &&   i.instrument === 0`);
        if(!searchCallbackString)
            throw new Error("Batch command canceled: Invalid search");

        const storage = new AudioSourceStorage();
        storage.addBatchRecentSearches(searchCallbackString);


        const tracker = this.editor.trackerElm;
        tracker.clearSelection();
        const groupName = tracker.groupName, g=groupName;
        try {
            const stats = {count:0};
            const iterator = this.editor.song.getIterator(groupName);
            let instruction;
            const window=null, document=null;
            while(instruction = iterator.nextConditionalInstruction((instruction) => {
                const i=instruction;
                return eval(searchCallbackString);
            })) {
                stats.count++;
                tracker.selectIndex(e, iterator.groupIndex);
            }
            this.editor.setStatus("Batch Search Completed: " + JSON.stringify(stats), stats);
        } catch (err) {
            this.editor.setStatus("Batch Search Failed: " + err.message, err);
        }
    }

    batchRunCommand(e, commandCallbackString=null, searchCallbackString=null, promptUser=false) {
        const storage = new AudioSourceStorage();

        if(promptUser || !searchCallbackString)
            searchCallbackString = prompt("Run custom search:", searchCallbackString ||
                `/** Example Search **/ i.command === "C3"   &&   i.instrument === 0`);
        if(!searchCallbackString)
            throw new Error("Batch command canceled: Invalid search");
        storage.addBatchRecentSearches(searchCallbackString);


        if(promptUser || !commandCallbackString)
            commandCallbackString = prompt(`Run custom command:`, commandCallbackString ||
                `/** Example Command **/ i.command='C4';`);
        if(!commandCallbackString)
            throw new Error("Batch command canceled: Invalid command");
        storage.addBatchRecentCommands(commandCallbackString);

        const instructionList = [];
        const tracker = this.editor.trackerElm;
        const groupName = tracker.groupName, g=groupName;
        try {
            const stats = {count:0, modified:0};
            const iterator = this.editor.song.getIterator(groupName);
            let instruction;
            const window=null, document=null;
            while(instruction = iterator.nextConditionalInstruction((instruction) => {
                const i=instruction;
                return eval(searchCallbackString);
            })) {
                const instructionString = JSON.stringify(instruction.data);
                const i=instruction;
                eval(commandCallbackString);
                if(instructionString !== JSON.stringify(instruction.data))
                    stats.modified++;

                stats.count++;
                tracker.selectIndex(e, iterator.groupIndex);
            }
            this.editor.setStatus("Batch Command Completed: " + JSON.stringify(stats), stats);
            return instructionList;
        } catch (err) {
            this.editor.setStatus("Batch Command Failed: " + err.message, err);
            return [];
        }
    }
}



























