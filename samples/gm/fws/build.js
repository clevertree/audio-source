const SampleSpider = require("../../SampleSpider");
const exclude = ['png', 'bmp', 'gif', 'wav', 'zip', 'h2drumkit'];
const fs = require('fs');

const SOURCE_URL = 'https://freewavesamples.com';
const WAVE_FILE_LIST = './s/.list.json';
const SAMPLE_FOLDER = './s/';
const LIBRARY_FILE = 'fws.library.json';
const LIBRARY_JSON = {
    "name": "FreeWaveSamples.com",
    // "urlPrefix": "s/",
    // "programs": {},
    // "samples": {},
};

const spider = new SampleSpider('fws.library.json', SAMPLE_FOLDER, LIBRARY_JSON);

(async () => {

    let waveURLs = null;
    if(fs.existsSync(WAVE_FILE_LIST)) {
        const fileData = fs.readFileSync(WAVE_FILE_LIST);
        waveURLs = JSON.parse(fileData);
    }

    // if(!waveURLs) {
    //     const urls = await search(SOURCE_URL);
    //     waveURLs = urls.filter(url => url.toLowerCase().endsWith('.wav'));
    //     waveURLs.sort();
    //     await writeToFile(WAVE_FILE_LIST, JSON.stringify(waveURLs));
    //     // console.log("Search complete: ", waveURLs);
    // }

    // drumInstrumentPrefixes = {};
    for(let i=0; i<waveURLs.length; i++) {
        // const waveURL = new URL(waveURLs[i]);
        await spider.addSample(waveURLs[i]);
        spider.writeLibrary();

    }

    spider.combineDrumKits();

    spider.writeLibrary();
})();


