import React from "react";
import {MenuAction, MenuDropDown, MenuBreak} from "../components";
import {Storage, Values, ProgramLoader} from "../song";
import ComposerRenderer from "./ComposerRenderer";

import "./assets/Composer.css";

class ComposerMenu extends ComposerRenderer {


    renderRootMenu() {
        const props = {
            vertical: !this.state.portrait,
            openOnHover: false,
        };
        if(!this.state.portrait)
            props.arrow = false;
        return (<>
            <MenuDropDown {...props} options={() => this.renderMenuFile()}          >File</MenuDropDown>
            <MenuDropDown {...props} options={() => this.renderMenuEdit()}          >Edit</MenuDropDown>
            <MenuDropDown {...props} options={() => this.renderMenuTrack()}         >Track</MenuDropDown>
            <MenuDropDown {...props} options={() => this.renderMenuProgram()}    >Program</MenuDropDown>
            <MenuDropDown {...props} options={() => this.renderMenuView()}          >View</MenuDropDown>
        </>);
    }

    renderMenuFile() {
        return (<>
            <MenuAction     onAction={e => this.loadNewSongData(e)}             >New song</MenuAction>
            <MenuDropDown   options={() => this.renderMenuFileOpen()}           >Open song</MenuDropDown>
            <MenuDropDown   options={() => this.renderMenuFileSave()}           >Save song</MenuDropDown>
            <MenuDropDown   options={() => this.renderMenuFileImport()}         >Import song</MenuDropDown>
            <MenuDropDown   options={() => this.renderMenuFileExport()}         >Export song</MenuDropDown>
        </>);
    }


    renderMenuFileOpen() {
        return (<>
            <MenuDropDown   options={() => this.renderMenuFileOpenMemory()}     >from Memory</MenuDropDown>
            <MenuAction     onAction={e => this.openSongFromFileDialog(e)}      >from File</MenuAction>
            <MenuAction     onAction={e => this.loadSongFromURL(e)}             >from URL</MenuAction>
        </>);
    }

    renderMenuFileSave() {
        return (<>
            <MenuAction onAction={e => this.saveSongToMemory(e)}                        >to Memory</MenuAction>
            <MenuAction onAction={e => this.saveSongToFile(e)}                          >to File</MenuAction>
        </>);

    }

    renderMenuFileImport() {
        return (<>
            <MenuAction onAction={e => this.openSongFromFileDialog('.mid,.midi')}          >from MIDI File</MenuAction>
        </>);
        // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
        // renderMenuFileImportSongFromMIDI.action = (e) => this.onAction('song:load-from-midi-file');
        // renderMenuFileImportSongFromMIDI.disabled = true;

    }

    renderMenuFileExport() {
        return (<>
            <MenuAction onAction={()=>{}} disabled>to MIDI File</MenuAction>
        </>);

    }

