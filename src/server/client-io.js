var log = require('../lib/log'),
    socketio = require('socket.io'),
    server = require('./index');

var _io = socketio(server);

module.exports = _io;