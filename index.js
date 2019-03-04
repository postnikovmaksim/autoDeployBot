const moment = require('moment');
const request = require('request-promise-native');
const { server } = require('./httpServerServices');
const { adapter, bot, port } = require('./botFrameworkServices');
const { autoDeployEvent } = require('./app/eventsServices/autoDeployServices');
const { newrelicEvent } = require('./app/eventsServices/newrelicServices');
const { consoleEvent } = require('./app/eventsServices/masterAutoCompleteServices');
const { zabbixEvent } = require('./app/eventsServices/zabbixService');
const { testMessageEvent } = require('./app/eventsServices/testMessageService');

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
    await autoDeployEvent({ req });
    res.send(200);
});

server.post('/event/newrelic', async (req, res) => {
    await newrelicEvent({ req });
    res.send(200);
});

server.post('/event/master_auto_complete', async (req, res) => {
    await consoleEvent({ req });
    res.send(200);
});

server.post('/event/zabbix', async (req, res) => {
    await zabbixEvent({ req });
    res.send(200);
});

server.get('/event/test', async (req, res) => {
    await testMessageEvent({ req });
    res.send(200);
});

server.get('/awakening', async (req, res) => {
    console.log('awakening', moment().format('DD-MM-YYYY HH:mm'));
    res.send(200);
});

// из-за ограничений тарифа, бот постоянно выгружается из памяти, что приводит к потере запросов.
// будем будить бота по таймеру
function awakening () {
    setInterval(() => request.get({ uri: 'https://autodeploy-94a4.azurewebsites.net/awakening' }), 60000)
}

(() => awakening())();
