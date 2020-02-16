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
            quantizationInTicks: null,
            segmentLengthInTicks: null,
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
                return [
                    <Menu vertical={vertical} key="file"        subMenu={e => this.renderMenu('file')}          >File</Menu>,
                    <Menu vertical={vertical} key="edit"        subMenu={e => this.renderMenu('edit')}          >Edit</Menu>,
                    <Menu vertical={vertical} key="group"       subMenu={e => this.renderMenu('group')}         >Group</Menu>,
                    <Menu vertical={vertical} key="instrument"  subMenu={e => this.renderMenu('instrument')}    >Instrument</Menu>,
                    <Menu vertical={vertical} key="playlist"    subMenu={e => this.renderMenu('playlist')}      >Playlist</Menu>,
                    <Menu vertical={vertical} key="view"        subMenu={e => this.renderMenu('view')}          >View</Menu>
                ];

            case 'file':
                return [
                    <Menu action={e => this.loadNewSongData(e)}                         >New song</Menu>,
                    <Menu subMenu={e => this.renderMenu('file-open')}           >Open song</Menu>,
                    <Menu subMenu={e => this.renderMenu('file-save')}           >Save song</Menu>,
                    <Menu subMenu={e => this.renderMenu('file-import')}         >Import song</Menu>,
                    <Menu subMenu={e => this.renderMenu('file-export')}         >Export song</Menu>,
                ];

            case 'file-open':
                return [
                    <Menu subMenu={e => this.renderMenu('file-open-memory')}    >Import song</Menu>,
                    <Menu action={e => this.openSongFromFile(e)}                        >from File</Menu>,
                    <Menu action={e => this.loadSongFromURL(e)}                         >from URL</Menu>,
                ];


            case 'file-save':
                return [
                    <Menu action={e => this.saveSongToMemory(e)}                        >to Memory</Menu>,
                    <Menu action={e => this.saveSongToFile(e)}                          >to File</Menu>,
                ];

            case 'file-import':
                return [
                    <Menu action={e => this.openSongFromFile(e, '.mid,.midi')}          >from MIDI File</Menu>,
                    // this.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
                    // menuFileImportSongFromMIDI.action = (e) => this.onAction(e, 'song:load-from-midi-file');
                    // menuFileImportSongFromMIDI.disabled = true;
                ];

            case 'file-export':
                return [
                    <Menu disabled>to MIDI File</Menu>,
                ];

            case 'file-memory':
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
                return [
                    <Menu subMenu={e => this.renderMenu('edit-insert')}    >Insert Command</Menu>,
                    // menuEditInsertCommand.disabled = selectedIndices.length > 0; // !this.cursorCell;
                    // menuEditInsertCommand.action = handleAction('song:new');

                    (this.state.tracker.selectedIndices.length === 0 ? null :
                        <Menu subMenu={e => this.renderMenu('edit-set')} hasBreak   >Set Command</Menu>),

                    /** Select Instructions **/
                    <Menu subMenu={e => this.renderMenu('edit-select')} hasBreak   >Select</Menu>,

                    /** Batch Instructions **/
                    <Menu subMenu={e => this.renderMenu('edit-batch')} hasBreak   >Batch</Menu>,
                ];
            // const menuEditGroup = MENU.getOrCreateSubMenu('group', 'Group ►');
            // menuEditGroup.hasBreak = true;
            // menuEditGroup.disabled = true;

            case 'edit-insert':
                return [
                    <Menu subMenu={e => this.renderMenu('edit-insert-frequency')} hasBreak          >Frequency</Menu>,
                    <Menu subMenu={e => this.renderMenu('edit-insert-named')} hasBreak              >Named</Menu>,
                    <Menu subMenu={e => this.renderMenu('edit-insert-group')} hasBreak              >Group</Menu>,
                    <Menu action={e => this.instructionInsert(null, true)} hasBreak   >Custom Command</Menu>,
                ];

            case 'edit-insert-group':
                return [
                    this.values.getAllSongGroups((groupName) =>
                        <Menu
                            subMenu={e => this.renderMenu('edit-insert-frequency')}
                            disabled={groupName === this.state.tracker.currentGroup}
                            action={e => this.instructionInsert('@' + groupName, false)}
                            >{groupName}</Menu>),
                    <Menu
                        hasBreak
                        action={e => this.groupAdd(e)}
                        >Create New Group</Menu>
                ];

            case 'edit-insert-named':
                return this.values.getAllNamedFrequencies(
                    (noteName, frequency, instrumentID) => <Menu
                        action={e => this.instructionInsert(noteName, false, instrumentID)}
                        >{noteName}</Menu>
                );

            case 'edit-insert-frequency':
                return this.values.getNoteFrequencies((noteName, label) => <Menu
                        subMenu={e => this.renderMenu('edit-insert-frequency', noteName)}
                    >{noteName}</Menu>
                );

            case 'edit-insert-frequency-note':
                const insertNoteName = menuParam;
                return this.values.getNoteOctaves((octave) => <Menu
                        action={e => this.instructionInsert(`${insertNoteName}${octave}`, false)}
                    >{insertNoteName}{octave}</Menu>
                );


            case 'edit-set':
                return [
                    <Menu subMenu={e => this.renderMenu('edit-set-command')} hasBreak          >Set Command</Menu>,
                    <Menu subMenu={e => this.renderMenu('edit-set-instrument')} hasBreak          >Set Instrument</Menu>,
                    <Menu subMenu={e => this.renderMenu('edit-set-duration')} hasBreak          >Set Duration</Menu>,
                    <Menu subMenu={e => this.renderMenu('edit-set-velocity')} hasBreak          >Set Velocity</Menu>,
                    <Menu action={e => this.instructionDelete(e)} hasBreak   >Delete Instruction(s)</Menu>,
                ];

            case 'edit-set-command':
                return [
                    <Menu subMenu={e => this.renderMenu('edit-set-command-frequency')}                      >Frequency</Menu>,
                    <Menu subMenu={e => this.renderMenu('edit-set-command-named')}                          >Named</Menu>,
                    <Menu subMenu={e => this.renderMenu('edit-set-command-group')}                          >Group</Menu>,
                    <Menu action={e => this.instructionChangeCommand(null, true)} hasBreak      >Custom Command</Menu>,
                ];

            case 'edit-set-instrument':
                return this.values.getSongInstruments((instrumentID, label) =>
                    <Menu action={e => this.instructionChangeInstrument(instrumentID)}  >{label}</Menu>
                )

            case 'edit-set-duration':
                return [
                    this.values.getNoteDurations((durationInTicks, durationName) =>
                        <Menu action={e => this.instructionChangeDuration(durationInTicks)}  >{durationName}</Menu>),
                    <Menu action={e => this.instructionChangeDuration(null, true)} hasBreak >Custom Duration</Menu>
                ];

            case 'edit-set-velocity':
                return [
                    this.values.getNoteVelocities((velocity) =>
                        <Menu action={e => this.instructionChangeVelocity(velocity)}  >{velocity}</Menu>),
                    <Menu action={e => this.instructionChangeVelocity(null, true)} hasBreak >Custom Velocity</Menu>
                ];

            case 'edit-set-command-frequency':
                return this.values.getNoteFrequencies((noteName, label) =>
                    <Menu subMenu={e => this.renderMenu('edit-set-command-frequency-note', noteName)}                   >Frequency</Menu>,
                );

            case 'edit-set-command-frequency-note':
                const setNoteName = menuParam;
                return this.values.getNoteOctaves((octave) =>
                    <Menu action={e => this.instructionChangeCommand(`${setNoteName}${octave}`, false)}     >{setNoteName}{octave}</Menu>,
                );

            case 'edit-set-command-named':
                return this.values.getAllNamedFrequencies((noteName, frequency, instrumentID) =>
                    <Menu action={e => this.instructionChangeCommand(noteName, false, instrumentID)}                    >{noteName}</Menu>
                );

            case 'edit-set-command-group':
                return [
                    this.values.getAllSongGroups((groupName) =>
                        groupName === this.groupName ? null :
                            <Menu action={e => this.instructionChangeCommand('@' + groupName, false)}                    >{groupName}</Menu>
                    ),
                    <Menu action={e => this.groupAdd()} hasBreak  >Create New Group</Menu>
                ];

            case 'edit-select':
                return [
                    <Menu action={e => this.trackerChangeSelection('segment')}      >Select Segment Instructions</Menu>,
                    <Menu action={e => this.trackerChangeSelection('all')}       >Select All Song Instructions</Menu>,
                    <Menu action={e => this.trackerChangeSelection('none')}       >Select No Instructions</Menu>,
                    <Menu subMenu={e => this.renderMenu('edit-select-batch')}  hasBreak                        >Batch Select</Menu>,
                ];

            case 'edit-select-batch':
                return [

                    Storage.getBatchRecentSearches().map((recentBatchSearch, i) =>
                        <Menu action={e => this.batchSelect(e, recentBatchSearch, true)}      >New Selection Command</Menu>,
                    ),
                    <Menu action={e => this.batchSelect(e)} hasBreak      >New Selection Command</Menu>,
                ];

            case 'edit-batch':
                return [
                    Storage.getBatchRecentCommands().map((recentBatchCommand, i) =>
                        <Menu subMenu={e => this.renderMenu('edit-batch-recent', recentBatchCommand)}                          >{recentBatchCommand}</Menu>,
                    ),
                    <Menu action={e => this.batchRunCommand(e)} hasBreak      >New Batch Command</Menu>,
                ];

            case 'edit-batch-recent':
                recentBatchCommand = menuParam;
                return [
                    <Menu action={e => this.batchRunCommand(e, recentBatchCommand, true)}                   >Execute on Group</Menu>,
                    <Menu subMenu={e => this.renderMenu('edit-batch-recent-execute-search', recentBatchCommand)}    >Execute using Search</Menu>,
                ];

            case 'edit-batch-recent-execute-search':
                recentBatchCommand = menuParam;
                return [
                    <Menu action={e => this.batchRunCommand(e, recentBatchCommand, null, true)}                   >New Search</Menu>,
                    Storage.getBatchRecentSearches().map((recentBatchSearch, i) =>
                        <Menu action={e => this.batchRunCommand(e, recentBatchCommand, recentBatchSearch)}                   >{recentBatchSearch}</Menu>,
                    )
                ];

            case 'view':
                return [
                    <Menu action={e => this.toggleFullscreen(e)}       >{this.props.fullscreen ? 'Disable' : 'Enable'} Fullscreen</Menu>,
                    <Menu action={e => this.togglePanelSong(e)}       >{this.props.hidePanelSongs ? 'Disable' : 'Enable'} Song Forms</Menu>,
                    <Menu action={e => this.togglePanelTracker(e)}       >{this.props.hidePanelTracker ? 'Disable' : 'Enable'} Tracker Forms</Menu>,
                    <Menu action={e => this.togglePanelInstruments(e)}       >{this.props.hidePanelInstrument ? 'Disable' : 'Enable'} Instrument Forms</Menu>,
                ];

            case 'instrument':
                return [
                    <Menu subMenu={e => this.renderMenu('instrument-add')}    >Add instrument to song</Menu>,

                    this.values.getSongInstruments((instrumentID, label) =>
                        <Menu action={e => this.renderMenu('instrument-edit', instrumentID)}       >{label}</Menu>),
                ];

            case 'instrument-add':
                return this.library.eachInstrument((instrumentConfig) =>
                    <Menu action={e => this.instrumentAdd(instrumentConfig)}       >{instrumentConfig.name}</Menu>);

            case 'instrument-edit':
                instrumentID = menuParam;
                return [
                    <Menu subMenu={e => this.renderMenu('instrument-edit-replace')}    >Replace</Menu>,
                    <Menu
                        action={e => this.instrumentRemove(instrumentID)}
                        disabled={!this.song.isInstrumentLoaded(instrumentID)}
                    >Remove from song</Menu>,
                ];

            case 'instrument-edit-replace':
                return this.library.eachInstrument((instrumentConfig, i) =>
                    <Menu action={e => this.instrumentReplace(instrumentID, instrumentConfig)}       >{instrumentConfig.name}</Menu>
                );

            /** Group Menu **/
            case 'group':
                let groupCount = 0;
                return [
                    <Menu action={e => this.groupAdd(e)}  hasBreak     >Add new group to song</Menu>,
                    this.values.getAllSongGroups((groupName) =>
                        <Menu subMenu={e => this.renderMenu('group-edit', groupName)} hasBreak={groupCount++ === 0}    >{groupName}</Menu>)
                ];

            case 'group-edit':
                const groupName = menuParam;
                return [
                    <Menu action={e => this.groupRename(groupName)}  hasBreak     >Rename group {groupName}</Menu>,
                    <Menu action={e => this.groupRemove(groupName)}  hasBreak     >Delete group {groupName}</Menu>,
                ]

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

                    <Panel className="instruments" title="Instruments">
                        {this.song.getInstrumentList().map((instrumentConfig, instrumentID) =>
                            <InstrumentRenderer
                                song={this.song}
                                props={instrumentConfig}
                                instrumentID={instrumentID}
                            />
                        )}
                        <Form className="instrument-add" title="Add Instrument">
                            <InputSelect
                                className="instrument-add"
                                // onChange={(e, newVolume) => this.setVolume(newVolume / 100)}
                                value={this.state.volume}
                                options={this.library.eachInstrument(instrumentConfig =>
                                    <Menu action={e => this.instrumentAdd(instrumentConfig.class)} />
                                )}
                                title="Add Instrument"
                            />
                        </Form>
                    </Panel>

                    <Panel className="instructions" title="Instructions">
                        <Form className="instruction-command" title="Command">
                            <InputSelect
                                className="command"
                                onAction={commandString => this.instructionChangeCommand(commandString)}

                                // options={}

                                    // const selectedInstrumentID = this.fieldInstructionInstrument ? parseInt(this.fieldInstructionInstrument.value) : 0;
                                    // selectElm.getOption(null, 'Select'),
                                    // selectElm.value ?
                                    //     selectElm.getOptGroup('Current Octave', () => {
                                    //         const currentOctave = this.fieldInstructionCommand.value.substr(-1, 1);
                                    //         return this.values.getNoteFrequencies(freq => selectElm.getOption(freq + currentOctave, freq + currentOctave));
                                    //     }) : null,
                                    // selectElm.getOptGroup('Frequencies', () =>
                                    //     this.values.getOctaveNoteFrequencies(freq => selectElm.getOption(freq, freq)),
                                    // ),
                                    //
                                    // selectElm.getOptGroup('Custom Frequencies', () =>
                                    //     this.values.getAllNamedFrequencies(namedFreq => selectElm.getOption(namedFreq, namedFreq)),
                                    // ),
                                    // // TODO: filter by selected instrument
                                    //
                                    // selectElm.getOptGroup('Groups', () =>
                                    //     this.values.getAllSongGroups(group => selectElm.getOption('@' + group, '@' + group)),
                                    // ),


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
                                        <Menu action={(e) => this.instructionChangeInstrument(id)}>{name}</Menu>
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
                                        <Menu action={(e) => this.instructionChangeDuration(duration)}>{title}</Menu>
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
                                        <Menu action={(e) => this.instructionChangeDuration(duration)}>{title}</Menu>
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
                                        <Menu action={(e) => this.trackerChangeSegmentLength(length)}>{title}</Menu>
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
                                        <Menu action={(e) => this.trackerChangeInstrumentFilter(instrumentID)}>{name}</Menu>
                                    )
                                }
                                title="Filter by Tracker Instrument"
                            />
                        </Form>

                        <Form className="tracker-selection" title="Selection">
                            <InputText
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
                                        <Menu action={(e) => this.trackerChangeOctave(octave)}>{octave}</Menu>
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
                <Footer player={this} />
            </Div>
        )
    }


    // render2() {
    //     return [
    //         this.containerElm = Div.createElement('asc-container', [
    //             Header.cE({
    //                 // portrait: !!this.state.portrait,
    //                 key: 'asc-title-container',
    //                 menuContent: () => this.renderMenu(this.state.menuKey),
    //                 // onMenuPress: (e) => this.toggleMenu()
    //             }),
    //
    //             Div.createElement('asc-panel-container', [
    //                 ASCPanel.createElement('song', [
    //                     Div.cE('title', 'Song'),
    //
    //                     ASCForm.createElement('playback',  [
    //                         Div.cE('title', 'Playback'),
    //                         InputButton.createInputButton('play',
    //                             Icon.createIcon('play'),
    //                             e => this.songPlay(e),
    //                             "Play Song"),
    //                         InputButton.createInputButton('pause',
    //                             Icon.createIcon('pause'),
    //                             e => this.songPause(e),
    //                             "Pause Song"),
    //                         // this.fieldSongPlaybackPause.disabled = true;
    //                         InputButton.createInputButton('stop',
    //                             Icon.createIcon('stop'),
    //                             e => this.songStop(e),
    //                             "Stop Song")
    //                     ]),
    //
    //                     ASCForm.createElement('timing', [
    //                         Div.cE('title', 'Timing'),
    //                         InputText.createInputText('timing',
    //                             (e, pos) => this.setSongPosition(pos),
    //                             '00:00:000',
    //                             'Song Timing',
    //                             ref => this.fieldSongTiming = ref
    //                         )
    //                     ]),
    //
    //                     ASCForm.createElement('position', [
    //                         Div.cE('title', 'Position'),
    //                         ASUIInputRange.createInputRange('position',
    //                             (e, pos) => this.setSongPosition(pos),
    //                             0,
    //                             Math.ceil(this.song.getSongLengthInSeconds()),
    //                             0,
    //                             'Song Position',
    //                             ref => this.fieldSongPosition = ref
    //                         )
    //                     ]),
    //
    //                     ASCForm.createElement('volume', [
    //                         Div.cE('title', 'Volume'),
    //                         ASUIInputRange.createInputRange('volume',
    //                             (e, newVolume) => this.setVolume(newVolume/100),
    //                             1,
    //                             100,
    //                             this.state.volume*100,
    //                             'Song Volume',
    //                             ref => this.fieldSongVolume = ref
    //                         )
    //                     ]),
    //
    //                     ASCForm.createElement('file', [
    //                         Div.cE('title', 'File'),
    //                         this.fieldSongFileLoad = new ASUIInputFile('file-load',
    //                             e => this.loadSongFromFileInput(),
    //                             Icon.createIcon('file-load'),
    //                             `.json,.mid,.midi`,
    //                             "Load Song from File"
    //                         ),
    //                         this.fieldSongFileSave = InputButton.createInputButton('file-save',
    //                             Icon.createIcon('file-save'),
    //                             e => this.saveSongToFile(),
    //                             "Save Song to File"
    //                         ),
    //                     ]),
    //
    //
    //                     ASCForm.createElement('name', [
    //                         Div.cE('title', 'Name'),
    //                         InputText.createInputText('name',
    //                             (e, newSongName) => this.setSongName(e, newSongName),
    //                             this.song.getName(),
    //                             "Song Name",
    //                             ref => this.fieldSongName = ref
    //                         )
    //                     ]),
    //
    //                     ASCForm.createElement('version', [
    //                         Div.cE('title', 'Version'),
    //                         InputText.createInputText('version',
    //                             (e, newSongVersion) => this.setSongVersion(e, newSongVersion),
    //                             this.song.getVersion(),
    //                             "Song Version",
    //                             ref => this.fieldSongVersion = ref)
    //                     ]),
    //
    //                     ASCForm.createElement('bpm', [
    //                         Div.cE('title', 'BPM'),
    //                         InputText.createInputText('bpm',
    //                             (e, newBPM) => this.songChangeStartingBPM(e, parseInt(newBPM)),
    //                             this.song.getStartingBeatsPerMinute(),
    //                             "Song BPM",
    //                             ref => this.fieldSongBPM = ref
    //                         )
    //                         // this.fieldSongBPM.inputElm.setAttribute('type', 'number')
    //                     ]),
    //                 ]),
    //
    //                 this.panelInstruments = ASCPanel.createElement('instruments', [
    //                     Div.cE('title', 'Instruments'),
    //                     () => {
    //                         // const instrumentPanel = this.panelInstruments;
    //                         this.instruments = [];
    //                         const instrumentList = this.song.getInstrumentList();
    //                         const content = instrumentList.map((instrumentConfig, instrumentID) =>
    //                             this.instruments[instrumentID] = new InstrumentRenderer({}, this.song, instrumentID));
    //
    //                         content.push(ASCForm.createElement('new', null, [
    //                             new ASUIInputSelect('add-url',
    //                                 (s) => [
    //                                     // const instrumentLibrary = await Library.loadFromURL(this.defaultLibraryURL);
    //                                     // s.getOption('', 'Add instrument'),
    //                                     instrumentLibrary.eachInstrument((instrumentConfig) =>
    //                                         s.getOption(instrumentConfig.url, instrumentConfig.name)),
    //                                 ],
    //                                 (e, changeInstrumentURL) => this.instrumentAdd(changeInstrumentURL),
    //                                 '',
    //                                 'Add instrument')
    //                         ]));
    //                         return content;
    //                     }
    //                 ]),
    //
    //                 Div.createElement('break'),
    //
    //                 this.panelInstructions = ASCPanel.createElement('instructions', [
    //                     Div.cE('title', 'Selected Instruction(s)'),
    //                     ASCForm.createElement('instruction-command', [
    //                         Div.cE('title', 'Command'),
    //                         this.fieldInstructionCommand = new ASUIInputSelect(
    //                             'command',
    //                             (selectElm) => [
    //                                 // const selectedInstrumentID = this.fieldInstructionInstrument ? parseInt(this.fieldInstructionInstrument.value) : 0;
    //                                 selectElm.getOption(null, 'Select'),
    //                                 selectElm.value ?
    //                                     selectElm.getOptGroup('Current Octave', () => {
    //                                         const currentOctave = this.fieldInstructionCommand.value.substr(-1, 1);
    //                                         return this.values.getNoteFrequencies(freq => selectElm.getOption(freq + currentOctave, freq + currentOctave));
    //                                     }) : null,
    //                                 selectElm.getOptGroup('Frequencies', () =>
    //                                     this.values.getOctaveNoteFrequencies(freq => selectElm.getOption(freq, freq)),
    //                                 ),
    //
    //                                 selectElm.getOptGroup('Custom Frequencies', () =>
    //                                     this.values.getAllNamedFrequencies(namedFreq => selectElm.getOption(namedFreq, namedFreq)),
    //                                 ),
    //                                 // TODO: filter by selected instrument
    //
    //                                 selectElm.getOptGroup('Groups', () =>
    //                                     this.values.getAllSongGroups(group => selectElm.getOption('@' + group, '@' + group)),
    //                                 ),
    //                             ],
    //                             (e, commandString) => this.instructionChangeCommand(commandString),
    //                         ),
    //
    //                         this.fieldInstructionInsert = InputButton.createInputButton(
    //                             'insert',
    //                             Icon.createIcon('insert'),
    //                             e => this.instructionInsert(),
    //                             "Insert Instruction"),
    //
    //                         this.fieldInstructionDelete = InputButton.createInputButton('delete',
    //                             Icon.createIcon('delete'),
    //                             e => this.instructionDelete(e),
    //                             "Delete Instruction"),
    //
    //                     ]),
    //
    //                     ASCForm.createElement('instruction-instrument', [
    //                         Div.cE('title', 'Instrument'),
    //                         this.fieldInstructionInstrument = new ASUIInputSelect('instrument',
    //                             (selectElm) => [
    //                                 selectElm.getOption(null, 'Select'),
    //                                 selectElm.getOptGroup('Song Instruments',
    //                                     () => this.values.getSongInstruments((id, name) => selectElm.getOption(id, name))
    //                                 ),
    //                             ],
    //                             e => this.instructionChangeInstrument(),
    //                         )
    //                     ]),
    //
    //                     ASCForm.createElement('instruction-velocity', [
    //                         Div.cE('title', 'Velocity'),
    //                         this.fieldInstructionVelocity = ASUIInputRange.createInputRange('velocity',
    //                             (e, newVelocity) => this.instructionChangeVelocity(newVelocity),
    //                             1,
    //                             127,
    //                             this.state.volume,
    //                             "Velocity",
    //                             ref => this.fieldSongVolume = ref
    //                         )
    //                     ]),
    //
    //                     ASCForm.createElement('instruction-duration', [
    //                         Div.cE('title', 'Duration'),
    //                         this.fieldInstructionDuration = new ASUIInputSelect('duration',
    //                             (selectElm) => [
    //                                 selectElm.getOption(null, 'No Duration'),
    //                                 this.values.getNoteDurations((duration, title) => selectElm.getOption(duration, title))
    //                             ],
    //                             e => this.instructionChangeDuration(),
    //                         ),
    //                     ]),
    //
    //                 ]),
    //
    //                 this.panelTracker = ASCPanel.createElement('tracker', [
    //                     Div.cE('title', 'Tracker'),
    //                     ASCForm.createElement('tracker-row-length', [
    //                         Div.cE('title', 'Row &#120491;'),
    //                         this.fieldTrackerRowLength = new ASUIInputSelect('row-length',
    //                             (selectElm) => [
    //                                 selectElm.getOption(null, 'Default'),
    //                                 this.values.getNoteDurations((duration, title) => selectElm.getOption(duration, title)),
    //                             ],
    //                             e => this.trackerChangeRowLength(),
    //                             this.state.trackerRowLength),
    //                     ]),
    //                     ASCForm.createElement('tracker-segment-length', [
    //                         Div.cE('title', 'Seg &#120491;'),
    //                         this.fieldTrackerSegmentLength = new ASUIInputSelect('segment-length',
    //                             (selectElm) => [
    //                                 selectElm.getOption(null, 'Default'),
    //                                 this.values.getSegmentLengths((length, title) => selectElm.getOption(length, title)),
    //                             ],
    //                             (e, segmentLengthInTicks) => this.trackerChangeSegmentLength(segmentLengthInTicks),
    //                             this.state.trackerSegmentLength),
    //                     ]),
    //                     ASCForm.createElement('tracker-instrument', [
    //                         Div.cE('title', 'Instrument'),
    //                         this.fieldTrackerFilterInstrument = new ASUIInputSelect('filter-instrument',
    //                             (selectElm) => [
    //                                 selectElm.getOption(null, 'No Filter'),
    //                                 this.values.getSongInstruments((id, name) => selectElm.getOption(id, name))
    //                             ],
    //                             (e, instrumentID) => this.trackerChangeInstrumentFilter(instrumentID),
    //                             null),
    //                     ]),
    //                     ASCForm.createElement('tracker-selection', [
    //                         Div.cE('title', 'Selection'),
    //                         InputText.createInputText('selection',
    //                             e => this.trackerChangeSelection(),
    //                             '',
    //                             'Selection',
    //                             ref => this.fieldTrackerSelection = ref,
    //                             // 'No selection'
    //                         ),
    //                     ]),
    //                     ASCForm.createElement('tracker-octave', [
    //                         Div.cE('title', 'Octave'),
    //                         this.fieldTrackerOctave = new ASUIInputSelect('octave',
    //                             (selectElm) => [
    //                                 selectElm.getOption(null, 'Default'),
    //                                 this.values.getNoteOctaves(opt => selectElm.getOption(opt, opt)),
    //                             ],
    //                             e => this.trackerChangeOctave(),
    //                             // addOption('', 'No Octave Selected');
    //                             3),
    //                     ]),
    //
    //
    //                     // this.querySelectorAll('.multiple-count-text').forEach((elm) => elm.innerHTML = (selectedIndices.length > 1 ? '(s)' : ''));
    //
    //                     // Status Fields
    //
    //                     // const trackerOctave = this.fieldTrackerOctave.value;
    //                     // this.fieldTrackerOctave.value = trackerOctave !== null ? trackerOctave : 3;
    //                     // if(this.fieldTrackerOctave.value === null)
    //                     //     this.fieldTrackerOctave.value = 3; // this.status.currentOctave;
    //                 ]),
    //
    //                 this.panelTrackerGroups = ASCPanel.createElement('tracker-groups', [
    //                     Div.cE('title', 'Groups'),
    //                     () => {
    //                         const currentGroupName = this.state.tracker.currentGroup;
    //                         const content = Object.keys(this.song.data.instructions).map((groupName, i) => [
    //                             // const buttonForm = panelTrackerGroups.addForm(groupName);
    //                             InputButton.createInputButton(
    //                                 {selected: currentGroupName === groupName},
    //                                 groupName,
    //                                 e => this.trackerChangeGroup(groupName),
    //                                 "Group " + groupName,
    //                             )
    //                             // panelTrackerGroups.classList.toggle('selected', groupName === this.groupName);
    //                             // TODO button.classList.toggle('selected', groupName === currentGroupName);
    //                         ]);
    //
    //                         content.push(InputButton.createInputButton(
    //                             'add-group',
    //                             '+',
    //                             e => this.groupAdd(e)
    //                         ));
    //                         return content;
    //                     }
    //                 ]),
    //
    //                 this.panelTrackerRowSegments = ASCPanel.createElement('tracker-row-segments', [
    //                     Div.cE('title', 'Tracker Segments'),
    //                     () => {
    //                         const segmentLengthInTicks = this.state.tracker.segmentLengthInTicks || (this.song.getTimeDivision() * 16);
    //                         let songLengthInTicks = this.song.getSongLengthInTicks();
    //                         let rowSegmentCount = Math.ceil(songLengthInTicks / segmentLengthInTicks) || 1;
    //                         if (rowSegmentCount > 256)
    //                             rowSegmentCount = 256;
    //
    //                         this.panelTrackerRowSegmentButtons = [];
    //
    //                         // let rowSegmentCount = Math.ceil(lastSegmentRowPositionInTicks / segmentLengthInTicks) + 1;
    //                         const currentRowSegmentID = this.state.tracker.currentRowSegmentID;
    //                         if (rowSegmentCount < currentRowSegmentID + 1)
    //                             rowSegmentCount = currentRowSegmentID + 1;
    //                         for (let segmentID = 0; segmentID <= rowSegmentCount; segmentID++) {
    //                             this.panelTrackerRowSegmentButtons[segmentID] = InputButton.createInputButton(
    //                                 {selected: segmentID === currentRowSegmentID},
    //                                 segmentID,
    //                                 e => this.trackerChangeSegment(segmentID),
    //                                 "Segment " + segmentID);
    //                             // panelElm.classList.toggle('selected', segmentID === currentRowSegmentID);
    //                             // button.classList.toggle('selected', segmentID === currentRowSegmentID);
    //                         }
    //                         return this.panelTrackerRowSegmentButtons;
    //                     }
    //                 ]),
    //             ]),
    //
    //             Div.createElement('asc-tracker-container', [
    //                 Tracker.createElement({
    //                     key: 'asc-tracker',
    //                     tabindex: 0,
    //                     composer: this,
    //                     ref: ref => this.tracker = ref
    //                 }, )
    //             ]),
    //
    //             Div.cE('asc-status-container', [
    //                 Div.cE({key: 'asc-status-text', ref:ref=>this.textStatus=ref}, () => this.state.status),
    //                 Div.cE({key: 'asc-version-text', ref:ref=>this.textVersion=ref}, () => this.state.version),
    //             ]),
    //         ])
    //     ];
    // }


    setStatus(newStatus) {
        console.info.apply(null, arguments); // (newStatus);
        this.state.status = newStatus;
        if(this.textStatus)
            this.textStatus.forceUpdate();
    }

    setVersion(versionString) {
        this.state.version = versionString;
        if(this.textVersion)
            this.textVersion.forceUpdate();
    }


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

class ASCPanel extends Div {
    constructor(props = {}, title, contentCallback) {
        super(props, contentCallback);
        this.state.title = title;
    }

    render() {
        return [
            this.state.title ? Div.createElement('title', this.state.title) : null,
            super.render()
        ]
    }
}

// if(isBrowser)
    // customElements.define('asc-panel', ASCPanel);

class ASCForm extends ASCPanel {
}

// if(isBrowser)
    // customElements.define('asc-form', ASCForm);


export default ComposerRenderer
