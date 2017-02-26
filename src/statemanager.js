var 
  events = require('./events'),
  log = require('./lib/log'),
  debug = require('debug')('whereis:statemanager'),
  Promise = require('bluebird'),
  db = require('./server/db'),
  io = require('./server/client-io'),
  LatLon = require('./static/app/geo'),
  polyUtil = require('polyline-encoded');

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
      
      if (flightData.flightnumber)
        flightData.flightnumber = flightData.flightnumber.toUpperCase();

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
      emitCurrent(io);
      if (trackTimeout) clearTimeout(trackTimeout);
      trackTimeout = setTimeout(emitCurrent, 120000, io);
    }
  });

  var now = Date.getUtcTimestamp();
  log.debug('find flights active after', now);
  Promise.all([
    db.getGpsLog(20),
    db.getUpcomingFlights()
  ]).
  spread((gpslog, flights) => {
    history = gpslog;
    upcomingFlights = flights.map(function(flight) { 
      if (flight.flightnumber)
        flight.flightnumber = flight.flightnumber.toUpperCase();
      return flight; 
    });

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
        emitCurrent(io);
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
      history = [current.data];
      emitCurrent(io);
    }, (flight.to.timestamp - Date.getUtcTimestamp()) * 1000);      
    emitCurrent(io);
  }

  function emitCurrent(socket)
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
    dataToSend.trail = getHistoryTrail();

    socket.emit(current.state, dataToSend);
  }

  function getHistoryTrail() {
    var trail = history.filter(function(entry) {

      var d = new Date(entry.datetime);
      var tstamp = d.getTime() / 1000 + d.getTimezoneOffset() * 60;
      var now = Date.getUtcTimestamp();
      debug('age', now - tstamp);
      return (now - tstamp < 300);
    }).map(function(entry) {
      return { lat: entry.geo.latitude, lng: entry.geo.longitude };
    });

    debug('trail', trail);
    return polyUtil.encode(trail);
  }

  io.on('connection', function(socket) {
    //debug("socket io connection session request", socket.request)
    socket.on('iam', function(me) {
      events.emit('viewer:joined', me);
      emitCurrent(socket);
    })
  })
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

module.exports.init = init;