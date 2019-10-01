const path = require('path');

const DIR_ROOT = path.dirname(__dirname);

const {AudioSourceSong} = require(DIR_ROOT + '/common/audio-source-song.js');
const {AudioSourceStorage} = require(DIR_ROOT + '/common/audio-source-storage.js');
const {AudioSourceValues} = require(DIR_ROOT + '/common/audio-source-values.js');


class AudioSourceCommonTest {
    constructor() {
    }

    async test() {
        console.info("Test Started: ", this.constructor.name);
        await this.testStorage();
        await this.testSongClass();
        await this.testValues();
        console.info("Test Complete: ", this.constructor.name);
    }


    async testStorage() {
        const s = new AudioSourceStorage();
        const songData = s.generateDefaultSong();

    }

    async testValues() {
        const s = new AudioSourceSong();

        const v = new AudioSourceValues(s);
        v.valueTypes.forEach(valueType => {
            v.getValues(valueType, (value, title) => {
                // console.info(value, title);
            })
        })

    }

    async testSongClass() {
        const song = new AudioSourceSong();
        const songData = song.data;


        const testGroup = song.rootGroup;
        const root = song.data.instructions.root;

        // Insert Instructions
        song.insertInstructionAtIndex(testGroup, root.length, 'ins0');
        song.insertInstructionAtIndex(testGroup, root.length, [20, 'ins20' ]);



        song.insertInstructionAtPosition(testGroup, 20, 'pos20');
        song.insertInstructionAtPosition(testGroup, 10, 'pos10');
        song.insertInstructionAtPosition(testGroup, 0, 'pos0');

        song.insertInstructionAtPosition(testGroup, '1B', 'pos1B');
        song.insertInstructionAtPosition(testGroup, '0.5B', 'pos1/2B');
        song.insertInstructionAtPosition(testGroup, '8B', 'pos8B');
        song.insertInstructionAtPosition(testGroup, '16B', 'pos16B');


        console.log("Root: ", root);

        // Test Get Instructions

        [1,2].forEach(i => {
            const testInstructions = song.getInstructions(testGroup, i);
            console.assert(song.getInstructionIndex(testGroup, testInstructions[0]) === i, 'getInstructionIndex');
        });

        // Test Iterator
        let iterator = song.getIterator(testGroup);
        let instruction, instructionList, positionInTicks=0;
        while(instruction = iterator.nextInstruction()) {
            positionInTicks += instruction.deltaDuration;
            console.assert(instruction.positionInTicks === positionInTicks, `instruction.positionInTicks ${instruction.positionInTicks} !== ${positionInTicks}\n`, instruction);
        }

        // Test Row Iterator
        iterator = song.getIterator(testGroup);
        positionInTicks = 0;
        while(instructionList = iterator.nextInstructionRow()) {
            // positionInTicks = iterator.groupPositionInTicks;
            const firstInstruction = instructionList[0];
            if(firstInstruction) {
                positionInTicks += firstInstruction.deltaDuration;
                for(let i=0; i<instructionList.length; i++) {
                    const instruction = instructionList[i];
                    console.assert(instruction.positionInTicks === positionInTicks, `instruction[${i}].positionInTicks ${instruction.positionInTicks} !== ${positionInTicks}\n`, instruction);
                }
            } else {
                console.assert(iterator.hasReachedEnd, "Iterator failed to reach the end");
            }
        }

        // Test Quantized Row Iterator
        iterator = song.getIterator(testGroup);
        positionInTicks = 0;
        while(instructionList = iterator.nextInstructionQuantizedRow(song.timeDivision)) {
            // console.assert(iterator.groupPositionInTicks === positionInTicks, `iterator.groupPositionInTicks ${iterator.groupPositionInTicks} !== ${positionInTicks}\n`, instruction);
            if(positionInTicks > 0)
            console.assert(positionInTicks < iterator.groupPositionInTicks, "Invalid position order");
            positionInTicks = iterator.groupPositionInTicks;
            // console.log(iterator.groupPositionInTicks, instructionList, iterator.groupIndex);
            for(let i=0; i<instructionList.length; i++) {
                const instruction = instructionList[i];
                console.assert(instruction.positionInTicks === iterator.groupPositionInTicks, `instruction[${i}].positionInTicks ${instruction.positionInTicks} !== ${iterator.groupPositionInTicks}\n`, instruction);
            }
        }

        // Groups
        const newRootGroup = song.generateInstructionGroupName('root');
        song.addInstructionGroup(newRootGroup, ['A', 'B', 'C', 10, 'D']);
        song.removeInstructionGroup(newRootGroup);

        console.info("Test song: ", Math.round(song.getSongLength() * 10000) / 10000 + 's', songData);

        // TODO: set position

        song.setPlaybackPosition(0.01);
        song.setPlaybackPosition(0.1);
        song.setPlaybackPosition(1);
        song.setPlaybackPositionInTicks(10);
        song.setPlaybackPositionInTicks(100);
        song.setPlaybackPositionInTicks(1000);

        // Get Song Info
        console.assert(song.songPlaybackPosition > 0, "songPlaybackPosition");
        console.assert(song.getSongLength() > 0, "getSongLength()");
        // console.assert(r.getSongPositionInTicks() > 0, "getSongPositionInTicks");


        // Delete Instructions
        while(root.length > 0)
            song.deleteInstructionAtIndex(testGroup, 0);


        // console.assert(r.getSongPositionFromTicks() === 0, "getSongPositionInSeconds");
        // console.assert(r.getSongPositionInTicks() === 0, "getSongPositionInTicks");
    }
}

if(typeof module !== "undefined")
    module.exports = {AudioSourceCommonTest};