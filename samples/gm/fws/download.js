var http = require("http");
var https = require("https");
// var url = require("url");
const fs = require('fs');

const WAVE_FILE_LIST = './.list.json';
const SAMPLE_FOLDER = '../s/';

(async () => {
    let waveURLs = null;
    if(await fileExists(WAVE_FILE_LIST)) {
        const fileData = await readFile(WAVE_FILE_LIST);
        waveURLs = JSON.parse(fileData);
    }

    let promises = [];
    for(let i=0; i<waveURLs.length; i++) {
        const waveURL = new URL(waveURLs[i]);
        let fileName = waveURL.pathname.split('/').pop();
        promises.push(downloadFile(waveURL, fileName));
        if(promises.length > 25) {
            for(let j=0; j<promises.length; j++) {
                await promises[j];
            }
            promises = [];
        }
    }

})();



async function downloadFile(url, fileName) {
    fileName = SAMPLE_FOLDER + fileName;
    if(await fileExists(fileName)) {
        console.log("Skipping ", url+'');
        return false;
    }
    console.log("Downloading ", url+'');
    const fileContent = await get(url);
    await writeToFile(fileName, fileContent);
    return true;
}





async function fileExists(path) {
    return new Promise((resolve, reject) => {
        fs.access(path, function(err) {
            resolve(!err);
        });
    });
}


async function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, function(err, data) {
            if(err)     reject(err);
            else        resolve(data);
        });
    });
}




async function writeToFile(path, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, function(err) {
            if(err)     reject(err);
            else        resolve();
        });
    });
}


function get(options) {
    const protocol = options.protocol || options;
    let client = http;
    if(protocol.toLowerCase().startsWith('https'))
        client = https;
    return new Promise((resolve, reject) => {
        client.get(options, function (res) {
            // initialize the container for our data
            var data = [];
            res.on("data",  (chunk) => data.push(chunk));
            res.on("end", () => {
                const buffer = Buffer.concat(data);
                // console.log(buffer.toString('base64'));
                resolve(buffer);
            });
            res.on("error", (err) => reject(err));
        }).on("error", (err) => {
            reject(err);
        });
    })
}
