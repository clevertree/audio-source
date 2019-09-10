/**
 * Player requires a modern browser
 */

class AudioSourceRenderer {
    constructor(songData={}, dispatchElement=null) {
        this.dispatchElement = dispatchElement;
        this.audioContext = null;
        this.songData = songData;
        this.instruments = {
            loaded: [],
            class: {},
            classPromises: {},
            promises: {},
        };

        this.seekLength = 0.5;
        this.playbackPositionInTicks = 0; // Song relative position in ticks
        this.playbackStartTime = null;  // Song start time

        this.volumeGain = null;
        this.activeGroups = {};
        // this.activeSources = [];
        this.sources = new AudioSources(this);
        this.values = new AudioSourceValues(this);
        // this.config = {
        //     volume: 0.3
        // };
        this.loadSongData({});
        // this.eventListeners = [];
        this.songHistory = [];
        document.addEventListener('instrument:loaded', e => this.onSongEvent(e));

    }
    // addSongEventListener(callback) { this.eventListeners.push(callback); }

    get noteFrequencies() {
        return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    }


    // Check for initiated, await if not
    getAudioContext() {
        if(this.audioContext)
            return this.audioContext;

        this.audioContext = new (window.AudioContext||window.webkitAudioContext)();
        // this.initAllInstruments(this.audioContext);
        return this.audioContext;
    }
    getSongData() { return this.songData; }
    getSongTimeDivision() { return this.songData.timeDivision || 96*4; }
    getGroupTimeDivision(groupName) {
        return this.getSongTimeDivision();
    }

    getSongHistory() { return this.songHistory; }
    getStartingBeatsPerMinute() { return this.songData.beatsPerMinute; }
    getVolumeGain() {
        if(!this.volumeGain) {
            const context = this.getAudioContext();
            let gain = context.createGain();
            gain.gain.value = AudioSourceRenderer.DEFAULT_VOLUME;
            gain.connect(context.destination);
            this.volumeGain = gain;
        }
        return this.volumeGain;
    }

    getVolume () {
        return this.volumeGain ? this.volumeGain.gain.value * 100 : AudioSourceRenderer.DEFAULT_VOLUME * 100;
    }
    setVolume (volume) {
        const gain = this.getVolumeGain();
        if(gain.gain.value !== volume) {
            gain.gain.value = volume / 100;
            console.info("Setting volume: ", volume);
        }
    }

    // playInstruction(instruction) {
    //     return this.player.playInstruction(
    //         instruction,
    //         this.player.getAudioContext().currentTime
    //     );
    // }

    // getSongURL() { return this.getAttribute('src');}

    dispatchEvent(event) {
        if(this.dispatchElement) {
            this.dispatchElement.dispatchEvent(event);
        }
    }

    onSongEvent(e) {
        switch(e.type) {
            case 'instrument:loaded':
                const instrumentClass = e.detail.class;
                const instrumentClassURL = e.detail.url;
                this.instruments.class[instrumentClassURL] = instrumentClass;
                this.loadAllInstruments();
                break;
        }
    }


    loadSongData(songData, songURL=null) {
        songData = Object.assign({}, {
            instruments: [],
            instructions: {
                'root': []
            }
        }, songData);
        // TODO: Cleanup
        this.songData = songData;

        Object.keys(songData.instructions).map((groupName, i) =>
            this.processAllInstructionData(groupName));

        let loadingInstruments = 0;
        if(songData.instruments.length === 0) {
            // console.warn("Song contains no instruments");
        } else {
            for(let instrumentID=0; instrumentID<songData.instruments.length; instrumentID++) {
                if(!songData.instruments[instrumentID])
                    continue;
                if(songURL)
                    songData.instruments[instrumentID].url = new URL(songData.instruments[instrumentID].url, songURL) + '';
                loadingInstruments++;
                this.loadInstrument(instrumentID);

                //      , (instance) => {
                //         loadingInstruments--;
                //         if(loadingInstruments === 0) {
                //             this.dispatchEvent(new CustomEvent('instruments:initialized', {
                //                 bubbles: true
                //             }));
                //         }
                //     }
            }
        }

        this.dispatchEvent(new CustomEvent('song:loaded'));
    }


    loadSongHistory(songHistory) {
        this.songHistory = songHistory;
    }

    processAllInstructionData(groupName) {
        const instructionList = this.songData.instructions[groupName];
        for(let i=0; i<instructionList.length; i++) {
            const instruction = instructionList[i];
            instructionList[i] = this.processInstructionData(instruction);
        }
    }

    // REFACTOR
    processInstructionData(instructionData) {
        const instruction = SongInstruction.parse(instructionData);
        return instruction.data;
    }



    findInstructionGroup(instruction) {
        if(instruction instanceof SongInstruction)
            instruction = instruction.data;
        if(typeof instruction !== 'object')
            throw new Error("Invalid instruction object");
        for(let groupName in this.songData.instructions) {
            if(this.songData.instructions.hasOwnProperty(groupName)) {
                if(this.songData.instructions[groupName].indexOf(instruction) !== -1)
                    return groupName;
            }
        }
        throw new Error("Instruction not found in songData");
    }

