var tracker = require ('./lib/gpsreceiver/server');
var express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    path = require('path'),
    geocode = require('./lib/geocode'),
    db = require('./server/db');

// start server
tracker.createServer ({
  protocols: {
    'tk102': 10001,
    'tk102-clone1': 10002,
    'osmand': 10003
  }
});

var history = [];

db.
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
limit(10).
map(function(record) { 
  return restructure(record); 
}).then(function(data) {
  data.reverse();
  history = data; 
  io.emit('track', history.slice(-1).pop());
});

function prefix_names(table, prefix, fields)
{
    if (fields instanceof Array) {
        return fields.map(field_name => table + '.' + field_name+' as '+prefix + field_name);
    }
    else {
        return Array.prototype.slice.call(arguments).map(field_name => table + '.' + field_name+' as '+prefix + field_name);
    }
}

// incoming data, i.e. update a map
tracker.on ('track', function (track) {
  console.log("Position received: " + track.geo.latitude + ", " + track.geo.longitude);
  db('gpslog').
  insert(flatten(track)).
  returning('logid').
  then(function(logid) {
    geocode.reverseGeo({ lat: track.geo.latitude, lng: track.geo.longitude }, function(err, address) {
      if (err) {
        track.address = { error: err };
      } else {
        track.address = address;
        db('geolookup').
        insert(Object.assign(flatten(address), { latitude: track.geo.latitude, longitude: track.geo.longitude })).
        returning('lookupid').
        then(function(lookupid) {
          db('gpslog').where('logid', logid[0]).update({ 'lookupid': lookupid[0] }).then(() => { console.log("stored address"); });
        });
      }
      io.emit('track', track);
      history.push(track);
    })  
  });
});

io.on('connection', function(socket) {
  if (history.length > 0) {
    var current = history.slice(-1).pop();
    console.log("socket.io connected sending last known position");
    socket.emit('track', current);
  }
})

tracker.on('error', function (err) {
  console.log('error', err.reason);
})

console.log(process.env.FACEBOOK_APP_ID);
console.log(process.env.FACEBOOK_SECRET);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function(req, res) {
  res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY });
});

app.post('/', function(req, res) {
  res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY });
});

server.listen(3001, function (err) {
  if (err)
    console.log(err);
})

function flatten(o, prefix, separator) {
  separator = separator || '_';
  prefix = prefix ? prefix + separator : '';
  var result = {};
  var keys = Object.keys(o).forEach(function(prop) {
    if (o.hasOwnProperty(prop))
    {
      if (typeof o[prop] === "object") {
        result = Object.assign(result, flatten(o[prop], prefix + prop));
      } else {
        result[prefix + prop] = o[prop];
      }
    }    
  });
  return result;
}

function restructure(o, separator) {
  separator = separator || "_";
  var result = {};
  var keys = Object.keys(o).forEach(function(prop) {
    if (o.hasOwnProperty(prop))
    {
      var properties = prop.split(separator);
      var value = o[prop];
      current = result;
      for(var level = 0; level < properties.length; level++) {
        if (level < properties.length - 1) {
          current[properties[level]] = current[properties[level]] || {};
        } else {
          current[properties[level]] = value;
        }
        current = current[properties[level]];
      }
    }
  });
  return result;
}