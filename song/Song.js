import InstrumentLoader from "./instrument/InstrumentLoader";
import {SongValues} from "./values/";

import Storage from "./Storage";
import GMESongFile from "./file/GMESongFile";
import JSONSongFile from "./file/JSONSongFile";
import FileService from "./file/FileService";
import {ConfigListener} from "./config/ConfigListener";
import {Instruction, InstructionIterator, InstructionPlayback} from "./instruction/";


import InstrumentList from "../instruments";
import TrackInstruction from "./instruction/TrackInstruction";
import Values from "./values/Values";
import TrackIterator from "./track/TrackIterator";

// TODO: can be handled cleaner
InstrumentList.addAllInstruments();
// const DEFAULT_INSTRUMENT_CLASS = 'PolyphonyInstrument';

class Song {
    constructor(audioContext=null, songData={}) {
        this.audioContext = audioContext; //  || new (window.AudioContext || window.webkitAudioContext)();

        this.eventListeners = [];
        this.instrumentLoader = new InstrumentLoader(this);

        this.playback = null;

        const data = {
            title: Song.generateTitle(),
            uuid: Song.generateUUID(),
            version: '0.0.1',
            created: new Date().getTime(),
            timeDivision: 96 * 4,
            bpm: 120,
            // beatsPerMeasure: 4,
            startTrack: 'root',
            instruments: [ // Also called 'programs' or 'patches'
                ['PolyphonyInstrument', {
                    voices: [
                        ['OscillatorNodeInstrument', {
                            type: 'sawtooth'
                        }],
                        ['OscillatorNodeInstrument', {
                            type: 'sawtooth'
                        }],
                    ]}
                ],
                ['OscillatorNodeInstrument',{type: 'square'}],
            ],
            tracks: {
                root: [
                    ['@track0', 288],
                    ['@track1'],
                ],
                track0: [
                    // ['!d', 'Effect'],
                    ['!i', 0],
                    [0, 'C4', 64],
                    [64, 'D4', 64],
                    [64, 'E4', 64],
                    [64, 'F4', 48, 50],
                ],
                track1: [
                    ['!i', 1],
                    [0, 'C4', 64],
                    [96, 'D4', 64],
                    [96, 'E4', 64],
                    [96, 'A5', 48, 50],
                ]
            }
        };

        this.getProxiedData = function() { return data; };
        this.data = new Proxy(data, new ConfigListener(this));
        this.history = [];
        this.values = new SongValues(this);

        this.loadSongData(songData);
        this.instrumentLoadAll(audioContext.destination);
    }

    /** @deprecated? **/
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