    getInstructions(groupName, indicies=null) {
        let instructionList = this.songData.instructions[groupName];
        if(!instructionList)
            throw new Error("Instruction group not found: " + groupName);
        if(indicies) {
            if(typeof indicies === "number")
                indicies = [indicies];
            instructionList = instructionList.filter((instruction, index) => indicies.indexOf(index) !== -1);
        }
        return instructionList
            .map(instructionData => new SongInstruction(instructionData))
    }

    getInstructionRange(groupName, start, end=null) {
        let instructionList = this.songData.instructions[groupName];
        if(!instructionList)
            throw new Error("Instruction group not found: " + groupName);
        const selectedInstructions = [];
        for(let i=start; end === null ? true : i<end; i++) {
            if(!instructionList[i])
                break;
            const instruction = new SongInstruction(instructionList[i]);
            if(selectedInstructions.length > 0 && end === null && instruction.deltaDuration)
                break;
            selectedInstructions.push(instruction);
        }
        return selectedInstructions;
    }

    getInstructionIndex(instruction, groupName) {
        if(instruction instanceof SongInstruction)
            instruction = instruction.data;
        const instructionList = this.songData.instructions[groupName];
        const p = instructionList.indexOf(instruction);
        if(p === -1)
            throw new Error("Instruction not found in instruction list");
        return p;
    }

    getInstruction(groupName, index, throwException=true) {
        let instructionList = this.songData.instructions[groupName];
        if(!Number.isInteger(index))
            throw new Error("Invalid Index: " + typeof index);
        if(throwException) {
            if (index >= instructionList.length)
                throw new Error(`Instruction index is greater than group length: ${index} >= ${instructionList.length} for groupName: ${groupName}`);
            if (!instructionList[index])
                throw new Error(`Instruction not found at index: ${index} for groupName: ${groupName}`);
        }
        return new SongInstruction(instructionList[index]);
    }

    getSongRootGroup() {
        return this.songData.root || 'root';
    }

    getSongDuration(endPositionInTicks) {
        let currentDuration = 0;
        this.eachInstruction(this.getSongRootGroup(), (index, instruction, stats) => {
            if(stats.groupPositionInTicks >= endPositionInTicks) {
                currentDuration = stats.groupPlaybackTime;
                return false;
            }
        });
        return currentDuration;
    }


    getSongPositionInTicks(positionInSeconds) {
        let currentPosition = 0;
        this.eachInstruction(this.getSongRootGroup(), (index, instruction, stats) => {
            if(stats.groupPlaybackTime >= positionInSeconds) {
                currentPosition = stats.groupPositionInTicks;
                return false;
            }
        })
        return currentPosition;
    }


    // Playback
    // TODO remove stop and add play start over?

    async play (startPositionInTicks = null) {
        if(this.playbackStartTime !== null)
            throw new Error("Song is already playing");
        if(startPositionInTicks !== null)
            this.playbackPositionInTicks = startPositionInTicks;
        console.log("Start playback:", this.playbackPositionInTicks);
        const playbackPositionInSeconds = this.getSongDuration(this.playbackPositionInTicks);

        await this.initAllInstruments(this.getAudioContext());

        // Set playback start time
        this.playbackStartTime = this.getAudioContext().currentTime - playbackPositionInSeconds;
        // console.log("Start playback:", this.playbackStartTime);

        const detail = {
            startTime: this.playbackStartTime,
            positionInTicks: this.playbackPositionInTicks,
            positionInSeconds: playbackPositionInSeconds
        };
        this.dispatchEvent(new CustomEvent('song:play', {detail}));
        await this.playInstructions(
            this.getSongRootGroup(),
            this.playbackStartTime
        );
        // this.seekPosition = this.getAudioContext().currentTime - (this.seekPosition + this.playbackStartTime); // TODO: broken
        this.dispatchEvent(new CustomEvent('song:end', {detail}));
        // console.log("Seek position in ticks: ", this.playbackPositionInTicks);

    }



    // Stops playback
    stopPlayback() {
        // if(this.playbackStartTime === null)
        //     throw new Error("Song is not playing");

        // Set the current playback time
        if(this.playbackStartTime !== null)
            this.playbackPositionInTicks = this.getSongPositionInTicks(this.getAudioContext().currentTime - this.playbackStartTime);
        this.playbackStartTime = null;

        // Ensures no new notes play
        for(const key in this.activeGroups) {
            if(this.activeGroups.hasOwnProperty(key)) {
                this.activeGroups[key] = false;
            }
        }

        // Stop all instrument playback (if supported)
        const instrumentList = this.getInstrumentList();
        for(let instrumentID=0; instrumentID<instrumentList.length; instrumentID++) {
            const instrument = this.getInstrument(instrumentID, false);
            if(instrument && instrument.stopPlayback)
                instrument.stopPlayback();
        }

        // // Stop all active sources
        // console.log("activeSources", this.activeSources);
        // for(let i=0; i<this.activeSources.length; i++) {
        //     this.activeSources[i].stop();
        // }
        // this.activeSources = [];

        const detail = {
            startTime: this.playbackStartTime,
            positionInTicks: this.playbackPositionInTicks
        };
        this.dispatchEvent(new CustomEvent('song:stop', {detail}));
        console.log("Stop position in ticks: ", this.playbackPositionInTicks);
    }

