var tracker = require ('./lib/gpsreceiver/server');
var log = require('./lib/log'),
    partials = require('express-partials'),
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
    events = require('./events');

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
        flightData.from.timestamp = Date.now() / 1000;
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
        log.debug('Exiting flightmode');
        current.state = 'track';
        current.data = { geo: current.data.to.location };
        emitCurrent();
      }, (flight.to.timestamp - Date.getUtcTimestamp()) * 1000);      
      emitCurrent();
    }

    var now = Date.getUtcTimestamp();
    log.debug('find flights active after', now);
    Promise.all([
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
      limit(20).
      map(function(record) { 
        return model.restructure(record); 
      }).then(
        function(data) {
          data.reverse();
          return Promise.resolve(data);
        }
      ),
      db.
      select('*').
      from('flights').
      where('to_timestamp', '>', now).
      orderBy('from_timestamp').
      map(function(record) {
        return model.restructure(record);
      })
    ]).
    spread((gpslog, flights) => {
      history = gpslog;
      upcomingFlights = flights;

      log.debug(flights.map((f) => { return f.from.timestamp; }));
      
      log.debug("data loaded");
      current.state = 'track';
      current.data = history.slice(-1).pop();
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
      io.emit(current.state, current.data);
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
    tracker.on ('track', function (track) {
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

  }
)

