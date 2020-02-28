import React from "react";

import {Menu, SubMenu, MenuBreak} from "../components";

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
            <SubMenu {...titleMenuProps} key="file"        onAction={e => this.openMenuFile(e)}          >File</SubMenu>
            <SubMenu {...titleMenuProps} key="edit"        onAction={e => this.openMenuEdit(e)}          >Edit</SubMenu>
            <SubMenu {...titleMenuProps} key="group"       onAction={e => this.openMenuGroup(e)}         >Group</SubMenu>
            <SubMenu {...titleMenuProps} key="instrument"  onAction={e => this.openMenuInstrument(e)}    >Instrument</SubMenu>
            <SubMenu {...titleMenuProps} key="view"        onAction={e => this.openMenuView(e)}          >View</SubMenu>
        </>);
    }
    openMenuRoot(e) {
        this.openMenu(e, this.renderRootMenu());
    }

    openMenuFile(e) {
        this.openMenu(e, <>
            <Menu onAction={e => this.loadNewSongData(e)}           >New song</Menu>
            <SubMenu onAction={e => this.openMenuFileOpen(e)}           >Open song</SubMenu>
            <SubMenu onAction={e => this.openMenuFileSave(e)}           >Save song</SubMenu>
            <SubMenu onAction={e => this.openMenuFileImport(e)}         >Import song</SubMenu>
            <SubMenu onAction={e => this.openMenuFileExport(e)}         >Export song</SubMenu>
        </>);
    }


    openMenuFileOpen(e) {
        this.openMenu(e, <>
            <Menu onAction={e => this.openMenuFileOpenMemory(e)}    >Import song</Menu>
            <Menu onAction={e => this.openSongFromFileDialog(e)}    >from File</Menu>
            <Menu onAction={e => this.loadSongFromURL(e)}           >from URL</Menu>
        </>);
    }

    openMenuFileSave(e) {
        this.openMenu(e, <>
            <Menu onAction={e => this.saveSongToMemory(e)}                        >to Memory</Menu>
            <Menu onAction={e => this.saveSongToFile(e)}                          >to File</Menu>
        </>);

    }

    openMenuFileImport(e) {
        this.openMenu(e, <>
            <Menu onAction={e => this.openSongFromFileDialog(e, '.mid,.midi')}          >from MIDI File</Menu>
        </>);
        // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
        // openMenuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
        // openMenuFileImportSongFromMIDI.disabled = true;

    }

    openMenuFileExport(e) {
        this.openMenu(e, <>
            <Menu disabled>to MIDI File</Menu>
        </>);

    }

    openMenuFileOpenMemory(e) {
        const storage = new Storage();
        const songRecentUUIDs = storage.getRecentSongList() ;
        this.openMenu(e, songRecentUUIDs.length > 0
            ? songRecentUUIDs.map((entry, i) =>
                <Menu
                    key={i}
                    onAction={() => this.loadSongFromMemory(entry.uuid)}
                >{entry.name || entry.uuid}</Menu>)
            :<Menu
                key="no-recent"
                disabled
            >No Songs Available</Menu>
        );
    }


    /** Deep selection menus **/


    openMenuSelectCommand(e, onSelectValue) {
        this.openMenu(e, <>
            <SubMenu onAction={e => this.openMenuSelectCommandByCurrentOctave(e, onSelectValue)}      >Current Octave</SubMenu>
            <MenuBreak />
            <SubMenu onAction={e => this.openMenuSelectCommandByFrequency(e, onSelectValue)}           >By Frequency</SubMenu>
            <SubMenu onAction={e => this.openMenuSelectCommandByOctave(e, onSelectValue)}              >By Octave</SubMenu>
            <MenuBreak />
            <SubMenu onAction={e => this.openMenuSelectCommandByNamed(e, onSelectValue)}               >By Alias</SubMenu>
            <SubMenu onAction={e => this.openMenuSelectCommandByGroup(e, onSelectValue)}               >By Group</SubMenu>
            <Menu onAction={async e => onSelectValue(await this.openPromptDialog("Insert custom command"))}      >Custom Command</Menu>
        </>);

    }


    openMenuSelectCommandByCurrentOctave(e, onSelectValue, octave=null) {
        octave = octave !== null ? octave : this.state.trackerCurrentOctave;
        this.openMenu(e, this.values.getNoteFrequencies((noteName) =>
            <Menu key={noteName} onAction={e => onSelectValue(`${noteName}${octave}`)}     >{noteName}{octave}</Menu>
        ));
    }


    openMenuSelectCommandByFrequency(e, onSelectValue) {
        this.openMenu(e, this.values.getNoteFrequencies((noteName) =>
            <SubMenu key={noteName} onAction={e => this.openMenuSelectCommandByFrequencyOctave(e, onSelectValue, noteName)}                   >{noteName}</SubMenu>
        ));
    }

    openMenuSelectCommandByFrequencyOctave(e, onSelectValue, noteName) {
        this.openMenu(e, this.values.getNoteOctaves((octave) =>
            <Menu key={octave} onAction={() => onSelectValue(octave)}     >{noteName}{octave}</Menu>
        ));
    }

    openMenuSelectCommandByOctave(e, onSelectValue) {
        this.openMenu(e, this.values.getNoteOctaves((octave) =>
            <SubMenu key={octave} onAction={e => this.openMenuSelectCommandByOctaveFrequency(e, onSelectValue, octave)}                   >{octave}</SubMenu>
        ));
    }

    openMenuSelectCommandByOctaveFrequency(e, onSelectValue, octave) {
        this.openMenu(e, this.values.getNoteFrequencies((noteName) =>
            <Menu key={noteName} onAction={() => onSelectValue(noteName)}     >{noteName}{octave}</Menu>
        ));
    }




    openMenuSelectSongInstrument(e, onSelectValue) {
        this.openMenu(e, this.values.getSongInstruments((instrumentID, label) =>
            <Menu key={instrumentID} onAction={() => onSelectValue(instrumentID)}  >{label}</Menu>
        ));
    }

    openMenuSelectDuration(e, onSelectValue) {
        const customAction = async () => {
            const durationInTicks = await this.openPromptDialog("Enter custom duration in ticks", this.state.trackerQuantizationInTicks);
            onSelectValue(durationInTicks);
        };
        this.openMenu(e, <>
            {this.values.getNoteDurations((durationInTicks, durationName) =>
                <Menu key={durationInTicks} onAction={() => onSelectValue(durationInTicks)}  >{durationName}</Menu>)}
            <Menu onAction={customAction} hasBreak >Custom Duration</Menu>
        </>);
    }

    openMenuSelectVelocity(e, onSelectValue) {
        const customAction = async () => {
            const velocity = await this.openPromptDialog("Enter custom velocity in ticks", 100);
            onSelectValue(velocity);
        };
        this.openMenu(e, <>
            {this.values.getNoteVelocities((velocity) =>
                <Menu key={velocity} onAction={() => onSelectValue(velocity)}  >{velocity}</Menu>)}
            <Menu onAction={customAction} hasBreak >Custom Velocity</Menu>
        </>);
    }


    openMenuSelectAvailableInstrument(e, onSelectValue, prependString='') {
        this.openMenu(e, InstrumentLoader.getInstruments().map((config, i) =>
            <Menu key={i} onAction={() => onSelectValue(config.className)}       >{prependString}{config.title}</Menu>
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
            <SubMenu onAction={e => this.openMenuEditInsert(e)}    >Insert Command</SubMenu>

            {this.state.selectedIndices.length === 0 ? null :
                <SubMenu onAction={e => this.openMenuEditSet(e)} hasBreak   >Set Command</SubMenu>}

            <MenuBreak />
            <SubMenu onAction={e => this.openMenuEditSelect(e)} hasBreak   >Select</SubMenu>

            <MenuBreak />
            <SubMenu onAction={e => this.openMenuEditBatch(e)} hasBreak   >Batch</SubMenu>
        </>);
        // const openMenuEditGroup = MENU.getOrCreateMenu('group', 'Group ►');
        // openMenuEditGroup.hasBreak = true;
        // openMenuEditGroup.disabled = true;
    }


    openMenuEditInsert(e) {
        this.openMenu(e, <>
            <SubMenu onAction={e => this.openMenuEditInsertCommandCurrentOctave(e)}      >Current Octave</SubMenu>
            <MenuBreak />
            <SubMenu onAction={e => this.openMenuEditInsertCommandFrequency(e)}           >By Frequency</SubMenu>
            <SubMenu onAction={e => this.openMenuEditInsertCommandOctave(e)}              >By Octave</SubMenu>
            <MenuBreak />
            <SubMenu onAction={e => this.openMenuEditInsertCommandNamed(e)}               >By Alias</SubMenu>
            <SubMenu onAction={e => this.openMenuEditInsertCommandGroup(e)}               >By Group</SubMenu>
            <Menu onAction={e => this.instructionInsert(null, true)}   >Custom Command</Menu>
        </>);

    }

    openMenuEditInsertCommandGroup(e) {
        this.openMenu(e, <>
            {this.values.getAllSongGroups((groupName) =>
                <Menu
                    options={e => this.openMenuEditInsertCommandFrequency()}
                    disabled={groupName === this.state.selectedGroup}
                    onAction={e => this.instructionInsert('@' + groupName, false)}
                >{groupName}</Menu>)}
            <Menu
                hasBreak
                onAction={e => this.groupAdd(e)}
            >Create New Group</Menu>
        </>);
    }

    openMenuEditInsertCommandNamed(e) {
        this.openMenu(e, this.values.getAllNamedFrequencies(
            (noteName, frequency, instrumentID) => <Menu
                onAction={e => this.instructionInsert(noteName, false, instrumentID)}
            >{noteName}</Menu>
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
            <SubMenu onAction={e => this.openMenuEditSetCommand(e)}            >Set Command</SubMenu>
            <MenuBreak />
            <SubMenu onAction={e => this.openMenuEditSetInstrument(e)}         >Set Instrument</SubMenu>
            <MenuBreak />
            <SubMenu onAction={e => this.openMenuEditSetDuration(e)}           >Set Duration</SubMenu>
            <MenuBreak />
            <SubMenu onAction={e => this.openMenuEditSetVelocity(e)}           >Set Velocity</SubMenu>
            <MenuBreak />
            <Menu onAction={e => this.instructionDelete(e)}   >Delete Instruction(s)</Menu>
        </>);
    }

    openMenuEditSetCommand(e) {
        this.openMenu(e, <>
            <SubMenu onAction={e => this.openMenuEditSetCommandCurrentOctave(e)}      >Current Octave</SubMenu>
            <MenuBreak />
            <SubMenu onAction={e => this.openMenuEditSetCommandFrequency(e)}           >By Frequency</SubMenu>
            <SubMenu onAction={e => this.openMenuEditSetCommandOctave(e)}              >By Octave</SubMenu>
            <MenuBreak />
            <SubMenu onAction={e => this.openMenuEditSetCommandNamed(e)}               >By Alias</SubMenu>
            <SubMenu onAction={e => this.openMenuEditSetCommandGroup(e)}               >By Group</SubMenu>
            <Menu onAction={e => this.instructionReplaceCommand(null, true)}      >Custom</Menu>
        </>);

    }

    openMenuEditSetInstrument(e) {
        this.openMenu(e, this.values.getSongInstruments((instrumentID, label) =>
            <Menu key={instrumentID} onAction={e => this.instructionReplaceInstrument(instrumentID)}  >{label}</Menu>
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
                <Menu key={velocity} onAction={e => this.instructionReplaceVelocity(velocity)}  >{velocity}</Menu>)}
            <Menu onAction={e => this.instructionReplaceVelocity(null, true)} hasBreak >Custom Velocity</Menu>
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
            <Menu key={noteName} onAction={e => this.instructionReplaceCommand(noteName, false, instrumentID)}                    >{noteName}</Menu>
        ));
    }

    openMenuEditSetCommandGroup(e) {
        this.openMenu(e, <>
            {this.values.getAllSongGroups((groupName) =>
                groupName === this.groupName ? null :
                    <Menu
                        key={groupName}
                        disabled={groupName === this.state.selectedGroup}
                        onAction={e => this.instructionReplaceCommand('@' + groupName, false)}
                    >{groupName}</Menu>
            )}
            <Menu onAction={e => this.groupAdd()} hasBreak  >Create New Group</Menu>
        </>);
    }

    openMenuEditSelect(e) {
        this.openMenu(e, <>
            <Menu onAction={e => this.trackerChangeSelection('segment')}      >Select Segment Instructions</Menu>
            <Menu onAction={e => this.trackerChangeSelection('all')}       >Select All Song Instructions</Menu>
            <Menu onAction={e => this.trackerChangeSelection('none')}       >Select No Instructions</Menu>
            <MenuBreak />
            <SubMenu onAction={e => this.openMenuEditSelectBatch(e)}  hasBreak                        >Batch Select</SubMenu>
        </>);

    }

    openMenuEditSelectBatch(e) {
        this.openMenu(e, <>
            {(new Storage()).getBatchRecentSearches().map((recentBatchSearch, i) =>
                <Menu onAction={e => this.batchSelect(e, recentBatchSearch, true)}      >New Selection Command</Menu>
            )}
            <Menu onAction={e => this.batchSelect(e)} hasBreak      >New Selection Command</Menu>
        </>);
    }

    openMenuEditBatch(e) {
        this.openMenu(e, <>
            {(new Storage()).getBatchRecentCommands().map((recentBatchCommand, i) =>
                <SubMenu onAction={e => this.openMenuEditBatchRecent(e, recentBatchCommand)}                          >{recentBatchCommand}</SubMenu>
            )}
            <Menu onAction={e => this.batchRunCommand(e)} hasBreak      >New Batch Command</Menu>
        </>);
    }

    openMenuEditBatchRecent(e, recentBatchCommand) {
        this.openMenu(e, <>
            <Menu onAction={e => this.batchRunCommand(e, recentBatchCommand, true)}                   >Execute on Group</Menu>
            <SubMenu onAction={e => this.openMenuEditBatchRecentExecuteSearch(e, recentBatchCommand)}    >Execute using Search</SubMenu>
        </>);
    }

    openMenuEditBatchRecentExecuteSearch(e, recentBatchCommand) {
        this.openMenu(e, <>
            <Menu onAction={e => this.batchRunCommand(e, recentBatchCommand, null, true)}                   >New Search</Menu>
            {(new Storage()).getBatchRecentSearches().map((recentBatchSearch, i) =>
                <Menu onAction={e => this.batchRunCommand(e, recentBatchCommand, recentBatchSearch)}                   >{recentBatchSearch}</Menu>
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
            <Menu key={length} onAction={(e) => this.trackerChangeSegmentLength(length)}>{title}</Menu>
        ))
    }

    openMenuTrackerSetInstrumentFilter(e) {
        this.openMenuSelectSongInstrument(e, instrumentID => this.trackerChangeInstrumentFilter(instrumentID));
    }

    openMenuTrackerSetOctave(e) {
        return this.openMenu(e,
            this.values.getNoteOctaves(octave =>
                <Menu key={octave} onAction={(e) => this.trackerChangeOctave(octave)}>{octave}</Menu>
            )
        );
    }

    /** View Menu **/
    openMenuView(e) {
        this.openMenu(e, <>
            <Menu onAction={e => this.toggleFullscreen(e)}       >{this.props.fullscreen ? 'Disable' : 'Enable'} Fullscreen</Menu>
            <Menu onAction={e => this.togglePanelSong(e)}       >{this.props.hidePanelSongs ? 'Disable' : 'Enable'} Song Forms</Menu>
            <Menu onAction={e => this.togglePanelTracker(e)}       >{this.props.hidePanelTracker ? 'Disable' : 'Enable'} Tracker Forms</Menu>
            <Menu onAction={e => this.togglePanelInstruments(e)}       >{this.props.hidePanelInstrument ? 'Disable' : 'Enable'} Instrument Forms</Menu>
        </>);

    }

    openMenuInstrument(e) {
        this.openMenu(e, <>
            <Menu key="add" onAction={e => this.openMenuInstrumentAdd()}    >Add instrument to song</Menu>
            <MenuBreak />
            {this.values.getSongInstruments((instrumentID, label) =>
                <Menu key={instrumentID} onAction={e => this.openMenuInstrumentEdit(instrumentID)}       >{label}</Menu>)}
        </>);
    }

    openMenuInstrumentAdd(e) {
        this.openMenu(e, InstrumentLoader.getInstruments().map((config, i) =>
            <Menu key={i} onAction={e => this.instrumentAdd(config.className)}       >{config.title}</Menu>
        ));
    }

    openMenuInstrumentEdit(e, instrumentID) {
        this.openMenu(e, <>
            <Menu key="replace" onAction={e => this.openMenuInstrumentEditReplace(instrumentID)}    >Replace</Menu>
            <Menu
                key="remove"
                onAction={e => this.instrumentRemove(instrumentID)}
                disabled={!this.song.isInstrumentLoaded(instrumentID)}
            >Remove from song</Menu>
        </>);
    }

    openMenuInstrumentEditReplace(e, instrumentID) {
        this.openMenu(e, InstrumentLoader.getInstruments().map((config, i) =>
            <Menu onAction={e => this.instrumentReplace(instrumentID, config.className)}       >{config.name}</Menu>
        ));
    }

    openMenuGroup(e) {
        this.openMenu(e, <>
            <Menu onAction={e => this.groupAdd(e)}  hasBreak     >Add new group</Menu>
            <MenuBreak />
            {this.values.getAllSongGroups((groupName) =>
                <Menu
                    key={groupName}
                    disabled={groupName === this.state.selectedGroup}
                    onAction={e => this.openMenuGroupEdit(groupName)}
                >{groupName}</Menu>)}
        </>);
    }

    openMenuGroupEdit(e, groupName) {

        // const groupName = menuParam;
        this.openMenu(e, <>
            <Menu onAction={e => this.groupRename(groupName)}  hasBreak     >Rename group {groupName}</Menu>
            <Menu onAction={e => this.groupRemove(groupName)}  hasBreak     >Delete group {groupName}</Menu>
        </>);
    }

}


export default ComposerMenu;
