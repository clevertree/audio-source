import React from "react";

import {MenuItem, SubMenuItem, MenuBreak} from "../components";

import Storage from "../song/Storage";
// import InputSelect from "../components/input-select/InputSelect";
import InstrumentLoader from "../instrument/InstrumentLoader";
import ComposerRenderer from "./ComposerRenderer";

import "./assets/Composer.css";

class ComposerMenu extends ComposerRenderer {

    openMenu(e, options) {
        // console.log('openMenu', e);
        if(!this.state.portrait) {
            if(typeof e.openMenu !== "function") {
                console.warn("Menu.openMenu was triggered from a non-Menu element class");
            } else {
                e.openMenu(e, options);
                return;
            }
        }

        this.menu.openMenu(e, options);
    }

    renderRootMenu() {
        const titleMenuProps = this.state.portrait ? {} : {
            vertical: true,
            arrow: false
        };
        return (<>
            <MenuItem {...titleMenuProps} key="file" onAction={e => this.openMenuFile(e)}          >File</MenuItem>
            <MenuItem {...titleMenuProps} key="edit" onAction={e => this.openMenuEdit(e)}          >Edit</MenuItem>
            <MenuItem {...titleMenuProps} key="group" onAction={e => this.openMenuGroup(e)}         >Group</MenuItem>
            <MenuItem {...titleMenuProps} key="instrument" onAction={e => this.openMenuInstrument(e)}    >Instrument</MenuItem>
            <MenuItem {...titleMenuProps} key="view" onAction={e => this.openMenuView(e)}          >View</MenuItem>
        </>);
    }
    openMenuRoot(e) {
        this.openMenu(e, this.renderRootMenu());
    }

    openMenuFile(e) {
        this.openMenu(e, <>
            <MenuItem onAction={e => this.loadNewSongData(e)}           >New song</MenuItem>
            <SubMenuItem onAction={e => this.openMenuFileOpen(e)}           >Open song</SubMenuItem>
            <SubMenuItem onAction={e => this.openMenuFileSave(e)}           >Save song</SubMenuItem>
            <SubMenuItem onAction={e => this.openMenuFileImport(e)}         >Import song</SubMenuItem>
            <SubMenuItem onAction={e => this.openMenuFileExport(e)}         >Export song</SubMenuItem>
        </>);
    }


    openMenuFileOpen(e) {
        this.openMenu(e, <>
            <MenuItem onAction={e => this.openMenuFileOpenMemory(e)}    >Import song</MenuItem>
            <MenuItem onAction={e => this.openSongFromFileDialog(e)}    >from File</MenuItem>
            <MenuItem onAction={e => this.loadSongFromURL(e)}           >from URL</MenuItem>
        </>);
    }

    openMenuFileSave(e) {
        this.openMenu(e, <>
            <MenuItem onAction={e => this.saveSongToMemory(e)}                        >to Memory</MenuItem>
            <MenuItem onAction={e => this.saveSongToFile(e)}                          >to File</MenuItem>
        </>);

    }

    openMenuFileImport(e) {
        this.openMenu(e, <>
            <MenuItem onAction={e => this.openSongFromFileDialog(e, '.mid,.midi')}          >from MIDI File</MenuItem>
        </>);
        // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
        // openMenuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
        // openMenuFileImportSongFromMIDI.disabled = true;

    }

    openMenuFileExport(e) {
        this.openMenu(e, <>
            <MenuItem disabled>to MIDI File</MenuItem>
        </>);

    }

    openMenuFileOpenMemory(e) {
        const storage = new Storage();
        const songRecentUUIDs = storage.getRecentSongList() ;
        this.openMenu(e, songRecentUUIDs.length > 0
            ? songRecentUUIDs.map((entry, i) =>
                <MenuItem
                    key={i}
                    onAction={() => this.loadSongFromMemory(entry.uuid)}
                >{entry.name || entry.uuid}</MenuItem>)
            :<MenuItem
                key="no-recent"
                disabled
            >No Songs Available</MenuItem>
        );
    }


