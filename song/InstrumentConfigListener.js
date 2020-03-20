/** @deprecated **/
export class InstrumentConfigListener {
    constructor(config, song, instrumentID) {
        this.config = config;
        this.song = song;
        this.instrumentID = instrumentID;
        this.updateTimeout = null;
        // TODO: allow fast changes. trigger update slowly
    }

    update() {
        console.log('update');
        this.song.updateInstrument(this.instrumentID, this.config);
    }

    get(obj, prop) {
        switch (prop) {
            case 'id':
            case 'instrumentID':
                return this.instrumentID;
            case 'update':
                return this.update;
        }
        console.log(prop, '.get', obj);
        // The default behavior to return the value
        return obj[prop];
    }

    set(obj, prop, value) {
        console.log(prop, '.set', value, obj);
        // The default behavior to store the value
        obj[prop] = value;
        // Indicate success
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => this.update(), 100);
        return true;
    }
}
