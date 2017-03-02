# ndx-passport-github 
### github login for [ndx-framework](https://github.com/ndxbxrme/ndx-framework) apps
install with   
`npm install --save ndx-passport-github`  
## example
`src/server/app.coffee`  
```coffeescript
require 'ndx-server'
.config
  database: 'db'
.use ndx-passport
.use ndx-passport-github
.start()
```
`src/client/../login.jade`  
```jade
a(href='/api/github', target='_self') Github
```
## environment/config variables  
|environment|config|description|
|-----------|------|-----------|
|GITHUB_KEY|githubKey|your github key|
|GITHUB_SECRET|githubSecret|your github secret|
|GITHUB_CALLBACK|githubCallback|set this to `http(s)://yourservername.com/api/github/callback`|
|GITHUB_SCOPE|githubScope|a list of scopes you want access to|