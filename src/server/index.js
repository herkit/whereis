var express = require('express'),
    app = express(),
    server = require('http').Server(app);

module.exports = server;
module.exports.rootApp = app;