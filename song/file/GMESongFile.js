import {ChipCore, GMEPlayer} from "../../3rdparty/chip-player-js-lib";
// import queryString from "querystring";


class GMESongFile {
    async init() {

        await new Promise((resolve, reject) => {
            // Load the chip-core Emscripten runtime
            try {
                this.chipCore = new ChipCore({
                    // Look for .wasm file in web root, not the same location as the app bundle (static/js).
                    locateFile: (path, prefix) => {
                        if (path.endsWith('.wasm') || path.endsWith('.wast'))
                            return `${process.env.PUBLIC_URL}/${path}`;
                        return prefix + path;
                    },
                    onRuntimeInitialized: (e) => {
                        console.log('onRuntimeInitialized', e);
                        resolve();
                        // this.sequencer.setPlayers([
                        //     new GMEPlayer(audioCtx, playerNode, chipCore),
                        //     new XMPPlayer(audioCtx, playerNode, chipCore),
                        //     new MIDIPlayer(audioCtx, playerNode, chipCore),
                        //     new V2MPlayer(audioCtx, playerNode, chipCore),
                        // ]);
                        // this.setState({loading: false});

                        // Experimental: Split Module Support
                        //
                        // chipCore.loadDynamicLibrary('./xmp.wasm', {
                        //     loadAsync: true,
                        //     global: true,
                        //     nodelete: true,
                        //   })
                        //   .then(() => {
                        //     return this.sequencer.setPlayers([new XMPPlayer(audioCtx, playerNode, chipCore)]);
                        //   });

                        // const urlParams = queryString.parse(window.location.search.substr(1));
                        // if (urlParams.play) {
                        //     // Allow a little time for initial page render before starting the song.
                        //     // This is not absolutely necessary but helps prevent stuttering.
                        //     setTimeout(() => {
                        //         this.sequencer.playSonglist([urlParams.play]);
                        //         if (urlParams.t) {
                        //             setTimeout(() => {
                        //                 if (this.sequencer.getPlayer()) {
                        //                     this.sequencer.getPlayer().seekMs(parseInt(urlParams.t, 10));
                        //                 }
                        //             }, 100);
                        //         }
                        //     }, 500);
                        // }
                    },
                });
            } catch (e) {
                // Browser doesn't file WASM (Safari in iOS Simulator)
                throw e;
            }
        });

        // this.sequencer = new Sequencer([], this.handleSequencerStateUpdate, this.handlePlayerError);
    }

    loadPlayerFromBuffer(audioContext, destinationNode, buffer, filepath) {
        let uint8Array;
        uint8Array = new Uint8Array(buffer);


        const player = new GMEPlayer(audioContext, destinationNode, this.chipCore, e => this.onPlayerStateUpdate(e));
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
        player.stop();
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
        // id666.length = 5;
        const timeDivision = 96;
        const beatsPerMinute = 120;
        const lengthInTicks = (metadata.length * (beatsPerMinute / 60)) * timeDivision;

        const songData = {
            title: metadata.title,
            // game: (id666.game ? id666.game + ': ' : ''),
            game: metadata.game,
            system: metadata.system,
            artist: metadata.artist,
            copyright: metadata.copyright,
            version: 'auto',
            created: new Date().getTime(),
            timeDivision: timeDivision,
            bpm: beatsPerMinute,
            // beatsPerMeasure: 4,
            rootGroup: 'root',
            instruments: [
                {
                    "className": "GMEPlayerSynthesizer",
                    fileURL: filepath
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


export default GMESongFile;
