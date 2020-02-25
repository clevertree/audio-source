import React from "react";

import Panel from "../../panel/Panel";
import {Button} from "../../../components/";

import "./assets/TrackerGroupsPanel.css";

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
                    <Button
                        key={i}
                        selected={this.state.selectedGroup === groupName}
                        onAction={e => this.trackerChangeGroup(groupName)}
                    >{groupName}</Button>)
                }
                <Button
                    key="add"
                    onAction={e => this.groupAdd(e)}
                >+</Button>
            </Panel>
        )
    }
}
/** Export this script **/
export default TrackerGroupsPanel;
