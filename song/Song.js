import ProgramLoader from "../common/program/ProgramLoader";
import SongValues from "./values/SongValues";

import JSONSongFile from "./file/JSONSongFile";
import ConfigListener from "./config/ConfigListener";
import Instruction from "./instruction/Instruction";
import InstructionIterator from "./instruction/iterator/InstructionIterator";


import ProgramList from "../programs";
import Values from "../common/values/Values";
import TrackIterator from "./track/TrackIterator";
import TrackPlayback from "./track/TrackPlayback";
import InstructionProcessor from "../common/program/InstructionProcessor";
import MIDIFileSupport from "./file/MIDIFileSupport";

// TODO: can be handled cleaner
ProgramList.addAllPrograms();
// const DEFAULT_PROGRAM_CLASS = 'PolyphonyProgram';


class Song {
    constructor(songData={}) {

        this.eventListeners = [];
        this.programLoader = new ProgramLoader(this);

        this.volume = null;
        this.lastVolumeGain = null;
        this.playback = null;
        this.lastMIDIProgram = null; // TODO: ugly?
        this.playbackPosition = 0;

        const data = Object.assign({
            title: Song.generateTitle(),
            uuid: new SongValues(this).generateUUID(),
            version: '0.0.1',
            created: new Date().getTime(),
            timeDivision: 96 * 4,
            beatsPerMinute: 120,
            beatsPerMeasure: 4,
            startTrack: 'root',
            programs: [ // Also called 'programs' or 'patches'
                ['envelope', {
                    voice: ['oscillator', {
                        type: 'sawtooth',
                        lfos: [
                            ['lfo', {
                                parameter: 'frequency',
                                frequency: 5,
                                amplitude: 10
                            }]
                        ]
                    }],
                }],
                ['polyphony', {
                    voices: [
                        ['audiobuffer', {
                        }],
                    ]}
                ],
                ['oscillator', {type: 'square'}],
            ],
            tracks: {
                root: [
                    [0, '@track0', 96*4, 0, 'C4'],
                    [96*12, '@track0', 96*4, 96*4, 'D4'],
                    [96*12, '@track0', 96*4, 96*4*2, 'E4'],
                ],
                track0: [
                    // ['!d', 'Effect'],
                    [0, '!p', 0],
                    [0, 'C4', 96],
                    [96, 'D4', 96],
                    [96, 'E4', 96],
                    [96, 'F4', 96],
                    [96, 'G4', 96],
                    [96, 'A4', 96 * 8],
                ],
                // track1: [
                //     ['!p', 1],
                //     [64, 'A3', 64],
                //     // [64, 'Aq3', 64],
                //     // [64, 'A#3', 64],
                //     [64, 'A#q3', 64],
                //     // [64, 'B3', 64],
                //     // [64, 'Bq3', 64],
                //     [64, 'C4', 64],
                //     // [64, 'Cq4', 64],
                //     // [64, 'C#4', 64],
                //     [64, 'C#q4', 64],
                //     // [64, 'D4', 64],
                //     // [64, 'Dq4', 64],
                //     [64, 'D#4', 64],
                //     // [64, 'D#q4', 64],
                //     // [64, 'E4', 64],
                //     [64, 'Eq4', 64],
                //     // [64, 'E#4', 64],
                //     // [64, 'E#q4', 64],
                //     [64, 'F#4', 64],
                //     // [64, 'F#q4', 64],
                //     // [64, 'G4', 64],
                //     [64, 'Gq4', 64],
                //     // [64, 'G#4', 64],
                //     // [64, 'G#q4', 64],
                //     [64, 'A4', 64],
                //     // [64, 'Aq4', 64],
                //     // [64, 'A#4', 64],
                //     [64, 'A#q4', 64],
                //     // [64, 'B4', 64],
                //     // [64, 'Bq4', 64],
                //     [64, 'C5', 64],
                //     // [64, 'Cq4', 64],
                //     // [64, 'C#4', 64],
                //     [64, 'C#q5', 64],
                //     // [64, 'D4', 64],
                //     // [64, 'Dq4', 64],
                //     [64, 'D#5', 64],
                //     // [64, 'D#q4', 64],
                //     // [64, 'E4', 64],
                //     [64, 'Eq5', 64],
                //     // [64, 'E#4', 64],
                //     // [64, 'E#q4', 64],
                //     [64, 'F#5', 64],
                //     // [64, 'F#q4', 64],
                //     // [64, 'G4', 64],
                //     [64, 'Gq5', 64],
                //     // [64, 'G#4', 64],
                //     // [64, 'G#q4', 64],
                //     [64, 'A5', 64],
                // ]
            }
        }, songData);

        this.getProxiedData = function() { return data; };
        this.data = new Proxy(data, new ConfigListener(this, []));
        this.history = [];
        this.values = new SongValues(this);

        // this.loadSongData(songData);
        // this.programLoadAll();

        this.dispatchEventCallback = e => this.dispatchEvent(e);


        // this.data = songData;

        // Process all instructions
        if(!data.tracks)
            throw new Error("No tracks found in song data");
        Instruction.processInstructionTracks(data.tracks);

        // let loadingPrograms = 0;

        // console.log("Song data loaded: ", songData);

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
        ProgramLoader.unloadAllPrograms();
        this.eventListeners = [];
    }