    /** Deep selection menus **/


    openMenuSelectCommand(e, onSelectValue) {
        this.openMenu(e, <>
            <SubMenuItem onAction={e => this.openMenuSelectCommandByCurrentOctave(e, onSelectValue)}      >Current Octave</SubMenuItem>
            <MenuBreak />
            <SubMenuItem onAction={e => this.openMenuSelectCommandByFrequency(e, onSelectValue)}           >By Frequency</SubMenuItem>
            <SubMenuItem onAction={e => this.openMenuSelectCommandByOctave(e, onSelectValue)}              >By Octave</SubMenuItem>
            <MenuBreak />
            <SubMenuItem onAction={e => this.openMenuSelectCommandByNamed(e, onSelectValue)}               >By Alias</SubMenuItem>
            <SubMenuItem onAction={e => this.openMenuSelectCommandByGroup(e, onSelectValue)}               >By Group</SubMenuItem>
            <MenuItem onAction={async e => onSelectValue(await this.openPromptDialog("Insert custom command"))}      >Custom Command</MenuItem>
        </>);

    }


    openMenuSelectCommandByCurrentOctave(e, onSelectValue, octave=null) {
        octave = octave !== null ? octave : this.state.trackerCurrentOctave;
        this.openMenu(e, this.values.getNoteFrequencies((noteName) =>
            <MenuItem key={noteName} onAction={e => onSelectValue(`${noteName}${octave}`)}     >{noteName}{octave}</MenuItem>
        ));
    }


    openMenuSelectCommandByFrequency(e, onSelectValue) {
        this.openMenu(e, this.values.getNoteFrequencies((noteName) =>
            <SubMenuItem key={noteName} onAction={e => this.openMenuSelectCommandByFrequencyOctave(e, onSelectValue, noteName)}                   >{noteName}</SubMenuItem>
        ));
    }

    openMenuSelectCommandByFrequencyOctave(e, onSelectValue, noteName) {
        this.openMenu(e, this.values.getNoteOctaves((octave) =>
            <MenuItem key={octave} onAction={() => onSelectValue(octave)}     >{noteName}{octave}</MenuItem>
        ));
    }

    openMenuSelectCommandByOctave(e, onSelectValue) {
        this.openMenu(e, this.values.getNoteOctaves((octave) =>
            <SubMenuItem key={octave} onAction={e => this.openMenuSelectCommandByOctaveFrequency(e, onSelectValue, octave)}                   >{octave}</SubMenuItem>
        ));
    }

    openMenuSelectCommandByOctaveFrequency(e, onSelectValue, octave) {
        this.openMenu(e, this.values.getNoteFrequencies((noteName) =>
            <MenuItem key={noteName} onAction={() => onSelectValue(noteName)}     >{noteName}{octave}</MenuItem>
        ));
    }




    openMenuSelectSongInstrument(e, onSelectValue) {
        this.openMenu(e, this.values.getSongInstruments((instrumentID, label) =>
            <MenuItem key={instrumentID} onAction={() => onSelectValue(instrumentID)}  >{label}</MenuItem>
        ));
    }

    openMenuSelectDuration(e, onSelectValue) {
        const customAction = async () => {
            const durationInTicks = await this.openPromptDialog("Enter custom duration in ticks", this.state.trackerQuantizationInTicks);
            onSelectValue(durationInTicks);
        };
        this.openMenu(e, <>
            {this.values.getNoteDurations((durationInTicks, durationName) =>
                <MenuItem key={durationInTicks} onAction={() => onSelectValue(durationInTicks)}  >{durationName}</MenuItem>)}
            <MenuItem onAction={customAction} hasBreak >Custom Duration</MenuItem>
        </>);
    }

