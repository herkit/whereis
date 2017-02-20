var 
  events = require('./events'),
  log = require('./lib/log'),
  debug = require('debug')('whereis:statemanager'),
  Promise = require('bluebird'),
  db = require('./server/db'),
  io = require('./server/client-io'),
  LatLon = require('./static/app/geo');

var state = { };

var history = [];
var upcomingFlights = [];
var trackTimeout;

var current = {
  state: 'track',
  data: {}
};

function init() {
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
  events.on('created:flight', function(data) {
    upcomingFlights.push(data);
    upcomingFlights.sort(function(a, b) {
      if (a.from.timestamp > b.from.timestamp) return -1;
      if (a.from.timestamp < b.from.timestamp) return 1;
      return 0;
    });
  })
  events.on('track', function(track) {
    if (current.state === 'track') {
      history.push(track);
      current.data = track;
      emitCurrent();
      if (trackTimeout) clearTimeout(trackTimeout);
      trackTimeout = setTimeout(emitCurrent, 120000);
    }
  });
  events.on('viewer:joined', function(data) {
    debug('Viewer added', data);
  })

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

  function setCurrentFlight(flight) {
    log.debug('Entering flightmode', flight.from.code, flight.to.code);
    current.state = 'flight';
    current.data = flight;
    current.stateTimeout = setTimeout(function() {
      var toLoc = current.data.to.location;
      log.debug('Exiting flightmode, setting location to', toLoc);
      current.state = 'track';
      current.data = { datetime: new Date(current.data.to.timestamp * 1000).toISOString(), geo: { latitude: toLoc.lat, longitude: toLoc.lng }, gps: { accuracy: 500 }, address: { address: current.data.to.name } };
      emitCurrent();
    }, (flight.to.timestamp - Date.getUtcTimestamp()) * 1000);      
    emitCurrent();
  }

  function emitCurrent()
  {
    var dataToSend = current.data;
    debug(current);
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
    debug("socket io connection session id", socket)
    emitCurrent();
  })
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

module.exports.init = init;