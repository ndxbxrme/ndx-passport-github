(function() {
  'use strict';
  module.exports = function(ndx) {
    var GithubStrategy, ObjectID;
    GithubStrategy = require('passport-github').Strategy;
    ObjectID = require('bson-objectid');
    ndx.settings.GITHUB_KEY = process.env.GITHUB_KEY || ndx.settings.GITHUB_KEY;
    ndx.settings.GITHUB_SECRET = process.env.GITHUB_SECRET || ndx.settings.GITHUB_SECRET;
    ndx.settings.GITHUB_CALLBACK = process.env.GITHUB_CALLBACK || ndx.settings.GITHUB_CALLBACK;
    if (ndx.settings.GITHUB_KEY) {
      ndx.passport.use(new GithubStrategy({
        clientID: ndx.settings.GITHUB_KEY,
        clientSecret: ndx.settings.GITHUB_SECRET,
        callbackURL: ndx.settings.GITHUB_CALLBACK,
        passReqToCallback: true
      }, function(req, token, refreshToken, profile, done) {
        var newUser, users;
        if (!req(user)) {
          users = ndx.database.exec('SELECT * FROM ' + ndx.settings.USER_TABLE + ' WHERE github->id=?', [profile.id]);
          if (users && users.length) {
            if (!users[0].github.token) {
              ndx.database.exec('UPDATE ' + ndx.settings.USER_TABLE + ' SET github=? WHERE _id=?', [
                {
                  token: token,
                  name: profile.displayName,
                  email: profile.emails[0].value
                }, req.user._id
              ]);
              return done(null, users[0]);
            }
            return done(null, users[0]);
          } else {
            newUser = {
              _id: ObjectID.generate(),
              github: {
                id: profile.id,
                token: token,
                name: profile.displayName,
                email: profile.emails[0].value
              }
            };
            ndx.database.exec('INSERT INTO ' + ndx.settings.USER_TABLE + ' VALUES ?', [newUser]);
            return done(null, newUser);
          }
        } else {
          ndx.database.exec('UPDATE ' + ndx.settings.USER_TABLE + ' SET github=? WHERE _id=?', [
            {
              id: profile.id,
              token: token,
              name: profile.displayName,
              email: profile.emails[0].value
            }, req.user._id
          ]);
          return done(null, req.user);
        }
      }));
      ndx.app.get('/api/github', ndx.passport.authenticate('github', {
        scope: ['user', 'user:email']
      }), ndx.postAuthenticate);
      ndx.app.get('/api/github/callback', ndx.passport.authenticate('github'), ndx.postAuthenticate);
      ndx.app.get('/api/connect/github', ndx.passport.authorize('github', {
        scope: ['user', 'user:email'],
        successRedirect: '/profile'
      }));
      return ndx.app.get('/api/unlink/github', function(req, res) {
        var user;
        user = req.user;
        user.github.token = void 0;
        user.save(function(err) {
          res.redirect('/profile');
        });
      });
    }
  };

}).call(this);

//# sourceMappingURL=index.js.map
