module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('pages/index', { googleapikey: process.env.GOOGLE_MAPS_CLIENT_KEY, renderflightpath: false });
  });

  app.post('/', function(req, res) {
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
}