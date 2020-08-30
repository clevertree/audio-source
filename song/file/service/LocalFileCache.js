
var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB,
    dbVersion = 1.0,
    dbName = "file_cache";

export default class LocalFileCache {
    static instance = new LocalFileCache();

    constructor() {
        // Create/open database
        this.db = null;
    }

    async getDB() {
        if(this.db)
            return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, dbVersion);

            request.onerror = function (event) {
                reject(event);
                console.log("Error creating/accessing IndexedDB database");
            };

            request.onsuccess = (event) => {
                // console.log("Success creating/accessing IndexedDB database");
                const db = request.result;
                this.db = db;

                db.onerror = function (event) {
                    console.log("Error creating/accessing IndexedDB database");
                };

                // Interim solution for Google Chrome to create an objectStore. Will be deprecated
                if (db.setVersion) {
                    if (db.version !== dbVersion) {
                        var setVersion = db.setVersion(dbVersion);
                        setVersion.onsuccess = () => {
                            this.createObjectStore(db);
                        };
                    }
                }

                resolve(db);
            }

            // For future use. Currently only in latest Firefox versions
            request.onupgradeneeded = (event) => {
                this.createObjectStore(event.target.result);
            }
        })
    }

    createObjectStore(dataBase) {
        // Create an objectStore
        console.log("Creating objectStore");
        dataBase.createObjectStore(dbName);
    }

    async putFile(blob, fileName) {
        const db = await this.getDB();
        const transaction = db.transaction(dbName, 'readwrite')
        return transaction.objectStore(dbName).put(blob, fileName);
    }

    async tryFile(fileName) {
        if(!fileName)
            throw new Error("Invalid fileName");
        const db = await this.getDB();
        const transaction = db.transaction(dbName, 'readonly')

        return await new Promise((resolve, reject) => {
            const get = transaction.objectStore(dbName).get(fileName);
            get.onsuccess = function (event) {
                // console.log('tryFile.onsuccess', event);
                const blob = event.target.result || null;
                resolve(blob);
            };
            get.onerror = function (event) {
                console.error('tryFile.onerror', event);
                reject(null);
            }

        })
    }

}


