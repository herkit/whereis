var passport = require('passport'),
    LocalStrategy = require('passport-local'),
    db = require('../server/db'),
    debug = require('debug')('whereis:auth');

passport.serializeUser(function(user, done) {
  debug("serializeUser", user);
  done(null, user.id);
});
 
passport.deserializeUser(function(id, done) {
  db('users').
  select('*').
  where('id', id).
  then(function(records) {
    var user = records[0];
    done(null, user);
  }).
  catch((err) => {
    done(err);
  })
});

passport.use('local', 
  new LocalStrategy(
  {
    passReqToCallback : true
  },
  function(req, username, password, done) { 
    // check in mongo if a user with username exists or not
    debug('authenticating %s:%s', username, password);
    db('users').
    select('*').
    where('username', username).
    then((records) => {
      var user = records[0];

      if (!user) {
        return done(null, false);
      }
      debug('user found', user);
      if (password !== user.password) {
        return done(null, false);
      }
      return done(null, user);
    }).
    catch((err) => {
      done(err);
    })

  })
);

module.exports = passport;