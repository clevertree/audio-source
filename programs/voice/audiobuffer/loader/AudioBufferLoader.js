import {FileService} from "../../../../song";

const cache = {};
let cacheClearInterval = null;

export default class AudioBufferLoader {
    static DEFAULT_EXPIRE_MS = 6000;

    constructor(audioContext=null) {
        this.audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    }

    isAudioBufferAvailable(url) {
        return !!cache[url];
    }
    getCachedAudioBufferFromURL(url) {
        return cache[url];
    }

    async loadAudioBufferFromURL(url, expires=false) {
        if(cache[url])
            return cache[url];
        if(expires === true)
            expires = new Date().getTime() + AudioBufferLoader.DEFAULT_EXPIRE_MS;

        const service = new FileService();
        const buffer = await service.loadBufferFromURL(url);
        const audioBuffer = await this.audioContext.decodeAudioData(buffer.buffer || buffer);
        if(expires !== false) {
            cache[url] = [audioBuffer, expires];
            // console.log("Cached: " + url, audioBuffer);
            clearInterval(cacheClearInterval);
            cacheClearInterval = setInterval(() => this.clearCache());
        }

        return audioBuffer;
    }

    clearCache() {
        const expireTime = new Date().getTime();
        Object.keys(cache).forEach(function(cacheKey) {
            const [audioBuffer, expires] = cache[cacheKey];
            if(expireTime > expires) {
                // console.log("Uncached: " + cacheKey, audioBuffer);
                delete cache[cacheKey];
            }
        })
        if(Object.keys(cache).length === 0)
            clearInterval(cacheClearInterval);
    }

}

