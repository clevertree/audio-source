import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";


export default class ServerUser {

    constructor(email, server) {
        if(!email)
            throw new Error("Invalid user email");
        if(email.indexOf('@') === -1)
            throw new Error("Invalid user email: " + email);
        if(!server)
            throw new Error("Invalid server instance");
        this.server = server;
        this.email = email;
        this.private = null;
    }

    readPrivateData() {
        if(this.private)
            return this.private;
        return this.private = readJSONFile(this.getPrivateUserJSONPath());
    }

    getUsername() {
        const {username} = this.readPrivateData();
        if(!username)
            throw new Error("User has no username.");
        return username;
    }
    async isRegistered() { return fs.existsSync(this.getPrivateUserJSONPath()); }

    /** Actions **/

    async register(password=null, username=null, artistTitle=null) {
        if(await this.isRegistered())
            throw new Error("User is already registered: " + this.email);

        // const userFile = path.resolve(this.getPrivateUserDirectory(), FILE_USER);

        if(!username)
            username = this.email.split('@')[0];
        if(!artistTitle)
            artistTitle = username;


        for(const user of ServerUser.eachUser(this.server)) {
            const {userName:existingUsername} = readJSONFile(user.getPrivateUserJSONPath());
            if(username === existingUsername)
                throw new Error("Artist name already exists: " + username);
        }
        const privateJSON = {
            username
        };
        if(password) {
            privateJSON.password = await ServerUser.hash(password);
        }
        const artistJSON = {
            title: artistTitle
        };

        writeFile(this.getPrivateUserJSONPath(), JSON.stringify(privateJSON));
        writeFile(this.getPublicArtistJSONPath(), JSON.stringify(artistJSON));

        console.log("Registered User:", this.email);
    }

    async unregister() {
        if(!await this.isRegistered())
            throw new Error("User is not registered: " + this.email);

        console.log("Unregistering User:", this.email);
        this.erasePrivateUserDirectory();
    }

    async login(password, session) {
        if(!session)
            throw new Error("Invalid session object");

        if(!password)
            throw new Error("Invalid password");

        if(!await this.isRegistered())
            throw new Error("User is not registered: " + this.email);

        const userJSON = this.readPrivateData();
        // console.log('userJSON', userJSON);
        if(!userJSON.password)
            throw new Error("This account has no password. Email login is required");

        if(!await ServerUser.compare(password, userJSON.password))
            throw new Error("Invalid password");
        session.loggedIn = true;
        session.email = this.email;
        console.log("Login Successful:", session);
    }

    logout(session) {
        const email = session.email || "[No Email]";
        session.destroy();
        console.log("Logout Successful:", email);
    }



    /** Static **/

    static hasSession(session) {
        return (session && session.loggedIn)
    }
    static getSession(server, session) {
        if(!this.hasSession(session))
            throw new Error("Invalid user session. Please log in");

        if(!session.email)
            throw new Error("Invalid session email. Please re-log in");
        return new ServerUser(session.email, server);
    }

    static async hash(password, saltRounds=10) {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, saltRounds, (err, hash) => {
                if(err)
                    reject(err);
                resolve(hash);
            })
        })
    }

    static async compare(password, hash) {
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, hash, (err, response) => {
                if(err)
                    reject(err);
                resolve(response);
            })
        })
    }

    /**
     *
     * @param {Server} server
     * @returns {Generator<ServerUser, void, *>}
     */
    static * eachUser(server) {
        const privateUsersDirectory = server.getPrivatePath(PATH_USERS_PRIVATE);
        if(fs.existsSync(privateUsersDirectory)) {
            const domains = fs.readdirSync(privateUsersDirectory);
            for (const domain of domains) {
                if (domain) {
                    const privateUserDomainDirectory = path.resolve(privateUsersDirectory, domain);
                    const users = fs.readdirSync(privateUserDomainDirectory);
                    for (const user of users) {
                        yield new ServerUser(user + '@' + domain);
                    }
                }
            }
        }
    }

    /** Paths **/
    static getPublicUsersPath(server, ...paths) { return server.getPrivatePath(PATH_USERS_PRIVATE, ...paths); }
    static getPublicUserSongPath(server, username, ...paths) { return server.getPrivatePath(PATH_USERS_PRIVATE, username, PATH_USER_SONG, ...paths); }
    getPublicUserURL(...paths)                  { return this.server.getPublicURL(PATH_USERS_PUBLIC, this.getUsername(), ...paths); }
    getPublicUserPath(...paths)                 { return this.server.getPublicPath(PATH_USERS_PUBLIC, this.getUsername(), ...paths); }
    getPrivateUserPath(...paths) {
        const [emailUser,domain] = this.email.split('@');
        return this.server.getPrivatePath(PATH_USERS_PRIVATE, domain, emailUser, ...paths);
    }


    getPublicUserSongPath(...paths)   { return this.getPublicUserPath(PATH_USER_SONG, ...paths); }
    getPublicUserSongURL(...paths)   { return this.getPublicUserURL(PATH_USER_SONG, ...paths); }
    getPrivateUserJSONPath()   { return this.getPrivateUserPath(FILE_PRIVATE_USER); }
    getPublicArtistJSONPath()   { return this.getPublicUserPath(FILE_PUBLIC_ARTIST); }

    erasePrivateUserDirectory() {
        const userPath = this.getPrivateUserPath();
        console.log("Erasing ", userPath);
        rimraf(userPath);
    }

}
const PATH_USERS_PUBLIC = 'user';
const PATH_USERS_PRIVATE = 'user';
const PATH_USER_SONG = 'song';
const FILE_PRIVATE_USER = 'user.json';
const FILE_PUBLIC_ARTIST = 'artist.json';

/**
 * Remove directory recursively
 * @param {string} dir_path
 * @see https://stackoverflow.com/a/42505874/3027390
 */
function rimraf(dir_path) {
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function(entry) {
            var entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                rimraf(entry_path);
            } else {
                fs.unlinkSync(entry_path);
            }
        });
        fs.rmdirSync(dir_path);
    }
}

function readJSONFile(userFile) {
    const content = fs.readFileSync(userFile, 'utf8');
    // console.log("Reading File: ", userFile, content);
    return JSON.parse(content);
}

function writeFile(filePath, content) {
    const directory = path.resolve(filePath, '..');
    // console.log("Writing Directory: ", directory)
    fs.mkdirSync(directory, { recursive: true });
    // console.log("Writing File: ", filePath)
    fs.writeFileSync(filePath, content);
    return filePath;
}

// /** Test **/
// setTimeout(async () => {
//         const serverUser = new ServerUser('test@email.com');
//         // const serverUser2 = new ServerUser('test2@email.com');
//         try { await serverUser.register('test', 'test') }
//         catch (e) { console.error(e); }
//         try { await serverUser.unregister() }
//         catch (e) { console.error(e); }
//
//         // try { await serverUser2.register('test', 'test') }
//         // catch (e) { console.error(e); }
//         // try { await serverUser2.unregister() }
//         // catch (e) { console.error(e); }
//         // await serverUser.login('test')
//     },
//     100
// );

