const path = require('path');

const DIR_ROOT = path.dirname(__dirname);

const {AudioSourceRenderer} = require(DIR_ROOT + '/common/audio-source-renderer.js');


class AudioSourceCommonTest {
    constructor() {
    }

    async test() {
        console.info("Test Started: ", this.constructor.name);
        await this.testRenderer();
        console.info("Test Complete: ", this.constructor.name);
    }


    async testRenderer() {
        const testGroup = 'root';
        const renderer = new AudioSourceRenderer({
            instructions: {
                'root': [
                    // 'A2', 10, 'A3', 20, 'A4', 30, 'A5', 40, 'A6'
                ]
            }
        });
        const root = renderer.getSongData().instructions.root;


        renderer.insertInstructionAtIndex(testGroup, root.length, 'ins0');
        renderer.insertInstructionAtIndex(testGroup, root.length, [20, 'ins20' ]);



        renderer.insertInstructionAtPosition(testGroup, 20, 'pos20');
        renderer.insertInstructionAtPosition(testGroup, 10, 'pos10');
        renderer.insertInstructionAtPosition(testGroup, 0, 'pos0');

        console.log("Root: ", root);

        while(root.length > 0)
            renderer.deleteInstructionAtIndex(testGroup, 0);

    }
}

if(typeof module !== "undefined")
    module.exports = {AudioSourceCommonTest};