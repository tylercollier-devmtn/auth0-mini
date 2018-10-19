const proxy = require('http-proxy-middleware');

module.exports = app => {
  app.use(proxy('/auth/callback', { target: 'http://localhost:3040' }));
  app.use(proxy('/api', { target: 'http://localhost:3040' }));
};
