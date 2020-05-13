import Values from "../../common/values/Values";
import {ASUIMenuAction, ASUIMenuBreak, ASUIMenuDropDown, ASUIMenuItem} from "../../components/menu";
import React from "react";
import PromptManager from "../../common/prompt/PromptManager.native";
import {ASUIInputRange} from "../../components";
import ProgramLoader from "../../common/program/ProgramLoader";

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




    formatSongDuration(input) {
        return this.formatDuration(input, this.song.data.timeDivision);
    }


    /** Duration **/

    parseDurationAsTicks(durationString, timeDivision=null) {
        return super.parseDurationAsTicks(durationString, timeDivision || this.song.data.timeDivision);
    }

    formatDuration(input, timeDivision=null) {
        return super.formatDuration(input, timeDivision || this.song.data.timeDivision);
    }


    getNoteDurations(callback = (duration, durationString) => [duration, durationString]) {
        return super.getNoteDurations(callback, this.song.data.timeDivision);
    }

    /** Menus **/

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
        return (<>
            {this.getAllSongTracks((trackName) =>
                <ASUIMenuAction
                    key={trackName}
                    disabled={trackName === selectedTrack}
                    onAction={e => onSelectValue('@' + trackName)}
                >{trackName}</ASUIMenuAction>
            )}
            <ASUIMenuAction onAction={onTrackAdd} hasBreak  >Create New Track</ASUIMenuAction>
        </>);
    }


    // renderMenuSelectCommandByCurrentOctave(onSelectValue, octave=null) {
    //     octave = octave !== null ? octave : this.state.keyboardOctave;
    //     return Values.getNoteFrequencies((noteName) =>
    //         <MenuAction key={noteName} onAction={e => onSelectValue(`${noteName}${octave}`)}     >{noteName}{octave}</MenuAction>
    //     );
    // }


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


    renderMenuSelectDuration(onSelectValue, timeDivision, currentDuration = null, title=null) {
        return (<>
            <ASUIMenuItem>{title || (currentDuration === null ? 'Select Duration' : `Edit ${currentDuration}`)}</ASUIMenuItem>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => renderMenuSelect('fraction')}  >Fraction</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => renderMenuSelect('triplet')}   >Triplet</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => renderMenuSelect('dotted')}    >Dotted</ASUIMenuDropDown>
            <ASUIMenuBreak />
            <ASUIMenuDropDown disabled options={() => renderMenuSelect('recent')}    >Recent</ASUIMenuDropDown>
            <ASUIMenuBreak />
            <ASUIMenuDropDown disabled options={() => renderMenuSelect('custom')}    >Custom</ASUIMenuDropDown>
        </>);

        function renderMenuSelect(key) {
            let results = [];
            switch(key) {
                case 'fraction':
                    for (let i = 64; i > 1; i /= 2)
                        results.push(
                            <ASUIMenuAction key={`${i}a`} onAction={() => onSelectValue(1 / i * timeDivision, `1/${i}B`)}  >{`1/${i}B`}</ASUIMenuAction>
                        );
                    for (let i = 1; i <= 16; i++)
                        results.push(
                            <ASUIMenuAction key={`${i}b`} onAction={() => onSelectValue(i * timeDivision, i + 'B')}  >{i + 'B'}</ASUIMenuAction>
                        );
                    break;

                case 'triplet':
                    for (let i = 64; i > 1; i /= 2)
                        results.push(
                            <ASUIMenuAction key={`${i}a`} onAction={() => onSelectValue(1 / (i / 1.5) * timeDivision, `1/${i}T`)}  >{`1/${i}T`}</ASUIMenuAction>
                        );
                    for (let i = 1; i <= 16; i++)
                        results.push(
                            <ASUIMenuAction key={`${i}b`} onAction={() => onSelectValue((i / 1.5) * timeDivision, i + 'T')}  >{i + 'T'}</ASUIMenuAction>
                        );
                    break;

                case 'dotted':
                    for (let i = 64; i > 1; i /= 2)
                        results.push(
                            <ASUIMenuAction key={`${i}a`} onAction={() => onSelectValue(1 / (i * 1.5) * timeDivision, `1/${i}D`)}  >{`1/${i}D`}</ASUIMenuAction>
                        );
                    for (let i = 1; i <= 16; i++)
                        results.push(
                            <ASUIMenuAction key={`${i}b`} onAction={() => onSelectValue((i * 1.5) * timeDivision, i + 'D')}  >{i + 'D'}</ASUIMenuAction>
                        );
                    break;

                default:
                    throw new Error("Unknown key");
            }
            return results;
        }
    }

    renderMenuSelectVelocity(onSelectValue, currentVelocity=null, title=null) {
        const customAction = async () => {
            const velocity = await PromptManager.openPromptDialog("Enter custom velocity (1-127)", 127);
            onSelectValue(velocity);
        };
        return (<>
            <ASUIMenuItem>{title || (currentVelocity === null ? 'Select Velocity' : `Edit ${currentVelocity}`)}</ASUIMenuItem>
            <ASUIMenuBreak />
            <ASUIInputRange
                min={0}
                max={127}
                value={currentVelocity}
                onChange={(mixerValue) => onSelectValue(mixerValue)}
            />
            <ASUIMenuBreak/>
            {this.getNoteVelocities((velocity) =>
                <ASUIMenuAction key={velocity} onAction={() => onSelectValue(velocity)}  >{velocity}</ASUIMenuAction>)}
            <ASUIMenuAction onAction={customAction} hasBreak >Custom</ASUIMenuAction>
        </>);
    }

    /** @deprecated moved to Library **/
    renderMenuSelectAvailableProgram(onSelectValue, menuTitle=null) {
        return (<>
            {menuTitle ? <><ASUIMenuAction disabled onAction={() => {}}>{menuTitle}</ASUIMenuAction><ASUIMenuBreak/></> : null}
            {ProgramLoader.getRegisteredPrograms().map((config, i) =>
                <ASUIMenuAction key={i} onAction={() => onSelectValue(config.className)}       >{config.title}</ASUIMenuAction>
            )}
        </>);
    }




}

function addResult (results, result) {
    if (result !== null && typeof result !== "undefined")
        results.push(result);
    return result === false ? result : true;
}



export default SongValues;
