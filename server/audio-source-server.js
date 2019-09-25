const express = require('express');
const expressWS = require('express-ws');
const path = require('path');
const fs = require('fs');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const accessAsync = util.promisify(fs.access);



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

        this.hasLocalConfig()
            .then(hasAccess => {
                if(hasAccess)
                    this.loadLocalConfig();
            })
    }

    async hasLocalConfig() {
        const configPath = path.resolve(this.config.baseDir + '/.config.json');
        try {
            const error = await accessAsync(configPath, fs.constants.R_OK);
            return !error;

        } catch (e) {
            // console.info(e);
            return false;
        }
        return true;
    }

    async loadLocalConfig() {
        const configPath = path.resolve(this.config.baseDir + '/.config.json');
        try {
            const configJSON = await readFileAsync(configPath, "utf8");
            this.config = JSON.parse(configJSON);
            console.info("Loaded local server config");
        } catch (e) {
            console.info(e);
        }
    }

    async saveLocalConfig() {
        const configPath = path.resolve(this.config.baseDir + '/.config.json');
        try {
            await writeFileAsync(configPath, JSON.stringify(this.config));
        } catch (e) {
            console.info(e);
        }
    }

    async listen(httpPort = null) {
        httpPort = httpPort || this.config.httpPort;

        const app = express();
        expressWS(app);

        app.use(express.static(this.config.baseDir));

        // Launch the Server
        app.listen(httpPort, function() {
            console.log('Audio Source Server listening on port: ' + httpPort);
        });

        this.app = app;
        return app;
    }
}

module.exports = {
    AudioSourceServer
};