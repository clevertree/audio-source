const fetch = require("node-fetch");
const fs = require('fs');
const path = require('path');

class SampleSpider {
    constructor(libraryPath, sampleFolder='', libraryData={}) {
        this.libraryPath = libraryPath;
        this.data = Object.assign({}, {
            name: libraryPath.split('/').pop(),
            urlSamples: sampleFolder,
            presets: [],
            samples: []
        }, libraryData);
        if(fs.existsSync(libraryPath))
            Object.assign(this.data, JSON.parse(fs.readFileSync(libraryPath)));

        this.drumPresetPrefixes = {};
        console.log(this.data);
    }

    async addSample(sampleURL, sampleConfig={}) {
        const sampleName = sampleURL.split('/').pop();
        sampleConfig.url = sampleName;
        // if(!sampleConfig.name) sampleConfig.name = sampleName;
        const samplePath = path.resolve(this.data.urlSamples, sampleName);
        if(fs.existsSync(samplePath)) {
            console.log("Skipping download: ", sampleURL);

        } else {
            console.log("Downloading: ", sampleURL);
            const response = await fetch(sampleURL);
            const sampleData = await response.arrayBuffer();
            console.log("Writing: ", samplePath);
            fs.writeFileSync(samplePath, sampleData);
        }


        const sampleIndex = this.data.samples.findIndex(s => s.url === sampleConfig.url);
        if(sampleIndex === -1) {
            console.log("Adding samples to library: ", sampleName);
            this.data.samples.push(sampleConfig)
        } else {
            console.log("Updating existing samples: ", sampleName);
            this.data.samples[sampleIndex] = sampleConfig;
        }

        this.parseSampleConfig(sampleConfig, sampleName);
    }

    combineDrumKits() {

        const drumPresetPrefixes = this.drumPresetPrefixes;
        for(let drumPresetPrefix in drumPresetPrefixes) {
            if(drumPresetPrefixes.hasOwnProperty(drumPresetPrefix)) {
                if(!drumPresetPrefix)
                    continue;

                const sampleNames = drumPresetPrefixes[drumPresetPrefix].samples;
                // const singleDrumInstruments = drumPresetPrefixes[drumPresetPrefix].programs;
                for(let j=0; j<sampleNames.length; j++) {
                    const sampleName = sampleNames[j];
                    const presetIndex = this.data.presets.findIndex(p => p.name === drumPresetPrefix);
                    let presetConfig = {name: drumPresetPrefix};
                    if(presetIndex === -1) {
                        console.log("Adding drum kit preset to library: ", drumPresetPrefix);
                        this.data.presets.push(presetConfig)
                    } else {
                        presetConfig = this.data.presets[presetIndex];
                    }
                    if(!presetConfig.samples)
                        presetConfig.samples = [];
                    if(presetConfig.samples.indexOf(sampleName) === -1)
                        presetConfig.samples.push(sampleName)


                    // if(!this.data.presets[drumPresetPrefix])
                    //     this.data.presets[drumPresetPrefix] = {samples:{}};
                    // const drumInstrument = this.data.presets[drumPresetPrefix];
                    // drumInstrument.samples[sampleName] = {};
                }

                // for(let j=0; j<singleDrumInstruments.length; j++) {
                //     const singleDrumInstrumentName = singleDrumInstruments[j];
                //     delete libraryJSON.programs[singleDrumInstrumentName];
                //
                // }
            }
        }

    }

