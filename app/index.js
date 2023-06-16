var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;


var server = http.createServer(function (req, res) {

    // take url and parse it
    var parsedUrl = url.parse(req.url, true);

    // get the path from url
    var path = parsedUrl.pathname;
    var trimPath = path.replace(/^\/+|\/+$/g, '');

    // get query string from url
    var queryStringObj = parsedUrl.query;

    // get the request method
    var method = req.method;

    // get the header
    var header = req.headers;

    // get the payload with request
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function (data) {
        buffer += decoder.write(data);
    })

    req.on('end', function () {
        buffer += decoder.end();

        // response msg
        res.end('hello world bro');

        // log the request path
        // console.log("the requested path is:" + trimPath + "with method:" + method+ 'with query string:',queryStringObj);
        // console.log('requested header is:', header);
        console.log("payload come with request is:",buffer)

    })




});

server.listen(3000, function () {
    console.log("listening to port 3000 now");
})