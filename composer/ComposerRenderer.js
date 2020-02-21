import React from "react";

import Div from "../components/div/Div";
import Icon from "../components/icon/Icon";
import {SubMenu, ActionMenu, SubMenuButton} from "../components/menu";
import InputButton from "../components/input-button/InputButton";
import InputFile from "../components/input-file/InputFile";
import InputRange from "../components/input-range/InputRange";
import InputText from "../components/input-text/InputText";
import Storage from "../song/Storage";

import Header from "./header/Header";
import Panel from "./panel/Panel";
import Form from "./form/Form";
import Footer from "./footer/Footer";
import InstrumentRenderer from "./instrument/InstrumentRenderer";
// import InputSelect from "../components/input-select/InputSelect";
import Tracker from "./tracker/Tracker";
import InstrumentLoader from "../instrument/InstrumentLoader";

import "./assets/Composer.css";
import TrackerGroupsPanel from "./tracker/panel/TrackerGroupsPanel";
import TrackerRowSegmentsPanel from "./tracker/panel/TrackerRowSegmentsPanel";

class ComposerRenderer extends React.Component {
    constructor(state = {}, props = {}) {
        super(state, props);
        // this.state.trackerSegmentLength = null;
        // this.state.trackerRowLength = null;

        this.state = {
            status: "[No Song Loaded]",
            version: require('../package.json').version,
            menuKey: 'root',
            fullscreen: false,
            portrait: false,

            songLength: 0,
            songLengthInTicks: 0,
            playing: false,
            paused: false,

            showPanelSong: true,
            showPanelPlaylist: true,
            trackerGroup: 'root',
            trackerRowSegmentID: 0,
            trackerSelectedIndices: [],
            trackerCursorIndex: 0,
            trackerSegmentCount: 10,
            trackerQuantizationInTicks: 96*4,
            trackerSegmentLengthInTicks: 96*4*16,
            trackerFilterByInstrumentID: null
        };

        this.shadowDOM = null;
    }

    get targetElm() {
        return this.shadowDOM;
    }

    // createStyleSheetLink(stylePath, scriptElm=null) {
    //     const linkHRef = new URL(stylePath, (scriptElm || thisModule).src);
    //     const link = document.createElement('link');
    //     link.setAttribute('rel', 'stylesheet');
    //     link.href = linkHRef;
    //     return link;
    // }


