import fs from "fs";
import path from "path";
import ServerUser from "../user/ServerUser";
import sanitizeHtml from "sanitize-html";

const DIRECTORY_SONG = 'song';

export default class ServerSongFile {
    /**
     *
     * @param songRelativePath
     * @param {Server} server
     */
    constructor(songRelativePath, server) {
        const publicDirectory = server.getPublicPath();
        if(songRelativePath.startsWith(publicDirectory)) {
            songRelativePath = songRelativePath.substr(publicDirectory.length);
            if(songRelativePath[0] === '/')
                songRelativePath = songRelativePath.substr(1);
        }

        this.relativePath = songRelativePath;
        this.server = server;
        // console.log(this, serverConfig.publicURL, this.relativePath, this.getPublicURL());
    }

    getRelativePath()               { return this.relativePath; }
    getPublicURL(path=null)    { return this.server.getPublicURL(this.relativePath + (path ? '/' + path : '')); }
    // getPublicDirectory(...paths) { return this.server.getPublicDirectory(this.relativePath, ...paths); }
    getAbsolutePath()               { return this.server.getPublicPath(this.relativePath); }
    getAbsolutePathDirectory()      { return this.server.getPublicPath(this.relativePath, '..'); }

    setSongData(songData) {
        this.songData = songData;
    }

    readSongData() {
        if(this.songData)
            return this.songData;
        this.songData = readJSONFile(this.getAbsolutePath());
        return this.songData;
    }

    writeSongData() {
        const absolutePath = this.getAbsolutePath();
        const content = this.formatAsJSONString();
        const directory = this.getAbsolutePathDirectory();
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
            'dateCreated',
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




    /** @var {Server} **/
    static * eachSongFile(server) {
        const publicUsersDirectory = ServerUser.getPublicUsersPath(server);
        if(fs.existsSync(publicUsersDirectory)) {
            const users = fs.readdirSync(publicUsersDirectory);
            for (const username of users) {
                if (username) {
                    const publicUserSongsDirectory = ServerUser.getPublicUserSongPath(server, username);
                    const scanDirectories = [publicUserSongsDirectory];
                    while (scanDirectories.length > 0) {
                        const scanDirectory = scanDirectories.pop()
                        if (fs.existsSync(scanDirectory)) {
                            const songs = fs.readdirSync(scanDirectory);
                            for (let songFile of songs) {
                                songFile = path.resolve(scanDirectory, songFile);
                                const fileStats = fs.statSync(songFile);
                                if (fileStats.isDirectory()) {
                                    console.log("scanning directory", songFile)
                                    scanDirectories.push(songFile)
                                } else {
                                    yield new ServerSongFile(songFile, server);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function readJSONFile(userFile) {
    const content = fs.readFileSync(userFile, 'utf8');
    // console.log("Reading File: ", userFile, content);
    return JSON.parse(content);
}

function writeFile(filePath, content) {
    const directory = path.resolve(filePath, '..');
    // console.log("Writing Directory: ", directory)
    fs.mkdirSync(directory, { recursive: true });
    // console.log("Writing File: ", filePath)
    fs.writeFileSync(filePath, content);
    return filePath;
}



/** Test **/
setTimeout(async () => {
    // for (const song of ServerSongFile.eachSongFile()) {
    //     const songData = song.readSongData();
    //     // console.log('song', song.relativePath, songData.title)
    // }
}, 10);

