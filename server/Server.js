import ServerUserAPI from "./user/ServerUserAPI";
import ServerSongAPI from "./song/ServerSongAPI";

const express = require('express');
// const session = require('express-session');
const clientSessions = require('client-sessions')

const serverConfig = require('./.server.json')

export default class Server {
    constructor(config={}) {
        this.app = null;
    }
    start() {
        const app = express();
        this.app = app;
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        // CORS
        app.use(function(req, res, next) {
            const origin = req.get('Origin');
            if(origin) {
                // console.log('origin', origin);
                res.header("Access-Control-Allow-Origin", serverConfig.request.origin || req.get('Origin')); // update to match the domain you will make the request from
                res.header("Access-Control-Allow-Credentials", true);
                res.header("Access-Control-Allow-Methods", 'POST, GET, PUT, DELETE, OPTIONS');
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            }
            next();
        });

        app.use(clientSessions(Object.assign({
            cookieName: 'session', // cookie name dictates the key name added to the request object
            secret: 'cb1fbb07079625629cf5858718f33713', // should be a large unguessable string
            duration: 30 * 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
            activeDuration: 24 * 1000 * 60 * 60 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
        }, serverConfig.session || {})));

        // APIs
        new ServerUserAPI().connectApp(app);
        new ServerSongAPI().connectApp(app);

        // app.use(express.static(ROOT_DIR));

        app.get("/",function(request,response)
        {
            response.json({"Message":"Welcome to Audio Source"});
        });

        app.listen(serverConfig.port, () => {
            console.log('Server listening on port: ' + serverConfig.port);
        });

    }
}


// Import the rest of our application.
// module.exports = require('./server.js')
