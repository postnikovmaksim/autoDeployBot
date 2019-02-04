const { ActivityTypes } = require('botbuilder');
const { saveOrUpdateUser, getUser } = require('./userServices');
const { saveSubscriptions, getSubscriptions, removeSubscriptions,
    removeAllTypeSubscriptions, removeAllSubscriptions } = require('./subscriptionsServices');

const deployBoxRegx = /deploy_box\d+\b/g;
const newRelicRegx = /newRelic_\w+\b/g;
const MasterAutoCompleteRegx = /master_auto_complete\b/g;

class EchoBot {
    async onTurn (context) {
        console.log(`Получено сообщение от ${context.activity.from.name}:`, context.activity.text);
        await saveOrUpdateUser({ context });

        if (context.activity.type === ActivityTypes.Message) {
            const message = context.activity.text;

            if (message.search(/\\add_deploy_box\d+\b/g) === 0) {
                await createSubscriptions({ context, message, regx: deployBoxRegx });
                return;
            }

            if (message.search(/\\remove_deploy_box\d+\b/g) === 0) {
                await deleteSubscriptions({ context, message, regx: deployBoxRegx });
                return;
            }

            if (message.search(/\\remove_all_deploy\b/g) === 0) {
                await deleteAllTypeSubscriptions({ context, message, regx: deployBoxRegx });
                return;
            }

            if (message.search(/\\add_newRelic_\w+\b/g) === 0) {
                await createSubscriptions({ context, message, regx: newRelicRegx });
                return;
            }

            if (message.search(/\\add_master_auto_complete\b/g) === 0) {
                await createSubscriptions({ context, message, regx: MasterAutoCompleteRegx });
                return;
            }

            if (message.search(/\\remove_newRelic_\w+\b/g) === 0) {
                await deleteSubscriptions({ context, message, regx: newRelicRegx });
                return;
            }

            if (message.search(/\\remove_all_newRelic\b/g) === 0) {
                await deleteAllTypeSubscriptions({ context, message, regx: newRelicRegx });
                return;
            }

            if (message.search(/\\remove_all\b/g) === 0) {
                await deleteAllSubscriptions({ context, message });
                return;
            }

            if (message.search(/\\list\b/g) === 0) {
                const user = await getUser({ userId: context.activity.from.id });
                const subscriptions = await getSubscriptions({ userId: user.id });
                let result = '';

                if (subscriptions.length) {
                    result += 'deploy:';
                    subscriptions.forEach(eventName => result += `\n${eventName}`);
                }

                await context.sendActivity(result || 'У вас нет действующих подписок');
                return;
            }

            if (message.search(/\\help\b/g) === 0) {
                await context.sendActivity(
                    '\\help - описание всех доступных команд\n' +
                    '\\add_deploy_box** - подписаться на событие deploy для бокса\n' +
                    '\\add_master_auto_complete - подписаться на отчет по работе консоли' +
                    '\\remove_deploy_box** - удалить подписку на событие deploy для бокса\n' +
                    '\\remove_all_deploy - удалить все подписки на deploy\n' +
                    '\\add_newRelic_nameApplication - подписаться на событие в newRelic\n' +
                    '\\remove_newRelic_nameApplication - удалить подписку на событие в newRelic\n' +
                    '\\remove_all_newRelic - удалить все подписки на newRelic\n' +
                    '\\remove_all - удалить все подписки \n' +
                    '\\list - отобразить текушие подписки на события'
                );
                return;
            }

            await context.sendActivity('Команда не распознана, используйте \\help, что бы посмотреть доступные команды');
        }
    }
}

async function createSubscriptions ({ context, message, regx }) {
    const eventName = message.substr(message.search(regx), message.match(regx)[0].length);
    await saveSubscriptions({ userId: context.activity.from.id, eventName: eventName });
    await context.sendActivity(`Включена подписка на событие ${eventName}`);
}

async function deleteSubscriptions ({ context, message, regx }) {
    const eventName = message.substr(message.search(regx), message.match(regx)[0].length);
    await removeSubscriptions({ userId: context.activity.from.id, eventName: eventName });
    await context.sendActivity(`Удалена подписка на событие ${eventName}`);
}

async function deleteAllTypeSubscriptions ({ context, message, regx }) {
    await removeAllTypeSubscriptions({ userId: context.activity.from.id, regx });
    await context.sendActivity(`Удалена подписка на события ${regx}`);
}

async function deleteAllSubscriptions ({ context, message }) {
    await removeAllSubscriptions({ userId: context.activity.from.id });
    await context.sendActivity(`Удалена подписка на все события`);
}

exports.EchoBot = EchoBot;
