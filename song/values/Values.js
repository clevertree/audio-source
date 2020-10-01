import {ASUIInputRange, ASUIMenuAction, ASUIMenuBreak, ASUIMenuDropDown, ASUIMenuItem} from "../../components";
import PromptManager from "../../common/prompt/PromptManager";
import React from "react";

class Values {
    static UUID_FORMAT = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    static FREQ_A4 = 432;
    static instance = new Values();
    static lastModeKey = 'fraction';

    static RECENT_ITEM_LIMIT = 6;

    /** Recent Frequencies **/
    static recentFrequencies = ['C4', 'Cq4', 'C#4', 'C#q4'];

    /** Recent Durations **/
    static recentDurations = ['1B', '0.5B', '24t'];


    /** Values **/

    /** UUID **/
    generateUUID(uuidFormat = Values.UUID_FORMAT) {
        var d = new Date().getTime();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            d += performance.now(); //use high-precision timer if available
        }
        return uuidFormat.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            // eslint-disable-next-line no-mixed-operators
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }


    getNoteFrequencies(callback = (freq) => freq) {
        const results = [];
        const noteList = this.listNotes();
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
        const noteFrequencies = this.listNotes();
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
        const result = callback(100, 'Max'); // 127
        if(!addResult(results, result)) return results;
        for (let vi = 90; vi >= 0; vi -= 10) {
            const result = callback(vi, vi);
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

    getTrackerLengthInRows(callback = (lengthInTicks, lengthString) => [lengthInTicks, lengthString]) {
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

    parseFrequencyString(noteString) {
        const {keyNumber} = this.parseFrequencyParts(noteString);
        return Values.FREQ_A4 * Math.pow(2, (keyNumber - 98) / 24);
        // TODO: tune A4 to 440/432hz
    }

    parseFrequencyParts(noteString) {
        if (typeof noteString !== "string")
            throw new Error("Frequency is not a string");
        if (!noteString)
            throw new Error("Frequency is null");

        const noteQuarterToneList = this.listQuarterToneNotes();
        const ret = {
            note: noteString.slice(0, -1),
        }
        ret.octave = parseInt(noteString.slice(-1));
        if(isNaN(ret.octave))
            throw new Error("Invalid octave value: " + noteString);
        if(typeof noteQuarterToneList[ret.note] === "undefined")
            throw new Error("Unrecognized Note: " + ret.note);
        ret.keyNumber = noteQuarterToneList[ret.note];
        if (ret.keyNumber < 6)
            ret.keyNumber = ret.keyNumber + 24 + ((ret.octave - 1) * 24) + 2;
        else
            ret.keyNumber = ret.keyNumber + ((ret.octave - 1) * 24) + 2;
        return ret;
    }


    /** Duration **/

    durationTicksToSeconds(durationTicks, timeDivision, beatsPerMinute) {
        return (durationTicks / timeDivision) / (beatsPerMinute / 60);
    }

    durationSecondsToTicks(durationSeconds, timeDivision, beatsPerMinute) {
        return (durationSeconds * (beatsPerMinute / 60)) * timeDivision;

    }

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

    formatDuration(durationTicks, timeDivision) {
        const beatDivisor = durationTicks / timeDivision;
        if(beatDivisor === Math.round(beatDivisor))
            return beatDivisor + 'B';

        // TODO: this part is inefficient
        let stringValue;
        this.getNoteDurations((duration, durationString) => {
            if (durationTicks === duration || durationTicks === durationString) {
                stringValue = durationString;
                return false;
            }
        }, timeDivision);
        // console.log('formatDuration', {input: durationTicks, stringValue})

        if (stringValue)
            return stringValue;

        return this.formatDurationAsTicks(durationTicks);
    }

    formatDurationAsTicks(durationTicks) {
        durationTicks = parseFloat(durationTicks).toFixed(2);
        return durationTicks.replace('.00', 't');
    }

    formatDurationAsDecimal(durationTicks, timeDivision, fractionDigits=2) {
        const fraction = durationTicks / timeDivision;
        // const integer = Math.floor(fraction);
        // const divisor = fraction - integer;
        // console.log({fraction, integer, divisor});
        // if(divisor === 1/3)
        //     return integer + ' 1/3B';
        return fraction.toFixed(fractionDigits)
            // .replace('.25', '¼')
            // .replace('.50', '½')
            // .replace('.75', '¾')
            .replace('.00', '')
            + 'B';
    }

    getNoteDurations(callback = (duration, durationString) => [duration, durationString], timeDivision, mode='all') {
        const results = [];
        if(mode === 'all' || mode === 'fraction') {
            for (let i = 64; i > 1; i /= 2) {
                let result = callback(1 / i * timeDivision, `1/${i}B`);            // Full Beats
                if (!addResult(results, result)) return results;
            }
            for (let i = 1; i <= 16; i++) {
                let result = callback(i * timeDivision, `${i}B`);            // Full Beats
                if (!addResult(results, result)) return results;
            }
        }


        if(mode === 'all' || mode === 'triplet') {
            for (let i = 64; i > 1; i /= 2) {
                let result = callback((1 / i) / 1.5 * timeDivision, `1/${i}T`); // Triplet
                if (!addResult(results, result)) return results;
            }

            for (let i = 1; i <= 16; i++) {
                let result = callback(i / 1.5 * timeDivision, `${i}T`); // Triplet
                if (!addResult(results, result)) return results;
            }
        }


        if(mode === 'all' || mode === 'dotted') {
            for (let i = 64; i > 1; i /= 2) {
                let result = callback(1 / i * 1.5 * timeDivision, `1/${i}D`);      // Dotted
                if (!addResult(results, result)) return results;
            }
            for (let i = 1; i <= 16; i++) {
                let result = callback(i * 1.5 * timeDivision, `${i}D`);      // Dotted
                if (!addResult(results, result)) return results;
            }
        }
        // console.log('mode', mode, results);
        return results;
    }

    /** Indices **/

    parseSelectedIndices(selectedIndices) {

        if (typeof selectedIndices === 'number')
            selectedIndices = [selectedIndices];

        // if(!clearSelection && this.getSelectedIndices().length > 0)
        //     selectedIndices = selectedIndices.concat(this.getSelectedIndices());
        // console.log('selectIndices', Array.isArray(selectedIndices), selectedIndices);
        if (!Array.isArray(selectedIndices))
            throw new Error("Invalid selection: " + selectedIndices);

        selectedIndices.forEach((index, i) => {
            if(typeof index !== "number")
                throw new Error(`Invalid selection index (${i}): ${index}`);
        });

        // Filter and sort
        selectedIndices = this.filterAndSort(selectedIndices);
        return selectedIndices;
    }

    filterAndSort(selectedIndices) {
        // Filter unique indices
        selectedIndices = this.filterUniqueIndices(selectedIndices);
        // Sort indices
        return this.sortIndices(selectedIndices);
    }

    filterUniqueIndices(selectedIndices) {
        // Filter unique indices
        return selectedIndices.filter((v, i, a) => a.indexOf(v) === i && v !== null);
    }

    sortIndices(selectedIndices) {
        // Sort indices
        return selectedIndices.sort((a, b) => a - b);
    }


    // get noteFrequencies() {
    //     return this.renderer.noteFrequencies; // ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    // }

    /** MIDI Support **/

    getFrequencyFromMIDINote(midiNote) {
        const command = this.getCommandFromMIDINote(midiNote);
        const frequency = this.parseFrequencyString(command);
        return frequency;
    }


    getCommandFromMIDINote(midiNote) {
        const octave = Math.floor(midiNote / 12);
        const pitch = midiNote % 12;
        const noteList = this.listMIDINotes();
        return noteList[pitch] + octave;
    }




    /** Menus **/

    /** Command Menu **/

    renderMenuSelectCommand(onSelectValue, currentCommand=null, additionalMenuItems=null) {
        return (<>
            {this.renderMenuSelectFrequency(onSelectValue, currentCommand)}
            <ASUIMenuBreak />
            {additionalMenuItems}

            <ASUIMenuAction
                onAction={async e => onSelectValue(await PromptManager.openPromptDialog("Insert custom command"))}
            >Custom</ASUIMenuAction>
            <ASUIMenuBreak />
            {(Values.recentFrequencies || []).map((recentFrequency, i) =>
                <ASUIMenuAction key={i} onAction={() => onSelectValue(recentFrequency)}>{recentFrequency}</ASUIMenuAction>
            )}
        </>);
    }

    /** Frequency Menu **/

    renderMenuSelectFrequency(onSelectFrequency, currentFrequency=null, title=null) {
        const oldCallback = onSelectFrequency;
        onSelectFrequency = function(selectedFrequency) {
            addRecentMenuItem(selectedFrequency, Values.recentFrequencies);
            return oldCallback(selectedFrequency);
        }
        return (<>
            {title ? <ASUIMenuItem>{title}</ASUIMenuItem> : null}
            {title ? <ASUIMenuBreak /> : null}
            <ASUIMenuDropDown options={() => this.renderMenuSelectFrequencyByNote(onSelectFrequency, currentFrequency)}         >By Note</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuSelectFrequencyByOctave(onSelectFrequency, currentFrequency)}       >By Octave</ASUIMenuDropDown>
        </>);
    }

    renderMenuSelectFrequencyWithRecent(onSelectFrequency, currentFrequency=null, title=null) {
        const recentFrequencies = Values.recentFrequencies || [];
        return (<>
            {this.renderMenuSelectFrequency(onSelectFrequency, currentFrequency, title)}
            {recentFrequencies.length > 0 ? <ASUIMenuBreak /> : null}
            {(recentFrequencies).map((recentFrequency, i) =>
                <ASUIMenuAction key={i} onAction={() => onSelectFrequency(recentFrequency)}>{recentFrequency}</ASUIMenuAction>
            )}
        </>);
    }
    /**
     {(Values.recentFrequencies || []).map((recentFrequency, i) =>
    <ASUIMenuAction key={i} onAction={() => onSelectFrequency(recentFrequency)}>{recentFrequency}</ASUIMenuAction>
)}
     */

    renderMenuSelectFrequencyByNote(onSelectValue, currentFrequency=null) {
        let currentNote = null;
        if(currentFrequency)
            try {currentNote = this.parseFrequencyParts(currentFrequency).note;} catch (e) {}
        // console.log('currentCommand', currentCommand);
        return (<>
            {currentNote !== null ? <ASUIMenuDropDown key={currentNote} options={() => this.renderMenuSelectFrequencyFromNoteName(onSelectValue, currentNote, currentFrequency)}>
                {`${currentNote} (Current)`}
            </ASUIMenuDropDown> : null}
            {currentNote !== null ? <ASUIMenuBreak /> : null}
            {this.getNoteFrequencies((noteName) =>
                <ASUIMenuDropDown key={noteName} options={() => this.renderMenuSelectFrequencyFromNoteName(onSelectValue, noteName, currentFrequency)}>
                    {noteName}
                </ASUIMenuDropDown>
            )}
        </>);
    }

    renderMenuSelectFrequencyFromNoteName(onSelectOctave, noteName, currentFrequency=null) {
        let currentOctave = null;
        if(currentFrequency)
            try {currentOctave = this.parseFrequencyParts(currentFrequency).octave;} catch (e) {}

        return (<>
            {currentOctave !== null ? <ASUIMenuAction onAction={() => onSelectOctave(noteName+''+currentOctave)}>{`${noteName}${currentOctave} (Current)`}</ASUIMenuAction> : null}
            {currentOctave !== null ? <ASUIMenuBreak /> : null}
            {this.getNoteOctaves((octave) =>
                <ASUIMenuAction key={octave} onAction={() => onSelectOctave(noteName+''+octave)}>
                    {`${noteName}${octave}`}
                </ASUIMenuAction>
            )}
        </>)
    }

    renderMenuSelectFrequencyByOctave(onSelectValue, currentFrequency=null) {
        let currentOctave = null;
        if(currentFrequency)
            try {currentOctave = this.parseFrequencyParts(currentFrequency).octave;} catch (e) {}
        return (<>
            {currentOctave !== null ? <ASUIMenuDropDown key={currentOctave} options={() => this.renderMenuSelectFrequencyFromOctave(onSelectValue, currentOctave)}>
                {`${currentOctave} (Current)`}
            </ASUIMenuDropDown> : null}
            {this.getNoteOctaves((octave) =>
                <ASUIMenuDropDown key={octave} options={() => this.renderMenuSelectFrequencyFromOctave(onSelectValue, octave)}>
                    {octave}
                </ASUIMenuDropDown>
            )}
        </>)
    }

    renderMenuSelectFrequencyFromOctave(onSelectValue, octave) {
        return this.getNoteFrequencies((noteName) =>
            <ASUIMenuAction key={noteName} onAction={() => onSelectValue(noteName+''+octave)}     >{noteName+''+octave}</ASUIMenuAction>
        );
    }



    /** Duration Menu **/

    renderMenuSelectDuration(onSelectDuration, timeDivision=null, currentDuration = null, title=null) {
        const oldCallback = onSelectDuration;
        onSelectDuration = (selectedDuration, selectedDurationString) => {
            addRecentMenuItem(selectedDurationString, Values.recentDurations);
            // selectedDuration = this.parseDurationAsTicks(selectedDuration, timeDivision)
            return oldCallback(selectedDuration);
        }
        return (<>
            {title ? <ASUIMenuItem>{title}</ASUIMenuItem> : null}
            {title ? <ASUIMenuBreak /> : null}
            <ASUIMenuDropDown options={() => this.renderMenuSelectDurationByMode('fraction', onSelectDuration, timeDivision, currentDuration)}  >Fraction</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuSelectDurationByMode('triplet', onSelectDuration, timeDivision, currentDuration)}  >Triplet</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuSelectDurationByMode('dotted', onSelectDuration, timeDivision, currentDuration)}  >Dotted</ASUIMenuDropDown>
            <ASUIMenuBreak />
            {/*<ASUIMenuDropDown disabled options={() => renderMenuSelect('recent')}    >Recent</ASUIMenuDropDown>*/}
            <ASUIMenuAction onAction={() => {
                PromptManager.openPromptDialog("Enter a duration string or number of ticks", currentDuration)
                    .then(onSelectDuration)
            }}    >Custom</ASUIMenuAction>
            <ASUIMenuBreak />
            {(Values.recentDurations || []).map((recentDuration, i) =>
                <ASUIMenuAction key={i} onAction={() => onSelectDuration(recentDuration)}>{recentDuration}</ASUIMenuAction>
            )}
            {/*{this.renderMenuSelectDurationByMode(Values.lastModeKey, onSelectValue, timeDivision, currentDuration)}*/}
        </>);
    }

    renderMenuSelectDurationByMode(modeKey, onSelectValue, timeDivision, currentDuration) {
        const oldCallback = onSelectValue;
        onSelectValue = function(...args) {
            oldCallback(...args);
            // console.log('Values.lastModeKey', modeKey);
            Values.lastModeKey = modeKey;
        }
        return this.getNoteDurations((duration, durationString) =>
                <ASUIMenuAction
                    selected={currentDuration === duration}
                    key={durationString}
                    onAction={() => onSelectValue(duration, durationString)}>{durationString}</ASUIMenuAction>,
            timeDivision,
            modeKey
        )
    }

    /** Velocity Menu **/


    renderMenuSelectVelocity(onSelectValue, currentVelocity=null, title=null) {
        const customAction = () => {
            PromptManager.openPromptDialog("Enter custom velocity (1-127)", 127)
                .then(onSelectValue)
        };
        return (<>
            {title ? <ASUIMenuItem>{title}</ASUIMenuItem> : null}
            {title ? <ASUIMenuBreak /> : null}
            {this.renderInputVelocity(onSelectValue, currentVelocity, title)}
            <ASUIMenuBreak/>
            {this.getNoteVelocities((velocity, velocityTitle) =>
                <ASUIMenuAction key={velocity} onAction={() => onSelectValue(velocity)}  >{velocityTitle}</ASUIMenuAction>)}
            <ASUIMenuAction onAction={customAction} hasBreak >Custom</ASUIMenuAction>
        </>);
    }

    renderInputVelocity(onChange, currentVelocity=null, title=null) {
        return <ASUIInputRange
            min={0}
            max={100}
            title={title}
            value={currentVelocity || 100}
            format={ASUIInputRange.formats.percent}
            onChange={onChange}
        />;
    }


    /** Values **/

    // const noteCommands = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    // Uses quarter tones
    listNotes() {
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

    listQuarterToneNotes() {
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

    listMIDINotes() {
        return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    }

}

function addResult (results, result) {
    if (result !== null && typeof result !== "undefined")
        results.push(result);
    return result === false ? result : true;
}


function addRecentMenuItem(item, collection) {
    const i = collection.indexOf(item);
    if(i !== -1)
        collection.splice(i, 1);
    collection.unshift(item);
    if(collection.length > Values.RECENT_ITEM_LIMIT)
        collection.pop();
}


export default Values;


