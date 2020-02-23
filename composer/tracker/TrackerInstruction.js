import * as React from "react";
import {
    TrackerInstructionParameter
} from "./";
import Div from "../../components/div/Div";
// import TrackerDelta from "./TrackerDelta";

import "./assets/TrackerInstruction.css";
import {ActionMenu, MenuBreak, SubMenu} from "../../components/menu";
import Storage from "../../song/Storage";

class TrackerInstruction extends React.Component {
    // play() {
    //     const composer = this.props.composer;
    //     composer.song.playInstructionAtIndex(destination, this.state.tracker.currentGroup, this.index, composer.song.getAudioContext().currentTime);
    //     return this;
    // }
    renderMenu(menuKey=null, menuParam=null) {
        let octave;
        switch (menuKey) {

            case 'edit-set':
                return <>
                    <SubMenu options={e => this.renderMenu('edit-set-command')} hasBreak>Set Command</SubMenu>
                    <SubMenu options={e => this.renderMenu('edit-set-instrument')} hasBreak>Set Instrument</SubMenu>
                    <SubMenu options={e => this.renderMenu('edit-set-duration')} hasBreak>Set Duration</SubMenu>
                    <SubMenu options={e => this.renderMenu('edit-set-velocity')} hasBreak>Set Velocity</SubMenu>
                    <ActionMenu onAction={e => this.instructionDelete(e)} hasBreak>Delete Instruction(s)</ActionMenu>
                </>;

            case 'edit-set-command':
                return <>
                    <SubMenu options={e => this.renderMenu('edit-set-command-current-octave')}>Current Octave</SubMenu>
                    <MenuBreak/>
                    <SubMenu options={e => this.renderMenu('edit-set-command-frequency')}>By Frequency</SubMenu>
                    <SubMenu options={e => this.renderMenu('edit-set-command-octave')}>By Octave</SubMenu>
                    <MenuBreak/>
                    <SubMenu options={e => this.renderMenu('edit-set-command-named')}>By Alias</SubMenu>
                    <SubMenu options={e => this.renderMenu('edit-set-command-group')}>By Group</SubMenu>
                    <ActionMenu onAction={e => this.instructionChangeCommand(null, true)} hasBreak>Custom</ActionMenu>
                </>;

            case 'edit-set-instrument':
                return this.values.getSongInstruments((instrumentID, label) =>
                    <ActionMenu key={instrumentID}
                                onAction={e => this.instructionChangeInstrument(instrumentID)}>{label}</ActionMenu>
                );

            case 'edit-set-duration':
                return <>
                    {this.values.getNoteDurations((durationInTicks, durationName) =>
                        <ActionMenu key={durationInTicks}
                                    onAction={e => this.instructionChangeDuration(durationInTicks)}>{durationName}</ActionMenu>)}
                    <ActionMenu onAction={e => this.instructionChangeDuration(null, true)} hasBreak>Custom
                        Duration</ActionMenu>
                </>;

            case 'edit-set-velocity':
                return <>
                    {this.values.getNoteVelocities((velocity) =>
                        <ActionMenu key={velocity}
                                    onAction={e => this.instructionChangeVelocity(velocity)}>{velocity}</ActionMenu>)}
                    <ActionMenu onAction={e => this.instructionChangeVelocity(null, true)} hasBreak>Custom
                        Velocity</ActionMenu>
                </>;

            case 'edit-set-command-frequency':
                return this.values.getNoteFrequencies((noteName) =>
                    <SubMenu key={noteName}
                             options={e => this.renderMenu('edit-set-command-frequency-note', noteName)}>{noteName}</SubMenu>
                );

            case 'edit-set-command-frequency-note':
                const setNoteName = menuParam;
                return this.values.getNoteOctaves((octave) =>
                    <ActionMenu key={octave}
                                onAction={e => this.instructionChangeCommand(`${setNoteName}${octave}`, false)}>{setNoteName}{octave}</ActionMenu>
                );

            case 'edit-set-command-current-octave':
                octave = menuParam !== null ? menuParam : this.state.trackerCurrentOctave;
                return this.values.getNoteFrequencies((noteName) =>
                    <ActionMenu key={noteName}
                                onAction={e => this.instructionChangeCommand(`${noteName}${octave}`, false)}>{noteName}{octave}</ActionMenu>
                );

            case 'edit-set-command-octave':
                return this.values.getNoteOctaves((octave) =>
                    <SubMenu key={octave}
                             options={e => this.renderMenu('edit-set-command-octave-frequency', octave)}>{octave}</SubMenu>
                );

            case 'edit-set-command-octave-frequency':
                octave = menuParam;
                return this.values.getNoteFrequencies((noteName) =>
                    <ActionMenu key={noteName}
                                onAction={e => this.instructionChangeCommand(`${noteName}${octave}`, false)}>{noteName}{octave}</ActionMenu>
                );

            case 'edit-set-command-named':
                return this.values.getAllNamedFrequencies((noteName, frequency, instrumentID) =>
                    <ActionMenu key={noteName}
                                onAction={e => this.instructionChangeCommand(noteName, false, instrumentID)}>{noteName}</ActionMenu>
                );

            case 'edit-set-command-group':
                return <>
                    {this.values.getAllSongGroups((groupName) =>
                        groupName === this.groupName ? null :
                            <ActionMenu
                                key={groupName}
                                disabled={groupName === this.state.selectedGroup}
                                onAction={e => this.instructionChangeCommand('@' + groupName, false)}
                            >{groupName}</ActionMenu>
                    )}
                    <ActionMenu onAction={e => this.groupAdd()} hasBreak>Create New Group</ActionMenu>
                </>;
        }
    }

    render() {
        // console.log('instruction', this.props);
        const composer = this.props.composer;
        const instruction = this.props.instruction;
        const open = this.props.cursor || this.props.selected;
        if(!open)
            return <Div className="asct-instruction">
                <TrackerInstructionParameter
                    className="command"
                    options={() => this.renderMenu('edit-set-command')}
               >{instruction.command}</TrackerInstructionParameter>
            </Div>;
        return <Div className="asct-instruction">
            <TrackerInstructionParameter
                className="command"
                options={() => this.renderMenu('edit-set-command')}
            >{instruction.command}</TrackerInstructionParameter>
            <TrackerInstructionParameter
                className="instruction"
                options={() => this.renderMenu('edit-set-instruction')}
            >{instruction.instruction}</TrackerInstructionParameter>
            <TrackerInstructionParameter
                className="velocity"
                options={() => this.renderMenu('edit-set-velocity')}
            >{instruction.velocity}</TrackerInstructionParameter>
            <TrackerInstructionParameter
                className="duration"
                options={() => this.renderMenu('edit-set-duration')}
            >{instruction.duration}</TrackerInstructionParameter>
        </Div>
    }

}
export default TrackerInstruction;
