import * as React from "react";
import {ASUIPageContainer, ASUIMarkdown} from "../../components";

import ASComposer from "../../composer/ASComposer";

export default class SongPage extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onSongLoad: song => this.onSongLoad(song)
        }
        this.state = {
            loaded: false,
            artistTitle: null,
            artistURL: null,
        }
        console.log(this.constructor.name, this.props);
    }


    render() {
        let source = "#### Loading...";
        if(this.state.loaded) {
            let artist = "N/A";
            if (this.state.artistTitle)
                artist = `[${this.state.artistTitle}](${this.state.artistURL})`;
            let datePublished = "N/A";
            if (this.state.datePublished)
                datePublished = new Date(this.state.datePublished).toLocaleDateString();

            source = `
# Song Page
| Artist      | Published |
| :---        |    :----:   |
| ${artist}   | ${datePublished} |

${this.state.comment}
`
        }

        const songURL = this.props.location.pathname + '.json';
        return (
            <ASUIPageContainer {...this.props}>
                <ASUIMarkdown source={source}/>

                <ASComposer
                    url={songURL}
                    onSongLoad={this.cb.onSongLoad}
                />
            </ASUIPageContainer>
        );
    }


    /** Actions **/

    async onSongLoad(song) {
        console.log(song);
        const artistURL = song.data.artistURL;
        const state = {
            loaded: true,
            dateCreated: song.data.dateCreated,
            datePublished: song.data.datePublished,
            comment: song.data.comment,
        }
        if(artistURL) {
            state.artistURL = artistURL;
            const {artistTitle} = await this.loadArtistInfo(artistURL);
            state.artistTitle = artistTitle;
        }
        this.setState(state);
    }


    async loadArtistInfo(artistURL) {
        const response = await fetch(new URL(artistURL + '/artist.json', document.location.origin));
        let artistData = await response.json();
        return {
            artistTitle: artistData.title,
        }
    }

}