    openMenuSelectVelocity(e, onSelectValue) {
        const customAction = async () => {
            const velocity = await this.openPromptDialog("Enter custom velocity in ticks", 100);
            onSelectValue(velocity);
        };
        this.openMenu(e, <>
            {this.values.getNoteVelocities((velocity) =>
                <MenuItem key={velocity} onAction={() => onSelectValue(velocity)}  >{velocity}</MenuItem>)}
            <MenuItem onAction={customAction} hasBreak >Custom Velocity</MenuItem>
        </>);
    }


    openMenuSelectAvailableInstrument(e, onSelectValue, prependString='') {
        this.openMenu(e, InstrumentLoader.getInstruments().map((config, i) =>
            <MenuItem key={i} onAction={() => onSelectValue(config.className)}       >{prependString}{config.title}</MenuItem>
        ));
    }





    openMenuEdit(e) {

        // const populateGroupCommands = (openMenuGroup, action) => {
        //     openMenuGroup.populate = (e) => {
        //         const MENU = e.menuElement;
        //         this.values.getValues('song-groups', (groupName, groupTitle) => {
        //             const openMenuEditSetCommandGroup = MENU.getOrCreateMenu(groupName, `${groupTitle}`);
        //             openMenuEditSetCommandGroup.action = action;
        //         });
        //         const menuCustom = MENU.getOrCreateMenu('new', `Create New Group`);
        //         menuCustom.action = e => this.groupAdd(e);
        //         menuCustom.hasBreak = true;
        //     };
        // };

        // openMenuEditInsertCommand.disabled = selectedIndices.length > 0; // !this.cursorCell;
        // openMenuEditInsertCommand.action = handleAction('song:new');
        this.openMenu(e, <>
            <SubMenuItem onAction={e => this.openMenuEditInsert(e)}    >Insert Command</SubMenuItem>

            {this.state.selectedIndices.length === 0 ? null :
                <SubMenuItem onAction={e => this.openMenuEditSet(e)} hasBreak   >Set Command</SubMenuItem>}

            <MenuBreak />
            <SubMenuItem onAction={e => this.openMenuEditSelect(e)} hasBreak   >Select</SubMenuItem>

            <MenuBreak />
            <SubMenuItem onAction={e => this.openMenuEditBatch(e)} hasBreak   >Batch</SubMenuItem>
        </>);
        // const openMenuEditGroup = MENU.getOrCreateMenu('group', 'Group ►');
        // openMenuEditGroup.hasBreak = true;
        // openMenuEditGroup.disabled = true;
    }


    openMenuEditInsert(e) {
        this.openMenu(e, <>
            <SubMenuItem onAction={e => this.openMenuEditInsertCommandCurrentOctave(e)}      >Current Octave</SubMenuItem>
            <MenuBreak />
            <SubMenuItem onAction={e => this.openMenuEditInsertCommandFrequency(e)}           >By Frequency</SubMenuItem>
            <SubMenuItem onAction={e => this.openMenuEditInsertCommandOctave(e)}              >By Octave</SubMenuItem>
            <MenuBreak />
            <SubMenuItem onAction={e => this.openMenuEditInsertCommandNamed(e)}               >By Alias</SubMenuItem>
            <SubMenuItem onAction={e => this.openMenuEditInsertCommandGroup(e)}               >By Group</SubMenuItem>
            <MenuItem onAction={e => this.instructionInsert(null, true)}   >Custom Command</MenuItem>
        </>);

    }

    openMenuEditInsertCommandGroup(e) {
        this.openMenu(e, <>
            {this.values.getAllSongGroups((groupName) =>
                <MenuItem
                    options={e => this.openMenuEditInsertCommandFrequency()}
                    disabled={groupName === this.state.selectedGroup}
                    onAction={e => this.instructionInsert('@' + groupName, false)}
                >{groupName}</MenuItem>)}
            <MenuItem
                hasBreak
                onAction={e => this.groupAdd(e)}
            >Create New Group</MenuItem>
        </>);
    }

