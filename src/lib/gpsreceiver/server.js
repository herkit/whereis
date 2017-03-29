var net = require('net');
var EventEmitter = require('events').EventEmitter;
var gpsserver = new EventEmitter();
var debug = require('debug')('whereis:gpsreceiver');

gpsserver.settings = {
  ip: '0.0.0.0',
  connections: 10,
  timeout: 10
}

function socketServer(port, protocol) {
  var server = net.createServer();

  server.on('listening', function() {
    gpsserver.event ('listening', server.address());
  });

  server.on('connection', function(socket) {
    var connection = server.address();
    connection.remoteAddress = socket.remoteAddress;
    connection.remotePort = socket.remotePort;

    gpsserver.event('connection', connection);
    socket.setEncoding(protocol.encoding || 'utf8');

    socket.on('timeout', function() {
      gpsserver.event('timeout', connection);
      socket.destroy();
    });

    socket.on('data', function(data) {
      var gps = {};
      var err = null;

      data = data.trim();
      gpsserver.event('data', data);

      if(data !== '') {
        gps = protocol.parse(data);

        if (gps) {
          gpsserver.event('track', gps);
        } else {
          err = new Error ('Cannot parse GPS data from device');
          err.protocol = protocol.name;
          err.reason = err.message;
          err.input = data;
          err.connection = connection;

          gpsserver.event ('fail', err);
        }
      }
    });

    socket.on('close', function(hadError) {
      connection.hadError = hadError;
      gpsserver.event('disconnect', connection);
    });

    socket.on('error', function(error) {
      var err = new Error ('Socket error');

      err.protocol = protocol.name;
      err.reason = error.message;
      err.socket = socket;
      err.settings = gpsserver.settings;

      gpsserver.event ('error', err);
    })
  })

  server.on ('error', function (error) {
    var err = new Error ('Server error');

    if (error === 'EADDRNOTAVAIL') {
      err = new Error ('IP or port not available');
    }

    err.reason = error.message;
    err.input = gpsserver.settings;

    gpsserver.event ('error', err);
  });

  server.listen(port, gpsserver.settings.ip);
  debug("listening, ip: ", gpsserver.settings.ip, " port: ", port, " protocol: ", protocol.name);

  return server;
}

function httpServer(port, protocol) {
  var http = require('http');

  var server = http.createServer((req, res) => {
    var gps = protocol.parse(req, res);
    if (gps) {
      gpsserver.event('track', gps);
      res.end("HTTP/1.1 200 OK");
    } else {
      err = new Error ('Cannot parse GPS data from device');
      err.protocol = protocol.name;
      err.reason = err.message;
      err.input = req;

      gpsserver.event ('fail', err);
      res.end("HTTP/1.1 400 Bad Request");
    }
  });
  server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });
  server.listen(port);

  return server;
}

gpsserver.event = function(name, value) {
  gpsserver.emit(name, value);
}

gpsserver.createServer = function(options) {
  gpsserver.servers = [];
  options.protocols = options.protocols || {};

  for (var protocolName in options.protocols) {
    if (options.protocols.hasOwnProperty(protocolName)) {
      var protocol = require("./protocols/" + protocolName);
      protocol.name = protocolName;

      var server;
      var port = options.protocols[protocolName].port || options.protocols[protocolName];

      if (protocol.type === 'socket') {
        server = socketServer(port, protocol);
      } else {
        server = httpServer(port, protocol);
      }

      gpsserver.servers.push(server);

    }
  }

  return gpsserver;
  
}

gpsserver.checksum = function (raw) {
  var str = raw.trim () .split (/[,*#]/);
  var strsum = parseInt (str [15], 10);
  var strchk = str.slice (2, 15) .join (',');
  var check = 0;
  var i;

  for (i = 0; i < strchk.length; i++) {
    check ^= strchk.charCodeAt (i);
  }

  check = parseInt (check.toString (16), 10);
  return (check === strsum);
};

gpsserver.fixGeo = function (one, two) {
  
  var minutes = one.substr (-7, 7);
  var degrees = parseInt (one.replace (minutes, ''), 10);

  one = degrees + (minutes / 60);
  one = parseFloat ((two === 'S' || two === 'W' ? '-' : '') + one);

  return Math.round (one * 1000000) / 1000000;
};

module.exports = gpsserver;