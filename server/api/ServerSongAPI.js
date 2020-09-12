import ServerUser from "../client/ServerUser";

export default class ServerSongAPI {
    connectApp(app) {
        app.post("/publish", this.postPublish.bind(this))
    }


    async postPublish(req, res) {
        try {

            const songData = req.body;

            res.json({
                "message": "Song Published",
                songData
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
