var tracker = require ('./lib/gpsreceiver/server');

// start server
tracker.createServer ({
  protocols: {
    'tk102': 5006,
    'tk102-clone1': 5007,
  }
});

// incoming data, i.e. update a map
tracker.on ('track', function (gps) {
  console.log(gps);
});

tracker.on('error', function (err) {
  console.log(err);
})