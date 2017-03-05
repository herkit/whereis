var events = require('./events'),
    debug = require('debug')('whereis:statemanager:trackingmanager'),
    db = require('./server/db'),
    polyUtil = require('polyline-encoded');

var history = [];

function init() {
  events.on('track', function(track) {
    if (current.state === 'track') {
      history.push(track);
      track.trail = getHistoryTrail();
      events.emit('lasttrack', track)
    }
  });

  db.
  getGpsLog(20).
  then(function(gpslog) {
    history = gpslog;
    var lasttrack = history.slice(-1).pop();
    events.emit("lasttrack", lasttrack);
  })
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

module.exports.init = init;