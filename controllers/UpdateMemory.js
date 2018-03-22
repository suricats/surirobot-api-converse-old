'use strict';

var url = require('url');
var UpdateMemory = require('./UpdateMemoryService');

module.exports.updatememory = function updatememory (req, res, next) {
  UpdateMemory.updatememory(req.swagger.params, res, next);
};
