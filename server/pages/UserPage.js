import * as React from "react";
import {ASUIPageContainer, ASUIMarkdown} from "../../components";


export default class UserPage extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onSongLoad: song => this.onSongLoad(song)
        }
        this.state = {
            loaded: false,
            title: null,
        }
        console.log(this.constructor.name, this.props);
    }

    componentDidMount() {
        this.loadArtistInfo()
    }

    render() {
        let source = "#### Loading...";
        if(this.state.loaded) {
            let artist = "N/A";
            if (this.state.title)
                artist = `[${this.state.title}](${this.state.url})`;

            source = `
# Artist: ${artist}

#### Song List Coming Soon
`
        }
        return (
            <ASUIPageContainer {...this.props}>
                <ASUIMarkdown source={source}/>
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
            state.artistURL = artistURL;
            const {artistTitle} = await this.loadArtistInfo(artistURL);
            state.artistTitle = artistTitle;
        }
        this.setState(state);
    }


    async loadArtistInfo() {
        const artistURL = this.props.location.pathname;
        const response = await fetch(new URL(artistURL + '/artist.json', document.location.origin));
        let artistData = await response.json();
        artistData.url = artistURL;
        artistData.loaded = true;
        this.setState(artistData);
        console.log('artistData', artistData);
    }

}


