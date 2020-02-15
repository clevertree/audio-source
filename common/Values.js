
class Values {
    constructor(song = null) {
        this.song = song;
    }

    // get noteFrequencies() {
    //     return this.renderer.noteFrequencies; // ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    // }

    get noteFrequencies() {
        return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    }

    get valueTypes() {
        return [
            'beats-per-measure',
            'beats-per-minute',
            'command-group-execute',
            'note-frequency-named',
            'durations',
            'groups',
            // 'instruments-available',
            'named-durations',
            'note-frequency',
            'note-frequency-all',
            'note-frequency-octaves',
            'song-groups',
            'song-instruments',
            'song-recent-list',
            'velocities',
        ]
    }


    getSongInstruments(callback = (id, name) => [id, name]) {
        const song = this.song;
        const results = [];
        if (song && song.data.instruments) {
            const instrumentList = song.data.instruments;
            for (let instrumentID = 0; instrumentID < instrumentList.length; instrumentID++) {
                const instrumentInfo = instrumentList[instrumentID] || {name: "No Instrument Loaded"};
                // const instrument = this.renderer.getInstrument(instrumentID);
                const result = callback(instrumentID, this.formatInstrumentID(instrumentID)
                    + ': ' + (instrumentInfo.name ? instrumentInfo.name : instrumentInfo.url.split('/').pop()));
                if(!addResult(results, result)) return results;
            }
        }
        return results;
    }

    getAllSongGroups(callback = (groupName) => groupName) {
        const song = this.song;
        const results = [];
        const instructionList = song.data.instructions;
        Object.keys(instructionList).forEach(function (key, i) {
            const result = callback(key);
            if(!addResult(results, result)) return results;
        });
        return results;
    }

    getNoteFrequencies(callback = (freq) => freq) {
        const results = [];
        const noteFrequencies = this.noteFrequencies;
        for (let j = 0; j < noteFrequencies.length; j++) {
            const noteFrequency = noteFrequencies[j];
            const result = callback(noteFrequency);
            if(!addResult(results, result)) return results;
        }
        return results;
    }


    getNoteOctaves(callback = (octave) => octave) {
        const results = [];
        for (let i = 1; i <= 8; i++) {
            const result = callback(i);
            if(!addResult(results, result)) return results;
        }
        return results;
    }

    getOctaveNoteFrequencies(callback = (freq) => freq) {
        const results = [];
        const noteFrequencies = this.noteFrequencies;
        for (let i = 1; i <= 8; i++) {
            for (let j = 0; j < noteFrequencies.length; j++) {
                const noteFrequency = noteFrequencies[j] + i;
                const result = callback(noteFrequency);
                if(!addResult(results, result)) return results;
            }
        }
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


    getNoteVelocities(callback = (velocity) => velocity) {
        const results = [];
        for (let vi = 100; vi >= 0; vi -= 10) {
            const result = callback(vi);
            if(!addResult(results, result)) return results;
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
        const timeDivision = song.getTimeDivision() || 96 * 4;
        const beatDivisor = input / timeDivision;
        if(beatDivisor === Math.round(beatDivisor))
            return beatDivisor + 'B';

        input = parseFloat(input).toFixed(2);
        return input.replace('.00', 't');
    }


    getNoteDurations(callback = (duration, durationString) => [duration, durationString]) {
        const song = this.song;
        const timeDivision = song.getTimeDivision();
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

    getBeatsPerMeasure(callback = (beatsPerMeasure, beatsPerMeasureString) => [beatsPerMeasure, beatsPerMeasureString]) {
        const results = [];
        for (let beatPerMeasure = 1; beatPerMeasure <= 12; beatPerMeasure++) {
            const result = callback(beatPerMeasure, beatPerMeasure + ` beat${beatPerMeasure > 1 ? 's' : ''} per measure`);
            if(!addResult(results, result)) return results;
        }
        return results;
    }

    getBeatsPerMinute(callback = (beatsPerMinute, beatsPerMinuteString) => [beatsPerMinute, beatsPerMinuteString]) {
        const results = [];
        for (let beatPerMinute = 40; beatPerMinute <= 300; beatPerMinute += 10) {
            const result = callback(beatPerMinute, beatPerMinute + ` beat${beatPerMinute > 1 ? 's' : ''} per minute`);
            if(!addResult(results, result)) return results;
        }
        return results;
    }

    getSegmentLengths(callback = (lengthInTicks, lengthString) => [lengthInTicks, lengthString]) {
        const song = this.song;
        const timeDivision = song.getTimeDivision();
        const results = [];
        [4, 5, 6, 7, 8, 10, 12, 16, 24, 32, 48, 64, 96, 128]
            .forEach(i => {
                const result = callback(timeDivision * i, i + 'B');
                if(!addResult(results, result)) return results;
            });
        return results;
    }



    formatVelocity(velocity) {
        if (typeof velocity !== 'number')
            return 'N/A'; // throw new Error("Invalid Instrument");
        return velocity === 100 ? "Max" : velocity + '';
    }

    formatInstrumentID(instrumentID) {
        if (typeof instrumentID !== 'number')
            return 'N/A'; // throw new Error("Invalid Instrument");
        return instrumentID < 10 ? "0" + instrumentID : "" + instrumentID;
    }

    formatCommand(commandString) {
        return commandString;
    }

    formatPlaybackPosition(seconds) {
        let m = Math.floor(seconds / 60);
        seconds = seconds % 60;
        let ms = Math.round((seconds - Math.floor(seconds)) * 1000);
        seconds = Math.floor(seconds);

        m = (m + '').padStart(2, '0');
        seconds = (seconds + '').padStart(2, '0');
        ms = (ms + '').padStart(3, '0'); // TODO: ticks?
        return `${m}:${seconds}:${ms}`;
    }

    parsePlaybackPosition(formattedSeconds) {
        const parts = formattedSeconds.toString().split(':');
        return (parseInt(parts[0]) * 60)
            + (parseInt(parts[1]))
            + (parseInt(parts[2]) / 1000);
    }
}

function addResult (results, result) {
    if (result !== null && typeof result !== "undefined")
        results.push(result);
    return result === false ? result : true;
}



export default Values;
