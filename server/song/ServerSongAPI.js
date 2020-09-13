import fs from "fs";
import compareVersions from 'compare-versions';

import ServerUser from "../user/ServerUser";
import ServerSong from "./ServerSong";

export default class ServerSongAPI {
    connectApp(app) {
        app.post("/publish", this.postPublish.bind(this))
    }


    async postPublish(req, res) {
        try {
            const userSession = ServerUser.getSession(req.session);

            let {
                song: songData,
                filename,
            } = req.body;

            // TODO identify song by UUID
            let existingSong = null;
            for (const song of ServerSong.eachSong()) {
                const existingSongData = song.readSongData();
                if(existingSongData.uuid === songData.uuid) {
                    existingSong = song;
                    break;
                }
            }

            // TODO Allow renaming of old file?


            if(!filename)
                throw new Error("Invalid song filename");
            if(!filename.match(/^[\w_]+\.json$/))
                throw new Error("Invalid song filename: " + filename);
            const songFilePath = userSession.getPublicFilePath(ServerSong.DIRECTORY_SONGS + '/' + filename);
            const song = new ServerSong(songFilePath, songData);

            song.validateSongData(songData);
            song.sanitizeObject(songData);

            // const {username} = userSession.loadPrivateUserJSON();
            // const userPath = userSession.getPublicUserDirectory();
            let oldVersion = "[No old version]";
            if(fs.existsSync(songFilePath)) {
                const oldSongData = JSON.parse(fs.readFileSync(songFilePath, 'utf8'));
                if(oldSongData.uuid !== songData.uuid)
                    throw new Error("Published song must have the same UUID as existing song: " + songData.uuid);
                oldVersion = oldSongData.version;
                const newVersion = songData.version;
                if(!compareVersions.compare(newVersion, oldVersion, '>'))
                    throw new Error("New song version must be greater than " + oldVersion);
            } else {

                for (const song of ServerSong.eachSong()) {
                    console.log('songFilePath', songFilePath, song.path);
                    if(song.path === songFilePath)
                        continue;
                    const existingSongData = song.readSongData();
                    if(existingSongData.uuid === songData.uuid)
                        throw new Error(`UUID must be unique (${songFilePath} !== ${song.path})`);
                }
            }

            userSession.writePublicFile(songFilePath, song.formatAsJSONString());
            const songURL = new URL(userSession.getPublicFileURL(songFilePath), req.get("Origin")).toString();

            const versionChange = `${oldVersion} => ${songData.version}`;
            console.log("Published Song:", songData.title, versionChange);
            res.json({
                "message": `Song Published (${versionChange})`,
                songURL,
            });
        } catch (e) {
            console.error(e);
            res.statusMessage = e.message;
            res.status(400)
            res.json({
                "message": e.message,
                session: req.session,
                body: req.body
            });
        }
    }

}


