import UserAPI from "./api/UserAPI";


const express = require('express');
const session = require('express-session');



export default class Server {
    constructor(port=3001) {
        this.port = port;
    }
    start() {
        const app = express();
        app.use(session({secret: 'cb1fbb07079625629cf5858918f33713',saveUninitialized: true,resave: true}));

        new UserAPI().connectApp(app);


        // app.use(express.static(ROOT_DIR));

        app.get("/",function(request,response)
        {
            response.json({"Message":"Welcome to Node js"});
        });

        app.listen(this.port, () => {
            console.log('Server listening on port: ' + this.port);
        });

    }
}




// Import the rest of our application.
// module.exports = require('./server.js')
