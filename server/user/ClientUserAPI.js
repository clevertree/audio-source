
const {
    port: defaultPort,
} = require('../.server.json');

const serverBaseURL = document.location.protocol
    + '//' + document.location.hostname + ':' + defaultPort;


// console.log('serverBaseURL', serverBaseURL);

export default class ClientUserAPI {
    static userFields = {
        artistTitle: {
            label: "Artist title",
            placeholder: "My Artist Name",
            pattern: "([A-z0-9À-ž _-]){2,}",
            required: true,
        },
        username: {
            label: "User name",
            placeholder: "artist_username",
            pattern: "([A-z0-9À-ž_-]){2,}",
            required: true,
        }
    };

    async login(email, password) {
        console.log("Submitting Login: ", email);
        const response = await postJSON(serverBaseURL + '/login', {
            email,
            password
        })
        const responseJSON = await response.json();
        if(response.status !== 200)
            throw new Error(response.statusText)

        console.log("Login Response: ", responseJSON, response);
        return responseJSON;
    }

    async logout() {
        console.log("Submitting Logout");
        const response = await postJSON(serverBaseURL + '/logout');
        const responseJSON = await response.json();
        if(response.status !== 200)
            throw new Error(response.statusText)

        console.log("Logout Response: ", responseJSON, response);
        return responseJSON;
    }

    async register(email, password, username, artistTitle) {
        console.log("Submitting Registration: ", email);
        const response = await postJSON(serverBaseURL + '/register', {
            email,
            password,
            username,
            artistTitle
        })
        if(response.status !== 200)
            throw new Error(response.statusText)

        const responseJSON = await response.json();
        console.log("Registration Response: ", responseJSON, response);
        return responseJSON;
    }


    /** Static **/

    async getSession() {
        // console.log("Submitting Session Request");
        const response = await getJSON(serverBaseURL + '/session')
        if(response.status !== 200)
            throw new Error(response.statusText)

        const responseJSON = await response.json();
        console.log("Session Response: ", responseJSON, response);
        return responseJSON;
    }

}


async function getJSON(url) {
    return await fetch(url, {
        credentials: 'include',
        method: 'GET',
        redirect: 'error'
    });
}
async function postJSON(url, jsonObject) {
    console.log('POST', url, jsonObject);
    return await fetch(url, {
        credentials: 'include',
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(jsonObject),
        redirect: 'error'
    }).then();
}
