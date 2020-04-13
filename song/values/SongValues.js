import Values from "./Values";

class SongValues extends Values{
    constructor(song = null) {
        super();
        this.song = song;
    }


    getSongInstruments(callback = (id, name) => [id, name]) {
        const song = this.song;
        const results = [];
        if (song && song.data.instruments) {
            const instrumentList = song.data.instruments;
            for (let instrumentID = 0; instrumentID < instrumentList.length; instrumentID++) {
                const [instrumentClass, instrumentInfo] = instrumentList[instrumentID]; //  || {title: "No Instrument Loaded"};
                // const instruments = this.renderer.getInstrument(instrumentID);
                const result = callback(instrumentID, instrumentClass, instrumentInfo);
                if(!addResult(results, result)) return results;
            }
        }
        return results;
    }

    getAllSongGroups(callback = (trackName) => trackName) {
        const song = this.song;
        const results = [];
        const instructionList = song.data.tracks;
        Object.keys(instructionList).forEach(function (key, i) {
            const result = callback(key);
            if(!addResult(results, result)) return results;
        });
        return results;
    }


    getAllNamedFrequencies(callback = (alias, aliasValue, instrumentID) => [alias, aliasValue, instrumentID]) {
        return 'TODO';
        // const song = this.song;
        // const results = [];
        // const instrumentList = song.data.instruments;
        // for (let instrumentID = 0; instrumentID < instrumentList.length; instrumentID++) {
        //     if (song.hasInstrument(instrumentID)) {
        //         const instance = song.getInstrument(instrumentID);
        //         if (instance.getFrequencyAliases) {
        //             const aliases = instance.getFrequencyAliases();
        //             for (const alias in aliases) {
        //                 if (aliases.hasOwnProperty(alias)) {
        //                     const aliasValue = aliases[alias];
        //                     const result = callback(alias, aliasValue, instrumentID);
        //                     if(!addResult(results, result)) return results;
        //                 }
        //             }
        //         }
        //     }
        // }
        // return results;
    }




    formatDuration(input) {
        return SongValues.formatDuration(input, this.song.data.timeDivision);
    }


    getNoteDurations(callback = (duration, durationString) => [duration, durationString]) {
        return SongValues.getNoteDurations(callback, this.song.data.timeDivision);
    }


}

function addResult (results, result) {
    if (result !== null && typeof result !== "undefined")
        results.push(result);
    return result === false ? result : true;
}



export default SongValues;
