import React from "react";
import {ASUIMenuItem, ASUIMenuAction, ASUIMenuDropDown, ASUIMenuBreak} from "../components";
import {ClientStorage, ProgramLoader} from "../song";
import InstructionProcessor from "../common/program/InstructionProcessor";
import ASComposerRenderer from "./ASComposerRenderer";

class ASComposerMenu extends ASComposerRenderer {
    constructor(props) {
        super(props);
        this.cb.menu = {
            'root':     () => this.renderRootMenu(),
            'file':     () => this.renderMenuFile(),
            'edit':     () => this.renderMenuEdit(),
            'track':    () => this.renderMenuTrack(),
            'program':  () => this.renderMenuProgram(),
            'playback': () => this.renderMenuPlayback(),
            'view':     () => this.renderMenuView(),
        }
    }

    renderMenuByKey(menuName) {
        return this.cb.menu[menuName] || this.cb.menu.root;
    }

    renderRootMenu(ref={}) {
        const props = {
            vertical: !this.state.portrait,
            openOnHover: false,
        };
        if(!this.state.portrait)
            props.arrow = false;
        return (<>
            <ASUIMenuDropDown {...props} ref={ref.file} options={this.cb.menu.file}          >File</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} ref={ref.edit} options={this.cb.menu.edit}          >Edit</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} ref={ref.track} options={this.cb.menu.track}        >Track</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} ref={ref.program} options={this.cb.menu.program}    >Program</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} ref={ref.playback} options={this.cb.menu.playback}  >Playback</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} ref={ref.view} options={this.cb.menu.view}          >View</ASUIMenuDropDown>
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
        const storage = new ClientStorage();
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
    renderMenuSelectFrequency(onSelectValue, currentCommand=null) {
        return this.values.renderMenuSelectFrequency(onSelectValue, currentCommand || this.state.currentCommand);
    }

    // renderMenuSelectFrequencyOctave(onSelectValue, noteName) {
    //     return this.values.renderMenuSelectFrequencyOctave(onSelectValue, noteName);
    // }

    /** @deprecated **/
    renderMenuSelectFrequencyByOctave(onSelectValue, currentCommand=null) {
        return this.values.renderMenuSelectFrequencyByOctave(onSelectValue, currentCommand || this.state.currentCommand);
    }

    // renderMenuSelectFrequencyByOctaveFrequency(onSelectValue, octave) {
    //     return this.values.renderMenuSelectFrequencyByOctaveFrequency(onSelectValue, octave);
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
        // const activeTrack = this.trackGetState(selectedTrackName);
        if(selectedIndices === null)
            selectedIndices = this.state.selectedTrackIndices;
        let firstInstructionData = null, trackName=null;
        if(selectedIndices.length > 0) {
            firstInstructionData = this.getSong().instructionDataGetByIndex(this.getSelectedTrackName(), selectedIndices[0]);
            trackName = new InstructionProcessor(firstInstructionData).isTrackCommand();
        }

        return (<>
            {trackName ?
                <>
                    <ASUIMenuAction onAction={() => this.trackSelectActive(trackName, null, true)}>{`Select Track '${trackName}'`}</ASUIMenuAction>
                    <ASUIMenuBreak />
                </>
            : null}

            <ASUIMenuDropDown
                options={() => this.renderMenuEditInsert(null, true)}
                children="Insert Command"
            />

            <ASUIMenuBreak />
            {selectedIndices.length === 0
                ? <ASUIMenuItem disabled>No Selection</ASUIMenuItem>
                : this.renderMenuEditInstruction(null)}

            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuEditTrackSelectIndices()}   >Select</ASUIMenuDropDown>


            <ASUIMenuBreak />
            <ASUIMenuAction onAction={() => this.instructionCutSelected()} disabled={selectedIndices.length===0}    >Cut</ASUIMenuAction>
            <ASUIMenuAction onAction={() => this.instructionCopySelected()} disabled={selectedIndices.length===0}   >Copy</ASUIMenuAction>
            <ASUIMenuAction onAction={() => this.instructionPasteAtCursor()} disabled={!this.state.clipboard}       >Paste</ASUIMenuAction>
            <ASUIMenuAction onAction={() => this.instructionDeleteIndices()} disabled={selectedIndices.length===0}  >Delete</ASUIMenuAction>


        </>);
    }
