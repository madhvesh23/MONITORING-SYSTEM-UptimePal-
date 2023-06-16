const { type } = require('os');
var config = require('./config')
var _data = require('./data');
var helpers = require('./helpers');

// Define all the handlers
var handlers = {};



// ------->>>>>> HTML HANDLERS <<<<<<<--------
// Index handler
handlers.index = function (data, callback) {
    // only GET method is allowed
    if (data.method == 'get') {
        // Prepare data for interpolation
        var templateData = {
            'head.title' : 'Uptime Monitoring ',
            'head.description' : 'We offer , simple uptime monitoring for HTTP/HTTPS sites all kinds. When your site goes down, we\'ll send you a text to let you know',
            'body.class' : 'index'
        };
        // get the html template to show on web-browser
        helpers.getTemplate('index', templateData, function (err, str) {
            if (!err && str) {
                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function (err, str) {
                    if (!err && str) {
                        // Return that page as HTML
                        callback(200, str, 'html');
                    } else {
                        callback(500, undefined, 'html');
                    }
                });
            }
            else {
                callback(500, undefined, 'html');
            }
        })

    }
    else {
        callback(405, undefined, 'html');
    }

}

// Create Account
handlers.accountCreate = function(data,callback){
    // Reject any request that isn't a GET
    if(data.method == 'get'){
      // Prepare data for interpolation
      var templateData = {
        'head.title' : 'Create an Account',
        'head.description' : 'Signup is easy and only takes a few seconds.',
        'body.class' : 'accountCreate'
      };
      // Read in a template as a string
      helpers.getTemplate('accountCreate',templateData,function(err,str){
        if(!err && str){
          // Add the universal header and footer
          helpers.addUniversalTemplates(str,templateData,function(err,str){
            if(!err && str){
              // Return that page as HTML
              callback(200,str,'html');
            } else {
              callback(500,undefined,'html');
            }
          });
        } else {
          callback(500,undefined,'html');
        }
      });
    } else {
      callback(405,undefined,'html');
    }
  };

// Favicon
handlers.favicon = function(data,callback){
    // Reject any request that isn't a GET
    if(data.method == 'get'){
      // Read in the favicon's data
      helpers.getStaticAsset('favicon.ico',function(err,data){
        if(!err && data){
          // Callback the data
          callback(200,data,'favicon');
        } else {
          callback(500);
        }
      });
    } else {
      callback(405);
    }
  };

// public handler
// this will get all files included in public folder
handlers.public = function(data ,callback){
     // Reject any request that isn't a GET
  if(data.method == 'get'){
    // Get the filename being requested
    var trimmedAssetName = data.trimmedPath.replace('public/','').trim();
    if(trimmedAssetName.length > 0){
      // Read in the asset's data
      helpers.getStaticAsset(trimmedAssetName,function(err,data){
        if(!err && data){

          // Determine the content type (default to plain text)
          var contentType = 'plain';

          if(trimmedAssetName.indexOf('.css') > -1){
            contentType = 'css';
          }

          if(trimmedAssetName.indexOf('.png') > -1){
            contentType = 'png';
          }

          if(trimmedAssetName.indexOf('.jpg') > -1){
            contentType = 'jpg';
          }

          if(trimmedAssetName.indexOf('.ico') > -1){
            contentType = 'favicon';
          }

          // Callback the data
          callback(200,data,contentType);
        } else {
          callback(404);
        }
      });
    } 
    else {
      callback(404);
    }

  } else {
    callback(405);
  }
}








// ------->>>>>> JSON HANDLERS <<<<<<<--------
// Ping Handler
handlers.ping = function (data, callback) {
    callback(200);
};

// Not-Found Handler
handlers.notFound = function (data, callback) {
    callback(404);
};

