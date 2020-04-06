import React from "react";

import {MenuAction, MenuDropDown, MenuBreak} from "../components";

import Storage from "../song/Storage";
// import InputSelect from "../components/input-select/InputSelect";
import InstrumentLoader from "../song/instrument/InstrumentLoader";
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
            <MenuDropDown {...props} options={() => this.renderMenuInstrument()}    >Instrument</MenuDropDown>
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


    renderMenuSelectCommand(onSelectValue) {
        return (<>
            <MenuDropDown options={() => this.renderMenuSelectCommandByFrequency(onSelectValue)}           >By Frequency</MenuDropDown>
            <MenuDropDown options={() => this.renderMenuSelectCommandByOctave(onSelectValue)}              >By Octave</MenuDropDown>
            <MenuBreak />
            <MenuDropDown disabled options={() => this.renderMenuSelectCommandByNamed(onSelectValue)}               >By Alias</MenuDropDown>
            <MenuDropDown disabled options={() => this.renderMenuSelectCommandByTrack(onSelectValue)}               >By Group</MenuDropDown>
            <MenuAction onAction={async e => onSelectValue(await this.openPromptDialog("Insert custom command"))}      >Custom Command</MenuAction>
        </>);

    }


    // renderMenuSelectCommandByCurrentOctave(onSelectValue, octave=null) {
    //     octave = octave !== null ? octave : this.state.keyboardOctave;
    //     return this.values.getNoteFrequencies((noteName) =>
    //         <MenuAction key={noteName} onAction={e => onSelectValue(`${noteName}${octave}`)}     >{noteName}{octave}</MenuAction>
    //     );
    // }


    renderMenuSelectCommandByFrequency(onSelectValue) {
        return this.values.getNoteFrequencies((noteName) =>
            <MenuDropDown key={noteName} options={() => this.renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName)}                   >{noteName}</MenuDropDown>
        );
    }

    renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName) {
        return (<>
            <MenuAction onAction={() => onSelectValue(this.state.keyboardOctave)}>{noteName}{this.state.keyboardOctave} (Current)</MenuAction>
            {/*TODO: move into lower menu?*/}
            {this.values.getNoteOctaves((octave) =>
                <MenuAction key={octave} onAction={() => onSelectValue(noteName+octave)}     >{noteName+octave}</MenuAction>
            )}
        </>)
    }

    renderMenuSelectCommandByOctave(onSelectValue) {
        return this.values.getNoteOctaves((octave) =>
            <MenuDropDown key={octave} options={() => this.renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave)}                   >{octave}</MenuDropDown>
        );
    }

    renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave) {
        return this.values.getNoteFrequencies((noteName) =>
            <MenuAction key={noteName} onAction={() => onSelectValue(noteName+octave)}     >{noteName+octave}</MenuAction>
        );
    }




    renderMenuSelectSongInstrument(onSelectValue) {
        return this.values.getSongInstruments((instrumentID, instrumentClass, instrumentInfo) =>
            <MenuAction key={instrumentID} onAction={() => onSelectValue(instrumentID)}  >{instrumentID}: {instrumentInfo.title || instrumentClass}</MenuAction>
        );
    }

    renderMenuSelectDuration(onSelectValue) {
        return this.values.getNoteDurations((durationTicks, durationName) =>
            <MenuAction key={durationTicks} onAction={() => onSelectValue(durationTicks)}  >{durationName}</MenuAction>
        );
    }

    renderMenuSelectVelocity(onSelectValue) {
        const customAction = async () => {
            const velocity = await this.openPromptDialog("Enter custom velocity in ticks", 100);
            onSelectValue(velocity);
        };
        return (<>
            {this.values.getNoteVelocities((velocity) =>
                <MenuAction key={velocity} onAction={() => onSelectValue(velocity)}  >{velocity}</MenuAction>)}
            <MenuAction onAction={customAction} hasBreak >Custom Velocity</MenuAction>
        </>);
    }


    renderMenuSelectAvailableInstrument(onSelectValue, menuTitle=null) {
        return (<>
            {menuTitle ? <><MenuAction disabled onAction={() => {}}>{menuTitle}</MenuAction><MenuBreak/></> : null}
            {InstrumentLoader.getInstruments().map((config, i) =>
            <MenuAction key={i} onAction={() => onSelectValue(config.className)}       >{config.title}</MenuAction>
            )}
        </>);
    }





    renderMenuEdit() {

        // const populateGroupCommands = (renderMenuTrack, action) => {
        //     renderMenuTrack.populate = () => {
        //         const MENU = e.menuElement;
        //         this.values.getValues('song-groups', (trackName, groupTitle) => {
        //             const renderMenuEditSetCommandGroup = MENU.getOrCreateMenu(trackName, `${groupTitle}`);
        //             renderMenuEditSetCommandGroup.action = action;
        //         });
        //         const menuCustom = MENU.getOrCreateMenu('new', `Create New Group`);
        //         menuCustom.action = e => this.groupAdd();
        //         menuCustom.hasBreak = true;
        //     };
        // };

        // renderMenuEditInsertCommand.disabled = selectedIndices.length > 0; // !this.cursorCell;
        // renderMenuEditInsertCommand.action = handleAction('song:new');
        return (<>
            <MenuDropDown options={() => this.renderMenuEditInsert()}    >Insert Command</MenuDropDown>

            {/*{this.state.selectedIndices.length === 0 ? null :*/}
                <MenuDropDown disabled options={() => this.renderMenuEditSet()} hasBreak   >Set Command</MenuDropDown>

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
        return (<>
            <MenuDropDown options={() => this.renderMenuEditInsertCommandFrequency()}           >By Frequency</MenuDropDown>
            <MenuDropDown options={() => this.renderMenuEditInsertCommandOctave()}              >By Octave</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={() => this.renderMenuEditInsertCommandNamed()}               >By Alias</MenuDropDown>
            <MenuDropDown options={() => this.renderMenuEditInsertCommandGroup()}               >By Group</MenuDropDown>
            <MenuAction onAction={e => this.instructionInsert(null, true)}   >Custom Command</MenuAction>
        </>);

    }

    renderMenuEditInsertCommandGroup() {
        return (<>
            {this.values.getAllSongGroups((trackName) =>
                <MenuAction
                    key={trackName}
                    options={e => this.renderMenuEditInsertCommandFrequency()}
                    disabled={trackName === this.state.selectedGroup}
                    onAction={e => this.instructionInsert('@' + trackName, false)}
                >{trackName}</MenuAction>)}
            <MenuAction
                key="new"
                hasBreak
                onAction={e => this.groupAdd(e)}
            >Create New Group</MenuAction>
        </>);
    }

    renderMenuEditInsertCommandNamed() {
        return this.values.getAllNamedFrequencies(
            (noteName, frequency, instrumentID) => <MenuAction
                onAction={e => this.instructionInsert(noteName, false, instrumentID)}
            >{noteName}</MenuAction>
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



    renderMenuEditSet() {
        return (<>
            <MenuDropDown options={() => this.renderMenuEditSetCommand()}            >Set Command</MenuDropDown>
            <MenuBreak />
            {/*<MenuDropDown options={() => this.renderMenuEditSetInstrument()}         >Set Instrument</MenuDropDown>*/}
            {/*<MenuBreak />*/}
            <MenuDropDown options={() => this.renderMenuEditSetDuration()}           >Set Duration</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={() => this.renderMenuEditSetVelocity()}           >Set Velocity</MenuDropDown>
            <MenuBreak />
            <MenuAction onAction={e => this.instructionDelete(e)}   >Delete Instruction(s)</MenuAction>
        </>);
    }

    renderMenuEditSetCommand() {
        return (<>
            <MenuDropDown options={() => this.renderMenuEditSetCommandFrequency()}           >By Frequency</MenuDropDown>
            <MenuDropDown options={() => this.renderMenuEditSetCommandOctave()}              >By Octave</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={() => this.renderMenuEditSetCommandNamed()}               >By Alias</MenuDropDown>
            <MenuDropDown options={() => this.renderMenuEditSetCommandGroup()}               >By Group</MenuDropDown>
            <MenuAction onAction={e => this.instructionReplaceCommand(null, true)}      >Custom</MenuAction>
        </>);

    }

    // renderMenuEditSetInstrument() {
    //     return this.values.getSongInstruments((instrumentID, instrumentClass, instrumentInfo) =>
    //         <MenuAction key={instrumentID} onAction={e => this.instructionReplaceInstrument(instrumentID)}  >
    //             {instrumentID}: {instrumentInfo.title || instrumentClass}
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
            {this.values.getNoteVelocities((velocity) =>
                <MenuAction key={velocity} onAction={e => this.instructionReplaceVelocity(velocity)}  >{velocity}</MenuAction>)}
            <MenuAction onAction={e => this.instructionReplaceVelocity(null, true)} hasBreak >Custom Velocity</MenuAction>
        </>);
    }

    renderMenuEditSetCommandFrequency() {
        return this.renderMenuSelectCommandByFrequency(noteNameOctave => this.instructionReplaceCommand(noteNameOctave, false));
    }

    // renderMenuEditSetCommandCurrentOctave(octave=null) {
    //     return this.renderMenuSelectCommandByCurrentOctave((noteNameOctave) => this.instructionReplaceCommand(noteNameOctave, false), octave);
    // }

    renderMenuEditSetCommandOctave() {
        return this.renderMenuSelectCommandByOctave(noteNameOctave => this.instructionReplaceCommand(noteNameOctave, false));
    }


    renderMenuEditSetCommandNamed() {
        return this.values.getAllNamedFrequencies((noteName, frequency, instrumentID) =>
            <MenuAction key={noteName} onAction={e => this.instructionReplaceCommand(noteName, false, instrumentID)}                    >{noteName}</MenuAction>
        );
    }

    renderMenuEditSetCommandGroup() {
        return (<>
            {this.values.getAllSongGroups((trackName) =>
                trackName === this.trackName ? null :
                    <MenuAction
                        key={trackName}
                        disabled={trackName === this.state.selectedGroup}
                        onAction={e => this.instructionReplaceCommand('@' + trackName, false)}
                    >{trackName}</MenuAction>
            )}
            <MenuAction onAction={e => this.groupAdd()} hasBreak  >Create New Group</MenuAction>
        </>);
    }

    renderMenuEditSelect() {
        return (<>
            <MenuAction onAction={e => this.trackerChangeSelection('segment')}      >Select Segment Instructions</MenuAction>
            <MenuAction onAction={e => this.trackerChangeSelection('all')}       >Select All Song Instructions</MenuAction>
            <MenuAction onAction={e => this.trackerChangeSelection('none')}       >Select No Instructions</MenuAction>
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
            {this.values.getTrackerSegmentLengthInRows((length, title) =>
                <MenuAction key={length} onAction={(e) => this.trackerChangeSegmentLength(trackName, length)}>{title}</MenuAction>
            )}
            <MenuAction onAction={(e) => this.trackerChangeSegmentLength(trackName)} hasBreak >Custom Length</MenuAction>
        </>);
    }

    // renderMenuTrackerSetInstrumentFilter() {
    //     return this.renderMenuSelectSongInstrument(instrumentID => this.trackerChangeInstrumentFilter(instrumentID));
    // }

    renderMenuKeyboardSetOctave() {
        return this.values.getNoteOctaves(octave =>
            <MenuAction key={octave} onAction={(e) => this.keyboardChangeOctave(octave)}>{octave}</MenuAction>
        );
    }

    /** View Menu **/
    renderMenuView() {
        return (<>
            <MenuAction onAction={e => this.toggleFullscreen(e)}       >{this.props.fullscreen ? 'Disable' : 'Enable'} Fullscreen</MenuAction>
            <MenuAction onAction={e => this.togglePanelSong(e)}       >{this.props.hidePanelSongs ? 'Disable' : 'Enable'} Song Forms</MenuAction>
            <MenuAction onAction={e => this.togglePanelTracker(e)}       >{this.props.hidePanelTracker ? 'Disable' : 'Enable'} Tracker Forms</MenuAction>
            <MenuAction onAction={e => this.togglePanelInstruments(e)}       >{this.props.hidePanelInstrument ? 'Disable' : 'Enable'} Instrument Forms</MenuAction>
        </>);

    }

    renderMenuInstrument() {
        return (<>
            <MenuDropDown key="add" options={() => this.renderMenuInstrumentAdd()}    >Add instrument to song</MenuDropDown>
            <MenuBreak />
            {this.values.getSongInstruments((instrumentID, instrumentClass, instrumentInfo) =>
                <MenuDropDown key={instrumentID} options={() => this.renderMenuInstrumentEdit(instrumentID)}       >
                    {instrumentID}: {instrumentInfo.title || instrumentClass}
                </MenuDropDown>)}
        </>);
    }

    renderMenuInstrumentAdd() {
        return InstrumentLoader.getInstruments().map((config, i) =>
            <MenuAction key={i} onAction={e => this.instrumentAdd(config.className)}       >{config.title}</MenuAction>
        );
    }

    renderMenuInstrumentEdit(instrumentID) {
        return (<>
            <MenuDropDown key="replace" options={() => this.renderMenuInstrumentEditReplace(instrumentID)}    >Replace</MenuDropDown>
            <MenuAction
                key="remove"
                onAction={e => this.instrumentRemove(instrumentID)}
                disabled={!this.song.hasInstrument(instrumentID)}
            >Remove from song</MenuAction>
        </>);
    }

    renderMenuInstrumentEditReplace(instrumentID) {
        return InstrumentLoader.getInstruments().map((config, i) =>
            <MenuAction key={i} onAction={e => this.instrumentReplace(instrumentID, config.className)}       >{config.name}</MenuAction>
        );
    }

    renderMenuTrack() {
        return (<>
            <MenuAction onAction={e => this.groupAdd(e)} hasBreak     >Add new group</MenuAction>
            <MenuBreak />
            {this.values.getAllSongGroups((trackName) =>
                <MenuDropDown
                    key={trackName}
                    disabled={trackName === this.state.selectedGroup}
                    options={() => this.renderMenuTrackEdit(trackName)}
                >{trackName}</MenuDropDown>)}
        </>);
    }

    renderMenuTrackEdit(trackName) {

        // const trackName = menuParam;
        return (<>
            <MenuAction onAction={e => this.groupRename(trackName)} hasBreak     >Rename group {trackName}</MenuAction>
            <MenuAction onAction={e => this.groupRemove(trackName)} hasBreak     >Delete group {trackName}</MenuAction>
        </>);
    }

}


export default ComposerMenu;
