var 
  events = require('./events'),
  log = require('./lib/log'),
  debug = require('debug')('whereis:statemanager'),
  io = require('./server/client-io');

var state = { };

var history = [];
var upcomingFlights = [];

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

  });

  function setCurrentFlight(flight) {
    log.debug('Entering flightmode', flight.from.code, flight.to.code);
    current.state = 'flight';
    current.data = flight;
    current.stateTimeout = setTimeout(function() {
      var toLoc = current.data.to.location;
      log.debug('Exiting flightmode');
      current.state = 'track';
      current.data = { datetime: new Date(current.data.to.timestamp * 1000).toISOString(), geo: { lat: toLoc.latitude, lng: toLoc.longitude }, gps: { accuracy: 100 }, address: { address: current.data.to.name } };
      emitCurrent();
    }, (flight.to.timestamp - Date.getUtcTimestamp()) * 1000);      
    emitCurrent();
  }

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

    io.emit(current.state, current.data);
  }

  io.on('connection', function(socket) {
    emitCurrent();
  })
}

module.exports.init = init;