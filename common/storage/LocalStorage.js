import LZString from "lz-string";

export default class LocalStorage {



    /** Encoding / Decoding **/

    static encodeForStorage(json, replacer = null, space = null) {
        console.log(`Encoding: `, json);
        let encodedString = JSON.stringify(json, replacer, space);
        console.log(`Encoded: ${encodedString}`);
        let compressedString = LZString.compress(encodedString);
        console.log(`Compression: ${compressedString.length} / ${encodedString.length} = ${Math.round((compressedString.length / encodedString.length)*100)/100}`);
        return compressedString;
    }

    static decodeForStorage(encodedString) {
        if (!encodedString)
            return null;
        encodedString = LZString.decompress(encodedString) || encodedString;
        return JSON.parse(encodedString);
    }

    /** Get and Set Items **/

    static async setItem(key, value) {
        return localStorage.setItem(key, value);
    }

    static async getItem(key) {
        return localStorage.getItem(key);
    }
};