    openMenuEditInsertCommandNamed(e) {
        this.openMenu(e, this.values.getAllNamedFrequencies(
            (noteName, frequency, instrumentID) => <MenuItem
                onAction={e => this.instructionInsert(noteName, false, instrumentID)}
            >{noteName}</MenuItem>
        ));

    }

    openMenuEditInsertCommandFrequency(e) {
        return this.openMenuSelectCommandByFrequency(e, noteNameOctave => this.instructionInsert(noteNameOctave, false));
    }


    openMenuEditInsertCommandOctave(e) {
        return this.openMenuSelectCommandByOctave(e, noteNameOctave => this.instructionInsert(noteNameOctave, false));
    }

    openMenuEditInsertCommandCurrentOctave(e, octave=null) {
        return this.openMenuSelectCommandByCurrentOctave(e, (noteNameOctave) => this.instructionInsert(noteNameOctave, false), octave);
    }



    openMenuEditSet(e) {
        this.openMenu(e, <>
            <SubMenuItem onAction={e => this.openMenuEditSetCommand(e)}            >Set Command</SubMenuItem>
            <MenuBreak />
            <SubMenuItem onAction={e => this.openMenuEditSetInstrument(e)}         >Set Instrument</SubMenuItem>
            <MenuBreak />
            <SubMenuItem onAction={e => this.openMenuEditSetDuration(e)}           >Set Duration</SubMenuItem>
            <MenuBreak />
            <SubMenuItem onAction={e => this.openMenuEditSetVelocity(e)}           >Set Velocity</SubMenuItem>
            <MenuBreak />
            <MenuItem onAction={e => this.instructionDelete(e)}   >Delete Instruction(s)</MenuItem>
        </>);
    }

    openMenuEditSetCommand(e) {
        this.openMenu(e, <>
            <SubMenuItem onAction={e => this.openMenuEditSetCommandCurrentOctave(e)}      >Current Octave</SubMenuItem>
            <MenuBreak />
            <SubMenuItem onAction={e => this.openMenuEditSetCommandFrequency(e)}           >By Frequency</SubMenuItem>
            <SubMenuItem onAction={e => this.openMenuEditSetCommandOctave(e)}              >By Octave</SubMenuItem>
            <MenuBreak />
            <SubMenuItem onAction={e => this.openMenuEditSetCommandNamed(e)}               >By Alias</SubMenuItem>
            <SubMenuItem onAction={e => this.openMenuEditSetCommandGroup(e)}               >By Group</SubMenuItem>
            <MenuItem onAction={e => this.instructionReplaceCommand(null, true)}      >Custom</MenuItem>
        </>);

    }

    openMenuEditSetInstrument(e) {
        this.openMenu(e, this.values.getSongInstruments((instrumentID, label) =>
            <MenuItem key={instrumentID} onAction={e => this.instructionReplaceInstrument(instrumentID)}  >{label}</MenuItem>
        ));
    }

    openMenuEditSetDuration(e) {
        this.openMenuSelectDuration(e, durationInTicks => {
            this.instructionReplaceDuration(durationInTicks)
        })
    }

    openMenuEditSetVelocity(e) {
        this.openMenu(e, <>
            {this.values.getNoteVelocities((velocity) =>
                <MenuItem key={velocity} onAction={e => this.instructionReplaceVelocity(velocity)}  >{velocity}</MenuItem>)}
            <MenuItem onAction={e => this.instructionReplaceVelocity(null, true)} hasBreak >Custom Velocity</MenuItem>
        </>);
    }

    openMenuEditSetCommandFrequency(e) {
        return this.openMenuSelectCommandByFrequency(e, noteNameOctave => this.instructionReplaceCommand(noteNameOctave, false));
    }

    openMenuEditSetCommandCurrentOctave(e, octave=null) {
        return this.openMenuSelectCommandByCurrentOctave(e, (noteNameOctave) => this.instructionReplaceCommand(noteNameOctave, false), octave);
    }

