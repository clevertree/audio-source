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
        const s = new AudioSourceSong();
        const songData = s.data;


        const testGroup = s.rootGroup;
        const root = s.data.instructions.root;

        // Insert Instructions
        s.insertInstructionAtIndex(testGroup, root.length, 'ins0');
        s.insertInstructionAtIndex(testGroup, root.length, [20, 'ins20' ]);



        s.insertInstructionAtPosition(testGroup, 20, 'pos20');
        s.insertInstructionAtPosition(testGroup, 10, 'pos10');
        s.insertInstructionAtPosition(testGroup, 0, 'pos0');

        s.insertInstructionAtPosition(testGroup, '1B', 'pos1B');
        s.insertInstructionAtPosition(testGroup, '0.5B', 'pos1/2B');
        s.insertInstructionAtPosition(testGroup, '8B', 'pos8B');
        s.insertInstructionAtPosition(testGroup, '16B', 'pos16B');


        console.log("Root: ", root);

        // Test Get Instructions

        [1,2].forEach(i => {
            const testInstructions = s.getInstructions(testGroup, i);
            console.assert(s.getInstructionIndex(testGroup, testInstructions[0]) === i, 'getInstructionIndex');
        });

        // Test Iterator
        let iterator = s.getIterator(testGroup);
        let instruction, instructionList, positionInTicks=0;
        while(instruction = iterator.nextInstruction()) {
            positionInTicks += instruction.deltaDuration;
            console.assert(instruction.positionInTicks === positionInTicks, `instruction.positionInTicks ${instruction.positionInTicks} !== ${positionInTicks}\n`, instruction);
        }

        // Test Row Iterator
        iterator = s.getIterator(testGroup);
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

        // Groups
        const newRootGroup = s.generateInstructionGroupName('root');
        s.addInstructionGroup(newRootGroup, ['A', 'B', 'C', 10, 'D']);
        s.removeInstructionGroup(newRootGroup);

        console.info("Test song: ", Math.round(s.getSongLength() * 10000) / 10000 + 's', songData);

        // TODO: set position

        s.setPlaybackPosition(0.01);
        s.setPlaybackPosition(0.1);
        s.setPlaybackPosition(1);
        s.setPlaybackPositionInTicks(10);
        s.setPlaybackPositionInTicks(100);
        s.setPlaybackPositionInTicks(1000);

        // Get Song Info
        console.assert(s.songPlaybackPosition > 0, "songPlaybackPosition");
        console.assert(s.getSongLength() > 0, "getSongLength()");
        // console.assert(r.getSongPositionInTicks() > 0, "getSongPositionInTicks");


        // Delete Instructions
        while(root.length > 0)
            s.deleteInstructionAtIndex(testGroup, 0);


        // console.assert(r.getSongPositionFromTicks() === 0, "getSongPositionInSeconds");
        // console.assert(r.getSongPositionInTicks() === 0, "getSongPositionInTicks");
    }
}

if(typeof module !== "undefined")
    module.exports = {AudioSourceCommonTest};