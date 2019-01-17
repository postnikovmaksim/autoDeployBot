const { ActivityTypes } = require('botbuilder');
const { saveOrUpdateUser, getUser } = require('./userService');
const { saveSubscriptions, getSubscriptions } = require('./subscriptionsServices');

class EchoBot {
    async onTurn (context) {
        await saveOrUpdateUser({ activity: context.activity });

        if (context.activity.type === ActivityTypes.Message) {
            const message = context.activity.text;

            if (message.search(/\\deploy_box\d+\b/g) === 0) {
                const boxName = message.substr(message.search(/box\d+\b/), message.match(/box\d+\b/)[0].length);

                await saveSubscriptions({ userId: context.activity.from.id, eventName: `deploy_${boxName}` });
                await context.sendActivity(`Включена подписка на событие deploy для ${boxName}`);
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
                    '\\deploy_box*** - подписаться на событие deploy для бокса\n' +
                    '\\list - отобразить текушие подписки на события'
                );
                return;
            }

            await context.sendActivity('Команда не распознана, используйте \\help, что бы посмотреть доступные команды');
        }
    }
}

exports.EchoBot = EchoBot;
