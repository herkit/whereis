var cache = require('./lib/geoloccache'),
    events = require('./events'),
    debug = require('debug')('whereis:api');
    passport = require('./auth'), 
    moment = require('moment'),
    Promise = require('bluebird'),
    db = require('./server/db');

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
      if (!user) { res.status(401).send('Not authorized'); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.status(200).send('ok');
      });
    })(req, res, next);
  });

  app.post('/api/flights', isAuthenticated, function(req, res) {
    var flight = req.body;
    debug('new flight', flight);

    var placeSearchText = Promise.promisify(gmAPI.placeSearchText, { context: gmAPI });

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
      debug("fromairport", fromairport);
      debug("toairport", toairport);
      return {
        from: {
          name: fromairport.results[0].name,
          code: flight.from,
          location: fromairport.results[0].geometry.location,
          timestamp: moment(flight.departure).unix()
        },
        to: {
          name: toairport.results[0].name,
          code: flight.to,
          location: toairport.results[0].geometry.location,
          timestamp: moment(flight.arrival).unix()
        }
      }
    }).
    then((flightdata) => {
      flightdata.createdby = req.user.id;
      db.insert(db.flatten(flightdata)).into('flights').returning('id').then(function(record) {
        flightdata.id = record[0]
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
}