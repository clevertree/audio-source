import React from "react";

import {Menu, SubMenu} from "../components";

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

        this.menu.openMenu(e, options);
    }

    renderRootMenu() {
        const titleMenuProps = this.state.portrait ? {} : {
            vertical: true,
            arrow: false
        };
        return (<>
            <SubMenu {...titleMenuProps} key="file"        onAction={e => this.openFileMenu(e)}      >File</SubMenu>
            <SubMenu {...titleMenuProps} key="playlist"    onAction={e => this.openPlaylistMenu(e)}  >Playlist</SubMenu>
            <SubMenu {...titleMenuProps} key="view"        onAction={e => this.openViewMenu(e)}      >View</SubMenu>
        </>);
    }
    openRootMenu(e) {
        this.openMenu(e, this.renderRootMenu());
    }


    openFileMenu(e) {
        this.openMenu(e, <>
            <Menu key="memory"      onAction={e => this.openFileMemoryMenu(e)}      >Load from Memory</Menu>
            <Menu key="file"        onAction={e => this.openSongFromFileDialog(e)} >Load from File</Menu>
            <Menu key="url"         disabled>Load from URL</Menu>
            <Menu key="library"     disabled>Load from Library</Menu>
        </>);
    }

    openFileMemoryMenu(e) {
        const storage = new Storage();
        const songRecentUUIDs = storage.getRecentSongList() ;
        this.openMenu(e, songRecentUUIDs.length > 0
            ? songRecentUUIDs.map((entry, i) =>
                <Menu
                    key={i}
                    onAction={e => this.loadSongFromMemory(entry.uuid)}
                >{entry.name || entry.uuid}</Menu>)
            :<Menu
                key="no-recent"
                disabled
            >No Songs Available</Menu>
        );
    }

    openPlaylistMenu(e) {
        this.openMenu(e, <>
            <Menu key="next"        onAction={e => this.playlistNext(e)}>Load from Memory</Menu>
            <Menu key="clear"       onAction={e => this.clearPlaylist(e)} >Load from File</Menu>
        </>);
    }

    openViewMenu(e) {
        this.openMenu(e, <>
            <Menu key="fullscreen"          onAction={e => this.toggleFullscreen(e)}>{this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen</Menu>
            <Menu key="hide-panel-song"     onAction={e => this.togglePanelSong(e)} >{this.state.showPanelSong ? 'Show' : 'Hide'} Song Forms</Menu>
            <Menu key="hide-panel-playlist" onAction={e => this.togglePanelPlaylist(e)} >{this.state.showPanelPlaylist ? 'Show' : 'Hide'} Playlist</Menu>
        </>);
    }


}

export default PlayerMenu;
