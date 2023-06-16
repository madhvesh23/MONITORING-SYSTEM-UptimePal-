// dependecies
var server = require('./lib/server');
var workers = require('./lib/workers');

// instantiate app module object
var app = {};

//init the object
app.init = function () {
    // server init
    server.init();
    // worker init
    workers.init();
}

// exceute function
app.init();

// export module
module.exports = app

