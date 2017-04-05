var config = require('../../knexfile.js'),
    env = process.env.NODE_ENV || 'development',
    model = require('./model'),
    moment = require('moment'),
    knex = require('knex')(config[env]);

function init() {
  return knex.migrate.latest([config]);
}

function prefix_names(table, prefix, fields)
{
    if (fields instanceof Array) {
        return fields.map(field_name => table + '.' + field_name+' as '+prefix + field_name);
    }
    else {
        return Array.prototype.slice.call(arguments).map(field_name => table + '.' + field_name+' as '+prefix + field_name);
    }
}

module.exports = knex;
module.exports.init = init;
module.exports.getUpcomingFlights = function() {
  var now = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  return knex.
    select('*').
    from('flights').
    where('to_time', '>=', now).
    orderBy('from_time').
    map(function(record) {
      return model.restructure(record);
    }).
    map(addFlightTimestampFields)
}

module.exports.getAllFlights = function() {
  var now = Date.getUtcTimestamp();
  return knex.
    select('*').
    from('flights').
    orderBy('from_time').
    map(function(record) {
      return model.restructure(record);
    }).
    map(addFlightTimestampFields)
}


module.exports.getGpsLog = function(limit) {
  limit = limit || 20;
  return knex.
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
  limit(limit).
  map(function(record) { 
    return model.restructure(record); 
  }).
  then(
    function(data) {
      data.reverse();
      return Promise.resolve(data);
    }
  )
}

Date.getUtcTimestamp = function() {
  var now = new Date();
  return Math.floor(now.getTime() / 1000 + now.getTimezoneOffset() * 60);
}

function addFlightTimestampFields(flight) {
  flight.from.timestamp = moment.utc(flight.from.time).unix();
  flight.to.timestamp = moment.utc(flight.to.time).unix();
  return flight;
}

module.exports.addFlightTimestampFields = addFlightTimestampFields;