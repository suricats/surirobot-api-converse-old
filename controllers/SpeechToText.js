'use strict';

var url = require('url');
var SpeechToText = require('./SpeechToTextService');

module.exports.getsttresult = function getsttresult (req, res, next) {
  SpeechToText.getsttresult(req.swagger.params, res, next);
};
