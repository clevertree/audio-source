import React from "react";
import {ASUIMenuItem, ASUIMenuAction, ASUIMenuDropDown, ASUIMenuBreak} from "../components";
import Values from "../common/values/Values";
import {Storage, ProgramLoader} from "../song";
import ASComposerRenderer from "./ASComposerRenderer";
import ActiveTrackState from "./track/state/ActiveTrackState";

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
    renderMenuSelectCommandByFrequency(onSelectValue) {
        return this.values.renderMenuSelectCommandByFrequency(onSelectValue, this.state.keyboardOctave);
    }

    // renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName) {
    //     return this.values.renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName);
    // }

    /** @deprecated **/
    renderMenuSelectCommandByOctave(onSelectValue) {
        return this.values.renderMenuSelectCommandByOctave(onSelectValue, this.state.keyboardOctave);
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


    renderMenuSelectCommand(onSelectCommand, title="New Command") {
        const selectedTrackName = this.state.selectedTrack;
        const trackState = new ActiveTrackState(this, selectedTrackName);
        return this.values.renderMenuSelectCommand(async newCommand => {
                trackState.update(state => state.currentCommand = newCommand).then(
                    () => onSelectCommand(newCommand)
                );
            },
            trackState.currentCommand,
            title
        );
    }



    // renderMenuSelectAvailableProgram(onSelectValue, menuTitle=null) {
    //     return this.values.renderMenuSelectAvailableProgram(onSelectValue, menuTitle);
    // }



    renderMenuEdit(currentCommand=null) {
        const selectedTrackName = this.state.selectedTrack;
        const trackState = new ActiveTrackState(this, selectedTrackName);
        const selectedIndices = trackState.selectedIndices;

        return (<>
            <ASUIMenuDropDown
                disabled={selectedIndices.length > 0}
                options={() => this.renderMenuEditInsert()}
                children="Insert Command"
            />


            <ASUIMenuDropDown
                disabled={selectedIndices.length === 0}
                options={() => this.renderMenuEditSetCommand(currentCommand)}
                hasBreak
                children="Set Command"
            />
            <ASUIMenuDropDown
                disabled={selectedIndices.length === 0}
                options={() => this.renderMenuEditSetDuration()}
                hasBreak
                children="Set Duration"
            />
            <ASUIMenuDropDown
                disabled={selectedIndices.length === 0}
                options={() => this.renderMenuEditSetVelocity()}
                hasBreak
                children="Set Velocity"
            />

            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuEditSelect()} hasBreak   >Select</ASUIMenuDropDown>

            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuEditBatch()} hasBreak   >Batch</ASUIMenuDropDown>
        </>);
    }


    renderMenuEditInsert() {
        return this.renderMenuSelectCommand(async newCommand => {
                if(newCommand === null)
                    await this.instructionInsertPrompt();
                else
                    this.instructionInsert(newCommand);
            },
            "New Command"
        );
    }


    renderMenuEditInsertCommandFrequency() {
        return this.renderMenuSelectCommandByFrequency(noteNameOctave => this.instructionInsert(noteNameOctave, false));
    }


    renderMenuEditInsertCommandOctave() {
        return this.renderMenuSelectCommandByOctave(noteNameOctave => this.instructionInsert(noteNameOctave, false));
    }

    // renderMenuEditInsertCommandCurrentOctave(octave=null) {
    //     return this.renderMenuSelectCommandByCurrentOctave((noteNameOctave) => this.instructionInsert(noteNameOctave, false), octave);
    // }




    renderMenuEditSet(currentCommand=null, currentDuration=null, currentVelocity=null) {
        return (<>
            <ASUIMenuDropDown
                options={() => this.renderMenuEditSetCommand(currentCommand)}
                hasBreak
                children="Set Command"
            />
            <ASUIMenuDropDown
                options={() => this.renderMenuEditSetDuration(currentDuration)}
                hasBreak
                children="Set Duration"
            />
            <ASUIMenuDropDown
                options={() => this.renderMenuEditSetVelocity(currentVelocity)}
                hasBreak
                children="Set Velocity"
            />
        </>);
    }


    renderMenuEditSetCommand(currentCommand=null) {
        return this.renderMenuSelectCommand(async newCommand => {
                if(newCommand === null)
                    await this.instructionReplaceCommandSelectedPrompt();
                else
                    this.instructionReplaceCommandSelected(newCommand);
            },
        );
    }

    // renderMenuEditSetProgram() {
    //     return this.values.getSongPrograms((programID, programClass, programInfo) =>
    //         <MenuAction key={programID} onAction={e => this.instructionReplaceProgram(programID)}  >
    //             {programID}: {programInfo.title || programClass}
    //         </MenuAction>
    //     );
    // }

    renderMenuEditSetDuration(currentDuration=null) {
        return this.values.renderMenuSelectDuration(durationTicks => {
                this.instructionReplaceDurationSelected(durationTicks)
            },
            this.song.data.timeDivision,
            currentDuration,
        );

    }

    renderMenuEditSetVelocity(currentVelocity=null) {
        return this.values.renderMenuSelectVelocity(velocity => {
                this.instructionReplaceVelocity(velocity)
            },
            currentVelocity,
        );
    }

    renderMenuEditSetCommandFrequency() {
        return this.renderMenuSelectCommandByFrequency(noteNameOctave => this.instructionReplaceCommandSelected(noteNameOctave));
    }

    // renderMenuEditSetCommandCurrentOctave(octave=null) {
    //     return this.renderMenuSelectCommandByCurrentOctave((noteNameOctave) => this.trackerReplaceSelectedInstructions(noteNameOctave, false), octave);
    // }

    renderMenuEditSetCommandOctave() {
        return this.renderMenuSelectCommandByOctave(noteNameOctave => this.instructionReplaceCommandSelected(noteNameOctave));
    }

    renderMenuEditSelect() {
        return (<>
            <ASUIMenuAction onAction={e => this.trackerSelectIndices('segment')}      >Select Segment Instructions</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackerSelectIndices('all')}       >Select All Song Instructions</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackerSelectIndices('none')}       >Select No Instructions</ASUIMenuAction>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuEditSelectBatch()} hasBreak                        >Batch Select</ASUIMenuDropDown>
        </>);

    }

    async renderMenuEditSelectBatch() {
        const recentSearches = await (new Storage()).getBatchRecentSearches();
        return (<>
            {recentSearches.map((recentBatchSearch, i) =>
                <ASUIMenuAction onAction={e => this.batchSelect(recentBatchSearch, true)}      >New Selection Command</ASUIMenuAction>
            )}
            <ASUIMenuAction onAction={e => this.batchSelect(e)} hasBreak      >New Selection Command</ASUIMenuAction>
        </>);
    }

    async renderMenuEditBatch() {
        const recentCommands = await (new Storage()).getBatchRecentCommands();
        return (<>
            {recentCommands.map((recentBatchCommand, i) =>
                <ASUIMenuDropDown options={() => this.renderMenuEditBatchRecent(recentBatchCommand)}                          >{recentBatchCommand}</ASUIMenuDropDown>
            )}
            <ASUIMenuAction onAction={e => this.batchRunCommand(e)} hasBreak      >New Batch Command</ASUIMenuAction>
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

    renderMenuTrackerSetQuantization(trackName, title = "Select Quantization") {
        return (<>
            {this.values.renderMenuSelectDuration(
                durationTicks => this.trackerChangeQuantization(trackName, durationTicks),
                this.song.data.timeDivision,
                title)}
            <ASUIMenuAction onAction={(e) => this.trackerChangeQuantization(trackName)} hasBreak >Custom Quantization</ASUIMenuAction>
        </>);
    }



    renderMenuTrackerSetSegmentLength(trackName) {
        return (<>
            {this.values.getTrackerSegmentLengthInRows((length, title) =>
                <ASUIMenuAction key={length} onAction={(e) => this.trackerChangeSegmentLength(trackName, length)}>{title}</ASUIMenuAction>
            )}
            <ASUIMenuAction onAction={(e) => this.trackerChangeSegmentLength(trackName)} hasBreak >Custom Length</ASUIMenuAction>
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
            <ASUIMenuAction onAction={e => this.toggleFullscreen(e)}       >{this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.toggleSongPanel()}       >{this.state.showPanelSong ? 'Disable' : 'Enable'} Song Forms</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.toggleInstructionPanel()}       >{this.state.showPanelInstruction ? 'Disable' : 'Enable'} Instruction Forms</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.toggleProgramPanel('program')}       >{this.state.showPanelProgram ? 'Disable' : 'Enable'} Program Forms</ASUIMenuAction>
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
            <ASUIMenuAction onAction={e => this.trackAdd()} hasBreak     >Add new group</ASUIMenuAction>
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
            <ASUIMenuAction onAction={e => this.trackRename(trackName)} hasBreak     >Rename group {trackName}</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackRemove(trackName)} hasBreak     >Delete group {trackName}</ASUIMenuAction>
        </>);
    }

}


export default ASComposerMenu;
