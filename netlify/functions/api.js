const serverless = require('serverless-http');
const app = require('../../backend/src/index.js');

module.exports.handler = serverless(app);