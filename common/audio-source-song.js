/**
 * Player requires a modern browser
 */

// TODO: refactor into Song class and Renderer

class AudioSourceSong {
    constructor(songData={}, dispatchElement=null) {
        this.dispatchElement = dispatchElement;

        this.audioContext = null;
        this.instruments = {
            loaded: [],
            class: {},
            classPromises: {},
            promises: {},
        };

        this.seekLength = 0.5;
        this.playbackPosition = 0;

        this.volumeGain = null;
        this.activeGroups = {};

        this.data = null;
        this.loadSongData(songData);
        // this.eventListeners = [];
        this.history = [];

        // Listen for instrument changes if in a browser
        if(typeof document !== "undefined")
            document.addEventListener('instrument:loaded', e => this.onSongEvent(e));

    }
    // addSongEventListener(callback) { this.eventListeners.push(callback); }
    // Check for initiated, await if not

    dispatchEvent(event) {
        if(this.dispatchElement)
            this.dispatchElement.dispatchEvent(event);
    }

    /** Rendering Context **/

    getAudioContext() {
        if(this.audioContext)
            return this.audioContext;

        this.audioContext = new (window.AudioContext||window.webkitAudioContext)();
        const n = this.audioContext.createGain(); // Bug fix
        // console.info("bug fix", n);
        // this.initAllInstruments(this.audioContext);
        return this.audioContext;
    }

    /** Data shortcuts **/

    get timeDivision() { return this.data.timeDivision; }
    get startingBeatsPerMinute() { return this.data.beatsPerMinute; }
    get rootGroup() {
        return this.data.root;
    }

    // get history() { return this.data.history; }
    // getGroupTimeDivision(groupName) { // Bad idea
    //     return this.timeDivision;
    // }


    /** Rendering Volume **/

    getVolumeGain() {
        if(!this.volumeGain) {
            const context = this.getAudioContext();
            let gain = context.createGain();
            gain.gain.value = AudioSourceSong.DEFAULT_VOLUME;
            gain.connect(context.destination);
            this.volumeGain = gain;
        }
        return this.volumeGain;
    }

    getVolumeValue () {
        return this.volumeGain ? this.volumeGain.gain.value * 100 : AudioSourceSong.DEFAULT_VOLUME * 100;
    }
    setVolume (volume) {
        const gain = this.getVolumeGain();
        if(gain.gain.value !== volume) {
            gain.gain.value = volume / 100;
            console.info("Setting volume: ", volume);
        }
    }


    /** Song Data **/


    async loadSongData(songData, songURL=null) {
        songData = Object.assign({}, {
            name: this.generateName(),
            guid: this.generateGUID(),
            version: '0.0.1',
            root: 'root',
            created: new Date().getTime(),
            timeDivision: 96*4,
            beatsPerMinute: 120,
            beatsPerMeasure: 4,
            instruments: [],
            instructions: {
                'root': []
            }
        }, songData);

        this.data = songData;

        // Process all instructions
        Object.keys(songData.instructions).map((groupName, i) =>
            this.processAllInstructionData(groupName));

        // let loadingInstruments = 0;

        await this.loadAllInstruments();

        this.dispatchEvent(new CustomEvent('song:loaded', {detail: this}));
    }


    loadSongHistory(songHistory) {
        this.history = songHistory;
    }

    /** Song Data Processing **/

    processAllInstructionData(groupName) {
        const instructionList = this.data.instructions[groupName];
        for(let i=0; i<instructionList.length; i++) {
            const instruction = instructionList[i];
            instructionList[i] = this.processInstructionData(instruction);
        }
    }

    processInstructionData(instructionData) {
        const instruction = SongInstruction.parse(instructionData);
        return instruction.data;
    }


    /** Instructions **/

    getInstructions(groupName, indicies=null) {
        let instructionList = this.data.instructions[groupName];
        if(!instructionList)
            throw new Error("Instruction group not found: " + groupName);
        if(indicies) {
            if(typeof indicies === "number")
                indicies = [indicies];
            instructionList = instructionList.filter((instruction, index) => indicies.indexOf(index) !== -1);
        }
        return instructionList
            .map(instructionData => new SongInstruction(instructionData))

        // TODO: iterator?
        // return new SelectedInstructionIterator(this, groupName, indicies);
    }