    setStartPositionInTicks(startPositionInTicks) {
        if(!Number.isInteger(startPositionInTicks))
            throw new Error("Invalid start position");
        // TODO: is start position beyond song's ending?

        this.playbackPositionInTicks = startPositionInTicks;
        console.log("Seek position in ticks: ", this.playbackPositionInTicks);

        const detail = {
            startTime: this.playbackStartTime,
            positionInTicks: this.playbackPositionInTicks
        };
        this.dispatchEvent(new CustomEvent('song:seek', {detail}));
    }

    isPlaybackActive() {
        for(const key in this.activeGroups) {
            if(this.activeGroups.hasOwnProperty(key)) {
                if(this.activeGroups[key] === true)
                    return true;
            }
        }
        return false;
    }

    // async/await each group playback
    async playInstructions(instructionGroup, startTime) {
        const activeGroupKey = instructionGroup+startTime;
        this.activeGroups[activeGroupKey] = true;
        console.time("Group:"+instructionGroup);
        // playbackRangeStart = playbackRangeStart || 0;
        const audioContext = this.getAudioContext();
        startTime = startTime || audioContext.currentTime;

        // var statTime = new Date().getTime();

        const activeSubGroups = [];
        await this.eachInstructionAsync(instructionGroup, async (i, instruction, stats) => {
            if(!this.activeGroups[activeGroupKey])
                return false;



            // const instructionStartTime = startTime + stats.groupPlaybackTime;
            let elapsedTime = (audioContext.currentTime - startTime);
            if(elapsedTime + this.seekLength < stats.groupPlaybackTime) {
                const waitTime = Math.floor((stats.groupPlaybackTime - (elapsedTime + this.seekLength)) * 1000 * 0.9);
                // console.info("Waiting ", waitTime);
                await new Promise((resolve, reject) => {
                   setTimeout(resolve, waitTime);
                });
                elapsedTime = (audioContext.currentTime - startTime);
            }

            if(instruction.isGroupCommand()) {
                let subGroupName = instruction.getGroupFromCommand();
                let instructionGroupList = this.songData.instructions[subGroupName];
                if (!instructionGroupList)
                    throw new Error("Instruction groupName not found: " + subGroupName);
                if (subGroupName === instructionGroup) { // TODO group stack
                    console.error("Recursive group call. Skipping group '" + subGroupName + "'");
                    return;
                }
                const promise = this.playInstructions(subGroupName, startTime + stats.groupPlaybackTime);
                activeSubGroups.push(promise);

                return;
            }
            // playInstructions.push(instruction);
            // if(instruction.command[0] === '!')
            //     return;
            // console.log("Note played", instruction, stats);


            // Skip note if it's too far in the past
            if(elapsedTime <= stats.groupPlaybackTime) {
                this.playInstruction(instruction, startTime + stats.groupPlaybackTime, stats);
            }
        });

        // Wait for subgroups to finish
        for(let i=0; i<activeSubGroups.length; i++)
            await activeSubGroups[i];

        // Delete active group
        delete this.activeGroups[activeGroupKey];

        // console.log("Active subgroups", activeSubGroups);
        console.timeEnd("Group:"+instructionGroup);
    }

    eachInstruction(groupName, callback, parentStats) {
        if(!this.songData.instructions[groupName])
            throw new Error("Invalid group: " + groupName)
        const instructionIterator = new InstructionIterator(
            this.songData.instructions[groupName],
            groupName,
            parentStats ? parentStats.timeDivision : this.getSongTimeDivision(),
            parentStats ? parentStats.currentBPM : this.getStartingBeatsPerMinute(),
            parentStats ? parentStats.groupPositionInTicks : 0);
        let instruction = instructionIterator.nextInstruction();
        while(instruction) {
            const ret = callback(instructionIterator.currentIndex, instruction, instructionIterator);
            if(ret === false)
                break;
            instruction = instructionIterator.nextInstruction();
        }
        return instructionIterator.groupPlaybackTime;
    }


    async eachInstructionAsync(groupName, callback, parentStats) {
        if(!this.songData.instructions[groupName])
            throw new Error("Invalid group: " + groupName)
        const instructionIterator = new InstructionIterator(
            this.songData.instructions[groupName],
            groupName,
            parentStats ? parentStats.timeDivision : this.getSongTimeDivision(),
            parentStats ? parentStats.currentBPM : this.getStartingBeatsPerMinute(),
            parentStats ? parentStats.groupPositionInTicks : 0);
        let instruction = instructionIterator.nextInstruction();
        while(instruction) {
            const ret = await callback(instructionIterator.currentIndex, instruction, instructionIterator);
            if(ret === false)
                break;
            instruction = instructionIterator.nextInstruction();
        }
        return instructionIterator.groupPlaybackTime;
    }


    playInstructionAtIndex(groupName, instructionIndex, noteStartTime=null, stats=null) {
        const instruction = this.getInstruction(groupName, instructionIndex);
        this.playInstruction(instruction, noteStartTime, stats)
    }

