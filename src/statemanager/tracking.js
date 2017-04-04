var events = require('../events'),
    debug = require('debug')('whereis:statemanager:trackingmanager'),
    db = require('../server/db'),
    LatLon = require('../static/app/geo'),
    polyUtil = require('polyline-encoded');

var minimumMovement = 20;
var history = {};
var currentDevice;
var isActive = false;

function init() {
  events.on('track', function(track) {
    var deviceId = track.id;
    if (!history[deviceId]) history[deviceId] = [];
    history[deviceId].push(track);
    track.trail = getHistoryTrail(deviceId);

    checkIfActive(deviceId);
    debug("currentDevice", currentDevice, "thisDevice", deviceId);

    if (deviceId === currentDevice && isActive)
      events.emit('lasttrack', track)
  });

  db.
  getGpsLog(40).
  then(function(gpslog) {
    history = gpslog.reduce(function(result, track) {
      if (!result[track.id]) result[track.id] = [];
      result[track.id].push(track);
      return result;
    }, {});
    debug(history);

    var lasttrack = gpslog.slice(-1).pop();
    if (lasttrack) {
      currentDevice = lasttrack.id;
      events.emit("lasttrack", lasttrack);
    }
    else
      currentDevice = null;
  })
}

function checkIfActive(deviceId) {
  debug("devices:", Object.keys(history));
  var activity = Object.keys(history).map(function(deviceId) {
    var maxMovement = 
      history[deviceId].
      filter(forSeconds(240)).
      map(function(track) 
      {
        return new LatLon(track.geo.latitude, track.geo.longitude);
      }).
      reduce(function(status, current) 
      {
        if (status === -1) return { last: current, distance: 0 };
        var distance = status.last.distanceTo(current);
        if (distance > status.distance) status.distance = distance;
        status.last = current;
        return status;
      }, -1)
    return { deviceId: deviceId, maxMoved: maxMovement.distance || 0 };
  })
  activity.sort(function(a, b) { 
    if (a.maxMoved > b.maxMoved) return -1; 
    if (a.maxMoved < b.maxMoved) return 1; return 0 
  })
  var mostActive = activity[0];
  currentDevice = mostActive.deviceId;
  isActive = (mostActive.maxMoved > minimumMovement);
  debug("activity", activity, "mostActive", mostActive, "isActive", isActive);
}

function getHistoryTrail(deviceId) {
  var trail = 
    history[deviceId].
    filter(forSeconds(300)).
    map(function(entry) {
      return { lat: entry.geo.latitude, lng: entry.geo.longitude };
    });

  debug('trail', trail);
  return polyUtil.encode(trail);
}

function forSeconds(seconds) {
  return function(entry) {
    var d = new Date(entry.datetime);
    var tstamp = d.getTime() / 1000 + d.getTimezoneOffset() * 60;
    var now = Date.getUtcTimestamp();
    return (now - tstamp < seconds);
  }
}

module.exports.init = init;