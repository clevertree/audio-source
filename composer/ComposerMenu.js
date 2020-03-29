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
            <MenuDropDown {...props} options={p => this.renderMenuFile(p)}          >File</MenuDropDown>
            <MenuDropDown {...props} options={p => this.renderMenuEdit(p)}          >Edit</MenuDropDown>
            <MenuDropDown {...props} options={p => this.renderMenuGroup(p)}         >Group</MenuDropDown>
            <MenuDropDown {...props} options={p => this.renderMenuInstrument(p)}    >Instrument</MenuDropDown>
            <MenuDropDown {...props} options={p => this.renderMenuView(p)}          >View</MenuDropDown>
        </>);
    }

    renderMenuFile(e) {
        return (<>
            <MenuAction onAction={e => this.loadNewSongData(e)}             >New song</MenuAction>
            <MenuDropDown    options={p => this.renderMenuFileOpen(p)}           >Open song</MenuDropDown>
            <MenuDropDown    options={p => this.renderMenuFileSave(p)}           >Save song</MenuDropDown>
            <MenuDropDown    options={p => this.renderMenuFileImport(p)}         >Import song</MenuDropDown>
            <MenuDropDown    options={p => this.renderMenuFileExport(p)}         >Export song</MenuDropDown>
        </>);
    }


    renderMenuFileOpen(e) {
        return (<>
            <MenuDropDown    options={p => this.renderMenuFileOpenMemory(p)}     >Import song</MenuDropDown>
            <MenuAction onAction={e => this.openSongFromFileDialog(e)}      >from File</MenuAction>
            <MenuAction onAction={e => this.loadSongFromURL(e)}             >from URL</MenuAction>
        </>);
    }

    renderMenuFileSave(e) {
        return (<>
            <MenuAction onAction={e => this.saveSongToMemory(e)}                        >to Memory</MenuAction>
            <MenuAction onAction={e => this.saveSongToFile(e)}                          >to File</MenuAction>
        </>);

    }

    renderMenuFileImport(e) {
        return (<>
            <MenuAction onAction={e => this.openSongFromFileDialog('.mid,.midi')}          >from MIDI File</MenuAction>
        </>);
        // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
        // renderMenuFileImportSongFromMIDI.action = (e) => this.onAction('song:load-from-midi-file');
        // renderMenuFileImportSongFromMIDI.disabled = true;

    }

    renderMenuFileExport(e) {
        return (<>
            <MenuAction disabled>to MIDI File</MenuAction>
        </>);

    }

    renderMenuFileOpenMemory(e) {
        const storage = new Storage();
        const songRecentUUIDs = storage.getRecentSongList() ;
        return songRecentUUIDs.length > 0
            ? songRecentUUIDs.map((entry, i) =>
                <MenuAction
                    key={i}
                    onAction={(e) => this.loadSongFromMemory(entry.uuid)}
                >{entry.name || entry.uuid}</MenuAction>)
            :<MenuAction
                key="no-recent"
                disabled
            >No Songs Available</MenuAction>
        ;
    }


    /** Deep selection menus **/


    renderMenuSelectCommand(onSelectValue) {
        return (<>
            <MenuDropDown options={p => this.renderMenuSelectCommandByCurrentOctave(p, onSelectValue)}      >Current Octave</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={p => this.renderMenuSelectCommandByFrequency(p, onSelectValue)}           >By Frequency</MenuDropDown>
            <MenuDropDown options={p => this.renderMenuSelectCommandByOctave(p, onSelectValue)}              >By Octave</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={p => this.renderMenuSelectCommandByNamed(p, onSelectValue)}               >By Alias</MenuDropDown>
            <MenuDropDown options={p => this.renderMenuSelectCommandByGroup(p, onSelectValue)}               >By Group</MenuDropDown>
            <MenuAction onAction={async e => onSelectValue(await this.openPromptDialog("Insert custom command"))}      >Custom Command</MenuAction>
        </>);

    }


    renderMenuSelectCommandByCurrentOctave(onSelectValue, octave=null) {
        octave = octave !== null ? octave : this.state.trackerCurrentOctave;
        return this.values.getNoteFrequencies((noteName) =>
            <MenuAction key={noteName} onAction={e => onSelectValue(`${noteName}${octave}`)}     >{noteName}{octave}</MenuAction>
        );
    }


    renderMenuSelectCommandByFrequency(onSelectValue) {
        return this.values.getNoteFrequencies((noteName) =>
            <MenuDropDown key={noteName} options={p => this.renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName)}                   >{noteName}</MenuDropDown>
        );
    }

    renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName) {
        return this.values.getNoteOctaves((octave) =>
            <MenuAction key={octave} onAction={() => onSelectValue(octave)}     >{noteName}{octave}</MenuAction>
        );
    }

    renderMenuSelectCommandByOctave(onSelectValue) {
        return this.values.getNoteOctaves((octave) =>
            <MenuDropDown key={octave} options={p => this.renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave)}                   >{octave}</MenuDropDown>
        );
    }

    renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave) {
        return this.values.getNoteFrequencies((noteName) =>
            <MenuAction key={noteName} onAction={() => onSelectValue(noteName)}     >{noteName}{octave}</MenuAction>
        );
    }




    renderMenuSelectSongInstrument(onSelectValue) {
        return this.values.getSongInstruments((instrumentID, label) =>
            <MenuAction key={instrumentID} onAction={() => onSelectValue(instrumentID)}  >{label}</MenuAction>
        );
    }

    renderMenuSelectDuration(onSelectValue) {
        const customAction = async () => {
            const durationInTicks = await this.openPromptDialog("Enter custom duration in ticks", this.state.trackerQuantizationInTicks);
            onSelectValue(durationInTicks);
        };
        return (<>
            {this.values.getNoteDurations((durationInTicks, durationName) =>
                <MenuAction key={durationInTicks} onAction={() => onSelectValue(durationInTicks)}  >{durationName}</MenuAction>)}
            <MenuAction onAction={customAction} hasBreak >Custom Duration</MenuAction>
        </>);
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
            <MenuDropDown options={p => this.renderMenuEditInsert(e)}    >Insert Command</MenuDropDown>

            {this.state.selectedIndices.length === 0 ? null :
                <MenuDropDown options={p => this.renderMenuEditSet(e)} hasBreak   >Set Command</MenuDropDown>}

            <MenuBreak />
            <MenuDropDown options={p => this.renderMenuEditSelect(e)} hasBreak   >Select</MenuDropDown>

            <MenuBreak />
            <MenuDropDown options={p => this.renderMenuEditBatch(e)} hasBreak   >Batch</MenuDropDown>
        </>);
        // const renderMenuEditGroup = MENU.getOrCreateMenu('group', 'Group ►');
        // renderMenuEditGroup.hasBreak = true;
        // renderMenuEditGroup.disabled = true;
    }


    renderMenuEditInsert(e) {
        return (<>
            <MenuDropDown options={p => this.renderMenuEditInsertCommandCurrentOctave(e)}      >Current Octave</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={p => this.renderMenuEditInsertCommandFrequency(e)}           >By Frequency</MenuDropDown>
            <MenuDropDown options={p => this.renderMenuEditInsertCommandOctave(e)}              >By Octave</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={p => this.renderMenuEditInsertCommandNamed(e)}               >By Alias</MenuDropDown>
            <MenuDropDown options={p => this.renderMenuEditInsertCommandGroup(e)}               >By Group</MenuDropDown>
            <MenuAction onAction={e => this.instructionInsert(null, true)}   >Custom Command</MenuAction>
        </>);

    }

    renderMenuEditInsertCommandGroup(e) {
        return (<>
            {this.values.getAllSongGroups((groupName) =>
                <MenuAction
                    options={e => this.renderMenuEditInsertCommandFrequency()}
                    disabled={groupName === this.state.selectedGroup}
                    onAction={e => this.instructionInsert('@' + groupName, false)}
                >{groupName}</MenuAction>)}
            <MenuAction
                hasBreak
                onAction={e => this.groupAdd(e)}
            >Create New Group</MenuAction>
        </>);
    }

    renderMenuEditInsertCommandNamed(e) {
        return this.values.getAllNamedFrequencies(
            (noteName, frequency, instrumentID) => <MenuAction
                onAction={e => this.instructionInsert(noteName, false, instrumentID)}
            >{noteName}</MenuAction>
        );

    }

    renderMenuEditInsertCommandFrequency(e) {
        return this.renderMenuSelectCommandByFrequency(noteNameOctave => this.instructionInsert(noteNameOctave, false));
    }


    renderMenuEditInsertCommandOctave(e) {
        return this.renderMenuSelectCommandByOctave(noteNameOctave => this.instructionInsert(noteNameOctave, false));
    }

    renderMenuEditInsertCommandCurrentOctave(octave=null) {
        return this.renderMenuSelectCommandByCurrentOctave((noteNameOctave) => this.instructionInsert(noteNameOctave, false), octave);
    }



    renderMenuEditSet(e) {
        return (<>
            <MenuDropDown options={p => this.renderMenuEditSetCommand(e)}            >Set Command</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={p => this.renderMenuEditSetInstrument(e)}         >Set Instrument</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={p => this.renderMenuEditSetDuration(e)}           >Set Duration</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={p => this.renderMenuEditSetVelocity(e)}           >Set Velocity</MenuDropDown>
            <MenuBreak />
            <MenuAction onAction={e => this.instructionDelete(e)}   >Delete Instruction(s)</MenuAction>
        </>);
    }

    renderMenuEditSetCommand(e) {
        return (<>
            <MenuDropDown options={p => this.renderMenuEditSetCommandCurrentOctave(e)}      >Current Octave</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={p => this.renderMenuEditSetCommandFrequency(e)}           >By Frequency</MenuDropDown>
            <MenuDropDown options={p => this.renderMenuEditSetCommandOctave(e)}              >By Octave</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={p => this.renderMenuEditSetCommandNamed(e)}               >By Alias</MenuDropDown>
            <MenuDropDown options={p => this.renderMenuEditSetCommandGroup(e)}               >By Group</MenuDropDown>
            <MenuAction onAction={e => this.instructionReplaceCommand(null, true)}      >Custom</MenuAction>
        </>);

    }

    renderMenuEditSetInstrument(e) {
        return this.values.getSongInstruments((instrumentID, label) =>
            <MenuAction key={instrumentID} onAction={e => this.instructionReplaceInstrument(instrumentID)}  >{label}</MenuAction>
        );
    }

    renderMenuEditSetDuration(e) {
        this.renderMenuSelectDuration(durationInTicks => {
            this.instructionReplaceDuration(durationInTicks)
        });
    }

    renderMenuEditSetVelocity(e) {
        return (<>
            {this.values.getNoteVelocities((velocity) =>
                <MenuAction key={velocity} onAction={e => this.instructionReplaceVelocity(velocity)}  >{velocity}</MenuAction>)}
            <MenuAction onAction={e => this.instructionReplaceVelocity(null, true)} hasBreak >Custom Velocity</MenuAction>
        </>);
    }

    renderMenuEditSetCommandFrequency(e) {
        return this.renderMenuSelectCommandByFrequency(noteNameOctave => this.instructionReplaceCommand(noteNameOctave, false));
    }

    renderMenuEditSetCommandCurrentOctave(octave=null) {
        return this.renderMenuSelectCommandByCurrentOctave((noteNameOctave) => this.instructionReplaceCommand(noteNameOctave, false), octave);
    }

    renderMenuEditSetCommandOctave(e) {
        return this.renderMenuSelectCommandByOctave(noteNameOctave => this.instructionReplaceCommand(noteNameOctave, false));
    }


    renderMenuEditSetCommandNamed(e) {
        return this.values.getAllNamedFrequencies((noteName, frequency, instrumentID) =>
            <MenuAction key={noteName} onAction={e => this.instructionReplaceCommand(noteName, false, instrumentID)}                    >{noteName}</MenuAction>
        );
    }

    renderMenuEditSetCommandGroup(e) {
        return (<>
            {this.values.getAllSongGroups((groupName) =>
                groupName === this.groupName ? null :
                    <MenuAction
                        key={groupName}
                        disabled={groupName === this.state.selectedGroup}
                        onAction={e => this.instructionReplaceCommand('@' + groupName, false)}
                    >{groupName}</MenuAction>
            )}
            <MenuAction onAction={e => this.groupAdd()} hasBreak  >Create New Group</MenuAction>
        </>);
    }

    renderMenuEditSelect(e) {
        return (<>
            <MenuAction onAction={e => this.trackerChangeSelection('segment')}      >Select Segment Instructions</MenuAction>
            <MenuAction onAction={e => this.trackerChangeSelection('all')}       >Select All Song Instructions</MenuAction>
            <MenuAction onAction={e => this.trackerChangeSelection('none')}       >Select No Instructions</MenuAction>
            <MenuBreak />
            <MenuDropDown options={p => this.renderMenuEditSelectBatch(e)} hasBreak                        >Batch Select</MenuDropDown>
        </>);

    }

    renderMenuEditSelectBatch(e) {
        return (<>
            {(new Storage()).getBatchRecentSearches().map((recentBatchSearch, i) =>
                <MenuAction onAction={e => this.batchSelect(recentBatchSearch, true)}      >New Selection Command</MenuAction>
            )}
            <MenuAction onAction={e => this.batchSelect(e)} hasBreak      >New Selection Command</MenuAction>
        </>);
    }

    renderMenuEditBatch(e) {
        return (<>
            {(new Storage()).getBatchRecentCommands().map((recentBatchCommand, i) =>
                <MenuDropDown options={p => this.renderMenuEditBatchRecent(recentBatchCommand)}                          >{recentBatchCommand}</MenuDropDown>
            )}
            <MenuAction onAction={e => this.batchRunCommand(e)} hasBreak      >New Batch Command</MenuAction>
        </>);
    }

    renderMenuEditBatchRecent(recentBatchCommand) {
        return (<>
            <MenuAction onAction={e => this.batchRunCommand(recentBatchCommand, true)}                   >Execute on Group</MenuAction>
            <MenuDropDown options={p => this.renderMenuEditBatchRecentExecuteSearch(recentBatchCommand)}    >Execute using Search</MenuDropDown>
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

    renderMenuTrackerSetQuantization(e) {
        this.renderMenuSelectDuration(duration => {
            this.trackerChangeQuantization(duration);
        });
    }



    renderMenuTrackerSetSegmentLength(e) {
        return this.values.getSegmentLengths((length, title) =>
            <MenuAction key={length} onAction={(e) => this.trackerChangeSegmentLength(length)}>{title}</MenuAction>
        )
    }

    renderMenuTrackerSetInstrumentFilter(e) {
        this.renderMenuSelectSongInstrument(instrumentID => this.trackerChangeInstrumentFilter(instrumentID));
    }

    renderMenuTrackerSetOctave(e) {
        return this.renderMenu(e,
            this.values.getNoteOctaves(octave =>
                <MenuAction key={octave} onAction={(e) => this.trackerChangeOctave(octave)}>{octave}</MenuAction>
            )
        );
    }

    /** View Menu **/
    renderMenuView(e) {
        return (<>
            <MenuAction onAction={e => this.toggleFullscreen(e)}       >{this.props.fullscreen ? 'Disable' : 'Enable'} Fullscreen</MenuAction>
            <MenuAction onAction={e => this.togglePanelSong(e)}       >{this.props.hidePanelSongs ? 'Disable' : 'Enable'} Song Forms</MenuAction>
            <MenuAction onAction={e => this.togglePanelTracker(e)}       >{this.props.hidePanelTracker ? 'Disable' : 'Enable'} Tracker Forms</MenuAction>
            <MenuAction onAction={e => this.togglePanelInstruments(e)}       >{this.props.hidePanelInstrument ? 'Disable' : 'Enable'} Instrument Forms</MenuAction>
        </>);

    }

    renderMenuInstrument(e) {
        return (<>
            <MenuAction key="add" options={p => this.renderMenuInstrumentAdd()}    >Add instrument to song</MenuAction>
            <MenuBreak />
            {this.values.getSongInstruments((instrumentID, label) =>
                <MenuAction key={instrumentID} options={p => this.renderMenuInstrumentEdit(instrumentID)}       >{label}</MenuAction>)}
        </>);
    }

    renderMenuInstrumentAdd(e) {
        return InstrumentLoader.getInstruments().map((config, i) =>
            <MenuAction key={i} onAction={e => this.instrumentAdd(config.className)}       >{config.title}</MenuAction>
        );
    }

    renderMenuInstrumentEdit(instrumentID) {
        return (<>
            <MenuAction key="replace" options={p => this.renderMenuInstrumentEditReplace(instrumentID)}    >Replace</MenuAction>
            <MenuAction
                key="remove"
                onAction={e => this.instrumentRemove(instrumentID)}
                disabled={!this.song.isInstrumentLoaded(instrumentID)}
            >Remove from song</MenuAction>
        </>);
    }

    renderMenuInstrumentEditReplace(instrumentID) {
        return InstrumentLoader.getInstruments().map((config, i) =>
            <MenuAction onAction={e => this.instrumentReplace(instrumentID, config.className)}       >{config.name}</MenuAction>
        );
    }

    renderMenuGroup(e) {
        return (<>
            <MenuAction onAction={e => this.groupAdd(e)} hasBreak     >Add new group</MenuAction>
            <MenuBreak />
            {this.values.getAllSongGroups((groupName) =>
                <MenuAction
                    key={groupName}
                    disabled={groupName === this.state.selectedGroup}
                    options={p => this.renderMenuGroupEdit(groupName)}
                >{groupName}</MenuAction>)}
        </>);
    }

    renderMenuGroupEdit(groupName) {

        // const groupName = menuParam;
        return (<>
            <MenuAction onAction={e => this.groupRename(groupName)} hasBreak     >Rename group {groupName}</MenuAction>
            <MenuAction onAction={e => this.groupRemove(groupName)} hasBreak     >Delete group {groupName}</MenuAction>
        </>);
    }

}


export default ComposerMenu;
