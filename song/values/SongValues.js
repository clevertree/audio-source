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
                const instrumentInfo = instrumentList[instrumentID] || {title: "No Instrument Loaded"};
                // const instruments = this.renderer.getInstrument(instrumentID);
                const result = callback(instrumentID, this.formatInstrumentID(instrumentID)
                    + ': ' + (instrumentInfo.title ? instrumentInfo.title : instrumentInfo.className));
                if(!addResult(results, result)) return results;
            }
        }
        return results;
    }

    getAllSongGroups(callback = (trackName) => trackName) {
        const song = this.song;
        const results = [];
        const instructionList = song.data.instructions;
        Object.keys(instructionList).forEach(function (key, i) {
            const result = callback(key);
            if(!addResult(results, result)) return results;
        });
        return results;
    }


    getAllNamedFrequencies(callback = (alias, aliasValue, instrumentID) => [alias, aliasValue, instrumentID]) {
        const song = this.song;
        const results = [];
        const instrumentList = song.data.instruments;
        for (let instrumentID = 0; instrumentID < instrumentList.length; instrumentID++) {
            if (song.isInstrumentLoaded(instrumentID)) {
                const instance = song.getInstrument(instrumentID);
                if (instance.getFrequencyAliases) {
                    const aliases = instance.getFrequencyAliases();
                    for (const alias in aliases) {
                        if (aliases.hasOwnProperty(alias)) {
                            const aliasValue = aliases[alias];
                            const result = callback(alias, aliasValue, instrumentID);
                            if(!addResult(results, result)) return results;
                        }
                    }
                }
            }
        }
        return results;
    }




    formatDuration(input) {
        const song = this.song;
        let stringValue;
        this.getNoteDurations((duration, durationString) => {
            if (input === duration || input === durationString) {
                stringValue = durationString;
                return false;
            }
        });
        if (stringValue)
            return stringValue;
        const timeDivision = song.data.timeDivision || 96 * 4;
        const beatDivisor = input / timeDivision;
        if(beatDivisor === Math.round(beatDivisor))
            return beatDivisor + 'B';

        input = parseFloat(input).toFixed(2);
        return input.replace('.00', 't');
    }


    getNoteDurations(callback = (duration, durationString) => [duration, durationString]) {
        const song = this.song;
        const timeDivision = song.data.timeDivision;
        const results = [];
        for (let i = 64; i > 1; i /= 2) {
            let fraction = `1/${i}`; //.replace('1/2', '½').replace('1/4', '¼');

            let result = callback((1 / i) / 1.5 * timeDivision, `${fraction}T`);
            if(!addResult(results, result)) return results;

            result = callback(1 / i * timeDivision, `${fraction}B`);
            if(!addResult(results, result)) return results;

            result = callback(1 / i * 1.5 * timeDivision, `${fraction}D`); //t== ticks or triplets?
            if(!addResult(results, result)) return results;
        }
        for (let i = 1; i <= 16; i++) {
            let result = callback(i * timeDivision, i + 'B');
            if(!addResult(results, result)) return results;
        }
        return results;
    }

}

function addResult (results, result) {
    if (result !== null && typeof result !== "undefined")
        results.push(result);
    return result === false ? result : true;
}



export default SongValues;
