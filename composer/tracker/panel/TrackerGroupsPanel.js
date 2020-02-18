import React from "react";

import "./assets/TrackerGroupsPanel.css";
import Panel from "../../panel/Panel";
import InputButton from "../../../components/input-button/InputButton";
// import Div from "../../../components/div/Div.native";
class TrackerGroupsPanel extends React.Component {
    constructor(props) {
        super(props);
        if(!props.composer)
            throw new Error("Invalid composer");
        this.state = this.props.composer.state;
    }

    render() {
        const composer = this.props.composer;
        let className = "tracker-groups-panel";
        if(this.props.className)
            className += ' ' + this.props.className;

        return (
            <Panel className={className} title="Groups">
                {Object.keys(composer.song.data.instructions).map((groupName, i) =>
                    <InputButton
                        selected={this.state.trackerGroup === groupName}
                        onAction={e => this.trackerChangeGroup(groupName)}
                    >{groupName}</InputButton>)
                }
                <InputButton
                    onAction={e => this.groupAdd(e)}
                >+</InputButton>
            </Panel>
        )
    }
}
/** Export this script **/
export default TrackerGroupsPanel;