    openMenuEditSetCommandOctave(e) {
        return this.openMenuSelectCommandByOctave(e, noteNameOctave => this.instructionReplaceCommand(noteNameOctave, false));
    }


    openMenuEditSetCommandNamed(e) {
        this.openMenu(e, this.values.getAllNamedFrequencies((noteName, frequency, instrumentID) =>
            <MenuItem key={noteName} onAction={e => this.instructionReplaceCommand(noteName, false, instrumentID)}                    >{noteName}</MenuItem>
        ));
    }

    openMenuEditSetCommandGroup(e) {
        this.openMenu(e, <>
            {this.values.getAllSongGroups((groupName) =>
                groupName === this.groupName ? null :
                    <MenuItem
                        key={groupName}
                        disabled={groupName === this.state.selectedGroup}
                        onAction={e => this.instructionReplaceCommand('@' + groupName, false)}
                    >{groupName}</MenuItem>
            )}
            <MenuItem onAction={e => this.groupAdd()} hasBreak  >Create New Group</MenuItem>
        </>);
    }

    openMenuEditSelect(e) {
        this.openMenu(e, <>
            <MenuItem onAction={e => this.trackerChangeSelection('segment')}      >Select Segment Instructions</MenuItem>
            <MenuItem onAction={e => this.trackerChangeSelection('all')}       >Select All Song Instructions</MenuItem>
            <MenuItem onAction={e => this.trackerChangeSelection('none')}       >Select No Instructions</MenuItem>
            <MenuBreak />
            <SubMenuItem onAction={e => this.openMenuEditSelectBatch(e)} hasBreak                        >Batch Select</SubMenuItem>
        </>);

    }

    openMenuEditSelectBatch(e) {
        this.openMenu(e, <>
            {(new Storage()).getBatchRecentSearches().map((recentBatchSearch, i) =>
                <MenuItem onAction={e => this.batchSelect(e, recentBatchSearch, true)}      >New Selection Command</MenuItem>
            )}
            <MenuItem onAction={e => this.batchSelect(e)} hasBreak      >New Selection Command</MenuItem>
        </>);
    }

    openMenuEditBatch(e) {
        this.openMenu(e, <>
            {(new Storage()).getBatchRecentCommands().map((recentBatchCommand, i) =>
                <SubMenuItem onAction={e => this.openMenuEditBatchRecent(e, recentBatchCommand)}                          >{recentBatchCommand}</SubMenuItem>
            )}
            <MenuItem onAction={e => this.batchRunCommand(e)} hasBreak      >New Batch Command</MenuItem>
        </>);
    }

    openMenuEditBatchRecent(e, recentBatchCommand) {
        this.openMenu(e, <>
            <MenuItem onAction={e => this.batchRunCommand(e, recentBatchCommand, true)}                   >Execute on Group</MenuItem>
            <SubMenuItem onAction={e => this.openMenuEditBatchRecentExecuteSearch(e, recentBatchCommand)}    >Execute using Search</SubMenuItem>
        </>);
    }

    openMenuEditBatchRecentExecuteSearch(e, recentBatchCommand) {
        this.openMenu(e, <>
            <MenuItem onAction={e => this.batchRunCommand(e, recentBatchCommand, null, true)}                   >New Search</MenuItem>
            {(new Storage()).getBatchRecentSearches().map((recentBatchSearch, i) =>
                <MenuItem onAction={e => this.batchRunCommand(e, recentBatchCommand, recentBatchSearch)}                   >{recentBatchSearch}</MenuItem>
            )}
        </>);

    }


    /** Tracker Menu **/

    openMenuTrackerSetQuantization(e) {
        this.openMenuSelectDuration(e, duration => {
            this.trackerChangeQuantization(duration);
        })
    }



