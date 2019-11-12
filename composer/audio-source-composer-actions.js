{
    class AudioSourceComposerActions extends AudioSourceComposerRenderer {

        getDefaultInstrumentURL() {
            const Util = new AudioSourceUtilities;
            return Util.getScriptDirectory('instrument/audio-source-synthesizer.js');
        }


        /** Song Commands **/

        setInstrumentName(e, instrumentID, newInstrumentName) {
            this.song.setInstrumentName(instrumentID, newInstrumentName);
            this.setStatus(`Instrument name updated: ${newInstrumentName}`);
        }

        setSongName(e, newSongName) {
            this.song.setName(newSongName);
            this.setStatus(`Song name updated: ${newSongName}`);
        }

        setSongVersion(e, newSongVersion) {
            this.song.setVersion(newSongVersion);
            this.setStatus(`Song version updated: ${newSongVersion}`);
        }

        setStartingBPM(e, newSongBPM) {
            this.song.setStartingBPM(newSongBPM);
            this.setStatus(`Song beats per minute updated: ${newSongBPM}`);
        }

        setSongVolume(e, newSongVolume) {
            this.song.setVolume(newSongVolume);
            this.fieldSongVolume.value = newSongVolume;
            this.setStatus(`Volume modified: ${newSongVolume}`);
        }

        async loadNewSongData() {
            const storage = new AudioSourceStorage();
            const defaultInstrumentURL = this.getDefaultInstrumentURL() + '';
            let songData = storage.generateDefaultSong(defaultInstrumentURL);
            await this.song.loadSongData(songData);
            this.render();
            this.setStatus("Loaded new song", songData);
        }


        async loadRecentSongData() {
            const storage = new AudioSourceStorage();
            let songRecentUUIDs = await storage.getRecentSongList();
            if (songRecentUUIDs[0] && songRecentUUIDs[0].uuid) {
                this.setStatus("Loading recent song: " + songRecentUUIDs[0].uuid);
                await this.loadSongFromMemory(songRecentUUIDs[0].uuid);
                return true;
            }
            return false;
        }

        async saveSongToMemory() {
            const song = this.song;
            const songData = song.data;
            const songHistory = song.history;
            const storage = new AudioSourceStorage();
            this.setStatus("Saving song to memory...");
            await storage.saveSongToMemory(songData, songHistory);
            this.setStatus("Saved song to memory: " + songData.uuid);
        }

        saveSongToFile() {
            const songData = this.song.data;
            // const songHistory = this.song.history;
            const storage = new AudioSourceStorage();
            this.setStatus("Saving song to file");
            storage.saveSongToFile(songData);
        }


        async loadSongFromMemory(songUUID) {
            const song = this.song;
            const storage = new AudioSourceStorage();
            const songData = await storage.loadSongFromMemory(songUUID);
            if (songData.instruments.length === 0)
                console.warn("Song contains no instruments");
            const songHistory = await storage.loadSongHistoryFromMemory(songUUID);
            await song.loadSongData(songData);
            await song.loadSongHistory(songHistory);
            this.render(true);
            this.setStatus("Song loaded from memory: " + songUUID, songData);
//         console.info(songData);
        }

        async loadSongFromFileInput(e, fileInput = null) {
            fileInput = fileInput || this.fieldSongFileLoad.inputElm;
            if (!fileInput || !fileInput.files || fileInput.files.length === 0)
                throw new Error("Invalid file input");
            if (fileInput.files.length > 1)
                throw new Error("Invalid file input: only one file allowed");
            const file = fileInput.files[0];
            const ext = file.name.split('.').pop().toLowerCase();
            switch (ext) {
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
            const Util = new AudioSourceUtilities();
            const songData = await Util.loadJSONFile(file);
            if (songData.instruments.length === 0)
                console.warn("Song contains no instruments");
            await this.song.loadSongData(songData);
            this.render(true);
            this.setStatus("Song loaded from file: ", songData);
        }

        async loadSongFromMIDIFile(file, defaultInstrumentURL = null) {
            defaultInstrumentURL = defaultInstrumentURL || this.getDefaultInstrumentURL();
            const midiSupport = new MIDISupport();
            const songData = await midiSupport.loadSongFromMidiFile(file, defaultInstrumentURL);
            await this.song.loadSongData(songData);
            this.render(true);
            this.setStatus("Song loaded from midi: ", songData);
        }

        async loadSongFromSrc(src) {
            const Util = new AudioSourceUtilities();
            const songData = await Util.loadJSONFromURL(src);
            if (songData.instruments.length === 0)
                console.warn("Song contains no instruments");
            await this.song.loadSongData(songData);
            this.setStatus("Song loaded from src: " + src);
            console.info(this.song.data);
            this.render(true);
        }

        /** Song Playback **/


        async songPlay() {
            await this.song.play();
        }

        async songPause() {
            this.song.stopPlayback();
        }

        async songStop() {
            this.song.stopPlayback();
            this.song.setPlaybackPositionInTicks(0);
        }

        setSongPosition(e, playbackPosition = null) {
            const song = this.song;
            if (playbackPosition === null) {
                const values = new AudioSourceValues();
                playbackPosition = values.parsePlaybackPosition(this.fieldSongPosition.value);
            }
            song.setPlaybackPosition(playbackPosition);

        }

        /** Tracker Commands **/

        insertInstructionCommand(e, newCommand = null, promptUser = false, instrumentID = null) {
            //: TODO: check for recursive group
            const tracker = this.trackerElm;
            const song = this.song;
            // let selectedIndicies = this.getSelectedIndicies();

            // if(selectedIndicies.length === 0)
            //     throw new Error("No selection");
            if (newCommand === null)
                newCommand = tracker.fieldInstructionCommand.value || null;
            if (promptUser)
                newCommand = prompt("Set custom command:", newCommand || '');
            if (!newCommand)
                throw new Error("Invalid Instruction command");

            let newInstruction = tracker.getInstructionFormValues(newCommand);
            if (instrumentID !== null)
                newInstruction.instrument = instrumentID;

            const songPosition = song.getSongPositionInTicks();
            console.log(songPosition);
            let insertIndex = song.insertInstructionAtPosition(tracker.groupName, songPosition, newInstruction);
            tracker.renderRows();
            this.selectIndicies(insertIndex);
            tracker.playSelectedInstructions();
        }

        setInstructionCommand(e, newCommand = null, promptUser = false, instrumentID = null) {
            //: TODO: check for recursive group
            const tracker = this.trackerElm;
            const renderer = this.song;
            let selectedIndicies = this.getSelectedIndicies();

            if (selectedIndicies.length === 0)
                throw new Error("No selection");
            if (newCommand === null)
                newCommand = tracker.fieldInstructionCommand.value || null;
            if (promptUser)
                newCommand = prompt("Set custom command:", newCommand || '');
            if (!newCommand)
                throw new Error("Invalid Instruction command");

            for (let i = 0; i < selectedIndicies.length; i++) {
                renderer.replaceInstructionCommand(tracker.groupName, selectedIndicies[i], newCommand);
                if (instrumentID !== null)
                    renderer.replaceInstructionInstrument(tracker.groupName, selectedIndicies[i], instrumentID);
                tracker.findInstructionElement(selectedIndicies[i]).render();
            }
            tracker.playSelectedInstructions();
        }

        // TODO: assuming the use of tracker.groupName?
        setInstructionInstrument(e, instrumentID = null) {
            const tracker = this.trackerElm;
            const renderer = this.song;
            let selectedIndicies = this.getSelectedIndicies();

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

        setInstructionDuration(e, duration = null, promptUser = false) {
            const tracker = this.trackerElm;
            const renderer = this.song;
            let selectedIndicies = this.getSelectedIndicies();

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

        setInstructionVelocity(e, velocity = null, promptUser = false) {
            const tracker = this.trackerElm;
            const renderer = this.song;
            let selectedIndicies = this.getSelectedIndicies();

            if (velocity === null)
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
            const tracker = this.trackerElm;
            const renderer = this.song;
            let selectedIndicies = this.getSelectedIndicies();

            for (let i = 0; i < selectedIndicies.length; i++)
                renderer.deleteInstructionAtIndex(tracker.groupName, selectedIndicies[i]);
            tracker.renderRows();

        }

        /** Groups **/

        songGroupAddNew(e) {
            const tracker = this.trackerElm;
            const song = this.song;

            let newGroupName = song.generateInstructionGroupName();
            newGroupName = prompt("Create new instruction group?", newGroupName);
            if (newGroupName) {
                song.addInstructionGroup(newGroupName, []);
                this.render();
            } else {
                this.setStatus("<span class='error'>Create instruction group canceled</span>");
            }
        }

        songGroupRename(e, groupName, newGroupName = null) {
            const song = this.song;

            newGroupName = prompt(`Rename instruction group (${groupName})?`, groupName);
            if (newGroupName !== groupName) {
                song.renameInstructionGroup(groupName, newGroupName);
                this.render();
            } else {
                this.setStatus("<span class='error'>Rename instruction group canceled</span>");
            }
        }

        songGroupRemove(e, groupName) {
            const song = this.song;

            const result = confirm(`Remove instruction group (${groupName})?`);
            if (result) {
                song.removeInstructionGroup(groupName);
                this.render();
            } else {
                this.setStatus("<span class='error'>Remove instruction group canceled</span>");
            }

        }

        /** Instruments **/


        songAddInstrument(e, instrumentURL, instrumentConfig = {}) {
            if (!instrumentURL)
                return this.handleError(`Empty URL`);
            instrumentConfig.url = instrumentURL;
            instrumentConfig.libraryURL = this.defaultLibraryURL;
            // instrumentConfig.name = instrumentConfig.name || instrumentURL.split('/').pop();

//         e.target.form.elements['instrumentURL'].value = '';
            if (confirm(`Add Instrument to Song?\nURL: ${instrumentURL}`)) {
                const instrumentID = this.song.addInstrument(instrumentConfig);
                this.setStatus("New instrument Added to song: " + instrumentURL);
                this.trackerElm.fieldInstructionInstrument.value = instrumentID;

            } else {
                this.handleError(`New instrument canceled: ${instrumentURL}`);
            }
        }

        async songReplaceInstrument(e, instrumentID, instrumentURL, instrumentConfig = {}) {
            if (!Number.isInteger(instrumentID))
                return this.handleError(`Invalid Instrument ID: Not an integer`);
            if (!instrumentURL)
                return this.handleError(`Empty URL`);
            instrumentConfig.url = instrumentURL;
            instrumentConfig.libraryURL = this.libraryURL;
            // instrumentConfig.name = instrumentConfig.name || instrumentURL.split('/').pop();
            if (confirm(`Change Instrument (${instrumentID}) to ${instrumentURL}`)) {
                await this.song.replaceInstrument(instrumentID, instrumentConfig);
                await this.song.loadInstrument(instrumentID, true);
                this.setStatus(`Instrument (${instrumentID}) changed to: ${instrumentURL}`);
                this.trackerElm.fieldInstructionInstrument.value = instrumentID;

            } else {
                this.handleError(`Change instrument canceled: ${instrumentURL}`);
            }
        }

        songRemoveInstrument(e, removeInstrumentID = null) {
            if (removeInstrumentID === null)
                removeInstrumentID = parseInt(e.target.form.elements['instrumentID'].value);
            if (confirm(`Remove Instrument ID: ${removeInstrumentID}`)) {
                this.song.removeInstrument(removeInstrumentID);
                this.setStatus(`Instrument (${removeInstrumentID}) removed`);

            } else {
                this.handleError(`Remove instrument canceled`);
            }
        }

        /** Tracker **/

        setTrackerChangeGroup(e, groupName = null) {
            const tracker = this.trackerElm;

            groupName = groupName || e.target.form.getAttribute('data-group');
            tracker.groupName = groupName;
            //TODO: validate
            // this.selectGroup(selectedGroupName);
        }

        setTrackerOctave(e, newOctave = null) {
            if (newOctave !== null)
                this.trackerElm.fieldTrackerOctave.value = newOctave;
        }

        setTrackerRowLength(e, rowLengthInTicks = null) {
            const tracker = this.trackerElm;
            // let selectedIndicies = this.getSelectedIndicies();
            if (rowLengthInTicks !== null)
                tracker.fieldTrackerRowLength.value;
            tracker.renderRows();
            // this.selectIndicies(e, selectedIndicies);

        }

        setTrackerSegmentLength(e, segmentLength = null) {
            const tracker = this.trackerElm;
            // let selectedIndicies = this.getSelectedIndicies();
            if (segmentLength !== null)
                tracker.fieldTrackerSegmentLength.value = segmentLength;
            tracker.renderRows();
            // this.selectIndicies(e, selectedIndicies);
        }

        // setTrackerRowSegment(e) {
        //     const tracker = this.trackerElm;
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
            const tracker = this.trackerElm;
            // let selectedIndicies = this.getSelectedIndicies();

            tracker.renderRows();
            // this.selectIndicies(e, selectedIndicies);
        }

        setTrackerSelection(e, selectedIndicies = null) {
            const tracker = this.trackerElm;

            if (!selectedIndicies)
                selectedIndicies = tracker.fieldTrackerSelection.value
                    .split(/\D+/)
                    .map(index => parseInt(index));
            this.selectIndicies(selectedIndicies);
            tracker.fieldTrackerSelection.focus();
        }

        /** Toggle Panels **/

        togglePanelInstruments(e) {
            this.containerElm.classList.toggle('hide-panel-instruments');
        }

        togglePanelTracker(e) {
            this.containerElm.classList.toggle('hide-panel-tracker');
        }

        togglePanelSong(e) {
            this.containerElm.classList.toggle('hide-panel-song');
        }

        toggleFullscreen(e) {
            const setFullScreen = !this.classList.contains('fullscreen');
            this.containerElm.classList.toggle('fullscreen', setFullScreen);
            this.classList.toggle('fullscreen', setFullScreen);

            if (setFullScreen) {

            }
        }

        /** Tools **/



        batchSelect(e, searchCallbackString = null, promptUser = false) {
            if (promptUser || !searchCallbackString)
                searchCallbackString = prompt("Run custom search:", searchCallbackString ||
                    `/** Example Search **/ i.command === "C3"   &&   i.instrument === 0`);
            if (!searchCallbackString)
                throw new Error("Batch command canceled: Invalid search");

            const storage = new AudioSourceStorage();
            storage.addBatchRecentSearches(searchCallbackString);


            const tracker = this.trackerElm;
            tracker.clearSelection();
            const groupName = tracker.groupName, g = groupName;
            try {
                const stats = {count: 0};
                const iterator = this.song.getIterator(groupName);
                let instruction;
                const window = null, document = null;
                while (instruction = iterator.nextConditionalInstruction((instruction) => {
                    const i = instruction;
                    return eval(searchCallbackString);
                })) {
                    stats.count++;
                    tracker.selectIndex(e, iterator.groupIndex);
                }
                this.setStatus("Batch Search Completed: " + JSON.stringify(stats), stats);
            } catch (err) {
                this.setStatus("Batch Search Failed: " + err.message, err);
            }
        }

        batchRunCommand(e, commandCallbackString = null, searchCallbackString = null, promptUser = false) {
            const storage = new AudioSourceStorage();

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

            const instructionList = [];
            const tracker = this.trackerElm;
            const groupName = tracker.groupName, g = groupName;
            try {
                const stats = {count: 0, modified: 0};
                const iterator = this.song.getIterator(groupName);
                let instruction;
                const window = null, document = null;
                while (instruction = iterator.nextConditionalInstruction((instruction) => {
                    const i = instruction;
                    return eval(searchCallbackString);
                })) {
                    const instructionString = JSON.stringify(instruction.data);
                    const i = instruction;
                    eval(commandCallbackString);
                    if (instructionString !== JSON.stringify(instruction.data))
                        stats.modified++;

                    stats.count++;
                    tracker.selectIndex(e, iterator.groupIndex);
                }
                this.setStatus("Batch Command Completed: " + JSON.stringify(stats), stats);
                return instructionList;
            } catch (err) {
                this.setStatus("Batch Command Failed: " + err.message, err);
                return [];
            }
        }
    }

    // Register module
    let exports = typeof module !== "undefined" ? module.exports :
        document.head.querySelector('script[src$="composer/audio-source-composer-actions.js"]');
    exports.AudioSourceComposerActions = AudioSourceComposerActions;

}