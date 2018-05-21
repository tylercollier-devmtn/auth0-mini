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
  //Make an object called payload with the code recieved from the clientside, client_id, client_secret, grant_type, redirect_uri 
  //hint: code is recieved from client side as a query
  
  let payload ={
    
    // client_id
    // client_secret
    // code
    // grant_type 
    // redirect_uri
    
  }
  
  
  //STEP 2.)
  // WRITE a FUNCTION that RETURNS an axios POST with the payload as the body
  function tradeCodeForAccessToken(){
    
    //code here..
    
  }
  
  //STEP 3.)
  // WRITE a FUNCTION that accepts the access token as a parameter and RETURNS an axios GET to auth0 that passes the access token as a query
  function tradeAccessTokenForUserInfo(){
    
    //code here ..
    
  }
  
  
  //STEP 4.)
  
  // WRITE a FUNCTION that accepts the userInfo as a parameter and RETURNS a block of code.
  // Your code should set session, check your database to see if user exists and return thier info or if they dont exist, insert them into the database
  function storeUserInfoInDataBase(){
    
    //code here...
    
  }
   
  //Final Code, Uncomment after completeing steps 1-4 above
  
  // tradeCodeForAccessToken()
  // .then(accessToken => tradeAccessTokenForUserInfo(accessToken))
  // .then(userInfo => storeUserInfoInDataBase(userInfo));
  // })
  
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