// Users Handler
handlers.users = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405, { 'Error': "invalid req method" });
    }
};
// Container for all the users methods
handlers._users = {};
// post users
// Required data: firstName, lastName, phone, password, tosAgreement
handlers._users.post = function (data, callback) {
    // Check that all required fields are filled out
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure the user doesnt already exist
        _data.read('users', phone, function (err, data) {
            if (err) {
                // Hash the password
                var hashedPassword = helpers.hash(password);

                // Create the user object
                if (hashedPassword) {
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };

                    // Store the user
                    _data.create('users', phone, userObject, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, { 'Error': 'Could not create the new user' });
                        }
                    });
                } else {
                    callback(500, { 'Error': 'Could not hash the user\'s password.' });
                }

            } else {
                // User alread exists
                callback(400, { 'Error': 'A user with that phone number already exists' });
            }
        });

    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }

};
// get method
// Required data: phone
handlers._users.get = function (data, callback) {
    // Check that phone number is valid
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {

        // get data from header to veirfy token id
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyTokens(token, phone, function (tokenIsValid) {
            if (tokenIsValid) {
                // Lookup the user
                _data.read('users', phone, function (err, data) {
                    if (!err && data) {
                        // Remove the hashed password from the user user object before returning it to the requester
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            }
            else {
                callback(403, { 'Error': 'Missing token in header,or Invalid token' })
            }
        })

    } else {
        callback(400, { 'Error': 'Missing required field' })
    }
};
// put method
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function (data, callback) {
    // required fields
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    // optional fields
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone) {
        // chechk for update fields
        if (firstName || lastName || password) {

            // get data from header to veirfy token id
            var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

            handlers._tokens.verifyTokens(token, phone, function (tokenIsValid) {
                if (tokenIsValid) {
                    _data.read('users', phone, function (err, userData) {
                        if (!err && userData) {
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (firstName) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                            _data.update('users', phone, userData, function (err) {
                                if (!err) {
                                    callback(200, { 'MSG': 'Updated..' })
                                }
                                else {
                                    callback(500, { 'Error': "Couldnt update fields" })
                                }
                            })
                        }
                        else {
                            callback(400, { 'Error': 'User doesnt exist' })
                        }
                    })

                }
                else {
                    callback(403, { 'Error': 'Missing token in header,or Invalid token' })
                }
            })

        }
        else {
            callback(400, { 'Error': "Missing fields to be update" })
        }

    }
    else {
        callback(400, { 'Error': "Missing required fields" })
    }
};
// delete method
// Required data: phone
handlers._users.delete = function (data, callback) {
    // required fields
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {

        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyTokens(token, phone, function (tokenIsValid) {
            if (tokenIsValid) {
                _data.read('users', phone, function (err, userData) {
                    if (!err && userData) {
                        _data.delete('users', phone, function (err) {
                            if (!err) {
                                // Delete each of the checks associated with the user
                                var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                var checksToDelete = userChecks.length;
                                if (checksToDelete > 0) {
                                    var checksDeleted = 0;
                                    var deletionErrors = false;
                                    // Loop through the checks
                                    userChecks.forEach(function (checkId) {
                                        // Delete the check
                                        _data.delete('checks', checkId, function (err) {
                                            if (err) {
                                                deletionErrors = true;
                                            }
                                            checksDeleted++;
                                            if (checksDeleted == checksToDelete) {
                                                if (!deletionErrors) {
                                                    callback(200);
                                                } else {
                                                    callback(500, { 'Error': "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully." })
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    callback(200);
                                }
                            } else {
                                callback(500, { 'Error': 'Could not delete the specified user' });
                            }
                        });
                    } else {
                        callback(400, { 'Error': 'Could not find the specified user.' });
                    }
                });
            }
            else {
                callback(403, { 'Error': 'Missing token in header,or Invalid token' })
            }
        })

    } else {
        callback(400, { 'Error': 'Missing required field' })
    }
};


// tokens   
handlers.tokens = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405, { 'Error': "invalid req method" });
    }

}
// container for all tokens
handlers._tokens = {};
// post tokens
handlers._tokens.post = function (data, callback) {
    // required fields to verify
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone && password) {

        // vrify user exist
        _data.read('users', phone, function (err, userData) {
            if (!err && userData) {

                // hash passsword
                var hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    var tokenid = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObject = {
                        'phone': phone,
                        'id': tokenid,
                        'expires': expires
                    }
                    _data.create('tokens', tokenid, tokenObject, function (err) {
                        if (!err) {
                            callback(200, tokenObject)
                        }
                        else {
                            callback(400, { 'Error': 'Couldnt create token for user' })
                        }
                    })
                } else {
                    callback(400, { 'Error': 'incorrect password' })
                }

            } else {
                callback(400, { 'Error': 'user not exist' })
            }
        })

    } else {
        callback(400, { 'Error': 'Missing required fields' })
    }

}
//get tokens
handlers._tokens.get = function (data, callback) {

    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // check if id exist 
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                callback(200, tokenData);
            }
            else {
                callback(404, { 'Error': 'Id doesn exist' })
            }
        })
    }
    else {
        callback(400, { 'Error': 'Missing required fields' });
    }
}
// put tokens
handlers._tokens.put = function (data, callback) {
    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

    if (id && extend) {
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {

                if (tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 * 60
                    _data.update('tokens', id, tokenData, function (err) {
                        if (!err) {
                            callback(200, tokenData)
                        }
                        else {
                            callback(404, { 'error': 'didnt update id' })
                        }
                    })
                }
                else {
                    callback(400, { 'error': 'id is expird already' })
                }

            }
            else {
                callback(400, { 'Error': 'Id doesn exist' })
            }
        })
    }
    else {
        callback(400, { 'Error': 'Missing required fields' })
    }
}
// delete tokens
handlers._tokens.delete = function (data, callback) {

    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('tokens', id, function (err, data) {
            if (!err && data) {
                _data.delete('tokens', id, function (err) {
                    if (!err) {
                        callback(200, { 'MSG': 'token deleted' });
                    } else {
                        callback(500, { 'Error': 'Could not delete the specified user token' });
                    }
                });
            } else {
                callback(400, { 'Error': 'Could not find the specified user token.' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required fieldssss' })
    }
};


// verify token id for existence users

handlers._tokens.verifyTokens = function (id, phone, callback) {
    _data.read('tokens', id, function (err, tokenData) {
        if (!err && tokenData) {

            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true)
            }
            else {
                callback(false);
            }
        }
        else {
            callback(false);
        }
    })
};


// check handler
handlers.checks = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
};
// Container for all the checks methods
handlers._checks = {};
// handlers._checks.post = function (data, callback) {
//     // required fields
//     var protocol = typeof (data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
//     var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
//     var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
//     var successCode = typeof (data.payload.successCode) == 'object' && data.payload.successCode instanceof Array && data.payload.successCode.length > 0 ? data.payload.successCode : false;
//     var timeOutSeconds = typeof (data.payload.timeOutSeconds) == 'number' && data.payload.timeOutSeconds % 1 === 0 && data.payload.timeOutSeconds >= 1 && data.payload.timeOutSeconds < +5 ? data.payload.timeOutSeconds : false;


//     if (protocol && url && method && successCode && timeOutSeconds) {
//         // vrify token id
//         var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
//         _data.read('tokens',token,function(err,tokenData){
//             if(!err && tokenData){
//                 var userPhone = tokenData.phone;
//                 _data.read('users',userPhone,function(err,userData){
//                     if(!err && userData){
//                         // create user checks
//                         var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
//                         // check user checks is not greater than max checks
//                         if(userChecks > config.maxChecks){
//                             // create random check id
//                             var checkId = helpers.createRandomString(20);
//                             // create check object 
//                             var checkObject = {
//                                 'id':checkId,
//                                 'userPhone':userPhone,
//                                 'protocol':protocol,
//                                 'url':url,
//                                 'method' : method,
//                                 'successCode':successCode,
//                                 'timeOutSeconds' : timeOutSeconds
//                             }
//                             // create check folder
//                             _data.create('checks',checkId,checkObject,function(err){
//                                 if(!err){
//                                     // add check into user object
//                                     userData.checks = userChecks
//                                     userData.checks.push(checkId); 
//                                     // update user data
//                                     _data.update('users',userPhone,userData,function(err){
//                                         if(!err){
//                                             callback(200,checkObject);
//                                         }
//                                         else{
//                                             callback(500,{'error':'Couldnt update user data'})
//                                         }
//                                     })
//                                 }
//                                 else{
//                                     callback(500,{'Error':'Couldnt create new check'})
//                                 }
//                             })

//                         }else{
//                             callback(400,{'Error':'user already has maximum number of checks'})
//                         }
//                     }
//                     else{
//                         callback(403)
//                     }
//                 })
//             }
//             else{
//             callback(403,{'error' :'token id doesnt exist'})
//             }
//         })
//     }
//     else {
//         callback(400, { "error ": 'Missing rquired fields' });
//     }

// }
handlers._checks.post = function (data, callback) {
    // Validate inputs
    var protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
    if (protocol && url && method && successCodes && timeoutSeconds) {

        // Get token from headers
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        // Lookup the user phone by reading the token
        _data.read('tokens', token, function (err, tokenData) {
            if (!err && tokenData) {
                var userPhone = tokenData.phone;

                // Lookup the user data
                _data.read('users', userPhone, function (err, userData) {
                    if (!err && userData) {
                        var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                        // Verify that user has less than the number of max-checks per user
                        if (userChecks.length < config.maxChecks) {
                            // Create random id for check
                            var checkId = helpers.createRandomString(20);

                            // Create check object including userPhone
                            var checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds': timeoutSeconds
                            };

                            // Save the object
                            _data.create('checks', checkId, checkObject, function (err) {
                                if (!err) {
                                    // Add check id to the user's object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    // Save the new user data
                                    _data.update('users', userPhone, userData, function (err) {
                                        if (!err) {
                                            // Return the data about the new check
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, { 'Error': 'Could not update the user with the new check.' });
                                        }
                                    });
                                } else {
                                    callback(500, { 'Error': 'Could not create the new check' });
                                }
                            });



                        } else {
                            callback(400, { 'Error': 'The user already has the maximum number of checks (' + config.maxChecks + ').' })
                        }


                    } else {
                        callback(403);
                    }
                });


            } else {
                callback(403);
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required inputs, or inputs are invalid' });
    }
};
// get methods 
handlers._checks.get = function (data, callback) {
    // Check that  id is valid
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // Lookup the check
        _data.read('checks', id, function (err, checkData) {
            if (!err && checkData) {
                // Get the token that sent the request
                var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                // Verify that the given token is valid and belongs to the user who created the check
                console.log("This is check data", checkData);
                handlers._tokens.verifyTokens(token, checkData.userPhone, function (tokenIsValid) {
                    if (tokenIsValid) {
                        // Return check data
                        callback(200, checkData);
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field, or field invalid' })
    }
};
//   put method
handlers._checks.put = function (data, callback) {
    // required fields
    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

    // optional field
    var protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (id) {
        // check for optional fields
        if (protocol || url || method || successCodes || timeoutSeconds) {
            // lookup checks
            _data.read('checks', id, function (err, checkData) {
                if (!err && checkData) {
                    //  check for token id
                    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                    // Verify that the given token is valid
                    handlers._tokens.verifyTokens(token, checkData.userPhone, function (tokenIsValid) {
                        if (tokenIsValid) {
                            if (protocol) {
                                checkData.protocol = protocol;
                            }
                            if (url) {
                                checkData.url = url;
                            }
                            if (method) {
                                checkData.method = method;
                            }
                            if (successCodes) {
                                checkData.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds;
                            }

                            // update new checks
                            _data.update('checks', id, checkData, function (err) {
                                if (!err) {
                                    callback(200, checkData);
                                } else {
                                    callback(500, { 'Error': 'Could not update the check.' });
                                }
                            });
                        }
                        else {
                            callback(403, { "Eror": "invalid token id" });
                        }
                    })
                }
                else {
                    callback(400, { 'Error': 'Check ID did not exist.' });
                }
            })

        }
        else {
            callback(400, { 'Error': 'Missing fields to update.' });
        }
    }
    else {
        callback(400, { "Error": "Miisiing required fields" })
    }

}
// delete methods
handlers._checks.delete = function (data, callback) {
    // Check that id is valid
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // Lookup the checks
        _data.read('checks', id, function (err, checkData) {
            if (!err && checkData) {
                // Get the token 
                var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                // Verify that the given token is valid a
                handlers._tokens.verifyTokens(token, checkData.userPhone, function (tokenIsValid) {
                    if (tokenIsValid) {
                        // Delete the check data
                        _data.delete('checks', id, function (err) {
                            if (!err) {
                                // Lookup the users object to get all their checks
                                _data.read('users', checkData.userPhone, function (err, userData) {
                                    if (!err) {
                                        var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                        // Remove the deleted check from their list of checks
                                        var checkPosition = userChecks.indexOf(id);
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                            // Re-save the user's data
                                            userData.checks = userChecks;
                                            _data.update('users', checkData.userPhone, userData, function (err) {
                                                if (!err) {
                                                    callback(200, { 'MSG': 'check deleted...' });
                                                } else {
                                                    callback(500, { 'Error': 'Could not update the user.' });
                                                }
                                            });
                                        } else {
                                            callback(500, { "Error": "Couldnt find the check on the user's object" });
                                        }
                                    } else {
                                        callback(500, { "Error": "Could not find the user who created the check, so could not remove the check from the list of checks on their user object." });
                                    }
                                });
                            } else {
                                callback(500, { "Error": "Could not delete the check data." })
                            }
                        });
                    } else {
                        callback(403, { "Eror": "invalid token id" });
                    }
                });
            } else {
                callback(400, { "Error": "The check ID specified could not be found" });
            }
        });
    } else {
        callback(400, { "Error": "Missing valid id" });
    }
};


module.exports = handlers;