const { ActivityTypes } = require('botbuilder');
const { saveOrUpdateUser, getUser } = require('./userServices');
const subscriptionsServices = require('./subscriptionsServices');

const deployBoxRegx = /deploy_box\d+\b/g;
const newrelicRegx = /newrelic_\w+\b/g;
const masterAutoCompleteRegx = /master_auto_complete\b/g;
const zabbixRegx = /zabbix\b/g;
const testRegx = /test\b/g;

class EchoBot {
    async onTurn (context) {
        if (context.activity.type !== ActivityTypes.Message) {
            return;
        }

        console.log(`Получено сообщение от ${context.activity.from.name}:`, context.activity.text);

        await saveOrUpdateUser({ context });
        const message = context.activity.text;

        // autoDeploy
        if (message.search(/\\add_deploy_box\d+\b/g) === 0) {
            await createSubscriptions({ context, message, regx: deployBoxRegx });
            return;
        }

        if (message.search(/\\remove_deploy_box\d+\b/g) === 0) {
            await deleteSubscriptions({ context, message, regx: deployBoxRegx });
            return;
        }

        if (message.search(/\\remove_all_deploy\b/g) === 0) {
            await deleteAllTypeSubscriptions({ context, message, like: 'deploy_box' });
            return;
        }

        // newrelic
        if (message.search(/\\add_newrelic_\w+\b/g) === 0) {
            await createSubscriptions({ context, message, regx: newrelicRegx });
            return;
        }

        if (message.search(/\\remove_newrelic_\w+\b/g) === 0) {
            await deleteSubscriptions({ context, message, regx: newrelicRegx });
            return;
        }

        if (message.search(/\\remove_all_newrelic\b/g) === 0) {
            await deleteAllTypeSubscriptions({ context, message, like: 'newrelic' });
            return;
        }

        // zabbix
        if (message.search(/\\add_zabbix_\w+\b/g) === 0) {
            await createSubscriptions({ context, message, regx: zabbixRegx });
            return;
        }

        if (message.search(/\\remove_zabbix_\w+\b/g) === 0) {
            await deleteSubscriptions({ context, message, regx: zabbixRegx });
            return;
        }

        if (message.search(/\\remove_all_zabbix\b/g) === 0) {
            await deleteAllTypeSubscriptions({ context, message, like: 'zabbix' });
            return;
        }

        // outher
        if (message.search(/\\add_master_auto_complete\b/g) === 0) {
            await createSubscriptions({ context, message, regx: masterAutoCompleteRegx });
            return;
        }

        if (message.search(/\\remove_master_auto_complete\b/g) === 0) {
            await deleteSubscriptions({ context, message, regx: masterAutoCompleteRegx });
            return;
        }
        if (message.search(/\\add_test\b/g) === 0) {
            await createSubscriptions({ context, message, regx: testRegx });
            return;
        }

        if (message.search(/\\remove_test\b/g) === 0) {
            await deleteSubscriptions({ context, message, regx: testRegx });
            return;
        }

        if (message.search(/\\remove_all\b/g) === 0) {
            await deleteAllSubscriptions({ context, message });
            return;
        }

        if (message.search(/\\list\b/g) === 0) {
            const user = await getUser({ userId: context.activity.from.id });
            const subscriptions = await subscriptionsServices.getSubscriptions({ userId: user.id });
            const deploySubscriptions = subscriptions.filter(s => !!s.match(deployBoxRegx));
            const newrelicSubscriptions = subscriptions.filter(s => !!s.match(newrelicRegx));
            const outherSubscriptions = subscriptions.filter(s => !s.match(deployBoxRegx) && !s.match(newrelicRegx));

            let result = '';

            if (deploySubscriptions.length) {
                result += 'deploy:';
                deploySubscriptions.forEach(eventName => result += `\n${eventName}`);
            }

            if (newrelicSubscriptions.length) {
                result += 'newrelic:';
                newrelicSubscriptions.forEach(eventName => result += `\n${eventName}`);
            }

            if (outherSubscriptions.length) {
                result += 'outher:';
                outherSubscriptions.forEach(eventName => result += `\n${eventName}`);
            }

            await context.sendActivity(result || 'У вас нет действующих подписок');
            return;
        }

        if (message.search(/\\help\b/g) === 0) {
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
            return;
        }

        await context.sendActivity('Команда не распознана, используйте \\help, что бы посмотреть доступные команды');
    }
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

exports.EchoBot = EchoBot;
