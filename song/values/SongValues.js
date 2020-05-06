import Values from "../../common/values/Values";

class SongValues {
    constructor(song) {
        this.song = song;
    }


    getSongPrograms(callback = (id, name) => [id, name]) {
        const song = this.song;
        const results = [];
        if (song && song.data.programs) {
            const programList = song.data.programs;
            for (let programID = 0; programID < programList.length; programID++) {
                const [programClass, programInfo] = programList[programID]; //  || {title: "No Program Loaded"};
                // const programs = this.renderer.getProgram(programID);
                const result = callback(programID, programClass, programInfo);
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


    getAllNamedFrequencies(callback = (alias, aliasValue, programID) => [alias, aliasValue, programID]) {
        return 'TODO';
        // const song = this.song;
        // const results = [];
        // const programList = song.data.programs;
        // for (let programID = 0; programID < programList.length; programID++) {
        //     if (song.hasProgram(programID)) {
        //         const instance = song.getProgram(programID);
        //         if (instance.getFrequencyAliases) {
        //             const aliases = instance.getFrequencyAliases();
        //             for (const alias in aliases) {
        //                 if (aliases.hasOwnProperty(alias)) {
        //                     const aliasValue = aliases[alias];
        //                     const result = callback(alias, aliasValue, programID);
        //                     if(!addResult(results, result)) return results;
        //                 }
        //             }
        //         }
        //     }
        // }
        // return results;
    }




    formatSongDuration(input) {
        return Values.formatDuration(input, this.song.data.timeDivision);
    }


    /** Duration **/

    parseDurationAsTicks(durationString) {
        return Values.parseDurationAsTicks(durationString, this.song.data.timeDivision);
    }

    formatDuration(input) {
        return Values.formatDuration(input, this.song.data.timeDivision);
    }


    getNoteDurations(callback = (duration, durationString) => [duration, durationString]) {
        return Values.getNoteDurations(callback, this.song.data.timeDivision);
    }

}

function addResult (results, result) {
    if (result !== null && typeof result !== "undefined")
        results.push(result);
    return result === false ? result : true;
}



export default SongValues;
