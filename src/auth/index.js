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
    done(null, getMe(user));
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
      if (password !== user.password) {
        return done(null, false);
      }
      return done(null, getMe(user));
    }).
    catch((err) => {
      done(err);
    })

  })
);

function getMe(user) {  
  var me;
  if (Array.isArray(user)) 
    me = Object.assign({}, user[0]); 
  else 
    me = Object.assign({}, user);

  if (me.password) {
    delete me['password'];
  }
  
  me.apikeys = {
    "iatacodes": process.env.IATACODES_API_KEY,
    "google_maps": process.env.GOOGLE_MAPS_CLIENT_KEY
  }
  return me; 
}

module.exports = passport;