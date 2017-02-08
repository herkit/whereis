var tracker = require ('./lib/gpsreceiver/server');
var express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    path = require('path'),
    geocode = require('./lib/geocode'),
    db = require('./server/db');

// start server
tracker.createServer ({
  protocols: {
    'tk102': 10001,
    'tk102-clone1': 10002,
    'osmand': 10003
  }
});

var history = [];

// incoming data, i.e. update a map
tracker.on ('track', function (track) {
  console.log("Position received: " + track.geo.latitude + ", " + track.geo.longitude);
  db('gpslog').insert(flatten(track));
  geocode.reverseGeo({ lat: track.geo.latitude, lng: track.geo.longitude }, function(err, address) {
    if (err) {
      track.address = { error: err };
    } else {
      track.address = address;
    }
    io.emit('track', track);
    history.push(track);
  })
});

/*io.on('connect', function(socket) {
  if (history.length > 0)
    socket.emit('track', history.slice(-1));
})*/

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

function flatten(o, prefix) {
  prefix = prefix ? prefix + '_' : '';
  var result = {};
  var keys = Object.keys(o).forEach(function(prop) {
    if (o.hasOwnProperty(prop))
    {
      if (typeof o[prop] === "object") {
        result = Object.assign(result, flatten(o[prop], prefix + prop));
      } else {
        result[prefix + prop] = o[prop];
      }
    }    
  });
  return result;
}