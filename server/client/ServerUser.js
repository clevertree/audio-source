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
    }
    getPrivateUsersDirectory() { return path.resolve(serverConfig.privateDirectory, DIRECTORY_USERS_PRIVATE); }
    getPrivateUserDirectory() {
        const [emailUser,domain] = this.email.split('@');
        return path.resolve(this.getPrivateUsersDirectory(), domain, emailUser);
    }
    loadPrivateUserJSON() {
        const userFile = path.resolve(this.getPrivateUserDirectory(), FILE_USER);
        const content = fs.readFileSync(userFile, 'utf8');
        return JSON.parse(content);
    }

    async isRegistered() {
        const userFile = path.resolve(this.getPrivateUserDirectory(), FILE_USER);
        return fs.existsSync(userFile);
    }

    /** Actions **/

    async register(password=null, username=null) {
        if(await this.isRegistered())
            throw new Error("User is already registered: " + this.email);

        if(!username)
            username = this.email.split('@')[0];
        const userPath = this.getPrivateUserDirectory();
        const userFile = path.resolve(this.getPrivateUserDirectory(), FILE_USER);
        const userJSON = {
            username,
        };
        if(password) {
            userJSON.password = await ServerUser.hash(password);
        }

        console.log("Registering User:", this.email, userFile);
        fs.mkdirSync(userPath, { recursive: true });
        fs.writeFileSync(userFile, JSON.stringify(userJSON))

    }

    async unregister() {
        if(!await this.isRegistered())
            throw new Error("User is not registered: " + this.email);

        const userPath = this.getPrivateUserDirectory();
        console.log("Unregistering User:", this.email);
        rimraf(userPath);
    }

    async login(password=null) {
        if(!await this.isRegistered())
            throw new Error("User is not registered: " + this.email);

        const userJSON = this.loadPrivateUserJSON();
        if(!userJSON.password)
            throw new Error("This account has no password. Email login is required");

        if(!await ServerUser.compare(password, userJSON.password))
            throw new Error("Invalid password");
        console.log("Login Successful:", this.email);
    }

    /** Static **/

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


/** Test **/



setTimeout(async () => {
    const serverUser = new ServerUser('test@email.com');
        try {
            await serverUser.register('test', 'test')
        } catch (e) {}
        await serverUser.login('test')
        await serverUser.unregister('test', 'test')
    },
    100
);

