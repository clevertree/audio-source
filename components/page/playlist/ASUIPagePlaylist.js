import * as React from "react";
import PropTypes from "prop-types";

import PlaylistFile from "../../../song/playlist/PlaylistFile";
import ASUIPagePlaylistEntry from "./ASUIPagePlaylistEntry";
import "./ASUIPagePlaylist.css";

export default class ASUIPagePlaylist extends React.Component {

    /** Property validation **/
    static propTypes = {
        src: PropTypes.string.isRequired,
    };


    constructor(props) {
        super(props);
        this.state = {
            playlist: null,
            error: "Empty Playlist"
        }
    }

    componentDidMount() {
        if(!this.state.playlist)
            this.loadPlaylist();
    }

    render() {
        return (<div className="asui-page-playlist">
            {this.state.playlist ? this.renderPlaylist() : <div className="error">{this.state.error}</div> }
        </div> )
    }

    renderPlaylist() {
        if(!this.state.playlist)
            return null;

        return this.state.playlist.map((entry, i) => {
            let artistURL = '#loading';
            if(entry.artistURL) {
                artistURL = entry.artistURL;
                const origin = document.location.origin;
                if (artistURL.startsWith(origin))
                    artistURL = artistURL.substr(origin.length);
                artistURL = origin + '/user#url=' + (artistURL);
            }
            let datePublished = "N/A";
            if(entry.datePublished) {
                datePublished = new Date(entry.datePublished).toLocaleDateString("en-US");
            }

            return <ASUIPagePlaylistEntry
                key={i}
                entryID={i}
                playlist={this}
                datePublished={datePublished}
                artistURL={artistURL}
                songTitle={entry.songTitle}
                artistTitle={entry.artistTitle}
                />
        })
    }

    async loadPlaylist() {
        const response = await fetch(this.props.src);
        let playlist = await response.text();
        if(response.status !== 200) {
            this.setState({error: response.statusText});
            throw new Error(response.statusText);
        }
        playlist = playlist
            .split("\n")
            .filter(v => !!v.trim())
            .map(entry => PlaylistFile.parseEntry(entry));
        console.log('playlist', playlist);
        this.setState({playlist, error: null});

        const artistCache = {};
        /** Load Song/Artist Info **/
        for(let i=0; i<playlist.length; i++) {
            const entry = playlist[i];
            const songInfo = await this.loadSongInfo(entry.url);
            const artistInfo = artistCache[songInfo.artistURL] || await this.loadArtistInfo(songInfo.artistURL);
            artistCache[songInfo.artistURL] = artistInfo;
            Object.assign(entry, songInfo, artistInfo);
        }
        console.log('playlist', playlist);
        this.setState({playlist, error: null});


    }

    async loadSongInfo(songURL) {
        const response = await fetch(songURL);
        let songData = await response.json();
        return {
            songTitle: songData.title,
            uuid: songData.uuid,
            url: songData.url,
            artistURL: songData.artistURL,
            datePublished: songData.datePublished,
        }
    }

    async loadArtistInfo(artistURL) {
        const response = await fetch(new URL("./artist.json", artistURL + '/'));
        let artistData = await response.json();
        return {
            artistTitle: artistData.title,
        }
    }

    /** Actions **/

    playEntry(e, i) {
        const entry = this.state.playlist[i];
        if(!entry)
            throw new Error("Invalid entry: " + i);
        console.log("TODO: ", i);
    }

    navigateToSongPage(e, i) {
        const entry = this.state.playlist[i];
        if(!entry)
            throw new Error("Invalid entry: " + i);
        let songURL = entry.url;
        const origin = document.location.origin;
        if(songURL.startsWith(origin))
            songURL = songURL.substr(origin.length);

        const songPageURL = origin + '/song#url=' + (songURL);
        document.location.href = songPageURL;
    }

}

