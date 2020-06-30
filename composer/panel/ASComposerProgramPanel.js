import React from "react";

import {ASUIPanel, ASUIButtonDropDown} from "../../components";
import ASCProgramRenderer from "../program/ASCProgramRenderer";

export default class ASComposerProgramPanel extends React.Component {
    render() {
        const composer = this.props.composer;
        return (
            <ASUIPanel
                className="programs"
                header="Programs (Instruments & Effects)">
               {composer.getSong().programEach((programID, programClass, programConfig) =>
                   <ASCProgramRenderer
                       key={programID}
                       programID={programID}
                       composer={composer}
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

