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
    "name": "FreeWaveSamples.com",
    "urlPrefix": "s/",
    "instruments": {},
    "samples": {},
};

let drumInstrumentPrefixes = {};
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

    drumInstrumentPrefixes = {};
    for(let i=0; i<waveURLs.length; i++) {
        const waveURL = new URL(waveURLs[i]);
        let fileName = waveURL.pathname.split('/').pop();
        fileName = parseSampleConfig(fileName, libraryJSON.samples, libraryJSON.instruments);
        await downloadFile(waveURL, fileName);
    }


    for(let drumInstrumentPrefix in drumInstrumentPrefixes) {
        if(drumInstrumentPrefixes.hasOwnProperty(drumInstrumentPrefix)) {
            if(!drumInstrumentPrefix)
                continue;

            const sampleNames = drumInstrumentPrefixes[drumInstrumentPrefix].samples;
            // const singleDrumInstruments = drumInstrumentPrefixes[drumInstrumentPrefix].programs;
            for(let j=0; j<sampleNames.length; j++) {
                const sampleName = sampleNames[j];
                if(!libraryJSON.instruments[drumInstrumentPrefix])
                    libraryJSON.instruments[drumInstrumentPrefix] = {samples:{}};
                const drumInstrument = libraryJSON.instruments[drumInstrumentPrefix];
                drumInstrument.samples[sampleName] = {};
            }

            // for(let j=0; j<singleDrumInstruments.length; j++) {
            //     const singleDrumInstrumentName = singleDrumInstruments[j];
            //     delete libraryJSON.programs[singleDrumInstrumentName];
            //
            // }
        }
    }

    console.log("Writing ", LIBRARY_FILE);
    await writeToFile(LIBRARY_FILE, JSON.stringify(libraryJSON, null, "\t"));
})();



