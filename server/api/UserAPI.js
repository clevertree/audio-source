export default class UserAPI {
    connectApp(app) {
        app.get("/user/login", this.getUserLogin.bind(this))
        app.get("/user/:id", this.getUser.bind(this))
    }

    getUser(req, res) {
        res.json({"Message": "Welcome to User", params: req.params, session: req.session});
    }

    getUserLogin(req, res) {
        const session = req.session;
        session.userID = 1;
        res.json({"Message": "Logged In", params: req.params, session: req.session});
    }
}
