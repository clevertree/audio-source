import fs from "fs";
import path from "path";
import PlaylistFile from "../../../song/playlist/PlaylistFile";

const url = require('url');

const DIRECTORY_PLAYLISTS = 'playlists';
const FILE_PL_MASTER = 'master.pls';

export default class ServerPlaylistFile {
    constructor(playlistRelativePath, server) {
        const publicDirectory = server.getPublicPath();
        if(playlistRelativePath.startsWith(publicDirectory)) {
            playlistRelativePath = playlistRelativePath.substr(publicDirectory.length);
            if(playlistRelativePath[0] === '/')
                playlistRelativePath = playlistRelativePath.substr(1);
        }
        this.relativePath = playlistRelativePath;
        this.playlistData = null;
        this.server = server;
        // console.log(this, serverConfig.publicURL, this.relativePath, this.getPublicURL());
    }

    getRelativePath()               { return this.relativePath; }
    getPublicURL(path=null)    { return this.server.getPublicURL(this.relativePath + (path ? '/' + path : '')); }
    getAbsolutePath()               { return this.server.getPrivatePath(this.relativePath); }
    getAbsolutePathDirectory()      { return this.server.getPrivatePath(this.relativePath, '..'); }

    readPlaylistData() {
        if(this.playlistData)
            return this.playlistData;
        const absPath = this.getAbsolutePath();
        if(!fs.existsSync(absPath)) {
            this.playlistData = [];
        } else {
            const playlistContent = fs.readFileSync(absPath, 'utf8') || '';
            this.playlistData = playlistContent.split("\n").filter(v => !!v.trim());
        }
        return this.playlistData;
    }

    writePlaylistData() {
        const absolutePath = this.getAbsolutePath();
        const content = this.formatAsJSONString();
        const directory = path.resolve(absolutePath, '..');
        // console.log("Writing Directory: ", directory)
        fs.mkdirSync(directory, { recursive: true });
        // console.log("Writing Song File: ", absolutePath)
        fs.writeFileSync(absolutePath, content);
    }

    formatAsJSONString() {
        const playlistData = this.readPlaylistData();
        return playlistData.map(entry => {
            if(typeof entry === "string")
                return entry.trim();
            return JSON.stringify(entry);
        }).join("\n");
    }

    *eachEntry() {
        for(let entry of this.readPlaylistData()) {
            yield PlaylistFile.parseEntry(entry);
        }
    }

    /**
     * @param {ServerSongFile} serverSongFile
     */
    addSong(serverSongFile) {
        const publicURL = '/' + serverSongFile.getRelativePath();
        const songData = serverSongFile.readSongData();
        for(const entry of this.eachEntry()) {
            const {url} = entry;
            if(url === publicURL)
                return false;
        }
        const playlistData = this.readPlaylistData();
        playlistData.push([
            publicURL,
            songData.title
        ])
        return true;
    }

}
