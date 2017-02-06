var tracker = require ('./lib/gpsreceiver/server');
var express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    path = require('path');

// start server
tracker.createServer ({
  protocols: {
    'tk102': 5006,
    'tk102-clone1': 5007,
  }
});

// incoming data, i.e. update a map
tracker.on ('track', function (gps) {
  io.emit('track', gps);
  console.log(gps);
});

tracker.on('error', function (err) {
  console.log(err);
})

app.use(express.static(path.join(__dirname, 'static')));

server.listen(3001, function (err) {
  if (err)
    console.log(err);
})