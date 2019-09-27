class AudioSourceComposerActions {

    constructor(editor) {
        this.editor = editor;
    }

    async onAction(e, actionString, actionParam = null) {
        switch (actionString) {

            /** Song Commands **/

            case 'song:new':
                this.loadNewSongData();
                // document.location = 'song/new';
                break;

            // case 'song:load-server-uuid':
            //     // let uuid = menuTarget.getAttribute('data-uuid') || null;
            //     if(!uuid) uuid = prompt("Enter UUID: ");
            //     this.loadSongFromServer(uuid);
            //     this.render();
            //     break;

            case 'song:load-memory-uuid':
                let uuid = e.target.getAttribute('data-uuid') || null;
                this.loadSongFromMemory(uuid);
                // this.render();
                break;

            case 'song:save-to-memory':
                this.saveSongToMemory();
                break;

            case 'song:save-to-file':
                this.saveSongToFile();
                break;

            case 'song:load-from-file':
            case 'song:load-from-midi-file':
                this.closeAllMenus();
                const fileInput = (e.target.form ? e.target.form.querySelector('input[type=file]') : null) || e.target;
                const file = fileInput.files[0];
                if(!file)
                    throw new Error("No file selected");
                await this.loadSongFromFileInput(file);
                break;



            case 'song:edit':
                this.renderer.replaceDataPath('beatsPerMinute', form['beats-per-minute'].value);
                this.renderer.replaceDataPath('beatsPerMeasure', form['beats-per-measure'].value);
                break;

            case 'song:play':
            case 'song:resume':
                this.play();
                break;

            case 'song:pause':
                this.renderer.stopPlayback();
                break;

            case 'song:stop':
            case 'song:reset':
                this.renderer.stopPlayback();
                this.renderer.setPlaybackPositionInTicks(0);
                break;

            // case 'song:resume':
            //     this.renderer.play(this.renderer.seekPosition);
            //     break;

            case 'song:playback':
                console.log(e.target);
                break;

            case 'song:volume':
                this.renderer.setVolume(this.fieldSongVolume.value);
                break;

            case 'song:add-instrument':
                const addInstrumentURL = actionOptions || e.target.form.elements['instrumentURL'].value;
                if(!addInstrumentURL) {
                    console.error("Empty URL");
                    break;
                }
                e.target.form.elements['instrumentURL'].value = '';
                if(confirm(`Add Instrument to Song?\nURL: ${addInstrumentURL}`)) {
                    this.renderer.addInstrument(addInstrumentURL);
                    this.setStatus("New instrument Added to song: " + addInstrumentURL);

                } else {
                    this.setStatus(`<span style='color: red'>New instrument canceled: ${addInstrumentURL}</span>`);
                }
                break;

            case 'song:replace-instrument':
                const changeInstrumentURL = actionOptions || e.target.form.elements['instrumentURL'].value;
                if(!changeInstrumentURL) {
                    this.setStatus(`<span style='color: red'>Empty URL</span>`);
                    break;
                }
                const changeInstrument = actionOptions || {
                    url: changeInstrumentURL,
                    id: parseInt(e.target.form.elements['instrumentID'].value)
                };
                changeInstrument.title = changeInstrument.url.split('/').pop();
                // if(confirm(`Set Instrument (${changeInstrument.id}) to ${changeInstrument.title}`)) {
                this.status.currentInstrumentID = this.renderer.replaceInstrument(changeInstrument.id, changeInstrument.url);
                this.setStatus(`Instrument (${changeInstrument.id}) changed to: ${changeInstrumentURL}`);
                if(this.tracker)
                    this.tracker.fieldInstructionInstrument.value = changeInstrument.id;
                // } else {
                //     this.setStatus(`<span style='color: red'>Change instrument canceled: ${changeInstrumentURL}</span>`);
                // }

                break;

            case 'song:remove-instrument':
                const removeInstrumentID = actionOptions || parseInt(e.target.form.elements['instrumentID'].value);
                if(confirm(`Remove Instrument ID: ${removeInstrumentID}`)) {
                    this.renderer.removeInstrument(removeInstrumentID);
                    this.setStatus(`Instrument (${changeInstrument.id}) removed`);

                } else {
                    this.setStatus(`<span style='color: red'>Remove instrument canceled</span>`);
                }
                break;

            case 'song:set-title':
                const newSongTitle = e.target.form.elements['title'].value;
                this.renderer.setSongTitle(newSongTitle);
                this.setStatus(`Song title updated: ${newSongTitle}`);
                break;

            case 'song:set-version':
                const newSongVersion = e.target.form.elements['title'].value;
                this.renderer.setSongVersion(newSongVersion);
                this.setStatus(`Song version updated: ${newSongVersion}`);
                break;




            case 'toggle:control-song':
                this.classList.toggle('hide-control-song');
                break;

            case 'toggle:control-tracker':
                this.classList.toggle('hide-control-tracker');
                break;


            case 'view:fullscreen':
                const isFullScreen = this.classList.contains('fullscreen');
                this.classList.toggle('fullscreen', !isFullScreen);
                this.containerElm.classList.toggle('fullscreen', !isFullScreen);
                if(this.tracker)
                    this.tracker.render();
                break;

            case 'view:forms-song':
                this.containerElm.classList.toggle('hide-forms-song');
                break;

            case 'view:forms-tracker':
                this.containerElm.classList.toggle('hide-forms-tracker');
                break;

            case 'view:forms-instruments':
                this.containerElm.classList.toggle('hide-forms-instruments');
                break;











            /** Tracker **/

            case 'instruction:custom-command':
            case 'instruction:insert':
            case 'instruction:command':
                this.setInstructionCommand(e, null, actionString === 'instruction:custom-command');
                break;

            case 'instruction:instrument':
                this.setInstructionInstrument(e);
                break;

            case 'instruction:duration':
            case 'instruction:custom-duration':
                this.setInstructionDuration(e, null, actionString === 'instruction:custom-duration');
                break;

            case 'instruction:velocity':
            case 'instruction:custom-velocity':
                this.setInstructionVelocity(e, null, actionString === 'instruction:custom-velocity');
                break;

            case 'instruction:delete':
                this.deleteInstructionCommand(e);
                break;

            case 'group:change':
                this.setTrackerChangeGroup(e);
                break;


            case 'song:new-group':
                this.addNewSongGroup(e);
                break;

            case 'tracker:row-segment':
                this.setTrackerRowSegment(e);
                break;

            case 'tracker:octave':
                this.setTrackerOctave(e);
                break;

            case 'tracker:quantization':
                this.setTrackerRowLength(e);
                break;

            case 'tracker:filter-instrument':
                this.setTrackerFilterInstrument(e);
                break;

            case 'tracker:select':
                this.setTrackerSelection(e);
                break;

            default:
                throw new Error("Unhandled action: " + actionString);
        }
        return true;
        // } catch (e) {
        //     this.onError(e);
        // }
    }

    /** Song Commands **/


    loadNewSongData() {
        const storage = new AudioSourceStorage();
        const defaultInstrumentURL = this.getDefaultInstrumentURL() + '';
        let songData = storage.generateDefaultSong(defaultInstrumentURL);
        this.renderer.loadSongData(songData);
        this.render();
        this.setStatus("Loaded new song", songData);

    }


    async loadRecentSongData() {
        const storage = new AudioSourceStorage();
        let songRecentGUIDs = await storage.getRecentSongList();
        if(songRecentGUIDs[0] && songRecentGUIDs[0].guid) {
            this.setStatus("Loading recent song: " + songRecentGUIDs[0].guid);
            await this.loadSongFromMemory(songRecentGUIDs[0].guid);
            return true;
        }
        return false;
    }

    async saveSongToMemory() {
        const songData = this.renderer.getSongData();
        const songHistory = this.renderer.getSongHistory();
        const storage = new AudioSourceStorage();
        this.setStatus("Saving song to memory: " + songData.guid);
        await storage.saveSongToMemory(songData, songHistory);
    }

    saveSongToFile() {
        const songData = this.renderer.getSongData();
        // const songHistory = this.renderer.getSongHistory();
        const storage = new AudioSourceStorage();
        this.setStatus("Saving song to file");
        storage.saveSongToFile(songData);
    }


    async loadSongFromMemory(songGUID) {
        const storage = new AudioSourceStorage();
        const songData = await storage.loadSongFromMemory(songGUID);
        const songHistory = await storage.loadSongHistoryFromMemory(songGUID);
        this.renderer.loadSongData(songData);
        this.renderer.loadSongHistory(songHistory);
        this.render();
        this.setStatus("Song loaded from memory: " + songGUID, songData);
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
        this.renderer.loadSongData(songData);
        this.render();
        this.setStatus("Song loaded from file: ", songData);
    }

    async loadSongFromMIDIFileInput(file, defaultInstrumentURL=null) {
        defaultInstrumentURL = defaultInstrumentURL || this.getDefaultInstrumentURL();
        const midiSupport = new MIDISupport();
        const songData = await midiSupport.loadSongFromMidiFile(file, defaultInstrumentURL);
        this.renderer.loadSongData(songData);
        this.render();
        this.setStatus("Song loaded from midi: ", songData);
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
        this.renderer.loadSongData(songData, src);
        this.setStatus("Song loaded from src: " + src);
        console.info(this.renderer.songData);
        this.render();
    }


    /** Tracker Commands **/

    insertInstructionCommand(e, newCommand=null, prompt=false) {
        // TODO: insert
        return this.setInstructionCommand(e, newCommand, prompt);
    }

    setInstructionCommand(e, newCommand=null, prompt=false) {
        const tracker = this.editor.tracker;
        const renderer = this.editor.renderer;
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
        if (tracker.fieldInstructionCommand.selectedOptions[0] && tracker.fieldInstructionCommand.selectedOptions[0].hasAttribute('data-instrument'))
            newInstrument = parseInt(tracker.fieldInstructionCommand.selectedOptions[0].getAttribute('data-instrument'));


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

        } else if (tracker.cursorCell) {
            const insertPosition = tracker.cursorPosition;
            if (insertPosition === null)
                throw new Error("No cursor position");
            const insertIndex = renderer.insertInstructionAtPosition(tracker.groupName, insertPosition, newInstruction);
            tracker.renderRows();
            tracker.selectIndicies(e, insertIndex);

        } else {
            throw new Error("No selection or cursor cell");
        }
        tracker.playSelectedInstructions();
    }

    setInstructionInstrument(e) {
        const tracker = this.editor.tracker;
        const renderer = this.editor.renderer;
        let selectedIndicies = tracker.selectedIndicies;

        let instrumentID = tracker.fieldInstructionInstrument.value === '' ? null : parseInt(tracker.fieldInstructionInstrument.value);
        for (let i = 0; i < selectedIndicies.length; i++) {
            renderer.replaceInstructionInstrument(this.groupName, selectedIndicies[i], instrumentID);
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
        const renderer = this.editor.renderer;
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
        const renderer = this.editor.renderer;
        let selectedIndicies = tracker.selectedIndicies;

        if(velocity === null)
            velocity = tracker.fieldInstructionVelocity.value === "0" ? 0 : parseInt(tracker.fieldInstructionVelocity.value) || null;
        if (prompt)
            velocity = parseInt(prompt("Set custom velocity (0-127):", tracker.fieldInstructionVelocity.value));
        if (isNaN(velocity))
            throw new Error("Invalid velocity: " + typeof velocity);
        for (let i = 0; i < selectedIndicies.length; i++) {
            renderer.replaceInstructionVelocity(this.groupName, selectedIndicies[i], velocity);
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
        const renderer = this.editor.renderer;
        let selectedIndicies = tracker.selectedIndicies;

        for (let i = 0; i < selectedIndicies.length; i++)
            renderer.deleteInstructionAtIndex(this.groupName, selectedIndicies[i]);
        tracker.renderRows();
        tracker.selectIndicies(e, selectedIndicies[0]);

    }

    addNewSongGroup(e) {
        const tracker = this.editor.tracker;
        const renderer = this.editor.renderer;

        let newGroupName = renderer.generateInstructionGroupName(tracker.groupName);
        newGroupName = prompt("Create new instruction group?", newGroupName);
        if (newGroupName) renderer.addInstructionGroup(newGroupName, []);
        else this.editor.setStatus("<span style='color: red'>Create instruction group canceled</span>");
        this.editor.render();
    }

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


}


