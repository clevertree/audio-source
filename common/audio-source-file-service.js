(function(thisRequire, thisModule, thisScriptPath, isBrowser) {


    const archiveBuffers = {};
    const torrentCache = {};
    const trackerURLS = [
        "udp://explodie.org:6969",
        "udp://tracker.coppersurfer.tk:6969",
        "udp://tracker.empire-js.us:1337",
        "udp://tracker.leechers-paradise.org:6969",
        "udp://tracker.opentrackr.org:1337",
        // "wss://snesology.net/wss",
        "wss://tracker.fastcast.nz",
        "wss://tracker.openwebtorrent.com",
        "wss://tracker.btorrent.xyz",
    ];

    class AudioSourceFileService {
        constructor(song) {
            this.song = song;
        }

        log(message) {
            if(this.song) {
                this.song.dispatchEvent(new CustomEvent('log', {detail: message}))
            }
        }

        async loadBufferFromURL(url) {
            // this.log("Loading buffer from url: " + url);
            if(url.toString().startsWith('torrent://')) {
                console.time('getFileBufferFromTorrent');
                const buffer = await this.getFileBufferFromTorrent(url);
                console.timeEnd('getFileBufferFromTorrent');
                return buffer;
            }
            var request = new XMLHttpRequest();
            await new Promise((resolve, reject) => {
                request.open("GET", url, true);
                request.responseType = "arraybuffer";
                request.send();
                request.onload = resolve;
            });

            return request.response;
        }

        getMagnetURL(torrentID) {
            // &dn=snes
            const magnetURL = `magnet:?xt=urn:btih:${torrentID}&dn=torrent&${trackerURLS.map(t => 'tr='+t).join('&')}`;
            return magnetURL;
        }

        async getFileBufferFromTorrent(torrentURL) {
            var match = torrentURL.match(/^(torrent?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
            const parsedURL = match && {
                hostname: match[3],
                pathname: match[5],
            };

            const torrentID = parsedURL.hostname;
            const filePath = parsedURL.pathname.substr(1);

            const torrent = await this.getTorrent(torrentID);
            for(let i=0; i<torrent.files.length; i++) {
                const file = torrent.files[i];
                if(filePath === file.path) {
                    return await getBuffer(file);
                }
                if(filePath.startsWith(file.path)) {
                    const archiveFilePath = filePath.substr(file.path.length);
                    let archiveBuffer;
                    if(typeof archiveBuffers[file.path] !== "undefined") {
                        archiveBuffer = archiveBuffers[file.path];
                    } else {
                        archiveBuffer = getBuffer(file);
                        archiveBuffers[file.path] = archiveBuffer;
                    }
                    if(archiveBuffer instanceof Promise)
                        archiveBuffer = await archiveBuffer;
                    return await this.getFileBufferFromArchive(archiveBuffer, archiveFilePath);
                }
            }
            throw new Error("Archive file not found: " + filePath);

            async function getBuffer(file) {
                return await new Promise((resolve, reject) => {
                    file.getBuffer(async function(err, buffer) {
                        if(err) throw new Error(err);
                        resolve(buffer);
                    });
                })
            }
        }

        async getFileBufferFromArchive(archiveBuffer, filePath) {
            const files = await this.decompress7ZipArchive(archiveBuffer);
            for(let i=0; i<files.length; i++) {
                const file = files[i];
                if(file.path === filePath) {
                    return file.data;
                    break;
                }
            }
            throw new Error("Archive file not found: " + filePath);

        }

        async getTorrent(torrentID) {
            var WebTorrent = await requireWebTorrent();

            if(torrentCache[torrentID]) {
                if(torrentCache[torrentID] instanceof Promise)
                    await torrentCache[torrentID];
                return torrentCache[torrentID];
            }

            const magnetURL = this.getMagnetURL(torrentID);

            var client = new WebTorrent();

            torrentCache[torrentID] = new Promise((resolve, reject) => {
                this.log("Connecting to cloud url: " + magnetURL);
                client.add(magnetURL, function (torrent) {
                    // Got torrent metadata!
                    resolve(torrent);
                });
            });
            torrentCache[torrentID] = await torrentCache[torrentID];
            const torrent = torrentCache[torrentID];
            this.log("Connected to cloud: " + torrent.infoHash);
            return torrent;
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

            const workerURL = findThisScript()[0].basePath + 'assets/3rdparty/7zip/js/worker.7z.wrapper.js';

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
                    } else if (event.data.type == 2){
                        // console.info(event.data.text);
                    } else if (event.data.type == 3){
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
                    clearDataWrapper();
                }
            });

            function DataStorage(path,isdir,data) {
                this.path = path;
                this.isdir = isdir;
                this.data = data;
            }
        }
    }



    async function requireWebTorrent() {
        const AudioSourceLoader = customElements.get('audio-source-loader');
        const relativeScriptPath = 'node_modules/webtorrent/webtorrent.min.js';

        let scriptElm = AudioSourceLoader.findScript(relativeScriptPath, false);
        if(!scriptElm) {
            window.exports = {};
            window.module = {exports: window.exports};
            const scriptURL = findThisScript()[0].basePath + relativeScriptPath;
            scriptElm = document.createElement('script');
            scriptElm.src = scriptURL;
            scriptElm.promises = (scriptElm.promises || []).concat(new Promise(async (resolve, reject) => {
                scriptElm.onload = e => {
                    scriptElm.exports = window.module.exports;
                    delete window.module; delete window.exports;
                    resolve();
                };
                document.head.appendChild(scriptElm);
            }));
        }
        for (let i=0; i<scriptElm.promises.length; i++)
            await scriptElm.promises[i];
        return scriptElm.exports
            || (() => { throw new Error("Script module has no exports: " + relativeScriptPath); })()
    }



    /** Export this script **/
    thisModule.exports = {
        AudioSourceFileService,
    };



}).apply(null, (function() {
    const thisScriptPath = 'common/audio-source-file-service.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [
        thisRequire,
        thisModule,
        thisScriptPath,
        isBrowser
    ]
})());