    getInstructionIndex(groupName, instruction) {
        if(instruction instanceof SongInstruction)
            instruction = instruction.data;
        const instructionList = this.data.instructions[groupName];
        const p = instructionList.indexOf(instruction);
        if(p === -1)
            throw new Error("Instruction not found in instruction list");
        return p;
    }

    getInstruction(groupName, index, throwException=true) {
        let instructionList = this.data.instructions[groupName];
        if(!Number.isInteger(index)) {
            if(throwException)
                throw new Error("Invalid Index: " + typeof index);
            return null;
        }

        if (index >= instructionList.length) {
            if(throwException)
                throw new Error(`Instruction index is greater than group length: ${index} >= ${instructionList.length} for groupName: ${groupName}`);
            return null;
        }
        if (!instructionList[index]) {
            if(throwException)
                throw new Error(`Instruction not found at index: ${index} for groupName: ${groupName}`);
            return null;
        }
        return new SongInstruction(instructionList[index], index);
    }

    getIterator(groupName, parentStats=null) {
        return new AudioSourceInstructionIterator(
            this,
            groupName,
            parentStats ? parentStats.currentBPM : this.startingBeatsPerMinute,
            parentStats ? parentStats.groupPositionInTicks : 0);
    }


    eachInstruction(groupName, callback, parentStats=null) {
        if(!this.data.instructions[groupName])
            throw new Error("Invalid group: " + groupName);
        const instructionIterator = this.getIterator(groupName, parentStats);

        let instruction = instructionIterator.nextInstruction();
        while(instruction) {
            const ret = callback(instructionIterator.groupIndex, instruction, instructionIterator);
            if(ret === false)
                break;
            instruction = instructionIterator.nextInstruction();
        }
        return instructionIterator.groupPlaybackTime;
    }


    // async eachInstructionAsync(groupName, callback, parentStats=null) {
    //     if(!this.data.instructions[groupName])
    //         throw new Error("Invalid group: " + groupName)
    //     const instructionIterator = new InstructionIterator(
    //         this.data.instructions[groupName],
    //         groupName,
    //         parentStats ? parentStats.timeDivision : this.timeDivision,
    //         parentStats ? parentStats.currentBPM : this.startingBeatsPerMinute,
    //         parentStats ? parentStats.groupPositionInTicks : 0);
    //     let instruction = instructionIterator.nextInstruction();
    //     while(instruction) {
    //         const ret = await callback(instructionIterator.groupIndex, instruction, instructionIterator);
    //         if(ret === false)
    //             break;
    //         instruction = instructionIterator.nextInstruction();
    //     }
    //     return instructionIterator.groupPlaybackTime;
    // }




    /** Song Timing **/

    getSongLength() {
        return this.getGroupLength(this.rootGroup);
    }

    getGroupLength(groupName) {
        const instructionIterator = this.getIterator(groupName);
        let instruction;
        while(instruction = instructionIterator.nextInstruction()) {}
        return instructionIterator.groupPlaybackTime;
    }


    getSongPositionFromTicks(songPositionInTicks) {
        return this.getGroupPositionFromTicks(this.rootGroup, songPositionInTicks);
    }

    getGroupPositionFromTicks(groupName, groupPositionInTicks) {
        let lastStats = null;
        this.eachInstruction(groupName, (index, instruction, stats) => {
            lastStats = stats;
            if(stats.groupPositionInTicks >= groupPositionInTicks)
                return false;
        });

        if(!lastStats)
            return 0;
        let currentPosition = lastStats.groupPlaybackTime;

        if(groupPositionInTicks > lastStats.groupPositionInTicks) {
            const elapsedTicks = groupPositionInTicks - lastStats.groupPositionInTicks;
            currentPosition += this.ticksToSeconds(elapsedTicks, lastStats.currentBPM);

        } else if(groupPositionInTicks < lastStats.groupPositionInTicks) {
            const elapsedTicks = lastStats.groupPositionInTicks - groupPositionInTicks;
            currentPosition -= this.ticksToSeconds(elapsedTicks, lastStats.currentBPM);
        }

        // console.info("getGroupPositionFromTicks", groupPositionInTicks, currentPosition);
        return currentPosition;
    }


