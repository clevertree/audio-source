import MIDIFileSupport from "./MIDIFileSupport";
import JSONFileSupport from "./JSONFileSupport";

const classes = [];

export default class FileSupport {


    getFileSupportByPath(filePath) {
        if(typeof filePath !== "string")
            throw new Error("Invalid path: " + typeof filePath);
        const fileExt = filePath.split('.').pop().toLowerCase();
        for(const [fileExtensions, fileSupportClass] of classes) {
            for(const ext of fileExtensions) {
                if(ext.toLowerCase() === fileExt) {
                    return new fileSupportClass(filePath);
                }
            }
        }
        throw new Error("Unsupported extension: " + fileExt);
    }

    async processSongFromFileBuffer(fileBuffer, filePath) {
        const support = this.getFileSupportByPath(filePath);
        const song = await support.processSongFromFileBuffer(fileBuffer, filePath);
        if(!song)
            throw new Error("Support module failed to produce Song object: " + this.constructor.name)
        return song;
    }


    /** Static **/


    static addFileSupport(fileExtensions, fileSupportClass) {
        classes.push([fileExtensions, fileSupportClass])
    }

}


FileSupport.addFileSupport(['mid', 'midi'], MIDIFileSupport);
FileSupport.addFileSupport(['json'], JSONFileSupport);
