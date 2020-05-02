export default class LocalStorage {
    async setItem(key, value) {
        return localStorage.setItem(key, value);
    }

    async getItem(key) {
        return localStorage.getItem(key);
    }
};
