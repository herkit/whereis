var cache = [],
    LatLon = require('../static/app/geo'),
    debug = require('debug')('whereis:geoloccache');

var options = {
  distance: 1000,
  capacity: 40
}

function get(latlng, callback) {
  var needle = new LatLon(latlng.lat, latlng.lng);
  var cacheIndex = cache.findIndex(function(entry) {
    if (entry.latlon.distanceTo(needle) < options.distance) return true;
  });
  if (cacheIndex >= 0)
    callback(null, cache[cacheIndex].address);
  else 
  {
    callback(new Error('Not found in cache'));
  }
}

function add(latlng, address) {
  cache.push({ latlon: new LatLon(latlng.lat, latlng.lng || latlng.lon), address: address });
  while (cache.length > options.capacity) {
    var removed = cache.shift();
    debug("cache capacity reached, removed entry: %s", JSON.stringify(removed));
  }
}

function getAll(callback) {
  callback(null, cache);
}

module.exports = {
  get: get,
  add: add,
  getAll: getAll
}