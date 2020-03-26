import InstrumentLoader from "./instrument/InstrumentLoader";
import Values from "./Values";

import Storage from "./Storage";
import GMESongFile from "./file/GMESongFile";
import JSONSongFile from "./file/JSONSongFile";
import FileService from "./file/FileService";
import {ConfigListener} from "./config/ConfigListener";
import {Instruction, GroupInstruction, InstructionList, InstructionIterator, InstructionPlayback} from "./instruction/";


import InstrumentList from "../instruments";
InstrumentList.addAllInstruments();
// const DEFAULT_INSTRUMENT_CLASS = 'PolyphonyInstrument';

class Song {
    constructor(audioContext=null, songData={}) {
        this.audioContext = audioContext; //  || new (window.AudioContext || window.webkitAudioContext)();

        this.eventListeners = [];
        this.instruments = [];

        this.playback = null;
        // this.playbackPosition = 0;
        // this.isPaused = false;
        // this.volume = Song.DEFAULT_VOLUME;

        // this.activeGroups = {};

        // this.getData = function() { return data; }
        const data = {
            title: Song.generateTitle(),
            uuid: Song.generateUUID(),
            version: '0.0.1',
            created: new Date().getTime(),
            timeDivision: 96 * 4,
            bpm: 120,
            // beatsPerMeasure: 4,
            startGroup: 'root',
            instruments: [
                [
                    'PolyphonyInstrument', {
                        voices: [
                            [
                                'OscillatorNodeInstrument', {
                                    type: 'sawtooth'
                                }
                            ],
                            ['OscillatorNodeInstrument',{type: 'sawtooth'}],
                        ]
                    }
                ],
                ['OscillatorNodeInstrument',{type: 'square'}],
            ],
            instructions: {
                'root': [
                    ['@track0', 0, 128],
                    ['@track1', 1],
                ],
                'track0': [
                    [0, 'C4'],
                    [64, 'D4'],
                    [64, 'E4'],
                    [64, 'F4', 48, 50],
                    [64, 9, 34],
                    [64, 8, 34],
                ],
                'track1': [
                    [0, 'C4'],
                    [96, 'D4'],
                    [96, 'E4'],
                    [96, 'F4', 48, 50],
                ]
            }
        };

        this.getProxiedData = function() { return data; };
        this.data = new Proxy(data, new ConfigListener(this));
        this.history = [];
        // this.waitCancels = [];
        // this.playbackEndCallbacks = [];
        this.values = new Values(this);

        this.loadSongData(songData);
        this.loadAllInstruments();
    }

    connect(destination) {
        this.destination = destination;
    }

