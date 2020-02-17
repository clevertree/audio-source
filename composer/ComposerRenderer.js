import React from "react";

import Div from "../components/div/Div";
import Icon from "../components/icon/Icon";
import Menu from "../components/menu/Menu";
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
import InputSelect from "../components/input-select/InputSelect";
import Tracker from "./tracker/Tracker";
import InstrumentLoader from "../instrument/InstrumentLoader";


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
            showPanelSong: true,
            showPanelPlaylist: true,
        };
        // this.state.volume = Song.DEFAULT_VOLUME;
        this.state.songLength = 0;
        this.state.playing = false;
        this.state.paused = false;
        this.state.tracker = {
            currentGroup: 'root',
            currentRowSegmentID: 0,
            selectedIndices: [],
            cursorIndex: 0,
            cursorListOffset: 0,
            rowSegmentCount: 10,
            quantizationInTicks: 96*4,
            segmentLengthInTicks: 96*4*16,
            filterByInstrumentID: null
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

    get trackerSegmentLengthInTicks() {
        return this.state.trackerSegmentLength || this.song.getTimeDivision() * 16;
    }

    get trackerRowLengthInTicks() {
        return this.state.trackerRowLength || this.song.getTimeDivision();
    }

    renderMenu(menuKey=null, menuParam=null) {
        let recentBatchCommand, instrumentID, selectedIndices;
        // const library = await this.getLibrary();
        /** File Menu **/
        let content = [];
        switch (menuKey) {
            case 'root':
                const vertical = !this.state.portrait;
                return <>
                    <Menu vertical={vertical} key="file"        options={e => this.renderMenu('file')}          >File</Menu>
                    <Menu vertical={vertical} key="edit"        options={e => this.renderMenu('edit')}          >Edit</Menu>
                    <Menu vertical={vertical} key="group"       options={e => this.renderMenu('group')}         >Group</Menu>
                    <Menu vertical={vertical} key="instrument"  options={e => this.renderMenu('instrument')}    >Instrument</Menu>
                    <Menu vertical={vertical} key="view"        options={e => this.renderMenu('view')}          >View</Menu>
                </>;

            case 'file':
                return <>
                    <Menu onAction={e => this.loadNewSongData(e)}                         >New song</Menu>
                    <Menu options={e => this.renderMenu('file-open')}           >Open song</Menu>
                    <Menu options={e => this.renderMenu('file-save')}           >Save song</Menu>
                    <Menu options={e => this.renderMenu('file-import')}         >Import song</Menu>
                    <Menu options={e => this.renderMenu('file-export')}         >Export song</Menu>
                </>;

            case 'file-open':
                return <>
                    <Menu options={e => this.renderMenu('file-open-memory')}    >Import song</Menu>
                    <Menu onAction={e => this.openSongFromFile(e)}                        >from File</Menu>
                    <Menu onAction={e => this.loadSongFromURL(e)}                         >from URL</Menu>
                </>;


            case 'file-save':
                return <>
                    <Menu onAction={e => this.saveSongToMemory(e)}                        >to Memory</Menu>
                    <Menu onAction={e => this.saveSongToFile(e)}                          >to File</Menu>
                </>;

            case 'file-import':
                    return <>
                    <Menu onAction={e => this.openSongFromFile(e, '.mid,.midi')}          >from MIDI File</Menu>
                    </>;
                    // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
                    // menuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
                    // menuFileImportSongFromMIDI.disabled = true;

            case 'file-export':
                    return <>
                    <Menu disabled>to MIDI File</Menu>
                </>;

            case 'file-open-memory':
                const storage = new Storage();
                const songRecentUUIDs = storage.getRecentSongList() ;
                return songRecentUUIDs.length > 0
                    ? songRecentUUIDs.map((entry, i) =>
                        <Menu
                            key={i}
                            onAction={() => this.loadSongFromMemory(entry.uuid)}
                        >{entry.name || entry.uuid}</Menu>)
                    :<Menu
                        key="no-recent"
                        disabled
                    >No Songs Available</Menu>

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
                    <Menu options={e => this.renderMenu('edit-insert')}    >Insert Command</Menu>

                    {this.state.tracker.selectedIndices.length === 0 ? null :
                        <Menu options={e => this.renderMenu('edit-set')} hasBreak   >Set Command</Menu>}

                    {/** Select Instructions **/}
                    <Menu options={e => this.renderMenu('edit-select')} hasBreak   >Select</Menu>

                    {/** Batch Instructions **/}
                    <Menu options={e => this.renderMenu('edit-batch')} hasBreak   >Batch</Menu>
                </>;
            // const menuEditGroup = MENU.getOrCreateSubMenu('group', 'Group ►');
            // menuEditGroup.hasBreak = true;
            // menuEditGroup.disabled = true;

            case 'edit-insert':
                return <>
                    <Menu options={e => this.renderMenu('edit-insert-frequency')} hasBreak          >Frequency</Menu>
                    <Menu options={e => this.renderMenu('edit-insert-named')} hasBreak              >Named</Menu>
                    <Menu options={e => this.renderMenu('edit-insert-group')} hasBreak              >Group</Menu>
                    <Menu onAction={e => this.instructionInsert(null, true)} hasBreak   >Custom Command</Menu>
                </>;

            case 'edit-insert-group':
                return <>
                    {this.values.getAllSongGroups((groupName) =>
                        <Menu
                            options={e => this.renderMenu('edit-insert-frequency')}
                            disabled={groupName === this.state.tracker.currentGroup}
                            onAction={e => this.instructionInsert('@' + groupName, false)}
                            >{groupName}</Menu>)}
                    <Menu
                        hasBreak
                        onAction={e => this.groupAdd(e)}
                        >Create New Group</Menu>
                </>;

            case 'edit-insert-named':
                return this.values.getAllNamedFrequencies(
                    (noteName, frequency, instrumentID) => <Menu
                        onAction={e => this.instructionInsert(noteName, false, instrumentID)}
                        >{noteName}</Menu>
                );

            case 'edit-insert-frequency':
                return this.values.getNoteFrequencies((noteName, label) => <Menu
                        options={e => this.renderMenu('edit-insert-frequency', noteName)}
                    >{noteName}</Menu>
                );

            case 'edit-insert-frequency-note':
                const insertNoteName = menuParam;
                return this.values.getNoteOctaves((octave) => <Menu
                        onAction={e => this.instructionInsert(`${insertNoteName}${octave}`, false)}
                    >{insertNoteName}{octave}</Menu>
                );


            case 'edit-set':
                return <>
                    <Menu options={e => this.renderMenu('edit-set-command')} hasBreak           >Set Command</Menu>
                    <Menu options={e => this.renderMenu('edit-set-instrument')} hasBreak        >Set Instrument</Menu>
                    <Menu options={e => this.renderMenu('edit-set-duration')} hasBreak          >Set Duration</Menu>
                    <Menu options={e => this.renderMenu('edit-set-velocity')} hasBreak          >Set Velocity</Menu>
                    <Menu onAction={e => this.instructionDelete(e)} hasBreak   >Delete Instruction(s)</Menu>
                </>;

            case 'edit-set-command':
                return <>
                    <Menu options={e => this.renderMenu('edit-set-command-frequency')}                      >Frequency</Menu>
                    <Menu options={e => this.renderMenu('edit-set-command-named')}                          >Named</Menu>
                    <Menu options={e => this.renderMenu('edit-set-command-group')}                          >Group</Menu>
                    <Menu onAction={e => this.instructionChangeCommand(null, true)} hasBreak      >Custom Command</Menu>
                </>;

            case 'edit-set-instrument':
                return this.values.getSongInstruments((instrumentID, label) =>
                    <Menu onAction={e => this.instructionChangeInstrument(instrumentID)}  >{label}</Menu>
                )

            case 'edit-set-duration':
                return <>
                    {this.values.getNoteDurations((durationInTicks, durationName) =>
                        <Menu onAction={e => this.instructionChangeDuration(durationInTicks)}  >{durationName}</Menu>)}
                    <Menu onAction={e => this.instructionChangeDuration(null, true)} hasBreak >Custom Duration</Menu>
                </>;

            case 'edit-set-velocity':
                return <>
                    {this.values.getNoteVelocities((velocity) =>
                        <Menu onAction={e => this.instructionChangeVelocity(velocity)}  >{velocity}</Menu>)}
                    <Menu onAction={e => this.instructionChangeVelocity(null, true)} hasBreak >Custom Velocity</Menu>
                </>;

            case 'edit-set-command-frequency':
                return this.values.getNoteFrequencies((noteName, label) =>
                    <Menu options={e => this.renderMenu('edit-set-command-frequency-note', noteName)}                   >Frequency</Menu>
                );

            case 'edit-set-command-frequency-note':
                const setNoteName = menuParam;
                return this.values.getNoteOctaves((octave) =>
                    <Menu onAction={e => this.instructionChangeCommand(`${setNoteName}${octave}`, false)}     >{setNoteName}{octave}</Menu>
                );

            case 'edit-set-command-named':
                return this.values.getAllNamedFrequencies((noteName, frequency, instrumentID) =>
                    <Menu onAction={e => this.instructionChangeCommand(noteName, false, instrumentID)}                    >{noteName}</Menu>
                );

            case 'edit-set-command-group':
                return <>
                    {this.values.getAllSongGroups((groupName) =>
                        groupName === this.groupName ? null :
                            <Menu onAction={e => this.instructionChangeCommand('@' + groupName, false)}                    >{groupName}</Menu>
                    )}
                    <Menu onAction={e => this.groupAdd()} hasBreak  >Create New Group</Menu>
                </>;

            case 'edit-select':
                return <>
                    <Menu onAction={e => this.trackerChangeSelection('segment')}      >Select Segment Instructions</Menu>
                    <Menu onAction={e => this.trackerChangeSelection('all')}       >Select All Song Instructions</Menu>
                    <Menu onAction={e => this.trackerChangeSelection('none')}       >Select No Instructions</Menu>
                    <Menu options={e => this.renderMenu('edit-select-batch')}  hasBreak                        >Batch Select</Menu>
                </>;

            case 'edit-select-batch':
                return <>
                    {Storage.getBatchRecentSearches().map((recentBatchSearch, i) =>
                        <Menu onAction={e => this.batchSelect(e, recentBatchSearch, true)}      >New Selection Command</Menu>
                    )}
                    <Menu onAction={e => this.batchSelect(e)} hasBreak      >New Selection Command</Menu>
                </>;

            case 'edit-batch':
                return <>
                    Storage.getBatchRecentCommands().map((recentBatchCommand, i) =>
                        <Menu options={e => this.renderMenu('edit-batch-recent', recentBatchCommand)}                          >{recentBatchCommand}</Menu>
                    ),
                    <Menu onAction={e => this.batchRunCommand(e)} hasBreak      >New Batch Command</Menu>
                </>;

            case 'edit-batch-recent':
                recentBatchCommand = menuParam;
                return <>
                    <Menu onAction={e => this.batchRunCommand(e, recentBatchCommand, true)}                   >Execute on Group</Menu>
                    <Menu options={e => this.renderMenu('edit-batch-recent-execute-search', recentBatchCommand)}    >Execute using Search</Menu>
                </>;

            case 'edit-batch-recent-execute-search':
                recentBatchCommand = menuParam;
                return <>
                    <Menu onAction={e => this.batchRunCommand(e, recentBatchCommand, null, true)}                   >New Search</Menu>
                    {Storage.getBatchRecentSearches().map((recentBatchSearch, i) =>
                        <Menu onAction={e => this.batchRunCommand(e, recentBatchCommand, recentBatchSearch)}                   >{recentBatchSearch}</Menu>
                    )}
                </>;

            case 'view':
                return <>
                    <Menu onAction={e => this.toggleFullscreen(e)}       >{this.props.fullscreen ? 'Disable' : 'Enable'} Fullscreen</Menu>,
                    <Menu onAction={e => this.togglePanelSong(e)}       >{this.props.hidePanelSongs ? 'Disable' : 'Enable'} Song Forms</Menu>,
                    <Menu onAction={e => this.togglePanelTracker(e)}       >{this.props.hidePanelTracker ? 'Disable' : 'Enable'} Tracker Forms</Menu>,
                    <Menu onAction={e => this.togglePanelInstruments(e)}       >{this.props.hidePanelInstrument ? 'Disable' : 'Enable'} Instrument Forms</Menu>,
                </>;

            case 'instrument':
                return <>
                    <Menu options={e => this.renderMenu('instrument-add')}    >Add instrument to song</Menu>,
                    {this.values.getSongInstruments((instrumentID, label) =>
                        <Menu onAction={e => this.renderMenu('instrument-edit', instrumentID)}       >{label}</Menu>)},
                </>;

            case 'instrument-add':
                return this.library.eachInstrument((instrumentConfig) =>
                    <Menu onAction={e => this.instrumentAdd(instrumentConfig)}       >{instrumentConfig.name}</Menu>);

            case 'instrument-edit':
                instrumentID = menuParam;
                return <>
                    <Menu options={e => this.renderMenu('instrument-edit-replace')}    >Replace</Menu>,
                    <Menu
                        onAction={e => this.instrumentRemove(instrumentID)}
                        disabled={!this.song.isInstrumentLoaded(instrumentID)}
                    >Remove from song</Menu>,
                </>;

            case 'instrument-edit-replace':
                return this.library.eachInstrument((instrumentConfig, i) =>
                    <Menu onAction={e => this.instrumentReplace(instrumentID, instrumentConfig)}       >{instrumentConfig.name}</Menu>
                );

            /** Group Menu **/
            case 'group':
                let groupCount = 0;
                return <>
                    <Menu onAction={e => this.groupAdd(e)}  hasBreak     >Add new group to song</Menu>
                    {this.values.getAllSongGroups((groupName) =>
                        <Menu options={e => this.renderMenu('group-edit', groupName)} hasBreak={groupCount++ === 0}    >{groupName}</Menu>)}
                </>;

            case 'group-edit':
                // const groupName = menuParam;
                return <>
                    <Menu onAction={e => this.groupRename(menuParam)}  hasBreak     >Rename group {menuParam}</Menu>,
                    <Menu onAction={e => this.groupRemove(menuParam)}  hasBreak     >Delete group {menuParam}</Menu>,
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
                                onFile={(e, file) => this.addInputFileToPlaylist(file)}
                                accept=".json,.mid,.midi"
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
                        >
                        {this.song.getInstrumentList().map((instrumentConfig, instrumentID) =>
                            <InstrumentRenderer
                                song={this.song}
                                props={instrumentConfig}
                                instrumentID={instrumentID}
                            />
                        )}
                        <Form className="instrument-add" title1="Add Instrument">
                            <InputSelect
                                className="instrument-add"
                                // onChange={(e, newVolume) => this.setVolume(newVolume / 100)}
                                value="Add Instrument"
                                options={() => InstrumentLoader.eachInstrumentClass((instrumentClass, instrumentName) =>
                                    <Menu onAction={e => this.instrumentAdd(instrumentClass.name)} >Add instrument '{instrumentName}'</Menu>
                                )}
                                title="Add Instrument"
                            />
                        </Form>
                    </Panel>

                    <Panel className="instructions" title="Instructions"
                           ref={ref=>this.panelInstructions = ref}
                    >
                        <Form className="instruction-command" title="Command">
                            <InputSelect
                                className="command"
                                value="-"

                                // selectElm.value ?
                                //     selectElm.getOptGroup('Current Octave', () => {
                                //         const currentOctave = this.fieldInstructionCommand.value.substr(-1, 1);
                                //         return this.values.getNoteFrequencies(freq => selectElm.getOption(freq + currentOctave, freq + currentOctave));
                                //     }) : null,
                                // // TODO: filter by selected instrument
                                options={() =>
                                    <>
                                         <Menu
                                            options={() => this.values.getOctaveNoteFrequencies(freq =>
                                                <Menu
                                                    onAction={() => this.instructionChangeCommand(freq)}
                                                    >{freq}</Menu>
                                            )}>Frequencies</Menu>
                                        <Menu
                                            options={() => this.values.getAllNamedFrequencies(namedFreq =>
                                                <Menu
                                                    onAction={() => this.instructionChangeCommand(namedFreq)}
                                                    >{namedFreq}</Menu>
                                            )}>Custom Frequencies</Menu>
                                        <Menu
                                            options={() => this.values.getAllSongGroups(group =>
                                                <Menu
                                                    onAction={() => this.instructionChangeCommand('@' + group)}
                                                    >@{group}</Menu>
                                            )}>Groups</Menu>
                                    </>
                                }


                            >
                            </InputSelect>
                            <InputButton
                                className="instruction-insert"
                                onAction={e => this.instructionInsert()}
                                title="Insert Instruction"
                            >
                                <Icon className="insert"/>
                            </InputButton>
                            <InputButton
                                className="instruction-delete"
                                onAction={e => this.instructionDelete(e)}
                                title="Delete Instruction"
                            >
                                <Icon className="delete"/>
                            </InputButton>
                        </Form>

                        <Form className="instruction-instrument" title="Instrument">
                            <InputSelect
                                className="instrument-instrument"
                                value="Select"
                                options={() =>
                                    this.values.getSongInstruments((id, name) =>
                                        <Menu onAction={(e) => this.instructionChangeInstrument(id)}>{name}</Menu>
                                    )
                                }
                                title="Song Instruments"
                            />
                        </Form>

                        <Form className="velocity" title="Velocity">
                            <InputRange
                                // className="velocity"
                                onChange={(e, newVelocity) => this.instructionChangeVelocity(newVelocity)}
                                // value={this.state.volume}
                                min={1}
                                max={127}
                                ref={ref => this.fieldInstrumentVelocity = ref}
                                title="Instrument Velocity"
                            />
                        </Form>


                        <Form className="instruction-duration" title="Duration">
                            <InputSelect
                                // className="instruction-duration"
                                options={() =>
                                    this.values.getNoteDurations((duration, title) =>
                                        <Menu onAction={(e) => this.instructionChangeDuration(duration)}>{title}</Menu>
                                    )
                                }
                                title="Load Song from File"
                            />
                        </Form>
                    </Panel>

                    <Panel className="tracker" title="Tracker">
                        <Form className="tracker-row-length" title="Row &#120491;">
                            <InputSelect
                                // className="tracker-row-length"
                                options={() =>
                                    this.values.getNoteDurations((duration, title) =>
                                        <Menu onAction={(e) => this.instructionChangeDuration(duration)}>{title}</Menu>
                                    )
                                }
                            >
                            </InputSelect>
                        </Form>

                        <Form className="tracker-segment-length" title="Seg &#120491;">
                            <InputSelect
                                // className="tracker-segment-length"
                                options={() =>
                                    this.values.getSegmentLengths((length, title) =>
                                        <Menu onAction={(e) => this.trackerChangeSegmentLength(length)}>{title}</Menu>
                                    )
                                }
                                title="Select Tracker Segment Length"
                            />
                        </Form>

                        <Form className="tracker-instrument" title="Instrument">
                            <InputSelect
                                // className="tracker-instrument"
                                options={() =>
                                    this.values.getSongInstruments((instrumentID, name) =>
                                        <Menu onAction={(e) => this.trackerChangeInstrumentFilter(instrumentID)}>{name}</Menu>
                                    )
                                }
                                title="Filter by Tracker Instrument"
                            />
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
                            <InputSelect
                                // className="tracker-selection"
                                options={() =>
                                    this.values.getNoteOctaves(octave =>
                                        <Menu onAction={(e) => this.trackerChangeOctave(octave)}>{octave}</Menu>
                                    )
                                }
                                title="Tracker Change Octave"
                            />
                        </Form>
                    </Panel>

                    <Panel className="tracker-groups" title="Groups">
                        {Object.keys(this.song.data.instructions).map((groupName, i) =>
                            <InputButton
                                selected={this.state.tracker.currentGroup === groupName}
                                onAction={e => this.trackerChangeGroup(groupName)}
                            >Group {groupName}</InputButton>)
                        }
                        <InputButton
                            onAction={e => this.groupAdd(e)}
                        >+</InputButton>)
                    </Panel>

                    <Panel className="tracker-row-segments" title="Tracker Segments">
                        {(() => {


                            const segmentLengthInTicks = this.state.tracker.segmentLengthInTicks || (this.song.getTimeDivision() * 16);
                            let songLengthInTicks = this.song.getSongLengthInTicks();
                            let rowSegmentCount = Math.ceil(songLengthInTicks / segmentLengthInTicks) || 1;
                            if (rowSegmentCount > 256)
                            rowSegmentCount = 256;

                            const buttons = [];

                            // let rowSegmentCount = Math.ceil(lastSegmentRowPositionInTicks / segmentLengthInTicks) + 1;
                            const currentRowSegmentID = this.state.tracker.currentRowSegmentID;
                            if (rowSegmentCount < currentRowSegmentID + 1)
                            rowSegmentCount = currentRowSegmentID + 1;
                            for (let segmentID = 0; segmentID <= rowSegmentCount; segmentID++)
                                buttons[segmentID] = <InputButton
                                    onAction={e => this.trackerChangeSegment(segmentID)}
                                    >+</InputButton>;
                            return buttons;
                        })()}
                        <InputButton
                            onAction={e => this.groupAdd(e)}
                        >+</InputButton>)
                    </Panel>
                </Div>
                <Div className="asc-tracker-container">
                    <Tracker
                        composer={this}
                        />
                </Div>
                <Footer player={this} ref={ref => this.footer = ref} />
            </Div>
        )
    }


    setStatus(newStatus) {
        console.info.apply(null, arguments); // (newStatus);
        this.status = newStatus;
        // this.setState({status: newStatus})
        if(this.footer)
            this.footer.forceUpdate();
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
        const cursorInstruction = this.song.instructionFind(this.state.tracker.currentGroup, this.state.tracker.selectedIndices[0]);


        if (cursorInstruction) {
            this.fieldInstructionCommand.value = cursorInstruction.command; // , "Unknown Instrument");
            this.fieldInstructionInstrument.addOrSetValue(cursorInstruction.instrument, cursorInstruction.instrument + ": Unknown Instrument");
            this.fieldInstructionVelocity.value = cursorInstruction.velocity;
            this.fieldInstructionDuration.value = cursorInstruction.duration;
        }

        this.fieldInstructionDelete.disabled = this.state.tracker.selectedIndices.length === 0;
        if (!this.fieldTrackerRowLength.value)
            this.fieldTrackerRowLength.setValue(this.song.getTimeDivision());
        // this.fieldTrackerRowLength.value = this.fieldTrackerRowLength.value; // this.song.getSongTimeDivision();
        if (!this.fieldInstructionDuration.value && this.fieldTrackerRowLength.value)
            this.fieldInstructionDuration.setValue(parseInt(this.fieldTrackerRowLength.value));


    }

    /** @deprecated shouldn't be used **/
    renderInstrument(instrumentID) {
        if (this.instruments[instrumentID])
            this.instruments[instrumentID].forceUpdate();
    }

    async renderInstruments() {
        // console.log("rendering instruments");
        clearTimeout(this.timeouts.renderInstruments);
        this.timeouts.renderInstruments = setTimeout(async () => {
            await this.panelInstruments.forceUpdate();
            await this.panelInstructions.forceUpdate();
        }, 200);
    }

}


export default ComposerRenderer
