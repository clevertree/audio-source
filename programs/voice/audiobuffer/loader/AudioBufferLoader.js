import {FileService} from "../../../../song";

const cache = {};
let cacheClearInterval = null;

export default class AudioBufferLoader {
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

    async loadAudioBufferFromURL(url, expireTime=false) {
        if(cache[url])
            return cache[url][0];
        if(expireTime === true)
            expireTime = new Date().getTime() + AudioBufferLoader.DEFAULT_EXPIRE_MS;

        const service = new FileService();
        const buffer = await service.loadBufferFromURL(url);
        const audioBuffer = await this.audioContext.decodeAudioData(buffer.buffer || buffer);
        if(expireTime !== false) {
            cache[url] = [audioBuffer, expireTime];
            // console.log("Cached: " + url, audioBuffer);
            clearInterval(cacheClearInterval);
            cacheClearInterval = setInterval(() => this.clearCache());
        }

        return audioBuffer;
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