    loadMIDIInterface(callback) {
        // TODO: wait for user input
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(
                (MIDI) => {
                    console.info("MIDI initialized", MIDI);
                    const inputDevices = [];
                    MIDI.inputs.forEach(
                        (inputDevice) => {
                            inputDevices.push(inputDevice);
                            inputDevice.addEventListener('midimessage', callback);
                        }
                    );
                    console.log("MIDI input devices detected: " + inputDevices.map(d => d.name).join(', '));
                },
                (err) => {
                    throw new Error("error initializing MIDI: " + err);
                }
            );
        }
    }


    renderMenu(menuKey=null, menuParam=null) {
        let recentBatchCommand, instrumentID;
        // const library = await this.getLibrary();
        /** File Menu **/
        switch (menuKey) {
            case 'root':
                const titleMenuProps = this.state.portrait ? {} : {
                    vertical: true,
                    arrow: false
                };
                return <>
                    <SubMenu {...titleMenuProps} key="file"        options={e => this.renderMenu('file')}          >File</SubMenu>
                    <SubMenu {...titleMenuProps} key="edit"        options={e => this.renderMenu('edit')}          >Edit</SubMenu>
                    <SubMenu {...titleMenuProps} key="group"       options={e => this.renderMenu('group')}         >Group</SubMenu>
                    <SubMenu {...titleMenuProps} key="instrument"  options={e => this.renderMenu('instrument')}    >Instrument</SubMenu>
                    <SubMenu {...titleMenuProps} key="view"        options={e => this.renderMenu('view')}          >View</SubMenu>
                </>;

            case 'file':
                return <>
                    <ActionMenu onAction={e => this.loadNewSongData(e)}                         >New song</ActionMenu>
                    <SubMenu options={e => this.renderMenu('file-open')}           >Open song</SubMenu>
                    <SubMenu options={e => this.renderMenu('file-save')}           >Save song</SubMenu>
                    <SubMenu options={e => this.renderMenu('file-import')}         >Import song</SubMenu>
                    <SubMenu options={e => this.renderMenu('file-export')}         >Export song</SubMenu>
                </>;

            case 'file-open':
                return <>
                    <SubMenu options={e => this.renderMenu('file-open-memory')}    >Import song</SubMenu>
                    <ActionMenu onAction={e => this.openSongFromFileDialog(e)}                        >from File</ActionMenu>
                    <ActionMenu onAction={e => this.loadSongFromURL(e)}                         >from URL</ActionMenu>
                </>;


            case 'file-save':
                return <>
                    <ActionMenu onAction={e => this.saveSongToMemory(e)}                        >to Memory</ActionMenu>
                    <ActionMenu onAction={e => this.saveSongToFile(e)}                          >to File</ActionMenu>
                </>;

            case 'file-import':
                return <>
                    <ActionMenu onAction={e => this.openSongFromFileDialog(e, '.mid,.midi')}          >from MIDI File</ActionMenu>
                </>;
            // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
            // menuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
            // menuFileImportSongFromMIDI.disabled = true;

            case 'file-export':
                return <>
                    <ActionMenu disabled>to MIDI File</ActionMenu>
                </>;

            case 'file-open-memory':
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

            case 'edit':
            case 'context':
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
                    <SubMenu options={e => this.renderMenu('edit-insert')}    >Insert Command</SubMenu>

                    {this.state.trackerSelectedIndices.length === 0 ? null :
                        <SubMenu options={e => this.renderMenu('edit-set')} hasBreak   >Set Command</SubMenu>}

                    {/** Select Instructions **/}
                    <SubMenu options={e => this.renderMenu('edit-select')} hasBreak   >Select</SubMenu>

                    {/** Batch Instructions **/}
                    <SubMenu options={e => this.renderMenu('edit-batch')} hasBreak   >Batch</SubMenu>
                </>;
            // const menuEditGroup = MENU.getOrCreateSubMenu('group', 'Group ►');
            // menuEditGroup.hasBreak = true;
            // menuEditGroup.disabled = true;

            case 'edit-insert':
                return <>
                    <SubMenu options={e => this.renderMenu('edit-insert-frequency')} hasBreak          >Frequency</SubMenu>
                    <SubMenu options={e => this.renderMenu('edit-insert-named')} hasBreak              >Named</SubMenu>
                    <SubMenu options={e => this.renderMenu('edit-insert-group')} hasBreak              >Group</SubMenu>
                    <ActionMenu onAction={e => this.instructionInsert(null, true)} hasBreak   >Custom Command</ActionMenu>
                </>;

            case 'edit-insert-group':
                return <>
                    {this.values.getAllSongGroups((groupName) =>
                        <SubMenu
                            children={e => this.renderMenu('edit-insert-frequency')}
                            disabled={groupName === this.state.trackerGroup}
                            onAction={e => this.instructionInsert('@' + groupName, false)}
                        >{groupName}</SubMenu>)}
                    <ActionMenu
                        hasBreak
                        onAction={e => this.groupAdd(e)}
                    >Create New Group</ActionMenu>
                </>;

            case 'edit-insert-named':
                return this.values.getAllNamedFrequencies(
                    (noteName, frequency, instrumentID) => <ActionMenu
                        onAction={e => this.instructionInsert(noteName, false, instrumentID)}
                    >{noteName}</ActionMenu>
                );

            case 'edit-insert-frequency':
                return this.values.getNoteFrequencies((noteName, label) => <SubMenu
                        children={e => this.renderMenu('edit-insert-frequency', noteName)}
                    >{noteName}</SubMenu>
                );

            case 'edit-insert-frequency-note':
                const insertNoteName = menuParam;
                return this.values.getNoteOctaves((octave) => <ActionMenu
                        onAction={e => this.instructionInsert(`${insertNoteName}${octave}`, false)}
                    >{insertNoteName}{octave}</ActionMenu>
                );


            case 'edit-set':
                return <>
                    <SubMenu options={e => this.renderMenu('edit-set-command')} hasBreak           >Set Command</SubMenu>
                    <SubMenu options={e => this.renderMenu('edit-set-instrument')} hasBreak        >Set Instrument</SubMenu>
                    <SubMenu options={e => this.renderMenu('edit-set-duration')} hasBreak          >Set Duration</SubMenu>
                    <SubMenu options={e => this.renderMenu('edit-set-velocity')} hasBreak          >Set Velocity</SubMenu>
                    <ActionMenu onAction={e => this.instructionDelete(e)} hasBreak   >Delete Instruction(s)</ActionMenu>
                </>;

            case 'edit-set-command':
                return <>
                    <SubMenu options={e => this.renderMenu('edit-set-command-frequency')}                      >Frequency</SubMenu>
                    <SubMenu options={e => this.renderMenu('edit-set-command-named')}                          >Named</SubMenu>
                    <SubMenu options={e => this.renderMenu('edit-set-command-group')}                          >Group</SubMenu>
                    <ActionMenu onAction={e => this.instructionChangeCommand(null, true)} hasBreak      >Custom Command</ActionMenu>
                </>;

            case 'edit-set-instrument':
                return this.values.getSongInstruments((instrumentID, label) =>
                    <ActionMenu onAction={e => this.instructionChangeInstrument(instrumentID)}  >{label}</ActionMenu>
                );

            case 'edit-set-duration':
                return <>
                    {this.values.getNoteDurations((durationInTicks, durationName) =>
                        <ActionMenu onAction={e => this.instructionChangeDuration(durationInTicks)}  >{durationName}</ActionMenu>)}
                    <ActionMenu onAction={e => this.instructionChangeDuration(null, true)} hasBreak >Custom Duration</ActionMenu>
                </>;

            case 'edit-set-velocity':
                return <>
                    {this.values.getNoteVelocities((velocity) =>
                        <ActionMenu onAction={e => this.instructionChangeVelocity(velocity)}  >{velocity}</ActionMenu>)}
                    <ActionMenu onAction={e => this.instructionChangeVelocity(null, true)} hasBreak >Custom Velocity</ActionMenu>
                </>;

            case 'edit-set-command-frequency':
                return this.values.getNoteFrequencies((noteName, label) =>
                    <SubMenu options={e => this.renderMenu('edit-set-command-frequency-note', noteName)}                   >Frequency</SubMenu>
                );

            case 'edit-set-command-frequency-note':
                const setNoteName = menuParam;
                return this.values.getNoteOctaves((octave) =>
                    <ActionMenu onAction={e => this.instructionChangeCommand(`${setNoteName}${octave}`, false)}     >{setNoteName}{octave}</ActionMenu>
                );

            case 'edit-set-command-named':
                return this.values.getAllNamedFrequencies((noteName, frequency, instrumentID) =>
                    <ActionMenu onAction={e => this.instructionChangeCommand(noteName, false, instrumentID)}                    >{noteName}</ActionMenu>
                );

            case 'edit-set-command-group':
                return <>
                    {this.values.getAllSongGroups((groupName) =>
                        groupName === this.groupName ? null :
                            <ActionMenu onAction={e => this.instructionChangeCommand('@' + groupName, false)}                    >{groupName}</ActionMenu>
                    )}
                    <ActionMenu onAction={e => this.groupAdd()} hasBreak  >Create New Group</ActionMenu>
                </>;

            case 'edit-select':
                return <>
                    <ActionMenu onAction={e => this.trackerChangeSelection('segment')}      >Select Segment Instructions</ActionMenu>
                    <ActionMenu onAction={e => this.trackerChangeSelection('all')}       >Select All Song Instructions</ActionMenu>
                    <ActionMenu onAction={e => this.trackerChangeSelection('none')}       >Select No Instructions</ActionMenu>
                    <SubMenu options={e => this.renderMenu('edit-select-batch')}  hasBreak                        >Batch Select</SubMenu>
                </>;

            case 'edit-select-batch':
                return <>
                    {(new Storage).getBatchRecentSearches().map((recentBatchSearch, i) =>
                        <ActionMenu onAction={e => this.batchSelect(e, recentBatchSearch, true)}      >New Selection Command</ActionMenu>
                    )}
                    <ActionMenu onAction={e => this.batchSelect(e)} hasBreak      >New Selection Command</ActionMenu>
                </>;

            case 'edit-batch':
                return <>
                    {(new Storage).getBatchRecentCommands().map((recentBatchCommand, i) =>
                        <SubMenu options={e => this.renderMenu('edit-batch-recent', recentBatchCommand)}                          >{recentBatchCommand}</SubMenu>
                    )}
                    <ActionMenu onAction={e => this.batchRunCommand(e)} hasBreak      >New Batch Command</ActionMenu>
                </>;

            case 'edit-batch-recent':
                recentBatchCommand = menuParam;
                return <>
                    <ActionMenu onAction={e => this.batchRunCommand(e, recentBatchCommand, true)}                   >Execute on Group</ActionMenu>
                    <SubMenu options={e => this.renderMenu('edit-batch-recent-execute-search', recentBatchCommand)}    >Execute using Search</SubMenu>
                </>;

            case 'edit-batch-recent-execute-search':
                recentBatchCommand = menuParam;
                return <>
                    <ActionMenu onAction={e => this.batchRunCommand(e, recentBatchCommand, null, true)}                   >New Search</ActionMenu>
                    {(new Storage).getBatchRecentSearches().map((recentBatchSearch, i) =>
                        <ActionMenu onAction={e => this.batchRunCommand(e, recentBatchCommand, recentBatchSearch)}                   >{recentBatchSearch}</ActionMenu>
                    )}
                </>;

            case 'view':
                return <>
                    <ActionMenu onAction={e => this.toggleFullscreen(e)}       >{this.props.fullscreen ? 'Disable' : 'Enable'} Fullscreen</ActionMenu>
                    <ActionMenu onAction={e => this.togglePanelSong(e)}       >{this.props.hidePanelSongs ? 'Disable' : 'Enable'} Song Forms</ActionMenu>
                    <ActionMenu onAction={e => this.togglePanelTracker(e)}       >{this.props.hidePanelTracker ? 'Disable' : 'Enable'} Tracker Forms</ActionMenu>
                    <ActionMenu onAction={e => this.togglePanelInstruments(e)}       >{this.props.hidePanelInstrument ? 'Disable' : 'Enable'} Instrument Forms</ActionMenu>
                </>;

            case 'instrument':
                return <>
                    <SubMenu options={e => this.renderMenu('instrument-add')}    >Add instrument to song</SubMenu>
                    {this.values.getSongInstruments((instrumentID, label) =>
                        <ActionMenu key={instrumentID} onAction={e => this.renderMenu('instrument-edit', instrumentID)}       >{label}</ActionMenu>)}
                </>;

            case 'instrument-add':
                return InstrumentLoader.getInstruments().map((config) =>
                    <ActionMenu onAction={e => this.instrumentAdd(config.className)}       >{config.title}</ActionMenu>);

            case 'instrument-edit':
                instrumentID = menuParam;
                return <>
                    <SubMenu options={e => this.renderMenu('instrument-edit-replace')}    >Replace</SubMenu>
                    <ActionMenu
                        onAction={e => this.instrumentRemove(instrumentID)}
                        disabled={!this.song.isInstrumentLoaded(instrumentID)}
                    >Remove from song</ActionMenu>
                </>;

            case 'instrument-edit-replace':
                return InstrumentLoader.getInstruments().map((config, i) =>
                    <ActionMenu onAction={e => this.instrumentReplace(instrumentID, config.className)}       >{config.name}</ActionMenu>
                );

            /** Group Menu **/
            case 'group':
                let groupCount = 0;
                return <>
                    <ActionMenu onAction={e => this.groupAdd(e)}  hasBreak     >Add new group to song</ActionMenu>
                    {this.values.getAllSongGroups((groupName) =>
                        <SubMenu key={groupName} options={e => this.renderMenu('group-edit', groupName)} hasBreak={groupCount++ === 0}    >{groupName}</SubMenu>)}
                </>;

            case 'group-edit':
                // const groupName = menuParam;
                return <>
                    <ActionMenu onAction={e => this.groupRename(menuParam)}  hasBreak     >Rename group {menuParam}</ActionMenu>
                    <ActionMenu onAction={e => this.groupRemove(menuParam)}  hasBreak     >Delete group {menuParam}</ActionMenu>
                </>;

            default:
                throw new Error("Unknown menu key: " + menuKey);
        }

    }


    render() {
        return (
            <Div className="asc-container">
                <Header
                    key="header"
                    menuContent={() => this.renderMenu(this.state.menuKey)}
                />
                <Div className="asc-panel-container">
                    <Panel className="song" title="Song">
                        <Form className="playback" title="Playback">
                            <InputButton
                                className="song-play"
                                onAction={e => this.playlistPlay(e)}
                            >
                                <Icon className="play"/>
                            </InputButton>
                            <InputButton
                                className="song-pause"
                                onAction={e => this.playlistPause(e)}
                            >
                                <Icon className="pause"/>
                            </InputButton>
                            <InputButton
                                className="song-stop"
                                onAction={e => this.playlistStop(e)}
                            >
                                <Icon className="stop"/>
                            </InputButton>
                        </Form>

                        <Form className="file" title="File">
                            <InputFile
                                className="file-load"
                                onFile={(e, file) => this.loadSongFromFileInput(file)}
                                accept=".json,.mid,.midi"
                                ref={ref => this.fieldSongFileLoad = ref}
                                title="Load Song from File"
                            >
                                <Icon className="file-load"/>
                            </InputFile>
                            <InputButton
                                className="file-save"
                                onAction={e => this.saveSongToFile(e)}
                                title="Save Song to File"
                            >
                                <Icon className="file-save"/>
                            </InputButton>
                        </Form>

                        <Form className="volume" title="Volume">
                            <InputRange
                                className="volume"
                                onChange={(e, newVolume) => this.setVolume(newVolume / 100)}
                                value={this.state.volume}
                                min={1}
                                max={100}
                                ref={ref => this.fieldSongVolume = ref}
                                title="Song Volume"
                            />
                        </Form>

                        <Form className="position" title="Position">
                            <InputRange
                                className="position"
                                onChange={(e, pos) => this.setSongPosition(pos)}
                                value={0}
                                min={0}
                                max={Math.ceil(this.state.songLength)}
                                ref={ref => this.fieldSongPosition = ref}
                                title="Song Position"
                            />
                        </Form>

                        <Form className="timing" title="Timing">
                            <InputText
                                className="timing"
                                onChange={(e, timingString) => this.setSongPosition(timingString)}
                                value="00:00:000"
                                ref={ref => this.fieldSongTiming = ref}
                                title="Song Timing"
                            />
                        </Form>

                        <Form className="name" title="Name">
                            <InputText
                                className="name"
                                onChange={(e, newSongName) => this.setSongName(e, newSongName)}
                                value={this.song ? this.song.getName() : "no song loaded"}
                                ref={ref => this.fieldSongVersion = ref}
                                title="Song Name"
                            />
                        </Form>

                        <Form className="version" title="Version">
                            <InputText
                                className="version"
                                onChange={(e, newSongVersion) => this.setSongVersion(e, newSongVersion)}
                                value={this.song ? this.song.getVersion() : "0.0.0"}
                                ref={ref => this.fieldSongVersion = ref}
                                title="Song Version"
                            />
                        </Form>
                    </Panel>

                    <Panel className="instruments" title="Instruments"
                           ref={ref=>this.panelInstruments = ref}
                           children={() => (<>
                               {this.song.getInstrumentList().map((instrumentConfig, instrumentID) =>
                                   <InstrumentRenderer
                                       key={instrumentID}
                                       song={this.song}
                                       props={instrumentConfig}
                                       instrumentID={instrumentID}
                                   />
                               )}
                               <Form className="instrument-add" title1="Add Instrument">
                                   <SubMenu
                                       openOnHover={false}
                                       className="instrument-add"
                                       // onChange={(e, newVolume) => this.setVolume(newVolume / 100)}
                                       options={() => InstrumentLoader.getInstruments().map(config =>
                                           <ActionMenu onAction={e => this.instrumentAdd(config.className)} >Add instrument '{config.title}'</ActionMenu>
                                       )}
                                       title="Add Instrument"
                                   >Add Instrument</SubMenu>
                               </Form>
                           </>)} />

                    <Panel className="instructions" title="Instructions"
                           ref={ref=>this.panelInstructions = ref}
                    >
                        <Form className="instruction-command" title="Command">
                            <SubMenuButton
                                // className="command"

                                // selectElm.value ?
                                //     selectElm.getOptGroup('Current Octave', () => {
                                //         const currentOctave = this.fieldInstructionCommand.value.substr(-1, 1);
                                //         return this.values.getNoteFrequencies(freq => selectElm.getOption(freq + currentOctave, freq + currentOctave));
                                //     }) : null,
                                // // TODO: filter by selected instrument
                                options={() =>
                                    <>
                                        <SubMenu
                                            options={() => this.values.getOctaveNoteFrequencies(freq =>
                                                <ActionMenu
                                                    onAction={() => this.instructionChangeCommand(freq)}
                                                >{freq}</ActionMenu>
                                            )}>Frequencies</SubMenu>
                                        <SubMenu
                                            options={() => this.values.getAllNamedFrequencies(namedFreq =>
                                                <ActionMenu
                                                    onAction={() => this.instructionChangeCommand(namedFreq)}
                                                >{namedFreq}</ActionMenu>
                                            )}>Custom Frequencies</SubMenu>
                                        <SubMenu
                                            options={() => this.values.getAllSongGroups(group =>
                                                <ActionMenu
                                                    onAction={() => this.instructionChangeCommand('@' + group)}
                                                >@{group}</ActionMenu>
                                            )}>Groups</SubMenu>
                                    </>
                                }


                            >C4</SubMenuButton>
                        </Form>
                        <Form className="instruction-insert" title="Add">
                            <ActionMenu
                                // className="instruction-insert"
                                onAction={e => this.instructionInsert()}
                                title="Insert Instruction"
                            >
                                <Icon className="insert"/>
                            </ActionMenu>
                        </Form>
                        <Form className="instruction-delete" title="Rem">
                            <InputButton
                                // className="instruction-delete"
                                onAction={e => this.instructionDelete(e)}
                                title="Delete Instruction"
                            >
                                <Icon className="remove"/>
                            </InputButton>
                        </Form>

                        <Form className="instruction-instrument" title="Instrument">
                            <SubMenuButton
                                // className="instrument-instrument"
                                options={() =>
                                    this.values.getSongInstruments((id, name) =>
                                        <ActionMenu onAction={(e) => this.instructionChangeInstrument(id)}>{name}</ActionMenu>
                                    )
                                }
                                title="Song Instruments"
                            >Select</SubMenuButton>
                        </Form>

                        <Form className="velocity" title="Velocity">
                            <ActionMenu
                                // className="velocity"
                                onAction={(e, newVelocity) => this.instructionChangeVelocity(newVelocity)}
                                // value={this.state.volume}
                                min={1}
                                max={127}
                                ref={ref => this.fieldInstrumentVelocity = ref}
                                title="Instrument Velocity"
                            >Max</ActionMenu>
                        </Form>


                        <Form className="instruction-duration" title="Duration">
                            <SubMenuButton
                                // className="instruction-duration"
                                options={() =>
                                    this.values.getNoteDurations((duration, title) =>
                                        <ActionMenu onAction={(e) => this.instructionChangeDuration(duration)}>{title}</ActionMenu>
                                    )
                                }
                                title="Load Song from File"
                            >1B</SubMenuButton>
                        </Form>
                    </Panel>

                    <Panel className="tracker" title="Tracker">
                        <Form className="tracker-row-length" title="Row &#120491;">
                            <SubMenuButton
                                value="1B"
                                // className="tracker-row-length"
                                options={() =>
                                    this.values.getNoteDurations((duration, title) =>
                                        <ActionMenu onAction={(e) => this.instructionChangeDuration(duration)}>{title}</ActionMenu>
                                    )
                                }
                            >1B</SubMenuButton>
                        </Form>

                        <Form className="tracker-segment-length" title="Seg &#120491;">
                            <SubMenuButton
                                // className="tracker-segment-length"
                                options={() =>
                                    this.values.getSegmentLengths((length, title) =>
                                        <ActionMenu onAction={(e) => this.trackerChangeSegmentLength(length)}>{title}</ActionMenu>
                                    )
                                }
                                title="Select Tracker Segment Length"
                            >16B</SubMenuButton>
                        </Form>

                        <Form className="tracker-instrument" title="Instrument">
                            <SubMenuButton
                                // className="tracker-instrument"
                                options={() =>
                                    this.values.getSongInstruments((instrumentID, name) =>
                                        <ActionMenu onAction={(e) => this.trackerChangeInstrumentFilter(instrumentID)}>{name}</ActionMenu>
                                    )
                                }
                                title="Filter by Tracker Instrument"
                            >Any</SubMenuButton>
                        </Form>

                        <Form className="tracker-selection" title="Selection">
                            <InputText
                                value="No selection"
                                // className="tracker-selection"
                                onChange={(e, instrumentID) => this.trackerChangeSelection()}
                                title="Tracker Note Selection"
                            />
                        </Form>

                        <Form className="tracker-octave" title="Octave">
                            <SubMenuButton
                                className="tracker-selection"
                                options={() =>
                                    this.values.getNoteOctaves(octave =>
                                        <ActionMenu onAction={(e) => this.trackerChangeOctave(octave)}>{octave}</ActionMenu>
                                    )
                                }
                                title="Tracker Change Octave"
                            >4</SubMenuButton>
                        </Form>
                    </Panel>

                    <TrackerGroupsPanel composer={this} />
                    <TrackerRowSegmentsPanel composer={this} />

                </Div>
                <Div className="asc-tracker-container">
                    <Tracker
                        composer={this}
                    />
                </Div>
                <Footer composer={this} ref={ref => this.footer = ref} />
            </Div>
        )
    }


    setStatus(newStatus) {
        console.info.apply(null, arguments); // (newStatus);
        this.footer && this.footer.setStatus(newStatus);
    }
    setError(newStatus) {
        console.error.apply(null, arguments); // (newStatus);
        this.footer && this.footer.setError(newStatus);
    }

    // setVersion(versionString) {
    //     this.state.version = versionString;
    //     if(this.textVersion)
    //         this.textVersion.forceUpdate();
    // }


    // get fieldinstrumentAdd()
    // TODO: AudioSourceComposerSongFormRenderer()
    /** @deprecated **/
    updateForms() {
        this.fieldSongName.value = this.song.getName();
        this.fieldSongVersion.value = this.song.getVersion();
        this.fieldSongBPM.value = this.song.getStartingBeatsPerMinute();

        this.fieldSongVolume.value = this.song.getVolumeValue();

        // let timeDivision = this.rowLengthInTicks || this.song.getSongTimeDivision();
        const cursorInstruction = this.song.instructionFind(this.state.trackerGroup, this.state.trackerSelectedIndices[0]);


        if (cursorInstruction) {
            this.fieldInstructionCommand.value = cursorInstruction.command; // , "Unknown Instrument");
            this.fieldInstructionInstrument.addOrSetValue(cursorInstruction.instrument, cursorInstruction.instrument + ": Unknown Instrument");
            this.fieldInstructionVelocity.value = cursorInstruction.velocity;
            this.fieldInstructionDuration.value = cursorInstruction.duration;
        }

        this.fieldInstructionDelete.disabled = this.state.trackerSelectedIndices.length === 0;
        if (!this.fieldTrackerRowLength.value)
            this.fieldTrackerRowLength.setValue(this.song.getTimeDivision());
        // this.fieldTrackerRowLength.value = this.fieldTrackerRowLength.value; // this.song.getSongTimeDivision();
        if (!this.fieldInstructionDuration.value && this.fieldTrackerRowLength.value)
            this.fieldInstructionDuration.setValue(parseInt(this.fieldTrackerRowLength.value));


    }

}


export default ComposerRenderer