    /** Events and Listeners **/

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
            if(eventName === eventName2 && listenerCallback === listenerCallback2) {
                this.eventListeners.splice(i, 1);
                break;
            }
        }
    }

    /** Initialization **/

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
        const data = this.getProxiedData();

        if (this.playback)
            this.stopPlayback();
        Object.assign(data, songData);

        // this.data = songData;
        this.playbackPosition = 0;

        // Process all instructions
        Object.keys(data.instructions).forEach((groupName, i) =>
            new InstructionList(data.instructions[groupName]).processInstructions());

        // let loadingInstruments = 0;

        // console.log("Song data loaded: ", songData);

        this.dispatchEvent({
            type: 'song:loaded',
            song: this
        });
    }


    loadSongHistory(songHistory) {
        this.history = songHistory;
    }

    /** Song Data Processing **/

    instructionProcessGroupData(groupName) {
        const instructionList = this.instructionGetList(groupName);
        for (let i = 0; i < instructionList.length; i++) {
            const instruction = InstructionList.parseInstruction(instructionList[i]);
            instructionList[i] = instruction.data;
        }
    }


    /** Instrument Groups **/

    getStartGroup() {
        return typeof this.data.startGroup === "undefined"
            ? this.data.startGroup
            : Object.keys(this.data.instructions)[0];
    }

    hasGroup(groupName) {
        return typeof this.data.instructions[groupName] !== "undefined";
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


    /** Context **/
    // get history() { return this.data.history; }
    // getGroupTimeDivision(groupName) { // Bad idea
    //     return this.timeDivision;
    // }


    /** Rendering Volume **/

    // getVolumeGain() {
    //     if (!this.volumeGain) {
    //         const context = this.getAudioContext();
    //         let gain = context.createGain();
    //         gain.gain.value = this.volume; // Song.DEFAULT_VOLUME;
    //         gain.connect(context.destination);
    //         this.volumeGain = gain;
    //     }
    //     return this.volumeGain;
    // }

    /** @deprecated **/
    // getVolumeValue() {
    //     return this.volume; // this.volumeGain ? this.volumeGain.gain.value * 100 : Song.DEFAULT_VOLUME * 100;
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


    /** Instruments **/


    isInstrumentLoaded(instrumentID) {
        return !!this.instruments[instrumentID];
    }

    playInstrument(instrumentID, noteFrequency, noteStartTime, noteDuration, noteVelocity, onended=null) {
        if (!instrumentID && instrumentID !== 0) {
            console.warn("No instruments set for instruction. Using instruments 0");
            instrumentID = 0;
            // return;
        }
        if (!this.instruments[instrumentID]) {
            console.error(`Instrument ${instrumentID} is not loaded. Playback skipped. `);
            return;
        }
        let instrument = this.instruments[instrumentID];
        // return await instrument.play(destination, noteFrequency, noteStartTime, noteDuration, noteVelocity);
        return instrument.playNote(this.destination, noteFrequency, noteStartTime, noteDuration, noteVelocity, onended)
    }

    hasInstrument(instrumentID) {
        const instrumentList = this.data.instruments;
        // console.log('hasInstrument', instrumentList[instrumentID], !!instrumentList[instrumentID])
        return !!instrumentList[instrumentID];
    }

    /** @deprecated **/
    getInstrumentConfig(instrumentID) {
        const instrumentList = this.data.instruments;
        if (!instrumentList[instrumentID])
            throw new Error("Instrument ID not found: " + instrumentID);
        return instrumentList[instrumentID][0];
    }


    getInstrumentList() {
        return this.data.instruments;
    }

    /** @deprecated **/
    getInstrument(instrumentID) {
        if (this.instruments[instrumentID])
            return this.instruments[instrumentID];
        throw new Error("Instrument not yet loading: " + instrumentID);
    }


    unloadInstrument(instrumentID) {
        // TODO:
    }

    loadAllInstruments(forceReload = false) {
        const instrumentList = this.data.instruments;
        for (let instrumentID = 0; instrumentID < instrumentList.length; instrumentID++) {
            if (instrumentList[instrumentID]) {
//                 console.info("Loading instruments: " + instrumentID, instrumentList[instrumentID]);
                this.loadInstrument(instrumentID, forceReload);
            }
        }
    }


    loadInstrument(instrumentID, forceReload = false) {
        // instrumentID = parseInt(instrumentID);
        if (!forceReload && this.instruments[instrumentID])
            return this.instruments[instrumentID];

        const instrument = this.loadInstrumentInstance(instrumentID);
        // if (typeof instrument.init !== "function")
        //     throw new Error("Instrument has no 'init' method: " + instrument.constructor.name);
        this.instruments[instrumentID] = instrument;

        this.dispatchEvent({
            type: 'instruments:instance',
            instrument,
            instrumentID,
            song: this
        });

        // if (this.audioContext)
        //     instrument.init(instrumentID, this.audioContext);

//             console.info("Instrument loaded: ", instance, instrumentID);
        return instrument;
    }


    loadInstrumentInstance(instrumentID) {
        const [className, config] = this.data.instruments[instrumentID];
        if (!className)
            throw new Error("Invalid instruments class");

        const {classInstrument} = InstrumentLoader.getInstrumentClass(className);
        return new classInstrument(config);
    }


    // updateInstrument(instrumentID, config, subPath=[]) {
    //     return this.updateDataByPath(['instruments', instrumentID].concat(subPath), config);
    // }

    // getLoadedInstrument(instrumentID) {
    //     if(typeof this.instruments[instrumentID] === "undefined" || this.instruments[instrumentID] instanceof Promise)
    //         return null;
    //     return this.instruments[instrumentID];
    // }

    instrumentAdd(config) {
        if (typeof config !== 'object')
            throw new Error("Invalid instruments config object");
        if (!config.className)
            throw new Error("Invalid Instrument Class");
        // config.url = config.url;

        const instrumentList = this.data.instruments;
        const instrumentID = instrumentList.length;

        this.data.instruments[instrumentID] = config;
        // this.updateDataByPath(['instruments', instrumentID], config);
        this.loadInstrument(instrumentID);
        this.dispatchEvent({
            type: 'instruments:added',
            instrumentID,
            config,
            song: this
        });
        return instrumentID;
    }

    instrumentReplace(instrumentID, config) {
        // const instrumentList = this.data.instruments;
        // if(instrumentList.length < instrumentID)
        //     throw new Error("Invalid instruments ID: " + instrumentID);
        let oldConfig = this.data.instruments[instrumentID] || {};
        if (oldConfig && oldConfig.title && !config.title)
            config.title = oldConfig.title;
        // Preserve old instruments name
        oldConfig = this.data.instruments[instrumentID];
        this.data.instruments[instrumentID] = config;
        // oldConfig = this.updateDataByPath(['instruments', instrumentID], config);
        this.loadInstrument(instrumentID);

        this.dispatchEvent({
            type: 'instruments:modified',
            instrumentID,
            oldConfig,
            song: this
        });
        return oldConfig;
    }

    instrumentRemove(instrumentID) {
        const instrumentList = this.data.instruments;
        if (!instrumentList[instrumentID])
            throw new Error("Invalid instruments ID: " + instrumentID);
        const isLastInstrument = instrumentID === instrumentList.length - 1;
        // if(instrumentList.length === instrumentID) {
        //
        // }
        const oldConfig = this.instruments[instrumentID];
        if(isLastInstrument) {
            delete this.instruments[instrumentID];
        } else {
            this.instruments[instrumentID] = null;
        }
        this.unloadInstrument(instrumentID);

        this.dispatchEvent({
            type: 'instruments:removed',
            instrumentID,
            song: this
        });
        return oldConfig;
    }




    /** Instructions **/

    instructionIndexOf(groupName, instruction) {
        if (instruction instanceof Instruction)
            instruction = instruction.data;
        if(!this.data.instructions[groupName])
            throw new Error("Invalid instruction group: " + groupName);
        let instructionList = this.data.instructions[groupName];

        instruction = ConfigListener.resolveProxiedObject(instruction);
        // instructionList = ConfigListener.resolveProxiedObject(instructionList);

        const p = instructionList.indexOf(instruction);
        if (p === -1)
            throw new Error("Instruction not found in instruction list");
        return p;
    }

    instructionGetList(groupName) {
        if(!this.data.instructions[groupName])
            throw new Error("Invalid instruction group: " + groupName);
        return new InstructionList(this.data.instructions[groupName]);
    }

    instructionGetByIndex(groupName, index) {
        if(!this.data.instructions[groupName])
            throw new Error("Invalid instruction group: " + groupName);
        let instructionList = this.data.instructions[groupName];
        return index >= instructionList.length ? null : new Instruction(instructionList[index], index);
    }


    instructionGetIterator(groupName, bpm=null, timeDivision=null) {
        return new InstructionIterator(
            this,
            groupName,
            bpm || this.data.bpm,
            timeDivision || this.data.timeDivision
        );
    }


    /** Modify Instructions **/

    instructionInsertAtPosition(groupName, insertPositionInTicks, insertInstructionData) {
        if (typeof insertPositionInTicks === 'string')
            insertPositionInTicks = Instruction.parseDurationAsTicks(insertPositionInTicks, this.data.timeDivision);

        if (!Number.isInteger(insertPositionInTicks))
            throw new Error("Invalid integer: " + typeof insertPositionInTicks);
        if (!insertInstructionData)
            throw new Error("Invalid insert instruction");
        const insertInstruction = InstructionList.parseInstruction(insertInstructionData);
        let instructionList = this.instructionGetList(groupName);

        // let groupPosition = 0, lastDeltaInstructionIndex;

        const iterator = this.instructionGetIterator(groupName);

        let instruction = iterator.nextInstruction();
        // noinspection JSAssignmentUsedAsCondition
        while (instruction) {
            // const instruction = new SongInstruction(instructionList[i]);
            // if(instruction.deltaDuration > 0) {
            const currentPositionInTicks = iterator.positionTicks;
            if (currentPositionInTicks > insertPositionInTicks) {
                // Delta note appears after note to be inserted
                const splitDuration = [
                    insertPositionInTicks - (currentPositionInTicks - instruction.deltaDurationInTicks),
                    currentPositionInTicks - insertPositionInTicks
                ];

                const modifyIndex = iterator.currentIndex;
                // Make following delta note smaller
                this.instructionReplaceDeltaDuration(groupName, modifyIndex, splitDuration[1]);

                // Insert new note before delta note.
                insertInstruction.deltaDurationInTicks = splitDuration[0];                     // Make new note equal the rest of the duration
                this.instructionInsertAtIndex(groupName, modifyIndex, insertInstruction);

                return modifyIndex; // this.splitPauseInstruction(groupName, i,insertPosition - groupPosition , insertInstruction);

            } else if (currentPositionInTicks === insertPositionInTicks) {
                // Delta note plays at the same time as new note, append after

                let lastInsertIndex;
                // Search for last insert position
                for (lastInsertIndex = iterator.currentIndex + 1; lastInsertIndex < instructionList.length; lastInsertIndex++)
                    if (new Instruction(instructionList[lastInsertIndex]).deltaDurationInTicks > 0)
                        break;

                insertInstruction.deltaDurationInTicks = 0; // TODO: is this correct?
                this.instructionInsertAtIndex(groupName, lastInsertIndex, insertInstruction);
                return lastInsertIndex;
            }
            // groupPosition += instruction.deltaDuration;
            // lastDeltaInstructionIndex = i;
            // }
            // if (!instruction)
            //     break;
            instruction = iterator.nextInstruction();
        }

        if (iterator.positionTicks >= insertPositionInTicks)
            throw new Error("Something went wrong");
        // Insert a new pause at the end of the song, lasting until the new note?
        let lastPauseIndex = instructionList.length;
        // this.instructionInsertAtIndex(groupName, lastPauseIndex, {
        //     command: '!pause',
        //     duration: insertPosition - groupPosition
        // });
        // Insert new note
        insertInstruction.deltaDurationInTicks = insertPositionInTicks - iterator.positionTicks;
        this.instructionInsertAtIndex(groupName, lastPauseIndex, insertInstruction);
        return lastPauseIndex;
    }


    instructionInsertAtIndex(groupName, insertIndex, insertInstructionData) {
        if (!insertInstructionData)
            throw new Error("Invalid insert instruction");
        let insertInstruction = InstructionList.parseInstruction(insertInstructionData);
        insertInstructionData = insertInstruction.data;
        this.instructionGetList(groupName).splice(insertIndex, 0, insertInstructionData);
        // this.spliceDataByPath(['instructions', groupName, insertIndex], 0, insertInstructionData);
        return insertIndex;
    }


    instructionDeleteAtIndex(groupName, deleteIndex) {
        const deleteInstruction = this.instructionGetByIndex(groupName, deleteIndex);
        if (deleteInstruction.deltaDurationInTicks > 0) {
            const nextInstruction = this.instructionGetByIndex(groupName, deleteIndex + 1, false);
            if (nextInstruction) {
                // this.getInstruction(groupName, deleteIndex+1).deltaDuration =
                //     nextInstruction.deltaDuration + deleteInstruction.deltaDuration;
                this.instructionReplaceDeltaDuration(groupName, deleteIndex + 1, nextInstruction.deltaDurationInTicks + deleteInstruction.deltaDurationInTicks)
            }
        }
        this.instructionGetList(groupName).splice(deleteIndex, 1);
        // return this.spliceDataByPath(['instructions', groupName, deleteIndex], 1);
    }

    instructionReplaceDeltaDuration(groupName, replaceIndex, newDelta) {
        this.instructionGetByIndex(groupName, replaceIndex).deltaDurationInTicks = newDelta;
        // return this.instructionReplaceParam(groupName, replaceIndex, 0, newDelta);
    }

    instructionReplaceCommand(groupName, replaceIndex, newCommand) {
        this.instructionGetByIndex(groupName, replaceIndex).command = newCommand;
    }

    instructionReplaceInstrument(groupName, replaceIndex, instrumentID) {
        this.instructionGetByIndex(groupName, replaceIndex).instrument = instrumentID;
    }

    instructionReplaceDuration(groupName, replaceIndex, newDuration) {
        this.instructionGetByIndex(groupName, replaceIndex).durationInTicks = newDuration;
    }

    instructionReplaceVelocity(groupName, replaceIndex, newVelocity) {
        if (!Number.isInteger(newVelocity))
            throw new Error("Velocity must be an integer: " + newVelocity);
        if (newVelocity < 0)
            throw new Error("Velocity must be a positive integer: " + newVelocity);
        this.instructionGetByIndex(groupName, replaceIndex).velocity = newVelocity;
    }


    /** Song Groups **/

    groupAdd(newGroupName, instructionList) {
        if (this.data.instructions.hasOwnProperty(newGroupName))
            throw new Error("New group already exists: " + newGroupName);
        this.data.instructions[newGroupName] = instructionList || [];
        // this.updateDataByPath(['instructions', newGroupName], instructionList || []);
    }


    groupRemove(removeGroupName) {
        if (removeGroupName === 'root')
            throw new Error("Cannot remove root instruction group, n00b");
        if (!this.data.instructions.hasOwnProperty(removeGroupName))
            throw new Error("Existing group not found: " + removeGroupName);

        delete this.data.instructions[removeGroupName];
        // return this.updateDataByPath(['instructions', removeGroupName]);
    }


    groupRename(oldGroupName, newGroupName) {
        if (oldGroupName === 'root')
            throw new Error("Cannot rename root instruction group, n00b");
        if (!this.data.instructions.hasOwnProperty(oldGroupName))
            throw new Error("Existing group not found: " + oldGroupName);
        if (this.data.instructions.hasOwnProperty(newGroupName))
            throw new Error("New group already exists: " + newGroupName);

        const removedGroupData = this.data.instructions[oldGroupName];
        delete this.data.instructions[oldGroupName];
        this.data.instructions[newGroupName] = removedGroupData;
    }


    /** Playback Timing **/

    getSongLengthInSeconds() {
        return this.instructionGetIterator(this.getStartGroup())
            .seekToEnd()
            .endPositionSeconds;
    }

    getSongLengthInTicks() {
        return this.instructionGetIterator(this.getStartGroup())
            .seekToEnd()
            .endPositionTicks;
    }

    // getSongLength() {
    //     return this.getGroupLength(this.getStartGroup());
    // }
    //
    // getGroupLength(groupName) {
    //     const instructionIterator = this.getInstructionIterator(groupName);
    //     while (instructionIterator.nextInstruction()) {}
    //     return instructionIterator;
    //     // return {
    //     //     inSeconds: instructionIterator.endPositionSeconds,
    //     //     inTicks: instructionIterator.endPositionTicks
    //     // }
    // }


    getSongPositionFromTicks(songPositionInTicks) {
        return this.getGroupPositionFromTicks(this.getStartGroup(), songPositionInTicks);
    }

    // Refactor
    getGroupPositionFromTicks(groupName, groupPositionInTicks) {
        const iterator = this.instructionGetIterator(groupName);
        while (true) {
            if (iterator.positionTicks >= groupPositionInTicks || !iterator.nextInstruction())
                break;
        }


        let currentPosition = iterator.positionSeconds;

        if (groupPositionInTicks > iterator.positionTicks) {
            const elapsedTicks = groupPositionInTicks - iterator.positionTicks;
            currentPosition += Song.ticksToSeconds(elapsedTicks, iterator.bpm, iterator.timeDivision);

        } else if (groupPositionInTicks < iterator.positionTicks) {
            const elapsedTicks = iterator.positionTicks - groupPositionInTicks;
            currentPosition -= Song.ticksToSeconds(elapsedTicks, iterator.bpm, iterator.timeDivision);
        }

        // console.info("getGroupPositionFromTicks", groupPositionInTicks, currentPosition);
        return currentPosition;
    }


    getSongPositionInTicks(positionInSeconds = null) {
        if (positionInSeconds === null)
            positionInSeconds = this.songPlaybackPosition;
        return this.getGroupPositionInTicks(this.getStartGroup(), positionInSeconds);
    }


    getGroupPositionInTicks(groupName, positionInSeconds) {
        const iterator = this.instructionGetIterator(groupName);
        while (true) {
            if (iterator.positionSeconds >= positionInSeconds || !iterator.nextInstruction())
                break;
        }

        let currentPositionInTicks = iterator.positionTicks;
        if (positionInSeconds > iterator.positionSeconds) {
            const elapsedTime = positionInSeconds - iterator.positionSeconds;
            currentPositionInTicks += Song.secondsToTicks(elapsedTime, iterator.bpm);

        } else if (positionInSeconds < iterator.positionSeconds) {
            const elapsedTime = iterator.positionSeconds - positionInSeconds;
            currentPositionInTicks -= Song.secondsToTicks(elapsedTime, iterator.bpm);
        }

        // console.info("getSongPositionInTicks", positionInSeconds, currentPositionInTicks);
        return currentPositionInTicks;
    }

    static ticksToSeconds(elapsedTicks, bpm, timeDivision) {
        return (elapsedTicks / timeDivision) * (60 / bpm);
    }

    static secondsToTicks(elapsedTime, bpm, timeDivision) {
        return Math.round((elapsedTime * timeDivision) / (60 / bpm));
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

        this.dispatchEvent({
            type: 'song:seek',
            position: this.playbackPosition,
            // positionInTicks: this.getSongPositionInTicks(this.playbackPosition), // TODO: use iterator
            song: this
        });

        // this.playback.setPlaybackPosition(this.getAudioContext().currentTime - this.playbackPosition);
        let isPlaying = !!this.playback;
        if (this.playback) {
            this.playback.stopPlayback();
        }
        this.playbackPosition = songPosition;

        if (isPlaying) {
            const oldDestination = this.playback.destination;
            this.playback = new InstructionPlayback(oldDestination, this, this.getStartGroup(), oldDestination.context.currentTime - this.playbackPosition);
            this.playback.awaitPlaybackReachedEnd()
                .then((reachedEnding) => reachedEnding ? this.stopPlayback(true) : null);
        }
        // const positionInTicks = this.getSongPositionInTicks(this.playbackPosition);
//         console.log("Seek position: ", this.playbackPosition, positionInTicks);

    }


    // isActive() {
    //     for (const key in this.activeGroups) {
    //         if (this.activeGroups.hasOwnProperty(key)) {
    //             if (this.activeGroups[key] === true)
    //                 return true;
    //         }
    //     }
    //     return false;
    // }

    play(destination) {
        if(!destination || !destination.context)
            throw new Error("Invalid destination");
        // const audioContext = destination.context;
        if (this.playback) {
            this.stopPlayback();
            this.setPlaybackPosition(0);
            // throw new Error("Song is already playing");
        }

        // await this.init(audioContext);
        const playback = new InstructionPlayback(destination, this, this.getStartGroup(), this.playbackPosition);
        this.playback = playback;
        console.log("Start playback:", this.playbackPosition);

        this.dispatchEvent({
            type: 'song:play',
            playback: this.playback,
            // positionInTicks: this.getSongPositionInTicks(this.playbackPosition), // TODO: use iterator
            song: this
        });

        return playback;
        // const reachedEnding = await this.playback.awaitPlaybackReachedEnd();
        // if(reachedEnding)
        //     this.stopPlayback(true);
    }

    stopPlayback() {
        if (!this.playback)
            throw new Error("Playback is already stopped");
        const playback = this.playback;
        this.playback = null;
        this.playbackPosition = playback.getGroupPositionInSeconds();
        playback.stopPlayback();

        // TODO: move to playback class
        for (let i = 0; i < this.playbackEndCallbacks.length; i++)
            this.playbackEndCallbacks[i]();
        this.playbackEndCallbacks = [];
        for (let i = 0; i < this.waitCancels.length; i++)
            this.waitCancels[i]();
        this.waitCancels = [];


        console.log("End playback:", this.playbackPosition);


        this.dispatchEvent({
            type: 'song:end',
            playback: this.playback,
            // positionInTicks: this.getSongPositionInTicks(this.playbackPosition), // TODO: use iterator
            song: this
        });
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


    async playInstructionAtIndex(groupName, instructionIndex, noteStartTime = null) {
        const instruction = this.instructionGetByIndex(groupName, instructionIndex, false);
        if (instruction)
            await this.playInstruction(instruction, noteStartTime);
        else
            console.warn("No instruction at index");
    }

    playInstruction(instruction, noteStartTime = null, groupName = null) {
        const audioContext = this.audioContext;
        if (!instruction instanceof Instruction)
            throw new Error("Invalid instruction");

        // if(this.playback)
        //     this.stopPlayback();

        if (instruction instanceof GroupInstruction) {
            const groupPlayback = new InstructionPlayback(this.destination, this, instruction.getGroupName(), noteStartTime);
            // const groupPlayback = new InstructionPlayback(this.song, subGroupName, notePosition);
            return groupPlayback;
        }


        let bpm = this.data.bpm; // getStartingBeatsPerMinute();
        // const noteDuration = (instruction.duration || 1) * (60 / bpm);
        let timeDivision = this.data.timeDivision;

        const noteDurationInTicks = instruction.durationInTicks || 0; // (timeDivision);
        const noteDuration = (noteDurationInTicks / timeDivision) / (bpm / 60);

        let currentTime = audioContext.currentTime;

        if (!noteStartTime && noteStartTime !== 0)
            noteStartTime = currentTime;


        this.playInstrument(instruction.instrumentID, instruction.command, noteStartTime, noteDuration, instruction.velocity);
        // Wait for note to start
        // if (noteStartTime > currentTime) {
        //     await this.wait(noteStartTime - currentTime);
        //     // await new Promise((resolve, reject) => setTimeout(resolve, (noteStartTime - currentTime) * 1000));
        // }

        // Dispatch note start event
        // this.dispatchEvent({
        //     type: 'note:start',
        //     groupName,
        //     instruction,
        //     song: this
        // });

        // currentTime = audioContext.currentTime;
        // if (noteStartTime + noteDuration > currentTime) {
        //     await this.wait(noteStartTime + noteDuration - currentTime);
        //     // await new Promise((resolve, reject) => setTimeout(resolve, (noteStartTime + noteDuration - currentTime) * 1000));
        // }
        // // TODO: check for song stop
        // // Dispatch note end event
        // this.dispatchEvent({
        //     type: 'note:end',
        //     groupName,
        //     instruction,
        //     song: this
        // });
    }




    // /** @deprecated **/
    // instrumentRename(instrumentID, newInstrumentName) {
    //     const oldValue = this.data.instruments[instrumentID].title;
    //     this.data.instruments[instrumentID].title = newInstrumentName;
    //     return oldValue;
    // }


    // instrumentReplaceParams(instrumentID, replaceParams) {
    //     const instrumentList = this.songData.instruments;
    //     if(!instrumentList[instrumentID])
    //         throw new Error("Invalid instruments ID: " + instrumentID);
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


    // findDataPathOld(pathList) {
    //     if (!Array.isArray(pathList))
    //         throw new Error("Path list must be an array");
    //     if (pathList[0] === "*") {
    //         return {
    //             value: this.data,
    //             parent: {key: this.data},
    //             key: 'key'
    //         };
    //     }
    //     // const pathList = path.split('.');
    //     let value = this.data, parent, key = null;
    //     for (let i = 0; i < pathList.length; i++) {
    //         key = pathList[i];
    //         // if(/^\d+$/.test(key)) {
    //         //     key = parseInt(key);
    //         //     // if(typeof target.length < targetPathPart)
    //         //     //     throw new Error(`Path is out of index: ${target.length} < ${targetPathPart} (Path: -${path}) `);
    //         // } else {
    //         //     // if(typeof target[targetPathPart] === 'undefined')
    //         //     //     throw new Error("Path not found: " + path);
    //         // }
    //         parent = value;
    //         if (typeof value === "undefined")
    //             throw new Error("Invalid path key: " + key);
    //         value = value[key];
    //     }
    //     if (!parent)
    //         throw new Error("Invalid path: " + pathList.join('.'));
    //
    //     return {
    //         value: value,
    //         parent: parent,
    //         key: key
    //     };
    // }


    queueHistoryAction(action, pathList, data = null, oldData = null) {
        if(Array.isArray(pathList))
            pathList = pathList.join('.');
        const historyAction = [
            action[0] + ':' + pathList,
        ];
        if (data !== null || oldData !== null)
            historyAction.push(data);
        if (oldData !== null)
            historyAction.push(oldData);
        this.history.push(historyAction);

        // setTimeout(() => {

        this.dispatchEvent({
            type: 'song:modified',
            historyAction,
            song: this
        });

        // console.log('historyAction', historyAction);
        return historyAction;
    }

    /** History **/

    // applyHistoryActions(songHistory) {
    //     for (let i = 0; i < songHistory.length; i++) {
    //         const historyAction = songHistory[i];
    //         switch (historyAction.action) {
    //             case 'reset':
    //                 Object.assign(this.data, historyAction.data);
    //                 break;
    //             case 'insert':
    //                 this.insertDataPath(historyAction.path, historyAction.data);
    //                 break;
    //             case 'delete':
    //                 this.deleteDataPath(historyAction.path);
    //                 break;
    //             case 'replace':
    //                 this.updateData(historyAction.path, historyAction.data);
    //                 break;
    //             default:
    //                 throw new Error("Unknown history action: " + historyAction.action);
    //         }
    //     }
    //     this.history = [];
    //     this.instructionProcessGroupData();
    // }
    static loadSongFromData(audioContext, songData) {
        const song = new Song(audioContext);
        song.loadSongData(songData);
        return song;
    }

    static async loadSongFromMemory(audioContext, songUUID) {
        const storage = new Storage();
        const songData = await storage.loadSongFromMemory(songUUID);
        const songHistory = await storage.loadSongHistoryFromMemory(songUUID);
        const song = new Song(audioContext, songData);
        song.loadSongData(songData);
        song.loadSongHistory(songHistory);
        return song;
    }

    static async loadSongFromFileInput(audioContext, file) {
        const library = await Song.getFileSupportModule(file.name);
        if (typeof library.loadSongDataFromFileInput !== "function")
            throw new Error("Invalid library.loadSongDataFromFileInput method");

        const buffer = Song.loadBufferFromFileInput(file);
        const songData = await library.loadSongDataFromBuffer(buffer, file.name);
        const song = new Song(audioContext);
        song.loadSongData(songData);
        return song;
    }

    static async loadSongFromURL(audioContext, src) {
        const library = await Song.getFileSupportModule(src);
        if (typeof library.loadSongDataFromBuffer !== "function")
            throw new Error("Invalid library.loadSongDataFromURL method: " + src);

        const fileService = new FileService();
        const buffer = await fileService.loadBufferFromURL(src);
        // const buffer = await response.arrayBuffer();
        const songData = await library.loadSongDataFromBuffer(buffer, src);
        const song = new Song(audioContext);
        song.loadSongData(songData);
        return song;
    }

    static async loadBufferFromFileInput(file) {
        return await new Promise((resolve, reject) => {
            let reader = new FileReader();                                      // prepare the file Reader
            reader.readAsArrayBuffer(file);                 // read the binary data
            reader.onload =  (e) => {
                resolve(e.target.result);
            };
        });
    }


    static async getFileSupportModule(filePath) {
        // const AudioSourceLoader = customElements.get('audio-source-loader');
        // const requireAsync = AudioSourceLoader.getRequireAsync(thisModule);
        const fileExt = filePath.split('.').pop().toLowerCase();
        let library;
        switch (fileExt) {
            // case 'mid':
            // case 'midi':
            //     const {MIDISupport} = require('../file/MIDIFile.js');
            //     return new MIDISupport;
            //
            case 'json':
                library = new JSONSongFile();
                // await library.init();
                return library;
            //
            case 'nsf':
            case 'nsfe':
            case 'spc':
            case 'gym':
            case 'vgm':
            case 'vgz':
            case 'ay':
            case 'sgc':
            case 'kss':
                library = new GMESongFile();
                await library.init();
                return library;
            //
            // case 'mp3':
            //     const {MP3Support} = require('../file/MP3File.js');
            //     return new MP3Support;

            default:
                throw new Error("Unknown file module for file type: " + fileExt);
        }
    };




    /** Generate Song Data **/

    static generateTitle() {
        return `Untitled (${new Date().toJSON().slice(0, 10).replace(/-/g, '/')})`;
    }

    static generateUUID() {
        var d = new Date().getTime();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            d += performance.now(); //use high-precision timer if available
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            // eslint-disable-next-line no-mixed-operators
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
}

Song.DEFAULT_VOLUME = 0.7;


// Song.loadSongFromMIDIFile = async function (file, defaultInstrumentURL = null) {
//     defaultInstrumentURL = defaultInstrumentURL || this.getDefaultInstrumentURL();
//     const midiSupport = new MIDIImport();
//     const songData = await midiSupport.loadSongFromMidiFile(file, defaultInstrumentURL);
//     const song = new Song();
//     await song.loadSongData(songData);
//     return song;
// };




export default Song;
