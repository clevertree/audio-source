import React from "react";

import {Panel} from "../../../components/";

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
                    <MenuAction
                        key={i}
                        selected={typeof composer.state.activeTracks[groupName] !== "undefined"}
                        onAction={e => composer.trackerGroupToggle(groupName)}
                    >{groupName}</MenuAction>)
                }
                <MenuAction
                    key="add"
                    onAction={e => this.groupAdd(e)}
                >+</MenuAction>
            </Panel>
        )
    }
}
/** Export this script **/
export default TrackerGroupsPanel;
