


class AudioSourceValues {
    constructor(renderer=null) {
        this.renderer = renderer;
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
            'command-instrument-frequencies',
            'durations',
            'groups',
            'instruments-available',
            'named-durations',
            'note-frequencies',
            'note-frequencies-all',
            'note-frequency-octaves',
            'song-groups',
            'song-instruments',
            'song-recent-list',
            'velocities',
        ]
    }

    /** Form Options **/

    getValues(valueType, callback) {
        let noteFrequencies;
        let results = [], result=null;
        const addResult = (result) => { if(result !== null && typeof result !== "undefined") addResult(result); };
        const songData = this.renderer ? this.renderer.getSongData() : null;
        const timeDivision = this.renderer ? this.renderer.getSongTimeDivision() : 96*4;

        switch(valueType) {
            // case 'server-recent-uuid':
            // case 'memory-recent-uuid':
            //     const songRecentUUIDs = JSON.parse(localStorage.getItem(valueType) || '[]');
            //     for(let i=0; i<songRecentUUIDs.length; i++)
            //         result = callback.apply(this, songRecentUUIDs[i]);
            //     break;

            case 'song-recent-list':
                // TODO: refactor
                // const Storage = new AudioSourceStorage();
                // const songRecentUUIDs = Storage.getRecentSongList() ;
                // for(let i=0; i<songRecentUUIDs.length; i++)
                //     result = callback(songRecentUUIDs[i].guid, songRecentUUIDs[i].title);
                break;

            case 'song-instruments':
                if(this.renderer && songData.instruments) {
                    const instrumentList = songData.instruments;
                    for (let instrumentID = 0; instrumentID < instrumentList.length; instrumentID++) {
                        const instrumentInfo = instrumentList[instrumentID] || {name: "No Instrument Loaded"};
                        // const instrument = this.renderer.getInstrument(instrumentID);
                        result = callback(instrumentID, this.format(instrumentID, 'instrument')
                            + ': ' + (instrumentInfo.name ? instrumentInfo.name : instrumentInfo.url.split('/').pop()));
                        addResult(result);
                    }
                }
                break;

            case 'instruments-available':
                // TODO: refactor
                // const sources = new AudioSources(this.renderer);
                // const instrumentLibrary = sources.getInstrumentLibrary();
                // if(instrumentLibrary) {
                //     if(instrumentLibrary.instruments) {
                //         instrumentLibrary.instruments.forEach((pathConfig) => {
                //             let instrumentURL = pathConfig.url;
                //             if(instrumentURL) instrumentURL = new URL(instrumentURL, instrumentLibrary.url) + '';
                //             if (typeof pathConfig !== 'object') pathConfig = {url: pathConfig};
                //             if(!pathConfig.title) pathConfig.title = pathConfig.url.split('/').pop();
                //             result = callback(instrumentURL, pathConfig.title); //  + " (" + pathConfig.url + ")"
                //         });
                //     }
                // }
                break;

            case 'command-instrument-frequencies':
                if(songData) {
                    for(let instrumentID=0; instrumentID<songData.instruments.length; instrumentID++) {
                        if(this.renderer.isInstrumentLoaded(instrumentID)) {
                            const instance = this.renderer.getInstrument(instrumentID);
                            if(instance.getFrequencyAliases) {
                                const aliases = instance.getFrequencyAliases();
                                Object.values(aliases).forEach((aliasValue) =>
                                    result = callback(aliasValue, aliasValue, `data-instrument="${instrumentID}"`));
                                addResult(result);
                            }
                        }
                    }
                }
                break;

            case 'note-frequencies':
                noteFrequencies = this.noteFrequencies;
                // for(let i=1; i<=6; i++) {
                for(let j=0; j<noteFrequencies.length; j++) {
                    const noteFrequency = noteFrequencies[j]; //  + i
                    result = callback(noteFrequency, noteFrequency);
                    addResult(result);
                }
                // }
                break;


            case 'note-frequencies-all':
                noteFrequencies = this.noteFrequencies;
                for(let i=1; i<=6; i++) {
                    for(let j=0; j<noteFrequencies.length; j++) {
                        const noteFrequency = noteFrequencies[j] + i;
                        result = callback(noteFrequency, noteFrequency);
                        addResult(result);
                    }
                }
                break;

            case 'note-frequency-octaves':
                for(let oi=1; oi<=7; oi+=1) {
                    result = callback(oi, '' + oi);
                    addResult(result);
                }
                break;

            case 'velocities':
                // optionsHTML += callback(null, 'Velocity (Default)');
                for(let vi=100; vi>=0; vi-=10) {
                    result = callback(vi, vi);
                    addResult(result);
                }
                break;

            case 'durations':
                for(let i=64; i>1; i/=2) {
                    let fraction = `1/${i}`; //.replace('1/2', '½').replace('1/4', '¼');
                    result = callback((1/i)/1.5    * timeDivision, `${fraction}t`);
                    addResult(result);
                    result = callback(1/i          * timeDivision, `${fraction}`);
                    addResult(result);
                    result = callback(1/i*1.5      * timeDivision, `${fraction}d`);
                    addResult(result);
                }
                for(let i=1; i<=16; i++) {
                    result = callback(i * timeDivision, i + 'B');
                    addResult(result);
                }
                break;

            case 'named-durations':
                for(let i=64; i>1; i/=2) {
                    let fraction = `1/${i}`; // .replace('1/2', '½').replace('1/4', '¼');
                    result = callback(`${fraction}t`,  `${fraction}t`);
                    addResult(result);
                    result = callback(`${fraction}`,   `${fraction}`);
                    addResult(result);
                    result = callback(`${fraction}d`,  `${fraction}d`);
                    addResult(result);
                }
                for(let i=1; i<=16; i++) {
                    result = callback(i + 'B', i + 'B');
                    addResult(result);
                }
                break;

            case 'beats-per-measure':
                for(let vi=1; vi<=12; vi++) {
                    result = callback(vi, vi + ` beat${vi>1?'s':''} per measure`);
                    addResult(result);
                }
                break;

            case 'beats-per-minute':
                for(let vi=40; vi<=300; vi+=10) {
                    result = callback(vi, vi+ ` beat${vi>1?'s':''} per minute`);
                    addResult(result);
                }
                break;

            case 'song-groups':
            case 'groups':
                if(songData && songData.instructions)
                    Object.keys(songData.instructions).forEach(function(key, i) {
                        result = callback(key, key);
                        addResult(result);
                    });
                break;

            case 'command-group-execute':
                if(songData && songData.instructions)
                    Object.keys(songData.instructions).forEach(function(key, i) {
                        result = callback('@' + key, '@' + key);
                        addResult(result);
                    });
                break;
            default:
                throw new Error("Invalid Value type: " + valueType);
        }
        return results;
    }

    renderEditorFormOptions(optionType, selectCallback) {
        let optionsHTML = '';
        this.getValues(optionType, function (value, label, html='') {
            const selected = selectCallback ? selectCallback(value) : false;
            optionsHTML += `<option value="${value}" ${selected ? ` selected="selected"` : ''}${html}>${label}</option>`;
        });
        return optionsHTML;
    }

    /** Formatting **/

    format(input, type) {
        switch(type) {
            case 'duration':
                let stringValue;
                this.getValues('durations', (duration, durationString) => {
                    if(input === duration || input === durationString)
                        stringValue = durationString;
                });
                if(stringValue)
                    return stringValue;
                input = parseFloat(input).toFixed(2);
                return input.replace('.00', 't');

            case 'instrument':
                if(typeof input !== 'number')
                    return 'N/A'; // throw new Error("Invalid Instrument");
                return input < 10 ? "0" + input : "" + input;

            case 'velocity':
                if(typeof input !== 'number')
                    return 'N/A'; // throw new Error("Invalid Instrument");
                return input === 100 ? "Max" : input+'';

            case 'command':
                return input;

            default:
                throw new Error("Unknown format: " + type);
        }
    }

}

if(typeof module !== "undefined")
    module.exports = {AudioSourceValues};
