import React from "react";

import {ASUIClickable, ASUIDiv, ASUIMenuAction, ASUIMenuItem} from "../../../components";
import Library from "../../../song/library/Library";

import "./ASCPresetBrowser.css";
import {ProgramLoader} from "../../../common";

export default class ASCPresetBrowser extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            presets: [],
            loadingPresets: [],
            libraries: [],

            limit: 12,
            offset: 0,
            selected: 0
        }
        this.history = [];
    }


    getComposer() { return this.props.composer; }
    getProgramID() { return this.props.programID; }

    componentDidMount() {
        this.updateList();
    }

    async updateList() {

        const song = this.getComposer().getSong();
        const programID = this.getProgramID();
        const [currentPresetClass, currentPresetConfig] = song.programGetData(programID, false)
        let currentPresetID = -1;

        const library = this.props.composer.library;
        const presets = await library.getPresets();
        const libraries = await library.getLibraries();
        const tags = [];
        presets.forEach(([presetClass, presetConfig], i) => {
            if(presetClass === currentPresetClass
                && presetConfig.title === currentPresetConfig.title)
                currentPresetID = i;
            if(presetConfig.tags)
                presetConfig.tags.forEach(tag => {
                    if(tags.indexOf(tag) === -1)
                        tags.push(tag);
                });
        })
        console.log('presets', currentPresetConfig, {presets, libraries, tags, currentPresetID});
        this.setState({presets, libraries, tags, currentPresetID, loading: false});
    }

    render() {
        let className = 'asc-preset-browser';

        return (
            <div className={className}>
                <div className="library-list">
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
        let content = [];

        if(this.history.length > 0) {
            content.push(<ASUIClickable
                key={-1}
                // options={() => {}}
                onAction={() => this.popLibrary()}
                children={"- Previous Library -"}
            />);
        }

        if(this.state.loading) {
            content.push(<ASUIDiv>Loading Libraries...</ASUIDiv>);

        } else {
            content = content.concat(this.state.libraries.map((library, i) =>
                <ASUIClickable
                    key={i}
                    onAction={() => this.setLibrary(library)}
                    children={library.getTitle()}
                />));
        }

        return content;
    }


    renderPresets() {
        let content = [];
        if(this.state.loading) {
            content.push(<ASUIDiv>Loading Presets...</ASUIDiv>);

        } else {

            const loadingPresets = this.state.loadingPresets || [];
            const limitedList = this.state.presets
                .slice(this.state.offset, this.state.limit);

            content = limitedList.map(([presetClass, presetConfig], presetID) =>
                <ASUIClickable
                    key={presetID}
                    onAction={() => this.loadPreset(presetID, presetClass, presetConfig)}
                    selected={presetID === this.state.currentPresetID}
                    className={loadingPresets.indexOf(presetID) === -1 ? null : 'loading'}
                    // options={() => {}}
                    children={presetConfig.title}
                />)
            if(limitedList.length < this.state.presets.length) {
                content.push(<ASUIClickable
                    key={-1}
                    // options={() => {}}
                    children={"- More -"}
                />);
            }
        }
        return content;
    }

    /** Actions **/

    async loadPreset(presetID, presetClassName, presetConfig) {
        const presetTitle = presetConfig.title || presetClassName;
        const composer = this.getComposer();
        composer.setStatus("Loading preset: " + presetTitle, presetConfig);

        const loadingPresets = this.state.loadingPresets;
        let loadingPresetsI = loadingPresets.indexOf(presetID);
        if(loadingPresetsI === -1)
            loadingPresets.push(presetID);
        this.setState({loadingPresets});

        const instance = ProgramLoader.loadInstance(presetClassName, presetConfig);
        await new Promise(resolve => {
           setTimeout(resolve, 1000);
        });
        if(typeof instance.waitForAssetLoad === "function")
            await instance.waitForAssetLoad();

        loadingPresetsI = loadingPresets.indexOf(presetID);
        if(loadingPresetsI !== -1)
            loadingPresets.splice(loadingPresetsI, 1);
        this.setState({loadingPresets});

        const song = this.getComposer().getSong();
        const programID = this.getProgramID();
        song.programReplace(programID, presetClassName, presetConfig);
        composer.setStatus("Loaded preset: " + presetTitle);
        this.updateList();
    }

    setLibrary(library, addHistory=true) {
        const oldLibrary = this.props.composer.library;
        this.setState({loading: true});
        this.props.composer.setLibrary(library);
        this.updateList();

        // History
        if(addHistory && oldLibrary) {
            const i = this.history.indexOf(oldLibrary);
            if (i !== -1)
                this.history.splice(i, 1);
            this.history.unshift(oldLibrary);
        }
    }

    popLibrary() {
        if(this.history.length === 0)
            throw new Error("Invalid library history");
        const oldLibrary = this.history.shift();
        this.setLibrary(oldLibrary, false);
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
