import UserAPI from "./api/UserAPI";

const express = require('express');
// const session = require('express-session');
const clientSessions = require('client-sessions')
const cors = require('cors');

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
        app.use(cors({
            credentials: true,
            origin: 'http://localhost:3000'
        }));

        app.use(clientSessions({
            cookieName: 'session', // cookie name dictates the key name added to the request object
            secret: 'cb1fbb07079625629cf5858718f33713', // should be a large unguessable string
            duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
            activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
        }));

        // app.use(session({
        //     secret: 'cb1fbb07079625629cf5858918f33713',
        //     saveUninitialized: true,
        //     resave: true
        // }));
        new UserAPI().connectApp(app);


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
