const TARGET = Symbol('proxy_target');
const LISTENER = Symbol('proxy_listener');

export default class ConfigListener {
    constructor(song, path=[]) {
        this.path = path;
        this.song = song;
        this.updateTimeout = null;
        this.changeListeners = [];
        // TODO: allow fast changes. trigger update slowly
    }

    /** @deprecated **/
    // addChangeListener(listener) {
    //     const i = this.changeListeners.indexOf(listener)
    //     if(i === -1)
    //         this.changeListeners.push(listener);
    // }
    //
    // /** @deprecated **/
    // removeChangeListener(listener) {
    //     const i = this.changeListeners.indexOf(listener)
    //     if(i !== -1)
    //         this.changeListeners.splice(i);
    // }


    get(obj, prop) {
        switch(prop) { // TODO: support all common methods
            case TARGET: return obj;
            case LISTENER: return this;
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
        obj[prop] = value;
        this.queueChange('set', this.path.concat(prop), value);
        return true;
    }

    deleteProperty(obj, prop) {
        if (prop in obj) {
            delete obj[prop];
            this.queueChange('delete', this.path.concat(prop));
        }
        return true;
    }

    queueChange(action, path, data = null, oldData = null) {
        this.song.queueHistoryAction(action, path, data, oldData);
        // for(let i=0; i<this.changeListeners.length; i++) {
        //     this.changeListeners[i](action, path);
        // }
    }



    splice(obj, path, number, deleteCount, ...newValues) {
        if(!Array.isArray(obj))
            throw new Error(`Splice may only be used in array objects for path: ${path.join('.')}`);

        obj.splice(number, deleteCount, ...newValues);
        this.queueChange('splice', path, number, deleteCount, ...newValues);
    }

    /** Static **/

    static TARGET = TARGET;
    static LISTENER = LISTENER;

    static resolveProxiedObject(proxyObject) {
        return proxyObject[TARGET] || proxyObject;
    }

    static addChangeListener(proxyObject, listener) {
        const configListener = proxyObject[LISTENER];
        configListener.addChangeListener(listener);
    }
}
