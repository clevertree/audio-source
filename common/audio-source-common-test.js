const path = require('path');

const DIR_ROOT = path.dirname(__dirname);

const {AudioSourceRenderer} = require(DIR_ROOT + '/common/audio-source-renderer.js');
const {AudioSourceStorage} = require(DIR_ROOT + '/common/audio-source-storage.js');
const {AudioSourceValues} = require(DIR_ROOT + '/common/audio-source-values.js');


class AudioSourceCommonTest {
    constructor() {
    }

    async test() {
        console.info("Test Started: ", this.constructor.name);
        await this.testStorage();
        await this.testRenderer();
        await this.testValues();
        console.info("Test Complete: ", this.constructor.name);
    }


    async testStorage() {
        const s = new AudioSourceStorage();
        const songData = s.generateDefaultSong();

    }

    async testValues() {
        const s = new AudioSourceStorage();
        const songData = s.generateDefaultSong();

        const r = new AudioSourceRenderer(songData);

        const v = new AudioSourceValues(r);
        v.valueTypes.forEach(valueType => {
            v.getValues(valueType, (value, title) => {
                // console.info(value, title);
            })
        })

    }

    async testRenderer() {
        const s = new AudioSourceStorage();
        const songData = s.generateDefaultSong();

        const r = new AudioSourceRenderer(songData);


        const testGroup = r.getSongRootGroup();
        const root = r.getSongData().instructions.root;

        // Insert Instructions
        r.insertInstructionAtIndex(testGroup, root.length, 'ins0');
        r.insertInstructionAtIndex(testGroup, root.length, [20, 'ins20' ]);



        r.insertInstructionAtPosition(testGroup, 20, 'pos20');
        r.insertInstructionAtPosition(testGroup, 10, 'pos10');
        r.insertInstructionAtPosition(testGroup, 0, 'pos0');

        r.insertInstructionAtPosition(testGroup, '1B', 'pos1B');
        r.insertInstructionAtPosition(testGroup, '0.5B', 'pos1/2B');
        r.insertInstructionAtPosition(testGroup, '8B', 'pos8B');
        r.insertInstructionAtPosition(testGroup, '16B', 'pos16B');


        console.log("Root: ", root);

        // Get Instructions

        [1,2].forEach(i => {
            const testInstructions = r.getInstructions(testGroup, i);
            console.assert(r.getInstructionIndex(testGroup, testInstructions[0]) === i, 'getInstructionIndex');
        });

        // Groups
        const newRootGroup = r.generateInstructionGroupName('root');
        r.addInstructionGroup(newRootGroup, ['A', 'B', 'C', 10, 'D']);
        r.removeInstructionGroup(newRootGroup);

        console.info("Test song: ", Math.round(r.getSongLength() * 10000) / 10000 + 's', songData);

        // TODO: set position

        r.setPlaybackPosition(0.01);
        r.setPlaybackPosition(0.1);
        r.setPlaybackPosition(1);
        r.setPlaybackPositionInTicks(10);
        r.setPlaybackPositionInTicks(100);
        r.setPlaybackPositionInTicks(1000);

        // Get Song Info
        console.assert(r.songPlaybackPosition > 0, "songPlaybackPosition");
        console.assert(r.getSongLength() > 0, "getSongLength()");
        // console.assert(r.getSongPositionInTicks() > 0, "getSongPositionInTicks");


        // Delete Instructions
        while(root.length > 0)
            r.deleteInstructionAtIndex(testGroup, 0);


        // console.assert(r.getSongPositionFromTicks() === 0, "getSongPositionInSeconds");
        // console.assert(r.getSongPositionInTicks() === 0, "getSongPositionInTicks");
    }
}

if(typeof module !== "undefined")
    module.exports = {AudioSourceCommonTest};