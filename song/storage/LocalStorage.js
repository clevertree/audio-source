export default class LocalStorage {
    static async setItem(key, value) {
        return localStorage.setItem(key, value);
    }

    static async getItem(key) {
        return localStorage.getItem(key);
    }
};
