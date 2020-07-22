import MIDIFileSupport from "./MIDIFileSupport";

const classes = [];

export default class FileSupport {


    getFileSupportByPath(filePath) {
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
        return await support.processSongFromFileBuffer(fileBuffer, filePath);
    }


    /** Static **/


    static addFileSupport(fileExtensions, fileSupportClass) {
        classes.push([fileExtensions, fileSupportClass])
    }

}


FileSupport.addFileSupport(['mid', 'midi'], MIDIFileSupport);
