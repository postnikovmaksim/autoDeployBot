const restify = require('restify');
const { saveRequest, saveError } = require('./app/logService')

const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.use(async (req, res, next) => {
    if (req.url !== '/awakening') {
        await saveRequest({
            url: req.url,
            json: JSON.stringify(req.body)
        });
    }

    next();
});

server.on('after', async (req, res, route, error) => {
    if (!error) {
        res.send(200);
        return;
    }

    await saveError({
        url: req.url,
        error
    });
});

module.exports = { server };
