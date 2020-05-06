import React from "react";

import {ASUIMenuAction, ASUIMenuDropDown} from "../components";

import Storage from "../common/storage/Storage";

import ASPlayerRenderer from "./ASPlayerRenderer";


class ASPlayerMenu extends ASPlayerRenderer {

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
            <ASUIMenuDropDown {...props} options={p => this.renderFileMenu(p)}      >File</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} options={p => this.renderPlaylistMenu(p)}  >Playlist</ASUIMenuDropDown>
            <ASUIMenuDropDown {...props} options={p => this.renderViewMenu(p)}      >View</ASUIMenuDropDown>
        </>);
    }

    renderFileMenu() {
        return (<>
            <ASUIMenuDropDown options={p => this.renderFileMemoryMenu(p)}      >Load from Memory</ASUIMenuDropDown>
            <ASUIMenuAction onAction={e => this.openSongFromFileDialog(e)} >Load from File</ASUIMenuAction>
            <ASUIMenuAction onAction={e=>{}} disabled>Load from URL</ASUIMenuAction>
            <ASUIMenuAction onAction={e=>{}} disabled>Load from Library</ASUIMenuAction>
        </>);
    }

    async renderFileMemoryMenu() {
        const storage = new Storage();
        const songRecentUUIDs = await storage.getRecentSongList() ;
        return songRecentUUIDs.length > 0
            ? songRecentUUIDs.map((entry, i) =>
                <ASUIMenuAction
                    key={i}
                    onAction={e => this.loadSongFromMemory(entry.uuid)}
                >{entry.name || entry.uuid}</ASUIMenuAction>)
            :<ASUIMenuAction
                key="no-recent"
                disabled
                onAction={e=>{}}
            >No Songs Available</ASUIMenuAction>
        ;
    }

    renderPlaylistMenu() {
        return (<>
            <ASUIMenuAction key="next" onAction={e => this.playlistNext(e)}>Load from Memory</ASUIMenuAction>
            <ASUIMenuAction key="clear" onAction={e => this.clearPlaylist(e)} >Load from File</ASUIMenuAction>
        </>);
    }

    renderViewMenu() {
        return (<>
            <ASUIMenuAction key="fullscreen" onAction={e => this.toggleFullscreen(e)}>{this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen</ASUIMenuAction>
            <ASUIMenuAction key="hide-panel-song" onAction={e => this.togglePanelSong(e)} >{this.state.showPanelSong ? 'Show' : 'Hide'} Song Forms</ASUIMenuAction>
            <ASUIMenuAction key="hide-panel-playlist" onAction={e => this.togglePanelPlaylist(e)} >{this.state.showPanelPlaylist ? 'Show' : 'Hide'} Playlist</ASUIMenuAction>
        </>);
    }


}

export default ASPlayerMenu;
