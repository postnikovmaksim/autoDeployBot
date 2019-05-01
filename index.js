// Грузим параметры как можно быстрее
const dotenv = require('dotenv');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });
// ------------------------------------

const moment = require('./app/libs/moment');
const request = require('request-promise-native');
const { server } = require('./httpServerServices');
const { adapter, bot } = require('./botFrameworkServices');
const autoDeployServices = require('./app/eventsServices/deploy/autoDeployServices');
const stageDeployService = require('./app/eventsServices/deploy/stageDeployService');
const newrelicServices = require('./app/eventsServices/newrelic/newrelicServices');
const zabbixService = require('./app/eventsServices/zabbix/zabbixService');
const kibanaServices = require('./app/eventsServices/kibana/kibanaServices');
const customEventService = require('./app/eventsServices/customEventService');
const timeReportServices = require('./app/taskServices/timeReportServices');

server.post('/api/messages', (req, res, next) => {
    try {
        adapter.processActivity(req, res, async (context) => {
            await bot.run(context);
        });
    } catch (e) {
        next(e);
    }
});

server.post('/event/deploy', async (req, res, next) => {
    try {
        await autoDeployServices.event({ req });
        res.send(200);
    } catch (e) {
        next(e);
    }
});

server.post('/event/stageDeploy', async (req, res, next) => {
    try {
        await stageDeployService.event({ req });
        res.send(200);
    } catch (e) {
        next(e);
    }
});

server.post('/event/newrelic', async (req, res, next) => {
    try {
        await newrelicServices.event({ req });
        res.send(200);
    } catch (e) {
        next(e);
    }
});

server.post('/event/zabbix', async (req, res, next) => {
    try {
        await zabbixService.event({ req });
        res.send(200);
    } catch (e) {
        next(e);
    }
});

server.post('/event/kibana/error', async (req, res, next) => {
    try {
        await kibanaServices.eventError({ req });
        res.send(200);
    } catch (e) {
        next(e);
    }
});

server.post('/event/kibana/fatal', async (req, res, next) => {
    try {
        await kibanaServices.eventFatal({ req });
        res.send(200);
    } catch (e) {
        next(e);
    }
});

server.post('/event/custom', async (req, res, next) => {
    try {
        await customEventService.event({ req });
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
function awakening () {
    setInterval(() => request.get({ uri: `${process.env.selfUrl}/awakening` }), 60000)
}

function customEvent () {
    setInterval(() => request({
        method: 'POST',
        uri: `${process.env.selfUrl}/event/custom`,
        json: true,
        body: {
            eventName: `custom_test`,
            message: moment().format('DD-MM-YYYY HH:mm')
        }
    }), 60000)
}

// задачи выполняемые по расписанию
(() => awakening())();
(() => customEvent())();
(() => timeReportServices.task())();
