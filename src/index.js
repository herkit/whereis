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
    var history = [];
    var upcomingFlights = [];

    var current = {
      state: 'track',
      data: {}
    };

    events.on('command:stoptracking', function() {
      current.state = "stopped";
    });
    events.on('command:starttracking', function() {
      current.state = "track";
      current.data = history.slice(-1).pop();
    })
    events.on('command:startflight', function(data) {
      db('flights').
      select('*').
      where('id', data.id).
      then((records) => {
        var flightData = model.restructure(records[0]);
        var flightTime = flightData.to.timestamp - flightData.from.timestamp;
        flightData.from.timestamp = Date.getUtcTimestamp();
        flightData.to.timestamp = flightData.from.timestamp + flightTime;

        log.debug('command:startflight', flightData);
        setCurrentFlight(flightData);
      })
    })

    function setCurrentFlight(flight) {
      log.debug('Entering flightmode', flight.from.code, flight.to.code);
      current.state = 'flight';
      current.data = flight;
      current.stateTimeout = setTimeout(function() {
        var toLoc = current.data.to.location;
        log.debug('Exiting flightmode');
        current.state = 'track';
        current.data = { geo: { lat: toLoc.latitude, lng: toLoc.longitude }, address: { address: current.data.to.name } };
        emitCurrent();
      }, (flight.to.timestamp - Date.getUtcTimestamp()) * 1000);      
      emitCurrent();
    }

    var now = Date.getUtcTimestamp();
    log.debug('find flights active after', now);
    Promise.all([
      db.getGpsLog(20),
      db.getUpcomingFlights()
    ]).
    spread((gpslog, flights) => {
      history = gpslog;
      upcomingFlights = flights;

      log.debug(flights.map((f) => { return f.from.timestamp; }));
      
      log.debug("data loaded");
      var lasttrack = history.slice(-1).pop();
      current.state = 'track';
      current.data = lasttrack;

      if (upcomingFlights.length > 0) {
        var firstFlight = upcomingFlights.slice(0,1)[0];
        log.debug('preflight check');
        var now = Date.getUtcTimestamp();
        if (firstFlight.from.timestamp < now && firstFlight.to.timestamp > now) {
          setCurrentFlight(firstFlight);
        } else {
          emitCurrent();
        }
      }
    })

    function emitCurrent()
    { 
      var dataToSend = current.data;
      if (current.state === 'track') {
        var tracktime = new Date(current.data.datetime);
        debug("is stale:", tracktime.getTime(), Date.now());
        var age = Date.now() - tracktime.getTime();
        if (age > 120000) {
          var currentLatLon = new LatLon(current.data.geo.latitude, current.data.geo.longitude);
          var bearing = getRandomInt(0, 360);
          var addDistance = getRandomInt(100, 500);
          debug("adding ", addDistance, "m on bearing", bearing);
          var maskedLatLon = currentLatLon.destinationPoint(addDistance, bearing);
          dataToSend = { geo: { latitude: maskedLatLon.lat, longitude: maskedLatLon.lon }, gps: { accuracy: 1000 + Math.min(age/2000, 1000)}, address: current.data.address };
        }
      }

      io.emit(current.state, dataToSend);
    }


    io.on('connection', function(socket) {
      emitCurrent();
    })

    tracker.createServer ({
      protocols: {
        'tk102': 10001,
        'tk102-clone1': 10002,
        'osmand': 10003
      }
    });

    // incoming data, i.e. update a map
    var trackTimeout;
    tracker.on ('track', function (track) {
      if (trackTimeout) clearTimeout(trackTimeout);
      log.info('Tracker data: %s', track.raw);
      log.debug("Position received: " + track.geo.latitude + ", " + track.geo.longitude);
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
          history.push(track);
          if (current.state === 'track') {
            current.data = track;
            emitCurrent();
            trackTimeout = setTimeout(emitCurrent, 120000);
          }
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

    function prefix_names(table, prefix, fields)
    {
        if (fields instanceof Array) {
            return fields.map(field_name => table + '.' + field_name+' as '+prefix + field_name);
        }
        else {
            return Array.prototype.slice.call(arguments).map(field_name => table + '.' + field_name+' as '+prefix + field_name);
        }
    }

    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min;
    }
  }
)