/*<ASUIMenuBreak />*/
/*<ASUIMenuDropDown options={() => this.renderMenuEditBatch()}   >Batch</ASUIMenuDropDown>*/


    renderMenuEditInsert(trackName=null, before=false) {
        return this.values.renderMenuSelectCommand(async newCommand => {
                // before
                //     ? this.instructionInsertAtCursor(trackName, newCommand)
                    this.instructionInsertAtCursor(trackName, newCommand);
            },
            // this.state.selectedInstructionData[1],
            // "New Command"
        );
    }


    renderMenuEditInstruction(title='Edit Instruction') {
        // console.log('renderMenuEditInstruction', selectedIndices);

        // if(selectedIndices === null)
        //     selectedIndices = this.state.selectedTrackIndices;
        // if(!selectedIndices || selectedIndices.length === 0)
        //     throw new Error(`No indices selected: ${selectedIndices === null ? 'null' : typeof selectedIndices}`);

        const instructionData = this.state.selectedInstructionData;
        const processor = new InstructionProcessor(instructionData);
        // eslint-disable-next-line no-unused-vars
        const [commandString, argTypeList] = processor.processInstructionArgs();

        let argIndex = 0;
        const content = [];
        if(title) {
            content.push(
                <ASUIMenuItem key={-1}>{title}</ASUIMenuItem>,
                <ASUIMenuBreak key={-2} />,
            )
        }
        content.push(
            <ASUIMenuDropDown key={0} options={() => this.renderMenuEditInstructionCommand()}>Edit Command</ASUIMenuDropDown>,
        );

        argTypeList.forEach((argType, i) => {
            if(!argType.consumesArgument)
                return null;
            argIndex++;
            let paramValue = instructionData[argIndex];
            content.push(
                this.renderMenuEditInstructionArg(instructionData, argType, argIndex, paramValue)
            );
        });
        return content;
    }

    renderMenuEditInstructionArg(instructionData, argType, argIndex, paramValue, onSelectValue=null, title=null) {
        title = title || argType.title || "Unknown Arg";

        return <ASUIMenuDropDown
            key={argIndex}
            options={() => this.renderMenuEditInstructionArgOptions(instructionData, argType, argIndex, paramValue, onSelectValue)}
            children={`Edit ${title}`}
        />
    }

    renderMenuEditInstructionArgOptions(instructionData, argType, argIndex, paramValue, onSelectValue=null) {
        if(onSelectValue === null) {
            onSelectValue = (newArgValue) => {
                // this.instructionReplaceArg(this.getSelectedTrackName(), this.state.selectedTrackIndices, argIndex, newArgValue);
                this.instructionReplaceArgByType(this.getSelectedTrackName(), this.state.selectedTrackIndices, argType, newArgValue);
            }
        }
        return this.values.renderMenuEditInstructionArgOptions(instructionData, argType, argIndex, paramValue, onSelectValue);
    }

    renderMenuEditInstructionCommand() {
        const instructionData = this.state.selectedInstructionData;
        return this.values.renderMenuSelectCommand(selectedCommand => {
            this.instructionReplaceArg(this.getSelectedTrackName(), this.state.selectedTrackIndices, 1, selectedCommand);
        }, instructionData[1])
    }

    /** Track Menu **/


    renderMenuEditTrackSelectIndices() {
        const selectedTrack = this.getSelectedTrackName();
        let cursorIndex = null;
        if(!this.trackHasActive(selectedTrack))
            return <ASUIMenuItem>{`Track is not active: ${selectedTrack}`}</ASUIMenuItem>
        const activeTrack = this.trackGetState(selectedTrack);
        // const cursorInfo = activeTrack.getCursorInfo(); // TODO: move?
        // console.log('cursorInfo', cursorInfo)
        cursorIndex = null; // cursorInfo.cursorIndex;
        return (<>
            <ASUIMenuAction onAction={e => activeTrack.selectIndices('segment')}      >Select Segment</ASUIMenuAction>
            <ASUIMenuAction onAction={e => activeTrack.selectIndices('row')}       >Select Row</ASUIMenuAction>
            <ASUIMenuAction onAction={e => activeTrack.selectIndices('all')}       >Select Track</ASUIMenuAction>
            <ASUIMenuAction onAction={e => activeTrack.selectIndices('cursor')} disabled={cursorIndex === null}>Select Cursor</ASUIMenuAction>
            <ASUIMenuAction onAction={e => activeTrack.selectIndices('none')}       >Clear Selection</ASUIMenuAction>
            <ASUIMenuBreak />
            <ASUIMenuDropDown disabled options={() => this.renderMenuEditTrackSelectIndicesBatch()}                        >Batch Select</ASUIMenuDropDown>
        </>);

    }

    async renderMenuEditTrackSelectIndicesBatch() {
        const recentSearches = await (new ClientStorage()).getBatchRecentSearches();
        return (<>
            {recentSearches.map((recentBatchSearch, i) =>
                <ASUIMenuAction onAction={e => this.batchSelect(recentBatchSearch, true)}      >New Selection Command</ASUIMenuAction>
            )}
            <ASUIMenuAction onAction={e => this.batchSelect(e)}      >New Selection Command</ASUIMenuAction>
        </>);
    }

    async renderMenuEditBatch() {
        const recentCommands = await (new ClientStorage()).getBatchRecentCommands();
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
            {(new ClientStorage()).getBatchRecentSearches().map((recentBatchSearch, i) =>
                <ASUIMenuAction onAction={e => this.batchRunCommand(recentBatchCommand, recentBatchSearch)}                   >{recentBatchSearch}</ASUIMenuAction>
            )}
        </>);

    }


    /** View Menu **/

    renderMenuView() {
        const viewModes = this.state.viewModes;
        return (<>
            <ASUIMenuAction onAction={e => this.toggleFullscreen(e)}                >{this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen</ASUIMenuAction>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={e => this.renderMenuViewOptions('panel:song')}>Song Panel</ASUIMenuDropDown>
            <ASUIMenuDropDown options={e => this.renderMenuViewOptions('panel:tracks')}>Track Panel</ASUIMenuDropDown>
            <ASUIMenuDropDown options={e => this.renderMenuViewOptions('panel:instruction')}>Instruction Panel</ASUIMenuDropDown>
            <ASUIMenuDropDown options={e => this.renderMenuViewOptions('panel:programs')}>Program Panel</ASUIMenuDropDown>
            <ASUIMenuBreak />
            <ASUIMenuAction onAction={e => this.toggleTrackRowPositionInTicks()}    >Track Position {this.state.showTrackRowPositionInTicks ? 'Formatted' : 'as Ticks'}</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.toggleTrackRowDurationInTicks()}    >Track Duration {this.state.showTrackRowDurationInTicks ? 'Formatted' : 'as Ticks'}</ASUIMenuAction>
        </>);

    }

    renderMenuViewOptions(viewKey) {
        const viewMode = this.state.viewModes[viewKey];
        return (<>
            <ASUIMenuAction disabled={typeof viewMode === "undefined"} onAction={e => this.setViewMode(viewKey, null)} >Show</ASUIMenuAction>
            <ASUIMenuAction disabled={viewMode === 'minimize'} onAction={e => this.setViewMode(viewKey, 'minimize')} >Minimize</ASUIMenuAction>
            <ASUIMenuAction disabled={viewMode === 'none'} onAction={e => this.setViewMode(viewKey, 'none')} >Hide</ASUIMenuAction>
            <ASUIMenuAction disabled={viewMode === 'float'} onAction={e => this.setViewMode(viewKey, 'float')} >Float Right</ASUIMenuAction>
        </>);

    }

    /** Playback Menu **/

    renderMenuPlayback() {
        return (<>
            <ASUIMenuAction onAction={e => this.togglePlaybackOnSelection(e)} >{this.state.playbackOnSelect ? '☑' : '☐'} Play on Select</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.togglePlaybackOnChange(e)} >{this.state.playbackOnChange ? '☑' : '☐'} Play on Change</ASUIMenuAction>
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

    renderMenuProgramAdd(menuTitle= "Add new Program") {
        return (<>
            <ASUIMenuItem>{menuTitle}</ASUIMenuItem><ASUIMenuBreak/>
            {ProgramLoader.getRegisteredPrograms().map((config, i) =>
                <ASUIMenuAction key={i} onAction={e => this.programAdd(config.className)}       >{config.title}</ASUIMenuAction>
            )}
        </>);
    }

    renderMenuProgramEdit(programID, menuTitle=null) {
        if(menuTitle === null) {
            const [className, config] = this.song.programGetData(programID);
            menuTitle = `${programID}: ${config.title || "No Title"} (${className})`;
        }
        return (<>
            <ASUIMenuItem>{menuTitle}</ASUIMenuItem><ASUIMenuBreak/>
            <ASUIMenuAction onAction={() => {}} disabled>Select</ASUIMenuAction>
            <ASUIMenuDropDown key="replace" options={() => this.renderMenuProgramEditReplace(programID)}    >Replace with</ASUIMenuDropDown>
            <ASUIMenuAction
                key="remove"
                onAction={e => this.programRemove(programID)}
                disabled={!this.song.hasProgram(programID)}
            >Remove from song</ASUIMenuAction>
        </>);
    }

    renderMenuProgramEditReplace(programID) {
        return ProgramLoader.getRegisteredPrograms().map((config, i) =>
            <ASUIMenuAction key={i} onAction={e => this.programReplacePrompt(programID, config.className)}       >{config.title}</ASUIMenuAction>
        );
    }

    renderMenuTrack() {
        return (<>
            <ASUIMenuAction onAction={e => this.trackAdd()}     >Add new track</ASUIMenuAction>
            <ASUIMenuBreak />
            {this.values.getAllSongTracks((trackName) =>
                <ASUIMenuDropDown
                    key={trackName}
                    // disabled={trackName === this.getSelectedTrackName()}
                    options={() => this.renderMenuTrackEdit(trackName)}
                >{trackName}</ASUIMenuDropDown>)}
        </>);
    }

    renderMenuTrackEdit(trackName) {

        // const trackName = menuParam;
        return (<>
            <ASUIMenuItem>{`Track: '${trackName}'`}</ASUIMenuItem><ASUIMenuBreak />
            <ASUIMenuAction onAction={e => this.trackSelectActive(trackName)}   >Select Track</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackRename(trackName)}         >Rename Track</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackRemove(trackName)}         >Delete Track</ASUIMenuAction>
        </>);
    }



}


export default ASComposerMenu;