    /** Song Data **/


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




    /** Instructions **/

    instructionIndexOf(trackName, instructionData) {
        // if (instruction instanceof Instruction)
        //     instruction = instruction.data;

        if(!this.data.tracks[trackName])
            throw new Error("Invalid instruction track: " + trackName);
        let instructionList = this.data.tracks[trackName];

        instructionData = ConfigListener.resolveProxiedObject(instructionData);
        // instructionList = ConfigListener.resolveProxiedObject(instructionList);

        const p = instructionList.indexOf(instructionData);
        if (p === -1)
            throw new Error("Instruction not found in instruction list");
        return p;
    }

    instructionGetList(trackName) {
        if(!this.data.tracks[trackName])
            throw new Error("Invalid instruction track: " + trackName);
        return this.data.tracks[trackName];
    }

    instructionDataGetByIndex(trackName, index) {
        if(!this.data.tracks[trackName])
            throw new Error("Invalid instruction track: " + trackName);
        let instructionList = this.instructionGetList(trackName);
        if(index < 0 || index > instructionList.length)
            throw new Error("Index is out or range: " + index);
        if(!instructionList[index])
            throw new Error("Invalid instruction index: " + index);
        return instructionList[index];
    }




    /** Modify Instructions **/

    /** TODO: fix insertion bugs **/
    instructionInsertAtPosition(trackName, insertPositionInTicks, insertInstructionData) {
        if (typeof insertPositionInTicks === 'string')
            insertPositionInTicks = Values.instance.parseDurationAsTicks(insertPositionInTicks, this.data.timeDivision);

        if (!Number.isInteger(insertPositionInTicks))
            throw new Error("Invalid integer: " + typeof insertPositionInTicks);
        if (!insertInstructionData)
            throw new Error("Invalid insert instruction");
        insertInstructionData = Instruction.parseInstructionData(insertInstructionData);
        let instructionList = this.data.tracks[trackName];


        const iterator = InstructionIterator.getIteratorFromSong(this, trackName); //  this.instructionGetIterator(trackName);

        let instructionData = iterator.nextInstructionData();
        while (instructionData) {
            // if(instruction.deltaDuration > 0) {
            const currentPositionInTicks = iterator.getPositionInTicks();
            if (currentPositionInTicks > insertPositionInTicks) {
                // Delta note appears after note to be inserted
                const splitDuration = [
                    insertPositionInTicks - (currentPositionInTicks - instructionData[0]),
                    currentPositionInTicks - insertPositionInTicks
                ];

                const modifyIndex = iterator.getIndex();
                // Make following delta note smaller
                this.instructionReplaceDeltaDuration(trackName, modifyIndex, splitDuration[1]);

                // Insert new note before delta note.
                insertInstructionData[0] = splitDuration[0];                     // Make new note equal the rest of the duration
                this.instructionInsertAtIndex(trackName, modifyIndex, insertInstructionData);

                return modifyIndex; // this.splitPauseInstruction(trackName, i,insertPosition - groupPosition , insertInstruction);

            } else if (currentPositionInTicks === insertPositionInTicks) {
                // Delta note plays at the same time as new note, append after

                let lastInsertIndex;
                // Search for last insert position
                for (lastInsertIndex = iterator.getIndex() + 1; lastInsertIndex < instructionList.length; lastInsertIndex++)
                    if (instructionList[lastInsertIndex][0] > 0)
                        break;

                insertInstructionData[0] = 0; // TODO: is this correct?
                this.instructionInsertAtIndex(trackName, lastInsertIndex, insertInstructionData);
                return lastInsertIndex;
            }
            // groupPosition += instruction.deltaDuration;
            // lastDeltaInstructionIndex = i;
            // }
            // if (!instruction)
            //     break;
            instructionData = iterator.nextInstructionData();
        }

        if (iterator.getPositionInTicks() >= insertPositionInTicks)
            throw new Error("Something went wrong");
        // Insert a new pause at the end of the song, lasting until the new note?
        let lastPauseIndex = instructionList.length;
        // this.instructionInsertAtIndex(trackName, lastPauseIndex, {
        //     command: '!pause',
        //     duration: insertPosition - groupPosition
        // });
        // Insert new note
        insertInstructionData[0] = insertPositionInTicks - iterator.getPositionInTicks();
        this.instructionInsertAtIndex(trackName, lastPauseIndex, insertInstructionData);
        return lastPauseIndex;
    }


