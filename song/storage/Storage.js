import LZString from 'lz-string';
import Values from "../values/Values";

class Storage {
    /** Loading **/

    getRecentSongList() {
        return this.decodeForStorage(localStorage.getItem('song-recent-list') || '[]');
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
            songData.uuid = Values.generateUUID();
        let songRecentUUIDs = [];
        try {
            songRecentUUIDs = this.decodeForStorage(localStorage.getItem('song-recent-list') || '[]');
        } catch (e) {
            console.error(e);
        }
        songRecentUUIDs = songRecentUUIDs.filter((entry) => entry.uuid !== songData.uuid);
        songRecentUUIDs.unshift({uuid: songData.uuid, title: songData.title});
        localStorage.setItem('song-recent-list', this.encodeForStorage(songRecentUUIDs));


        localStorage.setItem('song:' + songData.uuid, this.encodeForStorage(songData));
        localStorage.setItem('song-history:' + songData.uuid, this.encodeForStorage(songHistory)); // History stored separately due to memory limits
        // this.querySelector('.song-menu').outerHTML = renderEditorMenuContent(this);
        console.info("Song saved to memory: " + songData.uuid, songData);
    }

    saveSongToFile(songData, prompt = true) {
        // const song = this.data;
        const instructionsKey = "/** INSTRUCTIONS-" + Values.generateUUID() + ' **/';
        let jsonStringInstructions = JSON.stringify(songData.tracks);
        let jsonString = JSON.stringify(Object.assign({}, songData, {
            tracks: instructionsKey
        }), null, "\t");
        jsonString = jsonString.replace('"' + instructionsKey + '"', jsonStringInstructions);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);

        let fileName = (songData.title || "untitled")
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


export default Storage;
