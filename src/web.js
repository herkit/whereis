var events = require('./events'),
    log = require('./lib/log'),
    debug = require('debug')('whereis:web');

module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY, renderflightpath: false });
  });

  app.post('/', function(req, res) {
    if (req.body.signed_request) {
      events.emit('viewer:joined', { facebook: req.body.signed_request, session: req.sessionID });
    }
    res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY, isFacebook: true });
  });

  app.get('/facebook', function(req, res) { 
    res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY, isFacebook: true });
  });

  app.get('/flightpathtest', function(req, res) {
    res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY, renderflightpath: true });  
  });

  app.get('/admin', function(req, res) {
    res.render('pages/admin/index', { layout: 'admin', googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY });  
  });

  app.get('/admin/long', function(req, res) {
    res.render('pages/admin/index', { layout: 'admin', googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY });  
  });

}