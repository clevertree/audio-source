const TARGET = Symbol('proxy_target');

export class ConfigListener {
    constructor(song, path=[]) {
        this.path = path;
        this.song = song;
        this.updateTimeout = null;
        // TODO: allow fast changes. trigger update slowly
    }


    get(obj, prop) {
        switch(prop) { // TODO: support all common methods
            case TARGET: return obj;
            case 'indexOf': return (v,b,e) => obj.indexOf(v,b,e);
            case 'splice': return (number, deleteCount, ...newValues) => this.splice(obj, this.path.concat(number), number, deleteCount, ...newValues);
            default:
                const path = this.path.concat(prop);
                if(typeof obj[prop] === 'object') {
                    return new Proxy(obj[prop], new ConfigListener(this.song, path));
                }
                return obj[prop];
        }
    }

    set(obj, prop, value) {
        const path = this.path.concat(prop);
        obj[prop] = value;
        this.song.queueHistoryAction('set', path, value);
        return true;
    }

    deleteProperty(obj, prop) {
        if (prop in obj) {
            const path = this.path.concat(prop);
            delete obj[prop];
            this.song.queueHistoryAction('delete', path);
            return true;
        }
        return false;
    }



    splice(obj, path, number, deleteCount, ...newValues) {
        if(!Array.isArray(obj))
            throw new Error(`Splice may only be used in array objects for path: ${path.join('.')}`);

        obj.splice(number, deleteCount, ...newValues);
        this.song.queueHistoryAction('splice', path, number, deleteCount, ...newValues);
    }

    static getTargetObject(proxyObject) {
        return proxyObject[TARGET]
    }
}
