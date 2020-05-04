import React from "react";
import {Text, TouchableHighlight, View} from "react-native";
// import {ASUIDiv as Div} from "../../components/";
import ASPPlaylistEntry from "./ASPPlaylistEntry";

import styles from "./assets/ASPPlaylist.style";

class ASPPlaylist extends React.Component  {
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
        const style = [styles.default];
        if(this.props.disabled)
            style.push(styles.disabled)

        return (
            <View style={style}>
                <View style={styles.header}>
                    <Text style={styles.id}>ID</Text>
                    <Text style={styles.name}>Name</Text>
                    <Text style={styles.length}>Length</Text>
                </View>
                <View style={styles.container}>
                    {this.state.entries.length > 0
                    ? this.props.player.eachEntry((entryData, position, depth) => {
                            return <ASPPlaylistEntry
                                id={position}
                                key={position}
                                data={entryData}
                                playlist={this}
                                depth={depth}
                                onAction={(e) => this.props.player.toggleEntryAtPosition(position)}
                            />
                        })
                    :<Text style={styles.emptyPlaylist}>Empty Playlist</Text>
                    }
                </View>
            </View>
        )
    }

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

}
// if(isBrowser)
    // customElements.define('asp-playlist', ASPPlaylist);


/** Export this script **/
export default ASPPlaylist;

function textify(content, props={}) {
    return typeof content !== "object" ? <Text children={content} {...props}/> : content;
}
