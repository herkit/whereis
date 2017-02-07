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
    'tk102': 10001,
    'tk102-clone1': 10002,
    'osmand': 10003
  }
});

// incoming data, i.e. update a map
tracker.on ('track', function (gps) {
  console.log("Position received: " + gps.geo.latitude + ", " + gps.geo.longitude);
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

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function(req, res) {
  res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY });
});

app.post('/', function(req, res) {
  res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY });
});

server.listen(3001, function (err) {
  if (err)
    console.log(err);
})