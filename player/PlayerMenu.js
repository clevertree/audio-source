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

        console.log(this.header);
        this.header.current.openMenu(e, options);
    }

    renderRootMenu(props={}) {
        props.vertical = !this.state.portrait;
        props.arrow = this.state.portrait;
        return (<>
            <Menu {...props} key="file"        options={p => this.renderFileMenu(p)}      >File</Menu>
            <Menu {...props} key="playlist"    options={p => this.renderPlaylistMenu(p)}  >Playlist</Menu>
            <Menu {...props} key="view"        options={p => this.renderViewMenu(p)}      >View</Menu>
        </>);
    }

    renderFileMenu(props={}) {
        return (<>
            <SubMenu    {...props} key="memory"      options={p => this.renderFileMemoryMenu(p)}      >Load from Memory</SubMenu>
            <SubMenu    {...props} key="file"        options={p => this.renderSongFromFileDialog(p)} >Load from File</SubMenu>
            <Menu    {...props} key="url"         disabled>Load from URL</Menu>
            <Menu    {...props} key="library"     disabled>Load from Library</Menu>
        </>);
    }

    renderFileMemoryMenu(props={}) {
        const storage = new Storage();
        const songRecentUUIDs = storage.getRecentSongList() ;
        return songRecentUUIDs.length > 0
            ? songRecentUUIDs.map((entry, i) =>
                <Menu
                    {...props}
                    key={i}
                    options={p => this.loadSongFromMemory(entry.uuid)}
                >{entry.name || entry.uuid}</Menu>)
            :<Menu
                {...props}
                key="no-recent"
                disabled
            >No Songs Available</Menu>
        ;
    }

    renderPlaylistMenu(props={}) {
        return (<>
            <Menu {...props} key="next"        options={p => this.playlistNext(p)}>Load from Memory</Menu>
            <Menu {...props} key="clear"       options={p => this.clearPlaylist(p)} >Load from File</Menu>
        </>);
    }

    renderViewMenu(props={}) {
        return (<>
            <Menu {...props} key="fullscreen"          options={p => this.toggleFullscreen(p)}>{this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen</Menu>
            <Menu {...props} key="hide-panel-song"     options={p => this.togglePanelSong(p)} >{this.state.showPanelSong ? 'Show' : 'Hide'} Song Forms</Menu>
            <Menu {...props} key="hide-panel-playlist" options={p => this.togglePanelPlaylist(p)} >{this.state.showPanelPlaylist ? 'Show' : 'Hide'} Playlist</Menu>
        </>);
    }


}

export default PlayerMenu;
