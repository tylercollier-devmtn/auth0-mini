const express = require('express');
const bodyPaser = require('body-parser');
const session = require('express-session');
const massive = require('massive');
const axios = require('axios');

require('dotenv').config();
massive(process.env.CONNECTION_STRING).then(db => app.set('db', db));

const app = express();
app.use(bodyPaser.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
}));
app.use(express.static(`${__dirname}/../build`));

app.get('/auth/callback', (req, res) => {
  // Create a payload to send to Auth0. Include the "auth code" we received (req.query.code).
  const payload = {
    client_id: process.env.REACT_APP_AUTH0_CLIENT_ID,
    client_secret: process.env.REACT_APP_AUTH0_CLIENT_SECRET,
    code: req.query.code,
    grant_type: 'authorization_code',
    redirect_uri: `http://${req.headers.host}/auth/callback`
  }
  
  // Trade above payload for an access token.
  function tradeCodeForAccessToken() {
    return axios.post(`https://${process.env.REACT_APP_AUTH0_DOMAIN}/oauth/token`, payload);
  }

  // Trade acces token for user info.
  function tradeAccessTokenForUserInfo(accessTokenResponse) {
    const accessToken = accessTokenResponse.data.access_token;
    return axios.get(`https://${process.env.REACT_APP_AUTH0_DOMAIN}/userinfo/?access_token=${accessToken}`);
  }
  
  // Store user info in session and database.
  function storeUserInfoInDataBase(userInfo) {
    const userData = userInfo.data;
    return req.app.get('db').find_user_by_auth0_id(userData.sub).then(users => {
      if (users.length) {
        const user = users[0];
        req.session.user = user;
        res.redirect('/');
      } else {
        const createData = [userData.sub, userData.email, userData.name, userData.picture];
        return req.app.get('db').create_user(createData).then(newUsers => {
          const user = newUsers[0];
          req.session.user = user
          res.redirect('/');
        });
      }
    });
  }

  // Final code to be run at the end

  tradeCodeForAccessToken()
  .then(accessToken => tradeAccessTokenForUserInfo(accessToken))
  .then(userInfo => storeUserInfoInDataBase(userInfo))
  .catch(error => {
    const message = 'An error occurred on the server. See the terminal.';
    console.log('Server error: ' + message);
    res.status(500).json({ message });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.send();
});

app.get('/api/user-data', (req, res) => {
  res.json({ user: req.session.user });
});

function checkLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(403).json({ message: 'Unauthorized' });
  }
}

app.get('/api/secure-data', checkLoggedIn, (req, res) => {
  res.json({ someSecureData: req.session.user.auth0_id + ' unique id for ' + req.session.user.profile_name});
});

const SERVER_PORT = process.env.SERVER_PORT || 3040;
app.listen(SERVER_PORT, () => {
  console.log('Server listening on port ' + SERVER_PORT);
});
