var querystring = require('querystring');
var gpsserver = require('../server');

module.exports = {
  type: 'http',
  parse: function(req, res) {
    var up = req.url.split('?');
    console.log(req.url);

    if (up.length === 2) {
      var qs = querystring.parse(up[1]);
      console.log(qs);

      var timestamp;
      try {
        timestamp = new Date(qs.timestamp).toISOString();
      } catch(err) {
        console.log(err);
        timestamp = new Date().toISOString();
      }        

      var course = qs.heading || qs.bearing || '0';
      var speed = qs.speed || '0';

      try {
        var result = {
          raw: up[1],
          datetime: timestamp,
          id: qs.id || qs.deviceid || null,
          gps: {
            date: timestamp.split("T")[0],
            time: timestamp.split("T")[1],
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
        console.log(err);
        return null;
      }
    }
   
    return null;
  }
}