import {FileService} from "../../../../song";

export default class PeriodicWaveLoader {

    constructor(audioContext=null) {
        this.audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    }

    isPeriodicWaveAvailable(url) {
        return !!waveURLCache[url];
    }
    tryCache(url) {
        return waveURLCache[url];
    }

    async loadPeriodicWaveFromURL(url) {
        if(waveURLCache[url])
            return waveURLCache[url];

        const service = new FileService();
        const buffer = await service.loadBufferFromURL(url);
        const waveData = JSON.parse(new TextDecoder("utf-8").decode(buffer));
        if (!waveData.real)
            throw new Error("Invalid 'real' data for createPeriodicWave");
        if (!waveData.imag)
            throw new Error("Invalid 'imag' data for createPeriodicWave");

        return waveURLCache[url] = this.audioContext.createPeriodicWave(
            new Float32Array(waveData.real),
            new Float32Array(waveData.imag)
        );

        // throw new Error("Periodic wave was not found");
    }


}
const waveURLCache = {};
