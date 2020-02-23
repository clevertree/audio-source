import React from "react";

import {SubMenu, ActionMenu, SubMenuButton, Button, InputRange, MenuBreak} from "../components";

import Storage from "../song/Storage";
// import InputSelect from "../components/input-select/InputSelect";
import InstrumentLoader from "../instrument/InstrumentLoader";
import ComposerRenderer from "./ComposerRenderer";

import "./assets/Composer.css";
import Menu from "../components/menu/Menu.native";

class ComposerMenu extends ComposerRenderer {

    renderMenuRoot() {
        const titleMenuProps = this.state.portrait ? {} : {
            vertical: true,
            arrow: false
        };
        return <>
            <SubMenu {...titleMenuProps} key="file"        options={() => this.renderMenuFile()}          >File</SubMenu>
            <SubMenu {...titleMenuProps} key="edit"        options={() => this.renderMenuEdit()}          >Edit</SubMenu>
            <SubMenu {...titleMenuProps} key="group"       options={() => this.renderMenuGroup()}         >Group</SubMenu>
            <SubMenu {...titleMenuProps} key="instrument"  options={() => this.renderMenuInstrument()}    >Instrument</SubMenu>
            <SubMenu {...titleMenuProps} key="view"        options={() => this.renderMenuView()}          >View</SubMenu>
        </>;
    }

    renderMenuFile() {
        return <>
            <ActionMenu onAction={e => this.loadNewSongData(e)}                         >New song</ActionMenu>
            <SubMenu options={() => this.renderMenuFileOpen()}           >Open song</SubMenu>
            <SubMenu options={() => this.renderMenuFileSave()}           >Save song</SubMenu>
            <SubMenu options={() => this.renderMenuFileImport()}         >Import song</SubMenu>
            <SubMenu options={() => this.renderMenuFileExport()}         >Export song</SubMenu>
        </>;
    }


    renderMenuFileOpen() {
        return <>
            <SubMenu options={() => this.renderMenuFileOpenMemory()}    >Import song</SubMenu>
            <ActionMenu onAction={e => this.openSongFromFileDialog(e)}                        >from File</ActionMenu>
            <ActionMenu onAction={e => this.loadSongFromURL(e)}                         >from URL</ActionMenu>
        </>;
    }

    renderMenuFileSave() {
        return <>
            <ActionMenu onAction={e => this.saveSongToMemory(e)}                        >to Memory</ActionMenu>
            <ActionMenu onAction={e => this.saveSongToFile(e)}                          >to File</ActionMenu>
        </>;

    }

    renderMenuFileImport() {
        return <>
            <ActionMenu onAction={e => this.openSongFromFileDialog(e, '.mid,.midi')}          >from MIDI File</ActionMenu>
        </>;
        // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
        // menuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
        // menuFileImportSongFromMIDI.disabled = true;

    }

    renderMenuFileExport() {
        return <>
            <ActionMenu disabled>to MIDI File</ActionMenu>
        </>;

    }

    renderMenuFileOpenMemory() {
        const storage = new Storage();
        const songRecentUUIDs = storage.getRecentSongList() ;
        return songRecentUUIDs.length > 0
            ? songRecentUUIDs.map((entry, i) =>
                <ActionMenu
                    key={i}
                    onAction={() => this.loadSongFromMemory(entry.uuid)}
                >{entry.name || entry.uuid}</ActionMenu>)
            :<ActionMenu
                key="no-recent"
                disabled
            >No Songs Available</ActionMenu>;
    }


    /** Deep selection menus **/

    renderMenuSelectCommandByCurrentOctave(onAction, octave=null) {
        octave = octave !== null ? octave : this.state.trackerCurrentOctave;
        return this.values.getNoteFrequencies((noteName) =>
            <ActionMenu key={noteName} onAction={e => onAction(`${noteName}${octave}`)}     >{noteName}{octave}</ActionMenu>
        );
    }


    renderMenuSelectCommandByFrequency(onAction) {
        return this.values.getNoteFrequencies((noteName) =>
            <SubMenu key={noteName} options={() => this.renderMenuSelectCommandByFrequencyOctave(onAction, noteName)}                   >{noteName}</SubMenu>
        );
    }

    renderMenuSelectCommandByFrequencyOctave(onAction, noteName) {
        return this.values.getNoteOctaves((octave) =>
            <ActionMenu key={octave} onAction={onAction}     >{noteName}{octave}</ActionMenu>
        );
    }

