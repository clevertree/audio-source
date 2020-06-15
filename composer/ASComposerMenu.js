import React from "react";
import {ASUIMenuItem, ASUIMenuAction, ASUIMenuDropDown, ASUIMenuBreak} from "../components";
import {Storage, ProgramLoader} from "../song";
import ASComposerRenderer from "./ASComposerRenderer";
import InstructionProcessor from "../common/program/InstructionProcessor";
import {ArgType} from "../common";

class ASComposerMenu extends ASComposerRenderer {


    renderRootMenu() {
        const props = {
            vertical: !this.state.portrait,
            openOnHover: false,
        };
        if(!this.state.portrait)
            props.arrow = false;
        return (<>
            <ASUIMenuDropDown {...props} options={() => this.renderMenuFile()}          >File</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} options={() => this.renderMenuEdit()}          >Edit</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} options={() => this.renderMenuTrack()}         >Track</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} options={() => this.renderMenuProgram()}    >Program</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} options={() => this.renderMenuView()}          >View</ASUIMenuDropDown>
        </>);
    }

    renderMenuFile() {
        return (<>
            <ASUIMenuAction onAction={e => this.loadNewSongData(e)}             >New song</ASUIMenuAction>
            <ASUIMenuDropDown options={() => this.renderMenuFileOpen()}           >Open song</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuFileSave()}           >Save song</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuFileImport()}         >Import song</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuFileExport()}         >Export song</ASUIMenuDropDown>
        </>);
    }


    renderMenuFileOpen() {
        return (<>
            <ASUIMenuDropDown options={() => this.renderMenuFileOpenMemory()}     >from Memory</ASUIMenuDropDown>
            <ASUIMenuAction onAction={e => this.openSongFromFileDialog(e)}      >from File</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.loadSongFromURL(e)}             >from URL</ASUIMenuAction>
        </>);
    }

    renderMenuFileSave() {
        return (<>
            <ASUIMenuAction onAction={e => this.saveSongToMemory(e)}                        >to Memory</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.saveSongToFile(e)}                          >to File</ASUIMenuAction>
        </>);

    }

    renderMenuFileImport() {
        return (<>
            <ASUIMenuAction onAction={e => this.openSongFromFileDialog('.mid,.midi')}          >from MIDI File</ASUIMenuAction>
        </>);
        // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
        // renderMenuFileImportSongFromMIDI.action = (e) => this.onAction('song:load-from-midi-file');
        // renderMenuFileImportSongFromMIDI.disabled = true;

    }

    renderMenuFileExport() {
        return (<>
            <ASUIMenuAction onAction={()=>{}} disabled>to MIDI File</ASUIMenuAction>
        </>);

    }

    async renderMenuFileOpenMemory() {
        const storage = new Storage();
        const songRecentUUIDs = await storage.getRecentSongList() ;
        // console.log('songRecentUUIDs', songRecentUUIDs);
        return songRecentUUIDs.length > 0
            ? songRecentUUIDs.map((entry, i) =>
                <ASUIMenuAction
                    key={i}
                    onAction={(e) => this.loadSongFromMemory(entry.uuid)}
                >{entry.title || entry.uuid}</ASUIMenuAction>)
            :<ASUIMenuAction
                onAction={() => {}}
                key="no-recent"
                disabled
            >No Songs Available</ASUIMenuAction>
        ;
    }


    /** Deep selection menus **/


    // renderMenuSelectCommandByCurrentOctave(onSelectValue, octave=null) {
    //     octave = octave !== null ? octave : this.state.keyboardOctave;
    //     return this.values.getNoteFrequencies((noteName) =>
    //         <MenuAction key={noteName} onAction={e => onSelectValue(`${noteName}${octave}`)}     >{noteName}{octave}</MenuAction>
    //     );
    // }

    /** @deprecated **/
    renderMenuSelectCommand(onSelectValue, currentCommand=null, title= null, additionalMenuItems=null) {
        return this.values.renderMenuSelectCommand(onSelectValue, currentCommand || this.state.currentCommand, title, additionalMenuItems)
    }

    /** @deprecated **/
    renderMenuSelectCommandByFrequency(onSelectValue, currentCommand=null) {
        return this.values.renderMenuSelectCommandByFrequency(onSelectValue, currentCommand || this.state.currentCommand);
    }

    // renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName) {
    //     return this.values.renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName);
    // }

    /** @deprecated **/
    renderMenuSelectCommandByOctave(onSelectValue, currentCommand=null) {
        return this.values.renderMenuSelectCommandByOctave(onSelectValue, currentCommand || this.state.currentCommand);
    }

    // renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave) {
    //     return this.values.renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave);
    // }




    /** @deprecated **/
    renderMenuSelectSongProgram(onSelectValue) {
        return this.values.getSongPrograms((programID, programClass, programInfo) =>
            <ASUIMenuAction key={programID} onAction={() => onSelectValue(programID)}  >{programID}: {programInfo.title || programClass}</ASUIMenuAction>
        );
    }



    // renderMenuSelectAvailableProgram(onSelectValue, menuTitle=null) {
    //     return this.values.renderMenuSelectAvailableProgram(onSelectValue, menuTitle);
    // }

    renderMenuInsert() {
        // TODO:
    }

    /** Edit Menu **/

    renderMenuEdit(selectedIndices=null) {
        // const selectedTrackName = this.state.selectedTrack;
        // const activeTrack = this.getActiveTrack(selectedTrackName);
        if(selectedIndices === null)
            selectedIndices = this.state.selectedTrackIndices;
        return (<>

            {selectedIndices.length > 0 ? this.renderMenuInstructionEdit() : <ASUIMenuItem>No Selection</ASUIMenuItem>}

            <ASUIMenuBreak />
            <ASUIMenuDropDown
                options={() => this.renderMenuEditInsert()}
                children="Insert"
            />

            <ASUIMenuBreak />
            <ASUIMenuAction onAction={() => this.instructionCut()} disabled={selectedIndices.length===0}   >Cut</ASUIMenuAction>
            <ASUIMenuAction onAction={() => this.instructionCopy()} disabled={selectedIndices.length===0}   >Copy</ASUIMenuAction>
            <ASUIMenuAction onAction={() => this.instructionPasteAtCursor()}   >Paste</ASUIMenuAction>
            <ASUIMenuAction onAction={() => this.instructionDeleteSelected()} disabled={selectedIndices.length===0}   >Delete</ASUIMenuAction>

            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuEditTrackSelectIndices()}   >Select</ASUIMenuDropDown>

            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuEditBatch()}   >Batch</ASUIMenuDropDown>
        </>);
    }


    renderMenuEditInsert(trackName=null) {
        return this.values.renderMenuSelectCommand(async newCommand => {
               this.instructionInsertAtCursor(trackName, newCommand);
            },
            this.state.selectedInstructionData[1],
            "New Command"
        );
    }



    renderMenuInstructionEdit() {
        const selectedIndices = this.state.selectedTrackIndices;
        if(!selectedIndices || selectedIndices.length === 0)
            throw new Error("No indices selected");

        const instructionData = this.state.selectedInstructionData;
        const processor = new InstructionProcessor(instructionData);
        const [, argTypeList] = processor.processInstructionArgs();

        let argIndex = 0;
        return argTypeList.map((argType, i) => {
            if(!argType.consumesArgument)
                return null;
            argIndex++;
            let paramValue = instructionData[argIndex];
            return this.renderMenuInstructionEditArg(argType, argIndex, paramValue);
        });
    }

    renderMenuInstructionEditArg(argType, argIndex, paramValue, onSelectValue=null) {
        let children = argType.title || "Unknown Arg";

        return <ASUIMenuDropDown
            key={argIndex}
            options={() => this.renderMenuInstructionEditArgOptions(argType, argIndex, paramValue, onSelectValue)}
            children={children}
        />
    }

    renderMenuInstructionEditArgOptions(argType, argIndex, paramValue, onSelectValue=null) {
        if(onSelectValue === null) {
            onSelectValue = (newArgValue) => {
                // this.instructionReplaceArg(this.state.selectedTrack, this.state.selectedTrackIndices, argIndex, newArgValue);
                this.instructionReplaceArgByType(this.state.selectedTrack, this.state.selectedTrackIndices, argType, newArgValue);
            }
        }
        switch(argType) {
            // case ArgType.trackCommand:
            case ArgType.command:
            default:
                return this.values.renderMenuSelectCommand(onSelectValue, paramValue);

            case ArgType.duration:
                return this.values.renderMenuSelectDuration(onSelectValue, null, paramValue);

            case ArgType.velocity:
                return this.values.renderMenuSelectVelocity(onSelectValue, paramValue);

        }

    }



    /** Track Menu **/


    renderMenuEditTrackSelectIndices() {
        const selectedTrack = this.state.selectedTrack;
        return (<>
            <ASUIMenuAction onAction={e => this.trackerSelectIndices(selectedTrack, 'all')}       >Select Track</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackerSelectIndices(selectedTrack, 'segment')}      >Select Segment</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackerSelectIndices(selectedTrack, 'row')}       >Select Row</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackerSelectIndices(selectedTrack, 'none')}       >Clear Selection</ASUIMenuAction>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuEditTrackSelectIndicesBatch()}                        >Batch Select</ASUIMenuDropDown>
        </>);

    }

    async renderMenuEditTrackSelectIndicesBatch() {
        const recentSearches = await (new Storage()).getBatchRecentSearches();
        return (<>
            {recentSearches.map((recentBatchSearch, i) =>
                <ASUIMenuAction onAction={e => this.batchSelect(recentBatchSearch, true)}      >New Selection Command</ASUIMenuAction>
            )}
            <ASUIMenuAction onAction={e => this.batchSelect(e)}      >New Selection Command</ASUIMenuAction>
        </>);
    }

    async renderMenuEditBatch() {
        const recentCommands = await (new Storage()).getBatchRecentCommands();
        return (<>
            {recentCommands.map((recentBatchCommand, i) =>
                <ASUIMenuDropDown options={() => this.renderMenuEditBatchRecent(recentBatchCommand)}                          >{recentBatchCommand}</ASUIMenuDropDown>
            )}
            <ASUIMenuAction onAction={e => this.batchRunCommand(e)}      >New Batch Command</ASUIMenuAction>
        </>);
    }

    renderMenuEditBatchRecent(recentBatchCommand) {
        return (<>
            <ASUIMenuAction onAction={e => this.batchRunCommand(recentBatchCommand, true)}                   >Execute on Group</ASUIMenuAction>
            <ASUIMenuDropDown options={() => this.renderMenuEditBatchRecentExecuteSearch(recentBatchCommand)}    >Execute using Search</ASUIMenuDropDown>
        </>);
    }

    renderMenuEditBatchRecentExecuteSearch(recentBatchCommand) {
        return (<>
            <ASUIMenuAction onAction={e => this.batchRunCommand(recentBatchCommand, null, true)}                   >New Search</ASUIMenuAction>
            {(new Storage()).getBatchRecentSearches().map((recentBatchSearch, i) =>
                <ASUIMenuAction onAction={e => this.batchRunCommand(recentBatchCommand, recentBatchSearch)}                   >{recentBatchSearch}</ASUIMenuAction>
            )}
        </>);

    }


    /** ASCTrack Menu **/

    renderMenuTrackerSetQuantization(trackName, quantizationTicks, title = "Select Quantization") {
        return this.values.renderMenuSelectDuration(
            durationTicks => this.trackerChangeQuantization(trackName, durationTicks),
            this.song.data.timeDivision,
            quantizationTicks,
            title);
    }



    renderMenuTrackerSetSegmentLength(trackName) {
        return (<>
            {this.values.getTrackerSegmentLengthInRows((length, title) =>
                <ASUIMenuAction key={length} onAction={(e) => this.trackerChangeSegmentLength(trackName, length)}>{title}</ASUIMenuAction>
            )}
            <ASUIMenuAction onAction={(e) => this.trackerChangeSegmentLength(trackName)} >Custom Length</ASUIMenuAction>
        </>);
    }

    // renderMenuTrackerSetProgramFilter() {
    //     return this.renderMenuSelectSongProgram(programID => this.trackerChangeProgramFilter(programID));
    // }

    renderMenuKeyboardSetOctave() {
        return this.values.getNoteOctaves(octave =>
            <ASUIMenuAction key={octave} onAction={(e) => this.keyboardChangeOctave(octave)}>{octave}</ASUIMenuAction>
        );
    }

    /** View Menu **/
    renderMenuView() {
        return (<>
            <ASUIMenuAction onAction={e => this.toggleFullscreen(e)}                >{this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.toggleSongPanel()}                  >{this.state.showPanelSong ? 'Disable' : 'Enable'} Song Forms</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.toggleInstructionPanel()}           >{this.state.showPanelInstruction ? 'Disable' : 'Enable'} Instruction Forms</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.toggleProgramPanel()}               >{this.state.showPanelProgram ? 'Disable' : 'Enable'} Program Forms</ASUIMenuAction>
            <ASUIMenuBreak />
            <ASUIMenuAction onAction={e => this.toggleTrackRowPositionInTicks()}    >Track Position {this.state.showTrackRowPositionInTicks ? 'Formatted' : 'as Ticks'}</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.toggleTrackRowDurationInTicks()}    >Track Duration {this.state.showTrackRowDurationInTicks ? 'Formatted' : 'as Ticks'}</ASUIMenuAction>
        </>);

    }

    /** Program Menus **/

    renderMenuProgram() {
        return (<>
            <ASUIMenuDropDown key="add" options={() => this.renderMenuProgramAdd()}    >Add program to song</ASUIMenuDropDown>
            <ASUIMenuBreak />
            {this.values.getSongPrograms((programID, programClass, programInfo) =>
                <ASUIMenuDropDown key={programID} options={() => this.renderMenuProgramEdit(programID)}       >
                    {`${programID}: ${programInfo.title || programClass}`}
                </ASUIMenuDropDown>)}
        </>);
    }

    renderMenuProgramAdd(menuTitle= "Add New Program") {
        return (<>
            <ASUIMenuItem>{menuTitle}</ASUIMenuItem><ASUIMenuBreak/>
            {ProgramLoader.getRegisteredPrograms().map((config, i) =>
            <ASUIMenuAction key={i} onAction={e => this.programAdd(config.className)}       >{config.title}</ASUIMenuAction>
            )}
        </>);
    }

    renderMenuProgramEdit(programID) {
        return (<>
            <ASUIMenuDropDown key="replace" options={() => this.renderMenuProgramEditReplace(programID)}    >Replace</ASUIMenuDropDown>
            <ASUIMenuAction
                key="remove"
                onAction={e => this.programRemove(programID)}
                disabled={!this.song.hasProgram(programID)}
            >Remove from song</ASUIMenuAction>
        </>);
    }

    renderMenuProgramEditReplace(programID) {
        return ProgramLoader.getRegisteredPrograms().map((config, i) =>
            <ASUIMenuAction key={i} onAction={e => this.programReplace(programID, config.className)}       >{config.title}</ASUIMenuAction>
        );
    }

    renderMenuTrack() {
        return (<>
            <ASUIMenuAction onAction={e => this.trackAdd()}     >Add new group</ASUIMenuAction>
            <ASUIMenuBreak />
            {this.values.getAllSongTracks((trackName) =>
                <ASUIMenuDropDown
                    key={trackName}
                    // disabled={trackName === this.state.selectedTrack}
                    options={() => this.renderMenuTrackEdit(trackName)}
                >{trackName}</ASUIMenuDropDown>)}
        </>);
    }

    renderMenuTrackEdit(trackName) {

        // const trackName = menuParam;
        return (<>
            <ASUIMenuAction onAction={e => this.trackRename(trackName)}     >Rename group {trackName}</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackRemove(trackName)}     >Delete group {trackName}</ASUIMenuAction>
        </>);
    }


    // renderMenuEditInsertCommandFrequency(trackName=null) {
    //     return this.renderMenuSelectCommandByFrequency(noteNameOctave => this.instructionInsertAtCursorPrompt(trackName, noteNameOctave, false));
    // }


    // renderMenuEditInsertCommandOctave(trackName=null) {
    //     return this.renderMenuSelectCommandByOctave(noteNameOctave => this.instructionInsertAtCursorPrompt(trackName, noteNameOctave, false));
    // }

    // renderMenuEditInsertCommandCurrentOctave(octave=null) {
    //     return this.renderMenuSelectCommandByCurrentOctave((noteNameOctave) => this.instructionInsert(noteNameOctave, false), octave);
    // }




    // renderMenuEditSet(currentCommand=null, currentDuration=null, currentVelocity=null) {
    //     return (<>
    //         <ASUIMenuDropDown
    //             options={() => this.renderMenuEditSetCommand(currentCommand)}
    //             children="Set Command"
    //         />
    //         <ASUIMenuDropDown
    //             options={() => this.renderMenuEditSetDuration(currentDuration)}
    //             children="Set Duration"
    //         />
    //         <ASUIMenuDropDown
    //             options={() => this.renderMenuEditSetVelocity(currentVelocity)}
    //             children="Set Velocity"
    //         />
    //     </>);
    // }


    // renderMenuEditSetCommand(trackName = null, currentCommand=null) {
    //     return this.values.renderMenuSelectCommand(newCommand => {
    //             this.instructionReplaceCommandPrompt(trackName, null, newCommand, false);
    //         },
    //         this.state.selectedInstructionData[1]
    //     );
    // }

    // renderMenuEditSetProgram() {
    //     return this.values.getSongPrograms((programID, programClass, programInfo) =>
    //         <MenuAction key={programID} onAction={e => this.instructionReplaceProgram(programID)}  >
    //             {programID}: {programInfo.title || programClass}
    //         </MenuAction>
    //     );
    // }

    // renderMenuEditSetDuration(currentDuration=null) {
    //     return this.values.renderMenuSelectDuration(durationTicks => {
    //             this.instructionReplaceDurationPrompt(null, null, durationTicks, false);
    //         },
    //         this.song.data.timeDivision,
    //         currentDuration || this.state.currentDuration,
    //     );
    //
    // }

    // renderMenuEditSetVelocity(currentVelocity=null) {
    //     return this.values.renderMenuSelectVelocity(velocity => {
    //             this.instructionReplaceVelocityPrompt(null, null, velocity, false);
    //         },
    //         currentVelocity || this.state.currentVelocity,
    //     );
    // }

    // renderMenuEditSetCommandFrequency() {
    //     return this.renderMenuSelectCommandByFrequency(noteNameOctave => this.instructionReplaceCommandSelected(noteNameOctave));
    // }

    // renderMenuEditSetCommandCurrentOctave(octave=null) {
    //     return this.renderMenuSelectCommandByCurrentOctave((noteNameOctave) => this.trackerReplaceSelectedInstructions(noteNameOctave, false), octave);
    // }

    // renderMenuEditSetCommandOctave() {
    //     return this.renderMenuSelectCommandByOctave(noteNameOctave => this.instructionReplaceCommandSelected(noteNameOctave));
    // }



}


export default ASComposerMenu;
