(function() {

    /** Register Script Exports **/
    function getThisScriptPath() { return 'common/audio-source-file-service.js'; }
    function exportThisScript(module) {
        module.exports = {
            AudioSourceFileService
        };
    }

    const archiveBuffers = {};
    const torrentCache = {};
    const trackerURLS = [
        "udp://explodie.org:6969",
        "udp://tracker.coppersurfer.tk:6969",
        "udp://tracker.empire-js.us:1337",
        "udp://tracker.leechers-paradise.org:6969",
        "udp://tracker.opentrackr.org:1337",
        "wss://tracker.fastcast.nz",
        "wss://tracker.openwebtorrent.com",
        // "wss://tracker.btorrent.xyz",
    ];

    class AudioSourceFileService {
        constructor() {
        }

        async loadBufferFromURL(url) {
            if(url.toString().startsWith('torrent://')) {
                return await this.getFileBufferFromTorrent(url);
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
                console.log("Connecting to " + magnetURL);
                client.add(magnetURL, function (torrent) {
                    // Got torrent metadata!
                    resolve(torrent);
                });
            });
            torrentCache[torrentID] = await torrentCache[torrentID];
            const torrent = torrentCache[torrentID];
            console.log('Client is downloading:', torrent.infoHash);
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
        const relativeScriptPath = 'node_modules/webtorrent/webtorrent.min.js';
        if(typeof require !== "undefined")
            return require('../' + relativeScriptPath);

        let scriptElm = findScript(relativeScriptPath)[0];
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
    registerModule(exportThisScript);

    /** Module Loader Methods **/
    function registerModule(callback) {
        if(typeof window === 'undefined')
            callback(module);
        else findThisScript()
            .forEach(scriptElm => callback(scriptElm))
    }

    function findThisScript() {
        return findScript(getThisScriptPath());
    }

    function findScript(scriptURL) {
        let scriptElms = document.head.querySelectorAll(`script[src$="${scriptURL}"]`);
        scriptElms.forEach(scriptElm => {
            scriptElm.relativePath = scriptURL;
            scriptElm.basePath = scriptElm.src.replace(document.location.origin, '').replace(scriptURL, '');
        });
        return scriptElms;
    }

    // async function requireAsync(relativeScriptPath) {
    //     if(typeof require !== "undefined")
    //         return require('../' + relativeScriptPath);
    //
    //     let scriptElm = findScript(relativeScriptPath)[0];
    //     if(!scriptElm) {
    //         const scriptURL = findThisScript()[0].basePath + relativeScriptPath;
    //         scriptElm = document.createElement('script');
    //         scriptElm.src = scriptURL;
    //         scriptElm.promises = (scriptElm.promises || []).concat(new Promise(async (resolve, reject) => {
    //             scriptElm.onload = resolve;
    //             document.head.appendChild(scriptElm);
    //         }));
    //     }
    //     for (let i=0; i<scriptElm.promises.length; i++)
    //         await scriptElm.promises[i];
    //     return scriptElm.exports
    //         || (() => { throw new Error("Script module has no exports: " + relativeScriptPath); })()
    // }


})();