    renderMenuSelectCommandByOctave(onAction) {
        return this.values.getNoteOctaves((octave) =>
            <SubMenu key={octave} options={() => this.renderMenuSelectCommandByOctaveFrequency(onAction, octave)}                   >{octave}</SubMenu>
        );
    }

    renderMenuSelectCommandByOctaveFrequency(onAction, octave) {
        return this.values.getNoteFrequencies((noteName) =>
            <ActionMenu key={noteName} onAction={onAction}     >{noteName}{octave}</ActionMenu>
        );
    }

    renderMenuEdit() {

        // const populateGroupCommands = (subMenuGroup, action) => {
        //     subMenuGroup.populate = (e) => {
        //         const MENU = e.menuElement;
        //         this.values.getValues('song-groups', (groupName, groupTitle) => {
        //             const menuEditSetCommandGroup = MENU.getOrCreateSubMenu(groupName, `${groupTitle}`);
        //             menuEditSetCommandGroup.action = action;
        //         });
        //         const menuCustom = MENU.getOrCreateSubMenu('new', `Create New Group`);
        //         menuCustom.action = e => this.groupAdd(e);
        //         menuCustom.hasBreak = true;
        //     };
        // };

        // menuEditInsertCommand.disabled = selectedIndices.length > 0; // !this.cursorCell;
        // menuEditInsertCommand.action = handleAction('song:new');
        return <>
            <SubMenu options={() => this.renderMenuEditInsert()}    >Insert Command</SubMenu>

            {this.state.selectedIndices.length === 0 ? null :
                <SubMenu options={() => this.renderMenuEditSet()} hasBreak   >Set Command</SubMenu>}

            <MenuBreak />
            <SubMenu options={() => this.renderMenuEditSelect()} hasBreak   >Select</SubMenu>

            <MenuBreak />
            <SubMenu options={() => this.renderMenuEditBatch()} hasBreak   >Batch</SubMenu>
        </>;
        // const menuEditGroup = MENU.getOrCreateSubMenu('group', 'Group ►');
        // menuEditGroup.hasBreak = true;
        // menuEditGroup.disabled = true;
    }

    // TODO: combine insert and set
    renderMenuEditInsert() {
        return <>
            <SubMenu options={() => this.renderMenuEditInsertCommandCurrentOctave()}      >Current Octave</SubMenu>
            <MenuBreak />
            <SubMenu options={() => this.renderMenuEditInsertCommandFrequency()}           >By Frequency</SubMenu>
            <SubMenu options={() => this.renderMenuEditInsertCommandOctave()}              >By Octave</SubMenu>
            <MenuBreak />
            <SubMenu options={() => this.renderMenuEditInsertCommandNamed()}               >By Alias</SubMenu>
            <SubMenu options={() => this.renderMenuEditInsertCommandGroup()}               >By Group</SubMenu>
            <ActionMenu onAction={e => this.instructionInsert(null, true)}   >Custom Command</ActionMenu>
        </>;

    }

    renderMenuEditInsertCommandGroup() {
        return <>
            {this.values.getAllSongGroups((groupName) =>
                <SubMenu
                    options={e => this.renderMenuEditInsertCommandFrequency()}
                    disabled={groupName === this.state.selectedGroup}
                    onAction={e => this.instructionInsert('@' + groupName, false)}
                >{groupName}</SubMenu>)}
            <ActionMenu
                hasBreak
                onAction={e => this.groupAdd(e)}
            >Create New Group</ActionMenu>
        </>;
    }

    renderMenuEditInsertCommandNamed() {
        return this.values.getAllNamedFrequencies(
            (noteName, frequency, instrumentID) => <ActionMenu
                onAction={e => this.instructionInsert(noteName, false, instrumentID)}
            >{noteName}</ActionMenu>
        );

    }

    renderMenuEditInsertCommandFrequency() {
        return this.renderMenuSelectCommandByFrequency(noteNameOctave => this.instructionInsert(noteNameOctave, false));
    }


    renderMenuEditInsertCommandOctave() {
        return this.renderMenuSelectCommandByOctave(noteNameOctave => this.instructionInsert(noteNameOctave, false));
    }

