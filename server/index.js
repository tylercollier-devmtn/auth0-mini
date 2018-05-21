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
  
  
  
  // STEP 1.)
  //code for auth0 recieved from client side in req.query.code
  //object payload being sent to auth0 that includes our code we recieved from the client as req.query.code
  
  var payLoad = {
    client_id: process.env.REACT_APP_AUTH0_CLIENT_ID,
    client_secret: process.env.REACT_APP_AUTH0_CLIENT_SECRET,
    code: req.query.code,
    grant_type: 'authorization_code',
    redirect_uri: `http://${req.headers.host}/auth/callback`
  }
  
  //STEP 2.)
  // trading above payload for an access token
  
  function tradeCodeForAccessToken(){
    console.log('hit' , 'tradeCodeForAccessToken')
    return axios.post(`https://${process.env.REACT_APP_AUTH0_DOMAIN}/oauth/token`, payLoad)
  }
  
  //STEP 3.)
  // trade accesToken for user info
  
  function tradeAccessTokenForUserInfo(accessTokenResponse){
    
    console.log('hit' , 'accesToken')
    const accessToken = accessTokenResponse.data.access_token;
    return axios.get(`https://${process.env.REACT_APP_AUTH0_DOMAIN}/userinfo/?access_token=${accessToken}`) 
  }
  
  //STEP 4.)
  
  // store user info response in session and database
  function storeUserInfoInDataBase(userInfo) {
    const userData = userInfo.data;
    console.log('hit' , 'userInfo', userData)
    return (
      req.app.get('db').find_user_by_auth0_id(userData.sub).then(users => {
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
          })
        }
      })
    )
  }

  //Final Code
  tradeCodeForAccessToken()
  .then(accessToken => tradeAccessTokenForUserInfo(accessToken))
  .then(userInfo => storeUserInfoInDataBase(userInfo));
  
})


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
