import * as React from "react";
import PropTypes from "prop-types";
import PlaylistFile from "../../../server/song/playlist/PlaylistFile";

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
            entry = PlaylistFile.parseEntry(entry);
            const artist = entry.path.split('/').slice(0, 3).join('/');
            return <div key={i}>
                <div className="image" />
                <div className="info">
                    <div className="title">{`"${entry.title}"`}</div>
                    <div className="artist">by {artist}</div>
                </div>
                <div className="play" />
                <div className="edit" />
            </div>
        })
    }

    async loadPlaylist() {
        const response = await fetch(this.props.src);
        let playlist = await response.text();
        if(response.status !== 200) {
            this.setState({error: response.statusText});
            throw new Error(response.statusText);
        }
        playlist = playlist.split("\n").filter(v => !!v.trim());
        console.log(response, playlist);
        this.setState({playlist, error: null})
    }
}