    renderMenuFileOpenMemory() {
        const storage = new Storage();
        const songRecentUUIDs = storage.getRecentSongList() ;
        return songRecentUUIDs.length > 0
            ? songRecentUUIDs.map((entry, i) =>
                <MenuAction
                    key={i}
                    onAction={(e) => this.loadSongFromMemory(entry.uuid)}
                >{entry.title || entry.uuid}</MenuAction>)
            :<MenuAction
                key="no-recent"
                disabled
            >No Songs Available</MenuAction>
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
            <MenuAction key={programID} onAction={() => onSelectValue(programID)}  >{programID}: {programInfo.title || programClass}</MenuAction>
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
            <MenuDropDown
                options={() => this.renderMenuEditInsert()}
                children="Insert Command"
                />


            <MenuDropDown
                disabled={selectedIndices.length === 0}
                options={() => this.renderMenuEditSetCommand()}
                hasBreak
                children="Set Command"
                />
            <MenuDropDown
                disabled={selectedIndices.length === 0}
                options={() => this.renderMenuEditSetDuration()}
                hasBreak
                children="Set Duration"
                />
            <MenuDropDown
                disabled={selectedIndices.length === 0}
                options={() => this.renderMenuEditSetVelocity()}
                hasBreak
                children="Set Velocity"
                />

            <MenuBreak />
            <MenuDropDown options={() => this.renderMenuEditSelect()} hasBreak   >Select</MenuDropDown>

            <MenuBreak />
            <MenuDropDown options={() => this.renderMenuEditBatch()} hasBreak   >Batch</MenuDropDown>
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
                <MenuAction key={velocity} onAction={e => this.instructionReplaceVelocity(velocity)}  >{velocity}</MenuAction>)}
            <MenuAction onAction={e => this.instructionReplaceVelocity(null, true)} hasBreak >Custom Velocity</MenuAction>
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
            <MenuAction onAction={e => this.trackerSelectIndices('segment')}      >Select Segment Instructions</MenuAction>
            <MenuAction onAction={e => this.trackerSelectIndices('all')}       >Select All Song Instructions</MenuAction>
            <MenuAction onAction={e => this.trackerSelectIndices('none')}       >Select No Instructions</MenuAction>
            <MenuBreak />
            <MenuDropDown options={() => this.renderMenuEditSelectBatch()} hasBreak                        >Batch Select</MenuDropDown>
        </>);

    }

    renderMenuEditSelectBatch() {
        return (<>
            {(new Storage()).getBatchRecentSearches().map((recentBatchSearch, i) =>
                <MenuAction onAction={e => this.batchSelect(recentBatchSearch, true)}      >New Selection Command</MenuAction>
            )}
            <MenuAction onAction={e => this.batchSelect(e)} hasBreak      >New Selection Command</MenuAction>
        </>);
    }

    renderMenuEditBatch() {
        return (<>
            {(new Storage()).getBatchRecentCommands().map((recentBatchCommand, i) =>
                <MenuDropDown options={() => this.renderMenuEditBatchRecent(recentBatchCommand)}                          >{recentBatchCommand}</MenuDropDown>
            )}
            <MenuAction onAction={e => this.batchRunCommand(e)} hasBreak      >New Batch Command</MenuAction>
        </>);
    }

    renderMenuEditBatchRecent(recentBatchCommand) {
        return (<>
            <MenuAction onAction={e => this.batchRunCommand(recentBatchCommand, true)}                   >Execute on Group</MenuAction>
            <MenuDropDown options={() => this.renderMenuEditBatchRecentExecuteSearch(recentBatchCommand)}    >Execute using Search</MenuDropDown>
        </>);
    }

    renderMenuEditBatchRecentExecuteSearch(recentBatchCommand) {
        return (<>
            <MenuAction onAction={e => this.batchRunCommand(recentBatchCommand, null, true)}                   >New Search</MenuAction>
            {(new Storage()).getBatchRecentSearches().map((recentBatchSearch, i) =>
                <MenuAction onAction={e => this.batchRunCommand(recentBatchCommand, recentBatchSearch)}                   >{recentBatchSearch}</MenuAction>
            )}
        </>);

    }


    /** Tracker Menu **/

    renderMenuTrackerSetQuantization(trackName) {
        return (<>
            {this.renderMenuSelectDuration(durationTicks => {
                this.trackerChangeQuantization(trackName, durationTicks);
            })}
            <MenuAction onAction={(e) => this.trackerChangeQuantization(trackName)} hasBreak >Custom Quantization</MenuAction>
        </>);
    }



    renderMenuTrackerSetSegmentLength(trackName) {
        return (<>
            {Values.getTrackerSegmentLengthInRows((length, title) =>
                <MenuAction key={length} onAction={(e) => this.trackerChangeSegmentLength(trackName, length)}>{title}</MenuAction>
            )}
            <MenuAction onAction={(e) => this.trackerChangeSegmentLength(trackName)} hasBreak >Custom Length</MenuAction>
        </>);
    }

    // renderMenuTrackerSetProgramFilter() {
    //     return this.renderMenuSelectSongProgram(programID => this.trackerChangeProgramFilter(programID));
    // }

    renderMenuKeyboardSetOctave() {
        return Values.getNoteOctaves(octave =>
            <MenuAction key={octave} onAction={(e) => this.keyboardChangeOctave(octave)}>{octave}</MenuAction>
        );
    }

    /** View Menu **/
    renderMenuView() {
        return (<>
            <MenuAction onAction={e => this.toggleFullscreen(e)}       >{this.props.fullscreen ? 'Disable' : 'Enable'} Fullscreen</MenuAction>
            <MenuAction onAction={e => this.togglePanelSong(e)}       >{this.props.hidePanelSongs ? 'Disable' : 'Enable'} Song Forms</MenuAction>
            <MenuAction onAction={e => this.togglePanelTracker(e)}       >{this.props.hidePanelTracker ? 'Disable' : 'Enable'} Tracker Forms</MenuAction>
            <MenuAction onAction={e => this.togglePanelPrograms(e)}       >{this.props.hidePanelProgram ? 'Disable' : 'Enable'} Program Forms</MenuAction>
        </>);

    }

    renderMenuProgram() {
        return (<>
            <MenuDropDown key="add" options={() => this.renderMenuProgramAdd()}    >Add program to song</MenuDropDown>
            <MenuBreak />
            {this.values.getSongPrograms((programID, programClass, programInfo) =>
                <MenuDropDown key={programID} options={() => this.renderMenuProgramEdit(programID)}       >
                    {programID}: {programInfo.title || programClass}
                </MenuDropDown>)}
        </>);
    }

    renderMenuProgramAdd() {
        return ProgramLoader.getRegisteredPrograms().map((config, i) =>
            <MenuAction key={i} onAction={e => this.programAdd(config.className)}       >{config.title}</MenuAction>
        );
    }

    renderMenuProgramEdit(programID) {
        return (<>
            <MenuDropDown key="replace" options={() => this.renderMenuProgramEditReplace(programID)}    >Replace</MenuDropDown>
            <MenuAction
                key="remove"
                onAction={e => this.programRemove(programID)}
                disabled={!this.song.hasProgram(programID)}
            >Remove from song</MenuAction>
        </>);
    }

    renderMenuProgramEditReplace(programID) {
        return ProgramLoader.getRegisteredPrograms().map((config, i) =>
            <MenuAction key={i} onAction={e => this.programReplace(programID, config.className)}       >{config.name}</MenuAction>
        );
    }

    renderMenuTrack() {
        return (<>
            <MenuAction onAction={e => this.trackAdd(e)} hasBreak     >Add new group</MenuAction>
            <MenuBreak />
            {this.values.getAllSongGroups((trackName) =>
                <MenuDropDown
                    key={trackName}
                    disabled={trackName === this.state.selectedTrack}
                    options={() => this.renderMenuTrackEdit(trackName)}
                >{trackName}</MenuDropDown>)}
        </>);
    }

    renderMenuTrackEdit(trackName) {

        // const trackName = menuParam;
        return (<>
            <MenuAction onAction={e => this.trackRename(trackName)} hasBreak     >Rename group {trackName}</MenuAction>
            <MenuAction onAction={e => this.trackRemove(trackName)} hasBreak     >Delete group {trackName}</MenuAction>
        </>);
    }

}


export default ComposerMenu;
