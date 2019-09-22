const express = require('express');
const expressWS = require('express-ws');
const path = require('path');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);



class AudioSourceServer {
    constructor(config = {}) {
        if(typeof config === "number")
            config = {httpPort: config};

        config = Object.assign({}, {
            httpPort: 8090,
            baseDir: process.cwd()
        }, config || {});

        this.config = config;
        this.app = null;
    }

    async loadLocalConfig() {

        const configPath = path.resolve(process.cwd() + '/.config.json');
        try {
            const configJSON = await readFile(configPath, "utf8");
            this.config = JSON.parse(configJSON);
        } catch (e) {
            // console.info(e);
        }
    }

    async listen(httpPort = null) {
        httpPort = httpPort || this.config.httpPort;

        const app = express();
        expressWS(app);

        app.use(express.static(this.config.baseDir));

        // Launch the Server
        app.listen(httpPort, function() {
            console.log('SNESology listening on port: ' + httpPort);
        });

        this.app = app;
        return app;
    }
}

module.exports = {
    AudioSourceServer
};