    renderMenuEditInsertCommandCurrentOctave(octave=null) {
        return this.renderMenuSelectCommandByCurrentOctave((noteNameOctave) => this.instructionInsert(noteNameOctave, false), octave);
    }



    renderMenuEditSet() {

        return <>
            <SubMenu options={() => this.renderMenuEditSetCommand()}            >Set Command</SubMenu>
            <MenuBreak />
            <SubMenu options={() => this.renderMenuEditSetInstruction()}         >Set Instrument</SubMenu>
            <MenuBreak />
            <SubMenu options={() => this.renderMenuEditSetDuration()}           >Set Duration</SubMenu>
            <MenuBreak />
            <SubMenu options={() => this.renderMenuEditSetVelocity()}           >Set Velocity</SubMenu>
            <MenuBreak />
            <ActionMenu onAction={e => this.instructionDelete(e)}   >Delete Instruction(s)</ActionMenu>
        </>;
    }

    renderMenuEditSetCommand() {

        return <>
            <SubMenu options={() => this.renderMenuEditSetCommandCurrentOctave()}      >Current Octave</SubMenu>
            <MenuBreak />
            <SubMenu options={() => this.renderMenuEditSetCommandFrequency()}           >By Frequency</SubMenu>
            <SubMenu options={() => this.renderMenuEditSetCommandOctave()}              >By Octave</SubMenu>
            <MenuBreak />
            <SubMenu options={() => this.renderMenuEditSetCommandNamed()}               >By Alias</SubMenu>
            <SubMenu options={() => this.renderMenuEditSetCommandGroup()}               >By Group</SubMenu>
            <ActionMenu onAction={e => this.instructionChangeCommand(null, true)}      >Custom</ActionMenu>
        </>;

    }

    renderMenuEditSetInstruction() {
        return this.values.getSongInstruments((instrumentID, label) =>
            <ActionMenu key={instrumentID} onAction={e => this.instructionChangeInstrument(instrumentID)}  >{label}</ActionMenu>
        );
    }

    renderMenuEditSetDuration() {

        return <>
            {this.values.getNoteDurations((durationInTicks, durationName) =>
                <ActionMenu key={durationInTicks} onAction={e => this.instructionChangeDuration(durationInTicks)}  >{durationName}</ActionMenu>)}
            <ActionMenu onAction={e => this.instructionChangeDuration(null, true)} hasBreak >Custom Duration</ActionMenu>
        </>;
    }

    renderMenuEditSetVelocity() {
        return <>
            {this.values.getNoteVelocities((velocity) =>
                <ActionMenu key={velocity} onAction={e => this.instructionChangeVelocity(velocity)}  >{velocity}</ActionMenu>)}
            <ActionMenu onAction={e => this.instructionChangeVelocity(null, true)} hasBreak >Custom Velocity</ActionMenu>
        </>;
    }

    renderMenuEditSetCommandFrequency() {
        return this.renderMenuSelectCommandByFrequency(noteNameOctave => this.instructionChangeCommand(noteNameOctave, false));
    }

    renderMenuEditSetCommandCurrentOctave(octave=null) {
        return this.renderMenuSelectCommandByCurrentOctave((noteNameOctave) => this.instructionChangeCommand(noteNameOctave, false), octave);
    }

    renderMenuEditSetCommandOctave() {
        return this.renderMenuSelectCommandByOctave(noteNameOctave => this.instructionChangeCommand(noteNameOctave, false));
    }


    renderMenuEditSetCommandNamed() {
        return this.values.getAllNamedFrequencies((noteName, frequency, instrumentID) =>
            <ActionMenu key={noteName} onAction={e => this.instructionChangeCommand(noteName, false, instrumentID)}                    >{noteName}</ActionMenu>
        );
    }

    renderMenuEditSetCommandGroup() {
        return <>
            {this.values.getAllSongGroups((groupName) =>
                groupName === this.groupName ? null :
                    <ActionMenu
                        key={groupName}
                        disabled={groupName === this.state.selectedGroup}
                        onAction={e => this.instructionChangeCommand('@' + groupName, false)}
                    >{groupName}</ActionMenu>
            )}
            <ActionMenu onAction={e => this.groupAdd()} hasBreak  >Create New Group</ActionMenu>
        </>;
    }

