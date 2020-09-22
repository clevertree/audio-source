import {Song} from "../index";

export default class JSONFileSupport {
    async processSongFromFileBuffer(fileBuffer, filePath) {
        let fileJSON = new TextDecoder("utf-8").decode(fileBuffer);
        fileJSON = JSON.parse(fileJSON);
        return new Song(fileJSON);
    }
}
