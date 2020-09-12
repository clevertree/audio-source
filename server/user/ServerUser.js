import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";

const serverConfig = require('../.server.json')
const DIRECTORY_USERS_PRIVATE = 'users';
const DIRECTORY_USERS_PUBLIC = 'u';
const FILE_USER = 'user.json';

export default class ServerUser {

    constructor(email) {
        if(!email)
            throw new Error("Invalid user email");
        if(email.indexOf('@') === -1)
            throw new Error("Invalid user email: " + email);
        this.email = email;
        this.username = null;
    }

    getUsername() {
        if(this.username)
            return this.username;
        const {username} = this.readPrivateFile(FILE_USER);
        if(!username)
            throw new Error("User has no username.");
        this.username = username;
        return username;
    }


    async isRegistered() { return this.privateFileExists(FILE_USER); }

    /** Actions **/

    async register(password=null, username=null) {
        if(await this.isRegistered())
            throw new Error("User is already registered: " + this.email);

        if(!username)
            username = this.email.split('@')[0];
        // const userFile = path.resolve(this.getPrivateUserDirectory(), FILE_USER);
        const userJSON = {
            username,
        };
        if(password) {
            userJSON.password = await ServerUser.hash(password);
        }

        console.log("Registering User:", this.email);
        this.writePrivateFile(FILE_USER, JSON.stringify(userJSON));
    }

    async unregister() {
        if(!await this.isRegistered())
            throw new Error("User is not registered: " + this.email);

        const userPath = this.getPrivateUserDirectory();
        console.log("Unregistering User:", this.email);
        rimraf(userPath);
    }

    async login(password, session) {
        if(!session)
            throw new Error("Invalid session object");

        if(!password)
            throw new Error("Invalid password");

        if(!await this.isRegistered())
            throw new Error("User is not registered: " + this.email);

        const userJSON = this.readPrivateFile(FILE_USER);
        console.log('userJSON', userJSON);
        if(!userJSON.password)
            throw new Error("This account has no password. Email login is required");

        if(!await ServerUser.compare(password, userJSON.password))
            throw new Error("Invalid password");
        session.loggedIn = true;
        session.email = this.email;
        console.log("Login Successful:", session);
    }

    /** Files Files **/


    getPublicUsersDirectory()   { return path.resolve(serverConfig.publicDirectory, DIRECTORY_USERS_PUBLIC); }
    getPublicUsersURL()         { return path.resolve(serverConfig.publicURL, DIRECTORY_USERS_PUBLIC); }

    getPublicUserDirectory()    { return path.resolve(this.getPublicUsersDirectory(), this.getUsername()); }
    getPublicUserURL()          { return path.resolve(this.getPublicUsersURL(), this.getUsername()); }

    getPrivateUsersDirectory() { return path.resolve(serverConfig.privateDirectory, DIRECTORY_USERS_PRIVATE); }
    getPrivateUserDirectory() {
        const [emailUser,domain] = this.email.split('@');
        return path.resolve(this.getPrivateUsersDirectory(), domain, emailUser);
    }

    getPublicFileURL(fileName) { return path.resolve(this.getPublicUserURL(), fileName); }

    getPublicFilePath(fileName) { return path.resolve(this.getPublicUserDirectory(), fileName); }
    getPrivateFilePath(fileName) { return path.resolve(this.getPrivateUserDirectory(), fileName); }

    publicFileExists(fileName) { return fs.existsSync(this.getPublicFilePath(fileName)); }
    privateFileExists(fileName) { return fs.existsSync(this.getPrivateFilePath(fileName)); }

    readPublicFile(fileName) { return readFile(this.getPublicFilePath(fileName)); }
    readPrivateFile(fileName) { return readFile(this.getPrivateFilePath(fileName)); }

    writePublicFile(fileName, content) { return writeFile(this.getPublicUserDirectory(), fileName, content); }
    writePrivateFile(fileName, content) { return writeFile(this.getPrivateUserDirectory(), fileName, content); }



    /** Static **/

    static hasSession(session) {
        return (session && session.loggedIn)
    }
    static getSession(session) {
        if(!this.hasSession(session))
            throw new Error("Invalid user session. Please log in");

        if(!session.email)
            throw new Error("Invalid session email. Please re-log in");
        return new ServerUser(session.email);
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

}

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

function readFile(userFile) {
    const content = fs.readFileSync(userFile, 'utf8');
    // console.log("Reading File: ", userFile, content);
    return JSON.parse(content);
}

function writeFile(directory, fileName, content) {
    const filePath = path.resolve(directory, fileName);
    // console.log("Writing Directory: ", userPath)
    fs.mkdirSync(directory, { recursive: true });
    // console.log("Writing File: ", userFile)
    fs.writeFileSync(filePath, content);
    return filePath;
}

/** Test **/



setTimeout(async () => {
    const serverUser = new ServerUser('test@email.com');
        try {
            await serverUser.register('test', 'test')
        } catch (e) {}
        // await serverUser.login('test')
        await serverUser.unregister('test', 'test')
    },
    100
);

