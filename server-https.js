const https = require('https');
const fs = require('fs');
const path = require('path');

// Generate self-signed cert (sekali saja)
// openssl req -nodes -new -x509 -keyout server.key -out server.cert -days 365

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
};

// Import app dari server.js
const app = require('./server');

const HTTPS_PORT = 3001;
https.createServer(httpsOptions, app).listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
  console.log(`Access via: https://192.168.20.1:${HTTPS_PORT}`);
});