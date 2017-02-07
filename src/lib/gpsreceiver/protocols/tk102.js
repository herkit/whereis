var gpsserver = require('../server');

fixGeo = function (one, two) {
  var minutes = one.substr (-7, 7);
  var degrees = parseInt (one.replace (minutes, ''), 10);

  one = degrees + (minutes / 60);
  one = parseFloat ((two === 'S' || two === 'W' ? '-' : '') + one);

  return Math.round (one * 1000000) / 1000000;
};


module.exports = {
  encoding: 'utf8',
  type: 'socket',
  parse: function(raw) {
    var result = null;
    var str = [];
    var datetime = '';
    var gpsdate = '';
    var gpstime = '';

    try {
      raw = raw.trim ();
      str = raw.split (',');

      if (str.length === 18 && str [2] === 'GPRMC') {
        datetime = str [0] .replace (/([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, function (s, y, m, d, h, i) {
          return '20' + y + '-' + m + '-' + d + ' ' + h + ':' + i;
        });

        gpsdate = str [11] .replace (/([0-9]{2})([0-9]{2})([0-9]{2})/, function (s, d, m, y) {
          return '20' + y + '-' + m + '-' + d;
        });

        gpstime = str [3] .replace (/([0-9]{2})([0-9]{2})([0-9]{2})\.([0-9]{3})/, function (s0, h, i, s, ms) {
          return h + ':' + i + ':' + s + '.' + ms;
        });

        result = {
          raw: raw,
          datetime: datetime,
          id: str [1],
          gps: {
            date: gpsdate,
            time: gpstime,
            signal: str [15] === 'F' ? 'full' : 'low',
            fix: str [4] === 'A' ? 'active' : 'invalid'
          },
          geo: {
            latitude: fixGeo (str [5], str [6]),
            longitude: fixGeo (str [7], str [8]),
            bearing: parseInt (str [10], 10)
          },
          speed: {
            knots: Math.round (str [9] * 1000) / 1000,
            kmh: Math.round (str [9] * 1.852 * 1000) / 1000,
            mph: Math.round (str [9] * 1.151 * 1000) / 1000
          },
          checksum: gpsserver.checksum (raw)
        };
      }
    } catch (e) {
      result = null;
    }

    return result;
  }
}