class JSONSupport {

    async loadSongDataFromFileInput(file) {
        const fileResult = await new Promise((resolve, reject) => {
            let reader = new FileReader();                                      // prepare the file Reader
            reader.readAsText(file);                 // read the binary data
            reader.onload =  (e) => {
                resolve(e.target.result);
            };
        });

        // noinspection JSCheckFunctionSignatures
        return JSON.parse(fileResult);
    }


    async loadSongDataFromURL(url, children={}) {
        const response = await fetch(url);
        const songData = await response.json();
        return songData;
    }

}


export default JSONSupport;