    instructionInsertAtIndex(trackName, insertIndex, insertInstructionData) {
        if (!insertInstructionData)
            throw new Error("Invalid insert instruction");
        insertInstructionData = Instruction.parseInstructionData(insertInstructionData);
        this.instructionGetList(trackName).splice(insertIndex, 0, insertInstructionData);
        return insertIndex;
    }


    instructionDeleteAtIndex(trackName, deleteIndex) {
        const deleteInstructionData = this.instructionDataGetByIndex(trackName, deleteIndex);
        if (deleteInstructionData[0] > 0) {
            let instructionList = this.instructionGetList(trackName);
            if (instructionList.length > deleteIndex + 1) {
                const nextInstruction = this.instructionDataGetByIndex(trackName, deleteIndex + 1, false);
                // this.getInstruction(trackName, deleteIndex+1).deltaDuration =
                //     nextInstruction.deltaDuration + deleteInstruction.deltaDuration;
                this.instructionReplaceDeltaDuration(trackName, deleteIndex + 1, nextInstruction[0] + deleteInstructionData[0])
            }
        }
        this.instructionGetList(trackName).splice(deleteIndex, 1);
        // return this.spliceDataByPath(['instructions', trackName, deleteIndex], 1);
    }

    instructionReplaceDeltaDuration(trackName, replaceIndex, newDelta) {
        this.instructionReplaceArg(trackName, replaceIndex, 0, newDelta);
    }

    instructionReplaceArg(trackName, replaceIndex, argIndex, newArgValue) {
        console.log('instructionReplaceArg', trackName, replaceIndex, argIndex, newArgValue);
        const instructionData = this.instructionDataGetByIndex(trackName, replaceIndex);
        instructionData[argIndex] = newArgValue;
    }

    instructionReplaceArgByType(trackName, replaceIndex, argType, newArgValue) {
        const instructionData = this.instructionDataGetByIndex(trackName, replaceIndex);
        const processor = new InstructionProcessor(instructionData);
        processor.updateArg(argType, newArgValue)
    }

    /** @deprecated Use custom arg renderer **/
    instructionReplaceCommand(trackName, replaceIndex, newCommand) {
        //: TODO: check for recursive group
        const instruction = this.instructionDataGetByIndex(trackName, replaceIndex);
        instruction[1] = newCommand;
    }

    // instructionReplaceProgram(trackName, replaceIndex, programID) {
    //     this.instructionGetByIndex(trackName, replaceIndex).program = programID;
    // }