    getSongPositionInTicks(positionInSeconds) {
        return this.getGroupPositionInTicks(this.rootGroup, positionInSeconds);
    }



    getGroupPositionInTicks(groupName, positionInSeconds) {
        let lastStats = null;
        this.eachInstruction(groupName, (index, instruction, stats) => {
            lastStats = stats;
            if(stats.groupPlaybackTime >= positionInSeconds)
                return false;
        });

        if(!lastStats)
            return 0;

        let currentPositionInTicks = lastStats.groupPositionInTicks;
        if(positionInSeconds > lastStats.groupPlaybackTime) {
            const elapsedTime = positionInSeconds - lastStats.groupPlaybackTime;
            currentPositionInTicks += this.secondsToTicks(elapsedTime, lastStats.currentBPM);

        } else if(positionInSeconds < lastStats.groupPlaybackTime) {
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

    async play () {
        if(this.playback) {
            this.stopPlayback();
            this.setPlaybackPosition(0);
            // throw new Error("Song is already playing");
        }

        await this.initAllInstruments(this.getAudioContext());

        const playback = new AudioSourceInstructionPlayback(this, this.rootGroup, this.getAudioContext().currentTime - this.playbackPosition);
        this.playback = playback;
        console.log("Start playback:", this.playbackPosition);

        this.dispatchEvent(new CustomEvent('song:play', {detail:{
            playback:this.playback,
        }}));

        await this.playback.playGroup();

        this.dispatchEvent(new CustomEvent('song:end', {detail:{
            playback:this.playback
        }}));


        if(playback.isPlaybackActive)
            playback.stopPlayback();

        // if(this.playback)
        //     this.stopPlayback();


    }

    stopPlayback() {
        if(!this.playback)
            throw new Error("Playback is already stopped");
        this.playbackPosition = this.getAudioContext().currentTime - this.playback.startTime;
        this.playback.stopPlayback();
        this.playback = null;
        console.log("End playback:", this.playbackPosition);
    }

    get isPlaying() {
        return !!this.playback;
    }

    get songPlaybackPosition() {
        if(this.playback)
            return this.getAudioContext().currentTime - this.playback.startTime;
        return this.playbackPosition;
    }


    setPlaybackPositionInTicks(songPositionInTicks) {
        if(!Number.isInteger(songPositionInTicks))
            throw new Error("Invalid start position in ticks");
        // TODO: is start position beyond song's ending?

        const playbackPosition = this.getSongPositionFromTicks(songPositionInTicks);
        return this.setPlaybackPosition(playbackPosition);
    }

    setPlaybackPosition(songPosition) {
        songPosition = parseFloat(songPosition);
        if(Number.isNaN(songPosition))
            throw new Error("Invalid start position");

        this.playbackPosition = songPosition;
        const positionInTicks = this.getSongPositionInTicks(this.playbackPosition);
        console.log("Seek position: ", this.playbackPosition, positionInTicks);

        const detail = {
            position: this.playbackPosition,
            positionInTicks
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





    playInstructionAtIndex(groupName, instructionIndex, noteStartTime=null) {
        const instruction = this.getInstruction(groupName, instructionIndex, false);
        if(instruction) 
            this.playInstruction(instruction, noteStartTime);
        else 
            console.warn("No instruction at index");
    }

    async playInstruction(instruction, noteStartTime=null) {
        if(!instruction instanceof SongInstruction)
            throw new Error("Invalid instruction");

        if(instruction.isGroupCommand()) {
            if(this.playback)
                this.playback.stopPlayback();
            this.playback = new AudioSourceInstructionPlayback(this);
            return await this.playback.playInstructions(instruction.getGroupFromCommand(), noteStartTime);
        }


        let bpm = this.startingBeatsPerMinute;
        // const noteDuration = (instruction.duration || 1) * (60 / bpm);
        let timeDivision = this.timeDivision;
        const noteDurationInTicks = instruction.getDurationAsTicks(timeDivision);
        const noteDuration = (noteDurationInTicks / timeDivision) / (bpm / 60);

        let currentTime = this.getAudioContext().currentTime;

        if(!noteStartTime && noteStartTime !== 0)
            noteStartTime = currentTime;


        this.playInstrument(instruction.instrument, instruction.command, noteStartTime, noteDuration, instruction.velocity);
        // Wait for note to start
        if(noteStartTime > currentTime) {
            setTimeout(() => {
                // Dispatch note start event
                this.dispatchEvent(new CustomEvent('note:start', {detail:{
                        instruction,
                    }}));
            }, (noteStartTime - this.getAudioContext().currentTime) * 1000);
            if(noteDuration) {
                setTimeout(() => {
                    // Dispatch note end event
                    this.dispatchEvent(new CustomEvent('note:end', {detail:{
                            instruction,
                        }}));
                }, (noteStartTime + noteDuration - this.getAudioContext().currentTime) * 1000);
            }
        }


    }



    /** Instrument Events **/

    onSongEvent(e) {
//         console.log(e.type);
        switch(e.type) {
            case 'instrument:loaded':
                const instrumentClass = e.detail.class;
                const instrumentClassURL = e.detail.url;
                this.instruments.class[instrumentClassURL] = instrumentClass;
                this.loadAllInstruments();
                break;
        }
    }


    /** Instruments **/


    isInstrumentLoaded(instrumentID) {
        return !!this.instruments.loaded[instrumentID];
    }

    async playInstrument(instrumentID, noteFrequency, noteStartTime, noteDuration, noteVelocity) {
        if(!instrumentID && instrumentID !== 0) {
            console.warn("No instrument set for instruction. Using instrument 0");
            instrumentID = 0;
            // return;
        }
        if(!this.data.instruments[instrumentID]) {
            console.error(`Instrument ${instrumentID} is not loaded. Playback skipped. `);
            return;
        }
        let instrument = this.getInstrument(instrumentID);
        const destination = this.getVolumeGain();
        return await instrument.play(destination, noteFrequency, noteStartTime, noteDuration, noteVelocity);
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
        return this.data.instruments.slice();
    }


    async loadInstrumentClass(instrumentClassURL) {
        instrumentClassURL = new URL(instrumentClassURL) + '';
        // const instrumentClassFile = new URL(instrumentClassURL).pathname.split('/').pop();

        let instrumentClass = this.instruments.class[instrumentClassURL];
        if(instrumentClass)
            return instrumentClass;

        const newScriptElm = document.createElement('script');
        newScriptElm.src = instrumentClassURL;

        const scriptLoadPromise = new Promise((resolve, reject) => {
            newScriptElm.onload = resolve;
            newScriptElm.onerror = (e) => {
                newScriptElm.parentNode.removeChild(newScriptElm);
                reject("Error loading: " + instrumentClassURL);
            };
        });


        document.head.appendChild(newScriptElm);

        await scriptLoadPromise;

        if (!this.instruments.class[instrumentClassURL])
            throw new Error("Failed to load instrument class: " + instrumentClassURL);

        return this.instruments.class[instrumentClassURL];
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

        const instrumentClass = await this.loadInstrumentClass(instrumentClassURL);

        const instance = new instrumentClass(instrumentPreset, this, instrumentID); //, this.getAudioContext());
        this.instruments.loaded[instrumentID] = instance;
        this.dispatchEvent(new CustomEvent('instrument:instance', {
            detail: {
                instance,
                instrumentID
            },
            bubbles: true
        }));

        if(this.audioContext)
            await this.initInstrument(instrumentID, this.audioContext);

        return true;
    }

    async loadAllInstruments() {
        const instrumentList = this.getInstrumentList();
        for(let instrumentID=0; instrumentID<instrumentList.length; instrumentID++) {
            if(instrumentList[instrumentID]) {
                console.info("Loading instrument: " + instrumentID, instrumentList[instrumentID]);
                await this.loadInstrument(instrumentID);
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

    getName()                  { return this.data.name; }
    setName(newSongTitle)      { return this.replaceDataPath(['name'], newSongTitle); }
    getVersion()               { return this.data.version; }
    setVersion(newSongTitle)   { return this.replaceDataPath(['version'], newSongTitle); }

    addInstrument(config) {
        if(typeof config !== 'object')
            config = {
                url: config
            };
        if(!config.url)
            throw new Error("Invalid Instrument URL");
        // config.url = config.url;

        const instrumentList = this.data.instruments;
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

    async replaceInstrument(instrumentID, config) {
        const instrumentList = this.data.instruments;
        // if(instrumentList.length < instrumentID)
        //     throw new Error("Invalid instrument ID: " + instrumentID);
        let oldConfig = instrumentList[instrumentID] || {};
        if(typeof config !== 'object')
            config = {
                url: config
            };
        if(oldConfig && oldConfig.name && !config.name)
            config.name = oldConfig.name;
        // Preserve old instrument name
        oldConfig = this.replaceDataPath(['instruments', instrumentID], config);
        this.dispatchEvent(new CustomEvent('instrument:modified', {bubbles: true, detail: {
            instrumentID,
            config,
            oldConfig
        }}), 1);
        return oldConfig;
    }

    removeInstrument(instrumentID) {
        const instrumentList = this.data.instruments;
        if(!instrumentList[instrumentID])
            throw new Error("Invalid instrument ID: " + instrumentID);
        // if(instrumentList.length === instrumentID) {
        //
        // }
        delete this.instruments.loaded[instrumentID];
        const oldConfig =  this.deleteDataPath(['instruments', instrumentID]);
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
        const instrumentList = this.data.instruments;
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
        const instrumentList = this.data.instruments;
        if(!instrumentList[instrumentID])
            throw new Error("Invalid instrument ID: " + instrumentID);

        if(!Array.isArray(pathList))
            pathList = [pathList];
        pathList.unshift(instrumentID);
        pathList.unshift('instruments');
        return this.deleteDataPath(pathList);
    }

    setInstrumentName(instrumentID, newInstrumentName) {
        return this.replaceInstrumentParam(instrumentID, 'name', newInstrumentName);
    }


    generateName() {
        return `Untitled (${new Date().toJSON().slice(0, 10).replace(/-/g, '/')})`;
    }

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
        const songData = this.data;
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


    findDataPath(pathList) {
        if(!Array.isArray(pathList))
            throw new Error("Path list must be an array");
        if(pathList[0] === "*") {
            return {
                value: this.data,
                parent: {key: this.data},
                key: 'key'
            };
        }
        // const pathList = path.split('.');
        let value = this.data, parent, key = null;
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
            if(typeof value === "undefined")
                throw new Error("Invalid path key: " + key);
            value = value[key];
        }
        if(!parent)
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
        newData = AudioSourceSong.sanitizeInput(newData);
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
        this.history.push(historyAction);

        // setTimeout(() => {
            this.dispatchEvent(new CustomEvent('song:modified', {detail: historyAction}), 1);
        // }, 1);

        return historyAction;
    }

    insertInstructionAtPosition(groupName, insertPositionInTicks, insertInstructionData) {
        if(typeof insertPositionInTicks === 'string')
            insertPositionInTicks = SongInstruction.parseDurationAsTicks(insertPositionInTicks, this.timeDivision);

        if(!Number.isInteger(insertPositionInTicks))
            throw new Error("Invalid integer: " + typeof insertPositionInTicks);
        if(!insertInstructionData)
            throw new Error("Invalid insert instruction");
        const insertInstruction = SongInstruction.parse(insertInstructionData);
        let instructionList = this.data.instructions[groupName];

        // let groupPosition = 0, lastDeltaInstructionIndex;

        const instructionIterator = this.getIterator(groupName);

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

                    const modifyIndex = instructionIterator.groupIndex;
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
                    for(lastInsertIndex=instructionIterator.groupIndex+1; lastInsertIndex<instructionList.length; lastInsertIndex++)
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



    insertInstructionAtIndex(groupName, insertIndex, insertInstructionData) {
        if(!insertInstructionData)
            throw new Error("Invalid insert instruction");
        let insertInstruction = SongInstruction.parse(insertInstructionData);
        insertInstructionData = insertInstruction.data;
        this.insertDataPath(['instructions', groupName, insertIndex], insertInstructionData);
    }


    deleteInstructionAtIndex(groupName, deleteIndex) {
        const deleteInstruction = this.getInstruction(groupName, deleteIndex);
        if(deleteInstruction.deltaDuration > 0) {
            const nextInstruction = this.getInstruction(groupName, deleteIndex+1, false);
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
        if(this.data.instructions.hasOwnProperty(newGroupName))
            throw new Error("New group already exists: " + newGroupName);
        this.replaceDataPath(['instructions', newGroupName], instructionList || []);
    }


    removeInstructionGroup(removeGroupName) {
        if(removeGroupName === 'root')
            throw new Error("Cannot remove root instruction group, n00b");
        if(!this.data.instructions.hasOwnProperty(removeGroupName))
            throw new Error("Existing group not found: " + removeGroupName);

        return this.replaceDataPath(['instructions', removeGroupName]);
    }


    renameInstructionGroup(oldGroupName, newGroupName) {
        if(oldGroupName === 'root')
            throw new Error("Cannot rename root instruction group, n00b");
        if(!this.data.instructions.hasOwnProperty(oldGroupName))
            throw new Error("Existing group not found: " + oldGroupName);
        if(this.data.instructions.hasOwnProperty(newGroupName))
            throw new Error("New group already exists: " + newGroupName);

        const removedGroupData = this.replaceDataPath(['instructions', oldGroupName]);
        this.replaceDataPath(['instructions', newGroupName], removedGroupData);
    }



    /** History **/

    applyHistoryActions(songHistory) {
        for(let i=0; i<songHistory.length; i++) {
            const historyAction = songHistory[i];
            switch(historyAction.action) {
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
        this.processAllInstructionData();
    }

    // TODO: remove path
    static sanitizeInput(value) {
        if(Array.isArray(value)) {
            for(let i=0; i<value.length; i++)
                value[i] = AudioSourceSong.sanitizeInput(value[i]);
            return value;
        }
        if(typeof value === 'object') {
            for(const key in value)
                if(value.hasOwnProperty(key))
                    value[key] = AudioSourceSong.sanitizeInput(value[key]);
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
AudioSourceSong.DEFAULT_VOLUME = 0.7;

class AudioSourceInstructionPlayback {
    constructor(song, groupName, startTime=null, seekLength=1) {
        startTime = startTime || song.getAudioContext().currentTime;

        this.song = song;
        this.groupName = groupName;
        this.seekLength = seekLength; //TODO: implement?
        this.iterator = null;
        this.subGroups = [];
        this.startTime = startTime;
        // this.lastRowPlaybackTime = 0;
        this.quantizationInTicks = song.timeDivision;
        // this.activeGroups =
    }

    get groupPositionInTicks() { return this.iterator.groupPositionInTicks; }

    get isPlaybackActive() {
        return !!this.iterator;
    }

    async playGroup() {
        const iterator = this.song.getIterator(this.groupName);
        this.iterator = iterator;
        this.song.dispatchEvent(new CustomEvent('group:play', {detail:{
            playback:this,
            iterator
        }}));
        while(this.isPlaybackActive) {
            await this.playNextInstructionRow();
        }

        // if(this.iterator) never happens
        //     this.stopPlayback(false);

        this.song.dispatchEvent(new CustomEvent('group:end', {detail:{
            playback:this,
            iterator
        }}));


        let elapsedTime = this.song.getAudioContext().currentTime - this.startTime;
        console.info("Group finished: ", this.groupName, elapsedTime);
    }


    stopPlayback(stopInstruments=true) {

        const iterator = this.iterator;
        this.iterator = null;
        // If we reached the end of the iterator, trigger event
        this.song.dispatchEvent(new CustomEvent('group:stop', {detail:{
            playback:this,
            iterator
        }}));

        if(stopInstruments) {
            // Stop all instrument playback (if supported)
            const instrumentList = this.song.getInstrumentList();
            for (let instrumentID = 0; instrumentID < instrumentList.length; instrumentID++) {
                const instrument = this.song.getInstrument(instrumentID, false);
                if (instrument && instrument.stopPlayback)
                    instrument.stopPlayback();
            }
        }

        // Stop subgroups
        this.subGroups.forEach(playback => playback.stopPlayback(stopInstruments));
    }

    async playNextInstructionRow() {
        if(!this.isPlaybackActive)
            throw new Error("Playback is not active");

        const instructionList = this.iterator.nextInstructionQuantizedRow(this.quantizationInTicks);
        if(this.iterator.hasReachedEnd) {
            // If there's no next instruction, end playback.
            this.stopPlayback(false);
            return 0;
        }

        const audioContext = this.song.getAudioContext();
        const notePosition = this.startTime + this.iterator.groupPlaybackTime;
        const waitTime = (notePosition - audioContext.currentTime); //  - this.seekLength;
//         console.log(this.iterator.groupPositionInTicks, instructionList, this.iterator.groupIndex);

        // Wait ahead of notes if necessary (by seek time)
        if(waitTime > 0) {
            // console.log("Waiting ... " + waitTime, notePosition, this.iterator.groupPlaybackTime, audioContext.currentTime);
            await new Promise((resolve, reject) => setTimeout(resolve, waitTime * 1000));
        }
        if(!this.isPlaybackActive)
            return;



        for(let i=0; i<instructionList.length; i++) {
            const instruction = instructionList[i];
            if(instruction.isGroupCommand()) {
                let subGroupName = instruction.getGroupFromCommand();
                if (subGroupName === this.iterator.groupName) { // TODO group stack
                    console.error("Recursive group call. Skipping group '" + subGroupName + "'");
                    return;
                }

                const groupPlayback = new AudioSourceInstructionPlayback(this.song, subGroupName, notePosition);
                this.subGroups.push(groupPlayback);
                groupPlayback.playGroup();

            } else {
                this.song.playInstruction(instruction, notePosition);
            }
        }

        const detail = {
            position: this.iterator.groupPlaybackTime,
            positionInTicks: this.iterator.groupPositionInTicks
        };
        this.song.dispatchEvent(new CustomEvent('group:seek', {detail}));
        // console.info('playNextInstructionRow', this.startTime, waitTime, this.iterator.groupPlaybackTime, instructionList); // audioContext.currentTime, waitTime, instructionList);


        // return rowDuration;
    }

}


class AudioSourceInstructionIterator {
    constructor(song, groupName, currentBPM=null, groupPositionInTicks=0) {
        if(!song.data.instructions[groupName])
            throw new Error("Song group not found: " + groupName);

        this.song = song;
        this.groupName = groupName;
        this.currentBPM = currentBPM || song.startingBeatsPerMinute;
        // this.lastRowPositionInTicks = 0;
        // this.lastRowPlaybackTime = 0;
        this.groupPositionInTicks = groupPositionInTicks;
        this.lastInstructionGroupPositionInTicks = groupPositionInTicks;
        this.groupPlaybackTime = 0;
        this.lastInstructionGroupPlaybacktime = 0;

        this.groupIndex = -1;

        this.nextQuantizationBreakInTicks = 0;


        // this.lastRowPositionInTicks = null;
        // this.lastRowIndex = 0;
    }

    get hasReachedEnd() {
        return typeof this.instructionList[this.groupIndex+1] === "undefined";
    }
    get instructionList() {
        return this.song.data.instructions[this.groupName];
    }

    getInstruction(index, throwException=true) {
        const data = this.instructionList[index];
        if(!data) {
            if(throwException)
                throw new Error("");
            return null;
        }
        const instruction = new SongInstruction(data);
        instruction.index = index;
        instruction.positionInTicks = this.groupPositionInTicks;
        return instruction;
    }

    currentInstruction() {
        const index = this.groupIndex === -1 ? 0 : this.groupIndex;
        return this.getInstruction(index, false);
    }

    nextInstruction() {
        if(this.hasReachedEnd) {
            // this.lastRowPositionInTicks = this.groupPositionInTicks;
            return null;
        }
        this.groupIndex++;

        const data = this.instructionList[this.groupIndex];
        const nextInstruction = new SongInstruction(data);
        if (nextInstruction.deltaDuration) {
            // this.lastRowPositionInTicks = this.groupPositionInTicks;
            this.groupPositionInTicks = this.lastInstructionGroupPositionInTicks + nextInstruction.deltaDuration;
            this.lastInstructionGroupPositionInTicks = this.groupPositionInTicks; // TODO: Hack.

            const elapsedTime = (nextInstruction.deltaDuration / this.song.timeDivision) / (this.currentBPM / 60);
            // this.lastRowPlaybackTime = this.groupPlaybackTime;
            this.groupPlaybackTime = this.lastInstructionGroupPlaybacktime + elapsedTime;
            this.lastInstructionGroupPlaybacktime = this.groupPlaybackTime; // TODO: Hack.
        }

        return this.getInstruction(this.groupIndex);
    }


    nextInstructionRow(filterByInstrumentID = null) {

        let currentInstruction = this.nextInstruction();
        if(!currentInstruction)
            return null;

        let currentRowInstructionList = [];
        if(currentInstruction)
            currentRowInstructionList.push(currentInstruction);

        while(true) {
            let nextInstruction = this.getInstruction(this.groupIndex+1, false);

            if (!nextInstruction) {
                // If we found end of the group, we're done
                break;
            }
            if (nextInstruction.deltaDuration) {
                // If the next instruction has a delta, then we found the end of the current row
                break;
            }
            // If not, add it to the list and check the next instruction
            nextInstruction = this.nextInstruction();
            currentRowInstructionList.push(nextInstruction);
        }

        if(filterByInstrumentID !== null)
            currentRowInstructionList = currentRowInstructionList.filter(inst => inst.instrument === filterByInstrumentID);

        return currentRowInstructionList;
        // throw new Error("Recursion limit");
    }

    nextInstructionQuantizedRow(quantizationInTicks, filterByInstrumentID = null) {
        if(!quantizationInTicks)
            throw new Error("Invalid Quantization value: " + typeof quantizationInTicks);
        let nextInstruction = this.getInstruction(this.groupIndex+1, false);

        if (!nextInstruction) {
            // If we found end of the group, we're done
            return null;
        }

        // Calculate the next instruction position
        let nextInstructionPositionInTicks = this.lastInstructionGroupPositionInTicks + nextInstruction.deltaDuration;

        // Calculate next break position after the last rendered position
        // let nextBreakPositionInTicks = Math.ceil(this.groupPositionInTicks / quantizationInTicks) * quantizationInTicks + quantizationInTicks;


        if(this.groupIndex !== -1) {
            while (this.nextQuantizationBreakInTicks <= this.groupPositionInTicks)
                this.nextQuantizationBreakInTicks += quantizationInTicks;
        }


        // If the next rendered position is greater than the next break position
        if(
            nextInstructionPositionInTicks > this.nextQuantizationBreakInTicks
        ) {
            // console.info("Q row:", nextInstructionPositionInTicks, '>', nextBreakPositionInTicks);

            // Set the last rendered position as the next break position
            const elapsedTimeInTicks = this.nextQuantizationBreakInTicks - this.groupPositionInTicks; // nextInstructionPositionInTicks - nextBreakPositionInTicks;
            this.groupPositionInTicks = this.nextQuantizationBreakInTicks;
            const elapsedTimeInSeconds = (elapsedTimeInTicks / this.song.timeDivision) / (this.currentBPM / 60);
            this.groupPlaybackTime += elapsedTimeInSeconds;

            this.nextQuantizationBreakInTicks += quantizationInTicks;

            // Return an empty row
            return [];
        }

        return this.nextInstructionRow(filterByInstrumentID);
        // if(rowLengthInTicks )
        // keep track of tick position

    }

    *[Symbol.iterator] () {
        // const instructionList = this.instructionList;
        let instruction;
        while(instruction = this.nextInstruction()) {
            yield instruction;
        }
    }
}



class SongInstruction {
    constructor(instructionData, index=null, positionInTicks=null) {
        this.data = instructionData || [0, '', 0];
        this.index = index;
        this.positionInTicks = positionInTicks;
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

        else if (typeof instruction === 'string') {
            instruction = instruction.split(':');
            // instruction[0] = parseFloat(instruction[0]);
            if(instruction.length >= 2) {
                instruction[1] = parseInt(instruction[1])
            }
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
                return timeDivision * parseFloat(durationString.substr(0, durationString.length-1));
        }
        throw new Error("Invalid Duration: " + durationString);
    }
}



// NodeJS Support
if(typeof module !== "undefined") {

    module.exports = {
        AudioSourceSong,
        AudioSourceInstructionIterator,
        // AudioSourceInstructionRowIterator,
        AudioSourceInstructionPlayback
    };

}

if(typeof global !== 'undefined') {

    if(typeof global.CustomEvent === "undefined") {
        class CustomEvent {
            constructor(name, data) {

            }
        }

        global.CustomEvent = CustomEvent;
    }
}







