import React from "react";

import {MenuItem, SubMenuItem} from "../components";

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
            openOnHover: false,
            // openOnHover: !this.state.portrait,
        };
        if(!this.state.portrait)
            props.arrow = false;
        return (<>
            <SubMenuItem {...props} options={p => this.renderFileMenu(p)}      >File</SubMenuItem>
            <SubMenuItem {...props} options={p => this.renderPlaylistMenu(p)}  >Playlist</SubMenuItem>
            <SubMenuItem {...props} options={p => this.renderViewMenu(p)}      >View</SubMenuItem>
        </>);
    }

    renderFileMenu() {
        return (<>
            <SubMenuItem options={p => this.renderFileMemoryMenu(p)}      >Load from Memory</SubMenuItem>
            <MenuItem onAction={e => this.openSongFromFileDialog(e)} >Load from File</MenuItem>
            <MenuItem onAction={e=>{}} disabled>Load from URL</MenuItem>
            <MenuItem onAction={e=>{}} disabled>Load from Library</MenuItem>
        </>);
    }

    renderFileMemoryMenu() {
        const storage = new Storage();
        const songRecentUUIDs = storage.getRecentSongList() ;
        return songRecentUUIDs.length > 0
            ? songRecentUUIDs.map((entry, i) =>
                <MenuItem
                    key={i}
                    options={e => this.loadSongFromMemory(entry.uuid)}
                >{entry.name || entry.uuid}</MenuItem>)
            :<MenuItem
                key="no-recent"
                disabled
                onAction={e=>{}}
            >No Songs Available</MenuItem>
        ;
    }

    renderPlaylistMenu() {
        return (<>
            <MenuItem key="next" onAction={e => this.playlistNext(e)}>Load from Memory</MenuItem>
            <MenuItem key="clear" onAction={e => this.clearPlaylist(e)} >Load from File</MenuItem>
        </>);
    }

    renderViewMenu() {
        return (<>
            <MenuItem key="fullscreen" onAction={e => this.toggleFullscreen(e)}>{this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen</MenuItem>
            <MenuItem key="hide-panel-song" onAction={e => this.togglePanelSong(e)} >{this.state.showPanelSong ? 'Show' : 'Hide'} Song Forms</MenuItem>
            <MenuItem key="hide-panel-playlist" onAction={e => this.togglePanelPlaylist(e)} >{this.state.showPanelPlaylist ? 'Show' : 'Hide'} Playlist</MenuItem>
        </>);
    }


}

export default PlayerMenu;
