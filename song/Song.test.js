import React from 'react';
import { render } from '@testing-library/react';
import SongInstruction from "./SongInstruction";
import Storage from "./Storage";
import Song from "./Song";

test('song test', () => {
  new SongTest().test();
  // const { getByText } = render(<App />);
  // const linkElement = getByText(/learn react/i);
  // expect(linkElement).toBeInTheDocument();
});



class SongTest {
  constructor() {
  }

  async test() {
    // console.info("Test Started: ", this.constructor.name, __filename);
    await this.testStorage();
    await this.testSongClass();
    // await this.testValues();
    // console.info("Test Complete: ", this.constructor.name);
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
      const stats = song.getInstructionIterator(testGroup).seekToIndex(index);
      expect(stats.positionTicks).toBe(pos);
    }
    for(let i=0; i<textNotes.position.length; i++) {
      const [pos, insertNote] = textNotes.position[i];
      const index = song.instructionInsertAtPosition(testGroup, pos, insertNote);
      const stats = song.getInstructionIterator(testGroup).seekToIndex(index);
      expect(stats.positionTicks).toBe(pos);
    }


    // Test Get Instructions

    [1,2].forEach(i => {
      const testInstruction = song.getInstruction(testGroup, i);
      console.assert(song.findInstructionIndex(testGroup, testInstruction) === i, 'instructionFindIndex');
    });

    // Test Iterator
    let currentIndex = 0;
    let iterator = song.instructionGetIterator(testGroup);
    let instruction, instructionList, positionInTicks=0, playbackTime=0;
    while(instruction = iterator.nextInstruction()) {
      positionInTicks += instruction.deltaDuration;
      expect(iterator.positionTicks).toBe(positionInTicks);
    }

    // Test Row Iterator
    currentIndex = 0;
    iterator = song.instructionGetIterator(testGroup);
    positionInTicks = 0;
    while(true) {
      instructionList = iterator.nextInstructionRow();
      // positionInTicks = iterator.positionTicks;
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
          expect(iterator.positionTicks).toBe(positionInTicks);
          currentIndex++
        }
        expect(iterator.currentIndex).toBe(currentIndex-1);
      }
    }

    // Test Quantized Row Iterator
    iterator = song.instructionGetIterator(testGroup);
    positionInTicks = 0;
    playbackTime = 0;
    let quantizationMaxDuration = 450;
    while(true) {
      instructionList = iterator.nextInstructionQuantizedRow(5, quantizationMaxDuration);
      if(instructionList === null) {
        expect(iterator.hasReachedEnd);
        break;
      }
      expect(iterator.positionTicks).toBe(positionInTicks);
      positionInTicks+= 5;
      // TODO: test positionInSeconds
      // if(iterator.positionTicks - positionInTicks > 5)
      //   throw new Error("Iterator quantization failed");
      // positionInTicks = iterator.positionTicks;

      // if(iterator.positionTicks - positionInTicks > song.getTimeDivision())
      //     throw new Error('quantization failed for groupPositionInTicks');
      // if(iterator.positionSeconds - playbackTime > 0.5)
      //   throw new Error('quantization failed for groupPlaybackTime');
      // console.log('iterator', iterator.positionTicks, iterator.positionSeconds);
      // console.assert(iterator.positionTicks === positionInTicks, `iterator.positionTicks ${iterator.positionTicks} !== ${positionInTicks}\n`, instruction);
      // if(positionInTicks > 0)
      //     console.assert(positionInTicks < iterator.positionTicks, "Invalid position order");
      // positionInTicks = iterator.positionTicks;
      // playbackTime = iterator.positionSeconds;
      // console.log(iterator.positionTicks, instructionList, iterator.currentIndex);
      // for(let i=0; i<instructionList.length; i++) {
      //   const instruction = instructionList[i];
      //   // if(iterator.positionTicks !== iterator.positionTicks)
      //   //   throw new Error(`instruction[${i}].positionInTicks ${instruction.positionInTicks} !== ${iterator.positionTicks}\n`);
      // }
    }
    expect(iterator.positionTicks).toBe(quantizationMaxDuration);

    // Groups
    const newRootGroup = song.generateInstructionGroupName('root');
    song.groupAdd(newRootGroup, ['A', 'B', 'C', 10, 'D']);
    song.groupRemove(newRootGroup);

    const songLength = song.getSongLengthInSeconds();
    expect(songLength).toBeGreaterThan(0);
    // console.info("Test song: ", Math.round(songLength * 10000) / 10000 + 's');

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
