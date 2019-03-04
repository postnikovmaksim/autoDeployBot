const { ActivityTypes } = require('botbuilder');
const { saveOrUpdateUser, getUser } = require('./userServices');
const subscriptionsServices = require('./subscriptionsServices');
const newrelicAppName = require('./eventsName/newrelicAppName');
const zabbixAppName = require('./eventsName/zabbixAppName');

const deployBoxRegx = /deploy_\S+/;
const newrelicRegx = /newrelic_\S+/;
const zabbixRegx = /zabbix_\S+/;
const masterAutoCompleteRegx = /master_auto_complete/;
const testRegx = /test/;

class EchoBot {
    async onTurn (context) {
        if (context.activity.type !== ActivityTypes.Message) {
            return;
        }

        console.log(`Получено сообщение от ${context.activity.from.name}:`, context.activity.text);

        await saveOrUpdateUser({ context });
        const message = context.activity.text;

        // autoDeploy
        if (message.search(/\\add_deploy_\S+/) === 0) {
            await createSubscriptions({ context, message, regx: deployBoxRegx });
            return;
        }

        if (message.search(/\\remove_deploy_\S+/) === 0) {
            await deleteSubscriptions({ context, message, regx: deployBoxRegx });
            return;
        }

        if (message.search(/\\remove_all_deploy/) === 0) {
            await deleteAllTypeSubscriptions({ context, message, like: 'deploy_box' });
            return;
        }

        // newrelic
        if (message.search(/\\add_newrelic_/) === 0) {
            const appName = getEventName({ message, newrelicRegx }).replace('newrelic_', '');
            if (newrelicAppName.isValidName(appName)) {
                await createSubscriptions({ context, message, regx: newrelicRegx });
            } else {
                await responseIsNotValidName(context, appName);
            }
            return;
        }

        if (message.search(/\\remove_newrelic_/) === 0) {
            await deleteSubscriptions({ context, message, regx: newrelicRegx });
            return;
        }

        if (message.search(/\\remove_all_newrelic/) === 0) {
            await deleteAllTypeSubscriptions({ context, message, like: 'newrelic' });
            return;
        }

        // zabbix
        if (message.search(/\\add_zabbix_/) === 0) {
            const appName = getEventName({ message, newrelicRegx }).replace('zabbix_', '');
            if (zabbixAppName.isValidName(appName)) {
                await createSubscriptions({ context, message, regx: zabbixRegx });
            } else {
                await responseIsNotValidName(context, appName);
            }
            return;
        }

        if (message.search(/\\remove_zabbix_/) === 0) {
            await deleteSubscriptions({ context, message, regx: zabbixRegx });
            return;
        }

        if (message.search(/\\remove_all_zabbix/) === 0) {
            await deleteAllTypeSubscriptions({ context, message, like: 'zabbix' });
            return;
        }

        // outher
        if (message.search(/\\add_master_auto_complete/) === 0) {
            await createSubscriptions({ context, message, regx: masterAutoCompleteRegx });
            return;
        }

        if (message.search(/\\remove_master_auto_complete/) === 0) {
            await deleteSubscriptions({ context, message, regx: masterAutoCompleteRegx });
            return;
        }
        if (message.search(/\\add_test/) === 0) {
            await createSubscriptions({ context, message, regx: testRegx });
            return;
        }

        if (message.search(/\\remove_test/) === 0) {
            await deleteSubscriptions({ context, message, regx: testRegx });
            return;
        }

        if (message.search(/\\remove_all/) === 0) {
            await deleteAllSubscriptions({ context, message });
            return;
        }

        if (message.search(/\\list/) === 0) {
            await sendList({ context });
            return;
        }

        if (message.search(/\\help/) === 0) {
            await sendHelp({ context });
            return;
        }

        await context.sendActivity('Команда не распознана, используйте \\help, что бы посмотреть доступные команды');
    }
}

async function responseIsNotValidName (context, appName) {
    await context.sendActivity(`Имя [${appName}] не валидно. Подписка не создана`);
}

async function createSubscriptions ({ context, message, regx }) {
    const eventName = getEventName({ message, regx });
    await subscriptionsServices.saveSubscriptions({ userId: context.activity.from.id, eventName: eventName });
    await context.sendActivity(`Включена подписка на событие ${eventName}`);
}

async function deleteSubscriptions ({ context, message, regx }) {
    const eventName = getEventName({ message, regx });
    await subscriptionsServices.removeSubscriptions({ userId: context.activity.from.id, eventName: eventName });
    await context.sendActivity(`Удалена подписка на событие ${eventName}`);
}

async function deleteAllTypeSubscriptions ({ context, message, like }) {
    await subscriptionsServices.removeAllTypeSubscriptions({ userId: context.activity.from.id, like });
    await context.sendActivity(`Удалена подписка на события ${like}`);
}

async function deleteAllSubscriptions ({ context }) {
    await subscriptionsServices.removeAllSubscriptions({ userId: context.activity.from.id });
    await context.sendActivity(`Удалена подписка на все события`);
}

function getEventName ({ message, regx }) {
    return message.substr(message.search(regx), message.match(regx)[0].length)
}

async function sendList ({ context }) {
    const user = await getUser({ userId: context.activity.from.id });
    const subscriptions = await subscriptionsServices.getSubscriptions({ userId: user.id });
    const deploySubscriptions = subscriptions.filter(s => !!s.match(deployBoxRegx));
    const newrelicSubscriptions = subscriptions.filter(s => !!s.match(newrelicRegx));
    const zabbixSubscriptions = subscriptions.filter(s => !!s.match(zabbixRegx));
    const outherSubscriptions = subscriptions.filter(s => !s.match(deployBoxRegx) && !s.match(newrelicRegx) && !s.match(zabbixRegx));

    let result = '';

    if (deploySubscriptions.length) {
        result += 'deploy:';
        deploySubscriptions.forEach(eventName => result += `\n${eventName}`);
        result += '\n';
    }

    if (newrelicSubscriptions.length) {
        result += 'newrelic:';
        newrelicSubscriptions.forEach(eventName => result += `\n${eventName}`);
        result += '\n';
    }

    if (zabbixSubscriptions.length) {
        result += 'zabbix:';
        zabbixSubscriptions.forEach(eventName => result += `\n${eventName}`);
        result += '\n';
    }

    if (outherSubscriptions.length) {
        result += 'outher:';
        outherSubscriptions.forEach(eventName => result += `\n${eventName}`);
        result += '\n';
    }

    await context.sendActivity(result || 'У вас нет действующих подписок');
}

async function sendHelp ({ context }) {
    await context.sendActivity(
        '\\help - описание всех доступных команд\n' +
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
        'более подробно https://confluence.mdtest.org/pages/viewpage.action?pageId=26280901'
    );
}

exports.EchoBot = EchoBot;
