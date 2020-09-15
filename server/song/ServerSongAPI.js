import path from "path";
import compareVersions from 'compare-versions';

import ServerUser from "../user/ServerUser";
import ServerSongFile from "./ServerSongFile";
import ServerPlaylistFile from "./playlist/ServerPlaylistFile";

// noinspection ExceptionCaughtLocallyJS
export default class ServerSongAPI {
    constructor(app, server) {
        this.server = server;
        app.post("/publish", this.postPublish.bind(this))
        app.get("/isPublished/:uuid", this.getIsPublished.bind(this))
    }


    async postPublish(req, res) {
        try {
            const startTime = new Date().getTime();
            const userSession = this.server.getUserSession(req.session);
            // const username = userSession.getUsername();
            const publishingDomain = req.get("Origin");

            let {
                song: songData,
                filename,
            } = req.body;
            if(!songData)
                throw new Error("Invalid parameter: song")

            /** @var {ServerSongFile} **/
            let publishingSongFile = this.findSongByUUID(songData.uuid);

            if(!filename)
                throw new Error("Invalid song filename");
            // Remove json extension
            if(filename.toLowerCase().endsWith('.json'))
                filename = filename.substr(0, filename.length-5);
            // if(!filename.match(/^[\w_]+\.json$/))
            //     throw new Error("Invalid song filename: " + filename);

            const songFileAbsoluteURL = userSession.getPublicUserSongPath(filename);
            const songFileAbsolutePath = userSession.getPublicUserSongURL(filename + '.json');
            console.log("Publishing Song:", songData.title, songFileAbsolutePath);

            let versionChange = `${songData.version}`;
            if(publishingSongFile) {
                const existingSongPath = publishingSongFile.getAbsolutePath();
                // TODO: allow song renaming
                // if(publishingSongFile.getAbsolutePath() !== existingSongPath)
                //     throw new Error("file path mismatch");

                // if(username !== publishingSongFile.songData.username)
                //     throw new Error("Username mismatch");

                const userSongsDirectory = userSession.getPublicUserSongPath();
                if(!existingSongPath.startsWith(userSongsDirectory))
                    throw new Error("Invalid permission to modify " + existingSongPath);

                console.log("Found existing song UUID:", publishingSongFile.songData.uuid);

                const oldSongData = publishingSongFile.readSongData();
                versionChange = `${oldSongData.version} => ${songData.version}`;
                const newVersion = songData.version;
                if(!compareVersions.compare(newVersion, oldSongData.version, '>'))
                    throw new Error("New song version must be greater than " + oldSongData.version);

                // Set new song data
                publishingSongFile.setSongData(songData);
            } else {
                console.log("Song UUID not found. Publishing new file:", songData.uuid);
                publishingSongFile = new ServerSongFile(songFileAbsolutePath, this.server);
                publishingSongFile.songData = songData;

                songData.artistURL = userSession.getPublicUserURL();
                songData.url = new URL(songFileAbsoluteURL, publishingDomain).toString();
            }

            songData.datePublished = new Date().getTime();


            publishingSongFile.validateSongData(songData);
            publishingSongFile.sanitizeObject(songData);


            // Write Song file
            publishingSongFile.writeSongData(songData);


            this.addToPlaylist(publishingSongFile, ServerPlaylistFile.FILE_PL_MASTER);
            // TODO: add to other playlists?



            console.log("Published Song:", songData.title, versionChange);
            res.json({
                "message": `Song Published (${versionChange})`,
                songURL: songData.url,
                duration: new Date().getTime() - startTime
            });
        } catch (e) {
            sendError(req, res, e)
        }
    }


    async getIsPublished(req, res) {
        try {
            const startTime = new Date().getTime();
            let {
                uuid,
            } = req.params;

            if(!uuid)
                throw new Error("Invalid UUID");

            let publishingSongFile = this.findSongByUUID(uuid);
            const responseJSON = {
                isPublished: false,
                duration: new Date().getTime() - startTime
            }
            if(publishingSongFile) {
                responseJSON.isPublished = true;
                responseJSON.url = publishingSongFile.getPublicURL();
            }
            // console.log(`Song UUID ${uuid} is${responseJSON.isPublished?'':' not'} published`);
            res.json(responseJSON);

        } catch (e) {
            sendError(req, res, e)
        }
    }

    /** Actions **/

    addToPlaylist(publishingSongFile, playlistRelativeFilePath) {
        const playlistAbsoluteFile = path.resolve(ServerPlaylistFile.getPublicPlaylistsDirectory(), playlistRelativeFilePath);
        const playlistFile = new ServerPlaylistFile(playlistAbsoluteFile);
        if(playlistFile.addSong(publishingSongFile)) {
            console.log("Added to playlist: ", playlistRelativeFilePath);
            playlistFile.writePlaylistData();
        }
    }

    // TODO: cache?
    findSongByUUID(uuid) {
        for (const songFile of ServerSongFile.eachSongFile(this.server)) {
            const existingSongData = songFile.readSongData();
            if(existingSongData.uuid === uuid) {
                return songFile;
            }
        }
        return null;
    }

}


function sendError(req, res, e) {
    console.error(e);
    res.statusMessage = e.message;
    res.status(400)
    res.json({
        "message": e.message,
    });
}
