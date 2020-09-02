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
            'options':     () => this.renderMenuOptions(),
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
            <ASUIMenuDropDown {...props} ref={ref.track} options={this.cb.menu.track}        >Tracks</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} ref={ref.program} options={this.cb.menu.program}    >Program</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} ref={ref.playback} options={this.cb.menu.playback}  >Playback</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} ref={ref.view} options={this.cb.menu.view}          >View</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} ref={ref.view} options={this.cb.menu.options}       >Options</ASUIMenuDropDown>
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

    // /** @deprecated **/
    // renderMenuSelectCommand(onSelectValue, currentCommand=null, title= null, additionalMenuItems=null) {
    //     return this.values.renderMenuSelectCommand(onSelectValue, currentCommand || this.state.currentCommand, title, additionalMenuItems)
    // }



    // renderMenuSelectFrequencyByOctave(onSelectValue, currentCommand=null) {
    //     return this.values.renderMenuSelectFrequencyByOctave(onSelectValue, currentCommand || this.state.currentCommand);
    // }

    // renderMenuSelectFrequencyByOctaveFrequency(onSelectValue, octave) {
    //     return this.values.renderMenuSelectFrequencyByOctaveFrequency(onSelectValue, octave);
    // }




    // /** @deprecated **/
    // renderMenuSelectSongProgram(onSelectValue) {
    //     return this.values.getSongPrograms((programID, programClass, programInfo) =>
    //         <ASUIMenuAction key={programID} onAction={() => onSelectValue(programID)}  >{programID}: {programInfo.title || programClass}</ASUIMenuAction>
    //     );
    // }



    // renderMenuSelectAvailableProgram(onSelectValue, menuTitle=null) {
    //     return this.values.renderMenuSelectAvailableProgram(onSelectValue, menuTitle);
    // }

    renderMenuInsert() {
        // TODO:
    }

    /** Edit Menu **/

    renderMenuEdit() {
        const {selectedIndices} = this.getTrackPanelState()
        // const selectedTrackName = this.state.selectedTrack;
        // const activeTrack = this.trackGetState(selectedTrackName);
        let firstInstructionData = null, trackName=null;
        if(selectedIndices.length > 0) {
            firstInstructionData = this.getSong().instructionDataGetByIndex(this.getSelectedTrackName(), selectedIndices[0]);
            trackName = new InstructionProcessor(firstInstructionData).isTrackCommand();
        }

        return (<>
            {trackName ?
                <>
                    <ASUIMenuAction onAction={() => this.trackSelect(trackName)}>{`Select Track '${trackName}'`}</ASUIMenuAction>
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


    renderMenuEditInsert(trackName=null) {
        return this.values.renderMenuSelectCommand((commandString, params) => {
            this.instructionInsertAtSelectedTrackCursor(trackName, commandString, params);
        });
    }


    renderMenuEditInstruction(title='Edit Instruction') {
        // if(!selectedIndices || selectedIndices.length === 0)
        //     throw new Error(`No indices selected: ${selectedIndices === null ? 'null' : typeof selectedIndices}`);

        const {selectedInstructionData} = this.getTrackPanelState()
        const processor = new InstructionProcessor(selectedInstructionData);
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
            <ASUIMenuDropDown key={0} options={() => this.renderMenuEditInstructionCommand()}>Change Command</ASUIMenuDropDown>,
        );

        argTypeList.forEach((argType, i) => {
            if(!argType.consumesArgument)
                return null;
            argIndex++;
            let paramValue = selectedInstructionData[argIndex];
            content.push(
                this.renderMenuEditInstructionArg(selectedInstructionData, argType, argIndex, paramValue)
            );
        });
        console.log('renderMenuEditInstruction', argTypeList);
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
        const {selectedIndices} = this.getTrackPanelState()
        if(onSelectValue === null) {
            onSelectValue = (newArgValue) => {
                this.instructionReplaceArgByType(this.getSelectedTrackName(), selectedIndices, argType, newArgValue);
            }
        }
        return this.values.renderMenuEditInstructionArgOptions(instructionData, argType, argIndex, paramValue, onSelectValue);
    }

    renderMenuEditInstructionCommand() {
        const {selectedIndices, selectedInstructionData} = this.getTrackPanelState()
        return this.values.renderMenuSelectCommand(selectedCommand => {
            this.instructionReplaceArg(this.getSelectedTrackName(), selectedIndices, 1, selectedCommand);
        }, selectedInstructionData[1])
    }

    /** Track Menu **/


    renderMenuEditTrackSelectIndices() {
        const selectedTrack = this.getSelectedTrackName();
        let cursorIndex = null;
        // const cursorInfo = activeTrack.getCursorInfo(); // TODO: move?
        // console.log('cursorInfo', cursorInfo)
        cursorIndex = null; // cursorInfo.cursorIndex;
        return (<>
            <ASUIMenuAction onAction={e => this.trackGetRef(selectedTrack).selectIndices('segment')}      >Select Segment</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackGetRef(selectedTrack).selectIndices('row')}       >Select Row</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackGetRef(selectedTrack).selectIndices('all')}       >Select Track</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackGetRef(selectedTrack).selectIndices('cursor')} disabled={cursorIndex === null}>Select Cursor</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackGetRef(selectedTrack).selectIndices('none')}       >Clear Selection</ASUIMenuAction>
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
        const renderMenuViewOptions = viewKey =>
            this.renderMenuViewOptions(viewKey);

        return (<>
            <ASUIMenuAction onAction={e => this.toggleFullscreen(e)}                >{this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen</ASUIMenuAction>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={e => renderMenuViewOptions('panel:song')}>Song Panel</ASUIMenuDropDown>
            <ASUIMenuDropDown options={e => renderMenuViewOptions('panel:track')}>Track Panel</ASUIMenuDropDown>
            <ASUIMenuDropDown options={e => renderMenuViewOptions('panel:instruction')}>Instruction Panel</ASUIMenuDropDown>
            <ASUIMenuDropDown options={e => renderMenuViewOptions('panel:programs')}>Program Panel</ASUIMenuDropDown>
        </>);

    }

    renderMenuViewOptions(viewKey, onAction=null) {
        const oldViewMode = this.state.viewModes[viewKey];
        if(!onAction)
            onAction = (newViewMode) => {
                this.setViewMode(viewKey, newViewMode)
            }
        return (<>
            <ASUIMenuAction disabled={!oldViewMode} onAction={e => onAction(null)} >Show Default</ASUIMenuAction>
            <ASUIMenuAction disabled={oldViewMode === 'minimize'} onAction={e => onAction('minimize')} >Minimize</ASUIMenuAction>
            <ASUIMenuAction disabled={oldViewMode === 'none'} onAction={e => onAction('none')} >Hide</ASUIMenuAction>
            <ASUIMenuAction disabled={oldViewMode === 'float'} onAction={e => onAction('float')} >Float Right</ASUIMenuAction>
        </>);

    }

    /** Options Menu **/

    renderMenuOptions() {
        return (<>
            <ASUIMenuAction onAction={e => this.toggleSetting('showTrackRowPositionInTicks')}    >Track Position {this.state.showTrackRowPositionInTicks ? 'as Ticks' : 'Formatted'}</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.toggleSetting('showTrackRowDurationInTicks')}    >Track Duration {this.state.showTrackRowDurationInTicks ? 'as Ticks' : 'Formatted'}</ASUIMenuAction>
        </>);

    }

    /** Playback Menu **/

    renderMenuPlayback() {
        return (<>
            <ASUIMenuAction onAction={e => this.toggleSetting('playbackOnSelect')} >{this.state.playbackOnSelect ? '☑' : '☐'} Play on Select</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.toggleSetting('playbackOnChange')} >{this.state.playbackOnChange ? '☑' : '☐'} Play on Change</ASUIMenuAction>
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
            {this.values.getSongTracks((trackName) =>
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
            <ASUIMenuAction onAction={e => this.trackSelect(trackName)}         >Select Track</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackRenamePrompt(trackName)}   >Rename Track</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.trackRemovePrompt(trackName)}   >Delete Track</ASUIMenuAction>
        </>);
    }
//            <ASUIMenuItem>{`Track: '${trackName}'`}</ASUIMenuItem><ASUIMenuBreak />


}


export default ASComposerMenu;
