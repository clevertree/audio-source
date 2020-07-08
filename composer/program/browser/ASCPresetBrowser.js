import React from "react";

import {ASUIButtonDropDown} from "../../../components/button";
import {ASUIDiv, ASUIMenuAction, ASUIMenuItem} from "../../../components";
import Library from "../../../song/library/Library";

import "./ASCPresetBrowser.css";

export default class ASCPresetBrowser extends React.Component {
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

    render() {
        const library = this.props.composer.library;

        let className = 'asc-preset-list';

        return (
            <div className={className}>
                <ASUIButtonDropDown
                    className="current-library"
                    options={() => this.renderMenuSelectLibrary()}
                    title={`Current Library: ${library.getTitle()}`}
                >{library.getTitle()}</ASUIButtonDropDown>
                {this.renderPresets()}
            </div>
        );

        // return content;
    }


    renderPresets() {
        if(this.state.loading)
            return <ASUIDiv>Loading...</ASUIDiv>

        return this.state.presets.map(([presetClass, presetConfig], i) =>
            <ASUIButtonDropDown
                key={i}
                options={() => {}}
                children={presetConfig.title}
            />)
    }
    /** Actions **/

    setLibrary(library) {
        this.setState({loading: true});
        this.props.composer.setLibrary(library);
        this.updateList();
    }


    async updateList() {
        const library = this.props.composer.library;
        const presets = await library.getPresets();
        console.log('presets', presets);
        this.setState({presets, loading: false});
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
