{


    /** Register Script Exports **/
    function getThisScriptPath() { return 'common/audio-source-values.js'; }
    const exportThisScript = function(module) {
        module.exports = {
            AudioSourceValues,
        };
    }


    class AudioSourceValues {
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


        getSongInstruments(song, callback = (id, name) => [id, name]) {
            const results = [];
            if (song && song.data.instruments) {
                const instrumentList = song.data.instruments;
                for (let instrumentID = 0; instrumentID < instrumentList.length; instrumentID++) {
                    const instrumentInfo = instrumentList[instrumentID] || {name: "No Instrument Loaded"};
                    // const instrument = this.renderer.getInstrument(instrumentID);
                    const result = callback(instrumentID, this.formatInstrumentID(instrumentID)
                        + ': ' + (instrumentInfo.name ? instrumentInfo.name : instrumentInfo.url.split('/').pop()));
                    addResult(results, result);
                }
            }
            return results;
        }

        getAllSongGroups(song, callback = (groupName) => groupName) {
            const results = [];
            const instructionList = song.data.instructions;
            Object.keys(instructionList).forEach(function (key, i) {
                const result = callback('@' + key);
                addResult(results, result);
            });
            return results;
        }

        getNoteFrequencies(callback = (freq) => freq) {
            const results = [];
            const noteFrequencies = this.noteFrequencies;
            for (let j = 0; j < noteFrequencies.length; j++) {
                const noteFrequency = noteFrequencies[j];
                const result = callback(noteFrequency);
                addResult(results, result);
            }
            return results;
        }


        getNoteOctaves(callback = (octave) => octave) {
            const results = [];
            for (let i = 1; i <= 8; i++) {
                const result = callback(i);
                addResult(results, result);
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
                    addResult(results, result);
                }
            }
            return results;
        }

        getAllNamedFrequencies(song, callback = (alias, aliasValue, instrumentID) => [alias, aliasValue, instrumentID]) {
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
                                addResult(results, result);
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
                addResult(results, result);
            }
            return results;
        }



        getNoteDurations(song, callback = (duration, durationString) => [duration, durationString]) {
            const timeDivision = song.timeDivision;
            const results = [];
            for (let i = 64; i > 1; i /= 2) {
                let fraction = `1/${i}`; //.replace('1/2', '½').replace('1/4', '¼');
                let result = callback((1 / i) / 1.5 * timeDivision, `${fraction}t`);
                addResult(results, result);
                result = callback(1 / i * timeDivision, `${fraction}`);
                addResult(results, result);
                result = callback(1 / i * 1.5 * timeDivision, `${fraction}d`);
                addResult(results, result);
            }
            for (let i = 1; i <= 16; i++) {
                let result = callback(i * timeDivision, i + 'B');
                addResult(results, result);
            }
            return results;
        }

        getBeatsPerMeasure(callback = (beatsPerMeasure, beatsPerMeasureString) => [beatsPerMeasure, beatsPerMeasureString]) {
            const results = [];
            for (let beatPerMeasure = 1; beatPerMeasure <= 12; beatPerMeasure++) {
                const result = callback(beatPerMeasure, beatPerMeasure + ` beat${beatPerMeasure > 1 ? 's' : ''} per measure`);
                addResult(results, result);
            }
            return results;
        }

        getBeatsPerMinute(callback = (beatsPerMinute, beatsPerMinuteString) => [beatsPerMinute, beatsPerMinuteString]) {
            const results = [];
            for (let beatPerMinute = 40; beatPerMinute <= 300; beatPerMinute += 10) {
                const result = callback(beatPerMinute, beatPerMinute + ` beat${beatPerMinute > 1 ? 's' : ''} per minute`);
                addResult(results, result);
            }
            return results;
        }

        getSegmentLengths(song, callback = (lengthInTicks, lengthString) => [lengthInTicks, lengthString]) {
            const timeDivision = song.timeDivision;
            const results = [];
            [4, 5, 6, 7, 8, 10, 12, 16, 24, 32, 48, 64, 96, 128]
                .forEach(i => {
                    const result = callback(timeDivision * i, i + 'B');
                    addResult(results, result);
                });
            return results;
        }



        formatDuration(song, input) {
            let stringValue;
            this.getNoteDurations(song, (duration, durationString) => {
                if (input === duration || input === durationString)
                    stringValue = durationString;
            });
            if (stringValue)
                return stringValue;
            const timeDivision = song.timeDivision || 96 * 4;
            const beatDivisor = input / timeDivision;
            if(beatDivisor === Math.round(beatDivisor))
                return beatDivisor + 'B';

            input = parseFloat(input).toFixed(2);
            return input.replace('.00', 't');
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
            const parts = formattedSeconds.split(':');
            return (parseInt(parts[0]) * 60)
                + (parseInt(parts[1]))
                + (parseInt(parts[2]) / 1000);
        }
    }

    function addResult (results, result) {
        if (result !== null && typeof result !== "undefined")
            results.push(result);
    }




    /** Export this script **/
    registerModule(exportThisScript);

    /** Module Loader Methods **/
    function registerModule(callback) {
        if(typeof window === 'undefined')
            callback(module);
        else findThisScript()
            .forEach(scriptElm => callback(scriptElm))
    }

    function findThisScript() {
        return findScript(getThisScriptPath());
    }

    function findScript(scriptURL) {
        let scriptElms = document.head.querySelectorAll(`script[src$="${scriptURL}"]`);
        scriptElms.forEach(scriptElm => {
            scriptElm.relativePath = scriptURL;
            scriptElm.basePath = scriptElm.src.replace(document.location.origin, '').replace(scriptURL, '');
        });
        return scriptElms;
    }


}