    writeLibrary() {
        console.log("Writing ", this.libraryPath);
        let stringData = JSON.stringify(this.data, null, "\t");
        stringData = stringData.replace(/[{]\n\t+"/g, '{\t"');
        fs.writeFileSync(this.libraryPath, stringData);
    }

    parseSampleConfig(sampleConfig, sampleName) {
        let presetName = path.parse(sampleName).name;

        // Find root key:
        let rootKey = presetName.split(/[^a-z0-9#]+/gi).pop();
        if(rootKey && rootKey.match(/^[a-f][0-6]$/i)) {
            sampleConfig.root = rootKey.toUpperCase();
            presetName = presetName.substr(0, presetName.length - rootKey.length)
                .replace(/\W+$/, '');
        }

        presetName = this.parseDrumSampleConfig(sampleConfig, sampleName, presetName);
        this.parseLoopSampleConfig(sampleConfig, sampleName);
        // Object.assign(sampleConfig, {url: sampleName}, sampleConfig);
        this.parsePresetConfig(presetName, sampleConfig);


        // if(!this.data.presets[presetName])
        //     instrumentList[presetName] = {};
        // const instrumentConfig = instrumentList[presetName];
        // if(!instrumentConfig.samples)
        //     instrumentConfig.samples = {};
        // instrumentConfig.samples[sampleName] = {};
        // sampleList[sampleName] = sampleConfig;
        //
        // parseInstrumentConfig(presetName, sampleList, instrumentList);
        // return sampleName;
        return sampleConfig;
    }


    parsePresetConfig(presetName, sampleConfig) {
        const presetIndex = this.data.presets.findIndex(p => p.name === presetName);
        let presetConfig = {name: presetName};
        if(presetIndex === -1) {
            console.log("Adding preset to library: ", presetName);
            this.data.presets.push(presetConfig)
        } else {
            presetConfig = this.data.presets[presetIndex];
        }
        if(!presetConfig.samples) presetConfig.samples = [];
        if(presetConfig.samples.indexOf(sampleConfig.url) === -1)
            presetConfig.samples.push(sampleConfig.url);
        const sampleList = presetConfig.samples;

        // Skip if there is only one samples.
        if(sampleList.length === 1)
            return;

        // Check for drum samples
        for(let i=0; i<sampleList.length; i++) {
            const sampleConfig = this.data.samples.find(s => s.url === sampleList[i]);
            if(typeof sampleConfig.alias !== "undefined")
                return;
        }




        // if(!instrumentConfig.samples)
        //     throw new Error("Invalid program samples");
        // const instrumentSamples = instrumentConfig.samples;
        // const sampleValues = Object.values(instrumentSamples);

        if(!presetName.endsWith('Kit')) {
            // Span out the key zones
            const keyNumberSamples = [];
            for(let i=0; i<sampleList.length; i++) {
                const sampleConfig = this.data.samples.find(s => s.url === sampleList[i]);

                // const combinedSampleConfig = Object.assign({}, instrumentSamples[sampleName], sampleList[sampleName]);
                if (!sampleConfig.root)
                    throw new Error("Multi samples program requires keyRoot");
                const keyNumber = this.getNoteKeyNumber(sampleConfig.root);
                keyNumberSamples.push({keyNumber, sampleConfig});
            }
            let currentSample = 0, currentRange = [0,0];
            for (let i=0; i<12*12; i++) {
                const {keyNumber, sampleConfig} = keyNumberSamples[currentSample];
                currentRange[1] = i;
                sampleConfig.range = this.getNoteByKeyNumber(currentRange[0]) + ':' + this.getNoteByKeyNumber(currentRange[1]);
// TODO: move key range config to preset
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

    parseLoopSampleConfig(sampleConfig, fileName) {
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

    parseDrumSampleConfig(sampleConfig, sampleName, presetName) {

        const drumSampleNotes = this.drumSampleNotes;
        for(let drumSampleName in drumSampleNotes) {
            if(drumSampleNotes.hasOwnProperty(drumSampleName)) {
                let pos = sampleName.toLowerCase().indexOf(drumSampleName);
                if(pos !== -1) {
                    sampleConfig.loop = false;
                    sampleConfig.alias = drumSampleNotes[drumSampleName];
                    presetName = (presetName.substr(0, pos)
                        .replace(/\W$/, '') || 'Generic');
                    const matchNumbered = sampleName.match(/-\d+$/);
                    if(matchNumbered) {
                        presetName += matchNumbered[0];
                    }
                    presetName += '-Kit';
                    if(!this.drumPresetPrefixes[presetName])
                        this.drumPresetPrefixes[presetName] = {samples:[],presets:[]};
                    this.drumPresetPrefixes[presetName].samples.push(sampleName);
                    // drumPresetPrefixes[drumPresetPrefix].presets.push(presetName);
                    break;
                }
            }
        }
        return presetName;
    }

    getNoteKeyNumber (namedFrequency) {
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

    getNoteByKeyNumber(keyNumber) {
        keyNumber = parseInt(keyNumber);
        const freqs = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(keyNumber / 12) - 2;
        const freq = freqs[keyNumber % 12];
        return freq + octave;
    }


    get drumSampleNotes() {
        return {
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
    }
}


module.exports = SampleSpider;
