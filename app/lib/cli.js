// cli realted tasks


// dependecies
var readline = require('readline');
var util = require('util');
var debug = util.debuglog('cli');
var events = require('events');
const { stderr } = require('process');
class _events extends events { };
var e = new _events();

// instantiate CLI
var cli = {};
// input processor
cli.processInput = function (str) {
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false;
    // process inpuot only if user has wrote somthng,
    if (str) {
        // allow some unique strings that match the question asked by the user's
        var uniqueInputs = [
            'man',
            'help',
            'exit',
            'stats',
            'list users',
            'more user info',
            'list checks',
            'more check info',
            'list logs',
            'more log info'
        ];

        //   go thru possible inputs ,emit event when a match if found
        var matchFound = false;
        var counter = 0;
        uniqueInputs.some(function (input) {
            if (str.toLowerCase().indexOf(input) > -1) {
                matchFound = true;
                // emit event
                e.emit(input,str)
                return true;
            }
        })
        // if match not found print a msg
        if(!matchFound){
            console.log("sorry,try again")
        }
    }
}




// init script
cli.init = function () {
    // send a astarting msg to console
    console.log('\x1b[34m%s\x1b[0m', 'The CLI is running');


    // start interface
    var _inetrface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ''
    });

    // create initial prompt 
    _inetrface.prompt();

    // handle each line of input separately
    _inetrface.on('line', function (str) {
        // send it to inputProcess
        cli.processInput(str);

        // re-init the prompt afterwards
        _inetrface.prompt();
    })

    // if user  stops cli , means kilss the process
    _inetrface.on('close', function () {
        // stop process
        process.exit(0);
    })







};





// export 
module.exports = cli;