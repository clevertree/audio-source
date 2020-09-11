import ServerUserSession from "../client/ServerUserSession";
import ServerUser from "../client/ServerUser";

export default class UserAPI {
    connectApp(app) {
        app.post("/login", this.postUserLogin.bind(this))
        app.post("/register", this.postUserRegister.bind(this))
        app.get("/user/:id", this.getUser.bind(this))
    }

    getUser(req, res) {
        res.json({"Message": "Welcome to User", params: req.params, session: req.session});
    }

    async postUserLogin(req, res) {
        try {
            const {
                email,
                password,
            } = req.body;
            const serverUser = new ServerUser(email);
            await serverUser.login(password);

            const session = new ServerUserSession(req.session);
            res.json({
                "message": "Logged In",
                email
            });
        } catch (e) {
            console.error(e);
            res.statusMessage = e.message;
            res.status(400)
            res.json({
                "message": e.message,
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
            await serverUser.register(username, password);
            res.json({
                "message": "Registered",
                username
            });
        } catch (e) {
            console.error(e);
            res.statusMessage = e.message;
            res.status(400)
            res.json({
                "message": e.message,
                body: req.body
            });
        }
    }

}
