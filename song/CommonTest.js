const path = require('path');

const DIR_ROOT = path.dirname(__dirname);

const {Song} = require(DIR_ROOT + '/common/Song.js');
const {Storage} = require(DIR_ROOT + '/common/Storage.js');
const {Values} = require(DIR_ROOT + '/common/Values.js');


class CommonTest {
    constructor() {
    }

    async test() {
        console.info("Test Started: ", this.constructor.name, __filename);
        await this.testStorage();
        await this.testSongClass();
        // await this.testValues();
        console.info("Test Complete: ", this.constructor.name);
    }


    async testStorage() {
        const s = new Storage();
        const songData = s.generateDefaultSong();

    }

    // async testValues() {
    //     const s = new Song();
    //
    //     const v = new Values(s);
    //     v.valueTypes.forEach(valueType => {
    //         v.getValues(valueType, (value, title) => {
    //             // console.info(value, title);
    //         })
    //     })
    //
    // }

    async testSongClass() {
        const song = new Song();
        await song.loadSongData({});
        const songData = song.data;


        const testGroup = song.getRootGroup();
        const root = song.data.instructions.root;

        // Insert Instructions
        const textNotes = {
            insert: [
                [0, 'ins00'],
                [10, [10, 'ins10']],
                [30, [20, 'ins30']],
                [60, [30, 'ins60']],
                [100, [40, 'ins100']],
                [150, [50, 'ins150']],
            ],
            position: [
                [0,     [0,  'pos00']],
                [5,     [5,  'pos05']],
                [10,    [10, 'pos10']],
                [15,    [15, 'pos15']],
                [20,    [20, 'pos20']],
                [25,    [25, 'pos25']],
                [30,    [30, 'pos30']],
                [30,    ['0.5B', 'pos.5B']],
                [30,    ['1B', 'pos1B']],
                [30,    ['8B', 'pos8B']],
            ]
        };
        for(let i=0; i<textNotes.insert.length; i++) {
            const [pos, insertNote] = textNotes.insert[i];
            const index = song.instructionInsertAtIndex(testGroup, root.length, insertNote);
            if(song.instructionFind(testGroup, index).positionInTicks !== pos)
                throw new Error("Invalid insert position: " + pos);
        }
        for(let i=0; i<textNotes.position.length; i++) {
            const [pos, insertNote] = textNotes.position[i];
            const index = song.instructionInsertAtPosition(testGroup, pos, insertNote);
            if(song.instructionFind(testGroup, index).positionInTicks !== pos)
                throw new Error("Invalid insert position: " + pos);
        }


        // Test Get Instructions

        [1,2].forEach(i => {
            const testInstruction = song.instructionFind(testGroup, i);
            console.assert(song.instructionFindIndex(testGroup, testInstruction) === i, 'instructionFindIndex');
        });

        // Test Iterator
        let currentIndex = 0;
        let iterator = song.instructionGetIterator(testGroup);
        let instruction, instructionList, positionInTicks=0, playbackTime=0;
        while(instruction = iterator.nextInstruction()) {
            positionInTicks += instruction.deltaDuration;
            if(instruction.positionInTicks !== positionInTicks)
                throw new Error(`instruction.positionInTicks ${instruction.positionInTicks} !== ${positionInTicks}\n`);
        }

        // Test Row Iterator
        currentIndex = 0;
        iterator = song.instructionGetIterator(testGroup);
        positionInTicks = 0;
        while(true) {
            instructionList = iterator.nextInstructionRow();
            // positionInTicks = iterator.groupPositionInTicks;
            if(instructionList === null) {
                if(!iterator.hasReachedEnd)
                    throw new Error("Iterator failed to reach the end");
                break;
            }
            const firstInstruction = instructionList[0];
            if(firstInstruction) {
                const firstIndex = firstInstruction.index;
                positionInTicks += firstInstruction.deltaDuration;
                for(let i=0; i<instructionList.length; i++) {
                    const instruction = instructionList[i];
                    if(instruction.positionInTicks !== positionInTicks)
                        throw new Error(`instruction[${i}].positionInTicks ${instruction.positionInTicks} !== ${positionInTicks}\n`);
                    if(instruction.index !== currentIndex)
                        throw new Error(`instruction[${i}].index ${instruction.index} !== ${currentIndex}\n`);
                    currentIndex++
                }
            }
        }

        // Test Quantized Row Iterator
        iterator = song.instructionGetIterator(testGroup);
        positionInTicks = 0, playbackTime = 0;
        while(true) {
            instructionList = iterator.nextInstructionQuantizedRow(5);
            if(instructionList === null) {
                if(!iterator.hasReachedEnd)
                    throw new Error("Iterator failed to reach the end");
                break;
            }
            if(iterator.groupPositionInTicks - positionInTicks > 5)
                throw new Error("Iterator quantization failed");
            positionInTicks = iterator.groupPositionInTicks;

            // if(iterator.groupPositionInTicks - positionInTicks > song.getTimeDivision())
            //     throw new Error('quantization failed for groupPositionInTicks');
            if(iterator.groupPlaybackTime - playbackTime > 0.5)
                throw new Error('quantization failed for groupPlaybackTime');
            // console.log('iterator', iterator.groupPositionInTicks, iterator.groupPlaybackTime);
            // console.assert(iterator.groupPositionInTicks === positionInTicks, `iterator.groupPositionInTicks ${iterator.groupPositionInTicks} !== ${positionInTicks}\n`, instruction);
            // if(positionInTicks > 0)
            //     console.assert(positionInTicks < iterator.groupPositionInTicks, "Invalid position order");
            // positionInTicks = iterator.groupPositionInTicks;
            playbackTime = iterator.groupPlaybackTime;
            // console.log(iterator.groupPositionInTicks, instructionList, iterator.groupIndex);
            for(let i=0; i<instructionList.length; i++) {
                const instruction = instructionList[i];
                if(instruction.positionInTicks !== iterator.groupPositionInTicks)
                    throw new Error(`instruction[${i}].positionInTicks ${instruction.positionInTicks} !== ${iterator.groupPositionInTicks}\n`);
            }
        }

        // Groups
        const newRootGroup = song.generateInstructionGroupName('root');
        song.groupAdd(newRootGroup, ['A', 'B', 'C', 10, 'D']);
        song.groupRemove(newRootGroup);

        console.info("Test song: ", Math.round(song.getSongLengthInSeconds() * 10000) / 10000 + 's', songData);

        // TODO: set position

        song.setPlaybackPosition(0.01);
        song.setPlaybackPosition(0.1);
        song.setPlaybackPosition(1);
        song.setPlaybackPositionInTicks(10);
        song.setPlaybackPositionInTicks(100);
        song.setPlaybackPositionInTicks(1000);

        // Get Song Info
        if(song.songPlaybackPosition === 0) throw new Error("songPlaybackPosition");
        if(song.getSongLengthInSeconds() === 0) throw new Error("getSongLengthInSeconds()");
        // console.assert(r.getSongPositionInTicks() > 0, "getSongPositionInTicks");


        // Delete Instructions
        while(root.length > 0)
            song.instructionDeleteAtIndex(testGroup, 0);


        // console.assert(r.getSongPositionFromTicks() === 0, "getSongPositionInSeconds");
        // console.assert(r.getSongPositionInTicks() === 0, "getSongPositionInTicks");
    }
}

if(typeof module !== "undefined")
    module.exports = {AudioSourceCommonTest: CommonTest};
