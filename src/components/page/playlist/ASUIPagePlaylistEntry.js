import * as React from "react";
import ASUIClickable from "../../clickable/ASUIClickable";
import ASUIIcon from "../../icon/ASUIIcon";
import PropTypes from "prop-types";

import "./ASUIPagePlaylistEntry.css";

export default class ASUIPagePlaylistEntry extends React.Component {

    /** Property validation **/
    static propTypes = {
        title: PropTypes.string,
        artistTitle: PropTypes.string,
        artistURL: PropTypes.string,
        datePublished: PropTypes.string,
        version: PropTypes.string,
        playlist: PropTypes.object
    };


    constructor(props) {
        super(props);
        const playlist = this.props.playlist;
        this.cb = {
            playEntry: e => playlist.playEntry(e, props.entryID),
            navigateToSongPage: e => playlist.navigateToSongPage(e, props.entryID),
        }
    }

    render() {

        // console.log(this.constructor.name, this.props);
        return <div className="asui-page-playlist-entry">
            <div className="background"
                 onClick={this.cb.navigateToSongPage}
            />
            <div className="image" >
                <ASUIIcon source="file-song" size="large"/>
            </div>
            <div className="info">
                <div className="title">
                    {`"${this.props.title || "N/A"}"`}
                </div>
                <div className="artist">{"by "}
                    <a href={this.props.artistURL}>{this.props.artistTitle || "N/A"}</a>
                </div>
                <div className="datePublished">
                    ({this.props.datePublished})
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
