var cache = require('./lib/geoloccache'),
    events = require('./events'),
    passport = require('./auth');

var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.status(401).send({ error: "You are not authorized" });
}

module.exports = function(app) {
  app.get('/api/geocode/cache/all',
    isAuthenticated,
    function(req, res) {
      cache.getAll(function(err, cache) {
        if (err) {
          events.emit('error', err);
        } else {
          res.status(200).send(cache);    
        }
      })
    }
  )

  app.get('/api/me', isAuthenticated, function(req, res) {
    res.send(req.user);
  });

  app.post('/api/auth', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) { res.status(401).send('Not authorized'); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.status(200).send('ok');
      });
    })(req, res, next);
  });
}