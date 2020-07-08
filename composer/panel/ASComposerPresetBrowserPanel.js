import React from "react";

import {ASUIPanel, ASUIButtonDropDown, ASUIMenuAction, ASUIMenuItem} from "../../components";
import Library from "../../song/library/Library";
import ASUIDiv from "../../components/div/ASUIDiv";

export default class ASComposerPresetBrowserPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            presets: []
        }
    }

    componentDidMount() {
        this.updateList();
    }

    async updateList() {
        const library = this.props.composer.library;
        const presets = await library.getPresets();
        console.log('presets', presets);
        this.setState({presets, loading: false});
    }

    render() {
        const library = this.props.composer.library;
        // console.log('openPrograms', openPrograms);
        return (
            <ASUIPanel
                className="preset-browser"
                header="Preset Browser"
                title="Program Preset Browser">
               <ASUIButtonDropDown
                   className="current-library"
                   options={() => this.renderMenuSelectLibrary()}
                   title={`Current Library: ${library.getTitle()}`}
               >{library.getTitle()}</ASUIButtonDropDown>
                {this.renderPresets()}
            </ASUIPanel>
        );
    }

    renderPresets() {
        if(this.state.loading)
            return <ASUIDiv>Loading...</ASUIDiv>

        return this.state.presets.map(preset =>
            <ASUIButtonDropDown
                options={() => {}}
                children={preset.title}
                />)
    }

    /** Actions **/

    setLibrary(library) {
        this.setState({loading: true});
        this.props.composer.setLibrary(library);
        this.updateList();
    }

    /** Menu **/

    async renderMenuSelectLibrary() {
        const defaultLibrary = await Library.loadDefault();
        const library = this.props.composer.library;
        const libraries = await library.getLibraries();
        return (<>
            {libraries.length === 0
                ? <ASUIMenuItem>No child libraries available</ASUIMenuItem>
                : libraries.map((library, i) =>
                <ASUIMenuAction key={i++}
                                onAction={() => this.setLibrary(library)}>
                    {library.getTitle()}
                </ASUIMenuAction>
            )}
            {defaultLibrary.data === library.data ? null : <ASUIMenuAction key={-1}
                 onAction={() => this.setLibrary(defaultLibrary)}>
                {defaultLibrary.getTitle()}
            </ASUIMenuAction>}
        </>);
    }
}