    /** @deprecated Use custom arg renderer **/
    instructionReplaceDuration(trackName, replaceIndex, newDuration) {
        if (typeof newDuration === 'string')
            newDuration = Values.instance.parseDurationAsTicks(newDuration, this.data.timeDivision);
        const instruction = this.instructionDataGetByIndex(trackName, replaceIndex);
        instruction.durationTicks = newDuration;
    }

    /** @deprecated Use custom arg renderer **/
    instructionReplaceVelocity(trackName, replaceIndex, newVelocity) {
        if (!Number.isInteger(newVelocity))
            throw new Error("Velocity must be an integer: " + newVelocity);
        if (newVelocity < 0)
            throw new Error("Velocity must be a positive integer: " + newVelocity);
        const instruction = this.instructionDataGetByIndex(trackName, replaceIndex);
        instruction.velocity = newVelocity;
        console.log('instruction', instruction);
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


    // trackGetIterator(destination, onEvent=null) {
    //     return new TrackIterator(destination, this, this.getStartTrackName(), onEvent);
    // }

    /** Playback Timing **/

    getSongLengthInSeconds() {
        const iterator = new TrackIterator(this, this.getStartTrackName());
        iterator.seekToEnd();
        // console.log('getSongLengthInSeconds()', iterator.getEndPositionInSeconds())
        return iterator.getEndPositionInSeconds();
    }


    /** @deprecated **/
    getSongPositionFromTicks(songPositionInTicks) {
        return this.getGroupPositionFromTicks(this.getStartTrackName(), songPositionInTicks);
    }

    // Refactor
    /** @deprecated **/
    getGroupPositionFromTicks(trackName, groupPositionInTicks) {
        const iterator = InstructionIterator.getIteratorFromSong(this, trackName); //  this.instructionGetIterator(trackName);
        while (true) {
            if (iterator.getPositionInTicks() >= groupPositionInTicks || !iterator.nextInstructionData())
                break;
        }


        let currentPosition = iterator.getPositionInSeconds();

        if (groupPositionInTicks > iterator.getPositionInTicks()) {
            const elapsedTicks = groupPositionInTicks - iterator.getPositionInTicks();
            currentPosition += Song.ticksToSeconds(elapsedTicks, iterator.getBeatsPerMinute(), iterator.getTimeDivision());

        } else if (groupPositionInTicks < iterator.getPositionInTicks()) {
            const elapsedTicks = iterator.getPositionInTicks() - groupPositionInTicks;
            currentPosition -= Song.ticksToSeconds(elapsedTicks, iterator.getBeatsPerMinute(), iterator.getTimeDivision());
        }

        // console.info("getGroupPositionFromTicks", groupPositionInTicks, currentPosition);
        return currentPosition;
    }


    // getSongPositionInTicks(positionInSeconds = null) {
    //     if (positionInSeconds === null)
    //         positionInSeconds = this.getSongPlaybackPosition();
    //     return this.getGroupPositionInTicks(this.getStartTrackName(), positionInSeconds);
    // }



    // getGroupPositionInTicks(trackName, positionInSeconds) {
    //     const iterator = InstructionIterator.getIteratorFromSong(this, trackName); //  this.instructionGetIterator(trackName);
    //     while (true) {
    //         if (iterator.getPositionInSeconds() >= positionInSeconds || !iterator.nextInstructionData())
    //             break;
    //     }
    //
    //     let currentPositionInTicks = iterator.getPositionInTicks();
    //     if (positionInSeconds > iterator.getPositionInSeconds()) {
    //         const elapsedTime = positionInSeconds - iterator.getPositionInSeconds();
    //         currentPositionInTicks += Song.secondsToTicks(elapsedTime, iterator.getBeatsPerMinute());
    //
    //     } else if (positionInSeconds < iterator.getPositionInSeconds()) {
    //         const elapsedTime = iterator.getPositionInSeconds() - positionInSeconds;
    //         currentPositionInTicks -= Song.secondsToTicks(elapsedTime, iterator.getBeatsPerMinute());
    //     }
    //
    //     // console.info("getSongPositionInTicks", positionInSeconds, currentPositionInTicks);
    //     return currentPositionInTicks;
    // }

    static ticksToSeconds(elapsedTicks, beatsPerMinute, timeDivision) {
        return (elapsedTicks / timeDivision) * (60 / beatsPerMinute);
    }

    static secondsToTicks(elapsedTime, beatsPerMinute, timeDivision) {
        return Math.round((elapsedTime * timeDivision) / (60 / beatsPerMinute));
    }


    /** Programs **/
    // All programs are sent a 0 frequency play in order to pre-load samples.

    hasProgram(programID) {
        return !!this.getProxiedData().programs[programID];
    }

    // /** @deprecated Use custom arg processor **/
    // playProgram(destination, program, noteFrequency, noteStartTime, noteDuration=null, noteVelocity=null, onstart=null, onended=null) {
    //     if(onstart !== null) {
    //         let currentTime = destination.context.currentTime;
    //         setTimeout(onstart, (noteStartTime - currentTime) * 1000);
    //     }
    //     return program.playFrequency(destination, noteFrequency, noteStartTime, noteDuration, noteVelocity, onended);
    // }

    programGetData(programID, proxiedData=true)         { return this.programLoader.getData(programID, proxiedData); }
    programGetClassName(programID)                              { return this.programLoader.getClassName(programID); }
    programGetClass(programID)                                  { return this.programLoader.getClass(programID); }
    programGetConfig(programID, proxiedData=true)       { return this.programLoader.getConfig(programID, proxiedData); }


    // programGetList() {
    //     return this.data.programs;
    // }
    programEach(callback) {
        const data = this.getProxiedData();
        return data.programs.map(function(entry, programID) {
            const [className, config] = entry || [null, {}];
            return callback(programID, className, config);
        });
    }


    /** Asset Loading **/
    async programLoadAll() {
        const programList = this.getProxiedData().programs;
        // console.log('programList', programList);
        const promises = [];
        for (let programID = 0; programID < programList.length; programID++) {
            if (programList[programID]) {
                const instance = this.programLoadInstanceFromID(programID);
                console.log('instance', instance, programID);
                if(instance.waitForAssetLoad)
                    promises.push(instance.waitForAssetLoad());
            }
        }
        for(let i=0; i < promises.length; i++)
            await promises[i];

        this.dispatchEvent({
            type: 'song:loaded',
            song: this
        });
    }


    programLoadInstanceFromID(programID) {
        return this.programLoader.loadInstanceFromID(programID);
        // this.dispatchEvent({
        //     type: 'programs:instance',
        //     program,
        //     programID,
        //     song: this
        // });
    }

    programLoadRenderer(programID) {
        return this.programLoader.programLoadRenderer(programID);
    }


    programAdd(programClassName, programConfig={}) {
        if (typeof programConfig !== 'object')
            throw new Error("Invalid programs config object");
        if (!programClassName)
            throw new Error("Invalid Program Class");

        const programList = this.data.programs;
        const programID = programList.length;

        this.data.programs[programID] = [programClassName, programConfig];
        this.programLoadInstanceFromID(programID);
        return programID;
    }

    programReplace(programID, programClassName, programConfig={}) {
        // Preserve old programs name
        // if (oldConfig && oldConfig.title && !programConfig.title)
        //     programConfig.title = oldConfig.title;

        this.stopPlayback();

        const oldConfig = this.getProxiedData().programs[programID];
        this.data.programs[programID] = [programClassName, programConfig];
        this.programLoadInstanceFromID(programID);

        return oldConfig;
    }

    programRename(programID, newTitle) {
        const config = this.programGetConfig(programID);
        config.title = newTitle;
    }

    programRemove(programID) {
        const programList = this.data.programs;
        if (typeof programList[programID] === "undefined")
            return console.error("Invalid program ID: " + programID);
        const isLastProgram = programID === programList.length - 1;

        const oldConfig = programList[programID];
        if(isLastProgram) {
            programList.splice(programID, 1);
        } else {
            programList[programID] = null;
        }
        // this.programUnload(programID);
        // console.log('programRemove', programID, this.getProxiedData().programs)
        return oldConfig;
    }



    /** Playback **/

    setVolume(newVolume) {
        this.volume = newVolume;
        if(this.lastVolumeGain)
            this.lastVolumeGain.gain.value = newVolume;
    }


    getSongPlaybackPosition() {
        if (this.playback)
            return this.playback.getPlaybackPosition();
        return this.playbackPosition;
    }


    setPlaybackPositionInTicks(songPositionInTicks) {
        if (!Number.isInteger(songPositionInTicks))
            throw new Error("Invalid start position in ticks");
        // TODO: is start position beyond song's ending?

        const playbackPosition = this.getSongPositionFromTicks(songPositionInTicks);
        return this.setPlaybackPosition(playbackPosition);
    }

    setPlaybackPosition(songPosition) {// TODO: duplicate values? Does the song need to store position?
        songPosition = parseFloat(songPosition);
        if (Number.isNaN(songPosition))
            throw new Error("Invalid start position");

        // this.playback.setPlaybackPosition(this.getAudioContext().currentTime - this.playbackPosition);
        // let isPlaying = !!this.playback;
        if (this.playback) {
            this.stopPlayback();
        }
        this.playbackPosition = songPosition;

        this.dispatchEvent({
            type: 'song:seek',
            position: this.playbackPosition,
            // positionInTicks: this.getSongPositionInTicks(this.playbackPosition), // TODO: use iterator
            song: this
        });

        // console.log('setPlaybackPosition', songPosition);

        // if (isPlaying) {
        //     const oldDestination = this.playback.destination;
        //     this.playback = new InstructionPlayback(oldDestination, this, this.getStartTrackName(), oldDestination.context.currentTime - this.playbackPosition);
        //     // this.playback.awaitPlaybackReachedEnd()
        //     //     .then((reachedEnding) => reachedEnding ? this.stopPlayback(true) : null);
        // }
        // const positionInTicks = this.getSongPositionInTicks(this.playbackPosition);
//         console.log("Seek position: ", this.playbackPosition, positionInTicks);

    }


    play(destination, startPosition=null, onended=null) {
        // destination = this.getVolumeGain(destination);
        // const audioContext = destination.context;
        if (this.playback) {
            this.stopPlayback();
            // this.setPlaybackPosition(0);
            // throw new Error("Song is already playing");
        }

        // await this.init(audioContext);
        if(startPosition === null)
            startPosition = this.playbackPosition;
        if(startPosition > 0) {
            if(startPosition >= this.getSongLengthInSeconds())
                startPosition = 0;
        }
        // console.log("Start playback:", destination, startPosition, onended);
        const playback = new TrackPlayback(destination, this, this.getStartTrackName()); // , this.dispatchEventCallback);
        this.playback = playback;
        playback.play(startPosition)

        this.dispatchEvent({
            type: 'song:play',
            playback: this.playback,
            // positionInTicks: this.getSongPositionInTicks(this.playbackPosition), // TODO: use iterator
            song: this
        });

        playback.awaitPlaybackReachedEnd()
            .then(() => {
                if(onended)
                    onended();
                this.dispatchEvent({
                    type: 'song:end',
                    playback: this.playback,
                    // positionInTicks: this.getSongPositionInTicks(this.playbackPosition), // TODO: use iterator
                    song: this
                });
                // this.setPlaybackPosition(0);
                // if(this.playback)
                //     this.stopPlayback();
            });


        return playback;
        // const reachedEnding = await this.playback.awaitPlaybackReachedEnd();
        // if(reachedEnding)
        //     this.stopPlayback(true);
    }


    // stopProgramPlayback(programID) {
    //     this.programLoader.stopProgramPlayback(programID);
    //     // let programClass = this.programLoader.programGetClass(programID);
    //     // if(typeof programClass.stopPlayback !== "function")
    //     //     return console.error(programClass.name + ".stopPlayback is not a function");
    //     // programClass.stopPlayback();
    // }

    stopPlayback() {
        if (!this.playback)
            return console.warn("Playback is already stopped");
        const playback = this.playback;
        this.playback = null;
        this.playbackPosition = playback.getPositionInSeconds();
        playback.stopPlayback();
        ProgramLoader.stopAllPlayback(); // TODO: redundant? necessary if no playback

        // TODO: move to playback class
        // for (let i = 0; i < this.playbackEndCallbacks.length; i++)
        //     this.playbackEndCallbacks[i]();
        // this.playbackEndCallbacks = [];
        // for (let i = 0; i < this.waitCancels.length; i++)
        //     this.waitCancels[i]();
        // this.waitCancels = [];


        // console.log("End playback:", this.playbackPosition);


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

    isPlaying() {
        return this.playback && this.playback.isActive();
    }


    playSelectedInstructions(destination, trackName, selectedIndices) {
        // destination = this.getVolumeGain(destination);

        // TrackIterator find playback position of first index start point
        if(this.playback)
            this.stopPlayback();
        if(selectedIndices.length > 0) {
            const playback = new TrackPlayback(destination, this, trackName, function (commandString, trackStats) {
                if (trackStats.trackName !== trackName)
                    return true;
                const index = trackStats.currentIndex;
                return selectedIndices.indexOf(index) !== -1;
            })
            this.playback = playback;
            // TrackPlayback with selective callback
            playback.playAtStartingTrackIndex(selectedIndices[0])
            // playback.play(destination);
        }

        // for(let i=0; i<selectedIndices.length; i++) {
        //     const selectedIndex = selectedIndices[i];
        //     const instruction = song.instructionGetByIndex(trackName, selectedIndex);
        //     song.playInstruction(destination, instruction, trackState.programID);
        // }

    }

    playMIDIEvent(destination, programID, eventData) {
        let program;
        const [lastMIDIProgram, lastMIDIProgramConfig] = this.lastMIDIProgram || [null, null, null];
        const [className, programConfig] = this.programGetData(programID, false);
        if(lastMIDIProgramConfig !== programConfig) {
            program = ProgramLoader.loadInstance(className, programConfig);
            this.lastMIDIProgram = [program, programConfig];
            // console.log("Loading program for MIDI playback: ", programID, className, programConfig);
        } else {
            program = lastMIDIProgram;
        }
        if(program.playMIDIEvent)
            program.playMIDIEvent(destination, eventData);
        else
            console.warn("Program " + program.constructor.name + " has no method 'playMIDIEvent'");
    }

    // playInstructionAtIndex(destination, trackName, instructionIndex, noteStartTime = null) {
    //     const instruction = this.instructionGetByIndex(trackName, instructionIndex, false);
    //     if (instruction)
    //         this.playInstruction(instruction, noteStartTime);
    //     else
    //         console.warn("No instruction at index");
    // }

    // playInstruction(destination, instruction, program, noteStartTime = null, onstart=null, onended=null) {
    //     // destination = this.getVolumeGain(destination);
    //
    //     const audioContext = destination.context;
    //     if (!instruction instanceof Instruction)
    //         throw new Error("Invalid instruction");
    //
    //     // if(this.playback)
    //     //     this.stopPlayback();
    //
    //     // if (instruction instanceof ASCTrackInstruction) { // Handled in  TrackPlayback
    //     //     return new TrackPlayback(destination, this, instruction.getTrackName(), noteStartTime);
    //     // }
    //
    //
    //     // const noteDuration = (instruction.duration || 1) * (60 / beatsPerMinute);
    //
    //     let noteDuration = null;
    //     if(typeof instruction.durationTicks !== "undefined") {
    //         let beatsPerMinute = this.data.beatsPerMinute; // getStartingBeatsPerMinute();
    //         let timeDivision = this.data.timeDivision;
    //         const noteDurationTicks = instruction.durationTicks; // (timeDivision);
    //         noteDuration = (noteDurationTicks / timeDivision) / (beatsPerMinute / 60);
    //     }
    //
    //     let currentTime = audioContext.currentTime;
    //
    //     if (!noteStartTime && noteStartTime !== 0)
    //         noteStartTime = currentTime;
    //
    //
    //     this.playProgram(destination, program, instruction.command, noteStartTime, noteDuration, instruction.velocity, onstart, onended);
    //     // Wait for note to start
    //     // if (noteStartTime > currentTime) {
    //     //     await this.wait(noteStartTime - currentTime);
    //     //     // await new Promise((resolve, reject) => setTimeout(resolve, (noteStartTime - currentTime) * 1000));
    //     // }
    //
    //     // Dispatch note start event
    //     // this.dispatchEvent({
    //     //     type: 'note:start',
    //     //     trackName,
    //     //     instruction,
    //     //     song: this
    //     // });
    //
    //     // currentTime = audioContext.currentTime;
    //     // if (noteStartTime + noteDuration > currentTime) {
    //     //     await this.wait(noteStartTime + noteDuration - currentTime);
    //     //     // await new Promise((resolve, reject) => setTimeout(resolve, (noteStartTime + noteDuration - currentTime) * 1000));
    //     // }
    //     // // TODO: check for song stop
    //     // // Dispatch note end event
    //     // this.dispatchEvent({
    //     //     type: 'note:end',
    //     //     trackName,
    //     //     instruction,
    //     //     song: this
    //     // });
    // }



    /** Song Modification History **/



    queueHistoryAction(action, pathList, data = null, oldData = null) {
        if(Array.isArray(pathList))
            pathList = pathList.join('.');
        const historyAction = [
            action, pathList,
        ];
        if (data !== null || oldData !== null)
            historyAction.push(data);
        if (oldData !== null)
            historyAction.push(oldData);
        // this.history.push(historyAction);

        // setTimeout(() => {

        this.dispatchEvent({
            type: 'song:modified',
            historyAction,
            song: this
        });

        return historyAction;
    }



    /** History **/

    applyHistoryActions(songHistory) {
        for (let i = 0; i < songHistory.length; i++) {
            const historyAction = songHistory[i];
            this.applyHistoryAction(historyAction);
        }
    }

    applyHistoryAction(...args) {
        const historyAction = args.shift();
        const path = args.shift().split('.');
        const lastPath = path.pop();
        const songData = this.getProxiedData();

        let target = songData;

        for(let i=0; i<path.length; i++) {
            target = target[path[i]];
        }
        switch (historyAction) {
            // case 'reset':
            //     Object.assign(this.data, historyAction.data);
            //     break;
            case 'set':
                const newValue = args.shift();
                target[lastPath] = newValue;
                break;
            case 'delete':
                delete target[lastPath];
                break;
            case 'replace':
                const replaceValue = args.shift();
                const oldValue = args.shift();
                if(oldValue !== target[lastPath]) {
                    console.warn(`Replace value mismatch: ${oldValue} !== ${songData[lastPath]}`)
                }
                target[lastPath] = replaceValue;
                break;
            default:
                throw new Error("Unknown history action: " + historyAction);
        }
    }


    /** Static Fle Support Module **/

    static getFileSupportModule(filePath) {
        // const AudioSourceLoader = customElements.get('audio-source-loader');
        // const requireAsync = AudioSourceLoader.getRequireAsync(thisModule);
        const fileExt = filePath.split('.').pop().toLowerCase();
        let library;
        switch (fileExt) {
            case 'mid':
            case 'midi':
                return new MIDIFileSupport();
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
                throw new Error("Unsupported");
                // library = new GMESongFile();
                // library.init();
                // return library;
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

}

Song.DEFAULT_VOLUME = 0.7;


// Song.loadSongFromMIDIFile = async function (file, defaultProgramURL = null) {
//     defaultProgramURL = defaultProgramURL || this.getDefaultProgramURL();
//     const midiSupport = new MIDIImport();
//     const songData = await midiSupport.loadSongFromMidiFile(file, defaultProgramURL);
//     const song = new Song();
//     await song.loadSongData(songData);
//     return song;
// };




export default Song;
