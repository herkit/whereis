var cache = require('./lib/geoloccache'),
    events = require('./events'),
    debug = require('debug')('whereis:api');
    passport = require('./auth'), 
    moment = require('moment'),
    Promise = require('bluebird'),
    io = require('./server/client-io'),
    db = require('./server/db'),
    model = require('./server/model'),
    events = require('./events'),
    statemanager = require('./statemanager'),
    IC = require('./lib/iatacodes'),
    polyUtil = require('polyline-encoded');

var ic = new IC(process.env.IATACODES_API_KEY);
var GoogleMapsAPI = require('googlemaps');

var publicConfig = {
  key: process.env.GOOGLE_MAPS_API_KEY,
  stagger_time:       1000, // for elevationPath 
  encode_polylines:   false,
  secure:             true // use https 
};
var gmAPI = new GoogleMapsAPI(publicConfig);

var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.status(401).send({ error: "You are not authorized" });
}

events.on('viewer:joined', function(user) {
  debug('viewer:joined');
  io.admin.emit('viewer:joined', user);
})

module.exports = function(app) {
  app.get('/api/geocode/cache/all',
    isAuthenticated,
    function(req, res) {
      cache.getAll(function(err, cache) {
        if (err) {
          events.emit('error', err);
        } else {
          res.status(200).send(cache);    
        }
      })
    }
  )

  app.get('/api/me', isAuthenticated, function(req, res) {
    res.send(req.user);
  });

  app.post('/api/auth', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) { res.status(401).send({ error: "You are not authorized" }); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.status(200).send(user);
      });
    })(req, res, next);
  });

  app.get('/api/settings', isAuthenticated, function(req, res) {
    res.send({
      privacymode: statemanager.privacymode
    })
  });

  app.post('/api/command/:command', isAuthenticated, function(req, res) {
    events.emit('command:' + req.params.command, req.body);
    res.status(200).send({ "result": "Command received", "command": req.params.command, "data": req.body });
  });

  app.get('/api/flights', isAuthenticated, function(req, res) {
    db.
    getAllFlights().
    then((data) => {
      res.send(data);
    }).
    catch((err) => {
      res.status(404);
      res.end();
    });
  });

  app.get('/api/flights/upcoming', isAuthenticated, function(req, res) {
    db.
    getUpcomingFlights().
    then((data) => {
      res.send(data);
    }).
    catch((err) => {
      res.status(404);
      res.end();
    });
  });  

  app.post('/api/flights', isAuthenticated, function(req, res) {
    var flight = req.body;
    debug('new flight', flight);

    var placeSearchText = Promise.promisify(gmAPI.placeSearchText, { context: gmAPI });
    var timezone = Promise.promisify(gmAPI.timezone, { context: gmAPI });

    var departure_timestamp = moment(flight.departure).utcOffset(0);
    var arrival_timestamp = moment(flight.arrival).utcOffset(0);

    debug("in data times", flight.departure, flight.arrival);

    Promise.all([
      placeSearchText({
        query: flight.from,
        types: 'airport'
      }),
      placeSearchText({
        query: flight.to,
        types: 'airport'
      })
    ]).
    spread((fromairport, toairport) => {
      return {
        from: fromairport.results[0],
        to: toairport.results[0]
      }
    }).
    then((airportdata) => {
      return Promise.all([
        timezone({ location: airportdata.from.geometry.location.lat + "," + airportdata.from.geometry.location.lng, timestamp: departure_timestamp.unix() }),
        timezone({ location: airportdata.to.geometry.location.lat + "," + airportdata.to.geometry.location.lng, timestamp: arrival_timestamp.unix() })
      ]).
      spread((fromtimezone, totimezone) => {
        airportdata.from.timezone = fromtimezone;
        airportdata.to.timezone = totimezone;
        return airportdata;
      })
    }).
    then((airportdata) => {
      debug(airportdata);
      var departure_utcOffset = (airportdata.from.timezone.dstOffset + airportdata.from.timezone.rawOffset) / 60;
      var arrival_utcOffset = (airportdata.to.timezone.dstOffset + airportdata.to.timezone.rawOffset) / 60;
      var departure_time = moment.parseZone(flight.departure + minutesToOffset(departure_utcOffset));
      var arrival_time = moment.parseZone(flight.arrival + minutesToOffset(arrival_utcOffset));
      debug("offsets", departure_utcOffset, arrival_utcOffset);
      debug("times", flight.departure, departure_time, flight.arrival, arrival_time);
      return {
        from: {
          name: airportdata.from.name,
          code: flight.from,
          location: airportdata.from.geometry.location,
          time: departure_time.utc().format('YYYY-MM-DD HH:mm:ss'),
          timezone: airportdata.from.timezone
        },
        to: {
          name: airportdata.to.name,
          code: flight.to,
          location: airportdata.to.geometry.location,
          time: arrival_time.utc().format('YYYY-MM-DD HH:mm:ss'),
          timezone: airportdata.to.timezone
        },
        airline: flight.airline,
        flightnumber: flight.flightnumber
      }
    }).
    then((flightdata) => {
      flightdata.created_by = req.user.id;
      db.insert(model.flatten(flightdata)).into('flights').returning('id').then(function(record) {
        flightdata.id = record[0];
        flightdata = db.addFlightTimestampFields(flightdata);
        events.emit('created:flight', flightdata);
        res.status(200).send(flightdata);  
      }).
      catch((err) => {
        debug('error', err);
        res.status(500).send(err);
      });
    }).
    catch((err) => {
      debug('error', err);
      res.status(500).send(err);
    })
  })

  app.get('/api/track/:date', isAuthenticated, function(req, res) {
    db.getGpsPathForDate(req.params.date).
    then(function(gpslog) {
      var latlngs = gpslog.map(function(e) {
        return [e.geo_latitude, e.geo_longitude]
      })
      res.send(polyUtil.encode(latlngs))
    }).
    catch(function(err) {
      debug('Unable to get path', err);
      res.status('404').send(err);
    });
  })

  app.get('/api/track/:date/csv', isAuthenticated, function(req, res) {
    db.getGpsPathForDate(req.params.date).
    then(function(gpslog) {
      res.write("datetime;latitude;longitude;speed_kmh;speed_knots;speed_mph;bearing\r\n");
      var latlngs = gpslog.forEach(function(e) {       
        res.write([e.datetime, e.geo_latitude, e.geo_longitude, e.speed_kmh, e.speed_knots, e.speed_mph, e.geo_bearing].join(';') + "\r\n");
      })
      res.send();
    }).
    catch(function(err) {
      debug('Unable to get path', err);
      res.status('404').send(err);
    });
  })

  app.get('/api/flights/getdata', 
    isAuthenticated, 
    function(req, res) {
      ic.api('routes', { flight_number: req.query.flight_number }).
      then((routedata) => {
        ic.api('airlines', { code: req.query.flight_number.slice(0, 2) }).
        then(function(airlinedata) {
          routedata.forEach(function(route) {
            route.airline = airlinedata;
          })
          res.send(routedata);
        }).
        catch(function(err) {
          debug('Unable to get airline data', err);
          res.send(routedata);
        });
      }).
      catch((err) => {
        debug('Unable to get flight data', err);
        res.status(500).send(err);
      });
    }
  )

  app.post('/api/autocomplete/airport', isAuthenticated, 
    function(req, res) {
    console.log(req);
      ic.
      api('autocomplete', req.body).
      then((response) => {
        res.send(response.airports);
      }).
      catch((err) => {
        res.status(404).send(err);
      })
    }
  );
}

function minutesToOffset(minutes) {
  var positive = Math.abs(minutes);
  var hh = Math.floor(positive / 60);
  var mm = positive % 60;
  var sign = (minutes < 0) ? "-" : "+";
  return sign + ('00' + hh.toString()).slice(-2) + ('00' + mm.toString()).slice(-2);
}