import React from "react";
// import {ASUIDiv as Div} from "../../components/";
import ASPPlaylistEntry from "./ASPPlaylistEntry";

import "./assets/ASPPlaylist.css";

class ASPPlaylist extends React.Component {
    constructor(props = {}) {
        super(props, {});
        if(!this.props.player)
            throw new Error("Invalid player");

        this.state = this.props.player.state.playlist;
        this.state.position = this.state.position || 0;
        this.state.entries = this.state.entries || [];
        this.state.selectedPositions = this.state.selectedPositions || [];
    }

    // get player() { return this.props.player; }
    // get position() { return this.state.position; }
    // get entries() { return this.state.entries; }

    render() {
        return (
            <div className="asp-playlist">
                <div className="header">
                    <div className="id">ID</div>
                    <div className="name">Name</div>
                    <div className="length">Length</div>
                </div>
                <div className="container">
                    {this.state.entries.length > 0
                    ? this.props.player.eachEntry((entryData, position, depth) => {
                            // const props = {
                            //     key: position,
                            //     data:entryData,
                            //     playlist: this,
                            //     depth,
                            //     onPress: (e) => player.toggleEntryAtPosition(position)
                            // };
                            // const classes = [];
                            // if(this.state.position === position)
                            //     classes.push('position');
                            // if(this.state.selectedPositions.indexOf(position) !== -1)
                            //     classes.push('selected');
                            // if(entryData.loading)
                            //     classes.push('loading');
                            // if(classes.length > 0)
                            //     props.class = classes.join(' ');
                            return <ASPPlaylistEntry
                                id={position}
                                key={position}
                                data={entryData}
                                playlist={this}
                                depth={depth}
                                onAction={(e) => this.props.player.toggleEntryAtPosition(position)}
                            />
                        })
                    :<div className="empty-playlist">Empty Playlist</div>
                    }
                </div>
            </div>
        )
    }

    // onInput(e) {
    //     switch(e.type) {
    //         case 'click':
    //
    //     }
    //     console.log(e);
    // }

    // render2() {
    //     // TODO: move to entry - this.addEventHandler('click', e => this.onClick(e));
    //     // await this.updateEntries();
    //     const player = this.props.player;
    //     return [
    //         Div.createElement('header', [
    //             Div.createElement('id', 'ID'),
    //             Div.createElement('name', 'Name'),
    //             // Div.createElement('url', 'URL'),
    //             Div.createElement('length', 'Length'),
    //         ], {key: 'asp-playlist-header'}),
    //         Div.createElement('asp-playlist-container', [
    //             this.state.entries.length > 0
    //             ? player.eachEntry((entryData, position, depth) => {
    //                 const props = {
    //                     key: position,
    //                     data:entryData,
    //                     playlist: this,
    //                     depth,
    //                     onPress: (e) => player.toggleEntryAtPosition(position)
    //                 };
    //                 const classes = [];
    //                 if(this.state.position === position)
    //                     classes.push('position');
    //                     if(this.state.selectedPositions.indexOf(position) !== -1)
    //                         classes.push('selected');
    //                     if(entryData.loading)
    //                         classes.push('loading');
    //                 if(classes.length > 0)
    //                     props.class = classes.join(' ');
    //                 return ASPPlaylistEntry.createElement(props)
    //             })
    //             : Div.createElement('empty-playlist', "Empty ASPPlaylist")
    //         ], {'style': `max-height:${Math.round(window.innerHeight / 2)}px;`}),
    //     ];
    // }

    async onClick(e) {
        const entryElm = e.target.closest('aspp-entry,div.asp-playlist-entry');
        if(entryElm) {
            // entryElm.toggleSelect();
            if(entryElm.isPlaylist) {
                await entryElm.togglePlaylist();
            } else {
                await this.props.player.playlistMoveToEntry(entryElm);
                await this.props.player.playlistPlay();
            }
            //     await songPlay();
        } else {
            console.error(e, this);
        }
    }

    clear() {
        this.setState({entries: []})
    }


}
// if(isBrowser)
    // customElements.define('asp-playlist', ASPPlaylist);


/** Export this script **/
export default ASPPlaylist;
