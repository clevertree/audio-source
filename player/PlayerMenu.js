import React from "react";

import {MenuAction, MenuDropDown} from "../components";

import Storage from "../song/Storage";

import PlayerRenderer from "./PlayerRenderer";


class PlayerMenu extends PlayerRenderer {

    openMenu(e, options) {
        // console.log('openMenu', e);
        if(!this.state.portrait) {
            if(typeof e.openMenu !== "function") {
                console.warn("Menu.openMenu was triggered from a non-Menu element class");
            } else {
                e.openMenu(e, options);
                return;
            }
        }

        console.log(this.header);
        this.header.current.openMenu(e, options);
    }

    renderRootMenu() {
        const props = {
            vertical: !this.state.portrait,
            // openOnHover: false,
            // openOnHover: !this.state.portrait,
        };
        if(!this.state.portrait)
            props.arrow = false;
        return (<>
            <MenuDropDown {...props} options={p => this.renderFileMenu(p)}      >File</MenuDropDown>
            <MenuDropDown {...props} options={p => this.renderPlaylistMenu(p)}  >Playlist</MenuDropDown>
            <MenuDropDown {...props} options={p => this.renderViewMenu(p)}      >View</MenuDropDown>
        </>);
    }

    renderFileMenu() {
        return (<>
            <MenuDropDown options={p => this.renderFileMemoryMenu(p)}      >Load from Memory</MenuDropDown>
            <MenuAction onAction={e => this.openSongFromFileDialog(e)} >Load from File</MenuAction>
            <MenuAction onAction={e=>{}} disabled>Load from URL</MenuAction>
            <MenuAction onAction={e=>{}} disabled>Load from Library</MenuAction>
        </>);
    }

    renderFileMemoryMenu() {
        const storage = new Storage();
        const songRecentUUIDs = storage.getRecentSongList() ;
        return songRecentUUIDs.length > 0
            ? songRecentUUIDs.map((entry, i) =>
                <MenuAction
                    key={i}
                    onAction={e => this.loadSongFromMemory(entry.uuid)}
                >{entry.name || entry.uuid}</MenuAction>)
            :<MenuAction
                key="no-recent"
                disabled
                onAction={e=>{}}
            >No Songs Available</MenuAction>
        ;
    }

    renderPlaylistMenu() {
        return (<>
            <MenuAction key="next" onAction={e => this.playlistNext(e)}>Load from Memory</MenuAction>
            <MenuAction key="clear" onAction={e => this.clearPlaylist(e)} >Load from File</MenuAction>
        </>);
    }

    renderViewMenu() {
        return (<>
            <MenuAction key="fullscreen" onAction={e => this.toggleFullscreen(e)}>{this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen</MenuAction>
            <MenuAction key="hide-panel-song" onAction={e => this.togglePanelSong(e)} >{this.state.showPanelSong ? 'Show' : 'Hide'} Song Forms</MenuAction>
            <MenuAction key="hide-panel-playlist" onAction={e => this.togglePanelPlaylist(e)} >{this.state.showPanelPlaylist ? 'Show' : 'Hide'} Playlist</MenuAction>
        </>);
    }


}

export default PlayerMenu;
