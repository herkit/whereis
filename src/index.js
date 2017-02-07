var tracker = require ('./lib/gpsreceiver/server');
var express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    path = require('path'),
    geocode = require('./lib/geocode');

// start server
tracker.createServer ({
  protocols: {
    'tk102': 5006,
    'tk102-clone1': 5007,
    'osmand': 5008
  }
});

// incoming data, i.e. update a map
tracker.on ('track', function (gps) {
  console.log(gps);
  geocode.reverseGeo({ lat: gps.geo.latitude, lng: gps.geo.longitude }, function(err, address) {
    if (err) {
      gps.address = { error: err };
    } else {
      gps.address = address;
    }
    io.emit('track', gps);
  })
});

tracker.on('error', function (err) {
  console.log('error', err.reason);
})

console.log(process.env.FACEBOOK_APP_ID);
console.log(process.env.FACEBOOK_SECRET);


app.use(express.static(path.join(__dirname, 'static')));

server.listen(3001, function (err) {
  if (err)
    console.log(err);
})