export default class PeriodicWaveLoader {
    constructor(audioContext) {
        this.audioContext = audioContext;
    }

    isPeriodicWaveAvailable(url) {
        return !!PeriodicWaveLoader.waveURLCache[url];
    }
    getCachedPeriodicWaveFromURL(url) {
        return PeriodicWaveLoader.waveURLCache[url];
    }

    async loadPeriodicWaveFromURL(url) {
        if(PeriodicWaveLoader.waveURLCache[url])
            return PeriodicWaveLoader.waveURLCache[url];

        // TODO Use file service
        const response = await fetch(url);
        const waveData = await response.json();
        if (!waveData.real)
            throw new Error("Invalid 'real' data for createPeriodicWave");
        if (!waveData.imag)
            throw new Error("Invalid 'imag' data for createPeriodicWave");

        return PeriodicWaveLoader.waveURLCache[url] = this.audioContext.createPeriodicWave(
            new Float32Array(waveData.real),
            new Float32Array(waveData.imag)
        );

        // throw new Error("Periodic wave was not found");
    }


    /** Static **/

    static waveURLCache = {};
}
