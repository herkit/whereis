var cache = {
      address: []
    },
    LatLon = require('../static/app/geo'),
    debug = require('debug')('whereis:geoloccache');

var options = {
  distance: 1000,
  capacity: 40,
  agelimit: {
    address: 0,
    weather: 300
  }
}

function _get(latlng, type, callback) {
  if (typeof type === 'function') {
    callback = type;
    type = 'address';
  }
  if (!cache[type]) cache[type] = [];
  var needle = new LatLon(latlng.lat, latlng.lng);
  var cacheIndex = cache[type].findIndex(function(entry) {
    if (entry.latlon.distanceTo(needle) < options.distance) {
      if (options.agelimit[type] && options.agelimit[type] > 0) {
        debug('found item in range, checking age', entry);
        if (entry.time > Date.now() - options.agelimit[type] * 1000)
          return true;
      } else {
        debug('found item in range, no age check necessary', entry);
        return true;
      }
    }
    return false;
  });
  if (cacheIndex >= 0)
    callback(null, cache[type][cacheIndex].data);
  else 
  {
    callback(new Error('Not found in cache'));
  }
}

function _add(latlng, data, type) {
  if (!type) type = 'address';
  if (!cache[type]) cache[type] = [];
  cache[type].push({ latlon: new LatLon(latlng.lat, latlng.lng || latlng.lon), time: Date.now(), data: data });
  while (cache[type].length > options.capacity) {
    var removed = cache[type].shift();
    debug("cache capacity reached, removed entry: %s", JSON.stringify(removed));
  }
}

function _getAll(type, callback) {
  if (typeof type === 'function') {
    callback = type;
    type = 'address';
  }
  if (!cache[type]) cache[type] = [];
  callback(null, cache[type]);
}

module.exports = {
  get: _get,
  add: _add,
  getAll: _getAll
}

module.exports.type = function(type) {
  return {
    get: function(latlng, callback) { _get(latlng, type, callback); },
    add: function(latlng, data) { _add(latlng, data, type); },
    getAll: function(callback) { _getAll(type, callback); }
  }
}