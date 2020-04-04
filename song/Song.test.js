import React from 'react';
// import { render } from '@testing-library/react';
// import Instruction from "./instruction/Instruction";
// import Storage from "./Storage";
import Song from "./Song";


test('song test', async () => {
  await new SongTest().test();
  // const { getByText } = render(<App />);
  // const linkElement = getByText(/learn react/i);
  // expect(linkElement).toBeInTheDocument();
});

const startTime = getSeconds();
function getSeconds() {
  var hrTime = process.hrtime();
  const timeMS = hrTime[0] + hrTime[1] / 1000000000;
  return timeMS;
}

class SongTest {
  constructor() {
    this.audioContext = new class {
      get currentTime() {
        return getSeconds() - startTime;
      }
    };
    this.destination = {
      context: this.audioContext
    }
  }

  async test() {
    console.info("Test Started: ", this.constructor.name, __filename);
    // this.testStorage();
    const song = await this.testSongClass();
    // await this.testValues();
    console.info("Test Complete: ", this.constructor.name, song.data);
  }


  // testStorage() {
  //   const s = new Storage();
  //   const songData = s.generateDefaultSong();
  //
  // }

  // async testValues() {
  //     const s = new Song();
  //
  //     const v = new SongValues(s);
  //     v.valueTypes.forEach(valueType => {
  //         v.getValues(valueType, (value, title) => {
  //             // console.info(value, title);
  //         })
  //     })
  //
  // }

  async testSongClass() {
    const song = new Song(this.audioContext, {
      instruments: [
          ['TestInstrument']
      ]
    });
    song.data.title = 'test';
    // await song.loadSongData({});


    const testTrackName = song.getStartGroup();
    const rootGroup = song.data.instructions.root;

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
      const index = song.instructionInsertAtIndex(testTrackName, rootGroup.length, insertNote);
      const stats = song.instructionGetIterator(testTrackName).seekToIndex(index);
      expect(stats.positionTicks).toBe(pos);
    }
    for(let i=0; i<textNotes.position.length; i++) {
      const [pos, insertNote] = textNotes.position[i];
      const index = song.instructionInsertAtPosition(testTrackName, pos, insertNote);
      const stats = song.instructionGetIterator(testTrackName).seekToIndex(index);
      expect(stats.positionTicks).toBe(pos);
    }


    // Test Get Instructions

    [1,2].forEach(i => {
      const testInstruction = song.instructionGetByIndex(testTrackName, i);
      console.assert(song.instructionIndexOf(testTrackName, testInstruction) === i, 'instructionFindIndex');
    });

    // Test Iterator
    let currentIndex = 0;
    let iterator = song.instructionGetIterator(testTrackName);
    let instruction, instructionList, positionInTicks=0, playbackTime=0;
    while(instruction = iterator.nextInstruction()) {
      positionInTicks += instruction.deltadurationTicks;
      expect(iterator.positionTicks).toBe(positionInTicks);
    }

    // Groups
    const newRootGroup = song.generateInstructionTrackName('rootGroup');
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

    song.setPlaybackPosition(0);
    const playback = song.play(this.destination);
    await playback.awaitPlaybackReachedEnd();

    // Delete Instructions
    while(rootGroup.length > 5)
      song.instructionDeleteAtIndex(testTrackName, 0);


    // console.assert(r.getSongPositionFromTicks() === 0, "getSongPositionInSeconds");
    // console.assert(r.getSongPositionInTicks() === 0, "getSongPositionInTicks");
    return song;
  }
}
