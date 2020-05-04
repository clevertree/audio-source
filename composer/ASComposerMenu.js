import React from "react";
import {ASUIMenuAction, ASUIMenuDropDown, ASUIMenuBreak} from "../components";
import {Storage, Values, ProgramLoader} from "../song";
import ASComposerRenderer from "./ASComposerRenderer";

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
        console.log('songRecentUUIDs', songRecentUUIDs);
        return songRecentUUIDs.length > 0
            ? songRecentUUIDs.map((entry, i) =>
                <ASUIMenuAction
                    key={i}
                    onAction={(e) => this.loadSongFromMemory(entry.uuid)}
                >{entry.title || entry.uuid}</ASUIMenuAction>)
            :<ASUIMenuAction
                key="no-recent"
                disabled
            >No Songs Available</ASUIMenuAction>
        ;
    }


    /** Deep selection menus **/



    /** Deep selection menus **/


    renderMenuSelectCommand(onSelectValue) {
        return Values.renderMenuSelectCommand(onSelectValue, this.state.keyboardOctave);
    }


    // renderMenuSelectCommandByCurrentOctave(onSelectValue, octave=null) {
    //     octave = octave !== null ? octave : this.state.keyboardOctave;
    //     return this.values.getNoteFrequencies((noteName) =>
    //         <MenuAction key={noteName} onAction={e => onSelectValue(`${noteName}${octave}`)}     >{noteName}{octave}</MenuAction>
    //     );
    // }


    renderMenuSelectCommandByFrequency(onSelectValue) {
        return Values.renderMenuSelectCommandByFrequency(onSelectValue, this.state.keyboardOctave);
    }

    // renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName) {
    //     return Values.renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName);
    // }

    renderMenuSelectCommandByOctave(onSelectValue) {
        return Values.renderMenuSelectCommandByOctave(onSelectValue, this.state.keyboardOctave);
    }

    // renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave) {
    //     return Values.renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave);
    // }




    renderMenuSelectSongProgram(onSelectValue) {
        return this.values.getSongPrograms((programID, programClass, programInfo) =>
            <ASUIMenuAction key={programID} onAction={() => onSelectValue(programID)}  >{programID}: {programInfo.title || programClass}</ASUIMenuAction>
        );
    }

    renderMenuSelectDuration(onSelectValue, currentDuration, timeDivision=null) {
        return Values.renderMenuSelectDuration(onSelectValue, currentDuration, timeDivision || this.song.data.timeDivision);
    }

    renderMenuSelectVelocity(onSelectValue, currentVelocity=null) {
        return Values.renderMenuSelectVelocity(onSelectValue, currentVelocity);
    }


    renderMenuSelectAvailableProgram(onSelectValue, menuTitle=null) {
        return Values.renderMenuSelectAvailableProgram(onSelectValue, menuTitle);
    }



    renderMenuEdit() {
        const trackState = this.trackGetState();
        const selectedIndices = trackState.selectedIndices || [];

        // const populateGroupCommands = (renderMenuTrack, action) => {
        //     renderMenuTrack.populate = () => {
        //         const MENU = e.menuElement;
        //         this.values.getValues('song-groups', (trackName, groupTitle) => {
        //             const renderMenuEditSetCommandGroup = MENU.getOrCreateMenu(trackName, `${groupTitle}`);
        //             renderMenuEditSetCommandGroup.action = action;
        //         });
        //         const menuCustom = MENU.getOrCreateMenu('new', `Create New Group`);
        //         menuCustom.action = e => this.trackAdd();
        //         menuCustom.hasBreak = true;
        //     };
        // };

        // renderMenuEditInsertCommand.disabled = selectedIndices.length > 0; // !this.cursorCell;
        // renderMenuEditInsertCommand.action = handleAction('song:new');
        return (<>
            <ASUIMenuDropDown
                options={() => this.renderMenuEditInsert()}
                children="Insert Command"
                />


            <ASUIMenuDropDown
                disabled={selectedIndices.length === 0}
                options={() => this.renderMenuEditSetCommand()}
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
        // const renderMenuEditGroup = MENU.getOrCreateMenu('group', 'Group ►');
        // renderMenuEditGroup.hasBreak = true;
        // renderMenuEditGroup.disabled = true;
    }


    renderMenuEditInsert() {
        return Values.renderMenuSelectCommand(async newCommand => {
            if(newCommand === null)
                await this.instructionInsertPrompt();
            else
                this.instructionInsert(newCommand);
        }, this.state.keyboardOctave);
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



    renderMenuEditSetCommand() {
        return Values.renderMenuSelectCommand(async newCommand => {
            if(newCommand === null)
                await this.instructionReplaceCommandSelectedPrompt();
            else
                this.instructionReplaceCommandSelected(newCommand);
        }, this.state.keyboardOctave);
    }

    // renderMenuEditSetProgram() {
    //     return this.values.getSongPrograms((programID, programClass, programInfo) =>
    //         <MenuAction key={programID} onAction={e => this.instructionReplaceProgram(programID)}  >
    //             {programID}: {programInfo.title || programClass}
    //         </MenuAction>
    //     );
    // }

    renderMenuEditSetDuration() {
        return this.renderMenuSelectDuration(durationTicks => {
            this.instructionReplaceDuration(durationTicks)
        });
    }

    renderMenuEditSetVelocity() {
        return (<>
            {Values.getNoteVelocities((velocity) =>
                <ASUIMenuAction key={velocity} onAction={e => this.instructionReplaceVelocity(velocity)}  >{velocity}</ASUIMenuAction>)}
            <ASUIMenuAction onAction={e => this.instructionReplaceVelocity(null, true)} hasBreak >Custom Velocity</ASUIMenuAction>
        </>);
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

    renderMenuEditSelectBatch() {
        return (<>
            {(new Storage()).getBatchRecentSearches().map((recentBatchSearch, i) =>
                <ASUIMenuAction onAction={e => this.batchSelect(recentBatchSearch, true)}      >New Selection Command</ASUIMenuAction>
            )}
            <ASUIMenuAction onAction={e => this.batchSelect(e)} hasBreak      >New Selection Command</ASUIMenuAction>
        </>);
    }

    renderMenuEditBatch() {
        return (<>
            {(new Storage()).getBatchRecentCommands().map((recentBatchCommand, i) =>
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

    renderMenuTrackerSetQuantization(trackName) {
        return (<>
            {this.renderMenuSelectDuration(durationTicks => {
                this.trackerChangeQuantization(trackName, durationTicks);
            })}
            <ASUIMenuAction onAction={(e) => this.trackerChangeQuantization(trackName)} hasBreak >Custom Quantization</ASUIMenuAction>
        </>);
    }



    renderMenuTrackerSetSegmentLength(trackName) {
        return (<>
            {Values.getTrackerSegmentLengthInRows((length, title) =>
                <ASUIMenuAction key={length} onAction={(e) => this.trackerChangeSegmentLength(trackName, length)}>{title}</ASUIMenuAction>
            )}
            <ASUIMenuAction onAction={(e) => this.trackerChangeSegmentLength(trackName)} hasBreak >Custom Length</ASUIMenuAction>
        </>);
    }

    // renderMenuTrackerSetProgramFilter() {
    //     return this.renderMenuSelectSongProgram(programID => this.trackerChangeProgramFilter(programID));
    // }

    renderMenuKeyboardSetOctave() {
        return Values.getNoteOctaves(octave =>
            <ASUIMenuAction key={octave} onAction={(e) => this.keyboardChangeOctave(octave)}>{octave}</ASUIMenuAction>
        );
    }

    /** View Menu **/
    renderMenuView() {
        return (<>
            <ASUIMenuAction onAction={e => this.toggleFullscreen(e)}       >{this.props.fullscreen ? 'Disable' : 'Enable'} Fullscreen</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.togglePanelSong(e)}       >{this.props.hidePanelSongs ? 'Disable' : 'Enable'} Song Forms</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.togglePanelTracker(e)}       >{this.props.hidePanelTracker ? 'Disable' : 'Enable'} Tracker Forms</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.togglePanelPrograms(e)}       >{this.props.hidePanelProgram ? 'Disable' : 'Enable'} Program Forms</ASUIMenuAction>
        </>);

    }

    renderMenuProgram() {
        return (<>
            <ASUIMenuDropDown key="add" options={() => this.renderMenuProgramAdd()}    >Add program to song</ASUIMenuDropDown>
            <ASUIMenuBreak />
            {this.values.getSongPrograms((programID, programClass, programInfo) =>
                <ASUIMenuDropDown key={programID} options={() => this.renderMenuProgramEdit(programID)}       >
                    {programID}: {programInfo.title || programClass}
                </ASUIMenuDropDown>)}
        </>);
    }

    renderMenuProgramAdd() {
        return ProgramLoader.getRegisteredPrograms().map((config, i) =>
            <ASUIMenuAction key={i} onAction={e => this.programAdd(config.className)}       >{config.title}</ASUIMenuAction>
        );
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
            <ASUIMenuAction key={i} onAction={e => this.programReplace(programID, config.className)}       >{config.name}</ASUIMenuAction>
        );
    }

    renderMenuTrack() {
        return (<>
            <ASUIMenuAction onAction={e => this.trackAdd(e)} hasBreak     >Add new group</ASUIMenuAction>
            <ASUIMenuBreak />
            {this.values.getAllSongGroups((trackName) =>
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
