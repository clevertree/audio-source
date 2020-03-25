import {instanceOf} from "prop-types";
import GroupInstruction from "./GroupInstruction";

class InstructionPlayback {
    constructor(destination, song, groupName, startTime = null, seekLength = 1000) {
        if (!destination || !destination.context)
            throw new Error("Invalid destination");
        startTime = startTime || destination.context.currentTime;

        this.audioContext = destination.context;
        this.song = song;
        // this.groupName = groupName;
        // this.seekLength = seekLength;
        this.subGroups = [];
        this.startGroupPlayback(destination, groupName, startTime);
        setInterval(() => this.renderPlayback(), seekLength);
        this.renderPlayback();
    }

    startGroupPlayback(destination, groupName, startTime) {
        const iterator = this.song.instructionGetIterator(groupName);
        this.subGroups.push([
            startTime,
            destination,
            iterator
        ]);
        console.log('group:start', groupName);
        this.song.dispatchEvent(new CustomEvent('group:start', {
            detail: {
                startTime,
                groupName
            }
        }));
    }

    endGroupPlayback(groupID) {
        const [startTime, destination, iterator] = this.subGroups[groupID];
        this.subGroups.splice(groupID, 1);
        const groupEndDelaySeconds = (iterator.endPositionSeconds + startTime) - this.audioContext.currentTime;
        setTimeout(() => {
            console.log('group:end', iterator.groupName, iterator.endPositionSeconds);
            this.song.dispatchEvent(new CustomEvent('group:end', {
                detail: {
                    playback: this,
                    iterator
                }
            }));
        }, groupEndDelaySeconds)
    }

    async awaitPlaybackReachedEnd() {
        await this.wait(5);
    }

    async wait(waitTimeInSeconds) {
//             console.info("Waiting... ", waitTimeInSeconds);
        return await new Promise((resolve, reject) => {
            setTimeout(() => resolve(true), waitTimeInSeconds * 1000);
        });
    }

    renderPlayback() {
        const audioContext = this.audioContext;
        for(let i=0; i<this.subGroups.length; i++) {
            const [startTime, destination, iterator] = this.subGroups[i];
            const currentPositionSeconds = audioContext.currentTime - startTime;

            if(iterator.positionSeconds > currentPositionSeconds)
                continue;


            if(iterator.hasReachedEnd()) {
                this.endGroupPlayback(i);
                i--;
                continue;
            }

            const instruction = iterator.nextInstruction();
            const noteStartTime = startTime + iterator.playbackTime; // Group start time equals current group's start + playback times
            if (instruction instanceof GroupInstruction) {
                if (instruction.groupName === iterator.groupName) { // TODO group stack
                    console.error(`Recursive group call. Skipping group '${instruction.groupName}'`);
                    continue;
                }

                this.startGroupPlayback(destination, instruction.groupName, noteStartTime);

            } else {
                this.song.playInstruction(destination, instruction, noteStartTime, iterator.groupName);
            }
        }
    }
}

