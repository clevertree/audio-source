// TODO: move out of server?
/** @deprecated **/
export default class PlaylistFile {
    static parseEntry(entry) {
        if(typeof entry === "string") {
            if(entry[0] === '[' || entry[0] === '{') {
                entry = JSON.parse(entry);
            } else {
                return {url: entry, title: entry.split('/').pop()}
            }
        }
        if(Array.isArray(entry)) {
            const [url, title] = entry;

            return {url, title};
        } else {
            return entry;
        }
    }

}
