import PlaylistFile from "./PlaylistFile";

export default class ClientPlaylistFile {
    constructor(playlistData=[]) {
        this.playlistData = playlistData;
    }

    *eachEntry() {
        for(let entry of this.playlistData) {
            yield PlaylistFile.parseEntry(entry);
        }
    }
}