    async playInstruction(instruction, noteStartTime=null, stats=null) {
        if(Array.isArray(instruction))
            instruction = new SongInstruction(instruction);

        if(instruction.isGroupCommand()) {

            return await this.playInstructions(instruction.getGroupFromCommand(), noteStartTime);
        }


        let bpm = stats ? stats.currentBPM : this.getStartingBeatsPerMinute();
        // const noteDuration = (instruction.duration || 1) * (60 / bpm);
        let timeDivision = this.getSongTimeDivision();
        const noteDurationInTicks = instruction.getDurationAsTicks(timeDivision);
        const noteDuration = (noteDurationInTicks / timeDivision) / (bpm / 60);

        const noteEventData = {
            currentTime: this.getAudioContext().currentTime,
            startTime: noteStartTime,
            duration: noteDuration,
            instruction: instruction,
        };
        if(stats) {
            noteEventData.currentIndex = stats.currentIndex;
            noteEventData.groupPositionInTicks = stats.groupPositionInTicks;

            //     if(stats.groupInstruction) {
            //         if(typeof stats.groupInstruction.velocity !== 'undefined')
            //             noteVelocity *= stats.groupInstruction.velocity/100;
            //         if(typeof instrumentID === 'undefined' && typeof stats.groupInstruction.instrument !== 'undefined')
            //             instrumentID = stats.groupInstruction.instrument;
            //     }
        }


        if(!noteStartTime && noteStartTime !== 0)
            noteStartTime = this.getAudioContext().currentTime;


        this.playInstrument(instruction.instrument, instruction.command, noteStartTime, noteDuration, instruction.velocity);


        let currentTime = this.getAudioContext().currentTime;
        if(noteStartTime > currentTime) {
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve();
                }, (noteStartTime - currentTime) * 1000);
            });
        }

        // this.activeSources.push.apply(this.activeSources, sources);
        // console.log("activeSources", this.activeSources, sources);

        this.dispatchEvent(new CustomEvent('note:start', {detail: noteEventData}));
        currentTime = this.getAudioContext().currentTime;


        if(noteDuration) {
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve();
                }, (noteStartTime - currentTime + noteDuration) * 1000);
            });
            this.dispatchEvent(new CustomEvent('note:end', {detail: noteEventData}));
        }

        // this.activeSources = this.activeSources.filter(activeSource => sources.indexOf(activeSource) !== -1);
    }


    playInstrument(instrumentID, noteFrequency, noteStartTime, noteDuration, noteVelocity) {
        if(!instrumentID && instrumentID !== 0) {
            console.warn("No instrument set for instruction. Using instrument 0");
            instrumentID = 0;
            // return;
        }
        if(!this.songData.instruments[instrumentID]) {
            console.error(`Instrument ${instrumentID} is not loaded. Playback skipped. `);
            return;
        }
        let instrument = this.getInstrument(instrumentID);
        const destination = this.getVolumeGain();
        return instrument.play(destination, noteFrequency, noteStartTime, noteDuration, noteVelocity);
    }

    getInstrumentConfig(instrumentID, throwException=true) {
        const instrumentList = this.getInstrumentList();
        if(instrumentList[instrumentID])
            return instrumentList[instrumentID];
        if(throwException)
            throw new Error("Instrument ID not found: " + instrumentID);
        return null;
    }

    getInstrument(instrumentID, throwException=true) {
        if(this.instruments.loaded[instrumentID])
            return this.instruments.loaded[instrumentID];
        if(throwException)
            throw new Error("Instrument not yet loaded: " + instrumentID);
        return null;
    }

    getInstrumentList() {
        return this.getSongData().instruments.slice();
    }

    // TODO: async
    async loadInstrumentClass(instrumentClassURL) {
        instrumentClassURL = new URL(instrumentClassURL) + '';
        // const instrumentClassFile = new URL(instrumentClassURL).pathname.split('/').pop();

        let instrumentClass = this.instruments.class[instrumentClassURL];
        if(instrumentClass)
            return instrumentClass;

        let instrumentClassPromise = this.instruments.classPromises[instrumentClassURL];
        if(!instrumentClassPromise) {
            instrumentClassPromise = new Promise((resolve, reject) => {
                const newScriptElm = document.createElement('script');

                let intervalStart = new Date().getTime();
                let intervalDuration = 10;
                const doInterval = () => {
                    setTimeout(() => {
//                         console.log("Interval", intervalDuration);
                        if (this.instruments.class[instrumentClassURL]) { // Check for loaded class
                            resolve(this.instruments.class[instrumentClassURL]);
                            delete this.instruments.classPromises[instrumentClassURL];
                            return;

                        } else {
                            if (new Date().getTime() > intervalStart + 25000) {
                                reject("Unable to load: " + instrumentClassURL);
                                delete this.instruments.classPromises[instrumentClassURL];
                                newScriptElm.parentNode.removeChild(newScriptElm);
                                return;
                            }
                        }

                        intervalDuration *= 2;
                        doInterval();
                    }, intervalDuration);
                };
                doInterval();

                // newScriptElm.onload = (e) => {
                //     newScriptElm.classList.add('loaded');
                // };

                newScriptElm.onerror = (e) => {
                    reject("Error loading: " + instrumentClassURL);
                    delete this.instruments.classPromises[instrumentClassURL];
                    newScriptElm.parentNode.removeChild(newScriptElm);
                };

                newScriptElm.src = instrumentClassURL;
                document.head.appendChild(newScriptElm);

            });
            this.instruments.classPromises[instrumentClassURL] = instrumentClassPromise;
        }

        return await instrumentClassPromise;

            //     console.warn("Instrument class is loading: " + instrumentClassFile);
            // else
            //     throw new Error("Instrument class is already loaded: " + instrumentClassFile);
            // return;
        // MusicPlayerElement.loadScript(instrumentPreset.url); // , () => {
    }


    async loadInstrument(instrumentID, forceReload=false) {
        instrumentID = parseInt(instrumentID);
        if (!forceReload && this.instruments.loaded[instrumentID])
            return true;
        this.instruments.loaded[instrumentID] = null;

        const instrumentPreset = this.getInstrumentConfig(instrumentID);
        if(!instrumentPreset.url)
            throw new Error("Invalid instrument URL");
        let instrumentClassURL = new URL(instrumentPreset.url, document.location.origin); // This should be an absolute url;
        // try {
        //     instrumentClassURL = new URL(instrumentPreset.url);
        // } catch (e) {
        //     console.warn(e);
        // }

        const instrumentClass = await this.loadInstrumentClass(instrumentClassURL);

        const instance = new instrumentClass(instrumentPreset, this); //, this.getAudioContext());
        this.instruments.loaded[instrumentID] = instance;
        this.dispatchEvent(new CustomEvent('instrument:instance', {
            detail: {
                instance,
                instrumentID
            },
            bubbles: true
        }));

        if(this.audioContext)
            this.initInstrument(instrumentID, this.audioContext);

        return true;
    }

    loadAllInstruments() {
        const instrumentList = this.getInstrumentList();
        for(let instrumentID=0; instrumentID<instrumentList.length; instrumentID++) {
            if(instrumentList[instrumentID]) {
                this.loadInstrument(instrumentID);
            }
        }
    }

    async initInstrument(instrumentID, audioContext) {
        const instrument = this.getInstrument(instrumentID);
        await instrument.init(audioContext);
    }

    async initAllInstruments(audioContext) {
        console.time('initAllInstruments');
        const instrumentList = this.getInstrumentList();
        for(let instrumentID=0; instrumentID<instrumentList.length; instrumentID++) {
            const instrument = this.getInstrument(instrumentID, false);
            if(instrument)
                await instrument.init(audioContext);
        }
        console.timeEnd('initAllInstruments');
    }



    /** Modify Song Data **/

    generateGUID() { 
        var d = new Date().getTime();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
            d += performance.now(); //use high-precision timer if available
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    generateInstructionGroupName(currentGroup) {
        const songData = this.getSongData();
        let newGroupName;
        for(let i=99; i>=0; i--) {
            const currentGroupName = currentGroup + '.' + i;
            if(!songData.instructions.hasOwnProperty(currentGroupName))
                newGroupName = currentGroupName;
        }
        if(!newGroupName)
            throw new Error("Failed to generate group name");
        return newGroupName;
    }



    setSongTitle(newSongTitle) { return this.replaceDataPath('title', newSongTitle); }
    setSongVersion(newSongTitle) { return this.replaceDataPath('version', newSongTitle); }

    addInstrument(config) {
        if(typeof config !== 'object')
            config = {
                url: config
            };
        if(!config.url)
            throw new Error("Invalid Instrument URL");
        // config.url = config.url;

        const instrumentList = this.songData.instruments;
        const instrumentID = instrumentList.length;

        this.replaceDataPath(['instruments', instrumentID], config);
        this.loadInstrument(instrumentID);
        this.dispatchEvent(new CustomEvent('instrument:modified', {bubbles: true, detail: {
            instrumentID,
            config,
            oldConfig: null
        }}), 1);
        return instrumentID;
    }

    replaceInstrument(instrumentID, config) {
        const instrumentList = this.songData.instruments;
        if(instrumentList.length < instrumentID)
            throw new Error("Invalid instrument ID: " + instrumentID);
        const oldInstrument = instrumentList[instrumentID];
        if(typeof config !== 'object')
            config = {
                url: config
            };
        if(oldInstrument && oldInstrument.name && !config.name)
            config.name = oldInstrument.name;
        // Preserve old instrument name
        const oldConfig = this.replaceDataPath(['instruments', instrumentID], config);
        this.dispatchEvent(new CustomEvent('instrument:modified', {bubbles: true, detail: {
            instrumentID,
            config,
            oldConfig: oldConfig
        }}), 1);
        this.loadInstrument(instrumentID);
        return oldConfig;
    }

    removeInstrument(instrumentID) {
        const instrumentList = this.songData.instruments;
        if(!instrumentList[instrumentID])
            throw new Error("Invalid instrument ID: " + instrumentID);
        // if(instrumentList.length === instrumentID) {
        //
        // }
        delete this.instruments.loaded[instrumentID];
        const oldConfig =  this.replaceDataPath(['instruments', instrumentID], null);
        this.dispatchEvent(new CustomEvent('instrument:modified', {bubbles: true, detail: {
            instrumentID,
            config: null,
            oldConfig: oldConfig
        }}), 1);
        return oldConfig;
    }

    // Note: instruments handle own rendering
    replaceInstrumentParam(instrumentID, pathList, paramValue) {
        instrumentID = parseInt(instrumentID);
        const instrumentList = this.songData.instruments;
        if(!instrumentList[instrumentID])
            throw new Error("Invalid instrument ID: " + instrumentID);

        if(!Array.isArray(pathList))
            pathList = [pathList];
        pathList.unshift(instrumentID);
        pathList.unshift('instruments');
        return this.replaceDataPath(pathList, paramValue);
    }

    deleteInstrumentParam(instrumentID, pathList) {
        instrumentID = parseInt(instrumentID);
        const instrumentList = this.songData.instruments;
        if(!instrumentList[instrumentID])
            throw new Error("Invalid instrument ID: " + instrumentID);

        if(!Array.isArray(pathList))
            pathList = [pathList];
        pathList.unshift(instrumentID);
        pathList.unshift('instruments');
        return this.deleteDataPath(pathList);
    }

    // replaceInstrumentParams(instrumentID, replaceParams) {
    //     const instrumentList = this.songData.instruments;
    //     if(!instrumentList[instrumentID])
    //         throw new Error("Invalid instrument ID: " + instrumentID);
    //
    //     const oldParams = {};
    //     for(const paramName in replaceParams) {
    //         if(replaceParams.hasOwnProperty(paramName)) {
    //             const paramValue = replaceParams[paramName];
    //             const oldData = this.replaceInstrumentParam(instrumentID, paramName, paramValue)
    //                 .oldData;
    //             if(typeof oldData !== "undefined")
    //                 oldParams[paramName] = oldData;
    //         }
    //     }
    //     return oldParams;
    // }


    isInstrumentLoaded(instrumentID) {
        return !!this.instruments.loaded[instrumentID];
    }


    /** Modifying **/

    applyHistoryActions(songHistory) {
        for(let i=0; i<songHistory.length; i++) {
            const historyAction = songHistory[i];
            switch(historyAction.action) {
                case 'reset':
                    Object.assign(this.songData, historyAction.data);
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
        this.songHistory = [];
        this.processAllInstructionData();
    }

    findDataPath(pathList) {
        if(!Array.isArray(pathList))
            throw new Error("Path list must be an array");
        if(pathList[0] === "*") {
            return {
                value: this.songData,
                parent: {key: this.songData},
                key: 'key'
            };
        }
        // const pathList = path.split('.');
        let value = this.songData, parent, key = null;
        for(let i=0; i<pathList.length; i++) {
            key = pathList[i];
            if(/^\d+$/.test(key)) {
                key = parseInt(key);
                // if(typeof target.length < targetPathPart)
                //     throw new Error(`Path is out of index: ${target.length} < ${targetPathPart} (Path: -${path}) `);
            } else {
                // if(typeof target[targetPathPart] === 'undefined')
                //     throw new Error("Path not found: " + path);
            }
            parent = value;
            value = value[key];
        }
        if(!parent)
            throw new Error("Invalid path: " + path);

        return {
            value: value,
            parent: parent,
            key: key
        };
    }

    insertDataPath(pathList, newData) {
        const pathInfo = this.findDataPath(pathList);

        newData = AudioSourceRenderer.sanitizeInput(newData);

        if(typeof pathInfo.key !== 'number')
            throw new Error("Insert action requires numeric key");
        if(pathInfo.parent.length < pathInfo.key)
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
        if(typeof pathInfo.key === 'number') {
            if(pathInfo.parent.length < pathInfo.key)
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
        if(typeof newData === 'undefined')
            return this.deleteDataPath(pathList);

        let oldData = null;
        newData = AudioSourceRenderer.sanitizeInput(newData);
        // if(typeof pathInfo.key === 'number' && pathInfo.parent.length < pathInfo.key)
        //     throw new Error(`Replace position out of index: ${pathInfo.parent.length} < ${pathInfo.key} for path: ${pathList}`);
        if(typeof pathInfo.parent[pathInfo.key] !== "undefined")
            oldData = pathInfo.parent[pathInfo.key];
        pathInfo.parent[pathInfo.key] = newData;

        this.queueHistoryAction(pathList, newData, oldData);
        return oldData;
    }

    queueHistoryAction(pathList, data=null, oldData=null) {
        const historyAction = [
            // action[0],
            pathList,
        ];
        if(data !== null || oldData !== null)
            historyAction.push(data);
        if(oldData !== null)
            historyAction.push(oldData);
        this.songHistory.push(historyAction);

        // setTimeout(() => {
            this.dispatchEvent(new CustomEvent('song:modified', {detail: historyAction}), 1);
        // }, 1);

        return historyAction;
    }

    insertInstructionAtPosition(groupName, insertPositionInTicks, insertInstructionData) {
        if(!insertInstructionData)
            throw new Error("Invalid insert instruction");
        const insertInstruction = SongInstruction.parse(insertInstructionData);
        let instructionList = this.songData.instructions[groupName];

        // let groupPosition = 0, lastDeltaInstructionIndex;

        const instructionIterator = new InstructionIterator(
            this.songData.instructions[groupName],
            groupName,
            this.getSongTimeDivision());

        let instruction;
        // noinspection JSAssignmentUsedAsCondition
        while(instruction = instructionIterator.nextInstruction()) {
            // const instruction = new SongInstruction(instructionList[i]);
            // if(instruction.deltaDuration > 0) {

                if(instructionIterator.groupPositionInTicks > insertPositionInTicks) {
                    // Delta note appears after note to be inserted
                    const splitDuration = [
                        insertPositionInTicks - (instructionIterator.groupPositionInTicks - instruction.deltaDuration),
                        instructionIterator.groupPositionInTicks - insertPositionInTicks
                    ];

                    const modifyIndex = instructionIterator.currentIndex;
                    // Make following delta note smaller
                    this.replaceInstructionDeltaDuration(groupName, modifyIndex, splitDuration[1]);

                    // Insert new note before delta note.
                    insertInstruction.deltaDuration = splitDuration[0];                     // Make new note equal the rest of the duration
                    this.insertInstructionAtIndex(groupName, modifyIndex, insertInstruction);

                    return modifyIndex; // this.splitPauseInstruction(groupName, i,insertPosition - groupPosition , insertInstruction);

                } else if(instructionIterator.groupPositionInTicks === insertPositionInTicks) {
                    // Delta note plays at the same time as new note, append after

                    let lastInsertIndex;
                    // Search for last insert position
                    for(lastInsertIndex=instructionIterator.currentIndex+1; lastInsertIndex<instructionList.length; lastInsertIndex++)
                        if(new SongInstruction(instructionList[lastInsertIndex]).deltaDuration > 0)
                            break;

                    insertInstruction.deltaDuration = 0; // TODO: is this correct?
                    this.insertInstructionAtIndex(groupName, lastInsertIndex, insertInstruction);
                    return lastInsertIndex;
                }
            // groupPosition += instruction.deltaDuration;
            // lastDeltaInstructionIndex = i;
            // }
        }

        if(instructionIterator.groupPositionInTicks >= insertPositionInTicks)
            throw new Error ("Something went wrong");
        // Insert a new pause at the end of the song, lasting until the new note
        let lastPauseIndex = instructionList.length;
        // this.insertInstructionAtIndex(groupName, lastPauseIndex, {
        //     command: '!pause',
        //     duration: insertPosition - groupPosition
        // });
        // Insert new note
        insertInstruction.deltaDuration = insertPositionInTicks - instructionIterator.groupPositionInTicks;
        this.insertInstructionAtIndex(groupName, lastPauseIndex, insertInstruction);
        return lastPauseIndex;
    }



    insertInstructionAtIndex(groupName, insertIndex, insertInstruction) {
        if(insertInstruction instanceof SongInstruction)
            insertInstruction = insertInstruction.data;
        if(!insertInstruction)
            throw new Error("Invalid insert instruction");
        this.insertDataPath(['instructions', groupName, insertIndex], insertInstruction);
    }


    deleteInstructionAtIndex(groupName, deleteIndex) {
        const deleteInstruction = this.getInstruction(groupName, deleteIndex);
        if(deleteInstruction.deltaDuration > 0) {
            const nextInstruction = this.getInstruction(groupName, deleteIndex+1);
            if(nextInstruction) {
                this.replaceInstructionDeltaDuration(groupName, deleteIndex+1, nextInstruction.deltaDuration + deleteInstruction.deltaDuration)
            }
        }
        return this.deleteDataPath(['instructions', groupName, deleteIndex]);
    }


    replaceInstructionDeltaDuration(groupName, replaceIndex, newDelta) {
        return this.replaceInstructionParam(groupName, replaceIndex, 0, newDelta);
    }
    replaceInstructionCommand(groupName, replaceIndex, newCommand) {
        return this.replaceInstructionParam(groupName, replaceIndex, 1, newCommand);
    }
    replaceInstructionInstrument(groupName, replaceIndex, instrumentID) {
        return this.replaceInstructionParam(groupName, replaceIndex, 2, instrumentID);
    }
    replaceInstructionDuration(groupName, replaceIndex, newDuration) {
        return this.replaceInstructionParam(groupName, replaceIndex, 3, newDuration);
    }
    replaceInstructionVelocity(groupName, replaceIndex, newVelocity) {
        if(!Number.isInteger(newVelocity))
            throw new Error("Velocity must be an integer: " + newVelocity);
        if(newVelocity < 0)
            throw new Error("Velocity must be a positive integer: " + newVelocity);
        return this.replaceInstructionParam(groupName, replaceIndex, 4, newVelocity);
    }
    replaceInstructionParam(groupName, replaceIndex, paramName, paramValue) {
        if(paramValue === null)
            return this.deleteDataPath(['instructions', groupName, replaceIndex, paramName]);
        return this.replaceDataPath(['instructions', groupName, replaceIndex, paramName], paramValue);
    }


    // replaceInstructionParams(groupName, replaceIndex, replaceParams) {
    //
    //     const oldParams = {};
    //     for(const paramName in replaceParams) {
    //         if(replaceParams.hasOwnProperty(paramName)) {
    //             const paramValue = replaceParams[paramName];
    //             const oldData = this.replaceInstructionParam(groupName, replaceIndex, paramName, paramValue);
    //             if(typeof oldData !== "undefined")
    //                 oldParams[paramName] = oldData;
    //         }
    //     }
    //     return oldParams;
    // }


    addInstructionGroup(newGroupName, instructionList) {
        if(this.songData.instructions.hasOwnProperty(newGroupName))
            throw new Error("New group already exists: " + newGroupName);
        this.replaceDataPath(['instructions', newGroupName], instructionList || []);
    }


    removeInstructionGroup(removeGroupName) {
        if(removeGroupName === 'root')
            throw new Error("Cannot remove root instruction group, n00b");
        if(!this.songData.instructions.hasOwnProperty(removeGroupName))
            throw new Error("Existing group not found: " + removeGroupName);

        return this.replaceDataPath(['instructions', removeGroupName]);
    }


    renameInstructionGroup(oldGroupName, newGroupName) {
        if(oldGroupName === 'root')
            throw new Error("Cannot rename root instruction group, n00b");
        if(!this.songData.instructions.hasOwnProperty(oldGroupName))
            throw new Error("Existing group not found: " + oldGroupName);
        if(this.songData.instructions.hasOwnProperty(newGroupName))
            throw new Error("New group already exists: " + newGroupName);

        const removedGroupData = this.replaceDataPath(['instructions', oldGroupName]);
        this.replaceDataPath(['instructions', newGroupName], removedGroupData);
    }


    // TODO: remove path
    static sanitizeInput(value) {
        if(Array.isArray(value)) {
            for(let i=0; i<value.length; i++)
                value[i] = AudioSourceRenderer.sanitizeInput(value[i]);
            return value;
        }
        if(typeof value === 'object') {
            for(const key in value)
                if(value.hasOwnProperty(key))
                    value[key] = AudioSourceRenderer.sanitizeInput(value[key]);
            return value;
        }
        if(typeof value !== 'string')
            return value;

        if(typeof require !== 'undefined') {
            var Filter = require('bad-words'),
                filter = new Filter();
            if(filter.isProfane(value))
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

        return value.replace(regex, function(c) {
            return ESC_MAP[c];
        });
    }


    // Input

    onInput(e) {
        if(e.defaultPrevented)
            return;
        switch(e.type) {
            case 'click':
                break;
        }
    }


}
AudioSourceRenderer.DEFAULT_VOLUME = 0.7;

class SongInstruction {
    constructor(instructionData) {
        this.data = instructionData || [0, '', 0];
        // this.playbackTime = null;
    }
    get deltaDuration() { return this.data[0]; }
    set deltaDuration(newDeltaDuration) {
        this.data[0] = SongInstruction.parseDurationAsTicks(newDeltaDuration);
    }
    get command()           { return this.data[1] || null; }
    set command(newCommand) { this.data[1] = newCommand; }
    get instrument()    { return typeof this.data[2] === "undefined" ? null : this.data[2]; }
    set instrument(newInstrumentID) {
        newInstrumentID = parseInt(newInstrumentID);
        if(Number.isNaN(newInstrumentID))
            throw new Error("Invalid Instrument ID");
        this.data[2] = newInstrumentID;
    }
    get duration()    { return typeof this.data[3] === "undefined" ? null : this.data[3]; }
    set duration(newDuration) {
        newDuration = parseFloat(newDuration);
        if(Number.isNaN(newDuration))
            throw new Error("Invalid Duration");
        this.data[3] = newDuration;
    }
    getDurationAsTicks(timeDivision) { return SongInstruction.parseDurationAsTicks(this.duration, timeDivision); }

    get velocity()    { return typeof this.data[4] === "undefined" ? null : this.data[4]; }
    set velocity(newVelocity) {
        newVelocity = parseInt(newVelocity);
        if(Number.isNaN(newVelocity))
            throw new Error("Invalid Velocity");
        this.data[4] = newVelocity;
    }
    get panning()    { return typeof this.data[5] === "undefined" ? null : this.data[5]; }
    set panning(newPanning) {
        newPanning = parseInt(newPanning);
        if(Number.isNaN(newPanning))
            throw new Error("Invalid Panning");
        this.data[5] = newPanning;
    }

    isGroupCommand()        { return this.command && this.command[0] === '@'; }

    getGroupFromCommand()   { return this.command.substr(1); }

    static parse(instruction) {
        if(instruction instanceof SongInstruction)
            return instruction;

        if (typeof instruction === 'number')
            instruction = [instruction]; // Single entry array means pause

        if (typeof instruction === 'string') {
            instruction = instruction.split(':');
            instruction[0] = parseFloat(instruction[0]);
            instruction[1] = parseInt(instruction[1])
        }

        if(typeof instruction[0] === 'string')
            instruction.unshift(0);

        return new SongInstruction(instruction);
    }

    static parseDurationAsTicks(durationString, timeDivision) {
        if(durationString === null || typeof durationString === 'number')
            return durationString;
        switch(durationString[durationString.length-1].toLowerCase()) {
            case 't':
                return parseInt(durationString.substr(0, durationString.length-1));
            case 'b':
                return timeDivision * parseInt(durationString.substr(0, durationString.length-1));
        }
        throw new Error("Invalid Duration: " + durationString);
    }
}

class InstructionIterator {
    constructor(instructionList, groupName, timeDivision, currentBPM=160, groupPositionInTicks=0) {
        this.instructionList = instructionList;
        this.groupName = groupName;
        this.timeDivision = timeDivision;
        this.currentBPM = currentBPM;
        this.groupPositionInTicks = groupPositionInTicks;
        this.groupPlaybackTime = 0;
        this.currentIndex = -1;
    }

    nextInstruction() {
        this.currentIndex++;
        if(!this.instructionList[this.currentIndex])
            return null;

        let instruction = new SongInstruction(this.instructionList[this.currentIndex]);
        if (instruction.deltaDuration) { // Delta
            this.groupPositionInTicks += instruction.deltaDuration;
            const elapsedTime = (instruction.deltaDuration / this.timeDivision) / (this.currentBPM / 60);
            this.groupPlaybackTime += elapsedTime;
        }

        return instruction;
    }

}