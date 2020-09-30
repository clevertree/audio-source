import * as React from "react";
import PropTypes from "prop-types";

import ASUIPagePlaylistEntry from "./ASUIPagePlaylistEntry";
import "./ASUIPagePlaylist.css";
import {Playlist} from "../../../song";

export default class ASUIPagePlaylist extends React.Component {

    /** Property validation **/
    static propTypes = {
        src: PropTypes.string.isRequired,
    };


    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            playlist: null,
            error: "Empty Playlist"
        }
    }

    componentDidMount() {
        if(!this.state.playlist)
            this.loadPlaylist();
    }

    render() {
        // console.log(this.constructor.name, ".render()", this.state);
        return (<div className="asui-page-playlist">
            {this.state.playlist ? this.renderPlaylist() : <div className="error">{this.state.error}</div> }
        </div> )
    }

    renderPlaylist() {
        if(!this.state.playlist)
            return null;

        const playlist = new Playlist(this.state.playlist);
        return playlist.getList().map((entry, i) => {
            let datePublished = "N/A";
            if(entry.datePublished) {
                datePublished = new Date(entry.datePublished).toLocaleDateString("en-US");
            }

            return <ASUIPagePlaylistEntry
                key={i}
                entryID={i}
                playlist={this}
                datePublished={datePublished}
                title={entry.title || (this.state.loaded ? "N/A" : "Loading...")}
                artistURL={entry.artistURL}
                artistTitle={entry.artistTitle || (this.state.loaded ? "N/A" : "Loading...")}
            />
        })
    }

    async loadPlaylist() {
        const response = await fetch(this.props.src);
        if(response.status !== 200) {
            this.setState({error: response.statusText});
            throw new Error(response.statusText);
        }
        let playlistData = await response.json();
        const playlist = new Playlist(playlistData);
        console.log('responseJSON', playlistData, playlist);
        this.setState({
            playlist: playlistData,
            error: null,
            loaded: false
        });
        await playlist.loadClient();
        this.setState({playlist, error: null, loaded: true});


    }

    /** Actions **/

    playEntry(e, i) {
        const playlist = new Playlist(this.state.playlist);
        const entry = playlist.getEntry(i);
        console.log("TODO Play: ", i, entry);
    }

    navigateToSongPage(e, i) {
        const playlist = new Playlist(this.state.playlist);
        const entry = playlist.getEntry(i);
        document.location.href = entry.url;
    }

}

