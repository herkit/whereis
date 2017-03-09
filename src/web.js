var events = require('./events'),
    log = require('./lib/log'),
    db = require('./server/db'),
    debug = require('debug')('whereis:web');

module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY, renderflightpath: false });
  });

  app.post('/', function(req, res) {
    if (req.body.signed_request) {
      req.session.facebook = req.body.signed_request;
    }
    res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY, isFacebook: true });
  });

  app.get('/facebook', function(req, res) { 
    res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY, isFacebook: true });
  });

  app.get('/admin', function(req, res) {
    res.render('pages/admin/index', { layout: 'admin', googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY });  
  });

  app.get('/api/statesvisited', function(req, res) {
    db('geolookup').distinct('state', 'state_long').where('country', 'US').then(function(states) {
      res.status(200).json(states);
    }).catch(function() {
      res.status(404).end();
    })
  });

}