function parseSampleConfig(fileName, sampleList, instrumentList) {
    fileName = fileName.replace(/\.(wav)$/, '');
    let instrumentName = fileName;
    const sampleConfig = {};

    // Find root key:
    let rootKey = fileName.split(/[^a-z0-9#]+/gi).pop();
    if(rootKey && rootKey.match(/^[a-f][0-6]$/i)) {
        sampleConfig.root = rootKey.toUpperCase();
        instrumentName = fileName.substr(0, fileName.length - rootKey.length)
            .replace(/\W+$/, '');
    }

    instrumentName = parseDrumSampleConfig(fileName, sampleConfig, instrumentName);
    parseLoopSampleConfig(fileName, sampleConfig);


    if(!instrumentList[instrumentName])
        instrumentList[instrumentName] = {};
    const instrumentConfig = instrumentList[instrumentName];
    if(!instrumentConfig.samples)
        instrumentConfig.samples = {};
    instrumentConfig.samples[fileName] = {};
    sampleList[fileName] = sampleConfig;

    parseInstrumentConfig(instrumentName, sampleList, instrumentList);
    return fileName;
}

function parseDrumSampleConfig(fileName, sampleConfig, instrumentName) {
    const drumSampleNotes = {
        'rap-kick': 'C3',
        'kick': 'C3',
        'low-mid-synth-tom': 'A2',
        'hi-mid-synth-tom': 'A2',
        'hi-synth-tom': 'A2',
        'mid-synth-tom': 'A2',
        'low-synth-tom': 'A2',
        'synth-tom': 'A2',
        'tom': 'A2',
        'snare': 'D3',
        'steel-drum': 'D3',
        'drum': 'D3',
        'clap': 'E3',
        'closed-hi-hat': 'G#2',
        'closed-hi': 'G#2',
        'open-hi-hat': 'G#2',
        'open-hi': 'G#2',
        'open': 'A#2',
        'hat': 'G#2',
        'cow': 'D#3',
        'cowbell': 'D#3',
        'splash-cymbal': 'C#3',
        'crash-cymbal': 'C#3',
        'ride-cymbal': 'D3',
        'cymbal': 'C#3',
        'crash': 'C#3',
        // 'bell': 'F3',
        'stick': 'D3',
        'ride': 'D3',
        'doumbek': 'A2'
    };
    for(let drumSampleName in drumSampleNotes) {
        if(drumSampleNotes.hasOwnProperty(drumSampleName)) {
            let pos = fileName.toLowerCase().indexOf(drumSampleName);
            if(pos !== -1) {
                sampleConfig.loop = false;
                sampleConfig.alias = drumSampleNotes[drumSampleName];
                instrumentName = (instrumentName.substr(0, pos)
                    .replace(/\W$/, '') || 'Generic');
                const matchNumbered = fileName.match(/-\d+$/);
                if(matchNumbered) {
                    instrumentName += matchNumbered[0];
                }
                instrumentName += '-Kit';
                if(!drumInstrumentPrefixes[instrumentName])
                    drumInstrumentPrefixes[instrumentName] = {samples:[],instruments:[]};
                drumInstrumentPrefixes[instrumentName].samples.push(fileName);
                // drumInstrumentPrefixes[drumInstrumentPrefix].programs.push(instrumentName);
                break;
            }
        }
    }
    return instrumentName;
}

function parseLoopSampleConfig(fileName, sampleConfig) {
    const loopSampleNames = [
        'loop',
    ];
    for(let i=0; i<loopSampleNames.length; i++) {
        const loopSampleName = loopSampleNames[i];
        if(fileName.toLowerCase().indexOf(loopSampleName) !== -1) {
            sampleConfig.loop = true;
        }
    }
}

function parseInstrumentConfig(instrumentName, sampleList, instrumentList) {
    const instrumentConfig = instrumentList[instrumentName];

    if(!instrumentConfig.samples)
        throw new Error("Invalid program samples");
    const instrumentSamples = instrumentConfig.samples;
    const sampleValues = Object.values(instrumentSamples);
    if(sampleValues.length === 1)
        return;
    // Check for drum samples
    if(sampleValues.every(sampleEntry => typeof sampleEntry.alias !== 'undefined'))
        return;

    if(!instrumentName.endsWith('Kit')) {
        // Span out the key zones
        const keyNumberSamples = [];
        for (let sampleName in instrumentSamples) {
            if (instrumentSamples.hasOwnProperty(sampleName)) {
                const combinedSampleConfig = Object.assign({}, instrumentSamples[sampleName], sampleList[sampleName]);
                if (!combinedSampleConfig.root)
                    throw new Error("Multi samples program requires keyRoot");
                const keyNumber = getNoteKeyNumber(combinedSampleConfig.root);
                keyNumberSamples.push({keyNumber, sampleConfig: instrumentSamples[sampleName]});
            }
        }
        let currentSample = 0, currentRange = [0,0];
        for (let i=0; i<12*12; i++) {
            const {keyNumber, sampleConfig} = keyNumberSamples[currentSample];
            currentRange[1] = i;
            sampleConfig.range = getNoteByKeyNumber(currentRange[0]) + ':' + getNoteByKeyNumber(currentRange[1]);

            if(!keyNumberSamples[currentSample+1])
                continue;
            const nextKeyNumber = keyNumberSamples[currentSample+1].keyNumber;
            if(i > (keyNumber + nextKeyNumber) / 2) {
                currentSample++;
                currentRange = [i+1, i+1];
            }
        }
    }
}

function getNoteKeyNumber (namedFrequency) {
    if(Number(namedFrequency) === namedFrequency && namedFrequency % 1 !== 0)
        return namedFrequency;
    if(!namedFrequency)
        return null;
    let octave = parseInt(namedFrequency.replace(/\D/g,''));
    let freq = namedFrequency.replace(/\d/g,'').toUpperCase();
    const freqs = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let keyNumber = freqs.indexOf(freq);
    if(keyNumber === -1)
        throw new Error("Invalid note: " + namedFrequency);
    if (keyNumber < 3)  keyNumber = keyNumber + 12 + ((octave + 1) * 12);
    else                keyNumber = keyNumber + ((octave + 1) * 12);
    return keyNumber;
}

function getNoteByKeyNumber(keyNumber) {
    keyNumber = parseInt(keyNumber);
    const freqs = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(keyNumber / 12) - 2;
    const freq = freqs[keyNumber % 12];
    return freq + octave;
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

