import ChipCore from "chip-player-js-lib/src/chip-core";

import GMEPlayer from "chip-player-js-lib/src/players/GMEPlayer";

console.log('GMEPlayer', GMEPlayer);




class LibGMESupport {
    constructor() {
    }

    loadPlayerFromBuffer(audioContext, destinationNode, buffer, filepath) {
        let uint8Array;
        uint8Array = new Uint8Array(buffer);

        const player = new GMEPlayer(audioContext, destinationNode, this, e => this.onPlayerStateUpdate(e));
        try {
            player.loadData(uint8Array, filepath);
        } catch (e) {
            throw e;
            // this.onPlayerError(e.message);
            // return;
        }
        // this.onPlayerError(null);

        const numVoices = player.getNumVoices();
        player.setTempo(1.0); // this.tempo);
        player.setVoices([...Array(numVoices)].fill(true));
        return player;

        // console.debug('Sequencer.playSong(...) song request completed');
    }

    onPlayerStateUpdate(e) {
        console.log(e);
    }



    async loadSongDataFromBuffer(buffer, filepath) {
        var audioCtx = new AudioContext();
        const player = this.loadPlayerFromBuffer(audioCtx, audioCtx.destination, buffer, filepath);
        return this.loadSongDataFromPlayer(player, filepath);
    }

    loadSongDataFromPlayer(player, filepath) {
        const metadata = player.metadata;
        console.log('metadata', metadata);
        const id666 = player._songInfo;
        console.log(id666);
        // id666.length = 5;
        const timeDivision = 96;
        const beatsPerMinute = 120;
        const lengthInTicks = (id666.length * (beatsPerMinute / 60)) * timeDivision;

        const songData = {
            name: (id666.title2 || id666.title), // (id666.game ? id666.game + ': ' : '') +
            // game: (id666.game ? id666.game + ': ' : ''),
            id666,
            version: 'auto',
            root: 'root',
            created: new Date().getTime(),
            timeDivision: timeDivision,
            beatsPerMinute: beatsPerMinute,
            beatsPerMeasure: 4,
            instruments: [
                {
                    "className": "GMEPlayer",
                    spcURL: filepath
                }
            ],
            instructions: {
                'root': [
                    ['C4', 0, lengthInTicks],
                ]
            }
        };

        return songData;
    }

    async loadSongDataFromURL(filepath, children={}) {
        const response = await fetch(filepath);
        const buffer = await response.arrayBuffer();
        var audioCtx = new AudioContext();
        const player = this.loadPlayerFromBuffer(audioCtx, audioCtx.destination, buffer, filepath);
        const songData = this.loadSongDataFromPlayer(player, filepath);
        return songData;
    }


}


export default LibGMESupport;
