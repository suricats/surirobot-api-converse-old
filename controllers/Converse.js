'use strict';

var url = require('url');
var Converse = require('./ConverseService');

module.exports.getbotspeaking = function getbotspeaking (req, res, next) {
  Converse.getbotspeaking(req.swagger.params, res, next);
};
