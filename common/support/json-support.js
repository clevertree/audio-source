{
    class JSONSupport {
        constructor() {
        }


        async loadSongFromFileInput(file) {
            const {AudioSourceUtilities} = await requireAsync('common/audio-source-utilities.js');
            const Util = new AudioSourceUtilities();
            const songData = await Util.loadJSONFile(file);
            if (songData.instruments.length === 0)
                console.warn("Song contains no instruments");
            await this.loadSongData(songData);
        }

    }

    /** Register This Module **/
    const _module = typeof module !== "undefined" ? module : findThisScript();
    _module.exports = {
        JSONSupport,
    };

    /** Module Loader Methods **/
    function findThisScript() {
        const SCRIPT_PATH = 'common/support/json-support.js';
        const thisScript = document.head.querySelector(`script[src$="${SCRIPT_PATH}"]`);
        if (!thisScript)
            throw new Error("Base script not found: " + SCRIPT_PATH);
        thisScript.relativePath = SCRIPT_PATH;
        thisScript.basePath = thisScript.src.replace(document.location.origin, '').replace(SCRIPT_PATH, '');
        return thisScript;
    }

}
