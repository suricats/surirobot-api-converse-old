'use strict';

const Requests = require('./Requests');
const ErrorsCheck = require('./ErrorsCheck');
var async = require('async');

exports.updatememory = function(args, response, next) {
  /**
   * writes a field in the bot memory for the specified conversation
   *
   * field Name of the memory field to write
   * value Value to write in the specified field
   * userId ID of the user for which the field has to be updated
   * returns the input query
   **/
	var toReturn = {};
    toReturn['application/json'] = {
		"field" : "",
		"value" : "",
		"userId" : ""
    };
    response.setHeader('Content-Type', 'application/json');

	var body = args['body'].value;

	if (!ErrorsCheck.checkUpdateMemoryRequest(body, response, toReturn)) return;

	Requests.nlpUpdateMemory(body.field, body.value, body.userId,
		(err, res) => {
		if (err) Requests.returnInternalError(response, toReturn, '/updateMemory => Error in NLP API /updateMemory: Received code '+ err.response.res.statusCode + ' and status message: ' + err.response.res.statusMessage);
		else {
		    console.log('Field ' + body.field + ' was correctly written with value ' + body.value + ' for user ' + body.userId);
			toReturn[Object.keys(toReturn)[0]].field = body.field;
			toReturn[Object.keys(toReturn)[0]].value = body.value;
			toReturn[Object.keys(toReturn)[0]].userId = body.userId;			
		    response.end(JSON.stringify(toReturn[Object.keys(toReturn)[0]] || {}, null, 2));
		}
	});
}


