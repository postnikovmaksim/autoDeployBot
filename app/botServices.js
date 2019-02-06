const { ActivityTypes } = require('botbuilder');
const { saveOrUpdateUser, getUser } = require('./userServices');
const subscriptionsServices = require('./subscriptionsServices');

const deployBoxRegx = /deploy_box\d+\b/g;
const newRelicRegx = /newRelic_\w+\b/g;
const masterAutoCompleteRegx = /master_auto_complete\b/g;
const zabbixRegx = /zabbix\b/g;

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

        // newRelic
        if (message.search(/\\add_newRelic_\w+\b/g) === 0) {
            await createSubscriptions({ context, message, regx: newRelicRegx });
            return;
        }

        if (message.search(/\\remove_newRelic_\w+\b/g) === 0) {
            await deleteSubscriptions({ context, message, regx: newRelicRegx });
            return;
        }

        if (message.search(/\\remove_all_newRelic\b/g) === 0) {
            await deleteAllTypeSubscriptions({ context, message, like: 'newRelic' });
            return;
        }

        // zabbix
        if (message.search(/\\add_zabbix\b/g) === 0) {
            await createSubscriptions({ context, message, regx: zabbixRegx });
            return;
        }

        if (message.search(/\\remove_zabbix\b/g) === 0) {
            await deleteSubscriptions({ context, message, regx: zabbixRegx });
            return;
        }

        if (message.search(/\\add_master_auto_complete\b/g) === 0) {
            await createSubscriptions({ context, message, regx: masterAutoCompleteRegx });
            return;
        }

        if (message.search(/\\remove_master_auto_complete\b/g) === 0) {
            await deleteSubscriptions({ context, message, regx: masterAutoCompleteRegx });
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
            const newRelicSubscriptions = subscriptions.filter(s => !!s.match(newRelicRegx));
            const outherSubscriptions = subscriptions.filter(s => !s.match(deployBoxRegx) && !s.match(newRelicRegx));

            let result = '';

            if (deploySubscriptions.length) {
                result += 'deploy:';
                deploySubscriptions.filter.forEach(eventName => result += `\n${eventName}`);
            }

            if (newRelicSubscriptions.length) {
                result += 'newRelic:';
                newRelicSubscriptions.filter.forEach(eventName => result += `\n${eventName}`);
            }

            if (outherSubscriptions.length) {
                result += 'outher:';
                outherSubscriptions.filter.forEach(eventName => result += `\n${eventName}`);
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
                '\\add_newRelic_nameApplication - подписаться на событие в newRelic\n' +
                '\\remove_newRelic_nameApplication - удалить подписку на событие в newRelic\n' +
                '\\remove_all_newRelic - удалить все подписки на newRelic\n' +
                '\n' +
                '\\add_master_auto_complete - подписаться на отчет по работе консоли\n' +
                '\\remove_master_auto_complete - подписаться на отчет по работе консоли\n' +
                '\n' +
                '\\add_zabbix - подписаться на отчет по работе zabbix\n' +
                '\\remove_zabbix - подписаться на отчет по работе zabbix\n' +
                '\n' +
                '\\remove_all - удалить все подписки \n' +
                '\\list - отобразить текушие подписки на события'
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