//
//
// class InstructionPlayback2 {
//     constructor(destination, song, groupName, startTime = null, seekLength = 1) {
//         if (!destination || !destination.context)
//             throw new Error("Invalid destination");
//         startTime = startTime || destination.context.currentTime;
//
//         this.destination = destination;
//         this.song = song;
//         this.groupName = groupName;
//         this.seekLength = seekLength;
//         this.iterator = null;
//         this.stopPlaybackCallback = null;
//         this.subGroups = [];
//         this.startTime = startTime;
//         // this.lastRowPlaybackTime = 0;
//         this.trackerQuantizationInTicks = song.data.timeDivision;
//         this.isActive = false;
//         this.isPaused = false;
//         // this.activeGroups =
//     }
//
//     get audioContext() {
//         return this.destination.context;
//     }
//
//     get groupPositionInTicks() {
//         return this.iterator.positionTicks;
//     }
//
//     getGroupPositionInSeconds() {
//         return this.audioContext.currentTime - this.startTime;
//     }
//
//     async wait(waitTimeInSeconds) {
// //             console.info("Waiting... ", waitTimeInSeconds);
//         return await new Promise((resolve, reject) => {
//             this.stopPlaybackCallback = () => {
//                 console.info("Group aborted: ", this.groupName);
//                 this.isActive = false;
//                 resolve(false);
//             };
//             setTimeout(() => resolve(true), waitTimeInSeconds * 1000);
//         });
//     }
//
//     /** @deprecated **/
//     async playGroup() {
//         const audioContext = this.audioContext;
//         this.isActive = true;
//         const iterator = this.song.getInstructionIterator(this.groupName);
//         this.iterator = iterator;
//         this.song.dispatchEvent(new CustomEvent('group:play', {
//             detail: {
//                 playback: this,
//                 iterator
//             }
//         }));
//
//         while (this.isActive && this.playNextInstructionRow(this.destination)) {
//             let currentTime = audioContext.currentTime - this.startTime;
//             const waitTime = this.iterator.groupPlaybackTime - currentTime - this.seekLength;
//             await this.wait(waitTime);
//         }
//
//         let remainingTime = audioContext.currentTime - this.startTime;
//         if (this.isActive && this.iterator && remainingTime < this.iterator.groupPlaybackEndTime) {
//             // Wait for notes to finish
//             const waitTime = this.iterator.groupPlaybackEndTime - remainingTime;
//             await this.wait(waitTime);
//         }
//
//         // this.stopPlayback(false);
//
//         // if(this.iterator) never happens
//         //     this.stopPlayback(false);
//
//         this.song.dispatchEvent(new CustomEvent('group:end', {
//             detail: {
//                 playback: this,
//                 iterator
//             }
//         }));
//
//
//         let elapsedTime = audioContext.currentTime - this.startTime;
//         console.info("Group finished: ", this.groupName, elapsedTime);
//         const wasActive = this.isActive;
//         this.isActive = true;
//         return wasActive; // Determines if the playlist should play the next song
//     }
//
//
//     async stopPlayback(stopInstruments = true) {
//         if (this.stopPlaybackCallback) {
//             this.stopPlaybackCallback();
//             this.stopPlaybackCallback = null;
//         }
//         const iterator = this.iterator;
//         this.iterator = null;
//         // If we reached the end of the iterator, trigger event
//         this.song.dispatchEvent(new CustomEvent('group:stop', {
//             detail: {
//                 playback: this,
//                 iterator
//             }
//         }));
//
//         if (stopInstruments) {
//
//             // Stop all instruments playback (if supported)
//             const instrumentList = this.song.getInstrumentList();
//             for (let instrumentID = 0; instrumentID < instrumentList.length; instrumentID++) {
//                 const instrument = await this.song.getInstrument(instrumentID, false);
//                 if (instrument && instrument.stopPlayback)
//                     instrument.stopPlayback();
//             }
//         }
//
//         // Stop subgroups
//         this.subGroups.forEach(playback => playback.stopPlayback(stopInstruments));
//     }
//
//     playNextInstructionRow(destination) {
//         const audioContext = this.audioContext;
//         if (!this.isActive)
//             throw new Error("Playback is not active");
//
//         const instructionList = this.iterator.nextInstructionRow();
//         if (!instructionList)
//             return false;
//
//
//         // const audioContext = audioContext;
//         const noteStartTime = this.startTime + this.iterator.groupPlaybackTime;
//         // const waitTime = (notePosition - audioContext.currentTime); //  - this.seekLength;
// //         console.log(this.iterator.positionTicks, instructionList, this.iterator.currentIndex);
//
//         // Wait ahead of notes if necessary (by seek time)
//         // if (waitTime > 0) {
//         //     // console.log("Waiting ... " + waitTime, notePosition, this.iterator.groupPlaybackTime, audioContext.currentTime);
//         //     await new Promise((resolve, reject) => setTimeout(resolve, waitTime * 1000));
//         // }
//         // if (!this.isActive)
//         //     return false;
//
//
//         for (let i = 0; i < instructionList.length; i++) {
//             const instruction = instructionList[i];
//             if (instruction.isGroupCommand()) {
//                 let subGroupName = instruction.getGroupFromCommand();
//                 if (subGroupName === this.iterator.groupName) { // TODO group stack
//                     console.error("Recursive group call. Skipping group '" + subGroupName + "'");
//                     continue;
//                 }
//
//                 const groupPlayback = new InstructionPlayback(destination, this.song, subGroupName, audioContext.startTime - noteStartTime);
//                 this.subGroups.push(groupPlayback);
//                 groupPlayback.playGroup(); // TODO: ugly
//
//             } else {
//                 this.song.playInstruction(destination, instruction, noteStartTime, this.groupName);
//             }
//         }
//
//         // const detail = {
//         //     groupName: this.groupName,
//         //     position: this.iterator.groupPlaybackTime,
//         //     positionInTicks: this.iterator.positionTicks
//         // };
//         // this.song.dispatchEvent(new CustomEvent('group:seek', this));
//         // console.info('playNextInstructionRow', this.startTime, waitTime, this.iterator.groupPlaybackTime, instructionList); // audioContext.currentTime, waitTime, instructionList);
//
//         return true;
//
//     }
// }

export default InstructionPlayback;
