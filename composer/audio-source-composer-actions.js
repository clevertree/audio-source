(async function() {

    /** Register Script Exports **/
    function getThisScriptPath() { return 'composer/audio-source-composer-actions.js'; }
    const exportThisScript = function(module) {
        module.exports = {AudioSourceComposerActions};
    }

    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();


    /** Required Modules **/
    const {AudioSourceSong}             = await requireAsync('common/audio-source-song.js');
    const {AudioSourceComposerRenderer} = await requireAsync('composer/audio-source-composer-renderer.js');
    const {AudioSourceStorage}          = await requireAsync('common/audio-source-storage.js');
    const {AudioSourceUtilities}        = await requireAsync('common/audio-source-utilities.js');
    const {ASUIComponent}               = await requireAsync('common/audio-source-ui.js');

    class AudioSourceComposerActions extends AudioSourceComposerRenderer {
        constructor(state={}, props={}) {
            super(state, props);
            this.song = new AudioSourceSong({}, this);

        }

        getDefaultInstrumentURL() {
            return findThisScript()[0].basePath + 'instrument/audio-source-synthesizer.js';
        }


        /** Song Commands **/


        setSongName(e, newSongName) {
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

        setSongVolume(e, newSongVolume) {
            this.song.setVolume(newSongVolume);
            this.refs.fieldSongVolume.value = newSongVolume;
            // this.setStatus(`Volume modified: ${newSongVolume}`);
        }

        async loadNewSongData() {
            const storage = new AudioSourceStorage();
            const defaultInstrumentURL = this.getDefaultInstrumentURL() + '';
            let songData = storage.generateDefaultSong(defaultInstrumentURL);
            await this.song.loadSongData(songData);
            await this.renderOS();
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
            await this.song.loadSongFromMemory(songUUID);
            await this.renderOS();
            this.setStatus("Song loaded from memory: " + songUUID);
//         console.info(songData);
        }

        async loadSongFromFileInput(fileInput = null) {
            fileInput = fileInput || this.refs.fieldSongFileLoad.inputElm;
            if (!fileInput || !fileInput.files || fileInput.files.length === 0)
                throw new Error("Invalid file input");
            if (fileInput.files.length > 1)
                throw new Error("Invalid file input: only one file allowed");
            const file = fileInput.files[0];
            await this.song.loadSongFromFileInput(file);
            await this.renderOS();
            this.setStatus("Song loaded from file: ", file);
        }



        async loadSongFromURL(url) {
            await this.song.loadSongFromURL(url);
            this.setStatus("Song loaded from url: " + url);
            // console.info(this.song.data);
            await this.renderOS();
        }

        async loadSongFromData(songData) {
            await this.song.loadSongData(songData);
            // this.render(true);
            this.setStatus("Song loaded from data", songData);
            await this.renderOS();
        }

        /** Song Playback **/


        async songPlay() {
            await this.song.play();
        }

        async songPause() {
            this.song.stopPlayback();
        }

        async songStop() {
            if (this.song.playback)
                this.song.stopPlayback();
            this.song.setPlaybackPositionInTicks(0);
        }

        setSongPosition(e, playbackPosition = null) {
            const wasPlaying = !!this.song.playback;
            if (wasPlaying)
                this.song.stopPlayback();
            const song = this.song;
            if (playbackPosition === null) {
                const values = new AudioSourceValues();
                playbackPosition = values.parsePlaybackPosition(this.refs.fieldSongPosition.value);
            }
            song.setPlaybackPosition(playbackPosition);
            if (wasPlaying)
                this.song.play();
        }

        // setSongPositionAsPercent(e, playbackPositionPercent) {
        //     const song = this.song;
        //     const length = song.getSongLengthInSeconds();
        //     song.setPlaybackPosition(length * (playbackPositionPercent));
        // }

        /** Tracker Commands **/

        instructionInsert(newCommand = null, promptUser = false, instrumentID = null) {
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

            let newInstruction = tracker.instructionFindFormValues(newCommand);
            if (instrumentID !== null)
                newInstruction.instrument = instrumentID;

            const songPosition = song.getSongPositionInTicks();
            console.log(songPosition);
            let insertIndex = song.instructionInsertAtPosition(tracker.groupName, songPosition, newInstruction);
            tracker.renderRows();
            this.selectIndicies(insertIndex);
            tracker.playSelectedInstructions();
        }

        instructionChangeCommand(newCommand = null, promptUser = false, instrumentID = null) {
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
                renderer.instructionReplaceCommand(tracker.groupName, selectedIndicies[i], newCommand);
                if (instrumentID !== null)
                    renderer.instructionReplaceInstrument(tracker.groupName, selectedIndicies[i], instrumentID);
                tracker.findInstructionElement(selectedIndicies[i]).render();
            }
            tracker.playSelectedInstructions();
        }

        // TODO: assuming the use of tracker.groupName?
        instructionChangeInstrument(instrumentID = null) {
            const tracker = this.trackerElm;
            const renderer = this.song;
            let selectedIndicies = this.getSelectedIndicies();

            instrumentID = instrumentID !== null ? instrumentID : parseInt(tracker.fieldInstructionInstrument.value);
            if (!Number.isInteger(instrumentID))
                throw new Error("Invalid Instruction ID");
            for (let i = 0; i < selectedIndicies.length; i++) {
                renderer.instructionReplaceInstrument(tracker.groupName, selectedIndicies[i], instrumentID);
                tracker.findInstructionElement(selectedIndicies[i]).render();
            }
            tracker.fieldInstructionInstrument.value = instrumentID;
            tracker.playSelectedInstructions();
        }

        instructionChangeDuration(duration = null, promptUser = false) {
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
                renderer.instructionReplaceDuration(tracker.groupName, selectedIndicies[i], duration);
                tracker.findInstructionElement(selectedIndicies[i]).render();
            }
            tracker.playSelectedInstructions();

        }

        instructionChangeVelocity(velocity = null, promptUser = false) {
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
                renderer.instructionReplaceVelocity(tracker.groupName, selectedIndicies[i], velocity);
                tracker.findInstructionElement(selectedIndicies[i]).render();
            }
            tracker.playSelectedInstructions();
        }

        instructionDelete() {
            const tracker = this.trackerElm;
            const renderer = this.song;
            let selectedIndicies = this.getSelectedIndicies();

            for (let i = 0; i < selectedIndicies.length; i++)
                renderer.instructionDeleteAtIndex(tracker.groupName, selectedIndicies[i]);
            tracker.renderRows();

        }

        /** Groups **/

        groupAdd() {
            const tracker = this.trackerElm;
            const song = this.song;

            let newGroupName = song.generateInstructionGroupName();
            newGroupName = prompt("Create new instruction group?", newGroupName);
            if (newGroupName) {
                song.groupAdd(newGroupName, []);
                this.render();
            } else {
                this.setStatus("<span class='error'>Create instruction group canceled</span>");
            }
        }

        groupRename(groupName, newGroupName = null) {
            const song = this.song;

            newGroupName = prompt(`Rename instruction group (${groupName})?`, groupName);
            if (newGroupName !== groupName) {
                song.groupRename(groupName, newGroupName);
                this.render();
            } else {
                this.setStatus("<span class='error'>Rename instruction group canceled</span>");
            }
        }

        groupRemove(groupName) {
            const song = this.song;

            const result = confirm(`Remove instruction group (${groupName})?`);
            if (result) {
                song.groupRemove(groupName);
                this.render();
            } else {
                this.setStatus("<span class='error'>Remove instruction group canceled</span>");
            }

        }

        /** Instruments **/


        instrumentAdd(instrumentURL, instrumentConfig = {}) {
            if (!instrumentURL)
                throw new Error(`Empty URL`);
            instrumentConfig.url = instrumentURL;
            instrumentConfig.libraryURL = this.defaultLibraryURL;
            // instrumentConfig.name = instrumentConfig.name || instrumentURL.split('/').pop();

//         e.target.form.elements['instrumentURL'].value = '';
            if (confirm(`Add Instrument to Song?\nURL: ${instrumentURL}`)) {
                const instrumentID = this.song.instrumentAdd(instrumentConfig);
                this.setStatus("New instrument Added to song: " + instrumentURL);
                this.refs.fieldInstructionInstrument.value = instrumentID;

            } else {
                throw new Error(`New instrument canceled: ${instrumentURL}`);
            }
        }

        async instrumentReplace(instrumentID, instrumentURL, instrumentConfig = {}) {
            if (!Number.isInteger(instrumentID))
                throw new Error(`Invalid Instrument ID: Not an integer`);
            if (!instrumentURL)
                throw new Error(`Empty URL`);
            instrumentConfig.url = instrumentURL;
            instrumentConfig.libraryURL = this.libraryURL;
            // instrumentConfig.name = instrumentConfig.name || instrumentURL.split('/').pop();
            if (confirm(`Change Instrument (${instrumentID}) to ${instrumentURL}`)) {
                await this.song.instrumentReplace(instrumentID, instrumentConfig);
                await this.song.loadInstrument(instrumentID, true);
                this.setStatus(`Instrument (${instrumentID}) changed to: ${instrumentURL}`);
                this.refs.fieldInstructionInstrument.value = instrumentID;

            } else {
                throw new Error(`Change instrument canceled: ${instrumentURL}`);
            }
        }

        instrumentRename(instrumentID, newInstrumentName=null) {
            const config = this.song.getInstrumentConfig(instrumentID);
            let oldInstrumentName = config.name;
            if(!newInstrumentName)
                newInstrumentName = prompt(`Change name for instrument ${instrumentID}: `, oldInstrumentName);
            if(!newInstrumentName)
                throw new Error("Instrument name change canceled");
            this.song.instrumentRename(instrumentID, newInstrumentName);
            this.setStatus(`Instrument name updated: ${newInstrumentName}`);
        }

        instrumentRemove(instrumentRemoveID = null) {
            if (instrumentRemoveID === null)
                instrumentRemoveID = parseInt(e.target.form.elements['instrumentID'].value);
            if (confirm(`Remove Instrument ID: ${instrumentRemoveID}`)) {
                this.song.instrumentRemove(instrumentRemoveID);
                this.setStatus(`Instrument (${instrumentRemoveID}) removed`);

            } else {
                throw new Error(`Remove instrument canceled`);
            }
        }

        /** Tracker Segments **/


        async trackerChangeSegment(newRowSegmentID) {
            if (!Number.isInteger(newRowSegmentID))
                throw new Error("Invalid segment ID");
            const oldSegmentID = this.trackerElm.state.currentRowSegmentID;
            await this.trackerElm.setState({currentRowSegmentID: newRowSegmentID});
            this.refs.panelTrackerRowSegmentButtons[oldSegmentID].setProps({selected: false});
            this.refs.panelTrackerRowSegmentButtons[newRowSegmentID].setProps({selected: true});
            // this.currentRowSegmentID = newRowSegmentID;
            // this.renderRows();
        }

        /** Tracker **/

        trackerChangeGroup(groupName = null) {
            const tracker = this.trackerElm;

            groupName = groupName || e.target.form.getAttribute('data-group');
            tracker.groupName = groupName;
            //TODO: validate
            // this.selectGroup(selectedGroupName);
        }

        trackerChangeOctave(newOctave = null) {
            if (newOctave !== null)
                this.refs.fieldTrackerOctave.value = newOctave;
        }

        trackerChangeRowLength(rowLengthInTicks = null) {
            const tracker = this.trackerElm;
            // let selectedIndicies = this.getSelectedIndicies();
            if (rowLengthInTicks !== null)
                tracker.fieldTrackerRowLength.value;
            tracker.renderRows();
            // this.selectIndicies(e, selectedIndicies);

        }

        trackerChangeSegmentLength(segmentLength = null) {
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

        trackerChangeInstrumentFilter() {
            const tracker = this.trackerElm;
            // let selectedIndicies = this.getSelectedIndicies();

            tracker.renderRows();
            // this.selectIndicies(e, selectedIndicies);
        }

        trackerChangeSelection(selectedIndicies = null) {
            const tracker = this.trackerElm;

            if (!selectedIndicies)
                selectedIndicies = tracker.fieldTrackerSelection.value
                    .split(/\D+/)
                    .map(index => parseInt(index));
            this.selectIndicies(selectedIndicies);
            tracker.fieldTrackerSelection.focus();
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

            const storage = new AudioSourceStorage();
            storage.addBatchRecentSearches(searchCallbackString);


            const tracker = this.trackerElm;
            tracker.clearSelection();
            const groupName = tracker.groupName, g = groupName;
            try {
                const stats = {count: 0};
                const iterator = this.song.instructionGetIterator(groupName);
                let instruction;
                while (instruction = iterator.nextConditionalInstruction((instruction) => {
                    const i = instruction;
                    const window = null, document = null;
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
                const iterator = this.song.instructionGetIterator(groupName);
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



    /** Export this script **/
    registerModule(exportThisScript);

    /** Finish Registering Async Module **/
    resolveExports();



    /** Module Loader Methods **/
    function registerAsyncModule() {
        let resolve;
        const promise = new Promise((r) => resolve = r);
        registerModule(module => {
            module.promises = (module.promises || []).concat(promise);
        });
        return resolve;
    }
    function registerModule(callback) {
        if(typeof window === 'undefined')
            callback(module);
        else findThisScript()
            .forEach(scriptElm => callback(scriptElm))
    }

    function findThisScript() {
        return findScript(getThisScriptPath());
    }

    function findScript(scriptURL) {
        let scriptElms = document.head.querySelectorAll(`script[src$="${scriptURL}"]`);
        scriptElms.forEach(scriptElm => {
            scriptElm.relativePath = scriptURL;
            scriptElm.basePath = scriptElm.src.replace(document.location.origin, '').replace(scriptURL, '');
        });
        return scriptElms;
    }

    async function requireAsync(relativeScriptPath) {
        if(typeof require !== "undefined")
            return require('../' + relativeScriptPath);

        let scriptElm = findScript(relativeScriptPath)[0];
        if(!scriptElm) {
            const scriptURL = findThisScript()[0].basePath + relativeScriptPath;
            scriptElm = document.createElement('script');
            scriptElm.src = scriptURL;
            scriptElm.promises = (scriptElm.promises || []).concat(new Promise(async (resolve, reject) => {
                scriptElm.onload = resolve;
                document.head.appendChild(scriptElm);
            }));
        }
        for (let i=0; i<scriptElm.promises.length; i++)
            await scriptElm.promises[i];
        return scriptElm.exports
            || (() => { throw new Error("Script module has no exports: " + relativeScriptPath); })()
    }


})();