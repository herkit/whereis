var gpsserver = require('../server'),
    Parser = require('../parser').Parser,
    CoordinateFormat = require('../parser').CoordinateFormat,
    debug = require('debug')('whereis:gpsreceiver:protocol:xexun');

module.exports = {
  encoding: 'utf8',
  type: 'socket',
  parse: function(raw, options) {
    if (!options) options = {};
    debug(raw);
    var basic = 'G[PN]RMC,(?:(\\d{2})(\\d{2})(\\d{2}))?\\.(\\d+),?([AV]),(\\d*?)(\\d?\\d\\.\\d+),([NS]),(\\d*?)(\\d?\\d\\.\\d+),([EW])?,(\\d+\\.?\\d*),(\\d+\\.?\\d*)?,(?:(\\d{2})(\\d{2})(\\d{2}))?,[^*]*\\*[0-9a-fA-F]{2}(?:\\r\\n)?,([FL]),(?:([^,]*),)?.*imei:(\\d+),';
    var parser;
    if (options.full) {
      var full = '.*(\\d*)?,([^,]+)?,' + basic + '(\\d+),(-?\\d+\\.\\d+)?,[FL]:(\\d+\\.\\d+)V.+';
      parser = new Parser(full, raw);
    } else {
      parser = new Parser(basic, raw);
    }

    if (!parser.matches())
    {
      debug('no match to xexun protocol!');
      return null;
    }

    var position = {
      protocol: 'xexun',
      geo: {},
      gps: { speed: {} },
      extra: { }
    }

    if (options.full)
    {
      position.serial = parser.next();
      position.number = parser.next();
    }

    var timeparts = [parser.nextInt(), parser.nextInt(), parser.nextInt(), parser.nextInt()];

    position.gps.fix = parser.next() == 'A';
    position.geo.latitude = parser.nextCoordinate();
    position.geo.longitude = parser.nextCoordinate();
    position.gps.speed.knots = parser.nextFloat();
    position.geo.bearing = parser.nextFloat();

    var dateparts = [parser.nextInt(), parser.nextInt(), parser.nextInt()];
    dateparts.reverse();
    dateparts = dateparts.map(fixDateParts);

    var allparts = dateparts.concat(timeparts);
    var date = new Date(Date.UTC.apply(null, allparts));

    position.datetime = date;

    position.gps.signal = parser.next();

    position.extra.alarm = parser.next();

    position.id = parser.next();

    return position;
  }
}

function fixDateParts(p, i) { 
  if (p) {
    var datepart = parseInt(p);
    if (i == 1)
      datepart--; 
    if (i == 0 && datepart < 100) {
      datepart += datepart < 40 ? 2000 : 1900;
    }
    return datepart;
  }
}