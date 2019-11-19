{
    class SPCSupport {
        constructor() {
        }

        async loadSongFromFileInput(file, defaultInstrumentURL = null) {
            const SPCData = await this.loadSPCFile(file);
            const songData = this.loadSongFromSPCData(SPCData, defaultInstrumentURL);
            return songData;
        }
    }

    /** Register This Module **/
    const _module = typeof module !== "undefined" ? module : findThisScript();
    _module.exports = {
        SPCSupport,
    };

    /** Module Loader Methods **/
    function findThisScript() {
        const SCRIPT_PATH = 'common/support/spc-support.js';
        const thisScript = document.head.querySelector(`script[src$="${SCRIPT_PATH}"]`);
        if (!thisScript)
            throw new Error("Base script not found: " + SCRIPT_PATH);
        thisScript.relativePath = SCRIPT_PATH;
        thisScript.basePath = thisScript.src.replace(document.location.origin, '').replace(SCRIPT_PATH, '');
        return thisScript;
    }

}
