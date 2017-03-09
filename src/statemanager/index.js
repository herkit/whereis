var 
  events = require('../events'),
  log = require('../lib/log'),
  debug = require('debug')('whereis:statemanager'),
  Promise = require('bluebird'),
  io = require('../server/client-io'),
  LatLon = require('../static/app/geo'),
  flightmanager = require('./flight'),
  trackingmanager = require('./tracking');

var state = { };

var history = [];
var trackTimeout;
var staleLimit = 120000;

var settings = {
  privacymode: false
}

var current = {
  state: 'track',
  data: {}
};

function init() {
  events.on('lasttrack', function(lasttrack) {   
    if (trackTimeout) {
      clearTimeout(trackTimeout);
    }
    current.state = 'track';
    current.data = lasttrack;
    emitCurrent(io);
    trackTimeout = setTimeout(function() { emitCurrent(io); }, staleLimit);
  })

  events.on('flight_started', function(flight) {
    log.debug('Entering flightmode', flight.from.code, flight.to.code);
    current.state = 'flight';
    current.data = flight;
    emitCurrent(io);
  });

  events.on('flight_ended', function(flight) {
    log.debug('Exiting flightmode, landed at', flight.to.code);
    var toLoc = flight.to.location;
    current.state = 'track';
    current.data = { datetime: new Date(flight.to.timestamp * 1000).toISOString(), geo: { latitude: toLoc.lat, longitude: toLoc.lng }, gps: { accuracy: 500 }, address: { address: flight.to.name } };
    emitCurrent(io);
  });

  events.on('command:setprivacymode', function(mode) {
    settings.privacymode = mode.value;
    emitCurrent(io);
  })

  flightmanager.init();
  trackingmanager.init();

  io.on('connection', function(socket) {
    //debug("socket io connection session request", socket.request)
    socket.on('iam', function(me) {
      events.emit('viewer:joined', me);
      emitCurrent(socket);
    })
  })
}

function emitCurrent(socket)
{
  var dataToSend = current.data;
  debug("emitCurrent()", current);
  if (current.state === 'track') {
    var tracktime = new Date(current.data.datetime);
    debug("is stale:", tracktime.getTime(), Date.now());
    var age = Date.now() - tracktime.getTime();
    if (age > staleLimit || settings.privacymode) {
      var currentLatLon = new LatLon(current.data.geo.latitude, current.data.geo.longitude);
      var bearing = getRandomInt(0, 360);
      var addDistance = getRandomInt(100, 500);
      debug("adding ", addDistance, "m on bearing", bearing);
      var maskedLatLon = currentLatLon.destinationPoint(addDistance, bearing);
      dataToSend = { geo: { latitude: maskedLatLon.lat, longitude: maskedLatLon.lon }, gps: { accuracy: 250 + Math.min(age/2000, 1000)}, address: current.data.address };
      if (dataToSend.trail)
        delete dataToSend['trail'];
    }
  }

  socket.emit(current.state, dataToSend);
}


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

module.exports.init = init;
module.exports.settings = settings;