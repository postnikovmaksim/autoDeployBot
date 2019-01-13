const { ActivityTypes } = require('botbuilder');
const { saveOrUpdateUser, getAllSubscription } = require('./userService');

class EchoBot {
    async onTurn (context) {
        await saveOrUpdateUser({ activity: context.activity });

        if (context.activity.type === ActivityTypes.Message) {
            const message = context.activity.text;

            if (message.search(/\\deploy_box\d+\b/g) === 0) {
                const boxName = message.substr(message.search(/box\d+\b/), message.match(/box\d+\b/)[0].length);
                const options = {
                    deploy: {
                        [boxName]: true
                    }
                };
                await saveOrUpdateUser({ activity: context.activity, options });
                await context.sendActivity(`Включена подписка на событие deploy для ${boxName}`);
                return;
            }

            if (message.search(/\\list\b/g) === 0) {
                const subscription = await getAllSubscription({ activity: context.activity });
                let result = '';

                if (subscription && subscription.deploy) {
                    result += 'deploy:';
                    for (const key in subscription.deploy) {
                        result += `\n&nbsp;&nbsp;&nbsp;&nbsp;${key}`;
                    }
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
