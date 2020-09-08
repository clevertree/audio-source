import {FileService} from "../../../../song";

const cache = {};
const promises = {};
let cacheClearInterval = null;

let AC;
function getDefaultAudioContext() {
    return AC || (AC = new (window.AudioContext || window.webkitAudioContext)())
}

export default class AudioBufferLoader {
    static DEFAULT_TIMEOUT_MS = 10000;
    static DEFAULT_EXPIRE_MS = 60000;
    static CACHE_CLEAR_INTERVAL = 6000;

    constructor(audioContext=null) {
        this.audioContext = audioContext || getDefaultAudioContext();
    }

    isAudioBufferAvailable(url) {
        return !!cache[url];
    }

    async loadAudioBufferFromURL(url, expireTime=AudioBufferLoader.DEFAULT_EXPIRE_MS, timeoutInMS=AudioBufferLoader.DEFAULT_TIMEOUT_MS) {
        if(cache[url])
            return cache[url][0];
        if(promises[url])
            return await promises[url];

        const cachePromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(function () {
                console.error(`URL failed to load: ${url}. Please try again.`);
                reject(`URL failed to load: ${url}. Please try again.`);
            }, timeoutInMS);

            const service = new FileService();
            const bufferPromise = service.loadBufferFromURL(url);
            bufferPromise.then(async buffer => {
                clearTimeout(timeout);
                const audioBuffer = await this.audioContext.decodeAudioData(buffer.buffer || buffer);

                /** Cache **/
                if(expireTime !== false)
                    this.addCache(url, audioBuffer, new Date().getTime() + expireTime);

                // console.log("Loaded audio buffer: ", url, audioBuffer);
                resolve(audioBuffer);
                delete promises[url];
            })
        })
        promises[url] = cachePromise;
        return await cachePromise;
    }


    /** Cache **/

    tryCache(url) {
        if(!cache[url])
            return null;
        cache[url][1] = new Date().getTime() + AudioBufferLoader.DEFAULT_EXPIRE_MS; // Extend cache timeout
        return cache[url][0];
    }

    addCache(url, audioBuffer, expireTime) {
        cache[url] = [audioBuffer, expireTime];
        console.log("Cached: " + url, audioBuffer);
        clearInterval(cacheClearInterval);
        cacheClearInterval = setInterval(() => this.clearCache(), AudioBufferLoader.CACHE_CLEAR_INTERVAL);
    }


    clearCache() {
        const expireTime = new Date().getTime();
        Object.keys(cache).forEach(function(cacheKey) {
            const [, expires] = cache[cacheKey];
            if(expireTime > expires) {
                console.log("Uncached: " + cacheKey);
                delete cache[cacheKey];
            }
        })
        if(Object.keys(cache).length === 0)
            clearInterval(cacheClearInterval);
    }

}

