
export default class Playlist {
    constructor(data) {
        this.title = data.title || "No Title";
        if(!Array.isArray(data.playlist))
            throw new Error("Invalid Playlist");
        this.playlist = data.playlist;
    }

    getEntry(index) {
        const entry = this.playlist[index];
        if(!entry)
            throw new Error("Invalid entry: " + index);
        return entry;
    }

    getList() { return this.playlist; }

    async loadClient() {

        const artistCache = {};
        /** Load Song/Artist Info **/
        for(let i=0; i<this.playlist.length; i++) {
            const entry = this.playlist[i];
            if(!entry.url) {
                console.warn("Playlist entry has no url:", entry);
                continue;
            }
            const songInfo = await this.loadSongInfo(entry.url);
            const artistInfo = artistCache[songInfo.artistURL] || await this.loadArtistInfo(songInfo.artistURL);
            artistCache[songInfo.artistURL] = artistInfo;
            Object.assign(entry, songInfo, artistInfo);
        }
    }


    async loadSongInfo(songURL) {
        if(!songURL.toLowerCase().endsWith('.json'))
            songURL += '.json';
        const response = await fetch(songURL);
        let songData = await response.json();
        return {
            title: songData.title,
            uuid: songData.uuid,
            url: songData.url,
            artistURL: songData.artistURL,
            datePublished: songData.datePublished,
        }
    }

    async loadArtistInfo(artistURL) {
        const response = await fetch(new URL(artistURL + '/artist.json', document.location.origin));
        let artistData = await response.json();
        return {
            artistTitle: artistData.title,
        }
    }
}

