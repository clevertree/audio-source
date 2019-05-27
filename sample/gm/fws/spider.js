var http = require("http");
var https = require("https");
// var url = require("url");
const { JSDOM } = require('jsdom');
const exclude = ['png', 'bmp', 'gif', 'wav', 'zip', 'h2drumkit'];
const fs = require('fs');

const SOURCE_URL = 'https://freewavesamples.com';
const WAVE_FILE_LIST = './s/.list.json';
const SAMPLE_FOLDER = './s/';
const LIBRARY_FILE = 'fws.library.json';
const LIBRARY_JSON = {
    "title": "FreeWaveSamples.com",
    "urlPrefix": "s/",
    "instruments": {},
    "samples": {},
};

(async () => {
    const libraryJSON = Object.assign({}, LIBRARY_JSON, {
        "instruments": {},
        "samples": {}
    });

    let waveURLs = null;
    if(await fileExists(WAVE_FILE_LIST)) {
        const fileData = await readFile(WAVE_FILE_LIST);
        waveURLs = JSON.parse(fileData);
    }

    if(!waveURLs) {
        const urls = await search(SOURCE_URL);
        waveURLs = urls.filter(url => url.toLowerCase().endsWith('.wav'));
        waveURLs.sort();
        await writeToFile(WAVE_FILE_LIST, JSON.stringify(waveURLs));
        // console.log("Search complete: ", waveURLs);
    }

    for(let i=0; i<waveURLs.length; i++) {
        const waveURL = new URL(waveURLs[i]);
        let fileName = waveURL.pathname.split('/').pop();
        fileName = parseSampleConfig(fileName, libraryJSON.samples, libraryJSON.instruments);
        await downloadFile(waveURL, fileName);
    }

    console.log("Writing ", LIBRARY_FILE);
    await writeToFile(LIBRARY_FILE, JSON.stringify(libraryJSON, null, "\t"));
})();

const drumSampleNames = ['kick', 'tom', 'snare', 'drum', 'clap', 'hat', 'cowbell', 'crash', 'cymbal', 'bell', 'stick', 'doumbek'];
const loopableSampleNames = ['loop'];

function parseSampleConfig(fileName, sampleList, instrumentList) {
    fileName = fileName.replace(/\.(wav)$/, '');
    let instrumentName = fileName;
    const sampleConfig = {};

    // Find root key:
    let rootKey = fileName.split(/[^a-z0-9#]+/gi).pop();
    if(rootKey && rootKey.match(/^[a-f][0-6]$/i)) {
        sampleConfig.keyRoot = rootKey.toUpperCase();
        instrumentName = fileName.substr(0, fileName.length - rootKey.length)
            .replace(/\W+$/, '');
    }

    drumSampleNames.forEach((sampleName) => {
        if(fileName.toLowerCase().indexOf(sampleName) !== -1)
            sampleConfig.loop = false;
    });

    loopableSampleNames.forEach((sampleName) => {
        if(fileName.toLowerCase().indexOf(sampleName) !== -1)
            sampleConfig.loop = true;
    });

    if(!instrumentList[instrumentName])
        instrumentList[instrumentName] = {};
    const instrumentConfig = instrumentList[instrumentName];
    instrumentConfig[fileName] = {};
    sampleList[fileName] = sampleConfig;
    return fileName;
}

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


async function search(startURL, options) {
    startURL = new URL(startURL);
    if(typeof options === "function")
        options = {callback: options};
    options = Object.assign({
        depth: 999
    }, options || {});

    const urls = [startURL+''];
    await recurse(startURL, options.depth);
    return urls;

    async function recurse(sourceURL, depth) {
        const ext = sourceURL.pathname.split('/').pop().split('.').pop().toLowerCase();
        if(exclude.indexOf(ext) !== -1) {
            // console.info("Skipping ", sourceURL+'');
            return;
        }
        console.info("Scanning ", sourceURL+'');
        const document = await tryGetDOM(sourceURL);
        const links = document.querySelectorAll('a');
        for(let i=0; i<links.length; i++) {
            const link = links[i];
            const linkUrl = new URL(link.href, sourceURL);
            if(sourceURL.host !== linkUrl.host)
                continue;

            if(urls.indexOf(linkUrl + '') === -1) {
                urls.push(linkUrl + '');
                // console.log(linkUrl + '');
                if(depth > 0)
                    await recurse(linkUrl, depth-1);
            }
        }

        // for(let i=0; i<promises.length; i++)
        //     await promises[i];

    }

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

async function getDOM(options) {
    for(let attempts=0; attempts<3; attempts++)
        try {
            const html = await get(options);
            var dom = new JSDOM(html);
            return dom.window.document;
        } catch (e) {
            console.error(e);
        }
}

async function tryGetDOM(options, attempts=3) {
    while(--attempts>0)
        try {
            const document = await getDOM(options);
            if(!document.querySelectorAll)
                throw new Error("Invalid DOM");
            return document;
        } catch (e) {
            console.error(e.message || e);
            await new Promise((resolve, reject) => {
                setTimeout(() => resolve(), 10000);
            });
            console.info("Retrying: ", options, attempts);
        }
    throw new Error("Giving up on " + options);
}

