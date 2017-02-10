var querystring = require('querystring');
var gpsserver = require('../server'),
    debug = require('debug')('whereis:gpsreceiver:protocol:OsmAnd');

module.exports = {
  type: 'http',
  parse: function(req, res) {
    var up = req.url.split('?');
    debug(req.url);

    if (up.length === 2) {
      var qs = querystring.parse(up[1]);
      var gpstime;
      try {
        if (qs.timestamp > 9999)
          gpstime = new Date(qs.timestamp * 1000).toISOString();
        else
          gpstime = new Date(qs.timestamp).toISOString();
      } catch(err) {
        debug(err);
        gpstime = new Date().toISOString();
      }        

      var course = qs.heading || qs.bearing || '0';
      var speed = qs.speed || '0';

      try {
        var result = {
          raw: up[1],
          datetime: new Date().toISOString(),
          id: qs.id || qs.deviceid || null,
          gps: {
            date: gpstime.split("T")[0],
            time: gpstime.split("T")[1].slice(0, 8),
            signal: 'unknown',
            fix: qs.valid ? 'valid' : 'invalid'
          },
          geo: {
            latitude: parseFloat(qs.lat),
            longitude: parseFloat(qs.lon),
            bearing: parseFloat(course)
          },
          speed: {
            knots: Math.round(parseFloat(speed) * 1000) / 1000,
            kmh: Math.round(parseFloat(speed) * 1852) / 1000,
            mph: Math.round(parseFloat(speed) * 1151) / 1000
          },
          checksum: gpsserver.checksum(up[1])
        }
        return result;
      } catch(err) {
        debug(err);
        return null;
      }
    }
   
    return null;
  }
}