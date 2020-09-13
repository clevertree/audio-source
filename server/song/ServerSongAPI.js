import compareVersions from 'compare-versions';
import sanitizeHtml from 'sanitize-html';

import ServerUser from "../user/ServerUser";

export default class ServerSongAPI {
    connectApp(app) {
        app.post("/publish", this.postPublish.bind(this))
    }


    async postPublish(req, res) {
        try {
            const userSession = ServerUser.getSession(req.session);

            const {
                song: songData,
                filename
            } = req.body;

            if(!filename)
                throw new Error("Invalid song filename");
            if(!filename.match(/^[\w_]+\.json$/))
                throw new Error("Invalid song filename: " + filename);

            validateSongData(songData);
            sanitizeObject(songData);

            // const {username} = userSession.loadPrivateUserJSON();
            // const userPath = userSession.getPublicUserDirectory();
            let oldVersion = "[No old version]";
            if(userSession.publicFileExists(filename)) {
                const oldSongData = userSession.readPublicFile(filename);
                if(oldSongData.uuid !== songData.uuid)
                    throw new Error("Published song must have the same UUID as existing song: " + songData.uuid);
                oldVersion = oldSongData.version;
                const newVersion = songData.version;
                if(!compareVersions.compare(newVersion, oldVersion, '>'))
                    throw new Error("New song version must be greater than " + oldVersion);
            }

            userSession.writePublicFile(filename, formatSongAsJSONString(songData));
            const songURL = new URL(userSession.getPublicFileURL(filename), req.get("Origin")).toString();

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


function formatSongAsJSONString(songData) {
    // const song = this.data;
    const instructionsKey = "/** INSTRUCTION_BLOCK **/";
    let jsonStringInstructions = JSON.stringify(songData.tracks);
    let jsonString = JSON.stringify(Object.assign({}, songData, {
        tracks: instructionsKey
    }), null, "\t");
    return jsonString.replace('"' + instructionsKey + '"', jsonStringInstructions);
}


function validateSongData(songData) {
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

function sanitizeObject(obj) {
    for (var property in obj) {
        if (obj.hasOwnProperty(property)) {
            const value = obj[property];
            if (typeof value == "object") {
                sanitizeObject(value);
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
