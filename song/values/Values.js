import {MenuAction, MenuBreak, MenuDropDown} from "../../components/menu";
import {InputRange} from "../../components";
import ProgramLoader from "../program/ProgramLoader";
import React from "react";

class Values {

    /** Menus **/

    // TODO: move copy to SongValues
    static renderMenuSelectCommand(onSelectValue, keyboardOctave=null) {
        return (<>
            <MenuDropDown options={() => this.renderMenuSelectCommandByFrequency(onSelectValue, keyboardOctave)}           >By Frequency</MenuDropDown>
            <MenuDropDown options={() => this.renderMenuSelectCommandByOctave(onSelectValue, keyboardOctave)}              >By Octave</MenuDropDown>
            <MenuBreak />
            <MenuDropDown disabled options={() => this.renderMenuSelectCommandByNamed(onSelectValue)}               >By Alias</MenuDropDown>
            <MenuDropDown disabled options={() => this.renderMenuSelectCommandByTrack(onSelectValue)}               >By Group</MenuDropDown>
            <MenuAction onAction={async e => onSelectValue(await this.openPromptDialog("Insert custom command"))}      >Custom Command</MenuAction>
        </>);

    }


    // TODO: move copy to SongValues
    static renderMenuSelectCommandByNamed(onSelectValue) {
        return this.values.getAllNamedFrequencies((noteName, frequency, programID) =>
            <MenuAction
                key={noteName}
                onAction={e => onSelectValue(noteName)}
                children={noteName}
            />
        );
    }

    // TODO: move copy to SongValues
    static renderMenuSelectCommandByTrack(onSelectValue, onTrackAdd=null) {
        return (<>
            {this.getAllSongGroups((trackName) =>
                trackName === this.trackName ? null :
                    <MenuAction
                        key={trackName}
                        disabled={trackName === this.state.selectedTrack}
                        onAction={e => onSelectValue('@' + trackName)}
                    >{trackName}</MenuAction>
            )}
            <MenuAction onAction={onTrackAdd} hasBreak  >Create New Track</MenuAction>
        </>);
    }


    // renderMenuSelectCommandByCurrentOctave(onSelectValue, octave=null) {
    //     octave = octave !== null ? octave : this.state.keyboardOctave;
    //     return Values.getNoteFrequencies((noteName) =>
    //         <MenuAction key={noteName} onAction={e => onSelectValue(`${noteName}${octave}`)}     >{noteName}{octave}</MenuAction>
    //     );
    // }


