import fs from "fs";
const url = require('url');
import path from "path";
import ServerUser from "../user/ServerUser";
import sanitizeHtml from "sanitize-html";

const serverConfig = require('../.server.json')
const DIRECTORY_SONGS = 'songs';

export default class ServerSongFile {
    constructor(songRelativePath, songData = null) {
        const publicDirectory = serverConfig.publicDirectory;
        if(songRelativePath.startsWith(publicDirectory)) {
            songRelativePath = songRelativePath.substr(publicDirectory.length);
            if(songRelativePath[0] === '/')
                songRelativePath = songRelativePath.substr(1);
        }

        this.relativePath = songRelativePath;
        this.songData = songData;
        // console.log(this, serverConfig.publicURL, this.relativePath, this.getPublicURL());
    }

    getRelativePath() { return this.relativePath; }
    getAbsolutePath() { return path.resolve(serverConfig.publicDirectory, this.relativePath); }
    getPublicURL() { return url.resolve(serverConfig.publicURL, this.relativePath); }

    setSongData(songData) {
        this.songData = songData;
    }

    readSongData() {
        if(this.songData)
            return this.songData;
        this.songData = JSON.parse(fs.readFileSync(this.getAbsolutePath(), 'utf8'));
        return this.songData;
    }

    writeSongData() {
        const absolutePath = this.getAbsolutePath();
        const content = this.formatAsJSONString();
        const directory = path.resolve(absolutePath, '..');
        console.log("Writing Directory: ", directory)
        fs.mkdirSync(directory, { recursive: true });
        console.log("Writing Song File: ", absolutePath)
        fs.writeFileSync(absolutePath, content);
    }

    formatAsJSONString() {
        const songData = this.readSongData();
        // const song = this.data;
        const instructionsKey = `/** INSTRUCTION_BLOCK {new Date()} **/`;
        let jsonStringInstructions = JSON.stringify(songData.tracks);
        let jsonString = JSON.stringify(Object.assign({}, songData, {
            tracks: instructionsKey
        }), null, "\t");
        return jsonString.replace('"' + instructionsKey + '"', jsonStringInstructions);
    }


    validateSongData() {
        const songData = this.songData;
        if(typeof songData !== "object")
            throw new Error("Invalid song data object");

        [
            'title',
            'uuid',
            'version',
            'created',
            'timeDivision',
            'beatsPerMinute',
            'programs',
            'tracks',
        ].forEach(param => {
            if(!songData[param])
                throw new Error("Song data is missing required parameter: " + param);
        })
    }

    sanitizeObject(obj=this.songData) {
        for (let property in obj) {
            if (obj.hasOwnProperty(property)) {
                const value = obj[property];
                if (typeof value == "object") {
                    this.sanitizeObject(value);
                }
                else if(typeof value === "string") {
                    const sanitized = sanitizeHtml(value)
                    if(sanitized !== value) {
                        console.warn("Sanitized HTML characters: ", property, value)
                        obj[property] = sanitized;
                    }
                }
            }
        }
    }



    // static getPublicSongsDirectory()   { return path.resolve(serverConfig.publicDirectory, DIRECTORY_SONGS); }
    // static getPublicSongsURL()         { return path.resolve(serverConfig.publicURL, DIRECTORY_SONGS); }

    static get DIRECTORY_SONGS() { return DIRECTORY_SONGS; }

    static getUserSongsDirectory(username) {
        return path.resolve(ServerUser.getPublicUsersDirectory(), username, DIRECTORY_SONGS);
    }

    static * eachSongFile() {
        const publicUsersDirectory = ServerUser.getPublicUsersDirectory();
        if(fs.existsSync(publicUsersDirectory)) {
            const users = fs.readdirSync(publicUsersDirectory);
            for (const user of users) {
                if (user) {
                    const publicUserSongsDirectory = path.resolve(publicUsersDirectory, user, DIRECTORY_SONGS);
                    const scanDirectories = [publicUserSongsDirectory];
                    while (scanDirectories.length > 0) {
                        const scanDirectory = scanDirectories.pop()
                        if (fs.existsSync(scanDirectory)) {
                            const songs = fs.readdirSync(scanDirectory);
                            for (let songFile of songs) {
                                songFile = path.resolve(scanDirectory, songFile);
                                const fileStats = fs.statSync(songFile);
                                if (fileStats.isDirectory()) {
                                    console.log("adding directory", songFile)
                                    scanDirectories.push(songFile)
                                } else {
                                    yield new ServerSongFile(songFile);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/** Test **/
setTimeout(async () => {
    for (const song of ServerSongFile.eachSongFile()) {
        const songData = song.readSongData();
        // console.log('song', song.relativePath, songData.title)
    }
}, 10);

