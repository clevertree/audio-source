import ServerUserSession from "../client/ServerUserSession";
import ServerUser from "../client/ServerUser";

export default class UserAPI {
    connectApp(app) {
        app.post("/login", this.postUserLogin.bind(this))
        app.post("/register", this.postUserRegister.bind(this))
        app.get("/session", this.getUserSession.bind(this))
        app.get("/user/:id", this.getUser.bind(this))
    }

    getUser(req, res) {
        res.json({"Message": "Welcome to User", params: req.params, session: req.session});
    }

    getUserSession(req, res) {
        res.json(req.session);
    }

    // TODO: remember cookie
    async postUserLogin(req, res) {
        try {
            const {
                email,
                password,
            } = req.body;
            const serverUser = new ServerUser(email);
            await serverUser.login(password);

            req.session.email = email;
            req.session.startTime = new Date().getTime();
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

    async postUserRegister(req, res) {
        try {
            const {
                email,
                username,
                password,
            } = req.body;

            const serverUser = new ServerUser(email);
            await serverUser.register(password, username);

            req.session.email = email;
            req.session.startTime = new Date().getTime();

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
