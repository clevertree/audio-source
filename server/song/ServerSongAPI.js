import compareVersions from 'compare-versions';
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

            this.validateSongData(songData);

            // const {username} = userSession.loadPrivateUserJSON();
            // const userPath = userSession.getPublicUserDirectory();
            let oldVersion = "[No old version]";
            if(userSession.publicFileExists(filename)) {
                const oldSongData = userSession.readPublicFile(filename);
                oldVersion = oldSongData.version;
                const newVersion = songData.version;
                if(!compareVersions.compare(newVersion, oldVersion, '>'))
                    throw new Error("New song version must be greater than " + oldVersion);
            }


            const filePath = userSession.writePublicFile(filename, formatSongAsJSONString(songData));

            console.log("Published Song:", songData.title, `${oldVersion} => ${songData.version}`);
            res.json({
                "message": "Song Published",
                filePath
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


    validateSongData(songData) {
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
