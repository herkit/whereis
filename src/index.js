var tracker = require ('./lib/gpsreceiver/server');
var express = require('express'),
    log = require('./lib/log'),
    app = express(),
    partials = require('express-partials'),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    path = require('path'),
    passport = require('./auth'),
    expressSession = require('express-session'),
    bodyParser = require('body-parser'),
    geocode = require('./lib/geocode'),
    db = require('./server/db');


db.init().then(() => {

log.info("Database initialized");
// start server
var history = [];

db.
select(
  ['gpslog.*'].
  concat(
    prefix_names('geolookup', 'address_', 
      [
        'street', 
        'settlement', 
        'district', 
        'district_long', 
        'state', 
        'state_long', 
        'country', 
        'country_long'
      ]
    )
  )
).
from('gpslog').
leftJoin('geolookup', 'gpslog.lookupid', 'geolookup.lookupid').
orderBy('logid', 'desc').
limit(10).
map(function(record) { 
  return db.restructure(record); 
}).then(function(data) {
  data.reverse();
  history = data; 
  io.emit('track', history.slice(-1).pop());
});

io.on('connection', function(socket) {
  if (history.length > 0) {
    var current = history.slice(-1).pop();
    log.debug("socket.io connected sending last known position");
    socket.emit('track', current);
  }
})

tracker.createServer ({
  protocols: {
    'tk102': 10001,
    'tk102-clone1': 10002,
    'osmand': 10003
  }
});

// incoming data, i.e. update a map
tracker.on ('track', function (track) {
  log.info('Tracker data: %s', track.raw);
  log.debug("Position received: " + track.geo.latitude + ", " + track.geo.longitude);
  db('gpslog').
  insert(db.flatten(track)).
  returning('logid').
  then(function(logid) {
    geocode.reverseGeo({ lat: track.geo.latitude, lng: track.geo.longitude }, function(err, address) {
      if (err) {
        track.address = { error: err };
      } else {
        track.address = address;
        db('geolookup').
        insert(Object.assign(db.flatten(address), { latitude: track.geo.latitude, longitude: track.geo.longitude })).
        returning('lookupid').
        then(function(lookupid) {
          db('gpslog').where('logid', logid[0]).update({ 'lookupid': lookupid[0] }).then(() => { 
            log.debug("stored address"); 
          });
        });
      }
      io.emit('track', track);
      history.push(track);
    })  
  });
});

tracker.on('error', function (err) {
  log.error('tracker error', err.reason);
})

log.debug(process.env.FACEBOOK_APP_ID);
log.debug(process.env.FACEBOOK_SECRET);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'static')));
app.use(partials());
app.use(bodyParser.json());
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());

require('./web')(app);
require('./api')(app);

server.listen(3001, function (err) {
  if (err)
    log.error(err);
})

function prefix_names(table, prefix, fields)
{
    if (fields instanceof Array) {
        return fields.map(field_name => table + '.' + field_name+' as '+prefix + field_name);
    }
    else {
        return Array.prototype.slice.call(arguments).map(field_name => table + '.' + field_name+' as '+prefix + field_name);
    }
}

})

