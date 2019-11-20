{
    class JSONSupport {
        constructor() {
        }


        async loadSongDataFromFileInput(file) {
            const fileResult = await new Promise((resolve, reject) => {
                let reader = new FileReader();                                      // prepare the file Reader
                reader.readAsText(file);                 // read the binary data
                reader.onload =  (e) => {
                    resolve(e.target.result);
                };
            });

            const songData = JSON.parse(fileResult);
            return songData;
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
        return document.head.querySelector(`script[src$="${SCRIPT_PATH}"]`)
            || (() => throw new Error("Base script not found: " + SCRIPT_PATH))()
    }

}
