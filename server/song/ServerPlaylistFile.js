import fs from "fs";
const url = require('url');
import path from "path";

const serverConfig = require('../.server.json')
const DIRECTORY_PLAYLISTS = 'pl';
const FILE_PL_MASTER = 'master.pl.json';

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
            const jsonContent = fs.readFileSync(absPath, 'utf8') || '[]';
            this.playlistData = JSON.parse(jsonContent);
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
        return `[\n${playlistData.map(entry => JSON.stringify(entry)).join(",\n")}\n]`;
    }

    /**
     * @param {ServerSongFile} serverSongFile
     */
    addSong(serverSongFile) {
        const publicPath = '/' + serverSongFile.getRelativePath();
        const songData = serverSongFile.readSongData();
        const playlistData = this.readPlaylistData();
        for(const entry of playlistData) {
            const [entryPath] = entry;
            if(entryPath === publicPath)
                return false;
        }
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

