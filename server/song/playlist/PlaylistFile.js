// TODO: move out of server?
export default class PlaylistFile {
    static parseEntry(entry) {
        if(typeof entry === "string") {
            if(entry[0] === '[' || entry[0] === '{') {
                entry = JSON.parse(entry);
            } else {
                return {path: entry, title: entry.split('/').pop()}
            }
        }
        if(Array.isArray(entry)) {
            const [path, title] = entry;
            return {path, title};
        } else {
            return entry;
        }
    }
}