    openMenuTrackerSetSegmentLength(e) {
        return this.openMenu(e, this.values.getSegmentLengths((length, title) =>
            <MenuItem key={length} onAction={(e) => this.trackerChangeSegmentLength(length)}>{title}</MenuItem>
        ))
    }

    openMenuTrackerSetInstrumentFilter(e) {
        this.openMenuSelectSongInstrument(e, instrumentID => this.trackerChangeInstrumentFilter(instrumentID));
    }

    openMenuTrackerSetOctave(e) {
        return this.openMenu(e,
            this.values.getNoteOctaves(octave =>
                <MenuItem key={octave} onAction={(e) => this.trackerChangeOctave(octave)}>{octave}</MenuItem>
            )
        );
    }

    /** View Menu **/
    openMenuView(e) {
        this.openMenu(e, <>
            <MenuItem onAction={e => this.toggleFullscreen(e)}       >{this.props.fullscreen ? 'Disable' : 'Enable'} Fullscreen</MenuItem>
            <MenuItem onAction={e => this.togglePanelSong(e)}       >{this.props.hidePanelSongs ? 'Disable' : 'Enable'} Song Forms</MenuItem>
            <MenuItem onAction={e => this.togglePanelTracker(e)}       >{this.props.hidePanelTracker ? 'Disable' : 'Enable'} Tracker Forms</MenuItem>
            <MenuItem onAction={e => this.togglePanelInstruments(e)}       >{this.props.hidePanelInstrument ? 'Disable' : 'Enable'} Instrument Forms</MenuItem>
        </>);

    }

    openMenuInstrument(e) {
        this.openMenu(e, <>
            <MenuItem key="add" onAction={e => this.openMenuInstrumentAdd()}    >Add instrument to song</MenuItem>
            <MenuBreak />
            {this.values.getSongInstruments((instrumentID, label) =>
                <MenuItem key={instrumentID} onAction={e => this.openMenuInstrumentEdit(instrumentID)}       >{label}</MenuItem>)}
        </>);
    }

    openMenuInstrumentAdd(e) {
        this.openMenu(e, InstrumentLoader.getInstruments().map((config, i) =>
            <MenuItem key={i} onAction={e => this.instrumentAdd(config.className)}       >{config.title}</MenuItem>
        ));
    }

    openMenuInstrumentEdit(e, instrumentID) {
        this.openMenu(e, <>
            <MenuItem key="replace" onAction={e => this.openMenuInstrumentEditReplace(instrumentID)}    >Replace</MenuItem>
            <MenuItem
                key="remove"
                onAction={e => this.instrumentRemove(instrumentID)}
                disabled={!this.song.isInstrumentLoaded(instrumentID)}
            >Remove from song</MenuItem>
        </>);
    }

    openMenuInstrumentEditReplace(e, instrumentID) {
        this.openMenu(e, InstrumentLoader.getInstruments().map((config, i) =>
            <MenuItem onAction={e => this.instrumentReplace(instrumentID, config.className)}       >{config.name}</MenuItem>
        ));
    }

    openMenuGroup(e) {
        this.openMenu(e, <>
            <MenuItem onAction={e => this.groupAdd(e)} hasBreak     >Add new group</MenuItem>
            <MenuBreak />
            {this.values.getAllSongGroups((groupName) =>
                <MenuItem
                    key={groupName}
                    disabled={groupName === this.state.selectedGroup}
                    onAction={e => this.openMenuGroupEdit(groupName)}
                >{groupName}</MenuItem>)}
        </>);
    }

    openMenuGroupEdit(e, groupName) {

        // const groupName = menuParam;
        this.openMenu(e, <>
            <MenuItem onAction={e => this.groupRename(groupName)} hasBreak     >Rename group {groupName}</MenuItem>
            <MenuItem onAction={e => this.groupRemove(groupName)} hasBreak     >Delete group {groupName}</MenuItem>
        </>);
    }

}


export default ComposerMenu;
