export class Preset {
    constructor(presetData) {
        this.data = presetData;
    }

    getTitle() { return this.data.title || "Untitled Preset"; }
    getData() { return this.data; }
}
