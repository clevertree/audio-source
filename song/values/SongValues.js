import Values from "../../common/values/Values";
import {ASUIMenuAction, ASUIMenuBreak, ASUIMenuDropDown} from "../../components/menu";
import React from "react";

class SongValues extends Values {
    constructor(song) {
        super();
        this.song = song;
    }


    getSongPrograms(callback = (id, name) => [id, name]) {
        const songData = this.song.getProxiedData();
        const results = [];
        if (songData.programs) {
            const programList = songData.programs;
            for (let programID = 0; programID < programList.length; programID++) {
                const program = programList[programID];

                const [programClass, programConfig] = program || ["Empty", {}]; //  || {title: "No Program Loaded"};
                // const programs = this.renderer.getProgram(programID);
                const result = callback(programID, programClass, programConfig);
                if(!addResult(results, result)) return results;
            }
        }
        return results;
    }

    getAllSongTracks(callback = (trackName) => trackName) {
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



    parseSelectedIndices(selectedIndices) {
        if (typeof selectedIndices === "string") {
            switch (selectedIndices) {
                case 'all':
                    selectedIndices = [];
                    const maxLength = this.getSong().instructionGetList(this.getTrackName()).length;
                    for (let i = 0; i < maxLength; i++)
                        selectedIndices.push(i);
                    break;
                case 'segment':
                    throw new Error('TODO');
                // selectedIndices = [].map.call(this.querySelectorAll('asct-instruction'), (elm => elm.index));
                case 'row':
                    throw new Error('TODO');
                case 'none':
                    selectedIndices = [];
                    break;
                default:
                    selectedIndices = selectedIndices.split(/[^0-9]/).map(index => parseInt(index));
                // throw new Error("Invalid selection: " + selectedIndices);
            }
        }

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

        // Filter unique indices
        selectedIndices = selectedIndices.filter((v, i, a) => a.indexOf(v) === i && v !== null);
        // Sort indices
        selectedIndices.sort((a, b) => a - b);
        return selectedIndices;
    }


    formatSongDuration(input) {
        return this.formatDuration(input, this.song.data.timeDivision);
    }


    /** Duration **/

    parseDurationAsTicks(durationString, timeDivision=null) {
        return super.parseDurationAsTicks(durationString, timeDivision || this.song.data.timeDivision);
    }

    formatDuration(durationTicks, timeDivision=null) {
        return super.formatDuration(durationTicks, timeDivision || this.song.data.timeDivision);
    }
    formatDurationAsDecimal(durationTicks, timeDivision=null, fractionDigits=2) {
        return super.formatDurationAsDecimal(durationTicks, timeDivision || this.song.data.timeDivision, fractionDigits);
    }

    getNoteDurations(callback = (duration, durationString) => [duration, durationString], timeDivision= null, mode='all') {
        return super.getNoteDurations(callback, timeDivision || this.song.data.timeDivision, mode);
    }

    /** Menus **/

    /** Command Menu **/

    renderMenuSelectCommand(onSelectValue, currentCommand=null, title= null) {
        return super.renderMenuSelectCommand(onSelectValue, currentCommand, title, (<>
            <ASUIMenuBreak />
            <ASUIMenuDropDown disabled options={() => this.renderMenuSelectCommandByNamed(onSelectValue)}               >By Alias</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuSelectCommandByTrack(onSelectValue)}               >By Track</ASUIMenuDropDown>
        </>));
    }

    renderMenuSelectCommandByNamed(onSelectValue) {
        return this.getAllNamedFrequencies((noteName, frequency, programID) =>
            <ASUIMenuAction
                key={noteName}
                onAction={e => onSelectValue(noteName)}
                children={noteName}
            />
        );
    }

    renderMenuSelectCommandByTrack(onSelectValue, onTrackAdd=null, selectedTrack=null) {
        return this.renderMenuSelectTrack(
            trackName => onSelectValue('@' + trackName),
            onTrackAdd,
            selectedTrack);
    }

    /** Duration Menu **/

    renderMenuSelectDuration(onSelectValue, timeDivision=null, currentDuration = null, title=null) {
        return super.renderMenuSelectDuration(
            onSelectValue,
            timeDivision || this.song.data.timeDivision,
            currentDuration,
            title)
    }

    /** Track menu **/


    renderMenuSelectTrack(onSelectValue, onTrackAdd=null, selectedTrack=null) {
        return (<>
            {this.getAllSongTracks((trackName) =>
                <ASUIMenuAction
                    key={trackName}
                    disabled={trackName === selectedTrack}
                    onAction={e => onSelectValue(trackName)}
                >{trackName}</ASUIMenuAction>
            )}
            {onTrackAdd ? <ASUIMenuAction onAction={onTrackAdd} hasBreak  >Create New Track</ASUIMenuAction> : null}
        </>);
    }

    // renderMenuSelectCommandByCurrentOctave(onSelectValue, octave=null) {
    //     octave = octave !== null ? octave : this.state.keyboardOctave;
    //     return Values.getNoteFrequencies((noteName) =>
    //         <MenuAction key={noteName} onAction={e => onSelectValue(`${noteName}${octave}`)}     >{noteName}{octave}</MenuAction>
    //     );
    // }


    // renderMenuSelectCommandByOctave(onSelectValue, currentCommand=null) {
    //     return (<>
    //         {/*{keyboardOctave !== null ? <ASUIMenuDropDown key={keyboardOctave} options={() => this.renderMenuSelectCommandByOctaveFrequency(onSelectValue, keyboardOctave)}>*/}
    //         {/*    {`${keyboardOctave} (Current)`}*/}
    //         {/*</ASUIMenuDropDown> : null}*/}
    //         {this.getNoteOctaves((octave) =>
    //             <ASUIMenuDropDown key={octave} options={() => this.renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave)}>
    //                 {octave}
    //             </ASUIMenuDropDown>
    //         )}
    //     </>)
    // }
    //
    // renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave) {
    //     return this.getNoteFrequencies((noteName) =>
    //         <ASUIMenuAction key={noteName} onAction={() => onSelectValue(noteName+''+octave)}     >{noteName+''+octave}</ASUIMenuAction>
    //     );
    // }




}

function addResult (results, result) {
    if (result !== null && typeof result !== "undefined")
        results.push(result);
    return result === false ? result : true;
}



export default SongValues;
