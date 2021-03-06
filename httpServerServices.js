const restify = require('restify');
const { saveRequest, saveError } = require('./app/dao/logService');

const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.use(async (req, res, next) => {
    if (req.url !== '/awakening' && req.url !== '/event/stageDeploy') {
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

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open the emulator select "Open Bot"`);
    console.log(`\nSee https://aka.ms/connect-to-bot for more information`);
});

module.exports = { server };
