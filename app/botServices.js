const { ActivityTypes } = require('botbuilder');
const EventType = require('./enums/EventType');
const { saveOrUpdateUser, getUser } = require('./userServices');
const channelsServices = require('./channelsServices');
const subscriptionsServices = require('./subscriptionsServices');
const timeReportServices = require('./taskServices/timeReportServices');
const autoDeployServices = require('./eventsServices/autoDeployServices');
const newrelicServices = require('./eventsServices/newrelicServices');
const zabbixService = require('./eventsServices/zabbixService');
const masterAutoCompleteServices = require('./eventsServices/masterAutoCompleteServices');
const testMessageService = require('./eventsServices/testMessageService');

class EchoBot {
    async onTurn (context) {
        if (context.activity.type !== ActivityTypes.Message) {
            return;
        }

        console.log(`Получено сообщение от ${context.activity.from.name}:`, context.activity.text);

        await saveOrUpdateUser({ context });
        const message = context.activity.text;
        const userId = context.activity.from.id;
        let isFound = false;

        isFound = isFound || await timeReportServices.search({ context, userId, message });
        isFound = isFound || await autoDeployServices.search({ context, userId, message });
        isFound = isFound || await newrelicServices.search({ context, userId, message });
        isFound = isFound || await zabbixService.search({ context, userId, message });
        isFound = isFound || await masterAutoCompleteServices.search({ context, userId, message });
        isFound = isFound || await testMessageService.search({ context, userId, message });
        isFound = isFound || await channelsServices.search({ context, userId, message });

        isFound = isFound || await removeAll({ context, userId, message });
        isFound = isFound || await listSubscriptions({ context, userId, message });
        isFound = isFound || await help({ context, userId, message });

        if (!isFound) {
            await context.sendActivity(`Команда не распознана, используйте \\help, что бы посмотреть доступные команды`);
        }
    }
}

async function removeAll ({ context, userId, message }) {
    if (message.search(/\\remove_all/) === 0) {
        await subscriptionsServices.removeAllSubscriptions({ userId });
        await context.sendActivity(`Удалена подписка на все события`);
        return true;
    }

    return false;
}

async function listSubscriptions ({ context, userId, message }) {
    if (message.search(/\\list$/) === 0) {
        await sendList({ context, userId });
        return true;
    }

    return false;
}

async function help ({ context, userId, message }) {
    if (message.search(/\\help$/) === 0) {
        await context.sendActivity(getHelpMessage());
        return true;
    }

    return false;
}

async function sendList ({ context, userId }) {
    const user = await getUser({ userId });
    const subscriptions = await subscriptionsServices.getSubscriptions({ userId: user.id });
    const channels = await channelsServices.getChannels({ userId: user.id });

    const eventNames = subscriptions.map(s => s.eventName);
    const deploySubscriptions = eventNames.filter(s => s.indexOf(EventType.deploy) >= 0);
    const newrelicSubscriptions = eventNames.filter(s => s.indexOf(EventType.newrelic) >= 0);
    const zabbixSubscriptions = eventNames.filter(s => s.indexOf(EventType.zabbix) >= 0);
    const outherSubscriptions = eventNames.filter(s =>
        s.indexOf(EventType.deploy) === -1 &&
        s.indexOf(EventType.newrelic) === -1 &&
        s.indexOf(EventType.zabbix) === -1);

    let result = '';

    if (channels.length) {
        result += '**Каналы подписки**:\n';
        result += `${channels.map(c => `id: ${c.id} name: ${c.name}`).join(`\n`)}\n`;
    }

    if (deploySubscriptions.length) {
        result += '**deploy**:\n';
        result += `${deploySubscriptions.map(eventName => `${eventName}`).join(`\n`)}\n`;
    }

    if (newrelicSubscriptions.length) {
        result += '**newrelic**:\n';
        result += `${newrelicSubscriptions.map(eventName => `${eventName}`).join(`\n`)}\n`;
    }

    if (zabbixSubscriptions.length) {
        result += '**zabbix**:\n';
        result += `${zabbixSubscriptions.map(eventName => `${eventName}`).join(`\n`)}\n`;
    }

    if (outherSubscriptions.length) {
        result += '**outher**:\n';
        result += `${outherSubscriptions.map(eventName => `${eventName}`).join(`\n`)}\n`;
    }

    await context.sendActivity(result || `У вас нет действующих подписок`);
}

function getHelpMessage () {
    return '\\help - описание всех доступных команд\n' +
        '\\help_channels - описание команд для управления каналами оповещений' +
        '\n' +
        '\\add_deploy_box** - подписаться на событие deploy для бокса\n' +
        '\\remove_deploy_box** - удалить подписку на событие deploy для бокса\n' +
        '\\remove_all_deploy - удалить все подписки на deploy\n' +
        '\n' +
        '\\add_newrelic_nameApplication - подписаться на событие в newrelic\n' +
        '\\remove_newrelic_nameApplication - удалить подписку на событие в newrelic\n' +
        '\\remove_all_newrelic - удалить все подписки на newrelic\n' +
        '\n' +
        '\\add_zabbix_nameApplication - подписаться на событие в zabbix\n' +
        '\\remove_zabbix_nameApplication - удалить подписку на событие в zabbix\n' +
        '\\remove_all_zabbix - удалить все подписки на zabbix\n' +
        '\n' +
        '\\add_master_auto_complete - подписаться на отчет по работе консоли\n' +
        '\\remove_master_auto_complete - подписаться на отчет по работе консоли\n' +
        '\n' +
        '\\remove_all - удалить все подписки \n' +
        '\\list - отобразить текушие подписки на события\n' +
        '\n' +
        '\n' +
        'более подробно:\n' +
        'https://confluence.mdtest.org/pages/viewpage.action?pageId=26280901';
}

exports.EchoBot = EchoBot;
