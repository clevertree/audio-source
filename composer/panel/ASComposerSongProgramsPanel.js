import React from "react";

import {ASUIPanel, ASUIButtonDropDown} from "../../components";
import {ASCProgramRenderer} from "../program";

export default class ASComposerSongProgramsPanel extends React.Component {
    render() {
        const composer = this.props.composer;
        composer.ref.activePrograms = {};

        const programStates = composer.state.programStates || [];
        const selectedProgramID = composer.state.selectedProgramID || 0;
        // console.log('programStates', programStates);
        return (
            <ASUIPanel
                className="song-programs"
                header="Song Programs"
                title="Song Programs (Instruments & Effects)">
               {composer.getSong().programEach((programID, programClass, programConfig) => {
                   composer.ref.activePrograms[programID] = React.createRef();
                   return <ASCProgramRenderer
                       ref={composer.ref.activePrograms[programID]}
                       key={programID}
                       programID={programID}
                       composer={composer}
                       {...programStates[programID] || {}}
                       selected={selectedProgramID === programID}
                   />;
               })}
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

