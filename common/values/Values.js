import {ASUIMenuItem, ASUIMenuAction, ASUIMenuBreak, ASUIMenuDropDown} from "../../components/menu";
import React from "react";
import PromptManager from "../prompt/PromptManager";

class Values {
    static instance = new Values();

    /** Menus **/

    /** Select Command **/

    renderMenuSelectCommand(onSelectValue, currentCommand=null, title= null, additionalMenuItems=null) {
        return (<>
            <ASUIMenuItem>{title || (currentCommand === null ? 'Select Command' : `Edit ${currentCommand}`)}</ASUIMenuItem>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuSelectCommandByFrequency(onSelectValue, currentCommand)}           >By Frequency</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuSelectCommandByOctave(onSelectValue, currentCommand)}              >By Octave</ASUIMenuDropDown>
            {additionalMenuItems}
            <ASUIMenuAction
                onAction={async e => onSelectValue(await PromptManager.openPromptDialog("Insert custom command"))}
            >Custom Command</ASUIMenuAction>
        </>);

    }


    renderMenuSelectCommandByFrequency(onSelectValue, currentCommand=null) {
        return this.getNoteFrequencies((noteName) =>
            <ASUIMenuDropDown key={noteName} options={() => this.renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName, currentCommand)}>
                {noteName}
            </ASUIMenuDropDown>
        );
    }

    // TODO: move into lower menu?
    renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName, currentCommand=null) {
        return (<>
            {/*{keyboardOctave !== null ? <ASUIMenuAction onAction={() => onSelectValue(noteName+''+keyboardOctave)}>{`${noteName}${keyboardOctave} (Current)`}</ASUIMenuAction> : null}*/}
            {this.getNoteOctaves((octave) =>
                <ASUIMenuAction key={octave} onAction={() => onSelectValue(noteName+''+octave)}>
                    {`${noteName}${octave}`}
                </ASUIMenuAction>
            )}
        </>)
    }

    renderMenuSelectCommandByOctave(onSelectValue, currentCommand=null) {
        return (<>
            {/*{keyboardOctave !== null ? <ASUIMenuDropDown key={keyboardOctave} options={() => this.renderMenuSelectCommandByOctaveFrequency(onSelectValue, keyboardOctave)}>*/}
            {/*    {`${keyboardOctave} (Current)`}*/}
            {/*</ASUIMenuDropDown> : null}*/}
            {this.getNoteOctaves((octave) =>
                <ASUIMenuDropDown key={octave} options={() => this.renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave)}>
                    {octave}
                </ASUIMenuDropDown>
            )}
        </>)
    }

    renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave) {
        return this.getNoteFrequencies((noteName) =>
            <ASUIMenuAction key={noteName} onAction={() => onSelectValue(noteName+''+octave)}     >{noteName+''+octave}</ASUIMenuAction>
        );
    }


    /** Values **/

    /** UUID **/
    generateUUID() {
        var d = new Date().getTime();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            d += performance.now(); //use high-precision timer if available
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            // eslint-disable-next-line no-mixed-operators
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }


    getNoteFrequencies(callback = (freq) => freq) {
        const results = [];
        const noteList = this.noteList();
        for (let j = 0; j < noteList.length; j++) {
            const noteFrequency = noteList[j];
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
        const noteFrequencies = this.noteList();
        for (let i = 1; i <= 8; i++) {
            for (let j = 0; j < noteFrequencies.length; j++) {
                const noteFrequency = noteFrequencies[j] + i;
                const result = callback(noteFrequency);
                if(!addResult(results, result)) return results;
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

    getTrackerSegmentLengthInRows(callback = (lengthInTicks, lengthString) => [lengthInTicks, lengthString]) {
        const results = [];
        [0, 4, 5, 6, 7, 8, 10, 12, 16, 24, 32, 48, 64, 96, 128]
            .forEach(i => {
                const result = callback(i, i + ' Rows');
                if(!addResult(results, result)) return results;
            });
        return results;
    }

    formatVelocity(velocity) {
        if (typeof velocity !== 'number')
            return 'N/A'; // throw new Error("Invalid Program");
        return velocity === 100 ? "Max" : velocity + '';
    }



    formatProgramID(programID) {
        if (typeof programID !== 'number')
            return 'N/A'; // throw new Error("Invalid Program");
        return programID < 10 ? "0" + programID : "" + programID;
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
        return (parseInt(parts[0], 10) * 60)
            + (parseInt(parts[1], 10))
            + (parseInt(parts[2], 10) / 1000);
    }

    parseFrequencyString(note) {
        if (typeof note !== "string")
            throw new Error("Frequency is not a string");
        if (!note)
            throw new Error("Frequency is null");

        const noteQuarterToneList = this.noteQuarterToneList();
        const noteScale = note.slice(0, -1);
        const octave = parseInt(note.slice(-1));
        if(isNaN(octave))
            throw new Error("Invalid octave value: " + note);
        if(typeof noteQuarterToneList[noteScale] === "undefined")
            throw new Error("Unrecognized Note: " + noteScale);
        let keyNumber = noteQuarterToneList[noteScale];

        if (keyNumber < 6)
            keyNumber = keyNumber + 24 + ((octave - 1) * 24) + 2;
        else
            keyNumber = keyNumber + ((octave - 1) * 24) + 2;

        return 440 * Math.pow(2, (keyNumber - 98) / 24);
    }


    /** Duration **/
    parseDurationAsTicks(durationString, timeDivision) {
        if(!timeDivision)
            throw new Error("Invalid timeDivision");
        if (typeof durationString !== 'string')
            return durationString;
        const units = durationString.substr(durationString.length - 1);
        let fraction = durationString.substr(0, durationString.length - 1);
        if(fraction.indexOf('/') !== -1) {
            const fractionSplit = fraction.split('/');
            fraction = parseInt(fractionSplit[0], 10) / parseInt(fractionSplit[1], 10);
        }
        switch (units) {
            case 't':
                return parseInt(fraction);
            case 'B':
                return timeDivision * parseFloat(fraction);
            case 'D':
                return timeDivision * 1.5 * parseFloat(fraction);
            case 'T':
                return timeDivision / 1.5 * parseFloat(fraction);
            default:
                throw new Error("Invalid Duration: " + durationString);
        }
    }

    formatDuration(input, timeDivision) {
        let stringValue;
        this.getNoteDurations((duration, durationString) => {
            if (input === duration || input === durationString) {
                stringValue = durationString;
                return false;
            }
        }, timeDivision);

        if (stringValue)
            return stringValue;
        const beatDivisor = input / timeDivision;
        if(beatDivisor === Math.round(beatDivisor))
            return beatDivisor + 'B';

        input = parseFloat(input).toFixed(2);
        return input.replace('.00', 't');
    }


    getNoteDurations(callback = (duration, durationString) => [duration, durationString], timeDivision) {
        const results = [];
        for (let i = 64; i > 1; i /= 2) {
            let result = callback(1 / i * timeDivision, `1/${i}B`);            // Full Beats
            if(!addResult(results, result)) return results;
        }
        for (let i = 64; i > 1; i /= 2) {
            let result = callback((1 / i) / 1.5 * timeDivision, `1/${i}T`); // Triplet
            if(!addResult(results, result)) return results;
        }
        for (let i = 64; i > 1; i /= 2) {
            let result = callback(1 / i * 1.5 * timeDivision, `1/${i}D`);      // Dotted
            if(!addResult(results, result)) return results;
        }

        for (let i = 1; i <= 16; i++) {
            let result = callback(i * timeDivision, `${i}B`);            // Full Beats
            if(!addResult(results, result)) return results;
        }

        for (let i = 1; i <= 16; i++) {
            let result = callback(i / 1.5 * timeDivision, `${i}T`); // Triplet
            if(!addResult(results, result)) return results;
        }

        for (let i = 1; i <= 16; i++) {
            let result = callback(i * 1.5 * timeDivision, `${i}D`);      // Dotted
            if(!addResult(results, result)) return results;
        }
        return results;
    }

    // get noteFrequencies() {
    //     return this.renderer.noteFrequencies; // ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    // }


    /** Frequency **/
    // const noteCommands = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    // Uses quarter tones
    noteList() {
        return [
            'A',
            'A#',
            'Bb',
            'B',
            'C',
            'C#',
            'Db',
            'D',
            'D#',
            'Eb',
            'E',
            'E#',
            'F',
            'F#',
            'Gb',
            'G',
            'G#',
            'Ab',
        ]
    }

    noteQuarterToneList() {
        return {
            'A': 0,
            'Aq': 1,
            'A#': 2,
            'A#q': 3,
            'Bb': 2,
            'Bbq': 3,
            'B': 4,
            'Bq': 5,
            'C': 6,
            'Cq': 7,
            'C#': 8,
            'C#q': 9,
            'Db': 8,
            'Dbq': 9,
            'D': 10,
            'Dq': 11,
            'D#': 12,
            'D#q': 13,
            'Eb': 12,
            'Ebq': 13,
            'E': 14,
            'Eq': 15,
            'E#': 16,
            'E#q': 17,
            'F': 16,
            'Fq': 17,
            'F#': 18,
            'F#q': 19,
            'Gb': 18,
            'Gbq': 19,
            'G': 20,
            'Gq': 21,
            'G#': 22,
            'G#q': 23,
            'Ab': 22,
            'Abq': 23,
        }
    }

}

function addResult (results, result) {
    if (result !== null && typeof result !== "undefined")
        results.push(result);
    return result === false ? result : true;
}



export default Values;


