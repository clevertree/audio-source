(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    if(isBrowser) // Hack for browsers
        window.require = thisRequire;

    class AudioSourceSong {
        constructor() {
            this.dispatchElements = [];
            this.eventListeners = [];

            // this.audioContext = null;
            this.instruments = [];

            // this.seekLength = 0.5;
            this.playback = null;
            this.playbackPosition = 0;
            this.isPaused = false;

            this.volumeGain = null;
            this.volume = AudioSourceSong.DEFAULT_VOLUME;

            this.activeGroups = {};

            this.data = null;
            // this.loadSongData(songData);
            // this.eventListeners = [];
            this.history = [];
            this.waitCancels = [];
            this.playbackEndCallbacks = [];

            // Listen for instrument changes if in a browser
            // if (typeof document !== "undefined")
            //     document.addEventListener('instrument:loaded', e => this.onSongEvent(e));

        }

        async wait(waitTimeInSeconds) {
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(resolve, waitTimeInSeconds * 1000);
                this.waitCancels.push(() => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        }

        // addSongEventListener(callback) { this.eventListeners.push(callback); }
        // Check for initiated, await if not

        addDispatchElement(dispatchElement) {
            if (this.dispatchElements.indexOf(dispatchElement) !== -1) {
                console.warn("Dispatch element already added");
            } else {
                this.dispatchElements.push(dispatchElement);
            }
            return this;
        }

        removeDispatchElement(dispatchElement) {
            const i = this.dispatchElements.indexOf(dispatchElement);
            if (i !== -1) {
                this.dispatchElements.splice(i, 1);
            } else {
                console.warn("Dispatch element was not found");
            }
        }

        dispatchEvent(e) {
            for (let i = 0; i < this.eventListeners.length; i++) {
                const [eventName, listenerCallback] = this.eventListeners[i];
                if(e.name === eventName || eventName === '*') {
                    listenerCallback(e);
                }
            }
        }

        addEventListener(eventName, listenerCallback) {
            this.eventListeners.push([eventName, listenerCallback]);
        }

        removeEventListener(eventName, listenerCallback) {
            for (let i = 0; i < this.eventListeners.length; i++) {
                const [eventName2, listenerCallback2] = this.eventListeners[i];
                if(eventName === eventName && listenerCallback === listenerCallback2) {
                    this.eventListeners.splice(i, 1);
                    break;
                }
            }
        }

        /** Data shortcuts **/

        get uuid() {
            return this.data.uuid;
        }

        get name() {
            return this.data.name;
        }

        get version() {
            return this.data.version;
        }

        get timeDivision() {
            return this.data.timeDivision;
        }

        get startingBeatsPerMinute() {
            return this.data.beatsPerMinute;
        }

        get rootGroup() {
            return this.data.root;
        }

        // get history() { return this.data.history; }
        // getGroupTimeDivision(groupName) { // Bad idea
        //     return this.timeDivision;
        // }


        /** Rendering Volume **/

        // getVolumeGain() {
        //     if (!this.volumeGain) {
        //         const context = this.getAudioContext();
        //         let gain = context.createGain();
        //         gain.gain.value = this.volume; // AudioSourceSong.DEFAULT_VOLUME;
        //         gain.connect(context.destination);
        //         this.volumeGain = gain;
        //     }
        //     return this.volumeGain;
        // }

        /** @deprecated **/
        // getVolumeValue() {
        //     return this.volume; // this.volumeGain ? this.volumeGain.gain.value * 100 : AudioSourceSong.DEFAULT_VOLUME * 100;
        // }

        // setVolume(volume) {
        //     if (typeof volume !== "number")
        //         throw new Error("Invalid volume");
        //     console.info("Setting volume: ", volume);
        //     this.volume = volume;
        //     if (this.audioContext) {
        //         const gain = this.getVolumeGain();
        //         gain.gain.value = volume;
        //     }
        //     this.dispatchEvent(new CustomEvent('song:volume', {detail: {volume}}));
        // }

        /** Context **/

        // setAudioContext(audioContext) {
        //     if (audioContext.state === 'suspended')
        //         audioContext.resume();
        //     this.audioContext = audioContext;
        // }
        //
        // getAudioContext() {
        //     if (this.audioContext)
        //         return this.audioContext;
        //
        //     const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        //     this.setAudioContext(audioContext);
        //     return audioContext;
        // }

        /** Initialization **/

        async init(audioContext = null) {
            // if (audioContext !== null)
            //     await this.setAudioContext(audioContext);
            await this.loadAllInstruments(true);
            if(audioContext !== null)
                await this.initAllInstruments(audioContext);
        }

        async initInstrument(instrumentID, audioContext, throwException = true) {
            const instrument = await this.getInstrument(instrumentID, throwException);
            if(!instrument) return;
            await instrument.init(audioContext);
        }

        /** @todo combine with loadAllInstruments **/
        async initAllInstruments(audioContext) {
            console.time('initAllInstruments');
            const instrumentList = this.getInstrumentList();
            for (let instrumentID = 0; instrumentID < instrumentList.length; instrumentID++) {
                await this.initInstrument(instrumentID, audioContext, false);
            }
            console.timeEnd('initAllInstruments');
        }
        /** Song Data **/



        loadSongData(songData) {
            if (this.playback)
                this.stopPlayback();
            songData = Object.assign({}, {
                name: this.generateName(),
                uuid: this.generateUUID(),
                version: '0.0.1',
                root: 'root',
                created: new Date().getTime(),
                timeDivision: 96 * 4,
                beatsPerMinute: 120,
                beatsPerMeasure: 4,
                instruments: [],
                instructions: {
                    'root': []
                }
            }, songData);

            this.data = songData;
            this.playbackPosition = 0;

            // Process all instructions
            Object.keys(songData.instructions).map((groupName, i) =>
                this.instructionProcessGroupData(groupName));

            // let loadingInstruments = 0;

            console.log("Song data loaded: ", songData);

            this.dispatchEvent(new CustomEvent('song:loaded', {detail: this}));
        }


        loadSongHistory(songHistory) {
            this.history = songHistory;
        }

        /** Song Data Processing **/

        instructionProcessGroupData(groupName) {
            const instructionList = this.data.instructions[groupName];
            for (let i = 0; i < instructionList.length; i++) {
                const instruction = SongInstruction.parse(instructionList[i]);
                instructionList[i] = instruction.data;
            }
        }


        /** Instructions **/

        instructionEach(groupName, callback, parentStats = null) {
            if (!this.data.instructions[groupName])
                throw new Error("Invalid group: " + groupName);
            const iterator = this.instructionGetIterator(groupName, parentStats);

            let instruction = iterator.nextInstruction();
            const results = [];
            while (instruction) {
                const result = callback(instruction, iterator);
                if (result === false)
                    break;
                if (result !== null)
                    results.push(result);
                instruction = iterator.nextInstruction();
            }
            return results;
        }

        instructionFindIndex(groupName, instruction) {
            if (instruction instanceof SongInstruction)
                instruction = instruction.data;
            const instructionList = this.data.instructions[groupName];
            const p = instructionList.indexOf(instruction);
            if (p === -1)
                throw new Error("Instruction not found in instruction list");
            return p;
        }

        instructionFind(groupName, index, throwException = true) {
            let instructionList = this.data.instructions[groupName];
            if (!Number.isInteger(index)) {
                if (throwException)
                    throw new Error("Invalid Index: " + typeof index);
                return null;
            }

            if (index >= instructionList.length) {
                if (throwException)
                    throw new Error(`Instruction index is greater than group length: ${index} >= ${instructionList.length} for groupName: ${groupName}`);
                return null;
            }
            let foundInstruction = null;
            this.instructionEach(groupName, function (instruction) {
                if (instruction.index === index)
                    foundInstruction = instruction;
                if (foundInstruction)
                    return false;
            });
            if (!foundInstruction) {
                if (throwException)
                    throw new Error(`Instruction not found at index: ${index} for groupName: ${groupName}`);
                return null;
            }
            return foundInstruction;
        }


        // getInstructionGroupLength(groupName) {
        //     let instructionList = this.data.instructions[groupName];
        //     return instructionList.length;
        // }

        instructionGetIterator(groupName, parentStats = null) {
            return new AudioSourceInstructionIterator(
                this,
                groupName,
                parentStats ? parentStats.currentBPM : this.startingBeatsPerMinute,
                parentStats ? parentStats.groupPositionInTicks : 0);
        }


        instructionInsertAtPosition(groupName, insertPositionInTicks, insertInstructionData) {
            if (typeof insertPositionInTicks === 'string')
                insertPositionInTicks = SongInstruction.parseDurationAsTicks(insertPositionInTicks, this.timeDivision);

            if (!Number.isInteger(insertPositionInTicks))
                throw new Error("Invalid integer: " + typeof insertPositionInTicks);
            if (!insertInstructionData)
                throw new Error("Invalid insert instruction");
            const insertInstruction = SongInstruction.parse(insertInstructionData);
            let instructionList = this.data.instructions[groupName];

            // let groupPosition = 0, lastDeltaInstructionIndex;

            const instructionIterator = this.instructionGetIterator(groupName);

            let instruction = instructionIterator.nextInstruction();
            // noinspection JSAssignmentUsedAsCondition
            while (instruction) {
                // const instruction = new SongInstruction(instructionList[i]);
                // if(instruction.deltaDuration > 0) {

                if (instruction.positionInTicks > insertPositionInTicks) {
                    // Delta note appears after note to be inserted
                    const splitDuration = [
                        insertPositionInTicks - (instruction.positionInTicks - instruction.deltaDuration),
                        instruction.positionInTicks - insertPositionInTicks
                    ];

                    const modifyIndex = instructionIterator.groupIndex;
                    // Make following delta note smaller
                    this.instructionReplaceDeltaDuration(groupName, modifyIndex, splitDuration[1]);

                    // Insert new note before delta note.
                    insertInstruction.deltaDuration = splitDuration[0];                     // Make new note equal the rest of the duration
                    this.instructionInsertAtIndex(groupName, modifyIndex, insertInstruction);

                    return modifyIndex; // this.splitPauseInstruction(groupName, i,insertPosition - groupPosition , insertInstruction);

                } else if (instruction.positionInTicks === insertPositionInTicks) {
                    // Delta note plays at the same time as new note, append after

                    let lastInsertIndex;
                    // Search for last insert position
                    for (lastInsertIndex = instruction.index + 1; lastInsertIndex < instructionList.length; lastInsertIndex++)
                        if (new SongInstruction(instructionList[lastInsertIndex]).deltaDuration > 0)
                            break;

                    insertInstruction.deltaDuration = 0; // TODO: is this correct?
                    this.instructionInsertAtIndex(groupName, lastInsertIndex, insertInstruction);
                    return lastInsertIndex;
                }
                // groupPosition += instruction.deltaDuration;
                // lastDeltaInstructionIndex = i;
                // }
                // if (!instruction)
                //     break;
                instruction = instructionIterator.nextInstruction();
            }

            if (instructionIterator.groupPositionInTicks >= insertPositionInTicks)
                throw new Error("Something went wrong");
            // Insert a new pause at the end of the song, lasting until the new note?
            let lastPauseIndex = instructionList.length;
            // this.instructionInsertAtIndex(groupName, lastPauseIndex, {
            //     command: '!pause',
            //     duration: insertPosition - groupPosition
            // });
            // Insert new note
            insertInstruction.deltaDuration = insertPositionInTicks - instructionIterator.groupPositionInTicks;
            this.instructionInsertAtIndex(groupName, lastPauseIndex, insertInstruction);
            return lastPauseIndex;
        }


        instructionInsertAtIndex(groupName, insertIndex, insertInstructionData) {
            if (!insertInstructionData)
                throw new Error("Invalid insert instruction");
            let insertInstruction = SongInstruction.parse(insertInstructionData);
            insertInstructionData = insertInstruction.data;
            this.insertDataPath(['instructions', groupName, insertIndex], insertInstructionData);
            return insertIndex;
        }


        instructionDeleteAtIndex(groupName, deleteIndex) {
            const deleteInstruction = this.instructionFind(groupName, deleteIndex);
            if (deleteInstruction.deltaDuration > 0) {
                const nextInstruction = this.instructionFind(groupName, deleteIndex + 1, false);
                if (nextInstruction) {
                    this.instructionReplaceDeltaDuration(groupName, deleteIndex + 1, nextInstruction.deltaDuration + deleteInstruction.deltaDuration)
                }
            }
            return this.deleteDataPath(['instructions', groupName, deleteIndex]);
        }


        instructionReplaceDeltaDuration(groupName, replaceIndex, newDelta) {
            return this.instructionReplaceParam(groupName, replaceIndex, 0, newDelta);
        }

        instructionReplaceCommand(groupName, replaceIndex, newCommand) {
            return this.instructionReplaceParam(groupName, replaceIndex, 1, newCommand);
        }

        instructionReplaceInstrument(groupName, replaceIndex, instrumentID) {
            return this.instructionReplaceParam(groupName, replaceIndex, 2, instrumentID);
        }

        instructionReplaceDuration(groupName, replaceIndex, newDuration) {
            return this.instructionReplaceParam(groupName, replaceIndex, 3, newDuration);
        }

        instructionReplaceVelocity(groupName, replaceIndex, newVelocity) {
            if (!Number.isInteger(newVelocity))
                throw new Error("Velocity must be an integer: " + newVelocity);
            if (newVelocity < 0)
                throw new Error("Velocity must be a positive integer: " + newVelocity);
            return this.instructionReplaceParam(groupName, replaceIndex, 4, newVelocity);
        }

        instructionReplaceParam(groupName, replaceIndex, paramName, paramValue) {
            if (paramValue === null)
                return this.deleteDataPath(['instructions', groupName, replaceIndex, paramName]);
            return this.replaceDataPath(['instructions', groupName, replaceIndex, paramName], paramValue);
        }


        /** Song Groups **/

        groupAdd(newGroupName, instructionList) {
            if (this.data.instructions.hasOwnProperty(newGroupName))
                throw new Error("New group already exists: " + newGroupName);
            this.replaceDataPath(['instructions', newGroupName], instructionList || []);
        }


        groupRemove(removeGroupName) {
            if (removeGroupName === 'root')
                throw new Error("Cannot remove root instruction group, n00b");
            if (!this.data.instructions.hasOwnProperty(removeGroupName))
                throw new Error("Existing group not found: " + removeGroupName);

            return this.replaceDataPath(['instructions', removeGroupName]);
        }


        groupRename(oldGroupName, newGroupName) {
            if (oldGroupName === 'root')
                throw new Error("Cannot rename root instruction group, n00b");
            if (!this.data.instructions.hasOwnProperty(oldGroupName))
                throw new Error("Existing group not found: " + oldGroupName);
            if (this.data.instructions.hasOwnProperty(newGroupName))
                throw new Error("New group already exists: " + newGroupName);

            const removedGroupData = this.replaceDataPath(['instructions', oldGroupName]);
            this.replaceDataPath(['instructions', newGroupName], removedGroupData);
        }


        /** Song Timing **/

        getSongLengthInSeconds() {
            return this.getSongLength().inSeconds;
        }

        getSongLengthInTicks() {
            return this.getSongLength().inTicks;
        }

        getSongLength() {
            return this.getGroupLength(this.rootGroup);
        }

        getGroupLength(groupName) {
            const instructionIterator = this.instructionGetIterator(groupName);
            while (instructionIterator.nextInstruction()) {
            }
            return {
                inSeconds: instructionIterator.groupPlaybackEndTime,
                inTicks: instructionIterator.groupPositionInTicks
            }
        }


        getSongPositionFromTicks(songPositionInTicks) {
            return this.getGroupPositionFromTicks(this.rootGroup, songPositionInTicks);
        }

        getGroupPositionFromTicks(groupName, groupPositionInTicks) {
            let lastStats = null;
            this.instructionEach(groupName, (instruction, iterator) => {
                lastStats = iterator;
                if (iterator.groupPositionInTicks >= groupPositionInTicks)
                    return false;
            });

            if (!lastStats)
                return 0;
            let currentPosition = lastStats.groupPlaybackTime;

            if (groupPositionInTicks > lastStats.groupPositionInTicks) {
                const elapsedTicks = groupPositionInTicks - lastStats.groupPositionInTicks;
                currentPosition += this.ticksToSeconds(elapsedTicks, lastStats.currentBPM);

            } else if (groupPositionInTicks < lastStats.groupPositionInTicks) {
                const elapsedTicks = lastStats.groupPositionInTicks - groupPositionInTicks;
                currentPosition -= this.ticksToSeconds(elapsedTicks, lastStats.currentBPM);
            }

            // console.info("getGroupPositionFromTicks", groupPositionInTicks, currentPosition);
            return currentPosition;
        }


        getSongPositionInTicks(positionInSeconds = null) {
            if (positionInSeconds === null)
                positionInSeconds = this.songPlaybackPosition;
            return this.getGroupPositionInTicks(this.rootGroup, positionInSeconds);
        }


        getGroupPositionInTicks(groupName, positionInSeconds) {
            let lastStats = null;
            this.instructionEach(groupName, (instruction, stats) => {
                lastStats = stats;
                if (stats.groupPlaybackTime >= positionInSeconds)
                    return false;
            });

            if (!lastStats)
                return 0;

            let currentPositionInTicks = lastStats.groupPositionInTicks;
            if (positionInSeconds > lastStats.groupPlaybackTime) {
                const elapsedTime = positionInSeconds - lastStats.groupPlaybackTime;
                currentPositionInTicks += this.secondsToTicks(elapsedTime, lastStats.currentBPM);

            } else if (positionInSeconds < lastStats.groupPlaybackTime) {
                const elapsedTime = lastStats.groupPlaybackTime - positionInSeconds;
                currentPositionInTicks -= this.secondsToTicks(elapsedTime, lastStats.currentBPM);
            }

            // console.info("getSongPositionInTicks", positionInSeconds, currentPositionInTicks);
            return currentPositionInTicks;
        }

        ticksToSeconds(elapsedTicks, currentBPM) {
            const elapsedTime = (elapsedTicks / this.timeDivision) * (60 / currentBPM);
            return elapsedTime;
        }

        secondsToTicks(elapsedTime, currentBPM) {
            const elapsedTicks = Math.round((elapsedTime * this.timeDivision) / (60 / currentBPM));
            return elapsedTicks;
        }


        /** Playback **/


        get songPlaybackPosition() {
            if (this.playback)
                return this.playback.audioContext.currentTime - this.playback.startTime;
            return this.playbackPosition;
        }


        setPlaybackPositionInTicks(songPositionInTicks) {
            if (!Number.isInteger(songPositionInTicks))
                throw new Error("Invalid start position in ticks");
            // TODO: is start position beyond song's ending?

            const playbackPosition = this.getSongPositionFromTicks(songPositionInTicks);
            return this.setPlaybackPosition(playbackPosition);
        }

        setPlaybackPosition(songPosition) {
            songPosition = parseFloat(songPosition);
            if (Number.isNaN(songPosition))
                throw new Error("Invalid start position");

            this.dispatchEvent(new CustomEvent('song:seek', {
                detail: {
                    position: this.playbackPosition,
                    positionInTicks: this.getSongPositionInTicks(this.playbackPosition),
                }
            }));

            // this.playback.setPlaybackPosition(this.getAudioContext().currentTime - this.playbackPosition);
            let isPlaying = !!this.playback;
            if (this.playback) {
                this.playback.stopPlayback();
            }
            this.playbackPosition = songPosition;

            if (isPlaying) {
                const oldDestination = this.playback.destination;
                this.playback = new AudioSourceInstructionPlayback(oldDestination, this, this.rootGroup, oldDestination.context.currentTime - this.playbackPosition);
                this.playback.playGroup(oldDestination)
                    .then((reachedEnding) => reachedEnding ? this.stopPlayback(true) : null);
            }
            // const positionInTicks = this.getSongPositionInTicks(this.playbackPosition);
//         console.log("Seek position: ", this.playbackPosition, positionInTicks);

        }

        async waitForPlaybackToEnd() {
            const ret = await new Promise((resolve, reject) => {
                this.playbackEndCallbacks.push(resolve);
            });
            console.log("Playback finished: ", ret);
            return ret;
        }


        isActive() {
            for (const key in this.activeGroups) {
                if (this.activeGroups.hasOwnProperty(key)) {
                    if (this.activeGroups[key] === true)
                        return true;
                }
            }
            return false;
        }

        async play(destination) {
            if(!destination || !destination.context)
                throw new Error("Invalid destination");
            const audioContext = destination.context;
            if (this.playback) {
                this.stopPlayback();
                this.setPlaybackPosition(0);
                // throw new Error("Song is already playing");
            }

            await this.init(audioContext);

            const playback = new AudioSourceInstructionPlayback(destination, this, this.rootGroup, this.playbackPosition);
            this.playback = playback;
            console.log("Start playback:", this.playbackPosition);

            this.dispatchEvent(new CustomEvent('song:play', {
                detail: {
                    playback: this.playback,
                }
            }));

            this.playback.playGroup(destination)
                .then((reachedEnding) => reachedEnding ? this.stopPlayback(true) : null);
            return await this.waitForPlaybackToEnd();

            // if (this.playback)
            //     this.stopPlayback();

            // if(this.playback)
            //     this.stopPlayback();


        }

        stopPlayback() {
            if (!this.playback)
                throw new Error("Playback is already stopped");
            const playback = this.playback;
            this.playback = null;
            this.playbackPosition = playback.getGroupPositionInSeconds();
            playback.stopPlayback();

            for (let i = 0; i < this.playbackEndCallbacks.length; i++)
                this.playbackEndCallbacks[i]();
            this.playbackEndCallbacks = [];
            for (let i = 0; i < this.waitCancels.length; i++)
                this.waitCancels[i]();
            this.waitCancels = [];


            console.log("End playback:", this.playbackPosition);


            this.dispatchEvent(new CustomEvent('song:end', {
                detail: {
                    playback
                }
            }));
        }

        pause() {
            if (this.isPaused)
                throw new Error("Song is already paused");
            this.isPaused = true;
        }

        resume() {
            if (!this.isPaused)
                throw new Error("Song is not paused");
            this.isPaused = false;
        }

        get isPlaying() {
            return !!this.playback;
        }


        async playInstructionAtIndex(destination, groupName, instructionIndex, noteStartTime = null) {
            const instruction = this.instructionFind(groupName, instructionIndex, false);
            if (instruction)
                await this.playInstruction(destination, instruction, noteStartTime);
            else
                console.warn("No instruction at index");
        }

        async playInstruction(destination, instruction, noteStartTime = null, groupName = null) {
            const audioContext = destination.context;
            if (!instruction instanceof SongInstruction)
                throw new Error("Invalid instruction");

            // if(this.playback)
            //     this.stopPlayback();

            if (instruction.isGroupCommand()) {
                const groupPlayback = new AudioSourceInstructionPlayback(destination, this, instruction.getGroupFromCommand(), noteStartTime);
                // const groupPlayback = new AudioSourceInstructionPlayback(this.song, subGroupName, notePosition);
                return await groupPlayback.playGroup(destination);
            }


            let bpm = this.startingBeatsPerMinute;
            // const noteDuration = (instruction.duration || 1) * (60 / bpm);
            let timeDivision = this.timeDivision;
            const noteDurationInTicks = instruction.getDurationAsTicks(timeDivision);
            const noteDuration = (noteDurationInTicks / timeDivision) / (bpm / 60);

            let currentTime = audioContext.currentTime;

            if (!noteStartTime && noteStartTime !== 0)
                noteStartTime = currentTime;


            this.playInstrument(destination, instruction.instrument, instruction.command, noteStartTime, noteDuration, instruction.velocity);
            // Wait for note to start
            if (noteStartTime > currentTime) {
                await this.wait(noteStartTime - currentTime);
                // await new Promise((resolve, reject) => setTimeout(resolve, (noteStartTime - currentTime) * 1000));
            }

            // Dispatch note start event
            this.dispatchEvent(new CustomEvent('note:start', {
                detail: {
                    groupName,
                    instruction,
                }
            }));

            currentTime = audioContext.currentTime;
            if (noteStartTime + noteDuration > currentTime) {
                await this.wait(noteStartTime + noteDuration - currentTime);
                // await new Promise((resolve, reject) => setTimeout(resolve, (noteStartTime + noteDuration - currentTime) * 1000));
            }
            // TODO: check for song stop
            // Dispatch note end event
            this.dispatchEvent(new CustomEvent('note:end', {
                detail: {
                    groupName,
                    instruction,
                }
            }));
        }


        /** Modify Song Data **/

        hasGroup(groupName) {
            return typeof this.data.instructions[groupName] !== "undefined";
        }

        songChangeName(newSongTitle) {
            return this.replaceDataPath(['name'], newSongTitle);
        }

        songChangeVersion(newSongTitle) {
            return this.replaceDataPath(['version'], newSongTitle);
        }

        songChangeStartingBPM(newBPM) {
            if (!Number.isInteger(newBPM))
                throw new Error("Invalid BPM");
            return this.replaceDataPath(['beatsPerMinute'], newBPM);
        }

        generateName() {
            return `Untitled (${new Date().toJSON().slice(0, 10).replace(/-/g, '/')})`;
        }

        generateUUID() {
            var d = new Date().getTime();
            if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
                d += performance.now(); //use high-precision timer if available
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
        }

        generateInstructionGroupName(groupName = 'group') {
            const songData = this.data;
            for (let i = 0; i <= 999; i++) {
                const currentGroupName = groupName + i;
                if (!songData.instructions.hasOwnProperty(currentGroupName))
                    return currentGroupName;
            }
            throw new Error("Failed to generate group name");
        }


        /** Instruments **/


        isInstrumentLoaded(instrumentID) {
            return !!this.instruments[instrumentID];
        }

        async playInstrument(destination, instrumentID, noteFrequency, noteStartTime, noteDuration, noteVelocity) {
            if (!instrumentID && instrumentID !== 0) {
                console.warn("No instrument set for instruction. Using instrument 0");
                instrumentID = 0;
                // return;
            }
            if (!this.data.instruments[instrumentID]) {
                console.error(`Instrument ${instrumentID} is not loaded. Playback skipped. `);
                return;
            }
            let instrument = await this.loadInstrument(instrumentID);
            return await instrument.play(destination, noteFrequency, noteStartTime, noteDuration, noteVelocity);
        }

        hasInstrument(instrumentID) {
            const instrumentList = this.getInstrumentList();
            return !!instrumentList[instrumentID];
        }

        getInstrumentConfig(instrumentID, throwException = true) {
            const instrumentList = this.getInstrumentList();
            if (instrumentList[instrumentID])
                return instrumentList[instrumentID];
            if (throwException)
                throw new Error("Instrument ID not found: " + instrumentID);
            return null;
        }


        getInstrumentList() {
            return this.data.instruments.slice();
        }

        async getInstrument(instrumentID, throwException = true) {
            if (this.instruments[instrumentID])
                return await this.instruments[instrumentID];
            if (throwException)
                throw new Error("Instrument not yet loading: " + instrumentID);
            return null;
        }


        async loadInstrumentClass(instrumentClassURL) {
            let scriptElm = document.head.querySelectorAll(`script[src$="${instrumentClassURL}"]`)[0];
            if (!scriptElm) {
                scriptElm = document.createElement('script');
                scriptElm.src = instrumentClassURL;
                scriptElm.promises = (scriptElm.promises || []).concat(new Promise(async (resolve, reject) => {
                    scriptElm.onload = resolve;
                    document.head.appendChild(scriptElm);
                }));
            }

            for (let i = 0; i < scriptElm.promises.length; i++)
                await scriptElm.promises[i];
            const {instrument} = scriptElm.exports;

            if (!instrument)
                throw new Error("Script element does not have '.instrument' attribute: " + instrumentClassURL);
            if (typeof instrument !== "function")
                throw new Error("Script element '.instrument' attribute is not a function: " + instrumentClassURL);
            return instrument;
        }

        async loadInstrumentInstance(instrumentID) {
            const instrumentPreset = this.getInstrumentConfig(instrumentID);
            if (!instrumentPreset.url)
                throw new Error("Invalid instrument URL");
            let instrumentClassURL = new URL(instrumentPreset.url, document.location.origin); // This should be an absolute url;

            const instrumentClass = await this.loadInstrumentClass(instrumentClassURL);
            const instrument =  new instrumentClass(instrumentPreset, this, instrumentID); //, this.getAudioContext());
            if (typeof instrument.init !== "function")
                throw new Error("Instrument has no 'init' method: " + instrument.constructor.name);
            await instrument.init();
            return instrument;
        }

        async loadInstrument(instrumentID, forceReload = false) {
            instrumentID = parseInt(instrumentID);
            if (!forceReload && this.instruments[instrumentID])
                return await this.instruments[instrumentID];

            // Load instrument instance
            this.instruments[instrumentID] = this.loadInstrumentInstance(instrumentID);

            const instance = await this.instruments[instrumentID];
            this.instruments[instrumentID] = instance;
            this.dispatchEvent(new CustomEvent('instrument:instance', {
                detail: {
                    instance,
                    instrumentID
                },
                bubbles: true
            }));

            // if (this.audioContext)
            //     await this.initInstrument(instrumentID, this.audioContext);

//             console.info("Instrument loaded: ", instance, instrumentID);
            return instance;
        }

        async loadAllInstruments(forceReload = false) {
            const instrumentList = this.getInstrumentList();
            for (let instrumentID = 0; instrumentID < instrumentList.length; instrumentID++) {
                if (instrumentList[instrumentID]) {
//                 console.info("Loading instrument: " + instrumentID, instrumentList[instrumentID]);
                    await this.loadInstrument(instrumentID, forceReload);
                }
            }
        }


        instrumentAdd(config) {
            if (typeof config !== 'object')
                config = {url: config};
            if (!config.url)
                throw new Error("Invalid Instrument URL");
            // config.url = config.url;

            const instrumentList = this.data.instruments;
            const instrumentID = instrumentList.length;

            this.replaceDataPath(['instruments', instrumentID], config);
            this.loadInstrument(instrumentID);
            this.dispatchEvent(new CustomEvent('instrument:added', {
                bubbles: true, detail: {
                    instrumentID,
                    config,
                    oldConfig: null
                }
            }), 1);
            return instrumentID;
        }

        async instrumentReplace(instrumentID, config) {
            const instrumentList = this.data.instruments;
            // if(instrumentList.length < instrumentID)
            //     throw new Error("Invalid instrument ID: " + instrumentID);
            let oldConfig = instrumentList[instrumentID] || {};
            if (typeof config !== 'object')
                config = {url: config};
            if (oldConfig && oldConfig.name && !config.name)
                config.name = oldConfig.name;
            // Preserve old instrument name
            oldConfig = this.replaceDataPath(['instruments', instrumentID], config);
            this.dispatchEvent(new CustomEvent('instrument:modified', {
                bubbles: true, detail: {
                    instrumentID,
                    config,
                    oldConfig
                }
            }), 1);
            return oldConfig;
        }

        instrumentRemove(instrumentID) {
            const instrumentList = this.data.instruments;
            if (!instrumentList[instrumentID])
                throw new Error("Invalid instrument ID: " + instrumentID);
            const isLastInstrument = instrumentID === instrumentList.length - 1;
            // if(instrumentList.length === instrumentID) {
            //
            // }
            delete this.instruments[instrumentID];
            const oldConfig = isLastInstrument
                ? this.deleteDataPath(['instruments', instrumentID])
                : this.replaceDataPath(['instruments', instrumentID], null);
            this.dispatchEvent(new CustomEvent('instrument:removed', {
                bubbles: true, detail: {
                    instrumentID,
                    config: null,
                    oldConfig: oldConfig
                }
            }), 1);
            return oldConfig;
        }

        // Note: instruments handle own rendering
        instrumentReplaceParam(instrumentID, pathList, paramValue) {
            instrumentID = parseInt(instrumentID);
            const instrumentList = this.data.instruments;
            if (!instrumentList[instrumentID])
                throw new Error("Invalid instrument ID: " + instrumentID);

            if (!Array.isArray(pathList))
                pathList = [pathList];
            pathList.unshift(instrumentID);
            pathList.unshift('instruments');
            return this.replaceDataPath(pathList, paramValue);
        }

        deleteInstrumentParam(instrumentID, pathList) {
            instrumentID = parseInt(instrumentID);
            const instrumentList = this.data.instruments;
            if (!instrumentList[instrumentID])
                throw new Error("Invalid instrument ID: " + instrumentID);

            if (!Array.isArray(pathList))
                pathList = [pathList];
            pathList.unshift(instrumentID);
            pathList.unshift('instruments');
            return this.deleteDataPath(pathList);
        }

        instrumentRename(instrumentID, newInstrumentName) {
            return this.instrumentReplaceParam(instrumentID, 'name', newInstrumentName);
        }


        // instrumentReplaceParams(instrumentID, replaceParams) {
        //     const instrumentList = this.songData.instruments;
        //     if(!instrumentList[instrumentID])
        //         throw new Error("Invalid instrument ID: " + instrumentID);
        //
        //     const oldParams = {};
        //     for(const paramName in replaceParams) {
        //         if(replaceParams.hasOwnProperty(paramName)) {
        //             const paramValue = replaceParams[paramName];
        //             const oldData = this.instrumentReplaceParam(instrumentID, paramName, paramValue)
        //                 .oldData;
        //             if(typeof oldData !== "undefined")
        //                 oldParams[paramName] = oldData;
        //         }
        //     }
        //     return oldParams;
        // }

        /** Song Data Modification **/

        findDataPath(pathList) {
            if (!Array.isArray(pathList))
                throw new Error("Path list must be an array");
            if (pathList[0] === "*") {
                return {
                    value: this.data,
                    parent: {key: this.data},
                    key: 'key'
                };
            }
            // const pathList = path.split('.');
            let value = this.data, parent, key = null;
            for (let i = 0; i < pathList.length; i++) {
                key = pathList[i];
                // if(/^\d+$/.test(key)) {
                //     key = parseInt(key);
                //     // if(typeof target.length < targetPathPart)
                //     //     throw new Error(`Path is out of index: ${target.length} < ${targetPathPart} (Path: -${path}) `);
                // } else {
                //     // if(typeof target[targetPathPart] === 'undefined')
                //     //     throw new Error("Path not found: " + path);
                // }
                parent = value;
                if (typeof value === "undefined")
                    throw new Error("Invalid path key: " + key);
                value = value[key];
            }
            if (!parent)
                throw new Error("Invalid path: " + pathList.join('.'));

            return {
                value: value,
                parent: parent,
                key: key
            };
        }

        insertDataPath(pathList, newData) {
            const pathInfo = this.findDataPath(pathList);

            newData = AudioSourceSong.sanitizeInput(newData);

            if (typeof pathInfo.key !== 'number')
                throw new Error("Insert action requires numeric key");
            if (pathInfo.parent.length < pathInfo.key)
                throw new Error(`Insert position out of index: ${pathInfo.parent.length} < ${pathInfo.key} for path: ${pathList}`);
            pathInfo.parent.splice(pathInfo.key, 0, newData);

            this.queueHistoryAction(pathList, newData);
            return null;
        }


        deleteDataPath(pathList) {
            const pathInfo = this.findDataPath(pathList);

            // if(typeof pathInfo.key !== 'number')
            //     throw new Error("Delete action requires numeric key");
            const oldData = pathInfo.parent[pathInfo.key];
            if (typeof pathInfo.key === 'number') {
                if (pathInfo.parent.length < pathInfo.key)
                    throw new Error(`Delete position out of index: ${pathInfo.parent.length} < ${pathInfo.key} for path: ${pathList}`);
                pathInfo.parent.splice(pathInfo.key, 1);
            } else {
                delete pathInfo.parent[pathInfo.key];
            }

            this.queueHistoryAction(pathList, null, oldData);
            return oldData;
        }

        replaceDataPath(pathList, newData) {
            const pathInfo = this.findDataPath(pathList);
            if (typeof newData === 'undefined')
                return this.deleteDataPath(pathList);

            let oldData = null;
            newData = AudioSourceSong.sanitizeInput(newData);
            // if(typeof pathInfo.key === 'number' && pathInfo.parent.length < pathInfo.key)
            //     throw new Error(`Replace position out of index: ${pathInfo.parent.length} < ${pathInfo.key} for path: ${pathList}`);
            if (typeof pathInfo.parent[pathInfo.key] !== "undefined")
                oldData = pathInfo.parent[pathInfo.key];
            pathInfo.parent[pathInfo.key] = newData;

            this.queueHistoryAction(pathList, newData, oldData);
            return oldData;
        }

        queueHistoryAction(pathList, data = null, oldData = null) {
            const historyAction = [
                // action[0],
                pathList,
            ];
            if (data !== null || oldData !== null)
                historyAction.push(data);
            if (oldData !== null)
                historyAction.push(oldData);
            this.history.push(historyAction);

            // setTimeout(() => {
            this.dispatchEvent(new CustomEvent('song:modified', {detail: historyAction}), 1);
            // }, 1);

            return historyAction;
        }

        /** History **/

        applyHistoryActions(songHistory) {
            for (let i = 0; i < songHistory.length; i++) {
                const historyAction = songHistory[i];
                switch (historyAction.action) {
                    case 'reset':
                        Object.assign(this.data, historyAction.data);
                        break;
                    case 'insert':
                        this.insertDataPath(historyAction.path, historyAction.data);
                        break;
                    case 'delete':
                        this.deleteDataPath(historyAction.path);
                        break;
                    case 'replace':
                        this.replaceDataPath(historyAction.path, historyAction.data);
                        break;
                }
            }
            this.history = [];
            this.instructionProcessGroupData();
        }

        // TODO: remove path
        static sanitizeInput(value) {
            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++)
                    value[i] = AudioSourceSong.sanitizeInput(value[i]);
                return value;
            }
            if (typeof value === 'object') {
                for (const key in value)
                    if (value.hasOwnProperty(key))
                        value[key] = AudioSourceSong.sanitizeInput(value[key]);
                return value;
            }
            if (typeof value !== 'string')
                return value;

            if (typeof require !== 'undefined') {
                var Filter = require('bad-words'),
                    filter = new Filter();
                if (filter.isProfane(value))
                    throw new Error("Swear words are forbidden");
                value = filter.clean(value);
            }

            var ESC_MAP = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            let regex = /[&<>'"]/g;
            // if(false) {
            //     regex = /[&<>]/g;
            // }

            return value.replace(regex, function (c) {
                return ESC_MAP[c];
            });
        }


        // Input

        onInput(e) {
            if (e.defaultPrevented)
                return;
            switch (e.type) {
                case 'click':
                    break;
            }
        }


    }


    AudioSourceSong.loadSongFromMemory = async function (songUUID) {
        const {AudioSourceStorage} = require('../common/audio-source-storage.js');
        const storage = new AudioSourceStorage();
        const songData = await storage.loadSongFromMemory(songUUID);
        const songHistory = await storage.loadSongHistoryFromMemory(songUUID);
        const song = new AudioSourceSong(songData);
        await song.loadSongData(songData);
        await song.loadSongHistory(songHistory);
        return song;
    };


    AudioSourceSong.loadSongFromFileInput = async function (file) {
        const library = await AudioSourceSong.getFileSupportModule(file.name);
        if (typeof library.loadSongDataFromFileInput !== "function")
            throw new Error("Invalid library.loadSongDataFromFileInput method");
        const songData = await library.loadSongDataFromFileInput(file);
        const song = new AudioSourceSong();
        await song.loadSongData(songData);
        return song;
    };

    AudioSourceSong.loadSongFromURL = async function (src) {
        const library = await AudioSourceSong.getFileSupportModule(src);
        if (typeof library.loadSongDataFromURL !== "function")
            throw new Error("Invalid library.loadSongDataFromURL method: " + src);
        const songData = await library.loadSongDataFromURL(src);
        const song = new AudioSourceSong();
        await song.loadSongData(songData);
        return song;
    };


    AudioSourceSong.loadSongFromMIDIFile = async function (file, defaultInstrumentURL = null) {
        defaultInstrumentURL = defaultInstrumentURL || this.getDefaultInstrumentURL();
        const midiSupport = new MIDIImport();
        const songData = await midiSupport.loadSongFromMidiFile(file, defaultInstrumentURL);
        const song = new AudioSourceSong();
        await song.loadSongData(songData);
        return song;
    };


    AudioSourceSong.getFileSupportModule = async function (filePath) {
        const AudioSourceLoader = customElements.get('audio-source-loader');
        const fileExt = filePath.split('.').pop().toLowerCase();
        switch (fileExt) {
            case 'mid':
            case 'midi':
                const {MIDISupport} = await AudioSourceLoader.requireAsync('../common/support/midi-support.js');
                return new MIDISupport;

            case 'json':
                const {JSONSupport} = await AudioSourceLoader.requireAsync('../common/support/json-support.js');
                return new JSONSupport;

            case 'spc':
                const {LibGMESupport} = await AudioSourceLoader.requireAsync('../common/support/libgme-support.js');
                return new LibGMESupport;

            case 'mp3':
                const {MP3Support} = await AudioSourceLoader.requireAsync('../common/support/mp3-support.js');
                return new MP3Support;

            default:
                throw new Error("Unknown file type: " + fileExt);
        }
    };


    AudioSourceSong.DEFAULT_VOLUME = 0.7;

    class AudioSourceInstructionPlayback {
        constructor(destination, song, groupName, startTime = null, seekLength = 1) {
            if(!destination || !destination.context)
                throw new Error("Invalid destination");
            startTime = startTime || destination.context.currentTime;

            this.destination = destination;
            this.song = song;
            this.groupName = groupName;
            this.seekLength = seekLength;
            this.iterator = null;
            this.stopPlaybackCallback = null;
            this.subGroups = [];
            this.startTime = startTime;
            // this.lastRowPlaybackTime = 0;
            this.quantizationInTicks = song.timeDivision;
            this.isActive = false;
            this.isPaused = false;
            // this.activeGroups =
        }

        get audioContext() { return this.destination.context; }

        get groupPositionInTicks() {
            return this.iterator.groupPositionInTicks;
        }

        getGroupPositionInSeconds() { return this.audioContext.currentTime - this.startTime; }

        async wait(waitTimeInSeconds) {
//             console.info("Waiting... ", waitTimeInSeconds);
            return await new Promise((resolve, reject) => {
                this.stopPlaybackCallback = () => {
                    console.info("Group aborted: ", this.groupName);
                    this.isActive = false;
                    resolve(false);
                };
                setTimeout(() => resolve(true), waitTimeInSeconds * 1000);
            });
        }

        async playGroup() {
            const audioContext = this.audioContext;
            this.isActive = true;
            const iterator = this.song.instructionGetIterator(this.groupName);
            this.iterator = iterator;
            this.song.dispatchEvent(new CustomEvent('group:play', {
                detail: {
                    playback: this,
                    iterator
                }
            }));

            while (this.isActive && this.playNextInstructionRow(this.destination)) {
                let currentTime = audioContext.currentTime - this.startTime;
                const waitTime = this.iterator.groupPlaybackTime - currentTime - this.seekLength;
                await this.wait(waitTime);
            }

            let remainingTime = audioContext.currentTime - this.startTime;
            if (this.isActive && this.iterator && remainingTime < this.iterator.groupPlaybackEndTime) {
                // Wait for notes to finish
                const waitTime = this.iterator.groupPlaybackEndTime - remainingTime;
                await this.wait(waitTime);
            }

            // this.stopPlayback(false);

            // if(this.iterator) never happens
            //     this.stopPlayback(false);

            this.song.dispatchEvent(new CustomEvent('group:end', {
                detail: {
                    playback: this,
                    iterator
                }
            }));


            let elapsedTime = audioContext.currentTime - this.startTime;
            console.info("Group finished: ", this.groupName, elapsedTime);
            const wasActive = this.isActive;
            this.isActive = true;
            return wasActive; // Determines if the playlist should play the next song
        }


        async stopPlayback(stopInstruments = true) {
            if (this.stopPlaybackCallback) {
                this.stopPlaybackCallback();
                this.stopPlaybackCallback = null;
            }
            const iterator = this.iterator;
            this.iterator = null;
            // If we reached the end of the iterator, trigger event
            this.song.dispatchEvent(new CustomEvent('group:stop', {
                detail: {
                    playback: this,
                    iterator
                }
            }));

            if (stopInstruments) {

                // Stop all instrument playback (if supported)
                const instrumentList = this.song.getInstrumentList();
                for (let instrumentID = 0; instrumentID < instrumentList.length; instrumentID++) {
                    const instrument = await this.song.getInstrument(instrumentID, false);
                    if (instrument && instrument.stopPlayback)
                        instrument.stopPlayback();
                }
            }

            // Stop subgroups
            this.subGroups.forEach(playback => playback.stopPlayback(stopInstruments));
        }

        playNextInstructionRow(destination) {
            const audioContext = this.audioContext;
            if (!this.isActive)
                throw new Error("Playback is not active");

            const instructionList = this.iterator.nextInstructionRow();
            if (!instructionList)
                return false;


            // const audioContext = audioContext;
            const noteStartTime = this.startTime + this.iterator.groupPlaybackTime;
            // const waitTime = (notePosition - audioContext.currentTime); //  - this.seekLength;
//         console.log(this.iterator.groupPositionInTicks, instructionList, this.iterator.groupIndex);

            // Wait ahead of notes if necessary (by seek time)
            // if (waitTime > 0) {
            //     // console.log("Waiting ... " + waitTime, notePosition, this.iterator.groupPlaybackTime, audioContext.currentTime);
            //     await new Promise((resolve, reject) => setTimeout(resolve, waitTime * 1000));
            // }
            // if (!this.isActive)
            //     return false;


            for (let i = 0; i < instructionList.length; i++) {
                const instruction = instructionList[i];
                if (instruction.isGroupCommand()) {
                    let subGroupName = instruction.getGroupFromCommand();
                    if (subGroupName === this.iterator.groupName) { // TODO group stack
                        console.error("Recursive group call. Skipping group '" + subGroupName + "'");
                        continue;
                    }

                    const groupPlayback = new AudioSourceInstructionPlayback(destination, this.song, subGroupName, audioContext.startTime - noteStartTime);
                    this.subGroups.push(groupPlayback);
                    groupPlayback.playGroup();

                } else {
                    this.song.playInstruction(destination, instruction, noteStartTime, this.groupName);
                }
            }

            // const detail = {
            //     groupName: this.groupName,
            //     position: this.iterator.groupPlaybackTime,
            //     positionInTicks: this.iterator.groupPositionInTicks
            // };
            // this.song.dispatchEvent(new CustomEvent('group:seek', this));
            // console.info('playNextInstructionRow', this.startTime, waitTime, this.iterator.groupPlaybackTime, instructionList); // audioContext.currentTime, waitTime, instructionList);

            return true;

        }
    }


    class AudioSourceInstructionIterator {
        constructor(song, groupName, currentBPM = null, groupPositionInTicks = 0) {
            if (!song.data.instructions[groupName])
                throw new Error("Song group not found: " + groupName);

            this.song = song;
            this.groupName = groupName;
            this.currentBPM = currentBPM || song.startingBeatsPerMinute;
            this.timeDivision = song.timeDivision;
            this.groupIndex = -1;

            // this.lastRowPositionInTicks = 0;
            // this.lastRowPlaybackTime = 0;
            this.groupPositionInTicks = groupPositionInTicks;
            this.lastDeltaDuration = 0;
            this.groupEndPositionInTicks = groupPositionInTicks;
            this.lastInstructionGroupPositionInTicks = groupPositionInTicks;

            this.groupPlaybackTime = 0;
            this.groupPlaybackEndTime = 0;
            this.lastInstructionGroupPlaybacktime = 0;


            this.nextQuantizationBreakInTicks = 0;


            // this.lastRowPositionInTicks = null;
            // this.lastRowIndex = 0;
        }

        get hasReachedEnd() {
            return this.groupIndex >= this.instructionList.length;
        }

        get instructionList() {
            return this.song.data.instructions[this.groupName];
        }

        // getCurrentInstruction() {
        //     const data = this.instructionList[this.groupIndex];
        //     if (!data) {
        //         return null;
        //     }
        //     const instruction = new SongInstruction(data);
        //     instruction.index = this.groupIndex;
        //     instruction.positionInTicks = this.groupPositionInTicks;
        //     return instruction;
        // }

        // getCurrentInstructionRow() {
        //     const instructionRowList = [];
        //     let instruction, currentIndex = this.groupIndex;
        //     while (instruction = this.getInstruction(currentIndex, this.groupPositionInTicks)) {
        //         instructionRowList.push(instruction);
        //
        //         if (instruction.deltaDuration)
        //             break;
        //         currentIndex++;
        //     }
        //     return instructionRowList;
        // }

        // getInstruction(index, positionInTicks, throwException=true) {
        //     const data = this.instructionList[index];
        //     if (!data) {
        //         if (throwException)
        //             throw new Error("Instruction not found at index: " + index);
        //         return null;
        //     }
        //     const instruction = new SongInstruction(data);
        //     instruction.index = index;
        //     instruction.positionInTicks = positionInTicks;
        //     return instruction;
        // }

        // getInstructionRow(startIndex) {
        //     const instructionRowList = [];
        //     let instruction;
        //     while (instruction = this.getInstruction(startIndex, this.groupPositionInTicks)) {
        //         instructionRowList.push(instruction);
        //
        //         if (instruction.deltaDuration)
        //             break;
        //         startIndex++;
        //     }
        //     return instructionRowList;
        // }

        currentInstruction() {
            if (this.groupIndex === -1)
                return null;
            const data = this.instructionList[this.groupIndex];
            if (!data)
                return null;
            const instruction = new SongInstruction(data);
            instruction.index = this.groupIndex;
            instruction.positionInTicks = this.groupPositionInTicks;
            return instruction;
        }

        nextConditionalInstruction(conditionalCallback) {
            let nextInstruction;
            let deltaDurationInTicks = 0;
            while (nextInstruction = this.nextInstruction()) {
                deltaDurationInTicks += nextInstruction.deltaDuration;
                const ret = conditionalCallback(nextInstruction);
                if (ret !== true)
                    continue;
                nextInstruction.deltaDuration = deltaDurationInTicks;
                return nextInstruction;
            }
            return null;
        }

        nextInstruction() {
            if (this.groupIndex >= this.instructionList.length)
                return null;

            this.groupIndex++;
            let currentInstruction = this.currentInstruction(); // new SongInstruction(this.instructionList[this.groupIndex]);
            if (currentInstruction) {
                this._incrementPositionBy(currentInstruction.deltaDuration, currentInstruction.duration);
                currentInstruction.positionInTicks = this.lastInstructionGroupPositionInTicks;
            }
            return currentInstruction;
        }

        scanAheadInstruction() {
            const index = this.groupIndex + 1;
            if (index >= this.instructionList.length)
                return null;
            const data = this.instructionList[index];
            const instruction = new SongInstruction(data);
            instruction.index = index;
            instruction.positionInTicks = this.lastInstructionGroupPositionInTicks + instruction.deltaDuration;
            return instruction;
        }


        nextInstructionRow(conditionalCallback = null) {
            let currentRowInstructionList = [];
            let nextInstruction = this.nextInstruction(); // Increment ahead for real
            if (!nextInstruction) {
                // If we found end of the group, we're done
                return null;
            }

            while (true) {

                if (!nextInstruction) {
                    // If we found end of the group, we're done
                    break;
                }
                // If not, add it to the list and check the next instruction
                currentRowInstructionList.push(nextInstruction);
                // if (nextInstruction.deltaDuration) {
                //     // If the next instruction has a delta, then we found the end of the current row
                //     break;
                // }

                nextInstruction = this.scanAheadInstruction();
                if (!nextInstruction || nextInstruction.deltaDuration) {
                    break;
                }
                nextInstruction = this.nextInstruction(); // Increment ahead for real
            }

            if (conditionalCallback !== null) {
                currentRowInstructionList = currentRowInstructionList.filter(conditionalCallback);
                // if(currentRowInstructionList.length === 0) {
                //     return this.nextInstructionRow(conditionalCallback);
                // }
            }
            return currentRowInstructionList;
            // throw new Error("Recursion limit");
        }

        // TODO: refactor
        nextInstructionQuantizedRow(quantizationInTicks, maxLengthInTicks = null, conditionalCallback = null) {
            if (!quantizationInTicks)
                throw new Error("Invalid Quantization value: " + typeof quantizationInTicks);
            let nextInstruction = this.scanAheadInstruction();
            // const nextInstruction = new SongInstruction(this.instructionList[this.groupIndex + 1]);


            if (!nextInstruction) {
                // If we found end of the group, we're done, but first, check if we need to render more quantized rows
                if ((this.groupPositionInTicks < maxLengthInTicks)) { //
                    this._incrementTo(this.nextQuantizationBreakInTicks);
                    this.nextQuantizationBreakInTicks += quantizationInTicks;
                    return [];
                }
                if (this.nextInstruction()) // Forward to the end of the array
                    throw new Error("Shouldn't be a next instruction");
                // If we're truly at the end of all things, then return null
                return null;
            }

            // Calculate the next instruction position
            let nextInstructionPositionInTicks = nextInstruction.positionInTicks; // this.lastInstructionGroupPositionInTicks + nextInstruction.deltaDuration;
            if (nextInstructionPositionInTicks > maxLengthInTicks)
                maxLengthInTicks = nextInstructionPositionInTicks;

            // Skip quantization if equal to current position
            if (this.nextQuantizationBreakInTicks === nextInstructionPositionInTicks)
                this.nextQuantizationBreakInTicks += quantizationInTicks;

            // If the next rendered position is greater than the next break position
            if (
                nextInstructionPositionInTicks > this.nextQuantizationBreakInTicks && this.nextQuantizationBreakInTicks < maxLengthInTicks
            ) {
                this._incrementTo(this.nextQuantizationBreakInTicks);
                this.nextQuantizationBreakInTicks += quantizationInTicks;
                // Return an empty row
                return [];
            }

            return this.nextInstructionRow(conditionalCallback);
        }

        _incrementPositionBy(deltaDuration, instructionDuration) {

            // this.lastRowPositionInTicks = this.groupPositionInTicks;
            this.groupPositionInTicks = this.lastInstructionGroupPositionInTicks + deltaDuration;
            this.lastInstructionGroupPositionInTicks = this.groupPositionInTicks;

            const elapsedTime = (deltaDuration / this.timeDivision) / (this.currentBPM / 60);
            // this.lastRowPlaybackTime = this.groupPlaybackTime;
            this.groupPlaybackTime = this.lastInstructionGroupPlaybacktime + elapsedTime;
            this.lastInstructionGroupPlaybacktime = this.groupPlaybackTime;

            instructionDuration = instructionDuration || 0;
            const groupEndPositionInTicks = this.groupPositionInTicks + instructionDuration;
            if (groupEndPositionInTicks > this.groupEndPositionInTicks)
                this.groupEndPositionInTicks = groupEndPositionInTicks;
            const groupPlaybackEndTime = this.groupPlaybackTime + (instructionDuration / this.song.timeDivision) / (this.currentBPM / 60);
            if (groupPlaybackEndTime > this.groupPlaybackEndTime)
                this.groupPlaybackEndTime = groupPlaybackEndTime;
        }

        _incrementTo(positionInTicks) {

            const elapsedTimeInTicks = positionInTicks - this.groupPositionInTicks; // nextInstructionPositionInTicks - nextBreakPositionInTicks;
            // Set the last rendered position as the next break position
            this.groupPositionInTicks = positionInTicks;
            const elapsedTimeInSeconds = (elapsedTimeInTicks / this.timeDivision) / (this.currentBPM / 60);
            this.groupPlaybackTime += elapsedTimeInSeconds;
        }

        // * [Symbol.iterator]() {
        //     // const instructionList = this.instructionList;
        //     let instruction;
        //     while (instruction = this.nextInstruction()) {
        //         yield instruction;
        //     }
        // }
    }

    // class AudioSourceConditionalInstructionIterator extends AudioSourceInstructionIterator {
    //     constructor(song, groupName, conditionalCallback = null, currentBPM = null, groupPositionInTicks = 0) {
    //         super(song, groupName, currentBPM, groupPositionInTicks);
    //         if (typeof conditionalCallback !== "function")
    //             throw new Error("Invalid conditional callback");
    //         this.conditionalCallback = conditionalCallback;
    //     }
    //
    //     nextInstruction() {
    //         let nextInstruction;
    //         let deltaDurationInTicks = 0;
    //         while (nextInstruction = super.nextInstruction()) {
    //             deltaDurationInTicks += nextInstruction.deltaDuration;
    //             const ret = this.conditionalCallback(nextInstruction);
    //             if (ret !== true)
    //                 continue;
    //             nextInstruction.deltaDuration = deltaDurationInTicks;
    //             return nextInstruction;
    //         }
    //         return null;
    //     }
    // }


    class SongInstruction {
        constructor(instructionData, index = null, positionInTicks = null) {
            this.data = instructionData || [0, '', 0];
            this.index = index;
            this.positionInTicks = positionInTicks;
            // this.playbackTime = null;
        }

        get deltaDuration() {
            return this.data[0];
        }

        set deltaDuration(newDeltaDuration) {
            this.data[0] = SongInstruction.parseDurationAsTicks(newDeltaDuration);
        }

        get command() {
            return this.data[1] || null;
        }

        set command(newCommand) {
            this.data[1] = newCommand;
        }

        get instrument() {
            return typeof this.data[2] === "undefined" ? null : this.data[2];
        }

        set instrument(newInstrumentID) {
            newInstrumentID = parseInt(newInstrumentID);
            if (Number.isNaN(newInstrumentID))
                throw new Error("Invalid Instrument ID");
            this.data[2] = newInstrumentID;
        }

        get duration() {
            return typeof this.data[3] === "undefined" ? null : this.data[3];
        }

        set duration(newDuration) {
            newDuration = parseFloat(newDuration);
            if (Number.isNaN(newDuration))
                throw new Error("Invalid Duration");
            this.data[3] = newDuration;
        }

        getDurationAsTicks(timeDivision) {
            return SongInstruction.parseDurationAsTicks(this.duration, timeDivision);
        }

        get velocity() {
            return typeof this.data[4] === "undefined" ? null : this.data[4];
        }

        set velocity(newVelocity) {
            newVelocity = parseInt(newVelocity);
            if (Number.isNaN(newVelocity))
                throw new Error("Invalid Velocity");
            this.data[4] = newVelocity;
        }

        get panning() {
            return typeof this.data[5] === "undefined" ? null : this.data[5];
        }

        set panning(newPanning) {
            newPanning = parseInt(newPanning);
            if (Number.isNaN(newPanning))
                throw new Error("Invalid Panning");
            this.data[5] = newPanning;
        }

        isGroupCommand() {
            return this.command && this.command[0] === '@';
        }

        getGroupFromCommand() {
            return this.command.substr(1);
        }

        static parse(instruction) {
            if (instruction instanceof SongInstruction)
                return instruction;

            if (typeof instruction === 'number')
                instruction = [instruction]; // Single entry array means pause

            else if (typeof instruction === 'string') {
                instruction = instruction.split(':');
                // instruction[0] = parseFloat(instruction[0]);
                if (instruction.length >= 2) {
                    instruction[1] = parseInt(instruction[1])
                }
            }

            if (typeof instruction[0] === 'string')
                instruction.unshift(0);

            return new SongInstruction(instruction);
        }

        static parseDurationAsTicks(durationString, timeDivision) {
            if (durationString === null || typeof durationString === 'number')
                return durationString;
            switch (durationString[durationString.length - 1].toLowerCase()) {
                case 't':
                    return parseInt(durationString.substr(0, durationString.length - 1));
                case 'b':
                    return timeDivision * parseFloat(durationString.substr(0, durationString.length - 1));
            }
            throw new Error("Invalid Duration: " + durationString);
        }
    }


    if (typeof global !== 'undefined') {

        if (typeof global.CustomEvent === "undefined") {
            class CustomEvent {
                constructor(name, data) {

                }
            }

            global.CustomEvent = CustomEvent;
        }
    }


    /** Export this script **/
    thisModule.exports = {
        AudioSourceSong,
        AudioSourceInstructionIterator,
        AudioSourceInstructionPlayback,
        SongInstruction,
    };


}).apply(null, (function() {
    const thisScriptPath = 'common/audio-source-song.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [thisRequire, thisModule, thisScriptPath, isBrowser]
})());