    static renderMenuSelectCommandByFrequency(onSelectValue, keyboardOctave=null) {
        return this.getNoteFrequencies((noteName) =>
            <MenuDropDown key={noteName} options={() => this.renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName, keyboardOctave)}>
                {noteName}
            </MenuDropDown>
        );
    }

    // TODO: move into lower menu?
    static renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName, keyboardOctave=null) {
        return (<>
            {keyboardOctave !== null ? <MenuAction onAction={() => onSelectValue(noteName+''+keyboardOctave)}>{noteName+''+keyboardOctave} (Current)</MenuAction> : null}
            {this.getNoteOctaves((octave) =>
                <MenuAction key={octave} onAction={() => onSelectValue(noteName+''+octave)}>
                    {noteName+''+octave}
                </MenuAction>
            )}
        </>)
    }

    static renderMenuSelectCommandByOctave(onSelectValue, keyboardOctave=null) {
        return (<>
            {keyboardOctave !== null ? <MenuDropDown key={keyboardOctave} options={() => this.renderMenuSelectCommandByOctaveFrequency(onSelectValue, keyboardOctave)}>
                {keyboardOctave} (Current)
            </MenuDropDown> : null}
            {this.getNoteOctaves((octave) =>
                <MenuDropDown key={octave} options={() => this.renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave)}>
                    {octave}
                </MenuDropDown>
            )}
        </>)
    }

    static renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave) {
        return this.getNoteFrequencies((noteName) =>
            <MenuAction key={noteName} onAction={() => onSelectValue(noteName+''+octave)}     >{noteName+''+octave}</MenuAction>
        );
    }


    static renderMenuSelectDuration(onSelectValue, currentDuration, timeDivision) {
        return (<>
            <MenuDropDown disabled options={() => renderMenuSelect('recent')}    >Recent</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={() => renderMenuSelect('fraction')}  >Fraction</MenuDropDown>
            <MenuDropDown options={() => renderMenuSelect('triplet')}   >Triplet</MenuDropDown>
            <MenuDropDown options={() => renderMenuSelect('dotted')}    >Dotted</MenuDropDown>
            <MenuBreak />
            <MenuDropDown disabled options={() => renderMenuSelect('custom')}    >Custom</MenuDropDown>
        </>);

        function renderMenuSelect(key) {
            let results = [];
            switch(key) {
                case 'fraction':
                    for (let i = 64; i > 1; i /= 2)
                        results.push(
                            <MenuAction key={`${i}a`} onAction={() => onSelectValue(1 / i * timeDivision, `1/${i}B`)}  >{`1/${i}B`}</MenuAction>
                        );
                    for (let i = 1; i <= 16; i++)
                        results.push(
                            <MenuAction key={`${i}b`} onAction={() => onSelectValue(i * timeDivision, i + 'B')}  >{i + 'B'}</MenuAction>
                        );
                    break;

                case 'triplet':
                    for (let i = 64; i > 1; i /= 2)
                        results.push(
                            <MenuAction key={`${i}a`} onAction={() => onSelectValue(1 / (i / 1.5) * timeDivision, `1/${i}T`)}  >{`1/${i}T`}</MenuAction>
                        );
                    for (let i = 1; i <= 16; i++)
                        results.push(
                            <MenuAction key={`${i}b`} onAction={() => onSelectValue((i / 1.5) * timeDivision, i + 'T')}  >{i + 'T'}</MenuAction>
                        );
                    break;

                case 'dotted':
                    for (let i = 64; i > 1; i /= 2)
                        results.push(
                            <MenuAction key={`${i}a`} onAction={() => onSelectValue(1 / (i * 1.5) * timeDivision, `1/${i}D`)}  >{`1/${i}D`}</MenuAction>
                        );
                    for (let i = 1; i <= 16; i++)
                        results.push(
                            <MenuAction key={`${i}b`} onAction={() => onSelectValue((i * 1.5) * timeDivision, i + 'D')}  >{i + 'D'}</MenuAction>
                        );
                    break;

                default:
                    throw new Error("Unknown key");
            }
            return results;
        }
    }

    static renderMenuSelectVelocity(onSelectValue, currentVelocity=null) {
        const customAction = async () => {
            const velocity = await this.openPromptDialog("Enter custom velocity (1-127)", 127);
            onSelectValue(velocity);
        };
        return (<>
            <MenuAction onAction={()=>{}} disabled>Set Velocity</MenuAction>
            <InputRange
                min={0}
                max={127}
                value={currentVelocity}
                onChange={(e, mixerValue) => onSelectValue(mixerValue)}
            />
            <MenuBreak/>
            {this.getNoteVelocities((velocity) =>
                <MenuAction key={velocity} onAction={() => onSelectValue(velocity)}  >{velocity}</MenuAction>)}
            <MenuAction onAction={customAction} hasBreak >Custom</MenuAction>
        </>);
    }

    /** @deprecated moved to Library **/
    static renderMenuSelectAvailableProgram(onSelectValue, menuTitle=null) {
        return (<>
            {menuTitle ? <><MenuAction disabled onAction={() => {}}>{menuTitle}</MenuAction><MenuBreak/></> : null}
            {ProgramLoader.getRegisteredPrograms().map((config, i) =>
                <MenuAction key={i} onAction={() => onSelectValue(config.className)}       >{config.title}</MenuAction>
            )}
        </>);
    }


    /** Prompt **/

    static async openPromptDialog(message, defaultValue='') {
        return window.prompt(message, defaultValue);
    }

    static async openConfirmDialog(message) {
        return window.confirm(message);
    }

    /** UUID **/
    static generateUUID() {
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

    /** Values **/

    static getNoteFrequencies(callback = (freq) => freq) {
        const results = [];
        const noteList = this.noteList();
        for (let j = 0; j < noteList.length; j++) {
            const noteFrequency = noteList[j];
            const result = callback(noteFrequency);
            if(!addResult(results, result)) return results;
        }
        return results;
    }

    static getNoteOctaves(callback = (octave) => octave) {
        const results = [];
        for (let i = 1; i <= 8; i++) {
            const result = callback(i);
            if(!addResult(results, result)) return results;
        }
        return results;
    }


    static getOctaveNoteFrequencies(callback = (freq) => freq) {
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


    static getNoteVelocities(callback = (velocity) => velocity) {
        const results = [];
        for (let vi = 100; vi >= 0; vi -= 10) {
            const result = callback(vi);
            if(!addResult(results, result)) return results;
        }
        return results;
    }



    static getBeatsPerMeasure(callback = (beatsPerMeasure, beatsPerMeasureString) => [beatsPerMeasure, beatsPerMeasureString]) {
        const results = [];
        for (let beatPerMeasure = 1; beatPerMeasure <= 12; beatPerMeasure++) {
            const result = callback(beatPerMeasure, beatPerMeasure + ` beat${beatPerMeasure > 1 ? 's' : ''} per measure`);
            if(!addResult(results, result)) return results;
        }
        return results;
    }

    static getBeatsPerMinute(callback = (beatsPerMinute, beatsPerMinuteString) => [beatsPerMinute, beatsPerMinuteString]) {
        const results = [];
        for (let beatPerMinute = 40; beatPerMinute <= 300; beatPerMinute += 10) {
            const result = callback(beatPerMinute, beatPerMinute + ` beat${beatPerMinute > 1 ? 's' : ''} per minute`);
            if(!addResult(results, result)) return results;
        }
        return results;
    }

    static getTrackerSegmentLengthInRows(callback = (lengthInTicks, lengthString) => [lengthInTicks, lengthString]) {
        const results = [];
        [4, 5, 6, 7, 8, 10, 12, 16, 24, 32, 48, 64, 96, 128]
            .forEach(i => {
                const result = callback(i, i + ' Rows');
                if(!addResult(results, result)) return results;
            });
        return results;
    }

    static formatVelocity(velocity) {
        if (typeof velocity !== 'number')
            return 'N/A'; // throw new Error("Invalid Program");
        return velocity === 100 ? "Max" : velocity + '';
    }



    static formatProgramID(programID) {
        if (typeof programID !== 'number')
            return 'N/A'; // throw new Error("Invalid Program");
        return programID < 10 ? "0" + programID : "" + programID;
    }

    static formatCommand(commandString) {
        return commandString;
    }

    static formatPlaybackPosition(seconds) {
        let m = Math.floor(seconds / 60);
        seconds = seconds % 60;
        let ms = Math.round((seconds - Math.floor(seconds)) * 1000);
        seconds = Math.floor(seconds);

        m = (m + '').padStart(2, '0');
        seconds = (seconds + '').padStart(2, '0');
        ms = (ms + '').padStart(3, '0'); // TODO: ticks?
        return `${m}:${seconds}:${ms}`;
    }

    static parsePlaybackPosition(formattedSeconds) {
        const parts = formattedSeconds.toString().split(':');
        return (parseInt(parts[0], 10) * 60)
            + (parseInt(parts[1], 10))
            + (parseInt(parts[2], 10) / 1000);
    }

    static parseFrequencyString(note) {
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
    static parseDurationAsTicks(durationString, timeDivision) {
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

    static formatDuration(input, timeDivision) {
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


    static getNoteDurations(callback = (duration, durationString) => [duration, durationString], timeDivision) {
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
    static noteList() {
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

    static noteQuarterToneList() {
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


