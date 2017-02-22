var log = require('../lib/log'),
    socketio = require('socket.io'),
    server = require('./index');

var _io = socketio(server);
var _admin = _io.of('/admin');
_admin.use(function(socket, next){
  if (socket.request.headers.cookie) return next();
  next(new Error('Authentication error'));
});

module.exports = _io;

module.exports.admin = _admin;