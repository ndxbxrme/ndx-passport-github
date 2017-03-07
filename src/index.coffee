'use strict'

GithubStrategy = require('passport-github').Strategy
ObjectID = require 'bson-objectid'
objtrans = require 'objtrans'

module.exports = (ndx) ->
  ndx.settings.GITHUB_KEY = process.env.GITHUB_KEY or ndx.settings.GITHUB_KEY
  ndx.settings.GITHUB_SECRET = process.env.GITHUB_SECRET or ndx.settings.GITHUB_SECRET
  ndx.settings.GITHUB_CALLBACK = process.env.GITHUB_CALLBACK or ndx.settings.GITHUB_CALLBACK
  ndx.settings.GITHUB_SCOPE = process.env.GITHUB_SCOPE or ndx.settings.GITHUB_SCOPE or 'user,user:email'
  if ndx.settings.GITHUB_KEY
    if not ndx.transforms.github
      ndx.transforms.github =
        email: 'profile.emails[0].value'
        github:
          id: 'profile.id'
          token: 'token'
          name: 'profile.displayName'
          email: 'profile.emails[0].value'
    scopes = ndx.passport.splitScopes ndx.settings.GITHUB_SCOPE
    ndx.passport.use new GithubStrategy
      clientID: ndx.settings.GITHUB_KEY
      clientSecret: ndx.settings.GITHUB_SECRET
      callbackURL: ndx.settings.GITHUB_CALLBACK
      passReqToCallback: true
    , (req, token, refreshToken, profile, done) ->
      if not req.user
        ndx.database.select ndx.settings.USER_TABLE,
          where:
            github:
              id: profile.id
        , (users) ->
          if users and users.length
            if not users[0].github.token
              updateUser = objtrans
                token: token
                profile: profile
              , ndx.transforms.github
              ndx.database.update ndx.settings.USER_TABLE, updateUser, _id: users[0]._id
              return done null, users[0]
            return done null, users[0]
          else
            newUser = objtrans
              token: token
              profile: profile
            , ndx.transforms.github
            newUser._id = ObjectID.generate()
            ndx.database.insert ndx.settings.USER_TABLE, newUser
            return done null, newUser
      else
        updateUser = objtrans
          token: token
          profile: profile
        , ndx.transforms.github
        ndx.database.update ndx.settings.USER_TABLE, updateUser, _id: req.user._id
        return done null, req.user
    ndx.app.get '/api/github', ndx.passport.authenticate('github', scope: scopes)
    , ndx.postAuthenticate
    ndx.app.get '/api/github/callback', ndx.passport.authenticate('github')
    , ndx.postAuthenticate
    ndx.app.get '/api/connect/github', ndx.passport.authorize('github',
      scope: scopes
      successRedirect: '/profile')
    ndx.app.get '/api/unlink/github', (req, res) ->
      user = req.user
      user.github.token = undefined
      user.save (err) ->
        res.redirect '/profile'
        return
      return