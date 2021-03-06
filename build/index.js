(function() {
  'use strict';
  var GithubStrategy, objtrans;

  GithubStrategy = require('passport-github').Strategy;

  objtrans = require('objtrans');

  module.exports = function(ndx) {
    var scopes;
    ndx.settings.GITHUB_KEY = process.env.GITHUB_KEY || ndx.settings.GITHUB_KEY;
    ndx.settings.GITHUB_SECRET = process.env.GITHUB_SECRET || ndx.settings.GITHUB_SECRET;
    ndx.settings.GITHUB_CALLBACK = process.env.GITHUB_CALLBACK || ndx.settings.GITHUB_CALLBACK;
    ndx.settings.GITHUB_SCOPE = process.env.GITHUB_SCOPE || ndx.settings.GITHUB_SCOPE || 'user,user:email';
    if (ndx.settings.GITHUB_KEY) {
      if (!ndx.transforms.github) {
        ndx.transforms.github = {
          email: 'profile.emails[0].value',
          github: {
            id: 'profile.id',
            token: 'token',
            name: 'profile.displayName',
            email: 'profile.emails[0].value'
          }
        };
      }
      scopes = ndx.passport.splitScopes(ndx.settings.GITHUB_SCOPE);
      ndx.passport.use(new GithubStrategy({
        clientID: ndx.settings.GITHUB_KEY,
        clientSecret: ndx.settings.GITHUB_SECRET,
        callbackURL: ndx.settings.GITHUB_CALLBACK,
        passReqToCallback: true
      }, function(req, token, refreshToken, profile, done) {
        var updateUser, where;
        if (!ndx.user) {
          return ndx.database.select(ndx.settings.USER_TABLE, {
            where: {
              github: {
                id: profile.id
              }
            }
          }, function(users) {
            var newUser, updateUser, where;
            if (users && users.length) {
              if (!users[0].github.token) {
                updateUser = objtrans({
                  token: token,
                  profile: profile
                }, ndx.transforms.github);
                where = {};
                where[ndx.settings.AUTO_ID] = users[0][ndx.settings.AUTO_ID];
                ndx.database.update(ndx.settings.USER_TABLE, updateUser, where, null, true);
                ndx.user = users[0];
                return done(null, users[0]);
              }
              ndx.user = users[0];
              if (ndx.auth) {
                ndx.auth.extendUser();
              }
              ndx.passport.syncCallback('login', ndx.user);
              return done(null, users[0]);
            } else {
              newUser = objtrans({
                token: token,
                profile: profile
              }, ndx.transforms.github);
              newUser[ndx.settings.AUTO_ID] = ndx.generateID();
              ndx.database.insert(ndx.settings.USER_TABLE, newUser, null, true);
              ndx.user = newUser;
              if (ndx.auth) {
                ndx.auth.extendUser();
              }
              ndx.passport.syncCallback('signup', ndx.user);
              return done(null, newUser);
            }
          }, true);
        } else {
          updateUser = objtrans({
            token: token,
            profile: profile
          }, ndx.transforms.github);
          where = {};
          where[ndx.settings.AUTO_ID] = ndx.user[ndx.settings.AUTO_ID];
          ndx.database.update(ndx.settings.USER_TABLE, updateUser, where, null, true);
          return done(null, ndx.user);
        }
      }));
      ndx.app.get('/api/github', ndx.passport.authenticate('github', {
        scope: scopes
      }), ndx.postAuthenticate);
      ndx.app.get('/api/github/callback', ndx.passport.authenticate('github'), ndx.postAuthenticate);
      ndx.app.get('/api/connect/github', ndx.passport.authorize('github', {
        scope: scopes,
        successRedirect: '/profile'
      }));
      return ndx.app.get('/api/unlink/github', function(req, res) {
        var user;
        user = ndx.user;
        user.github.token = void 0;
        user.save(function(err) {
          res.redirect('/profile');
        });
      });
    }
  };

}).call(this);

//# sourceMappingURL=index.js.map
