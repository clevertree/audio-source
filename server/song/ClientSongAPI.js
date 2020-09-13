

const {
    port: defaultPort,
} = require('../.server.json');

const serverBaseURL = document.location.protocol
    + '//' + document.location.hostname + ':' + defaultPort;


// console.log('serverBaseURL', serverBaseURL);

export default class ClientSongAPI {


    async publish(songData) {
        console.log("Publishing Song: ", songData);
        const response = await postJSON(serverBaseURL + '/publish', songData)
        // const response = await postJSON(serverBaseURL + '/publish', songData)
        if(response.status !== 200)
            throw new Error(response.statusText)

        const json = await response.json();
        console.log("Publish Response: ", json, response);
        return json;
    }

}


// async function getJSON(url) {
//     return await fetch(url, {
//         credentials: 'include',
//         method: 'GET',
//         redirect: 'error'
//     });
// }
async function postJSON(url, jsonObject) {
    // console.log('POST', url, jsonObject);
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
