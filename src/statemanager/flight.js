var 
  events = require('../events'),
  log = require('../lib/log'),
  db = require('../server/db'),
  moment = require('moment'),
  debug = require('debug')('whereis:statemanager:flight'),
  io = require('../server/client-io');


var upcomingFlights = [];
var nextFlightTimeout;
var currentFlightTimeout;


function init() {
  events.on('command:startflight', function(data) {
    db('flights').
    select('*').
    where('id', data.id).
    map(function(record) {
      return model.restructure(record);
    }).
    map(addTimestampFields).
    then((records) => {
      var flightData = records[0];
      var flightTime = flightData.to.timestamp - flightData.from.timestamp;
      
      if (flightData.flightnumber)
        flightData.flightnumber = flightData.flightnumber.toUpperCase();

      flightData.from.timestamp = Date.getUtcTimestamp();
      flightData.from.time = moment.utc(flightData.from.timestamp * 1000).format('YYYY-MM-DD HH:mm:ss');
      flightData.to.timestamp = flightData.from.timestamp + flightTime;
      flightData.from.time = moment.utc(flightData.from.timestamp * 1000 + flightTime).format('YYYY-MM-DD HH:mm:ss');

      log.debug('command:startflight', flightData);
      setCurrentFlight(flightData);
    })
  })
  events.on('created:flight', function(data) {
    debug("new flight added", data);
    upcomingFlights.push(data);
    upcomingFlights.sort(byFromTime);
    debug("upcomingFlights", upcomingFlights.map(function(flight) { return flight.from.timestamp; }));
    checkForCurrentFlight();
  })

  var now = Date.getUtcTimestamp();
  db.
  getUpcomingFlights().
  then(
    function(flights) {
      debug("loaded flights:", flights);
      upcomingFlights = 
        flights.
        filter(
          function(flight) { 
            return (flight.from.timestamp >= now || flight.to.timestamp > now);
          }
        ).
        map(
          function(flight) { 
            if (flight.flightnumber)
              flight.flightnumber = flight.flightnumber.toUpperCase();
            return flight; 
          }
        );
      log.debug("Upcoming flights", flights.map((f) => { return f.from.timestamp; }));
      checkForCurrentFlight();
    }
  );

  function checkForCurrentFlight() 
  {
    debug('checkForCurrentFlight()');
    var now = Date.getUtcTimestamp();
    // remove finished flights
    while(upcomingFlights.length > 0 && upcomingFlights[0].to.timestamp <= now) upcomingFlights.shift();

    if (upcomingFlights.length > 0) {

      if (nextFlightTimeout)
        clearTimeout(nextFlightTimeout);

      var firstFlight = upcomingFlights.slice(0,1)[0];
      var now = Date.getUtcTimestamp();

      debug("now", now, "firstFlight", firstFlight);

      if (firstFlight.from.timestamp <= now && firstFlight.to.timestamp > now) {
        setCurrentFlight(firstFlight);
      } else {
        var msToNextCheck = (firstFlight.from.timestamp - now) * 1000;
        if (msToNextCheck > 2147483647) 
          msToNextCheck = 2147483647;

        debug("setting timeout to check for flight:", msToNextCheck);
        nextFlightTimeout = setTimeout(
          function() { 
            debug("nextFlightTimeout elapsed"); 
            checkForCurrentFlight(); 
          }, 
          msToNextCheck
        );
      }
    }   
  }


  function setCurrentFlight(flight) 
  {
    events.emit('flight_started', flight);
    currentFlightTimeout = setTimeout(function() {
      events.emit('flight_ended', flight);
      checkForCurrentFlight();
    }, 
    (flight.to.timestamp - Date.getUtcTimestamp()) * 1000)
  }

}

function byFromTime(a, b) 
{
  if (a.from.timestamp < b.from.timestamp) return -1;
  if (a.from.timestamp > b.from.timestamp) return 1;
  return 0;
}


function addTimestampFields(flight) {
  flight.from.timestamp = moment.utc(flight.from.time).unix();
  flight.to.timestamp = moment.utc(flight.to.time).unix();
  return flight;
}

module.exports.init = init;