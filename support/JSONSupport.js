{

    /** Register Script Exports **/
    function getThisScriptPath() { return 'common/support/JSONSupport.js'; }
    const exportThisScript = function(module) {
        module.exports = {JSONSupport};
    }

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


        async loadSongDataFromURL(url, options={}) {
            var request = new XMLHttpRequest();
            await new Promise((resolve, reject) => {
                request.open("GET", url, true);
                request.responseType = "json";
                request.send();
                request.onload = resolve;
            });

            const songData = request.response;
            return songData;
        }

    }

    /** Export this script **/
    registerModule(exportThisScript);


    /** Module Loader Methods **/
    function registerModule(callback) {
        if(typeof window === 'undefined')
            callback(module);
        else findThisScript()
            .forEach(scriptElm => callback(scriptElm))
    }

    function findThisScript() {
        return findScript(getThisScriptPath());
    }

    function findScript(scriptURL) {
        let scriptElms = document.head.querySelectorAll(`script[src$="${scriptURL}"]`);
        scriptElms.forEach(scriptElm => {
            scriptElm.relativePath = scriptURL;
            scriptElm.basePath = scriptElm.src.replace(document.location.origin, '').replace(scriptURL, '');
        });
        return scriptElms;
    }

}
