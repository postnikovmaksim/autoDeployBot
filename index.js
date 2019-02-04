const { adapter, bot, port } = require('./botFrameworkServices');
const { autoDeployEvent } = require('./app/autoDeployServices');
const { newRelicEvent } = require('./app/newRelicServices');
const { consoleEvent } = require('./app/masterAutoCompleteServices');
const { server } = require('./httpServerServices');

server.listen(port, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open echoBot-with-counter.bot file in the Emulator');
});

server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        await bot.onTurn(context);
    });
});

server.post('/event/deploy', async (req, res) => {
    await autoDeployEvent({ req, adapter });
    res.send(200);
});

server.post('/event/newrelic', async (req, res) => {
    await newRelicEvent({ req, adapter });
    res.send(200);
});

server.post('/event/MasterAutoComplete', async (req, res) => {
    await consoleEvent({ req, adapter });
    res.send(200);
});
