
var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB,
    IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
    dbVersion = 1.0,
    dbName = "file_cache";

export default class LocalFileCache {
    static instance = new LocalFileCache();

    constructor() {
        // Create/open database
        this.db = null;
        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = function (event) {
            console.log("Error creating/accessing IndexedDB database");
        };

        request.onsuccess = (event) => {
            console.log("Success creating/accessing IndexedDB database");
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
        }

        // For future use. Currently only in latest Firefox versions
        request.onupgradeneeded = (event) => {
            console.log("Creating objectStore")
            this.createObjectStore(event.target.result);
        }
    }

    createObjectStore(dataBase) {
        // Create an objectStore
        dataBase.createObjectStore(dbName);
    }

    putFile(blob, fileName) {
        if(!this.db)
            throw new Error("Database is not available");

        const transaction = this.db.transaction(dbName, 'readwrite')
        const put = transaction.objectStore(dbName).put(blob, fileName);
        return put;
    }

    async getFile(fileName) {
        if(!this.db)
            throw new Error("Database is not available");

        const transaction = this.db.transaction(dbName, 'readonly')

        return await new Promise((resolve, reject) => {
            const get = transaction.objectStore(dbName).get(fileName);
            get.onsuccess = function (event) {
                const blob = event.target.result;
                resolve(blob);
            };
            get.onerror = function (event) {
                reject(event.target.result);
            }

        })

    }

    async hasFile(fileName) {
        if(!this.db)
            throw new Error("Database is not available");

        const transaction = this.db.transaction(dbName, 'readonly')

        return await new Promise((resolve, reject) => {
            const count = transaction.objectStore(dbName).count(fileName);
            count.onsuccess = function (event) {
                const count = event.target.result;
                resolve(count > 0);
            };
            count.onerror = function (event) {
                reject(event.target.result);
            }

        })

    }




    // getImageFile() {
    //     // Create XHR
    //     var xhr = new XMLHttpRequest(),
    //         blob;
    //
    //     xhr.open("GET", "elephant.png", true);
    //     // Set the responseType to blob
    //     xhr.responseType = "blob";
    //
    //     xhr.addEventListener("load", function () {
    //         if (xhr.status === 200) {
    //             console.log("Image retrieved");
    //
    //             // Blob as response
    //             blob = xhr.response;
    //             console.log("Blob:" + blob);
    //
    //             // Put the received blob into IndexedDB
    //             putElephantInDb(blob);
    //         }
    //     }, false);
    //     // Send XHR
    //     xhr.send();
    // }
    //
    // putElephantInDb (blob) {
    //     console.log("Putting elephants in IndexedDB");
    //
    //     // Open a transaction to the database
    //     var transaction = db.transaction(["elephants"], IDBTransaction.READ_WRITE);
    //
    //     // Put the blob into the dabase
    //     var put = transaction.objectStore("elephants").put(blob, "image");
    //
    //     // Retrieve the file that was just stored
    //     transaction.objectStore("elephants").get("image").onsuccess = function (event) {
    //         var imgFile = event.target.result;
    //         console.log("Got elephant!" + imgFile);
    //
    //         // Get window.URL object
    //         var URL = window.URL || window.webkitURL;
    //
    //         // Create and revoke ObjectURL
    //         var imgURL = URL.createObjectURL(imgFile);
    //
    //         // Set img src to ObjectURL
    //         var imgElephant = document.getElementById("elephant");
    //         imgElephant.setAttribute("src", imgURL);
    //
    //         // Revoking ObjectURL
    //         URL.revokeObjectURL(imgURL);
    //     };
    // }

}


