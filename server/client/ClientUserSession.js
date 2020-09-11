

const {
    port: defaultPort,
} = require('../.server.json');

const serverBaseURL = document.location.protocol
    + '//' + document.location.hostname + ':' + defaultPort;


// console.log('serverBaseURL', serverBaseURL);

export default class ClientUserSession {

    static async postJSON(url, jsonObject) {
        return await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(jsonObject)
        });
    }

    static async login(email, password) {
        console.log("Submitting Login: ", email);
        const response = await this.postJSON(serverBaseURL + '/login', {
            email,
            password
        })
        const json = await response.json();
        if(response.status !== 200)
            throw new Error(response.statusText)

        console.log("Login Response: ", json, response);
        return json;
    }

    static async register(email, password, username=null) {
        console.log("Submitting Registration: ", email);
        const response = await this.postJSON(serverBaseURL + '/register', {
            username,
            email,
            password
        })
        const json = await response.json();
        if(response.status !== 200)
            throw new Error(response.statusText)

        console.log("Registration Response: ", json, response);
        return json;
    }
}
