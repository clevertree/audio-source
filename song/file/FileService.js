import WebTorrent from "webtorrent";

// const archiveBuffers = {};
const torrentCache = {};
const trackerURLS = [
    "udp://explodie.org:6969",
    "udp://track.coppersurfer.tk:6969",
    "udp://track.empire-js.us:1337",
    "udp://track.leechers-paradise.org:6969",
    "udp://track.opentrackr.org:1337",
    // "wss://snesology.net/wss",
    // "ws://192.168.0.200:8000",
    // "ws://localhost:8000",
    "wss://tracker.fastcast.nz",
    "wss://tracker.openwebtorrent.com",
    "wss://tracker.btorrent.xyz",
];

class FileService {
    // constructor(song) {
    //     this.song = song;
    // }

    log(...args) {
        console.info(...args);
        // if(this.song) {
        //     this.song.dispatchEvent(new CustomEvent('log', {detail: message}))
        // }
    }

    async loadBufferFromURL(url) {
        // this.log("Loading buffer from url: " + url);
        if(url.toString().startsWith('torrent://')) {
            console.time('getFileBufferFromTorrent');
            const buffer = await this.getFileBufferFromTorrent(url);
            console.timeEnd('getFileBufferFromTorrent');
            return buffer;
        }

        const response = await fetch(url);
        return await response.arrayBuffer();
    }

    getMagnetURL(torrentID) {
        // &dn=snes
        let magnetURL = `magnet:?xt=urn:btih:${torrentID}&dn=torrent&${trackerURLS.map(t => 'tr='+t).join('&')}`;
        // magnetURL = 'magnet:?xt=urn:btih:13d7d0f8eb6f1b8a2e2dcd1513f999ec7b138023&dn=s&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com';
        console.log('magnetURL', magnetURL);
        return magnetURL;
    }

    async getFileBufferFromTorrent(torrentURL) {
        var match = torrentURL.match(/^(torrent?:)\/\/(([^:/?#]*)(?::([0-9]+))?)([/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
        const parsedURL = match && {
            hostname: match[3],
            pathname: match[5],
        };

        const torrentID = parsedURL.hostname;
        const torrent = await this.getTorrent(torrentID);

        const filePath = torrent.name + '/' + parsedURL.pathname.substr(1);

        for(let i=0; i<torrent.files.length; i++) {
            const file = torrent.files[i];
            if(filePath === file.path) {
                return await new Promise((resolve, reject) => {
                    file.getBuffer(async function(err, buffer) {
                        if(err) throw new Error(err);
                        resolve(buffer);
                    });
                })
            }
            // if(filePath.startsWith(file.path)) {
            //     const archiveFilePath = filePath.substr(file.path.length);
            //     let archiveBuffer;
            //     if(typeof archiveBuffers[file.path] !== "undefined") {
            //         archiveBuffer = archiveBuffers[file.path];
            //     } else {
            //         archiveBuffer = getBuffer(file);
            //         archiveBuffers[file.path] = archiveBuffer;a
            //     }
            //     if(archiveBuffer instanceof Promise)
            //         archiveBuffer = await archiveBuffer;
            //     return await this.getFileBufferFromArchive(archiveBuffer, archiveFilePath);
            // }
        }
        throw new Error("Archive file not found: " + filePath);
    }

    async getFileBufferFromArchive(archiveBuffer, filePath) {
        const files = await this.decompress7ZipArchive(archiveBuffer);
        for(let i=0; i<files.length; i++) {
            const file = files[i];
            if(file.path === filePath) {
                return file.data;
            }
        }
        throw new Error("Archive file not found: " + filePath);

    }

    async getTorrent(torrentID) {
        // var WebTorrent = await requireWebTorrent();

        if(torrentCache[torrentID]) {
            if(torrentCache[torrentID] instanceof Promise)
                await torrentCache[torrentID];
            return torrentCache[torrentID];
        }

        const magnetURL = this.getMagnetURL(torrentID);

        var client = new WebTorrent();

        torrentCache[torrentID] = new Promise((resolve, reject) => {
            this.log("Connecting to cloud url: " + magnetURL);
            client.add(magnetURL, (torrent) => {
                // torrent._selections = [];

                // Remove default selection (whole torrent)
                torrent.deselect(0, torrent.pieces.length - 1, false)

                // Add selections (individual files)
                // for (let i = 0; i < torrent.files.length; i++) {
                //     const file = torrent.files[i]
                //         // console.log('deselecting file ' + i + ' of torrent ' + torrent.name)
                //         file.deselect()
                // }

                this.log("Connected to cloud: " + torrent.infoHash, torrent);
                // Got torrent metadata!
                resolve(torrent);
            });
        });
        torrentCache[torrentID] = await torrentCache[torrentID];
        return torrentCache[torrentID];
    }

    async decompress7ZipArchive(archiveBuffer) {
        const fda = [];
        var totalMemory = 268435456;
        var INTERRUPT = false;
        var rootdata = "/data";
        var fileName=  'archive.7z';
        fda.push(new DataStorage(rootdata,true,null));
        const filedata = new Uint8Array(archiveBuffer);
        fda.push(new DataStorage(rootdata  + "/" + fileName,false,filedata));

        const workerURL =  'assets/3rdparty/7zip/js/worker.7z.wrapper.js';

        let worker7z = new Worker(workerURL);

        return await new Promise((resolve, reject) => {
            worker7z.onerror = console.error; // TODO: reuse webworker
            worker7z.onmessage = function(event) {//1
                if (INTERRUPT) {
                    finfunc();
                    return;
                }
                if (event.data.type === 1){
                    // console.info(event.data.text);
                } else if (event.data.type === 2){
                    // console.info(event.data.text);
                } else if (event.data.type === 3){
                    resolve(event.data.results);
                    worker7z.terminate();//this is very important!!! You have to release memory!
                }
            };
            var fda0 = [fda[0],fda[1]];
            var args = ["x",  fda0[1].path ,"-o/result"];
            worker7z.postMessage({
                id:1,
                action:'doit',
                arguments:args,
                totalMemory: totalMemory,
                FilesDataArray: fda0
            });

            function finfunc() {
                worker7z.terminate();
                worker7z = undefined;
                INTERRUPT = false;
                // clearDataWrapper();
            }
        });

        function DataStorage(path,isdir,data) {
            this.path = path;
            this.isdir = isdir;
            this.data = data;
        }
    }
}


export default FileService;
