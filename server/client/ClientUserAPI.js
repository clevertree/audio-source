

const {
    port: defaultPort,
} = require('../.server.json');

const serverBaseURL = document.location.protocol
    + '//' + document.location.hostname + ':' + defaultPort;


// console.log('serverBaseURL', serverBaseURL);

export default class ClientUserAPI {
    async login(email, password) {
        console.log("Submitting Login: ", email);
        const response = await postJSON(serverBaseURL + '/login', {
            email,
            password
        })
        const json = await response.json();
        if(response.status !== 200)
            throw new Error(response.statusText)

        console.log("Login Response: ", json, response);
    }

    async register(email, password, username=null) {
        console.log("Submitting Registration: ", email);
        const response = await postJSON(serverBaseURL + '/register', {
            username,
            email,
            password
        })
        if(response.status !== 200)
            throw new Error(response.statusText)

        const json = await response.json();
        console.log("Registration Response: ", json, response);

    }

    async publish(songData) {
        console.log("Publishing Song: ", songData);
        const response = await postJSON(serverBaseURL + '/publish', songData)
        if(response.status !== 200)
            throw new Error(response.statusText)

        const json = await response.json();
        console.log("Publish Response: ", json, response);

    }


    /** Static **/

    async getSession() {
        // console.log("Submitting Session Request");
        const response = await getJSON(serverBaseURL + '/session')
        if(response.status !== 200)
            throw new Error(response.statusText)

        const jsonSession = await response.json();
        console.log("Session Response: ", jsonSession, response);

        return jsonSession;
    }

}


async function getJSON(url) {
    return await fetch(url, {
        credentials: 'include',
        method: 'GET',
    });
}
async function postJSON(url, jsonObject) {
    return await fetch(url, {
        credentials: 'include',
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(jsonObject),
    });
}
