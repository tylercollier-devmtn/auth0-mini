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
  axios.post(`https://${process.env.REACT_APP_AUTH0_DOMAIN}/oauth/token`, {
    client_id: process.env.REACT_APP_AUTH0_CLIENT_ID,
    client_secret: process.env.REACT_APP_AUTH0_CLIENT_SECRET,
    code: req.query.code,
    grant_type: 'authorization_code',
    redirect_uri: `http://${req.headers.host}/auth/callback`,
  }).then(accessTokenResponse => {
    const accessToken = accessTokenResponse.data.access_token;
    return axios.get(`https://${process.env.REACT_APP_AUTH0_DOMAIN}/userinfo/?access_token=${accessToken}`).then(userInfoResponse => {
      const userData = userInfoResponse.data;
      return req.app.get('db').find_user_by_auth0_id(userData.sub).then(users => {
        if (users.length) {
          const user = users[0];
          req.session.user = { email: user.email, name: user.profile_name, picture: user.picture };
          res.redirect('/');
        } else {
          const createData = [userData.sub, userData.email, userData.name, userData.picture];
          return req.app.get('db').create_user(createData).then(newUsers => {
            const user = newUsers[0];
            req.session.user = { email: user.email, name: user.profile_name, picture: user.picture };
            res.redirect('/');
          })
        }
      });
    });
  }).catch(error => {
    console.log('error in /auth/callback', error);
    res.status(500).json({ message: 'An unexpected error occurred on the server.'})
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
  res.json({ someSecureData: 123 });
});

const SERVER_PORT = process.env.SERVER_PORT || 3040;
app.listen(SERVER_PORT, () => {
  console.log('Server listening on port ' + SERVER_PORT);
});