    unloadAll() {
        this.instrumentLoader.unloadAllInstruments();
        this.eventListeners = [];
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
        if(!data.tracks)
            throw new Error("No tracks found in song data");
        Instruction.processInstructionTracks(data.tracks);

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


    /** Instruction Tracks **/

    getStartTrackName() {
        return typeof this.data.startTrack === "undefined"
            ? this.data.startTrack
            : Object.keys(this.data.tracks)[0];
    }

    hasTrack(trackName) {
        return typeof this.data.tracks[trackName] !== "undefined";
    }


    generateInstructionTrackName(trackName = 'track') {
        const tracks = this.data.tracks;
        for (let i = 0; i <= 999; i++) {
            const currentTrackName = trackName + i;
            if (!tracks.hasOwnProperty(currentTrackName))
                return currentTrackName;
        }
        throw new Error("Failed to generate group name");
    }



    /** Instruments **/
    // All instruments are sent a 0 frequency play in order to pre-load samples.

    hasInstrument(instrumentID) {
        return !!this.data.instruments[instrumentID];
    }

    stopInstrumentPlayback(destination, instrumentID) {
        let instrument = this.instrumentLoader.loadInstanceFromID(instrumentID);
        if(typeof instrument.stopPlayback !== "function")
            return console.error(instrument.name + ".stopPlayback is not a function");
        instrument.stopPlayback(destination);
        // let instrumentClass = this.instrumentLoader.instrumentGetClass(instrumentID);
        // if(typeof instrumentClass.stopPlayback !== "function")
        //     return console.error(instrumentClass.name + ".stopPlayback is not a function");
        // instrumentClass.stopPlayback();
    }

    playInstrument(destination, instrumentID, noteFrequency, noteStartTime, noteDuration=null, noteVelocity=null, onended=null) {
        if (!instrumentID && instrumentID !== 0)
            throw new Error("Invalid instrument ID");
        // if (!instrumentID && instrumentID !== 0) {
        //     console.warn("No instruments set for instruction. Using instruments 0");
        //     instrumentID = 0;
        //     // return;
        // }
        let instrument = this.instrumentLoader.loadInstanceFromID(instrumentID);
        // return await instrument.play(destination, noteFrequency, noteStartTime, noteDuration, noteVelocity);
        if(typeof noteFrequency === "string")
            noteFrequency = this.values.parseFrequencyString(noteFrequency);
        return instrument.playFrequency(destination, noteFrequency, noteStartTime, noteDuration, noteVelocity, onended);
    }

    instrumentGetData(instrumentID)         { return this.instrumentLoader.getData(instrumentID); }
    instrumentGetClassName(instrumentID)    { return this.instrumentLoader.getClassName(instrumentID); }
    instrumentGetClass(instrumentID)        { return this.instrumentLoader.getClass(instrumentID); }
    instrumentGetConfig(instrumentID)       { return this.instrumentLoader.getConfig(instrumentID); }


    // instrumentGetList() {
    //     return this.data.instruments;
    // }
    instrumentEach(callback) {
        return this.data.instruments.map(function(entry, instrumentID) {
            const [className, config] = entry;
            return callback(instrumentID, className, config);
        });
    }


    instrumentLoadAll(destination) {
        const instrumentList = this.data.instruments;
        for (let instrumentID = 0; instrumentID < instrumentList.length; instrumentID++) {
            if (instrumentList[instrumentID]) {
                this.instrumentLoadInstanceFromID(instrumentID, destination);
                // TODO wait for init?
            }
        }
    }


    instrumentLoadInstanceFromID(instrumentID) {
        return this.instrumentLoader.loadInstanceFromID(instrumentID);
        // this.dispatchEvent({
        //     type: 'instruments:instance',
        //     instrument,
        //     instrumentID,
        //     song: this
        // });
    }

    instrumentLoadRenderer(instrumentID) {
        return this.instrumentLoader.instrumentLoadRenderer(instrumentID);
    }


    instrumentAdd(config) {
        if (typeof config !== 'object')
            throw new Error("Invalid instruments config object");
        if (!config.className)
            throw new Error("Invalid Instrument Class");

        const instrumentList = this.data.instruments;
        const instrumentID = instrumentList.length;

        this.data.instruments[instrumentID] = config;
        this.instrumentLoadInstanceFromID(instrumentID, this.audioContext.destination);
        // this.dispatchEvent({
        //     type: 'instruments:added',
        //     instrumentID,
        //     config,
        //     song: this
        // });
        return instrumentID;
    }

    instrumentReplace(instrumentID, instrumentClassName, instrumentConfig={}) {
        // Preserve old instruments name
        // if (oldConfig && oldConfig.title && !instrumentConfig.title)
        //     instrumentConfig.title = oldConfig.title;

        const oldConfig = this.data.instruments[instrumentID];
        this.data.instruments[instrumentID] = [instrumentClassName, instrumentConfig];
        this.instrumentLoadInstanceFromID(instrumentID, this.audioContext.destination);

        // this.dispatchEvent({
        //     type: 'instruments:modified',
        //     instrumentID,
        //     oldConfig,
        //     song: this
        // });
        return oldConfig;
    }

    instrumentRename(instrumentID, newTitle) {
        const config = this.instrumentGetConfig(instrumentID);
        config.title = newTitle;
    }

    instrumentRemove(instrumentID) {
        const instrumentList = this.data.instruments;
        if (!instrumentList[instrumentID])
            return console.error("Invalid instruments ID: " + instrumentID);
        const isLastInstrument = instrumentID === instrumentList.length - 1;

        const oldConfig = instrumentList[instrumentID];
        if(isLastInstrument) {
            delete instrumentList[instrumentID];
        } else {
            instrumentList[instrumentID] = null;
        }
        // this.instrumentUnload(instrumentID);

        // this.dispatchEvent({
        //     type: 'instruments:removed',
        //     instrumentID,
        //     song: this
        // });
        return oldConfig;
    }




    /** Instructions **/

    instructionIndexOf(trackName, instruction) {
        if (instruction instanceof Instruction)
            instruction = instruction.data;

        if(!this.data.tracks[trackName])
            throw new Error("Invalid instruction track: " + trackName);
        let instructionList = this.data.tracks[trackName];

        instruction = ConfigListener.resolveProxiedObject(instruction);
        // instructionList = ConfigListener.resolveProxiedObject(instructionList);

        const p = instructionList.indexOf(instruction);
        if (p === -1)
            throw new Error("Instruction not found in instruction list");
        return p;
    }

    instructionGetList(trackName) {
        if(!this.data.tracks[trackName])
            throw new Error("Invalid instruction track: " + trackName);
        return this.data.tracks[trackName];
    }

    instructionGetByIndex(trackName, index) {
        if(!this.data.tracks[trackName])
            throw new Error("Invalid instruction track: " + trackName);
        let instructionList = this.instructionGetList(trackName);
        if(index < 0 || index > instructionList.length)
            throw new Error("Index is out or range: " + index);
        return Instruction.getInstruction(instructionList[index]);
    }


    instructionGetIterator(trackName, timeDivision=null, bpm=null) {
        if(!this.data.tracks[trackName])
            throw new Error("Invalid instruction track: " + trackName);
        const instructionList = this.data.tracks[trackName];

        return new InstructionIterator(
            instructionList,
            timeDivision || this.data.timeDivision,
            bpm || this.data.bpm,
        );
    }


    /** Modify Instructions **/

    /** TODO: fix insertion bugs **/
    instructionInsertAtPosition(trackName, insertPositionInTicks, insertInstructionData) {
        if (typeof insertPositionInTicks === 'string')
            insertPositionInTicks = new Values().parseDurationAsTicks(insertPositionInTicks, this.data.timeDivision);

        if (!Number.isInteger(insertPositionInTicks))
            throw new Error("Invalid integer: " + typeof insertPositionInTicks);
        if (!insertInstructionData)
            throw new Error("Invalid insert instruction");
        const insertInstruction = Instruction.parseInstruction(insertInstructionData);
        let instructionList = this.data.tracks[trackName];


        const iterator = this.instructionGetIterator(trackName);

        let instruction = iterator.nextInstruction();
        while (instruction) {
            // if(instruction.deltaDuration > 0) {
            const currentPositionInTicks = iterator.positionTicks;
            if (currentPositionInTicks > insertPositionInTicks) {
                // Delta note appears after note to be inserted
                const splitDuration = [
                    insertPositionInTicks - (currentPositionInTicks - instruction.deltaDurationTicks),
                    currentPositionInTicks - insertPositionInTicks
                ];

                const modifyIndex = iterator.currentIndex;
                // Make following delta note smaller
                this.instructionReplaceDeltaDuration(trackName, modifyIndex, splitDuration[1]);

                // Insert new note before delta note.
                insertInstruction.deltaDurationTicks = splitDuration[0];                     // Make new note equal the rest of the duration
                this.instructionInsertAtIndex(trackName, modifyIndex, insertInstruction);

                return modifyIndex; // this.splitPauseInstruction(trackName, i,insertPosition - groupPosition , insertInstruction);

            } else if (currentPositionInTicks === insertPositionInTicks) {
                // Delta note plays at the same time as new note, append after

                let lastInsertIndex;
                // Search for last insert position
                for (lastInsertIndex = iterator.currentIndex + 1; lastInsertIndex < instructionList.length; lastInsertIndex++)
                    if (new Instruction(instructionList[lastInsertIndex]).deltaDurationTicks > 0)
                        break;

                insertInstruction.deltaDurationTicks = 0; // TODO: is this correct?
                this.instructionInsertAtIndex(trackName, lastInsertIndex, insertInstruction);
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
        // this.instructionInsertAtIndex(trackName, lastPauseIndex, {
        //     command: '!pause',
        //     duration: insertPosition - groupPosition
        // });
        // Insert new note
        insertInstruction.deltaDurationTicks = insertPositionInTicks - iterator.positionTicks;
        this.instructionInsertAtIndex(trackName, lastPauseIndex, insertInstruction);
        return lastPauseIndex;
    }


    instructionInsertAtIndex(trackName, insertIndex, insertInstructionData) {
        if (!insertInstructionData)
            throw new Error("Invalid insert instruction");
        let insertInstruction = Instruction.parseInstruction(insertInstructionData);
        insertInstructionData = insertInstruction.data;
        this.instructionGetList(trackName).splice(insertIndex, 0, insertInstructionData);
        return insertIndex;
    }


    instructionDeleteAtIndex(trackName, deleteIndex) {
        const deleteInstruction = this.instructionGetByIndex(trackName, deleteIndex);
        if (deleteInstruction.deltaDurationTicks > 0) {
            const nextInstruction = this.instructionGetByIndex(trackName, deleteIndex + 1, false);
            if (nextInstruction) {
                // this.getInstruction(trackName, deleteIndex+1).deltaDuration =
                //     nextInstruction.deltaDuration + deleteInstruction.deltaDuration;
                this.instructionReplaceDeltaDuration(trackName, deleteIndex + 1, nextInstruction.deltaDurationTicks + deleteInstruction.deltaDurationTicks)
            }
        }
        this.instructionGetList(trackName).splice(deleteIndex, 1);
        // return this.spliceDataByPath(['instructions', trackName, deleteIndex], 1);
    }

    instructionReplaceDeltaDuration(trackName, replaceIndex, newDelta) {
        this.instructionGetByIndex(trackName, replaceIndex).deltaDurationTicks = newDelta;
        // return this.instructionReplaceParam(trackName, replaceIndex, 0, newDelta);
    }

    instructionReplaceCommand(trackName, replaceIndex, newCommand) {
        this.instructionGetByIndex(trackName, replaceIndex).command = newCommand;
    }

    instructionReplaceInstrument(trackName, replaceIndex, instrumentID) {
        this.instructionGetByIndex(trackName, replaceIndex).instrument = instrumentID;
    }

    instructionReplaceDuration(trackName, replaceIndex, newDuration) {
        this.instructionGetByIndex(trackName, replaceIndex).durationTicks = newDuration;
    }

    instructionReplaceVelocity(trackName, replaceIndex, newVelocity) {
        if (!Number.isInteger(newVelocity))
            throw new Error("Velocity must be an integer: " + newVelocity);
        if (newVelocity < 0)
            throw new Error("Velocity must be a positive integer: " + newVelocity);
        this.instructionGetByIndex(trackName, replaceIndex).velocity = newVelocity;
    }


    /** Song Tracks **/

    trackAdd(newTrackName, instructionList) {
        if (this.data.tracks.hasOwnProperty(newTrackName))
            throw new Error("New group already exists: " + newTrackName);
        this.data.tracks[newTrackName] = instructionList || [];
    }


    trackRemove(removeTrackName) {
        if (removeTrackName === 'root')
            throw new Error("Cannot remove root instruction track, n00b");
        if (!this.data.tracks.hasOwnProperty(removeTrackName))
            throw new Error("Existing group not found: " + removeTrackName);

        delete this.data.tracks[removeTrackName];
    }


    trackRename(oldTrackName, newTrackName) {
        if (oldTrackName === 'root')
            throw new Error("Cannot rename root instruction track, n00b");
        if (!this.data.tracks.hasOwnProperty(oldTrackName))
            throw new Error("Existing group not found: " + oldTrackName);
        if (this.data.tracks.hasOwnProperty(newTrackName))
            throw new Error("New group already exists: " + newTrackName);

        const removedGroupData = this.data.tracks[oldTrackName];
        delete this.data.tracks[oldTrackName];
        this.data.tracks[newTrackName] = removedGroupData;
    }


    trackGetIterator(destination, onEvent=null) {
        return new TrackIterator(destination, this, this.getStartTrackName(), onEvent);
    }

    /** Playback Timing **/

    getSongLengthInSeconds() {
        const iterator = this.trackGetIterator(this.getStartTrackName());
        iterator.seekToEnd();
        return iterator.getEndPositionInSeconds();
    }

    // getSongLengthTicks() {
    //     return this.instructionGetIterator(this.getStartTrackName())
    //         .seekToEnd()
    //         .endPositionTicks;
    // }

    // getSongLength() {
    //     return this.getGroupLength(this.getStartTrackName());
    // }
    //
    // getGroupLength(trackName) {
    //     const instructionIterator = this.getInstructionIterator(trackName);
    //     while (instructionIterator.nextInstruction()) {}
    //     return instructionIterator;
    //     // return {
    //     //     inSeconds: instructionIterator.endPositionSeconds,
    //     //     inTicks: instructionIterator.endPositionTicks
    //     // }
    // }


    getSongPositionFromTicks(songPositionInTicks) {
        return this.getGroupPositionFromTicks(this.getStartTrackName(), songPositionInTicks);
    }

    // Refactor
    getGroupPositionFromTicks(trackName, groupPositionInTicks) {
        const iterator = this.instructionGetIterator(trackName);
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
            positionInSeconds = this.getSongPlaybackPosition();
        return this.getGroupPositionInTicks(this.getStartTrackName(), positionInSeconds);
    }


    getGroupPositionInTicks(trackName, positionInSeconds) {
        const iterator = this.instructionGetIterator(trackName);
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


    getSongPlaybackPosition() {
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
            this.playback = new InstructionPlayback(oldDestination, this, this.getStartTrackName(), oldDestination.context.currentTime - this.playbackPosition);
            this.playback.awaitPlaybackReachedEnd()
                .then((reachedEnding) => reachedEnding ? this.stopPlayback(true) : null);
        }
        // const positionInTicks = this.getSongPositionInTicks(this.playbackPosition);
//         console.log("Seek position: ", this.playbackPosition, positionInTicks);

    }


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
        const playback = new InstructionPlayback(destination, this, this.getStartTrackName(), this.playbackPosition);
        this.playback = playback;
        // console.log("Start playback:", this.playbackPosition);

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
        this.playbackPosition = playback.getTrackPositionInSeconds();
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


    playInstructionAtIndex(trackName, instructionIndex, noteStartTime = null) {
        const instruction = this.instructionGetByIndex(trackName, instructionIndex, false);
        if (instruction)
            this.playInstruction(instruction, noteStartTime);
        else
            console.warn("No instruction at index");
    }

    playInstruction(destination, instruction, instrumentID, noteStartTime = null, trackName = null) {
        const audioContext = this.audioContext;
        if (!instruction instanceof Instruction)
            throw new Error("Invalid instruction");

        // if(this.playback)
        //     this.stopPlayback();

        if (instruction instanceof TrackInstruction) {
            const groupPlayback = new InstructionPlayback(destination, this, instruction.getTrackName(), noteStartTime);
            // const groupPlayback = new InstructionPlayback(this.song, subTrackName, notePosition);
            return groupPlayback;
        }


        // const noteDuration = (instruction.duration || 1) * (60 / bpm);

        let noteDuration = null;
        if(typeof instruction.durationTicks !== "undefined") {
            let bpm = this.data.bpm; // getStartingBeatsPerMinute();
            let timeDivision = this.data.timeDivision;
            const noteDurationTicks = instruction.durationTicks; // (timeDivision);
            noteDuration = (noteDurationTicks / timeDivision) / (bpm / 60);
        }

        let currentTime = audioContext.currentTime;

        if (!noteStartTime && noteStartTime !== 0)
            noteStartTime = currentTime;


        this.playInstrument(destination, instrumentID, instruction.command, noteStartTime, noteDuration, instruction.velocity);
        // Wait for note to start
        // if (noteStartTime > currentTime) {
        //     await this.wait(noteStartTime - currentTime);
        //     // await new Promise((resolve, reject) => setTimeout(resolve, (noteStartTime - currentTime) * 1000));
        // }

        // Dispatch note start event
        // this.dispatchEvent({
        //     type: 'note:start',
        //     trackName,
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
        //     trackName,
        //     instruction,
        //     song: this
        // });
    }



    /** Song Modification History **/



    queueHistoryAction(action, pathList, data = null, oldData = null) {
        if(Array.isArray(pathList))
            pathList = pathList.join('.');
        const historyAction = [
            action + ':' + pathList,
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


    /** Static Song Loading **/

    static loadSongFromData(audioContext, songData) {
        const song = new Song(audioContext);
        song.loadSongData(songData);
        return song;
    }

    static loadSongFromMemory(audioContext, songUUID) {
        const storage = new Storage();
        const songData = storage.loadSongFromMemory(songUUID);
        const songHistory = storage.loadSongHistoryFromMemory(songUUID);
        const song = new Song(audioContext, songData);
        song.loadSongData(songData);
        song.loadSongHistory(songHistory);
        return song;
    }

    static loadSongFromFileInput(audioContext, file) {
        const library = Song.getFileSupportModule(file.name);
        if (typeof library.loadSongDataFromFileInput !== "function")
            throw new Error("Invalid library.loadSongDataFromFileInput method");

        const buffer = Song.loadBufferFromFileInput(file);
        const songData = library.loadSongDataFromBuffer(buffer, file.name);
        const song = new Song(audioContext);
        song.loadSongData(songData);
        return song;
    }

    static async loadSongFromURL(audioContext, src) {
        const library = Song.getFileSupportModule(src);
        if (typeof library.loadSongDataFromBuffer !== "function")
            throw new Error("Invalid library.loadSongDataFromURL method: " + src);

        const fileService = new FileService();
        const buffer = await fileService.loadBufferFromURL(src);
        // const buffer = await response.arrayBuffer();
        const songData = library.loadSongDataFromBuffer(buffer, src);
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

    /** Static Fle Support Module **/

    static getFileSupportModule(filePath) {
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
                library.init();
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
