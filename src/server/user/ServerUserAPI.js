import ServerUser from "./ServerUser";

export default class ServerUserAPI {
    constructor(app, server) {
        this.server = server;
        app.post("/login", this.postUserLogin.bind(this))
        app.post("/logout", this.postUserLogout.bind(this))
        app.post("/register", this.postUserRegister.bind(this))
        app.get("/session", this.getUserSession.bind(this))
    }


    getUserSession(req, res) {
        res.json(req.session);
    }

    async postUserLogin(req, res) {
        try {

            const {
                email,
                password,
            } = req.body;
            const serverUser = new ServerUser(email, this.server);
            await serverUser.login(password, req.session);

            res.json({
                "message": "Logged In",
                session: req.session
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

    async postUserLogout(req, res) {
        try {
            const userSession = this.server.getUserSession(req.session);

            await userSession.logout(req.session);

            res.json({
                "message": "Logged Out",
                session: req.session
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

    async postUserRegister(req, res) {
        try {
            req.session.loggedIn = true;

            const {
                email,
                username,
                artistTitle,
                password,
            } = req.body;

            const serverUser = new ServerUser(email, this.server);
            await serverUser.register(password, username, artistTitle);
            await serverUser.login(password, req.session);


            res.json({
                "message": "Registered",
                session: req.session,
                username
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
