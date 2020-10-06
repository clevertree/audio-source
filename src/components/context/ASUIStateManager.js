export default class ASUIStateManager {
    constructor() {
        this.keys = {};
    }

    getKey(key) {
        return this.keys[key];
    }

    setKey(key, value) {
        return this.keys[key] = value;
    }
}
