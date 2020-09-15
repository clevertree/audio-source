const {
    publicURL
} = require('../../../config.json');
const serverBaseURL = publicURL || document.location.origin;



// console.log('serverBaseURL', serverBaseURL);

export default class ClientSongAPI {


    async isPublished(uuid) {
        console.log("Is Published: ", uuid);
        const response = await getJSON(serverBaseURL + '/isPublished/' + uuid)
        if(response.status !== 200)
            throw new Error(response.statusText)

        const json = await response.json();
        console.log("Publish Response: ", json, response);
        return json;

    }

    async publish(songData, filename) {
        console.log("Publishing Song: ", songData);
        const response = await postJSON(serverBaseURL + '/publish', {
            song: songData,
            filename
        })
        if(response.status !== 200)
            throw new Error(response.statusText)

        const json = await response.json();
        console.log("Publish Response: ", json, response);
        return json;
    }

}


async function getJSON(url) {
    return await fetch(url, {
        credentials: 'include',
    });
}
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
    }).then();
}
