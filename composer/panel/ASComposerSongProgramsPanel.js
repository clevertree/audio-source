import React from "react";

import {ASUIPanel, ASUIButtonDropDown} from "../../components";
import ASCProgramRenderer from "../program/ASCProgramRenderer";

export default class ASComposerSongProgramsPanel extends React.Component {
    render() {
        const composer = this.props.composer;
        const openPrograms = composer.state.openPrograms || [];
        const selectedProgramID = composer.state.selectedProgramID || 0;
        // console.log('openPrograms', openPrograms);
        return (
            <ASUIPanel
                className="song-programs"
                header="Song Programs"
                title="Song Programs (Instruments & Effects)">
               {composer.getSong().programEach((programID, programClass, programConfig) =>
                   <ASCProgramRenderer
                       key={programID}
                       programID={programID}
                       composer={composer}
                       open={openPrograms.indexOf(programID) !== -1}
                       selected={selectedProgramID === programID}
                   />
               )}
               <ASUIButtonDropDown
                   arrow={false}
                   vertical={false}
                   className="program-add"
                   options={() => composer.renderMenuProgramAdd()}
                   title="Add New Program"
               >Add</ASUIButtonDropDown>
            </ASUIPanel>
        );
    }
}

