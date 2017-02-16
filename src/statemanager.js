var 
  events = require('./events'),
  io = require('./server/client-io');

var state = { };

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
events.on('created:flight', function(data) {
  upcomingFlights.push(data);
  upcomingFlights.sort(function(a, b) {
    if (a.from.timestamp > b.from.timestamp) return -1;
    if (a.from.timestamp < b.from.timestamp) return 1;
    return 0;
  });
})

function setCurrentFlight(flight) {
  log.debug('Entering flightmode', flight.from.code, flight.to.code);
  current.state = 'flight';
  current.data = flight;
  current.stateTimeout = setTimeout(function() {
    var toLoc = current.data.to.location;
    log.debug('Exiting flightmode');
    current.state = 'privacy';
    current.data = { geo: { lat: toLoc.latitude, lng: toLoc.longitude }, address: { address: current.data.to.name } };
    emitCurrent();
  }, (flight.to.timestamp - Date.getUtcTimestamp()) * 1000);      
  emitCurrent();
}

function emitCurrent()
{
  io.emit(current.state, current.data);
}

io.on('connection', function(socket) {
  emitCurrent();
})


module.exports = state;