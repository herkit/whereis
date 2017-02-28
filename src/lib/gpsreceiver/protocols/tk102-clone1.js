var gpsserver = require('../server'),
    debug = require('debug')('whereis:gpsreceiver:protocol:tk102-clone1');

module.exports = {
  encoding: 'utf8',
  type: 'socket',
  parse: function(raw) {
    //(087073819397BR00170205A6022.8269N00518.7227E000.3172029000.00,00000000L00000000)
    debug(raw);
    var rex = /\((\d+)BR\d{2}(\d{2})(\d{2})(\d{2})([AV])(\d{4}\.\d{4})([NS])(\d{5}\.\d{4})([EW])(\d+\.\d)(\d{2})(\d{2})(\d{2})(\d+\.\d+),(\d+)\w(\d+)\)/;
    var result = null;
    var match = raw.match(rex);

    try {
      raw = raw.trim();

      if (match) {
        var [, imei, yy, mm, dd, validity, lat, ns, lng, ew, speed, hh, nn, ss, course] = match;

        result = {  
          raw: raw,
          datetime: '20' + yy + '-' + mm + '-' + dd + 'T' + hh + ':' + nn + ':' + ss,
          id: imei,
          gps: {
            date: '20' + yy + '-' + mm + '-' + dd,
            time: hh + ':' + nn + ':' + ss,
            signal: 'unknown',
            fix: validity === 'A' ? 'active' : 'invalid'
          },
          geo: {
            latitude: gpsserver.fixGeo(lat, ns),
            longitude: gpsserver.fixGeo(lng, ew),
            bearing: parseFloat(course)
          },
          speed: {
            knots: Math.round(parseFloat(speed) * 1000) / 1000,
            kmh: Math.round(parseFloat(speed) * 1852) / 1000,
            mph: Math.round(parseFloat(speed) * 1151) / 1000
          },
          checksum: gpsserver.checksum(raw)
        };
      }
    } catch (e) {
      result = null;
    }
    
    return result;
  }
}