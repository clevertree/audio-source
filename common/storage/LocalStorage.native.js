import AsyncStorage from '@react-native-community/async-storage';
import LZString from "lz-string";


export default class LocalStorage {



    /** Encoding / Decoding **/


    static encodeForStorage(json, replacer = null, space = null) {
        // console.log(`Encoding: `, json);
        let encodedString = JSON.stringify(json, replacer, space);
        // console.log(`Encoded: ${encodedString}`);
        // let compressedString = LZString.compress(encodedString);
        // console.log(`Compression: ${compressedString.length} / ${encodedString.length} = ${Math.round((compressedString.length / encodedString.length)*100)/100}`);
        return encodedString;
    }

    static decodeForStorage(encodedString) {
        if (!encodedString)
            return null;
        try {
            encodedString = LZString.decompress(encodedString) || encodedString;
        } catch (e) {
            console.log("Not compressed: " + e.message);
        }
        // encodedString = LZString.decompress(encodedString) || encodedString;
        // console.log(`Uncompressed: ${encodedString}`);
        const originalString = JSON.parse(encodedString);
        // console.log("Decoded: ", originalString);
        return originalString;
    }

    /** Get and Set Items **/

    static async setItem(key, value) {
        return AsyncStorage.setItem(key, value);
    }

    static async getItem(key) {
        return AsyncStorage.getItem(key);
    }
};
