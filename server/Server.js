import ServerUserAPI from "./user/ServerUserAPI";
import ServerSongAPI from "./song/ServerSongAPI";
import path from "path";
import ServerUser from "./user/ServerUser";

const {version} = require('../package.json');
const express = require('express');
// const session = require('express-session');
const clientSessions = require('client-sessions')

export default class Server {
    constructor(config={}) {
        this.config = Object.assign({}, defaultConfig, config);
        this.app = null;
    }


    start() {
        const app = express();
        this.app = app;
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        // CORS
        if(this.config.corsOrigin) {
            app.use((req, res, next) => {
                const origin = req.get('Origin');
                if (origin) {
                    // console.log('origin', origin);
                    res.header("Access-Control-Allow-Origin", this.config.corsOrigin); // update to match the domain you will make the request from
                    res.header("Access-Control-Allow-Credentials", true);
                    res.header("Access-Control-Allow-Methods", 'POST, GET, PUT, DELETE, OPTIONS');
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                }
                next();
            });
        }

        app.use(clientSessions(Object.assign({
            cookieName: 'session', // cookie name dictates the key name added to the request object
            secret: 'cb1fbb07079625629cf5858718f33713', // should be a large unguessable string
            duration: 30 * 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
            activeDuration: 24 * 1000 * 60 * 60 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
        }, this.config.session || {})));

        // APIs
        new ServerUserAPI(app, this);
        new ServerSongAPI(app, this);

        const buildPath = path.resolve(__dirname, '../../../build')
        // app.use(express.static(this.getPublicPath()));
        app.use(express.static(buildPath)); // Host the compiled app

        // If no files found, route to index
        app.use((req, res) => {
            // console.log('404', req.path);
            res.sendFile('index.html', {root: buildPath })
        })



        app.listen(this.config.port, () => {
            console.log(`Server (${version}) listening on port: ${this.config.port}`);
        });
    }

    /** Users **/


    hasUserSession(session) {
        return (session && session.loggedIn)
    }
    getUserSession(session) {
        if(!this.hasUserSession(session))
            throw new Error("Invalid user session. Please log in");

        if(!session.email)
            throw new Error("Invalid session email. Please re-log in");
        return new ServerUser(session.email, this);
    }



    /** Files **/

    getPublicPath(...paths) { return path.resolve(this.config.publicDirectory, ...paths); }
    getPrivatePath(...paths) { return path.resolve(this.config.privateDirectory, ...paths); }
    getPublicURL(...paths) { return new URL(paths.join('/'), this.config.publicURL).toString(); }
    // getPublicUsersPath(...paths) { return ServerSongFile.getPublicUsersPath(this, ...paths); }



    getPublicPlaylistJSONPath(playlistName) { return this.getPublicPath(PATH_PLAYLISTS, playlistName)}
    getPublicMasterPlaylistJSONPath() { return this.getPublicPath(FILE_PL_MASTER)}


}
const PATH_PLAYLISTS = 'playlists';
const FILE_PL_MASTER = 'master.pls';

const defaultConfig = {
    port: 8080,
    publicURL: null,
    publicDirectory: "./public",
    privateDirectory: "./private",
    sessionSecret: "cb1fbb07079625629cf5858718f33713",
    corsOrigin: null
};


// Import the rest of our application.
// module.exports = require('./server.js')
