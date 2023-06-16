var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');
var util = require('util');
var debug = util.debuglog('server');

//twilio 
//  helpers.sendTwilioSms(4158375309,'Hello',function(err){
//     workers('this was error',err)
// })


// instantiate server module object
var server = {};


// Initiate the HTTP server
server.httpServer = http.createServer(function (req, res) {
    server.unifiedServer(req, res);
});

// Initiate  the HTTPS server
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, function (req, res) {
    server.unifiedServer(req, res);
});



// All the server logic 
server.unifiedServer = function (req, res) {
    // Parse the url
    var parsedUrl = url.parse(req.url, true);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP method
    var method = req.method.toLowerCase();

    //Get the headers as an object
    var headers = req.headers;

    // Get the payload,if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function (data) {
        buffer += decoder.write(data);
    });
    req.on('end', function () {
        buffer += decoder.end();

        // Check the router for a matching path for a handler. If  not found, use the notFound handler instead.
        var chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // If the request is within the public directory use to the public handler instead
       chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

        // Construct the data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // Route the request to the handler specified in the router
        chosenHandler(data, function (statusCode, payload , contentType) {

            // set content type to json if there is no specified given in header
            contentType = typeof(contentType) == 'string' ? contentType : 'json'

            // Use the status code returned from the handler, or set the default status code to 200
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200; 

            // return response type that are content specific
            var payloadString = '';
            if(contentType == 'json'){
                // Return the response in json
                res.setHeader('Content-Type', 'application/json');
                // Use the payload returned from the handler, or set the default payload to an empty object
                 payload = typeof (payload) == 'object' ? payload : {};
                // Convert the payload to a string
                var payloadString = JSON.stringify(payload);
            }
            if(contentType == 'html'){
                res.setHeader('Content-Type', 'text/html');
                payloadString = typeof(payload) == 'string' ? payload : '';

            } 
            if(contentType == 'css'){
                res.setHeader('Content-Type', 'text/css');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';

            }
            if(contentType == 'plain'){
                res.setHeader('Content-Type', 'text/plain');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';

            }
            if(contentType == 'png'){
                res.setHeader('Content-Type', 'image/png');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';

            }
            if(contentType == 'jpg'){
                res.setHeader('Content-Type', 'image/jpeg');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';

            }
            if(contentType == 'favicon'){
                res.setHeader('Content-Type', 'image/x-icon');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';

            }
            // return response type that are comman in all content type
            res.writeHead(statusCode);
            res.end(payloadString);

            if(statusCode == 200){
                debug('\x1b[32m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
              } else {
                debug('\x1b[31m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
              }
            
        });

    });
};

// Define the request router
server.router = {
    '' : handlers.index,
    'account/create' : handlers.accountCreate,
    'account/edit' : handlers.accountEdit,
    'account/deleted' : handlers.accountDeleted,
    'session/create' : handlers.sessionCreate,
    'session/deleted' : handlers.sessionDeleted,
    'checks/all' : handlers.checkList,
    'checks/create' : handlers.checkCreate,
    'checks/edit' : handlers.checkEdit,
    'favicon.ico' : handlers.favicon,
    'public' : handlers.public,
// ------------------------------>>>
    'ping': handlers.ping,
    'api/users': handlers.users,
    // 'sample': handlers.sample,
    'api/tokens': handlers.tokens,
    'api/checks': handlers.checks
};

// init server
server.init = function () {
    // Start the HTTP server
    server.httpServer.listen(config.httpPort, function () {
        // workers();
        console.log('\x1b[33m%s\x1b[0m','The HTTP server is running on port ' + config.httpPort);

        // Start the HTTPS server
        server.httpsServer.listen(config.httpsPort, function () {
            console.log('\x1b[33m%s\x1b[0m','The HTTPS server is running on port ' + config.httpsPort);
        });
    });
}

// export server
module.exports = server;