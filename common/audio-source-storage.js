/**
 * Player requires a modern browser
 */


//  use server for export http://grimmdude.com/MidiWriterJS/docs/index.html https://github.com/colxi/midi-parser-js/blob/master/src/midi-parser.js
    // TODO: midi file and jsf as data url

class AudioSourceStorage {
    constructor() {
    }

    /** Loading **/

    async getRecentSongList() {
        return await this.decodeForStorage(localStorage.getItem('song-recent-list') || '[]');
    }

    generateDefaultSong(scriptDirectory='') {
        return {
            title: `Untitled (${new Date().toJSON().slice(0, 10).replace(/-/g, '/')})`,
            guid: this.generateGUID(),
            version: '0.0.1',
            root: 'root',
            created: new Date().getTime(),
            timeDivision: 96*4,
            beatsPerMinute: 120,
            beatsPerMeasure: 4,
            instruments: [{
                "url": new URL(scriptDirectory + "instrument/audio-source-synthesizer.js", document.location) + '',
            }],
            instructions: {
                'root': []
            }
        }
    }


    async encodeForStorage(json, replacer=null, space=null) {
        let encodedString = JSON.stringify(json, replacer, space);
        const Sources = new AudioSourceLibraries;
        const LZString = await Sources.getLZString();
        const compressedString = LZString.compress(encodedString);
//             console.log(`Compression: ${compressedString.length} / ${encodedString.length} = ${Math.round((compressedString.length / encodedString.length)*100)/100}`);
        return compressedString;
    }

    async decodeForStorage(encodedString) {
        if(!encodedString)
            return null;
        const Sources = new AudioSourceLibraries;
        const LZString = await Sources.getLZString();
        encodedString = LZString.decompress(encodedString) || encodedString;
        return JSON.parse(encodedString);
    }

    async saveSongToMemory(songData, songHistory) {
        // const song = this.getSongData();
        if(!songData.guid)
            songData.guid = this.generateGUID();
        let songRecentGUIDs = [];
        try {
            songRecentGUIDs = await this.decodeForStorage(localStorage.getItem('song-recent-list') || '[]');
        } catch (e) {
            console.error(e);
        }
        songRecentGUIDs = songRecentGUIDs.filter((entry) => entry.guid !== songData.guid);
        songRecentGUIDs.unshift({guid: songData.guid, title: songData.name});
        localStorage.setItem('song-recent-list', await this.encodeForStorage(songRecentGUIDs));


        localStorage.setItem('song:' + songData.guid, await this.encodeForStorage(songData));
        localStorage.setItem('song-history:' + songData.guid, await this.encodeForStorage(songHistory)); // History stored separately due to memory limits
        // this.querySelector('.song-menu').outerHTML = renderEditorMenuContent(this);
        console.info("Song saved to memory: " + songData.guid, songData);
    }

    saveSongToFile(songData, prompt=true) {
        // const song = this.getSongData();
        const instructionsKey = "/** INSTRUCTIONS-" + this.generateGUID() + ' **/';
        let jsonStringInstructions = JSON.stringify(songData.instructions);
        let jsonString = JSON.stringify(Object.assign({}, songData, {
            instructions: instructionsKey
        }), null, "\t");
        jsonString = jsonString.replace('"' + instructionsKey + '"', jsonStringInstructions);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);

        let fileName = (songData.name || "untitled")
            .replace(/\s+/g, '_')
            + '.json';
        if(prompt)
            fileName = window.prompt("Download as file?", fileName);
        if(!fileName)
            return console.warn("Download canceled");
        downloadAnchorNode.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }


    async loadSongFromMemory(songGUID) {
        let songDataString = localStorage.getItem('song:' + songGUID);
        if(!songDataString)
            throw new Error("Song Data not found for guid: " + songGUID);
        let songData = await this.decodeForStorage(songDataString);
        if(!songData)
            throw new Error("Invalid Song Data: " + songDataString);
        return songData;
        // console.info("Song loaded from memory: " + songGUID, songData, this.songHistory);
    }

    async loadSongHistoryFromMemory(songGUID) {
        let songHistoryString = localStorage.getItem('song-history:' + songGUID);
        if(!songHistoryString)
            return null;
        return await this.decodeForStorage(songHistoryString);
        // this.render();
        //this.gridSelect(null, 0);
        // console.info("Song loaded from memory: " + songGUID, songData, this.songHistory);
    }

    async loadMIDIFile(source) {

        if(typeof MidiParser === "undefined") {
            await new Promise((resolve, reject) => {
                const newScriptElm = document.createElement('script');
                newScriptElm.src = 'https://cdn.jsdelivr.net/gh/colxi/midi-parser-js/src/main.js';
                newScriptElm.onload = e => resolve();
                document.head.appendChild(newScriptElm);
            });
        }
        //
        const fileResult = await new Promise((resolve, reject) => {
            let reader = new FileReader();                                      // prepare the file Reader
            reader.readAsArrayBuffer(source.files[0]);                 // read the binary data
            reader.onload =  (e) => {
                resolve(e.target.result);
            };
        });

        // Move to renderer
        return MidiParser.parse(new Uint8Array(fileResult));
    }

    //
    // historyQueue(songHistory) {
    //     if(!Array.isArray(songHistory))
    //         songHistory = [];
    //     for(let i=0; i<songHistory.length; i++) {
    //         const historyAction = songHistory[i];
    //         this.status.history.currentStep++;
    //         historyAction.step = this.status.history.currentStep;
    //     }
    //     //
    //     // this.status.history.undoList.push(historyAction);
    //     // this.status.history.undoPosition = this.status.history.undoList.length-1;
    //
    //     if(this.webSocket && songHistory.length > 0) {
    //         console.info("Sending history actions: ", songHistory);
    //         this.webSocket
    //             .send(this.encodeForStorage({
    //                 type: 'history:entry',
    //                 songHistory: songHistory,
    //                 // guid: this.guid
    //             }))
    //     }
    // }
    //
    // historyUndo() {
    //
    // }
    //
    // historyRedo() {
    //
    // }
    // clearHistoryActions() {
    //     const actions = this.songHistory;
    //     this.songHistory = [];
    //     return actions;
    // }

    /** Modify Song Data **/

    generateGUID() { 
        var d = new Date().getTime();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
            d += performance.now(); //use high-precision timer if available
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

}



