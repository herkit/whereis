var events = require('./events'),
    log = require('./lib/log'),
    debug = require('debug')('whereis:web');

module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY, renderflightpath: false });
  });

  app.post('/', function(req, res) {
    if (req.body.signed_request) {
      req.session.facebook = JSON.parse(req.body.signed_request);
    }
    res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY, isFacebook: true });
  });

  app.get('/facebook', function(req, res) { 
    res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY, isFacebook: true });
  });

  app.get('/admin', function(req, res) {
    res.render('pages/admin/index', { layout: 'admin', googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY });  
  });

}