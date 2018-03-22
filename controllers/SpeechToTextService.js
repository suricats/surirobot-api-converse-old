'use strict';

const Requests = require('./Requests');
const ErrorsCheck = require('./ErrorsCheck');
var async = require('async');

exports.getsttresult = function(args, res, next) {
  /**
   * get the textual transcription of the input audio file
   *
   * audio File user audio
   * language String Language of speech (optional)
   * returns OutputSTT
   **/
	var toReturn = {};
        toReturn['application/json'] = {
		"text" : ""
    };
    res.setHeader('Content-Type', 'application/json');

	if (!ErrorsCheck.checkSTTRequest(args, res, toReturn)) return;

	///GET SPEECH TEXT WITH STT API
    Requests.speechToText(args.audio.value.buffer, args.language.value, 
        (r_err, r_res) => {
        if (r_err) Requests.returnInternalError(res, toReturn, '/speechToText => Error in Speech To Text API: Received code ' + r_err.status);
        else {
            toReturn[Object.keys(toReturn)[0]].text = "";
			if (ErrorsCheck.checkSTTresponse(r_res, res, toReturn)) {
				for (var i=0; i<r_res.body.data.text.length; i++) {
		            toReturn[Object.keys(toReturn)[0]].text += r_res.body.data.text[i] + '. ';
		        }
			}
			res.end(JSON.stringify(toReturn[Object.keys(toReturn)[0]] || {}, null, 2));
		}
	});
}
