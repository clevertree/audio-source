import PresetLibrary from "./PresetLibrary";

export default class RemotePresetLibrary extends PresetLibrary {

    constructor(libraryURL, title) {
        super(title);
        this.url = libraryURL;
        this.clearCacheTimeout = null;
        // console.log('RemoteSampleLibrary', libraryData);
    }

    /** Async loading **/
    async waitForAssetLoad() {
        if(!this.data) {
            const response = await fetch(this.url);
            const json = await response.json();
            const {title, uuid, presets} = json;
            this.title = title;
            if(uuid)
                this.uuid = uuid;
            this.presets = presets;
            this.setPresetList(presets, this.url);
        }
    }


    static addRemoteLibrary(libraryURL, title, uuid=null) {
        const remoteLibrary = new RemotePresetLibrary(libraryURL, title, uuid);
        PresetLibrary.addLibrary(remoteLibrary);
    }

}
