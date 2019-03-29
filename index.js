const moment = require('moment');
const request = require('request-promise-native');
const { server } = require('./httpServerServices');
const { adapter, bot, port } = require('./botFrameworkServices');
const { autoDeployEvent } = require('./app/eventsServices/autoDeployServices');
const { stageDeployEvent } = require('./app/eventsServices/stageDeployService');
const { newrelicEvent } = require('./app/eventsServices/newrelicServices');
const { consoleEvent } = require('./app/eventsServices/masterAutoCompleteServices');
const { zabbixEvent } = require('./app/eventsServices/zabbixService');
const { testMessageEvent } = require('./app/eventsServices/testMessageService');

server.listen(port, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open echoBot-with-counter.bot file in the Emulator');
});

server.post('/api/messages', (req, res, next) => {
    try {
        adapter.processActivity(req, res, async (context) => {
            await bot.onTurn(context);
        });
    } catch (e) {
        next(e);
    }
});

server.post('/event/deploy', async (req, res, next) => {
    try {
        await autoDeployEvent({ req });
        res.send(200);
    } catch (e) {
        next(e);
    }
});

server.post('/event/stageDeploy', async (req, res, next) => {
    try {
        await stageDeployEvent({ req });
        res.send(200);
    } catch (e) {
        next(e);
    }
});

server.post('/event/newrelic', async (req, res, next) => {
    try {
        await newrelicEvent({ req });
        res.send(200);
    } catch (e) {
        next(e);
    }
});

server.post('/event/master_auto_complete', async (req, res, next) => {
    try {
        await consoleEvent({ req });
        res.send(200);
    } catch (e) {
        next(e);
    }
});

server.post('/event/zabbix', async (req, res, next) => {
    try {
        await zabbixEvent({ req });
        res.send(200);
    } catch (e) {
        next(e);
    }
});

server.get('/event/test', async (req, res, next) => {
    try {
        await testMessageEvent({ req });
        res.send(200);
    } catch (e) {
        next(e);
    }
});

server.get('/awakening', async (req, res) => {
    console.log('awakening', moment().format('DD-MM-YYYY HH:mm'));
    res.send(200);
});

// из-за ограничений тарифа, бот постоянно выгружается из памяти, что приводит к потере запросов.
// будем будить бота по таймеру
function awakening() {
    setInterval(() => request.get({ uri: `${process.env.selfUrl}/awakening` }), 60000)
}

(() => awakening())();
