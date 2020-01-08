(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    if(isBrowser) // Hack for browsers
        window.require = thisRequire;

    /** Required Modules **/
    const {LZString} = require('../assets/3rdparty/LZString/lz-string.min.js');

    class AudioSourceStorage {
        constructor() {
        }

        /** Loading **/

        getRecentSongList() {
            return this.decodeForStorage(localStorage.getItem('song-recent-list') || '[]');
        }

        /** Generate Song Data **/

        generateName() {
            return `Untitled (${new Date().toJSON().slice(0, 10).replace(/-/g, '/')})`;
        }

        generateUUID() {
            var d = new Date().getTime();
            if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
                d += performance.now(); //use high-precision timer if available
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
        }

        generateDefaultSong(defaultInstrumentURL = null) {
            const songData = {
                name: this.generateName(),
                uuid: this.generateUUID(),
                version: '0.0.1',
                root: 'root',
                created: new Date().getTime(),
                timeDivision: 96 * 4,
                beatsPerMinute: 120,
                beatsPerMeasure: 4,
                instruments: [],
                instructions: {
                    'root': []
                }
            };
            if (defaultInstrumentURL)
                songData.instruments.push({url: defaultInstrumentURL});
            return songData;
        }

        /** Encoding / Decoding **/

        encodeForStorage(json, replacer = null, space = null) {
            let encodedString = JSON.stringify(json, replacer, space);
            const compressedString = LZString.compress(encodedString);
//             console.log(`Compression: ${compressedString.length} / ${encodedString.length} = ${Math.round((compressedString.length / encodedString.length)*100)/100}`);
            return compressedString;
        }

        decodeForStorage(encodedString) {
            if (!encodedString)
                return null;
            encodedString = LZString.decompress(encodedString) || encodedString;
            return JSON.parse(encodedString);
        }

        /** Saving **/

        saveState(state, key='audio-source-state') {
            localStorage.setItem(key, JSON.stringify(state));
        }

        loadState(key='audio-source-state') {
            let state = localStorage.getItem(key);
            if (state)
                state = JSON.parse(state);
            return state;
        }

        saveSongToMemory(songData, songHistory) {
            // const song = this.data;
            if (!songData.uuid)
                songData.uuid = this.generateUUID();
            let songRecentUUIDs = [];
            try {
                songRecentUUIDs = this.decodeForStorage(localStorage.getItem('song-recent-list') || '[]');
            } catch (e) {
                console.error(e);
            }
            songRecentUUIDs = songRecentUUIDs.filter((entry) => entry.uuid !== songData.uuid);
            songRecentUUIDs.unshift({uuid: songData.uuid, name: songData.name});
            localStorage.setItem('song-recent-list', this.encodeForStorage(songRecentUUIDs));


            localStorage.setItem('song:' + songData.uuid, this.encodeForStorage(songData));
            localStorage.setItem('song-history:' + songData.uuid, this.encodeForStorage(songHistory)); // History stored separately due to memory limits
            // this.querySelector('.song-menu').outerHTML = renderEditorMenuContent(this);
            console.info("Song saved to memory: " + songData.uuid, songData);
        }

        saveSongToFile(songData, prompt = true) {
            // const song = this.data;
            const instructionsKey = "/** INSTRUCTIONS-" + this.generateUUID() + ' **/';
            let jsonStringInstructions = JSON.stringify(songData.instructions);
            let jsonString = JSON.stringify(Object.assign({}, songData, {
                instructions: instructionsKey
            }), null, "\t");
            jsonString = jsonString.replace('"' + instructionsKey + '"', jsonStringInstructions);
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);

            let fileName = (songData.name || "untitled")
                    .replace(/\s+/g, '_')
                + '.json';
            if (prompt)
                fileName = window.prompt("Download as file?", fileName);
            if (!fileName)
                return console.warn("Download canceled");
            downloadAnchorNode.setAttribute("download", fileName);
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }

        /** Loading **/

        loadSongFromMemory(songUUID) {
            let songDataString = localStorage.getItem('song:' + songUUID);
            if (!songDataString)
                throw new Error("Song Data not found for uuid: " + songUUID);
            let songData = this.decodeForStorage(songDataString);
            if (!songData)
                throw new Error("Invalid Song Data: " + songDataString);
            return songData;
            // console.info("Song loaded from memory: " + songUUID, songData, this.songHistory);
        }

        loadSongHistoryFromMemory(songUUID) {
            let songHistoryString = localStorage.getItem('song-history:' + songUUID);
            if (!songHistoryString)
                return null;
            return this.decodeForStorage(songHistoryString);
            // this.render();
            //this.gridSelect(null, 0);
            // console.info("Song loaded from memory: " + songUUID, songData, this.songHistory);
        }


        /** Batch Commands **/

        getBatchRecentCommands() {
            let batchRecentCommands = localStorage.getItem('batch-recent-commands');
            if (!batchRecentCommands)
                return [];
            batchRecentCommands = JSON.parse(batchRecentCommands);
            return batchRecentCommands;
        }

        addBatchRecentCommands(batchCommand) {
            let batchRecentCommands = this.getBatchRecentCommands();
            if (batchRecentCommands.indexOf(batchCommand) === -1) {
                batchRecentCommands.unshift(batchCommand);
            }
            localStorage.setItem('batch-recent-commands', JSON.stringify(batchRecentCommands));
        }

        /** Batch Searches **/

        getBatchRecentSearches() {
            let batchRecentSearches = localStorage.getItem('batch-recent-searches');
            if (!batchRecentSearches)
                return [];
            batchRecentSearches = JSON.parse(batchRecentSearches);
            return batchRecentSearches;
        }

        addBatchRecentSearches(batchCommand) {
            let batchRecentSearches = this.getBatchRecentSearches();
            if (batchRecentSearches.indexOf(batchCommand) === -1) {
                batchRecentSearches.unshift(batchCommand);
            }
            localStorage.setItem('batch-recent-searches', JSON.stringify(batchRecentSearches));
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
        //                 // uuid: this.uuid
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


    }



    /** Export this script **/
    thisModule.exports = {
        AudioSourceStorage,
    };


}).apply(null, (function() {
    const thisScriptPath = 'common/audio-source-storage.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [
        thisRequire,
        thisModule,
        thisScriptPath,
        isBrowser
    ]
})());