import {FileService} from "../../../../song";

const cache = {};
const promises = {};
let cacheClearInterval = null;

export default class PeriodicWaveLoader {
    static DEFAULT_TIMEOUT_MS = 10000;
    static DEFAULT_EXPIRE_MS = 60000;
    static CACHE_CLEAR_INTERVAL = 6000;

    constructor(audioContext=null) {
        this.audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    }

    isPeriodicWaveAvailable(url) {
        return !!cache[url];
    }


    async loadPeriodicWaveFromURL(url, expireTime=PeriodicWaveLoader.DEFAULT_EXPIRE_MS, timeoutInMS=PeriodicWaveLoader.DEFAULT_TIMEOUT_MS) {
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
            bufferPromise.then(buffer => {
                clearTimeout(timeout);
                const waveData = JSON.parse(new TextDecoder("utf-8").decode(buffer));
                if (!waveData.real)
                    throw new Error("Invalid 'real' data for createPeriodicWave");
                if (!waveData.imag)
                    throw new Error("Invalid 'imag' data for createPeriodicWave");
                const periodicWave = this.audioContext.createPeriodicWave(
                    new Float32Array(waveData.real),
                    new Float32Array(waveData.imag)
                );

                /** Cache **/
                if(expireTime !== false)
                    this.addCache(url, periodicWave, new Date().getTime() + expireTime);

                // console.log("Loaded periodic wave: ", url, periodicWave);
                resolve(periodicWave);
                delete promises[url];
            })
        })
        promises[url] = cachePromise;
        return await cachePromise;
        // throw new Error("Periodic wave was not found");
    }

    /** Cache **/

    tryCache(url) {
        // console.log('tryCache', cache, promises, url);
        if(!cache[url])
            return null;
        return cache[url][0];
    }


    addCache(url, periodicWave, expireTime) {
        cache[url] = [periodicWave, expireTime];
        console.log("Cached: " + url, periodicWave);
        clearInterval(cacheClearInterval);
        cacheClearInterval = setInterval(() => this.clearCache(), PeriodicWaveLoader.CACHE_CLEAR_INTERVAL);
    }

    clearCache() {
        const expireTime = new Date().getTime();
        Object.keys(cache).forEach(function(cacheKey) {
            const [, expires] = cache[cacheKey];
            if(expireTime > expires) {
                console.log("Uncached: " + cacheKey);
                delete cache[cacheKey];
                delete promises[cacheKey];
            }
        })
        if(Object.keys(cache).length === 0)
            clearInterval(cacheClearInterval);
    }



}
