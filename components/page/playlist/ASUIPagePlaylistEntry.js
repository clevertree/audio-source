import * as React from "react";
import ASUIClickable from "../../clickable/ASUIClickable";
import ASUIIcon from "../../icon/ASUIIcon";
import PropTypes from "prop-types";

import "./ASUIPagePlaylistEntry.css";

export default class ASUIPagePlaylistEntry extends React.Component {

    /** Property validation **/
    static propTypes = {
        songTitle: PropTypes.string.isRequired,
        artistTitle: PropTypes.string.isRequired,
        artistURL: PropTypes.string.isRequired,
        datePublished: PropTypes.number.isRequired,
        playlist: PropTypes.object.isRequired
    };


    constructor(props) {
        super(props);
        const playlist = this.props.playlist;
        this.cb = {
            playEntry: e => playlist.playEntry(e, props.entryID),
            navigateToSongPage: e => playlist.navigateToSongPage(e, props.entryID),
        }
        console.log(this.constructor.name, props);
    }

    render() {
        let artistURL = '#loading';
        if(this.props.artistURL) {
            artistURL = this.props.artistURL;
            const origin = document.location.origin;
            if (artistURL.startsWith(origin))
                artistURL = artistURL.substr(origin.length);
            artistURL = origin + '/user#url=' + (artistURL);
        }
        let datePublished = "N/A";
        if(this.props.datePublished) {
            datePublished = new Date(this.props.datePublished).toLocaleDateString("en-US");
        }


        return <div className="asui-page-playlist-entry">
            <div className="background"
                 onClick={this.cb.navigateToSongPage}
            />
            <div className="image" >
                <ASUIIcon source="file-song" size="large"/>
            </div>
            <div className="info">
                <div className="title">
                    {`"${this.props.songTitle||"N/A"}"`}
                </div>
                <div className="artist">{"by "}
                    <a href={artistURL}>{this.props.artistTitle || "N/A"}</a>
                </div>
                <div className="datePublished">
                    ({datePublished})
                </div>
            </div>
            <div className="play" >
                <ASUIClickable
                    onAction={this.cb.playEntry}>
                    <ASUIIcon source="play" size="large"/>
                </ASUIClickable>
            </div>
        </div>
    }
}
