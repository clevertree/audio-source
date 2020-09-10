import React from "react";

import {ASUIPanel, ASUIClickableDropDown, ASUIIcon, ASUIClickable} from "../../components";
import {ASCProgramRenderer} from "../program";

export default class ASComposerSongProgramsPanel extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            menuAdd: () => props.composer.renderMenuProgramAdd()
        }
    }

    render() {
        // console.log(this.constructor.name + '.render()')
        const composer = this.props.composer;
        // composer.ref.activePrograms = {};
        const activePrograms = composer.ref.activePrograms;

        const programStates = composer.state.programStates || [];
        let selectedProgramID = null;
        const [type, id] = composer.state.selectedComponent;
        if(type === 'program')
            selectedProgramID = id;
        // console.log('programStates', programStates);
        // setTimeout(() => console.log('activePrograms', activePrograms), 100);
        return (
            <ASUIPanel
                viewKey="programs"
                header="Song Programs"
                title="Song Programs (Instruments & Effects)">
               {composer.getSong().programEach((programID, programClass, programConfig) => {
                   if(!activePrograms[programID])
                       activePrograms[programID] = React.createRef();
                   return <ASCProgramRenderer
                       ref={activePrograms[programID]}
                       key={programID}
                       programID={programID}
                       composer={composer}
                       {...programStates[programID] || {}}
                       selected={selectedProgramID === programID}
                   />;
               })}
               <ASUIClickableDropDown
                   button wide
                   arrow={false}
                   vertical={false}
                   className="program-add"
                   options={this.cb.menuAdd}
                   title="Add new Program"
               >
                   <ASUIIcon source="insert" />
               </ASUIClickableDropDown>
            </ASUIPanel>
        );
    }
}

