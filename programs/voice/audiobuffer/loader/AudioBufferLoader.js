import {FileService} from "../../../../song";

const cache = {};
let cacheClearInterval = null;

export default class AudioBufferLoader {
    static DEFAULT_TIMEOUT_MS = 10000;
    static DEFAULT_EXPIRE_MS = 60000;

    constructor(audioContext=null) {
        this.audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    }

    isAudioBufferAvailable(url) {
        return !!cache[url];
    }
    getCachedAudioBufferFromURL(url) {
        return cache[url];
    }

    tryCache(url) {
        if(cache[url])
            return cache[url][0];
        return null;
    }

    addCache(url, audioBuffer, expireTime) {
        cache[url] = [audioBuffer, expireTime];
        // console.log("Cached: " + url, audioBuffer);
        clearInterval(cacheClearInterval);
        cacheClearInterval = setInterval(() => this.clearCache());
    }

    async loadAudioBufferFromURL(url, expireTime=AudioBufferLoader.DEFAULT_EXPIRE_MS, timeoutInMS=AudioBufferLoader.DEFAULT_TIMEOUT_MS) {
        if(cache[url])
            return cache[url][0];

        return await new Promise((resolve, reject) => {
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


                resolve(cache[url]);
            })
        })
    }



    clearCache() {
        const expireTime = new Date().getTime();
        Object.keys(cache).forEach(function(cacheKey) {
            const [, expires] = cache[cacheKey];
            if(expireTime > expires) {
                // console.log("Uncached: " + cacheKey);
                delete cache[cacheKey];
            }
        })
        if(Object.keys(cache).length === 0)
            clearInterval(cacheClearInterval);
    }

}

