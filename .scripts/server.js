const express = require('express');
const path = require('path');

const ROOT_DIR = path.dirname(__dirname);

const app = express();

app.use(express.static(ROOT_DIR));

// app.get("/product",function(request,response)
// {
//     response.json({"Message":"Welcome to Node js"});
// });

const httpPort = 8090;
app.listen(httpPort, function() {
    console.log('Server listening on port: ' + httpPort);
});
