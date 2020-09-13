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
        this.private = null;
    }

    readPrivateData() {
        if(this.private)
            return this.private;
        return this.private = this.readPrivateFile(FILE_USER);
    }

    getUsername() {
        const {username} = this.readPrivateData();
        if(!username)
            throw new Error("User has no username.");
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

        for(const user of ServerUser.eachUser()) {
            const {username:existingUsername} = user.readPrivateFile(FILE_USER);
            if(username === existingUsername)
                throw new Error("Username already exists: " + username);
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


    static getPublicUsersDirectory()   { return path.resolve(serverConfig.publicDirectory, DIRECTORY_USERS_PUBLIC); }
    static getPublicUsersURL()         { return path.resolve(serverConfig.publicURL, DIRECTORY_USERS_PUBLIC); }

    getPublicUserDirectory()    { return path.resolve(ServerUser.getPublicUsersDirectory(), this.getUsername()); }
    getPublicUserURL()          { return path.resolve(ServerUser.getPublicUsersURL(), this.getUsername()); }

    static getPrivateUsersDirectory() { return path.resolve(serverConfig.privateDirectory, DIRECTORY_USERS_PRIVATE); }
    getPrivateUserDirectory() {
        const [emailUser,domain] = this.email.split('@');
        return path.resolve(ServerUser.getPrivateUsersDirectory(), domain, emailUser);
    }

    getPublicFileURL(fileName) { return path.resolve(this.getPublicUserURL(), fileName); }

    getPublicFilePath(fileName) { return path.resolve(this.getPublicUserDirectory(), fileName); }
    getPrivateFilePath(fileName) { return path.resolve(this.getPrivateUserDirectory(), fileName); }

    publicFileExists(fileName) { return fs.existsSync(this.getPublicFilePath(fileName)); }
    privateFileExists(fileName) { return fs.existsSync(this.getPrivateFilePath(fileName)); }

    readPublicFile(fileName) { return readFile(this.getPublicFilePath(fileName)); }
    readPrivateFile(fileName) { return readFile(this.getPrivateFilePath(fileName)); }

    writePublicFile(fileName, content) { return writeFile(this.getPublicUserDirectory() + '/' + fileName, content); }
    writePrivateFile(fileName, content) { return writeFile(this.getPrivateUserDirectory() + '/' + fileName, content); }



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

    static * eachUser() {
        const privateUsersDirectory = this.getPrivateUsersDirectory();
        const domains = fs.readdirSync(privateUsersDirectory);
        for(const domain of domains) {
            if(domain) {
                const privateUserDomainDirectory = path.resolve(privateUsersDirectory, domain);
                const users = fs.readdirSync(privateUserDomainDirectory);
                for(const user of users) {
                    yield new ServerUser(user + '@' + domain);
                }
            }
        }
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

function writeFile(filePath, content) {
    const directory = path.resolve(filePath, '..');
    // console.log("Writing Directory: ", directory)
    fs.mkdirSync(directory, { recursive: true });
    // console.log("Writing File: ", filePath)
    fs.writeFileSync(filePath, content);
    return filePath;
}

/** Test **/
setTimeout(async () => {
        const serverUser = new ServerUser('test@email.com');
        // const serverUser2 = new ServerUser('test2@email.com');
        try { await serverUser.register('test', 'test') }
        catch (e) { console.error(e); }
        try { await serverUser.unregister() }
        catch (e) { console.error(e); }

        // try { await serverUser2.register('test', 'test') }
        // catch (e) { console.error(e); }
        // try { await serverUser2.unregister() }
        // catch (e) { console.error(e); }
        // await serverUser.login('test')
    },
    100
);

