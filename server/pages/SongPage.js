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
`
        }
        return (
            <ASUIPageContainer {...this.props}>
                <ASUIMarkdown source={source}/>

                <ASComposer
                    location={this.props.location}
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
        }
        if(artistURL) {
            state.artistURL = '/user#url=' + artistURL;
            const {artistTitle} = await this.loadArtistInfo(artistURL);
            state.artistTitle = artistTitle;
        }
        this.setState(state);
    }


    async loadArtistInfo(artistURL) {
        const response = await fetch(new URL("./artist.json", artistURL + '/'));
        let artistData = await response.json();
        return {
            artistTitle: artistData.title,
        }
    }

}


