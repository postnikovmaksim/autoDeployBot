const restify = require('restify');

const server = restify.createServer();
server.use(restify.plugins.bodyParser());

module.exports = { server };
