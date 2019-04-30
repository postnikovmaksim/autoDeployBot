const { ActivityHandler } = require('botbuilder');
const { replaceHelp } = require('./utils');
const { saveOrUpdateUser } = require('./dao/userServices');
const channelsServices = require('./eventsServices/channels/channelsServices');
const channelEventsService = require('./eventsServices/channels/channelEventsService');
const subscriptionsServices = require('./dao/subscriptionsServices');
const timeReportServices = require('./taskServices/timeReportServices');
const issueYTService = require('./taskServices/issueYTService');
const deployService = require('./eventsServices/deploy/deployService');
const newrelicServices = require('./eventsServices/newrelic/newrelicServices');
const zabbixService = require('./eventsServices/zabbix/zabbixService');
const kibanaServices = require('./eventsServices/kibana/kibanaServices');
const customEventService = require('./eventsServices/customEventService');

const listRegx = /list$/i;
const removeAllRegx = /remove_all$/i;

class Bot extends ActivityHandler {
    constructor () {
        super();
        this.onMessage(this.onMessageEvent);
    }

    async onMessageEvent (context) {
        console.log(`Получено сообщение от ${context.activity.from.name}:`, context.activity.text);

        await saveOrUpdateUser({ context });
        const message = context.activity.text.trim();
        const userId = context.activity.from.id;
        let isFound = false;

        isFound = isFound || await channelsServices.search({ context, userId, message });
        isFound = isFound || await channelEventsService.search({ context, userId, message });
        isFound = isFound || await newrelicServices.search({ context, userId, message });
        isFound = isFound || await zabbixService.search({ context, userId, message });
        isFound = isFound || await kibanaServices.search({ context, userId, message });
        isFound = isFound || await deployService.search({ context, userId, message });
        isFound = isFound || await timeReportServices.search({ context, userId, message });
        isFound = isFound || await customEventService.search({ context, userId, message });
        isFound = isFound || await issueYTService.search({ context, userId, message });

        isFound = isFound || await listSubscriptions({ context, userId, message });
        isFound = isFound || await removeAll({ context, userId, message });

        if (!isFound) {
            await context.sendActivity(`Команда не распознана\n\n${getHelpMessage()}`);
        }
    }
}

async function listSubscriptions ({ context, userId, message }) {
    if (message.search(listRegx) === 0) {
        await context.sendActivity(await getListMessage({ userId }));
        return true;
    }

    return false;
}

async function removeAll ({ context, userId, message }) {
    if (message.search(removeAllRegx) === 0) {
        await subscriptionsServices.removeAll({ userId });
        await context.sendActivity(`Удалена подписка на все события`);
        return true;
    }

    return false;
}

async function getListMessage ({ userId }) {
    let result = '';

    result += `${await channelsServices.getListMessage({ userId })}`;
    result += `\n\n${await newrelicServices.getListMessage({ userId })}`;
    result += `\n\n${await zabbixService.getListMessage({ userId })}`;
    result += `\n\n${await kibanaServices.getListMessage({ userId })}`;
    result += `\n\n${await deployService.getListMessage({ userId })}`;
    result += `\n\n${await timeReportServices.getListMessage({ userId })}`;
    result += `\n\n${await customEventService.getListMessage({ userId })}`;

    return result;
}

function getHelpMessage () {
    return `${channelsServices.getHelpMessage()}\n` +
        `${channelEventsService.getHelpMessage()}\n` +
        `${newrelicServices.getHelpMessage()}\n` +
        `${zabbixService.getHelpMessage()}\n` +
        `${kibanaServices.getHelpMessage()}\n` +
        `${deployService.getHelpMessage()}\n` +
        `${timeReportServices.getHelpMessage()}\n` +
        `${customEventService.getHelpMessage()}\n` +
        `${issueYTService.getHelpMessage()}\n` +
        `\n` +
        `${replaceHelp(listRegx)} - отобразить все подписки\n` +
        `${replaceHelp(removeAllRegx)} - удалить все подписки \n`;
}

module.exports.Bot = Bot;