    renderMenuEditSelect() {
        return <>
            <ActionMenu onAction={e => this.trackerChangeSelection('segment')}      >Select Segment Instructions</ActionMenu>
            <ActionMenu onAction={e => this.trackerChangeSelection('all')}       >Select All Song Instructions</ActionMenu>
            <ActionMenu onAction={e => this.trackerChangeSelection('none')}       >Select No Instructions</ActionMenu>
            <MenuBreak />
            <SubMenu options={() => this.renderMenuEditSelectBatch()}  hasBreak                        >Batch Select</SubMenu>
        </>;

    }

    renderMenuEditSelectBatch() {
        return <>
            {(new Storage()).getBatchRecentSearches().map((recentBatchSearch, i) =>
                <ActionMenu onAction={e => this.batchSelect(e, recentBatchSearch, true)}      >New Selection Command</ActionMenu>
            )}
            <ActionMenu onAction={e => this.batchSelect(e)} hasBreak      >New Selection Command</ActionMenu>
        </>;
    }

    renderMenuEditBatch() {
        return <>
            {(new Storage()).getBatchRecentCommands().map((recentBatchCommand, i) =>
                <SubMenu options={() => this.renderMenuEditBatchRecent(recentBatchCommand)}                          >{recentBatchCommand}</SubMenu>
            )}
            <ActionMenu onAction={e => this.batchRunCommand(e)} hasBreak      >New Batch Command</ActionMenu>
        </>;
    }

    renderMenuEditBatchRecent(recentBatchCommand) {
        return <>
            <ActionMenu onAction={e => this.batchRunCommand(e, recentBatchCommand, true)}                   >Execute on Group</ActionMenu>
            <SubMenu options={() => this.renderMenuEditBatchRecentExecuteSearch(recentBatchCommand)}    >Execute using Search</SubMenu>
        </>;
    }

    renderMenuEditBatchRecentExecuteSearch(recentBatchCommand) {
        return <>
            <ActionMenu onAction={e => this.batchRunCommand(e, recentBatchCommand, null, true)}                   >New Search</ActionMenu>
            {(new Storage()).getBatchRecentSearches().map((recentBatchSearch, i) =>
                <ActionMenu onAction={e => this.batchRunCommand(e, recentBatchCommand, recentBatchSearch)}                   >{recentBatchSearch}</ActionMenu>
            )}
        </>;

    }

    renderMenuView() {
        return <>
            <ActionMenu onAction={e => this.toggleFullscreen(e)}       >{this.props.fullscreen ? 'Disable' : 'Enable'} Fullscreen</ActionMenu>
            <ActionMenu onAction={e => this.togglePanelSong(e)}       >{this.props.hidePanelSongs ? 'Disable' : 'Enable'} Song Forms</ActionMenu>
            <ActionMenu onAction={e => this.togglePanelTracker(e)}       >{this.props.hidePanelTracker ? 'Disable' : 'Enable'} Tracker Forms</ActionMenu>
            <ActionMenu onAction={e => this.togglePanelInstruments(e)}       >{this.props.hidePanelInstrument ? 'Disable' : 'Enable'} Instrument Forms</ActionMenu>
        </>;

    }

    renderMenuInstrument() {
        return <>
            <SubMenu key="add" options={() => this.renderMenuInstrumentAdd()}    >Add instrument to song</SubMenu>
            <MenuBreak />
            {this.values.getSongInstruments((instrumentID, label) =>
                <ActionMenu key={instrumentID} onAction={e => this.renderMenuInstrumentEdit(instrumentID)}       >{label}</ActionMenu>)}
        </>;
    }

    renderMenuInstrumentAdd() {
        return InstrumentLoader.getInstruments().map((config, i) =>
            <ActionMenu key={i} onAction={e => this.instrumentAdd(config.className)}       >{config.title}</ActionMenu>);
    }

    renderMenuInstrumentEdit(instrumentID) {
        return <>
            <SubMenu key="replace" options={() => this.renderMenuInstrumentEditReplace(instrumentID)}    >Replace</SubMenu>
            <ActionMenu
                key="remove"
                onAction={e => this.instrumentRemove(instrumentID)}
                disabled={!this.song.isInstrumentLoaded(instrumentID)}
            >Remove from song</ActionMenu>
        </>;
    }

    renderMenuInstrumentEditReplace(instrumentID) {
        return InstrumentLoader.getInstruments().map((config, i) =>
            <ActionMenu onAction={e => this.instrumentReplace(instrumentID, config.className)}       >{config.name}</ActionMenu>
        );
    }

