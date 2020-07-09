import React from "react";

import {ASUIButtonDropDown} from "../../../components/button";
import {ASUIClickable, ASUIClickableDropDown, ASUIDiv, ASUIMenuAction, ASUIMenuItem} from "../../../components";
import Library from "../../../song/library/Library";

import "./ASCPresetBrowser.css";

export default class ASCPresetBrowser extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            presets: [],
            libraries: [],

            limit: 10,
            offset: 0,
            selected: 0
        }
    }


    componentDidMount() {
        this.updateList();
    }

    async updateList() {
        const library = this.props.composer.library;
        const presets = await library.getPresets();
        const libraries = await library.getLibraries();
        const tags = [];
        presets.forEach(([presetClass, presetConfig]) => {
            if(presetConfig.tags)
                presetConfig.tags.forEach(tag => {
                    if(tags.indexOf(tag) === -1)
                        tags.push(tag);
                });
        })
        console.log('presets', {presets, libraries, tags});
        this.setState({presets, libraries, tags, loading: false});
    }

    render() {
        const library = this.props.composer.library;

        let className = 'asc-preset-browser';

        return (
            <div className={className}>
                <div className="library-list">
                    <ASUIButtonDropDown
                        className="library-current"
                        options={() => this.renderMenuSelectLibrary()}
                        selected={true}
                        title={`Current Library: ${library.getTitle()}`}
                    >{`${library.getTitle()}`}</ASUIButtonDropDown>
                    {this.renderLibraries()}
                </div>
                <div className="preset-list">
                    {this.renderPresets()}
                </div>
            </div>
        );

        // return content;
    }


    renderLibraries() {
        if(this.state.loading)
            return <ASUIDiv>Loading Libraries...</ASUIDiv>

        return this.state.libraries.map((library, i) =>
            <ASUIClickable
                key={i}
                onAction={() => this.setLibrary(library)}
                children={library.getTitle()}
            />)
    }


    renderPresets() {
        if(this.state.loading)
            return <ASUIDiv>Loading Presets...</ASUIDiv>
        const limitedList = this.state.presets
            .slice(this.state.offset, this.state.limit);

        const content = limitedList.map(([presetClass, presetConfig], i) =>
            <ASUIClickable
                key={i}
                // options={() => {}}
                children={presetConfig.title}
            />)
        content.push(<ASUIClickable
            key={-1}
            // options={() => {}}
            children={"- More -"}
        />);
        return content;
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
