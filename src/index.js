var tracker = require ('./lib/gpsreceiver/server');
var log = require('./lib/log'),
    partials = require('express-partials'),
    debug = require('debug')('whereis:main'),
    server = require('./server'),
    io = require('./server/client-io'),
    path = require('path'),
    express = require('express'),
    passport = require('./auth'),
    Promise = require('bluebird'),
    expressSession = require('express-session'),
    bodyParser = require('body-parser'),
    geocode = require('./lib/geocode'),
    db = require('./server/db'),
    model = require('./server/model'),
    events = require('./events'),
    statemanager = require('./statemanager'),
    LatLon = require('./static/app/geo');

Date.getUtcTimestamp = function() {
  var now = new Date();
  return Math.floor(now.getTime() / 1000 + now.getTimezoneOffset() * 60);
}


db.
init().
then(() => 
  {
    statemanager.init();

    tracker.createServer ({
      protocols: {
        'tk102': 10001,
        'tk102-clone1': 10002,
        'osmand': 10003,
        'xexun': {
          port: 10004,
          full: true
        }
      }
    });

    // incoming data, i.e. update a map
    var trackTimeout;
    tracker.on ('track', function (track) {
      if (trackTimeout) clearTimeout(trackTimeout);
      log.info('Tracker data: %s', track.raw);
      log.debug("Position received: " + track.geo.latitude + ", " + track.geo.longitude);
      if (track.extra) {
        log.debug('Deleting extra data before storing:', track.extra);
        delete track.extra;
      }
      db('gpslog').
      insert(model.flatten(track)).
      returning('logid').
      then(function(logid) {
        geocode.reverseGeo({ lat: track.geo.latitude, lng: track.geo.longitude }, function(err, address) {
          if (err) {
            track.address = { error: err };
          } else {
            track.address = address;
            db('geolookup').
            insert(Object.assign(model.flatten(address), { latitude: track.geo.latitude, longitude: track.geo.longitude })).
            returning('lookupid').
            then(function(lookupid) {
              db('gpslog').where('logid', logid[0]).update({ 'lookupid': lookupid[0] }).then(() => { 
                log.debug("stored address"); 
              });
            });
          }
          events.emit('track', track);
        })  
      });
    });

    tracker.on('error', function (err) {
      log.error('tracker error', err.reason);
    })

    server.rootApp.set('views', path.join(__dirname, 'views'));
    server.rootApp.set('view engine', 'ejs');
    server.rootApp.use(express.static(path.join(__dirname, 'static')));
    server.rootApp.use(partials());
    server.rootApp.use(bodyParser.json());
    server.rootApp.use(bodyParser.urlencoded());
    server.rootApp.use(expressSession({secret: 'mySecretKey'}));
    server.rootApp.use(passport.initialize());
    server.rootApp.use(passport.session());

    require('./web')(server.rootApp);
    require('./api')(server.rootApp);

    server.listen(3001, function (err) {
      if (err)
        log.error(err);
    })
  }
)