    renderMenuGroup() {

        return <>
            <ActionMenu onAction={e => this.groupAdd(e)}  hasBreak     >Add new group</ActionMenu>
            <MenuBreak />
            {this.values.getAllSongGroups((groupName) =>
                <SubMenu
                    key={groupName}
                    disabled={groupName === this.state.selectedGroup}
                    options={() => this.renderMenuGroupEdit(groupName)}
                >{groupName}</SubMenu>)}
        </>;
    }

    renderMenuGroupEdit(groupName) {

        // const groupName = menuParam;
        return <>
            <ActionMenu onAction={e => this.groupRename(groupName)}  hasBreak     >Rename group {groupName}</ActionMenu>
            <ActionMenu onAction={e => this.groupRemove(groupName)}  hasBreak     >Delete group {groupName}</ActionMenu>
        </>;
    }

    /** @deprecated **/
    renderMenu(menuKey=null, menuParam=null) {
        let recentBatchCommand, instrumentID, octave;
        // const library = await this.getLibrary();
        /** File Menu **/
        switch (menuKey) {
            case 'root':
                return this.renderMenuRoot();

            case 'file':
                return this.renderMenuFile();

            case 'file-open':
                return this.renderMenuFileOpen();



            case 'file-save':
                return this.renderMenuFileSave();

            case 'file-import':
                return this.renderMenuFileImport();

            case 'file-export':
                return this.renderMenuFileExport();

            case 'file-open-memory':
                return this.renderMenuFileOpenMemory();

            case 'edit':
            case 'context':
                return this.renderMenuEdit();

            case 'edit-insert':
                return this.renderMenuEditInsert();

            case 'edit-insert-group':
                return this.renderMenuEditInsertCommandGroup();

            case 'edit-insert-named':
                return this.renderMenuEditInsertCommandNamed();

            case 'edit-insert-frequency':
                return this.renderMenuEditInsertCommandFrequency();
            //
            // case 'edit-insert-frequency-note':
            //     return this.renderMenuEditInsertFrequencyNote();


            case 'edit-set':
                return this.renderMenuEditSet();

            case 'edit-set-command':
                return this.renderMenuEditSetCommand();

            case 'edit-set-instrument':
                return this.renderMenuEditSetInstruction();

            case 'edit-set-duration':
                return this.renderMenuEditSetDuration();

            case 'edit-set-velocity':
                return this.renderMenuEditSetVelocity();

            case 'edit-set-command-frequency':
                return this.renderMenuEditSetCommandFrequency();

            // case 'edit-set-command-frequency-note':
            //     return this.renderMenuEditSetCommandFrequencyNote(menuParam);

            case 'edit-set-command-current-octave':
                return this.renderMenuEditSetCommandCurrentOctave(menuParam);

            case 'edit-set-command-octave':
                return this.renderMenuEditSetCommandOctave();

            // case 'edit-set-command-octave-frequency':
            //     return this.renderMenuEditSetCommandOctaveFrequency(menuParam);

            case 'edit-set-command-named':
                return this.renderMenuEditSetCommandNamed();

            case 'edit-set-command-group':
                return this.renderMenuEditSetCommandGroup();

            case 'edit-select':
                return this.renderMenuEditSelect();

            case 'edit-select-batch':
                return this.renderMenuEditSelectBatch();

            case 'edit-batch':
                return this.renderMenuEditBatch();

            case 'edit-batch-recent':
                return this.renderMenuEditBatchRecent(menuParam);

            case 'edit-batch-recent-execute-search':
                return this.renderMenuEditBatchRecentExecuteSearch(menuParam);

            case 'view':
                return this.renderMenuView();

            case 'instrument':
                return this.renderMenuInstrument();

            case 'instrument-add':
                return this.renderMenuInstrumentAdd();

            case 'instrument-edit':
                return this.renderMenuInstrumentEdit(menuParam);

            case 'instrument-edit-replace':
                return this.renderMenuInstrumentEditReplace(menuParam);

            /** Group Menu **/
            case 'group':
                return this.renderMenuGroup();

            case 'group-edit':
                return this.renderMenuGroupEdit(menuParam);

            default:
                throw new Error("Unknown menu key: " + menuKey);
        }

    }
}


export default ComposerMenu;
