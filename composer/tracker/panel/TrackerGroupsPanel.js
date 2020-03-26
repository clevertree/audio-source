import React from "react";

import {Button, Panel} from "../../../components/";

import "./assets/TrackerGroupsPanel.css";

class TrackerGroupsPanel extends React.Component {
    constructor(props) {
        super(props);
        if(!props.composer)
            throw new Error("Invalid composer");
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
                        selected={typeof this.props.composer.state.trackerGroups[groupName] !== "undefined"}
                        onAction={e => composer.trackerGroupToggle(groupName)}
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
