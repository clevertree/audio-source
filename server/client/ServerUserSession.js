import ServerUser from "./ServerUser";


export default class ServerUserSession {

    constructor(session) {
        this.session = session;
    }

    login(email, password) {
        console.log('Logging in', email, password);
    }

    async register(email, password) {
        const serverUser = new ServerUser(email);
        if(await serverUser.isRegistered())
            throw new Error("User is already registered: " + email);
        console.log('Registering', email, password);
        // Folder based on username  /ari.asulin/  or username?
        // Cant list usernames without index?
    }

}
