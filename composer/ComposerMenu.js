import React from "react";

import {MenuItem, SubMenuItem, MenuBreak} from "../components";

import Storage from "../song/Storage";
// import InputSelect from "../components/input-select/InputSelect";
import InstrumentLoader from "../instrument/InstrumentLoader";
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
            <SubMenuItem {...props} options={p => this.renderMenuFile(p)}          >File</SubMenuItem>
            <SubMenuItem {...props} options={p => this.renderMenuEdit(p)}          >Edit</SubMenuItem>
            <SubMenuItem {...props} options={p => this.renderMenuGroup(p)}         >Group</SubMenuItem>
            <SubMenuItem {...props} options={p => this.renderMenuInstrument(p)}    >Instrument</SubMenuItem>
            <SubMenuItem {...props} options={p => this.renderMenuView(p)}          >View</SubMenuItem>
        </>);
    }

    renderMenuFile(e) {
        return (<>
            <MenuItem       onAction={e => this.loadNewSongData(e)}             >New song</MenuItem>
            <SubMenuItem    options={p => this.renderMenuFileOpen(p)}           >Open song</SubMenuItem>
            <SubMenuItem    options={p => this.renderMenuFileSave(p)}           >Save song</SubMenuItem>
            <SubMenuItem    options={p => this.renderMenuFileImport(p)}         >Import song</SubMenuItem>
            <SubMenuItem    options={p => this.renderMenuFileExport(p)}         >Export song</SubMenuItem>
        </>);
    }


    renderMenuFileOpen(e) {
        return (<>
            <SubMenuItem    options={p => this.renderMenuFileOpenMemory(p)}     >Import song</SubMenuItem>
            <MenuItem       onAction={e => this.openSongFromFileDialog(e)}      >from File</MenuItem>
            <MenuItem       onAction={e => this.loadSongFromURL(e)}             >from URL</MenuItem>
        </>);
    }

    renderMenuFileSave(e) {
        return (<>
            <MenuItem onAction={e => this.saveSongToMemory(e)}                        >to Memory</MenuItem>
            <MenuItem onAction={e => this.saveSongToFile(e)}                          >to File</MenuItem>
        </>);

    }

    renderMenuFileImport(e) {
        return (<>
            <MenuItem onAction={e => this.openSongFromFileDialog(e, '.mid,.midi')}          >from MIDI File</MenuItem>
        </>);
        // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
        // renderMenuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
        // renderMenuFileImportSongFromMIDI.disabled = true;

    }

    renderMenuFileExport(e) {
        return (<>
            <MenuItem disabled>to MIDI File</MenuItem>
        </>);

    }

    renderMenuFileOpenMemory(e) {
        const storage = new Storage();
        const songRecentUUIDs = storage.getRecentSongList() ;
        return songRecentUUIDs.length > 0
            ? songRecentUUIDs.map((entry, i) =>
                <MenuItem
                    key={i}
                    onAction={(e) => this.loadSongFromMemory(entry.uuid)}
                >{entry.name || entry.uuid}</MenuItem>)
            :<MenuItem
                key="no-recent"
                disabled
            >No Songs Available</MenuItem>
        ;
    }


    /** Deep selection menus **/


    renderMenuSelectCommand(e, onSelectValue) {
        return (<>
            <SubMenuItem options={p => this.renderMenuSelectCommandByCurrentOctave(p, onSelectValue)}      >Current Octave</SubMenuItem>
            <MenuBreak />
            <SubMenuItem options={p => this.renderMenuSelectCommandByFrequency(p, onSelectValue)}           >By Frequency</SubMenuItem>
            <SubMenuItem options={p => this.renderMenuSelectCommandByOctave(p, onSelectValue)}              >By Octave</SubMenuItem>
            <MenuBreak />
            <SubMenuItem options={p => this.renderMenuSelectCommandByNamed(p, onSelectValue)}               >By Alias</SubMenuItem>
            <SubMenuItem options={p => this.renderMenuSelectCommandByGroup(p, onSelectValue)}               >By Group</SubMenuItem>
            <MenuItem onAction={async e => onSelectValue(await this.openPromptDialog("Insert custom command"))}      >Custom Command</MenuItem>
        </>);

    }


    renderMenuSelectCommandByCurrentOctave(e, onSelectValue, octave=null) {
        octave = octave !== null ? octave : this.state.trackerCurrentOctave;
        return this.values.getNoteFrequencies((noteName) =>
            <MenuItem key={noteName} onAction={e => onSelectValue(`${noteName}${octave}`)}     >{noteName}{octave}</MenuItem>
        );
    }


    renderMenuSelectCommandByFrequency(e, onSelectValue) {
        return this.values.getNoteFrequencies((noteName) =>
            <SubMenuItem key={noteName} options={p => this.renderMenuSelectCommandByFrequencyOctave(e, onSelectValue, noteName)}                   >{noteName}</SubMenuItem>
        );
    }

    renderMenuSelectCommandByFrequencyOctave(e, onSelectValue, noteName) {
        return this.values.getNoteOctaves((octave) =>
            <MenuItem key={octave} onAction={() => onSelectValue(octave)}     >{noteName}{octave}</MenuItem>
        );
    }

    renderMenuSelectCommandByOctave(e, onSelectValue) {
        return this.values.getNoteOctaves((octave) =>
            <SubMenuItem key={octave} options={p => this.renderMenuSelectCommandByOctaveFrequency(e, onSelectValue, octave)}                   >{octave}</SubMenuItem>
        );
    }

    renderMenuSelectCommandByOctaveFrequency(e, onSelectValue, octave) {
        return this.values.getNoteFrequencies((noteName) =>
            <MenuItem key={noteName} onAction={() => onSelectValue(noteName)}     >{noteName}{octave}</MenuItem>
        );
    }




    renderMenuSelectSongInstrument(e, onSelectValue) {
        return this.values.getSongInstruments((instrumentID, label) =>
            <MenuItem key={instrumentID} onAction={() => onSelectValue(instrumentID)}  >{label}</MenuItem>
        );
    }

    renderMenuSelectDuration(e, onSelectValue) {
        const customAction = async () => {
            const durationInTicks = await this.openPromptDialog("Enter custom duration in ticks", this.state.trackerQuantizationInTicks);
            onSelectValue(durationInTicks);
        };
        return (<>
            {this.values.getNoteDurations((durationInTicks, durationName) =>
                <MenuItem key={durationInTicks} onAction={() => onSelectValue(durationInTicks)}  >{durationName}</MenuItem>)}
            <MenuItem onAction={customAction} hasBreak >Custom Duration</MenuItem>
        </>);
    }

    renderMenuSelectVelocity(e, onSelectValue) {
        const customAction = async () => {
            const velocity = await this.openPromptDialog("Enter custom velocity in ticks", 100);
            onSelectValue(velocity);
        };
        return (<>
            {this.values.getNoteVelocities((velocity) =>
                <MenuItem key={velocity} onAction={() => onSelectValue(velocity)}  >{velocity}</MenuItem>)}
            <MenuItem onAction={customAction} hasBreak >Custom Velocity</MenuItem>
        </>);
    }


    renderMenuSelectAvailableInstrument(e, onSelectValue, prependString='') {
        return InstrumentLoader.getInstruments().map((config, i) =>
            <MenuItem key={i} onAction={() => onSelectValue(config.className)}       >{prependString}{config.title}</MenuItem>
        );
    }





    renderMenuEdit(e) {

        // const populateGroupCommands = (renderMenuGroup, action) => {
        //     renderMenuGroup.populate = (e) => {
        //         const MENU = e.menuElement;
        //         this.values.getValues('song-groups', (groupName, groupTitle) => {
        //             const renderMenuEditSetCommandGroup = MENU.getOrCreateMenu(groupName, `${groupTitle}`);
        //             renderMenuEditSetCommandGroup.action = action;
        //         });
        //         const menuCustom = MENU.getOrCreateMenu('new', `Create New Group`);
        //         menuCustom.action = e => this.groupAdd(e);
        //         menuCustom.hasBreak = true;
        //     };
        // };

        // renderMenuEditInsertCommand.disabled = selectedIndices.length > 0; // !this.cursorCell;
        // renderMenuEditInsertCommand.action = handleAction('song:new');
        return (<>
            <SubMenuItem options={p => this.renderMenuEditInsert(e)}    >Insert Command</SubMenuItem>

            {this.state.selectedIndices.length === 0 ? null :
                <SubMenuItem options={p => this.renderMenuEditSet(e)} hasBreak   >Set Command</SubMenuItem>}

            <MenuBreak />
            <SubMenuItem options={p => this.renderMenuEditSelect(e)} hasBreak   >Select</SubMenuItem>

            <MenuBreak />
            <SubMenuItem options={p => this.renderMenuEditBatch(e)} hasBreak   >Batch</SubMenuItem>
        </>);
        // const renderMenuEditGroup = MENU.getOrCreateMenu('group', 'Group ►');
        // renderMenuEditGroup.hasBreak = true;
        // renderMenuEditGroup.disabled = true;
    }


    renderMenuEditInsert(e) {
        return (<>
            <SubMenuItem options={p => this.renderMenuEditInsertCommandCurrentOctave(e)}      >Current Octave</SubMenuItem>
            <MenuBreak />
            <SubMenuItem options={p => this.renderMenuEditInsertCommandFrequency(e)}           >By Frequency</SubMenuItem>
            <SubMenuItem options={p => this.renderMenuEditInsertCommandOctave(e)}              >By Octave</SubMenuItem>
            <MenuBreak />
            <SubMenuItem options={p => this.renderMenuEditInsertCommandNamed(e)}               >By Alias</SubMenuItem>
            <SubMenuItem options={p => this.renderMenuEditInsertCommandGroup(e)}               >By Group</SubMenuItem>
            <MenuItem onAction={e => this.instructionInsert(null, true)}   >Custom Command</MenuItem>
        </>);

    }

    renderMenuEditInsertCommandGroup(e) {
        return (<>
            {this.values.getAllSongGroups((groupName) =>
                <MenuItem
                    options={e => this.renderMenuEditInsertCommandFrequency()}
                    disabled={groupName === this.state.selectedGroup}
                    onAction={e => this.instructionInsert('@' + groupName, false)}
                >{groupName}</MenuItem>)}
            <MenuItem
                hasBreak
                onAction={e => this.groupAdd(e)}
            >Create New Group</MenuItem>
        </>);
    }

    renderMenuEditInsertCommandNamed(e) {
        return this.values.getAllNamedFrequencies(
            (noteName, frequency, instrumentID) => <MenuItem
                onAction={e => this.instructionInsert(noteName, false, instrumentID)}
            >{noteName}</MenuItem>
        );

    }

    renderMenuEditInsertCommandFrequency(e) {
        return this.renderMenuSelectCommandByFrequency(e, noteNameOctave => this.instructionInsert(noteNameOctave, false));
    }


    renderMenuEditInsertCommandOctave(e) {
        return this.renderMenuSelectCommandByOctave(e, noteNameOctave => this.instructionInsert(noteNameOctave, false));
    }

    renderMenuEditInsertCommandCurrentOctave(e, octave=null) {
        return this.renderMenuSelectCommandByCurrentOctave(e, (noteNameOctave) => this.instructionInsert(noteNameOctave, false), octave);
    }



    renderMenuEditSet(e) {
        return (<>
            <SubMenuItem options={p => this.renderMenuEditSetCommand(e)}            >Set Command</SubMenuItem>
            <MenuBreak />
            <SubMenuItem options={p => this.renderMenuEditSetInstrument(e)}         >Set Instrument</SubMenuItem>
            <MenuBreak />
            <SubMenuItem options={p => this.renderMenuEditSetDuration(e)}           >Set Duration</SubMenuItem>
            <MenuBreak />
            <SubMenuItem options={p => this.renderMenuEditSetVelocity(e)}           >Set Velocity</SubMenuItem>
            <MenuBreak />
            <MenuItem onAction={e => this.instructionDelete(e)}   >Delete Instruction(s)</MenuItem>
        </>);
    }

    renderMenuEditSetCommand(e) {
        return (<>
            <SubMenuItem options={p => this.renderMenuEditSetCommandCurrentOctave(e)}      >Current Octave</SubMenuItem>
            <MenuBreak />
            <SubMenuItem options={p => this.renderMenuEditSetCommandFrequency(e)}           >By Frequency</SubMenuItem>
            <SubMenuItem options={p => this.renderMenuEditSetCommandOctave(e)}              >By Octave</SubMenuItem>
            <MenuBreak />
            <SubMenuItem options={p => this.renderMenuEditSetCommandNamed(e)}               >By Alias</SubMenuItem>
            <SubMenuItem options={p => this.renderMenuEditSetCommandGroup(e)}               >By Group</SubMenuItem>
            <MenuItem onAction={e => this.instructionReplaceCommand(null, true)}      >Custom</MenuItem>
        </>);

    }

    renderMenuEditSetInstrument(e) {
        return this.values.getSongInstruments((instrumentID, label) =>
            <MenuItem key={instrumentID} onAction={e => this.instructionReplaceInstrument(instrumentID)}  >{label}</MenuItem>
        );
    }

    renderMenuEditSetDuration(e) {
        this.renderMenuSelectDuration(e, durationInTicks => {
            this.instructionReplaceDuration(durationInTicks)
        });
    }

    renderMenuEditSetVelocity(e) {
        return (<>
            {this.values.getNoteVelocities((velocity) =>
                <MenuItem key={velocity} onAction={e => this.instructionReplaceVelocity(velocity)}  >{velocity}</MenuItem>)}
            <MenuItem onAction={e => this.instructionReplaceVelocity(null, true)} hasBreak >Custom Velocity</MenuItem>
        </>);
    }

    renderMenuEditSetCommandFrequency(e) {
        return this.renderMenuSelectCommandByFrequency(e, noteNameOctave => this.instructionReplaceCommand(noteNameOctave, false));
    }

    renderMenuEditSetCommandCurrentOctave(e, octave=null) {
        return this.renderMenuSelectCommandByCurrentOctave(e, (noteNameOctave) => this.instructionReplaceCommand(noteNameOctave, false), octave);
    }

    renderMenuEditSetCommandOctave(e) {
        return this.renderMenuSelectCommandByOctave(e, noteNameOctave => this.instructionReplaceCommand(noteNameOctave, false));
    }


    renderMenuEditSetCommandNamed(e) {
        return this.values.getAllNamedFrequencies((noteName, frequency, instrumentID) =>
            <MenuItem key={noteName} onAction={e => this.instructionReplaceCommand(noteName, false, instrumentID)}                    >{noteName}</MenuItem>
        );
    }

    renderMenuEditSetCommandGroup(e) {
        return (<>
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

    renderMenuEditSelect(e) {
        return (<>
            <MenuItem onAction={e => this.trackerChangeSelection('segment')}      >Select Segment Instructions</MenuItem>
            <MenuItem onAction={e => this.trackerChangeSelection('all')}       >Select All Song Instructions</MenuItem>
            <MenuItem onAction={e => this.trackerChangeSelection('none')}       >Select No Instructions</MenuItem>
            <MenuBreak />
            <SubMenuItem options={p => this.renderMenuEditSelectBatch(e)} hasBreak                        >Batch Select</SubMenuItem>
        </>);

    }

    renderMenuEditSelectBatch(e) {
        return (<>
            {(new Storage()).getBatchRecentSearches().map((recentBatchSearch, i) =>
                <MenuItem onAction={e => this.batchSelect(e, recentBatchSearch, true)}      >New Selection Command</MenuItem>
            )}
            <MenuItem onAction={e => this.batchSelect(e)} hasBreak      >New Selection Command</MenuItem>
        </>);
    }

    renderMenuEditBatch(e) {
        return (<>
            {(new Storage()).getBatchRecentCommands().map((recentBatchCommand, i) =>
                <SubMenuItem options={p => this.renderMenuEditBatchRecent(e, recentBatchCommand)}                          >{recentBatchCommand}</SubMenuItem>
            )}
            <MenuItem onAction={e => this.batchRunCommand(e)} hasBreak      >New Batch Command</MenuItem>
        </>);
    }

    renderMenuEditBatchRecent(e, recentBatchCommand) {
        return (<>
            <MenuItem onAction={e => this.batchRunCommand(e, recentBatchCommand, true)}                   >Execute on Group</MenuItem>
            <SubMenuItem options={p => this.renderMenuEditBatchRecentExecuteSearch(e, recentBatchCommand)}    >Execute using Search</SubMenuItem>
        </>);
    }

    renderMenuEditBatchRecentExecuteSearch(e, recentBatchCommand) {
        return (<>
            <MenuItem onAction={e => this.batchRunCommand(e, recentBatchCommand, null, true)}                   >New Search</MenuItem>
            {(new Storage()).getBatchRecentSearches().map((recentBatchSearch, i) =>
                <MenuItem onAction={e => this.batchRunCommand(e, recentBatchCommand, recentBatchSearch)}                   >{recentBatchSearch}</MenuItem>
            )}
        </>);

    }


    /** Tracker Menu **/

    renderMenuTrackerSetQuantization(e) {
        this.renderMenuSelectDuration(e, duration => {
            this.trackerChangeQuantization(duration);
        });
    }



    renderMenuTrackerSetSegmentLength(e) {
        return this.values.getSegmentLengths((length, title) =>
            <MenuItem key={length} onAction={(e) => this.trackerChangeSegmentLength(length)}>{title}</MenuItem>
        )
    }

    renderMenuTrackerSetInstrumentFilter(e) {
        this.renderMenuSelectSongInstrument(e, instrumentID => this.trackerChangeInstrumentFilter(instrumentID));
    }

    renderMenuTrackerSetOctave(e) {
        return this.renderMenu(e,
            this.values.getNoteOctaves(octave =>
                <MenuItem key={octave} onAction={(e) => this.trackerChangeOctave(octave)}>{octave}</MenuItem>
            )
        );
    }

    /** View Menu **/
    renderMenuView(e) {
        return (<>
            <MenuItem onAction={e => this.toggleFullscreen(e)}       >{this.props.fullscreen ? 'Disable' : 'Enable'} Fullscreen</MenuItem>
            <MenuItem onAction={e => this.togglePanelSong(e)}       >{this.props.hidePanelSongs ? 'Disable' : 'Enable'} Song Forms</MenuItem>
            <MenuItem onAction={e => this.togglePanelTracker(e)}       >{this.props.hidePanelTracker ? 'Disable' : 'Enable'} Tracker Forms</MenuItem>
            <MenuItem onAction={e => this.togglePanelInstruments(e)}       >{this.props.hidePanelInstrument ? 'Disable' : 'Enable'} Instrument Forms</MenuItem>
        </>);

    }

    renderMenuInstrument(e) {
        return (<>
            <MenuItem key="add" options={p => this.renderMenuInstrumentAdd()}    >Add instrument to song</MenuItem>
            <MenuBreak />
            {this.values.getSongInstruments((instrumentID, label) =>
                <MenuItem key={instrumentID} options={p => this.renderMenuInstrumentEdit(instrumentID)}       >{label}</MenuItem>)}
        </>);
    }

    renderMenuInstrumentAdd(e) {
        return InstrumentLoader.getInstruments().map((config, i) =>
            <MenuItem key={i} onAction={e => this.instrumentAdd(config.className)}       >{config.title}</MenuItem>
        );
    }

    renderMenuInstrumentEdit(e, instrumentID) {
        return (<>
            <MenuItem key="replace" options={p => this.renderMenuInstrumentEditReplace(instrumentID)}    >Replace</MenuItem>
            <MenuItem
                key="remove"
                onAction={e => this.instrumentRemove(instrumentID)}
                disabled={!this.song.isInstrumentLoaded(instrumentID)}
            >Remove from song</MenuItem>
        </>);
    }

    renderMenuInstrumentEditReplace(e, instrumentID) {
        return InstrumentLoader.getInstruments().map((config, i) =>
            <MenuItem onAction={e => this.instrumentReplace(instrumentID, config.className)}       >{config.name}</MenuItem>
        );
    }

    renderMenuGroup(e) {
        return (<>
            <MenuItem onAction={e => this.groupAdd(e)} hasBreak     >Add new group</MenuItem>
            <MenuBreak />
            {this.values.getAllSongGroups((groupName) =>
                <MenuItem
                    key={groupName}
                    disabled={groupName === this.state.selectedGroup}
                    options={p => this.renderMenuGroupEdit(groupName)}
                >{groupName}</MenuItem>)}
        </>);
    }

    renderMenuGroupEdit(e, groupName) {

        // const groupName = menuParam;
        return (<>
            <MenuItem onAction={e => this.groupRename(groupName)} hasBreak     >Rename group {groupName}</MenuItem>
            <MenuItem onAction={e => this.groupRemove(groupName)} hasBreak     >Delete group {groupName}</MenuItem>
        </>);
    }

}


export default ComposerMenu;
