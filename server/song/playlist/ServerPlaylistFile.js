import fs from "fs";
import path from "path";
import PlaylistFile from "./PlaylistFile";

const url = require('url');

const serverConfig = require('../.server.json')
const DIRECTORY_PLAYLISTS = 'pls';
const FILE_PL_MASTER = 'master.pls';

export default class ServerPlaylistFile {
    constructor(playlistRelativePath) {
        const publicDirectory = serverConfig.publicDirectory;
        if(playlistRelativePath.startsWith(publicDirectory)) {
            playlistRelativePath = playlistRelativePath.substr(publicDirectory.length);
            if(playlistRelativePath[0] === '/')
                playlistRelativePath = playlistRelativePath.substr(1);
        }

        this.relativePath = playlistRelativePath;
        this.playlistData = null;
        // console.log(this, serverConfig.publicURL, this.relativePath, this.getPublicURL());
    }

    getAbsolutePath() { return path.resolve(serverConfig.publicDirectory, this.relativePath); }
    getPublicURL() { return url.resolve(serverConfig.publicURL, this.relativePath); }

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
        const publicPath = '/' + serverSongFile.getRelativePath();
        const songData = serverSongFile.readSongData();
        for(const entry of this.eachEntry()) {
            const {path} = entry;
            if(path === publicPath)
                return false;
        }
        const playlistData = this.readPlaylistData();
        playlistData.push([
            publicPath,
            songData.title
        ])
        return true;
    }



    static getPublicPlaylistPath(relativePlaylistPath)   {
        return path.resolve(this.getPublicPlaylistsDirectory(), relativePlaylistPath);
    }
    static getPublicPlaylistsDirectory()   { return path.resolve(serverConfig.publicDirectory, DIRECTORY_PLAYLISTS); }
    // static getPublicSongsURL()         { return path.resolve(serverConfig.publicURL, DIRECTORY_SONGS); }

    static get DIRECTORY_PLAYLISTS() { return DIRECTORY_PLAYLISTS; }
    static get FILE_PL_MASTER() { return FILE_PL_MASTER; }

    static * eachPlaylistFile() {
        const publicPlaylistsDirectory = this.getPublicPlaylistsDirectory();
        if(fs.existsSync(publicPlaylistsDirectory)) {
            const scanDirectories = [publicPlaylistsDirectory];
            while (scanDirectories.length > 0) {
                const scanDirectory = scanDirectories.pop();
                if (fs.existsSync(scanDirectory)) {
                    const files = fs.readdirSync(scanDirectory);
                    for (let playlistFile of files) {
                        playlistFile = path.resolve(scanDirectory, playlistFile);
                        const fileStats = fs.statSync(playlistFile);
                        if (fileStats.isDirectory()) {
                            console.log("adding directory", playlistFile)
                            scanDirectories.push(playlistFile)
                        } else {
                            yield new ServerPlaylistFile(playlistFile);
                        }
                    }
                }
            }
        }
    }
}

/** Test **/
setTimeout(async () => {
    for (const playlistFile of ServerPlaylistFile.eachPlaylistFile()) {
        const playlistData = playlistFile.readPlaylistData();
        // console.log('song', song.relativePath, songData.title)
    }
}, 10);

