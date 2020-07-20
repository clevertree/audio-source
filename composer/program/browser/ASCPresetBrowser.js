import React from "react";

import {ASUIClickable, ASUIMenuAction, ASUIMenuItem} from "../../../components";
import Library from "../../../song/library/Library";

import "./ASCPresetBrowser.css";
import {ProgramLoader} from "../../../common";
import PromptManager from "../../../common/prompt/PromptManager";

export default class ASCPresetBrowser extends React.Component {
    static DEFAULT_TIMEOUT_MS = 10000;

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            presets: [],
            loadingPresets: [],
            libraries: [],

            limit: 12,
            offset: 0,
            selected: 0,
            searchString: ''
        }
        this.history = [];
        this.cb = {
            onWheel: e => this.onWheel(e)
        }
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

        const library = this.props.composer.library;
        const presets = await library.getPresets();
        const libraries = await library.getLibraries();
        const currentPresetHash = library.getTitle() + ':' + currentPresetClass + ':' + currentPresetConfig.title;
        // console.log('presets', currentPresetConfig, {presets, libraries, tags, currentPresetID});
        this.setState({presets, libraries, currentPresetHash, loading: false});
    }

    render() {
        let className = 'asc-preset-browser';

        return (
            <div className={className}
                 ref={elm => {
                     elm && elm.addEventListener('wheel', this.cb.onWheel, {passive: false});
                 }}
                >
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
        const library = this.props.composer.library;
        let content = [];

        if(this.history.length > 0) {
            content.push(<ASUIClickable
                key={-1}
                className="centered"
                // options={() => {}}
                onAction={() => this.popLibrary()}
                children={"- Previous Library -"}
            />);
        }

        content.push(<ASUIClickable
            key={'library-current'}
            className="centered"
            // options={() => {}}
            onAction={() => this.setLibrary(library)}
            children={library.getTitle()}
        />)

        if(this.state.loading) {
            content.push(<ASUIClickable loading={true} onAction={() => {}}>Loading Libraries...</ASUIClickable>);

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

    getFilteredPresets() {
        let presetList = this.state.presets;
        if(this.state.searchString) {
            const searchString = this.state.searchString.toLowerCase();
            presetList = presetList.filter(([presetClass, presetConfig], presetID) => {
                if(presetConfig.title.toLowerCase().indexOf(searchString) !== -1)
                    return true;
                if(presetConfig.tags) {
                    for (let i = 0; i < presetConfig.tags.length; i++) {
                        if(presetConfig.tags[i].toLowerCase().indexOf(searchString) !== -1)
                            return true;
                    }
                }
            })
        }
        return presetList;
    }

    renderPresets() {
        let content = [];
        if(this.state.loading) {
            content.push(<ASUIClickable loading={true} onAction={() => {}}>Loading Presets...</ASUIClickable>);

        } else {
            const {offset, limit} = this.state;

            const loadingPresets = this.state.loadingPresets || [];
            let presetList = this.getFilteredPresets();

            const limitedList = presetList
                .slice(offset, offset + limit);

            const library = this.props.composer.library;

            content = limitedList.map(([presetClass, presetConfig], presetID) => {
                const currentPresetHash = library.getTitle() + ':' + presetClass + ':' + presetConfig.title;
                const loading = loadingPresets.indexOf(currentPresetHash) !== -1;
                return <ASUIClickable
                    key={presetID}
                    onAction={() => this.loadPreset(currentPresetHash, presetClass, presetConfig)}
                    selected={currentPresetHash === this.state.currentPresetHash}
                    loading={loading}
                    title={presetConfig.title}
                    // options={() => {}}
                    children={loading ? 'Loading Preset...' : this.trimTitle(presetConfig.title)}
                />;
            });

            content.unshift(<ASUIClickable
                key="preset-search"
                className="centered"
                onAction={() => this.promptSearch()}
                children={`Search${this.state.searchString ? `ing '${this.state.searchString}'` : ''}`}
            />);

            if(offset > 0) {
                let prevOffset = offset - limit;
                if(prevOffset < 0)
                    prevOffset = 0;
                content.unshift(<ASUIClickable
                    key="preset-previous"
                    onAction={() => this.setOffset(prevOffset)}
                    className="centered"
                    children={`Prev Page (${prevOffset}/${presetList.length})`}
                />);
            }
            let nextOffset = offset + limit;
            if(nextOffset < presetList.length) {
                content.push(<ASUIClickable
                    key="preset-next"
                    onAction={() => this.setOffset(nextOffset)}
                    className="centered"
                    children={`Next Page (${offset}-${nextOffset}/${presetList.length})`}
                />);
            }

        }
        return content;
    }

    addLoadingPreset(presetHash) {
        const loadingPresets = this.state.loadingPresets;
        let i = loadingPresets.indexOf(presetHash);
        if(i === -1)
            loadingPresets.push(presetHash);
        this.setState({loadingPresets});
    }

    removeLoadingPreset(presetHash) {
        const loadingPresets = this.state.loadingPresets;
        let i = loadingPresets.indexOf(presetHash);
        if(i !== -1)
            loadingPresets.splice(i, 1);
        this.setState({loadingPresets});
    }

    trimTitle(titleString) {
        if(titleString.length > 20)
            titleString = titleString.substr(0, 28) + '...';
        return titleString;
    }

    /** Actions **/

    async loadPreset(presetHash, presetClassName, presetConfig) {
        const presetTitle = presetConfig.title || presetClassName;
        const composer = this.getComposer();
        composer.setStatus(`Loading preset: ${presetTitle}`, presetConfig);
        this.addLoadingPreset(presetHash);

        const instance = ProgramLoader.loadInstance(presetClassName, presetConfig);
        let error = false;
        if(typeof instance.waitForAssetLoad === "function") {
            const timeout = setTimeout(() => {
                error = true;
                this.removeLoadingPreset(presetHash);
                composer.setError(`Preset failed to load: ${presetTitle}. Please try again.`);
            }, ASCPresetBrowser.DEFAULT_TIMEOUT_MS);

            await instance.waitForAssetLoad();
            clearTimeout(timeout);
            if(error)
                return;
        }

        this.removeLoadingPreset(presetHash);

        const song = this.getComposer().getSong();
        const programID = this.getProgramID();
        song.programReplace(programID, presetClassName, presetConfig);
        composer.setStatus("Loaded preset: " + presetTitle);
        this.updateList();
    }

    setLibrary(library, addHistory=true) {
        const oldLibrary = this.props.composer.library;
        this.setState({loading: true, offset: 0});
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

    setOffset(offset) {
        this.setState({offset})
    }

    async promptSearch() {
        console.log("searchString", this.state.searchString);
        const searchString = await PromptManager.openPromptDialog("Enter search keyword:", this.state.searchString);
        console.log("searchString2", searchString);
        this.setState({searchString, offset: 0});
    }

    /** Input **/

    onWheel(e) {
        e.preventDefault();
        let offset = parseInt(this.state.offset) || 0;
        offset += e.deltaY > 0 ? 1 : -1;
        if(offset < 0)
            offset = 0;

        this.setState({offset})
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
